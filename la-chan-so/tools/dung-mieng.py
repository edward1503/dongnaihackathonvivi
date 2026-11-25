#!/usr/bin/env python3
"""Dựng sẵn hình miệng cho một câu thu sẵn của nhân vật gọi video, để điện thoại chỉ việc phát chứ không phải tính.

    <python có onnxruntime, numpy, Pillow> tools/dung-mieng.py <mã nhân vật> <tệp .lip.json> [khung bắt đầu F=0]

Vì sao cần: mô hình miệng mất 22 ms mỗi hình trên máy tính nhưng 140 ms trên điện thoại khi cuộc gọi đang chạy (đo 25/11/2026 trên
Xiaomi M2012K10C), nên tính tại chỗ chỉ được khoảng 7 hình miệng mỗi giây. Câu soạn sẵn thì dựng trước ở đây, đủ 30 hình mỗi giây.
Hình miệng phụ thuộc dáng đầu, tức phụ thuộc khung video nhân vật: tệp dựng cho câu bắt đầu ở khung F, và trình phát đưa video
nhân vật về đúng khung F trước khi nói câu đó. Kết quả: <tên>.mieng.mp4 cạnh tệp .lip.json, và trường "mieng" được ghi vào tệp json.
"""
import io, json, os, subprocess, sys
import numpy as np, onnxruntime as ort
from PIL import Image

ma, lip_f = sys.argv[1:3]
F = int(sys.argv[3]) if len(sys.argv) > 3 else 0
goc = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vendor/vlearn-avatar/stage/_shared/voice/models/lite", ma)
meta = json.load(open(os.path.join(goc, "meta.json")))
refs = open(os.path.join(goc, "refs.bin"), "rb").read()
lip = json.load(open(lip_f))
N, NR, off = 384, meta["refs"], meta["ref_offsets"]
so = ort.SessionOptions(); so.intra_op_num_threads = 4
s = ort.InferenceSession(os.path.join(goc, "lite.onnx"), so, providers=["CPUExecutionProvider"])
nho = {}
def tham_chieu(k):
    if k not in nho:
        a = np.asarray(Image.open(io.BytesIO(refs[off[k]:off[k + 1]])).convert("RGB").resize((N, N), Image.BILINEAR), np.float32)
        nho[k] = (a / 127.5 - 1).transpose(2, 0, 1)[None]
    return nho[k]
def k_cua(khung):   # cùng công thức kr() trong hoc-lite.js: đi tới rồi đi lui qua các khung tham chiếu
    j = khung % (2 * NR)
    return j if j < NR else 2 * NR - 1 - j
HN = N // 2
def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
def nua(d):   # như half(): trung bình 2×2, thang 0..255 (chưa làm tròn)
    return (d.reshape(3, HN, 2, HN, 2).mean(axis=(2, 4)) * 0.5 + 0.5) * 255
dang_khep = {}
def khep(k):  # ảnh dáng khép của khung tham chiếu k, làm tròn xuống như Uint8Array trong trình phát
    if k not in dang_khep:
        m = s.run(None, {"ref": tham_chieu(k), "params": np.asarray(meta["rest"], np.float32)[None]})[0][0]
        dang_khep[k] = np.floor(np.clip(nua(m), 0, 255))
    return dang_khep[k]
def lan(a, truc, kieu):   # cửa sổ ±2 ô theo một chiều: lớn nhất (0) hoặc trung bình các ô có thật (1)
    lop = []
    for o in range(-2, 3):
        b = np.full_like(a, np.nan); 
        if truc == 1:
            if o < 0: b[:, -o:] = a[:, :o]
            elif o > 0: b[:, :-o] = a[:, o:]
            else: b = a.copy()
        else:
            if o < 0: b[-o:, :] = a[:o, :]
            elif o > 0: b[:-o, :] = a[o:, :]
            else: b = a.copy()
        lop.append(b)
    lop = np.stack(lop)
    return np.nanmax(lop, 0) if kieu == 0 else np.nanmean(lop, 0)
bx1, by1, bx2, by2 = meta["box"]; bw, bh = bx2 - bx1, by2 - by1
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
fg = sstep(2, 20, np.minimum.reduce([xx * bw / N, (N - 1 - xx) * bw / N, yy * bh / N, (N - 1 - yy) * bh / N]))
r0, r1, c0, c1 = meta["zone"]; zx, zy, za, zb = (c0 + c1) / 2, (r0 + r1) / 2, (c1 - c0) * 0.62, (r1 - r0) * 0.62
zone = 1 - sstep(0.85, 1.15, np.hypot((xx - zx) / za, (yy - zy) / zb))
# cửa sổ quanh miệng (25/11/2026): chỗ ảnh vẽ khác dáng khép ở xa miệng (viền hàm, cổ áo) không được dán, vì trên điện thoại
# video nhân vật và video miệng lệch nhau vài khung là các chỗ đó hiện thành đường sáng nhấp nháy dọc viền hàm (thấy rõ ở avatar 125, 117)
cua = 1 - sstep(1.0, 1.3, np.hypot((xx - zx) / za, (yy - zy) / zb))
prot_anh = np.asarray(Image.open(os.path.join(goc, "protect.png")).convert("RGBA"), np.float32)[:, :, 0] / 255
PC, PS = meta["protect"]["cols"], meta["protect"]["cell"]
def ghep(m, k, bgw):   # như compose(): trả về khung 384×768, nửa trái là màu, nửa phải là trọng số dán
    mv = sstep(4, 14, np.abs(nua(m) - khep(k)).max(axis=0))
    mv = lan(lan(lan(lan(mv, 1, 0), 0, 0), 1, 1), 0, 1)
    px, py = (k % PC) * PS, (k // PC) * PS
    prot = prot_anh[py:py + HN, px:px + HN]
    lon = lambda a: np.repeat(np.repeat(a, 2, 0), 2, 1)
    a = fg * (1 - bgw) * np.maximum(lon(mv) * cua, zone) * (1 - lon(prot))
    mau = np.clip(m.transpose(1, 2, 0) * 127.5 + 127.5, 0, 255)
    return np.concatenate([mau, np.repeat((a * 255)[:, :, None], 3, 2)], axis=1).astype(np.uint8)
ra = lip_f.replace(".lip.json", "") + ".mieng.mp4"
# LCS_FF_PNG=1: gửi khung dạng PNG (máy chủ scoai-eval chỉ có ffmpeg đi kèm Remotion, bản này không đọc được rawvideo)
PNG = os.environ.get("LCS_FF_PNG") == "1"
vao = ["-f", "image2pipe", "-c:v", "png", "-framerate", "30", "-i", "-"] if PNG else ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{2 * N}x{N}", "-r", "30", "-i", "-"]
ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", *vao,
                       "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-g", "30", "-pix_fmt", "yuv420p", "-color_range", "tv", "-movflags", "+faststart", "-an", ra], stdin=subprocess.PIPE)
def ghi(khung):
    if PNG: b = io.BytesIO(); Image.fromarray(khung).save(b, "PNG", compress_level=1); ff.stdin.write(b.getvalue())
    else: ff.stdin.write(khung.tobytes())
bg = lip.get("bg") or []
for i, p in enumerate(lip["params"]):
    khung = (F + round(i / 30 * meta["fps"])) % meta["frames"]
    k = k_cua(khung)
    m = s.run(None, {"ref": tham_chieu(k), "params": np.asarray(p, np.float32)[None]})[0][0]
    ghi(ghep(m, k, bg[i] if i < len(bg) else 0.0))
ff.stdin.close(); ff.wait()
lip["mieng"] = {"tep": os.path.basename(ra), "F": F}
json.dump(lip, open(lip_f, "w"))
print(ra, len(lip["params"]), "khung,", os.path.getsize(ra) // 1024, "KB")
