"""Video demo Lá chắn số (Đội 18, Đề 4). Chạy: python3 v1.py → v1/plan.json, v1/buoc.json."""
from dsl import Video, tap, sim, persona, phone, look, hs, typ, inframe, wait, click, top, arrive, js

V = Video("v1", "Lá chắn số", base="http://127.0.0.1:8138")   # may-chu.py (COOP/COEP: khớp miệng avatar đa luồng)

V.card("mo-dau", "intro",
       "Đây là Lá chắn số, bản thử nghiệm của Đội 18, Đề 4. "
       "Một lớp bảo vệ chạy ngầm trên điện thoại, có người thân và cộng đồng đứng sau. "
       "Dữ liệu trong video là giả lập.")

V.chapter("Bà Hoa, 65 tuổi", ["Chữ lớn, ưu tiên giọng nói", "Người thân được báo ngay"])
V.step("hoa-goi", "Cuộc gọi lạ", [
    ("Đây là trang chủ của bà Hoa: chữ to, ít nút.", [phone(hold=2.5)]),
    ("Giả lập một cuộc gọi lạ, từ số đã bị cộng đồng báo.", [sim("Có cuộc gọi lạ", "A03a-do-chuong-nguy-hiem")]),
    ("Ngay khi chuông đổ, màn hình đã cảnh báo.", [phone(hold=2)]),
])
# Bước có tiếng gốc (goc): đoạn quay phát 1x; mỗi câu dẫn đọc xong rồi mới bấm, tiếng Bé Nai cất lên sau đó và chạy trọn câu.
V.step("hoa-benai", "Bé Nai hỏi lại", [
    ("Bà vẫn bấm Nghe. Sau cuộc gọi, Bé Nai hỏi lại bà bằng giọng nói.", [wait(4700), tap("Nghe", "A04a-hoi-nhanh", settle=300), wait(7700)]),
    ("Bà có thể nói, hoặc bấm Có.", [wait(2000), tap("Có", "A04b-phan-tich-ghi-am", settle=300), wait(5500)]),
    ("Nếu bà đã cấp quyền đọc thư mục ghi âm, AI chép lời và phân tích lại bản ghi âm cuộc gọi do chính máy ghi.", [phone(hold=6.5), wait(6300)]),
    ("Kết hợp với báo cáo cộng đồng và lịch sử cuộc gọi, Lá chắn số kết luận: nguy hiểm.", [phone(hold=5), wait(4900)]),
    ("Minh, con trai bà, đã được tự động báo tin.", [look(hs("Gọi Minh ngay"), hold=3.0), wait(1900)]),
])
V.steps[-1]["goc"] = True
V.step("hoa-minh", "Người thân nhận cảnh báo qua Zalo", [
    ("Bà bấm Gọi Minh ngay.", [tap("Gọi Minh ngay", "Z01a-tin-canh-bao-trong-chat", settle=700)]),
    ("Trên máy Minh, cảnh báo hiện ngay trong khung chat.", [phone(hold=2.5), wait(2400)]),
    ("Minh trả lời: Mẹ đừng chuyển, con gọi ngay.", [wait(1200), tap("Mẹ đừng chuyển, con gọi ngay", "Z01c-mini-app-da-gui", settle=700)]),
    ("Rồi bấm Gọi mẹ ngay.", [tap("Gọi mẹ ngay", "A08c-hoi-nguoi-than-tra-loi", settle=700)]),
    ("Lời nhắn của con hiện thật to trên máy bà.", [phone(hold=2.5), wait(2100)]),
    ("Bà về trang chủ.", [tap("Về trang chủ", "A01a-trang-chu-don-gian", settle=700)]),
    ("Nếu bà mở app ngân hàng ngay sau cuộc gọi đó,", [wait(2400)]),
    ("Lá chắn số nhắc bà dừng lại, hỏi người thân trước.", [wait(2700), sim("Bà mở app ngân hàng", "A10a-phanh-sau-cuoc-goi", settle=300), wait(4800)]),
])
V.steps[-1]["goc"] = True

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
# Truyện: A11e tự phát benai-1 rồi benai-2, xong tự sang điểm rẽ A11c (benai-4). Lời dẫn chỉ giới thiệu trước, rồi im.
V.step("vy-truyen", "Học như chơi", [
    ("Phần học của Vy giống như chơi game.", [sim("Vào học", "A11a-thu-vien-truyen"), wait(1200)]),
    ("Bấm Chơi tiếp. Truyện tranh có lời kể của Bé Nai.", [wait(3900), tap("Chơi tiếp", "A11e-truyen-co-loi-ke", settle=300),
                                                         arrive("A11c-doc-tung-khung", settle=300, timeout=45000), wait(7400)]),
])
V.steps[-1]["goc"] = True
V.step("vy-hoc", "Học như chơi", [
    ("Truyện dẫn tới một điểm rẽ.", [phone(hold=2), wait(1700)]),
    ("Vy thử chọn sai: Nạp ngay kẻo mất suất.", [look(hs("Nạp ngay kẻo mất suất"), hold=2.6), wait(2300)]),
    ("Truyện cho thấy ngay hậu quả.", [wait(1500), tap("Nạp ngay kẻo mất suất", "A11f-chon-sai-chon-lai", settle=300), wait(14700)]),
    ("Vy quay lại điểm rẽ,", [wait(700), tap("Quay lại điểm rẽ", "A11c-doc-tung-khung", settle=300)]),
    ("và chọn: Dừng lại, hỏi cô giáo.", [wait(2300), tap("Dừng lại, hỏi cô giáo", "@video", settle=1500), wait(13200)]),
])
V.steps[-1]["goc"] = True
FINISH = "(()=>{try{const e=cur.view.contentDocument.querySelector('#finish a.primary');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'}catch(_){return false}})()"
# Gọi video: quay nhẹ (tỉ lệ 1, JPEG 80) để bộ khớp miệng đủ CPU; phát 1x trọn cuộc gọi.
V.step("vy-goi", "Gọi video cuối bài", [
    ("Thử thách cuối bài là cuộc gọi video với chị Lan, do AI đóng vai.", [js("window.__iso = cur.view.contentWindow.crossOriginIsolated"), phone(hold=4), wait(3600)]),
    ("Bấm Chạy demo tự động. Hãy nghe chị Lan và Vy nói chuyện.", [wait(4300), click(inframe("#auto"), settle=500), {"waitFor": FINISH, "timeout": 150000, "settle": 800}]),
    ("Mỗi ý đúng của Vy được đánh dấu ngay trên màn hình.", [look(inframe(".chip.k", up="div:has(> .chip.k)"), hold=3.0), wait(2300)]),
    ("Hết cuộc gọi, Vy xem bảng điểm tự chấm.", [wait(2700), click(inframe("#finish a.primary"), settle=250), arrive("A11i-bang-diem-cuoi-bai", settle=300), phone(hold=4), wait(5000)]),
], setup=[{"scale": 1, "quality": 80}])
V.steps[-1]["goc"] = True
V.step("vy-kt", "Bài kiểm tra", [
    ("Tiếp theo là bài kiểm tra năm câu.", [tap("Làm bài kiểm tra 5 câu", "A12a-cau-hoi")]),
    ("Vy chọn: Lừa đảo.", [tap("Lừa đảo", "A12b-giai-thich"), phone(hold=2)]),
    ("Bấm Câu tiếp theo để xem kết quả và xếp hạng của nhóm.", [tap("Câu tiếp theo", "A12c-ket-qua"), phone(hold=2.5)]),
], setup=[{"scale": 2, "quality": 92}])

V.chapter("Khoa, đội thanh niên tình nguyện", ["Web quản trị của đội tình nguyện", "Thống kê báo cáo", "AI duyệt trước, người chốt"])
V.step("khoa", "Web quản trị của đội tình nguyện", [
    ("Khoa ở đội thanh niên tình nguyện, dùng bản web.", [persona("Khoa", "W01-thong-ke", settle=1500)]),
    ("Tháng này có 120 báo cáo, 35% là đường dẫn giả.", [phone(hold=3)]),
    ("Khoa mở mục Kiểm duyệt.", [tap("Kiểm duyệt", "W02-kiem-duyet")]),
    ("AI duyệt trước, chỉ những ca chưa chắc mới tới tay người.", [phone(hold=3)]),
    ("Khoa xác nhận đây là lừa đảo.", [tap("Xác nhận lừa đảo", "W01-thong-ke")]),
])

V.card("ket", "outro",
       "Lá chắn số: cảnh báo sớm, người thân vào cuộc, cả cộng đồng cùng giữ an toàn cho người dân thành phố Đồng Nai.")
V.write()
