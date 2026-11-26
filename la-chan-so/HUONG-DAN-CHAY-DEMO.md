# Hướng dẫn chạy demo Lá chắn số (vòng chung kết)

Một laptop chạy máy chủ. Điện thoại của đội và của ban giám khảo mở app qua mạng Wi-Fi chung, hoặc qua điểm phát 4G của laptop. Dữ liệu là dữ liệu giả lập.

## 1. Cài một lần

```bash
cd la-chan-so/server
pip install -r requirements.txt          # Python 3.11 trở lên
cd ../app && npm install                 # Node 20 trở lên
```

Khóa AI (không bắt buộc, không có thì demo vẫn chạy bằng bộ luật và câu thu sẵn). Tạo tệp `la-chan-so/server/.env`, hoặc dùng chung tệp `la-chan-so/.env` của Mảng 4. Cả hai tệp đều không đưa lên kho.

```
LCS_DEMO=1
GEMINI_API_KEYS=khóa1,khóa2
OPENAI_API_KEY=...        # tùy chọn: hiểu ý người học trong gọi video, giống máy chủ giả của Mảng 4
```

## 2. Chạy

```bash
cd la-chan-so/server
python chay-demo.py --build      # build app React rồi chạy; lần sau chỉ cần: python chay-demo.py
```

Cửa sổ dòng lệnh in ra mọi địa chỉ và một mã QR:

| Ai dùng | Mở địa chỉ |
|---|---|
| Laptop người trình bày (bảng mô phỏng, mã QR) | `http://localhost:8000/?mode=simple&demo=1` |
| Điện thoại "bà Hoa" (người lớn tuổi) | `https://<ip-laptop>:8443/?mode=simple` (hoặc quét mã QR) |
| Điện thoại "Vy" (học sinh) | `https://<ip-laptop>:8443/?mode=full` |
| Điện thoại "Khoa" (đội tình nguyện, mã đội thử 246 810) | `https://<ip-laptop>:8443/?mode=volunteer` |
| Mở như người dùng mới (màn chào, chọn vai) | `https://<ip-laptop>:8443/#/chao` |
| Máy Minh | App Lá chắn số, vai **Người thân**, mã gia đình `gia-dinh-hoa` |
| Web đội tình nguyện (Mảng 6) | `https://<ip-laptop>:8443/web` |
| Gọi video khuyên chị Lan (Mảng 4) | `https://<ip-laptop>:8443/prototype/video-call.html` |
| App Android của Mảng 1, ô "Máy chủ của đội" | `http://<ip-laptop>:8000` |

**Vì sao điện thoại phải dùng `https`:** trình duyệt điện thoại chỉ cho dùng micro ("Giữ để nói", "Nói với Lá chắn") và chạy avatar nhiều luồng khi trang mở bằng https. `chay-demo.py` tự tạo chứng chỉ cho IP của laptop. Lần đầu mở, điện thoại báo "Kết nối không riêng tư": bấm **Nâng cao**, rồi **Tiếp tục truy cập**.

Muốn cài app ra màn hình chính cho giống app thật: trong Chrome bấm ⋮, chọn **Thêm vào màn hình chính**. App mở toàn màn hình, có biểu tượng khiên.

## 3. Kịch bản trình diễn

Trước mỗi lượt diễn, bấm **Đặt lại demo** ở bảng mô phỏng. Ở bảng mô phỏng trên laptop, chọn **Điện thoại** thì mỗi nút sẽ đổi màn trên điện thoại đang mở app. Chọn **Máy này** thì đổi ngay trên laptop. Trên điện thoại cũng mở được bảng này: thêm `&demo=1` vào địa chỉ, rồi chạm vào mấu nhỏ ở mép trái màn hình.

Mỗi điện thoại cần được chạm vào màn hình một lần sau khi mở trang, để trình duyệt cho phát tiếng và rung.

Mở đầu nên cho xem màn chào và màn **Bạn là ai?**: một app, 3 đối tượng (người lớn tuổi, học sinh, đội tình nguyện).

**a. Cuộc gọi lừa đảo (phần chính, người lớn tuổi):**
1. Laptop bấm **Có cuộc gọi lạ**. Điện thoại bà Hoa đổ chuông và rung, thẻ đỏ "Nghi lừa đảo" (A03).
2. Bấm **Nghe**. Bé Nai hỏi: "Người vừa gọi có bảo bà chuyển tiền không ạ?" (A04a). Bấm **Có**.
3. AI chép lời, tô đỏ dấu hiệu, rồi tự báo Minh (A04b).
4. Trên máy Minh (app, vai Người thân), thông báo cảnh báo hiện ra. Bấm vào, chọn **Đừng chuyển**. Điện thoại bà Hoa hiện lời Minh thật to và đọc thành tiếng.
5. Laptop bấm **Mở app ngân hàng sau cuộc gọi**. Màn đỏ "DỪNG LẠI" có Bé Nai hiện lên (A10a).

**b. Đang bị gọi đòi tiền:** trên trang chủ bấm **Xử lý ngay** (A5). Màn hiện "Bình tĩnh. Đừng chuyển tiền." kèm 3 bước. Bấm **Kể lại cuộc gọi**, trả lời 4 câu Có/Không (A6), xem kết quả.

**c. Đang nghe máy mà mở app ngân hàng:** laptop bấm **Đang gọi số lạ, mở app ngân hàng** (A10b). Bấm **Cúp máy ngay** thì Bé Nai hỏi tiếp như bước a.2.

**d. Kiểm tra số:**
- Ô "Số lạ, đường dẫn", bấm số trên bàn phím lớn, bấm **Kiểm tra**.
- Thử 4 số: `0912 345 678` cho Nguy hiểm, `1900 5555 88` cho An toàn, `0987 654 321` cho Chưa rõ, và đường dẫn `qua-tri-an-khach-hang.top` cho Nghi ngờ.
- Ở kết quả, bấm **Hỏi người thân** để gửi cho Minh.

**e. Tin nhắn lừa đảo (học sinh).** Màn mô phỏng cho xem cách lọc và phân tích tin nhắn. Để báo cho cộng đồng, chọn tin nhắn thật trên máy Android đã nhận. Mục **Bài học** có bài 1 phút và bài kiểm tra 5 câu.

**f. Đội tình nguyện.** Mở `/web`. Ba mã thử của phường Trấn Biên là **246810** (Khoa), **135790** (Lan Anh) và **999111** (Hùng, trưởng đội).

- Xem tổng quan, rồi mở **Kiểm duyệt** để đối chiếu số máy, thời điểm nhận, bản ghi đã che và ý kiến của gia đình. Chọn cụm 5 máy có một phiếu để thử bỏ phiếu thứ hai bằng tài khoản khác.
- Tra **028 9999 1234** để thấy đỏ với 7 máy. Khiếu nại từ kết quả tra số. Dùng mã **246810** khi bật `LCS_DEMO=1`. Xác minh xong, số chuyển vàng trong lúc chờ xét. Đăng nhập bằng mã của Hùng để giữ hoặc gỡ nhãn.
- Hùng có thể phát cảnh báo khu phố. Chọn người thân đã ghép để Minh nhận trong app.

**g. Thiết lập và Lá chắn đang ngủ:**
- **Thiết lập lần đầu:** bật từng lớp bảo vệ (A02a), đủ 3 lớp thì sang màn "Lá chắn đã sẵn sàng" (A02b).
- **Máy tắt Lá chắn:** trang chủ hiện thẻ đỏ "Lá chắn đang ngủ" (E01a). Bấm **Bật lại ngay**.

**h. Gọi video khuyên chị Lan:** mở từ mục Bài học, hoặc mở thẳng `/prototype/video-call.html`. Nhân vật có nhãn "AI đóng vai".

## 4. Khi có sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Điện thoại không mở được trang | Laptop và điện thoại phải chung một mạng. Mạng của khách sạn hoặc trường thường chặn các máy nhìn thấy nhau: dùng điểm phát 4G của điện thoại khác, cho laptop vào mạng đó |
| Bấm trên laptop mà điện thoại không đổi màn | Bảng mô phỏng phải đang chọn **Điện thoại**. Điện thoại phải đang mở app, không phải trang web |
| Không có tiếng Bé Nai trên điện thoại | Chạm vào màn hình điện thoại một lần, rồi bấm lại |
| Mất mạng Internet | Demo vẫn chạy: AI lùi về bộ luật và bản chép lời mẫu. Riêng nhận giọng nói của trình duyệt cần Internet |
| Đổi mạng (IP laptop khác) | Chạy lại `python chay-demo.py`, tệp sẽ tự tạo chứng chỉ mới |

## 5. Kiểm tra trước giờ diễn

```bash
cd la-chan-so/server && python -m pytest -q                            # 73 bài kiểm thử máy chủ
python ../app/tools/chup-man.py /tmp/chup                              # đi hết luồng của 3 đối tượng, chụp từng màn
python ../app/tools/kiem-dien-thoai.py /tmp/dt https://<ip>:8443       # khổ điện thoại và điều khiển từ xa
```

## 6. AI dùng vào việc gì (bổ sung cho mục (e) của bản thuyết minh)

**Trong sản phẩm** (máy chủ gọi AI, khóa nằm ở máy chủ):

| Việc | Mô hình | Gửi đi những gì |
|---|---|---|
| Phân tích tin nhắn: tô dấu hiệu, gợi ý việc nên làm (A05b, A06b) | Gemini | Nội dung tin, đã thay số điện thoại và số tài khoản bằng [SĐT], [TK]. Tin có mã OTP không bao giờ được gửi đi |
| Chép lời và phân tích bản ghi âm cuộc gọi (A04b) | Gemini | Tệp ghi âm (máy chủ không lưu), rồi bản chép lời đã che số |
| Hiểu ý người học trong cuộc gọi video với chị Lan | OpenAI nếu đặt khóa, không thì Gemini | Câu người học nói, mọi dãy từ 4 chữ số đã thay bằng ••• |
| Đọc lời nhân vật gọi video | Gemini TTS | Câu nhân vật nói |

Luật chung:
- AI không bao giờ kết luận "an toàn". Chỉ danh bạ trắng các tổng đài đã xác thực mới cho mức An toàn.
- AI hỏng, hết giờ hoặc không có khóa thì máy chủ dùng bộ luật và câu thu sẵn. Kết quả lúc đó ghi nguồn là `heuristic` hoặc `fallback`.

**Khi làm sản phẩm ở vòng chung kết:**
- **Claude (Claude Code):** viết mã máy chủ (Mảng 2) và app React (Mảng 3) theo kế hoạch của đội, cùng các bài kiểm thử. Commit có dòng `Co-Authored-By: Claude`.
- **Giao diện:** dựng theo thiết kế V3 của đội (`review/mockup/v3.html`, gọn, 3 đối tượng) và linh vật Bé Nai của đội. Không sao chép giao diện sản phẩm có sẵn. Biểu trưng Đồng Nai đặt ở ô tên app đầu trang chủ và ở màn chào; biểu tượng app là khiên của đội (đội cần hỏi ban tổ chức cho phép dùng biểu trưng).
- **Các mảng khác:** công cụ AI dùng ở Mảng 1, 4, 5, 6 xem README của từng mảng (ví dụ `android/README.md`).

Đội rà soát và quyết định cuối cùng mọi nội dung.
