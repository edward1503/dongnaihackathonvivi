"""S1: bốn mẫu nhanh của màn A06a phải ra đúng bốn màn A07a–d."""


def test_so_bi_bao_ra_nguy_hiem(client):
    r = client.post("/api/check", json={"value": "0912 345 678"}).json()
    assert r["level"] == "danger"
    assert r["kind"] == "phone"
    assert r["display"] == "0912 345 678"
    assert r["headline"] == "14 người đã báo số này giả danh công an."
    assert r["why"][0] == "14 báo cáo trong 7 ngày, gần nhất hôm qua"
    assert "Đội tình nguyện đã xác nhận" in r["why"]
    assert r["reports"]["count"] == 14 and r["reports"]["verified"]
    assert r["scamType"] == "gia_danh_cong_an"
    assert r["todo"][0] == "Cúp máy, không gọi lại."


def test_duong_dan_la_ra_nghi_ngo_3_dau_hieu(client):
    r = client.post("/api/check", json={"value": "qua-tri-an-khach-hang.top"}).json()
    assert r["level"] == "suspicious"
    assert r["kind"] == "link"
    assert r["headline"] == "Trang này có 3 dấu hiệu của trang giả mạo."
    assert r["why"] == [
        "Tên miền mới đăng ký 3 ngày",
        "Tên gần giống trang chính thức",
        "Đuôi .top ít dùng cho trang chính thống",
    ]


def test_tong_dai_that_ra_an_toan(client):
    r = client.post("/api/check", json={"value": "1900 5555 88"}).json()
    assert r["level"] == "safe"
    assert r["source"] == "directory"
    assert r["display"] == "1900 5555 88"
    assert r["headline"] == "Số này khớp danh bạ tổng đài."
    assert r["note"] == "Lá chắn chưa xác minh người đang gọi."


def test_so_chua_ai_bao_ra_chua_co_du_lieu(client):
    r = client.post("/api/check", json={"value": "0987 654 321"}).json()
    assert r["level"] == "unknown"
    assert r["headline"] == "Chưa ai báo cáo số này."
    assert r["note"] == "Điều đó không có nghĩa là an toàn."


def test_tai_khoan_che_giua(client):
    r = client.post("/api/check", json={"value": "190388885678", "kind": "account"}).json()
    assert r["kind"] == "account"
    assert r["display"] == "1903 xxxx 5678"
    # Chỉ có báo cáo đang chờ duyệt -> chưa được tính
    assert r["level"] == "unknown"
    assert r["headline"] == "Chưa ai báo cáo tài khoản này."


def test_chi_danh_ba_trang_moi_cho_an_toan(client):
    for v in ["0987 654 321", "trang-la.com", "123456789012"]:
        assert client.post("/api/check", json={"value": v}).json()["level"] != "safe"
    assert client.post("/api/check", json={"value": "https://dichvucong.gov.vn/abc"}).json()["level"] == "safe"


def test_so_ngan_va_rong_bao_loi(client):
    assert client.post("/api/check", json={"value": "  "}).status_code == 400
    r = client.post("/api/check", json={"value": "12"})
    assert r.status_code == 400 and "ngắn" in r.json()["detail"]


def test_tra_so_nhanh_cho_android(client):
    r = client.get("/api/lookup/phone/+84912345678").json()
    assert r["level"] == "danger" and r["display"] == "0912 345 678"


def test_nhan_het_han_sau_90_ngay(client, monkeypatch):
    from lcs import config
    from datetime import date
    monkeypatch.setattr(config, "demo_today", lambda: date(2027, 3, 1))
    r = client.post("/api/check", json={"value": "0912 345 678"}).json()
    assert r["level"] == "unknown"
