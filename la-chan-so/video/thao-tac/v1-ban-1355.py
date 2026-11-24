"""Video demo Lá chắn số (Đội 18, Đề 4). Chạy: python3 v1.py → v1/plan.json, v1/buoc.json."""
from dsl import Video, tap, sim, persona, phone, look, hs, typ, inframe, wait, click, top, arrive

V = Video("v1", "Lá chắn số")

V.card("mo-dau", "intro",
       "Đây là Lá chắn số, bản thử nghiệm của Đội 18, Đề 4. "
       "Một lớp bảo vệ chạy ngầm trên điện thoại, có người thân và cộng đồng đứng sau. "
       "Dữ liệu trong video là giả lập.")

V.chapter("Bà Hoa, 65 tuổi", ["Chữ lớn, ưu tiên giọng nói", "Người thân được báo ngay"])
V.step("hoa-goi", "Cuộc gọi lạ", [
    ("Đây là trang chủ của bà Hoa: chữ to, ít nút.", [phone(hold=2)]),
    ("Giả lập một cuộc gọi lạ, từ số đã bị cộng đồng báo.", [sim("Có cuộc gọi lạ", "A03a-do-chuong-nguy-hiem")]),
    ("Ngay khi chuông đổ, màn hình đã cảnh báo.", [phone(hold=2)]),
    ("Bà vẫn bấm Nghe.", [tap("Nghe", "A04a-hoi-nhanh")]),
    ("Sau cuộc gọi, Bé Nai hỏi bằng giọng nói: người gọi có bảo bà chuyển tiền không?", [phone(hold=2.5)]),
    ("Bà có thể nói, hoặc bấm Có.", [tap("Có", "A04b-phan-tich-ghi-am")]),
    ("Lá chắn số kết luận nguy hiểm, kèm bằng chứng kết hợp.", [phone(hold=2.5)]),
    ("Minh, con trai bà, đã được tự động báo tin.", [look(hs("Gọi Minh ngay"), hold=2)]),
])
V.step("hoa-minh", "Người thân vào cuộc", [
    ("Bà bấm Gọi Minh ngay.", [tap("Gọi Minh ngay", "Z01a-tin-canh-bao-trong-chat")]),
    ("Trên máy Minh, cảnh báo hiện ngay trong khung chat.", [phone(hold=2)]),
    ("Minh trả lời: Mẹ đừng chuyển, con gọi ngay.", [tap("Mẹ đừng chuyển, con gọi ngay", "Z01c-mini-app-da-gui")]),
    ("Rồi bấm Gọi mẹ ngay.", [tap("Gọi mẹ ngay", "A08c-hoi-nguoi-than-tra-loi")]),
    ("Lời nhắn của con hiện thật to trên máy bà.", [phone(hold=2.5)]),
    ("Bà về trang chủ.", [tap("Về trang chủ", "A01a-trang-chu-don-gian")]),
    ("Nếu bà mở app ngân hàng ngay sau cuộc gọi đó,", [sim("Bà mở app ngân hàng", "A10a-phanh-sau-cuoc-goi")]),
    ("Lá chắn số nhắc bà dừng lại, hỏi người thân trước.", [phone(hold=3)]),
])

V.chapter("Vy, học sinh lớp 11", ["Kiểm tra trước khi chuyển tiền", "Học như chơi"])
V.step("vy-kiem", "Kiểm tra số", [
    ("Giờ là Vy, học sinh lớp 11.", [persona("Vy", "A01b-trang-chu-day-du")]),
    ("Vy mở Kiểm tra trước khi chuyển tiền.", [tap("Kiểm tra trước khi chuyển tiền", "A06a-kiem-tra-so")]),
    ("Gõ số điện thoại cần kiểm tra.", [typ(inframe(".lcs-in, .lcs-ta"), "0912 345 678")]),
    ("Kết quả: nguy hiểm, kèm lý do cụ thể.", [tap("Kiểm tra", "A07a-ket-qua-nguy-hiem"), phone(hold=2.5)]),
    ("Quay lại, thử một số tổng đài.", [click(top("#back"), settle=250), arrive("A06a-kiem-tra-so", 600),
                                         typ(inframe(".lcs-in, .lcs-ta"), "1900 5555 88", clear=True)]),
    ("Số này an toàn, nhưng app vẫn nhắc: chưa xác minh được người đang gọi.", [tap("Kiểm tra", "A07c-ket-qua-an-toan"), phone(hold=3)]),
])
V.step("vy-tin", "Tin nhắn lạ", [
    ("Có tin nhắn lạ gửi tới Vy.", [sim("Có tin nhắn lạ", "A05a-thong-bao-noi")]),
    ("Vy bấm Xem phân tích. AI tô đỏ các dấu hiệu lừa đảo.", [tap("Xem phân tích", "A05b-phan-tich-tin-nhan"), phone(hold=2.5)]),
    ("Vy bấm Báo cho cộng đồng.", [tap("Báo cho cộng đồng", "A09b-bao-cong-dong")]),
    ("Rồi gửi báo cáo, để người khác được cảnh báo sớm.", [tap("Gửi báo cáo", "A09c-bao-cao-xong"), phone(hold=1.5)]),
])
V.step("vy-hoc", "Học như chơi", [
    ("Phần học của Vy giống như chơi game.", [sim("Vào học", "A11a-thu-vien-truyen")]),
    ("Bấm Chơi tiếp: truyện tranh có giọng kể của Bé Nai.", [tap("Chơi tiếp", "A11e-truyen-co-loi-ke"), wait(2500)]),
    ("Truyện dẫn tới một điểm rẽ.", [click(inframe(".shot.on .frame .content, .frame .content", raw=True), settle=250), arrive("A11c-doc-tung-khung")]),
    ("Vy thử chọn sai: Nạp ngay kẻo mất suất.", [tap("Nạp ngay kẻo mất suất", "A11f-chon-sai-chon-lai")]),
    ("Truyện cho thấy ngay hậu quả.", [phone(hold=2.5)]),
    ("Vy quay lại điểm rẽ,", [tap("Quay lại điểm rẽ", "A11c-doc-tung-khung")]),
    ("và chọn: Dừng lại, hỏi cô giáo.", [tap("Dừng lại, hỏi cô giáo", "@video", settle=1500)]),
])
FINISH = "(()=>{try{const e=cur.view.contentDocument.querySelector('#finish a.primary');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'}catch(_){return false}})()"
V.step("vy-goi", "Gọi video cuối bài", [
    ("Thử thách cuối bài là cuộc gọi video với chị Lan, do AI đóng vai.", [phone(hold=1.5)]),
    ("Bấm Chạy demo tự động.", [click(inframe("#auto"), settle=4000)]),
    ("Avatar của chị Lan nói và khớp miệng theo lời.", [wait(6000)]),
    ("Chị Lan kể chuyện được mời việc nhẹ lương cao. Vy khuyên chị bằng giọng nói.", [wait(8000), {"waitFor": FINISH, "timeout": 150000, "settle": 600}]),
    ("Mỗi ý đúng của Vy được đánh dấu ngay trên màn hình.", [look(inframe(".chip.k", up="div:has(> .chip.k)"), hold=2.5)]),
    ("Hết cuộc gọi, Vy xem bảng điểm tự chấm.", [click(inframe("#finish a.primary"), settle=250), arrive("A11i-bang-diem-cuoi-bai"), phone(hold=2.5)]),
])
V.step("vy-kt", "Bài kiểm tra", [
    ("Tiếp theo là bài kiểm tra năm câu.", [tap("Làm bài kiểm tra 5 câu", "A12a-cau-hoi")]),
    ("Vy chọn: Lừa đảo.", [tap("Lừa đảo", "A12b-giai-thich"), phone(hold=2)]),
    ("Bấm Câu tiếp theo để xem kết quả và xếp hạng của nhóm.", [tap("Câu tiếp theo", "A12c-ket-qua"), phone(hold=2.5)]),
])

V.chapter("Khoa, đội thanh niên tình nguyện", ["Thống kê báo cáo", "AI duyệt trước, người chốt"])
V.step("khoa", "Web cho đội tình nguyện", [
    ("Khoa ở đội thanh niên tình nguyện, dùng bản web.", [persona("Khoa", "W01-thong-ke", settle=1500)]),
    ("Tháng này có 120 báo cáo, 35% là đường dẫn giả.", [phone(hold=3)]),
    ("Khoa mở mục Kiểm duyệt.", [tap("Kiểm duyệt", "W02-kiem-duyet")]),
    ("AI duyệt trước, chỉ những ca chưa chắc mới tới tay người.", [phone(hold=3)]),
    ("Khoa xác nhận đây là lừa đảo.", [tap("Xác nhận lừa đảo", "W01-thong-ke")]),
])

V.card("ket", "outro",
       "Lá chắn số: cảnh báo sớm, người thân vào cuộc, cả cộng đồng cùng giữ an toàn cho người dân thành phố Đồng Nai.")
V.write()
