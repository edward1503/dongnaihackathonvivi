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
# Vùng mắt thật: chỗ khác nhau giữa khung nhắm và khung mở gần đó (cùng dáng đầu), lấy khung bao rồi nới rộng.
# Dải ước lượng ở trên (theo tâm mặt) có thể lệch: chị Lan và chú Tư bị mắt nằm sát mép dưới dải, phần mép hoà đè lên con ngươi thành hai lớp mắt.
# khung mở sát bên (cách 2–8 khung, đầu gần như đứng yên): khung nào khác khung nhắm nhiều nhất ở nửa trên khuôn mặt
ganh = [j for j in range(chop - 8, chop + 9) if 0 <= j < len(v) and abs(j - chop) >= 2]
def khac(a, b): return np.abs(v[a, fy0:(fy0 + fy1) // 2 + 1, fx0:fx1] - v[b, fy0:(fy0 + fy1) // 2 + 1, fx0:fx1])
def duoi(a, b): return float(np.abs(v[a, (fy0 + fy1) // 2:fy1, fx0:fx1] - v[b, (fy0 + fy1) // 2:fy1, fx0:fx1]).mean())   # nửa dưới mặt: đo dáng đầu
mo = max(ganh, key=lambda j: khac(chop, j).mean() - 1.5 * duoi(chop, j))   # khung mắt mở rõ nhất mà đầu ít xê dịch nhất
dm = khac(chop, mo); dm = (dm > 0.45 * np.percentile(dm, 99.7))
# bỏ đốm lẻ: chỉ giữ hàng và cột có đủ điểm khác (mí mắt là hai vệt ngang rõ)
hang = dm.sum(1) >= max(3, 0.25 * dm.sum(1).max()); cot = dm.sum(0) >= max(2, 0.15 * dm.sum(0).max())
dm = dm & hang[:, None] & cot[None, :]
ys, xs = np.nonzero(dm); y0m, y1m, x0m, x1m = ys.min() + fy0, ys.max() + fy0, xs.min() + fx0, xs.max() + fx0
cao, rong = (y1m - y0m) * s, (x1m - x0m) * s
# nới ra: cao ít nhất 0,28 lần chiều cao mặt, rộng ít nhất 0,8 lần bề ngang mặt, lấy tâm ở chỗ mí mắt khác nhau
tx, ty = (x0m + x1m) / 2 * s, (y0m + y1m) / 2 * s
nc, nr = max(cao * 1.9, 0.28 * fh), max(rong * 1.3, 0.8 * fw)
mat_px = [tx - nr / 2, ty - nc / 2, tx + nr / 2, ty + nc / 2]
# Khung lim dim: quanh khung nhắm, khung mà dải mắt nằm giữa mở và nhắm (không trộn hai ảnh, tránh hai lớp mắt)
ex0, ey0, ex1, ey1 = [int(round(x / s)) for x in mat_px]
def dmat2(a, b): return float(np.abs(v[a, ey0:ey1, ex0:ex1] - v[b, ey0:ey1, ex0:ex1]).mean())
day = dmat2(mo, chop)
buoc = 1 if mo > chop else -1
nua = min([j for j in range(chop + buoc, mo, buoc)] or [chop], key=lambda j: abs(dmat2(j, chop) / day - 0.5))   # giữa khung nhắm và khung mở
print(f"khung mắt mở {mo}, khung lim dim {nua} (khép {1 - dmat2(nua, chop) / day:.2f}); vùng mắt {[round(x) for x in mat_px]}: MỞ ẢNH RA XEM")
# Chuỗi chớp mắt thật (người dùng: chớp khi nói nhìn giả hơn lúc không nói): các khung liền nhau quanh khung nhắm mà mắt còn khép,
# thêm một khung mở mỗi bên. Trình phát cắt dải mắt của từng khung thành một ảnh nhỏ và phát lại đúng 30 khung/giây.
def khep(j): return 1 - dmat2(j, chop) / day
dau = chop
while dau - 1 >= 0 and khep(dau - 1) > 0.15 and chop - dau < 8: dau -= 1
cuoi = chop
while cuoi + 1 < len(v) and khep(cuoi + 1) > 0.15 and cuoi - chop < 8: cuoi += 1
chuoi = list(range(max(0, dau - 1), min(len(v) - 1, cuoi + 1) + 1))
# Dò MỌI lần chớp trong video theo độ đậm con ngươi trong vùng mắt (mắt nhắm thì vùng mắt mất phần đậm), chọn lần gọn nhất:
# mở rõ ngay trước và ngay sau, dài 2–8 khung, dáng đầu gần dáng chuẩn nhất. Chị Lan: lần chớp tìm theo cách cũ là chớp đôi rồi nhìn xuống.
nguong = np.percentile(v[k, ey0:ey1, ex0:ex1], 12)
dam = (v[:, ey0:ey1, ex0:ex1] < nguong).mean((1, 2)); mo_muc = np.median(dam)
lan_chop = []; j = 0
while j < len(v):
    if dam[j] < 0.6 * mo_muc:
        a0 = j
        while j < len(v) and dam[j] < 0.6 * mo_muc: j += 1
        a1 = j - 1
        if 2 <= a1 - a0 + 1 <= 8 and a0 >= 3 and a1 + 3 < len(v) and dam[a0 - 3:a0].min() > 0.85 * mo_muc and dam[a1 + 1:a1 + 4].max() > 0.85 * mo_muc:
            lan_chop.append((float(np.mean([dngoai[x] for x in range(a0, a1 + 1)])), a0, a1))
    j += 1
if lan_chop:
    _, a0, a1 = min(lan_chop)
    chop = int(a0 + np.argmin(dam[a0:a1 + 1])); chuoi = list(range(a0 - 1, a1 + 2))
    nua = min([x for x in range(chop + 1, a1 + 2)] or [chop], key=lambda x: abs(dam[x] / mo_muc - 0.5)); mo = a1 + 2
    print(f"có {len(lan_chop)} lần chớp gọn; chọn {a0}–{a1} (dáng đầu khác chuẩn {_:.1f}), khung nhắm {chop}, lim dim {nua}")
# Chọn tay chuỗi chớp khi dò tự động ra lần không gọn: --chuoi=<khung đầu>-<khung cuối> (gồm một khung mở mỗi bên), đã xem ảnh
tay = [x for x in sys.argv if x.startswith("--chuoi=")]
if tay:
    a0, a1 = [int(x) for x in tay[0].split("=")[1].split("-")]; chuoi = list(range(a0, a1 + 1))
    xa = [dmat2(x, a0) + dmat2(x, a1) for x in chuoi]; chop = chuoi[int(np.argmax(xa))]
    nua = min([x for x in chuoi if x > chop and x < a1] or [chop], key=lambda x: abs(dmat2(x, a1) / max(1e-6, dmat2(chop, a1)) - 0.5))
    print(f"chuỗi chọn tay {a0}–{a1}: khung nhắm {chop}, lim dim {nua}, dáng đầu khác chuẩn trung bình {np.mean([dngoai[x] for x in chuoi]):.2f}")
# Độ lệch dải mắt giữa lúc chớp và dáng chuẩn (đầu ở chỗ khác một chút): đo bằng tương quan pha trên khung mở cạnh lần chớp
A = v[k, ey0:ey1, ex0:ex1]; B = v[mo, ey0:ey1, ex0:ex1]
Fa, Fb = np.fft.fft2(A - A.mean()), np.fft.fft2(B - B.mean()); R = Fa * np.conj(Fb); R /= np.abs(R) + 1e-6
c = np.fft.ifft2(R).real; dy, dx = np.unravel_index(np.argmax(c), c.shape)
dy = dy - c.shape[0] if dy > c.shape[0] // 2 else dy; dx = dx - c.shape[1] if dx > c.shape[1] // 2 else dx
lech = [-float(dx * s), -float(dy * s)]   # dời chỗ lấy mẫu trong ảnh chớp cho mắt nằm đúng chỗ mắt của dáng chuẩn
print(f"chuỗi chớp {chuoi} (độ mở {[round(float(dam[x] / mo_muc), 2) for x in chuoi]}); lệch so với dáng chuẩn {lech} điểm ảnh")
# Độ lệch TỪNG KHUNG trong chuỗi so với dáng chuẩn, đo ở độ phân giải gốc (người dùng: mắt khi chớp bị nhảy lệch).
# Hai khung đầu và cuối chuỗi là mắt mở nên so với dáng chuẩn (cũng mắt mở) đo được chính xác; các khung giữa nội suy.
def khung_goc(j):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(goc, "person.mp4"), "-vf", f"select=eq(n\\,{j}),crop={W}:{H}:0:0,format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(r, np.uint8).reshape(H, W).astype(np.float32)
X0, Y0, X1, Y1 = [int(round(x)) for x in mat_px]; m0 = 40   # nới thêm 40 điểm ảnh để có chân mày, sống mũi
def vung(f): return f[max(0, Y0 - m0):Y1 + m0, max(0, X0 - m0):X1 + m0]
def lech_pha(A, B):   # dời B bao nhiêu thì trùng A (tương quan pha, có cửa sổ Hann, tinh chỉnh nửa điểm ảnh)
    w = np.outer(np.hanning(A.shape[0]), np.hanning(A.shape[1]))
    Fa, Fb = np.fft.fft2((A - A.mean()) * w), np.fft.fft2((B - B.mean()) * w); R = Fa * np.conj(Fb); R /= np.abs(R) + 1e-6
    c = np.fft.ifft2(R).real; y, x = np.unravel_index(np.argmax(c), c.shape)
    def tinh(c1, c0, c2): d = c1 - 2 * c0 + c2; return 0.0 if abs(d) < 1e-9 else 0.5 * (c1 - c2) / d
    fy = tinh(c[(y - 1) % c.shape[0], x], c[y, x], c[(y + 1) % c.shape[0], x]); fx = tinh(c[y, (x - 1) % c.shape[1]], c[y, x], c[y, (x + 1) % c.shape[1]])
    y = y - c.shape[0] if y > c.shape[0] // 2 else y; x = x - c.shape[1] if x > c.shape[1] // 2 else x
    return float(x + fx), float(y + fy)
chuan_goc = vung(khung_goc(k))
dau_l, cuoi_l = lech_pha(chuan_goc, vung(khung_goc(chuoi[0]))), lech_pha(chuan_goc, vung(khung_goc(chuoi[-1])))
lech_chuoi = [[round(dau_l[0] + (cuoi_l[0] - dau_l[0]) * i / max(1, len(chuoi) - 1), 1), round(dau_l[1] + (cuoi_l[1] - dau_l[1]) * i / max(1, len(chuoi) - 1), 1)] for i in range(len(chuoi))]
print(f"lệch từng khung (x, y điểm ảnh, dời ảnh chớp theo lượng này): {lech_chuoi}")
if "--ghi" in sys.argv:
    meta["khung_noi"] = k; meta["khung_chop"] = chop; meta["khung_chop_nua"] = nua; meta["mat"] = [round(x, 1) for x in mat_px]
    meta["chuoi_chop"] = chuoi; meta["lech_chuoi"] = lech_chuoi; meta.pop("lech_chop", None)
    json.dump(meta, open(os.path.join(goc, "meta.json"), "w")); print("đã ghi khung_noi, khung_chop, khung_chop_nua, mat vào meta.json")
