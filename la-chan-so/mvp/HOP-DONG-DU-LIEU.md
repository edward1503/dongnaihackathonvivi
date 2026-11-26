# Zalo gia đình và web đội Trấn Biên

Chạy `LCS_DEMO=1 python chay-demo.py` trong `server/`. Mở `/zalo` cho Minh và `/web` cho đội. Lệnh cũ `node mvp/server.mjs 8020` cũng khởi động FastAPI, dùng Python trên PATH hoặc biến `PYTHON`. Cài `server/requirements.txt` trước khi chạy.

## Máy nhận và biên nhận

`POST /api/devices` trả `deviceId` (16 ký tự hex) và `deviceSecret`. Android giữ cả hai qua lần mở lại. Gửi `X-LCS-Device` khi phân tích bản ghi để báo, tạo cảnh báo, báo cáo, rút báo cáo, khiếu nại và đăng nhập đội.

Biên nhận là chữ ký HMAC-SHA256 dạng hex thường. Khóa là **chuỗi UTF-8** của secret được cấp. Các trường cách nhau bằng một dấu gạch đứng, giữ nguyên chuỗi giờ ISO có múi giờ và dấu gạch cuối khi thiếu thời lượng.

```text
eventId|deviceId|type|incoming|targetKey|at|durationSec
```

- `targetKey` dùng `text.target_key`. Số điện thoại bỏ dấu cách và chuẩn hóa đầu số, tài khoản giữ chữ số, đường dẫn dùng tên miền, riêng dịch vụ rút gọn giữ cả đường dẫn.
- `POST /api/analyze/call` nhận multipart. Để gắn kết quả với sự kiện, gửi `audio, eventId, type=call_log, direction=incoming, at, durationSec?, targetKey, receipt`. Ở bước này `targetKey` là SHA-256 hex thường của khóa chuẩn hóa, ký trên giá trị băm đó. Khi gửi báo cáo, ký lại với khóa chuẩn hóa. Hai biên nhận phải khớp sự kiện, máy và thời điểm.
- Kết quả bản ghi đủ điều kiện trả `analysisId=id, aiLevel, aiScamType, aiConfidence, summary`. Các trường `ai*` mô tả nội dung bản ghi. Khi gửi số để tra cùng cuộc gọi, `communityLevel` là mức của số hiển thị. Lời kể qua `transcript`, tệp thiếu hoặc kết quả dự phòng chỉ phục vụ nhắc an toàn.
- `POST /api/reports` nhận JSON dưới đây. `receipt` là chữ ký hex. `direction` đã nằm trong chữ ký. `kind` nhận call/phone, message, link hoặc account. Android chỉ ký sự kiện thật. Biên nhận SMS dùng `sms_received` và chỉ gắn một đối tượng đã đối chiếu cho sự kiện. Ảnh chụp để vòng sau.

```json
{
  "kind": "call",
  "target": "0977 000 111",
  "relation": "self",
  "eventId": "ma-su-kien",
  "receipt": "<chữ ký>",
  "evidence": {
    "type": "call_log",
    "at": "2026-11-25T03:10:00Z",
    "durationSec": 40,
    "recording": {"analysisId": "<id>", "aiLevel": "danger", "aiScamType": "khac", "aiConfidence": 0.9}
  }
}
```

Bỏ `recording` khi thiếu bản ghi. Có thể gửi `story, area, group, lostMoney`. Gửi lại cùng sự kiện trả cùng `report.id`. Máy thứ sáu báo cùng số vẫn gửi được, còn **đối tượng mới thứ sáu trên cùng máy trong 24 giờ trượt** trả 429. Máy chủ trả `{report, case, message, points, totalPoints}`.

Để bổ sung lựa chọn của bà, gửi lại cùng biên nhận với `selfAnswer=yes|no|known` và `selfAnswerSignature=HMAC(eventId|selfAnswer)`. Nếu gửi thêm `validation.by=self`, `result` phải khớp kết luận của máy chủ. Máy chủ lấy giờ nhận. Trả lời sau 24 giờ nằm trong `lateAnswers`. Rút bằng `POST /api/reports/{id}/withdraw {at, signature}`, ký `withdraw|reportId|deviceId|at` trên cùng máy.

## Minh trên Zalo

Trang `/zalo` cấp cookie HttpOnly của phòng demo đã ghép `gia-dinh-hoa`. Mở lại trang sau khi khởi động lại máy chủ. Đăng nhập Zalo OA và ghép đôi thật để vòng sau.

- `POST /api/alerts` với `eventId, reportId, analysisId, summary` từ máy đã báo. Máy chủ lấy nhãn, số và tóm tắt từ bằng chứng đã lưu. Gửi lại trả cùng cảnh báo. Cảnh báo thường và câu hỏi gia đình vẫn dùng các đường cũ.
- `GET /api/alerts` và SSE `GET /api/events` dùng cookie của Minh. Có các sự kiện `alert, reply, call, community, broadcast, reset`. Android vẫn nhận `ask.reply` qua phòng gia đình.
- `POST /api/alerts/{id}/reply {choice}` nhận `dung-chuyen` hoặc `nguoi-quen`. Máy chủ lưu lời đáp và tính lại báo cáo ngay cả khi máy bà tắt. Nếu Android gửi lại `validation.by=relative`, phải có `alertId, result, at` khớp lời đáp đã lưu. `POST /api/alerts/{id}/call` giữ thao tác gọi mẹ.

## Đội và hồ sơ

`POST /api/team/login {code}` trả `{token, member:{id,name,role,ward}}`. Gửi `X-LCS-Team: <token>` khi đọc dữ liệu nội bộ hoặc tác nghiệp. Mã trình diễn gồm Khoa **246810**, Lan Anh **135790**, trưởng đội Hùng **999111**. Thiếu hoặc sai phiên trả 401, sai quyền trả 403. Phản hồi lỗi có trường `detail`.

| Đường | Dữ liệu và quyền |
|---|---|
| GET /api/cases?status=open&limit=100 | Đội nhận `{items}`. Mỗi đợt có `key, reviewId, reportIds, reports, flags, votes, myVote, canVote, reasonCannotVote`. `reportedCount` đếm máy đã báo trong cửa sổ. `count` đếm máy góp vào mức hiện tại. Dùng `status=decided` để xem đợt đã xử lý. |
| POST /api/cases/{key}/vote | `{reviewId,decision,note?}` với confirm/reject/spam. Mã hóa URL của key. Ghi lý do khi có conflict. Phiếu theo danh sách và phiên bản bằng chứng lúc mở đợt. |
| GET /api/reports và GET /api/reports/{id} | Đội xem báo cáo đã che. Danh sách trả `{total,items}`, nhận `status,limit,offset`. |
| PATCH /api/reports/{id} và POST /api/reports/{id}/decision | Đường cũ quy về cùng phiếu, nhận `status` hoặc `decision`, cùng `reviewId?, note?`. |
| POST /api/appeals | Máy của người khiếu nại gửi `{target,kind:"phone",contact,text?}`. Trả `id,status=pending_verification`; khi bật demo có thêm `demoCode`. Số cần xác minh là số bị báo. |
| POST /api/appeals/{id}/verify | Gửi `{code}` từ cùng máy. Mã thử **246810** khi `LCS_DEMO=1`. Khiếu nại đã xác minh giới hạn đỏ xuống vàng. Chưa tích hợp gửi SMS thật. |
| GET /api/appeals và POST /api/appeals/{id}/resolve | Trưởng đội xem `{items}` hoặc gửi `{outcome:"remove" hoặc "keep",note?}`. Gỡ loại các báo cáo của hồ sơ, giữ bỏ mức trần. Các đường `/api/reports/{id}/appeal[/verify hoặc /resolve]` dùng cùng quy trình. |
| POST /api/broadcasts | Trưởng đội gửi `{title,body,to}`. Minh nhận được thông báo nếu chọn người thân đã ghép. |

## Tra cứu và thống kê

`POST /api/check`, `GET /api/lookup/phone/{p}`, `GET /api/lookup?v=`, kết quả sau cuộc gọi và thống kê dùng cùng phép tính 90 ngày theo thời điểm **nhận sự kiện**. Danh bạ chính thức ưu tiên đầu tiên. Mỗi máy lấy trọng số cao nhất. W1 tính 5 ngay, W2 tính 2 và W3 tính 1 sau phiếu. Tổng có một phiếu đạt 5 lên vàng, tổng có hai phiếu đạt 10 lên đỏ. W1 vào cả hai tổng. Dấu hiệu kỹ thuật đường dẫn có thể cho vàng với 0 máy. Hai phiếu bác/báo rác gộp lại loại bằng chứng của đợt. Tra cứu trả thêm `appealOpen, canAppeal`.

`GET /api/stats` giữ tên trường của màn W01/W02. `aiConfirmed` là số báo cáo góp vào mức cộng đồng, `aiRejected` đếm báo cáo bị đội bác. Mẫu có 120 báo cáo, 78 góp vào nhãn, 18 bị bác, 24 đang chờ và 2 khiếu nại đã xác minh. Mỗi cặp máy–hồ sơ được 10 điểm đúng một lần khi bằng chứng góp vào mức vàng hoặc đỏ. `POST /api/reset` và `/api/demo/reset` nạp lại mẫu khi bật demo, máy đã đăng ký vẫn dùng được.

Khi nâng cấp SQLite vòng 1, đội vẫn xem được báo cáo thật cũ dưới trạng thái `legacy_unverified`. Hồ sơ thiếu biên nhận góp 0 điểm. Dữ liệu mẫu vòng 1 được thay bằng mẫu vòng 2.
