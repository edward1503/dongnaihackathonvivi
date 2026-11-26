#!/usr/bin/env python3
"""Dựng video demo từ 2 bản ghi thật: điện thoại (scrcpy, quay/dien-thoai-*.mkv) và màn laptop (quay/laptop-*.mp4).

Mỗi đoạn lấy đúng khoảng giờ thật trong bản ghi (giờ theo nhật ký app), chỉ cắt khúc chờ và tua nhanh khúc gõ phím.
Khung chữ vẽ bằng HTML rồi chụp bằng Chromium; ghép bằng ffmpeg.

    python3 dung.py            # dựng tất cả -> ban/LCS-demo.mp4
    python3 dung.py --anh      # chỉ vẽ khung chữ (lop/*.png) để xem trước
    python3 dung.py 1c 4c      # chỉ dựng lại vài đoạn rồi ghép lại
"""
import datetime
import html
import json
import pathlib
import subprocess
import sys

GOC = pathlib.Path(__file__).resolve().parent
Q, LOP, BAN = GOC / "quay", GOC / "lop", GOC / "ban"
PHONE, LAPTOP = Q / "dien-thoai-095257.mkv", Q / "laptop-095220.mp4"
# Giờ thật (epoch) của khung đầu tiên trong từng bản ghi, khớp bằng lúc thẻ đỏ hiện (nhật ký app 10:09:03.70).
P0, L0 = 1795661578.0, 1795661542.45
FONT = (GOC.parent.parent / "trinh-bay" / "fonts").as_uri()
NAI = (GOC.parent / "trailer" / "be-nai").as_uri()
NHAC = GOC.parent / "trailer" / "nhac" / "tai-ve" / "mp3" / "Wildflowers.mp3"
W, H, FPS = 1920, 1080, 30

# Vị trí các ô video trên khung 1920x1080
O = {
    "mot": {"phone": (1300, 58, 430, 963, 44)},
    "hai": {"minh": (760, 128, 450, 880, 40), "phone": (1320, 128, 393, 880, 40)},
    "web": {"web": (160, 232, 1600, 811, 18)},
}


def ep(s):
    h, m, sec = s.split(":")
    return datetime.datetime(2026, 11, 26, int(h), int(m)).timestamp() + float(sec)


BN = "Bé Nai"
LAN = "Chị Lan · AI mô phỏng"
SEG = [
    dict(id="mo", kieu="the", dai=4.5),
    # 1. Cuộc gọi lạ
    dict(id="1a", kieu="mot", a="10:05:23.3", b="10:05:27.3", chip="1 · Cuộc gọi lạ", tieu="Số lạ gọi tới",
         than="Số này chưa có trong dữ liệu cộng đồng, nên Lá chắn không hiện cảnh báo. Không dọa bừa."),
    dict(id="1b", kieu="mot", a="10:05:27.3", b="10:05:49.3", toc=4, chip="1 · Cuộc gọi lạ", tieu="Kẻ gian giả danh công an",
         than="Bạn Châu trong đội đóng vai kẻ gian: dọa tài khoản của bà dính vụ án, đòi chuyển tiền vào “tài khoản tạm giữ”. Cuộc gọi kéo dài 22 giây.",
         nhan="Tua nhanh ×4"),
    dict(id="1c", kieu="mot", a="10:05:49.6", b="10:05:57.6", chip="1 · Cuộc gọi lạ", tieu="Bé Nai hỏi lại sau cuộc gọi",
         than="Lá chắn không nghe lén cuộc gọi. Số lạ gọi lâu thì Bé Nai hỏi bà đúng một câu.",
         loi=(BN, "Bà ơi, con là Bé Nai, trợ lý Lá chắn anh Minh cài cho bà. Người vừa gọi có bảo bà chuyển tiền không ạ?")),
    dict(id="1d", kieu="mot", a="10:05:57.6", b="10:06:03.3", chip="1 · Cuộc gọi lạ", tieu="Bà trả lời “Có”",
         than="Màn hình chuyển sang Nguy hiểm, đồng thời báo ngay cho anh Minh, con trai bà.",
         loi=(BN, "Bà đừng chuyển tiền nhé, con báo anh Minh ngay, anh ấy sẽ gọi cho bà.")),
    # 2. Người thân
    dict(id="2a", kieu="hai", a="10:06:10.4", b="10:06:18.0", chip="2 · Người thân", tieu="Minh nhận cảnh báo",
         than="Minh chỉ thấy tóm tắt đã che thông tin riêng. Một chạm “Đừng chuyển” là lời nhắn bay tới máy mẹ."),
    dict(id="2b", kieu="mot", a="10:06:29.2", b="10:06:34.4", chip="2 · Người thân", tieu="Lời nhắn bật lên máy bà",
         than="Máy bà tự mở lời nhắn của Minh, chữ to và đọc thành tiếng.",
         loi=(BN, "Minh trả lời rồi nè bà: Mẹ đừng chuyển! Con gọi mẹ ngay.")),
    # 3. Dừng lại
    dict(id="3a", kieu="mot", a="10:07:16.8", b="10:07:24.4", chip="3 · Dừng lại", tieu="Vẫn mở ví để chuyển tiền?",
         than="Trong 2 phút sau cuộc gọi đáng ngờ, hễ mở app ngân hàng hay ví điện tử là màn DỪNG LẠI hiện ngay.",
         loi=(BN, "Bà ơi, khoan chuyển tiền đã. Bà gọi anh Minh hỏi trước cho chắc nha.")),
    # 4. Cộng đồng
    dict(id="4a", kieu="mot", a="10:08:06.4", b="10:08:11.0", chip="4 · Cộng đồng", tieu="Số đã có 10 máy báo",
         than="Nhưng chưa ai xác minh, nên chưa cảnh báo, để không gắn nhầm nhãn lừa đảo cho số của người tốt.",
         may="Bạn Tuấn gọi lần 1"),
    dict(id="4b1", kieu="web", a="10:08:40.0", b="10:08:44.6", chip="4 · Cộng đồng", tieu="Quản trị viên xem bằng chứng",
         than="10 máy đã báo cùng một kịch bản giả danh công an, khớp nhật ký cuộc gọi đến."),
    dict(id="4b2", kieu="web", a="10:08:46.8", b="10:08:53.3", chip="4 · Cộng đồng", tieu="Bấm “Xác minh lừa đảo”",
         than="Có hiệu lực ngay trên mọi máy cài Lá chắn số."),
    dict(id="4c", kieu="mot", a="10:09:01.8", b="10:09:06.2", giu=2.2, chip="4 · Cộng đồng", tieu="Gọi lại: thẻ đỏ hiện ngay",
         than="Thẻ cảnh báo hiện khoảng 1 giây sau khi chuông reo, trước khi bà kịp bắt máy.",
         may="Bạn Tuấn gọi lần 2"),
    # 5. Bảng điều khiển
    dict(id="5a", kieu="web", a="10:09:33.0", b="10:09:37.6", chip="5 · Bảng điều khiển", tieu="Tổng quan cho quản trị",
         than="Báo cáo theo kiểu lừa đảo, khu phố, nhóm bị nhắm tới, và kiểu lừa mới nổi."),
    dict(id="5b", kieu="web", a="10:09:38.0", b="10:09:44.5", chip="5 · Bảng điều khiển", tieu="Cảnh báo và tuyên truyền",
         than="Từ báo cáo của người dân, AI soạn sẵn cảnh báo và truyện tranh 1 phút, người duyệt sửa rồi gửi."),
    # 6. Học tập
    dict(id="6a", kieu="mot", a="10:10:09.4", b="10:10:17.6", chip="6 · Học tập", tieu="Mỗi vai một nội dung",
         than="Đổi sang Vy, học sinh lớp 11A1: bài học, bài luyện và bảng thi đua dành riêng cho học sinh.", may="Máy của Vy"),
    dict(id="6b", kieu="mot", a="10:10:29.4", b="10:10:57.2", chip="6 · Học tập", tieu="Truyện tranh có lời kể",
         than="Bạn chọn cách Vy xử lý. Chọn sai thì thấy hậu quả, rồi quay lại điểm rẽ chọn lại.", may="Máy của Vy"),
    dict(id="6c", kieu="mot", a="10:10:57.2", b="10:11:19.0", toc=2.5, chip="6 · Học tập", tieu="Luyện bắt bài",
         than="Chạm vào dấu hiệu lừa đảo trong tin nhắn, nối lời kẻ gian với chiêu trò của họ.", may="Máy của Vy", nhan="Tua nhanh ×2,5"),
    dict(id="6d0", kieu="mot", a="10:13:59.5", b="10:14:01.5", chip="6 · Học tập", tieu="Gọi video khuyên chị Lan",
         than="Chị Lan là nhân vật AI mô phỏng, đang định nạp tiền để “nhận việc”. Bạn khuyên đúng ý nào, Lá chắn ghi nhận ý đó.", may="Máy của Vy"),
    dict(id="6d1", kieu="mot", a="10:14:05.6", b="10:14:16.1", chip="6 · Học tập", tieu="Gọi video khuyên chị Lan",
         than="Chị Lan là nhân vật AI mô phỏng, đang định nạp tiền để “nhận việc”. Bạn khuyên đúng ý nào, Lá chắn ghi nhận ý đó.", may="Máy của Vy",
         loi=(LAN, "Em ơi, chị thấy trên mạng tuyển cộng tác viên đặt đơn, lương 500 nghìn một ngày. Họ bảo nạp trước 200 nghìn là làm được liền. Chị có nên làm không em?")),
    dict(id="6d2", kieu="mot", a="10:14:16.1", b="10:14:24.8", toc=4, chip="6 · Học tập", tieu="Gọi video khuyên chị Lan",
         than="Vy gõ lời khuyên của mình.", may="Máy của Vy", nhan="Tua nhanh ×4"),
    dict(id="6d3", kieu="mot", a="10:14:24.8", b="10:14:31.9", chip="6 · Học tập", tieu="Gọi video khuyên chị Lan",
         than="Lá chắn ghi nhận ý “Đừng nạp tiền”: 1/4 ý.", may="Máy của Vy",
         loi=(LAN, "May quá, chị chưa chuyển đồng nào hết. Chỗ nào trong lời mời làm em để ý vậy?")),
    dict(id="6d4", kieu="mot", a="10:15:49.0", b="10:15:53.0", chip="6 · Học tập", tieu="Đủ 4/4 ý",
         than="Đừng nạp tiền, chỉ ra dấu hiệu, cách xác minh, và báo cáo.", may="Máy của Vy",
         loi=(LAN, "Ừ, hai chị em mình làm luôn nha.")),
    dict(id="6d5", kieu="mot", a="10:15:53.0", b="10:15:59.2", chip="6 · Học tập", tieu="Đủ 4/4 ý",
         than="Đừng nạp tiền, chỉ ra dấu hiệu, cách xác minh, và báo cáo.", may="Máy của Vy",
         loi=(LAN, "Hú hồn, may có em. Giờ chị biết phải làm gì rồi.")),
    dict(id="6e", kieu="mot", a="10:16:04.6", b="10:16:09.6", chip="6 · Học tập", tieu="Bảng điểm cuối bài",
         than="4/4 ý · Giỏi. Điểm bài học góp vào thi đua của lớp.", may="Máy của Vy",
         loi=(BN, "Bạn khuyên chị Lan rõ ràng ghê, chị ấy thoát rồi đó.")),
    # 7. Thi đua
    dict(id="7a", kieu="mot", a="10:16:11.6", b="10:16:23.0", chip="7 · Thi đua", tieu="Thi đua lớp, trường, phường",
         than="Điểm bài kiểm tra góp vào bảng thi đua toàn Đồng Nai, để trường nào, phường nào cũng muốn phổ biến tốt hơn.", may="Máy của Vy"),
    dict(id="ket", kieu="the", dai=5.5),
]

CSS = f"""
@import url('{FONT}/be-vietnam-pro.css');
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;position:relative;font-family:'Be Vietnam Pro',sans-serif;color:#0F172A}}
body{{background:radial-gradient(1200px 800px at 85% 10%,#DCE7FF 0%,rgba(220,231,255,0) 60%),linear-gradient(160deg,#F7F9FD 0%,#EAF0FA 100%)}}
.brand{{position:absolute;left:110px;top:56px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:22px;color:#1E3A8A}}
.brand i{{width:34px;height:34px;border-radius:10px;background:#1D4ED8;display:grid;place-items:center;font-style:normal;color:#fff;font-size:18px}}
.brand span{{font-weight:500;color:#64748B}}
.panel{{position:absolute;display:flex;flex-direction:column;gap:22px}}
.chip{{align-self:flex-start;padding:8px 18px;border-radius:999px;background:#1D4ED8;color:#fff;font-weight:700;font-size:22px;letter-spacing:.2px}}
h1{{font-size:60px;line-height:1.12;font-weight:700;letter-spacing:-.5px}}
p.than{{font-size:30px;line-height:1.45;color:#334155;font-weight:500}}
.loi{{display:flex;gap:18px;align-items:flex-start;background:#fff;border-radius:24px;padding:22px 26px;box-shadow:0 10px 30px rgba(15,23,42,.08);border:1px solid #E2E8F0}}
.loi img,.loi .av{{width:74px;height:74px;flex:none;border-radius:20px;object-fit:contain;background:#FFF7E6}}
.loi .av{{display:grid;place-items:center;background:#EDE9FE;color:#5B21B6;font-weight:700;font-size:30px}}
.loi b{{display:block;font-size:20px;color:#1D4ED8;margin-bottom:6px}}
.loi.ai b{{color:#6D28D9}}
.loi div{{font-size:29px;line-height:1.42;color:#0F172A;font-weight:500}}
.nhan{{position:absolute;padding:8px 16px;border-radius:999px;background:#0F172A;color:#fff;font-size:20px;font-weight:600}}
.may{{position:absolute;font-size:20px;font-weight:700;color:#475569;text-align:center}}
.vo{{position:absolute;background:#0B1220;box-shadow:0 30px 60px rgba(15,23,42,.28),0 6px 14px rgba(15,23,42,.18)}}
.the{{position:absolute;border-radius:18px;background:#fff;box-shadow:0 26px 60px rgba(15,23,42,.18)}}
.foot{{position:absolute;left:110px;bottom:40px;font-size:18px;color:#64748B;font-weight:500}}
"""


def nai(ten):
    return f"<img src='{NAI}/{ten}.png'>"


def khung(s):
    """HTML của khung chữ cho một đoạn."""
    k = s["kieu"]
    out = []
    if k == "the":
        return the_html(s["id"])
    out.append("<div class='brand'><i>✓</i>Lá chắn số <span>· Demo trên điện thoại thật</span></div>")
    if k == "mot":
        x, y, w, h, r = O["mot"]["phone"]
        out.append(f"<div class='vo' style='left:{x-14}px;top:{y-14}px;width:{w+28}px;height:{h+28}px;border-radius:{r+14}px'></div>")
        out.append(f"<div class='may' style='left:{x}px;width:{w}px;top:{y+h+18}px'>{html.escape(s.get('may', 'Máy bà Hoa'))}</div>"
                   if y + h + 48 < H else "")
        panel = (150, 170, 1020)
    elif k == "hai":
        for key, ten in (("minh", "Máy anh Minh (con trai)"), ("phone", "Máy bà Hoa")):
            x, y, w, h, r = O["hai"][key]
            if key == "phone":
                out.append(f"<div class='vo' style='left:{x-12}px;top:{y-12}px;width:{w+24}px;height:{h+24}px;border-radius:{r+12}px'></div>")
            else:
                out.append(f"<div class='the' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{r}px'></div>")
            out.append(f"<div class='may' style='left:{x}px;width:{w}px;top:{y-44}px'>{ten}</div>")
        panel = (110, 170, 580)
    else:  # web
        x, y, w, h, r = O["web"]["web"]
        out.append(f"<div class='the' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px'></div>")
        panel = None
    if panel:
        px, py, pw = panel
        loi = ""
        if s.get("loi"):
            ai = s["loi"][0] == LAN
            hinh = "<div class='av'>L</div>" if ai else nai("hoi")
            loi = f"<div class='loi{' ai' if ai else ''}'>{hinh}<div><b>{html.escape(s['loi'][0])}</b>{html.escape(s['loi'][1])}</div></div>"
        out.append(f"<div class='panel' style='left:{px}px;top:110px;height:880px;justify-content:center;width:{pw}px'>"
                   f"<div class='chip'>{html.escape(s['chip'])}</div><h1>{html.escape(s['tieu'])}</h1>"
                   f"<p class='than'>{html.escape(s['than'])}</p>{loi}</div>")
    else:
        out.append(f"<div class='panel' style='left:160px;top:56px;width:1600px;flex-direction:row;align-items:center;gap:26px;justify-content:flex-end'>"
                   f"<div class='chip'>{html.escape(s['chip'])}</div></div>")
        out.append(f"<div class='panel' style='left:160px;top:110px;width:1600px;gap:10px'><h1 style='font-size:48px'>{html.escape(s['tieu'])}</h1>"
                   f"<p class='than' style='font-size:27px'>{html.escape(s['than'])}</p></div>")
    if s.get("nhan"):
        if k == "mot":
            x, y, w, h, r = O["mot"]["phone"]
            out.append(f"<div class='nhan' style='left:{x+w//2-90}px;top:{y+20}px'>⏩ {html.escape(s['nhan'])}</div>")
    if k != "web":
        out.append("<div class='foot'>Cuộc gọi thật từ máy đồng đội · máy chủ thật · chỉ cắt khúc chờ</div>")
    return "".join(out)


def the_html(id_):
    if id_ == "mo":
        return (f"<div style='position:absolute;left:150px;top:250px;width:1050px;display:flex;flex-direction:column;gap:30px'>"
                f"<div class='chip' style='font-size:26px'>Đội 18 · Vivi</div>"
                f"<h1 style='font-size:104px'>Lá chắn số</h1>"
                f"<p class='than' style='font-size:40px;color:#1E3A8A;font-weight:600'>Demo trên điện thoại thật</p>"
                f"<p class='than'>Bà Hoa 70 tuổi, con trai là anh Minh, cháu Vy học lớp 11. Cuộc gọi thật từ máy đồng đội, máy chủ thật. Video chỉ cắt khúc chờ.</p></div>"
                f"<img src='{NAI}/chao.png' style='position:absolute;right:170px;top:200px;width:560px'>")
    return (f"<div style='position:absolute;left:150px;top:200px;width:1100px;display:flex;flex-direction:column;gap:26px'>"
            f"<h1 style='font-size:64px'>Cảnh báo trước khi nghe.<br>Hỏi lại sau khi nghe.<br>Chặn trước khi chuyển.</h1>"
            f"<p class='than' style='font-size:36px;color:#1E3A8A;font-weight:600'>Người thân, cộng đồng và nhà trường cùng đứng sau.</p>"
            f"<p class='than' style='font-size:30px'>Lá chắn số · Đội 18 · Vivi</p></div>"
            f"<img src='{NAI}/bao-ve.png' style='position:absolute;right:170px;top:230px;width:520px'>"
            f"<div class='foot'>Nhạc nền: “Wildflowers”, Scott Buckley (CC BY 4.0)</div>")


def ve_anh(chon):
    LOP.mkdir(exist_ok=True)
    for s in SEG:
        if chon and s["id"] not in chon:
            continue
        f = LOP / f"khung-{s['id']}.html"
        f.write_text(f"<!doctype html><html lang='vi'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{khung(s)}</body></html>")
        subprocess.run(["chromium", "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb",
                        "--allow-file-access-from-files", "--virtual-time-budget=1500",
                        f"--window-size={W},{H + 200}", f"--screenshot={LOP / ('khung-' + s['id'] + '.png')}", f.as_uri()],
                       check=True, capture_output=True)
        # Cửa sổ headless chừa chỗ cho khung cửa sổ: chụp cao hơn rồi cắt đúng 1920x1080 phía trên.
        png = LOP / f"khung-{s['id']}.png"
        subprocess.run(["magick", str(png), "-crop", f"{W}x{H}+0+0", "+repage", str(png)], check=True)
    print("đã vẽ khung chữ")


def mat_na(w, h, r):
    p = LOP / f"mask-{w}x{h}-{r}.png"
    if not p.exists():
        subprocess.run(["magick", "-size", f"{w}x{h}", "xc:black", "-fill", "white", "-draw",
                        f"roundrectangle 0,0,{w - 1},{h - 1},{r},{r}", str(p)], check=True)
    return p


def dung_doan(s):
    out = LOP / f"doan-{s['id']}.mp4"
    base = LOP / f"khung-{s['id']}.png"
    if s["kieu"] == "the":
        d = s["dai"]
        cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", str(d), "-i", str(base),
               "-f", "lavfi", "-t", str(d), "-i", "anullsrc=r=48000:cl=stereo",
               "-vf", f"fps={FPS},format=yuv420p,fade=t=in:st=0:d=0.4,fade=t=out:st={d - 0.4}:d=0.4",
               "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)]
        subprocess.run(cmd, check=True)
        return out, d
    a, b = ep(s["a"]), ep(s["b"])
    toc, giu = s.get("toc", 1), s.get("giu", 0)
    d_src = b - a
    d = d_src / toc + giu
    ins = ["-loop", "1", "-t", f"{d:.3f}", "-i", str(base)]
    f = []
    last = "[0:v]"
    idx = 1
    am = None
    vids = []
    if s["kieu"] in ("mot", "hai"):
        ins += ["-ss", f"{a - P0:.3f}", "-t", f"{d_src:.3f}", "-i", str(PHONE)]
        x, y, w, h, r = O[s["kieu"]]["phone"]
        vids.append((idx, "phone", x, y, w, h, r))
        am = idx
        idx += 1
    if s["kieu"] in ("hai", "web"):
        ins += ["-ss", f"{a - L0:.3f}", "-t", f"{d_src:.3f}", "-i", str(LAPTOP)]
        key = "minh" if s["kieu"] == "hai" else "web"
        x, y, w, h, r = O[s["kieu"]][key]
        vids.append((idx, key, x, y, w, h, r))
        idx += 1
    for n, (i, key, x, y, w, h, r) in enumerate(vids):
        mask = mat_na(w, h, r)
        ins += ["-loop", "1", "-i", str(mask)]
        mi = idx
        idx += 1
        crop = {"phone": "", "minh": "crop=470:920:728:160,", "web": "crop=1920:973:0:107,"}[key]
        tail = f",tpad=stop_mode=clone:stop_duration={giu}" if giu else ""
        f.append(f"[{i}:v]{crop}setpts=(PTS-STARTPTS)/{toc},fps={FPS},scale={w}:{h}:flags=lanczos{tail},format=rgba[v{n}];"
                 f"[{mi}:v]format=gray,scale={w}:{h}[m{n}];[v{n}][m{n}]alphamerge[c{n}]")
        f.append(f"{last}[c{n}]overlay={x}:{y}:shortest=0:eof_action=repeat[o{n}]")
        last = f"[o{n}]"
    f.append(f"{last}format=yuv420p,trim=duration={d:.3f}[vo]")
    if am is not None and toc == 1:
        f.append(f"[{am}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration={d:.3f}[ao]")
        amap = "[ao]"
    else:
        ins += ["-f", "lavfi", "-t", f"{d:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
        amap = f"{idx}:a"
    cmd = ["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(f), "-map", "[vo]", "-map", amap,
           "-t", f"{d:.3f}", "-r", str(FPS), "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(out)]
    subprocess.run(cmd, check=True)
    return out, d


def ghep(parts):
    BAN.mkdir(exist_ok=True)
    lst = LOP / "ds.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p, _ in parts))
    tho = LOP / "tho.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tho)], check=True)
    tong = sum(d for _, d in parts)
    # Giọng nói: san đều (giọng Bé Nai thu sẵn to, giọng chị Lan nhỏ hơn). Nhạc nền nhỏ cố định, tự hạ khi có giọng.
    fc = (f"[0:a]aresample=48000,dynaudnorm=f=250:g=15:m=12:p=0.9[g];[g]asplit[g1][g2];"
          f"[1:a]aresample=48000,atrim=start=8:duration={tong:.2f},asetpts=PTS-STARTPTS,volume=0.28,"
          f"afade=t=in:st=0:d=2,afade=t=out:st={tong - 3:.2f}:d=3[n];"
          f"[n][g1]sidechaincompress=threshold=0.015:ratio=6:attack=15:release=500[nd];"
          f"[g2][nd]amix=inputs=2:duration=first:normalize=0[m]")
    tron = LOP / "tron.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tho), "-i", str(NHAC), "-filter_complex", fc,
                    "-map", "[m]", "-ar", "48000", str(tron)], check=True)
    # Chuẩn hóa hai lượt, tuyến tính (không bơm to nhỏ theo đoạn): đo trước rồi chỉnh đúng -16 LUFS.
    do = subprocess.run(["ffmpeg", "-v", "info", "-i", str(tron), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
                         "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(do[do.rindex("{"):do.rindex("}") + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    ra = BAN / "LCS-demo.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tho), "-i", str(tron), "-map", "0:v", "-map", "1:a",
                    "-af", ln, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-movflags", "+faststart", str(ra)], check=True)
    print(f"xong: {ra} ({tong:.1f} giây)")


def main():
    args = sys.argv[1:]
    if args[:1] == ["--anh"]:
        ve_anh(args[1:])
        return
    chon = set(args)
    ve_anh(chon)
    parts = []
    for s in SEG:
        out = LOP / f"doan-{s['id']}.mp4"
        if chon and s["id"] not in chon and out.exists():
            d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                                     capture_output=True, text=True).stdout)
            parts.append((out, d))
            continue
        parts.append(dung_doan(s))
        print("đoạn", s["id"], f"{parts[-1][1]:.1f}s")
    (LOP / "doan.json").write_text(json.dumps([[p.name, d] for p, d in parts]))
    ghep(parts)


if __name__ == "__main__":
    main()
