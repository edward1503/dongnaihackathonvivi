# Kế hoạch trailer "Lá chắn số" (Đội 18, Hackathon thành phố Đồng Nai 2026)

Bản kế hoạch, chưa quay, chưa thu, chưa dựng. Viết ngày 26/11/2026.
Trailer chiếu ngay trước phần đội thuyết trình. Dài khoảng 90 giây (chấp nhận 88–93), 1920×1080, 30 khung/giây.

Ký hiệu đường dẫn:
- `W` = `/home/rin/dongnaihackathonvivi/la-chan-so` (laptop), `T` = `$W/video/trailer`.
- `R` = `~/lcs-video/trailer` trên máy chủ scoai (trong container gắn thành `/t`).

## 0. Tóm tắt một trang

- **Ý tưởng:** câu tục ngữ "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao". Mở bằng bà Hoa một mình trước cuộc gọi lừa đảo ("một cây"). Đi qua bốn trụ của sản phẩm: cảnh báo, giọng nói cho người già, học tập, và **cộng đồng (trụ chính, dài nhất, đặt ở cao trào)**. Khép bằng ba vòng bảo vệ chụm lại: chính mình, người thân, cộng đồng.
- **Hình:** quay tự động, không dùng điện thoại của người dùng. Màn Android gốc quay trên **máy ảo Android chạy trong container docker trên scoai** (hai máy ảo chạy cùng lúc: máy bà Hoa và máy Minh). Màn React, bài học, gọi video, web đội tình nguyện quay bằng Chromium không giao diện, cũng trong container trên scoai. Laptop chỉ điều phối (ssh, rsync), thu giọng và soát.
- **Tiếng:** lời dẫn Gemini TTS giọng Kore, một lượt cho cả bài; tiếng trong app (chuông, Bé Nai, chị Lan) đặt lại từ tệp gốc của kho; nhạc nền có giấy phép tự do.
- **Dựng:** Remotion 4 (bộ `video/remotion`), composition mới `LCSTrailer`, render trên scoai bằng container `lcs-video-render` như video demo.
- **Trung thực:** mỗi câu lời dẫn gắn với một cổng kiểm (mục 3). Câu nào kiểm hỏng thì dùng bản thay thế đã viết sẵn. Lời chỉ được chốt và thu **sau** khi qua các cổng kiểm.
- **Phản biện:** kế hoạch, lời dẫn và bản dựng thử đều qua một vòng phản biện của Codex Astra (mục 9.3). Astra chỉ phản biện, không thiết kế giao diện.

### Điều tìm thấy khác với đề bài giao

1. **Máy đã có 2 AVD**, không phải "chưa có": `lcs34` (5,6 GB) và `lcs-test` (1,9 GB) ở `~/.config/.android/avd` (`ANDROID_AVD_HOME`). Kế hoạch không dùng lại chúng (đang có phiên Claude khác chạy trên laptop), chỉ chép `lcs34.avd/config.ini` làm mẫu.
2. **Máy chủ demo công khai đang hiện 140 báo cáo, 42 đường dẫn giả, 30%** (đo bằng `GET /api/stats` lúc lập kế hoạch), vì đã có báo cáo thử. Số của đề là 120 và 35%. Muốn hình đúng 120 và 35% phải quay trên máy chủ riêng, dữ liệu mẫu sạch (mục 4.4). Lời dẫn không đọc con số nào.
3. **Thẻ đỏ khi mất mạng hiện chậm hơn khoảng 2,6–3 giây** so với khi có mạng: `Api.lookupPhone` thử lại tới hết 3,2 giây rồi mới tra danh sách tải sẵn (`FlaggedNumbers.find`). Cổng V1 phải đo con số này.
4. **`ghi.mjs` đang cố định `mobile: false` và không nhận script khởi tạo.** Quay màn React khổ điện thoại cần một bản sao có thêm hai tham số (mục 5.2), không sửa bản gốc.
5. **Căn câu Whisper hiện đọc venv và bộ nhớ đệm trong `~/sc2-tradeagent/asr`** (xem `video/thao-tac/giong.py`, hàm `can`). Chỉ đọc và chạy, không ghi, nhưng nằm trong thư mục bị cấm đụng. Cần người dùng xác nhận (mục 10).
6. `BAN-GIAO.md` mục 8 ghi "không đụng máy chủ dựng hình". Chạy máy ảo trên scoai là việc mới so với luật đó, theo lời nhắn điều phối là ý người dùng. Kế hoạch giữ mọi thứ trong `~/lcs-video/trailer` và container tên `lcs-trailer-*`.
7. `thuyet-minh.md`, `app/README.md` còn chữ Zalo, Mini App: trailer không dùng. Chuỗi ngày học chưa có trong app: không nhắc. **Thi đua theo lớp, trường, phường đang được làm** (thẻ "Xếp hạng nhóm" ở màn kết quả bài kiểm tra): trailer có một đoạn ngắn về nó, có cổng kiểm V8 và câu thay thế nếu chưa xong.
8. Màn chào `#/chao` của app React có biểu trưng Đồng Nai nhỏ ở chân: **không quay màn này**.
9. Laptop không có `video/remotion/node_modules`. Ảnh tĩnh soát phải render trên scoai.

## 1. Ý tưởng, mạch cảm xúc, hình ảnh

### 1.1 Sợi chỉ xuyên suốt

| Nhịp | Hình ảnh ẩn dụ | Nội dung sản phẩm | Cảm xúc |
|---|---|---|---|
| Mở | Một cây non đứng một mình trong đêm, gió giật | Bà Hoa một mình, cuộc gọi lạ, giọng kẻ gian | Bất an |
| Tên | Khiên vẽ lên quanh cây | "Lá chắn số" | Có chỗ dựa |
| Vòng 1 · Chính mình | Vòng sáng thứ nhất quanh cây | Trụ 1 cảnh báo, trụ 2 giọng nói, trụ 3 học tập | Được che chở, tự tin dần |
| Vòng 2 · Người thân | Cây thứ hai mọc cạnh, vòng thứ hai | Máy Minh nhận thông báo | Ấm |
| Vòng 3 · Cộng đồng (cao trào) | Rừng cây sáng dần, vòng thứ ba | Người nhận thật mới báo được, đội kiểm duyệt, chủ số khiếu nại, danh sách dùng chung | Mạnh, rộng |
| Kết | Tán cây ghép thành dáng núi, viền núi hóa thành khiên | Câu tục ngữ, tên sản phẩm, Đội 18 | Tự hào, dứt khoát |

Điểm nối quan trọng của kịch bản: **thẻ đỏ trên máy bà Hoa ở trụ 1 chính là kết quả của trụ 4**. Ở cao trào, hình quay ngược về thẻ đỏ đó rồi mở rộng ra những máy đã báo trước.

### 1.2 Bố cục 16:9

- Khung điện thoại dọc do Remotion vẽ (bo góc 44 px, viền 10 px, bóng đổ mềm), bên trong là đoạn quay 1080×2400 gồm cả thanh trạng thái thật của máy ảo (không vẽ thanh trạng thái giả). Cao 920 px, rộng 414 px.
- Một điện thoại: máy đặt lệch phải (tâm x = 1340), nửa trái dành cho chữ lớn. Hai điện thoại (cảnh người thân): hai máy hai bên, đường nối ở giữa.
- Chữ trong máy nhỏ so với màn chiếu, nên mỗi khoảnh khắc chính có một **mảnh phóng to** tách khỏi máy (thẻ đỏ, thông báo, câu hỏi của Bé Nai), rộng 760–900 px, dùng `FloatCrop` có sẵn.
- Web đội tình nguyện: khung cửa sổ trình duyệt 1440×810, nghiêng nhẹ.
- Cỡ chữ: tiêu đề từ 64 px, chữ phụ từ 36 px, phụ đề 34 px. Lề an toàn 96 px. Phông Be Vietnam Pro (đã có trong `video/remotion`).
- Góc dưới trái, suốt video: nhãn nhỏ **"Dữ liệu minh họa · Quay trên máy ảo Android"**. Cảnh có giọng kẻ gian thêm nhãn **"Mô phỏng · giọng AI đóng vai"**.
- Chip trụ ở góc trên trái: "1 · Cảnh báo", "2 · Giọng nói", "3 · Học tập", "4 · Cộng đồng" (chip thứ tư to và sáng hơn).

### 1.3 Ngôn ngữ hình ảnh và hiệu ứng (yêu cầu của người dùng: đẹp, cuốn mắt)

Màu lấy từ `ds.css` và `app/src/v3/theme.css` (xanh thương hiệu, đỏ nguy hiểm, vàng nghi ngờ, tím AI, xanh lá an toàn), thêm nền xanh đêm `#0B1220` cho phần mở. Gói E đọc token thật trong hai tệp đó, không tự đặt mã màu.

Sáu mô-típ, dùng lặp lại để video có một giọng hình thống nhất:

| Mô-típ | Mô tả | Dùng ở |
|---|---|---|
| Cây và vòng | Cây nét mảnh phát sáng (SVG tự vẽ), ba vòng đồng tâm vẽ dần bằng `stroke-dashoffset` | Mở, chuyển trụ, kết |
| Nhịp dừng | Khi Lá chắn lên tiếng: hình đứng 10–12 khung, nền tối đi, mảnh phóng to bay ra có quầng sáng | Thẻ đỏ, thông báo máy Minh, DỪNG LẠI |
| Sóng | Vòng sóng chuông tỏa quanh máy; sóng âm theo biên độ thật của tệp tiếng (tính sẵn bằng numpy, ghi JSON) | Mở, Bé Nai hỏi, bà đáp, chị Lan |
| Sợi nối | Đường cong sáng nối hai điểm, một xung chạy dọc đường | Bà sang Minh; các máy đã báo sang danh sách chung |
| Chữ động | Từng từ bật lên lệch nhau 2–3 khung (`Words` có sẵn), từ khóa đổi màu | Mọi câu chính |
| Màu lan | Màu của màn trong máy tràn ra cả khung 16:9 rồi rút lại | Thẻ đỏ (một nhịp), DỪNG LẠI, chuyển sang trụ cộng đồng |

Kỹ thuật kèm theo: điện thoại nghiêng 3D 12–18° có thị sai theo chuyển động máy quay ảo; vệt sáng quét qua mặt kính lúc máy vào hình; hạt bụi sáng trôi chậm (sinh từ hạt giống cố định); bóng mờ chuyển động giả bằng ba bản sao mờ dần cho các cú bay nhanh; hạt nhiễu phim và tối góc rất nhẹ; bút dạ quang đỏ quét qua dấu hiệu trong tin nhắn (mặt nạ lộ dần theo tọa độ `focus` trong tệp mốc); thẻ câu hỏi lật 3D; đếm số (`Counter` có sẵn).

Ba kiểu chuyển cảnh, không dùng kiểu thứ tư: đẩy theo chiều sâu (cảnh cũ lùi và mờ, cảnh mới tiến), lau hình khiên (`clip-path`), màu lan.

Luật giữ chất lượng:
- Mỗi nhịp một hiệu ứng chính. Chữ đứng yên ít nhất 1,2 giây. Điểm cắt rơi vào phách nhạc (lưới phách ghi trong `T/nhac/phach.json`).
- Không nhấp nháy: đỏ lóe đúng một lần mỗi lần cảnh báo, không quá 3 lần mỗi giây ở bất cứ đâu.
- Mọi chuyển động tính từ số khung (`interpolate`, `spring`), không dùng CSS animation, không dùng số ngẫu nhiên không có hạt giống.
- Mặc định không thêm gói npm mới (thư mục `node_modules` trên scoai đang là bản liên kết cứng). Nếu cần thì hỏi trước.
- Giao diện và hiệu ứng do Claude tự làm, không giao Codex thiết kế.

## 2. Kịch bản từng cảnh

Tốc độ đọc đo từ video demo đã nộp (giọng Kore, một lượt): 2386 ký tự trong 174,0 giây, tức khoảng 13,5 ký tự mỗi giây kể cả nghỉ giữa câu. Bản lời gốc dưới đây dài khoảng 985 ký tự, ước 73 giây. Cộng khoảng 9 giây dành cho tiếng trong app và 9 giây nghỉ, giữ hình: tổng 91 giây. Ngân sách chặt, nên mọi câu thêm đều phải theo luật độ dài ở mục 2.2.

### 2.1 Bảng cảnh

Cột "Lời" là bản hiển thị (phụ đề). Mã S là số câu, dùng ở mục 2.2 và mục 3.

| Cảnh, mốc | Lời dẫn | Chữ trên hình | Hình | Hiệu ứng | Tiếng trong app, âm thanh |
|---|---|---|---|---|---|
| **C0 Mở, "một cây"** 0:00–0:09,5 | S1 Một cuộc gọi lạ. S2 Một giọng nói gấp gáp. S3 Bà Hoa chỉ có một mình. S4 Một cây làm chẳng nên non. | "Một cuộc gọi lạ." rồi "Một cây làm chẳng nên non…" | Nền đêm, cây non. Máy bà Hoa đổ chuông với số lạ chưa ai báo (đoạn A1), chân dung bà Hoa `assets/chan-dung-ba-hoa.png` | Máy trôi vào nghiêng 3D, vòng sóng chuông, khung rung 2 px theo nhịp rung, cây nghiêng theo gió khi kẻ gian nói, cuối cảnh tối dần chỉ còn cây và câu tục ngữ | Rung và chuông (tự tổng hợp, mục 6.3). 3,8–6,3 s: giọng kẻ gian `prototype/hoc/giong/b01/gn-06.m4a` cắt còn "Bà chuyển hết tiền vào tài khoản tạm giữ giúp tôi", lọc dải điện thoại 300–3400 Hz. Nhạc: đệm trầm, thưa |
| **C1 Tên** 0:09,5–0:14,5 | S5 Lá chắn số. S6 Để không ai phải một mình trước kẻ lừa đảo. | LÁ CHẮN SỐ · Đội 18 · Hackathon thành phố Đồng Nai 2026 | Khiên gạc nai `tools/logo/logo-c.png` vẽ quanh cây | Lau hình khiên từ đêm sang xanh thương hiệu, nét khiên vẽ dần rồi đổ màu, chữ tên bật từng chữ | Tiếng dội trầm đúng lúc khiên khép. Nhạc vào giai điệu |
| **C2 Trụ 1 · Cảnh báo** 0:14,5–0:28,5 | S7 Chuông vừa đổ, thẻ đỏ đã hiện: số này từng bị nhiều máy báo lừa đảo. S8 Số lạ chưa ai báo, Lá chắn im lặng. S9 Số điện thoại, tin nhắn, đường dẫn đáng ngờ, đều kiểm tra được ngay. | "Cảnh báo ngay khi đổ chuông" · "Chưa ai báo: im lặng" · "Số điện thoại · Tin nhắn · Đường dẫn" | A2 (đoạn đổ chuông có thẻ đỏ). Rồi hai máy cạnh nhau: A1 im lặng, A2 thẻ đỏ. Rồi ba máy xếp quạt: W1 tra số, W2 tin nhắn "việc nhẹ lương cao" có dấu hiệu tô đỏ, W3 đường dẫn | Nhịp dừng lúc thẻ đỏ hiện, mảnh thẻ phóng to, đỏ lan một nhịp, "10 máy" đếm lên. Ba máy lần lượt bật ra trước, bút dạ quang quét dấu hiệu | Chuông, rung. Tiếng "tách" nhẹ mỗi máy bật ra |
| **C3 Trụ 2 · Giọng nói** 0:28,5–0:40 | S10 Với người lớn tuổi, Bé Nai hỏi bằng giọng nói. S11 Bà chỉ cần trả lời một tiếng. | Câu hỏi của Bé Nai chữ lớn · "Có." | A2 (đoạn sau khi cúp máy): màn "Bé Nai hỏi thăm", trạng thái "Bé Nai đang nghe…", rồi màn "Nguy hiểm" và "Đã báo cho Minh" | Sóng âm xanh theo tiếng Bé Nai, hình Bé Nai nhún theo tiếng, sóng âm cam khi bà đáp, chữ "Có." bật to, thẻ kết quả trượt ra | `prototype/audio/benai-10.m4a` phần câu hỏi "Người vừa gọi có bảo bà chuyển tiền không ạ?" (khoảng 3,4 s cuối của tệp 7,06 s). Tiếng bà Hoa "Có" (mục 6.2). Lời dẫn im trong lúc này |
| **C4 Vòng 2 · Người thân** 0:40–0:47 | S12 Ít giây sau, điện thoại của Minh, con trai bà, báo tin: Mẹ vừa gặp cuộc gọi đáng ngờ. | "Mẹ vừa gặp cuộc gọi đáng ngờ" | Hai máy: A2 bên trái ("Đã báo cho Minh"), M1 bên phải (thông báo rơi xuống ở màn chính, Minh chạm, mở chi tiết cảnh báo) | Sợi nối, xung chạy từ máy bà sang máy Minh đúng mốc thông báo, nhịp dừng, mảnh thông báo phóng to, vòng thứ hai vẽ quanh cây | Tiếng thông báo (tổng hợp). `benai-11.m4a` rất nhỏ dưới lời dẫn hoặc bỏ |
| **C5 Trụ 3 · Học tập** 0:47–1:02 | S13 Để lần sau tự nhận ra: truyện tranh có lối rẽ, cuộc gọi nhập vai với nhân vật AI. S13b Xong bài kiểm tra, lớp của Vy lên một bậc: các trường, các phường cùng thi đua. | "Truyện có lối rẽ" · "Gọi video nhập vai · AI đóng vai" · "Thi đua: lớp · trường · phường" | W4 thư viện 4 bài, W5 truyện tới điểm rẽ và chọn "Dừng lại, hỏi cô giáo", W6 gọi video chị Lan, W7 bài kiểm tra, W11 màn kết quả có thẻ "Xếp hạng nhóm": nhóm của Vy nhích lên một bậc, rồi đổi phạm vi sang "các trường trong phường" (4–5 s) | Tranh `assets/comic2-*.png` xếp lớp có thị sai, hai lối rẽ tách hai ngả, nhánh đúng sáng xanh, cửa sổ gọi video bật lên có viền sóng âm, thẻ câu hỏi lật 3D. Thẻ xếp hạng phóng to: dòng nhóm của Vy (nền xanh) trượt lên một bậc, số điểm đếm lên, ba cây nhỏ mọc cạnh ba phạm vi lớp, trường, phường (nối sang trụ cộng đồng) | 2,5 s tiếng chị Lan từ `prototype/audio/lan/` (đúng câu đang phát trong W6, lấy theo mốc tiếng gốc). Tiếng "tinh" khi lên bậc. Nhạc tươi lên |
| **C6 Trụ 4 · Cộng đồng (cao trào)** 1:02–1:22,5 | S14 Nhưng lá chắn mạnh nhất, là cộng đồng. S15 Thẻ đỏ của bà Hoa có được, là nhờ những người nhận cuộc gọi trước đã báo. S16 Chỉ máy thật sự nhận cuộc gọi mới báo được. S17 Đội tình nguyện kiểm duyệt. S18 Chủ số bị báo nhầm được khiếu nại. S19 Mọi máy dùng chung một danh sách cảnh báo. | "Lá chắn mạnh nhất: cộng đồng" · "Máy nhận thật mới báo được" · "Đội tình nguyện kiểm duyệt" · "Báo nhầm? Được khiếu nại" · "Một danh sách, mọi máy cùng dùng" | Quay ngược về thẻ đỏ của bà. Mười máy nhỏ quanh một vòng "danh sách chung". A6 bà bấm "Báo cuộc vừa nhận". W9 web đội: Khoa mở hồ sơ, bấm xác nhận, mức đổi màu. W10 "Số của tôi bị báo nhầm", mức đỏ hạ vàng "Đang xét báo nhầm". Lưới máy cùng hiện thẻ đỏ (ghép từ A2, ghi "minh họa") | Màu lan sang nền sáng ấm, mỗi máy bắn một sợi nối vào danh sách chung, số đếm 1 đến 10, dấu "biên nhận" đóng xuống, thanh mức trượt xám, vàng, đỏ, thẻ đỏ lan trên lưới máy như sóng, lùi máy quay ra thành rừng cây, vòng thứ ba | Nhạc lên cao trào. Không có tiếng trong app |
| **C7 Kết** 1:22,5–1:31 | S20 Chính mình. Người thân. Cộng đồng. S21 Ba cây chụm lại, nên hòn núi cao. S22 Lá chắn số. | "Một cây làm chẳng nên non, / ba cây chụm lại nên hòn núi cao." · LÁ CHẮN SỐ · Đội 18 · Hackathon thành phố Đồng Nai 2026 · dòng ghi công nhạc (nếu CC BY) | Ba vòng khép lại, rừng cây dồn về giữa, tán cây ghép thành dáng núi, viền núi hóa thành khiên | Ba từ rơi theo ba nhịp trống, biến hình núi sang khiên (hai đường SVG cùng số điểm), giữ khung cuối 2,5 s | Nhạc về chủ âm, dứt gọn. Không lời 1,5 s cuối |

Tổng: 9,5 + 5 + 14 + 11,5 + 7 + 15 + 20,5 + 8,5 = 91 giây.

Câu khẩu hiệu là câu tục ngữ. Viết đúng: "nên hòn núi cao", không phải "lên".

### 2.2 Câu có điều kiện (chỉ thêm khi qua cổng kiểm)

| Cổng | Đạt thì thêm | Vào đâu | Hỏng thì |
|---|---|---|---|
| V1 thẻ đỏ khi mất mạng | Thay S8 bằng: "Số lạ chưa ai báo thì im lặng. Mất mạng, vẫn cảnh báo." (+1,4 s). Thêm chữ "Mất mạng vẫn cảnh báo · danh sách tải sẵn" và 2 s đoạn A3 | C2 | Giữ S8 gốc, không có chữ, không dùng A3 |
| V2 AI phân tích bản ghi âm | Thêm sau S11: "Có bản ghi âm, AI nghe lại và chỉ ra từng dấu hiệu." (+4 s) và đoạn A4 | C3 | Không thêm, không dùng A4. C3 kết ở màn "Nguy hiểm" theo câu trả lời của bà |
| V3 màn Dừng lại | Thêm sau S12: "Bà mở app ngân hàng, màn hình nhắc: Dừng lại." (+3,3 s) và đoạn A5, tiếng `benai-13.m4a` | C4 | Không thêm, không dùng A5 |
| V4 tin nhắn do AI phân tích thật | S9 và C5 giữ chữ "AI" | C2 | Nếu máy chủ chỉ trả `source` khác `ai`: bỏ nhãn "AI" trên hình W2, lời S9 giữ nguyên (S9 không nói chữ AI) |
| V5 báo cáo từ máy đã nhận | Giữ S16 | C6 | Bỏ S16 và đoạn A6 |
| V6 đội kiểm duyệt trên web | Giữ S17 | C6 | Bỏ S17 và W9 |
| V7 khiếu nại báo nhầm | Giữ S18 | C6 | Bỏ S18 và W10 |
| V8 thi đua lớp, trường, phường | Giữ S13b và đoạn W11 | C5 | Bỏ S13b và W11; S13 trở lại dạng "…với nhân vật AI, bài kiểm tra ngắn."; C5 rút còn 11 giây |

Luật độ dài: tổng phải trong 88–93 giây. Bản gốc đã 91 giây, nên các câu thêm của V1, V2, V3 không đọc hết được. Thứ tự nhường: V1 chỉ lên chữ (không đọc); rồi V3 chỉ lên hình và chữ; V2 được đọc nếu còn chỗ sau khi rút phần giữ hình ở C1, C2, C7. Vẫn vượt thì người dùng chọn câu cắt trước khi thu. Không tăng tốc giọng.

### 2.3 Bản gửi TTS

Một đoạn duy nhất, mỗi câu một dòng, giữ đúng thứ tự S1 đến S22 (S13b sau S13) sau khi đã chốt các câu có điều kiện. Khác bản hiển thị ở các chỗ sau:

| Hiển thị | Gửi TTS |
|---|---|
| AI | ây ai |
| app | áp |
| Đội 18 (chỉ lên chữ, không đọc) | (không có trong lời) |
| "Ba cây chụm lại, nên hòn núi cao." | giữ nguyên, có dấu phẩy để nghỉ |

Bản gốc không có số, không có OTP. Nếu về sau thêm: 65 đọc "sáu mươi lăm", OTP đọc "ô tê pê", 18 đọc "mười tám" (bảng `NOI` trong `video/thao-tac/giong.py`).

Lời dặn giọng (chỉ nằm trong phần chỉ đạo, không nằm trong lời đọc): "Người dẫn trailer giới thiệu một ứng dụng chống lừa đảo cho ban giám khảo. Giọng nữ miền Nam, ấm, rõ, chắc. Bốn câu đầu chậm, trầm, hơi căng. Từ câu 'Lá chắn số' sáng dần. Đoạn cộng đồng dứt khoát, tự hào. Câu tục ngữ đọc chậm, tròn chữ. Nghỉ nửa giây sau mỗi câu. Đọc đúng từng chữ, không thêm, không bớt."

## 3. Cổng kiểm trước khi chốt lời

Đã kiểm trên máy thật (theo người dùng): thẻ đỏ khi đổ chuông với số bị cộng đồng báo, có mạng; số lạ chưa ai báo thì im lặng; Bé Nai hỏi bằng giọng sau cuộc gọi, trả lời "Có" bằng giọng; báo người thân qua máy chủ, máy người thân nhận thông báo "Mẹ vừa gặp cuộc gọi đáng ngờ"; trang bài học (thư viện và 4 bài) chạy không lỗi.

Phải kiểm trên máy ảo hoặc máy chủ riêng trước khi đưa vào lời:

| Cổng | Kiểm gì | Cách kiểm | Đạt khi |
|---|---|---|---|
| V0 | Máy ảo có nhận giọng nói tiếng Việt không | `adb shell cmd package query-services -a android.speech.RecognitionService`; thử bơm tiếng qua micro ảo (mục 5.1, bước 7) | Chỉ để chọn cách quay C3, không đổi lời |
| V1 | Thẻ đỏ khi mất mạng | Chờ `files/flagged-numbers.json` có dữ liệu (`run-as vn.doi18.lachanso cat files/flagged-numbers.json \| head -c 200`), tắt mạng bằng `svc wifi disable; svc data disable` (không bật chế độ máy bay, vì sẽ mất luôn cuộc gọi), gọi bằng số hư cấu đã gắn cờ (số này không nằm trong `SO_BI_BAO` của `TraCuu.kt`) | Thẻ đỏ hiện, logcat thẻ `LaChan` có "Gọi máy chủ hỏng" và "Cảnh báo khi đổ chuông". Ghi lại độ trễ từ lúc đổ chuông |
| V2 | AI phân tích bản ghi âm | Sau một cuộc gọi đến đã nghe máy, chia sẻ tệp ghi âm mẫu sang `ShareRecordingActivity` (mục 5.1, A4). Máy chủ phải có khóa Gemini | Màn "Phân tích cuộc gọi" có thẻ "AI nhận ra N dấu hiệu" và bản chép lời; phản hồi `/api/analyze/call` có `source` là `ai` |
| V3 | Màn Dừng lại | Sau cuộc gọi đáng ngờ, mở ứng dụng đóng vai ngân hàng (ô `app-thu`) | Màn đỏ DỪNG LẠI hiện trong 2 giây |
| V4 | Phân tích tin nhắn | `POST /api/analyze/message` với tin mẫu trên máy chủ có khóa | `source` là `ai`, có `signs` |
| V5 | Báo cuộc vừa nhận | Trên máy ảo bấm "Báo cuộc vừa nhận" ở màn Bé Nai sau cuộc gọi thật của máy ảo | Hiện câu trả lời của máy chủ ("Đã nhận báo cáo…"), `GET /api/cases` thấy báo cáo |
| V6 | Đội kiểm duyệt | Trên `/web`, đăng nhập mã 246810, mở hồ sơ số hư cấu thứ hai (5 máy báo, chưa duyệt), bấm xác nhận | Tra lại số đó ra mức Nghi ngờ |
| V7 | Khiếu nại | Trên app React, tra số đỏ, bấm "Số của tôi bị báo nhầm", xác minh | Tra lại ra Nghi ngờ kèm "Đang xét báo nhầm" |
| V8 | Thi đua lớp, trường, phường (tính năng đang làm) | Trên app React với máy chủ riêng đã có mã mới: chọn phường, trường, lớp; làm bài kiểm tra; xem thẻ "Xếp hạng nhóm" ở màn kết quả; đổi phạm vi | Điểm gửi lên máy chủ thật (không giả lập), dòng nhóm của Vy đổi thứ hạng sau khi nộp, ba phạm vi đều có dữ liệu, không hiện tên học sinh |

Kết quả từng cổng ghi vào `T/soat/cong-kiem.md` (đạt hoặc hỏng, kèm ảnh chụp và dòng nhật ký). Gói D (giọng) chỉ bắt đầu khi tệp này đủ 9 dòng (V0 đến V8).

## 4. Hạ tầng quay trên scoai

### 4.1 Dữ kiện

- scoai: 20 nhân, RAM 31 GB, GPU RTX 3060, đĩa trống khoảng 490 GB. Người dùng `minhhoang`, không có sudo, thuộc nhóm `docker`, không thuộc nhóm `kvm`. Docker chỉ có runtime runc.
- Trên máy chủ chưa có chromium, node, ffmpeg, adb: mọi thứ chạy trong container.
- Lệnh từ laptop:
  ```bash
  SS="ssh -F /dev/null -S $HOME/.ssh/scoai-eval.sock -o BatchMode=yes"; SRV=minhhoang@100.126.179.21
  $SS -O check $SRV            # socket còn sống thì mới làm tiếp; không gõ mật khẩu
  rsync -a -e "$SS" <nguồn> $SRV:lcs-video/trailer/<đích>
  ```
- Cấm: container `sc2-tradeagent` và thư mục của nó, cổng Funnel 8443, tên container không có tiền tố `lcs-`. Không mở cổng nào ra ngoài (`docker run` không có `-p`).

### 4.2 Thư mục

```
~/lcs-video/trailer/         (R, gắn vào container thành /t)
  sdk/        emulator/, platform-tools/, cmdline-tools/, system-images/android-34/google_apis/x86_64/
  avd/        lcs-trailer-ba.avd, lcs-trailer-minh.avd (+ .ini)
  repo/       bản chép kho cần cho quay (không có .env, .git, node_modules, android/)
  apk/        app-debug.apk
  cong-cu/    script quay (chép từ T/cong-cu)
  quay/       đoạn quay và tệp mốc, kéo về T/quay
  tam/        nhật ký, CSDL máy chủ riêng, HOME của container
```

### 4.3 Đưa Android SDK lên: cách nào nhanh và chắc

Kích thước trên laptop: `emulator` 853 MB, `platform-tools` 22 MB, system image 4,2 GB.

- **Chắc nhất:** rsync đúng các thư mục trên từ `~/Android/Sdk`. Cùng bản emulator 37.3.10 và cùng system image đã chạy được app này (thẻ đỏ, `gsm call`, cấp vai trò đều đã thử trên `lcs34`). Không cần Java, không phải chấp nhận giấy phép.
- **Nhanh nhất:** `sdkmanager` trong container tải thẳng từ Google bằng đường truyền máy chủ. Cần `openjdk-17-jre-headless` trong image và `cmdline-tools` (chép từ laptop). Bản tải về có thể mới hơn bản đã thử.
- **Chọn:** rsync `emulator`, `platform-tools`, `cmdline-tools` trước (dưới 1 GB). Với system image, đo tốc độ bằng 200 MB đầu: từ 3 MB/giây trở lên thì rsync nốt (khoảng 25 phút), chậm hơn thì dùng `sdkmanager "system-images;android-34;google_apis;x86_64"`. Dùng `rsync -a --partial --info=progress2` để nối lại được khi đứt.

### 4.4 Image và container

Một image dùng chung `lcs-trailer:1`, dựng trên scoai từ `node:22-bookworm-slim` (đã có sẵn), cài bằng apt: `chromium ffmpeg python3 python3-venv python3-pip openjdk-17-jre-headless procps unzip pulseaudio pulseaudio-utils fonts-noto-core` và các thư viện emulator cần (`libpulse0 libgl1 libnss3 libxkbfile1 libx11-xcb1 libxcb-cursor0 libxcomposite1 libxcursor1 libxi6 libxtst6 libasound2 libdbus-1-3 libxdamage1 libxrandr2 libxkbcommon0 libgbm1`). Trong image tạo venv và cài `server/requirements.txt`. Dockerfile đặt ở `T/cong-cu/Dockerfile`.

| Container | Việc | Lệnh chạy (rút gọn) |
|---|---|---|
| `lcs-trailer-emu` | 2 máy ảo, adb, máy chủ Lá chắn số riêng, ghi màn | `docker run -d --name lcs-trailer-emu --device /dev/kvm --cpus=12 --memory=16g --shm-size=2g -v ~/lcs-video/trailer:/t -e ANDROID_SDK_ROOT=/t/sdk -e ANDROID_AVD_HOME=/t/avd -e HOME=/t/tam/home lcs-trailer:1 sleep infinity` |
| `lcs-trailer-web` | Chromium, `ghi-trailer.mjs`, máy chủ Lá chắn số riêng thứ hai | như trên, bỏ `--device /dev/kvm`, `--cpus=8 --memory=8g` |
| `lcs-video-render` | Render Remotion (đã có quy trình) | `T/cong-cu/xuat-trailer.sh` |

Chạy bằng root trong container (đọc được `/dev/kvm`), cuối mỗi lượt `chown -R` về uid của `minhhoang` như `video/render.sh` đang làm.

**Máy chủ Lá chắn số riêng** (không đụng máy chủ demo công khai), chạy trong chính container cần nó, máy ảo gọi qua `http://10.0.2.2:8765`:
```bash
cd /t/repo/server && LCS_DEMO=1 LCS_DB=/t/tam/trailer.db LCS_NO_ENV_FILE=1 python chay-demo.py --no-https --port 8765
curl -s -X POST http://127.0.0.1:8765/api/demo/reset     # dữ liệu mẫu sạch
curl -s http://127.0.0.1:8765/api/stats                  # mong đợi total 120, linkPct 35 trước khi gắn cờ số thử
```
`app/dist`, `/prototype`, `/vendor`, `/web` đều do máy chủ này phục vụ (`server/lcs/main.py`), kèm tiêu đề cô lập nguồn cho trang gọi video.

**Khóa Gemini cho V2, V4** (máy chủ riêng cần khóa mới gọi được AI): không chép `.env` lên máy chủ, không đặt khóa trên dòng lệnh. Script `T/cong-cu/srv-len.sh` đọc đúng một dòng `GEMINI_API_KEYS=` từ stdin rồi `export` trước khi `exec python chay-demo.py`. Từ laptop: `grep '^GEMINI_API_KEYS=' $W/.env | $SS $SRV 'docker exec -i lcs-trailer-emu bash /t/cong-cu/srv-len.sh'`. Không bật `set -x`, không ghi biến môi trường ra nhật ký. Xong việc `docker rm -f` container là khóa mất theo. Cách này cần người dùng đồng ý (mục 10); nếu không, V2 và V4 trỏ sang máy chủ demo công khai.

**GPU:** mặc định máy ảo dùng `-gpu swiftshader_indirect`, Chromium dùng SwiftShader (20 nhân đủ cho giao diện 30 khung/giây). Chỉ thử GPU thật nếu `docker run --rm --gpus all lcs-trailer:1 nvidia-smi` chạy được; không chạy được thì thôi, không cài thêm gì lên máy chủ.

### 4.5 Cổng hạ tầng (làm trước mọi thứ, khoảng 30 phút)

| Cổng | Lệnh | Hỏng thì |
|---|---|---|
| G0 KVM trong container | `docker exec lcs-trailer-emu /t/sdk/emulator/emulator -accel-check` | Quay Android trên laptop, một máy ảo mỗi lần (mục 8.3) |
| G1 Ghi màn | Thử hai cách trên một đoạn cuộn 10 giây: `adb emu screenrecord start --fps 30 --bit-rate 20000000 /t/tam/thu.webm` (máy chủ mã hóa) và `adb shell screenrecord --bit-rate 20000000 --size 1080x2400 /sdcard/thu.mp4` (máy ảo mã hóa). Đếm khung trùng bằng `ffmpeg -vf mpdecimate` | Chọn cách ít khung trùng hơn. Cả hai kém thì giảm còn 720×1600 |
| G2 Hai máy ảo cùng lúc | Bật cả `ba` (cổng 5554) và `minh` (cổng 5556), `adb devices` thấy đủ | Chạy lần lượt, cảnh C4 ghép theo mốc |
| G3 Chromium | `chromium --headless=new --version` trong `lcs-trailer-web`, mở `http://127.0.0.1:8765/` chụp một ảnh | Sửa gói apt còn thiếu |

## 5. Danh sách cảnh quay

Đầu ra chung: `T/quay/<mã>.mp4`, H.264, CFR 30 khung/giây, `yuv420p`, CRF 16, không tiếng, `-movflags +faststart`. Kèm `T/quay/<mã>.moc.json`:
```json
{"ma": "a2", "nguon": "may-ao", "rong": 1080, "cao": 2400, "giay": 46.2,
 "moc": [{"ten": "do-chuong", "t": 1.20}, {"ten": "the-do", "t": 1.85}],
 "focus": {"the-do": {"x": 48, "y": 300, "w": 984, "h": 760}},
 "tieng": [{"tep": "benai-10.m4a", "t": 21.4}]}
```
`t` tính bằng giây từ khung đầu của tệp mp4. Đổi sang CFR: `ffmpeg -i vao -vf fps=30,format=yuv420p -c:v libx264 -crf 16 -preset medium -an -movflags +faststart ra.mp4`.

Số điện thoại hư cấu dùng trong mọi cảnh (đầu 01 không còn cấp cho thuê bao 10 số):

| Vai | Số | Dựng trước |
|---|---|---|
| Số bị cộng đồng báo (đỏ) | 0100 555 018 | `LCS_BASE=http://127.0.0.1:8765 python3 tools/flag_test_number.py danger so-do.txt` (10 máy báo, 2 phiếu) |
| Số lạ chưa ai báo | 0100 555 042 | không dựng gì |
| Số chờ đội duyệt (cho W9) | 0100 555 077 | `flag_test_number.py pending so-cho.txt` (5 máy, chưa duyệt) |
| Số của Minh lưu trên máy bà | 0100 555 020 | ghi vào `so-nguoi-than` |

Không chạy `flag_test_number.py reset` hay `/api/demo/reset` trên máy chủ demo công khai: lệnh đó xóa mọi cờ người dùng đã gắn.

### 5.1 Máy ảo Android (gói A, container `lcs-trailer-emu`)

**Chuẩn bị một lần** (script `T/cong-cu/emu-dung.sh`):

1. Tạo AVD không cần Java: chép `~/.config/.android/avd/lcs34.avd/config.ini` từ laptop làm mẫu vào `/t/avd/lcs-trailer-ba.avd/config.ini` và `lcs-trailer-minh.avd/config.ini`, sửa `hw.ramSize=4096`, `disk.dataPartition.size=4G`; viết `lcs-trailer-ba.ini` (`path=/t/avd/lcs-trailer-ba.avd`, `target=android-34`). Dự phòng: `avdmanager create avd -n … -k "system-images;android-34;google_apis;x86_64" -d pixel_6`.
2. Bật: `emulator -avd lcs-trailer-ba -port 5554 -no-window -no-boot-anim -no-snapshot -gpu swiftshader_indirect -memory 4096 -cores 4 -timezone Asia/Ho_Chi_Minh` (máy Minh: `-avd lcs-trailer-minh -port 5556`). Thêm `-no-audio` nếu không thử bơm giọng. Luôn gọi `adb -s emulator-5554` hoặc `-s emulator-5556`, không bao giờ gọi `adb` trần.
3. Tiếng Việt và thanh trạng thái sạch: `adb root; adb shell "setprop persist.sys.locale vi-VN; stop; start"`; `settings put global sysui_demo_allowed 1`; `am broadcast -a com.android.systemui.demo -e command enter`, rồi `-e command notifications -e visible false`, `-e command battery -e level 100 -e plugged false`, `-e command network -e wifi show -e level 4`. `locksettings set-disabled true`, `settings put system screen_off_timeout 600000`.
4. APK: `W/android/app/build/outputs/apk/debug/app-debug.apk` (dựng 01:28 ngày 26/11, không có tệp nguồn nào mới hơn lúc lập kế hoạch; gói A kiểm lại bằng `find … -newer`). Nếu phải dựng lại thì dựng trên laptop theo `BAN-GIAO.md` mục 6, token đọc từ `~/.local/share/lcs/lcs-token`, không in. Cài: `adb install -r -g apk` (`-g` cấp sẵn quyền cuộc gọi, nhật ký, danh bạ, micro, thông báo).
5. Vai trò và quyền đặc biệt, với `P=vn.doi18.lachanso`:
   ```bash
   adb shell cmd role add-role-holder android.app.role.CALL_SCREENING $P
   adb shell appops set $P SYSTEM_ALERT_WINDOW allow
   adb shell appops set $P GET_USAGE_STATS allow
   adb shell appops set $P USE_FULL_SCREEN_INTENT allow
   adb shell cmd notification allow_listener $P/$P.NgheThongBao
   adb shell dumpsys deviceidle whitelist +$P
   ```
6. Cài đặt của app (ghi `shared_prefs/cai-dat.xml` qua `run-as` lúc app đã `force-stop`, theo cách của `tools/nap-khoa.py`): `may-chu` = `http://10.0.2.2:8765`, `trinh-dien` = true, `so-thu` = `0100555018,0100555042`, `ten-nguoi-than` = `Minh`, `so-nguoi-than` = `0100555020`, `xung-ho` = `bà`, `app-thu` = gói ứng dụng đóng vai ngân hàng. Với xưng hô "bà" và tên "Minh", app phát đúng các tệp thu sẵn `res/raw/benai_10..13`, không cần giọng đọc của máy.
   Vai trong app React: máy bà chọn "Người lớn tuổi", máy Minh chọn "Người thân" và nhập mã `gia-dinh-hoa`. Lái trang trong WebView bằng `adb forward tcp:9222 localabstract:webview_devtools_remote_$(adb shell pidof $P)` và `ban-giao/cong-cu/cdp-eval.mjs`; tìm tọa độ nút bằng `ban-giao/cong-cu/ui.py` hoặc `uiautomator dump`.
7. Thử bơm giọng (V0, giới hạn 45 phút): bỏ `-no-audio`, chạy `pulseaudio -D --exit-idle-time=-1`, `pactl load-module module-null-sink sink_name=mic`, `pactl set-default-source mic.monitor`, bật máy ảo với `-allow-host-audio`; lúc màn hiện "Bé Nai đang nghe…" thì `paplay --device=mic ba-co.wav`. Không được thì quay bằng cách chạm nút "Có" (`vn.doi18.lachanso:id/nutCo`) đúng lúc trạng thái đang là "Bé Nai đang nghe…", tiếng bà đặt ở khâu dựng (cần người dùng đồng ý, mục 10).
8. Ứng dụng đóng vai ngân hàng: trang tĩnh `T/cong-cu/ngan-hang-mau.html` (chữ "Ngân hàng mẫu · minh họa", không logo thật) mở bằng `org.chromium.webview_shell` có sẵn trong máy ảo; ghi tên gói đó vào `app-thu`.

**Các đoạn quay:**

| Mã, tệp | Dùng ở | Thao tác | Dài | Khoảnh khắc chính (mốc) |
|---|---|---|---|---|
| A1 `a1-so-la.mp4` | C0, C2 | Tắt màn (`input keyevent SLEEP`), bắt đầu ghi, `adb emu gsm call 0100555042`, chờ 9 s, `adb emu gsm cancel 0100555042` | 12 s | `do-chuong`: màn cuộc gọi đến toàn màn hình, không có thẻ nào |
| A2 `a2-cuoc-goi.mp4` (máy bà) và M1 `m1-may-minh.mp4` (máy Minh, ghi cùng lúc, chung đồng hồ) | C2, C3, C4, C6 | Máy Minh: `force-stop` app rồi mở lại và về màn chính trước khi ghi. Máy bà: tắt màn, ghi, `gsm call 0100555018`, chờ 7 s, `gsm accept 0100555018`, chờ 8 s, `gsm cancel 0100555018`. Chờ màn "Bé Nai hỏi thăm" và tiếng hỏi (7 s), trả lời "Có" (giọng bơm vào hoặc chạm nút), chờ "Đã báo cho Minh · giờ". Máy Minh: chờ thông báo (tối đa 15 s theo vòng hỏi của `FamilyAlertWatcher`), chạm thông báo, màn `#/canh-bao/<id>` mở, cuộn xuống | 50 s | `the-do`, `nghe-may`, `cup-may`, `be-nai-hoi` (tiếng `benai-10`), `dang-nghe`, `tra-loi-co`, `nguy-hiem`, `da-bao-minh` (tiếng `benai-11`); trên M1: `thong-bao-roi`, `cham`, `chi-tiet` |
| A3 `a3-mat-mang.mp4` | C2 nếu V1 đạt | Theo cổng V1, ghi lúc gọi | 12 s | `the-do-mat-mang`, kèm độ trễ đo được |
| A4 `a4-ghi-am.mp4` | C3 nếu V2 đạt | Sau một cuộc gọi đến đã nghe (để có sự kiện `call_log` trong 6 giờ): đẩy `ghi-am-mau.m4a` vào `/sdcard/Download`, lấy `content://` từ MediaStore (`adb shell content query --uri content://media/external/file …`), `adb shell am start -a android.intent.action.SEND -t audio/mp4 --eu android.intent.extra.STREAM <uri> --grant-read-uri-permission -n $P/.ShareRecordingActivity` (chạy dưới `adb root`). Chờ màn "Phân tích cuộc gọi", cuộn tới bản chép lời | 30 s | `dang-chep-loi`, `ket-qua-ai`, `ban-chep-loi` |
| A5 `a5-dung-lai.mp4` | C4 nếu V3 đạt | Trong 2 phút sau A2 (khoảng canh ở chế độ trình diễn): `am start` trang ngân hàng mẫu | 10 s | `dung-lai` (tiếng `benai-13`) |
| A6 `a6-bao-cao.mp4` | C6 nếu V5 đạt | Ở màn Bé Nai sau một cuộc gọi thật khác của máy ảo: chạm "Báo cuộc vừa nhận" (`id/reportCall`), chờ câu trả lời | 15 s | `bam-bao`, `da-nhan-bao-cao` |
| A7 `a7-trang-chu.mp4` | dự trữ cho C1, C7 | Mở app, trang chủ bà Hoa "Lá chắn đang bật" | 5 s | `trang-chu` |

Tệp `ghi-am-mau.m4a` cho A4: ghép bằng ffmpeg từ các câu đã có trong `prototype/hoc/giong/b01/`: `gn-05` (xưng cán bộ điều tra), `bh-02` (bà hoảng), `gn-06` (đòi chuyển tiền), `gn-07` (dặn giấu con cháu). Không thu thêm giọng.

Mốc thời gian: script quay ghi giờ của từng lệnh so với lúc bắt đầu ghi; sau khi đổi sang CFR, `T/cong-cu/tinh-moc.py` dời mỗi mốc tới điểm đổi cảnh gần nhất trong ±1,5 giây (`ffmpeg -vf "select='gt(scene,0.02)',showinfo"`), rồi xuất ảnh tại từng mốc để soát bằng mắt.

Lưu ý hình: số hiển thị trên màn cuộc gọi đến có thể bị máy ảo định dạng kiểu Mỹ. Nếu vậy, đổi vùng SIM hoặc chấp nhận dạng liền `0100555018`; không sửa hình ở khâu dựng.

### 5.2 Trình duyệt (gói B, container `lcs-trailer-web`)

Công cụ: `T/cong-cu/ghi-trailer.mjs`, bản sao của `video/capture/ghi.mjs` thêm ba thứ ở cấp kịch bản: `mobile: true|false`, `init` (script chạy trước mọi trang, như `mock()` trong công cụ chụp `khop-react/tool/cfg.mjs`), và `goto` nhận đường dẫn đầy đủ. Giữ nguyên phần ghi mốc tiếng gốc (`type: "audio"`), ghi `focus`, và `cat.py` để cắt đoạn.

Luật giả lập: chỉ chặn WebSocket, đăng ký máy và giọng đọc của trình duyệt. **Không giả lập kết quả tra cứu, phân tích, báo cáo, phiếu duyệt, khiếu nại**: các cảnh này gọi máy chủ riêng thật, vì lời dẫn nói về chúng.

Khổ điện thoại: 393×873, tỉ lệ 3 (ra 1179×2619). Khổ web: 1440×810, tỉ lệ 2. Địa chỉ gốc `http://127.0.0.1:8765`.

| Mã, tệp | Dùng ở | Địa chỉ và thao tác | Dài | Khoảnh khắc chính |
|---|---|---|---|---|
| W1 `w1-tra-so.mp4` | C2 | `/?mode=full#/kiem-tra?loai=phone`, gõ `0100 555 018`, bấm Kiểm tra | 8 s | `ket-qua-do` (Nguy hiểm, 10 máy) |
| W2 `w2-tin-nhan.mp4` | C2 | `/?mode=full#/kiem-tra?loai=text&v=<tin mẫu việc nhẹ lương cao trong DemoActions.kt>&tudong=1` | 8 s | `to-do` (các cụm được tô), `focus` từng cụm |
| W3 `w3-duong-dan.mp4` | C2 | `/?mode=full#/kiem-tra?loai=text&v=qua-tri-an-khach-hang.top&tudong=1` | 6 s | `ket-qua-vang` |
| W4 `w4-thu-vien.mp4` | C5 | `/prototype/hoc.html` | 5 s | `thu-vien` (4 bài) |
| W5 `w5-truyen.mp4` | C5 | `/prototype/hoc.html?bai=2&phan=a`, đi tới điểm rẽ, chọn "Dừng lại, hỏi cô giáo" | 20 s | `diem-re`, `chon-dung`; mốc tiếng Bé Nai |
| W6 `w6-goi-video.mp4` | C5 | `/prototype/video-call.html?canh=lan-2&auto=1`, `LCS_THREADS=6` | 30 s, dùng 4 s | `chi-lan-noi`, mốc tiếng `lan/*.m4a`; đo khẩu hình bằng `video/thao-tac/do-mieng.py` |
| W7 `w7-kiem-tra.mp4` | C5 | `/?mode=full#/kiem-tra-bai`, chọn một đáp án, bấm Trả lời | 8 s | `giai-thich` |
| W11 `w11-xep-hang.mp4` | C5 nếu V8 đạt | Nối tiếp W7 trên cùng phiên: trả lời hết bài, tới màn kết quả (`QuizResult` trong `app/src/v3/screens/Student.jsx`, khung Figma `A12c-ket-qua.png`), chờ thẻ "Xếp hạng nhóm", đổi ô phạm vi sang "các trường trong phường". **Route, dữ liệu dựng trước và phần được phép giả lập do điều phối báo lại khi làm xong tính năng; gói B không tự đoán.** Cần trạng thái dựng trước sao cho nhóm của Vy đứng ngay dưới một nhóm khác, để điểm vừa nộp làm nhóm lên đúng một bậc | 12 s, dùng 4–5 s | `diem`, `the-xep-hang`, `len-bac`, `doi-pham-vi`; `focus` thẻ xếp hạng và dòng nhóm của Vy |
| W8 `w8-thong-ke.mp4` | C6 (nền) | `/web`, mã 246810, trang Tổng quan. **Quay trước khi gắn cờ số thử**, trên CSDL vừa đặt lại, để ra 120 và 35% | 8 s | `tong-quan` |
| W9 `w9-kiem-duyet.mp4` | C6 | `/web`, mục Kiểm duyệt, mở hồ sơ `0100 555 077`, bấm xác nhận, ghi lý do | 15 s | `mo-ho-so`, `xac-nhan`, `len-vang` |
| W10 `w10-khieu-nai.mp4` | C6 | `/?mode=full#/kiem-tra?loai=phone&v=0100555018&tudong=1`, bấm "Số của tôi bị báo nhầm", nhập số liên hệ hư cấu, xác minh | 15 s | `gui-khieu-nai`, `dang-xet` (đỏ hạ vàng). Quay sau cùng vì làm đổi mức của số đỏ |

Thứ tự bắt buộc trên một CSDL: đặt lại, W8, gắn cờ ba số thử, W1 đến W7, W11, W9, W10. W11 chỉ quay sau khi kho đã có mã thi đua: chép lại `repo/` lên scoai và dựng lại `app/dist` trước (bản `app/dist` hiện có dựng lúc 01:26 ngày 26/11, chưa có tính năng này). Tên trường trong dữ liệu minh họa là tên hư cấu đặt trong phường có thật: giữ nhãn "Dữ liệu minh họa" trên hình. Gói A dùng CSDL riêng của container `lcs-trailer-emu`, không chung với gói B.

Che số: màn web đội và danh sách hồ sơ có các số mẫu của kho (ví dụ 0912 345 678, 028 9999 1234), có thể trùng số của người thật. Ưu tiên khung hình chỉ có số hư cấu; mọi số khác lọt vào khung phải che bằng lớp mờ ở khâu dựng. Mã xác minh thử hiện trên màn khiếu nại cũng che.

## 6. Giọng, nhạc, âm thanh

### 6.1 Lời dẫn (gói D, chạy trên laptop, nhẹ)

1. Chốt lời theo `T/soat/cong-kiem.md`, ghi `T/loi/loi-dan.json` (mỗi câu: mã S, bản hiển thị, bản TTS) và `T/loi/loi-dan-tts.txt` (một đoạn, mỗi câu một dòng).
2. Thu **một lượt** bằng bản sao `T/cong-cu/thu-giong.py` của `video/tao-giong-gemini-mot.py` (chỉ đổi `STYLE` theo mục 2.3), `TTS_VOICE=Kore`, khóa nạp vào môi trường bằng `set -a; . $W/.env; set +a` không in ra. Kiểm `finish` là `STOP` và độ dài tiếng 62–76 giây. Lệch thì sửa lời rồi thu lại cả lượt, không vá từng câu.
3. Cắt cụm nhiễu ở đuôi lượt thu (hàm `cat_nhieu_duoi` trong `android/doc_giong.py`).
4. Căn mốc từng câu bằng Whisper trên scoai (`video/thao-tac/can-cau.py`, cách gọi như `giong.py can`), tách theo câu, rồi `python3 video/loc-giong-buoc.py <thư mục>` (lọc rẹt, đỉnh −3,6 dBFS, mờ dần 20 và 30 ms).
5. Nghe lại bằng máy theo hai cách độc lập: `tools/nghe-lai.py` hỏi đích danh "có đọc lẫn lời dặn giọng không, ở giây nào" trên cả lượt; và so từng ký tự bản chép Whisper với lời đã gửi. Đo cụm nổ bằng `loc-giong-buoc.py --do`.
6. Người dùng nghe một lần bản đã lọc trước khi dựng. Không báo "đã kiểm giọng" khi mới chạy một cách kiểm.

### 6.2 Tiếng trong app

| Tiếng | Nguồn | Xử lý |
|---|---|---|
| Bé Nai hỏi | `prototype/audio/benai-10.m4a` (7,06 s) | Cắt lấy câu hỏi ở điểm lặng, mờ dần 20 ms |
| Bé Nai báo Minh, nhắc dừng | `benai-11.m4a` (4,81 s), `benai-13.m4a` (4,14 s) | Đặt theo mốc, nhỏ hơn lời dẫn 6 dB |
| Kẻ gian (mở đầu), ghi âm mẫu | `prototype/hoc/giong/b01/gn-05, gn-06, gn-07, bh-02` | Lọc dải điện thoại; **nghe lại bằng máy trước khi dùng** vì bộ này chưa được nghe lại (`BAN-GIAO.md` mục 9) |
| Chị Lan | `prototype/audio/lan/*.m4a` theo mốc của W6 | Như `dung.py` đang làm với tiếng gốc |
| Bà Hoa nói "Có" | Chưa có tệp. Thu một lượt riêng giọng Gacrux (giọng bà Hoa trong `tools/giong-bai-hoc.json`): "Có. … Có. … Dạ có." rồi chọn | Lọc rẹt. Clip dưới 1 giây máy nghe không đáng tin: **cần người dùng nghe** |

### 6.3 Hiệu ứng âm thanh

Tự tổng hợp bằng numpy trong `T/cong-cu/am-thanh.py`, không dùng tệp ngoài nên không vướng giấy phép: chuông (hai tần số 440 và 480 Hz, nhịp 0,5 s kêu, 0,2 s nghỉ, như `ringOnce` trong `app/src/lib/sound.js`), rung (xung vuông 150 Hz), tiếng dội trầm (sin trượt 80 xuống 40 Hz), tiếng lướt (nhiễu lọc quét), tiếng thông báo (hai nốt), trống nhẹ ba nhịp ở C7. Ra `T/am/*.wav`.

### 6.4 Nhạc nền (gói C)

Tiêu chí:
- Không lời. Mở thưa và trầm trong 10–15 giây đầu, sáng dần, có một điểm bung quanh giây 55–65 (đầu trụ cộng đồng), kết về chủ âm.
- Dài từ 95 giây, hoặc cắt ghép được ở ranh giới câu nhạc. Nhịp 70–100 phách mỗi phút. Không trống dồn, không kèn chói đè lên giọng nữ.
- Giấy phép cho phép dùng trong video và trình chiếu nơi công cộng: phạm vi công cộng, CC0, hoặc CC BY (ghi công ở khung cuối). Không dùng CC BY-NC, CC BY-ND, không dùng nhạc của YouTube Audio Library (điều khoản gắn với YouTube).
- Lưu bằng chứng: `T/nhac/GIAY-PHEP.md` ghi địa chỉ trang bài nhạc, tên tác giả, tên giấy phép, ngày xem, và ảnh chụp trang.

Ứng viên. Tôi chắc về nguồn và loại giấy phép của hai tác giả đầu; **tên bài và độ hợp phải mở trang, nghe và đối chiếu giấy phép trước khi tải**:

| Ứng viên | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| Scott Buckley, "A Kind Of Hope" (dự phòng cùng tác giả: "Hiraeth") | scottbuckley.com.au | CC BY 4.0 | Điện ảnh, cảm xúc, có đoạn dâng. Ghi công: "Nhạc: 'tên bài' của Scott Buckley, CC BY 4.0" |
| Kevin MacLeod, "Inspired" (dự phòng: "Deliberate Thought") | incompetech.com | CC BY 4.0 | Piano sáng, dễ đặt dưới giọng đọc |
| Một bài không lời trên Pixabay Music | pixabay.com/music | Giấy phép nội dung Pixabay (dùng tự do, không bắt ghi công, không phải CC0) | Chưa có tên bài cụ thể. Chỉ chọn nếu hai ứng viên trên không hợp |

Phối: lời dẫn làm chuẩn; nhạc hạ 12–14 dB khi có lời hoặc tiếng trong app, trả lại trong 0,4 giây (khóa âm lượng theo mốc câu trong Remotion). Sau render chạy `loudnorm` hai lượt về −16 LUFS, đỉnh thật không quá −1,5 dBTP, AAC 192 kb/s 48 kHz.

## 7. Dựng và render (gói E)

- Mã mới, không sửa bộ video demo: `video/remotion/src/trailer/` gồm `Trailer.tsx` (ghép cảnh theo dữ liệu), `canh/C0.tsx` đến `C7.tsx` (mỗi cảnh một tệp để chia việc không đụng nhau), `bo/` (`Phone.tsx`, `Cay.tsx`, `Vong.tsx`, `SoiNoi.tsx`, `SongAm.tsx`, `Nui.tsx`, `Nhan.tsx`, `PhuDe.tsx`, `mau.ts`). Dùng lại `src/ui.tsx` (`Words`, `Pop`, `Chip`, `FloatCrop`, `Caption`, `Counter`, `Background`). Thêm composition `LCSTrailer` vào `src/Root.tsx` (chỉ gói E sửa tệp này).
- Dữ liệu: `T/cong-cu/dung-trailer.py` đọc mốc câu của giọng, các `*.moc.json`, lưới phách nhạc, rồi ghi `video/remotion/src/data/trailer.json` (mỗi cảnh: khung bắt đầu, khung kết thúc, đoạn quay, điểm vào, mốc, tiếng). Ranh giới cảnh đi theo mốc câu thật, không theo ước lượng ở mục 2. Script in tổng độ dài và báo lỗi nếu ngoài 88–93 giây hoặc lời đè lên tiếng trong app.
- Tệp cho Remotion: `video/remotion/public/trailer/{quay,giong,am,nhac,anh}` (chép từ `T`).
- Trước khi có giọng thật: dựng bản nháp với độ dài câu ước theo 13,5 ký tự mỗi giây và hình giữ chỗ, để gói E làm song song với gói A, B.
- Render: `T/cong-cu/xuat-trailer.sh`, bản sao của `video/thao-tac/xuat.sh` với `COMPS=LCSTrailer`, bỏ bước `giong.py` và `dung.py v1`, thêm chế độ ảnh tĩnh (`npx remotion still src/index.ts LCSTrailer out/anh/<khung>.jpg --frame=<khung>`) và chế độ nháp (`EXTRA="--scale=0.5"`). Cần `LCS_RENDER_HOST`. Lưu ý `xuat.sh` rsync `public/` có `--delete`: đoạn quay phải nằm ở laptop trước khi render, không để riêng trên máy chủ.
- Bản giao: `T/ban/LCS-trailer.mp4` (1920×1080, 30 khung/giây, H.264 CRF 18, AAC 192 kb/s, `+faststart`), thêm `LCS-trailer-nhe.mp4` (hai lượt, 8 Mb/s) để dự phòng máy chiếu yếu. 10 khung đầu mờ dần từ đen.

## 8. Chia gói việc, phụ thuộc, rủi ro

### 8.1 Gói việc (subagent dùng model Opus, chia theo thư mục để không đụng nhau)

| Gói | Việc | Viết vào | Phụ thuộc |
|---|---|---|---|
| H Hạ tầng scoai | Dockerfile, image, rsync SDK và kho, hai AVD, cổng G0 đến G3, `srv-len.sh` | `T/cong-cu/` (Dockerfile, `sv.sh`, `emu-dung.sh`, `srv-len.sh`), `R` | Người dùng đồng ý các điểm 1, 2 ở mục 10 |
| A Android | Cổng V0, V1, V2, V3, V5; quay A1 đến A7 và M1; tệp mốc | `T/cong-cu/quay-a*.sh`, `tinh-moc.py`, `T/quay/a*, m1*`, `T/soat/cong-kiem.md` | H |
| B Trình duyệt | `ghi-trailer.mjs`; cổng V4, V6, V7, V8; quay W1 đến W11 | `T/cong-cu/ghi-trailer.mjs`, `T/cong-cu/kich-ban-web/`, `T/quay/w*` | H (cổng G3). Riêng V8 và W11 chờ điều phối báo tính năng thi đua đã xong |
| C Nhạc và âm thanh | Chọn nhạc, giấy phép, lưới phách; tổng hợp hiệu ứng; xử lý tiếng trong app | `T/nhac/`, `T/am/` | không |
| D Giọng | Chốt lời, thu, căn, lọc, nghe lại; tiếng "Có" của bà | `T/loi/`, `T/giong/` | A và B xong các cổng kiểm |
| E Dựng | Bộ thành phần, tám cảnh, dữ liệu, render nháp, render chính | `video/remotion/src/trailer/`, `T/cong-cu/dung-trailer.py`, `xuat-trailer.sh`, `T/ban/` | Nháp: không. Bản chính: A, B, C, D |
| F Soát | Mục 9, độc lập với người làm | `T/soat/` | E |

Gói E có thể tách ba subagent theo tệp cảnh: (C0, C1, C7 và bộ cây, vòng, núi), (C2, C3, C4 và `Phone`, sóng âm, sợi nối), (C5, C6).

### 8.2 Thứ tự

1. H làm cổng G0 đến G3. Cùng lúc: C bắt đầu, E dựng bộ thành phần và bản nháp với hình giữ chỗ.
2. A và B chạy song song (hai container khác nhau, hai CSDL khác nhau).
3. Cổng kiểm đủ, phản biện lời dẫn (mục 9.3), người dùng duyệt lời, rồi D thu giọng.
4. E ghép bản chính, render nháp nửa cỡ, F soát, sửa, render chính, F soát lại.
5. Dọn: `docker rm -f lcs-trailer-emu lcs-trailer-web`, giữ `R/quay`, xóa `R/tam`.

### 8.3 Rủi ro và cách giảm

| Rủi ro | Giảm |
|---|---|
| `/dev/kvm` không dùng được trong container | Cổng G0 kiểm trước tiên. Dự phòng: quay Android trên laptop, một máy ảo mỗi lần, AVD tên riêng `lcs-trailer-*`, cổng 5580, sau khi đóng các phiên khác (laptop còn khoảng 1,8 GB RAM trống, đĩa trống 22 GB). Cảnh C4 khi đó quay lần lượt: ghép máy Minh trước rồi tắt, quay máy bà, bật lại máy Minh |
| Máy ảo không nhận giọng tiếng Việt, không có micro | Giới hạn 45 phút cho V0. Dự phòng chạm nút "Có", tiếng bà đặt ở khâu dựng. Tính năng đã kiểm trên máy thật |
| Ghi màn máy ảo rớt khung khi dựng hình bằng phần mềm | Cổng G1 chọn cách ghi; cấp 4 nhân mỗi máy ảo; không chạy Chromium trong cùng container lúc ghi |
| Khẩu hình chị Lan giật | Chỉ dùng 4 giây; đo bằng `do-mieng.py`; scoai không chạy chế độ tiết kiệm pin như laptop. Dự phòng: quay riêng W6 trên laptop có GPU thật theo `video/CHAY-LAI.md` (cắm sạc) |
| Máy chủ riêng không gọi được AI (khóa, hạn mức) | V2, V4 hỏng thì dùng câu thay thế. Hạn mức Gemini tính theo phút: gọi giãn ra |
| Lượt thu giọng bị cụt, đọc lẫn lời dặn, tiếng rẹt | Kiểm `finish`, hai cách nghe lại, lọc; thu lại cả lượt khi sai |
| Lời dài hơn 93 giây | `dung-trailer.py` báo lỗi; áp luật ở mục 2.2; cắt câu thì thu lại cả lượt |
| Rò khóa | Khóa chỉ đi qua stdin vào môi trường tiến trình; không `set -x`; `repo/` trên máy chủ không có `.env`; soát `R/tam/*.log` bằng `grep -c AIza` trước khi kết thúc |
| Đụng việc của phiên khác hoặc của `sc2-tradeagent` | Tên container `lcs-trailer-*`, không mở cổng, giới hạn `--cpus` và `--memory`, chỉ ghi trong `~/lcs-video/trailer` và `~/lcs-video/render` |
| Lộ số thật | Bảng số hư cấu ở mục 5; che số mẫu của kho; soát ở mục 9 |
| Đường truyền laptop chậm khi rsync 5 GB | Đo trước, chuyển sang `sdkmanager` cho system image |
| Nhạc sai giấy phép hoặc tên bài không đúng | Mở trang gốc, chụp giấy phép, mới tải |

## 9. Kiểm chất lượng trước khi giao

### 9.1 Hình và chữ

1. Ảnh tĩnh từng cảnh: với mỗi câu S, render khung ở mốc bắt đầu câu + 0,8 giây và khung giữa cảnh; ghép tờ soát `T/soat/canh-<C>.jpg`. Với mỗi chuyển cảnh, render dải 6 khung liên tiếp để xem chuyển động.
2. Đối chiếu từng màn trong máy với ảnh đã khớp thiết kế ở `khop-android/`, `khop-react/`, `khop-bai-hoc/` và khung Figma `~/Doi18_De4/1-Thiet-ke-giao-dien/khung-png/` (chỉ đọc).
3. Chữ tiếng Việt: soát dấu trên mọi chữ của khâu dựng (đặc biệt "ợ, ữ, ặ, ẳ"), chữ không tràn khung, không bị cắt; phụ đề khớp đúng lời hiển thị trong `loi-dan.json`.
4. Không lộ số thật: liệt kê mọi dãy số xuất hiện trên ảnh soát, chỉ được có các số ở mục 5 hoặc số đã che.
5. Không có thứ đã bỏ: `grep -rniE "zalo|mini app|chuỗi ngày" video/remotion/src/trailer T/loi` phải rỗng; soát bằng mắt các đoạn quay; không có biểu trưng Đồng Nai, không logo ngân hàng thật.
6. Nhãn "Dữ liệu minh họa · Quay trên máy ảo Android" có mặt ở mọi khung có hình sản phẩm; nhãn "Mô phỏng · giọng AI đóng vai" có ở C0; nhãn "AI đóng vai" thấy được ở W6.
7. Mỗi câu lời dẫn đối chiếu với `cong-kiem.md`: câu nào nói về việc chưa đạt thì không được có mặt.

### 9.2 Tiếng và thông số

1. `ffprobe`: 1920×1080, `r_frame_rate` 30/1, độ dài 88–93 giây, H.264 và AAC.
2. Âm lượng: `ffmpeg -af ebur128` ra khoảng −16 LUFS, đỉnh thật không quá −1,5 dBTP; không có cụm nổ (`loc-giong-buoc.py --do` trên bản xuất).
3. Nghe lại bản xuất bằng `tools/nghe-lai.py` (chép lời, so với lời đã chốt) và soát chỗ lời dẫn đè tiếng trong app.
4. Người dùng xem và nghe trọn một lần trên loa ngoài trước khi chốt. Phần mượt của chuyển động và tiếng ngắn dưới 1 giây chỉ người mới đánh giá được.

### 9.3 Phản biện bằng Codex Astra (theo yêu cầu người dùng)

Ba lượt, mỗi lượt đưa đúng tài liệu cần xét, chạy nền vài phút, kết quả lưu `T/soat/astra-<lượt>.md`:

| Lượt | Lúc nào | Đưa gì | Hỏi gì |
|---|---|---|---|
| 1 | Sau khi có kế hoạch này | `KE-HOACH.md` | Lỗ hổng kỹ thuật, bước thiếu, rủi ro chưa tính, chỗ lời dẫn nói quá sự thật |
| 2 | Trước khi thu giọng | `loi-dan.json`, `cong-kiem.md` | Câu nào chưa có bằng chứng, câu nào khó nghe, nhịp có vừa 90 giây không |
| 3 | Sau bản dựng nháp | Tờ ảnh soát và `trailer.json` | Cảnh nào rối, chữ nào khó đọc trên màn chiếu, chỗ nào nhịp chùng |

**Trạng thái lượt 1: đã chạy** (phiên điều phối, 26/11). Kết quả: `T/soat/astra-1.md`. Phần nhận và cách sửa: mục 11.

Lệnh (theo `BAN-GIAO.md` mục 8): `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.2-astra -c service_tier=fast -c model_reasoning_effort=high -o video/trailer/soat/astra-1.md - < video/trailer/soat/astra-1-loi-nho.txt` (lượt 2, 3 đổi tên tệp). Lời nhờ phải dặn không mở `.env` và tệp token. Nhận xét của Astra được đội đối chiếu rồi mới sửa; Astra không viết giao diện.

## 10. Điểm cần người dùng quyết

1. **Chạy máy ảo trên scoai:** đồng ý chạy container có `--device /dev/kvm` trong `~/lcs-video/trailer` không (khác với luật "không đụng máy chủ dựng hình" trong `BAN-GIAO.md`)? Căn câu Whisper có được tiếp tục đọc venv trong `~/sc2-tradeagent/asr` như lúc làm video demo không?
2. **Khóa Gemini trên scoai:** cho đưa `GEMINI_API_KEYS` vào môi trường của một container tạm (qua stdin, không ghi ra tệp) để kiểm V2, V4, hay để hai cảnh đó gọi máy chủ demo công khai?
3. **Số điện thoại:** dùng số hư cấu `0100 555 018` (đầu số không có thật) hay giữ số mẫu quen thuộc của kho `0912 345 678`? Kế hoạch đang chọn số hư cấu và che số mẫu.
4. **Những việc chưa kiểm trên máy thật** (thẻ đỏ khi mất mạng, AI nghe bản ghi âm, màn Dừng lại, báo cáo từ máy nhận, đội duyệt trên web, khiếu nại): kiểm đạt trên máy ảo và máy chủ riêng là đủ để đưa vào lời, hay phải kiểm thêm trên máy thật? Trụ cộng đồng (S16 đến S18) phụ thuộc câu trả lời này.
5. **Tiếng "Có" của bà Hoa:** nếu máy ảo không nhận được giọng, có chấp nhận quay bằng chạm nút đúng lúc "Bé Nai đang nghe…" và đặt tiếng bà ở khâu dựng không? Giọng bà lấy Gemini Gacrux như trong bài học được không?
6. **Giọng kẻ gian ở phần mở** (2,5 giây, giọng AI có nhãn "Mô phỏng"): dùng hay bỏ?
7. **Lời và câu kết:** duyệt 23 câu ở mục 2.1 (S1 đến S22 và S13b). Câu tục ngữ chia hai nửa (nửa đầu ở phần mở, nửa sau ở phần kết) hay đọc trọn ở cuối? Dòng chữ cuối ghi "Đội 18 · Hackathon thành phố Đồng Nai 2026" có đúng tên gọi chính thức không?
8. **Nhạc:** chấp nhận nhạc CC BY có dòng ghi công nhỏ ở khung cuối không, hay chỉ dùng nhạc không phải ghi công?
9. **Phụ đề:** hội trường có thể khó nghe. Bật phụ đề nhỏ suốt video (mặc định của kế hoạch) hay chỉ để chữ động chính?
10. **Hạn giao và nơi chiếu:** giờ cần có bản chốt, máy chiếu phát bằng máy nào (để chọn bản thường hay bản nhẹ).

## 11. Quyết định của điều phối và phần sửa theo phản biện lượt 1 (ưu tiên hơn các mục trên khi khác nhau)

Ghi ngày 26/11/2026. Người dùng dặn "hoàn thành kế hoạch thì triển luôn", và "trailer không cần số liệu quá thực tế, chỉ cần logic xếp hạng hấp dẫn". Các điểm ở mục 10 được chốt như sau:

| Điểm mục 10 | Chốt |
|---|---|
| 1. Máy ảo trên scoai | Chạy được (người dùng đề nghị dùng scoai). Container `lcs-trailer-*` có `--device /dev/kvm`. **Không đọc gì trong `~/sc2-tradeagent`**, kể cả venv Whisper. Căn câu: tách theo khoảng lặng (lời thu một lượt, nghỉ giữa câu), so số câu; cần Whisper thì cài `faster-whisper` chạy CPU trong container `lcs-trailer-web`, mô hình tải vào `R/tam/` |
| 2. Khóa Gemini | Máy chủ riêng trong container đọc khóa từ tệp `.env` **đã có trên scoai**: `grep '^GEMINI_API_KEYS=' ~/lcs-server/la-chan-so/.env \| docker exec -i <container> bash /t/cong-cu/srv-len.sh`. Không đưa khóa từ laptop, không ghi ra tệp, không in. Dọn: `docker rm -f` |
| 3. Số điện thoại | Số hư cấu `0100 555 018`, `…042`, `…077`, `…020`. Che mọi số mẫu khác của kho |
| 4. Việc chưa kiểm trên máy thật | Kiểm đạt trên máy ảo và máy chủ riêng (chạy đúng mã thật) là đủ để đưa vào lời |
| 5. Tiếng "Có" | Dự phòng chạm nút được; khi đó S11 = "Bà có thể nói, hoặc chạm Có." Giọng bà: Gemini Gacrux |
| 6. Giọng kẻ gian ở mở đầu | Dùng, nhãn "Mô phỏng · giọng AI đóng vai", lọc dải điện thoại. Cho thấy rõ đó là lời tái hiện (Astra 14) |
| 7. Lời và câu kết | Theo 11.2. Câu tục ngữ: nửa đầu đọc ở mở đầu, nửa sau đọc ở kết; khung kết hiện **trọn câu**. Dòng cuối giữ "Đội 18 · Hackathon thành phố Đồng Nai 2026" (theo tài liệu của đội; điều phối hỏi lại người dùng song song) |
| 8. Nhạc CC BY | Được, ghi công nhỏ ở khung cuối |
| 9. Phụ đề | Bật phụ đề nhỏ suốt video |
| 10. Hạn giao, máy chiếu | Đang hỏi người dùng; trong lúc chờ: làm cả bản thường và bản nhẹ |

### 11.1 Sửa theo `T/soat/astra-1.md` (các mục được nhận)

- (1) **Hai CSDL tách:** `LCS_DB=/t/tam/emu.db` trong `lcs-trailer-emu`, `/t/tam/web.db` trong `lcs-trailer-web`. Mọi lệnh `flag_test_number.py` luôn có `LCS_BASE=http://127.0.0.1:8765`. Tệp số: mỗi dòng một số viết liền.
- (2)(3) **W11 viết lại theo mã đã xong** (`server/lcs/quiz.py`, `app/src/v3/screens/Leaderboard.jsx`, máy chủ demo công khai đã chạy bản này):
  - Thẻ tên "Xếp hạng". Lần đầu hiện ô chọn **trường rồi lớp** (phường suy từ trường). Ba phạm vi: các lớp trong trường, các trường toàn Đồng Nai, các phường toàn Đồng Nai.
  - Tên trường và phường **là thật**, theo Kế hoạch tuyển sinh THPT 2026–2027 của Sở GD&ĐT Đồng Nai (số 1213/KH-SGDĐT): 12 trường khu Biên Hòa, Long Khánh. Tên lớp và điểm nạp sẵn là minh họa (thẻ ghi "Điểm là dữ liệu minh họa").
  - **Điểm thi đua = cộng điểm tốt nhất của từng bạn** (mỗi bạn tối đa 100), nên rủ bạn nào làm cũng chỉ cộng thêm. Dưới bảng có dòng mục tiêu "Thêm N điểm nữa là lớp bạn vượt …".
  - Kịch bản quay (CSDL mẫu sạch, `mode=full`, W7 và W11 cùng phiên, trình duyệt đăng ký máy thật với máy chủ riêng): làm đúng **5/5**, tới `#/kiem-tra-bai/ket-qua?diem=5`, chọn **THPT Ngô Quyền, Lớp 11A1**, bấm "Vào bảng thi đua". Bảng hiện 11A3 1.020 / **11A1 940 (hạng 2)** / 11A7 860 kèm "Thêm 100 điểm nữa là lớp bạn vượt Lớp 11A3", sau 900 ms dòng 11A1 trượt lên **hạng 1, 1.040 điểm**, chip "Lớp 11A1 vừa lên hạng 1", dòng "Lớp bạn đang dẫn đầu!".
  - Đổi phạm vi (ô `select[aria-label="Phạm vi xếp hạng"]`) sang "Các trường toàn Đồng Nai": THPT Ngô Quyền hạng 2 (3.520), vừa vượt THPT Trấn Biên (3.460).
  - Chọn ô bằng setter gốc của `HTMLSelectElement` rồi phát sự kiện `change` (bảng chọn gốc không hiện khi quay không giao diện). Quay lại thì `POST /api/demo/reset` trên máy chủ riêng trước.
  - Script mẫu đã chạy được: `/tmp/claude-1000/-home-rin/8a757c30-917e-41c0-9736-02ecd2c83863/scratchpad/xh/chup.mjs`.
- (4) Mọi lệnh adb có `-s emulator-5554` hoặc `-s emulator-5556`, kể cả lệnh lồng (`pidof`). Hai cổng forward CDP riêng (9222 máy bà, 9223 máy Minh); chọn tab theo URL thực (`lachan.app/app/index.html` cho màn React, `video-call.html` cho gọi video).
- (5) G0: kiểm `/dev/kvm` trên host, rồi `emulator -accel-check` trong container. Tạo đủ `.avd/config.ini` và `.ini`, đặt `PATH` SDK, chờ `sys.boot_completed=1` riêng từng máy sau khi đổi ngôn ngữ. G3: Chromium chạy bằng người dùng thường (không root) và **ghi thử một đoạn thật** qua CDP, không chỉ `--version`.
- (6) Sau `gsm call`, nhận máy và kiểm `OFFHOOK` trên đúng máy (`dumpsys telephony.registry`); nếu `gsm accept` không đủ thì `input keyevent KEYCODE_CALL`. Đếm thời lượng từ lúc nhận. Sau `gsm cancel`, chờ dòng nhật ký cuộc gọi đến có thời lượng > 0. Màn Bé Nai chưa mở thì chạm thông báo "Bé Nai hỏi thăm".
- (7) Máy Minh: đúng vai Người thân, đã ghép `gia-dinh-hoa` trước A2, dịch vụ nền chạy, được phép thông báo. Chờ tối đa hai chu kỳ (30 s); banner không nổi thì kéo khay. S12 = "Điện thoại của Minh báo: mẹ vừa gặp cuộc gọi đáng ngờ."
- (8) V5 kiểm bằng phản hồi `POST /api/reports` và mã báo cáo, không dùng `/api/cases`. S16 = "Báo cáo phải gắn với một cuộc gọi đến có thật trong máy."
- (9) W9: nhập nhận xét **trước**, rồi bấm "Xác nhận dấu hiệu"; nhãn "Một hồ sơ khác". W10: mã thử lấy từ phản hồi tạo khiếu nại trên máy chủ riêng; sau xác minh bấm "Xem kết quả tra cứu", chờ tra lại ra mức vàng. S18 = "Người bị báo nhầm có thể yêu cầu đội xem lại."
- (10) V1 đo đúng hash số đỏ trong `flagged-numbers.json` và thời điểm tải; giữ `may-chu` khi ngắt mạng. S7 = "Chuông vừa đổ, Lá chắn tra số và hiện cảnh báo đỏ."
- (11) Chuẩn bị âm thử "Có" trước V0. Dự phòng chạm nút thì không chờ chữ "Bé Nai đang nghe…" (máy thiếu bộ nhận giọng sẽ hiện "bấm giúp").
- (12) A4: chờ MediaStore lập chỉ mục, kiểm URI đọc được; tạo một cuộc đến riêng ngay trước cảnh. A5: phục vụ trang ngân hàng mẫu qua HTTP, kiểm gói mở trang trùng `app-thu`, mở trong 120 s sau A2, ghi "Ngân hàng mẫu".
- (13) **Khổ quay React: 392×872, tỉ lệ 3 (ra 1176×2616, chẵn).** Đổi tọa độ `focus` CSS sang pixel video. Ghi màn máy ảo: dừng ghi đúng cách, kéo MP4 về, căn mốc theo khung đầu và khung thông báo thực hiện ra (không dùng giờ gửi lệnh ±1,5 s).
- (14) Nhãn "Máy ảo Android" chỉ ở cảnh Android; cảnh web chỉ "Dữ liệu minh họa". W6 giữ chữ "Tình huống nhập vai mẫu".
- (15) S19 = "Các máy tra chung danh sách cảnh báo của cộng đồng."
- (16)(17) **Phạm vi và nhịp:** đường găng là thẻ đỏ → Bé Nai hỏi → Minh nhận → Vy học và thi đua → bà báo, đội duyệt → ba cây chụm lại. A3, A4, A5, W8, W6 (gọi video) là phần **có thể bỏ** nếu trễ. Bỏ S2. S13b = "Vy làm bài, lớp mình lên hạng." Cộng đồng 24–25 s. Hiệu ứng: bỏ bụi sáng, nhiễu phim, bóng mờ ba lớp; máy nghiêng chỉ lúc vào hình; cảnh đội duyệt có một lần đứng hình, phóng to bằng chứng, giữ yên khoảng 2 s.

### 11.2 Thứ tự chạy thực tế

1. Cùng lúc: gói H (hạ tầng scoai), gói C (nhạc và hiệu ứng âm thanh), gói E đợt 1 (bộ thành phần Remotion và bản nháp có hình giữ chỗ).
2. H xong G0–G3: gói A và B song song.
3. Cổng kiểm đủ: điều phối chốt lời, phản biện lượt 2, rồi D thu giọng.
4. E ghép bản chính, render nháp, phản biện lượt 3 và soát (F), sửa, render chính. Cuối cùng nhờ Fable xem thành phẩm.
