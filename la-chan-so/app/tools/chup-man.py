"""Đi hết các luồng của app bằng cách bấm như người dùng, chụp từng màn để so với export/png/.

Cần: máy chủ đang chạy và phục vụ bản build (uvicorn lcs.main:app --port 8000), Firefox, selenium.
Chạy:  python app/tools/chup-man.py [thư-mục-ảnh] [địa-chỉ]
Máy Minh được giả lập bằng cách gọi thẳng API trả lời (/api/asks/{id}/seen, /reply).
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "chup")
BASE = (sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8000").rstrip("/")
OUT.mkdir(parents=True, exist_ok=True)
errors: list[str] = []


def post(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body or {}).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def get(path):
    return json.loads(urllib.request.urlopen(BASE + path, timeout=10).read())


opts = Options()
opts.add_argument("-headless")
service = None
# Firefox bản snap (Ubuntu): dùng geckodriver của snap, và thư mục tạm nằm trong vùng snap đọc được
if Path("/snap/bin/geckodriver").exists():
    import os
    import tempfile
    from selenium.webdriver.firefox.service import Service
    tmp = Path.home() / "snap" / "firefox" / "common" / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    os.environ["TMPDIR"] = str(tmp)
    tempfile.tempdir = str(tmp)
    service = Service(executable_path="/snap/bin/geckodriver")
d = webdriver.Firefox(options=opts, service=service)
d.set_window_size(1000, 1000)  # rộng hơn 600px: app hiện trong khung 360x800 như thiết kế
wait = WebDriverWait(d, 8)


def frame(name):
    try:
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, f'[data-name="{name}"]')))
        time.sleep(0.5)
    except Exception:
        errors.append(f"không thấy màn {name} (đang ở {d.current_url})")


def shot(name, file=None):
    frame(name)
    d.find_element(By.CSS_SELECTOR, ".frame").screenshot(str(OUT / f"{file or name}.png"))
    print("chụp", file or name)


def open_(query, route):
    d.get(f"{BASE}/{query}#{route}")


def click(text):
    xp = f'//button[contains(normalize-space(.), "{text}")]'
    el = wait.until(EC.element_to_be_clickable((By.XPATH, xp)))
    el.click()


def type_(css, text):
    el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, css)))
    el.clear()
    el.send_keys(text)


def check(value):
    open_("", "/kiem-tra")
    frame("A06a-kiem-tra-so")
    type_("input.field", value)
    click("Kiểm tra")


post("/api/demo/reset")
d.get(BASE + "/")
d.execute_script("localStorage.clear()")

# ---------- Bà Hoa: trang chủ đơn giản -> kiểm tra -> hỏi người thân -> báo cáo ----------
open_("?mode=simple", "/")
shot("A01a-trang-chu-don-gian")
click("Kiểm tra trước khi chuyển tiền")
shot("A06a-kiem-tra-so")
type_("input.field", "0912 345 678")
click("Kiểm tra")
shot("A07a-ket-qua-nguy-hiem")
click("Hỏi người thân")
shot("A08a-hoi-nguoi-than-gui")
click("Gửi cho Minh")
frame("A08b-hoi-nguoi-than-cho")
ask = [e for e in get("/api/events?room=gia-dinh-hoa")["events"] if e["type"] == "ask.sent"][-1]["data"]
post(f"/api/asks/{ask['askId']}/seen")
time.sleep(1.5)
shot("A08b-hoi-nguoi-than-cho")
post(f"/api/asks/{ask['askId']}/reply", {"preset": "dung_chuyen"})
shot("A08c-hoi-nguoi-than-tra-loi")
click("Báo cáo số này")
shot("A09a-bao-cao-form")
type_("textarea.field", "Tự xưng cán bộ điều tra, yêu cầu chuyển tiền vào tài khoản tạm giữ.")
click("Gửi báo cáo")
shot("A09c-bao-cao-xong")

# ---------- Ba mức còn lại của kết quả ----------
check("qua-tri-an-khach-hang.top")
shot("A07b-ket-qua-nghi-ngo")
check("1900 5555 88")
shot("A07c-ket-qua-an-toan")
check("190388885678")
shot("A07d-ket-qua-chua-co-du-lieu")

# ---------- Vy: tin nhắn -> phân tích -> báo cho cộng đồng ----------
open_("?mode=full", "/")
shot("A01b-trang-chu-day-du")
open_("", "/kiem-tra/tin-nhan")
frame("A06b-kiem-tra-tin-nhan")
type_("textarea.field", "Tài khoản ngân hàng của quý khách sẽ bị khóa trong 24h. Xác minh ngay tại ngan-hang-xacminh.top để tránh gián đoạn.")
shot("A06b-kiem-tra-tin-nhan")
type_("textarea.field", "Chào em, bên chị đang tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày, không cần kinh nghiệm. "
      "Chỉ cần nạp trước 200k để kích hoạt tài khoản, hoàn tiền kèm hoa hồng 20% ngay. Số lượng có hạn, đăng ký trong hôm nay tại bit.ly/viec-nhe-xyz")
click("Phân tích tin nhắn")
shot("A05b-phan-tich-tin-nhan")
click("Báo cho cộng đồng")
shot("A09b-bao-cong-dong")
open_("", "/kiem-tra/tin-nhan")
frame("A06b-kiem-tra-tin-nhan")
type_("textarea.field", "Alo, gọi lại anh nhé")
click("Phân tích tin nhắn")
shot("E01d-ai-chua-du-thong-tin")

# ---------- Trạng thái lỗi, trống ----------
open_("?nguoithan=0", "/hoi-nguoi-than")
shot("E01b-chua-co-nguoi-than")
open_("?api=http://127.0.0.1:9", "/kiem-tra")
frame("A06a-kiem-tra-so")
type_("input.field", "0912 345 678")
click("Kiểm tra")
shot("E01c-mat-mang")
d.execute_script("localStorage.removeItem('lcs.api')")

# ---------- Cuộc gọi lừa đảo: đổ chuông -> Bé Nai hỏi -> AI phân tích ghi âm -> tự báo Minh -> Minh trả lời ----------
post("/api/demo/reset")
d.execute_script("localStorage.clear()")
open_("?mode=simple", "/cuoc-goi?so=0912345678")
shot("A03a-do-chuong-nguy-hiem")
click("Nghe")
shot("A04a-hoi-nhanh")
click("Có")
frame("A04b-phan-tich-ghi-am")
try:
    WebDriverWait(d, 15).until(EC.presence_of_element_located((By.XPATH, '//*[contains(text(), "Đã báo cho")]')))
except Exception:
    errors.append("A04b: chưa thấy dòng 'Đã báo cho Minh'")
shot("A04b-phan-tich-ghi-am")
alert_id = get("/api/alerts")[0]["id"]
app_tab = d.current_window_handle
try:
    urllib.request.urlopen(BASE + "/zalo", timeout=5)
    d.switch_to.new_window("tab")
    d.get(BASE + "/zalo")
    btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, f'.msg-card[data-id="{alert_id}"] [data-act="quick"]')))
    d.save_screenshot(str(OUT / "Z01a-tren-trang-zalo-cua-duc.png"))
    btn.click()
    time.sleep(1)
    d.close()
    d.switch_to.window(app_tab)
except Exception as e:
    print("bỏ qua bước trang Zalo:", type(e).__name__)
    d.switch_to.window(app_tab)
    post(f"/api/alerts/{alert_id}/reply", {"choice": "dung-chuyen"})
shot("A08c-hoi-nguoi-than-tra-loi", "A08c-tra-loi-tu-trang-zalo")

open_("", "/cuoc-goi?so=0987654321")
shot("A03b-do-chuong-chua-ro")
open_("", "/khong-ghi-am")
shot("A04c-khong-co-ghi-am")
open_("", "/dung-lai?phut=4")
shot("A10a-phanh-sau-cuoc-goi")

d.quit()
print("\n".join(errors) if errors else "Xong, không lỗi.")
sys.exit(1 if errors else 0)
