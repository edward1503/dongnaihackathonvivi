#!/usr/bin/env python3
"""Dựng dữ liệu trailer: ghi video/remotion/src/data/trailer.json và chép tệp vào video/remotion/public/trailer/.

  python3 dung-trailer.py            # lời ước theo 13,5 ký tự/giây, hoặc mốc câu thật nếu có T/giong/moc-cau.json
  python3 dung-trailer.py --uoc      # ép dùng ước lượng
  python3 dung-trailer.py --tach T/giong/<lượt>.wav   # tách lượt thu theo khoảng lặng → T/soat/moc-cau-tach.json

Đầu vào (có thì dùng, chưa có thì thay bằng ước lượng hoặc ảnh giữ chỗ):
  T/loi/loi-dan.json      [{"id": "S1", "text": "…", "tts": "…"}]   (ưu tiên)
  T/loi/loi-dan-tts.txt   mỗi dòng một câu (bản gửi TTS; "ây ai" đổi lại thành "AI" khi hiện chữ)
  T/giong/moc-cau.json    [{"start": s, "end": s}] theo thứ tự câu, kèm "file" (tệp giọng một lượt) ở gốc hoặc từng câu
  T/quay/<tệp>.mp4 + <tệp>.moc.json  đoạn quay thật (bảng CLIPS bên dưới)
  T/nhac/phach.json       {"beats": [giây, …]} hoặc [giây, …]: ranh giới cảnh dời tới phách gần nhất (±0,35 s)
  T/nhac/nhac.json        {"file": "…", "credit": "Nhạc: …"} (gói C ghi)
Chỉ dùng thư viện chuẩn và ffmpeg, ffprobe, magick.
"""
import json, math, os, re, shutil, subprocess, sys, array

W = os.path.realpath(os.path.join(os.path.dirname(__file__), "../../.."))
T = os.path.join(W, "video/trailer")
REM = os.path.join(W, "video/remotion")
PUB = os.path.join(REM, "public/trailer")
OUT = os.path.join(REM, "src/data/trailer.json")
SCRATCH = "/tmp/claude-1000/-home-rin/8a757c30-917e-41c0-9736-02ecd2c83863/scratchpad"
FPS = 30
CPS = 13.5
MIN_S, MAX_S = 88.0, 93.0

# ---------------------------------------------------------------- lời dẫn
SCENE_LINES = [("C0", 3), ("C1", 2), ("C2", 3), ("C3", 2), ("C4", 2), ("C5", 2), ("C6", 6), ("C7", 3)]
# Câu có chữ lớn trùng lời trên hình thì không hiện phụ đề (đỡ lặp chữ).
NO_SUB = {0, 2, 3, 20, 21, 22}


def load_lines():
    j = os.path.join(T, "loi/loi-dan.json")
    if os.path.exists(j):
        data = json.load(open(j, encoding="utf-8"))
        items = data if isinstance(data, list) else data.get("lines") or data.get("cau") or []
        return [{"id": x.get("id") or x.get("ma") or f"S{i+1}", "text": x.get("text") or x.get("hien") or x.get("chu")} for i, x in enumerate(items)]
    txt = os.path.join(T, "loi/loi-dan-tts.txt")
    lines = [l.strip() for l in open(txt, encoding="utf-8") if l.strip()]
    show = lambda s: re.sub(r"\bây ai\b", "AI", s)
    return [{"id": f"L{i+1}", "text": show(l)} for i, l in enumerate(lines)]


def split_take(wav, n):
    """Tách một lượt thu thành n câu theo n-1 khoảng lặng dài nhất. Ghi T/soat/moc-cau-tach.json; soát bằng tai rồi chép thành T/giong/moc-cau.json."""
    import wave
    w = wave.open(wav); sr = w.getframerate(); a = array.array("h"); a.frombytes(w.readframes(w.getnframes()))
    hop = sr // 100
    rms = [math.sqrt(sum(x * x for x in a[i:i + hop]) / hop) for i in range(0, len(a) - hop, hop)]
    thr = max(rms) * 0.02
    gaps, start = [], None
    for i, r in enumerate(rms):
        if r < thr:
            start = i if start is None else start
        else:
            if start is not None and i - start >= 12:
                gaps.append((start / 100, i / 100))
            start = None
    speech0 = next(i for i, r in enumerate(rms) if r >= thr) / 100
    speech1 = (len(rms) - next(i for i, r in enumerate(reversed(rms)) if r >= thr)) / 100
    inner = sorted(g for g in gaps if speech0 < g[0] and g[1] < speech1)
    cuts = sorted(sorted(inner, key=lambda g: g[0] - g[1])[: n - 1])
    bounds = [speech0] + [x for g in cuts for x in g] + [speech1]
    items = [{"start": round(max(0, bounds[2 * k] - 0.05), 2), "end": round(bounds[2 * k + 1] + 0.12, 2)} for k in range(n)]
    out = {"file": os.path.relpath(wav, os.path.join(T, "giong")), "lines": items}
    json.dump(out, open(os.path.join(T, "soat/moc-cau-tach.json"), "w"), indent=1)
    for k, it in enumerate(items):
        print(f"  câu {k + 1:2}: {it['start']:6.2f}–{it['end']:6.2f}")
    print("Ghi T/soat/moc-cau-tach.json (soát bằng tai rồi chép thành T/giong/moc-cau.json)")


def load_voice(n):
    """Mốc câu thật T/giong/moc-cau.json: {"file", "lines": [{"start","end","text"}]} theo thứ tự câu.
    Có T/giong/cau/cau.json (tệp từng câu) thì phát từng tệp câu. Không có thì None."""
    p = os.path.join(T, "giong/moc-cau.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p, encoding="utf-8"))
    items = d if isinstance(d, list) else d.get("lines") or d.get("cau")
    root_file = None if isinstance(d, list) else d.get("file")
    if len(items) != n:
        print(f"LỖI: moc-cau.json có {len(items)} câu, lời có {n} câu: dùng ước lượng", file=sys.stderr)
        return None
    per = {}
    cj = os.path.join(T, "giong/cau/cau.json")
    if os.path.exists(cj):
        for c in json.load(open(cj, encoding="utf-8")):
            fp = os.path.join(T, "giong/cau", c.get("tep", ""))
            if os.path.exists(fp):
                per[int(c["s"]) - 1] = fp
    out = []
    for k, it in enumerate(items):
        out.append({"start": float(it.get("start", it.get("dau", 0))), "end": float(it.get("end", it.get("cuoi", 0))),
                    "file": it.get("file") or root_file, "text": it.get("text"), "clip": per.get(k)})
    return out


# ---------------------------------------------------------------- tiếng
def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def envelope(path, start=0.0, dur=None):
    """Biên độ mỗi khung (0..1) của tệp tiếng, để vẽ sóng âm."""
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-ac", "1", "-ar", "6000", "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    a = array.array("h"); a.frombytes(raw[: len(raw) // 2 * 2])
    hop = 6000 // FPS
    rms = [math.sqrt(sum(x * x for x in a[i:i + hop]) / hop) for i in range(0, max(0, len(a) - hop), hop)]
    top = max(rms) if rms else 1
    return [round(min(1.0, (r / top) ** 0.8), 3) for r in rms]


def synth_envelope(seconds, seed):
    """Sóng giả có hạt giống khi chưa có tệp tiếng (bản nháp)."""
    import random
    rnd = random.Random(seed)
    n = int(seconds * FPS)
    out, v = [], 0.0
    for i in range(n):
        target = rnd.random() * 0.9 + 0.1 if i % 4 == 0 else v
        v = v * 0.55 + target * 0.45
        edge = min(1, i / 4, (n - i) / 6)
        out.append(round(max(0, v * edge), 3))
    return out


# ---------------------------------------------------------------- ảnh giữ chỗ và đoạn quay
KA = os.path.join(SCRATCH, "khop-android")
KR = os.path.join(SCRATCH, "khop-react/shots")
KB = os.path.join(SCRATCH, "khop-bai-hoc/cua-minh")
XH = os.path.join(SCRATCH, "xh")
# Ảnh Android so sánh hai nửa: lấy nửa phải (ảnh chụp thật trên Xiaomi), đưa về 1080×2400. masks: vùng che số (px 1080×2400).
PLACEHOLDERS = {
    "a03a": {"real": True, "src": f"{KA}/A03a.png", "crop": "720x1600+728+8", "w": 1080, "h": 2400, "masks": [{"x": 415, "y": 150, "w": 280, "h": 70}]},
    "a03b": {"real": True, "src": f"{KA}/A03b.png", "crop": "720x1600+728+8", "w": 1080, "h": 2400},
    "a04a": {"real": True, "src": f"{KA}/A04a.png", "crop": "720x1600+728+8", "w": 1080, "h": 2400,
             "masks": [{"x": 120, "y": 1322, "w": 840, "h": 106, "fill": "#F4F6FB"}, {"x": 10, "y": 1978, "w": 1060, "h": 172, "fill": "#F4F6FB"}]},
    "a04b": {"real": True, "src": f"{KA}/A04b-khi-bam-Co.png", "crop": "930x2136+760+8", "resize": "1080x", "crop2": "1080x2400+0+0", "w": 1080, "h": 2400,
             "masks": [{"x": 205, "y": 325, "w": 470, "h": 90}, {"x": 10, "y": 1978, "w": 1060, "h": 172, "fill": "#F4F6FB"}]},
    "a05b": {"real": True, "src": f"{KA}/A05b.png", "crop": "778x1732+728+8", "w": 1080, "h": 2400, "masks": [{"x": 315, "y": 278, "w": 310, "h": 76}]},
    "a10a": {"real": True, "src": f"{KA}/A10a.png", "crop": "720x1600+728+8", "w": 1080, "h": 2400},
    "gd-ct": {"src": f"{KR}/X-gd-ct.png", "w": 786, "h": 1746},
    "a09a": {"src": f"{KR}/A09a.png", "w": 786, "h": 1746,
             "masks": [{"x": 150, "y": 340, "w": 250, "h": 56}, {"x": 150, "y": 552, "w": 250, "h": 56}, {"x": 150, "y": 700, "w": 250, "h": 56}]},
    "bao-nham": {"src": f"{KR}/X-bao-nham.png", "w": 786, "h": 1746, "masks": [{"x": 58, "y": 326, "w": 250, "h": 56}]},
    "re": {"src": f"{KB}/c1-re-2.png", "w": 786, "h": 1746},
    "xh-truoc": {"src": f"{XH}/3-truoc.png", "w": 786, "h": 1746},
    "xh-sau": {"src": f"{XH}/4-sau-len-hang.png", "w": 786, "h": 1746},
}
STATIC = {  # ảnh dùng thẳng
    "logo": f"{W}/tools/logo/logo-c.png",
    "ba-hoa": f"{W}/assets/chan-dung-ba-hoa.png",
    "comic-1": f"{W}/assets/comic2-1.png", "comic-2": f"{W}/assets/comic2-2.png",
    "comic-3": f"{W}/assets/comic2-3.png", "comic-4": f"{W}/assets/comic2-4.png",
    "mo-dau": f"{T}/anh-ai/mo-dau.png", "nguoi-than": f"{T}/anh-ai/nguoi-than.png",
    "cong-dong": f"{T}/anh-ai/cong-dong.png", "nui-khien": f"{T}/anh-ai/nui-khien.png",
}

# Đoạn quay: tệp thật trong T/quay (khi có) hoặc ảnh giữ chỗ. align: mốc của đoạn quay ↔ mốc của cảnh.
CLIPS = {
    "a1": {"file": "a1-so-la.mp4", "ph": ["a03b"]},
    "a2": {"file": "a2-the-do.mp4", "ph": ["a03a"], "align": ("the-do", "redCard")},
    "a2-hoi": {"file": "a2-be-nai.mp4", "ph": ["a04a", "a04b"], "align": ("be-nai-hoi", "ask")},
    "w2": {"file": "w2-tin-nhan.mp4", "ph": ["a05b"]},
    "m1": {"file": "m1-may-minh.mp4", "ph": ["gd-ct"]},
    "a5": {"file": "a5-dung-lai.mp4", "ph": ["a10a"], "align": ("dung-lai", "stop")},
    "w5": {"file": "w5-truyen.mp4", "ph": ["re"], "align": ("diem-re-chon-dung", "branch")},
    "w6": {"file": "w6-goi-video.mp4", "src": "/tmp/claude-1000/lcs-ph/anh/quay-minh11/minh.mp4", "cut": (13.0, 6.0), "w": 1080, "h": 2400},
    "w11": {"file": "w11-xep-hang.mp4", "ph": ["xh-truoc", "xh-sau"], "align": ("len-hang", "rankUp"),
            "focus": {"the-xep-hang": {"x": 40, "y": 850, "w": 1000, "h": 960}}},
    "a6": {"file": "a6-bao-cao.mp4", "ph": ["a09a"]},
    "w9": {"file": "w9-kiem-duyet.mp4"},
    "w10": {"file": "w10-khieu-nai.mp4", "ph": ["bao-nham"]},
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"Lỗi lệnh {' '.join(cmd[:3])}…: {r.stderr[-400:]}")


def newer(dst, src):
    return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)


def prep_placeholder(key):
    p = PLACEHOLDERS[key]
    dst = os.path.join(PUB, "anh", f"{key}.png")
    if not newer(dst, p["src"]):
        cmd = ["magick", p["src"], "+repage"]
        if "crop" in p: cmd += ["-crop", p["crop"], "+repage"]
        if "resize" in p: cmd += ["-resize", p["resize"]]
        elif "crop" in p: cmd += ["-resize", f"{p['w']}x{p['h']}!"]
        if "crop2" in p: cmd += ["-crop", p["crop2"], "+repage"]
        run(cmd + [dst])
    return f"trailer/anh/{key}.png", p


def prep_static(key):
    src = STATIC[key]
    if not os.path.exists(src):
        return None
    ext = os.path.splitext(src)[1]
    dst = os.path.join(PUB, "anh", key + ext)
    if not newer(dst, src):
        shutil.copy2(src, dst)
    return f"trailer/anh/{key}{ext}"


def probe_video(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-count_packets", "-show_entries", "stream=width,height,nb_read_packets",
                        "-of", "json", path], capture_output=True, text=True)
    s = json.loads(r.stdout)["streams"][0]
    return s["width"], s["height"], int(s["nb_read_packets"])


def clip_source(cid):
    """Trả về (src trong public, w, h, frames, moc) nếu có đoạn quay thật; None nếu chưa."""
    c = CLIPS[cid]
    real = os.path.join(T, "quay", c["file"])
    dst = os.path.join(PUB, "quay", c["file"])
    if os.path.exists(real):
        if not newer(dst, real):
            shutil.copy2(real, dst)
        moc_path = real[:-4] + ".moc.json"
        moc = json.load(open(moc_path, encoding="utf-8")) if os.path.exists(moc_path) else {}
    elif "src" in c and os.path.exists(c["src"]):
        start, dur = c["cut"]
        if not newer(dst, c["src"]):
            run(["ffmpeg", "-y", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", c["src"], "-vf", "fps=30,format=yuv420p",
                 "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-an", "-movflags", "+faststart", dst])
        moc = {}
    else:
        return None
    w, h, n = probe_video(dst)
    return f"trailer/quay/{c['file']}", w, h, n, moc


def make_clip(cid, from_f, scene_marks, stills_at=None):
    """Đoạn quay cho cảnh. stills_at: khung của cảnh để đổi ảnh giữ chỗ (ảnh thứ 2, 3…)."""
    c = CLIPS[cid]
    real = clip_source(cid)
    if real:
        src, w, h, n, moc = real
        marks = {m.get("ten") or m.get("name"): m["t"] for m in moc.get("moc", [])}
        trim = 0
        if c.get("align") and c["align"][0] in marks and c["align"][1] in scene_marks:
            # Khung của đoạn quay có mốc align rơi đúng vào mốc của cảnh.
            trim = max(0, round(marks[c["align"][0]] * FPS) - (scene_marks[c["align"][1]] - from_f))
        focus = {**(c.get("focus") or {}), **(moc.get("focus") or {})}
        return {"id": cid, "src": src, "w": w, "h": h, "from": from_f, "trimBefore": trim, "frames": n,
                "marks": {k: from_f + round(v * FPS) - trim for k, v in marks.items()}, "focus": focus, "masks": moc.get("che", []), "placeholder": False}
    phs = c.get("ph") or []
    if not phs:
        return None
    stills, masks, w, h = [], [], 1080, 2400
    for i, key in enumerate(phs):
        img, p = prep_placeholder(key)
        w, h = p["w"], p["h"]
        masks = p.get("masks", masks) if i == 0 else masks
        stills.append({"at": 0 if i == 0 else (stills_at[i - 1] if stills_at else 0), "image": img, "masks": p.get("masks", [])})
    real_photo = all(PLACEHOLDERS[k].get("real") for k in phs)
    return {"id": cid, "src": None, "w": w, "h": h, "from": from_f, "trimBefore": 0, "frames": 1, "stills": stills, "masks": [], "placeholder": not real_photo}


# ---------------------------------------------------------------- dòng thời gian từng cảnh
def line_seconds(text, voice):
    if voice:
        return voice["end"] - voice["start"] + GAP
    return len(text) / CPS


def chunk_subtitle(text, frm, to, limit=52):
    """Câu dài tách thành nhiều dòng phụ đề ở dấu câu gần giữa, thời gian chia theo số ký tự."""
    if len(text) <= limit:
        return [{"text": text, "from": frm, "to": to}]
    cuts = [m.end() for m in re.finditer(r"[,:.]\s", text)]
    if not cuts:
        cuts = [m.start() for m in re.finditer(r"\s", text)]
    mid = len(text) / 2
    k = min(cuts, key=lambda c: abs(c - mid))
    a, b = text[:k].strip(), text[k:].strip()
    split = frm + round((to - frm) * len(a) / (len(a) + len(b)))
    return chunk_subtitle(a, frm, split, limit) + chunk_subtitle(b, split, to, limit)


GAP = 0.22          # nghỉ giữa hai câu lời dẫn (giọng thật)
MUSIC_BUNG = 58.56  # điểm bung của nhạc nền (T/nhac/phach.json), trùng đầu cảnh cộng đồng C6
MUSIC_CREDIT = "Nhạc: “Aphelion” – Scott Buckley (scottbuckley.com.au) · CC BY 4.0 · đã cắt ghép"
# Tiếng trong app và hiệu ứng (gói C). Tệp trong T/am.
APP = {"ke-gian": "app/ke-gian.wav", "be-nai-hoi": "app/be-nai-hoi.wav"}


def wav_seconds(path):
    import wave
    w = wave.open(path)
    return w.getnframes() / w.getframerate()


def pub_copy(src, sub):
    dst = os.path.join(PUB, sub, os.path.basename(src))
    if not newer(dst, src):
        shutil.copy2(src, dst)
    return f"trailer/{sub}/{os.path.basename(src)}"


def main():
    force_estimate = "--uoc" in sys.argv
    for d in ("anh", "quay", "giong", "am", "nhac"):
        os.makedirs(os.path.join(PUB, d), exist_ok=True)
    lines = load_lines()
    total_lines = sum(n for _, n in SCENE_LINES)
    if "--tach" in sys.argv:
        split_take(os.path.abspath(sys.argv[sys.argv.index("--tach") + 1]), total_lines)
    voice = None if force_estimate else load_voice(total_lines)
    if voice:
        # Chữ phụ đề lấy đúng trường text của mốc câu.
        lines = [{"id": f"L{i + 1}", "text": v["text"] or lines[i]["text"]} for i, v in enumerate(voice)]
    if len(lines) != total_lines:
        raise SystemExit(f"Lời có {len(lines)} câu, bảng cảnh cần {total_lines}")

    # Các mục của từng cảnh: ("L", câu) | ("P", giây nghỉ) | ("A", tiếng trong app)
    idx = iter(range(len(lines)))
    L = lambda: ("L", next(idx))
    has_app = lambda k: os.path.exists(os.path.join(T, "am", APP[k]))
    A = lambda k: ("A", k, wav_seconds(os.path.join(T, "am", APP[k])) + GAP) if has_app(k) else ("P", 0.0)
    plan = {
        "C0": [("P", 0.1), L(), A("ke-gian"), L(), L()],
        "C1": [L(), L()],
        "C2": [L(), L(), L()],
        "C3": [L(), A("be-nai-hoi"), L(), ("P", 0.5)],
        "C4": [L(), L()],
        "C5": [L(), L()],
        "C6": [L(), L(), L(), L(), ("P", 0.5), L(), L()],
        "C7": [L(), L(), L(), ("P", 2.0), ("P", 0.5)],
    }

    t = 0.0
    scenes_t = []
    for sid, items in plan.items():
        start = t
        spans = []
        for it in items:
            if it[0] == "L":
                d = line_seconds(lines[it[1]]["text"], voice[it[1]] if voice else None)
            else:
                d = it[-1]
            spans.append((it, t - start, t - start + d))
            t += d
        scenes_t.append((sid, start, t, spans))
    total = t
    durationInFrames = round(total * FPS)
    f = lambda s: round(s * FPS)

    meta = {
        "C0": {"title": "Mở · một cây", "theme": "night", "enter": "fade", "exit": "none", "chip": None, "tag": None},
        "C1": {"title": "Tên", "theme": "brand", "enter": "none", "exit": "depth", "chip": None, "tag": None},
        "C2": {"title": "Trụ 1 · Cảnh báo", "theme": "light", "enter": "depth", "exit": "depth", "chip": {"ring": 1, "text": "1 · Cảnh báo"}, "tag": "Dữ liệu minh họa · Quay trên điện thoại thật"},
        "C3": {"title": "Trụ 2 · Giọng nói", "theme": "light", "enter": "depth", "exit": "depth", "chip": {"ring": 1, "text": "2 · Giọng nói"}, "tag": "Dữ liệu minh họa · Quay trên điện thoại thật"},
        "C4": {"title": "Vòng 2 · Người thân", "theme": "night", "enter": "depth", "exit": "depth", "chip": {"ring": 2, "text": "Người thân"}, "tag": "Dữ liệu minh họa · Quay trên điện thoại thật"},
        "C5": {"title": "Trụ 3 · Học tập", "theme": "light", "enter": "depth", "exit": "depth", "chip": {"ring": 1, "text": "3 · Học tập"}, "tag": "Dữ liệu minh họa · Quay trên điện thoại thật"},
        "C6": {"title": "Trụ 4 · Cộng đồng", "theme": "warm", "enter": "depth", "exit": "hold", "chip": {"ring": 3, "text": "4 · Cộng đồng", "strong": True}, "tag": "Dữ liệu minh họa"},
        "C7": {"title": "Kết", "theme": "night", "enter": "none", "exit": "none", "chip": None, "tag": None},
    }
    backdrops = {
        "C0": {"theme": "night", "reveal": "cut", "at": 0, "dur": 0},
        "C1": {"theme": "brand", "reveal": "shield", "at": 10, "dur": 18, "cx": 960, "cy": 440},
        "C2": {"theme": "light", "reveal": "fade", "at": 0, "dur": 10},
        "C3": {"theme": "light", "reveal": "cut", "at": 0, "dur": 0},
        "C4": {"theme": "night", "reveal": "cut", "at": 0, "dur": 0},
        "C5": {"theme": "light", "reveal": "cut", "at": 0, "dur": 0},
        "C6": {"theme": "warm", "reveal": "spread", "at": 0, "dur": 20, "cx": 960, "cy": 540},
        "C7": {"theme": "night", "reveal": "cut", "at": 0, "dur": 0},
    }
    # Chữ trên hình. Sửa ở đây rồi chạy lại.
    texts = {
        "C0": {"title1": "Một cuộc gọi lạ.", "title2": "Bà Hoa chỉ có *một mình.*", "proverb": "Một cây làm chẳng nên non…",
               "scam": "“Bà chuyển hết tiền vào tài khoản tạm giữ giúp tôi.”", "simTag": "Mô phỏng · giọng AI đóng vai"},
        "C1": {"name": "LÁ CHẮN SỐ", "team": "Đội 18 · Vivi · Hackathon thành phố Đồng Nai 2026"},
        "C2": {"t1": "Cảnh báo ngay *khi chuông đổ*", "t2": "Chưa ai báo: *im lặng*",
               "silent": "Số lạ chưa ai báo", "red": "Số đã bị báo", "t3": "Tin nhắn · *Đường dẫn lạ*"},
        "C3": {"t1": "Bé Nai *hỏi bằng giọng nói*", "question": "Người vừa gọi có bảo bà chuyển tiền không ạ?", "answer": "Có.", "result": "Nguy hiểm · Đã báo cho Minh"},
        "C4": {"notifyApp": "Lá chắn số", "notify": "Mẹ vừa gặp cuộc gọi đáng ngờ", "t2a": "Mở app ngân hàng?", "t2b": "*DỪNG LẠI*"},
        "C5": {"t1": "Truyện có *lối rẽ*", "t2": "Gọi video *nhập vai*", "aiTag": "AI đóng vai · Tình huống nhập vai mẫu", "t3": "Thi đua: *lớp · trường · phường*"},
        "C6": {"t1": "Lá chắn mạnh nhất: *cộng đồng*", "t2": "Thẻ đỏ có được nhờ *người báo trước*", "list": "Danh sách chung",
               "t3": "Máy *nhận thật* mới báo được", "t4": "Đội tình nguyện *kiểm duyệt*", "t5": "Báo nhầm? *Được xem lại*", "t6": "Một danh sách, *mọi máy cùng dùng*"},
        "C7": {"w1": "Chính mình", "w2": "Người thân", "w3": "Cộng đồng", "proverb1": "Một cây làm chẳng nên non,", "proverb2": "ba cây chụm lại nên hòn núi cao.",
               "name": "LÁ CHẮN SỐ", "team": "Đội 18 · Vivi · Hackathon thành phố Đồng Nai 2026"},
    }

    # Nhạc nền: điểm bung trùng đầu C6 (nhạc vào trễ 0–3 s).
    music = {"src": None, "credit": None, "volume": 0.8, "from": 0, "duck": 0.22}
    nen = os.path.join(T, "nhac/nen.wav")
    c6_start = next(s0 for sid, s0, s1, sp in scenes_t if sid == "C6")
    if os.path.exists(nen):
        music["src"] = pub_copy(nen, "nhac")
        music["credit"] = MUSIC_CREDIT
        offset = max(0.0, min(3.0, c6_start - MUSIC_BUNG))
        music["from"] = f(offset)
        music["bungAt"] = round(offset + MUSIC_BUNG, 2)
    am = lambda name: pub_copy(os.path.join(T, "am", name), "am") if os.path.exists(os.path.join(T, "am", name)) else None

    images = {k: prep_static(k) for k in STATIC}

    def song(name):
        p = os.path.join(T, "am/song", name + ".json")
        if os.path.exists(p):
            d = json.load(open(p))
            return d if isinstance(d, list) else d.get("amps") or d.get("values") or []
        return []

    scenes, draft = [], False
    for sid, s0, s1, spans in scenes_t:
        F0 = f(s0)
        dur = f(s1) - F0
        ln, subs, sounds, apps = [], [], [], {}
        for it, a, b in spans:
            fr, to = f(s0 + a) - F0, f(s0 + b) - F0
            if it[0] == "L":
                i = it[1]
                text = lines[i]["text"]
                if voice:
                    v = voice[i]
                    if v.get("clip"):
                        sounds.append({"src": pub_copy(v["clip"], "giong"), "from": fr, "volume": 1, "duck": True})
                    else:
                        vp = os.path.join(T, "giong", v["file"])
                        sounds.append({"src": pub_copy(vp, "giong"), "from": fr, "trimBefore": f(v["start"]), "frames": f(v["end"] - v["start"]) + 4, "volume": 1, "duck": True})
                ln.append({"id": lines[i]["id"], "text": text, "from": fr, "to": to, "subtitle": i not in NO_SUB})
                if i not in NO_SUB:
                    subs += chunk_subtitle(text, fr, to - 3)
            elif it[0] == "A":
                apps[it[1]] = (fr, to)
                src = am(APP[it[1]])
                if src:
                    sounds.append({"src": src, "from": fr, "frames": to - fr, "volume": 1, "duck": True})

        def at(k, frac=0.0):
            l = ln[k]
            return l["from"] + round((l["to"] - l["from"]) * frac)

        def word(k, w, last=False):
            l = ln[k]
            txt = l["text"].lower()
            pos = txt.rfind(w.lower()) if last else txt.find(w.lower())
            return at(k, max(0, pos) / max(1, len(l["text"])))

        def sfx(name, at_f, vol=0.6, frames=None):
            src = am(name)
            if src:
                sounds.append({"src": src, "from": max(0, at_f), "volume": vol, **({"frames": frames} if frames else {})})

        marks, clips, waves = {}, {}, {}
        if sid == "C0":
            k0, k1 = apps.get("ke-gian", (at(1), at(1)))
            marks = {"title1": at(0), "scam": k0, "scamEnd": k1, "title2": word(1, "Bà chỉ"), "proverb": at(2) - 8, "ring": 8, "ringEnd": k0 - 4}
            sfx("chuong-lap.wav", 8, 0.35, frames=max(10, k0 - 8))
            waves["scam"] = song("ke-gian")
        elif sid == "C1":
            marks = {"shield": 0, "wipe": 10, "name": at(0), "team": at(1) + 6}
            sfx("doi-tram.wav", 10, 0.4)
        elif sid == "C2":
            marks = {"redCard": word(0, "hiện cảnh báo"), "compare": at(1) - 6, "message": at(2) - 6}
            clips["a2"] = make_clip("a2", 0, marks)
            clips["a1"] = make_clip("a1", 0, marks)
            clips["w2"] = make_clip("w2", 0, marks)
            sfx("chuong.wav", 2, 0.3)
            sfx("tach.wav", marks["redCard"] + 4, 0.6)
            sfx("tach.wav", marks["compare"] + 4, 0.4)
            sfx("luot.wav", marks["message"] - 6, 0.35)
        elif sid == "C3":
            ask0, ask1 = apps.get("be-nai-hoi", (at(1) - 30, at(1)))
            yes = word(1, "nói") + 4
            marks = {"ask": ask0, "askEnd": ask1, "listen": at(1), "yes": yes, "result": yes + 2}
            clips["a2-hoi"] = make_clip("a2-hoi", 0, marks, stills_at=[marks["result"]])
            waves["benai"] = song("be-nai-hoi")
            sfx("tach.wav", marks["result"], 0.5)
        elif sid == "C4":
            marks = {"notify": word(0, "báo ngay"), "stop": at(1) - 6, "stopRed": word(1, "dừng lại")}
            clips["a5"] = make_clip("a5", marks["stop"], marks)
            sfx("thong-bao.wav", marks["notify"], 0.7)
            sfx("luot.wav", marks["stop"] - 4, 0.35)
        elif sid == "C5":
            marks = {"branch": word(0, "lối rẽ"), "call": word(0, "gọi video") - 4, "rank": at(1) - 6, "rankUp": word(1, "lên hạng")}
            clips["w5"] = make_clip("w5", 0, marks)
            clips["w6"] = make_clip("w6", marks["call"], marks)
            clips["w11"] = make_clip("w11", marks["rank"], marks)
            sfx("luot.wav", marks["call"] - 4, 0.35)
            sfx("tinh.wav", marks["rankUp"], 0.6)
        elif sid == "C6":
            marks = {"title": at(0), "red": at(1) - 4, "report": at(2) - 6, "review": at(3) - 6, "freeze": at(3) + 24, "appeal": at(4) - 6, "list": at(5) - 6}
            clips["a2"] = make_clip("a2", 0, marks)
            clips["w9"] = make_clip("w9", marks["review"], marks)
            if clips["w9"]:
                # Phần mở hồ sơ, xác nhận của đoạn quay web; đứng hình 2 s ở bằng chứng.
                span = marks["appeal"] - marks["review"] + 10 - 60
                moc = {m["ten"]: m["t"] for m in json.load(open(os.path.join(T, "quay/w9-kiem-duyet.moc.json"))).get("moc", [])} \
                    if os.path.exists(os.path.join(T, "quay/w9-kiem-duyet.moc.json")) else {}
                want = round(moc.get("xac-nhan", 0) * FPS) - span + 20
                clips["w9"]["trimBefore"] = max(0, min(clips["w9"]["frames"] - span, want))
                clips["w9"]["holds"] = [{"at": marks["freeze"], "len": 60}]
            sfx("luot.wav", marks["red"], 0.3)
            sfx("tach.wav", marks["report"] + 6, 0.4)
            sfx("tinh.wav", marks["appeal"] + 34, 0.4)
        elif sid == "C7":
            marks = {"w1": word(0, "Chính"), "w2": word(0, "Người"), "w3": word(0, "Cộng"), "converge": at(1) - 6, "name": at(2) - 4, "final": ln[2]["to"] + 6}
            for k, v in (("w1", 0.45), ("w2", 0.5), ("w3", 0.55)):
                sfx("trong.wav", marks[k], v)
            sfx("doi-tram.wav", marks["name"], 0.35)
        clips = {k: v for k, v in clips.items() if v}
        draft = draft or any(c.get("placeholder") for c in clips.values())
        m = meta[sid]
        scenes.append({
            "id": sid, "title": m["title"], "theme": m["theme"], "from": F0, "duration": dur,
            "enter": m["enter"], "exit": m["exit"], "backdrop": backdrops[sid], "chip": m["chip"], "tag": m["tag"],
            "lines": ln, "subtitles": subs, "marks": marks, "clips": clips, "text": texts[sid],
            "images": {k: v for k, v in images.items() if v}, "waves": waves, "sounds": sounds,
        })

    data = {"version": 1, "fps": FPS, "width": 1920, "height": 1080, "durationInFrames": durationInFrames, "seconds": round(total, 2),
            "timing": "voice" if voice else "estimate", "beats": "T/nhac/phach.json" if music["src"] else None, "draft": draft, "music": music, "scenes": scenes}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"Ghi {OUT}")
    for s in scenes:
        print(f"  {s['id']:3} {s['from'] / FPS:6.2f}–{(s['from'] + s['duration']) / FPS:6.2f} s  ({s['duration'] / FPS:5.2f} s)  {s['title']}"
              + ("  [giữ chỗ: " + ", ".join(k for k, c in s["clips"].items() if c.get("placeholder")) + "]" if any(c.get("placeholder") for c in s["clips"].values()) else ""))
    if music["src"]:
        print(f"Nhạc vào ở {music['from'] / FPS:.2f} s, điểm bung {music['bungAt']:.2f} s (C6 bắt đầu {c6_start:.2f} s)")
    print(f"Tổng: {total:.2f} s = {durationInFrames} khung · lời: {'mốc thật' if voice else 'ước 13,5 ký tự/giây'}")
    if not (MIN_S <= total <= MAX_S):
        print(f"LỖI: tổng {total:.2f} s nằm ngoài {MIN_S:.0f}–{MAX_S:.0f} s", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
