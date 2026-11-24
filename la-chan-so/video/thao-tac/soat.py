"""Ghép khung soát cho từng đoạn quay: một khung sau mỗi mốc câu (+1,6 s) và khung cuối."""
import json, subprocess, sys, bisect
from pathlib import Path
d = Path(sys.argv[1]); out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
only = sys.argv[3:]
L = json.loads((d / "log.json").read_text())
ts = [f["t"] for f in L["frames"]]
def frame_at(t):
    i = max(0, min(len(ts) - 1, bisect.bisect_right(ts, t) - 1)); return d / "frames" / L["frames"][i]["name"]
for s in L["segs"]:
    if only and s["name"] not in only: continue
    times = [min(s["end"], b["t"] + 1.6) for b in s["beats"]] + [s["end"] - 0.05]
    args = []
    for t in times: args += ["-i", str(frame_at(t))]
    k = len(times)
    fc = "".join(f"[{i}:v]scale=960:-1[v{i}];" for i in range(k)) + "".join(f"[v{i}]" for i in range(k)) + f"hstack=inputs={k}[o]" if k > 1 else "[0:v]scale=960:-1[o]"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args, "-filter_complex", fc, "-map", "[o]", "-frames:v", "1", str(out / f"{s['name']}.jpg")], check=True)
    print(s["name"], f"{s['end']-s['start']:.1f}s", len(s["beats"]), "mốc", len([e for e in s["events"] if e["type"] in ("aim","look")]), "mục tiêu")
