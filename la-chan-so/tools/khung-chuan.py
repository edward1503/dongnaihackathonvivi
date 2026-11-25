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
if "--ghi" in sys.argv:
    meta["khung_noi"] = k; json.dump(meta, open(os.path.join(goc, "meta.json"), "w")); print("đã ghi khung_noi vào meta.json")
