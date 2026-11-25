"""Phục vụ buổi trình diễn trên điện thoại: địa chỉ trong mạng LAN và mã QR để quét mở app.

chay-demo.py đặt LCS_PUBLIC_URL (https://<ip>:8443) và LCS_HTTP_URL (http://<ip>:8000) trước khi chạy máy chủ.
Điện thoại cần HTTPS thì trình duyệt mới cho dùng micro và chạy avatar nhiều luồng.
"""
import io
import socket

from . import config

LINKS = [
    ("hoa", "Máy bà Hoa (người lớn tuổi)", "/?mode=simple"),
    ("vy", "Máy Vy (học sinh)", "/?mode=full"),
    ("khoa", "Máy Khoa (đội tình nguyện)", "/?mode=volunteer"),
    ("dieu-khien", "Bảng mô phỏng trên điện thoại", "/?mode=simple&demo=1"),
    ("moi", "Mở như người dùng mới (màn chào)", "/#/chao"),
    ("zalo", "Máy Minh trên Zalo (Mảng 5)", "/zalo"),
    ("web", "Web đội tình nguyện (Mảng 6)", "/web"),
    ("goi-video", "Gọi video khuyên chị Lan", "/prototype/video-call.html"),
]


def lan_ip() -> str:
    """IP của máy trong mạng LAN. Không gửi gói tin nào: UDP connect chỉ chọn đường ra."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def public_base(request_base: str | None = None) -> str:
    """Địa chỉ gốc cho điện thoại: ưu tiên HTTPS do chay-demo.py đặt; không có thì đổi localhost sang IP LAN."""
    base = config.env("LCS_PUBLIC_URL")
    if base:
        return base.rstrip("/")
    base = (request_base or "http://127.0.0.1:8000").rstrip("/")
    for local in ("localhost", "127.0.0.1"):
        base = base.replace(f"//{local}", f"//{lan_ip()}")
    return base


def links(request_base: str | None = None) -> dict:
    base = public_base(request_base)
    return {
        "base": base,
        "https": base.startswith("https://"),
        "httpBase": (config.env("LCS_HTTP_URL") or "").rstrip("/") or None,
        "links": [{"key": k, "label": label, "path": path, "url": base + path} for k, label, path in LINKS],
    }


def qr_svg(url: str) -> bytes | None:
    """Mã QR dạng SVG; máy chưa cài thư viện qrcode thì None."""
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        return None
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=2)
    out = io.BytesIO()
    img.save(out)
    return out.getvalue()


def qr_text(url: str) -> str:
    """Mã QR vẽ bằng ký tự để in ra cửa sổ dòng lệnh."""
    try:
        import qrcode
    except ImportError:
        return ""
    q = qrcode.QRCode(border=1)
    q.add_data(url)
    q.make(fit=True)
    m = q.get_matrix()
    rows = []
    for y in range(0, len(m), 2):
        top, bottom = m[y], (m[y + 1] if y + 1 < len(m) else [False] * len(m[y]))
        rows.append("".join("█" if t and b else "▀" if t else "▄" if b else " " for t, b in zip(top, bottom)))
    return "\n".join(rows)
