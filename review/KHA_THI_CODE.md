# Thiết kế này code thế nào trong 24 giờ

> **Cập nhật 11:15 – bản V3.** Thiết kế nộp là trang Figma "V3 – Gọn, 3 đối tượng" (42 màn, xem trước ở `mockup/v3.html`). Tên màn đổi theo nhóm: A người lớn tuổi, B học sinh, C đội tình nguyện; các số màn trong bảng bên dưới là số cũ của bản V2. Bản V3 thêm hai việc phải code: **mã đội** (C0, C0a: một bảng `teams(code, ward)`, so mã rồi lưu cờ trên máy, khoảng 0,5 giờ) và **duyệt báo cáo** (C4, C4a: danh sách báo cáo chờ duyệt, bấm "Xác nhận" thì ghi vào bảng `entries`, khoảng 1,5 giờ). Tổng phần chắc chắn làm thành khoảng 34 giờ, sát giới hạn của hai người; nếu chậm thì cắt thêm màn C3.

Dành cho hai thành viên đội khi vào chung kết. Luật yêu cầu hiện thực hóa đúng sản phẩm đã thiết kế, nên mọi nút vẽ ra trong mockup đều phải chạy được. Bảng dưới cho biết mỗi màn code bằng gì và tốn bao nhiêu.

## 1. Nguyên tắc đã áp vào thiết kế

- **Không đăng nhập, không tài khoản.** Vai trò, phường, người thân, lịch sử kiểm tra lưu ngay trên máy (localStorage). Vì vậy báo cáo luôn ẩn danh, không cần công tắc.
- **Một cỡ chữ cho mọi vai trò** (cỡ lớn). Vai trò chỉ đổi 3 thứ: cách xưng hô (Bác / bạn), màn mở đầu (Trang chủ / Bài học / Thống kê), và ô thứ hai trên trang chủ (đội tình nguyện thấy "Thống kê" thay cho "Bài học").
- **29 màn nhưng chỉ khoảng 12 thành phần.** Ba màn kết quả là một thành phần. Sáu màn trạng thái (đang kiểm tra, mất mạng, đã gửi, chưa có người thân, chờ trả lời, chưa có báo cáo) là một thành phần gồm biểu tượng, tiêu đề, một câu, nút.
- **Không dùng thư viện bản đồ, biểu đồ, tải ảnh.** Bản đồ ô là lưới CSS, biểu đồ là các thanh `div`.
- **Chỉ xin một quyền là micro**, và chỉ khi người dùng bấm "Đọc số". Không đọc danh bạ (người thân nhập tay), không đọc tin nhắn (người dùng tự dán), không dùng vị trí (phường chọn tay), không gửi thông báo đẩy.
- **Tính năng phụ thuộc trình duyệt thì tự ẩn khi không hỗ trợ.** Nút "Đọc số" và "Nghe" chỉ hiện khi máy có Web Speech API.

## 2. Những thứ đã bỏ hoặc đổi để vừa sức

| Thiết kế cũ | Vấn đề khi code | Đã đổi thành |
|---|---|---|
| Ghi âm cuộc gọi | iPhone và Android đều chặn | 4 câu Có/Không sau cuộc gọi |
| Nút "Thêm ảnh" ở báo cáo | Cần kho lưu ảnh; ảnh chụp tin nhắn chứa thông tin cá nhân | Bỏ |
| Công tắc "Gửi ẩn danh" | Không có tài khoản thì tắt công tắc cũng không có tên để lưu | Dòng chữ "Ẩn danh, không lưu tên." |
| "Tạo thẻ cảnh báo" | Phải dựng ảnh từ HTML và thêm một màn xem trước | "Chia sẻ cảnh báo": gửi một đoạn chữ qua bảng chia sẻ của máy (vào được Zalo) |
| Nút tải xuống, bộ lọc tháng và khu vực ở thống kê | Ba tính năng nhỏ, mỗi cái thêm một màn chọn | Bỏ nút tải; tháng và khu vực là dòng chữ |
| "Đã gửi cho Lan" | Ứng dụng chỉ mở được ứng dụng tin nhắn, không biết tin đã gửi hay chưa | "Chờ Lan trả lời" |
| Màn giọng nói gộp đọc to và đọc số | Hai chức năng khác nhau trong một màn | Màn 11 chỉ còn đọc số; đọc to là nút "Nghe" trên thanh tiêu đề |
| Micro trong ô tìm ở trang chủ | Trùng với nút "Đọc số" | Bỏ |
| "98% lừa đảo" | Không có mô hình nào cho ra con số này | "3 dấu hiệu" (đếm được) |

Bốn màn thêm vào vì khi code chắc chắn phải có: chọn phường (1a), kiểm tra đường dẫn (2 – Đường dẫn), thêm người thân (5c), danh sách bài học (6 – Danh sách).

## 3. Từng màn: logic và công sức

Công sức tính theo giờ của một người.

| Màn | Logic | Giờ |
|---|---|---|
| Khung dự án, token màu, thành phần dùng chung, điều hướng | React + Vite + Tailwind; 12 thành phần; 4 mục điều hướng (Trang chủ, Bài học, Báo cáo, Cá nhân) | 3 |
| 0. Chọn vai trò, 1a. Chọn phường, 12. Cá nhân | Lưu `role`, `ward` vào máy; màn Cá nhân là ba dòng dẫn tới các màn đã có và một công tắc tự đọc to | 1.5 |
| 1. Trang chủ | Dòng cảnh báo lấy kiểu lừa đảo nhiều nhất của phường; "Gần đây" đọc lịch sử trên máy | 1.5 |
| 2. Kiểm tra nhanh (số, đường dẫn), 2a, 2b | Bàn phím số là lưới 12 nút; "Dán" đọc bộ nhớ tạm; nội dung dán có dấu cách thì coi là tin nhắn và chuyển sang màn 10 | 2.5 |
| 3. Kết quả ba mức | Tra bảng `entries`: có trong danh sách đen thì Nguy hiểm, có trong danh bạ chính thức thì An toàn, còn lại Nghi ngờ. Lý do ghép từ kiểu lừa đảo và số lượt báo cáo. "Nghe" gọi `speechSynthesis` | 2.5 |
| Dữ liệu mẫu | 10 tình huống, 120 báo cáo chia theo 9 phường và 6 kiểu, danh bạ chính thức | 2 |
| 4. Báo cáo, 4a, 4b | Ghi một dòng vào bảng `reports` kèm phường đang chọn | 1.5 |
| 5, 5a, 5b, 5c. Người thân | Lưu tên, quan hệ, số điện thoại trên máy; gửi bằng liên kết `sms:`, gọi bằng `tel:` | 2 |
| 1b. Khẩn cấp, 1c. 4 câu | Màn tĩnh + `tel:`; có đòi tiền hoặc mã OTP, hoặc từ 2 câu "Có", thì ra Nguy hiểm, còn lại Nghi ngờ; dùng lại màn kết quả | 1.5 |
| 6. Bài học (danh sách, thẻ) | Nội dung trong một tệp JSON; mỗi thẻ cùng một khuôn (nhãn, tin nhắn, tiêu đề, gạch đầu dòng) | 2.5 |
| 7, 7a, 8. Bài kiểm tra | 5 câu trong tệp JSON; chấm điểm; huy hiệu theo ngưỡng điểm; liệt kê câu sai | 2 |
| 9, 9a. Thống kê | Gom nhóm `reports` theo phường và theo kiểu; tô màu ô theo 5 bậc; "Chia sẻ cảnh báo" gọi `navigator.share` | 3 |
| 10. Phân tích tin nhắn | Bộ từ khóa (khóa tài khoản, mã OTP, chuyển tiền, trúng thưởng, đường dẫn) để tô đậm và đếm dấu hiệu | 2 |
| Chạy thử trên điện thoại thật, đưa lên mạng, tập trình bày | | 4 |
| 0b. Quyền riêng tư | Màn tĩnh, hiện một lần, lưu cờ đã đồng ý vào máy | 0.5 |
| **Tổng phần chắc chắn làm** | | **32** |
| Nếu kịp: gọi mô hình ngôn ngữ cho màn 10 | Một hàm phía máy chủ giữ khóa API, trả về mức và cụm từ đáng ngờ; lỗi thì dùng bộ từ khóa | 1.5 |
| Nếu kịp: 11, 11a, 11b. Đọc số bằng giọng nói | `SpeechRecognition` tiếng Việt; chạy tốt trên Chrome Android, trên iPhone không ổn định nên tự ẩn. 11a hiện trước khi trình duyệt hỏi quyền micro; bị từ chối thì sang 11b | 2 |

Hai người trong 24 giờ có khoảng 34–38 giờ làm việc thực sau khi trừ ăn, ngủ và ghép code, nên 32 giờ là vừa nhưng không dư nhiều. Nếu chậm tiến độ, cắt theo thứ tự: đọc số bằng giọng nói, mô hình ngôn ngữ, 1c, bài học thứ 2 và 3.

## 4. Dữ liệu

| Bảng | Cột | Ghi chú |
|---|---|---|
| `entries` | `value`, `kind` (điện thoại / đường dẫn / tài khoản), `level` (nguy hiểm / chính thức), `category`, `report_count` | Tra khi kiểm tra |
| `reports` | `kind`, `value`, `category`, `ward`, `created_at` | Ghi khi báo cáo; thống kê đọc từ đây |
| Tệp tĩnh | `wards.json` (9 phường), `lessons.json`, `quiz.json`, `keywords.json` | Đi kèm ứng dụng |
| Trên máy | `role`, `ward`, `relative`, `history` | localStorage |

Chỉ cần hai bảng trên máy chủ. Nếu Supabase gặp trục trặc trong lúc thi, có thể thay bằng hai tệp JSON đi kèm ứng dụng mà giao diện không đổi.

## 5. Chia việc gợi ý

- **Người A:** khung dự án, thành phần dùng chung, trang chủ, kiểm tra, kết quả, khẩn cấp, người thân.
- **Người B:** dữ liệu mẫu và hai bảng, báo cáo, thống kê, bài học, bài kiểm tra, phân tích tin nhắn.
- Bốn giờ cuối cả hai cùng chạy thử trên điện thoại và tập trình bày theo đúng luồng prototype: 0 → 1 → 2 → 3 → 5.
