# Máy chủ Lá chắn số (Mảng 2)

FastAPI. Làm S1 đến S6 trong [`../KE-HOACH-MANG-2-3.md`](../KE-HOACH-MANG-2-3.md). Dữ liệu là dữ liệu giả lập, khớp số trên các màn W01, W02, A07.

## Chạy

```bash
cd la-chan-so/server
pip install -r requirements.txt
python chay-demo.py                                 # HTTP 8000 + HTTPS 8443 chung một dữ liệu, in mã QR (xem ../HUONG-DAN-CHAY-DEMO.md)
uvicorn lcs.main:app --host 0.0.0.0 --port 8000     # hoặc chỉ HTTP
python -m pytest -q                                 # 73 bài kiểm thử
```

Khóa AI: tạo tệp `server/.env`, hoặc dùng chung `la-chan-so/.env` của Mảng 4 (cả hai không đưa lên kho), có dòng `GEMINI_API_KEYS=khóa1,khóa2`, tùy chọn `OPENAI_API_KEY=…`. Không có khóa thì mọi thứ vẫn chạy bằng bộ luật và kịch bản dự phòng.

Điện thoại cần HTTPS để dùng micro và chạy avatar nhiều luồng: `chay-demo.py` tự tạo chứng chỉ tự ký cho IP LAN (ở `server/.chung-chi/`, không đưa lên kho).

Một địa chỉ cho cả demo:

| Địa chỉ | Gì |
|---|---|
| `/` | App React của bà Hoa, Vy. Thêm `?demo=1` để có bảng mô phỏng cuộc gọi bên trái |
| `/zalo`, `/web` | Trang của Mảng 5, 6 (khi `mvp/` đã gộp vào): chạy thẳng trên máy chủ này, không cần `mvp/server.mjs` |
| `/prototype/video-call.html` | Gọi video khuyên chị Lan, AI thật (có tiêu đề COOP/COEP cho avatar) |

Nếu đã build app (`cd ../app && npm run build`), máy chủ phục vụ luôn app ở `/`. Cả demo chỉ cần một địa chỉ.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `GEMINI_API_KEYS` | (trống) | Khóa Gemini, nhiều khóa cách nhau dấu phẩy. Trống thì dùng bộ luật dự phòng, demo vẫn chạy |
| `GEMINI_MODELS` | `gemini-3.5-flash,gemini-2.5-flash` | Thử lần lượt |
| `LCS_AI_TIMEOUT` | `6` | Giây chờ AI, quá thì dùng dự phòng |
| `LCS_TODAY` | `2026-11-24` | Ngày của kịch bản demo (khớp thiết kế). `real` để dùng ngày thật |
| `LCS_DB` | `:memory:` | SQLite; mặc định nạp lại dữ liệu mẫu mỗi lần chạy |
| `LCS_DEMO_FALLBACK` | `1` | Không chép lời được thì trả bản chép lời mẫu của màn A04b |
| `LCS_CORS` | `*` | Nguồn được phép gọi |
| `LCS_STATIC` | `../app/dist` | Thư mục app đã build |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | (trống), `gpt-6-luna` | Hiểu ý người học trong gọi video (như máy chủ giả của Mảng 4). Trống thì dùng Gemini |
| `GEMINI_TTS_MODELS` | `gemini-3.8-flash-tts,…` | Model đọc giọng nhân vật |
| `LCS_PUBLIC_URL`, `LCS_HTTP_URL` | do `chay-demo.py` đặt | Địa chỉ cho điện thoại trong mã QR |

## API cho từng người

Kết quả phân tích luôn có dạng `AnalysisResult` (mục 2.1 của kế hoạch). `level` gồm `danger`, `suspicious`, `safe`, `unknown`. Chỉ danh bạ trắng mới cho `safe`.

**Hoàng (Android):**
- `GET /api/lookup/phone/{số}`: tra số lúc đổ chuông (N1). Không gọi AI.
- `POST /api/analyze/call`, dạng multipart, gồm `audio` (tệp ghi âm) hoặc `transcript` (chữ), kèm `phone` và `unknownNumber`. Dùng cho N2, màn A04b. Máy chủ không lưu tệp ghi âm. Gemini nhận mp3, wav, aac, ogg, flac.
- `POST /api/alerts` `{level, scamType, phone, summary, asksMoney, timeline, eventId}`: báo Minh. Phát `alert.created`. Gửi lại cùng `eventId` thì trả cảnh báo cũ, không báo trùng.
- Nhận tệp ghi âm `m4a`, `amr`, `3gp`, `webm`: máy chủ đổi sang FLAC bằng ffmpeg trước khi gửi Gemini (tệp tạm xóa ngay).
- Nhật ký truy cập che số trong `/api/lookup/phone/…`.
- Kết quả phân tích có thêm `lesson`: mã bài học Mảng 4 (`hoc.html?kieu=…`) theo kiểu lừa đảo; `GET /api/scam-types` trả bảng đầy đủ.
- `POST /api/roleplay/intent` `{scene, text, lastLine, scored}` → `{ideas, intent, wantsStop, offScript}` và `POST /api/roleplay/speak` `{text, character}` → `{text, audio, sampleRate, seconds}`: đúng hợp đồng `android/HOP-DONG-DU-LIEU.md`, chuyển từ `may-chu-gia.py` sang (cùng lời nhắc `prototype/hieu-y-loi-nhac.txt`, cùng cách lọc rẹt). Chỉ cảnh `lan-2` có bộ ý định; cảnh khác trả 422; không có khóa trả 503 để app dùng luật trên máy.
- `POST /api/events` `{type:"alert.timeline", room:"gia-dinh-hoa", data:{time, text}}`: thêm diễn biến (N3, N5).

**Đức (Zalo, web):**
- `WS /ws?room=gia-dinh-hoa&who=minh`: nhận `alert.created`, `alert.timeline`, `ask.sent`. Mất WebSocket thì gọi `GET /api/events?room=…&since=<id cuối>` mỗi 2 giây.
- `POST /api/asks/{askId}/seen`: Minh đã xem.
- `POST /api/asks/{askId}/reply` `{preset:"dung_chuyen"|"nguoi_quen", text?}`: trả lời một chạm (Z2). Máy bà Hoa hiện to và đọc thành tiếng.
- `POST /api/reports`: báo số cho cộng đồng (Z3).
- `GET /api/stats`: số liệu màn W01.
- `GET /api/reports?status=needs_review`: danh sách màn W02. `PATCH /api/reports/{id}` `{status:"confirmed"|"rejected"}` để duyệt; `POST /api/reports/{id}/appeal` để khiếu nại.
- Phòng `tnv-tran-bien`: nhận `report.created`, `report.updated`.

**Tún (app React):**
- `POST /api/check` `{value, kind?}`: kiểm tra nhanh. `kind` là `phone`, `link`, `account` hoặc `message`.
- `POST /api/analyze/message`: phân tích tin nhắn.
- `POST /api/asks`: bà Hoa hỏi người thân.

**Gọi video chị Lan (Hoàng, Mảng 4):**
- `POST /api/roleplay/start`: câu mở đầu của chị Lan và 4 ý cần đạt.
- `POST /api/roleplay/turn` `{sessionId, text}` hoặc multipart `{sessionId, audio}`: chấm 4 ý; chị Lan đáp đúng vai, gợi về ý còn thiếu; `line.audio` là tệp thu sẵn hoặc giọng Gemini (data URL).
- `POST /api/roleplay/finish`: điểm và câu tổng kết cho màn A11i.
- Người học đọc ra dãy số dài thì dừng vai ngay (an toàn, theo KICH-BAN-THOAI.md).

**Lớp tương thích cho Mảng 5, 6** (`lcs/compat.py`): đủ các đường dẫn của `mvp/HOP-DONG-DU-LIEU.md` (SSE `/api/events`, `/api/alerts/:id/reply|call`, `/api/reports/:id/decision`, `/api/lookup?v=`, `/api/broadcasts`, `/api/reset`). Câu hỏi của bà Hoa hiện ở trang Zalo như một cảnh báo; Minh trả lời ở đó thì máy bà Hoa nhận ngay (A08c).

**Buổi trình diễn:** `GET /api/demo/links` (địa chỉ LAN cho điện thoại), `GET /api/demo/qr.svg?path=/…` (mã QR), sự kiện `demo.go` `{path, mode, layers}` để laptop đổi màn trên điện thoại. Lệnh `demo.go`, `demo.reset` chỉ sống 15 giây trong lịch sử, và sự kiện phát lại lúc máy vừa mở trang mang `replay: true`, nên điện thoại mở lại trang không làm lại lệnh cũ.

**Cả đội:** gọi `POST /api/demo/reset` trước mỗi lần diễn. Lệnh này đưa dữ liệu về đầu kịch bản và báo mọi máy đang mở bằng sự kiện `demo.reset`.

## Thật hay mô phỏng

- **Làm thật:**
  - Thứ tự quyết định 4 mức.
  - Che số trước khi gửi AI.
  - Không gửi AI tin có mã OTP.
  - Gọi Gemini có kiểm lại JSON trả về.
  - Đồng bộ ba máy.
  - Báo cáo và kiểm duyệt, nhãn tự hết hạn sau 90 ngày.
- **Mô phỏng:**
  - Tuổi tên miền dùng bảng mẫu trong `data.py`; triển khai thật thì tra WHOIS.
  - Phễu bảo vệ trên W01 là số mẫu; triển khai thật thì Android gửi lên.
  - 120 báo cáo nạp sẵn là dữ liệu giả lập.
