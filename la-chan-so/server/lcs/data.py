"""Dữ liệu giả lập. Các danh sách lấy từ prototype/mock-data.js để kết quả khớp bản mẫu đã nộp."""

SCAM_TYPES = {
    "duong_dan_gia": "Đường dẫn giả mạo",
    "gia_danh_cong_an": "Giả danh công an",
    "viec_nhe_luong_cao": "Việc nhẹ lương cao",
    "nguoi_than_tai_nan": "Người thân gặp tai nạn",
    "gia_dien_luc": "Giả nhân viên điện lực",
    "qua_tri_an": "Quà tri ân",
    "dau_tu_lai_cao": "Đầu tư lãi cao",
    "khac": "Khác",
}

# Kiểu lừa đảo -> mã bài học của Mảng 4 (hoc.html?kieu=…), theo bảng bi_danh trong bai-hoc/KICH-BAN-BAI-HOC.md.
# Kiểu chưa có bài thì không có ở đây: app mở thư viện bài.
LESSONS = {
    "gia_danh_cong_an": "gia-danh-co-quan",
    "viec_nhe_luong_cao": "viec-nhe-luong-cao",
    "nguoi_than_tai_nan": "nguoi-than-gap-nan",
    "dau_tu_lai_cao": "dau-tu-lai-cao",
}

EMERGING_TITLES = {
    "gia_dien_luc": "Giả nhân viên điện lực báo cắt điện",
}

# Danh bạ trắng: chỉ những mục này mới cho kết quả "An toàn"
OFFICIAL_NUMBERS = {
    "1900555588": "Tổng đài chăm sóc khách hàng",
    "1900545454": "Tổng đài chăm sóc khách hàng",
    "113": "Đường dây nóng 113",
}
OFFICIAL_DOMAINS = {
    "dichvucong.gov.vn": "Cổng dịch vụ công",
    "chinhphu.vn": "Cổng thông tin điện tử Chính phủ",
}

SUSPECT_TLDS = (".top", ".xyz", ".click", ".info", ".icu", ".cyou")
SHORTENERS = ("bit.ly", "tinyurl.com", "cutt.ly", "t.ly", "s.id", "rb.gy", "shorturl.at")
LOOKALIKE_WORDS = (
    "tri-an", "khach-hang", "ngan-hang", "nganhang", "xacminh", "xac-minh", "xacthuc",
    "xac-thuc", "dichvucong", "chinhphu", "dien-luc", "dienluc", "cong-an", "congan", "hoan-tien",
)
# Tuổi tên miền (ngày) giả lập; triển khai thật thì tra WHOIS
DOMAIN_AGE_DAYS = {
    "qua-tri-an-khach-hang.top": 3,
    "ngan-hang-xacminh.top": 5,
    "qua-tri-an.top": 9,
}

TODO = {
    ("danger", "phone"): ["Cúp máy, không gọi lại.", "Không chuyển tiền, không đọc mã xác thực (OTP)."],
    ("danger", "link"): ["Không bấm, không nhập mật khẩu hay mã xác thực (OTP).", "Muốn vào trang thật, hãy tự gõ địa chỉ."],
    ("danger", "account"): ["Không chuyển tiền vào tài khoản này.", "Đã lỡ chuyển? Gọi ngay ngân hàng của bạn."],
    ("suspicious", "link"): ["Không bấm, không nhập mật khẩu hay mã xác thực (OTP).", "Muốn vào trang thật, hãy tự gõ địa chỉ."],
    ("safe", "phone"): ["Đừng đọc mã xác thực (OTP) cho bất kỳ ai, kể cả người tự xưng tổng đài."],
    ("safe", "link"): ["Kiểm tra đúng địa chỉ trên thanh trình duyệt trước khi nhập thông tin."],
}

NOUN = {"phone": "số này", "link": "đường dẫn này", "account": "tài khoản này"}

REPLY_PRESETS = {
    "dung_chuyen": "Mẹ đừng chuyển! Con gọi mẹ ngay.",
    "nguoi_quen": "An toàn, đây là người quen.",
}

# Bản chép lời mẫu của cuộc gọi demo (màn A04b), chỉ dùng khi không gọi được AI
DEMO_TRANSCRIPT = [
    ("Người gọi", "Tôi là cán bộ điều tra. Bà có liên quan đến một vụ án rửa tiền."),
    ("Người gọi", "Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút."),
    ("Người gọi", "Việc này không được nói với ai, kể cả con cái."),
]
