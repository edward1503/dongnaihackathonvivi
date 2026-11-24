# Lá chắn số (Đề 4) · Danh sách tính năng để chia việc

Đội 18 · Bản MVP 24 giờ, ưu tiên Android (máy Xiaomi).

- Prototype bấm được: https://la-chan-so-doi18.vercel.app (web đội tình nguyện: `/web`, máy Minh trong Zalo: `/zalo`)
- Thiết kế trên Figma: https://www.figma.com/design/KqUeRMoL69j6OfeDTwWp2v
- Mã nguồn prototype, 53 màn và bản thuyết minh: ngay trong thư mục này, xem [`README.md`](README.md)

Danh sách chia thành 6 mảng độc lập, mỗi mảng một người cầm được. Mã màn (A03a, Z01b…) là tên khung trong prototype và Figma. Tên API Android trong bảng là gợi ý, chưa được đội chốt.

## Ai nhận mảng nào

| Mảng | Người nhận |
|---|---|
| 1. Android chạy nền | |
| 2. Máy chủ và AI | |
| 3. Giao diện app | |
| 4. Học như chơi game | |
| 5. Người thân trên Zalo | |
| 6. Web đội tình nguyện | |

Nếu đội ít hơn 6 người: gộp mảng 3 với 5 (cùng React, cùng luồng Hỏi người thân) và mảng 4 với 6 (đều chạy từ tệp nội dung và dữ liệu mẫu).

## Việc phải chốt trước khi chia (cả đội, khoảng 1 giờ)

- **Hợp đồng dữ liệu:** JSON kết quả phân tích (mức độ, dấu hiệu, giải thích, kiểu lừa đảo) và các sự kiện đồng bộ giữa ba máy (cảnh báo, trả lời của Minh, báo cáo mới).
- **Bộ thành phần chung:** tách `ds.css` và các màn HTML của prototype thành thành phần React dùng chung cho app, Mini App và web.

## Mảng 1: Android chạy nền (Kotlin)

| Mã | Tính năng | Màn | Mức |
|---|---|---|---|
| N1 | Cảnh báo khi đổ chuông, tra số bị báo (`CallScreeningService`) | A03a, A03b | Làm thật |
| N2 | Sau cuộc gọi: đọc tệp ghi âm do máy tạo (người dùng cấp quyền thư mục một lần), gửi đi chép lời | A04b | Làm thật |
| N3 | Máy không có ghi âm: trợ lý hỏi một câu bằng giọng nói, luôn kèm nút Có, Không | A04a, A04c | Làm thật |
| N4 | Lá chắn tin nhắn: đọc thông báo, lọc sơ bộ trên máy, bỏ qua mọi tin có mã OTP | A05a | Làm thật |
| N5 | Màn "Dừng lại" khi vừa nghe số chưa quen từ 5 phút và mở ứng dụng ngân hàng (quyền xem ứng dụng đang mở, quyền hiển thị trên ứng dụng khác) | A10a, A10b | Làm thật (A10b lúc đang gọi: mô phỏng) |
| N6 | Thiết lập và xin quyền từng bước; phát hiện Lá chắn bị máy tắt | A02a, A02b, E01a | Làm thật |

## Mảng 2: Máy chủ và AI

| Mã | Tính năng | Mức |
|---|---|---|
| S1 | API kiểm tra nhanh 4 loại (số điện thoại, đường dẫn, số tài khoản, tin nhắn), trả 4 mức; danh bạ trắng các tổng đài đã xác thực | Làm thật |
| S2 | Điểm trung gian gọi AI (giấu khóa), trả JSON theo hợp đồng, có kết quả dự phòng cho demo | Làm thật |
| S3 | Chép lời bản ghi âm rồi phân tích kịch bản cuộc gọi | Làm thật |
| S4 | Che số tài khoản, số điện thoại trước khi gửi AI; không lưu nội dung cuộc gọi, tin nhắn | Làm thật |
| S5 | Máy chủ chuyển tiếp đồng bộ ba màn hình (bà Hoa, Minh, Khoa) | Làm thật |
| S6 | Lưu báo cáo, trạng thái kiểm duyệt, nhãn tự hết hạn sau 90 ngày | Làm thật, dữ liệu mẫu |

## Mảng 3: Giao diện app (React trong WebView)

| Mã | Tính năng | Màn |
|---|---|---|
| U1 | Trang chủ hai chế độ: đơn giản (chữ lớn, tối đa 3 lựa chọn, đọc to) và đầy đủ | A01a, A01b |
| U2 | Kiểm tra nhanh và kết quả 4 mức; mức "Chưa có dữ liệu" kèm ba câu tự kiểm tra | A06a, A07a–d |
| U3 | Phân tích tin nhắn, tô đỏ từng dấu hiệu | A05b, A06b |
| U4 | Hỏi người thân phía bà Hoa: gửi, chờ, hiện lời trả lời thật to và đọc thành tiếng | A08a–c |
| U5 | Báo cáo và "Báo cho cộng đồng?" một chạm | A09a–c |
| U6 | Trạng thái lỗi và trống: chưa có người thân, mất mạng, AI chưa đủ thông tin | E01b, E01c, E01d |

## Mảng 4: Học như chơi game

| Mã | Tính năng | Màn | Mức |
|---|---|---|---|
| H1 | Thư viện truyện; truyện chạy từ tệp nội dung; mở đúng truyện theo kiểu lừa đảo vừa gặp | A11a–c | Làm thật |
| H2 | Truyện có lời kể Bé Nai và lối rẽ tự chọn (chọn sai, chọn lại, chọn đúng) | A11e, A11f, A11j | Làm thật |
| H3 | Gọi video khuyên chị Lan (avatar AI, có nhãn "AI đóng vai") rồi AI chấm | A11d, A11g, A11h | Làm thật nếu kịp; không thì giữ kịch bản cố định như prototype |
| H4 | Bảng điểm cuối bài; thi đua nhóm theo trường, phường, thành phố | A11i | Dữ liệu mẫu |
| H5 | Bài kiểm tra có chấm điểm và giải thích từng câu | A12a–c | Làm thật |

## Mảng 5: Người thân trên Zalo

| Mã | Tính năng | Màn | Mức |
|---|---|---|---|
| Z1 | Minh nhận cảnh báo; chỉ thấy mức cảnh báo và tóm tắt đã che | Z01a | Mô phỏng tin OA, đồng bộ qua S5 |
| Z2 | Mini App: xem chi tiết, trả lời một chạm, gọi mẹ ngay | Z01b, Z01c | Làm thật (web hoặc Mini App) |
| Z3 | Báo số cho cộng đồng từ phía Minh | Z01b | Làm thật |

## Mảng 6: Web đội tình nguyện

| Mã | Tính năng | Màn |
|---|---|---|
| W1 | Thống kê: 120 lượt báo cáo trong tháng, 35% là đường dẫn giả mạo, 10 tình huống phổ biến, kiểu mới nổi | W01 |
| W2 | Kiểm duyệt: AI phân loại trước, ca chưa chắc mới tới người duyệt; kênh khiếu nại báo oan | W02 |
| W3 | Nội dung tuyên truyền làm sẵn từ kiểu lừa đảo đang nổi | W03 |

## Thứ tự ưu tiên

1. **Luồng chính của bà Hoa phải chạy thông trước:** N1 → N3 → S2 → S5 → Z2 → U4 → N5. Đây là đoạn trình diễn chính.
2. **Sáu màn bắt buộc của đề:** U2 (kiểm tra nhanh và kết quả), U5 (báo cáo), U4 + Z2 (Hỏi người thân), H1 (bài học 1 phút), H5 (bài kiểm tra có chấm điểm), W1 (màn đội tình nguyện).
3. **Phần còn lại:** N2 + S3, N4 + U3, H2–H4, W2, W3.

## Ghi rõ là tầm nhìn, không làm trong 24 giờ

- Phân tích ngay trong lúc đang gọi (Android và iOS không cho ứng dụng thường thu âm cuộc gọi).
- Gửi tin chủ động qua tài khoản chính thức (OA) trên Zalo: cần xác thực OA; bản 24 giờ đồng bộ qua máy chủ của đội.
- Kết nối kênh tiếp nhận tin báo của Công an: bản 24 giờ chỉ gom bằng chứng thành hồ sơ.
- iPhone: giai đoạn sau, dùng qua Mini App theo kiểu chủ động (dán tin nhắn, chia sẻ ảnh chụp màn hình).

## Quy ước chung

- Dữ liệu trong bản trình diễn là dữ liệu giả lập; không dùng thông tin cá nhân thật.
- Linh vật là Bé Nai. Không dùng quốc huy, bản đồ, logo thật, khuôn mặt người thật.
- Chỉ hiện "An toàn" khi khớp danh bạ đã xác thực; số chưa ai báo cáo thì hiện "Chưa có dữ liệu".
- Trợ lý chỉ được gọi một danh sách hành động cố định (tra số, đọc lịch sử cuộc gọi, phân tích bản ghi, báo người thân, bật màn "Dừng lại") và không bao giờ hỏi mã xác thực hay yêu cầu chuyển tiền.
