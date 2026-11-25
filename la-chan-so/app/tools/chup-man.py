"""Đi hết các luồng của app (giao diện V3, 3 đối tượng) bằng cách bấm như người dùng, chụp từng màn để soát.

Cần: máy chủ đang chạy và phục vụ bản build (python server/chay-demo.py, hoặc uvicorn lcs.main:app --port 8000), Firefox, selenium.
Chạy:  python app/tools/chup-man.py [thư-mục-ảnh] [địa-chỉ]
Máy Minh: dùng trang Zalo của Mảng 5 (/zalo) nếu máy chủ có, không thì gọi thẳng API trả lời.
"""
from http.cookiejar import CookieJar
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

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "chup")
BASE = (sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8000").rstrip("/")
OUT.mkdir(parents=True, exist_ok=True)
errors: list[str] = []
family = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def post(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body or {}).encode(), method="POST", headers={"Content-Type": "application/json"})
    return json.loads(family.open(req, timeout=10).read())


def get(path):
    return json.loads(family.open(BASE + path, timeout=10).read())


opts = Options()
opts.add_argument("-headless")
service = None
if Path("/snap/bin/geckodriver").exists():   # Firefox bản snap (Ubuntu)
    from selenium.webdriver.firefox.service import Service
    tmp = Path.home() / "snap" / "firefox" / "common" / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    os.environ["TMPDIR"] = str(tmp)
    tempfile.tempdir = str(tmp)
    service = Service(executable_path="/snap/bin/geckodriver")
d = webdriver.Firefox(options=opts, service=service)
d.set_window_size(1000, 960)   # rộng hơn 600px: app hiện trong khung điện thoại 390x844
wait = WebDriverWait(d, 10)


def screen(name, file=None):
    """Chờ tới màn có data-name bắt đầu bằng `name`, rồi chụp khung điện thoại."""
    try:
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, f'.phone[data-name^="{name}"]')))
        time.sleep(0.6)
        d.find_element(By.CSS_SELECTOR, ".phone").screenshot(str(OUT / f"{file or name}.png"))
        print("chụp", file or name)
    except Exception:
        here = d.find_elements(By.CSS_SELECTOR, ".phone")
        errors.append(f"không tới màn {name} (đang ở {here[0].get_attribute('data-name') if here else d.current_url})")


def click(text, css="button"):
    xp = f'//{css}[contains(normalize-space(.), "{text}")]'
    try:
        el = wait.until(EC.element_to_be_clickable((By.XPATH, xp)))
        d.execute_script("arguments[0].scrollIntoView({block:'center'})", el)
        el.click()
    except Exception as e:
        here = d.find_elements(By.CSS_SELECTOR, ".phone")
        errors.append(f"không bấm được “{text}” ở {here[0].get_attribute('data-name') if here else d.current_url}: {type(e).__name__}")


def key_in(digits):
    for ch in digits:
        d.find_element(By.CSS_SELECTOR, f'.key[aria-label="{ch}"]').click()


def hash_(h):
    d.execute_script("location.hash = arguments[0]", h)


def text_of_phone():
    return d.find_element(By.CSS_SELECTOR, ".phone").text


family.open(BASE + "/zalo", timeout=10).close()
post("/api/demo/reset")
d.get(BASE + "/")
d.execute_script("localStorage.clear()")

# ---------- Người dùng mới: màn chào -> chọn vai -> quyền riêng tư -> phường -> trang chủ ----------
d.get(BASE + "/#/chao")
screen("00-man-chao")
click("Bắt đầu")
screen("0-chon-vai")
click("Người lớn tuổi")
screen("0b-quyen-rieng-tu")
click("Đồng ý")
screen("0c-chon-phuong")
click("Tiếp tục")
screen("A1-trang-chu-lon-tuoi")

# ---------- Bà Hoa: kiểm tra số bằng bàn phím -> Nguy hiểm -> hỏi Minh -> Minh trả lời ----------
click("Số lạ, đường dẫn")
screen("A2-kiem-tra-so")
key_in("0912345678")
click("Kiểm tra")
screen("A3-ket-qua-danger")
if "NGUY HIỂM" not in text_of_phone():
    errors.append("A3 không ghi NGUY HIỂM")
click("Hỏi người thân")
screen("A4-hoi-nguoi-than")
click("Gửi cho Minh")
screen("A4b-cho-tra-loi")
ask = [e for e in get("/api/events?room=gia-dinh-hoa&since=1")["events"] if e["type"] == "ask.sent"][-1]["data"]
post(f"/api/asks/{ask['askId']}/seen")
time.sleep(2.2)
if "đã xem" not in text_of_phone():
    errors.append("A4b không hiện 'Minh đã xem'")
post(f"/api/asks/{ask['askId']}/reply", {"preset": "dung_chuyen"})
screen("A4r-nguoi-than-tra-loi")

# ---------- Ba mức còn lại ----------
for value, tab, level in [("qua-tri-an-khach-hang.top", "text", "suspicious"), ("1900555588", "phone", "safe"), ("0987654321", "phone", "unknown")]:
    hash_(f"/kiem-tra?loai={tab}&v={value}&tudong=1")
    screen(f"A3-ket-qua-{level}")

# ---------- Cuộc gọi lừa đảo: đổ chuông -> Bé Nai hỏi -> AI phân tích -> tự báo Minh -> Minh trả lời trên Zalo ----------
post("/api/demo/reset")
d.execute_script("localStorage.removeItem('lcs.known')")
hash_("/cuoc-goi?so=0912345678")
screen("A03a-do-chuong-nguy-hiem")
click("Nghe")
screen("A04a-be-nai-hoi")
click("Có")
screen("A04b-phan-tich-ghi-am")
time.sleep(2.5)
alerts = [a for a in get("/api/alerts") if a["id"] != "al_demo"]
if not alerts:
    errors.append("A04b không báo Minh")
else:
    zalo_ok = False
    try:
        urllib.request.urlopen(BASE + "/zalo", timeout=5)
        app_tab = d.current_window_handle
        d.switch_to.new_window("tab")
        d.get(BASE + "/zalo")
        time.sleep(2.5)
        btn = d.find_elements(By.CSS_SELECTOR, f'.msg-card[data-id="{alerts[0]["id"]}"] [data-act="quick"]')
        if btn:
            btn[0].click()
            zalo_ok = True
        d.close()
        d.switch_to.window(app_tab)
    except Exception:
        pass
    if not zalo_ok:
        post(f"/api/alerts/{alerts[0]['id']}/reply", {"choice": "dung-chuyen"})
    screen("A4r-nguoi-than-tra-loi", "A4r-tu-trang-zalo")

hash_("/cuoc-goi?so=0987654321")
screen("A03b-do-chuong-chua-ro")
hash_("/dung-lai?phut=4")
screen("A10a-phanh-sau-cuoc-goi")
hash_("/dung-lai?danggoi=1&giay=401")
screen("A10b-phanh-dang-goi")
click("Cúp máy ngay")
screen("A04a-be-nai-hoi", "A04a-sau-khi-cup")

# ---------- Đang bị gọi đòi tiền -> kể lại bằng 4 câu -> kết quả ----------
hash_("/khan-cap")
screen("A5-khan-cap")
click("Kể lại cuộc gọi")
screen("A6-ke-lai-cuoc-goi")
for row in d.find_elements(By.CSS_SELECTOR, ".phone .li"):
    chips = row.find_elements(By.CSS_SELECTOR, ".chip")
    if chips:
        chips[0].click()
click("Xem kết quả")
screen("A3-ket-qua-danger", "A3-tu-loi-ke")

# ---------- Người thân, gọi mô phỏng, đọc số ----------
hash_("/nguoi-than")
screen("A4-nguoi-than")
click("Gọi 113")
screen("A8-goi-dien-mo-phong")
if "mô phỏng" not in text_of_phone():
    errors.append("Gọi 113 không phải màn mô phỏng")
hash_("/nguoi-than/them")
screen("A4c-them-nguoi-than")
hash_("/doc-so")
screen("A7-doc-so")

# ---------- Thiết lập 3 lớp (A02a -> A02b) và Lá chắn đang ngủ (E01a) ----------
d.execute_script("localStorage.setItem('lcs.layers', JSON.stringify({calls:true,messages:false,banking:false,asleep:false}));dispatchEvent(new Event('lcs-layers'))")
hash_("/thiet-lap")
screen("A02a-thiet-lap-dang-lam")
click("Bật")
click("Bật")
screen("A02b-thiet-lap-hoan-tat")
click("Về trang chủ")
screen("A1-trang-chu-lon-tuoi", "A1-sau-thiet-lap")
d.execute_script("localStorage.setItem('lcs.layers', JSON.stringify({calls:true,messages:true,banking:true,asleep:true}));dispatchEvent(new Event('lcs-layers'))")
screen("E01a-la-chan-dang-ngu")
click("Bật lại ngay")
screen("A1-trang-chu-lon-tuoi", "A1-bat-lai")
hash_("/ca-nhan")
screen("0d-ca-nhan")

# ---------- Học sinh: tin nhắn lạ -> phân tích -> báo cáo; bài học; bài kiểm tra ----------
d.get(BASE + "/?mode=full#/")
screen("B1-trang-chu-hoc-sinh")
hash_("/thong-bao")
screen("A05a-thong-bao-noi")
time.sleep(1.5)
click("Xem phân tích")
screen("B3-phan-tich-tin-nhan")
if "Ứng dụng nhắn tin" not in text_of_phone():
    errors.append("B3 mở từ thông báo mà không ghi nguồn 'Ứng dụng nhắn tin'")
click("Báo cáo")
screen("B4-bao-cao")
if "Báo cáo cần app Lá chắn số" not in text_of_phone() or d.find_elements(By.CSS_SELECTOR, ".phone input, .phone textarea"):
    errors.append("B4 trên trình duyệt phải hướng dẫn báo trên máy Android")
hash_("/bai-hoc")
screen("B5-bai-hoc")
d.find_element(By.XPATH, "//button[.//*[text()='Việc nhẹ lương cao'] and .//*[text()='Bài học 1 phút']]").click()
screen("B6-bai-hoc-the-1")
click("Xem dấu hiệu")
screen("B6-bai-hoc-the-2")
hash_("/kiem-tra-bai")
screen("B7-bai-kiem-tra-chua-tra-loi")
for i in range(5):
    opts_ = d.find_elements(By.CSS_SELECTOR, ".phone .li.tap")
    opts_[1].click()   # đáp án đúng luôn ở vị trí giữa trong bộ câu mẫu
    if i == 0:
        screen("B7-bai-kiem-tra-dung")
    click("Câu tiếp")
screen("B8-ket-qua-bai-kiem-tra")
if "5/5" not in text_of_phone():
    errors.append("B8 không ra 5/5 khi trả lời đúng hết")

# ---------- Đội tình nguyện: mã đội -> thống kê -> duyệt -> chia sẻ ----------
d.get(BASE + "/?mode=volunteer#/ma-doi")
screen("C0-ma-doi")
def login(code):
    field = d.find_element(By.CSS_SELECTOR, ".phone input[type=password]")
    field.clear()
    field.send_keys(code)
    click("Đăng nhập")


login("invalid")
screen("C0b-ma-doi-sai")
login(os.environ.get("LCS_TEST_VOLUNTEER_CODE", "246810"))
screen("C1-trang-chu-tinh-nguyen")
click("Điểm nóng theo khu phố")
screen("C2-thong-ke")
hash_("/kieu-moi")
screen("C3-kieu-moi")
hash_("/duyet")
screen("C4-duyet-bao-cao")
card = wait.until(EC.presence_of_element_located((By.XPATH, "//article[.//textarea]")))
target = card.find_element(By.TAG_NAME, "h2").text
card.find_element(By.TAG_NAME, "textarea").send_keys("Đã xem tóm tắt và đối chiếu bằng chứng.")
card.find_element(By.XPATH, ".//button[normalize-space(.)='Xác nhận']").click()
wait.until(lambda driver: "Phiếu của bạn" in text_of_phone() or
           all(row.text != target for row in driver.find_elements(By.CSS_SELECTOR, "article h2")))
hash_("/chia-se")
screen("C4-duyet-bao-cao", "C4-thanh-vien")
hash_("/ca-nhan")
click("Đăng xuất đội")
screen("C0-ma-doi")
login(os.environ.get("LCS_TEST_LEAD_CODE", "999111"))
screen("C1-trang-chu-tinh-nguyen")
hash_("/chia-se")
screen("C5-chia-se-canh-bao")
click("Gửi cảnh báo")
screen("C5b-da-gui-canh-bao")
if not get("/api/broadcasts"):
    errors.append("C5 gửi cảnh báo mà máy chủ không có tin")

d.quit()
print("\n".join(errors) if errors else "Xong, không lỗi.")
sys.exit(1 if errors else 0)
