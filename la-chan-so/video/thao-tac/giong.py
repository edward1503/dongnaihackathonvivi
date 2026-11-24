"""Giọng cho video thao tác: đọc theo nhóm bước (ít lượt gọi VieNeu), rồi căn mốc từng câu bằng Whisper và tách theo bước.

    uv run --no-project --with numpy python giong.py doc v1     # nhóm bước → gọi VieNeu (chỉ nhóm mới hoặc đổi chữ)
    python3 giong.py can v1                                     # gửi giọng nhóm lên máy chủ, Whisper căn mốc câu
    python3 giong.py tach v1                                    # cắt giọng nhóm thành giong/v1/<bước>.wav + <bước>.cau.json

Phụ đề giữ chữ gốc; chỉ phần gửi VieNeu được đổi cách đọc (NOI) cho từ viết tắt.
"""
import os
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
VIDEO = HERE.parent
MAX_CHARS = 100000   # Lá chắn số: cả video thu MỘT lượt (giọng không lệch tông), rồi Whisper căn câu và cắt
SSH = ["ssh", "-F", "/dev/null", "-S", str(Path.home() / ".ssh/scoai-eval.sock"), "-o", "BatchMode=yes", os.environ.get("LCS_RENDER_HOST", "user@may-chu-render")]
REMOTE = "lcs-video/asr"
ONE = __import__("os").environ.get("ONE", "1") != "0"   # ONE=0: tách nhóm theo chương như cũ
NOI = [  # cách đọc cho Gemini TTS (khớp cả từ)
    ("AI", "ây ai"), ("app", "áp"), ("120", "một trăm hai mươi"), ("35%", "ba mươi lăm phần trăm"), ("18", "mười tám"),
    ("4", "bốn"), ("11", "mười một"), ("65", "sáu mươi lăm"), ("OTP", "ô tê pê"), ("QR", "kiu a"),
]


def noi(text):
    for a, b in NOI:
        text = re.sub(rf"(?<![\w/]){re.escape(a)}(?![\w/])", b, text)
    return text[:1].upper() + text[1:]


def says(step):
    s = step.get("say")
    return s if isinstance(s, list) else ([s] if s else [])


def groups(name):
    data = json.loads((HERE / name / "buoc.json").read_text())
    out, cur, size = [], [], 0
    for step in data["steps"]:
        if step["kind"] == "chapter":
            if ONE:
                continue
            if cur:
                out.append(cur); cur, size = [], 0
            continue
        n = len(" ".join(says(step)))
        if not ONE and (step["kind"] in ("intro", "outro") or step.get("rieng")):
            if cur:
                out.append(cur)
            out.append([step]); cur, size = [], 0
            continue
        if cur and size + n > MAX_CHARS:
            out.append(cur); cur, size = [], 0
        cur.append(step); size += n
    if cur:
        out.append(cur)
    return [{"steps": [{"id": s["id"], "says": says(s), "noi": [noi(x) for x in says(s)]} for s in g],
             "text": " ".join(noi(x) for s in g for x in says(s))} for g in out]


def doc(name):
    """Gọi VieNeu cho nhóm có chữ mới. Nhóm trùng chữ với lần trước dùng lại tệp cũ dù thứ tự nhóm đã đổi."""
    import hashlib
    import shutil
    folder = HERE / "giong" / name
    folder.mkdir(parents=True, exist_ok=True)
    gs = groups(name)
    old_file = folder / "nhom.json"
    old = json.loads(old_file.read_text()) if old_file.exists() else []
    wavs = VIDEO / "giong" / f"TT-{name}-doan"
    wavs.mkdir(parents=True, exist_ok=True)
    # Tốc độ đọc khác 1 thì là bản giọng khác: khóa bộ nhớ đệm gồm cả tốc độ (tốc độ 1 giữ khóa cũ).
    speed = float(__import__("os").environ.get("VIENEU_SPEED", "1"))
    key = lambda text: hashlib.sha256((text if speed == 1 else f"{text}|speed={speed}").encode()).hexdigest()[:16]
    kho = wavs / "theo-noi-dung"
    kho.mkdir(exist_ok=True)
    def key_at(text, at):
        return hashlib.sha256((text if at == 1 else f"{text}|speed={at}").encode()).hexdigest()[:16]
    for i, g in enumerate(old):                       # cất tệp cũ theo nội dung và đúng tốc độ đã đọc
        f = wavs / f"doan-{i + 1:02d}.wav"
        stored = kho / f"{key_at(g['text'], g.get('speed', 1))}.wav"
        if f.exists() and not stored.exists():
            shutil.copy2(f, stored)
    todo = []
    for i, g in enumerate(gs):
        f = wavs / f"doan-{i + 1:02d}.wav"
        src = kho / f"{key(g['text'])}.wav"
        if src.exists():
            shutil.copy2(src, f)
        else:
            if f.exists():
                f.unlink()
            todo.append(i + 1)
    for f in wavs.glob("doan-*.wav"):                 # nhóm thừa khi số nhóm giảm
        if f.stem.count("-") == 1 and int(f.stem.split("-")[1]) > len(gs):
            f.unlink()
    script = folder / "nhom.txt"
    script.write_text("\n\n".join(g["text"] for g in gs) + "\n", encoding="utf-8")
    print(f"{name}: {len(gs)} nhóm, sẽ gọi VieNeu {len(todo)} lượt (nhóm {todo})")
    if "--thu" in sys.argv:
        return
    if todo:
        subprocess.run([sys.executable, str(VIDEO / "tao-giong-gemini-mot.py"), "--script", str(script), "--name", f"TT-{name}"], check=True, cwd=VIDEO)
    old_file.write_text(json.dumps([dict(g, speed=speed) for g in gs], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def can(name):
    """Whisper (large-v3-turbo, GPU máy chủ) chép lời có mốc từng từ; căn câu bằng so khớp ký tự."""
    gs = json.loads((HERE / "giong" / name / "nhom.json").read_text())
    wavs = VIDEO / "giong" / f"TT-{name}-doan"
    job = HERE / "giong" / name / "can"
    job.mkdir(exist_ok=True)
    pairs = []
    for i, g in enumerate(gs):
        pairs.append({"wav": f"doan-{i + 1:02d}.wav", "sentences": [x for s in g["steps"] for x in s["noi"]]})
    (job / "viec.json").write_text(json.dumps(pairs, ensure_ascii=False))
    subprocess.run(SSH + [f"mkdir -p ~/{REMOTE}/{name}"], check=True)
    files = [str(wavs / p["wav"]) for p in pairs] + [str(job / "viec.json"), str(HERE / "can-cau.py")]
    subprocess.run(["rsync", "-a", "-e", " ".join(SSH[:-1]), *files, f"{SSH[-1]}:{REMOTE}/{name}/"], check=True)
    subprocess.run(SSH + [f"cd ~/{REMOTE}/{name} && HF_HOME=~/sc2-tradeagent/asr/hf ~/sc2-tradeagent/asr/.venv/bin/python can-cau.py viec.json moc.json"], check=True)
    subprocess.run(["rsync", "-a", "-e", " ".join(SSH[:-1]), f"{SSH[-1]}:{REMOTE}/{name}/moc.json", str(job / "moc.json")], check=True)
    print("đã căn mốc:", job / "moc.json")


def read(path):
    with wave.open(str(path)) as w:
        return w.getframerate(), w.readframes(w.getnframes()), w.getsampwidth(), w.getnchannels()


def tach(name):
    gs = json.loads((HERE / "giong" / name / "nhom.json").read_text())
    moc = json.loads((HERE / "giong" / name / "can" / "moc.json").read_text())
    wavs = VIDEO / "giong" / f"TT-{name}-doan"
    out = HERE / "giong" / name
    for i, g in enumerate(gs):
        sr, raw, width, ch = read(wavs / f"doan-{i + 1:02d}.wav")
        frame = width * ch
        total = len(raw) / frame / sr
        marks = moc[i]["marks"]                     # [[start, end], ...] theo câu trong cả nhóm
        k = 0
        bounds = []
        for s in g["steps"]:
            n = len(s["says"])
            bounds.append((k, k + n))
            k += n
        for j, (s, (a, b)) in enumerate(zip(g["steps"], bounds)):
            # Cắt ở giữa khoảng lặng giữa câu cuối bước này và câu đầu bước sau.
            cut0 = 0.0 if j == 0 else (marks[a - 1][1] + marks[a][0]) / 2
            cut1 = total if j == len(g["steps"]) - 1 else (marks[b - 1][1] + marks[b][0]) / 2
            lead = max(0.0, marks[a][0] - cut0 - 0.12)     # bỏ lặng đầu, giữ 0,12 s
            start = cut0 + lead
            seg = raw[int(start * sr) * frame: int(cut1 * sr) * frame]
            with wave.open(str(out / f"{s['id']}.wav"), "wb") as w:
                w.setnchannels(ch); w.setsampwidth(width); w.setframerate(sr); w.writeframes(seg)
            rows = [{"text": s["says"][q], "start": round(marks[a + q][0] - start, 3), "end": round(marks[a + q][1] - start, 3)} for q in range(b - a)]
            (out / f"{s['id']}.cau.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{name}: đã tách {sum(len(g['steps']) for g in gs)} bước")


if __name__ == "__main__":
    {"doc": doc, "can": can, "tach": tach}[sys.argv[1]](sys.argv[2])
