"""Gói C của trailer: dựng nhạc nền 95 giây, cắt và lọc tiếng trong app, tính sóng âm.

Chạy (từ bất kỳ đâu, không chạy trong thư mục tải về):
    uv run --no-project --with librosa --with numpy --with scipy python -I xu-ly-tieng.py music [aphelion|convergence|all]
    uv run --no-project --with numpy --with scipy python -I xu-ly-tieng.py voices
    uv run --no-project --with numpy --with scipy python -I xu-ly-tieng.py waves
    uv run --no-project --with librosa --with numpy --with scipy python -I xu-ly-tieng.py all

Nhạc: tệp mp3 tải về ở T/nhac/tai-ve/mp3 chỉ được đọc qua ffmpeg (dữ liệu không tin cậy). Lưới phách lấy bằng
librosa (beat_track), phách mạnh chọn theo độ đổi hợp âm và tiếng trầm ở từng phách; BPM đối chiếu thêm bằng
tự tương quan của luồng phổ (tự viết). Các đoạn cắt ghép đều nằm ở phách mạnh, nối chéo công suất đều dài một phách.

Tiếng: cắt ở khoảng lặng đã đo, lọc rẹt bằng video/loc-giong-buoc.py của kho (chạy trên thư mục tạm), rồi mới
thêm hiệu ứng điện thoại. Mọi tệp ra 48 kHz, đỉnh không quá -3 dBFS, có mờ đầu và cuối.
"""
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy import signal

T = Path(__file__).resolve().parents[1]
W = T.parents[1]
SR = 48000
RNG_SEED = 18
LOC_GIONG = W / "video" / "loc-giong-buoc.py"
MP3_DIR = T / "nhac" / "tai-ve" / "mp3"


# ---------------------------------------------------------------- shared helpers

def decode(path, sr=SR, channels=1):
    """Decode any audio file to float32 (n, channels) through ffmpeg (soxr resampler)."""
    cmd = ["ffmpeg", "-v", "error", "-i", str(path), "-af", "aresample=resampler=soxr:precision=28",
           "-ac", str(channels), "-ar", str(sr), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, channels).astype(np.float64)


def write_wav(path, x, sr=SR):
    """Write float audio (n,) or (n, ch) as 16-bit PCM with TPDF dither."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    rng = np.random.default_rng(RNG_SEED)
    dither = rng.random(x.shape) - rng.random(x.shape)
    q = np.clip(np.round(x * 32767.0 + dither), -32768, 32767).astype("<i2")
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".raw")
    tmp.write_bytes(q.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", str(x.shape[1]),
                    "-i", str(tmp), "-c:a", "pcm_s16le", str(path)], check=True)
    tmp.unlink()


def db(v):
    return 20 * math.log10(max(float(v), 1e-12))


def peak_db(x):
    return db(np.max(np.abs(x)))


def fade(x, fade_in, fade_out, sr=SR):
    """Raised-cosine fades (seconds) on both ends; works for (n,) and (n, ch)."""
    x = np.array(x, dtype=np.float64)
    for length, head in ((fade_in, True), (fade_out, False)):
        n = min(len(x), int(round(length * sr)))
        if n <= 0:
            continue
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
        if not head:
            ramp = ramp[::-1]
        shape = (n,) + (1,) * (x.ndim - 1)
        if head:
            x[:n] *= ramp.reshape(shape)
        else:
            x[-n:] *= ramp.reshape(shape)
    return x


def normalize_peak(x, target_db):
    return x * (10 ** (target_db / 20) / np.max(np.abs(x)))


def frame_rms(x, sr=SR, fps=30):
    """RMS per video frame (1/fps s), mono mix, normalised so the loudest frame is 1."""
    mono = x.mean(axis=1) if x.ndim == 2 else x
    hop = sr / fps
    n = int(math.ceil(len(mono) / hop))
    vals = np.zeros(n)
    for k in range(n):
        seg = mono[int(round(k * hop)): int(round((k + 1) * hop))]
        vals[k] = math.sqrt(float(np.mean(seg ** 2))) if len(seg) else 0.0
    top = vals.max()
    return [round(float(v / top), 3) for v in vals], db(top)


def measure_with_team_tool(paths):
    """Run `loc-giong-buoc.py --do` (đo đỉnh, cụm bật to) and return its printed dicts."""
    out = subprocess.run(["python3", str(LOC_GIONG), "--do", *map(str, paths)], capture_output=True, text=True, check=True)
    return out.stdout.strip().splitlines()


# ---------------------------------------------------------------- music

MUSIC_PLANS = {
    # Bài chính. Số là chỉ số ô nhịp (phách mạnh) trong bản gốc. ("start", 3) nghĩa là từ 0 s tới phách mạnh của ô 3.
    "aphelion": {
        "file": "Aphelion.mp3",
        "title": "Aphelion",
        "artist": "Scott Buckley",
        "page": "https://www.scottbuckley.com.au/library/aphelion/",
        "out": T / "nhac" / "nen.wav",
        "beats_json": T / "nhac" / "phach.json",
        "wave_json": T / "am" / "song" / "nen.json",
        "segments": [("start", 3), (20, 43), (129, 132), (135, "end")],
        # Hai chỗ nối đầu đổi chất tiếng hoặc hạ 7 dB nên nối chéo dài hai phách (một "nhịp thở"), chỗ cuối một phách.
        "crossfade_beats": [2, 2, 1],
        "markers": {"first_change": 20, "lift": 21, "drop": 36, "cadence": 42},
        "outro_segment": 2,
        "sections": [
            ("intro", "start", "first_change", "Hợp âm La thưa, trầm (đệm cho chuông và giọng kẻ gian)"),
            ("build", "first_change", "drop", "Vào giai điệu ở first_change, dâng lên ở lift, dồn dần tới điểm bung"),
            ("climax", "drop", "outro", "Điểm bung, dàn nhạc đầy; cadence là hợp âm chủ La sau hợp âm Rê thứ"),
            ("outro", "outro", "end", "Hợp âm chủ La lắng dần tới hết"),
        ],
    },
    # Phương án dự phòng: kết dứt khoát hơn, điểm bung nhẹ hơn.
    "convergence": {
        "file": "Convergence.mp3",
        "title": "Convergence",
        "artist": "Scott Buckley",
        "page": "https://www.scottbuckley.com.au/library/convergence/",
        "out": T / "nhac" / "nen-phuong-an-b.wav",
        "beats_json": T / "nhac" / "phach-phuong-an-b.json",
        "wave_json": T / "am" / "song" / "nen-phuong-an-b.json",
        "segments": [("start", 3), (18, 45), (74, "end")],
        "crossfade_beats": [2, 1],
        "markers": {"lift": 18, "drop": 37},
        "outro_segment": 2,
        "sections": [
            ("intro", "start", "lift", "Dây và synth thưa, không có bè trầm"),
            ("build", "lift", "drop", "Vào giai điệu ở lift, có một nhịp lắng rồi dâng lại"),
            ("climax", "drop", "outro", "Phần cuối có trống đá 4/4 nhẹ"),
            ("outro", "outro", "end", "Kết dứt trên hợp âm chủ La thứ"),
        ],
    },
}


def analyse_track(path):
    """Beats, downbeats and beat-synchronous features of a track (mono 22050 Hz)."""
    import librosa

    sr = 22050
    hop = 512
    y = decode(path, sr, 1)[:, 0].astype(np.float32)
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    _, beat_frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop, start_bpm=85, tightness=200)
    beats = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=14)[1:]
    chroma_beats = librosa.util.sync(chroma, beat_frames, aggregate=np.mean)
    mfcc_beats = librosa.util.sync(mfcc, beat_frames, aggregate=np.mean)
    # Phách mạnh: pha (0..3) có độ đổi hợp âm và tiếng trầm bật lên lớn nhất.
    chroma_med = librosa.util.sync(chroma, beat_frames, aggregate=np.median)
    novelty = np.r_[0, np.linalg.norm(np.diff(chroma_med, axis=1), axis=0)]
    low_onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, fmax=200, n_mels=32)[beat_frames]
    scores = []
    for phase in range(4):
        idx = np.arange(phase, len(beat_frames), 4)
        idx_n = idx[idx < len(novelty)]
        scores.append(novelty[idx_n].mean() / novelty.mean() + low_onset[idx].mean() / low_onset.mean())
    phase = int(np.argmax(scores))
    return {
        "y": y, "sr": sr, "hop": hop, "beats": beats, "phase": phase, "down": beats[phase::4],
        "chroma_beats": chroma_beats, "mfcc_beats": mfcc_beats, "onset": onset,
    }


def splice_similarity(ana, cut_bar, to_bar):
    """Similarity (0..1) of jumping from downbeat `cut_bar` to downbeat `to_bar` (same features as the search)."""
    C, M, ph = ana["chroma_beats"], ana["mfcc_beats"], ana["phase"]
    Mz = (M - M.mean(1, keepdims=True)) / (M.std(1, keepdims=True) + 1e-9)

    def cos(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def sim(a, b, beats=(0, 1, 2, 3)):
        ca = [ph + 4 * a + 1 + k for k in beats]
        cb = [ph + 4 * b + 1 + k for k in beats]
        if max(ca + cb) >= C.shape[1]:
            return float("nan")
        return float(np.mean([0.6 * cos(C[:, i], C[:, j]) + 0.4 * cos(Mz[:, i], Mz[:, j]) for i, j in zip(ca, cb)]))

    context = sim(cut_bar - 1, to_bar - 1)
    last_beat = sim(cut_bar - 1, to_bar - 1, beats=(3,))
    following = sim(cut_bar, to_bar, beats=(0, 1))
    return round(0.4 * context + 0.2 * last_beat + 0.4 * following, 3)


def own_autocorr_bpm(x, sr, lo=60, hi=140):
    """Tempo from autocorrelation of a spectral-flux onset envelope (numpy/scipy only), parabolic refinement."""
    mono = x.mean(axis=1) if x.ndim == 2 else x
    mono = signal.resample_poly(mono, 1, 2) if sr == 48000 else mono
    fs = sr / 2 if sr == 48000 else sr
    hop, n_fft = 512, 2048
    _, _, Z = signal.stft(mono, fs=fs, nperseg=n_fft, noverlap=n_fft - hop, boundary=None, padded=False)
    mag = np.log1p(100 * np.abs(Z))
    flux = np.r_[0, np.maximum(0, np.diff(mag, axis=1)).sum(axis=0)]
    flux = np.maximum(flux - signal.medfilt(flux, 31), 0)
    flux -= flux.mean()
    ac = np.correlate(flux, flux, mode="full")[len(flux) - 1:]
    rate = fs / hop
    lags = np.arange(len(ac))
    ok = (lags >= 60 * rate / hi) & (lags <= 60 * rate / lo)
    k = int(lags[ok][np.argmax(ac[ok])])
    a, b, c = ac[k - 1], ac[k], ac[k + 1]
    shift = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0.0
    return round(60 * rate / (k + shift), 2)


def source_end(x, sr):
    """Last moment the track is within 60 dB of its loudest 50 ms window, plus 0.3 s of tail."""
    mono = np.abs(x).mean(axis=1)
    w = int(0.05 * sr)
    n = len(mono) // w
    rms = np.sqrt((mono[: n * w].reshape(n, w) ** 2).mean(axis=1))
    loud = np.nonzero(20 * np.log10(rms + 1e-12) > 20 * np.log10(rms.max()) - 60)[0]
    return min(len(x) / sr, (loud[-1] + 1) * w / sr + 0.3)


def audible_end(x, sr, after):
    """Source time after which every 50 ms window stays 40 dB under the loudest one (nghe như đã hết)."""
    mono = np.abs(x).mean(axis=1)
    w = int(0.05 * sr)
    n = len(mono) // w
    rms = np.sqrt((mono[: n * w].reshape(n, w) ** 2).mean(axis=1))
    loud = np.nonzero(20 * np.log10(rms + 1e-12) > 20 * np.log10(rms.max()) - 40)[0]
    loud = loud[loud * w / sr >= after]
    return (loud[-1] + 1) * w / sr if len(loud) else after


def build_music(name):
    import librosa

    plan = MUSIC_PLANS[name]
    src = MP3_DIR / plan["file"]
    ana = analyse_track(src)
    down, beats = ana["down"], ana["beats"]
    period = float(np.median(np.diff(beats)))
    x = decode(src, SR, 2)
    end_src = source_end(x, SR)

    segs = []
    for a, b in plan["segments"]:
        s = 0.0 if a == "start" else float(down[a])
        e = end_src if b == "end" else float(down[b])
        segs.append((s, e, a, b))
    xfades = [k * period for k in plan["crossfade_beats"]]
    out_starts = [0.0]
    for s, e, _, _ in segs[:-1]:
        out_starts.append(out_starts[-1] + (e - s))
    total = out_starts[-1] + (segs[-1][1] - segs[-1][0])

    y = np.zeros((int(math.ceil(total * SR)) + SR, 2))
    for k, (s, e, _, _) in enumerate(segs):
        pre = xfades[k - 1] / 2 if k > 0 else 0.0
        post = xfades[k] / 2 if k < len(segs) - 1 else 0.0
        i0, i1 = int(round((s - pre) * SR)), int(round((e + post) * SR))
        chunk = x[i0:i1].copy()
        env = np.ones(len(chunk))
        if k > 0:
            n = int(round(xfades[k - 1] * SR))
            env[:n] *= np.sin(0.5 * np.pi * np.linspace(0, 1, n))
        if k < len(segs) - 1:
            n = int(round(xfades[k] * SR))
            env[-n:] *= np.cos(0.5 * np.pi * np.linspace(0, 1, n))
        o = int(round((out_starts[k] - pre) * SR))
        y[o:o + len(chunk)] += chunk * env[:, None]
    y = y[: int(round(total * SR))]
    y = fade(y, 0.01, 0.3)
    y = normalize_peak(y, -1.5)
    write_wav(plan["out"], y)

    def to_out(t_src):
        for k, (s, e, _, _) in enumerate(segs):
            if s - 1e-6 <= t_src < e - 1e-6:
                return out_starts[k] + (t_src - s)
        return None

    out_beats = [round(t, 3) for t in (to_out(float(b)) for b in beats) if t is not None]
    out_down = [round(t, 3) for t in (to_out(float(d)) for d in down) if t is not None]
    markers = {"start": 0.0}
    for key, bar in plan["markers"].items():
        markers[key] = round(to_out(float(down[bar])), 3)
    markers["outro"] = round(out_starts[plan["outro_segment"]], 3)
    markers["audible_end"] = round(out_starts[-1] + audible_end(x, SR, segs[-1][0]) - segs[-1][0], 3)
    markers["end"] = round(total, 3)

    # Kiểm lại trên chính tệp đã dựng: dò phách độc lập và so với lưới suy ra từ bản gốc.
    mono22 = decode(plan["out"], 22050, 1)[:, 0].astype(np.float32)
    on = librosa.onset.onset_strength(y=mono22, sr=22050, hop_length=512)
    _, bf = librosa.beat.beat_track(onset_envelope=on, sr=22050, hop_length=512, start_bpm=85, tightness=200)
    detected = librosa.frames_to_time(bf, sr=22050, hop_length=512)
    in_range = [b for b in out_beats if b < markers["end"] - 2]
    dev = np.array([np.min(np.abs(detected - b)) for b in in_range])
    bar_db = []
    for a, b in zip(out_down[:-1], out_down[1:]):
        seg = y[int(a * SR): int(b * SR)]
        bar_db.append(round(db(np.sqrt(np.mean(seg ** 2))), 1))

    splices = []
    for k in range(1, len(segs)):
        cut_bar, to_bar = segs[k - 1][3], segs[k][2]
        splices.append({
            "time": round(out_starts[k], 3),
            "source_from": round(segs[k - 1][1], 3),
            "source_to": round(segs[k][0], 3),
            "source_bars": [cut_bar, to_bar],
            "crossfade_s": round(xfades[k - 1], 3),
            "similarity": splice_similarity(ana, cut_bar, to_bar),
        })
    sections = []
    for sec, a, b, note in plan["sections"]:
        sections.append({"name": sec, "start": markers[a], "end": markers[b], "note": note})

    info = {
        "file": plan["out"].name,
        "sample_rate": SR,
        "channels": 2,
        "duration": round(total, 3),
        "source": {"title": plan["title"], "artist": plan["artist"], "license": "CC BY 4.0", "page": plan["page"],
                   "file": plan["file"]},
        "bpm": round(60 / period, 2),
        "bpm_autocorr_check": own_autocorr_bpm(y, SR),
        "beat_period": round(period, 4),
        "bar_period": round(4 * period, 4),
        "beats": out_beats,
        "downbeats": out_down,
        "markers": markers,
        "sections": sections,
        "segments": [{"out_start": round(o, 3), "out_end": round(o + e - s, 3), "source_start": round(s, 3),
                      "source_end": round(e, 3)} for o, (s, e, _, _) in zip(out_starts, segs)],
        "splices": splices,
        "bar_loudness_db": bar_db,
        "peak_dbfs": round(peak_db(y), 2),
        "check": {
            "detected_beats_on_output": int(len(detected)),
            "median_beat_deviation_ms": round(float(np.median(dev)) * 1000, 1),
            "share_within_50ms": round(float(np.mean(dev < 0.05)), 3),
        },
        "notes": "Thời gian tính bằng giây trên tệp ra. downbeats là phách đầu ô nhịp (4/4). audible_end: sau mốc này "
                 "nhạc thấp hơn đỉnh từ 40 dB trở xuống. Có thể cho nhạc bắt đầu trễ vài giây so với hình (phần mở chỉ là "
                 "hợp âm nền) để điểm bung rơi đúng đầu cảnh cộng đồng; khi đó cộng cùng độ trễ vào mọi mốc.",
    }
    plan["beats_json"].write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")
    wave, top_db = frame_rms(y)
    plan["wave_json"].parent.mkdir(parents=True, exist_ok=True)
    plan["wave_json"].write_text(json.dumps(wave), encoding="utf-8")
    print(f"{name}: {plan['out'].name} {total:.2f}s bpm {info['bpm']} (autocorr {info['bpm_autocorr_check']}) "
          f"markers {markers} splices {[(s['time'], s['similarity']) for s in splices]} check {info['check']}")
    return info


# ---------------------------------------------------------------- voices

PROTO = W / "prototype"
B01 = PROTO / "hoc" / "giong" / "b01"
APP_DIR = T / "am" / "app"

# Mốc cắt đo bằng năng lượng khung 10–20 ms (xem DANH-SACH.md). None = lấy cả tệp.
VOICE_CUTS = {
    "be-nai-hoi": (PROTO / "audio" / "benai-10.m4a", 4.44, 6.56),   # khoảng lặng 4,05–4,56 s; lời 4,56–6,41 s
    "benai-11": (PROTO / "audio" / "benai-11.m4a", None, None),
    "benai-13": (PROTO / "audio" / "benai-13.m4a", None, None),
    "ke-gian-goc": (B01 / "gn-06.m4a", 0.22, 2.50),                 # dừng ở dấu phẩy (lặng 2,40–2,60 s)
    "ghi-gn-04": (B01 / "gn-04.m4a", None, None),
    "ghi-gn-05": (B01 / "gn-05.m4a", None, None),
    "ghi-bh-02": (B01 / "bh-02.m4a", 0.72, 3.12),                   # bỏ tiếng ngắn 0,20–0,28 s và đoạn -40 dB 4,24–5,12 s
    "ghi-gn-06": (B01 / "gn-06.m4a", None, None),
    "ghi-gn-07": (B01 / "gn-07.m4a", None, None),
}


def trim_silence(x, thr_db=-45, pad=0.08, sr=SR):
    w = sr // 100
    n = len(x) // w
    fr = 20 * np.log10(np.sqrt((x[: n * w].reshape(n, w) ** 2).mean(axis=1)) + 1e-12)
    on = np.nonzero(fr > thr_db)[0]
    a = max(0, on[0] * w - int(pad * sr))
    b = min(len(x), (on[-1] + 1) * w + int(pad * sr))
    return x[a:b]


def phone_band(x, lo=300, hi=3400, sr=SR):
    sos = np.vstack([signal.butter(4, lo, "highpass", fs=sr, output="sos"),
                     signal.butter(6, hi, "lowpass", fs=sr, output="sos")])
    return signal.sosfiltfilt(sos, x)


def phone_line(x, drive=1.8, mu_law=True, sr=SR):
    """Narrowband phone sound: 300–3400 Hz, 8 kHz G.711 mu-law round trip, light tanh saturation."""
    y = phone_band(x, sr=sr)
    if mu_law:
        y = normalize_peak(y, -1.0)
        y8 = signal.resample_poly(y, 1, 6)
        mu = 255.0
        enc = np.sign(y8) * np.log1p(mu * np.clip(np.abs(y8), 0, 1)) / np.log1p(mu)
        q = np.round(enc * 127) / 127
        y8 = np.sign(q) * (np.power(1 + mu, np.abs(q)) - 1) / mu
        y = signal.resample_poly(y8, 6, 1)[: len(x)]
    if drive:
        y = normalize_peak(y, -1.0)
        y = np.tanh(drive * y) / np.tanh(drive)
    return phone_band(y, sr=sr)


def line_noise(n, level_db, seed, sr=SR):
    rng = np.random.default_rng(seed)
    noise = phone_band(rng.standard_normal(n), sr=sr)
    return noise / np.sqrt(np.mean(noise ** 2)) * 10 ** (level_db / 20)


def spectrum_share(x, lo, hi, sr=SR):
    X = np.abs(np.fft.rfft(x)) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    return round(10 * math.log10(X[(f >= lo) & (f <= hi)].sum() / X.sum()), 2)


def build_voices():
    APP_DIR.mkdir(parents=True, exist_ok=True)
    log = {}
    with tempfile.TemporaryDirectory(prefix="lcs-tieng-") as tmp:
        tmp = Path(tmp)
        for key, (src, a, b) in VOICE_CUTS.items():
            x = decode(src)[:, 0]
            if a is not None:
                x = x[int(a * SR): int(b * SR)]
            write_wav(tmp / f"{key}.wav", fade(x, 0.005, 0.005))
        # Lọc rẹt bằng công cụ của kho: cắt cụm nổ đầu/đuôi, highpass 70 Hz, adeclick, đỉnh -3,6 dBFS, mờ 20/30 ms.
        run = subprocess.run(["python3", str(LOC_GIONG), str(tmp)], capture_output=True, text=True, check=True)
        log["loc_giong_buoc"] = run.stdout.strip().splitlines()
        clean = {key: decode(tmp / f"{key}.wav")[:, 0] for key in VOICE_CUTS}

    outputs = {}
    # 1. Bé Nai: giữ nguyên sau khi lọc, đổi về 48 kHz, mờ 20 ms.
    for key in ("be-nai-hoi", "benai-11", "benai-13"):
        y = fade(clean[key], 0.02, 0.02)
        if peak_db(y) > -3.0:
            y = normalize_peak(y, -3.2)
        write_wav(APP_DIR / f"{key}.wav", y)
        outputs[key] = y

    # 2. Kẻ gian (C0): dải điện thoại, mu-law 8 kHz, méo tanh nhẹ, nền đường dây rất nhỏ, đuôi 0,2 s.
    v = phone_line(clean["ke-gian-goc"], drive=1.8)
    v = normalize_peak(v, -3.5)
    tail = int(0.2 * SR)
    v = np.r_[v, np.zeros(tail)]
    v = v + line_noise(len(v), -54, seed=6)
    v = fade(v, 0.015, 0.06)
    v = normalize_peak(v, -3.5)
    write_wav(APP_DIR / "ke-gian.wav", v)
    outputs["ke-gian"] = v

    # 3. Bản ghi âm mẫu cho A4: gn-04, gn-05, bh-02, gn-06, gn-07 nối như một cuộc gọi, dải điện thoại.
    order = [("ghi-gn-04", 0.0, True), ("ghi-gn-05", 1.1, True), ("ghi-bh-02", 0.8, False),
             ("ghi-gn-06", 1.3, True), ("ghi-gn-07", 1.4, True)]
    lead, end_pad = 0.7, 1.2
    parts, cursor, timeline = [], lead, []
    for key, gap, caller in order:
        cursor += gap
        seg = trim_silence(clean[key])
        seg = phone_line(seg, drive=1.4 if caller else 0.0, mu_law=caller)
        seg = normalize_peak(seg, -4.0 if caller else -5.0)
        parts.append((int(round(cursor * SR)), seg))
        timeline.append({"line": key.replace("ghi-", ""), "start": round(cursor, 2), "end": round(cursor + len(seg) / SR, 2)})
        cursor += len(seg) / SR
    total = int(round((cursor + end_pad) * SR))
    rec = np.zeros(total)
    for o, seg in parts:
        rec[o:o + len(seg)] += seg
    rec = rec + line_noise(total, -56, seed=11)
    rec = fade(rec, 0.02, 0.2)
    rec = normalize_peak(rec, -3.5)
    wav_tmp = APP_DIR / "ghi-am-mau.tmp.wav"
    write_wav(wav_tmp, rec)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav_tmp), "-c:a", "aac", "-b:a", "128k", "-ac", "1",
                    "-ar", str(SR), "-movflags", "+faststart", str(APP_DIR / "ghi-am-mau.m4a")], check=True)
    wav_tmp.unlink()
    outputs["ghi-am-mau"] = rec

    # Đo lại tệp ra.
    files = [APP_DIR / f"{k}.wav" for k in ("be-nai-hoi", "benai-11", "benai-13", "ke-gian")] + [APP_DIR / "ghi-am-mau.m4a"]
    log["do"] = measure_with_team_tool(files)
    stats = {}
    for f in files:
        y = decode(f)[:, 0]
        mono = y
        stats[f.name] = {
            "duration_s": round(len(y) / SR, 3),
            "peak_dbfs": round(peak_db(y), 2),
            "rms_dbfs": round(db(np.sqrt(np.mean(mono ** 2))), 1),
            "share_300_3400_db": spectrum_share(mono, 300, 3400),
            "share_above_4k_db": spectrum_share(mono, 4000, SR / 2),
        }
    log["stats"] = stats
    log["ghi_am_mau_timeline"] = timeline
    (T / "am" / "app" / "do-dac.json").write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")
    for line in log["loc_giong_buoc"] + log["do"]:
        print(line)
    for k, v in stats.items():
        print(k, v)
    print("ghi-am-mau timeline", timeline)
    return outputs


def build_waves():
    out = T / "am" / "song"
    out.mkdir(parents=True, exist_ok=True)
    for name in ("be-nai-hoi", "ke-gian"):
        y = decode(APP_DIR / f"{name}.wav")[:, 0]
        wave, top = frame_rms(y)
        (out / f"{name}.json").write_text(json.dumps(wave), encoding="utf-8")
        print(name, len(wave), "frames, loudest frame", round(top, 1), "dBFS")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in ("music", "all"):
        pick = sys.argv[2] if what == "music" and len(sys.argv) > 2 else "all"
        for name in (MUSIC_PLANS if pick == "all" else [pick]):
            build_music(name)
    if what in ("voices", "all"):
        build_voices()
    if what in ("waves", "all"):
        build_waves()
