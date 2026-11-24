# REVIEW – Lá chắn số (Đề 4)

Lập lúc 09:55 ngày 24/11/2026. Còn 4 giờ 20 phút tới mốc đóng băng 14:15.
Nguồn: 1 ảnh chụp cả trang Figma (`review/figma/page-full.png`, 20 khung + bảng token). Đã dùng 2 lượt đọc Figma MCP, không dùng thêm.
Mockup hướng thiết kế mới: `review/mockup/huong-thiet-ke-moi.html` (mở bằng trình duyệt), ảnh xem nhanh `review/mockup/tong-quan.png`.

## 0. Vì sao bản hiện tại "xấu" và chưa giống một ứng dụng

Nội dung và luồng đã đủ. Vấn đề nằm ở lớp hiển thị, 6 nguyên nhân:

1. **Mọi thứ đều là hộp viền màu nền nhạt.** Thẻ, nút, cảnh báo, ô nhập đều cùng một kiểu, nên không có gì nổi lên. Trông như bản wireframe hoặc biểu mẫu web.
2. **Màu trạng thái bị dùng để trang trí.** Trang chủ có ô xanh lá "Hỏi người thân" và ô vàng "Học nhận biết lừa đảo"; nút "Gửi qua Zalo/SMS" màu xanh lá. Khi tới màn kết quả, xanh lá / vàng / đỏ không còn sức nặng. Đây cũng là lỗi so với mốc "màu chủ đạo không trùng màu trạng thái".
3. **Không có khung của một ứng dụng.** Thiếu thanh trạng thái, thanh tiêu đề, thanh điều hướng dưới. Đầu màn chỉ có nút "Quay lại" và một nhãn xám dùng lẫn lộn (địa danh, số bước, số điện thoại, "Trạng thái", "Hoàn tất").
4. **Ghi chú của người thiết kế nằm trong giao diện.** Ví dụ: "Chữ thật to (≥ 20px), nút bấm lớn (≥ 56px), xưng hô "Bác", tối đa 3 chạm"; "TRẠNG THÁI 1: ĐANG KIỂM TRA…"; "TRẠNG THÁI LỖI / TRỐNG KHI BẤM GỬI:"; "Khi Bạn bấm nhầm đáp án A:"; "Thẻ 1/4 • TÌNH HUỐNG (Vuốt ngang →)"; "Chế độ: Bác (Chữ lớn) | Chữ lớn: BẬT". Giám khảo sẽ thấy ngay.
5. **Chữ bị cắt và tràn.** "Bấm giữ để đọc số điện thoạ…", "Chọn người thân từ danh bạ" (mất mép phải), "Ghi nhận báo cáo từ người dân" (tràn hai mép), "Bài học 1 phút: Bẫy "Việc nhẹ lương c…", nút "Bấm để nghe đọc hướng dẫn" bị cắt đáy màn Trang chủ, khối "Gợi ý" của màn 0 tràn khỏi khung 844.
6. **Ảnh chụp người thật làm biểu tượng**, nhỏ, lệch tông, sai nghĩa (ảnh người làm đồng làm ảnh đại diện "con gái Nguyễn Thị Lan").

Hướng sửa (chi tiết trong `HANDOFF_ANTI.md`): giữ bảng màu và font, đổi cách dùng. Nền xám nhạt, thẻ trắng đổ bóng không viền; mỗi màn một nút chính; xanh lá / vàng / đỏ chỉ dành cho kết quả và cảnh báo; màn kết quả có mảng màu lớn với biểu tượng 104px; thêm thanh trạng thái, thanh tiêu đề, thanh điều hướng dưới; bỏ ảnh, dùng biểu tượng nét.

## 1. Kiểm kê khung

| Khung | Mục đích | Vai trò | Ghi chú |
|---|---|---|---|
| 0. Chọn vai trò | Chọn 1 trong 3 vai trò | Tất cả | Lộ ghi chú thiết kế, có ảnh người |
| 1. Trang chủ | 3 lối vào chính | Người lớn tuổi | Nút cuối bị cắt |
| 1 (bản "Chữ cực lớn") | Trang chủ thứ hai, tiêu đề đỏ | Người lớn tuổi | Trùng chức năng, nên chuyển thành màn Khẩn cấp |
| 2. Kiểm tra nhanh | Nhập số / đường dẫn / số tài khoản | Tất cả | Đạt về luồng |
| 2 (trạng thái) | Đang kiểm tra + mất mạng | Tất cả | 2 trạng thái dồn 1 khung |
| 3. Kết quả: Nguy hiểm, Nghi ngờ, An toàn | Kết quả 3 mức kèm lý do | Tất cả | Nút "Đừng chuyển tiền" màu xanh ở mức An toàn là vô lý |
| 4. Báo cáo | Báo một trường hợp, ẩn danh | Tất cả | Đạt về luồng |
| 4 (trạng thái) | Đã gửi + lỗi thiếu thông tin | Tất cả | 2 trạng thái dồn 1 khung |
| 5. Hỏi người thân | Gửi tin soạn sẵn | Người lớn tuổi | Ảnh người; thiếu nút gọi điện |
| 5 (trạng thái) | Chưa chỉ định + đã gửi | Người lớn tuổi | 2 trạng thái dồn 1 khung |
| 6. Bài học 1 phút | 4 thẻ theo tình huống | Học sinh | Ghi "vuốt ngang" nhưng xếp dọc cả 4 thẻ |
| 7. Bài kiểm tra | Câu hỏi + phản hồi | Học sinh | Chỉ có trạng thái đã trả lời |
| 7 (trạng thái chọn sai) | Phản hồi khi sai | Học sinh | Đạt |
| 8. Kết quả bài kiểm tra | Điểm 4/5, huy hiệu | Học sinh | Đạt |
| 9. Thống kê đội tình nguyện | 120 lượt, 35%, biểu đồ | Tình nguyện | Thanh biểu đồ quá nhỏ, màu tùy tiện, chưa có bản đồ |
| 9 (trống) | Chưa có dữ liệu | Tình nguyện | Chữ nút tràn |
| 10. AI phân tích tin nhắn | Điểm cộng | Tất cả | "98% lừa đảo" là con số không có cơ sở |
| 11. Giọng nói | Điểm cộng | Người lớn tuổi | Chữ nút bị cắt |

**6 màn bắt buộc: đủ cả 6.** Tên khung: tôi chỉ đọc được chính xác tên khung "0. Chọn vai trò"; các khung trạng thái cần đặt tên riêng theo mẫu ở đợt 2 để PDF có tên màn rõ ràng.
Số liệu khớp đề: 42 + 22 + 18 + 14 + 12 + 12 = 120; 42/120 = 35%.

## 2. Bảng điểm (ước lượng của tôi, chấm như giám khảo khó tính)

| Tiêu chí | Hiện tại | Sau khi sửa | Lý do chính |
|---|---|---|---|
| 1. Hiểu vấn đề, người dùng (25) | 17 | 21 | Đủ 3 nhóm người dùng, xưng hô đúng. Thiếu tình huống "đang bị gọi đòi tiền" và cảnh báo theo phường ngay trang chủ |
| 2. Thiết kế UX/UI (30) | 16 | 25 | Luồng ngắn, có trạng thái lỗi/trống. Mất điểm nặng ở chữ bị cắt, ghi chú lộ trong giao diện, màu trạng thái dùng lẫn, thiếu khung ứng dụng |
| 3. Sáng tạo (20) | 11 | 15 | Có AI và giọng nói. Chưa có bản đồ, dữ liệu địa phương chưa quay lại phục vụ người dân |
| 4. Khả thi, tác động (25) | 17 | 21 | Phạm vi vừa sức. Cần ghi rõ phần mô phỏng, nguồn dữ liệu, kênh Công an là "dự kiến" |
| **Tổng** | **61** | **82** | Tiêu chí 2 lấy lại nhiều nhất, cũng là tiêu chí xét trước khi bằng điểm |

## 3. Rủi ro ĐỎ

| # | Rủi ro | Ở đâu | Xử lý |
|---|---|---|---|
| Đ1 | Ảnh người thật từ Wikimedia Commons, nhận diện được mặt; giấy phép CC BY / BY-SA buộc ghi tác giả | Màn 0 (3 ảnh), 5 (ảnh "con gái"), 7, 9 | Bỏ toàn bộ ảnh. Thay bằng biểu tượng nét trong ô bo góc, ảnh đại diện là chữ cái đầu. Hết ảnh thì thuyết minh không phải ghi nguồn |
| Đ2 | Ghi chú thiết kế lộ trong giao diện | Màn 0, 1, 6, các khung trạng thái | Xóa hoặc thay bằng câu dành cho người dùng (đợt 1) |
| Đ3 | Chữ bị cắt, tràn | Màn 1, 5 (trạng thái), 6, 9 (trống), 11 | Rút chữ, cho nút tự giãn theo chữ (đợt 1) |
| Đ4 | Mức "An toàn" có nút "Đừng chuyển tiền" màu xanh lá | Màn 3 – An toàn | Nút chính đổi thành "Kiểm tra số khác"; giữ dòng lưu ý "Tổng đài thật cũng không yêu cầu Bác chuyển tiền" |
| Đ5 | Tên miền trông như thật: `nhan-qua-tri-an.xyz` | Màn 10 | Đổi thành `nhan-qua-tri-an.example` |
| Đ6 | "98% Lừa đảo" là độ chính xác bịa | Màn 10 | Đổi thành "NGUY HIỂM – 3 dấu hiệu lừa đảo" |
| Đ7 | "Đã được gửi qua Zalo và SMS", "chuyển tới Đội thanh niên tình nguyện" viết như đã tích hợp thật | Màn 4, 5 (trạng thái) | "Đã mở tin nhắn gửi cho Lan"; phần Công an ghi "Dự kiến chuyển tới kênh tiếp nhận tin báo của Công an (mô phỏng)" |
| Đ8 | "Xã Phước Tân": theo tôi nhớ sau sắp xếp năm 2025 đây là **phường** Phước Tân. Chưa kiểm chứng được | Màn 9 (trống) | Đổi thành "Phường Phước Tân". Đội đối chiếu lại tên 9 phường dùng trong bản đồ ô với danh sách đơn vị hành chính hiện hành trước khi xuất file |

Không thấy quốc huy, huy hiệu Công an, logo ngân hàng hay VNeID. Số điện thoại đã ở dạng giả (09xx xxx 123). Tên "Nguyễn Thị Lan" đổi thành "Lan (con gái)" cho rõ là giả lập.

## 4. Quyết định tính năng (theo thứ tự ưu tiên)

Thời gian còn lại tới 14:15 (tính từ 10:05): 250 phút. Kế hoạch dùng 205 phút, để 45 phút dự phòng và nối prototype đang dở.

| # | Quyết định | Việc | Tăng điểm (ước lượng) | Phút | Ảnh hưởng code 24h |
|---|---|---|---|---|---|
| 1 | SỬA | Xử lý Đ1–Đ8 | TC2 +4, tránh bị trừ | 30 | Không |
| 2 | SỬA | Lớp nền mới: nền xám nhạt, thẻ trắng đổ bóng, thanh trạng thái, thanh tiêu đề, phân cấp nút, thanh điều hướng dưới | TC2 +3 | 30 | Giảm (ít kiểu thành phần hơn) |
| 3 | SỬA | Dựng lại luồng chính theo mockup: 0, 1, 2, 3 (ba mức), 5 | TC2 +2, TC1 +1 | 45 | Không |
| 4 | SỬA | Tách khung trạng thái thành từng màn riêng, đặt tên rõ | TC2 +1 | 15 | Không |
| 5 | SỬA | Màn 9: biểu đồ một màu + bản đồ ô 9 phường | TC3 +3 | 20 | +1 giờ (lưới CSS, không cần thư viện bản đồ) |
| 6 | THÊM | Màn "Khẩn cấp – Đang bị gọi đòi tiền" (Dừng – Cúp máy – Gọi người thân), dùng lại khung trang chủ "Chữ cực lớn" | TC1 +2, TC3 +1 | 15 | +30 phút (màn tĩnh + liên kết `tel:`) |
| 7 | THÊM | Thẻ "Tuần này ở Trấn Biên" trên trang chủ, lấy từ dữ liệu báo cáo | TC1 +1, TC3 +1 | 5 | +30 phút |
| 8 | SỬA | Màn 6: mỗi lần một thẻ, có thanh tiến độ; màn 7 thêm trạng thái chưa trả lời | TC2 +1 | 15 | Không |
| 9 | SỬA | Màn 5: thêm nút "Gọi điện cho Lan", dòng xin đồng ý | TC1 +1, TC2 +1 | (trong việc 3) | +10 phút |
| 10 | SỬA | Màn 4, 7, 8, 10, 11 áp lớp nền mới | TC2 +1 | 15 | Không |
| 11 | BỚT | Trang chủ thứ hai "Chữ cực lớn" (chuyển thành việc 6); dải "Chế độ: Bác / Chữ lớn: BẬT"; nút "Đừng chuyển tiền" (thành câu tiêu đề) | Luồng gọn hơn | 0 | Giảm |
| 11b | THÊM | Màn "Sau cuộc gọi lạ – Trả lời 4 câu" (Có/Không), thay cho ý tưởng ghi âm cuộc gọi vốn không làm được trên iPhone và Android | TC1 +1, TC3 +1 | 15 | +45 phút (4 điều kiện, không cần AI) |
| 12 | GIỮ | AI phân tích tin nhắn, giọng nói, báo cáo ẩn danh, bài kiểm tra 5 câu | Điểm cộng của đề | 0 | Xem mục 5 |
| — | KHÔNG LÀM | Bảng thi đua theo lớp, chế độ trình chiếu kèm QR, đăng nhập | Điểm/công sức thấp | — | — |

Màn 11 (Giọng nói) giữ nguyên là màn riêng để ăn điểm cộng, nhưng trong sản phẩm thật giọng nói là nút "Nghe" trên thanh tiêu đề và nút "Đọc số" ở màn Kiểm tra nhanh.

## 5. Cập nhật thuyết minh

### (c) Tính năng làm trong 24 giờ (MVP)

- **Làm thật:** chọn vai trò; kiểm tra nhanh số điện thoại / đường dẫn / số tài khoản với kết quả 3 mức và lý do; báo cáo lừa đảo (ẩn danh được); hỏi người thân (chỉ định 1 người, gửi tin soạn sẵn, gọi điện); màn khẩn cấp và 4 câu hỏi sau cuộc gọi lạ; 3 bài học 1 phút; bài kiểm tra 5 câu có chấm điểm; thống kê đội tình nguyện (biểu đồ kiểu lừa đảo, bản đồ ô theo phường, chia sẻ cảnh báo); đọc to kết quả bằng giọng nói.
- **Làm nếu kịp:** AI phân tích tin nhắn bằng mô hình ngôn ngữ (bản chắc chắn có là phân tích theo bộ từ khóa); đọc số bằng giọng nói.
- **Chỉ thiết kế, làm ở giai đoạn sau:** đóng gói thành Zalo Mini App để mở ngay trong Zalo và gửi tin cho người thân, chia sẻ thẻ cảnh báo vào nhóm Zalo khu phố; kết nối kênh tiếp nhận tin báo của Công an (trong bản 24 giờ là mô phỏng); bảng thi đua theo lớp, trường.

### (d) Kiến trúc, công nghệ dự kiến

- Ứng dụng web chạy trên điện thoại (PWA): React + Vite + Tailwind, cài được ra màn hình chính, không cần qua chợ ứng dụng.
- Máy chủ và dữ liệu: Supabase (Postgres) lưu báo cáo, danh sách số / đường dẫn / tài khoản đã bị báo, danh bạ số chính thức của phường. Dữ liệu vòng này là giả lập: 10 tình huống, 120 lượt báo cáo.
- Chấm mức rủi ro: tra danh sách đã báo cáo, sau đó áp bộ luật dấu hiệu (từ khóa giục gấp, đòi mã OTP, tên miền lạ). Không đủ dữ liệu thì trả "Nghi ngờ", không bao giờ trả "An toàn". "An toàn" chỉ dành cho số có trong danh bạ chính thức.
- AI và giọng nói: gọi API mô hình ngôn ngữ để phân tích tin nhắn, có bộ luật dự phòng khi mất mạng; đọc to bằng Web Speech API của trình duyệt. Hỏi người thân dùng liên kết `sms:` và `tel:`, người dùng tự bấm gửi.
- Không ghi âm cuộc gọi: hệ điều hành không cho phép và có vấn đề riêng tư. Cuộc gọi lạ được đánh giá bằng 4 câu Có/Không: có yêu cầu chuyển tiền hoặc đọc mã OTP, hoặc có từ 2 câu "Có", thì trả "Nguy hiểm"; còn lại trả "Nghi ngờ".

Đội đổi tên công nghệ cho đúng với thứ mình thạo nhất; chọn thứ dựng nhanh nhất trong 24 giờ.

### (e) Công cụ AI đã dùng

| Công cụ | Dùng vào việc gì |
|---|---|
| Antigravity + Figma MCP | Dựng bảng token và bản giao diện đầu tiên (trang cũ trong file Figma) theo yêu cầu của đội |
| Claude (Claude Code) + Figma MCP | Rà soát bản thiết kế theo tiêu chí chấm, đề xuất hướng thiết kế lại, dựng mockup HTML tham chiếu, dựng 34 khung giao diện và nối prototype trên trang "V2 – Giao diện mới" của file Figma, soạn nháp mục (c)(d)(e) |
| [Đội bổ sung] | Công cụ đã dùng để đọc đề (OCR), viết nội dung tình huống, v.v. |

Quyết định cuối về tính năng, nội dung và bố cục do thành viên đội duyệt. Sau khi bỏ ảnh thì không còn tư liệu bên ngoài cần ghi nguồn; biểu tượng lấy từ bộ mã nguồn mở Lucide (giấy phép ISC).

## 6. Ba câu giám khảo dễ hỏi

1. **Dữ liệu để kiểm tra lấy ở đâu?**
   Vòng này là dữ liệu giả lập theo đề. Khi triển khai có ba nguồn: báo cáo của người dân đã được đội tình nguyện xác nhận, danh bạ số chính thức do xã, phường cung cấp, và bộ luật dấu hiệu; chưa đủ dữ liệu thì ứng dụng báo "Nghi ngờ" chứ không báo "An toàn".
2. **Người 65 tuổi không rành điện thoại thì dùng thế nào?**
   Từ trang chủ tới kết quả là 2 chạm, tới người thân là 3 chạm; chữ từ 20px, nút từ 56px, có nút "Nghe" đọc to kết quả và nút "Đọc số" thay cho gõ. Nếu đang bị gọi đòi tiền thì có một nút khẩn cấp ngay trang chủ.
3. **Hai người làm 24 giờ có kịp không?**
   Kịp phần "làm thật": đó là các màn tra cứu, biểu mẫu và thống kê trên một cơ sở dữ liệu, không cần thư viện bản đồ hay đăng nhập. AI phân tích tin nhắn và đọc số bằng giọng nói nằm ở nhóm "làm nếu kịp", kết nối Công an là giai đoạn sau.
