# BẢN THUYẾT MINH — ĐỀ 4: LÁ CHẮN SỐ

**Đội:** Doi18 · **Sản phẩm:** Lá chắn số · **Prototype:** https://la-chan-so-doi18.vercel.app (bản chạy tại máy: `2-Prototype/mo-prototype.sh` trong `Doi18_De4`, kèm video demo) · **Thiết kế (Figma):** https://www.figma.com/design/KqUeRMoL69j6OfeDTwWp2v

## (a) Vấn đề và người dùng

Lừa đảo qua điện thoại, tin nhắn và đường dẫn giả thắng nhờ hai thứ: **sự gấp gáp** và **nỗi sợ**. Nạn nhân không có thời gian dừng lại để kiểm tra, và thường bị yêu cầu giữ bí mật với người thân. Một ứng dụng tra cứu thụ động không giải quyết được điều này, vì người đang hoảng sẽ không tự mở ứng dụng.

Lá chắn số vì vậy là **một lớp bảo vệ chạy ngầm**: tự phát hiện, cảnh báo đúng lúc, kéo người thân vào cuộc, và biến mỗi báo cáo thành bài học cho cộng đồng.

| Người dùng | Hoàn cảnh | Thiết kế đáp ứng |
|---|---|---|
| Bà Hoa, 65 tuổi | Nhận cuộc gọi lạ tự xưng công an; mắt kém, sợ bấm nhầm | Chế độ đơn giản: chữ lớn, mỗi màn tối đa 3 lựa chọn, đọc to; có nguy hiểm thì tự báo cho con |
| Vy, học sinh lớp 11 | Nhận tin “việc nhẹ lương cao”; rành điện thoại nhưng chủ quan | AI tô đỏ từng dấu hiệu ngay trên tin nhắn; học như chơi game: truyện có giọng Bé Nai kể và lối rẽ tự chọn, cuối bài gọi video khuyên chị họ (avatar AI) rồi tự chấm; bài kiểm tra có điểm, thi đua theo nhóm trong trường, phường, thành phố. Bé Nai là linh vật lấy từ tên Đồng Nai |
| Khoa, tình nguyện viên | Đi tuyên truyền nhưng không biết chiêu nào đang nổi ở địa phương | Web thống kê, kiểm duyệt có AI hỗ trợ, nội dung tuyên truyền làm sẵn |

Dữ liệu mẫu của đề được dùng xuyên suốt: 120 lượt báo cáo trong tháng, 35% (42 lượt) là đường dẫn giả mạo, 10 tình huống phổ biến. Các số liệu chia nhỏ khác trong bản thiết kế là dữ liệu giả lập do đội bổ sung.

Ba điểm đội rút ra khi thiết kế:
1. **“An toàn” là kết quả nguy hiểm nhất nếu nói sai.** Số chưa ai báo cáo không có nghĩa là an toàn. Thiết kế có thêm mức “Chưa có dữ liệu” kèm ba câu tự kiểm tra; chỉ hiện “An toàn” khi khớp danh bạ đã xác thực.
2. **Mặc định im lặng, chỉ lên tiếng khi đủ dấu hiệu.** Người lớn thường nhớ số chứ không lưu, shipper thì hay bị báo làm phiền oan, nên “số chưa lưu” không phải là dấu hiệu. Lá chắn có 5 mức: im lặng, nhãn nhẹ, hỏi một câu (số chưa quen đã nghe từ 5 phút), cảnh báo, dừng lại (đang nghe số chưa quen từ 5 phút và mở ứng dụng ngân hàng). Các ngưỡng là giả thuyết để thử nghiệm (trang D05).
3. **Người lớn tuổi ít thao tác, nên Lá chắn là trợ lý chủ động.** Trợ lý tự chọn mức can thiệp, hỏi một câu bằng giọng nói (công tắc bật tắt trong ứng dụng), rồi tự báo cho người thân; bà không cần bấm gì. Người trẻ thì tự quyết và được hỏi “Báo cho cộng đồng?”.

## (b) Luồng sử dụng chính

Bà Hoa nhận cuộc gọi từ một số đã bị báo lừa đảo → **thẻ cảnh báo hiện ngay khi đổ chuông** (A03) → bà vẫn nghe máy → cuộc gọi kết thúc, **trợ lý Lá chắn hỏi một câu bằng giọng nói** và AI chép lời bản ghi âm của máy (A04) → kết quả Nguy hiểm kèm bằng chứng kết hợp, **Lá chắn tự báo cho con trai Minh** → Minh nhận cảnh báo ngay trong Zalo (tài khoản chính thức và Mini App Lá chắn số), trả lời một chạm và báo số cho cộng đồng (Z01) → lời nhắn “Mẹ đừng chuyển!” hiện to và được đọc thành tiếng trên máy bà (A08) → nếu bà vẫn mở ứng dụng ngân hàng, **màn nhắc “Dừng lại”** bật toàn màn hình (A10) → **AI phân loại, ca chưa chắc mới chuyển cho tình nguyện viên** (W02) → số liệu vào trang thống kê, kiểu lừa đảo mới nổi thành cảnh báo và truyện tranh 1 phút (W01, W03).

Luồng phụ cho học sinh: Vy tự kiểm tra một số lạ trước khi chuyển tiền (A06, A07) → tin nhắn lạ đến → Lá chắn phát hiện từ thông báo và tô đỏ dấu hiệu (A05) → hỏi một chạm “Báo cho cộng đồng?” → gợi ý truyện tranh đúng chiêu vừa gặp (A11) → bài kiểm tra có chấm điểm (A12).

Sáu màn bắt buộc của đề: kiểm tra nhanh và kết quả (A06, A07) · báo cáo (A09) · Hỏi người thân (A08, Z01) · bài học 1 phút (A11) · bài kiểm tra có chấm điểm (A12) · màn đội tình nguyện (W01, kèm W02, W03). Thiết kế có riêng nhóm màn trạng thái lỗi và trống (E01): Lá chắn bị máy tắt, chưa có người thân, mất mạng, AI chưa đủ thông tin. Chuyển động chỉ dùng để dẫn mắt và báo trạng thái; ở chế độ chữ lớn chuyển động chậm hơn và không nhấp nháy (D04).

## (c) Tính năng sẽ làm trong 24 giờ (MVP)

Ưu tiên Android (máy Xiaomi). Các lớp bảo vệ **làm thật**:
1. **Cảnh báo khi đổ chuông**: dùng quyền nhận diện cuộc gọi của Android, tra danh sách số bị báo cáo.
2. **Phân tích sau cuộc gọi**: đọc tệp ghi âm do chính máy tạo (người dùng bật và cấp quyền thư mục một lần), chuyển giọng nói thành chữ, AI phân tích kịch bản. Máy không có ghi âm thì trợ lý hỏi một câu bằng giọng nói (chuyển giọng nói thành chữ và đọc thành tiếng bằng dịch vụ có sẵn của Android), luôn kèm nút Có, Không.
3. **Lá chắn tin nhắn**: đọc nội dung thông báo, lọc sơ bộ trên máy, chỉ đoạn nghi ngờ mới gửi AI.
4. **Nhắc trước khi chuyển tiền**: kết hợp trạng thái cuộc gọi và ứng dụng đang mở để bật màn “Dừng lại” (cần quyền xem ứng dụng đang mở và quyền hiển thị trên ứng dụng khác).
5. Kiểm tra nhanh bốn loại, kết quả bốn mức; Hỏi người thân hai chiều; báo cáo; truyện tranh và bài kiểm tra chạy từ tệp nội dung; web thống kê và kiểm duyệt.

Phần **mô phỏng trong bản 24 giờ, ghi rõ là tầm nhìn**: phân tích ngay trong lúc đang gọi (Android và iOS không cho ứng dụng thường thu âm cuộc gọi; lộ trình thật là đường dây gộp cuộc gọi hoặc hợp tác hãng máy, nhà mạng); gửi tin chủ động qua tài khoản chính thức (OA) trên Zalo (cần xác thực OA, không kịp 24 giờ; bản 24 giờ đồng bộ hai máy qua máy chủ của đội); kết nối kênh tiếp nhận tin báo của Công an (bản 24 giờ chỉ gom bằng chứng thành hồ sơ). iPhone ở giai đoạn sau, dùng qua Mini App theo kiểu chủ động: dán tin nhắn, chia sẻ ảnh chụp màn hình.

## (d) Kiến trúc và công nghệ dự kiến

- **Ứng dụng Android**: vỏ Kotlin mỏng cho ba dịch vụ nền (cuộc gọi, thông báo, ứng dụng đang mở); giao diện viết bằng React chạy trong WebView, dùng chung mã với Mini App và web.
- **Web quản trị và Mini App**: React, dùng chung bộ thành phần và design token từ bản thiết kế.
- **AI**: gọi mô hình ngôn ngữ lớn qua một điểm trung gian (giấu khóa), trả về JSON gồm mức độ, dấu hiệu, giải thích, kiểu lừa đảo; kiểu lừa đảo dùng để mở đúng truyện tranh. Có kết quả dự phòng cho dữ liệu trình diễn. Phần trợ lý chỉ được gọi một danh sách hành động cố định (tra số, đọc lịch sử cuộc gọi, phân tích bản ghi, báo người thân, bật màn “Dừng lại”) và không bao giờ hỏi mã xác thực hay yêu cầu chuyển tiền.
- **Dữ liệu**: bản trình diễn dùng dữ liệu giả lập và một máy chủ chuyển tiếp nhỏ để ba màn hình đồng bộ. Lớp dữ liệu tách sau một giao diện chung, khi triển khai thật thay bằng máy chủ và cơ sở dữ liệu mà không sửa giao diện.
- **Nguồn dữ liệu số và đường dẫn nguy hiểm**: báo cáo cộng đồng đã qua kiểm duyệt; danh bạ trắng các tổng đài đã xác thực; phân tích đường dẫn (tên miền nhái, tuổi tên miền, liên kết rút gọn). Triển khai thật cần kết nối nguồn chính thống của cơ quan chức năng.
- **Riêng tư**: bỏ qua mọi tin chứa mã OTP; che số tài khoản, số điện thoại trước khi gửi AI; không lưu nội dung cuộc gọi, tin nhắn; bản ghi âm chỉ được gửi cho đội duyệt khi người dùng chọn đính kèm vào báo cáo; người thân chỉ thấy mức cảnh báo và tóm tắt đã che. **Chống báo oan**: nhãn chỉ có hiệu lực sau kiểm duyệt, tự hết hạn sau 90 ngày, có kênh khiếu nại.

## (e) Công cụ trí tuệ nhân tạo đã dùng

| Công cụ | Dùng vào việc gì |
|---|---|
| Claude (Claude Code) | Phân tích đề và tiêu chí chấm; phản biện tính khả thi (giới hạn ghi âm cuộc gọi trên Android, iOS); lập kế hoạch và danh sách màn hình; dựng bố cục các màn bằng mã rồi xuất sang Figma dưới dạng lớp chỉnh sửa được; soạn nháp nội dung chữ và bản thuyết minh |
| Codex (OpenAI) | Vẽ tranh truyện 1 phút và hình minh họa (tranh không chữ; lời do đội viết); dùng model GPT-6.2-Astra để review giao diện và phản biện quy tắc “khi nào lên tiếng”, đội đối chiếu rồi sửa theo |
| Gemini (Google) | Tạo giọng đọc cho Bé Nai, chị Lan và lời dẫn video demo; chép lại lời để đối chiếu |
| LiteAvatar, Whisper (mã nguồn mở) | LiteAvatar: hình và khẩu hình nhân vật chị Lan trong cuộc gọi video, có nhãn “AI đóng vai”. Whisper: căn lời dẫn với hình trong video demo |

Đội chịu trách nhiệm rà soát, chỉnh sửa và quyết định cuối cùng về ý tưởng, luồng sử dụng, nội dung và giao diện. Không sao chép giao diện của sản phẩm có sẵn; không dùng thông tin cá nhân thật.
