"""Dựng dòng thời gian cho Remotion: nắn đoạn quay theo lời đọc, chuyển mốc thao tác sang giờ video.

    python3 dung.py v1      # đọc v1/buoc.json, v1/doan/doan.json, giọng (nếu có) → remotion/src/data/thao-tac/v1.json

Giọng: giong/<tên>/<bước>.wav và <bước>.cau.json (mốc từng câu do can-cau.py tính bằng Whisper).
Chưa có giọng thì ước thời lượng theo số ký tự (18 ký tự/giây) để xem thử nhịp hình.
"""
import json
import shutil
import sys
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
REM = HERE.parent / "remotion"
CPS, GAP = 18.0, 0.35            # ước lượng khi chưa có giọng
AUDIO_AT, LEAD, TAIL = 0.35, 0.25, 0.9
CHAPTER_DUR = 3.2
# Nhịp cho người xem kịp nắm (Hoàng 23/11: "thao tác khá nhanh, văn nói gấp gáp"):
MIN_GAP = 0.7     # nghỉ tối thiểu giữa hai câu; thiếu thì chèn lặng vào giọng
DWELL = 1.0       # giữ kết quả của thao tác trên màn hình ít nhất chừng này trước khi sang thao tác kế
RATES = [1.0, 1.1, 1.2]   # chỉ tăng tốc nhẹ khi thao tác dài hơn lời nhiều (trước đây tới 1,6 lần)
NOTE_ZALO = {"text": "Minh nhận cảnh báo ngay trong Zalo", "sub": "Kênh dự kiến: tài khoản chính thức (Zalo OA) và Zalo Mini App “Lá chắn số”. Không cần cài thêm app."}
SUB = {}   # phụ đề = đúng lời đọc ở mọi câu (bản 15:xx: lời dẫn đã nói chữ Zalo)
DROP_GOC = {"vy-hoc": {"benai-4.m4a"}}   # quay lại điểm rẽ: prototype hỏi lại bằng benai-4, video không lặp (lời dẫn nói ở đó)
# Tên màn trên thanh địa chỉ giả: đổi theo MÀN đang hiện (trước đây ghi tên bước nên lệch khi một bước đi qua nhiều màn).
TITLES = {
    "A01a-trang-chu-don-gian": "Trang chủ của bà Hoa", "A03a-do-chuong-nguy-hiem": "Cuộc gọi lạ · cảnh báo khi đổ chuông",
    "A04a-hoi-nhanh": "Bé Nai hỏi lại bằng giọng nói", "A04b-phan-tich-ghi-am": "Phân tích sau cuộc gọi",
    "Z01a-tin-canh-bao-trong-chat": "Máy của Minh · cảnh báo trong Zalo", "Z01c-mini-app-da-gui": "Máy của Minh · Zalo Mini App",
    "A08c-hoi-nguoi-than-tra-loi": "Lời nhắn của Minh trên máy bà", "A10a-phanh-sau-cuoc-goi": "Nhắc dừng lại trước khi chuyển tiền",
    "A01b-trang-chu-day-du": "Trang chủ của Vy", "A06a-kiem-tra-so": "Kiểm tra trước khi chuyển tiền",
    "A07a-ket-qua-nguy-hiem": "Kết quả · nguy hiểm", "A07c-ket-qua-an-toan": "Kết quả · an toàn",
    "A05a-thong-bao-noi": "Tin nhắn lạ", "A05b-phan-tich-tin-nhan": "AI phân tích tin nhắn",
    "A09b-bao-cong-dong": "Báo cho cộng đồng", "A09c-bao-cao-xong": "Đã gửi báo cáo",
    "A11a-thu-vien-truyen": "Học như chơi", "A11e-truyen-co-loi-ke": "Truyện có lời kể của Bé Nai",
    "A11c-doc-tung-khung": "Điểm rẽ của truyện", "A11f-chon-sai-chon-lai": "Chọn sai · thấy hậu quả",
    "A11j-chon-dung-hoi-co-giao": "Chọn đúng · Vy hỏi cô giáo", "@video": "Gọi video với chị Lan (AI đóng vai)",
    "A11i-bang-diem-cuoi-bai": "Bảng điểm cuối bài", "A12a-cau-hoi": "Bài kiểm tra 5 câu", "A12b-giai-thich": "Giải thích sau mỗi câu",
    "A12c-ket-qua": "Kết quả và xếp hạng nhóm", "W01-thong-ke": "Web quản trị · Thống kê", "W02-kiem-duyet": "Web quản trị · Kiểm duyệt",
}
IMAGES = {}   # thẻ chương không có hình
META = {
    "v1": dict(title="Lá chắn số", subtitle="Lớp bảo vệ chạy ngầm, có người thân và cộng đồng đứng sau. Prototype, dữ liệu giả lập.", badge="Đội 18 · Đề 4"),
}


def seconds(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def sentences_of(step):
    say = step.get("say")
    return say if isinstance(say, list) else ([say] if say else [])


def voice(name, step):
    """(tệp âm thanh hoặc None, độ dài, [(câu, bắt đầu, kết thúc)] tính từ đầu tệp)."""
    folder = HERE / "giong" / name
    wav, cau = folder / f"{step['id']}.wav", folder / f"{step['id']}.cau.json"
    says = sentences_of(step)
    if wav.exists() and cau.exists():
        marks = json.loads(cau.read_text())
        return wav, seconds(wav), [(m["text"], m["start"], m["end"]) for m in marks]
    t, rows = 0.0, []
    for s in says:
        d = len(s) / CPS
        rows.append((s, t, t + d))
        t += d + GAP
    return None, max(0.0, t - GAP), rows


def to_video(warp, c):
    """Giờ đoạn quay → giờ bước."""
    for p in reversed(warp):
        if c >= p["c"] - 1e-6:
            return round(p["v"] + min(c - p["c"], p["len"]) / p.get("rate", 1.0), 3)
    return 0.0


BUSY = {"down": 0.6, "up": 0.6, "select": 0.9, "scroll0": 0.3, "scroll": 0.4, "key": 0.6, "file": 1.6, "url": 0.8, "aim": 0.3}


def busy_until(ev, c0, c1):
    """Thời điểm (giờ đoạn quay) mà thao tác cuối trong [c0, c1) đã xong và trang đã đứng yên."""
    end = c0 + 0.5
    for e in ev:
        if not (c0 <= e["t"] < c1):
            continue
        if e["type"] == "type":
            t = e["t"] + len(e["text"]) * 0.075 + 0.4
        elif e["type"] == "look":
            t = e["t"] + e.get("hold", 2.5) * 0.85
        else:
            t = e["t"] + BUSY.get(e["type"], 0.1)
        end = max(end, t)
    return min(c1, end + DWELL)


PROTO_AUDIO = HERE.parent.parent / "prototype" / "audio"
GOC_GAIN = [("chi-lan", 5.0), ("vy-", 2.0), ("benai", -0.5), ("", 0.0)]   # đo ebur128: chị Lan -22,8; Vy -19,6; Bé Nai -17 LUFS
# Khớp tiếng với khẩu hình (đo 24/11 15:1x bằng do-mieng.py): sự kiện start đầu tiên của mỗi file trong cuộc gọi là OfflineAudioContext
# của to16k (không ra loa), start thứ hai mới là phát thật; AudioContext kiểu 'playback' ra loa trễ outputLatency = 0,216 s và bộ khớp miệng
# vẽ khung miệng theo "tiếng đang nghe", nên miệng chạy sau mốc start thật 0,33–0,47 s (đo tương quan chuyển động miệng với đường bao tiếng).
# Bản 14:36 đặt tiếng ngay mốc start đầu → tiếng sớm hơn miệng 0,35–0,5 s. Giờ: lấy mốc start SAU CÙNG rồi cộng độ trễ dưới đây.
WEB_AUDIO_DELAY = 0.22     # mọi tiếng phát qua Web Audio trong trang gọi video (giọng Vy)
LIP_DELAY = float(__import__("os").environ.get("LIP_DELAY", "0.30"))   # chị Lan: mốc start thật → miệng trên hình
_TABLE = {}


def goc_table():
    """Độ dài từng file tiếng gốc của prototype."""
    import subprocess
    if not _TABLE:
        for f in sorted(PROTO_AUDIO.glob("*.m4a")):
            _TABLE[f.name] = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                                  capture_output=True, text=True).stdout.strip() or 0)
    return _TABLE


def goc_step(name, step, clip, lines_audio):
    """Bước có tiếng gốc của prototype: đoạn quay chạy 1x (không cắt, không tăng tốc); câu k bắt đầu sau mốc k
    (kịch bản đã chờ đủ lâu trước cú bấm nên lời dẫn xong trước khi tiếng gốc cất lên). Trả thêm sfx: tiếng gốc đặt đúng mốc."""
    import subprocess
    beats, length = clip["beats"], clip["seconds"]
    pause = sentence_gaps(lines_audio)
    # Đoạn quay luôn chạy 1x. Lời dẫn đến chậm hơn mốc thì hình ĐỨNG CHỜ ở mốc (lúc đó không có tiếng gốc nào đang phát),
    # nên lời không bao giờ nói sau thao tác và không đè lên tiếng gốc cất lên sau cú bấm.
    warp, shifts, v_end, prev = [], [], 0.0, 0.0
    for k, c in enumerate(beats):
        c_next = beats[k + 1] if k + 1 < len(beats) else length
        v = v_end
        if k < len(lines_audio):
            a = lines_audio[k][1]
            need = max(0.0, prev + (pause[k] - (pause[k - 1] if k else 0)))
            nat = AUDIO_AT + a + need
            if k:
                v = max(v_end, nat - 0.15)
                nat = max(nat, v + 0.15)
            prev = round(nat - AUDIO_AT - a, 3)
            shifts.append(prev)
        warp.append({"v": round(v, 3), "c": round(c, 3), "len": round(c_next - c, 3), "rate": 1.0})
        v_end = v + (c_next - c)
    hold = [(round(w["c"], 2), round(w["v"] - (p["v"] + p["len"]), 2)) for p, w in zip(warp, warp[1:]) if w["v"] - (p["v"] + p["len"]) > 0.05]
    if hold:
        print(f"  {step['id']}: hình đứng chờ lời tại (mốc đoạn quay, giây chờ): {hold}")
    warp, end_clip, extra = finish(warp, v_end, clip)
    ev = sorted(clip["events"], key=lambda e: e["t"])
    sfx, pub = [], REM / "public" / "thao-tac" / name / "goc"
    pub.mkdir(parents=True, exist_ok=True)
    table = goc_table()
    def named(e):
        src = e.get("src") or ""
        if src not in table:      # Web Audio không rõ nguồn: nhận theo độ dài bộ đệm
            d = e.get("d") or 0
            near = sorted(table, key=lambda n: abs(table[n] - d))[0]
            if d < 1 or abs(table[near] - d) > 0.08:
                return None
            src = near
        return src
    plays = [(i, e, named(e)) for i, e in enumerate(ev) if e["type"] == "audio" and e["k"] in ("play", "start")]
    last = {}
    for n, (i, e, src) in enumerate(plays):
        if not src:
            continue
        full = table[src]
        # cùng một tiếng báo hai lần trong 1 s (to16k chạy OfflineAudioContext rồi mới phát thật): lấy lần SAU CÙNG
        if any(s2 == src and 0 <= e2["t"] - e["t"] < 1.0 for _, e2, s2 in plays[n + 1:]):
            continue
        stop = next((x["t"] for x in ev[i + 1:] if x["type"] == "audio" and x["k"] in ("pause", "stop") and x.get("src") in (src, e.get("src"))), None)
        dur = min(full, (stop - e["t"]) if stop else full, length - e["t"])
        if src in DROP_GOC.get(step["id"], ()) or (stop and dur < full - 0.3) or dur < full * 0.6:
            print(f"  bỏ tiếng bị ngắt giữa chừng: {src} tại {e['t']:.1f}s ({dur:.1f}/{full:.1f}s)")
            continue
        last[src] = e["t"]
        wav = pub / (src.rsplit(".", 1)[0] + ".wav")
        if not wav.exists():
            gain = next(g for k, g in GOC_GAIN if src.startswith(k))
            # Nâng/hạ cho ngang lời dẫn (-17,7 LUFS), chặn đỉnh ở -3 dBFS, fade 20 ms hai đầu.
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(PROTO_AUDIO / src), "-af",
                            f"volume={gain}dB,alimiter=limit=0.7:level=false:attack=2:release=60,afade=t=in:d=0.02,areverse,afade=t=in:d=0.02,areverse",
                            "-ar", "48000", "-ac", "1", str(wav)], check=True)
        delay = (LIP_DELAY if src.startswith("chi-lan") else WEB_AUDIO_DELAY) if e["k"] == "start" else 0.0
        at = to_video(warp, e["t"] + delay)
        if to_video(warp, e["t"] + delay + dur) - at > dur + 0.05:
            print(f"  HÌNH ĐỨNG GIỮA TIẾNG GỐC {step['id']}: {src}")
        sfx.append({"src": f"thao-tac/{name}/goc/{wav.name}", "at": at, "dur": round(dur, 3)})
        for (txt, a, b), d in zip(lines_audio, shifts):
            s0, s1 = AUDIO_AT + a + d, AUDIO_AT + b + d
            if s0 < at + dur + 0.3 and s1 > at - 0.3:
                print(f"  CHỒNG TIẾNG {step['id']}: '{txt[:40]}' {s0:.1f}-{s1:.1f}s với {src} {at:.1f}-{at + dur:.1f}s")
    extra["sfx"] = sfx
    print(f"  {step['id']}: 1x, {len(sfx)} tiếng gốc: {[(x['src'].split('/')[-1], x['at'], x['dur']) for x in sfx]}")
    return (warp, end_clip, extra), shifts


def app_step(name, step, clip, lines_audio):
    if step.get("goc"):
        return goc_step(name, step, clip, lines_audio)
    """Thao tác dài hơn lời: tăng tốc đoạn quay của bước (tối đa 1,6 lần). Vẫn dài thì dời câu sau (chèn lặng)."""
    for rate in RATES:
        warp, end_clip, shifts = build_warp(step, clip, lines_audio, rate)
        audio_end = AUDIO_AT + (lines_audio[-1][2] if lines_audio else 0) + (shifts[-1] if shifts else 0)
        # Khoảng nghỉ cố ý giữa các câu (sentence_gaps) không tính là trễ; chỉ phần dời thêm vì thao tác chưa xong.
        late = (shifts[-1] - sentence_gaps(lines_audio)[-1]) if shifts else 0
        if end_clip <= audio_end + 2.5 and late <= 2.5:
            break
    return finish(warp, end_clip, clip), shifts


def pad_wav(src, dst, marks, shifts):
    """Chép giọng, chèn lặng trước câu k cho đủ độ dời shifts[k] (cắt ở giữa khoảng lặng giữa hai câu)."""
    with wave.open(str(src)) as w:
        params, rate, width, ch = w.getparams(), w.getframerate(), w.getsampwidth(), w.getnchannels()
        data = w.readframes(w.getnframes())
    out, pos, prev, cuts = [], 0, 0.0, []
    for k in range(1, len(marks)):
        add = shifts[k] - prev
        if add <= 0.001:
            continue
        cut = int((marks[k - 1][2] + marks[k][1]) / 2 * rate) * width * ch
        out += [data[pos:cut], b"\x00" * (int(add * rate) * width * ch)]
        cuts.append(cut)
        pos, prev = cut, shifts[k]
    out.append(data[pos:])
    if width == 2 and ch == 1 and cuts:
        # Fade 20 ms hai bên mỗi chỗ cắt (ra trước chỗ chèn lặng, vào sau đó) để không có tiếng tách.
        import array
        n = int(0.02 * rate)
        for j in range(len(out)):
            if j % 2:
                continue
            a = array.array("h"); a.frombytes(out[j])
            m = min(n, len(a) // 2)
            if j < len(out) - 1:
                for q in range(m):
                    a[len(a) - 1 - q] = int(a[len(a) - 1 - q] * q / m)
            if j > 0:
                for q in range(m):
                    a[q] = int(a[q] * q / m)
            out[j] = a.tobytes()
    with wave.open(str(dst), "wb") as w:
        w.setparams(params)
        w.writeframes(b"".join(out))


def sentence_gaps(marks):
    """Độ dời tích lũy để giữa hai câu liền nhau luôn nghỉ ít nhất MIN_GAP giây."""
    out, extra = [0.0] * len(marks), 0.0
    for k in range(1, len(marks)):
        gap = marks[k][1] - marks[k - 1][2]
        extra += max(0.0, MIN_GAP - gap)
        out[k] = round(extra, 3)
    return out


def build_warp(step, clip, lines_audio, rate):
    """Trả (warp, giờ kết thúc đoạn quay, độ dời của từng câu).

    Mốc câu k khớp mốc thao tác k; câu đầu khớp đầu đoạn. Thao tác của câu trước còn thừa đoạn đứng yên (chờ trang tải)
    mà câu sau đã bắt đầu thì cắt bớt đoạn đứng yên. Cắt hết rồi vẫn chưa xong thì dời câu sau (chèn lặng vào giọng),
    để giọng không nói trước thao tác."""
    beats, length = clip["beats"], clip["seconds"]
    pause = sentence_gaps(lines_audio)
    starts = [AUDIO_AT + a + p for (_, a, _), p in zip(lines_audio, pause)]
    ev_all = sorted(clip["events"], key=lambda e: e["t"])
    warp, v, shift = [], 0.0, 0.0
    shifts = [0.0] * len(starts)
    for k, c in enumerate(beats):
        c_next = beats[k + 1] if k + 1 < len(beats) else length
        if k > 0:
            want = starts[k] + shift - LEAD if k < len(starts) else v
            prev = warp[-1]
            if want < prev["v"] + prev["len"] / rate:
                active = busy_until(ev_all, prev["c"], prev["c"] + prev["len"]) - prev["c"]
                done = prev["v"] + active / rate
                if k < len(starts) and done > want:
                    shift += done - want
                    want = done
                prev["len"] = round(max(active, (want - prev["v"]) * rate), 3)
                v = prev["v"] + prev["len"] / rate
            v = max(v, want)
        if k < len(starts):
            shifts[k] = round(pause[k] + shift, 3)
        warp.append({"v": round(v, 3), "c": round(c, 3), "len": round(c_next - c, 3), "rate": round(rate, 2)})
        v += (c_next - c) / rate
    for k in range(len(beats), len(starts)):
        shifts[k] = round(pause[k] + shift, 3)
    # Đuôi đoạn cuối: giữ tới khi thao tác cuối xong (lời dài hơn thì khung cuối được giữ yên).
    last = warp[-1]
    last["len"] = round(busy_until(ev_all, last["c"], last["c"] + last["len"]) - last["c"] + 0.6, 3)
    last["len"] = min(last["len"], round(length - last["c"], 3))
    return warp, last["v"] + last["len"] / rate, shifts


def finish(warp, end_clip, clip):
    ev = sorted(clip["events"], key=lambda e: e["t"])
    V = lambda c: to_video(warp, c)
    cursor = [[V(e["t"]), round(e["x"], 1), round(e["y"], 1)] for e in ev if e["type"] in ("move", "down", "up") and "x" in e]
    clicks = [[V(e["t"]), round(e["x"], 1), round(e["y"], 1)] for e in ev if e["type"] == "down"]
    aims, selects, scrolls, urls = [], [], [], []
    for i, e in enumerate(ev):
        if e["type"] == "aim":
            later = ev[i + 1:]
            if e["act"] == "move":
                t1 = next((x["t"] for x in later if x["type"] in ("aim", "look", "scroll0")), e["t"] + 2.0)
                t1 = min(t1, e["t"] + 2.2)
            else:
                up = next((x for x in later if x["type"] == "up"), None)
                t1 = (up["t"] if up else e["t"] + 1.0) + 0.45
                typed = next((x for x in later[:4] if x["type"] == "type"), None)
                if e["act"] == "type" and typed:
                    t1 = typed["t"] + len(typed["text"]) * 0.072 + 0.5
                sel = next((x for x in later[:4] if x["type"] == "select"), None)
                if e["act"] == "select" and sel:
                    t1 = sel["t"] + 0.9
                    selects.append({"t": V(sel["t"]), "rect": e["rect"], "text": sel["text"]})
            aims.append({"t0": V(e["t"]), "t1": V(t1), "rect": e["rect"], "act": e["act"], "zoom": e.get("zoom")})
        elif e["type"] == "look":
            # Vùng rọi tắt khi thao tác kế tiếp bắt đầu (vd. bấm Đóng hộp thoại), kẻo rọi vào chỗ đã biến mất.
            nxt = next((x["t"] for x in ev[i + 1:] if x["type"] in ("aim", "look")), None)
            t1 = V(e["t"]) + e.get("hold", 2.5)
            if nxt is not None:
                t1 = min(t1, V(nxt) - 0.05)
            aims.append({"t0": V(e["t"]), "t1": round(t1, 3), "rect": e["rect"], "act": "look", "zoom": e.get("zoom")})
        elif e["type"] == "scroll0":
            end = next((x["t"] for x in ev[i + 1:] if x["type"] == "scroll"), e["t"] + 0.9)
            scrolls.append([V(e["t"]), V(end)])
        elif e["type"] == "scroll" and not any(x["type"] == "scroll0" for x in ev):
            scrolls.append([V(max(0, e["t"] - 0.9)), V(e["t"])])
        elif e["type"] == "url":
            # Bộ ghi đọc đường dẫn sau khi trang tải xong; đổi trên thanh địa chỉ ngay lúc nhả chuột của cú bấm trước đó.
            up = next((x["t"] for x in reversed(ev[:i]) if x["type"] == "up" and e["t"] - x["t"] < 3), e["t"])
            urls.append([V(up + 0.15), e["text"]])
    # Trang cuộn thì khung nhìn cũ không còn đúng chỗ: tắt vùng sáng và trả camera trước lúc cuộn.
    for a in aims:
        later = [s0 for s0, _ in scrolls if s0 > a["t0"] + 0.05]
        if later:
            a["t1"] = round(min(a["t1"], later[0] - 0.05), 3)
    return warp, end_clip, dict(cursor=cursor, clicks=clicks, aims=aims, scrolls=scrolls, selects=selects, urls=urls)


def build(name):
    data = json.loads((HERE / name / "buoc.json").read_text())
    doan = lambda v: json.loads((HERE / v / "doan" / "doan.json").read_text()) if (HERE / v / "doan" / "doan.json").exists() else {}
    clips_of = {name: doan(name), "v1": doan("v1")}
    pub = REM / "public" / "thao-tac" / name
    shutil.rmtree(pub / "goc", ignore_errors=True)
    (pub / "clips").mkdir(parents=True, exist_ok=True)
    (pub / "audio").mkdir(parents=True, exist_ok=True)
    t, steps = 0.0, []
    for step in data["steps"]:
        row = {"id": step["id"], "kind": step["kind"], "chapter": step.get("chapter", 0), "title": step.get("title", ""), "start": round(t, 3)}
        if step["kind"] == "chapter":
            row["dur"] = CHAPTER_DUR
        else:
            wav, length, marks = voice(name, step)
            src_video = step.get("clipOf", name)
            clips = clips_of[src_video]
            shifts = sentence_gaps(marks) if wav else [0.0] * len(marks)
            end_clip = 0.0
            if step["kind"] == "app" and step["id"] in clips:
                clip = clips[step["id"]]
                (warp, end_clip, extra), shifts = app_step(name, step, clip, marks)
                src = HERE / src_video / "doan" / f"{step['id']}.mp4"
                shutil.copy2(src, pub / "clips" / src.name)
                row.update(clip=f"thao-tac/{name}/clips/{src.name}", clipFrames=clip["frames"], warp=warp, **extra)
                # Màn Z01* là máy Minh: ghi rõ Minh nhận cảnh báo qua đâu (nhãn trên hình, theo lúc thanh địa chỉ đổi màn).
                us, notes = extra["urls"], []
                row["titles"] = [[ut, TITLES.get(u.lstrip("/"), step.get("title", ""))] for ut, u in us]
                for u in {u.lstrip("/") for _, u in us} - set(TITLES):
                    print(f"  CHƯA CÓ TÊN MÀN: {u}")
                for i, (ut, u) in enumerate(us):
                    if u.startswith("/Z01"):
                        t1 = us[i + 1][0] if i + 1 < len(us) else 1e6
                        if notes and abs(notes[-1]["t1"] - ut) < 0.01:
                            notes[-1]["t1"] = t1
                        else:
                            notes.append({"t0": round(ut + 0.5, 3), "t1": t1, **NOTE_ZALO})
                if notes:
                    row["notes"] = notes
            if wav:
                dst = pub / "audio" / f"{step['id']}.wav"
                if any(shifts):
                    pad_wav(wav, dst, marks, shifts)
                else:
                    shutil.copy2(wav, dst)
                row["audio"] = f"thao-tac/{name}/audio/{step['id']}.wav"
            if any(shifts):
                row["pauses"] = round(shifts[-1], 2)
            length += shifts[-1] if shifts else 0
            row["audioAt"] = AUDIO_AT
            row["lines"] = [{"text": SUB.get(s, s), "at": round(AUDIO_AT + a + d, 3), "until": round(AUDIO_AT + b + d, 3)} for (s, a, b), d in zip(marks, shifts)]
            dur = AUDIO_AT + length + (0.9 if step["kind"] in ("intro", "outro") else TAIL)
            if end_clip:
                dur = max(dur, end_clip + 0.35)
            if step["kind"] == "flow":
                row["flow"] = step["flow"]
            for k in ("code", "io"):
                if step.get(k):
                    row[k] = step[k]
            row["dur"] = round(dur, 3)
        steps.append(row)
        t += row["dur"]
    meta = META[name]
    # Hình minh họa: thu về 1200 px JPG trong public/minh-hoa, gắn vào từng chương nếu tệp có.
    src_dir, dst_dir = HERE.parent / "minh-hoa", REM / "public" / "minh-hoa"
    dst_dir.mkdir(parents=True, exist_ok=True)
    import subprocess
    for png in src_dir.glob("*.png"):
        jpg = dst_dir / (png.stem + ".jpg")
        if not jpg.exists() or jpg.stat().st_mtime < png.stat().st_mtime:
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(png), "-vf", "scale=1200:-1", "-q:v", "3", str(jpg)], check=True)
    for ch, img in zip(data["chapters"], IMAGES.get(name, [])):
        ch["image"] = f"minh-hoa/{img}.jpg" if img and (dst_dir / f"{img}.jpg").exists() else None
    out = dict(id=name, title=meta["title"], subtitle=meta["subtitle"], badge=meta["badge"], legend=meta.get("legend", False), seconds=round(t + 0.5, 3),
               chapters=data["chapters"], steps=steps)
    dst = REM / "src" / "data" / "thao-tac"
    dst.mkdir(parents=True, exist_ok=True)
    (dst / f"{name}.json").write_text(json.dumps(out, ensure_ascii=False) + "\n")
    print(f"{name}: {len(steps)} bước, {t:.1f} giây ({t / 60:.1f} phút), giọng: {'có' if any(s.get('audio') for s in steps) else 'ước lượng'}")


if __name__ == "__main__":
    for n in sys.argv[1:]:
        build(n)
