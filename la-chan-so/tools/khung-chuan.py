#!/usr/bin/env python3
"""Chọn DÁNG CHUẨN cho một nhân vật LiteAvatar: khung tham chiếu gần dáng trung bình nhất (đầu thẳng, nhìn thẳng),
rồi ghi vào meta.json của nhân vật dưới tên "khung_noi". Trình phát (hoc-lite.js) đưa nhân vật về khung này khi nói và
đứng yên tới hết câu; tools/dung-mieng.py dựng hình miệng cho đúng khung này. Ý người dùng 25/11/2026: khi nói thì về
trạng thái bình thường, hạn chế lắc đầu, ghép miệng mới chuẩn.
    <python có numpy, Pillow> tools/khung-chuan.py <mã nhân vật> [--ghi]"""
import io, json, os, sys
import numpy as np
from PIL import Image
ma = sys.argv[1]
goc = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vendor/vlearn-avatar/stage/_shared/voice/models/lite", ma)
meta = json.load(open(os.path.join(goc, "meta.json"))); refs = open(os.path.join(goc, "refs.bin"), "rb").read(); off = meta["ref_offsets"]
anh = np.stack([np.asarray(Image.open(io.BytesIO(refs[off[k]:off[k + 1]])).convert("L").resize((96, 96)), np.float32) for k in range(meta["refs"])])
lech = ((anh - anh.mean(0)) ** 2).mean((1, 2)); k = int(lech.argmin())
print(f"nhân vật {ma}: khung chuẩn {k} (lệch {lech[k]:.1f}, trung bình {lech.mean():.1f}); cử động trung bình mỗi khung {np.abs(np.diff(anh, axis=0)).mean():.2f}")
# Khung chớp mắt (người dùng 25/11: đứng im thì hơi giả, mắt cũng phải cử động): khung trong video gốc mà dải mắt khác dáng chuẩn
# nhiều nhất trong khi phần còn lại của mặt gần dáng chuẩn nhất. Trình phát hoà khung này vào vùng mắt vài giây một lần khi đang nói.
import subprocess
W, H = meta["size"]; wp = meta["warp"]; s = 4
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(goc, "person.mp4"), "-vf", f"crop={W}:{H}:0:0,scale={W // s}:{H // s},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, H // s, W // s).astype(np.float32)
cx, cy, fw, fh = wp["cx"], wp["cy"], wp["fw"], wp["fh"]
mat_px = [cx - 0.42 * fw, cy - 0.42 * fh, cx + 0.42 * fw, cy - 0.12 * fh]   # dải mắt, toạ độ điểm ảnh của hình gốc
ex0, ey0, ex1, ey1 = [int(round(x / s)) for x in mat_px]
fx0, fy0, fx1, fy1 = int((cx - 0.6 * fw) / s), int((cy - 0.6 * fh) / s), int((cx + 0.6 * fw) / s), int((cy + 0.6 * fh) / s)
chuan = v[k]; ngoai = np.ones_like(chuan, bool); ngoai[ey0:ey1, ex0:ex1] = False
dmat = np.abs(v[:, ey0:ey1, ex0:ex1] - chuan[ey0:ey1, ex0:ex1]).mean((1, 2))
dngoai = np.array([np.abs(f - chuan)[fy0:fy1, fx0:fx1][ngoai[fy0:fy1, fx0:fx1]].mean() for f in v])
chop = int(np.argmax(dmat - 2.0 * dngoai))
print(f"khung chớp mắt {chop} (dải mắt khác {dmat[chop]:.1f}, phần còn lại khác {dngoai[chop]:.1f}): MỞ ẢNH RA XEM cho chắc là mắt nhắm")
if "--ghi" in sys.argv:
    meta["khung_noi"] = k; meta["khung_chop"] = chop; meta["mat"] = [round(x, 1) for x in mat_px]
    json.dump(meta, open(os.path.join(goc, "meta.json"), "w")); print("đã ghi khung_noi, khung_chop, mat vào meta.json")
