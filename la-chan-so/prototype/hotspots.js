/* Lá chắn số · bản đồ chỗ bấm của prototype.
   Dùng chung cho trang prototype (khung ngoài) và cho từng màn (trong iframe).
   Mỗi luật: { t: 'chữ bắt đầu của nút/thẻ' , to: 'tên khung' | '@home' | '@learn' | '@back' | '@video' | '@lookup', toast?: 'thông báo' }
   t: '*' là chỗ bấm bất kỳ còn lại trên màn. */
(function (g) {
  const T = (t, to, toast, say) => ({ t, to, toast, say });
  const S = (sel, t, to, toast) => ({ sel, t, to, toast });
  const valueLink = (t, to, v) => ({ t, to, v });
  const STUB = 'Bản mẫu: chức năng này sẽ làm ở vòng chung kết';
  const stub = (sel, t) => S(sel, t, null, STUB);
  const CHECKS = ['Tôi biết người nhận', 'Không ai giục', 'Không ai bảo tôi'].map(t => T(t, null, '@check'));
  const MINI = [S('.mini-bar [data-i=x]', 'Đóng Mini App', 'Z01a-tin-canh-bao-trong-chat'),
    stub('.mini-bar [data-i=more]', 'Tùy chọn')];
  const NAV = [T('Lá chắn', '@home'), T('Kiểm tra', 'A06a-kiem-tra-so'), T('Học', '@learn'), T('Tôi', 'A02b-thiet-lap-hoan-tat')];
  const SIDE = [T('Tổng quan', 'W01-thong-ke'), T('Kiểm duyệt', 'W02-kiem-duyet'), T('Cảnh báo và tuyên truyền', 'W03-tuyen-truyen'),
    T('Thư viện truyện', 'A11a-thu-vien-truyen'), T('Buổi tuyên truyền', 'W03-tuyen-truyen'), T('Cài đặt', null, STUB)];

  g.LCS_HOTSPOTS = {
    'D01-bia-y-tuong': [T('*', 'D02-luong-chinh')],
    'D02-luong-chinh': [T('*', 'D03-design-system')],
    'D03-design-system': [T('*', 'D04-chuyen-dong')],
    'D04-chuyen-dong': [T('*', 'D05-khi-nao-len-tieng')],
    'D05-khi-nao-len-tieng': [T('*', '@home')],

    // ---------- Bà Hoa ----------
    'A01a-trang-chu-don-gian': [T('Kiểm tra trước khi chuyển tiền', 'A06a-kiem-tra-so'), T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui'),
      T('Báo lừa đảo', 'A09a-bao-cao-form'), T('Chữ lớn', 'A01b-trang-chu-day-du', 'Đã chuyển sang chế độ đầy đủ'),
      S('.content > .row:has([data-i=mic])', 'Nói với Lá chắn', 'A04a-hoi-nhanh'), T('Lá chắn đang bật', null, 'Lá chắn đang chạy ngầm, bà không cần mở app'), ...NAV],
    'A02a-thiet-lap-dang-lam': [T('Bật', 'A02b-thiet-lap-hoan-tat'), S('.btn.outline.sm', 'Bật nhắc chuyển tiền', 'A02b-thiet-lap-hoan-tat'), T('Nhờ người thân cài hộ', null, 'Đã gửi đường dẫn cài hộ cho Minh'), T('*', 'A02b-thiet-lap-hoan-tat')],
    'A02b-thiet-lap-hoan-tat': [T('Về trang chủ', '@home'), T('Hỏi bằng giọng nói', null, '@ask')],
    'A03a-do-chuong-nguy-hiem': [T('Chặn số này', '@home', 'Đã chặn số 0912 345 678'), T('Nghe', 'A04a-hoi-nhanh', 'Mô phỏng: bà nghe máy 4 phút rồi cúp'),
      T('Từ chối', '@home', 'Đã từ chối cuộc gọi')],
    'A03b-do-chuong-chua-ro': [T('Nghe', '@home', 'Số chưa lưu nhưng không có dấu hiệu rủi ro: Lá chắn im lặng'), T('Từ chối', '@home', 'Đã từ chối cuộc gọi')],
    'A04a-hoi-nhanh': [T('Có', 'A04b-phan-tich-ghi-am', '', ['benai-11']), T('Không', '@home', 'Dạ vậy thì tốt rồi ạ', ['benai-12']), T('Tôi biết số này', '@home', 'Bé Nai nhớ rồi, lần sau số này gọi sẽ không hỏi nữa'),
      T('Bé Nai đang hỏi bà', null, '@speak')],
    'A04b-phan-tich-ghi-am': [T('Gọi Minh ngay', 'Z01a-tin-canh-bao-trong-chat', 'Minh đã nhận cảnh báo: xem phía Minh'), T('Đã báo cho Minh', 'Z01a-tin-canh-bao-trong-chat')],
    'A04c-khong-co-ghi-am': [T('Trả lời một câu hỏi', 'A04a-hoi-nhanh'), S('.card.row:has([data-i=mic])', 'Kể lại bằng giọng nói', 'A04a-hoi-nhanh')],
    'A08a-hoi-nguoi-than-gui': [T('Gửi cho Minh', 'A08b-hoi-nguoi-than-cho'), T('Gọi điện cho Minh', 'A08c-hoi-nguoi-than-tra-loi'), S('.card:has(.chip.outline)', 'Lan', null, 'Lan là người nhận dự phòng')],
    'A08b-hoi-nguoi-than-cho': [T('Gọi điện cho Minh', 'A08c-hoi-nguoi-than-tra-loi', 'Minh vừa trả lời'), T('*', 'A08c-hoi-nguoi-than-tra-loi', 'Minh vừa trả lời')],
    'A08c-hoi-nguoi-than-tra-loi': [T('Báo cáo số này', 'A09a-bao-cao-form'), T('Về trang chủ', '@home'), T('Đang đọc to', null, '@speak')],
    'A10a-phanh-sau-cuoc-goi': [T('Hỏi con Minh trước', 'A08a-hoi-nguoi-than-gui'), T('Đóng cảnh báo', '@home', 'Đã đóng cảnh báo'), T('Đang đọc to', null, '@speak')],
    'A10b-phanh-dang-goi': [T('Cúp máy ngay', 'A04a-hoi-nhanh', 'Đã cúp máy'), T('Hỏi con Minh trước', 'A08a-hoi-nguoi-than-gui')],
    'A11b-doc-truyen-4-khung': [T('Làm bài kiểm tra 5 câu', 'A12a-cau-hoi'), T('Đọc to', null, '@speak')],

    // ---------- Vy ----------
    'A01b-trang-chu-day-du': [T('Kiểm tra trước khi chuyển tiền', 'A06a-kiem-tra-so'), T('Dán tin', 'A06b-kiem-tra-tin-nhan'), T('Người thân', 'A08a-hoi-nguoi-than-gui'),
      T('Báo cáo', 'A09a-bao-cao-form'), T('Bạn đang được bảo vệ', 'A02b-thiet-lap-hoan-tat'), S('.appbar .avatar', 'Hồ sơ', 'A02b-thiet-lap-hoan-tat'), S('.appbar [data-i=bell]', 'Thông báo', 'A05a-thong-bao-noi'), T('120 điểm', 'A11a-thu-vien-truyen'), S('.card.warn', 'Xem truyện 1 phút', 'A11e-truyen-co-loi-ke'), ...NAV],
    'A05a-thong-bao-noi': [T('Xem phân tích', 'A05b-phan-tich-tin-nhan'), T('Bỏ qua', '@home'), T('Tin nhắn đáng ngờ', 'A05b-phan-tich-tin-nhan')],
    'A05b-phan-tich-tin-nhan': [T('Báo cho cộng đồng', 'A09b-bao-cong-dong'), T('Không', '@home', 'Đã bỏ qua'), T('Xem truyện 1 phút về chiêu này', 'A11e-truyen-co-loi-ke')],
    'A06a-kiem-tra-so': [T('Kiểm tra', '@lookup'), T('Tin nhắn', 'A06b-kiem-tra-tin-nhan'), T('Đường dẫn', null, '@fill:qua-tri-an-khach-hang.top'), T('Tài khoản', null, '@fill:1903 4421 5678'),
      T('Số ĐT', null, '@fill:0912 345 678'), S('.input [data-i=x-circle]', 'Xóa', null, '@fill:'),
      T('Dán', null, '@fill:qua-tri-an-khach-hang.top'), T('Nói', null, '@fill:0912 345 678|Mô phỏng: bà đọc số bằng giọng nói'), T('Từ nhật ký gọi', null, '@fill:0912 345 678|Lấy số vừa gọi đến'),
      valueLink('028 9999 1234', 'A07a-ket-qua-nguy-hiem', '028 9999 1234'), T('qua-tri-an-khach-hang.top', 'A07b-ket-qua-nghi-ngo'), T('TK 1903 xxxx 5678', 'A07d-ket-qua-chua-co-du-lieu'), ...NAV],
    'A06b-kiem-tra-tin-nhan': [T('Phân tích tin nhắn', '@lookup'), T('Dán', null, '@paste'), T('Tin nhắn', null, 'Đang ở chế độ kiểm tra tin nhắn'), T('Số ĐT', 'A06a-kiem-tra-so'), valueLink('Đường dẫn', 'A06a-kiem-tra-so', 'qua-tri-an-khach-hang.top'), valueLink('Tài khoản', 'A06a-kiem-tra-so', '1903 4421 5678'),
      T('Chọn ảnh chụp màn hình', null, 'Mô phỏng: đã đọc chữ trong ảnh'), ...NAV],
    'A07a-ket-qua-nguy-hiem': [T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui'), T('Báo cáo số này', 'A09a-bao-cao-form'), T('Xem truyện 1 phút', 'A11e-truyen-co-loi-ke')],
    'A07b-ket-qua-nghi-ngo': [T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui'), T('Báo cáo đường dẫn này', 'A09a-bao-cao-form')],
    'A07c-ket-qua-an-toan': [T('Kiểm tra số khác', 'A06a-kiem-tra-so')],
    'A07d-ket-qua-chua-co-du-lieu': [T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui'), T('Vẫn nghi ngờ? Báo cáo', 'A09a-bao-cao-form'), ...CHECKS],
    'A09a-bao-cao-form': [T('Gửi báo cáo', 'A09c-bao-cao-xong'), T('Đính kèm bản ghi âm', null, '@check'),
      ...['Cuộc gọi', 'Tin nhắn', 'Đường dẫn', 'Tài khoản'].map(t => T(t, null, '@pick')),
      T('Chưa', null, '@pick'), T('Rồi', null, '@pick'), stub('.tile', 'Bằng chứng'),
      stub('.input.area .icon-box', 'Kể lại bằng giọng nói'), T('Tự điền', null, 'Thông tin đã được điền sẵn')],
    'A09b-bao-cong-dong': [T('Gửi báo cáo', 'A09c-bao-cao-xong'), T('Để sau', '@home')],
    'A09c-bao-cao-xong': [T('Về trang chủ', '@home'), T('Gửi tin báo cho Công an phường', null, 'Mô phỏng: đã gom bằng chứng thành hồ sơ tin báo'),
      T('Đã lỡ chuyển tiền?', null, 'Gọi ngay ngân hàng để phong tỏa, rồi báo Công an'), T('+10 điểm', '@learn')],
    'A11a-thu-vien-truyen': [T('Chơi tiếp', 'A11e-truyen-co-loi-ke'), T('Đang chơi dở', 'A11e-truyen-co-loi-ke'), T('Tập 1', 'A11g-cuoc-goi-nhap-vai'), T('Tập 2', 'A11e-truyen-co-loi-ke'),
      T('Tập 3', null, 'Tập 3 mở khi bạn xong tập 2'), T('Cấp 3', 'A12c-ket-qua'), ...NAV],
    'A11e-truyen-co-loi-ke': [T('Tự chuyển', null, '@story'), T('CC', null, '@captions'),
      S('.ib:has([data-i=volume])', 'Nghe lại', null, '@speak'), S('.ib:has([data-i=help])', 'Trợ giúp', null, 'Chạm vào tranh để sang cảnh tiếp'),
      S('.ib:has([data-i=map-off])', 'Bản đồ lối rẽ', 'A11f-chon-sai-chon-lai'), T('*', 'A11c-doc-tung-khung')],
    'A11c-doc-tung-khung': [{sel:'.panel-grid > :nth-child(2)', t:'Nghe cảnh 2', say:['benai-3']}, T('Nạp ngay kẻo mất suất', 'A11f-chon-sai-chon-lai'), T('Dừng lại, hỏi cô giáo', 'A11j-chon-dung-hoi-co-giao', 'Chọn đúng! +10 điểm')],
    'A11j-chon-dung-hoi-co-giao': [T('Tới thử thách cuối bài', '@video', 'Cuối bài: gọi video khuyên chị Lan', ['benai-8'])],
    'A11f-chon-sai-chon-lai': [T('Quay lại điểm rẽ', 'A11c-doc-tung-khung')],
    'A11g-cuoc-goi-nhap-vai': [S('.row.between > .col:has([data-i=mic])', 'Giữ để nói', 'A11d-dau-tri-voi-ai', 'Đã ghi nhận câu trả lời mẫu'),
      S('.row.between > .col:has([data-i=refresh])', 'Nói lại', null, STUB),
      S('.row.between > .col:has([data-i=clock])', 'Chờ chút', null, 'Bấm “Giữ để nói” khi bạn sẵn sàng'),
      T('Gợi ý', 'A11c-doc-tung-khung')],
    'A11d-dau-tri-voi-ai': [T('Em hỏi cô giáo đã', 'A11a-thu-vien-truyen', 'Bắt bài! +10 điểm'), T('Cho em xem giấy phép', 'A11a-thu-vien-truyen', 'Bắt bài! +10 điểm'),
      T('Dạ em nạp ngay', null, 'Khoan đã, họ đang đòi nạp tiền trước đó'), S('.bubble.in:has(.hl)', 'nhận 500k mỗi ngày', null, 'Bắt bài: hứa thu nhập cao bất thường'),
      T('Em nạp trước 200k', null, 'Bắt bài: đòi tiền trước và giục quyết định gấp')],
    'A11h-giup-chi-ho': [S('.col:has(> .t-cap [data-i=phone-off]), .col:has(> div > [data-i=phone-off])', 'Kết thúc', 'A11i-bang-diem-cuoi-bai'),
      S('.col:has(> div > [data-i=mic])', 'Giữ để nói', '@video'), S('.col:has(> div > [data-i=message])', 'Gõ chữ', '@video')],
    'A11i-bang-diem-cuoi-bai': [T('Làm bài kiểm tra 5 câu', 'A12a-cau-hoi'), T('Gọi lại chị Lan', '@video')],
    'A12a-cau-hoi': [T('Lừa đảo', 'A12b-giai-thich'), T('An toàn', 'A12b-giai-thich', 'Đáp án đúng: Lừa đảo'), T('Chưa chắc', 'A12b-giai-thich', 'Đáp án đúng: Lừa đảo'), T('Trả lời', 'A12b-giai-thich')],
    'A12b-giai-thich': [T('Câu tiếp theo', 'A12c-ket-qua'), T('Xem truyện 1 phút', 'A11e-truyen-co-loi-ke'), S('.opt', 'Đáp án đã chấm', null, 'Đáp án đúng: Lừa đảo')],
    'A12c-ket-qua': [T('Làm lại', 'A12a-cau-hoi'), T('Thách bạn bè làm bài', null, STUB), stub('.row.gap-4:has(> [data-i=chev-down])', 'Chọn nhóm xếp hạng'), T('Xem truyện 1 phút', 'A11e-truyen-co-loi-ke')],

    // ---------- Minh ----------
    'Z01a-tin-canh-bao-trong-chat': [T('Mẹ đừng chuyển, con gọi ngay', 'Z01c-mini-app-da-gui'), T('Xem chi tiết', 'Z01b-mini-app-chi-tiet'),
      stub('.chat-head [data-i=more], .chat-input > *', 'Tùy chọn nhắn tin')],
    'Z01b-mini-app-chi-tiet': [...MINI, T('Nhắn: Mẹ đừng chuyển!', 'Z01c-mini-app-da-gui'), T('Gọi mẹ ngay', 'A08c-hoi-nguoi-than-tra-loi', 'Lời nhắn của Minh hiện trên máy mẹ'),
      T('An toàn, đây là người quen', '@home', 'Đã đánh dấu người quen')],
    'Z01c-mini-app-da-gui': [...MINI, T('Gọi mẹ ngay', 'A08c-hoi-nguoi-than-tra-loi', 'Xem trên máy mẹ'), T('Báo số này cho cộng đồng', null, 'Đã báo số cho cộng đồng'),
      T('Trên máy mẹ lúc này', 'A08c-hoi-nguoi-than-tra-loi')],

    // ---------- Khoa ----------
    'W01-thong-ke': [...SIDE, T('Soạn cảnh báo', 'W03-tuyen-truyen'), T('Xem 7 báo cáo', 'W02-kiem-duyet'), T('Tạo truyện 1 phút', 'W03-tuyen-truyen'),
      T('Chờ đội duyệt', 'W02-kiem-duyet'), T('Tháng 11/2026', null, STUB), T('Xuất báo cáo', null, 'Mô phỏng: đã xuất báo cáo tháng')],
    'W02-kiem-duyet': [...SIDE, T('Xác nhận lừa đảo', 'W01-thong-ke', 'Đã xác nhận lừa đảo'), T('Spam quảng cáo', 'W01-thong-ke', 'Đã gắn nhãn quảng cáo'),
      T('Không đủ căn cứ', 'W01-thong-ke', 'Đã bỏ qua báo cáo'), T('Gắn nhãn giao hàng', 'W01-thong-ke', 'Đã gắn nhãn giao hàng'),
      T('Chuyển tin báo cho Công an phường', null, 'Mô phỏng: đã gom hồ sơ tin báo'),
      S('.tab.active, .tr.q.sel', 'Mục đang xem', null, 'Đang hiển thị mục này'),
      stub('.tab:not(.active), .tr.q:not(.sel), [data-i=chev-left], [data-i=chev-right], .icon-box:has([data-i=play])', 'Xem thêm')],
    'W03-tuyen-truyen': [...SIDE, T('Duyệt và gửi', 'W01-thong-ke', 'Đã gửi cảnh báo tới 1.240 người dùng và 12 nhóm khu phố'), stub('.pick', 'Chọn nơi nhận'), T('Sửa', null, '@edit'),
      T('Chia sẻ vào nhóm khu phố', null, 'Đã chia sẻ truyện vào nhóm khu phố'), T('Tải bản in A4', null, 'Mô phỏng: đã tải bản in'), T('Mở trình chiếu câu đố', 'A12a-cau-hoi'), T('Chuẩn bị', null, STUB), T('Tạo truyện mới từ kiểu lừa đảo khác', 'W01-thong-ke')],

    // ---------- Trạng thái lỗi, trống ----------
    'E01a-la-chan-dang-ngu': [T('Bật lại ngay', 'A01a-trang-chu-don-gian', 'Lá chắn đã bật lại'), S('.card.row:has([data-i=search])', 'Kiểm tra tại trang chủ', 'A06a-kiem-tra-so'), T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui'),
      T('Báo lừa đảo', 'A09a-bao-cao-form'), T('Chữ lớn', 'A01b-trang-chu-day-du'), ...NAV],
    'E01b-chua-co-nguoi-than': [T('Thêm từ danh bạ', 'A08a-hoi-nguoi-than-gui', 'Đã thêm Minh'), T('Quét mã ghép đôi', 'A08a-hoi-nguoi-than-gui', 'Đã ghép với Minh'),
      T('Cần gấp? Gọi 113', null, 'Mô phỏng: gọi 113')],
    'E01c-mat-mang': [T('Thử lại', 'A06a-kiem-tra-so', 'Đã có mạng lại'), T('Các truyện đã tải', '@learn'), ...CHECKS, ...NAV],
    'E01d-ai-chua-du-thong-tin': [T('Dán thêm các tin trước đó', 'A06b-kiem-tra-tin-nhan'), T('Kiểm tra số gửi tin', 'A06a-kiem-tra-so'), T('Hỏi người thân', 'A08a-hoi-nguoi-than-gui')]
  };

  // Gợi ý hiện ở cột bên phải của prototype (chế độ dùng thử)
  g.LCS_HINTS = {
    'A01a-trang-chu-don-gian': 'Bấm “Mô phỏng: có cuộc gọi lạ” bên dưới, hoặc chạm một thẻ.',
    'A03a-do-chuong-nguy-hiem': 'Bấm “Nghe” để xem chuyện gì xảy ra sau cuộc gọi.',
    'A04a-hoi-nhanh': 'Bé Nai hỏi bằng giọng nói. Bấm “Có”.',
    'A04b-phan-tich-ghi-am': 'Lá chắn đã tự báo Minh. Bấm “Gọi Minh ngay” để xem phía Minh.',
    'Z01a-tin-canh-bao-trong-chat': 'Minh nhận tin trong Zalo, từ tài khoản chính thức Lá chắn số. Bấm “Mẹ đừng chuyển…”.',
    'A06a-kiem-tra-so': 'Gõ một số hoặc chọn mẫu bên dưới ô nhập, rồi bấm “Kiểm tra”.',
    'A06b-kiem-tra-tin-nhan': 'Dán tin nhắn (bấm “Dán” để lấy mẫu), rồi bấm “Phân tích tin nhắn”.',
    'A11a-thu-vien-truyen': 'Bấm “Chơi tiếp” để chơi tập 2.',
    'A11e-truyen-co-loi-ke': 'Bé Nai kể chuyện. Chạm vào màn để sang cảnh tiếp.',
    'A11c-doc-tung-khung': 'Thử chọn “Nạp ngay” trước để thấy ngõ cụt.',
    'A11i-bang-diem-cuoi-bai': 'Bấm “Làm bài kiểm tra 5 câu”.',
    'W01-thong-ke': 'Bấm “Kiểm duyệt” ở cột trái, hoặc “Soạn cảnh báo”.'
  };

  // Tên ngắn của từng khung (lấy từ bản thiết kế) và tệp chứa khung đó
  g.LCS_FRAMES = {
"A01a-trang-chu-don-gian": {
"file": "A01-trang-chu",
"name": "Trang chủ · Chế độ đơn giản (chữ lớn)"
},
"A01b-trang-chu-day-du": {
"file": "A01-trang-chu",
"name": "Trang chủ · Chế độ đầy đủ"
},
"A02a-thiet-lap-dang-lam": {
"file": "A02-thiet-lap",
"name": "Thiết lập lá chắn · Đang làm (chữ lớn)"
},
"A02b-thiet-lap-hoan-tat": {
"file": "A02-thiet-lap",
"name": "Thiết lập lá chắn · Hoàn tất (chữ lớn)"
},
"A03a-do-chuong-nguy-hiem": {
"file": "A03-do-chuong",
"name": "Đổ chuông · Nghi lừa đảo (thẻ nổi trên màn cuộc gọi)"
},
"A03b-do-chuong-chua-ro": {
"file": "A03-do-chuong",
"name": "Đổ chuông · Số chưa lưu: Lá chắn im lặng, chỉ có nhãn nhẹ"
},
"A04a-hoi-nhanh": {
"file": "A04-sau-cuoc-goi",
"name": "Sau cuộc gọi · Bé Nai hỏi thăm bằng giọng nói (chữ lớn)"
},
"A04b-phan-tich-ghi-am": {
"file": "A04-sau-cuoc-goi",
"name": "Sau cuộc gọi · Phân tích bản ghi âm (chữ lớn)"
},
"A04c-khong-co-ghi-am": {
"file": "A04-sau-cuoc-goi",
"name": "Sau cuộc gọi · Máy không có ghi âm (chữ lớn)"
},
"A05a-thong-bao-noi": {
"file": "A05-tin-nhan",
"name": "Lá chắn tin nhắn · Thông báo nổi"
},
"A05b-phan-tich-tin-nhan": {
"file": "A05-tin-nhan",
"name": "Lá chắn tin nhắn · AI phân tích"
},
"A06a-kiem-tra-so": {
"file": "A06-kiem-tra",
"name": "Kiểm tra nhanh · Số điện thoại"
},
"A06b-kiem-tra-tin-nhan": {
"file": "A06-kiem-tra",
"name": "Kiểm tra nhanh · Tin nhắn"
},
"A07a-ket-qua-nguy-hiem": {
"file": "A07-ket-qua",
"name": "Kết quả kiểm tra · Nguy hiểm"
},
"A07b-ket-qua-nghi-ngo": {
"file": "A07-ket-qua",
"name": "Kết quả kiểm tra · Nghi ngờ"
},
"A07c-ket-qua-an-toan": {
"file": "A07-ket-qua",
"name": "Kết quả kiểm tra · An toàn"
},
"A07d-ket-qua-chua-co-du-lieu": {
"file": "A07-ket-qua",
"name": "Kết quả kiểm tra · Chưa có dữ liệu"
},
"A08a-hoi-nguoi-than-gui": {
"file": "A08-hoi-nguoi-than",
"name": "Hỏi người thân · Gửi (chữ lớn)"
},
"A08b-hoi-nguoi-than-cho": {
"file": "A08-hoi-nguoi-than",
"name": "Hỏi người thân · Đang chờ trả lời (chữ lớn)"
},
"A08c-hoi-nguoi-than-tra-loi": {
"file": "A08-hoi-nguoi-than",
"name": "Hỏi người thân · Đã trả lời (chữ lớn)"
},
"A09a-bao-cao-form": {
"file": "A09-bao-cao",
"name": "Báo cáo lừa đảo · Biểu mẫu"
},
"A09b-bao-cong-dong": {
"file": "A09-bao-cao",
"name": "Báo cáo lừa đảo · Báo cộng đồng"
},
"A09c-bao-cao-xong": {
"file": "A09-bao-cao",
"name": "Báo cáo lừa đảo · Đã gửi"
},
"A10a-phanh-sau-cuoc-goi": {
"file": "A10-phanh",
"name": "Nhắc dừng · Sau cuộc gọi lạ"
},
"A10b-phanh-dang-goi": {
"file": "A10-phanh",
"name": "Nhắc dừng · Đang gọi số lạ"
},
"A11a-thu-vien-truyen": {
"file": "A11-truyen-tranh",
"name": "Học · Trung tâm luyện tập (học sinh)"
},
"A11b-doc-truyen-4-khung": {
"file": "A11-truyen-tranh",
"name": "Học qua truyện 1 phút · Đọc truyện 4 khung (chữ lớn)"
},
"A11c-doc-tung-khung": {
"file": "A11-truyen-tranh",
"name": "Học · Truyện tự chọn kết cục (học sinh)"
},
"A11d-dau-tri-voi-ai": {
"file": "A11-truyen-tranh",
"name": "Học · Đấu trí với kẻ lừa đảo, AI đóng vai (học sinh)"
},
"A11e-truyen-co-loi-ke": {
"file": "A11-truyen-tranh",
"name": "Học · Chơi truyện có lời kể (học sinh)"
},
"A11f-chon-sai-chon-lai": {
"file": "A11-truyen-tranh",
"name": "Học · Ngõ cụt: xem hậu quả và bản đồ lối rẽ (học sinh)"
},
"A11j-chon-dung-hoi-co-giao": {
"file": "A11-truyen-tranh",
"name": "Học · Chọn đúng: Vy hỏi cô giáo (học sinh)"
},
"A11g-cuoc-goi-nhap-vai": {
"file": "A11-truyen-tranh",
"name": "Học · Cuộc gọi nhập vai có chấm (học sinh)"
},
"A11h-giup-chi-ho": {
"file": "A11-truyen-tranh",
"name": "Học · Thử thách cuối bài: gọi video khuyên chị họ (học sinh)"
},
"A11i-bang-diem-cuoi-bai": {
"file": "A11-truyen-tranh",
"name": "Học · Bảng điểm cuối bài (học sinh)"
},
"A12a-cau-hoi": {
"file": "A12-bai-kiem-tra",
"name": "Bài kiểm tra · Câu hỏi"
},
"A12b-giai-thich": {
"file": "A12-bai-kiem-tra",
"name": "Bài kiểm tra · Giải thích đáp án"
},
"A12c-ket-qua": {
"file": "A12-bai-kiem-tra",
"name": "Bài kiểm tra · Kết quả và xếp hạng"
},
"D01-bia-y-tuong": {
"file": "D00-tong-quan",
"name": "Bìa và ý tưởng"
},
"D02-luong-chinh": {
"file": "D00-tong-quan",
"name": "Luồng chính và 4 lớp bảo vệ"
},
"D03-design-system": {
"file": "D00-tong-quan",
"name": "Design system"
},
"D04-chuyen-dong": {
"file": "D00-tong-quan",
"name": "Chuyển động"
},
"D05-khi-nao-len-tieng": {
"file": "D00-tong-quan",
"name": "Khi nào Lá chắn lên tiếng"
},
"E01a-la-chan-dang-ngu": {
"file": "E01-trang-thai",
"name": "Lá chắn đang ngủ (chữ lớn)"
},
"E01b-chua-co-nguoi-than": {
"file": "E01-trang-thai",
"name": "Chưa có người thân (chữ lớn)"
},
"E01c-mat-mang": {
"file": "E01-trang-thai",
"name": "Mất mạng"
},
"E01d-ai-chua-du-thong-tin": {
"file": "E01-trang-thai",
"name": "AI chưa đủ thông tin"
},
"W01-thong-ke": {
"file": "W01-thong-ke",
"name": "Web quản trị · Tổng quan thống kê"
},
"W02-kiem-duyet": {
"file": "W02-kiem-duyet",
"name": "Web quản trị · Kiểm duyệt báo cáo"
},
"W03-tuyen-truyen": {
"file": "W03-tuyen-truyen",
"name": "Web quản trị · Cảnh báo và tuyên truyền"
},
"Z01a-tin-canh-bao-trong-chat": {
"file": "Z01-nguoi-than",
"name": "Tin cảnh báo trong ứng dụng chat"
},
"Z01b-mini-app-chi-tiet": {
"file": "Z01-nguoi-than",
"name": "Mini App · Chi tiết cảnh báo"
},
"Z01c-mini-app-da-gui": {
"file": "Z01-nguoi-than",
"name": "Mini App · Đã gửi cho mẹ"
}
};
})(typeof window !== 'undefined' ? window : globalThis);
