"""Kiểm tra app trên khổ điện thoại và điều khiển từ xa, như buổi trình diễn thật.

Cần: máy chủ chạy bằng server/chay-demo.py (HTTP 8000 và HTTPS 8443), Firefox, selenium.
Chạy:  python app/tools/kiem-dien-thoai.py [thư-mục-ảnh] [https://<ip>:8443]

Hai trình duyệt:
- "điện thoại": khổ 390x844, chuỗi nhận dạng điện thoại Android, mở trang bằng HTTPS (chứng chỉ tự ký);
- "laptop": khổ 1300x900, mở http://127.0.0.1:8000/?demo=1, chọn "Điện thoại" rồi bấm "Có cuộc gọi lạ".
Điện thoại phải tự đổ chuông, đi hết luồng cuộc gọi, nhận lời Minh (giả lập bằng API) và không tràn ngang ở màn nào.
"""
import json
import os
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "chup-dien-thoai")
PHONE_BASE = (sys.argv[2] if len(sys.argv) > 2 else "https://127.0.0.1:8443").rstrip("/")
LAPTOP_BASE = "http://127.0.0.1:8000"
OUT.mkdir(parents=True, exist_ok=True)
errors: list[str] = []
UA = "Mozilla/5.0 (Linux; Android 13; M2012K10C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36"


def api(path, body=None):
    req = urllib.request.Request(LAPTOP_BASE + path, method="POST" if body is not None else "GET",
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def browser(width, height, mobile=False):
    opts = Options()
    opts.add_argument("-headless")
    opts.add_argument(f"--width={width}")
    opts.add_argument(f"--height={height}")
    opts.accept_insecure_certs = True
    if mobile:
        opts.set_preference("general.useragent.override", UA)
        opts.set_preference("dom.w3c_touch_events.enabled", 1)
    service = None
    if Path("/snap/bin/geckodriver").exists():   # Firefox bản snap (Ubuntu)
        from selenium.webdriver.firefox.service import Service
        tmp = Path.home() / "snap" / "firefox" / "common" / "tmp"
        tmp.mkdir(parents=True, exist_ok=True)
        os.environ["TMPDIR"] = str(tmp)
        tempfile.tempdir = str(tmp)
        service = Service(executable_path="/snap/bin/geckodriver")
    d = webdriver.Firefox(options=opts, service=service)
    d.set_window_size(width, height)
    return d


phone = browser(390, 844, mobile=True)
laptop = browser(1300, 900)
pw = WebDriverWait(phone, 10)


def screen(name):
    try:
        pw.until(EC.presence_of_element_located((By.CSS_SELECTOR, f'.phone[data-name^="{name}"]')))
        time.sleep(0.6)
    except Exception:
        errors.append(f"điện thoại không tới màn {name} (đang ở {phone.current_url})")
    overflow = phone.execute_script("return document.documentElement.scrollWidth - window.innerWidth")
    if overflow > 1:
        errors.append(f"{name}: tràn ngang {overflow}px")
    phone.save_screenshot(str(OUT / f"{name}.png"))


def click_text(d, text, css="button"):
    for el in d.find_elements(By.CSS_SELECTOR, css):
        if text in el.text:
            d.execute_script("arguments[0].scrollIntoView({block:'center'})", el)
            el.click()
            return True
    errors.append(f"không thấy nút “{text}”")
    return False


try:
    api("/api/demo/reset", {})
    # 1. Điện thoại mở máy bà Hoa bằng HTTPS và chạm một lần (mở khóa tiếng như người thật)
    phone.get(PHONE_BASE + "/?mode=simple")
    phone.execute_script("localStorage.clear()")
    phone.get(PHONE_BASE + "/?mode=simple")
    screen("A1-trang-chu-lon-tuoi")
    secure = phone.execute_script("return [window.isSecureContext, getComputedStyle(document.querySelector('.phone')).width]")
    print("điện thoại: isSecureContext =", secure[0], "· khung rộng", secure[1])
    if not secure[0] and PHONE_BASE.startswith("https"):
        errors.append("trang HTTPS mà không phải secure context")
    phone.find_element(By.CSS_SELECTOR, "body").click()

    # 2. Laptop: bảng mô phỏng, chọn "Điện thoại", bấm "Có cuộc gọi lạ"
    laptop.get(LAPTOP_BASE + "/?demo=1")
    WebDriverWait(laptop, 8).until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".dp")))
    time.sleep(1.0)
    click_text(laptop, "Điện thoại", ".dp .seg2 button")
    laptop.save_screenshot(str(OUT / "laptop-bang-mo-phong.png"))
    qr_ok = laptop.execute_script("const i=document.querySelector('.dq img');return !!i && i.complete && i.naturalWidth>0")
    if not qr_ok:
        errors.append("laptop: mã QR không hiện")
    click_text(laptop, "Có cuộc gọi lạ", ".dp button")
    if "/cuoc-goi" in laptop.current_url:
        errors.append("laptop tự chuyển màn dù đang ở chế độ Điện thoại")

    # 3. Điện thoại tự đổ chuông (A03a), rồi đi hết luồng cuộc gọi
    screen("A03a-do-chuong-nguy-hiem")
    click_text(phone, "Nghe", ".call-btn")
    screen("A04a-be-nai-hoi")
    click_text(phone, "Có")
    screen("A04b-phan-tich-ghi-am")
    time.sleep(1.5)
    phone.save_screenshot(str(OUT / "A04b-da-bao-minh.png"))
    alerts = api("/api/alerts")
    ours = [a for a in alerts if a["id"] != "al_demo"]
    if not ours:
        errors.append("A04b không báo Minh")
    else:
        api(f"/api/asks/{ours[0]['id']}/reply", {"preset": "dung_chuyen"})
        screen("A4r-nguoi-than-tra-loi")

    # 4. Laptop gửi "Mở app ngân hàng sau cuộc gọi": điện thoại hiện A10a
    click_text(laptop, "Mở app ngân hàng", ".dp button")
    screen("A10a-phanh-sau-cuoc-goi")

    # 5. Các màn chính trên khổ điện thoại: không tràn ngang
    for path, name in [("/kiem-tra", "A2-kiem-tra-so"), ("/kiem-tra?loai=text", "B2-kiem-tra-tin-nhan"),
                       ("/bao-cao", "B4-bao-cao"), ("/khan-cap", "A5-khan-cap"), ("/nguoi-than", "A4-nguoi-than"), ("/ke-lai", "A6-ke-lai-cuoc-goi"), ("/thiet-lap", "A02b-thiet-lap-hoan-tat"),
                       ("/dung-lai?danggoi=1&giay=401", "A10b-phanh-dang-goi"), ("/thong-bao", "A05a-thong-bao-noi")]:
        phone.get(PHONE_BASE + "/?mode=simple#" + path)
        screen(name)
    phone.get(PHONE_BASE + "/?mode=full")
    screen("B1-trang-chu-hoc-sinh")
    phone.get(PHONE_BASE + "/?mode=volunteer")
    screen("C1-trang-chu-tinh-nguyen")
    phone.get(PHONE_BASE + "/?mode=volunteer#/thong-ke")
    screen("C2-thong-ke")

    # 6. Mấu "demo" trên điện thoại mở bảng mô phỏng ngay trên máy
    phone.get(PHONE_BASE + "/?mode=simple&demo=1")
    screen("A1-trang-chu-lon-tuoi")
    phone.find_element(By.CSS_SELECTOR, ".dfab").click()
    time.sleep(0.4)
    phone.save_screenshot(str(OUT / "dien-thoai-bang-mo-phong.png"))
    click_text(phone, "Số chưa ai báo", ".dp button")
    screen("A03b-do-chuong-chua-ro")
finally:
    phone.quit()
    laptop.quit()

if errors:
    print("Lỗi:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"Xong, không lỗi. Ảnh ở {OUT}/")
