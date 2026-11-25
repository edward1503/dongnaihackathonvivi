#!/usr/bin/env python3
"""Chạy cả demo Lá chắn số trên laptop để điện thoại trong cùng mạng mở được.

    python chay-demo.py                 # HTTP cổng 8000 và HTTPS cổng 8443, in mã QR
    python chay-demo.py --build         # build lại app React trước khi chạy
    python chay-demo.py --no-https      # chỉ chạy HTTP

Vì sao cần HTTPS: trên điện thoại, trình duyệt chỉ cho dùng micro ("Giữ để nói", "Nói với Lá chắn") và chạy avatar
nhiều luồng khi trang mở bằng https. Tệp này tự tạo chứng chỉ tự ký cho IP trong mạng LAN (lưu ở server/.chung-chi/,
không đưa lên kho). Lần đầu mở, điện thoại báo "Kết nối không riêng tư": bấm "Nâng cao" rồi "Tiếp tục truy cập".

Hai cổng dùng chung MỘT dữ liệu (cùng tiến trình): laptop mở http://localhost:8000, điện thoại mở https://<ip>:8443,
app Android của Mảng 1 nhập http://<ip>:8000 (app không nhận chứng chỉ tự ký).
"""
import argparse
import asyncio
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CERT_DIR = HERE / ".chung-chi"
sys.path.insert(0, str(HERE))


def build_app() -> None:
    npm = shutil.which("npm")
    if not npm:
        print("! Không thấy npm: bỏ qua bước build app.")
        return
    app = ROOT / "app"
    if not (app / "node_modules").is_dir():
        subprocess.run([npm, "install"], cwd=app, check=True)
    subprocess.run([npm, "run", "build"], cwd=app, check=True)


def make_cert(ip: str) -> tuple[Path, Path] | None:
    """Chứng chỉ tự ký cho localhost và IP LAN. Đổi mạng (IP khác) thì tạo lại."""
    cert, key, stamp = CERT_DIR / "cert.pem", CERT_DIR / "key.pem", CERT_DIR / "ip.txt"
    if cert.is_file() and key.is_file() and stamp.is_file() and stamp.read_text().strip() == ip:
        return cert, key
    CERT_DIR.mkdir(exist_ok=True)
    san = f"subjectAltName=DNS:localhost,IP:127.0.0.1,IP:{ip}"
    openssl = shutil.which("openssl")
    if openssl:
        r = subprocess.run([openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "30",
                            "-keyout", str(key), "-out", str(cert), "-subj", "/CN=La chan so (demo)", "-addext", san],
                           capture_output=True)
        if r.returncode == 0:
            stamp.write_text(ip)
            return cert, key
    try:  # không có openssl (thường gặp trên Windows): dùng thư viện cryptography nếu đã cài
        import datetime
        import ipaddress

        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.x509.oid import NameOID

        k = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "La chan so (demo)")])
        now = datetime.datetime.now(datetime.timezone.utc)
        c = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(k.public_key())
             .serial_number(x509.random_serial_number()).not_valid_before(now).not_valid_after(now + datetime.timedelta(days=30))
             .add_extension(x509.SubjectAlternativeName([x509.DNSName("localhost"), x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
                                                         x509.IPAddress(ipaddress.ip_address(ip))]), critical=False)
             .sign(k, hashes.SHA256()))
        key.write_bytes(k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL,
                                        serialization.NoEncryption()))
        cert.write_bytes(c.public_bytes(serialization.Encoding.PEM))
        stamp.write_text(ip)
        return cert, key
    except ImportError:
        return None


def banner(http_url: str, https_url: str | None) -> None:
    from lcs import demo

    base = https_url or http_url
    print("\n Lá chắn số · demo đang chạy (Ctrl+C để tắt)\n")
    print(f"  Laptop (bảng mô phỏng):  http://localhost:{http_url.rsplit(':', 1)[1]}/?demo=1")
    for _key, label, path in demo.LINKS:
        print(f"  {label:<34} {base}{path}")
    print(f"  App Android (ô 'Máy chủ của đội'): {http_url}")
    qr = demo.qr_text(base + "/?mode=simple")
    if qr:
        print("\n  Quét để mở máy bà Hoa trên điện thoại:\n")
        print("\n".join("  " + line for line in qr.splitlines()))
    if https_url:
        print("\n  Lần đầu mở trên điện thoại: bấm 'Nâng cao' rồi 'Tiếp tục truy cập' (chứng chỉ tự ký của laptop).")
    print("  Trước mỗi lượt diễn: bấm 'Đặt lại demo' ở bảng mô phỏng.\n")


async def serve(app, ports: list[dict]) -> None:
    import signal

    import uvicorn

    class Quiet(uvicorn.Server):
        def capture_signals(self):  # hai máy chủ chung một tiến trình: tự bắt Ctrl+C bên dưới
            from contextlib import nullcontext
            return nullcontext()

    servers = [Quiet(uvicorn.Config(app, host="0.0.0.0", log_level="warning", **p)) for p in ports]
    loop = asyncio.get_running_loop()

    def stop(*_):
        for s in servers:
            s.should_exit = True
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop)
        except (NotImplementedError, RuntimeError):  # Windows
            signal.signal(sig, stop)
    await asyncio.gather(*(s.serve() for s in servers))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--https-port", type=int, default=8443)
    ap.add_argument("--no-https", action="store_true")
    ap.add_argument("--build", action="store_true", help="build lại app React trước khi chạy")
    args = ap.parse_args()

    if args.build or not (ROOT / "app" / "dist" / "index.html").is_file():
        build_app()

    from lcs import demo
    ip = demo.lan_ip()
    http_url = f"http://{ip}:{args.port}"
    https_url = None
    ports = [{"port": args.port}]
    if not args.no_https:
        pair = make_cert(ip)
        if pair:
            https_url = f"https://{ip}:{args.https_port}"
            ports.append({"port": args.https_port, "ssl_certfile": str(pair[0]), "ssl_keyfile": str(pair[1])})
        else:
            print("! Không tạo được chứng chỉ (thiếu openssl và thư viện cryptography): chỉ chạy HTTP.")
    os.environ["LCS_HTTP_URL"] = http_url
    if https_url:
        os.environ["LCS_PUBLIC_URL"] = https_url

    from lcs.main import app
    banner(http_url, https_url)
    asyncio.run(serve(app, ports))


if __name__ == "__main__":
    main()
