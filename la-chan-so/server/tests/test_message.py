"""S2, S3, S4: tin nhắn, cuộc gọi, che số, OTP, AI giả lập."""
import pytest

from conftest import SAMPLE_MESSAGE
from lcs import ai
from lcs.masking import has_otp, mask


def test_tin_viec_nhe_luong_cao_ra_nguy_hiem(client):
    r = client.post("/api/analyze/message", json={"text": SAMPLE_MESSAGE}).json()
    assert r["level"] == "danger"
    assert r["scamType"] == "viec_nhe_luong_cao"
    assert r["scamLabel"] == "Lừa đảo tuyển cộng tác viên"
    assert r["headline"] == "Đừng nạp 200.000 đồng. Đừng mở đường dẫn trong tin."
    assert [s["text"] for s in r["signs"]] == [
        "Hứa thu nhập cao bất thường",
        "Đòi nạp tiền trước khi làm",
        "Giục làm gấp, kèm đường dẫn lạ",
    ]
    for s in r["signs"]:
        for q in s["quotes"]:
            assert q in r["maskedText"]
    assert r["source"] == "heuristic"


def test_tin_doa_khoa_tai_khoan(client):
    text = "Tài khoản ngân hàng của quý khách sẽ bị khóa trong 24h. Xác minh ngay tại ngan-hang-xacminh.top để tránh gián đoạn."
    r = client.post("/api/check", json={"value": text, "kind": "message"}).json()
    assert r["kind"] == "message"
    assert r["level"] == "danger"
    assert r["scamType"] == "duong_dan_gia"


def test_tin_qua_ngan_khong_doan_bua(client):
    r = client.post("/api/analyze/message", json={"text": "Alo, gọi lại anh nhé"}).json()
    assert r["level"] == "unknown"
    assert r["reason"] == "insufficient"
    assert r["headline"] == "Tin nhắn quá ngắn. AI không đoán bừa."


def test_tin_co_otp_khong_gui_ai(client, monkeypatch):
    called = []
    monkeypatch.setattr(ai, "available", lambda: True)
    monkeypatch.setattr(ai, "analyze_text", lambda *a, **k: called.append(1))
    r = client.post("/api/analyze/message", json={"text": "Mã OTP của bạn là 123456, không chia sẻ cho ai."}).json()
    assert r["reason"] == "otp"
    assert not called


def test_che_so_dien_thoai_va_tai_khoan():
    out, n = mask("Gọi 0912 345 678 hoặc +84 912 345 678, chuyển vào TK 1903 8888 5678 số tiền 500.000 đồng")
    assert "0912" not in out and "1903" not in out
    assert out.count("[SĐT]") == 2 and "[TK]" in out
    assert "500.000" in out
    assert n == 3


def test_che_tai_khoan_nhung_giu_so_dien_thoai():
    out, _ = mask("Mẹ vừa nhận cuộc gọi từ số 0912 345 678, họ bảo chuyển vào 190388885678", phones=False)
    assert "0912 345 678" in out and "[TK]" in out


def test_nhan_otp():
    assert has_otp("Ma xac thuc cua ban la 482913")
    assert has_otp("123456 là mã OTP của bạn")
    assert not has_otp("Không đọc mã xác thực (OTP) cho ai")


def test_cuoc_goi_ban_chep_loi_ra_nguy_hiem(client):
    transcript = (
        "Người gọi: Tôi là cán bộ điều tra. Bà có liên quan đến một vụ án rửa tiền.\n"
        "Người gọi: Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút.\n"
        "Người gọi: Việc này không được nói với ai, kể cả con cái."
    )
    r = client.post("/api/analyze/call", data={"transcript": transcript, "phone": "0912345678", "unknownNumber": "true"}).json()
    assert r["level"] == "danger"
    assert r["headline"] == "Người gọi đòi chuyển tiền và dặn giữ bí mật."
    assert [s["text"] for s in r["signs"]] == ["Giả danh cơ quan chức năng", "Đòi chuyển tiền", "Giục gấp, bắt giữ bí mật"]
    assert r["why"] == ["14 người đã báo số này", "Số chưa từng liên lạc với bà", "Bản ghi có câu đòi chuyển tiền"]
    assert r["display"] == "0912 345 678"


def test_cuoc_goi_co_tep_nhung_khong_co_ai_dung_ban_mau(client):
    r = client.post("/api/analyze/call", files={"audio": ("ghi-am.mp3", b"ID3fake", "audio/mpeg")}).json()
    assert r["source"] == "fallback"
    assert r["level"] == "danger"
    assert "Người gọi:" in r["maskedText"]


def test_cuoc_goi_thieu_dau_vao(client):
    assert client.post("/api/analyze/call", data={}).status_code == 400


# ---------- AI giả lập: kiểm lại JSON của AI ----------

@pytest.fixture()
def fake_ai(monkeypatch):
    box = {}

    async def fake(masked, mode):
        box["seen"] = masked
        return box["reply"]

    monkeypatch.setattr(ai, "available", lambda: True)
    monkeypatch.setattr(ai, "analyze_text", fake)
    return box


def test_ai_khong_duoc_noi_an_toan(client, fake_ai):
    fake_ai["reply"] = {"enoughInfo": True, "level": "safe", "scamType": "none", "scamLabel": "", "headline": "Ổn",
                        "signs": [], "todo": [], "confidence": 0.9}
    r = client.post("/api/analyze/message", json={"text": "Chào bạn, hẹn gặp ở quán cà phê lúc 7 giờ tối mai nhé bạn ơi"}).json()
    assert r["level"] == "unknown"
    assert r["source"] == "ai"


def test_ai_bo_trich_dan_bia(client, fake_ai):
    fake_ai["reply"] = {"enoughInfo": True, "level": "danger", "scamType": "viec_nhe_luong_cao",
                        "scamLabel": "Lừa đảo tuyển cộng tác viên", "headline": "Đừng nạp tiền.",
                        "signs": [{"text": "Hứa lương cao", "quotes": ["việc nhẹ lương cao 500k/ngày", "câu không có thật"]}],
                        "todo": ["Không trả lời."], "confidence": 0.92}
    r = client.post("/api/analyze/message", json={"text": SAMPLE_MESSAGE}).json()
    assert r["source"] == "ai"
    assert r["signs"][0]["quotes"] == ["việc nhẹ lương cao 500k/ngày"]


def test_ai_nhan_ban_da_che(client, fake_ai):
    fake_ai["reply"] = {"enoughInfo": False, "level": "unknown", "scamType": "none", "scamLabel": "", "headline": "",
                        "signs": [], "todo": [], "confidence": 0.3}
    client.post("/api/analyze/message", json={"text": "Gọi lại cho anh số 0912 345 678 nhé, chuyển vào 190388885678"})
    assert "0912" not in fake_ai["seen"] and "[SĐT]" in fake_ai["seen"] and "[TK]" in fake_ai["seen"]


def test_ai_loi_thi_dung_du_phong(client, monkeypatch):
    async def boom(*a, **k):
        raise ai.AIUnavailable("hết giờ")

    monkeypatch.setattr(ai, "available", lambda: True)
    monkeypatch.setattr(ai, "analyze_text", boom)
    r = client.post("/api/analyze/message", json={"text": SAMPLE_MESSAGE}).json()
    assert r["level"] == "danger" and r["source"] == "fallback"
