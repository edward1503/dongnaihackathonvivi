# Kịch bản video demo (quay trước trên điện thoại thật, chiếu sau phần trình bày)

Quay một lượt trên Xiaomi thật, với cuộc gọi thật từ Châu và Tuấn và máy chủ thật trên scoai. Video chỉ chiếu cho ban tổ chức nên không cần che số. Sau khi quay, cắt các khúc chờ và thêm phụ đề. Video thành phẩm khoảng **4 phút**; cần ngắn hơn thì xem cuối trang. Buổi quay mất khoảng 45 phút, kể cả quay lại.

## Vai và màn hình

| Ai | Làm gì |
|---|---|
| **Bạn** | Đóng vai **bà Hoa** trên Xiaomi: nghe máy, nói chuyện, trả lời Bé Nai. Sau đó thao tác laptop trong vai **Minh** và **quản trị viên**. |
| **Châu** | Gọi vào máy bà, đóng vai kẻ gian. Số chưa có cờ. |
| **Tuấn** | Gọi vào máy bà 2 lần. Số đang chờ duyệt, với 10 máy báo. |

Màn laptop chia đôi:
- **Bên trái:** cửa sổ scrcpy, tức là điện thoại Xiaomi.
- **Bên phải:** trình duyệt với 2 tab.
  - **Tab A, máy Minh:** `https://supplychain-system-product-name.tailb64d44.ts.net:10000/?mode=relative`
  - **Tab B, web quản trị:** `https://supplychain-system-product-name.tailb64d44.ts.net:10000/web`, đăng nhập mã **`868686`** (Quản trị viên).

Với quản trị viên, **một lần bấm "Xác minh lừa đảo" là có hiệu lực ngay**: số lên Nguy hiểm, mọi máy hiện thẻ đỏ "Lá chắn số đã xác minh số này lừa đảo".

**Đổi vai nhanh trên điện thoại:** vào Cá nhân, mục "Đổi nhanh vai" ở đầu trang, chạm **Bà Hoa**, **Vy** hoặc **Minh**. Chọn Minh thì app tự ghép mã gia đình.

## Chuẩn bị

1. Chạy `bash ~/.local/share/lcs/demo-so/dung-lai.sh` và phải ra 2 dòng `OK`. Lệnh này cũng đặt lại bảng thi đua. Chạy lại trước **mỗi** lần quay lại.
2. **Xiaomi:**
   - Pin trên 60%, tắt Không làm phiền, chuông và âm lượng nhạc để to nhất, mạng ổn định.
   - App Lá chắn ở vai **Bà Hoa**, màn "Chào bà".
3. Cắm USB. Tôi chạy scrcpy và bật ghi màn hình laptop.
4. Mở sẵn tab A và tab B. Ở tab B, đăng nhập `868686` rồi mở mục Kiểm duyệt.
5. Châu và Tuấn **không ẩn số**, sóng tốt, gọi khi có tín hiệu.

## Các cảnh

| # | Trong video | Cảnh |
|---|---|---|
| 0 | 0:00 – 0:10 | Mở đầu |
| 1 | 0:10 – 0:55 | Châu gọi: số lạ, Bé Nai hỏi lại sau cuộc gọi |
| 2 | 0:55 – 1:10 | Dừng lại khi mở app ngân hàng |
| 3 | 1:10 – 1:35 | Minh nhận cảnh báo, nhắn "Đừng chuyển" |
| 4 | 1:35 – 2:10 | Tuấn gọi: quản trị viên xác minh, gọi lại thì hiện thẻ đỏ |
| 5 | 2:10 – 2:35 | Bảng điều khiển web: tổng quan, cảnh báo và tuyên truyền |
| 6 | 2:35 – 3:25 | Đổi sang Vy: các dạng bài học |
| 7 | 3:25 – 4:00 | Bài kiểm tra và thi đua: lớp lên hạng, xem bảng trường và phường |
| 8 | 4:00 – 4:05 | Chốt |

### 0. Mở đầu (phụ đề)
"Bên trái là điện thoại của bà Hoa, 70 tuổi. Bên phải là điện thoại của Minh, con trai bà, và trang quản trị."

### 1. Châu gọi, bạn đóng vai bà Hoa
- Chuông reo, **không có thẻ nào**: số chưa có dữ liệu thì app không dọa bừa.
- **Nghe máy, bật loa ngoài** để micro laptop thu cả hai bên.
- Châu nói **ít nhất 20 giây**, bạn đáp như bà Hoa đang lo lắng. Ở chế độ trình diễn, cuộc gọi từ 15 giây mới được hỏi lại.
  > **Châu:** "Alo, bà Hoa phải không ạ? Tôi là cán bộ công an thành phố. Tài khoản ngân hàng của bà đang liên quan đến một đường dây rửa tiền."
  > **Bà Hoa:** "Trời, sao lại thế hả chú?"
  > **Châu:** "Để chứng minh bà vô can, hôm nay bà phải chuyển toàn bộ số dư sang tài khoản tạm giữ của cơ quan điều tra. Việc này phải giữ bí mật, bà không được kể với con cháu. Bà ghi số tài khoản nhé…"
  > **Bà Hoa:** "Ừ ừ, để bà lấy giấy bút."
- Cúp máy. **Bé Nai hỏi**: "Người vừa gọi có bảo bà chuyển tiền không ạ?". Bấm **Có**.
- Màn chuyển sang **Nguy hiểm**, kèm "Đã báo cho Minh". Bé Nai nói "Bà đừng chuyển tiền nhé…".

### 2. Dừng lại, làm ngay sau cảnh 1
- Về màn hình chính, mở **MoMo** (hoặc app ngân hàng). Màn **DỪNG LẠI** đỏ hiện đè lên, có giọng Bé Nai.
- App chỉ canh **2 phút** sau khi bà trả lời Bé Nai.

### 3. Minh, trên tab A
- Đã có cảnh báo mới trong "Cảnh báo gia đình". Mở ra để thấy mức, giờ, số đã che và câu mẹ trả lời Bé Nai.
- Bấm **"Đừng chuyển"**.
- Quay sang máy bà, về màn chính: hiện **"Minh gửi lời nhắn cho mẹ"**. Bấm vào để nghe.

### 4. Tuấn gọi, quản trị viên xác minh
- **Lần 1:** chuông reo, **không có thẻ** (số đang chờ duyệt). Từ chối.
- **Tab B, Kiểm duyệt:** mở hồ sơ **số đuôi 154**, thường nằm đầu danh sách. Cho thấy 10 bằng chứng cuộc gọi, ghi một dòng nhận xét, bấm **Xác minh lừa đảo**. Hồ sơ rời hàng chờ và hiện trong "Đã gắn cờ" ở trên.
- **Lần 2:** **thẻ đỏ "Nghi lừa đảo"** hiện ngay khi chuông đổ: "Lá chắn số đã xác minh số này lừa đảo. Đã có 10 máy báo cáo." Từ chối.
- **Không bấm "Chặn số này"**: số đã chặn thì lần sau máy tự từ chối, không hiện thẻ nữa.

### 5. Bảng điều khiển web, trên tab B
- **Tổng quan:** số báo cáo trong tháng, kiểu lừa đảo, kiểu mới nổi, báo cáo theo tuần, nhóm bị nhắm tới, khu phố.
- **Cảnh báo và tuyên truyền:** cảnh báo do AI soạn từ báo cáo, truyện tranh 1 phút, buổi tuyên truyền sắp tới.

### 6. Vy, các dạng bài học
- Trên điện thoại: Cá nhân, chạm **Vy** ở mục Đổi nhanh vai.
- Vào **Bài học**:
  - **Truyện tranh có giọng kể:** mở "Việc nhẹ lương cao", lướt 2–3 khung.
  - **Gọi video luyện tập với chị Lan (AI mô phỏng):** trả lời 1–2 câu, cho thấy chị Lan đáp lại và chấm điểm.
  - **Ôn nhanh 1 phút:** làm 1 câu.

### 7. Bài kiểm tra và thi đua
- Vào **Bài kiểm tra 5 câu**, trả lời **đúng cả 5 câu** (lúc dựng sẽ tua nhanh).
- Ở màn kết quả, nếu app hỏi trường và lớp thì chọn **THPT Ngô Quyền**, lớp **11A1**, rồi bấm **Vào bảng thi đua**.
- Lớp 11A1 **vượt 11A3 lên hạng 1**, có hiệu ứng.
- Mở **Bảng thi đua**, chuyển qua 3 phạm vi: **các lớp trong trường**, **các trường toàn Đồng Nai**, **các phường**.
- Về màn chính của Vy: thẻ hạng lớp nằm ngay đầu trang.

### 8. Chốt (phụ đề)
"Cảnh báo trước khi nghe, hỏi lại sau khi nghe, chặn trước khi chuyển. Người thân, cộng đồng và nhà trường cùng đứng sau."

Quay xong, chạm **Bà Hoa** để đưa điện thoại về vai cũ.

## Bản ngắn khoảng 3 phút

Bỏ cảnh 5 (bảng điều khiển; nói một câu khi lướt qua tab B ở cảnh 4). Cảnh 6 chỉ giữ truyện tranh và gọi video chị Lan. Cảnh 3 chỉ cho thấy cảnh báo đã tới máy Minh.

## Thử trực tiếp với số của ban tổ chức (sau khi chiếu video)

1. Xiaomi ở vai **Bà Hoa**, mạng ổn định. Tab B đăng nhập quản trị, đang ở Kiểm duyệt.
2. Ở ô **"Gắn cờ nhanh số lừa đảo"**, nhập số của ban tổ chức, chọn kiểu lừa đảo, bấm **Gắn cờ lừa đảo**. Số lên Nguy hiểm ngay.
3. Ban tổ chức gọi vào Xiaomi: **thẻ đỏ** hiện khi chuông đổ, ghi "Lá chắn số đã xác minh số này lừa đảo". Từ chối.
4. Xong thì bấm **Gỡ cờ** cạnh số đó trong danh sách "Đã gắn cờ".

## Khi trục trặc lúc quay

| Sự cố | Cách xử lý |
|---|---|
| Bé Nai không hỏi sau cuộc gọi của Châu | Cuộc gọi có thể chưa tới 15 giây. Kéo thanh thông báo, bấm "Bé Nai hỏi thăm". |
| App ngân hàng tự thoát vì máy đang bật gỡ lỗi USB (scrcpy cần) | Mở app **Máy tính**: đã cài làm app thay thế, cũng hiện màn Dừng lại. |
| Lỡ xác minh sai, hoặc quay lại cảnh 4 | Chạy `dung-lai.sh` rồi quay lại cảnh 4. Cảnh 4 không phụ thuộc cảnh trước. |
| Lớp không lên hạng 1 | Máy này đã nộp bài trước đó. Chạy `dung-lai.sh` để đặt lại bảng thi đua, rồi làm lại bài kiểm tra. |
| Cần cảnh dự phòng | Cá nhân → Cài đặt nâng cao → Thử nhanh: "Thẻ cảnh báo khi đổ chuông", "Bé Nai hỏi sau cuộc gọi lạ", "Màn Dừng lại". |
