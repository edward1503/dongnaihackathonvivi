# Hợp đồng dữ liệu giữa app Android và máy chủ

App Android dùng **hợp đồng chung của đội**: máy chủ FastAPI ở [`../server/`](../server/README.md) (mảng 2), đường dẫn và tên trường bằng tiếng Anh, kết quả phân tích luôn có dạng `AnalysisResult` ([`../KE-HOACH-MANG-2-3.md`](../KE-HOACH-MANG-2-3.md) mục 2).

Trong app, tệp [`Api.kt`](app/src/main/java/vn/doi18/lachanso/Api.kt) là chỗ duy nhất biết tên trên đường truyền; phần còn lại dùng kiểu dữ liệu riêng (`Muc`, `KetQuaSo`, `KetQuaAI`). Đổi hợp đồng thì sửa `Api.kt`, `ApiTest.kt` và `may-chu-gia.py`.

Quy ước của phía app:

- Địa chỉ gốc nhập trong app, ô "Máy chủ của đội". Để trống thì app chỉ dùng dữ liệu trên máy.
- Mọi lời gọi đều có đường dự phòng: lỗi mạng, quá giờ hay trả lời thiếu `level` thì app tự xử lý trên máy và không báo sai là đã gửi.
- Số điện thoại gửi đi đã chuẩn hóa (chỉ chữ số, đầu `0`) và chỉ gửi ở ba chỗ cần: tra số, báo người thân, đối tượng của một báo cáo.
- Trước khi gửi nội dung tin nhắn hay lời kể, app thay mọi dãy từ 4 chữ số bằng `•••`. Tin có mã xác thực không bao giờ rời máy.
- **Kết quả của máy chủ không được làm nhẹ đi cảnh báo app đã tự thấy trên máy.** Bộ lọc trên máy báo nghi ngờ mà AI trả `unknown` thì app giữ kết quả trên máy.

## Đổi mức

| `level` của máy chủ | Mức trong app |
|---|---|
| `danger` | Nguy hiểm |
| `suspicious` | Nghi ngờ |
| `safe` | An toàn (máy chủ chỉ trả khi khớp danh bạ tổng đài) |
| `unknown`, thiếu, giá trị lạ | Chưa có dữ liệu. App không bao giờ suy ra "an toàn" |

## Các lời gọi

| Việc | Lời gọi | App gửi | App đọc | Chờ tối đa |
|---|---|---|---|---|
| Tra số lúc đổ chuông (N1) | `GET /api/lookup/phone/{số}` | số trong đường dẫn | `level`, `scamLabel`, `reports.count`, `reports.lastWhen` | 1,5 giây |
| Phân tích tin nhắn (N4) | `POST /api/analyze/message` | `{"text"}` đã che số | `level`, `scamLabel`, `scamType`, `todo[]`, `headline`, `signs[].text` | 8 giây |
| Phân tích bản ghi âm (N2) | `POST /api/analyze/call`, multipart | `audio` (tệp gốc, gửi kiểu chunked), `unknownNumber`; **không gửi số** | như trên, thêm `why[]`, `maskedText` (mỗi dòng "Người nói: lời"), `source` | 60 giây |
| Phân tích lời kể lại | `POST /api/analyze/call`, multipart | `transcript` đã che số | `level`, `scamLabel`, `todo[]`, `signs[].text` | 8 giây |
| Báo người thân (N3) | `POST /api/alerts` | `{"room", "from": "android", "level", "phone", "callSeconds", "summary"}` | `id` | 4 giây |
| Báo cáo cho cộng đồng | `POST /api/reports` | `{"kind": "message", "target", "story"}` | `report.id` | 8 giây |

Ghi chú từng dòng:

- **Tra số.** `scamLabel` nối sau câu "14 người đã báo số này …" nên app đổi chữ đầu thành chữ thường. Máy chủ trả `unknown` mà máy đang có nhãn nhẹ của cộng đồng cho số đó (màn A03b, ví dụ "giao hàng") thì app hiện nhãn nhẹ.
- **Bản ghi âm.** Máy chủ ở chế độ trình diễn (`LCS_DEMO_FALLBACK=1`) trả một bản chép lời mẫu khi không chép lời được, kèm `source: "fallback"`. Với cuộc gọi thật thì kết quả đó là giả, nên app bỏ, coi như chưa phân tích được và chuyển sang hỏi một câu. `why[]` chỉ dùng cho bản ghi âm.
- **Báo người thân.** Chỉ khi máy chủ trả về cảnh báo có `id` app mới hiện và đọc "Đã báo cho Minh". Lời báo từ nút giả lập có `summary` bắt đầu bằng `[Thử]`. `summary` đã che mọi dãy từ 4 chữ số. `room` đang là phòng mẫu `gia-dinh-hoa`.
- **Báo cáo.** `target` là số gửi tin; không có thì đường dẫn đầu tiên trong tin; không có nữa thì tên người gửi. `story` là nội dung tin đã che số. Kiểu lừa đảo do máy chủ tự phân loại lại.

## Còn thiếu, cần chốt với mảng 2

- **Chống gửi trùng cảnh báo.** `POST /api/alerts` chưa nhận mã sự kiện, nên gửi hai lần là người thân nhận hai cảnh báo. App đang tự nhớ cuộc gọi nào đã báo trong lúc còn chạy.
- **Ghép đôi.** Chưa có mã ghép giữa máy bà và máy người thân, mọi máy dùng chung phòng mẫu.
- **Chiều ngược lại.** App Android chưa nghe sự kiện (`/ws`, `GET /api/events`), nên lời nhắn của Minh chưa hiện trên lớp gốc; phần này đang nằm ở app React (màn A08c).
- **Số trong đường dẫn tra số.** Máy chủ không được ghi số người gọi vào nhật ký truy cập.
- **Định dạng bản ghi.** Máy ghi âm của điện thoại có thể ra `m4a` hoặc `amr`; máy chủ ghi là nhận mp3, wav, aac, ogg, flac.
- **Mã kiểu lừa đảo.** Máy chủ có 7 mã gạch dưới (`gia_danh_cong_an`…), bài học có 10 mã gạch ngang (`gia-danh-co-quan`…). Trang bài học nhận cả hai qua bảng bí danh; nên chốt một danh sách.

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
