"""Video demo Lá chắn số (Đội 18, Đề 4). Chạy: python3 v1.py → v1/plan.json, v1/buoc.json."""
from dsl import Video, tap, sim, persona, phone, look, hs, typ, inframe, wait, click, top, arrive, js

V = Video("v1", "Lá chắn số", base="http://127.0.0.1:8138")   # may-chu.py (COOP/COEP: khớp miệng avatar đa luồng)

import os
from dsl import HERE
# N: thời gian chờ (ms) ứng với độ dài câu dẫn ở các bước có tiếng gốc; chỉnh theo lượt thu rồi quay lại.
#     hoa-benai: Nghe, Có, cấp quyền, kết luận, tự báo | hoa-minh: Zalo (2 nhịp), ngân hàng | truyện | vy-hoc: sai, quay lại, đúng, cuối bài | gọi: demo, bảng điểm
N = [4400, 1800, 5400, 4000, 3400,   2500, 2400, 5150,   3450,   3300, 1000, 3700, 2700,   2800, 1700]   # theo lượt thu 15:14 (174,0 s)
GOI_SCALE, GOI_Q = int(os.environ.get("GOI_SCALE", "0")), int(os.environ.get("GOI_Q", "80"))

V.card("mo-dau", "intro",
       "Đây là Lá chắn số, bản prototype của Đội 18, Đề 4. "
       "Một lớp bảo vệ chạy ngầm trên điện thoại, có người thân và cộng đồng đứng sau. "
       "Dữ liệu trong video là giả lập.")

V.chapter("Bà Hoa, 65 tuổi", ["Chữ lớn, ưu tiên giọng nói", "Người thân được báo ngay"])
V.step("hoa-goi", "Cuộc gọi lạ", [
    ("Đây là trang chủ của bà Hoa, 65 tuổi: chữ to, ít nút.", [phone(hold=2.5)]),
    ("Giả lập một cuộc gọi từ số đã bị cộng đồng báo lừa đảo.", [sim("Có cuộc gọi lạ", "A03a-do-chuong-nguy-hiem")]),
    ("Với số chưa lưu, Lá chắn mặc định im lặng. Lần này đủ dấu hiệu, nên màn hình cảnh báo ngay khi chuông đổ.", [phone(hold=3)]),
])
# Bước có tiếng gốc (goc): đoạn quay phát 1x; mỗi câu dẫn đọc xong rồi mới bấm, tiếng Bé Nai cất lên sau đó và chạy trọn câu.
# Số trong wait() trước cú bấm = độ dài câu dẫn (đo từ lượt thu), sau cú bấm = độ dài tiếng gốc + chút nghỉ.
V.step("hoa-benai", "Bé Nai hỏi lại", [
    ("Bà vẫn bấm Nghe. Sau cuộc gọi, Bé Nai hỏi lại bà bằng giọng nói.", [wait(N[0]), tap("Nghe", "A04a-hoi-nhanh", settle=300), wait(7300)]),
    ("Bà có thể nói, hoặc bấm Có.", [wait(N[1]), tap("Có", "A04b-phan-tich-ghi-am", settle=300), wait(5100)]),
    ("Nếu bà đã cấp quyền đọc thư mục ghi âm, AI chép lời và phân tích lại bản ghi âm cuộc gọi do chính máy ghi.", [phone(hold=6.5), wait(N[2])]),
    ("Kết hợp với báo cáo cộng đồng và lịch sử cuộc gọi, Lá chắn số kết luận: nguy hiểm.", [phone(hold=5), wait(N[3])]),
    ("Lá chắn đã tự báo cho Minh, con trai bà. Bà không cần bấm gì thêm.", [look(hs("Đã báo cho Minh"), hold=4.2), wait(N[4])]),
])
V.steps[-1]["goc"] = True
V.step("hoa-minh", "Người thân nhận cảnh báo qua Zalo", [
    ("Bấm Gọi Minh ngay để sang máy của Minh.", [wait(600), tap("Gọi Minh ngay", "Z01a-tin-canh-bao-trong-chat", settle=700), wait(500)]),
    ("Theo thiết kế, Minh nhận cảnh báo ngay trong Zalo, qua tài khoản chính thức và Mini App Lá chắn số, không cần cài thêm app.",
     [look(inframe(".chat-head"), hold=3.2), wait(N[5]), phone(hold=3), wait(N[6])]),
    ("Minh trả lời: Mẹ đừng chuyển, con gọi ngay.", [wait(1200), tap("Mẹ đừng chuyển, con gọi ngay", "Z01c-mini-app-da-gui", settle=700), wait(600)]),
    ("Rồi bấm Gọi mẹ ngay.", [tap("Gọi mẹ ngay", "A08c-hoi-nguoi-than-tra-loi", settle=700)]),
    ("Lời nhắn của con hiện thật to trên máy bà.", [phone(hold=2.5), wait(2100)]),
    ("Nếu sau đó bà vẫn mở app ngân hàng, Lá chắn số nhắc bà dừng lại, hỏi người thân trước.", [wait(N[7]), sim("Bà mở app ngân hàng", "A10a-phanh-sau-cuoc-goi", settle=300), wait(4500)]),
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
    ("Phần học của Vy giống như chơi game.", [sim("Vào học", "A11a-thu-vien-truyen"), wait(600)]),
    ("Bấm Chơi tiếp. Truyện tranh có lời kể của Bé Nai.", [wait(N[8]), tap("Chơi tiếp", "A11e-truyen-co-loi-ke", settle=300),
                                                         arrive("A11c-doc-tung-khung", settle=300, timeout=45000), wait(7200)]),
])
V.steps[-1]["goc"] = True
# Điểm rẽ: chọn sai (benai-5, benai-6) → quay lại → chọn đúng sang màn A11j (benai-7 chạy trọn) → "Tới thử thách cuối bài" (benai-8 chạy trọn).
V.step("vy-hoc", "Học như chơi", [
    ("Tới điểm rẽ, Vy thử chọn sai: Nạp ngay kẻo mất suất.", [look(hs("Nạp ngay kẻo mất suất"), hold=3.2), wait(N[9]),
                                                              tap("Nạp ngay kẻo mất suất", "A11f-chon-sai-chon-lai", settle=300), wait(14500)]),
    ("Vy quay lại điểm rẽ.", [wait(N[10]), tap("Quay lại điểm rẽ", "A11c-doc-tung-khung", settle=300)]),
    ("Lần này Vy chọn đúng: Dừng lại, hỏi cô giáo. Cùng nghe Bé Nai kể.", [look(hs("Dừng lại, hỏi cô giáo"), hold=3.6), wait(N[11]),
                                                                          tap("Dừng lại, hỏi cô giáo", "A11j-chon-dung-hoi-co-giao", settle=300), wait(7300)]),
    ("Thử thách cuối bài là cuộc gọi video với chị Lan, do AI đóng vai.", [look(hs("Tới thử thách cuối bài"), hold=3.6), wait(N[12]),
                                                                          tap("Tới thử thách cuối bài", "@video", settle=1500), wait(4600)]),
])
V.steps[-1]["goc"] = True
FINISH = "(()=>{try{const e=cur.view.contentDocument.querySelector('#finish a.primary');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'}catch(_){return false}})()"
# Gọi video: quay nhẹ (tỉ lệ 1, JPEG 80) để bộ khớp miệng đủ CPU; phát 1x trọn cuộc gọi.
GOI = [
    ("Bấm Chạy demo tự động. Hãy nghe chị Lan và Vy nói chuyện.", [js("window.__iso = cur.view.contentWindow.crossOriginIsolated"), phone(hold=4), wait(N[13]), click(inframe("#auto"), settle=500), {"waitFor": FINISH, "timeout": 150000, "settle": 800}]),
    ("Mỗi ý đúng của Vy được đánh dấu ngay trên màn hình.", [look(inframe(".chip.k", up="div:has(> .chip.k)"), hold=3.0), wait(2300)]),
    ("Hết cuộc gọi là bảng điểm cuối bài.", [wait(N[14]), click(inframe("#finish a.primary"), settle=250), arrive("A11i-bang-diem-cuoi-bai", settle=300), phone(hold=4), wait(4300)]),
]
V.step("vy-goi", "Gọi video cuối bài", GOI, setup=[{"scale": 1, "quality": 80}])
V.steps[-1]["goc"] = True
V.step("vy-kt", "Bài kiểm tra", [
    ("Cuối cùng là bài kiểm tra năm câu.", [tap("Làm bài kiểm tra 5 câu", "A12a-cau-hoi")]),
    ("Vy chọn Lừa đảo, rồi xem kết quả và xếp hạng của nhóm.", [tap("Lừa đảo", "A12b-giai-thich"), phone(hold=1.6), tap("Câu tiếp theo", "A12c-ket-qua"), phone(hold=2.5)]),
], setup=[{"scale": 2, "quality": 92}])

V.chapter("Khoa, đội thanh niên tình nguyện", ["Web quản trị của đội tình nguyện", "Thống kê báo cáo", "AI duyệt trước, người chốt"])
V.step("khoa", "Web quản trị của đội tình nguyện", [
    ("Khoa mở web quản trị của đội tình nguyện.", [click(top("#tWeb"), settle=250), arrive("W01-thong-ke", 1500)]),
    ("Tháng này có 120 báo cáo, 35% là đường dẫn giả.", [phone(hold=3)]),
    ("Khoa mở mục Kiểm duyệt.", [tap("Kiểm duyệt", "W02-kiem-duyet")]),
    ("AI duyệt trước, chỉ những ca chưa chắc mới tới tay người.", [phone(hold=3)]),
    ("Khoa xác nhận đây là lừa đảo.", [tap("Xác nhận lừa đảo", "W01-thong-ke")]),
])

V.card("ket", "outro",
       "Lá chắn số: cảnh báo sớm, người thân vào cuộc, cả cộng đồng cùng giữ an toàn cho người dân thành phố Đồng Nai.")
V.write()

# Kịch bản quay riêng đoạn gọi video (GPU thật + đa luồng wasm): vào thẳng màn gọi video, chờ benai-7/8 hết, rồi quay đúng đoạn vy-goi.
import json as _json
_V = Video("goi", "goi", base=V.base)
_V.setup(persona("Vy", "A01b-trang-chu-day-du"), sim("Thử thách cuối bài", "@video", settle=1500), wait(15500),
         {"eval": "(()=>{const w=cur.view.contentWindow;const c=w.document.createElement('canvas').getContext('webgl');const e=c&&c.getExtension('WEBGL_debug_renderer_info');return {iso:w.crossOriginIsolated,search:w.location.search,gl:e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):null,hc:w.navigator.hardwareConcurrency}})()", "print": True},
         # độ trễ ra loa của AudioContext kiểu 'playback' (bộ khớp miệng trừ số này khi chọn khung miệng): để bù mốc tiếng trong dung.py
         {"eval": "(async()=>{const w=cur.view.contentWindow;const a=new w.AudioContext({latencyHint:'playback'});await a.resume().catch(()=>{});const o=a.createOscillator();const g=a.createGain();g.gain.value=0;o.connect(g);g.connect(a.destination);o.start();await new Promise(r=>setTimeout(r,1200));const r={base:a.baseLatency,out:a.outputLatency,rate:a.sampleRate};o.stop();await a.close();return r})()", "print": True})
_V.step("vy-goi", "Gọi video cuối bài", GOI, setup=[{"scale": GOI_SCALE, "quality": GOI_Q}] if GOI_SCALE else ())
(HERE / "v1" / "goi-plan.json").write_text(_json.dumps({"base": V.base, "viewport": [1440, 810], "scale": 2, "steps": _V.plan}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
