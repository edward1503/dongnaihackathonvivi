# BẢN THUYẾT MINH GIẢI PHÁP THIẾT KẾ UX/UI
**Cuộc thi Hackathon Thành phố Đồng Nai năm 2026 – Vòng Sơ loại**
- **Đề thi lựa chọn:** Đề số 2 – PHẢN ÁNH HIỆN TRƯỜNG *(Chính quyền số – Đô thị thông minh)*
- **Tên giải pháp:** **TrấnBiên Trực Tuyến** – Nền tảng Phản ánh Hiện trường 3 bước & Điều phối Bàn giao Đô thị Minh bạch
- **Đường dẫn Bản mẫu bấm được (Prototype):**
  - **Trực tuyến (Mobile App PWA):** https://mobile-app-mu-olive.vercel.app
  - **Ngoại tuyến (Offline trong thư mục nộp bài):** `./prototype/index.html`

---

## (a) Vấn đề thực tiễn, Người dùng & Chuỗi trách nhiệm tại Đồng Nai

Tại địa bàn đô thị đông dân cư như **Phường Trấn Biên**, sự cố hạ tầng (đèn đường hỏng, ổ gà, ngập nước sau mưa, rác tự phát) phát sinh thường xuyên. Thực tế xử lý cấp phường đòi hỏi làm rõ chuỗi bàn giao **ai tiếp nhận – ai xác minh – ai trực tiếp sửa chữa – ai nghiệm thu công khai**:

1. **Người dân & Người cao tuổi (60–75 tuổi):** Ngại cài ứng dụng nặng, chữ nhỏ, nhiều bước nhập liệu; báo xong không biết ai đang xử lý $\rightarrow$ Giải quyết bằng **Mobile PWA mở ngay từ Zalo/QR**, **Wizard 3 màn hình tuần tự (mỗi màn 1 quyết định)**, **Chế độ Chữ lớn xuyên suốt** và thanh kéo xem ảnh **Trước/Sau**.
2. **Đội Thanh niên tình nguyện khu phố:** Bám sát địa bàn hỗ trợ kiểm chứng thực địa cho các tin báo chụp đêm/thiếu sáng, chuyển tiếp lên Phường hoặc **đóng lưu vết đối soát** nếu sự cố đã tự hết, đồng thời hỗ trợ báo hộ người cao tuổi.
3. **Cán bộ tiếp nhận UBND Phường:** Làm việc trên Web Dashboard máy tính; tiếp nhận danh sách đã **gộp trùng bán kính 50m cùng loại**, thực hiện phân loại, **bàn giao cho Đơn vị thực thi chuyên môn kèm hạn xử lý (SLA)** và duyệt công khai kết quả.
4. **Đơn vị thực thi chuyên môn (Điện chiếu sáng, Môi trường Sonadezi, Duy tu Giao thông, Thoát nước):** Nhận bàn giao chính thức từ Phường, khắc phục tại hiện trường và tải lên **Ảnh thực tế sau xử lý**.

> **Số liệu thiết kế chuẩn theo đề (Phường Trấn Biên – Tháng 11/2026):** Tổng **64** phản ánh (*Rác thải 21, Đèn đường 18, Ngập nước 15, Mặt đường 10*), Đã xử lý **47 (73,4%)**, Đang xử lý/chờ xác minh **17**, Thời gian xử lý trung bình **3,2 ngày**.

---

## (b) Luồng sử dụng chính (End-to-End) & Các nhánh quyết định UX

1. **Bước 1/3 – Chụp ảnh & Gợi ý AI định tính:** Người dân chụp/tải ảnh $\rightarrow$ AI kiểm tra chất lượng ảnh (khóa nút tiếp tục và nhắc bật Flash nếu ảnh bị rung nhòe) và gợi ý sơ bộ loại sự cố kèm dấu hiệu nhận biết (không hiển thị con số `%` tự báo thiếu căn cứ hiệu chỉnh).
2. **Bước 2/3 – Xác nhận vị trí GPS & Gộp trùng 50m ngay tại bước 2:** Lấy tọa độ GPS trình duyệt (`navigator.geolocation`) hoặc chọn *Khu phố + Tên đường* khi mất sóng GPS. Hệ thống quét bán kính `50m` cùng danh mục: nếu đã có hàng xóm báo, cho phép bấm **`+1 Đồng tình & gộp ảnh`** ngay mà không bắt qua Bước 3.
3. **Bước 3/3 – Chốt loại sự cố (Tôn trọng khi người dân chọn khác AI):** Nếu người dân không đồng ý với gợi ý của AI và chạm sang loại khác, giao diện xác nhận rõ *"Đã đổi theo lựa chọn của bạn"* và cập nhật lại mô tả tương ứng.
4. **Bàn giao 2 chặng & Đánh giá hài lòng:** Hồ sơ mới chỉ mở quyền **Bàn giao Đơn vị thực thi + Hạn SLA** cho Cán bộ Phường $\rightarrow$ Sau khi giao sang trạng thái *Đang xử lý*, Đơn vị thực thi mới mở khung **Tải ảnh Sau xử lý & Báo hoàn thành** $\rightarrow$ Phường nghiệm thu công khai $\rightarrow$ Người dân kéo xem **Ảnh Trước/Sau** và đánh giá **1–5 sao**.

---

## (c) Danh sách tính năng thực hiện trong 24 giờ tại Vòng Chung kết (MVP khớp 1:1 Prototype)

- **Giờ 1–8 (Phân hệ Người dân – Mobile PWA):** Wizard gửi phản ánh 3 màn hình tuần tự, GPS trình duyệt + chọn đường dự phòng, xử lý chọn khác gợi ý AI, Bản đồ phản ánh quanh tôi, Theo dõi tiến độ 4 mốc, Thanh kéo Trước/Sau & Đánh giá 1–5 sao.
- **Giờ 9–15 (Phân hệ Điều phối, Thực thi & Đoàn viên):** Dashboard Cán bộ Phường (64 đơn, lọc trạng thái, bàn giao 4 đơn vị chuyên môn + hạn SLA), Biểu mẫu tải Ảnh sau xử lý nghiệm thu, Màn hình Đoàn viên xác minh & đóng lưu vết đối soát.
- **Giờ 16–20 (Nhóm Điểm cộng):** Gemini 2.5 Flash Vision API gợi ý phân loại & lọc ảnh mờ; Thuật toán Haversine gộp phản ánh trùng `<= 50m` cùng loại; Chế độ Chữ lớn xuyên suốt cho người cao tuổi.
- **Giờ 21–24 (Kiểm thử & Triển khai):** Hoàn thiện Empty/Error States, nạp dữ liệu Phường Trấn Biên và triển khai Cloud qua mã QR.

---

## (d) Kiến trúc hệ thống & Công nghệ dự kiến

- **Kiến trúc:** **Mobile-First PWA** (Người dân, Người cao tuổi, Đoàn viên) + **Responsive Web Dashboard** (Cán bộ UBND Phường) trên 01 mã nguồn thống nhất.
- **Công nghệ:** `Next.js (React + TypeScript + Tailwind CSS)` + Bản đồ miễn phí `Leaflet.js / OpenStreetMap` + Thuật toán không gian `Haversine (50m)` + `Gemini 2.5 Flash Vision API` + Cơ sở dữ liệu & lưu trữ ảnh `Supabase (PostgreSQL + Storage)`.

---

## (e) Công cụ Trí tuệ nhân tạo đã sử dụng trong Vòng Sơ loại

Đội thi sử dụng **Google Antigravity (Mô hình Gemini)** hỗ trợ: (1) Phân tích luồng bàn giao thực tế giữa 4 tác nhân và phản biện thiết kế Wizard 3 bước; (2) Biên tập nội dung giao diện dễ hiểu cho người cao tuổi, tạo dữ liệu mẫu Phường Trấn Biên và sinh bộ ảnh hiện trường giả lập không chứa thông tin cá nhân thật; (3) Hỗ trợ viết mã HTML/CSS/JS cho Bản mẫu bấm được và dàn trang tài liệu theo đặc tả thiết kế của đội.
