# Vai, tính năng và kiểm duyệt báo cáo (vòng 2, 25/11/2026)

## 1. Nguyên tắc

- **Chỉ người trực tiếp nhận cuộc gọi hoặc tin nhắn được báo**, từ chính máy Android đã nhận. Android đối chiếu nhật ký cuộc gọi đến hoặc thông báo tin nhắn. Tra cứu, nhận cảnh báo gia đình và báo cáo cộng đồng là ba thao tác riêng.
- **Máy nhận gửi báo cáo, người thân có thể xác nhận nội dung.** Một bản ghi do máy chủ phân tích và được bà hoặc người thân đã ghép đôi xác nhận đúng nhãn rủi ro được tính ngay. Mỗi máy chỉ đóng góp một lần cho cùng đối tượng.
- **Chỉ thành viên có tài khoản do đội cấp mới được duyệt.** Xác nhận một cuộc gọi gia đình không cấp quyền duyệt hồ sơ cộng đồng. Trưởng đội quyết định khiếu nại và phát cảnh báo khu phố.
- Cảnh báo mô tả điều người nhận gặp trong cuộc gọi **hiển thị số này**. Số hiển thị có thể bị giả mạo. Chủ số có quyền yêu cầu xem lại, mọi bằng chứng dùng để đổi mức đều có hạn.

## 2. Tính năng theo vai

| Vai | Thao tác |
|---|---|
| **Người lớn tuổi (bà Hoa)** | Bấm “Báo cuộc vừa nhận” trên thẻ cảnh báo cuộc gọi của Android hoặc ở màn Bé Nai sau cuộc gọi. Nếu bấm lúc đổ chuông, máy giữ lựa chọn đến khi đối chiếu được nhật ký cuộc gọi đến. Bà có thể tra số bằng giọng hoặc bàn phím, hỏi con cháu, dùng màn Dừng lại khi mở ứng dụng ngân hàng, màn Khẩn cấp, bài học 1 và 3, gọi video cho Minh. |
| **Học sinh (Vy)** | Tra tin nhắn, đường dẫn, số hoặc tài khoản. Từ thông báo tin nhắn trên máy mình, Vy chọn báo người gửi hoặc đối tượng xuất hiện trong chính tin đó. Dùng `sms_received` hoặc kèm ảnh đã che theo quy tắc `screenshot` ở mục 3. Có bài học 2 và 4, gọi video với chị Lan, chú Tư và bài kiểm tra 5 câu. |
| **Người thân (Minh, vai "Người thân" trong app Lá chắn số)** | Chọn vai "Người thân" và nhập mã gia đình (`POST /api/family/pair`; bản demo ghép sẵn với máy bà Hoa). Nhận **thông báo Android** khi máy bà có cuộc gọi hoặc tin nhắn đáng ngờ, kể cả khi không mở app. Xem tóm tắt đã che, nhãn AI và câu bà trả lời Bé Nai, chọn “Đừng chuyển” hoặc “Người quen”, gọi mẹ ngay. Không báo cáo, không duyệt. Minh chỉ trả lời về cuộc gọi bà đã nhận. |
| **Đội tình nguyện (Khoa)** | Đăng nhập để xem thống kê phường, xét cụm nhiều máy thiếu bản ghi, ý kiến trái nhau, đợt báo dồn và bằng chứng liên quan khiếu nại. Web đội chỉ có tác vụ xét hồ sơ. **Trưởng đội** tiếp nhận nhận xét, quyết định giữ hoặc gỡ nhãn khi có khiếu nại và phát thông báo khu phố. |

APK dùng màn Android cho bảo vệ cuộc gọi, tin nhắn và dùng bài học hiện có. Khung React V3 có thể mở đúng màn Android. Web tra cứu và màn “Thử Lá chắn” không tạo bằng chứng đã nhận.

**Phần mảng 1 và 4 trong khung React (APK):**
- **Tab Bài học:** đầu trang là bài học truyện tranh cùng Bé Nai. Bài dành cho vai đang dùng xếp trước: ông bà thấy bài 1, 3; học sinh thấy bài 2, 4. Tiếp theo là "Gọi video luyện tập" với nhân vật AI hợp vai (bà Hoa: anh Minh `minh-1`, `minh-3`; Vy: chị Lan `lan-2`, chú Tư `tu-9`). Bài 1 phút và bài kiểm tra 5 câu của V3 để ở cuối, mục "Ôn nhanh".
- **Mục "Thử Lá chắn"** (Cá nhân, vai người lớn tuổi và học sinh): mở các màn Android thật để trình diễn, gồm thẻ đổ chuông, Bé Nai hỏi sau cuộc gọi, màn Dừng lại, tin nhắn lạ.
- **Đọc to:** giọng Bé Nai (Gemini), câu viết theo văn nói giống màn Android.
- **Màn cuộc gọi của V3** (A03, A04, A10, A05): APK không mở, chỉ dùng khi trình diễn trên trình duyệt.

## 3. Luật báo cáo và mức cảnh báo

### Bằng chứng thuộc về ai

| `evidence.type` | Điều kiện để nhận báo cáo |
|---|---|
| `call_log` | Android tìm được cuộc gọi **đến** trong nhật ký, khớp số hiển thị, thời điểm và thời lượng. Chỉ gắn bản ghi do máy tìm được cho chính cuộc gọi ấy. |
| `sms_received` | Android ghi nhận thông báo tin nhắn đến, khớp người gửi, giờ nhận và đối tượng được báo. |
| `screenshot` | Ảnh đã che gắn với sự kiện `sms_received` cùng máy. Android đối chiếu đối tượng được báo với thông báo gốc trước khi che. Ảnh rời hoặc ảnh do người khác chuyển tiếp không đủ bằng chứng. |

Máy chủ từ chối báo hộ, số nhập tay không có sự kiện nhận, cuộc gọi đi, số ẩn không xác định được đối tượng, báo từ trang web và bằng chứng mô phỏng. Mỗi máy được báo tối đa **5 đối tượng mới trong 24 giờ trượt**. Gửi lại cùng sự kiện chỉ cập nhật báo cáo cũ.

### Xác nhận cuộc gọi có bản ghi

1. Sau cuộc gọi đáng ngờ, `SauCuocGoi` dùng `GhiAm.timMoi` trong `CuocGoi.kt` để tìm đúng tệp. `HoiSauCuocGoiActivity` gửi âm thanh qua `Api.recordingResult` đến `/api/analyze/call`. Máy chủ chép lời, che dữ liệu riêng rồi phân tích nội dung. Tệp mơ hồ, phân tích lỗi, lời bà kể lại qua trường `transcript` và kết quả mẫu `source=fallback` đều đi theo nhánh thiếu bản ghi.
2. Khi bà chọn báo, Android gửi báo cáo gắn với cuộc gọi. Bé Nai hỏi **“Người vừa gọi có bảo bà chuyển tiền không ạ?”**, kể cả khi AI đã cảnh báo. Bà có thể bấm hoặc trả lời bằng giọng khi bật `hoiBangGiong`. Với báo cáo có bản ghi, máy tự gửi một cảnh báo kèm tóm tắt đã che đến Minh nếu đã ghép đôi. Nếu bà bỏ qua câu hỏi hoặc đã hết lượt hỏi trong ngày, Minh vẫn có thể xác nhận. Màn Dừng lại và lời nhắc an toàn cho bà có hiệu lực ngay trong lúc chờ.
3. Máy chủ đối chiếu từng câu trả lời với nhãn **nội dung bản ghi**, trước khi gộp dữ liệu tra số. Áp dụng các kết quả sau cho đúng cuộc gọi.

| AI và câu trả lời | Xử lý báo cáo |
|---|---|
| AI gắn `danger` hoặc `suspicious` cho yêu cầu chuyển tiền và bà chọn “Có”, hoặc Minh đọc tóm tắt có nhãn rủi ro rồi chọn “Đừng chuyển” (`dung-chuyen`) | `agree` → `validated`, tính W1 ngay. Một người xác nhận là đủ. Hai người cùng xác nhận vẫn chỉ tính máy bà. |
| AI gắn rủi ro chuyển tiền nhưng bà chọn “Không”, hoặc AI chưa thấy rủi ro mà bà chọn “Có” hay Minh chọn “Đừng chuyển” | `disagree` → `conflict`, rút điểm đang tính và chuyển đội xét. Nếu câu hỏi về chuyển tiền không kiểm chứng được dấu hiệu AI nêu, chờ Minh đối chiếu dấu hiệu trong tóm tắt. |
| Bà chọn “Tôi biết số này” hoặc Minh chọn “Người quen” (`nguoi-quen`) | Đóng báo cáo với 0 điểm ngay cả khi chỉ một người trả lời. Nếu người còn lại nói có rủi ro, chuyển sang `conflict` với 0 điểm để đội xét. |
| AI chưa thấy rủi ro và bà chọn “Không” | Ghi nhận đồng thuận với kết quả đó, đóng với 0 điểm. |

Thời hạn trả lời là **24 giờ từ khi máy chủ nhận báo cáo**. Khi chưa có câu trả lời quyết định, báo cáo ở `pending_validation`, 0 điểm. Hết hạn, bản ghi có nhãn rủi ro chuyển `unvalidated` (W2 chờ duyệt), các nhãn còn lại đóng với 0 điểm. Nếu bà đã xác nhận hợp lệ thì Minh im lặng không ảnh hưởng W1. Trả lời muộn chỉ là ghi chú để đội xem. Trong hạn, hai ý kiến trái nhau luôn tạm dừng điểm, bất kể thứ tự đến. Bà có thể rút báo cáo từ chính máy đã gửi bất cứ lúc nào.

### Một hàm chung cho mọi kênh

`target_level(key, now)` xét các sự kiện nhận của đối tượng đã chuẩn hóa trong **90 ngày** (`now - 90d < evidence.at <= now`). Gửi lại, sửa câu trả lời hoặc bỏ phiếu không gia hạn. Báo cáo đã rút, bị gỡ, bị bác hoặc đang mâu thuẫn đều góp 0. Áp dụng trọng số như sau.

| Nhóm | Điểm mỗi máy | Khi nào được tính |
|---|---:|---|
| W1 · Bản ghi có nhãn rủi ro và xác nhận khớp | 5 | Ngay khi máy chủ kiểm tra xong xác nhận. |
| W2 · Bản ghi rủi ro hết hạn chờ trả lời, hoặc bản ghi mâu thuẫn đã được đội kết luận có dấu hiệu lừa | 2 | Sau khi đội xem tóm tắt và xác nhận bằng phiếu. |
| W3 · Chỉ có nhật ký cuộc gọi đến, thông báo tin nhắn hoặc ảnh đối chiếu được | 1 | Sau khi đội xét cụm báo cáo cùng đối tượng. Bà chọn “Có” mà thiếu bản ghi vẫn thuộc W3. |

Phiếu áp dụng cho **danh sách báo cáo cụ thể** trong một đợt xét. Lưu danh sách đó khi mở đợt, báo mới không thừa hưởng phiếu cũ. Mở đợt khi có 5 máy W3 trong cửa sổ 90 ngày, khi có W2, mâu thuẫn, khiếu nại, hoặc khi có ít nhất 5 máy mới báo cùng đối tượng trong 10 phút (`burst`). Đội xem thời điểm, dấu hiệu đòi tiền/OTP và tính độc lập của các máy. Hai phiếu `reject` hoặc `spam` (tính gộp, khác thành viên) loại các báo cáo trong đợt, kể cả W1 bị phát hiện dàn dựng. Cờ `burst` mở kiểm tra ngay, tự nó không cộng điểm.

Tính hai tổng `S1`, `S2`. Với mỗi tổng, lấy **điểm cao nhất của từng máy** rồi cộng. W1 vào cả hai tổng ngay. W2/W3 chỉ vào `S1` khi đợt chứa báo cáo có ít nhất **1** phiếu `confirm`, vào `S2` khi có ít nhất **2** phiếu `confirm` khác thành viên. Phiếu xác nhận giải quyết mâu thuẫn mở lại báo cáo ở W2 sau khi người duyệt ghi lý do. Phiếu tự nó không thêm điểm hoặc thêm máy.

| Thứ tự | Điều kiện | Mức công khai |
|---|---|---|
| 1 | Khớp danh bạ chính thức | `safe` |
| 2 | `S2 >= 10` | `danger`; nếu có khiếu nại đã xác minh đang mở thì tạm trả `suspicious` |
| 3 | `S1 >= 5` hoặc đường dẫn có dấu hiệu kỹ thuật theo `checker.py` | `suspicious`, ghi rõ lý do kỹ thuật nếu dùng điều kiện đường dẫn |
| 4 | Còn lại | `unknown` (“Chưa rõ”) |

**Một máy W1 đủ vàng, hai máy W1 đủ đỏ.** Một cuộc gọi có thể hiển thị số giả hoặc được dàn dựng để trả đũa. Nếu chỉ có W3, phải có **5 máy + 1 người duyệt** để lên vàng, **10 máy + 2 người duyệt** để lên đỏ. Ví dụ hỗn hợp lên đỏ gồm một W1 và năm W3 đã được hai người duyệt.

- **Giả số hiển thị.** Viết “Có 2 máy báo cuộc gọi hiển thị số này có yêu cầu chuyển tiền”. Chỉ nêu hành vi khớp bằng chứng. Bà vẫn nhận cảnh báo về nội dung cuộc gọi kể cả khi số khớp danh bạ chính thức.
- **Cửa hàng, tổng đài, giao hàng.** Khi xét cụm, chỉ xác nhận nếu có bằng chứng dụ chuyển tiền hoặc lấy OTP. Tần suất gọi và yêu cầu thanh toán đơn hàng thông thường không đủ.
- **Dàn dựng bản ghi.** Tệp tự chọn không được tính. Dù kẻ xấu dựng được cuộc gọi đến khớp nhật ký và tự xác nhận, một máy chỉ đủ vàng. Đội có thể loại bằng chứng khi xét đợt báo dồn hoặc khiếu nại.
- **Bà bấm nhầm “Có”.** Nút “Rút báo cáo” loại ngay đóng góp của cuộc gọi và cập nhật mọi kênh, kể cả khi Minh từng đồng ý.
- **Người tự nhận là người thân.** Máy chủ kiểm tra phiên của Minh và liên kết ghép đôi còn hiệu lực với máy bà cho đúng cảnh báo. Biết `room` hoặc `alertId` không cấp quyền trả lời.
- **Điểm học tập.** Chỉ cộng +10 một lần cho mỗi cặp máy–hồ sơ khi bằng chứng của máy góp vào mức cộng đồng vàng hoặc đỏ. Gửi báo cáo, báo trùng hoặc đường dẫn chỉ vàng do dấu hiệu kỹ thuật đều không được điểm.

## 4. Giao kèo API

Đây là giao kèo cần triển khai trên Android, máy chủ và các giao diện. Hiện Android đã phân tích bản ghi và hỏi sau cuộc gọi, còn vai Người thân gửi hai lựa chọn qua đường trả lời cảnh báo. Thay đổi ở vòng này là nối những thao tác ấy với **một báo cáo do máy nhận tạo**. Lỗi trả `{detail}`.

### Máy và quyền đội

- `POST /api/devices` cấp `{deviceId}` (16 ký tự hex), lưu bền trên máy. Gửi `X-LCS-Device` khi tạo bằng chứng, phân tích để báo cáo, tạo cảnh báo, báo cáo, rút báo cáo, đăng nhập đội và khiếu nại.
- Khi đăng ký máy Android, máy chủ xác thực ứng dụng và gắn khóa ký của bản cài với `deviceId`. Sau khi đối chiếu trên máy, Android ký biên nhận gồm `eventId, deviceId, type, direction, targetKey, at, durationSec?`. Máy chủ kiểm chữ ký, chiều đến, đối tượng và thời gian. Header hoặc chuỗi `type` tự khai không chứng minh đã nhận. Một sự kiện chỉ thuộc một máy; gửi lại phải khớp biên nhận cũ.
- `POST /api/team/login {code}` trả `{token, member: {id, name, role, ward}}` và gắn máy đăng nhập với phiên. Mọi lần đọc báo cáo/hồ sơ nội bộ hoặc duyệt đều kiểm `X-LCS-Team`. Thiếu/sai phiên trả 401, sai quyền trả 403. Các vai đội là `volunteer` và `lead`. Chỉ `lead` được phát qua `POST /api/broadcasts` và quyết định khiếu nại. Giữ mã đội thử và đường đặt lại dữ liệu theo chế độ demo của vòng 1.

### Từ bản ghi đến xác nhận

- `POST /api/analyze/call` giữ dạng multipart. Để dùng cho báo cáo, Android gửi `audio` cùng biên nhận sự kiện (dùng khóa đối tượng dạng băm khi phân tích). Với âm thanh thật và `source="ai"`, lưu kết quả và trả `analysisId` bằng `AnalysisResult.id`. Kết quả theo luật dự phòng không đủ điều kiện W1/W2. Máy chủ lưu theo ID gồm máy, sự kiện, khóa đối tượng, nguồn, giờ, `aiLevel, aiScamType, aiConfidence` và **tóm tắt bản chép lời đã che**. **Không lưu âm thanh hoặc bản chép lời nguyên văn** trong kho dữ liệu, nhật ký hay cảnh báo. Xóa tệp tạm sau xử lý, kể cả khi lỗi.
- `POST /api/reports` chỉ nhận từ máy đã nhận sự kiện. Các trường có dấu `?` là tùy chọn. Gửi lại cùng máy, sự kiện và đối tượng trả cùng `report.id`; có thể bổ sung xác nhận sau.

```text
{ kind, target, relation: "self", eventId, receipt, story?, lostMoney?, area?, group?,
  evidence: { type: "call_log"|"sms_received"|"screenshot", at, durationSec?, maskedImageId?,
              recording?: { analysisId, aiLevel, aiScamType, aiConfidence } },
  validation?: { by: "self"|"relative", result: "agree"|"disagree", at },
  selfAnswer?: "yes"|"no"|"known", alertId? }
```

- Máy chủ chuẩn hóa `target`, kiểm biên nhận, chỉ nhận `recording` với `call_log`, tra bản phân tích do **chính máy chủ** cấp cho cùng máy, sự kiện và đối tượng. Dùng nhãn từ kho phân tích. Trả 422 nếu ID thuộc cuộc khác hoặc trường nhãn sai. `hasAudio` cũ không chứng minh có bản ghi. Từ chối `on_behalf`, `none`. Báo đối tượng mới thứ sáu trong 24 giờ trả 429.
- Với `by="self"`, máy bà ký `eventId` và `selfAnswer`. Máy chủ tự suy ra `result` theo mục 3, bác giá trị khai sai và ghi giờ nhận làm `at`. Lưu lựa chọn gốc để phân biệt “Không” và “Tôi biết số này”. `POST /api/reports/{id}/withdraw` chỉ chấp nhận yêu cầu ký từ máy đã báo.
- Để xin xác nhận cho bản ghi, Android gọi `POST /api/alerts` với `eventId, reportId, analysisId, summary` và giữ `id` trả về làm `alertId`. Máy chủ kiểm liên kết, chọn người nhận từ ghép đôi đã xác thực và trả lại cùng cảnh báo khi gửi trùng. Cảnh báo gia đình thông thường vẫn gửi được khi thiếu bản ghi, nhưng câu trả lời chỉ dùng để nhắc bà. `GET /api/alerts` và luồng sự kiện của vai Người thân chỉ hiện cảnh báo thuộc phiên gia đình đó.
- Minh gọi `POST /api/alerts/{alertId}/reply {choice}` bằng phiên người thân. Máy chủ kiểm người nhận và ghép đôi hiện hành, lưu bền `alertId, reportId, analysisId, relativeId, choice, at`, rồi tự cập nhật báo cáo kể cả khi máy bà đã tắt. Chỉ đọc lựa chọn `dung-chuyen` hoặc `nguoi-quen` từ bản trả lời đã lưu. Nếu máy bà gửi lại `by="relative"` thì bắt buộc có `alertId`; máy chủ đối chiếu toàn bộ liên kết, lựa chọn và giờ. Từ chối xác nhận thiếu hoặc sai bản trả lời. Lời nhắn tự do không có trọng số.
- Trả `{report: {id, status}, case: {key, level, count, votes}, message}`. Ví dụ khi chờ Minh, hiển thị “Đã nhận báo cáo. Đang chờ Minh xác nhận nội dung cuộc gọi.” Mỗi phản hồi, phiếu, lần rút hoặc gỡ đều cập nhật báo cáo và tính lại mức trong cùng giao dịch, rồi phát sự kiện cập nhật cho các kênh. Gửi lại cùng thao tác không cộng lần hai. Báo cáo cũ thiếu bằng chứng nguồn nhận hoặc chỉ có `ai_confirmed`/`ai_rejected` không được tính tự động.

### Hồ sơ, tra cứu và báo nhầm

- `GET /api/cases?status=open|decided&limit=` trả các hồ sơ với `key, level, count, reviewId, reportIds, reports, flags, votes, myVote, canVote, reasonCannotVote`. Chỉ trả bằng chứng đã che. `POST /api/cases/{key}/vote {reviewId, decision, note?}` nhận `confirm|reject|spam`. Một thành viên một phiếu mỗi đợt, bắt buộc ghi lý do khi xử lý mâu thuẫn. Chặn thành viên dùng máy đã báo trong hồ sơ. Phiếu hết hiệu lực với bằng chứng đã sửa sau khi xét.
- `GET /api/reports`, `GET /api/reports/{id}`, `PATCH /api/reports/{id}` và `POST /api/reports/{id}/decision` cần phiên đội. Hai đường ghi cũ quy về phiếu cho đúng đợt xét và chịu cùng kiểm tra quyền.
- `/api/check`, `/api/lookup/phone/{p}`, `/api/lookup?v=`, nhãn cộng đồng sau cuộc gọi và `/api/stats` dùng chung `target_level`, kể cả khi bằng chứng vừa hết hạn. `count` là số máy khác nhau được tính vào mức cộng đồng đang hiển thị (0 nếu chỉ có dấu hiệu kỹ thuật hoặc đang chờ). Hàng chờ hiển thị riêng số máy đã báo. Trả thêm `appealOpen` và `canAppeal`; mở nút “Số của tôi bị báo nhầm” cho số vàng hoặc đỏ.
- `POST /api/appeals {target, kind, contact, text?}` tạo `pending_verification`. Gửi mã đến **chính số bị báo**. `POST /api/appeals/{id}/verify {code}` chuyển sang `verified` và tạm hạ đỏ xuống vàng. Trong `LCS_DEMO=1` trả thêm `demoCode: "246810"`. Đội có thể xem và ghi nhận xét trong hồ sơ. Chỉ trưởng đội dùng `GET /api/appeals` và `POST /api/appeals/{id}/resolve {outcome: "remove"|"keep", note?}`. `remove` loại toàn bộ báo cáo thuộc hồ sơ bị khiếu nại, `keep` bỏ mức trần tạm thời. Cả hai tính lại mức ngay, không phạt người báo thật lòng. Đường khiếu nại cũ theo mã báo cáo chuyển về cùng quy trình.
- Dữ liệu mẫu dùng sự kiện độc lập còn hạn. Với `028 9999 1234`, dùng 2 máy W1 và 5 máy W3 đã có hai phiếu (7 máy, đỏ). Với `0912 345 678`, dùng 14 máy W3 đã có hai phiếu (đỏ). Giữ đường dẫn `qua-tri-an-khach-hang.top` vàng theo dấu hiệu kỹ thuật. Số liệu W01/W02 lấy từ cùng dữ liệu.

### Cầu nối Android ↔ app React (`window.LCSNative`, thêm vào bảng trong `app/README.md`)

| Hàm | Trả về | Dùng ở |
|---|---|---|
| `deviceId()` | chuỗi | App React gửi `X-LCS-Device` cùng mã máy Android, để một máy chỉ có một mã |
| `recentEvents()` | Promise JSON `[{eventId, type: "call_log"\|"sms_received", target, display, at, durationSec?, hasRecording, analysisId?, reportId?, reportStatus?}]`, mới nhất trước, 7 ngày | Màn Báo cáo (B4): chỉ chọn được cuộc gọi đến hoặc tin nhắn máy này đã nhận |
| `reportEvent(eventId, story?)` | Promise JSON `{report, case, message}` hoặc `{detail}` | Gửi báo cáo kèm biên nhận do Android ký. Có bản ghi thì Android phân tích (nếu chưa), gắn `analysisId` và tạo cảnh báo cho người thân để xác nhận |
| `withdrawReport(reportId)` | Promise JSON | Nút "Rút báo cáo" |
| `demo(key)` | | Mục "Thử Lá chắn": `ring` (thẻ đổ chuông), `ringKnown` (số quen), `afterCall` (Bé Nai hỏi sau cuộc gọi), `stop` (màn Dừng lại), `message` (tin nhắn lạ), `bankWatch` (mở app ngân hàng thì hiện Dừng lại) |
| `openCall(scene)` | | Mở cuộc gọi video luyện tập: `minh-1`, `minh-3`, `lan-2`, `tu-9` |
| `openStory(scamType)` | | Đã có: mở bài học truyện tranh |
| `setRole(role, familyCode?)` | | App React báo vai đang dùng (`elder`, `student`, `relative`, `team`). Vai `relative` thì Android chạy dịch vụ nền theo dõi cảnh báo của gia đình và hiện thông báo; vai khác thì tắt |
| `familyAlerts()` | Promise JSON danh sách cảnh báo của gia đình (mới nhất trước) | Màn Người thân, khi mở app từ thông báo |

## 5. Làm trong bản hackathon, để sau

| Mục | Bản hackathon | Để sau |
|---|---|---|
| Biên nhận sự kiện | `POST /api/devices` trả `{deviceId, deviceSecret}`. Android ký HMAC-SHA256 bằng `deviceSecret` trên chuỗi `eventId\|deviceId\|type\|direction\|targetKey\|at\|durationSec`. Máy chủ kiểm chữ ký. | Play Integrity, khóa phần cứng |
| Xác nhận của người thân | Câu trả lời chỉ được nhận cho cảnh báo do chính máy báo cáo tạo (`alertId` gắn `reportId` ở máy chủ). Vai Người thân trong app dùng mã gia đình đã ghép sẵn. | Mã ghép đôi riêng cho từng gia đình, xác thực ghép đôi |
| Ảnh chụp màn hình | Chưa làm, chỉ có `call_log` và `sms_received` | Tải ảnh đã che |
| Mã khiếu nại | `demoCode` khi `LCS_DEMO=1` | SMS thật đến số bị báo |
| Báo từ trình duyệt | Màn Báo cáo trên web nói rõ "Báo cáo cần app Android trên máy đã nhận cuộc gọi hoặc tin nhắn" | |
| Báo dồn (`burst`) | 5 máy mới cùng đối tượng trong 10 phút thì mở đợt xét | Phát hiện cụm theo mạng, theo thời gian cài app |

## 6. Cảnh diễn cho ban giám khảo

1. **Minh xác nhận, số đổi mức ngay.** Dùng số ngoài danh bạ chính thức chưa có báo cáo. Bà bấm “Báo cuộc vừa nhận”. Android tìm đúng bản ghi, máy chủ nhận ra lời giục chuyển tiền. Bé Nai hỏi, bà chưa trả lời. Minh nhận thông báo trên máy mình (vai Người thân), đọc tóm tắt, bấm “Đừng chuyển”. Máy bà, máy Minh và web đội đều hiện ngay **Nghi ngờ, 1 máy**. Một người nhận khác có bản ghi cùng số và tự trả lời “Có” thì cả ba nơi hiện **Nguy hiểm, 2 máy**, chưa cần phiếu đội.
2. **Nhiều máy thiếu bản ghi.** Một máy báo cùng số cửa hàng bảy lần vẫn chỉ là một máy, mức **Chưa rõ**. Khi có đủ năm máy độc lập, Khoa xem cụm, thấy cùng thủ đoạn dụ chuyển tiền rồi xác nhận. Mức chuyển vàng. Với mười máy đã được cả Khoa và Lan Anh xác nhận, mức chuyển đỏ.
3. **Đội giải quyết ý kiến trái nhau.** Trên hồ sơ mới, AI thấy giục chuyển tiền, bà bấm “Không”, Minh bấm “Đừng chuyển”. Khoa xem tóm tắt đã che và hai câu trả lời, ghi lý do rồi xác nhận dấu hiệu giục chuyển tiền. Hồ sơ hết mâu thuẫn, máy này góp W2 = 2 vào `S1`. Chỉ một máy nên số vẫn **Chưa rõ**.
4. **Chủ số khiếu nại.** Chủ số đỏ ở cảnh 1 nhận mã qua chính số đó. Xác minh xong, mọi kênh hiện vàng và “Đang xét báo nhầm”. Trưởng đội xem hồ sơ, chọn gỡ vì số hiển thị bị giả mạo. Tra lại trên các kênh đều thấy **Chưa rõ**.
