# Hợp đồng dữ liệu giữa app Android và máy chủ

Các trường và quy tắc báo cáo theo mục 3–5 của [Vai, tính năng và kiểm duyệt báo cáo](../VAI-VA-KIEM-DUYET.md). `ReceiptRules.kt` chuẩn hóa và ký. `ReceivedEvents.kt` đối chiếu nguồn nhận. `EventReports.kt` nối sự kiện với bản phân tích, báo cáo và cảnh báo gia đình.

## Máy nhận và biên nhận

| Thao tác | Dữ liệu |
|---|---|
| Đăng ký | `POST /api/devices {}` cấp `deviceId` và `deviceSecret`. Android lưu trong SharedPreferences riêng tư cho địa chỉ máy chủ đã chọn. Chỉ mã máy đi qua cầu React. |
| Gọi API | Android gửi `X-LCS-Device: <deviceId>` khi phân tích, báo cáo, rút báo cáo và tạo cảnh báo. Lỗi máy chủ có trường `detail`. |
| Cuộc gọi | Đọc `CallLog.Calls`, lấy cuộc đến đã hiển thị số và có thời lượng dương. Ngày là thời điểm bắt đầu do nhật ký ghi, thời lượng tính bằng giây. |
| SMS | Dùng thông báo đến của ứng dụng SMS. Android trích đối tượng từ tin gốc trước khi che, giữ tối đa 100 tin đáng ngờ trong danh sách. Các ứng dụng trò chuyện khác vẫn có cảnh báo an toàn riêng. |
| Thời gian | `recentEvents` xét 7 ngày, mới nhất trước. `eventId` là SHA-256 hex của UTF-8 `type\|numberOrSender\|timestampMillis`. Trên đường truyền, `at` dùng UTC tới giây, ví dụ `2026-11-25T04:05:06Z`. |

Chuỗi ký gồm các trường sau, nối bằng dấu gạch đứng, không thêm khoảng trắng hay xuống dòng.

```text
eventId|deviceId|type|incoming|targetKey|at|durationSec
```

Khóa HMAC là các byte UTF-8 của nguyên chuỗi `deviceSecret`. Kết quả HMAC-SHA256 viết hex thường. SMS để trống trường thời lượng và giữ dấu gạch đứng cuối. Khóa đối tượng theo `server/lcs/text.py`, gồm số đã chuẩn hóa hoặc tên miền. Với miền rút gọn trong danh sách máy chủ, giữ cả đường dẫn, bỏ truy vấn và phần sau dấu thăng.

## Từ sự kiện đến báo cáo

- **Tra cứu** gọi `GET /api/lookup/phone/{số}`. Phản hồi có mức cộng đồng và số máy đóng góp. App hiển thị `unknown` là “Chưa rõ”.
- **Phân tích tin và lời kể** gọi `POST /api/analyze/message` với `text`, hoặc multipart `POST /api/analyze/call` với `transcript`. Máy che các dãy số riêng tư trước khi gửi và bỏ qua tin có mã xác thực.
- **Phân tích bản ghi** dùng multipart `POST /api/analyze/call` với `audio, unknownNumber, eventId, type, direction, at, durationSec, targetKey, receipt`. Ở bước này, `targetKey` là SHA-256 hex của khóa chuẩn hóa. Biên nhận ký chính giá trị băm ấy. App dùng tệp do trình gọi điện lưu mà `GhiAm.timMoi` đối chiếu được cho cuộc gọi. App dùng nhãn nội dung `aiLevel, aiScamType, aiConfidence` và giữ `analysisId` theo sự kiện khi máy chủ phân tích được âm thanh thật.
- **Báo cáo** gọi `POST /api/reports` với `kind, target, relation="self", eventId, receipt, evidence` và lời kể đã che nếu có. Android tra lại sự kiện trên máy trước khi ký trên khóa đối tượng chuẩn hóa. `evidence` có `type, direction, at`, thêm `durationSec` cho cuộc gọi và `recording` khi đã phân tích. Trả lời câu hỏi của Bé Nai gửi `selfAnswer` bằng `yes, no, known` và `selfAnswerSignature` ký `eventId|selfAnswer`. Máy chủ quyết định kết quả. Cùng sự kiện dùng lại mã báo cáo đã cấp.
- **Báo người thân** gọi `POST /api/alerts`. Cảnh báo dùng để xác nhận có `eventId, reportId, analysisId, summary` đã che, dùng phòng ghép sẵn `gia-dinh-hoa`. Android giữ `id` trả về làm `alertId`. Cảnh báo gia đình thông thường vẫn có thể gửi độc lập. Máy chủ đối chiếu câu trả lời của Minh với đúng báo cáo.
- **Rút báo cáo** gọi `POST /api/reports/{id}/withdraw` với `at, signature`. Android ký `withdraw|reportId|deviceId|at`. Báo cáo và lần rút trả `report, case, message`. Màn gốc hiện thông báo và đọc khi bật giọng.
- **Trình diễn** dùng `DemoActions` của màn Cài đặt nâng cao. Chỉ nhận biên nhận từ nhật ký cuộc gọi hoặc thông báo SMS thật của máy. Máy chủ giả Android chỉ phục vụ các màn thử.

## Cầu window.LCSNative

| Hàm | Kết quả |
|---|---|
| `deviceId()` | Chuỗi mã máy, rỗng khi chưa đăng ký được |
| `recentEvents()` | Promise trả mảng `eventId, type, target, display, at, hasRecording` cùng các trường hiện có `durationSec, analysisId, reportId, reportStatus` |
| `reportEvent(eventId, story?)` | Promise trả `{report, case, message}` hoặc `{detail}`. Android chỉ dùng đối tượng đã đối chiếu cho sự kiện. |
| `withdrawReport(reportId)` | Promise trả phản hồi rút báo cáo từ máy chủ hoặc `{detail}` |
| `demo(key)` | Mở `ring, ringKnown, afterCall, stop, message, bankWatch` |
| `openCall(scene)` | Mở `minh-1, minh-3, lan-2, tu-9` trong GoiVideoActivity |

`reportStatus` phản ánh lần trả lời gần nhất mà Android nhận cho báo cáo. Máy chủ tiếp tục xử lý lời xác nhận của Minh khi máy bà ngoại tuyến.

## Cuộc gọi video (mảng 4)

Android dùng các lời gọi dưới đây. Hai đường `intent` và `speak` cũng có trong `may-chu-gia.py`. Bản chạy trên trình duyệt dùng `/api/roleplay/start|turn|finish`.

| Việc | Lời gọi | App gửi | App đọc | Chờ tối đa |
|---|---|---|---|---|
| Hiểu ý một lượt của người học | `POST /api/roleplay/intent` | `{"scene", "text", "lastLine", "scored"}` | `ideas[]`, `intent`, `wantsStop`, `offScript` | 6 giây |
| Đọc một câu của nhân vật | `POST /api/roleplay/speak` | `{"text", "character"}` | `audio` (PCM16 một kênh, base64), `sampleRate`, `seconds` | 25 giây |
| Chấm, đáp và dựng khẩu hình cho một lượt trực tiếp | `POST /api/roleplay/live` | `{"scene", "history", "scored"}` | `id`, `chu`, `y`, `sai`, `het`, `pcm`, `tanSo`, `giay`, `mouth`, `timings` | 25 giây |

- **intent.** `scene` là mã cảnh (`lan-2`, `minh-1`, `minh-3`, `tu-9`); hiện chỉ `lan-2` có bộ ý định, cảnh khác trả 422. `text` đã thay mọi dãy số riêng tư. `lastLine` là mã câu nhân vật vừa nói, `scored` là các ý đã chấm. `ideas` là các ý chấm được trong `nap`, `dauhieu`, `xacminh`, `baocao`; `intent` là một mã trong `prototype/loi-chi-lan.json` hoặc `null`. Máy chủ chỉ phân loại, không viết lời cho nhân vật và không lưu lời người học.
- **speak.** `character` là mã nhân vật trong `prototype/nhan-vat.json` (`lan`, `minh`, `tu`); mã lạ thì máy chủ không đọc bằng giọng khác mà trả lỗi. Tiếng phải đã cắt cụm nhiễu đuôi và lọc rẹt (`doc_giong.py`). Hỏng hai lần thì app không phát bản lọc nhẹ mà dùng câu thu sẵn.
- **live.** `history` chứa tối đa 14 mục `{"ai", "chu"}`, mục cuối là lời người học. `scored` là các ý đã chấm. `id` gồm 16 ký tự hex. `pcm` là PCM16 một kênh dạng base64, `tanSo` tính bằng Hz và `giay` là độ dài âm thanh. `mouth` chứa `lip` (JSON khẩu hình 30 fps, với `mieng.tep` trỏ tới `<id>.mieng.mp4`) và `mp4` (H.264 dạng base64), hoặc `null` nếu thiếu bộ dựng. `timings` chứa `llm_ms`, `tts_ms`, `mouth_ms` và `total_ms`. Cảnh không hợp lệ trả 422, lỗi tạo lượt trả 503.
- **Phát lượt live.** App lưu WAV và, nếu có khẩu hình dựng sẵn, lưu lip JSON và MP4 dưới `cacheDir/song`. Cầu nối chỉ thêm `song: "<id>"` khi đã ghi đủ khẩu hình. WebView phát qua `/__song/<id>.wav`, `/__song/<id>.lip.json` và `/__song/<id>.mieng.mp4`. Kết quả không có `song` vẫn phát PCM và tính khẩu hình trên máy.
- **Token.** Nếu máy chủ đặt `LCS_TOKEN`, cả ba đường yêu cầu header `X-LCS-Token`. Android lấy giá trị từ thuộc tính Gradle `LCS_TOKEN`, mặc định rỗng.
- **Nhật ký thời gian.** `GoiVideo` có các mốc `[timing]` cho kết quả người học, gửi yêu cầu qua cầu nối, tiếng đệm kết thúc, kết quả cầu nối (kể cả hết hạn) và bắt đầu đường phát. `LcsTiming` ghi thời gian OpenAI và thời gian, mô hình, mã HTTP của từng lần thử Gemini TTS; lượt máy chủ ghi thời gian và độ lớn phản hồi theo byte.
- Lỗi trả mã HTTP khác 2xx kèm `{"detail": "…"}` như các đường khác.
