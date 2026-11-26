#!/usr/bin/env python3
"""Tờ soát LCSTrailer2: ghép T/soat2/anh/<khung>.jpg theo từng phần thành T/soat2/phan-<id>.jpg.
  python3 to-soat2.py --khung   # in danh sách khung nên render (20%, 55%, 90% mỗi phần và lúc mảnh phóng to đứng yên)
"""
import glob, json, os, subprocess, sys
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(T, "../remotion/src/data/trailer2.json"), encoding="utf-8"))
if "--khung" in sys.argv:
    out = []
    for s in d["sections"]:
        F, D = s["from"], s["duration"]
        pts = {int(D * 0.2), int(D * 0.55), int(D * 0.9)} | {min(D - 1, c["at"] + 30) for c in s.get("callouts", [])}
        out += [F + p for p in sorted(pts)]
    print(" ".join(map(str, out + [d["durationInFrames"] - 1])))
    sys.exit()
have = {int(os.path.basename(p)[:-4]): p for p in glob.glob(os.path.join(T, "soat2/anh/*.jpg"))}
for s in d["sections"]:
    fr = sorted(k for k in have if s["from"] <= k < s["from"] + s["duration"] or (s is d["sections"][-1] and k >= s["from"]))
    if not fr:
        continue
    tmp = []
    for k in fr:
        p = f"/tmp/claude-1000/soat2-{k}.jpg"
        subprocess.run(["magick", have[k], "-resize", "960x540", "-gravity", "NorthWest", "-fill", "#FFCE02", "-undercolor", "#000000B0",
                        "-pointsize", "26", "-annotate", "+10+8", f" {s['id']} · khung {k} · {k / 30:.2f}s ", p], check=True)
        tmp.append(p)
    out = os.path.join(T, f"soat2/phan-{s['id']}.jpg")
    subprocess.run(["magick", "montage", *tmp, "-tile", "2x", "-geometry", "+6+6", "-background", "#222", out], check=True)
    for p in tmp:
        os.remove(p)
    print(out)
