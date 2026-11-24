# Brief chung cho người dựng màn hình "Lá chắn số"

Bối cảnh: thi thiết kế UX/UI (hackathon), nộp 15:00 hôm nay. Sản phẩm "Lá chắn số" là lớp bảo vệ chống lừa đảo chạy ngầm trên Android (máy Xiaomi), kèm web quản trị cho đội tình nguyện và phần hiển thị cho người thân trong ứng dụng nhắn tin. Người dùng: bà Hoa (65 tuổi, chế độ Đơn giản chữ lớn), Vy (học sinh lớp 11, chế độ Đầy đủ), Minh (con trai bà Hoa), Khoa (tình nguyện viên). Tất cả chữ trên giao diện là tiếng Việt có dấu, câu ngắn, dễ hiểu với người lớn tuổi.

Thư mục dự án (ROOT): thư mục cha của file này (`la-chan-so/`).

## Đọc trước (bắt buộc)
1. `ds.css` — design system, mọi class có sẵn.
2. `icons.js` — danh sách tên icon hợp lệ.
3. `screens/A01-trang-chu.html` — màn mẫu. Bắt chước đúng cấu trúc file, mật độ, cách dùng class.

## Quy ước file
- Mỗi màn một file trong `screens/`, phần `<head>` y như màn mẫu.
- Mỗi khung hình:
  `<section class="shot"><div class="shot-name">A0X – Tên màn · trạng thái</div><div class="frame phone" data-name="A0Xa-ten-khong-dau">…</div></section>`
- `data-name` duy nhất, không dấu, kebab-case, bắt đầu bằng mã màn (đúng như brief riêng ghi).
- Khung điện thoại 360×800: có `.statusbar` ở trên và `.gesture` ở dưới như mẫu. Thêm class `lg` vào `.phone` cho chế độ chữ lớn (bà Hoa).
- Nội dung phải nằm gọn trong khung: không tràn, không bị cắt, không chạm sát đáy. Nếu thật sự cần màn dài thì đặt `style="height:920px"` (tối đa 1000px) trên `.frame`.
- Khung web: `<div class="frame web" data-name="W0X-...">` kích thước 1440×900.

## Ràng buộc kỹ thuật (khung sẽ được chuyển tự động sang SVG để nhập Figma — vi phạm là hỏng bản xuất)
- Chỉ dùng màu đặc. KHÔNG: gradient, box-shadow, background-image, filter, transform, `::before/::after` có nội dung, `text-overflow: ellipsis`, emoji (dùng icon).
- Không dựa vào `overflow:hidden` để cắt/bo góc phần tử con (trừ chính `.frame`). Muốn bo góc thì đặt border-radius trên chính phần tử đó.
- Icon: `<i class="ic s20" data-i="ten"></i>`, chỉ dùng tên có trong `icons.js`. Màu icon theo thuộc tính `color` (dùng các class `c-*`, `muted`, `faint`).
- Được tự vẽ SVG inline (biểu đồ) nếu: chỉ gồm `path/circle/rect/line/polyline`, KHÔNG `<text>`, KHÔNG `<g transform>`, có `viewBox` cùng tỉ lệ với kích thước hiển thị, màu ghi trực tiếp bằng mã hex. Nhãn chữ của biểu đồ viết bằng HTML.
- Ảnh: `<img>` có width/height cố định; bo góc đặt trực tiếp trên `img`. Ảnh nằm trong `../assets/` (một vài ảnh có thể đang được tạo — cứ tham chiếu đúng tên).
- Ưu tiên class có sẵn; thiếu thì viết inline style hoặc `<style>` trong file của bạn (vẫn theo ràng buộc trên). KHÔNG sửa `ds.css`, `icons.js`, `tools/`, hay file màn hình không thuộc phần của bạn.
- Cỡ chữ nhỏ nhất 12px. Vùng bấm tối thiểu cao 40px (chế độ chữ lớn: 56px trở lên).
- Mức cảnh báo luôn có cả màu + icon + chữ (không chỉ dựa vào màu): Nguy hiểm = đỏ + `alert-oct`; Nghi ngờ = cam + `alert`; An toàn = xanh lá + `check-circle`; Chưa có dữ liệu = xám + `help`.
- Nội dung do AI tạo luôn có nhãn nhận biết: `card ai` hoặc `ai-tag` với icon `sparkles`.
- KHÔNG dùng: quốc huy, bản đồ, logo/tên thương hiệu thật (ngân hàng, Zalo, cơ quan công an…), khuôn mặt thật. Số điện thoại, tài khoản, tên miền đều hư cấu.

## Tự kiểm tra (bắt buộc trước khi báo xong)
Chạy từ ROOT: `node tools/export.mjs <MÃ> [<MÃ>…]` (ví dụ `node tools/export.mjs A02 A03`; ~15 giây; chạy song song với người khác được). Lệnh tạo `export/png/<data-name>.png` (ảnh 2x) và `export/svg/<data-name>.svg`.
Dùng công cụ Read mở TỪNG file PNG của bạn và nhìn kỹ: chữ tràn hoặc đè nhau, nội dung bị cắt ở đáy, khoảng trống thừa lớn, icon thiếu (ô vuông), ảnh không hiện, lệch hàng. Sửa rồi xuất lại cho tới khi sạch.

## Báo cáo cuối (ngắn)
Danh sách file và `data-name` đã tạo, kèm điểm nào còn chưa đạt (nếu có). Không dán lại mã nguồn.
