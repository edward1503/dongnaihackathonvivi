"""Hiệu ứng âm thanh tự tổng hợp cho trailer (chỉ numpy, không dùng tệp ngoài nên không vướng giấy phép).

    uv run --no-project --with numpy python -I am-thanh.py

Ra T/am/*.wav (48 kHz, stereo, 16 bit) và T/am/hieu-ung.json (mốc bên trong từng tệp: lúc chuông kêu, lúc rung,
lúc trống đánh...). Mọi tệp: đỉnh -3,5 dBFS, mờ vào 5 ms và mờ ra 20 ms ở hai biên, không cắt ngọn.
"""
import json
import subprocess
from pathlib import Path

import numpy as np

T = Path(__file__).resolve().parents[1]
OUT = T / "am"
SR = 48000
PEAK_DB = -3.5
rng = np.random.default_rng(18)


def t_axis(seconds):
    return np.arange(int(round(seconds * SR))) / SR


def boundary_fades(x, fade_in=0.005, fade_out=0.02):
    x = x.copy()
    for n, head in ((int(fade_in * SR), True), (int(fade_out * SR), False)):
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
        if head:
            x[:n] *= ramp[:, None] if x.ndim == 2 else ramp
        else:
            x[-n:] *= ramp[::-1][:, None] if x.ndim == 2 else ramp[::-1]
    return x


def save(name, x, meta):
    """Normalise to PEAK_DB, add boundary fades, write 16-bit stereo wav, return measurements."""
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = boundary_fades(x)
    x = x * (10 ** (PEAK_DB / 20) / np.max(np.abs(x)))
    dither = (rng.random(x.shape) - rng.random(x.shape)) / 32767.0
    q = np.clip(np.round((x + dither) * 32767.0), -32768, 32767).astype("<i2")
    path = OUT / f"{name}.wav"
    raw = path.with_suffix(".raw")
    raw.write_bytes(q.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", str(raw),
                    "-c:a", "pcm_s16le", str(path)], check=True)
    raw.unlink()
    peak = 20 * np.log10(np.max(np.abs(q)) / 32768.0)
    rms = 20 * np.log10(np.sqrt(np.mean((q / 32768.0) ** 2)))
    meta.update({"file": path.name, "duration_s": round(len(q) / SR, 3), "peak_dbfs": round(float(peak), 2),
                 "rms_dbfs": round(float(rms), 1), "clipped_samples": int(np.sum(np.abs(q) >= 32767))})
    return meta


def exp_gate(n_total, spans, ramp=0.02):
    """Gain curve like Web Audio exponentialRamp: 0.0001 -> 1 in `ramp` s at each span start, 1 -> 0.0001 at its end."""
    g = np.zeros(n_total)
    for a, b in spans:
        i0, i1 = int(a * SR), int(b * SR)
        r = int(ramp * SR)
        seg = np.ones(i1 - i0)
        up = np.geomspace(1e-4, 1, r)
        seg[:r] = up
        seg[-r:] = up[::-1]
        g[i0:i1] = np.maximum(g[i0:i1], seg)
    return g


# ---------------------------------------------------------------- sounds

def ring(cycles=1, period=3.0):
    """Chuông như ringOnce trong app/src/lib/sound.js: 440 + 480 Hz, kêu 0,5 s, nghỉ 0,2 s, kêu 0,5 s; lặp mỗi 3 s."""
    spans = []
    for c in range(cycles):
        base = c * period
        spans += [(base + 0.0, base + 0.5), (base + 0.7, base + 1.2)]
    t = t_axis(spans[-1][1] + 0.1)
    tone = np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)
    return tone * exp_gate(len(t), spans), {"bursts": [[round(a, 3), round(b, 3)] for a, b in spans]}


def vibrate(pattern):
    """Rung máy: xung vuông 150 Hz đã làm mềm (hài lẻ tới 2,4 kHz), rung nhẹ tần số, tiếng lạch cạch mặt bàn rất nhỏ."""
    total = sum(pattern) / 1000 + 0.05
    t = t_axis(total)
    f = 150 + 3 * np.sin(2 * np.pi * 7 * t)
    phase = 2 * np.pi * np.cumsum(f) / SR
    buzz = sum(np.sin(k * phase) / k for k in range(1, 17, 2))
    rattle_noise = rng.standard_normal(len(t))
    spec = np.fft.rfft(rattle_noise)
    freqs = np.fft.rfftfreq(len(t), 1 / SR)
    spec[(freqs < 2000) | (freqs > 5000)] = 0
    rattle = np.fft.irfft(spec, len(t))
    rattle = rattle / np.max(np.abs(rattle)) * (np.abs(np.sin(phase / 2)) ** 8) * 0.12
    spans, pos = [], 0.0
    for k, ms in enumerate(pattern):
        if k % 2 == 0:
            spans.append((pos, pos + ms / 1000))
        pos += ms / 1000
    gate = np.zeros(len(t))
    for a, b in spans:
        i0, i1 = int(a * SR), int(b * SR)
        n = i1 - i0
        r = int(0.015 * SR)
        env = np.ones(n)
        env[:r] = np.linspace(0, 1, r)
        env[-r:] = np.linspace(1, 0, r)
        gate[i0:i1] = env
    x = (buzz / np.max(np.abs(buzz)) + rattle) * gate
    # Làm mềm: lọc thông thấp 2,5 kHz trong miền tần số.
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (fr / 2500) ** 8)
    return np.fft.irfft(X, len(x)), {"pulses": [[round(a, 3), round(b, 3)] for a, b in spans]}


def boom():
    """Tiếng dội trầm: sin trượt 80 -> 40 Hz, tắt dần; thêm bậc 2, 3 để loa nhỏ (máy chiếu) vẫn nghe được."""
    t = t_axis(2.4)
    f = 40 + 40 * np.exp(-t / 0.35)
    phase = 2 * np.pi * np.cumsum(f) / SR
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.75)
    body = np.sin(phase) + 0.32 * np.sin(2 * phase) + 0.12 * np.sin(3 * phase)
    # Bão hòa tanh nhẹ sinh thêm hài 120–400 Hz: loa nhỏ của máy chiếu gần như không phát được 40–80 Hz.
    body = np.tanh(2.2 * body * env) / np.tanh(2.2)
    thump = rng.standard_normal(len(t)) * np.exp(-t / 0.06)
    T_ = np.fft.rfft(thump)
    fr = np.fft.rfftfreq(len(t), 1 / SR)
    T_ *= 1 / np.sqrt(1 + (fr / 450) ** 4)
    thump = np.fft.irfft(T_, len(t))
    thump = thump / np.max(np.abs(thump)) * 0.3
    return body + thump, {"hit": 0.0, "pitch_hz": [80, 40], "decay_s": 0.75}


def whoosh(duration=0.9, peak_at=0.55):
    """Tiếng lướt: nhiễu trắng qua dải lọc quét 400 Hz -> 4 kHz -> 1,5 kHz, to dần rồi nhỏ, lia từ trái sang phải."""
    n = int(duration * SR)
    noise = rng.standard_normal(n + 4096)
    n_fft, hop = 1024, 256
    win = np.hanning(n_fft)
    out = np.zeros(len(noise))
    norm = np.zeros(len(noise))
    fr = np.fft.rfftfreq(n_fft, 1 / SR)
    for start in range(0, len(noise) - n_fft, hop):
        pos = min(1.0, (start + n_fft / 2) / n)
        if pos < peak_at:
            fc = 400 * (4000 / 400) ** (pos / peak_at)
        else:
            fc = 4000 * (1500 / 4000) ** ((pos - peak_at) / (1 - peak_at))
        shape = np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / fc) / 0.55) ** 2)
        frame = np.fft.irfft(np.fft.rfft(noise[start:start + n_fft] * win) * shape, n_fft)
        out[start:start + n_fft] += frame * win
        norm[start:start + n_fft] += win ** 2
    x = (out / np.maximum(norm, 1e-6))[:n]
    t = np.arange(n) / n
    env = np.where(t < peak_at, np.sin(0.5 * np.pi * t / peak_at) ** 2, np.cos(0.5 * np.pi * np.clip((t - peak_at) / (1 - peak_at), 0, 1)) ** 1.5)
    x = x * env
    pan = np.clip(t, 0, 1)
    left, right = x * np.cos(0.5 * np.pi * pan), x * np.sin(0.5 * np.pi * pan)
    return np.stack([left, right], axis=1), {"loudest": round(peak_at * duration, 3), "pan": "trái sang phải"}


def bell_note(freq, duration, ratios, amps, decay, attack=0.004):
    t = t_axis(duration)
    x = np.zeros(len(t))
    for r, a in zip(ratios, amps):
        x += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * r ** 0.7 / decay)
    return x * (1 - np.exp(-t / attack))


def notify():
    """Tiếng thông báo hai nốt đi lên (Si5 rồi Mi6, quãng bốn), âm sắc như mộc cầm mềm."""
    total = 1.0
    x = np.zeros(int(total * SR))
    notes = [(0.0, 987.77, 0.8), (0.14, 1318.51, 1.0)]
    for start, f, gain in notes:
        note = bell_note(f, total - start, [1, 2, 3, 4.2], [1, 0.3, 0.1, 0.04], 0.22) * gain
        i = int(start * SR)
        x[i:i + len(note)] += note
    return x, {"notes": [{"t": s, "hz": f} for s, f, _ in notes]}


def level_up():
    """Tiếng "tinh" khi lên hạng: nốt lướt Si5 rồi tiếng chuông Mi6 có bậc không điều hòa, kèm lấp lánh rất nhỏ."""
    total = 1.4
    x = np.zeros(int(total * SR))
    grace = bell_note(987.77, 0.25, [1, 2], [1, 0.2], 0.08) * 0.45
    x[: len(grace)] += grace
    i = int(0.07 * SR)
    main = bell_note(1318.51, total - 0.07, [1, 2.0, 2.76, 5.4], [1, 0.45, 0.28, 0.08], 0.55)
    x[i:i + len(main)] += main
    t = t_axis(total - 0.07)
    sparkle = rng.standard_normal(len(t)) * np.exp(-t / 0.05)
    S = np.fft.rfft(sparkle)
    fr = np.fft.rfftfreq(len(t), 1 / SR)
    S[(fr < 6000) | (fr > 11000)] = 0
    sparkle = np.fft.irfft(S, len(t))
    x[i:i + len(t)] += sparkle / np.max(np.abs(sparkle)) * 0.06
    return x, {"hit": 0.07, "hz": 1318.51}


def drum_hit(duration=1.2):
    """Trống nhẹ: màng trầm trượt 120 -> 65 Hz, mode thứ hai 1,59 lần, tiếng chạm tay lọc dưới 1,2 kHz."""
    t = t_axis(duration)
    f = 65 + 55 * np.exp(-t / 0.04)
    phase = 2 * np.pi * np.cumsum(f) / SR
    # Các mode của màng tròn (1; 1,59; 2,14; 2,30; 2,65) tắt nhanh dần, để loa nhỏ vẫn nghe ra tiếng trống.
    body = np.sin(phase) * np.exp(-t / 0.35)
    for ratio, amp, tau in ((1.59, 0.35, 0.12), (2.14, 0.22, 0.08), (2.30, 0.18, 0.07), (2.65, 0.12, 0.05)):
        body += amp * np.sin(ratio * phase) * np.exp(-t / tau)
    body = np.tanh(1.6 * body) / np.tanh(1.6)
    hit = rng.standard_normal(len(t)) * np.exp(-t / 0.015)
    H = np.fft.rfft(hit)
    fr = np.fft.rfftfreq(len(t), 1 / SR)
    H *= 1 / np.sqrt(1 + (fr / 1800) ** 4) * (1 - 1 / np.sqrt(1 + (fr / 150) ** 4))
    hit = np.fft.irfft(H, len(t))
    hit = hit / np.max(np.abs(hit)) * 0.3
    return (body + hit) * (1 - np.exp(-t / 0.002))


def three_drums(spacing):
    """Ba nhịp trống cho khung kết, cách nhau `spacing` giây (mặc định hai phách của nhạc nền 80,75 BPM), mạnh dần."""
    hits = [(0.0, 0.75), (spacing, 0.87), (2 * spacing, 1.0)]
    x = np.zeros(int((2 * spacing + 1.4) * SR))
    for start, gain in hits:
        h = drum_hit() * gain
        i = int(start * SR)
        x[i:i + len(h)] += h
    return x, {"hits": [round(s, 3) for s, _ in hits], "gains": [g for _, g in hits]}


def tick():
    """Tiếng "tách" nhẹ: dao động tắt nhanh 2,4 kHz + nhiễu 1,5–6 kHz rất ngắn + thân 900 Hz."""
    t = t_axis(0.12)
    tone = np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.006)
    body = 0.35 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.010)
    noise = rng.standard_normal(len(t)) * np.exp(-t / 0.004)
    N = np.fft.rfft(noise)
    fr = np.fft.rfftfreq(len(t), 1 / SR)
    N[(fr < 1500) | (fr > 6000)] = 0
    noise = np.fft.irfft(N, len(t))
    noise = noise / np.max(np.abs(noise)) * 0.4
    return tone + body + noise, {"hit": 0.0}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    beat = 60 / 80.75  # nhạc nền nen.wav
    jobs = {
        "chuong": lambda: ring(1),
        "chuong-lap": lambda: ring(3, 3.0),
        "rung": lambda: vibrate([400, 200, 400]),
        "rung-manh": lambda: vibrate([500, 150, 500, 150, 500]),
        "doi-tram": boom,
        "luot": whoosh,
        "thong-bao": notify,
        "tinh": level_up,
        "trong": lambda: (drum_hit(), {"hit": 0.0}),
        "trong-ba-nhip": lambda: three_drums(2 * beat),
        "tach": tick,
    }
    index = {}
    for name, fn in jobs.items():
        x, meta = fn()
        index[name] = save(name, x, meta)
        print(name, index[name])
    (OUT / "hieu-ung.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
