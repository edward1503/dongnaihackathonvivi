# App Lá chắn số (Mảng 3)

React 19, Vite. Chạy trong WebView của ứng dụng Android, hoặc trên trình duyệt để trình diễn. Dùng thẳng `../ds.css`, `../icons.js` và phông chữ của bản thiết kế, nên app và thiết kế luôn chung một bộ.

## Chạy

```bash
cd la-chan-so/server && uvicorn lcs.main:app --port 8000     # máy chủ, xem server/README.md
cd la-chan-so/app && npm install && npm run dev              # http://localhost:5173, tự chuyển /api sang cổng 8000
npm run build                                                # ra dist/; máy chủ phục vụ luôn ở http://<máy>:8000/
```

- **Trên máy tính** (cửa sổ rộng hơn 600px): app hiện trong khung điện thoại 360×800, giống thiết kế.
- **Trên điện thoại:** app chiếm toàn màn hình, ẩn thanh trạng thái vẽ sẵn.

Tham số trên địa chỉ trang, dùng khi trình diễn:

| Tham số | Tác dụng |
|---|---|
| `?mode=simple` · `?mode=full` | Máy bà Hoa (A01a) · máy Vy (A01b) |
| `?api=http://192.168.1.10:8000` | Trỏ tới máy chủ khác (lưu lại cho lần sau) |
| `?nguoithan=0` | Xóa người thân để xem màn E01b |
| `?demo=1` | Hiện hàng số mẫu ở A06a và bảng mô phỏng bên trái (có cuộc gọi lạ, mở app ngân hàng, đặt lại demo) |

## Màn và đường dẫn

| Đường dẫn | Màn | Tệp |
|---|---|---|
| `#/` | A01a, A01b | `screens/Home.jsx` |
| `#/kiem-tra` · `#/kiem-tra/tin-nhan` | A06a · A06b | `screens/Check.jsx` |
| `#/ket-qua` | A07a–d (theo `level`) | `screens/Result.jsx` |
| `#/phan-tich` | A05b | `screens/MessageResult.jsx` |
| `#/hoi-nguoi-than` · `/cho` · `/tra-loi` | A08a · A08b · A08c | `screens/Ask.jsx` |
| `#/bao-cao` · `/cong-dong` · `/xong` | A09a · A09b · A09c | `screens/Report.jsx` |
| `#/chua-co-nguoi-than` · `#/mat-mang` · `#/chua-du-thong-tin` | E01b · E01c · E01d | `screens/States.jsx` |
| `#/cuoc-goi?so=…` | A03a (số bị báo) · A03b (số chưa rõ) | `screens/Call.jsx` |
| `#/sau-cuoc-goi?so=…&giay=252&ghiam=1` | điều phối khi cúp máy, mở A04a | `screens/Call.jsx` |
| `#/hoi-nhanh` · `#/phan-tich-cuoc-goi` · `#/khong-ghi-am` | A04a · A04b · A04c | `screens/Call.jsx` |
| `#/dung-lai?phut=4` | A10a | `screens/Call.jsx` |

**Luồng cuộc gọi:**
1. Đổ chuông (A03a), bà bấm Nghe.
2. Cúp máy, Bé Nai hỏi (A04a), phát giọng thu sẵn.
3. Bà bấm "Có", mở A04b: AI chép lời và phân tích, tự báo Minh (`POST /api/alerts`).
4. Minh trả lời, trong app hoặc trên trang Zalo, thì máy bà tự chuyển sang A08c.

Trên trình duyệt, A04b gửi bản chép lời mẫu; có khóa Gemini thì AI phân tích thật.

## Cầu nối với Android (cho Hoàng)

App tự tìm `window.LCSNative`. Chưa có thì dùng cách thay thế để vẫn chạy trên trình duyệt (`src/lib/native.js`, `src/lib/links.js`).

| Hàm | Trả về | Dùng ở |
|---|---|---|
| `speak(text)`, `stopSpeaking()` | | A08c đọc lời Minh, nút loa |
| `listen()` | chữ nghe được | "Nói với Lá chắn" (A01a), "Nói" (A06a), kể lại (A09a) |
| `call(phone)` | | "Gọi điện cho Minh", "Gọi 113" |
| `blockNumber(phone)` | `true` nếu chặn được | A08c "Đã chặn số" |
| `recentCalls()` | chuỗi JSON `[{phone, at, durationSec}]` | A06a "Từ nhật ký gọi" |
| `weekStats()` | chuỗi JSON `{calls, messages, layersOn}` | A01a, A01b |
| `openStory(scamType)` | | Mở đúng truyện (Mảng 4) |
| `openSettings()` | | Tab "Tôi", thiết lập (A02) |
| `analyzeRecording(phone)` | chuỗi JSON `AnalysisResult` | A04b: Android đọc tệp ghi âm của máy, gửi `POST /api/analyze/call`, trả kết quả |
| `dismissStop()` | | A10a "Đóng cảnh báo": tắt lớp phủ |

Ngoài ra có thể gán `window.LCS_API_BASE` (địa chỉ máy chủ) và `window.LCS_LEARN_URL` trước khi nạp trang. Đóng gói `dist/` vào `assets` của ứng dụng thì app vẫn mở được khi mất mạng (màn E01c).

## Dùng lại cho Zalo và web (cho Đức)

- **CSS:** `import '../../ds.css'`, như `src/main.jsx`.
- **Thành phần:**
  - `ui/Icon.jsx`: biểu tượng lấy từ `icons.js`.
  - `ui/Phone.jsx`: khung màn hình, thanh tiêu đề, thanh điều hướng.
  - `ui/result.jsx`: các khối của màn kết quả.
- **Gọi máy chủ:** `lib/api.js`.
- **Nhận sự kiện:** `lib/relay.js`, hàm `connectRoom(room, who, onEvent)`. Có sẵn đường dự phòng hỏi định kỳ.

## Kiểm tra

```bash
python tools/chup-man.py chup/      # Selenium + Firefox: bấm qua 24 màn như người dùng (cả bước Minh trả lời trên trang Zalo), chụp để so với ../export/png/
```

## Khác thiết kế có chủ đích

- **A05b:** tin dán vào hiện chip "Tin nhắn dán vào"; tin đến từ thông báo (Android) mới hiện "Ứng dụng nhắn tin · Người lạ".
- **A05b, A09b:** câu "Báo … cho cộng đồng?" đổi theo đối tượng (số, đường dẫn, tin).
- **A09a:** ô "Đính kèm bản ghi âm" mặc định chưa chọn, vì bản thuyết minh ghi bản ghi chỉ gửi khi người dùng chọn.
- **A08c:** "Đã chặn số" chỉ hiện khi Android chặn được thật. Trên trình duyệt thì hiện nút "Chặn số".
- **A09c:** chip trạng thái theo kết quả kiểm duyệt thật: đã xác nhận, chờ đội duyệt, hoặc chưa đủ căn cứ.
- **E01d:** dùng lại cho tin có mã OTP. Lá chắn không gửi tin đó đi.
