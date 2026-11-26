#!/usr/bin/env python3
"""Ghép ảnh soát T/soat/anh/<khung>.jpg thành tờ soát từng cảnh T/soat/canh-<C>.jpg (nhãn: khung, giây).
  python3 to-soat.py            # mọi ảnh đang có
  python3 to-soat.py --khung    # chỉ in danh sách khung nên render (đầu, mốc, giữa, cuối mỗi cảnh)
"""
import json, os, subprocess, sys, glob
H = os.path.dirname(os.path.abspath(__file__))
T = os.path.dirname(H)
DATA = os.path.join(T, "../remotion/src/data/trailer.json")
d = json.load(open(DATA, encoding="utf-8"))

if "--khung" in sys.argv:
    out = []
    for s in d["scenes"]:
        F, D = s["from"], s["duration"]
        pts = {int(D * 0.3), int(D * 0.85)} | {min(D - 1, v + 20) for v in s["marks"].values() if v >= 0}
        out += [F + p for p in sorted(pts)]
    print(" ".join(map(str, sorted(set(out)))))
    sys.exit()

have = {int(os.path.basename(p)[:-4]): p for p in glob.glob(os.path.join(T, "soat/anh/*.jpg"))}
for s in d["scenes"]:
    fr = sorted(k for k in have if s["from"] <= k < s["from"] + s["duration"])
    if not fr:
        continue
    out = os.path.join(T, f"soat/canh-{s['id']}.jpg")
    # Tờ soát hai cột, mỗi ảnh có nhãn cảnh, khung, giây.
    tmp = []
    for i, k in enumerate(fr):
        p = f"/tmp/claude-1000/to-soat-{k}.jpg"
        subprocess.run(["magick", have[k], "-resize", "960x540", "-gravity", "NorthWest", "-fill", "#FFCE02", "-undercolor", "#000000B0",
                        "-pointsize", "26", "-annotate", "+10+8", f" {s['id']} · khung {k} · {k / 30:.2f}s ", p], check=True)
        tmp.append(p)
    subprocess.run(["magick", "montage", *tmp, "-tile", "2x", "-geometry", "+6+6", "-background", "#222", out], check=True)
    for p in tmp:
        os.remove(p)
    print(out, len(fr), "ảnh")
