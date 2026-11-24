"""Chạy trên máy chủ SCOAI: căn mốc từng câu trong một tệp giọng bằng faster-whisper (mốc từng từ) + so khớp ký tự.

    python can-cau.py viec.json moc.json      # viec.json: [{"wav": ..., "sentences": [...]}]

Ranh giới câu được dời vào giữa khoảng lặng gần nhất (năng lượng thấp nhất trong ±0,45 s) để cắt không mất âm.
"""
import difflib
import json
import re
import sys
import unicodedata
import wave

import numpy as np
from faster_whisper import WhisperModel


def norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"[^\w]", "", s)


def rms_track(path, hop=0.01):
    with wave.open(path) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() > 1:
            x = x.reshape(-1, w.getnchannels()).mean(axis=1)
    n = int(sr * hop)
    k = len(x) // n
    return np.sqrt((x[: k * n].reshape(k, n) ** 2).mean(axis=1) + 1e-12), hop, len(x) / sr


def quiet_point(rms, hop, a, b):
    """Điểm lặng nhất trong [a, b] (giây)."""
    i0, i1 = max(0, int(a / hop)), min(len(rms) - 1, int(b / hop))
    if i1 <= i0:
        return (a + b) / 2
    seg = rms[i0:i1 + 1]
    low = seg <= seg.min() * 1.6 + 1e-4
    idx = np.flatnonzero(low)
    return (i0 + (idx[0] + idx[-1]) / 2) * hop


def load16k(path):
    """Đọc wav rồi đổi về 16 kHz một kênh (PyAV trên máy chủ lệch phiên bản nên không đưa đường dẫn cho Whisper)."""
    with wave.open(path) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    n = int(len(x) * 16000 / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def align(model, path, sentences):
    segs, _ = model.transcribe(load16k(path), language="vi", word_timestamps=True, beam_size=5, vad_filter=False)
    words = [w for s in segs for w in s.words]
    hyp, owner = "", []
    for i, w in enumerate(words):
        t = norm(w.word)
        hyp += t
        owner += [i] * len(t)
    ref, spans = "", []
    for s in sentences:
        t = norm(s)
        spans.append((len(ref), len(ref) + len(t) - 1))
        ref += t
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    mapping = [None] * len(ref)
    for a, b, n in sm.get_matching_blocks():
        for q in range(n):
            mapping[a + q] = b + q
    # nội suy chỗ không khớp
    known = [(i, m) for i, m in enumerate(mapping) if m is not None]
    def hyp_at(i):
        if mapping[i] is not None:
            return mapping[i]
        left = max((k for k in known if k[0] < i), default=(0, 0), key=lambda k: k[0])
        right = min((k for k in known if k[0] > i), default=(len(ref) - 1, len(hyp) - 1), key=lambda k: k[0])
        f = (i - left[0]) / max(1, right[0] - left[0])
        return int(round(left[1] + (right[1] - left[1]) * f))
    rms, hop, total = rms_track(path)
    marks = []
    for a, b in spans:
        wa = words[owner[min(len(owner) - 1, hyp_at(a))]]
        wb = words[owner[min(len(owner) - 1, hyp_at(b))]]
        marks.append([float(wa.start), float(wb.end)])
    # Dời ranh giới giữa hai câu vào chỗ lặng.
    for k in range(len(marks) - 1):
        lo, hi = min(marks[k][1], marks[k + 1][0]) - 0.45, max(marks[k][1], marks[k + 1][0]) + 0.45
        q = quiet_point(rms, hop, lo, hi)
        marks[k][1] = min(marks[k][1], q) if marks[k][1] > q else marks[k][1]
        marks[k + 1][0] = max(marks[k + 1][0], q)
    marks[0][0] = max(0.0, marks[0][0] - 0.05)
    marks[-1][1] = min(total, marks[-1][1] + 0.05)
    score = sm.ratio()
    return {"marks": [[round(a, 3), round(b, 3)] for a, b in marks], "ratio": round(score, 3), "seconds": round(total, 3),
            "text": " ".join(w.word.strip() for w in words)}


def main():
    jobs = json.load(open(sys.argv[1]))
    model = WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device="cuda", compute_type="float16")
    out = []
    for j in jobs:
        r = align(model, j["wav"], j["sentences"])
        out.append(r)
        print(j["wav"], "khớp", r["ratio"], len(r["marks"]), "câu", flush=True)
    json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
