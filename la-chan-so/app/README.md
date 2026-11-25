# App Lá chắn số (Mảng 3)

React 19, Vite. Chạy trong WebView của ứng dụng Android, hoặc trên trình duyệt điện thoại để trình diễn.

**Giao diện V3:** gọn, chia theo 3 đối tượng (người lớn tuổi, học sinh, đội tình nguyện). Màu, cỡ chữ và bố cục theo bản `review/mockup/v3.html`. Linh vật Bé Nai lấy từ bộ tranh của Mảng 4.

**Logo:** khiên của đội, không dùng biểu trưng của cơ quan nào (quy ước "không logo thật").

## Chạy

```bash
cd la-chan-so/server && python chay-demo.py --build     # build app rồi chạy máy chủ HTTP 8000 + HTTPS 8443 (xem ../HUONG-DAN-CHAY-DEMO.md)
cd la-chan-so/app && npm install && npm run dev         # http://localhost:5173 khi sửa giao diện, tự chuyển /api sang cổng 8000
```

- **Trên máy tính** (rộng hơn 600px): app hiện trong khung điện thoại 390×844.
- **Trên điện thoại:** app chiếm toàn màn hình, chừa tai thỏ và thanh cử chỉ. Cài ra màn hình chính được (`public/manifest.webmanifest`).
- **Tiếng và rung** (`src/lib/sound.js`): một trình phát dùng chung, mở khóa ở lần chạm đầu tiên.
  - Màn đổ chuông có chuông và rung.
  - Kết quả Nguy hiểm, màn khẩn cấp, màn "Dừng lại" và lời người thân trả lời đều rung.

Tham số trên địa chỉ trang:

| Tham số | Tác dụng |
|---|---|
| `?mode=simple` · `?mode=full` · `?mode=volunteer` | Vào thẳng vai người lớn tuổi (bà Hoa) · học sinh (Vy) · đội tình nguyện (Khoa), bỏ qua màn chào |
| `#/chao` | Mở như người dùng mới: màn chào, chọn vai, quyền riêng tư, chọn phường |
| `?api=http://192.168.1.10:8000` | Trỏ tới máy chủ khác (lưu lại cho lần sau) |
| `?nguoithan=0` | Xóa người thân để xem màn "Chưa có người thân" |
| `?demo=1` | Bảng mô phỏng và mã QR, chi tiết ngay dưới bảng |

Bảng mô phỏng (`?demo=1`):
- **Trên laptop:** bảng bên trái, mã QR bên phải. Công tắc **Máy này / Điện thoại** quyết định nút bấm đổi màn ở đâu. Chọn **Điện thoại** thì laptop gửi lệnh `demo.go` qua máy chủ, điện thoại đang mở app tự đổi màn.
- **Trên điện thoại:** chạm mấu nhỏ ở mép trái để mở bảng.

## Màn và đường dẫn

Mã màn ghi ở `data-name` của khung, cùng tên với bản V3.

| Nhóm | Đường dẫn → màn | Tệp |
|---|---|---|
| Chung | `#/chao` 00 · `#/vai` 0 · `#/rieng-tu` 0b · `#/phuong` 0c · `#/ca-nhan` 0d · `#/thiet-lap` A02a, A02b | `v3/screens/Common.jsx` |
| Trang chủ | `#/` → A1 (lớn tuổi), B1 (học sinh), C1 (tình nguyện); E01a khi Lá chắn đang ngủ | `v3/screens/Home.jsx` |
| Kiểm tra | `#/kiem-tra?loai=phone\|text\|account` A2, B2 · `#/ket-qua` A3 (4 mức) · `#/phan-tich` B3 · `#/mat-mang` A2b · `#/chua-du-thong-tin` E01d · `#/doc-so` A7 | `v3/screens/Check.jsx`, `Help.jsx` |
| Người thân | `#/nguoi-than` A4 · `#/nguoi-than/them` A4c · `#/hoi-nguoi-than` · `/cho` A4b · `/tra-loi` · `#/chua-co-nguoi-than` A4a · `#/goi` A8 (mô phỏng) | `v3/screens/People.jsx` |
| Khi bị lừa | `#/khan-cap` A5 · `#/ke-lai` A6 (cũng là `#/khong-ghi-am`) | `v3/screens/Help.jsx` |
| Cuộc gọi (Android mở) | `#/cuoc-goi?so=…` A03 · `#/sau-cuoc-goi?so=…&giay=…&ghiam=1` · `#/hoi-nhanh` A04a · `#/phan-tich-cuoc-goi` A04b · `#/dung-lai?phut=4` A10a · `#/dung-lai?danggoi=1&so=…&giay=…` A10b · `#/thong-bao?tin=…` A05a | `v3/screens/Call.jsx` |
| Học sinh | `#/bao-cao` B4 · `/xong` B4b · `#/bai-hoc` B5 · `#/bai-hoc/:id` B6 · `#/kiem-tra-bai` B7 · `/ket-qua` B8 | `v3/screens/Student.jsx` |
| Đội tình nguyện | `#/ma-doi` C0 · `#/thong-ke` C2 · `#/kieu-moi` C3 · `#/duyet` C4 · `#/chia-se` C5 | `v3/screens/Volunteer.jsx` |

**Thành phần dùng chung** (`v3/ui.jsx`, `v3/theme.css`):
- Khung và điều hướng: `Screen`, `Bar`, `Nav` (thanh điều hướng nổi theo đối tượng).
- Danh sách và nhập liệu: `Group` và `Row`, `Btn`, `Seg`, `Keypad`.
- Hình ảnh và trạng thái: `Art` (Bé Nai), `StateView`, `Banner`.

**Luồng cuộc gọi:**
1. Đổ chuông có thẻ cảnh báo (A03). Bà bấm **Nghe**.
2. Cúp máy, Bé Nai hỏi bằng giọng thu sẵn (A04a). Bà bấm **Có**.
3. AI chép lời, tô dấu hiệu và tự báo Minh (A04b).
4. Minh trả lời, trong app hoặc trên trang Zalo. Máy bà hiện lời trả lời thật to và đọc thành tiếng.

**Bài học:**
- Nếu máy chủ có trang của Mảng 4 (`/prototype/hoc.html`, truyện tranh cùng Bé Nai, gọi video nhân vật AI), app mở trang đó, đúng bài theo kiểu lừa đảo vừa gặp.
- Nếu chưa có, app dùng 4 bài 1 phút và bài kiểm tra 5 câu trong `v3/lessons.js`.

**Đường dây nóng 113, 156:** luôn chỉ mở màn gọi mô phỏng, không bao giờ quay số thật.

## Cầu nối với Android (cho Hoàng)

App tự tìm `window.LCSNative`. Chưa có thì dùng cách thay thế để vẫn chạy trên trình duyệt (`src/lib/native.js`).

| Hàm | Trả về | Dùng ở |
|---|---|---|
| `speak(text)`, `stopSpeaking()` | | Nút loa, lời người thân trả lời, màn khẩn cấp |
| `listen()` | chữ nghe được | "Đọc số" (A2, A7), Bé Nai hỏi (A04a) |
| `call(phone)` | | Gọi người thân đã lưu số (đường dây nóng thì không) |
| `blockNumber(phone)` | `true` nếu chặn được | Thẻ cảnh báo lúc đổ chuông, lời trả lời "Chặn số" |
| `analyzeRecording(phone)` | chuỗi JSON `AnalysisResult` | A04b: Android đọc tệp ghi âm, gửi `POST /api/analyze/call`, trả kết quả |
| `endCall()` | | A10b "Cúp máy ngay" |
| `dismissStop()` | | A10a "Đóng cảnh báo" |
| `layers()` | chuỗi JSON `{calls, messages, banking, asleep}` | A02, E01a, Cá nhân: trạng thái 3 lớp |
| `enableLayer(key)` | | A02 "Bật", E01a "Bật lại ngay": mở đúng màn xin quyền (`calls`, `messages`, `banking`) |
| `setVoiceAsk(on)` | | Cá nhân: "Hỏi bằng giọng nói" |
| `openStory(scamType)` | | Mở đúng bài học (Mảng 4) |
| `weekStats()` | chuỗi JSON `{calls, messages, layersOn}` | Thống kê tuần (nếu có) |

Gán `window.LCS_API_BASE` (địa chỉ máy chủ) trước khi nạp trang. Đóng gói `dist/` vào `assets` thì app vẫn mở được khi mất mạng (màn A2b).

## Kiểm tra

```bash
python tools/chup-man.py chup/                              # Selenium + Firefox: đi hết luồng của 3 đối tượng, chụp từng màn
python tools/kiem-dien-thoai.py dt/ https://<ip>:8443       # khổ điện thoại qua HTTPS + laptop điều khiển từ xa, kiểm không tràn ngang
```

`chup-man.py` kiểm cả hành vi, không chỉ chụp màn:
- Minh trả lời trên trang Zalo thì máy bà hiện lời.
- Duyệt báo cáo thì máy chủ giảm số chờ duyệt.
- Gửi cảnh báo thì máy chủ có tin.
- Trả lời đúng hết thì ra 5/5.

Thiết kế 53 màn trước đây (`../screens/`, `../export/png/`) vẫn giữ trong kho để đối chiếu.
