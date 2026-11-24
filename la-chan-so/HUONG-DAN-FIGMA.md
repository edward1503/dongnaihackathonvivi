# Đưa bộ màn hình vào Figma

## 1. Nhập các khung (khoảng 5 phút)
1. Tạo một file Figma mới.
2. Mở thư mục `export/svg/`, chọn tất cả file `.svg`, kéo thả vào canvas Figma.
3. Mỗi file thành một khung (frame) đúng kích thước: điện thoại 360×800 (một số màn dài hơn), web và trang giới thiệu 1440×900. Bên trong là lớp chỉnh sửa được: chữ là lớp chữ, khối là hình chữ nhật, icon là vector, tranh là ảnh.
4. Tên file chính là tên màn (ví dụ `A03a-do-chuong-nguy-hiem`). Sắp các khung theo nhóm: D (giới thiệu), A (app), Z (người thân), W (web), E (trạng thái lỗi/trống).

Lưu ý:
- Font là **Be Vietnam Pro** (có sẵn trong Figma). Nếu Figma hỏi thay font, chọn đúng font này.
- Mỗi dòng chữ là một lớp chữ riêng (đoạn nhiều dòng thành nhiều lớp). Sửa chữ dài hơn thì tự kéo lại vị trí.
- Nếu một file SVG nhập lỗi, dùng ảnh cùng tên trong `export/png/` (ảnh 2x) đặt vào khung cùng kích thước.

## 2. Nối prototype cho luồng chính
Thứ tự gợi ý (bấm nút chính của màn trước để sang màn sau):

`A01a` → `A03a` (nút Nghe) → `A04a` (trợ lý hỏi bằng giọng nói) → `A04b` (đã tự báo Minh) → `Z01a` (Mẹ đừng chuyển / Xem chi tiết) → `Z01b` (Nhắn: Mẹ đừng chuyển!) → `Z01c` → `A08c` → `A10a` → `W02` → `W01` → `W03` → `A11b`

Luồng học sinh: `A01b` (Kiểm tra trước khi chuyển tiền) → `A06a` (Kiểm tra) → `A07a` → `A07d` → `A05a` (Xem phân tích) → `A05b` (Báo cho cộng đồng) → `A09b` (Gửi báo cáo) → `A09a` → `A09c` → `A11a` (Chơi tiếp) → `A11e` → `A11c` → `A11f` → `A11g` → `A11h` → `A11d` → `A12a` → `A12b` → `A12c`

Các màn không nằm trong hai luồng nhưng vẫn thuộc bản thiết kế: `A08a`, `A08b` (bà tự bấm Hỏi người thân), `A03b` (số chưa lưu: Lá chắn im lặng), `A02`, `A04c`, `A06b`, `A07b`, `A07c`, `A10b`, `E01`.

## 2b. Prototype bấm được để nộp (trình duyệt, dữ liệu giả lập)

Mở `prototype/index.html` bằng Chrome (bấm đúp vào file là chạy, không cần máy chủ). Giữ nguyên cấu trúc thư mục: `prototype/` nằm cạnh `screens/`, `assets/`, `export/png/`, `ds.css`, `icons.js`, `motion.css`, `motion.js`.

**Hai chế độ (nút trên thanh đầu trang):**
- **Dùng thử tự do** (mặc định, dùng để nộp và cho giám khảo bấm): bấm thẳng vào nút trên màn hình để đi tiếp.
  - Cột phải có: chọn **bạn đang là ai** (Bà Hoa, Vy, Minh, Khoa), **Mô phỏng sự kiện** (có cuộc gọi lạ, shipper gọi, bà mở app ngân hàng, có tin nhắn lạ, thử thách cuối bài…), **Trạng thái lỗi, trống**, nút **Quay lại** và **Về trang chủ**.
  - Bấm vào chỗ không phải nút thì các chỗ bấm được sẽ sáng viền trong giây lát.
- **Xem luồng: cuộc gọi lừa đảo / học sinh**: đi từng bước có chú thích, có nút **Tự chạy** (5 giây mỗi bước) để trình chiếu hoặc quay video.

**Giá trị mẫu để gõ ở màn Kiểm tra nhanh** (hoặc bấm các mẫu "Thử nhanh" dưới ô nhập):
- `0912 345 678` → Nguy hiểm
- `qua-tri-an-khach-hang.top` (hoặc đường dẫn bất kỳ đuôi `.top`, `.xyz`) → Nghi ngờ
- `1900 5555 88` → An toàn (tổng đài đã xác thực)
- số bất kỳ khác, ví dụ `0987 654 321` → Chưa có dữ liệu
- Ở tab Tin nhắn: bấm **Dán** để lấy tin mẫu "việc nhẹ lương cao" → AI phân tích. Tin không có dấu hiệu → "AI chưa đủ thông tin".

**Luồng nên bấm khi trình bày:**
1. Bà Hoa: Mô phỏng "Có cuộc gọi lạ" → **Nghe** → Bé Nai hỏi bằng giọng nói → **Có** → **Gọi Minh ngay** → phía Minh **Mẹ đừng chuyển, con gọi ngay** → **Gọi mẹ ngay** → lời của con hiện trên máy bà.
2. Vy: **Kiểm tra trước khi chuyển tiền** → gõ số mẫu → kết quả; Mô phỏng "Vào học" → **Chơi tiếp** → chạm màn truyện → **Nạp ngay** (ngõ cụt) → **Quay lại điểm rẽ** → **Dừng lại, hỏi cô giáo** → gọi video với chị Lan (avatar khép miệng theo lời) → bảng điểm → bài kiểm tra.
3. Khoa (web): **Kiểm duyệt** → **Xác nhận lừa đảo**.

**Âm thanh:** Bé Nai đọc lời kể ở truyện, ở màn hỏi thăm người cao tuổi, màn "Dừng lại" và bảng điểm (giọng thu sẵn trong `prototype/audio/`). Nút **Giọng Bé Nai** trên đầu trang để bật, tắt. Trình duyệt chỉ cho phát tiếng sau lần bấm đầu tiên.

**Lưu ý:** cần mạng để tải font Be Vietnam Pro (mất mạng vẫn chạy, chữ đổi sang font của máy). Màn nào không tải được sau 2,5 giây sẽ hiện ảnh tĩnh thay thế. Thông số chuyển động ở trang `D04`. Kiểm tra tự động cả ba luồng: `node tools/test-clicks.mjs`.

## 3. Xuất PDF nộp bài
Trong Figma: chọn tất cả khung theo đúng thứ tự → File → Export frames to PDF. Thứ tự trang gợi ý: D01, D02, D05, D03, D04 → A01…A12 → Z01 → W01…W03 → E01.

## 4. Sửa và xuất lại (nếu cần)
Mỗi màn là một file trong `screens/`. Sửa xong chạy `node tools/export.mjs <MÃ>` (ví dụ `node tools/export.mjs A07`) để xuất lại SVG và PNG của màn đó.
