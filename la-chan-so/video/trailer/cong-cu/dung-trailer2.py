#!/usr/bin/env python3
"""Dựng dữ liệu trailer giới thiệu sản phẩm (composition LCSTrailer2) theo T/KICH-BAN-2.md:
ghi video/remotion/src/data/trailer2.json, chép ảnh, đoạn quay, giọng, nhạc vào video/remotion/public/trailer2/.

  python3 dung-trailer2.py

Đầu vào: T/giong/cau2/cau.json + l01..l11.wav (giọng Achird, mỗi dòng lời một tệp), T/am/app/be-nai-hoi.wav,
T/am/*.wav (hiệu ứng), T/am/song/be-nai-hoi.json (sóng âm), T/nhac/tai-ve/mp3/Wildflowers.mp3 (nhạc nền).
Chữ trên hình, mốc (theo vị trí chữ trong câu), thẻ, mảnh phóng to: hàm build_sections bên dưới.
Dùng lại hàm cắt ảnh, che số của dung-trailer.py.
"""
import importlib.util, json, os, re, shutil, subprocess, sys, wave

H = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("dung1", os.path.join(H, "dung-trailer.py"))
d1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d1)

T, W, REM, SCRATCH = d1.T, d1.W, d1.REM, d1.SCRATCH
PUB2 = os.path.join(REM, "public/trailer2")
OUT = os.path.join(REM, "src/data/trailer2.json")
FPS = 30
GAP = 0.35            # nghỉ giữa hai dòng lời
BAR = 4 * 60 / 103    # một ô nhịp của "Wildflowers" (103 phách/phút)
OVER = 18             # số khung hai phần liền nhau chồng lên nhau
KR = os.path.join(SCRATCH, "khop-react/shots")

# Ảnh React một màn (786×1746), thêm vào bảng ảnh giữ chỗ của dung-trailer.py.
d1.PLACEHOLDERS.update({
    "a11a": {"src": f"{KR}/A11a.png", "w": 786, "h": 1746, "real": True},
    "a12a": {"src": f"{KR}/A12a.png", "w": 786, "h": 1746, "real": True},
    "gd-ct": {"src": f"{KR}/X-gd-ct.png", "w": 786, "h": 1746, "real": True},
    "a09a": {**d1.PLACEHOLDERS["a09a"], "real": True},
})
d1.CLIPS.update({
    "a1raw": {"file": "a1-the-do.mp4", "src": os.path.join(T, "quay/a1-the-do-raw.mp4"), "cut": (0.0, 13.9)},
    "a11a": {"file": "a11a.mp4", "ph": ["a11a"]}, "a12a": {"file": "a12a.mp4", "ph": ["a12a"]},
    "w5": {"file": "w5-truyen.mp4"}, "w6": {**d1.CLIPS["w6"], "cut": (11.5, 9.0)}, "w11": {"file": "w11-xep-hang.mp4"},
    "w9": {"file": "w9-kiem-duyet.mp4"}, "a5": {"file": "a5-dung-lai.mp4"},
})

# Khung tĩnh sạch trích từ đoạn quay (đoạn có cuộn bị rớt khung, nên chỉ dùng khung đứng yên; chuyển động do Remotion làm).
FRAMES_DIR = os.path.join(SCRATCH, "e1/khung-tinh")
STILLS = {  # tên: (tệp quay, giây, che số)
    "a1-chinh": (os.path.join(T, "quay/a1-the-do-raw.mp4"), 0.2, None),
    "a1-the-do": (os.path.join(T, "quay/a1-the-do-raw.mp4"), 8.0, [{"x": 395, "y": 140, "w": 310, "h": 80}]),
    "a1-sau": (os.path.join(T, "quay/a1-the-do-raw.mp4"), 10.0, None),
    "a5-truoc": (os.path.join(T, "quay/a5-dung-lai.mp4"), 0.3, None),
    "a5-dung": (os.path.join(T, "quay/a5-dung-lai.mp4"), 2.5, None),
    "w5-khung1": (os.path.join(T, "quay/w5-truyen.mp4"), 12.0, None),   # khung 1: "Tối thứ Sáu, Vy đang lướt điện thoại…" (khớp tiếng benai-2)
    "w5-chon": (os.path.join(T, "quay/w5-truyen.mp4"), 42.3, None),
    "minh-goi": ("/tmp/claude-1000/lcs-ph/anh/quay-minh11/minh.mp4", 11.8, None),
}


def prep_stills():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    for name, (src, t, masks) in STILLS.items():
        out = os.path.join(FRAMES_DIR, name + ".png")
        if not d1.newer(out, src):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", src, "-frames:v", "1", out], check=True)
        d1.PLACEHOLDERS[name] = {"src": out, "w": 1080, "h": 2400, "real": True, **({"masks": masks} if masks else {})}
    for n in ("3-truoc", "4-sau-len-hang", "5-cac-truong"):
        d1.PLACEHOLDERS["lb-" + n] = {"src": os.path.join(T, f"quay/lb-moi-{n}.png"), "w": 1176, "h": 2616, "real": True}
    d1.CLIPS.update({
        "a1s": {"file": "-", "ph": ["a1-chinh", "a1-the-do", "a1-sau"]},
        "a5s": {"file": "-", "ph": ["a5-truoc", "a5-dung"]},
        "w5s": {"file": "-", "ph": ["w5-khung1", "w5-chon"]},
        "minhs": {"file": "-", "ph": ["minh-goi"]},
        "lbs": {"file": "-", "ph": ["lb-3-truoc", "lb-4-sau-len-hang", "lb-5-cac-truong"]},
    })


# Tiếng trong app thêm (cắt ở chỗ lặng, lọc rẹt bằng video/loc-giong-buoc.py): tên: (nguồn, từ giây, tới giây, phụ đề)
APP_CUTS = {
    "benai-ke-vy": (os.path.join(W, "prototype/audio/benai-2.m4a"), 0.78, 3.86, "Bé Nai kể: “Tối thứ Sáu, Vy đang lướt điện thoại thì có tin nhắn lạ…”"),
    "minh-mo-dau": (os.path.join(W, "prototype/audio/minh/b1-mo-dau.m4a"), 0.0, 2.44, "Anh Minh (AI đóng vai): “Mẹ ơi, mẹ ơi… công an mới gọi con.”"),
}
APP_DIR = os.path.join(SCRATCH, "e1/tieng-app")


def prep_app_cuts():
    os.makedirs(APP_DIR, exist_ok=True)
    fresh = False
    for name, (src, a, b, _) in APP_CUTS.items():
        out = os.path.join(APP_DIR, name + ".wav")
        if not os.path.exists(out):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(a), "-to", str(b), "-i", src, "-af", "afade=t=out:st=%.2f:d=0.12" % (b - a - 0.12),
                            "-ar", "48000", "-ac", "1", out], check=True)
            fresh = True
    if fresh:
        subprocess.run(["python3", os.path.join(W, "video/loc-giong-buoc.py"), APP_DIR], check=True, capture_output=True)
    return {name: os.path.join(APP_DIR, name + ".wav") for name in APP_CUTS}


def slice_line(src, a, b, name):
    """Cắt một đoạn của tệp giọng (ở chỗ lặng) để chen tiếng trong app vào giữa."""
    out = os.path.join(PUB2, "giong", name + ".wav")
    if not d1.newer(out, src):
        dur = (b - a) if b else wav_seconds(src) - a
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(a), "-t", "%.3f" % dur, "-i", src,
                        "-af", "afade=t=in:d=0.02,afade=t=out:st=%.3f:d=0.04" % max(0, dur - 0.04), out], check=True)
    return out


# Vùng phóng to (px màn gốc)
RED_CARD = {"x": 30, "y": 815, "w": 1020, "h": 935}
BLOCK_BTN = {"x": 40, "y": 1350, "w": 1000, "h": 190}
QUESTION = {"x": 40, "y": 930, "w": 1000, "h": 330}
RESULT = {"x": 20, "y": 560, "w": 1040, "h": 470}
TOLD_MINH = {"x": 10, "y": 1250, "w": 1040, "h": 300}
CALL_MOM = {"x": 10, "y": 1500, "w": 766, "h": 125}
STOP_HINT = {"x": 40, "y": 1290, "w": 1000, "h": 340}
SIGN1 = {"x": 40, "y": 490, "w": 1000, "h": 100}
SIGN2 = {"x": 40, "y": 630, "w": 1000, "h": 100}
SIGN3 = {"x": 40, "y": 845, "w": 1000, "h": 100}
RANK = {"x": 40, "y": 850, "w": 1000, "h": 960}
LB_HERO = {"x": 90, "y": 665, "w": 1000, "h": 555}       # thẻ xanh "Lớp bạn · hạng 2/4" (lb-moi-3, 1176×2616)
LB_HERO_UP = {"x": 90, "y": 565, "w": 1000, "h": 655}    # thẻ "#1 · ▲ Vừa lên hạng 1" (lb-moi-4)
LB_SCHOOL = {"x": 90, "y": 255, "w": 1000, "h": 625}     # thẻ "Trường bạn · hạng 2/12" (lb-moi-5)
W9_STATS = {"x": 560, "y": 160, "w": 2320, "h": 330}
W9_VOTE = {"x": 1560, "y": 760, "w": 1320, "h": 860}
A1_MASK = [{"x": 395, "y": 140, "w": 310, "h": 80}]

FIX = {"đapp": "đáp"}   # lỗi gõ trong chữ phụ đề


def lan_moc_t(name, moc):
    return next(m["t"] for m in moc.get("moc", []) if m.get("ten") == name)


def wav_seconds(path):
    w = wave.open(path)
    return w.getnframes() / w.getframerate()


def pub(src, sub):
    dst = os.path.join(PUB2, sub, os.path.basename(src))
    if not d1.newer(dst, src):
        shutil.copy2(src, dst)
    return f"trailer2/{sub}/{os.path.basename(src)}"


def clip(cid, enter, kind="phone", stills_at=None, mapping=None, masks=None):
    c = d1.make_clip(cid, 0, {}, stills_at=stills_at)
    if not c:
        return None
    c = json.loads(json.dumps(c).replace('"trailer/', '"trailer2/'))
    c.update({"enter": enter, "kind": kind, "placeholder": False})
    if mapping:
        c["map"] = [[a, round(b * FPS)] for a, b in mapping]
    if masks:
        c["masks"] = masks
    return c


def main():
    d1.PUB = PUB2
    for sub in ("anh", "quay", "giong", "am", "nhac"):
        os.makedirs(os.path.join(PUB2, sub), exist_ok=True)
    f = lambda s: round(s * FPS)
    VOICE = "giong/cau3"   # Bé Nai dẫn (giọng Leda), b01..b13
    cau = json.load(open(os.path.join(T, VOICE, "cau.json"), encoding="utf-8"))
    L = {c["id"]: {"text": re.sub("|".join(FIX), lambda m: FIX[m.group(0)], c["text"]), "file": os.path.join(T, VOICE, c["tep"])} for c in cau}
    for v in L.values():
        v["sec"] = wav_seconds(v["file"])
    benai = os.path.join(T, "am/app/be-nai-hoi.wav")
    benai13 = os.path.join(T, "am/app/benai-13.wav")
    prep_stills()
    cuts = prep_app_cuts()
    # Gọi video với chị Lan (avatar AI mô phỏng): trang gọi video của app chạy demo tự động, quay lại (784×1744, kèm tiếng).
    # Lấy 0–12,6 s: sau đó trang hiện dòng ghi chú kỹ thuật "ĐOẠN MẪU TẠM…", không được lên hình.
    lan_mp4 = next(p for p in (os.path.join(T, "quay/lan-noi-chuyen.mp4"), os.path.join(T, "quay/lan/lan-noi-chuyen.mp4")) if os.path.exists(p))
    lan_moc = json.load(open(lan_mp4[:-4] + ".moc.json", encoding="utf-8"))
    LAN_END = 12.6
    lan_wav = os.path.join(APP_DIR, "lan-noi-chuyen.wav")
    if not d1.newer(lan_wav, lan_mp4):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", lan_mp4, "-t", str(LAN_END), "-vn", "-af", "afade=t=out:st=%.2f:d=0.3" % (LAN_END - 0.3),
                        "-ar", "48000", "-ac", "1", lan_wav], check=True)
    d1.CLIPS["lanv"] = {"file": "lan-noi-chuyen.mp4", "src": lan_mp4, "cut": (0.0, LAN_END)}
    WHO = {"Chị Lan (AI đóng vai)": "Chị Lan · AI mô phỏng", "Vy": "Vy"}
    SUB = {benai13: "Bé Nai: “Bà ơi, khoan chuyển tiền đã. Bà gọi anh Minh hỏi trước cho chắc nha.”",
           benai: "Bé Nai: “Người vừa gọi có bảo bà chuyển tiền không ạ?”"}
    SUB.update({cuts[k]: v[3] for k, v in APP_CUTS.items()})
    SUB[lan_wav] = ""

    # Bảng nhịp: (mã, các mục). Mục: ("L", mã câu) | ("A", tệp tiếng app) | ("P", giây)
    plan = [
        ("intro", [("P", 0.4), ("L", "b01")]),
        ("n2", [("L", "b02")]),
        ("n3", [("L", "b03"), ("A", benai), ("L", "b04")]),
        ("n4", [("L", "b05")]),
        ("n5", [("L", "b06"), ("A", benai13)]),
        ("n6", [("L", "b07")]),
        ("n9", [("L", "b08"), ("P", BAR)]),
        ("n7", [("L", "b09"), ("A", cuts["benai-ke-vy"]), ("L", "b10"), ("A", lan_wav), ("L", "b11")]),
        ("n8", [("L", "b12"), ("P", BAR)]),
        ("outro", [("L", "b13"), ("P", 3.4)]),
    ]
    t = 0.0
    layout = []
    for sid, items in plan:
        s0 = t
        spans = []
        for it in items:
            d = (L[it[1]]["sec"] + GAP) if it[0] == "L" else (wav_seconds(it[1]) + GAP) if it[0] == "A" else it[1]
            spans.append((it, t - s0, t - s0 + d))
            t += d
        layout.append((sid, s0, t, spans))
    total = t

    sections = []
    for sid, s0, s1, spans in layout:
        F0 = f(s0)
        D = f(s1) - F0
        lines, subs, sounds, apps = [], [], [], []
        for it, a, b in spans:
            fr, to = f(s0 + a) - F0, f(s0 + b) - F0
            if it[0] == "L":
                v = L[it[1]]
                lines.append({"id": it[1], "text": v["text"], "from": fr, "to": to})
                sounds.append({"src": pub(v["file"], "giong"), "from": fr, "volume": 1, "duck": True, "frames": to - fr})
                subs += d1.chunk_subtitle(v["text"], fr, to - 3)
            elif it[0] == "A":
                apps.append((fr, to))
                sounds.append({"src": pub(it[1], "am"), "from": fr, "volume": 1, "duck": True, "frames": to - fr})
                if it[1] == lan_wav:
                    pd = lan_moc.get("phu_de", [])
                    for k, q in enumerate(pd):
                        a_ = fr + f(q["t"]); b_ = fr + (f(pd[k + 1]["t"]) - 2 if k + 1 < len(pd) else f(LAN_END))
                        for ch in d1.chunk_subtitle(q["chu"], a_, b_, 60):
                            subs.append({**ch, "text": f"{WHO.get(q['ai'], q['ai'])}: {ch['text']}"})
                else:
                    subs.append({"text": SUB.get(it[1], ""), "from": fr, "to": to - 3})

        def at(i, frac=0.0):
            l = lines[i]
            return l["from"] + round((l["to"] - l["from"] - f(GAP)) * frac)

        def word(i, w):
            l = lines[i]
            pos = l["text"].lower().find(w.lower())
            if pos < 0:
                print(f"  (không thấy '{w}' trong {l['id']})", file=sys.stderr)
            return at(i, max(0, pos) / max(1, len(l["text"])))

        def sfx(name, fr, vol=0.5):
            p = os.path.join(T, "am", name)
            if os.path.exists(p):
                sounds.append({"src": pub(p, "am"), "from": max(0, fr), "volume": vol})

        sec = {"id": sid, "kind": "feature", "from": F0, "duration": D, "chip": None, "titles": [], "accent": "brand", "tag": None,
               "cards": [], "callouts": [], "lines": lines, "subtitles": subs, "sounds": sounds}
        C, CO = sec["cards"], sec["callouts"]
        if sid == "intro":
            sec.update({"kind": "intro", "name": "Lá chắn số", "tag": None})
            sec["subtitles"] = subs
        elif sid == "n1":
            sec.update({"titles": [{"text": "Nghe, hay *không nghe?*", "at": 6}]})
            C.append(clip("a1s", 0))
            C[-1]["stills"] = C[-1]["stills"][:1]
            sec["ring"] = {"from": 4, "to": D}
            sfx("chuong.wav", 6, 0.25); sfx("chuong.wav", 6 + 42, 0.22)
        elif sid == "n2":
            red, block, silent = word(0, "thẻ đỏ đã hiện"), word(0, "Bấm một cái"), word(0, "Còn số lạ")
            sec.update({"chip": "Cảnh báo cuộc gọi", "titles": [{"text": "Biết ngay *khi chuông đổ*", "at": 6}]})
            C.append(clip("a1s", 0, stills_at=[red, silent]))
            ph = clip("a2", 10**6)   # ảnh A03a (thẻ đỏ rõ nét) chỉ để cắt mảnh phóng to
            sec["source"] = ph
            CO.append({"card": -1, "rect": RED_CARD, "at": red, "until": block - 4, "x": 520, "y": 740, "maxW": 520, "maxH": 470, "glow": "danger"})
            CO.append({"card": -1, "rect": BLOCK_BTN, "at": block, "until": silent - 4, "x": 520, "y": 740, "maxW": 680, "maxH": 140, "glow": "danger", "pulse": True})
            sfx("tach.wav", red + 2, 0.55)
        elif sid == "n3":
            ask0, ask1 = apps[0]
            yes, result, told = word(1, "Bà chỉ cần"), word(1, "Mình ghi nhận"), word(1, "báo cho con")
            sec.update({"chip": "Sau cuộc gọi", "titles": [{"text": "Bé Nai hỏi *bằng giọng nói*", "at": 6}, {"text": "Một chữ “Có” *là xong*", "at": yes}]})
            C.append(clip("a2-hoi", 0, stills_at=[yes + 6]))
            sec["waveCard"] = {"at": ask0 - 4, "until": yes - 2, "x": 520, "y": 760,
                               "amps": json.load(open(os.path.join(T, "am/song/be-nai-hoi.json"))), "text": "Người vừa gọi có bảo bà chuyển tiền không ạ?"}
            sec["ring"] = {"from": ask0, "to": ask1, "cx": 0, "cy": -0.3}
            CO.append({"card": 0, "rect": RESULT, "at": result, "x": 520, "y": 668, "maxW": 600, "maxH": 230, "glow": "danger"})
            CO.append({"card": 0, "rect": TOLD_MINH, "at": told, "x": 520, "y": 892, "maxW": 560, "maxH": 170, "glow": "safe"})
            sfx("tinh.wav", told + 4, 0.5)
        elif sid == "n4":
            notify, call = word(0, "Mẹ vừa gặp"), word(0, "Anh Minh gọi về")
            sec.update({"chip": "Người thân", "titles": [{"text": "Người thân *biết ngay*", "at": 6}]})
            C.append(clip("a2-hoi", 0, stills_at=None))
            C[-1]["stills"] = C[-1]["stills"][1:] or C[-1]["stills"]
            C[-1]["stills"][0]["at"] = 0
            C.append(clip("m1", 22))
            sec["thread"] = {"at": 18}
            sec["notify"] = {"app": "Lá chắn số", "text": "Mẹ vừa gặp cuộc gọi đáng ngờ", "at": notify - 6, "x": 520, "y": 720}
            CO.append({"card": 1, "rect": CALL_MOM, "at": call, "x": 520, "y": 900, "maxW": 600, "maxH": 110, "glow": "safe", "pulse": True})
            sfx("rung.wav", notify - 6, 0.5)
        elif sid == "n5":
            stop = apps[0][0]   # màn đỏ hiện đúng lúc tiếng Bé Nai cất lên
            sec.update({"chip": "Trước khi chuyển tiền", "accent": "danger", "titles": [{"text": "*Dừng lại*", "at": stop - 4}]})
            C.append(clip("a5s", 0, stills_at=[stop]))
            sec["zoom"] = {"from": stop, "to": D, "scale": 1.12}
            sec["bumps"] = [stop]
            CO.append({"card": 0, "rect": STOP_HINT, "at": stop + 45, "x": 520, "y": 780, "maxW": 640, "maxH": 230, "glow": "danger"})
            sfx("doi-tram.wav", stop, 0.3)
        elif sid == "n6":
            s1, s2, s3 = word(0, "việc nhẹ"), word(0, "nạp trước"), word(0, "đường dẫn lạ")
            sec.update({"chip": "Kiểm tra tin nhắn", "titles": [{"text": "Kiểm tra *trước khi chuyển*", "at": 6}]})
            C.append(clip("w2", 0))
            for k, (r, a) in enumerate(((SIGN1, s1), (SIGN2, s2), (SIGN3, s3))):
                CO.append({"card": 0, "rect": r, "at": a - 4, "x": 500, "y": 600 + k * 118, "maxW": 760, "maxH": 76, "glow": "danger"})
                sfx("tach.wav", a - 2, 0.45)
        elif sid == "n7":
            story = word(0, "Truyện tranh")
            tell0, tell1 = apps[0]
            call0, call1 = apps[1]
            video, quiz = at(1), at(2)
            sec.update({"chip": "Học tập", "titles": [{"text": "Học *như chơi*", "at": 6}]})
            C.append(clip("a11a", 0))
            C.append(clip("w5s", story - 6, stills_at=[tell1 - 6]))   # khung 1 (Bé Nai kể) rồi ngã rẽ "Chọn đúng"
            C.append(clip("lanv", video - 6, kind="bare", mapping=[(call0, 0.0), (call0 + 376, 376 / FPS), (D, 376 / FPS)]))
            C.append(clip("a12a", quiz - 4))
            C[-1]["side"] = True   # bài kiểm tra bay vào góc phải, thẻ gọi video vẫn là thẻ chính
            sec["pill"] = {"text": "AI đóng vai · Avatar AI mô phỏng", "at": video + 4, "x": 120, "y": 520}
            CO.append({"card": 2, "rect": {"x": 50, "y": 1135, "w": 684, "h": 235}, "at": call0 + f(lan_moc_t("cham-y", lan_moc)) + 2,
                       "x": 700, "y": 780, "maxW": 520, "maxH": 220, "glow": "safe"})
            sfx("luot.wav", video - 8, 0.3)
        elif sid == "n8":
            up, school = word(0, "vừa lên hạng nhất"), word(0, "Cả trường")
            sec.update({"chip": "Thi đua", "titles": [{"text": "Thi đua lớp, *trường, phường*", "at": 6}]})
            C.append(clip("lbs", 0, stills_at=[up, school]))
            sec["bumps"] = [up, school]
            CO.append({"card": 0, "rect": LB_HERO, "at": word(0, "Kìa") - 6, "until": up - 4, "x": 500, "y": 760, "maxW": 640, "maxH": 360, "glow": "brand"})
            CO.append({"card": 0, "rect": LB_HERO_UP, "at": up + 4, "until": school - 4, "x": 500, "y": 760, "maxW": 640, "maxH": 360, "glow": "brand", "pulse": True})
            CO.append({"card": 0, "rect": LB_SCHOOL, "at": school + 6, "x": 500, "y": 760, "maxW": 640, "maxH": 360, "glow": "brand"})
            sfx("tinh.wav", up, 0.5)
        elif sid == "n9":
            src, report, review, vote, appeal, shared = (word(0, "Từ chính"), word(0, "Có cuộc gọi"), word(0, "Anh chị tình nguyện"), word(0, "bỏ phiếu"),
                                                        word(0, "Báo nhầm"), word(0, "Vậy là mọi máy"))
            sec.update({"chip": "Cộng đồng", "titles": [{"text": "Người thật báo · *Đội tình nguyện duyệt*", "at": 6}]})
            C.append(clip("a2", 0))
            C.append(clip("a6", report - 6))
            enter = report + 36
            proof = word(0, "xem bằng chứng")
            C.append(clip("w9", enter, kind="browser",
                          mapping=[(enter, 3.7), (proof - 1, 3.7 + (proof - 1 - enter) / FPS), (proof, 9.8), (vote - 1, 9.8 + (vote - 1 - proof) / FPS),
                                   (vote, 16.4), (vote + 60, 19.4), (D, 19.4)]))
            CO.append({"card": 0, "rect": RED_CARD, "at": 4, "until": report - 10, "x": 520, "y": 760, "maxW": 520, "maxH": 470, "glow": "danger"})
            CO.append({"card": 2, "rect": W9_VOTE, "at": vote + 30, "until": shared - 6, "x": 520, "y": 770, "maxW": 640, "maxH": 420, "glow": "brand"})
            sec["minis"] = {"at": shared, "n": 7}
            sec["source"] = clip("a2", 10**6)
            sfx("tach.wav", vote + 30, 0.45)
        elif sid == "outro":
            end = lines[0]["to"]
            sec.update({"kind": "outro", "name": "Lá chắn số", "tag": None, "closing": "Chuông đổ là biết. Cả nhà cùng hay.", "closingAt": end - 6,
                        "team": "Đội 18 · Vivi · Hackathon thành phố Đồng Nai 2026",
                        "credit": ["'Wildflowers' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au",
                                   "Nhạc: “Wildflowers” – Scott Buckley (www.scottbuckley.com.au), CC BY 4.0 (creativecommons.org/licenses/by/4.0), đã cắt ghép"]})
            sec["subtitles"] = sec["subtitles"]  # có phụ đề câu kết
        sec["cards"] = [c for c in sec["cards"] if c]
        sections.append(sec)

    # Bé Nai dẫn: tư thế theo nhịp, nhún theo biên độ giọng (RMS mỗi khung của các tệp giọng Bé Nai).
    for b in ("chao", "gioi-thieu", "canh-bao", "hoi", "dung-lai", "suy-nghi", "hoc", "an-mung", "bao-ve", "cam-on"):
        pub(os.path.join(T, "be-nai", b + ".png"), "anh")
    total_f = f(total)
    amps = [0.0] * (total_f + 1)
    poses = []
    S = {x["id"]: x for x in sections}
    for x in sections:
        for snd in x["sounds"]:
            name = os.path.basename(snd["src"])
            if snd.get("duck") and not name.startswith(("minh", "lan")):
                env = d1.envelope(os.path.join(PUB2, snd["src"].split("trailer2/", 1)[1]))
                for k, v in enumerate(env):
                    g = x["from"] + snd["from"] + k
                    if g <= total_f:
                        amps[g] = max(amps[g], v)
    def P(sid, fr, pose):
        poses.append({"at": S[sid]["from"] + fr, "pose": pose})
    def lw(sid, i, w):
        l = S[sid]["lines"][i]; pos = l["text"].lower().find(w.lower())
        return l["from"] + round((l["to"] - l["from"]) * max(0, pos) / max(1, len(l["text"])))
    P("intro", 0, "chao"); P("intro", lw("intro", 0, "trợ lý"), "gioi-thieu")
    P("n2", 0, "canh-bao")
    P("n3", 0, "hoi"); P("n3", S["n3"]["lines"][1]["from"], "an-mung")
    P("n4", 0, "gioi-thieu")
    P("n5", 0, "dung-lai")
    P("n6", 0, "suy-nghi")
    P("n9", 0, "bao-ve")
    P("n7", 0, "hoc"); P("n7", S["n7"]["lines"][2]["from"], "suy-nghi")
    P("n8", 0, "an-mung")
    P("outro", 0, "cam-on"); P("outro", S["outro"]["closingAt"], "chao")
    presenter = {"poses": poses, "amps": [round(v, 2) for v in amps], "introEnd": S["intro"]["from"] + S["intro"]["duration"], "outroFrom": S["outro"]["from"]}
    for x in sections:
        for co in x["callouts"]:
            strip = co["rect"]["h"] < 150
            co["x"] = 720 if strip else 700
            co["maxW"] = 580 if strip else min(co["maxW"], 520)
        if x.get("waveCard"):
            x["waveCard"]["x"] = 700
        if x.get("notify"):
            x["notify"]["x"] = 700
        if x.get("pill"):
            x["pill"].update({"x": 450, "y": 470})

    # Nhạc: "Wildflowers" từ giây 33 của bài (bỏ đoạn dạo đầu rất nhỏ, vào đúng một nhịp mạnh), phát từ giây 0 của phim.
    # Giọng ≈ −23 dBFS RMS, nhạc đoạn này ≈ −18: dưới lời 0,064 (≈ −19 dB so với giọng), chỗ thở 0,2 (≈ −10 dB).
    mp3 = os.path.join(T, "nhac/tai-ve/mp3/Wildflowers.mp3")
    music = {"src": None, "volume": 0.2, "duck": 0.32, "from": 0}
    if os.path.exists(mp3):
        dst = os.path.join(PUB2, "nhac/wildflowers-33.wav")
        if not d1.newer(dst, mp3):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "33", "-i", mp3, "-t", "118", "-af", "afade=t=in:d=0.15", "-ar", "48000", "-ac", "2", dst], check=True)
        music["src"] = "trailer2/nhac/wildflowers-33.wav"
    logo = pub(os.path.join(W, "tools/logo/logo-c.png"), "anh")
    data = {"version": 2, "fps": FPS, "width": 1920, "height": 1080, "durationInFrames": f(total), "seconds": round(total, 2), "over": OVER,
            "logo": logo, "music": music, "presenter": presenter, "sections": sections}
    open(OUT, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"Ghi {OUT}")
    for s in sections:
        print(f"  {s['id']:6} {s['from'] / FPS:6.2f}–{(s['from'] + s['duration']) / FPS:6.2f} s  " + ", ".join(
            (c.get("src") or (c.get("stills") or [{}])[0].get("image", "?")).split("/")[-1] for c in s["cards"]))
    print(f"Tổng: {total:.2f} s = {f(total)} khung")
    if not (105 <= total <= 115):
        print(f"LỖI: tổng {total:.2f} s ngoài 105–115 s", file=sys.stderr)


if __name__ == "__main__":
    main()
