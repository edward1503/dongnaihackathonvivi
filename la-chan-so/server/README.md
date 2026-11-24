# Máy chủ Lá chắn số (Mảng 2)

FastAPI. Làm S1 đến S6 trong [`../KE-HOACH-MANG-2-3.md`](../KE-HOACH-MANG-2-3.md). Dữ liệu là dữ liệu giả lập, khớp số trên các màn W01, W02, A07.

## Chạy

```bash
cd la-chan-so/server
pip install -r requirements.txt
uvicorn lcs.main:app --host 0.0.0.0 --port 8000     # điện thoại trong cùng mạng gọi http://<ip-máy>:8000
python -m pytest -q                                 # 34 bài kiểm thử theo bảng mục 6 của kế hoạch
```

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

## API cho từng người

Kết quả phân tích luôn có dạng `AnalysisResult` (mục 2.1 của kế hoạch). `level` gồm `danger`, `suspicious`, `safe`, `unknown`. Chỉ danh bạ trắng mới cho `safe`.

**Hoàng (Android):**
- `GET /api/lookup/phone/{số}`: tra số lúc đổ chuông (N1). Không gọi AI.
- `POST /api/analyze/call`, dạng multipart, gồm `audio` (tệp ghi âm) hoặc `transcript` (chữ), kèm `phone` và `unknownNumber`. Dùng cho N2, màn A04b. Máy chủ không lưu tệp ghi âm. Gemini nhận mp3, wav, aac, ogg, flac.
- `POST /api/alerts` `{level, scamType, phone, summary, asksMoney, timeline}`: báo Minh. Phát `alert.created`.
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
