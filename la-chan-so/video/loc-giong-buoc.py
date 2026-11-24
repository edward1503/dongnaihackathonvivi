"""Soát và lọc giọng dẫn đã tách theo bước (thao-tac/giong/v1/*.wav), logic theo tools/loc-giong.py.

    python3 loc-giong-buoc.py thao-tac/giong/v1            # đo + lọc tại chỗ (bản gốc cất ở <thư mục>/goc/)
    python3 loc-giong-buoc.py --do <file.wav|mp4>          # chỉ đo: đỉnh, cụm bật to sau khoảng im ở 300 ms đầu/cuối và trong cả file

Lọc: cắt cụm nổ ở đuôi/đầu (khung 10 ms im < -45 dB rồi bật > -30 dB), highpass 70 Hz, adeclick, hạ cho đỉnh <= -3 dBFS,
fade vào 20 ms / ra 30 ms, limiter -3,6 dBFS. Click đầu file thì làm câm 30 ms đầu, không cắt đầu nên mốc câu (cau.json) giữ nguyên.
"""
import array
import math
import shutil
import subprocess
import sys
from pathlib import Path

SR = 24000
W = SR // 100


def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    a = array.array("h"); a.frombytes(raw[: len(raw) // 2 * 2]); return a


def db(seg):
    return 20 * math.log10(max(1, math.sqrt(sum(x * x for x in seg) / max(1, len(seg)))) / 32768)


def peak_db(a):
    return 20 * math.log10(max(1, max(abs(x) for x in a)) / 32768)


def bursts(a):
    """Cụm to (> -10 dB) dài 30–150 ms, đứng sau ít nhất 100 ms im (< -45 dB): kiểu tiếng 'rẹt'."""
    fr = [db(a[k:k + W]) for k in range(0, len(a) - W, W)]
    out, i = [], 0
    while i < len(fr):
        if fr[i] > -10 and i >= 10 and max(fr[i - 10:i]) < -45:
            j = i
            while j < len(fr) and fr[j] > -30:
                j += 1
            if 3 <= j - i <= 15:
                out.append((round(i / 100, 2), round((j - i) * 10)))
            i = j
        i += 1
    return out


def edges(a):
    n = len(a); note = []
    for k in range(max(W, n - W * 30), n - W, W):
        if db(a[k:k + W]) > -30 and db(a[k - W:k]) < -45:
            note.append(("duoi", (k - W // 2) / SR)); break
    if n > W * 6 and db(a[:W]) > -30 and db(a[W * 4:W * 5]) < -45:
        note.append(("dau", 0.03))
    return note


def measure(path):
    a = pcm(path)
    return {"file": Path(path).name, "giay": round(len(a) / SR, 2), "dinh_dB": round(peak_db(a), 2), "bien": edges(a), "cum_to": bursts(a)}


def clean(path, keep):
    a = pcm(path); n = len(a)
    end, head = n / SR, 0.0
    for kind, t in edges(a):
        if kind == "duoi":
            end = t
        if kind == "dau":
            head = 0.03       # click đầu file: làm câm 30 ms đầu (không cắt, để giữ mốc câu)
    pk = peak_db(a)
    gain = min(0.0, -4.0 - pk)
    chain = (f"atrim=end={end:.3f},asetpts=PTS-STARTPTS,highpass=f=70,adeclick,volume={gain:.2f}dB,"
             f"afade=t=in:st={head}:d=0.02,areverse,afade=t=in:d=0.03,areverse,alimiter=limit=0.66:level=false")
    shutil.copy2(path, keep / Path(path).name)
    tmp = Path(path).with_suffix(".tmp.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(keep / Path(path).name), "-af", chain, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(tmp)], check=True)
    tmp.replace(path)
    return round(n / SR - end, 3), round(gain, 2)


if __name__ == "__main__":
    if sys.argv[1] == "--do":
        for f in sys.argv[2:]:
            print(measure(f))
        sys.exit()
    d = Path(sys.argv[1]); keep = d / "goc"; keep.mkdir(exist_ok=True)
    for f in sorted(d.glob("*.wav")):
        src = keep / f.name if (keep / f.name).exists() else f
        if src != f:
            shutil.copy2(src, f)          # chạy lại: lọc từ bản gốc
        before = measure(f)
        cut, gain = clean(f, keep)
        after = measure(f)
        print(f.name, "trước:", before["dinh_dB"], before["bien"], before["cum_to"], "| cắt đuôi", cut, "s, gain", gain, "dB | sau:", after["dinh_dB"], after["cum_to"])
