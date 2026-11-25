# App Lá chắn số (Mảng 3)

React 19, Vite. Chạy trong WebView của ứng dụng Android, hoặc trên trình duyệt điện thoại để trình diễn.

**Giao diện V3** có hai vai cá nhân là Người lớn tuổi và Học sinh. Nút **Đăng nhập đội** mở màn nhập mã do đội cấp. Thành viên xem thống kê và bỏ phiếu theo đợt xét. Trưởng đội còn được giải quyết yêu cầu báo nhầm và gửi cảnh báo khu phố. Tên, vai trò và nút đăng xuất nằm trong **Cá nhân**. Màu, cỡ chữ và bố cục theo bản `review/mockup/v3.html`. Linh vật Bé Nai lấy từ bộ tranh của Mảng 4.

**Logo:** khiên gạc nai (`src/v3/art/logo.webp`, gốc ở `../tools/logo/logo-c.png`) ở ô tên app đầu trang chủ, màn chào và thẻ cảnh báo; cùng hình với biểu tượng app Android. Biểu trưng Đồng Nai chỉ đặt nhỏ ở chân màn chào để ghi cuộc thi; đội cần ban tổ chức đồng ý cho dùng biểu trưng.

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
| `?mode=simple` · `?mode=full` · `?mode=volunteer` | Mở vai người lớn tuổi (bà Hoa) · học sinh (Vy) · đội. Máy chưa có phiên đội sẽ mở màn đăng nhập C0 |
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
| Kiểm tra | `#/kiem-tra?loai=phone\|text\|account` A2, B2 · `#/ket-qua` A3 (4 mức) · `#/phan-tich` B3 · `#/mat-mang` A2b · `#/chua-du-thong-tin` E01d · `#/bao-nham` xác minh số bị báo · `#/doc-so` A7 | `v3/screens/Check.jsx`, `Appeal.jsx`, `Help.jsx` |
| Người thân | `#/nguoi-than` A4 · `#/nguoi-than/them` A4c · `#/hoi-nguoi-than` · `/cho` A4b · `/tra-loi` · `#/chua-co-nguoi-than` A4a · `#/goi` A8 (mô phỏng) | `v3/screens/People.jsx` |
| Khi bị lừa | `#/khan-cap` A5 · `#/ke-lai` A6 (cũng là `#/khong-ghi-am`) | `v3/screens/Help.jsx` |
| Cuộc gọi (trình duyệt mô phỏng) | `#/cuoc-goi?so=…` A03 · `#/sau-cuoc-goi?so=…&giay=…&ghiam=1` · `#/hoi-nhanh` A04a · `#/phan-tich-cuoc-goi` A04b · `#/dung-lai?phut=4` A10a · `#/dung-lai?danggoi=1&so=…&giay=…` A10b · `#/thong-bao?tin=…` A05a | `v3/screens/Call.jsx` |
| Báo cáo và bài học (hai vai cá nhân) | `#/bao-cao` B4 · `/xong` B4b · `#/bai-hoc` B5 · `#/bai-hoc/:id` B6 · `#/kiem-tra-bai` B7 · `/ket-qua` B8 | `v3/screens/Report.jsx`, `Student.jsx` |
| Đội tình nguyện | `#/ma-doi` C0 · `#/thong-ke` C2 · `#/kieu-moi` C3 · `#/duyet` C4 · `#/chia-se` C5 | `v3/screens/Volunteer.jsx` |

**Thành phần dùng chung** (`v3/ui.jsx`, `v3/theme.css`):
- Khung và điều hướng: `Screen`, `Bar`, `Nav` (thanh điều hướng nổi theo đối tượng).
- Danh sách và nhập liệu: `Group` và `Row`, `Btn`, `Seg`, `Keypad`.
- Hình ảnh và trạng thái: `Art` (Bé Nai), `StateView`, `Banner`.

**Luồng cuộc gọi mô phỏng trên trình duyệt**

1. Đổ chuông có thẻ cảnh báo (A03). Bà bấm **Nghe**.
2. Cúp máy, Bé Nai hỏi bằng giọng thu sẵn (A04a). Bà bấm **Có**.
3. AI chép lời, tô dấu hiệu và tự báo Minh (A04b).
4. Minh trả lời, trong app hoặc trên trang Zalo. Máy bà hiện lời trả lời thật to và đọc thành tiếng.

**Báo cáo, tra cứu và xét hồ sơ**

- Trên Android, B4 liệt kê cuộc gọi đến và tin nhắn đã nhận trong 7 ngày. Chọn một sự kiện để đọc tình trạng, kể thêm, gửi hoặc rút báo cáo. Android ký yêu cầu và gửi mã máy đến máy chủ. Trình duyệt chỉ hướng dẫn mở app trên điện thoại đã nhận sự kiện.
- Màn kết quả dùng tiêu đề và số máy được tính từ máy chủ. Chủ số chọn **Số của tôi bị báo nhầm**, nhập số liên hệ rồi nhập mã xác minh dành cho số bị báo. Bản hackathon dùng mã do máy chủ trả trong chế độ demo theo mục 5 của [giao kèo](../VAI-VA-KIEM-DUYET.md).
- Đội xem từng đợt, các báo cáo và bằng chứng đã che trong hồ sơ. Số máy đã báo có thể lớn hơn số máy được tính vào mức công khai. Cần ghi lý do khi xử lý ý kiến trái nhau. Trưởng đội xem yêu cầu đã xác minh để giữ hoặc gỡ nhãn.
- Trình duyệt đăng ký mã máy qua `POST /api/devices` khi mở app lần đầu, rồi lưu mã theo máy chủ trong localStorage. APK dùng `LCSNative.deviceId()`. Các lệnh đội gửi `X-LCS-Device` và `X-LCS-Team`. App lưu token và thông tin thành viên trong `lcs.team` sau khi đăng nhập thành công. Khi máy chủ trả 401 cho phiên đội, app xóa phiên và mở lại C0.

**Bài học**

Tab Bài học mở bằng truyện tranh cùng Bé Nai. Bà Hoa thấy bài 1 và 3, Vy thấy bài 2 và 4. **Tất cả bài** mở thư viện. Dưới truyện là **Gọi video luyện tập** với anh Minh (bà Hoa), chị Lan và chú Tư (Vy). **Ôn nhanh** giữ bốn bài một phút và bài kiểm tra năm câu. Trình duyệt mở truyện qua `/prototype/hoc.html?kieu=…` và cuộc gọi qua `/prototype/video-call.html?canh=…`.

**Đường dây nóng 113, 156** luôn chỉ mở màn gọi mô phỏng, không bao giờ quay số thật.

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
| `deviceId()` | Chuỗi mã máy Android | Đăng nhập đội, xét hồ sơ, khiếu nại và cảnh báo gia đình |
| `recentEvents()` | Promise JSON chứa danh sách sự kiện đã nhận | B4 chọn theo `eventId`, hiển thị loại cuộc gọi/tin nhắn, số hiển thị, thời điểm, bản ghi và trạng thái báo cáo |
| `reportEvent(eventId, story?)` | Promise JSON `{report, case, message}` hoặc `{detail}` | Báo sự kiện đã chọn. Android đối chiếu và ký biên nhận |
| `withdrawReport(reportId)` | Promise JSON | Rút báo cáo trên máy đã gửi |
| `openStory(scamType)` | | Mở truyện theo `ma_kieu`. Chuỗi rỗng mở thư viện |
| `openCall(scene)` | | Gọi anh Minh (`minh-1`, `minh-3`), chị Lan (`lan-2`) hoặc chú Tư (`tu-9`) |
| `demo(key)` | | Cá nhân → Thử Lá chắn trên APK. Các khóa là `ring`, `ringKnown`, `afterCall`, `stop`, `message`, `bankWatch` |
| `weekStats()` | chuỗi JSON `{calls, messages, layersOn}` | Thống kê tuần (nếu có) |
| `saveRelative(name, phone)` | | Lưu người thân đầu tiên có số cho luồng hỏi sau cuộc gọi của Android |
| `openAdvanced()` | | Cá nhân → "Cài đặt nâng cao" (chỉ hiện khi chạy trong app Android) |

Gán `window.LCS_API_BASE` (địa chỉ máy chủ) trước khi nạp trang. Sau khi chạy `npm run build`, đóng gói `dist/` vào `assets` thì app vẫn mở được khi mất mạng (màn A2b).

## Kiểm tra

```bash
python tools/chup-man.py chup/                              # Selenium + Firefox: đi hết luồng của 3 đối tượng, chụp từng màn
python tools/kiem-dien-thoai.py dt/ https://<ip>:8443       # khổ điện thoại qua HTTPS + laptop điều khiển từ xa, kiểm không tràn ngang
```

`chup-man.py` kiểm cả hành vi, không chỉ chụp màn:
- Minh trả lời trên trang Zalo thì máy bà hiện lời.
- Thành viên bỏ phiếu cho đợt đang xét. Chỉ trưởng đội mở được màn gửi cảnh báo.
- Gửi cảnh báo thì máy chủ có tin.
- Trả lời đúng hết thì ra 5/5.

Thiết kế 53 màn trước đây (`../screens/`, `../export/png/`) vẫn giữ trong kho để đối chiếu.
