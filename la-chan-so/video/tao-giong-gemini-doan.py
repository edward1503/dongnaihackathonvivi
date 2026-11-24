"""Tạo thoại bằng Gemini TTS theo từng đoạn: đọc cả bài một lần thì giọng tụt tông giữa chừng (đo 21/11: 124 → 104 Hz
từ đoạn 4 tới 15), còn đoạn ngắn thì giữ đều. Cùng giọng, cùng lời dặn phong cách cho mọi đoạn; ghép với khoảng lặng cố định,
rồi xu-ly-giong.py lọc, cân âm lượng và cắt cảnh.

    python tao-giong-gemini-doan.py --script loi-thoai-full-vi.txt --name Charon-doan-full-vi [--redo 2 5]

Ra: giong/<name>-doan/doan-NN.wav (đoạn đã có thì không gọi lại), giong/<name>-goc.wav.
"""
import argparse
import io
import json
import re
import sys
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tts import synth  # noqa: E402

VOICE = "Charon"
MODEL = "gemini-3.8-flash-tts"
STYLE = "Người dẫn video giới thiệu sản phẩm: giọng nam tự tin, ấm, rõ ràng, tốc độ vừa phải, nghỉ tự nhiên giữa các đoạn."
# Cách đọc chuẩn của tên công ty: đánh vần từng chữ kiểu tiếng Anh "ét xi ô ây ai".
SAY = [("SCOAI", "ét xi ô ây ai")]
LEAD, GAP, TAIL = 0.35, 0.95, 0.8


def paragraphs(script):
    parts = [re.sub(r"<[^>]+>", " ", p).strip() for p in re.split(r"\n\s*\n", script.strip())]
    return [re.sub(r"\s+", " ", p) for p in parts if p]


def spoken(text):
    for a, b in SAY:
        text = text.replace(a, b)
    return text


def read(path):
    with wave.open(str(path)) as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.getframerate(), np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)


def trim(x, sr, floor_db=-45.0):
    """Cắt khoảng lặng thừa ở hai đầu đoạn (giữ 40 ms) để khoảng nghỉ giữa các đoạn đều nhau."""
    hop = sr // 100
    n = len(x) // hop
    rms = np.sqrt(((x[: n * hop].astype(np.float32).reshape(n, hop) / 32768) ** 2).mean(axis=1)) + 1e-12
    loud = np.flatnonzero(20 * np.log10(rms) > floor_db)
    if not len(loud):
        return x
    keep = int(0.04 * sr)
    return x[max(0, loud[0] * hop - keep): min(len(x), (loud[-1] + 1) * hop + keep)]


def make(i, text, out):
    audio, mime, key = synth(spoken(text), VOICE, STYLE, MODEL)
    if not audio[:4] == b"RIFF":
        raise SystemExit(f"đoạn {i + 1}: Gemini trả {mime}, không phải WAV")
    out.write_bytes(audio)
    sr, x = read(out)
    return {"doan": i + 1, "chars": len(text), "seconds": round(len(x) / sr, 2), "key": f"#{key + 1}"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", type=Path, required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--redo", type=int, nargs="*", default=[])
    a = ap.parse_args()
    paras = paragraphs(a.script.read_text(encoding="utf-8"))
    folder = HERE / "giong" / f"{a.name}-doan"
    folder.mkdir(parents=True, exist_ok=True)
    for n in a.redo:
        old = folder / f"doan-{n:02d}.wav"
        k = 1
        while (folder / f"doan-{n:02d}-cu-{k}.wav").exists():
            k += 1
        old.rename(folder / f"doan-{n:02d}-cu-{k}.wav")
    todo = [(i, p, folder / f"doan-{i + 1:02d}.wav") for i, p in enumerate(paras) if not (folder / f"doan-{i + 1:02d}.wav").exists()]
    with ThreadPoolExecutor(4) as pool:
        for row in pool.map(lambda job: make(*job), todo):
            print(json.dumps(row, ensure_ascii=False), flush=True)
    rate = None
    pieces = []
    for i in range(len(paras)):
        sr, x = read(folder / f"doan-{i + 1:02d}.wav")
        assert rate in (None, sr), "các đoạn khác tần số lấy mẫu"
        rate = sr
        if not pieces:
            pieces.append(np.zeros(int(LEAD * sr), dtype=np.int16))
        pieces += [trim(x, sr), np.zeros(int((GAP if i + 1 < len(paras) else TAIL) * sr), dtype=np.int16)]
    goc = HERE / "giong" / f"{a.name}-goc.wav"
    with wave.open(str(goc), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(np.concatenate(pieces).tobytes())
    print(json.dumps({"name": a.name, "paragraphs": len(paras), "new_calls": len(todo), "sample_rate": rate,
                      "seconds": round(sum(len(p) for p in pieces) / rate, 1), "out": str(goc.relative_to(HERE))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
