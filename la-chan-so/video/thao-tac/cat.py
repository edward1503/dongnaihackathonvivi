"""Cắt khung quay (ghi.mjs) thành từng đoạn video 30 khung/giây, một đoạn cho mỗi bước, kèm mốc thao tác tính từ đầu đoạn.

    python3 cat.py v1            # đọc v1/quay/{frames,log.json}, ghi v1/doan/<bước>.mp4 và v1/doan/doan.json
    python3 cat.py v1 nguon scan # chỉ cắt lại vài đoạn

Khung screencast có mốc thời gian thật (không đều); concat demuxer giữ đúng thời lượng từng khung rồi ép về 30 khung/giây.
"""
import bisect
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
FPS = 30


def cut(name, only=()):
    base = HERE / name
    log = json.loads((base / "quay" / "log.json").read_text())
    frames = log["frames"]
    ts = [f["t"] for f in frames]
    out = base / "doan"
    out.mkdir(exist_ok=True)
    meta_file = out / "doan.json"
    meta = json.loads(meta_file.read_text()) if meta_file.exists() and only else {}
    for seg in log["segs"]:
        if only and seg["name"] not in only:
            continue
        start, end = seg["start"], seg["end"]
        i0 = max(0, bisect.bisect_right(ts, start) - 1)       # khung đang hiện lúc mở đoạn
        i1 = max(i0 + 1, bisect.bisect_right(ts, end))
        rows = []
        for i in range(i0, i1):
            a = max(start, ts[i])
            b = ts[i + 1] if i + 1 < len(ts) else end
            b = min(b, end)
            if b - a <= 0:
                continue
            rows.append(f"file '{(base / 'quay' / 'frames' / frames[i]['name']).as_posix()}'\nduration {b - a:.4f}")
        lst = out / f"{seg['name']}.txt"
        # concat demuxer bỏ thời lượng của khung cuối: lặp khung cuối một lần
        lst.write_text("\n".join(rows) + "\n" + rows[-1].split("\n")[0] + "\n")
        mp4 = out / f"{seg['name']}.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
                        "-movflags", "+faststart", str(mp4)], check=True)
        lst.unlink()
        n = int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries",
                                "stream=nb_read_packets", "-of", "csv=p=0", str(mp4)], capture_output=True, text=True).stdout.strip())
        rel = lambda t: round(t - start, 3)
        meta[seg["name"]] = {
            "frames": n, "seconds": round(n / FPS, 3),
            "beats": [rel(b["t"]) for b in sorted(seg["beats"], key=lambda b: b["n"])],
            "events": [{**{k: v for k, v in e.items() if k != "t"}, "t": rel(e["t"])} for e in seg["events"]],
        }
        print(f"{seg['name']}: {n} khung, {n / FPS:.1f} s")
    meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    cut(sys.argv[1], set(sys.argv[2:]))
