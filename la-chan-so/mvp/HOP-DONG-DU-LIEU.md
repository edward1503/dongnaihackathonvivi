# MVP mảng 5 (Zalo người thân) và mảng 6 (web đội tình nguyện)

Bản chạy thật, dữ liệu giả lập. Chạy trên máy chủ FastAPI của mảng 2; hoặc bản dự phòng Node 18 trở lên, không cần cài gói.

```bash
cd server && pip install -r requirements.txt && uvicorn lcs.main:app --port 8000
# http://127.0.0.1:8000/zalo   phía Minh (Z01a, Z01b, Z01c, báo số Z3)
# http://127.0.0.1:8000/web    web đội tình nguyện (W01, W02, W03)
# Không có Python: node mvp/server.mjs 8020 (bản dự phòng, chạy từ thư mục la-chan-so)
```

Mở hai trang cạnh nhau. Ở `/zalo`, nút "Bà Hoa: cuộc gọi nguy hiểm" mô phỏng máy bà Hoa gửi cảnh báo lên (sau này mảng Android gọi `POST /api/alerts` thay nút này).

## Phạm vi

| Mã | Làm gì | Ở đâu |
|---|---|---|
| Z1 | Minh nhận cảnh báo trong luồng tin OA (mô phỏng), chỉ thấy mức cảnh báo và tóm tắt đã che | `zalo.html` |
| Z2 | Chi tiết, trả lời một chạm ("Mẹ đừng chuyển", "người quen"), gọi mẹ | `zalo.html` |
| Z3 | Báo số, đường dẫn cho cộng đồng; có đồng ý trước khi gửi | `zalo.html` |
| W1 | Thống kê tháng, cộng dồn theo báo cáo mới; xuất CSV | `web.html` |
| W2 | AI phân loại trước, ca chưa chắc mới tới người duyệt; quyết định; kênh khiếu nại | `web.html` |
| W3 | Soạn cảnh báo, gửi tới nhóm (tới Zalo người thân đã ghép), truyện 1 phút | `web.html` |

**Máy chủ chính là `server/` (FastAPI, mảng 2)**: nó phục vụ luôn `/zalo` và `/web` và có thêm AI, SQLite, WebSocket. `mvp/server.mjs` chỉ còn là bản dự phòng không cần Python; hai trang tự nhận biết máy chủ nào đang chạy (khiếu nại chỉ có thật trên FastAPI). "AI phân loại trước" trên FastAPI dùng Gemini nếu có khóa trong `server/.env`, không có thì dùng bộ luật dự phòng; bản Node chỉ có quy tắc từ khóa (`classify` trong `server.mjs`).

## Hợp đồng API

Đồng bộ thời gian thực: `GET /api/events` (SSE) với các sự kiện `alert`, `reply`, `call`, `report`, `broadcast`, `reset`.

**Cảnh báo** (`alert`):
```json
{ "id": "al_x", "level": "danger|warn", "at": "ISO", "who": "Mẹ Hoa", "number": "0912 345 678",
  "scenario": "Giả danh công an", "askedTransfer": true, "summary": "đã che số dài",
  "timeline": [{ "t": "10:38", "text": "...", "tone": "danger|warn|safe|" }],
  "reply": { "by": "Minh", "text": "...", "choice": "dung-chuyen|nguoi-quen", "at": "ISO" } }
```
- `GET /api/alerts`, `POST /api/alerts` (máy bà Hoa gửi lên)
- `POST /api/alerts/:id/reply` `{ choice, text? }` (Minh trả lời; máy bà Hoa nghe sự kiện `reply` để hiện chữ to và đọc)
- `POST /api/alerts/:id/call`
- FastAPI thêm: `POST /api/reports/:id/appeal` (người dân khiếu nại báo oan), `GET /api/reports?status=appealed`, `POST /api/reports/:id/appeal/resolve` `{ outcome: "remove|keep" }` (gỡ hoặc giữ nhãn)

**Báo cáo** (`report`):
```json
{ "id": "rp_x", "value": "0911 222 333", "kind": "phone|link|account|other", "note": "đã che",
  "aiGuess": "Giả danh công an", "confidence": 71, "count": 1, "area": "Khu phố 4",
  "status": "pending|confirmed|spam|rejected|labeled|forwarded", "auto": false, "consent": true }
```
- `POST /api/reports` `{ value, note?, source?, consent? }`: trùng đối tượng đang chờ thì cộng số người báo; AI tin cậy từ 80% trở lên thì tự xác nhận.
- `POST /api/reports/:id/decision` `{ decision: "confirmed|spam|rejected|label|police" }`: xác nhận hoặc gắn nhãn thì nhãn tự hết hạn sau 90 ngày.
- `GET /api/lookup?v=` trả `{ level: "danger|unknown", kind, until }`. Chỉ trả `danger` khi có nhãn còn hạn; không bao giờ trả "an toàn" (xem quy ước chung: chỉ danh bạ đã xác thực mới là "An toàn").

**Thống kê và tuyên truyền**: `GET /api/stats`, `GET|POST /api/broadcasts` (`{ title, body, to: [...] }`), `POST /api/reset` (đặt lại dữ liệu demo).

## Chưa làm, ghi rõ
- Zalo OA, Mini App thật: bản này là trang web mô phỏng; đồng bộ qua máy chủ của đội.
- Không có đăng nhập; mọi thứ nằm trong bộ nhớ.
- Kiểm duyệt: "Chuyển Công an phường" chỉ đánh dấu, chưa kết nối kênh nào (đúng phần "tầm nhìn").
- Hai trang viết bằng HTML thuần dùng `ds.css`, chưa tách thành phần React chung (việc chốt cùng mảng 3).
