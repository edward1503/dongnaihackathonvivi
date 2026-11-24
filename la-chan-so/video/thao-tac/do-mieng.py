"""Đo khẩu hình chị Lan trong đoạn gọi video: độ mượt (cặp khung đổi hình, đứng hình dài nhất) và độ lệch tiếng so với miệng.

    uv run --no-project --with numpy python do-mieng.py <doan/vy-goi.mp4> <doan.json> [x y w h]

Vùng miệng mặc định (px của khung quay 1440x810): 490,322,80,46. Độ lệch: tương quan chéo giữa chuyển động vùng miệng (30 khung/s)
và đường bao âm lượng của chi-lan-*.m4a đặt tại mốc start THẬT (sự kiện start thứ hai; cái đầu là OfflineAudioContext của to16k).
lag > 0: miệng chạy SAU mốc start chừng đó giây → phải đặt tiếng trễ thêm chừng đó.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
mp4, meta = sys.argv[1], json.loads(Path(sys.argv[2]).read_text())["vy-goi"]
x, y, w, h = (int(v) for v in sys.argv[3:7]) if len(sys.argv) > 6 else (490, 322, 80, 46)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-vf", f"crop={w}:{h}:{x}:{y},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))            # chuyển động giữa khung i và i+1
AUD = Path(__file__).resolve().parents[2] / "prototype" / "audio"
ev = [e for e in meta["events"] if e["type"] == "audio" and e["k"] == "start" and e["src"].startswith("chi-lan")]
starts = {}
for e in ev:
    starts[e["src"]] = e["t"]                                # giữ sự kiện SAU CÙNG của mỗi file (phát thật)
tot_pairs = tot_move = 0; longest = 0; lags = []
for src, t0 in sorted(starts.items()):
    pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(AUD / src), "-ac", "1", "-ar", "48000", "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
    n = len(pcm) // 1600
    env = np.sqrt((pcm[: n * 1600].reshape(n, 1600) ** 2).mean(axis=1))      # 30 Hz
    dur = len(pcm) / 48000
    i0, i1 = int(round((t0 + 0.25) * 30)), int(round((t0 + 0.25 + dur) * 30))
    seg = d[i0:i1]
    voiced = np.interp(np.arange(len(seg)), np.arange(n), env)[: len(seg)] > 0.02   # chỉ tính lúc đang có tiếng
    mv = seg > 0.35
    tot_pairs += int(voiced.sum()); tot_move += int((mv & voiced).sum())
    run = 0
    for a, b in zip(mv, voiced):
        run = run + 1 if (b and not a) else 0
        longest = max(longest, run)
    best = None
    for lag in range(-15, 25):                               # khung
        j0 = int(round(t0 * 30)) + lag
        m = d[j0: j0 + n]
        if len(m) < n: continue
        c = np.corrcoef(m, env)[0, 1]
        if best is None or c > best[0]: best = (c, lag)
    lags.append((src, round(best[1] / 30, 3), round(float(best[0]), 3), round(dur, 2)))
print(f"cặp khung đổi hình lúc chị Lan có tiếng: {tot_move}/{tot_pairs} = {100 * tot_move / max(1, tot_pairs):.0f}% ; đứng hình dài nhất {longest} khung")
print("độ trễ miệng so với mốc start thật (file, giây, tương quan, dài):", lags)
