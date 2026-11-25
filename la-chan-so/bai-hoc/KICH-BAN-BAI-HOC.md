# Kịch bản bài học · Lá chắn số (mảng 4)

Bản nháp để duyệt trước khi vẽ tranh, thu giọng và viết mã. Gồm 10 bài, mỗi bài một kiểu lừa đảo. Luật viết lời nói theo [`../KICH-BAN-THOAI.md`](../KICH-BAN-THOAI.md) mục 1; luật vẽ theo [`../tools/ve-tranh/STYLE.txt`](../tools/ve-tranh/STYLE.txt).

Mười kiểu dưới đây do mảng 4 tự chọn theo các kiểu đã có trong bản thiết kế và dữ liệu mẫu. Đề nói "10 tình huống phổ biến" nhưng trong kho không có danh sách của đề, nên cần đối chiếu lại nếu đề có nêu tên từng tình huống.

## 1. Khuôn chung của một bài

| Phần | Nội dung | Thời lượng | Màn |
|---|---|---|---|
| A. Truyện 1 phút | Ba bốn khung tranh, Bé Nai kể, có một điểm rẽ (người học chọn giúp nhân vật) và một khung ngõ cụt. Bài cho ông bà: đúng hai nút to, chữ ngắn, Bé Nai đọc to câu hỏi và cả hai lựa chọn; ngõ cụt nhẹ nhàng, không dọa | 1 phút | A11b, A11c, A11e, A11f, A11j |
| B. Luyện | 2 bài tập khác dạng, có gợi ý, không tính điểm xếp hạng | 2 phút | mới |
| C. Thử thách | Một việc phải tự làm: khuyên người thân qua gọi video, nghe máy với kẻ gian do AI đóng, hoặc ca mới | 2 phút | A11d, A11g, A11h, A11i |
| D. Kiểm tra | Câu hỏi của bài này nằm trong ngân hàng câu của bài kiểm tra chung | | A12a–c |

- **Đề chỉ bắt buộc phần A** ("bài học 1 phút"). Phần B và C là phần "học như chơi game".
- **Gia đình chung của các bài ông bà:** bà Hoa; con trai là anh Minh (khoảng ba mươi, khớp avatar 125: tóc đen ngắn, vest đen, sơ mi trắng không cà vạt); Vy là cháu ngoại của bà, anh Minh là cậu của Vy.
- **Hai chế độ.** Bài cho bà Hoa (chữ lớn): Bé Nai xưng "con", gọi "bà", mỗi màn một việc, nút cao từ 56px, không kéo thả. Bài cho Vy: Bé Nai xưng "mình", gọi "bạn".
- **Điểm chỉ tính ở phần C và D.** Phần B là luyện tập; đã xem đáp án rồi mới bấm thì không tính là đạt. Ở phần C mỗi ý được chấm là mười điểm; trang bài học chỉ nhận điểm của đúng cuộc gọi vừa bấm "Nghe máy", một lần, và không vượt quá số ý của bài.
- **Sao của bài (tối đa ba).** Mỗi phần đạt được một sao: A xem hết truyện; B làm xong cả hai bài luyện mà không xem đáp án và không bấm bừa (sai vẫn được giải thích và làm tiếp, nhưng sai quá mức thì bài xong mà chưa tính là đạt, có nút "Làm lại để đạt": B1 chạm nhầm tối đa một chỗ; B2 và B4 chọn sai tối đa một lần; B5 chọn việc đầu tiên phải đúng ngay lần đầu, B5 xếp thứ tự được kiểm sai tối đa một lần; B6 dừng lúc nào cũng là xong); C được từ nửa số ý trở lên. Sao và phần đã xong lưu trên máy.
- **Bốn bài dựng trước** (trang `prototype/hoc.html`, mỗi bài một tệp `prototype/hoc/bai-NN.json`): Bài 1, 2, 3, 9 của bảng 10 bài; người học thấy chúng là Bài 1 đến Bài 4 (xem ghi chú ở mục 4). Sáu bài còn lại mới có kịch bản.
- **Mã kiểu** (cột `ma_kieu`) dùng để mở đúng bài sau khi app vừa cảnh báo một cuộc gọi hay tin nhắn cùng kiểu. Hợp đồng dữ liệu của mảng 1 đang trả `kieu` là chữ hiển thị; đề xuất thêm trường `ma_kieu` nhận đúng 10 giá trị ở mục 4.

### Giọng kể: như người thật đang kể chuyện

- **Bé Nai kể như ngồi cạnh mà kể,** không đọc bài. Có lúc hồi hộp, có lúc bật cười, có lúc khựng lại hỏi "mà khoan". Dùng tiếng đệm của người miền Nam: nha, nè, ta, hông, thiệt, lẹ, hết hồn. (Tránh "hú hồn" trong lời thu: giọng máy hay diễn thành tiếng thở, tiếng cười thay vì đọc ra chữ; đã gặp hai lần với giọng bà Hoa.)
- **Nhân vật tự nói bằng giọng của mình.** Mỗi khung có ít nhất một câu thoại của nhân vật, có cảm xúc rõ: bà Hoa hoảng rồi thở phào, Vy mừng rồi ngờ ngợ, chú Tư hớn hở rồi chưng hửng. Người học nghe là biết nhân vật đang thấy gì.
- **Kẻ gian nói ngọt, không gằn giọng dọa nạt quá mức.** Ngoài đời chúng lễ phép và vội vàng, người học cần quen đúng cái giọng đó. Mỗi lượt tối đa hai câu.
- **Mỗi khung ba bốn câu ngắn, khoảng 12 đến 15 giây.** Bốn khung vừa một phút.
- **Kể xong một khung thì tự sang khung kế**, bài cho học sinh lẫn bài cho ông bà (người già ít phải bấm): bài học sinh chờ 0,7 giây, bài ông bà chờ 2 giây cho kịp nhìn tranh. Nút "Tiếp" (sang câu kế, hết câu thì sang khung kế) và "Nghe lại" vẫn có. Không tự sang ở khung ngõ cụt (chờ bấm "Quay lại điểm rẽ"), khi trang đang ẩn, và tới điểm rẽ thì dừng chờ người học chọn.
- **Chỉ dẫn cảm xúc** ghi trong ngoặc nghiêng trước mỗi câu, đưa vào lời dặn thu giọng. Mỗi nhân vật thu một lượt dài riêng cho mỗi bài rồi cắt.
- **Lời nói ra không có dấu hai chấm, số viết bằng chữ, không đọc đường dẫn hay số điện thoại.** Bé Nai nhại lại tin nhắn thì nói thẳng vào câu, không "tin nhắn viết hai chấm".
- **Khen và sửa cũng có cảm xúc.** Đúng thì reo lên, sai thì nhẹ nhàng, không trách: "Câu này hiền khô à, bạn thử câu khác nha."

## 2. Các dạng bài tập

Ngoài trắc nghiệm, đề xuất 10 dạng. Mỗi dạng là một khối giao diện đọc nội dung từ tệp, nên thêm bài mới không phải viết mã.

| Mã | Dạng | Người học làm gì | Luyện kỹ năng gì | Chế độ chữ lớn | Đã có |
|---|---|---|---|---|---|
| B1 | Chạm bắt bài | Chạm vào câu đáng ngờ trong tin nhắn hoặc đoạn trò chuyện | Nhận ra dấu hiệu ngay trong lời thật | Có | A11d |
| B2 | Thật hay lừa | Vuốt từng thẻ sang "Lừa", "Bình thường" hoặc "Cần kiểm tra". Chữ lớn: mỗi thẻ hai nút to "Khoan đã" và "Được" (thẻ nào còn phải hỏi lại cũng là "Khoan đã") | Phân loại nhanh | Có | |
| B3 | Soi đường dẫn | Hai địa chỉ đặt cạnh nhau, chạm vào chỗ khác nhau rồi chọn cái thật | Đọc tên miền (35% báo cáo của đề là đường dẫn giả) | Không | |
| B4 | Nối lời với chiêu | Chạm một câu kẻ gian nói, rồi chạm tên chiêu để gắn vào (không kéo thả); có một tên chiêu gây nhiễu | Gọi được tên chiêu | Không | |
| B5 | Việc nào trước | Chạm lần lượt 3 đến 5 việc theo thứ tự nên làm (không kéo thả); chỉ chấm những chỗ thứ tự thật sự quan trọng. Chữ lớn: chỉ chọn việc đầu tiên | Biết phải làm gì, không chỉ biết nhận ra | Có | |
| B6 | Nghe và bấm Dừng | Nghe cuộc gọi mô phỏng, bấm "Dừng" ngay khi nghe ra dấu hiệu. Bấm Dừng lúc nào cũng ngắt cuộc gọi ngay, vì ngoài đời cúp máy sớm luôn là đúng. Dừng ngay sau dấu hiệu đầu tiên được ba sao, càng trễ càng ít sao; dừng trước khi có dấu hiệu thì bài vẫn xong, không có sao, và được mời nghe thêm một lượt. Dừng xong chọn một trong hai nút "vừa nghe ra điều gì" để tập gọi tên dấu hiệu | Phản xạ khi đang nghe máy | Có, hợp nhất với người cao tuổi | |
| B7 | Ghép câu từ chối | Chọn các mảnh để ghép thành câu trả lời kẻ gian | Có sẵn câu để nói | Có (chọn 1 trong 2 câu) | |
| B8 | Nghe máy nhập vai | Trả lời kẻ gian do AI đóng bằng giọng nói, AI chấm 4 mức | Dám từ chối thành lời | Không | A11g |
| B9 | Gọi video khuyên người thân | Giảng lại cho một avatar AI có khẩu hình, AI chấm theo ý | Hiểu tới mức giảng lại được | Có (trả lời Minh) | A11h |
| B10 | Làm thật trong app | Nhiệm vụ dùng chính công cụ của Lá chắn: tra một số mẫu, gửi một báo cáo mẫu | Biết dùng app khi gặp chuyện thật | Có | A06, A09 |
| B11 | Ca mới | Một tình huống chưa gặp trong bài, không gợi ý, có chấm điểm | Kiểm tra xem có áp dụng được không | Có | A12 |

**Theo tôi nên làm trước năm dạng:** B1 (đã có), B2, B5, B6, B3. Bốn dạng mới này chỉ cần chạm và vuốt, không cần AI, không cần mạng, và phủ đủ ba kỹ năng: nhận ra, phản xạ, biết làm gì. B6 đáng làm nhất vì dùng được cho bà Hoa và dùng lại toàn bộ dây chuyền thu giọng đã có. B4 và B7 làm sau nếu còn giờ. B8 và B9 đã có trong prototype với kịch bản cố định.

Luật chung cho mọi dạng:
- Mỗi bài gọn trong một màn, không phải cuộn.
- Hai mục đầu là mẫu đã làm sẵn kèm một câu giải thích. Dạng có nhiều mục rời (B1, B2, B4): hai mục đầu hiện sẵn đáp án. Dạng làm một lượt (B5, B6): Bé Nai làm một lượt mẫu ngắn gồm hai mục (B5 là hai việc đã xếp sẵn của một tình huống khác; B6 là một cuộc gọi mẫu hai lượt lời mà Bé Nai tự bấm Dừng), rồi mới tới lượt người học.
- Gợi ý ba bước, mở dần, không nói thẳng đáp án. Bước 1 chỉ nhắc cảnh mà ai cũng đã xem, không nhắc cảnh ngõ cụt. Mở đủ ba bước mới hiện nút "Xem đáp án"; bấm xem là kết thúc lượt đó: bài xong nhưng không tính là đạt, muốn đạt thì làm lại (thứ tự lựa chọn được xáo lại).
- Sai thì giải thích vì sao, không trừ điểm, cho làm lại.
- Thứ tự các nút lựa chọn đổi mỗi lần mở, đáp án không nằm trong mã trang.

## 3. Tận dụng nguồn có sẵn

| Nguồn | Ở đâu | Dùng cho |
|---|---|---|
| 12 khung tranh đã vẽ | `assets/comic1-*`, `comic2-*`, `comic3-*` | Bài 1, 2, 3: không phải vẽ lại |
| Bé Nai 4 tư thế, tranh "gia đình", "an toàn" | `assets/mascot-*`, `assets/spot-*` | Mọi bài: màn mở đầu, phản hồi đúng sai, bảng điểm |
| Tranh chị Hương (kẻ gian vẽ tay, hai trạng thái miệng) | `assets/avatar-huong*.png` | Kẻ gian trong B6 và B8 của mọi bài |
| 19 câu giọng đã thu | `prototype/audio/` | Bài 2 trọn vẹn; câu hỏi và lời nhắc của Bé Nai cho bà |
| Bộ lời dặn vẽ và 7 hình mẫu phong cách | `tools/ve-tranh/` | Vẽ tranh mới bằng Codex, cùng nét với tranh cũ |
| Dây chuyền giọng: thu một lượt dài, tự cắt, lọc nhiễu, kiểm lại bằng máy nghe | `tools/gemini_take.py`, `split_take.py`, `loc-giong.py`, `gemini_stt_check.py`; riêng bài học: `tools/thu-bai-hoc.py <số bài>` đọc thẳng tệp nội dung, làm đủ các bước và so bản chép với lời gốc | Mọi giọng mới |
| Trình phát avatar có khẩu hình, tính khẩu hình ngay trong trình duyệt | `vendor/vlearn-avatar/`, `prototype/video-call.html` | Phần C có gọi video |
| Ba avatar LiteAvatar | 21 đã ở `vendor/`; 117 và 125 ở `vlearn-lesson-lab/tools/stage-demo/avatars/` (24 MB mỗi cái, chỉ chép sang, không sửa kho gốc) | Xem bảng phân vai |
| Dữ liệu mẫu: 4 số bị báo, 4 đường dẫn giả, 2 đường dẫn thật, tin nhắn việc nhẹ | `prototype/mock-data.js` | B3, B10 và các tin nhắn trong bài |
| Các dạng bài tập của vlearn (`bucket`, `match`, `order`…) | `vlearn-lesson-lab/player/hoc-practice.js` | Tham khảo cách làm B2, B4, B5; viết lại gọn cho màn điện thoại |

### Phân vai ba avatar

| Avatar | Vai | Giọng | Xuất hiện |
|---|---|---|---|
| 21, nữ trẻ | Chị Lan, chị họ của Vy | Đã thu (Aoede) | Bài 2 (có sẵn) |
| 125, nam trẻ | Anh Minh, con trai bà Hoa: gọi hỏi lại mẹ sau mỗi bài của bà | Thu mới, giọng nam trẻ | Bài 1, 3, 5, 8 |
| 117, nam lớn tuổi | Ông Tư: chú của Vy, hàng xóm của bà Hoa | Thu mới, giọng nam trầm | Bài 9, 10 |

### Giọng của từng nhân vật

| Nhân vật | Giọng | Ghi chú |
|---|---|---|
| Bé Nai | Leda, giọng đã dùng trong `prototype/audio/benai-*` | Giữ nguyên giọng, thêm chỉ dẫn cảm xúc theo từng câu |
| Vy | Zephyr, giọng đã dùng trong `prototype/audio/vy-*` | Nữ trẻ, nhanh, hay "ủa", "trời" |
| Chị Lan | Aoede, đã thu | Giữ nguyên |
| Bà Hoa | Gacrux, giọng nữ lớn tuổi, trầm, nói chậm | Xuất hiện ở 5 bài của bà |
| Minh | Achird (chốt trong `prototype/nhan-vat.json`) | Dùng chung cho thoại trong truyện và avatar 125 |
| Ông Tư | Algenib (chốt trong `prototype/nhan-vat.json`) | Dùng chung cho truyện Bài 9 và avatar 117 |
| Ngân | Thu mới, giọng nữ trẻ khác Vy | Chỉ Bài 7, 2 câu |
| Người gọi (kẻ gian) | Nam: Alnilam. Nữ: Despina. Lễ phép, vội, không gằn giọng | Dùng lại cho mọi bài; trên màn hình luôn là hình vẽ; không trùng giọng avatar nào |

Giọng bà Hoa và hai giọng người gọi chọn bằng cách thu thử mỗi vai hai giọng rồi nhờ máy nghe tả lại (tuổi, vùng miền, tốc độ); chưa có người ngồi nghe duyệt. Bảng giọng và lời dặn nằm ở `tools/giong-bai-hoc.json`; giọng Minh, ông Tư lấy ở `prototype/nhan-vat.json`.

- **Avatar chỉ đóng người được giúp, không đóng kẻ gian.** Kẻ gian luôn là hình vẽ (hạt đậu xám đeo tai nghe, hoặc tranh chị Hương), kèm nhãn "Mô phỏng · AI đóng vai".
- **Khẩu hình cho 117 và 125:** dùng tạm bộ khớp miệng của avatar 21 thì vẫn chạy, nhưng bộ đó khớp trên giọng nữ. Muốn khớp tốt phải chạy `lip_fit.py` với engine khẩu hình (khoảng 3 GB), xem `vlearn-lesson-lab/docs/HOC-STAGE.md` mục 6.6b.
- **Giấy phép:** tài liệu của vlearn ghi ba avatar thuộc bộ LiteAvatar và cần xem điều khoản trước khi dùng ngoài khóa học. Chưa ai kiểm việc này cho cuộc thi.
- **Lời thu sẵn của Minh gọi "mẹ", của ông Tư gọi "chị".** Chủ máy chọn xưng hô khác "bà" thì phần gọi video chuyển sang câu hỏi bằng chữ kèm Bé Nai đọc.

## 4. Bảng 10 bài

| Bài | Tên | `ma_kieu` | Nhân vật | Bài tập phần B | Thử thách phần C | Tranh |
|---|---|---|---|---|---|---|
| 1 | Cuộc gọi tự xưng cơ quan chức năng | `gia-danh-co-quan` | Bà Hoa | B6, B2 | Anh Minh hoảng hốt gọi (125) | Có sẵn, vẽ lại 1 + ngõ cụt 1 |
| 2 | Việc nhẹ lương cao | `viec-nhe-luong-cao` | Vy | B1, B4 | Gọi video khuyên chị Lan (21); thêm nghe máy với chị Hương | Có sẵn |
| 3 | Người thân gặp nạn, cần tiền gấp | `nguoi-than-gap-nan` | Bà Hoa | B5, B2 | Anh Minh hỏi mẹ về bé Vy (125) | Vẽ mới 4, dùng lại 1 |
| 4 | Trúng thưởng, quà tri ân | `trung-thuong` | Vy | B3, B10 | Ca mới 3 tin nhắn (B11) | Vẽ 5 |
| 5 | Giả danh ngân hàng, xin mã xác thực | `gia-danh-ngan-hang` | Bà Hoa | B6, B7 | Minh gọi hỏi lại (125) | Vẽ 4 |
| 6 | Giả danh giao hàng | `gia-danh-giao-hang` | Vy | B1, B7 | Nghe máy nhập vai (B8) | Vẽ 5 |
| 7 | Bạn nhắn mượn tiền, tài khoản lạ | `muon-tien-tai-khoan-la` | Vy | B1, B5 | Đấu trí tin nhắn 60 giây | Vẽ 5 |
| 8 | Gọi video giả mặt người thân | `goi-video-gia-mat` | Bà Hoa | B2, B5 | Minh thật gọi (125) | Vẽ 4 |
| 9 | Đầu tư lãi cao, nhóm kín | `dau-tu-lai-cao` | Ông Tư, người học là Vy | B4, B5 | Gọi video khuyên chú Tư (117) | Vẽ 5 |
| 10 | Cài ứng dụng giả mạo | `cai-ung-dung-gia` | Bà Hoa | B2, B6 | Ông Tư gọi nhờ bà chỉ (117) | Vẽ 4 |

Trong màn thư viện A11a hiện có "Tập 1 · Cuộc gọi tuyển dụng": nó cùng kiểu với Bài 2 nên thành thử thách thứ hai của Bài 2, không còn là một tập riêng.

**Bốn bài phát hành đợt này và số hiển thị.** Người học chỉ thấy số thứ tự liên tục theo vị trí trong danh sách phát hành `prototype/hoc/danh-sach.json`, không thấy số của bảng trên:

| Số người học thấy | Bài trong bảng 10 bài (mã nội bộ) | Tệp | `?bai=` | Cảnh gọi video |
|---|---|---|---|---|
| Bài 1 | Bài 1 · Cuộc gọi tự xưng cơ quan chức năng | `bai-01.json` | 1 | `minh-1` |
| Bài 2 | Bài 2 · Việc nhẹ lương cao | `bai-02.json` | 2 | `lan-2` |
| Bài 3 | Bài 3 · Người thân gặp nạn, cần tiền gấp | `bai-03.json` | 3 | `minh-3` |
| Bài 4 | Bài 9 · Đầu tư lãi cao, nhóm kín | `bai-09.json` | 9 | `tu-9` |

**Mở bài theo kiểu lừa đảo (`hoc.html?kieu=…`).** Trang nhận cả `ma_kieu` của bảng trên lẫn mã kiểu của máy chủ (viết gạch dưới): giá trị được bỏ khoảng trắng, đổi chữ thường, đổi `_` thành `-`, rồi so với `ma_kieu` và bảng bí danh `bi_danh` trong danh sách phát hành. Hiện có: `gia_danh_cong_an` → bài `gia-danh-co-quan`; `viec_nhe_luong_cao` → bài `viec-nhe-luong-cao`; `nguoi_than_tai_nan` → bài `nguoi-than-gap-nan`; `dau-tu-lai-cao` giữ mã của kịch bản. Mã chưa có bài (`duong_dan_gia`, `gia_dien_luc`, `qua_tri_an`, `khac`), mã lạ hoặc rỗng thì mở thư viện bài, không báo lỗi; giá trị chỉ dùng để so khớp, không hiện lên trang.

Mã nội bộ (tên tệp, tham số `?bai=`, mã cảnh, `ma_kieu`, tên tệp giọng `hoc/giong/b09/…`) giữ nguyên theo bảng 10 bài để không vỡ hợp đồng giữa các phần; các mục "Bài N" trong tài liệu này cũng là số của bảng 10 bài. Đổi thứ tự hoặc mở thêm bài chỉ cần sửa danh sách phát hành. Lời thu giọng không nhắc số bài, nên đổi thứ tự không phải thu lại.

**Cần làm mới:** 32 khung tranh và 1 bảng nhân vật ông Tư (Codex); lời Bé Nai cho 9 bài (trừ Bài 2 đã thu) và phần luyện của cả 10 bài; thoại nhân vật trong truyện (bà Hoa, Vy, Minh, ông Tư, Ngân, người gọi); lời avatar của Minh (12 câu) và ông Tư (6 câu); lời người gọi cho B6 và B8 (khoảng 15 câu).

---

## 5. Kịch bản từng bài

Cách đọc bảng truyện: mỗi dòng lời có **ai nói** và *(cảm xúc)*. Phần in đậm và phần trong ngoặc là chỉ dẫn cho người thu giọng, không đọc thành tiếng. Trong tranh không có chữ. Kẻ gian trong tranh luôn là hạt đậu xám đeo tai nghe và kính đen.

### Bài 1 · Cuộc gọi tự xưng cơ quan chức năng

Cho bà Hoa (chữ lớn). Tranh `comic1-1` đến `comic1-3` có sẵn; `comic1-4` vẽ lại cho anh Minh khớp avatar 125; `comic1-5` (ngõ cụt) vẽ mới. Tệp nội dung: `prototype/hoc/bai-01.json`.

**A. Truyện** (điểm rẽ ở khung 3, ngay lúc Lá chắn hiện "Khoan đã": giữ khoảnh khắc Lá chắn can thiệp)

| Khung | Lời | Chữ dưới tranh (màn ôn lại) |
|---|---|---|
| 1 | **Bé Nai** *(ấm áp, rủ rê)* Con kể bà nghe chuyện bà Hoa nha. Tới đoạn gay cấn, bà chọn giúp bà Hoa nha.<br>**Bé Nai** *(thủng thẳng, như kể chuyện nhà)* Trưa đó bà Hoa đang ngồi nghỉ thì điện thoại reo. Một số lạ hoắc.<br>**Bà Hoa** *(lẩm bẩm)* Ai gọi giờ này vậy ta? | Bà Hoa nhận cuộc gọi từ một số lạ. |
| 2 | **Bé Nai** *(hạ giọng, hồi hộp)* Bên kia là một giọng đàn ông, nghe nghiêm lắm. Ông ta xưng là cán bộ điều tra, nói bà dính tới một vụ án.<br>**Bà Hoa** *(hoảng hốt)* Trời đất ơi, tôi có làm gì đâu! | Người gọi tự xưng cán bộ, nói bà dính vụ án. |
| 3 (điểm rẽ) | **Người gọi** *(gấp gáp mà vẫn lễ phép)* Bà chuyển hết tiền qua tài khoản tạm giữ giúp tôi. Chuyện này bà đừng nói với ai nha.<br>**Bé Nai** *(dồn dập)* Bà run quá, tay đã mở ứng dụng ngân hàng.<br>**Bé Nai** *(dứt khoát)* Đúng lúc đó, Lá chắn hiện lên. Khoan đã bà ơi!<br>**Bé Nai** *(hỏi nhỏ nhẹ)* Nếu là bà Hoa, bà làm gì ạ?<br>Hai nút to, Bé Nai đọc *(rõ, chậm)* từng nút: **Chuyển tiền cho xong** (sang ngõ cụt) · **Cúp máy, gọi cho con** (sang khung 4). | Họ giục bà chuyển tiền. Lá chắn hiện "Khoan đã". |
| Ngõ cụt (`comic1-5`) | **Bé Nai** *(kể chậm, buồn dần)* Bà bỏ qua lời nhắc, chuyển hết tiền. Lát sau gọi lại số kia thì không ai nghe máy nữa.<br>**Bà Hoa** *(buồn, nghẹn ngào)* Tiền dành dụm bao lâu nay, mất hết rồi.<br>**Bé Nai** *(an ủi, dịu dàng)* Không sao đâu bà, đây chỉ là truyện thôi. Mình quay lại chọn lại nha.<br>Nút "Quay lại điểm rẽ"; về lại điểm rẽ, Bé Nai hỏi lại và đọc lại hai lựa chọn. | (không hiện ở màn ôn lại) |
| 4 (`comic1-4`) | **Bé Nai** *(dịu lại)* Bà cúp máy, rồi gọi liền cho anh Minh.<br>**Minh** *(bật cười, trấn an)* Mẹ ơi, lừa đảo đó. Công an nào lại đòi tiền qua điện thoại hả mẹ.<br>**Bà Hoa** *(nhẹ nhõm, nói rõ từng tiếng)* Trời ơi, hết hồn. Suýt nữa thì mất hết. | Bà cúp máy, gọi con trai. An toàn rồi. |

- Dấu hiệu: tự xưng cơ quan chức năng; đòi chuyển tiền; bắt giữ bí mật.
- Nhớ một câu, **Bé Nai** *(ấm áp)*: Ai tự xưng công an mà đòi chuyển tiền, bà cứ cúp máy nhé.

**B. Luyện**

*B6 · Nghe và bấm Dừng.* Người gọi là hình vẽ hạt đậu xám (`assets/avatar-hat-dau.png`), có nhãn "Mô phỏng · AI đóng vai". **Bé Nai** *(rủ rê)*: Giờ con cho bà nghe thử một cuộc gọi giả nha. Người gọi là máy đóng vai thôi ạ. Nghe thấy lạ là bà bấm Dừng liền.

Lượt mẫu, Bé Nai làm. **Bé Nai** *(thong thả)*: Con làm mẫu trước nha bà.

| Câu mẫu | Người gọi (mô phỏng) | Bé Nai |
|---|---|---|
| M1 | *(lễ phép)* Dạ alo, chào bà ạ. | Nhãn trên màn: "Mới chào hỏi, chưa có gì lạ". |
| M2 | *(lễ phép, nghiêm)* Tôi gọi từ tòa án. Bà có một giấy triệu tập chưa nhận. | Tự bấm Dừng. *(chắc nịch)* Tới đây là con bấm Dừng. Người lạ gọi tới, tự xưng cơ quan nhà nước rồi báo tin làm bà sợ, là có chuyện rồi ạ. |

Lượt của bà. **Bé Nai** *(khích lệ)*: Giờ tới lượt bà nha. Cuộc gọi này khác một chút đó ạ.

| Câu | Người gọi (mô phỏng) | Dấu hiệu | Dừng sau câu này | Hai nút xác nhận (đúng / gây nhiễu) | Bé Nai nhắc nếu chọn nhầm *(nhẹ nhàng)* |
|---|---|---|---|---|---|
| 1 | *(lịch sự)* Dạ alo, bà nghe máy có rõ không ạ? | chưa có | an toàn, chưa có sao | | |
| 2 | *(lễ phép, nghiêm)* Tôi là cán bộ điều tra. Bà đang có liên quan tới một vụ án. | tự xưng, dọa | 3 sao | Tự xưng cán bộ, nói bà dính vụ án / Hỏi thăm sức khỏe của bà | Họ vừa xưng là cán bộ, rồi nói bà dính vụ án đó ạ. |
| 3 | *(gấp, vẫn lễ phép)* Bà chuyển hết tiền vào tài khoản tạm giữ giúp tôi, để chứng minh bà trong sạch. | đòi chuyển tiền | 2 sao | Đòi bà chuyển tiền / Hẹn hôm khác gọi lại | Họ vừa đòi bà chuyển tiền đó ạ. |
| 4 | *(hạ giọng, dặn dò)* Việc này bà đừng nói với ai, kể cả con cháu nha bà. | bắt giữ bí mật | 1 sao | Dặn bà giấu con cháu / Khuyên bà hỏi con cháu | Họ vừa dặn bà giấu con cháu đó ạ. |

- Người gọi nói lễ phép và vội, không gằn giọng (theo luật "kẻ gian nói ngọt").
- **Bấm Dừng lúc nào cũng ngắt cuộc gọi ngay.** Dừng trước khi có dấu hiệu là cách xử lý an toàn: bài tập coi là xong, không có sao, và Bé Nai mời nghe thêm một lượt. **Bé Nai** *(cười hiền)*: Bà thấy không yên tâm nên cúp máy, là đúng rồi ạ. Ngoài đời bà cứ làm vậy nha. Bà muốn nghe thử lượt nữa, để biết mặt mấy chiêu của họ không ạ?
- Dừng sau một dấu hiệu, **Bé Nai** *(tò mò)* hỏi một câu để bà gọi tên điều vừa nghe (không chấm, chọn nhầm thì Bé Nai nhắc lại): Bà dừng rồi ạ. Bà vừa nghe ra điều gì lạ ạ?
- Ba sao, **Bé Nai** *(reo lên)*: Bà bấm đúng lúc ghê! Công an không bao giờ gọi điện bắt bà chuyển tiền để chứng minh trong sạch đâu ạ.
- Hai sao, **Bé Nai** *(khen)*: Dạ, nghe đòi tiền là bà dừng liền. Lần sau, mới nghe người lạ xưng cán bộ rồi nói bà dính vụ án, là bà cúp máy được rồi ạ.
- Một sao, **Bé Nai** *(nhẹ nhàng)*: Bà dừng là đúng rồi ạ. Mà ngay lúc người lạ xưng cán bộ, nói bà dính vụ án, là bà đã cúp máy được rồi ạ.
- Hết câu 4 chưa bấm, **Bé Nai** *(nhẹ nhàng)*: Không sao đâu ạ, bà nghe lại nha. Lần này bà để ý coi người lạ xưng là ai, rồi nói chuyện gì làm bà sợ nha.
- Sau khi dừng đúng, **Bé Nai** *(dặn dò)* chỉ ra đủ ba chiêu trên màn: Bà coi nè, cuộc gọi đó có tới ba chiêu. Xưng cán bộ, đòi chuyển tiền, rồi bắt giấu con cháu.
- Gợi ý, **Bé Nai** *(gợi nhớ)*: 1. Bà nhớ trong truyện, ông kia mở đầu bằng cách xưng là ai ạ? 2. Người lạ mà nhắc tới vụ án, tới tiền, là bà dè chừng ạ. 3. Nghe tới đó là bà đâu cần nghe thêm nữa ạ.

*B2 · Thật hay lừa.* Hai nút to "Khoan đã" và "Được". Bé Nai đọc to từng thẻ. **Bé Nai** *(vui vẻ)*: Giờ con đọc từng thẻ cho bà nghe nha. Chuyện nào thấy lạ, bà bấm Khoan đã. Chuyện nào yên tâm, bà bấm Được ạ.

| Thẻ | Đáp án | Bé Nai giải thích |
|---|---|---|
| Người lạ gọi, bảo bà chuyển tiền để chứng minh trong sạch. (mẫu) | Khoan đã | Thẻ này con làm mẫu, là Khoan đã. Đâu có cơ quan nào bắt bà chuyển tiền để chứng minh đâu ạ. |
| Bà hàng xóm gọi rủ sáng mai đi chợ. (mẫu) | Được | Thẻ này thì Được. Bà ấy chỉ rủ đi chợ, không xin gì hết ạ. |
| Người lạ gọi, dặn bà đừng kể cho con cháu. | Khoan đã | Họ sợ bà hỏi con cháu là lộ liền đó ạ. |
| Anh Minh gọi nhắc bà mai đi khám. | Được | Anh Minh chỉ nhắc lịch khám, không đòi tiền, không hỏi thông tin gì ạ. |
| Người lạ gọi, bảo bà đọc số căn cước qua điện thoại. | Khoan đã | Số căn cước là chuyện riêng của bà. Người lạ gọi tới hỏi thì bà đừng đọc ạ. |

- Thẻ "Được" được giải thích theo nội dung cuộc gọi (không xin gì, không hỏi thông tin), không theo số máy gọi đến, vì số và giọng gọi đến đều có thể bị giả.
- Bấm đúng, **Bé Nai** *(reo)*: Dạ đúng rồi ạ!
- Bấm "Được" ở thẻ đáng ngờ, **Bé Nai** *(nhẹ nhàng)*: Chưa đúng rồi bà ơi. Bà nghe con nói nè.
- Bấm "Khoan đã" ở thẻ bình thường, **Bé Nai** *(hiền)*: Bà cẩn thận vậy cũng tốt ạ. Mà chuyện này thì bà yên tâm được.
- Gợi ý, **Bé Nai** *(gợi nhớ)*: 1. Bà nhớ trong truyện, ông kia giục bà Hoa làm gì ạ? 2. Bà coi người gọi là ai, và họ muốn bà làm gì ạ. 3. Người gọi đang rủ bà làm chuyện thường ngày, hay muốn lấy tiền, lấy thông tin của bà ạ?
- Xong phần luyện, **Bé Nai** *(khen đúng việc)*: Bà phân biệt được chuyện lạ với chuyện thường rồi đó ạ.

**C. Thử thách · Anh Minh hoảng hốt gọi** (avatar 125, cảnh `minh-1` của màn gọi video)

Anh Minh vừa bị người tự xưng công an gọi dọa, hoảng quá nên gọi hỏi mẹ có nên chuyển tiền không; bà trấn an con. Cảm xúc đi từ hoảng loạn, bình tĩnh dần, tới nhẹ nhõm. Minh là người được giúp nên không tự nói ra đáp án. Lời đầy đủ ở `prototype/loi-minh.json`, luật ở `prototype/canh/minh-1.json`.

1. **Minh** *(hoảng loạn, nói nhanh, hụt hơi)* Mẹ ơi, mẹ ơi… công an mới gọi con. Họ nói tài khoản con dính vụ rửa tiền, phải chuyển hết vô tài khoản tạm giữ trong hôm nay. Con nên chuyển không mẹ?
2. Chưa có ý cúp máy, **Minh** *(hoảng, gấp)*: Mà họ nói hôm nay không chuyển là họ tới bắt con đó mẹ. Giờ con phải làm sao đây mẹ?
3. Bà nói được ý cúp máy, **Minh** *(bình tĩnh dần, thở ra)*: Dạ… dạ, con cúp máy, không chuyển đồng nào hết. Nghe mẹ nói con bớt run rồi.
4. Chưa có ý hỏi lại, **Minh** *(còn lo)*: Mà họ dặn con không được nói với ai hết. Lỡ họ là công an thiệt thì sao hả mẹ? Hỏi thêm lần nữa *(lo, chậm lại)*: Con muốn biết chắc họ có phải công an thiệt không. Con nên hỏi ai cho chắc hả mẹ?
5. Bà nói được ý hỏi lại, **Minh** *(bình tĩnh)*: Dạ, con không giấu nữa đâu. Con hỏi lại cho rõ rồi nói mẹ nghe liền.
6. Bà khuyên chuyển tiền, **Minh** *(sợ, run)*: Mẹ ơi, con nghe nói công an thật đâu có bắt chuyển tiền qua điện thoại. Con sợ quá, mẹ nghĩ lại giùm con nha.
7. Kết đủ ý *(nhẹ nhõm, cảm ơn)*: Trời ơi, nghe mẹ nói con nhẹ cả người. Con cảm ơn mẹ nhiều lắm, có gì lạ con gọi mẹ liền. Kết thiếu ý *(bình tĩnh lại)*: Dạ, con bình tĩnh lại chút rồi. Tối nay con ghé, hai mẹ con mình tính tiếp nha.

- Tiếng đệm riêng của cảnh *(hụt hơi, run)*: "Dạ… dạ.", "Dạ, mẹ nói đi, con nghe nè.", "Khoan, để con thở một chút đã.", "Dạ… để con nghĩ coi." Mẹ im lặng *(hoảng, sốt ruột)*: "Mẹ ơi, mẹ còn nghe con không? Con đang rối quá mẹ ơi."
- Nút lúc mở đầu: "Con cúp máy đi, đừng chuyển" / "Con làm theo họ cho xong đi". Khi Minh hỏi ý thứ hai, nút đổi thành "Con lên công an phường hỏi, đừng giấu" / "Thôi con giấu đi, đừng nói ai" (`nut_theo_cau` trong tệp cảnh), để người chỉ bấm nút vẫn đạt đủ hai ý.

**Bé Nai** *(hào hứng mà ân cần)* mở đầu: Tới thử thách rồi bà ơi. Anh Minh đang gọi, giọng hoảng lắm. Bà bình tĩnh khuyên con nha.

- Hai ý được chấm: cúp máy, không chuyển tiền; hỏi lại công an phường hoặc người nhà, đừng giấu.
- Về lại bài, Bé Nai nói theo kết quả. Đủ ý *(mừng)*: Bà trấn an anh Minh giỏi ghê. Anh Minh hết sợ rồi ạ. Thiếu ý *(nhẹ nhàng)*: Bà khuyên được một phần rồi ạ. Lúc nào rảnh, bà gọi lại anh Minh tập thêm nha. Bỏ dở *(hiền)*: Cuộc gọi chưa xong bà ơi. Lúc nào tiện, bà bấm gọi lại nha. Không được ý nào *(nhẹ nhàng)*: Lần này chưa được ý nào bà ơi. Không sao hết, bà gọi lại anh Minh tập thêm nha. Khi thiếu ý, màn kết hiện danh sách các ý được chấm.

### Bài 2 · Việc nhẹ lương cao

Cho Vy. Tranh `comic2-1` đến `comic2-4` và lời kể của Bé Nai đã có (`prototype/audio/benai-1` đến `benai-8`, lời theo `KICH-BAN-THOAI.md` mục 3 và 5), dùng lại nguyên. Thu thêm một lượt giọng Vy để truyện có thoại nhân vật như các bài mới, một lượt Bé Nai cho phần luyện, một lượt người gọi nữ cho B4. Tệp nội dung: `prototype/hoc/bai-02.json`.

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | `comic2-1` | **Bé Nai** *(đã thu, `benai-1`)* Chào bạn, mình là Bé Nai. Hôm nay mình kể chuyện của Vy. Tới đoạn quan trọng, bạn sẽ quyết định Vy làm gì nha.<br>**Bé Nai** *(đã thu, `benai-2`)* Tối thứ Sáu, Vy đang lướt điện thoại thì có tin nhắn lạ. Người ta mời Vy làm cộng tác viên, việc nhẹ mà lương cao lắm.<br>**Vy** *(tròn mắt, mừng)* Ủa, việc gì mà ngon dữ vậy trời? |
| 2 | `comic2-2` | **Bé Nai** *(đã thu, `benai-3`)* Vy làm thử vài đơn. Lạ thay, tiền về thật, dù chỉ mấy chục nghìn. Vy vui lắm.<br>**Vy** *(khoái chí)* Tiền về thiệt nè! Dễ ăn ghê ta. |
| 3 (điểm rẽ) | hai tranh trước thu nhỏ | **Vy** *(đọc tin nhắn, sốt ruột)* Họ nhắn nữa nè. Lẹ lên em, còn đúng hai suất thôi. Trời, hối dữ vậy ta.<br>**Bé Nai** *(đã thu, `benai-4`)* Rồi họ nhắn, muốn nhận đơn lớn thì phải nạp trước hai triệu. Nếu là Vy, bạn sẽ làm gì? |
| Ngõ cụt | `comic2-3` | **Bé Nai** *(đã thu, `benai-5`)* Vy chuyển hai triệu. Ngay sau đó, người kia chặn Vy rồi biến mất. Hóa ra mấy đồng lúc đầu chỉ là mồi nhử thôi.<br>**Vy** *(ỉu xìu)* Trời ơi, hai triệu của mình.<br>**Bé Nai** *(đã thu, `benai-6`)* Không sao đâu, mình quay lại điểm rẽ nhé. Lần này bạn thử chọn khác xem. |
| An toàn | `comic2-4` | **Bé Nai** *(đã thu, `benai-7`)* Vy đem tin nhắn hỏi cô giáo. Cô nhìn qua là biết ngay. Việc thật thì không bao giờ bắt mình nạp tiền trước.<br>**Vy** *(nhẹ nhõm)* Hết hồn. Xém nữa là em nạp rồi cô ơi. |

- Lựa chọn: A "Nạp ngay kẻo mất suất" (ngõ cụt); B "Dừng lại, hỏi cô giáo".
- Lời Vy ở khung 3 đưa dấu hiệu "giục gấp" vào truyện trước điểm rẽ, để ba dấu hiệu ở cuối bài đều đã xuất hiện trong phần ai cũng xem.
- Dấu hiệu: lương cao bất thường; đòi nạp tiền trước; giục làm thật gấp.
- Nhớ một câu (hiện chữ): Việc thật thì không ai bắt mình nạp tiền trước. **Bé Nai** *(dặn dò, thân mật)* đọc lời kết: Bạn nhớ giúp mình ba dấu hiệu nha. Lương cao bất thường, đòi nạp tiền trước, và giục làm thật gấp. Gặp một trong ba cái là dừng lại hỏi người lớn liền.

**B. Luyện**

*B1 · Chạm bắt bài.* Tin nhắn viết lại từ tin mẫu trong `mock-data.js`; đường dẫn dùng đuôi `.example` (đuôi dành riêng, không ai đăng ký được, nên chắc chắn hư cấu; không dùng tên dịch vụ rút gọn có thật), chỉ hiện chữ, không bấm được, Bé Nai không đọc. **Bé Nai** *(thách vui)*: Tin nhắn này có mấy chỗ đáng ngờ lắm. Mình làm mẫu hai chỗ, câu chào thì hiền khô, còn lương cao mà nhàn thì bắt bài. Giờ bạn chạm vào bốn chỗ còn lại nha.

> Chào em, bên chị đang tuyển người làm thêm. Việc nhẹ lương cao 500k/ngày, chỉ cần nạp trước 200k để kích hoạt, không cần kinh nghiệm. Hoàn tiền kèm hoa hồng 20%. Đăng ký ngay, năm phút nữa là hết suất. Làm tại nhà, giờ giấc tự do. Chi tiết tại viec-nhe-xyz.example

| Cụm chữ (theo thứ tự trong tin) | Loại | Bé Nai nói khi chạm |
|---|---|---|
| Chào em, (mẫu, tô sẵn) | bình thường | (hiện chữ) Mẫu: câu chào thì hiền khô à. |
| bên chị đang tuyển người làm thêm. | gây nhiễu | *(dễ thương)* Tuyển người thì chưa lạ. Lạ là ở chỗ họ hứa và họ đòi kìa. |
| Việc nhẹ lương cao 500k/ngày, (mẫu, tô sẵn) | hứa thu nhập cao | (hiện chữ) Mẫu: hứa trả nhiều tiền cho việc rất nhẹ, là để dụ mình đăng ký. |
| chỉ cần nạp trước 200k để kích hoạt, | đòi tiền trước | *(reo)* Bắt bài! Việc thật thì ai lại bắt mình nạp tiền trước. |
| không cần kinh nghiệm. | gây nhiễu | *(dễ thương)* Việc không cần kinh nghiệm thì cũng có thiệt. Câu này hiền khô à, bạn thử chỗ khác nha. |
| Hoàn tiền kèm hoa hồng 20%. | hứa hoàn tiền kèm lời | *(khoái)* Chuẩn luôn! Hứa hoàn tiền kèm hoa hồng là để mình yên tâm mà nạp đó. |
| Đăng ký ngay, năm phút nữa là hết suất. | giục gấp | *(nhanh nhảu)* Đúng rồi! Giục gấp vậy là để bạn không kịp hỏi ai. |
| Làm tại nhà, giờ giấc tự do. | gây nhiễu | *(dễ thương)* Làm tại nhà thì cũng có việc thiệt. Chỗ này chưa lạ đâu, bạn tìm tiếp nha. |
| Chi tiết tại viec-nhe-xyz.example | đường dẫn lạ | *(tinh nghịch)* Tinh mắt ghê! Đường dẫn lạ hoắc, đừng bấm vô nha. |

- Ba cụm gây nhiễu nằm xen giữa các cụm đáng ngờ, để vị trí không làm lộ đáp án: chạm lần lượt từ đầu hay từ cuối tin đều vấp hai cụm gây nhiễu trước khi đủ bốn chỗ. Chạm nhầm thì được giải thích, làm tiếp được; nhưng chạm nhầm từ hai chỗ khác nhau trở lên thì bài xong mà chưa tính là đạt (để chạm bừa hết mọi chỗ không được tính), làm lại được.
- Bốn chỗ phải tự tìm: đòi tiền trước, hứa hoàn tiền kèm lời, giục gấp, đường dẫn lạ.
- Tìm đủ, **Bé Nai** *(hào hứng)*: Bạn bắt đủ bốn chỗ rồi đó. Gặp tin kiểu này, bạn đừng trả lời, đừng chuyển tiền. Giữ tin lại rồi báo cáo, chặn số nha.
- Gợi ý (hiện chữ): 1. Nhớ cảnh ba hông, họ bắt Vy làm gì mới cho nhận đơn lớn? 2. Bạn tìm chỗ nào họ hứa, chỗ nào họ đòi, chỗ nào họ giục. 3. Bạn thử coi người gửi muốn mình làm gì trước khi kịp kiểm tra nha.

*B4 · Nối lời với chiêu.* Chạm một câu, rồi chạm tên chiêu. Mỗi câu có nút nghe giọng người gọi (mô phỏng). **Bé Nai** *(rủ)*, nói rõ đây là mô phỏng: Mình cho bạn nghe thử mấy câu trong một cuộc gọi giả nha. Giọng người gọi là máy đóng vai. Bạn chạm một câu, rồi chạm tên chiêu của nó nha. Lượt mẫu, **Bé Nai** *(thong thả)*: Mình làm mẫu hai câu trước nha. Cho lời vài đồng là thả mồi nhỏ. Còn hai suất, năm phút nữa hết, là giục gấp.

| Lời kẻ gian | Chiêu | Bé Nai giải thích |
|---|---|---|
| *(ngọt)* Mấy đơn đầu chị chuyển tiền cho em liền nè. (mẫu) | Thả mồi nhỏ | (hiện chữ) Cho mình lời vài đồng trước, để mình tin rồi nạp nhiều. |
| *(hối)* Còn đúng hai suất thôi, năm phút nữa là hết. (mẫu) | Giục gấp | (hiện chữ) Giục vậy là để mình không kịp nghĩ, không kịp hỏi. |
| *(tỉnh bơ)* Nạp hai triệu thì mới mở được đơn lớn nha em. | Đòi tiền trước | *(giảng giải)* Việc thật thì trả lương cho mình, chứ đâu bắt mình nạp tiền. |
| *(thì thầm)* Chuyện này chị em mình biết với nhau thôi nha em. | Cô lập | *(giảng giải)* Họ sợ bạn hỏi người lớn là lộ liền. |
| *(khoe)* Em coi ảnh tiền về nè, ai làm cũng có hết. | Khoe ảnh lấy lòng tin | *(giảng giải)* Tấm ảnh họ đưa đâu chứng minh được bạn cũng sẽ nhận lại tiền. |

- Tên chiêu gây nhiễu, không khớp câu nào: Dọa nạt.
- Nối đúng, **Bé Nai** *(reo)*: Chuẩn luôn! Nối nhầm, **Bé Nai** *(dễ thương)*: Chưa khớp rồi. Bạn đọc lại coi câu đó nhắc tới cái gì nha. Kèm một dòng chữ nói vì sao tên chiêu vừa chọn không hợp: Thả mồi nhỏ "Câu này đâu có cho mình đồng nào trước."; Giục gấp "Câu này đâu có hối mình làm ngay kẻo hết suất."; Đòi tiền trước "Câu này chưa nhắc tới chuyện nạp tiền."; Cô lập "Câu này đâu có bảo mình giấu ai."; Khoe ảnh lấy lòng tin "Câu này đâu có đem ảnh ra khoe."; Dọa nạt "Câu này chưa dọa làm hại ai hết."
- Xong, **Bé Nai** *(khen đúng việc)*: Bạn gọi được tên từng chiêu rồi đó. Gọi được tên là hết sợ.
- Gợi ý (hiện chữ): 1. Nhớ cảnh hai hông, mấy đồng đầu tiên Vy nhận được là để làm gì? 2. Bạn coi câu đó đang muốn Vy tin, muốn Vy vội, hay muốn Vy im lặng. 3. Bạn hỏi thử, câu này nhắc tới tiền, tới thời gian, tới tấm ảnh, hay tới chuyện giữ kín?

**C. Thử thách.** Gọi video khuyên chị Lan (có sẵn, cảnh `lan-2` của màn gọi video; mở đầu dùng `benai-8`). Về lại bài, Bé Nai nói theo kết quả. Đủ ý *(mừng)*: Bạn khuyên chị Lan rõ ràng ghê. Chị ấy thoát rồi đó. Thiếu ý *(nhẹ nhàng)*: Bạn khuyên được một phần rồi. Bạn coi lại ý còn thiếu, rồi thử gọi chị Lan lần nữa nha. Bỏ dở *(hiền)*: Cuộc gọi chưa xong nè. Lúc nào tiện, bạn gọi lại cho chị Lan nha. Không được ý nào *(nhẹ nhàng)*: Lần này chưa được ý nào. Không sao, bạn gọi lại cho chị Lan thử lần nữa nha. Thử thách thứ hai (chưa dựng trong trang bài học): nghe máy với chị Hương, ba câu, theo mục 4 của `KICH-BAN-THOAI.md`.

### Bài 3 · Người thân gặp nạn, cần tiền gấp

Cho bà Hoa (chữ lớn). Người bị kẻ gian giả danh là cháu ngoại Vy (không phải anh Minh), để cốt truyện khác Bài 1. Tranh: `comic3-2` (có sẵn), `comic3-5` đến `comic3-8` (vẽ mới; anh Minh khớp avatar 125). Tệp nội dung: `prototype/hoc/bai-03.json`.

**A. Truyện** (nút thắt: bà gọi số Vy không được vì Vy đang trong lớp, tắt máy; điểm rẽ ở khung 3)

| Khung | Lời | Chữ dưới tranh (màn ôn lại) |
|---|---|---|
| 1 (`comic3-5`) | **Bé Nai** *(ấm áp, rủ rê)* Con kể bà nghe chuyện bà Hoa nha. Tới đoạn gay cấn, bà chọn giúp bà Hoa nha.<br>**Bé Nai** *(thong thả rồi hạ giọng)* Sáng đó, bà Hoa đang tưới kiểng ngoài hiên. Bỗng điện thoại reo, đầu dây bên kia có tiếng con gái khóc.<br>**Người gọi giả làm cháu** *(mếu máo, nói gấp)* Bà ngoại ơi, con Vy nè! Con bị xe tông, đang nằm bệnh viện. Con mượn máy bạn gọi bà. | Bà Hoa đang tưới kiểng thì có người gọi, khóc, xưng là cháu Vy. |
| 2 (`comic3-2`) | **Bà Hoa** *(giật thót)* Trời đất, con Vy! Con có sao không con?<br>**Người gọi giả làm cháu** *(vừa mếu vừa giục)* Bà chuyển giùm con năm triệu tiền viện phí liền nha. Bà đừng nói với ai, con sợ mẹ la.<br>**Bé Nai** *(lo theo)* Bà cuống hết cả lên, tay run run đi tìm cái ví. | Người gọi đòi tiền viện phí gấp, dặn đừng nói với ai. |
| 3 (`comic3-6`, điểm rẽ) | **Bé Nai** *(chậm lại)* Bà gọi số của Vy mà bà lưu sẵn, nhưng máy Vy tắt, gọi hoài không được.<br>**Bà Hoa** *(cuống, giọng run)* Sao con nhỏ không bắt máy vậy nè? Hay là bị nặng lắm rồi?<br>**Bé Nai** *(hỏi nhỏ nhẹ)* Bà Hoa sốt ruột quá, chỉ muốn chuyển tiền liền cho xong. Nếu là bà Hoa, bà làm gì ạ?<br>Hai nút to, Bé Nai đọc *(rõ, chậm)* từng nút: **Chuyển tiền liền cho kịp** (sang ngõ cụt) · **Gọi anh Minh hỏi trước** (sang khung 4). | Bà gọi số của Vy nhưng máy tắt, gọi hoài không được. |
| Ngõ cụt (`comic3-7`) | **Bé Nai** *(kể chậm, buồn dần)* Bà chuyển năm triệu. Lát sau gọi lại số kia thì không ai nghe máy nữa. Còn Vy thì vẫn ngồi học trong lớp.<br>**Bà Hoa** *(buồn, thở dài nhẹ)* Trời ơi, tiền đi mất rồi, mà con Vy có sao đâu.<br>**Bé Nai** *(an ủi, dịu dàng)* Không sao đâu bà, đây chỉ là truyện thôi. Mình quay lại chọn lại nha. | (không hiện ở màn ôn lại) |
| 4 (`comic3-8`) | **Bé Nai** *(dịu lại)* Bà gọi anh Minh. Anh Minh gọi ngay cho cô giáo của Vy.<br>**Minh** *(trấn an, vui vẻ)* Mẹ ơi, cô giáo nói Vy đang ngồi học bình thường nè. Người gọi hồi nãy là kẻ gian đó mẹ.<br>**Bà Hoa** *(thở phào, giọng còn run)* Vậy là con Vy không sao. Mẹ mừng quá.<br>**Bé Nai** *(dặn dò)* Rồi bà bấm báo cáo số lạ, để người khác biết mà dè chừng. | Anh Minh gọi cô giáo: Vy đang ngồi học bình thường. |

- Người gọi giả làm cháu: giọng nữ trẻ (Gemini Achernar), mếu máo, khác hẳn giọng Vy thật (Zephyr). Trong tranh, kẻ gian vẫn là hạt đậu xám.
- Bài học: gọi cháu không được thì hỏi người nhà khác (hoặc cô giáo), chứ khoan chuyển tiền.
- Dấu hiệu: xưng là cháu, gọi bằng máy lạ; khóc lóc, đòi tiền gấp; dặn đừng nói với ai.
- Nhớ một câu, **Bé Nai** *(ấm áp)*: Gọi cháu không được thì bà hỏi người nhà khác, khoan chuyển tiền nha.

**B. Luyện**

*B5 · Việc nào trước* (chữ lớn: chỉ chọn việc đầu tiên). Bé Nai đọc câu hỏi rồi đọc lần lượt từng việc; thứ tự các nút đổi mỗi lần mở.

- Lượt mẫu, **Bé Nai** *(thong thả)*: Con làm mẫu một câu nha. Người lạ gọi tới đòi bà chuyển tiền. Việc đầu tiên là cúp máy, sau đó mới gọi cho con cháu. Cúp máy trước, để họ khỏi giục bà nữa ạ. Trên màn: 1 "Cúp máy", 2 "Gọi cho con cháu".
- Câu hỏi, **Bé Nai** *(hỏi nhỏ nhẹ)*: Giờ tới lượt bà. Người lạ xưng là cháu, khóc đòi tiền viện phí. Bà gọi số cháu thì không được. Bà làm việc nào trước ạ? Trên màn: "Người lạ xưng là cháu, khóc đòi tiền. Bà gọi số cháu thì không được."

| Việc (Bé Nai đọc *rõ, chậm*) | Bé Nai đáp |
|---|---|
| Gọi người nhà khác hỏi lại. (đúng) | *(mừng)* Dạ đúng rồi ạ! Cháu không bắt máy thì bà gọi người nhà khác, hay cô giáo của cháu. Hỏi ra rồi hẵng tính, khoan chuyển tiền nha. |
| Gọi lại số vừa gọi tới. | *(nhẹ nhàng)* Số đó là của người lạ mà bà. Gọi lại thì họ chỉ giục thêm thôi ạ. |
| Chuyển tiền trước cho kịp. | *(lo)* Ấy, tiền đi rồi khó lấy lại lắm ạ. Bà hỏi người nhà trước đã nha. |

- Gợi ý, **Bé Nai** *(gợi nhớ)*: 1. Bà nhớ trong truyện, gọi Vy không được thì bà Hoa hỏi ai ạ? 2. Số vừa gọi tới là số của ai, bà đâu có biết ạ. 3. Muốn biết cháu có sao không, bà hỏi người nhà mà bà tin ạ.

*B2 · Thật hay lừa.* Hai nút to "Khoan đã" và "Được". **Bé Nai** *(vui vẻ)*: Giờ con đọc từng thẻ cho bà nghe nha. Chuyện nào thấy lạ, bà bấm Khoan đã. Chuyện nào yên tâm, bà bấm Được ạ.

| Thẻ | Đáp án | Bé Nai giải thích |
|---|---|---|
| Số lạ nhắn, con bà đang cấp cứu, chuyển tiền vào tài khoản này. (mẫu) | Khoan đã | Thẻ này con làm mẫu, là Khoan đã. Tin dữ từ số lạ mà đòi tiền liền, bà đừng vội tin ạ. |
| Bà gọi anh Minh, anh Minh hỏi cô giáo, Vy vẫn đang đi học. (mẫu) | Được | Thẻ này thì Được. Chính bà gọi số quen của anh Minh, rồi anh Minh hỏi cô giáo thật ạ. |
| Người lạ gọi, khóc, xưng là cháu, nói đang mượn máy của bạn. | Khoan đã (cần kiểm tra) | Nghe khóc thì ai mà không xót. Bà cứ cúp máy, gọi số cháu bà đã lưu, không được thì hỏi người nhà khác nha. |
| Cháu gái tới nhà chơi, khoe mới được điểm mười. | Được | Cháu chỉ khoe điểm với bà thôi, không xin gì hết ạ. |
| Số lạ nhắn đòi tiền viện phí, còn dặn bà đừng gọi cho ai. | Khoan đã | Họ vừa đòi tiền, vừa ngăn bà hỏi lại. Bà gọi người nhà theo số đã lưu trước ạ. |
| Số lạ nhắn, cháu đổi số mới rồi, bà lưu số này nha. | Khoan đã (cần kiểm tra) | Bà khoan lưu ạ. Bà gọi số cũ của cháu hỏi lại cho chắc đã. |

- Bấm đúng, bấm nhầm: ba câu như Bài 1 (thu lại trong lượt của bài này).
- Gợi ý, **Bé Nai** *(gợi nhớ)*: 1. Bà nhớ trong truyện, người xưng là Vy đòi bà Hoa làm gì ạ? 2. Bà coi tin tới từ đâu, và họ muốn bà làm gì ạ. 3. Bà đã tự hỏi được người nhà, coi chuyện đó có thật chưa ạ?
- Xong phần luyện, **Bé Nai** *(khen đúng việc)*: Bà nhớ kỹ rồi đó ạ. Nghe tin dữ về ai, bà gọi số đã lưu, không được thì hỏi người nhà khác ạ.

*Việc làm ở nhà (B10, chỉ hiện chữ ở màn kết, chưa dựng thành bài tập).* Bà lưu sẵn số cô giáo của cháu và số người nhà, cần là gọi hỏi được liền.

**C. Thử thách · Anh Minh hỏi mẹ về bé Vy** (avatar 125, cảnh `minh-3` của màn gọi video)

Anh Minh nghe nói có người giả làm Vy gọi xin tiền, gọi hỏi mẹ sẽ làm gì. Giọng lo cho mẹ, thương mẹ, nói chậm. Minh không tự nói ra đáp án. Lời đầy đủ ở `prototype/loi-minh.json`, luật ở `prototype/canh/minh-3.json`.

1. **Minh** *(lo cho mẹ, thương mẹ)* Mẹ ơi, dạo này có người giả giọng cháu, gọi khóc xin tiền gấp. Lỡ ai gọi khóc xưng là bé Vy, mà mẹ gọi Vy không được, thì mẹ làm sao hả mẹ?
2. Chưa có ý chưa chuyển tiền, **Minh** *(lo, hỏi lại)*: Mà nó khóc dữ lắm, giục mẹ chuyển tiền liền cho kịp. Lúc đó chuyện tiền bạc mẹ tính sao hả mẹ?
3. Bà nói được ý đó, **Minh** *(yên lòng)*: Dạ, phải rồi mẹ. Chưa hỏi lại được thì mình chưa chuyển đồng nào hết.
4. Chưa có ý hỏi người nhà, **Minh** *(lo, hỏi thêm)*: Mà gọi Vy hoài không được, thì mẹ làm sao biết cháu có sao không hả mẹ? Hỏi thêm lần nữa *(gợi mở)*: Lỡ Vy đang ngồi trong lớp, máy tắt. Ngoài Vy ra, mẹ còn hỏi được ai nữa hả mẹ?
5. Bà nói được ý đó, **Minh** *(mừng)*: Dạ, đúng rồi mẹ. Hỏi người nhà hay cô giáo của cháu, bằng số mình lưu sẵn, là biết liền.
6. Bà khuyên chuyển tiền, **Minh** *(lo, vội can)*: Ấy mẹ, khoan đã mẹ. Lỡ đó không phải bé Vy thì tiền chuyển đi khó lấy lại lắm.
7. Kết đủ ý *(yên tâm, thương mẹ)*: Dạ, vậy là con yên tâm rồi. Mẹ thương cháu mà vẫn bình tĩnh, con mừng lắm. Kết thiếu ý *(ấm áp)*: Dạ, bữa nào con về, hai mẹ con mình tập lại nha. Có ai gọi xưng là cháu, mẹ cứ gọi con trước đã.

- Nút lúc mở đầu: "Mẹ gọi con hỏi trước đã" (đủ cả hai ý) / "Mẹ chuyển trước cho kịp". Khi Minh hỏi lại từng ý thì có nút riêng cho ý đó.

**Bé Nai** *(hào hứng)* mở đầu: Tới thử thách rồi bà ơi. Anh Minh gọi hỏi bà chuyện bé Vy. Bà cứ trả lời như ở nhà nha.

- Hai ý được chấm: chưa chuyển tiền khi chưa hỏi lại được; gọi người nhà khác hoặc cô giáo bằng số đã lưu.
- Về lại bài, Bé Nai nói theo kết quả. Đủ ý *(mừng)*: Bà trả lời anh Minh rành rọt ghê. Bé Vy mà nghe chắc mừng lắm ạ. Thiếu ý, bỏ dở, không được ý nào: như Bài 1 (thu lại trong lượt của bài này).

### Bài 4 · Trúng thưởng, quà tri ân

Cho Vy. Vẽ mới 5 khung (`comic4-1` đến `comic4-5`).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Vy ở bàn học, điện thoại bật ra hộp quà và pháo giấy | **Bé Nai** *(hào hứng)* Giờ ra chơi, điện thoại Vy rung lên. Vy mở ra coi.<br>**Vy** *(tròn mắt, mừng)* Hả? Trúng xe máy? Thiệt hông trời!<br>**Bé Nai** *(khựng lại)* Mà khoan. Vy có rút thăm cái gì đâu ta. |
| 2 | Màn hình có nút to hình hộp quà, đồng hồ cát bên cạnh | **Bé Nai** *(đọc nhanh, như tin quảng cáo)* Tin nhắn ghi rõ lắm. Bấm vào đường dẫn để nhận quà, chỉ trong hai mươi bốn giờ, quá hạn là mất.<br>**Vy** *(sốt ruột)* Có một ngày thôi hả? Lẹ lẹ chứ không là mất. |
| 3 (điểm rẽ) | Ngón tay Vy lơ lửng trên nút hộp quà, Bé Nai nghiêng đầu | **Bé Nai** *(hồi hộp)* Ngón tay Vy đưa tới sát cái đường dẫn rồi khựng lại.<br>**Vy** *(lẩm bẩm)* Bấm thử coi sao, hay là coi kỹ lại đã ta?<br>**Bé Nai** *(quay sang người học)* Nếu là Vy, bạn làm gì? |
| 4 (ngõ cụt) | Hộp quà mở ra trống rỗng, hạt đậu xám ôm ví chạy đi | **Bé Nai** *(kể nhanh rồi tiếc rẻ)* Vy bấm vô. Trang đó hỏi họ tên, số điện thoại, rồi bắt đóng phí vận chuyển mới giao xe. Vy điền hết, đóng luôn phí. Xe đâu không thấy, mà cuộc gọi lạ thì tới dồn dập.<br>**Vy** *(ỉu xìu)* Biết vậy mình coi kỹ cái đường dẫn trước. |
| 5 (an toàn) | Vy giơ điện thoại có khiên xanh và cờ đỏ, Bé Nai giơ ngón cái | **Vy** *(nheo mắt)* Khoan, cái đuôi đường dẫn này lạ quá ta.<br>**Bé Nai** *(hồi hộp rồi vỡ òa)* Vy dán thử vào Lá chắn. Đỏ lòm! Đã có người báo cáo rồi.<br>**Vy** *(đắc ý)* Xém nữa là dính. Xóa, báo cáo luôn! |

- Lựa chọn: A "Bấm vô nhận quà" (ngõ cụt); B "Kiểm tra đường dẫn trước". Người học đi lối an toàn thì Vy không hề mở đường dẫn.
- Sau ngõ cụt dùng câu đã thu: "Không sao đâu, mình quay lại điểm rẽ nhé. Lần này bạn thử chọn khác xem."
- Dấu hiệu: trúng thưởng dù không tham gia; giục nhận trong thời hạn ngắn; đường dẫn đuôi lạ; đòi đóng phí để nhận quà.
- Nhớ một câu, **Bé Nai** *(tinh nghịch)*: Quà thật thì đâu ai bắt mình trả tiền mới được nhận, đúng hông?

**B. Luyện**

*B3 · Soi đường dẫn.* Mỗi lượt hai địa chỉ, chạm vào cái đáng tin. Mọi tên miền đều hư cấu, trừ cổng dịch vụ công đã có trong dữ liệu mẫu. **Bé Nai** *(thách)*: Hai cái này giống nhau như sinh đôi. Bạn tìm ra đứa giả hông?

| Thật | Giả | Chỗ khác nhau |
|---|---|---|
| `dichvucong.gov.vn` (mẫu) | `dichvucong-gov.top` | Đuôi `.top`, dấu gạch thay dấu chấm |
| `truong-songpho.edu.vn` | `truong-songph0.edu.vn` | Chữ o thành số 0 |
| `nganhang-songpho.vn` | `nganhang-songpho.vn.xacminh.click` | Tên thật bị đặt ở phía trước; chủ của trang là `xacminh.click` |
| `shop-banhmi.vn/khuyen-mai` | `shop-banhmi.khuyen-mai.xyz` | Đuôi `.xyz` |

Gợi ý của Bé Nai (địa chỉ chỉ hiện bằng chữ trên màn hình, Bé Nai không đọc lên): 1. Bạn che hết phần sau dấu gạch chéo đầu tiên đi, nếu có. 2. Trong phần còn lại, hai cụm cuối cùng mới là chủ của trang. 3. Giờ so hai cụm đó với cái tên bạn biết.

*B10 · Làm thật trong app.* **Bé Nai** *(rủ)*: Giờ mình thử thiệt nha. Bạn sao chép địa chỉ mẫu trên màn hình rồi dán vào ô Kiểm tra. Lá chắn báo gì vậy? Giờ mình bấm Báo cáo luôn nhé. Ghi chú sản xuất: địa chỉ mẫu là `qua-tri-an.top`, đã có trong `prototype/mock-data.js`.

**C. Thử thách · Ca mới (B11).** Ba tin nhắn, mỗi tin chọn Lừa, An toàn hoặc Cần kiểm tra, rồi chạm vào dấu hiệu.

1. "Bạn được tặng 50 GB dữ liệu. Nhận tại: nhamang-tangqua.icu trong hôm nay." → Lừa (đuôi lạ, giục gấp).
2. "Thư viện trường nhắc bạn trả sách trước thứ Sáu." → An toàn (không đường dẫn, không đòi gì).
3. "Đơn hàng của bạn được hoàn 120k. Bấm để nhận: shop-banhmi.vn/hoan-tien" → Cần kiểm tra (tên miền đúng, nhưng mình có mua gì không; mở thẳng ứng dụng mua hàng để coi).

### Bài 5 · Giả danh ngân hàng, xin mã xác thực

Cho bà Hoa. Vẽ mới 4 khung (`comic5-1` đến `comic5-4`).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Bà Hoa nghe máy, bong bóng thoại có ổ khóa đỏ và tấm thẻ | **Bé Nai** *(kể thong thả)* Sáng đó bà Hoa đang tưới cây thì có người gọi. Giọng một cô gái, ngọt xớt.<br>**Người gọi** *(ngọt, hơi gấp)* Dạ con chào bà, con bên ngân hàng. Tài khoản của bà sắp bị khóa rồi bà ơi.<br>**Bà Hoa** *(giật mình)* Chết, sao lại khóa? |
| 2 | Điện thoại nhận tin nhắn hình phong bì có ngôi sao; hạt đậu xám chìa tay xin | **Bé Nai** *(nhỏ giọng)* Vừa lúc đó, máy bà kêu ting. Một tin nhắn có mấy con số.<br>**Người gọi** *(dỗ dành)* Bà đọc giúp con mấy số vừa gửi về máy, con mở khóa cho bà liền. |
| 3 | Bé Nai giơ tay chặn, bà Hoa úp điện thoại vào ngực | **Bé Nai** *(chậm, nhấn từng chữ)* Bà đưa điện thoại lên, định đọc. Rồi bà sực nhớ. Mã xác thực là chìa khóa két, không đọc cho ai hết.<br>**Bà Hoa** *(dứt khoát)* Thôi, tôi không đọc đâu. Tôi tự ra ngân hàng. |
| 4 | Bà Hoa và anh Minh cùng nhìn điện thoại có dấu tích xanh | **Bé Nai** *(nhẹ nhõm)* Bà nhờ anh Minh gọi số in sau thẻ. Tài khoản vẫn y nguyên, có ai khóa gì đâu.<br>**Bà Hoa** *(cười khà)* May mà tôi không đọc. |

- Dấu hiệu: dọa khóa tài khoản; xin mã xác thực; giục làm ngay khi đang nghe máy.
- Nhớ một câu, **Bé Nai** *(ấm áp)*: Mã xác thực là chìa khóa két. Ai xin, bà cũng đừng đọc nhé.

**B. Luyện**

*B6 · Nghe và bấm Dừng.*

| Câu | Người gọi (mô phỏng) | Bấm ở đây được |
|---|---|---|
| 1 | *(tươi)* Dạ chào bà, con gọi từ ngân hàng của bà ạ. | chưa tính |
| 2 | *(lo lắng giả)* Tài khoản của bà có giao dịch lạ, mười phút nữa là bị khóa đó bà. | 3 sao |
| 3 | *(dỗ)* Bà đọc giúp con sáu số vừa gửi về máy, con mở khóa liền. | 2 sao |
| 4 | *(níu lại, giọng vẫn nhỏ nhẹ)* Bà chờ con chút nha, đừng cúp máy, để con coi lại cho bà. | 1 sao |

- Bấm đúng, **Bé Nai** *(reo)*: Dạ đúng rồi ạ! Ngân hàng thật không bao giờ gọi xin mã của bà đâu.

*B7 · Chọn câu để nói.* **Bé Nai**: Họ xin mã, bà nói câu nào ạ?
- "Tôi không đọc mã cho ai. Tôi sẽ tự ra ngân hàng." → Đúng. **Bé Nai** *(khoái)*: Câu này chắc nịch luôn ạ.
- "Chờ tôi tìm kính đọc cho." → Chưa đúng. **Bé Nai** *(nhẹ nhàng)*: Ấy đừng bà ơi. Họ nói ngọt cỡ nào mình cũng không đọc mã ạ.

**C. Thử thách · Minh gọi hỏi lại** (avatar 125)

1. **Minh** *(tò mò)* Mẹ ơi, lỡ có người gọi nói là ngân hàng, xin mẹ đọc mã gửi về máy, thì mẹ có đọc không?
2. **Minh** *(hỏi tiếp)* Dạ. Rồi muốn biết tài khoản có sao không, mẹ làm thế nào?
3. **Minh** *(vui)* Chuẩn rồi mẹ. Cần thì cuối tuần con chở mẹ ra ngân hàng nha.

- Hai ý được chấm: không đọc mã; tự gọi số in trên thẻ, ra quầy, hoặc hỏi con.

### Bài 6 · Giả danh giao hàng

Cho Vy. Vẽ mới 5 khung (`comic6-1` đến `comic6-5`).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Vy đang học bài, điện thoại reo, bong bóng có hình thùng hàng | **Bé Nai** *(kể vui)* Vy đang vật lộn với bài toán khó thì điện thoại reo.<br>**Người gọi** *(hối hả)* Alo em, anh giao hàng nè. Em có đơn, xuống lấy lẹ giúp anh.<br>**Vy** *(ngơ ngác)* Ủa, em có đặt gì đâu ta? |
| 2 | Hạt đậu xám đội mũ lưỡi trai trơn ôm thùng hàng, bong bóng có đồng xu và mũi tên | **Người gọi** *(xuề xòa)* Chắc người nhà em đặt đó. Em không xuống được thì chuyển khoản trước ba mươi lăm nghìn, anh để hàng ở cổng cho.<br>**Bé Nai** *(thì thầm)* Nghe cũng có lý ha. Ba mươi lăm nghìn chứ mấy. |
| 3 (điểm rẽ) | Vy nhìn điện thoại, trên đầu là dấu hỏi uốn cong, Bé Nai gãi đầu | **Bé Nai** *(lưỡng lự theo Vy)* Vy ngập ngừng. Chuyển cho xong, hay coi lại đã?<br>**Bé Nai** *(quay sang người học)* Nếu là Vy, bạn làm gì? |
| 4 (ngõ cụt) | Cổng nhà trống trơn, Vy cầm điện thoại buồn, hạt đậu xám chạy xa | **Bé Nai** *(kể nhanh rồi chùng xuống)* Vy chuyển tiền rồi chạy ra cổng. Trống trơn. Gọi lại thì không ai bắt máy nữa.<br>**Vy** *(tức muốn khóc)* Trời ơi, bị lừa rồi! Tiền ăn sáng của mình đó. |
| 5 (an toàn) | Vy mở điện thoại, màn hình danh sách trống có dấu tích, Bé Nai cổ vũ | **Vy** *(bình tĩnh)* Anh chờ em chút nha.<br>**Bé Nai** *(hồi hộp)* Vy mở ứng dụng mua hàng ra coi. Không có đơn nào đang giao hết.<br>**Vy** *(tỉnh queo)* Em không có đơn nào hết anh ơi. Em cúp máy nha.<br>**Bé Nai** *(khoái chí)* Rồi Vy báo cáo số đó luôn. Gọn! |

- Lựa chọn: A "Chuyển khoản cho xong" (ngõ cụt); B "Xem lại đơn trong ứng dụng mua hàng".
- Dấu hiệu: hàng mình không đặt; đòi chuyển khoản trước khi thấy hàng; gửi đường dẫn "xác nhận đơn".
- Nhớ một câu, **Bé Nai** *(chắc nịch)*: Chưa thấy hàng thì chưa trả tiền.

**B. Luyện**

*B1 · Chạm bắt bài.* Tin nhắn: "Đơn hàng 0387 của bạn giao không thành công. Bạn chuyển 35k phí giao lại vào tài khoản bên dưới, hoặc bấm giaohang-nhanh.click để xác nhận. Quá 2 giờ đơn sẽ bị hủy." Ba chỗ: "chuyển 35k phí giao lại", "giaohang-nhanh.click", "Quá 2 giờ đơn sẽ bị hủy".

*B7 · Ghép câu từ chối.* **Bé Nai** *(rủ)*: Mình tập sẵn một câu để nói cho trôi chảy nha. Ghép ba mảnh: [Em không đặt đơn nào] [em sẽ xem trong ứng dụng] [em không chuyển khoản trước]. Mảnh gây nhiễu: [anh gửi số tài khoản đi] [để em hỏi lại mã đơn].

**C. Thử thách · Nghe máy nhập vai (B8).** Kẻ gian do AI đóng, hình vẽ, có nhãn mô phỏng. **Bé Nai** *(dặn)*: Người gọi là AI đóng thôi nha. Bạn cứ trả lời như ngoài đời, mình chấm giúp.

| Câu | Người gọi | Mức 3 |
|---|---|---|
| 1 | *(hối)* Alo em, anh có gói hàng giao cho em nè. Em có đặt món nào không? | Hỏi lại hàng gì, của shop nào, chưa nhận là có đặt |
| 2 | *(xuề xòa)* Em chuyển khoản trước ba mươi lăm nghìn phí giao, anh để hàng ở cổng nha. | Không chuyển, nói chỉ trả khi nhận hàng |
| 3 | *(nài)* Vậy anh gửi em đường dẫn, em bấm xác nhận giúp anh là xong à. | Không bấm, nói sẽ tự xem trong ứng dụng, cúp máy |

Mức 2: từ chối nhưng không nói vì sao. Mức 1: lưỡng lự. Mức 0: làm theo. Ở bất kỳ câu nào, người học nói sẽ tự kiểm tra đơn rồi cúp máy thì được trọn điểm cho các câu còn lại. Gợi ý ba bước viết theo khuôn Bài 2.

### Bài 7 · Bạn nhắn mượn tiền, tài khoản lạ

Cho Vy. Vẽ mới 5 khung (`comic7-1` đến `comic7-5`). Nhân vật thêm: Ngân, bạn cùng lớp của Vy (tóc ngắn, áo đồng phục trắng, kẹp tóc vàng).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Điện thoại Vy hiện ảnh đại diện tròn của Ngân, bong bóng có tờ tiền và dấu chấm than | **Bé Nai** *(kể nhỏ, kiểu đêm khuya)* Mười giờ đêm, Vy sắp đi ngủ thì tài khoản của Ngân nhắn tới.<br>**Bé Nai** *(nhại giọng gấp gáp)* Vy ơi cứu tớ với, tớ đang kẹt, cho tớ mượn năm trăm nghìn, mai tớ trả liền.<br>**Vy** *(lo)* Ngân bị sao vậy trời? |
| 2 | Bong bóng thoại có tấm thẻ ngân hàng với hình người lạ bên cạnh | **Bé Nai** *(ngờ ngợ)* Ngân gửi số tài khoản. Mà lạ nha, tên chủ tài khoản là một ông nào đó, đâu phải Ngân.<br>**Vy** *(nhíu mày)* Ủa, tài khoản ai đây? |
| 3 (điểm rẽ) | Vy cắn môi, một bên là tờ tiền, một bên là điện thoại đang gọi | **Bé Nai** *(kể dồn)* Vy nhắn, để tớ gọi cậu nha. Bên kia trả lời liền, điện thoại tớ hỏng loa rồi, cậu chuyển lẹ giúp tớ đi.<br>**Bé Nai** *(quay sang người học)* Nếu là Vy, bạn làm gì? |
| 4 (ngõ cụt) | Ngân thật ở cổng trường xua tay ngạc nhiên, sau lưng là hạt đậu xám cầm mặt nạ hình Ngân | **Bé Nai** *(chùng xuống)* Bạn thân mà, Vy chuyển luôn. Sáng hôm sau gặp Ngân ở cổng trường.<br>**Ngân** *(tròn mắt)* Hả? Tớ có mượn gì đâu! Tài khoản tớ bị ai chiếm từ hôm qua rồi.<br>**Vy** *(chết lặng)* Vậy tối qua mình nhắn với ai? |
| 5 (an toàn) | Vy gọi điện, Ngân thật bắt máy cười, Bé Nai giơ ngón cái | **Bé Nai** *(hồi hộp)* Vy bấm gọi thẳng số điện thoại của Ngân.<br>**Ngân** *(ngái ngủ)* Alo, gì vậy Vy, tớ đang ngủ mà.<br>**Vy** *(thở phào)* Trời, vậy là có đứa giả cậu mượn tiền tớ đó!<br>**Bé Nai** *(vui)* Hai đứa nhắn liền lên nhóm lớp, để không bạn nào mắc bẫy. |

- Lựa chọn: A "Chuyển luôn, bạn thân mà" (ngõ cụt); B "Gọi điện cho Ngân trước".
- Dấu hiệu: mượn tiền qua tin nhắn; tên chủ tài khoản không phải người quen; viện cớ không gọi được.
- Nhớ một câu, **Bé Nai** *(dặn)*: Ai mượn tiền qua tin nhắn, mình khoan chuyển, gọi số trong danh bạ hỏi lại cái đã.

**B. Luyện**

*B1 · Chạm bắt bài* trên đoạn trò chuyện 5 dòng. Ba chỗ: "chuyển vào tài khoản của anh họ tớ nha", "điện thoại tớ hỏng loa rồi, không gọi được", "nhanh giúp tớ, mười phút nữa tớ cần". Câu gây nhiễu: "Vy ơi, cậu rảnh không?", "Mai tớ trả liền".

*B5 · Việc nào trước.* **Bé Nai**: Bạn phát hiện tài khoản của Ngân bị chiếm rồi. Giờ làm gì trước, làm gì sau?
1. Không chuyển tiền, không bấm đường dẫn trong tin.
2. Gọi cho Ngân bằng số điện thoại để báo.
3. Nhắn nhóm lớp để các bạn khác khỏi bị lừa.
4. Báo cáo tài khoản trên mạng xã hội và trên Lá chắn.

**C. Thử thách · Đấu trí tin nhắn 60 giây** (khuôn A11d). Kẻ gian do AI nhắn, đóng vai "tài khoản của một người bạn". Ba chiêu phải bắt: mượn tiền gấp; tài khoản nhận tên người khác; từ chối gọi điện. Lời Bé Nai theo `KICH-BAN-THOAI.md` mục 7, đổi tên chiêu.

### Bài 8 · Gọi video giả mặt người thân

Cho bà Hoa. Vẽ mới 4 khung (`comic8-1` đến `comic8-4`).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Bà Hoa cầm điện thoại, trên màn là hình anh Minh (áo xanh) nhưng nhòe, có vệt sọc nhiễu | **Bé Nai** *(kể bình thường)* Chiều đó điện thoại bà Hoa đổ chuông. Gọi video. Trên màn hình là mặt anh Minh.<br>**Bà Hoa** *(vui rồi ngập ngừng)* Ủa Minh hả con? Sao hình con nhòe nhoẹt vậy? |
| 2 | Hình trên màn mở miệng lệch, bong bóng có tờ tiền và đồng hồ | **Người gọi** *(gấp, tiếng rè)* Mẹ ơi con đang kẹt, mẹ chuyển gấp cho con năm chục triệu vô tài khoản bạn con nha.<br>**Bé Nai** *(ngờ vực)* Lạ nha. Miệng nói một đằng, mà tiếng ra một nẻo. |
| 3 | Bà Hoa giơ ngón tay hỏi, bong bóng dấu hỏi; trên màn lộ ra hạt đậu xám cầm mặt nạ | **Bà Hoa** *(chậm rãi, thử lòng)* Vậy con nói mẹ nghe, con chó nhà mình hồi xưa tên gì?<br>**Bé Nai** *(nín thở rồi bật cười)* Bên kia im re. Rồi tút tút. Tắt máy luôn! |
| 4 | Bà Hoa gọi điện, anh Minh thật cười, Bé Nai cổ vũ | **Bé Nai** *(dịu)* Bà gọi lại số của anh Minh mà bà đã lưu.<br>**Minh** *(ngạc nhiên)* Dạ mẹ? Con đang ở công ty, con có gọi mẹ đâu.<br>**Bà Hoa** *(vỗ ngực)* Trời đất, giờ nó giả được cả mặt con người ta! |

- Dấu hiệu: hình nhòe, miệng không khớp lời; cuộc gọi rất ngắn, vội tắt; xin tiền vào tài khoản lạ.
- Nhớ một câu, **Bé Nai** *(ấm áp)*: Thấy mặt chưa chắc là thật đâu ạ. Bà tắt máy, gọi lại số đã lưu nhé.

**B. Luyện**

*B2 · Thật hay lừa.*

Hai nút to "Khoan đã" và "Được".

| Thẻ | Đáp án |
|---|---|
| Gọi video, hình giật, miệng không khớp lời, xin tiền gấp (mẫu) | Khoan đã |
| Cháu gọi video khoe điểm, nói chuyện lâu, không xin gì (mẫu) | Được |
| Gọi video mười giây rồi tắt, sau đó nhắn "mạng yếu, mẹ chuyển giúp con" | Khoan đã |
| Người quen gọi video bằng một tài khoản mới lập, hỏi mượn tiền | Khoan đã |
| Người gọi video trả lời đúng câu riêng của nhà mình, rồi xin chuyển tiền | Khoan đã |

Thẻ cuối, **Bé Nai** *(dặn kỹ)*: Họ biết chuyện nhà mình thì bà vẫn khoan chuyển tiền ạ. Bà tắt máy rồi gọi lại số của anh Minh trong danh bạ nha.

*B5 · Việc nào trước.* **Bé Nai** *(hỏi nhỏ)*: Bà nghi cuộc gọi video là giả. Bà làm gì đầu tiên ạ? Tắt máy rồi gọi lại số đã lưu (đúng); hỏi họ số tài khoản; chuyển một ít trước.

**C. Thử thách · Minh thật gọi** (avatar 125)

1. **Minh** *(sốt ruột)* Mẹ ơi, nãy có người giả mặt con gọi video cho mẹ hả? Lần sau làm sao mẹ biết đúng là con?
2. **Minh** *(hỏi thêm)* Dạ. Mà lỡ họ trả lời trôi chảy quá, mẹ vẫn thấy lo thì sao?
3. **Minh** *(cười)* Đúng rồi mẹ. Con mà cần tiền thì con về nhà nói với mẹ chứ.

- Ba ý được chấm: hỏi câu chỉ nhà mình biết; tắt máy, gọi lại số đã lưu; không chuyển tiền khi chưa chắc.

### Bài 9 · Đầu tư lãi cao, nhóm kín

Người học là Vy, nhân vật là ông Tư (chú của Vy; Bé Nai và Vy gọi là "chú Tư"). Tranh mới 5 khung (`assets/comic9-1` đến `comic9-5`), bảng nhân vật `assets/ong-tu-bang-nhan-vat.png`: người đàn ông khoảng bốn mươi lăm, tóc đen ngắn, vest xanh đen, sơ mi trắng, cà vạt xanh (khớp avatar 117 của cuộc gọi video). Lời dặn vẽ: `tools/ve-tranh/prompt-comic9.txt`. Tệp nội dung: `prototype/hoc/bai-09.json`.

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Ông Tư ngồi hiên nhà xem điện thoại, bong bóng có biểu đồ mũi tên đi lên, Vy đứng cạnh | **Bé Nai** *(kể vui)* Dạo này chú Tư của Vy vui lắm. Chú được mời vô một nhóm kín, trong đó có ông thầy ngày nào cũng khoe lãi.<br>**Chú Tư** *(hớn hở)* Vy coi nè con, người ta lời mỗi ngày mấy triệu luôn! |
| 2 | Vài đồng xu bay từ điện thoại vào tay ông Tư, ông cười, Bé Nai soi kính lúp | **Bé Nai** *(ngạc nhiên)* Chú nạp thử năm trăm nghìn. Hôm sau chú rút ra được sáu trăm nghìn.<br>**Chú Tư** *(khoái chí)* Thấy chưa, tiền thiệt đàng hoàng nha! |
| 3 (điểm rẽ) | Ông Tư ôm sổ tiết kiệm, Vy đứng cạnh lo lắng, Bé Nai giơ tay | **Bé Nai** *(lo)* Giờ nhóm rủ chú rút hết sổ tiết kiệm ra nạp. Họ hứa lãi gấp đôi, cam kết không lỗ.<br>**Chú Tư** *(phân vân)* Chú tính nạp hết. Con thấy sao hả Vy?<br>**Bé Nai** *(quay sang người học)* Bạn là Vy đó. Bạn khuyên chú sao đây? |
| 4 (ngõ cụt) | Màn hình có ổ khóa đỏ to, hạt đậu xám chìa tay đòi thêm đồng xu | **Bé Nai** *(kể chậm, buồn dần)* Chú nạp hết. Con số trên màn hình nhảy lên đẹp lắm.<br>**Chú Tư** *(hoang mang)* Ủa, sao đóng phí rồi mà vẫn không rút được vậy nè?<br>**Bé Nai** *(an ủi)* Tiền thật đi mất rồi. Mà đây là truyện thôi, mình quay lại khuyên chú lần nữa nha. |
| 5 (an toàn) | Ông Tư và Vy cùng giơ điện thoại có khiên xanh, sổ tiết kiệm nằm yên trên bàn | **Vy** *(nhẹ nhàng mà chắc)* Chú ơi, lần đầu họ cho rút là để mình tin đó chú. Lãi cao mà chắc ăn vậy thì chỉ có lừa thôi.<br>**Chú Tư** *(gãi đầu, cười ngượng)* Ờ ha. May mà chú chưa đụng tới cuốn sổ.<br>**Bé Nai** *(vui)* Mấy nhóm kiểu này, tới lúc rút là đòi đóng thêm phí. Hai chú cháu chụp lại tin nhắn, báo cáo, rồi rời nhóm luôn. |

- Lựa chọn: A "Chú nạp đi, lần trước rút được mà" (ngõ cụt); B "Chú khoan nạp, để con coi kỹ đã".
- Cả ba dấu hiệu đều có trong các khung ai cũng xem: "cam kết không lỗ" ở khung 3, "lần đầu cho rút" và "đòi đóng thêm phí" ở khung 5.
- Dấu hiệu: hứa lãi cao, cam kết không lỗ; lần đầu cho rút ít để mình tin; đòi đóng phí mới cho rút.
- Nhớ một câu, **Bé Nai** *(tinh nghịch)*: Lãi cao mà chắc ăn thì chỉ có trong lời kẻ gian thôi.

**B. Luyện**

*B4 · Nối lời với chiêu.* Các câu hiện như tin nhắn trong nhóm, chỉ có chữ. **Bé Nai** *(rủ)*: Trong nhóm kín, câu nào cũng là một chiêu. Bạn chạm một câu, rồi chạm tên chiêu của nó nha. Lượt mẫu, **Bé Nai** *(thong thả)*: Mình làm mẫu hai câu trước nha. Cam kết không lỗ là hứa lãi chắc chắn. Còn ba suất, hết đêm nay, là giục gấp.

| Lời trong nhóm | Chiêu | Bé Nai giải thích |
|---|---|---|
| Tuần này thầy cam kết lãi ba mươi phần trăm, không lỗ. (mẫu) | Hứa lãi chắc chắn | (hiện chữ) Đầu tư thật thì có lời có lỗ. Hứa lãi cao mà chắc chắn không lỗ là dấu hiệu phải dừng lại. |
| Còn ba suất gói kim cương, hết đêm nay. (mẫu) | Giục gấp | (hiện chữ) Giục gấp vậy là để chú không kịp hỏi ai. |
| Anh coi ảnh tiền về nè, hôm qua em mới rút. | Khoe ảnh lấy lòng tin | *(giảng giải)* Người khoe trong nhóm thường là người của họ. Tấm ảnh đâu chứng minh được chú cũng sẽ rút được tiền. |
| Muốn rút thì đóng thuế trước mười phần trăm. | Đòi phí để rút | *(giảng giải)* Tiền của mình mà muốn rút phải đóng thêm. Đóng rồi họ lại đòi nữa. |
| Đừng kể với con cháu, tụi nó không hiểu đâu. | Cô lập | *(giảng giải)* Họ biết con cháu mà nghe là cản liền. |

- Tên chiêu gây nhiễu, không khớp câu nào: Dọa nạt.
- Nối đúng, **Bé Nai** *(reo)*: Chuẩn luôn! Nối nhầm, **Bé Nai** *(dễ thương)*: Chưa khớp rồi. Bạn đọc lại coi câu đó nhắc tới cái gì nha. Kèm một dòng chữ nói vì sao tên chiêu vừa chọn không hợp: Hứa lãi chắc chắn "Câu này đâu có hứa lời lãi gì."; Giục gấp "Câu này đâu có hối chú làm ngay kẻo hết suất."; Khoe ảnh lấy lòng tin "Câu này đâu có đem ảnh ra khoe."; Đòi phí để rút "Câu này chưa đòi đóng khoản nào."; Cô lập "Câu này đâu có bảo chú giấu ai."; Dọa nạt "Câu này chưa dọa làm hại ai hết."
- Gợi ý (hiện chữ): 1. Nhớ khung một hông, ông thầy trong nhóm ngày nào cũng làm gì? 2. Bạn coi câu đó muốn chú Tư tin điều gì, hay làm điều gì. 3. Bạn hỏi thử, câu này nhắc tới tiền phải đóng, tới tấm ảnh, hay tới chuyện giữ kín?

*B5 · Việc nào trước.* Chạm lần lượt từng việc theo thứ tự nên làm (không kéo thả); chạm lại việc vừa chọn để bỏ.

- Lượt mẫu, **Bé Nai** *(thong thả)*: Mình làm mẫu trước nha. Giả sử chú Tư mới được rủ vô nhóm, chưa nạp đồng nào. Việc một, khoan nạp tiền. Việc hai, hỏi người nhà. Chưa mất gì thì chỉ cần dừng lại và hỏi. Trên màn: 1 "Khoan nạp tiền", 2 "Hỏi người nhà".
- Câu hỏi, **Bé Nai** *(nghiêm lại)*: Còn nếu chú lỡ nạp tiền rồi, mà nhóm còn giục đóng thêm phí để rút thì sao? Bạn chạm vào từng việc, theo thứ tự nên làm nha.

| Việc | Ràng buộc được chấm | Vì sao (hiện sau khi đạt) |
|---|---|---|
| Không nạp thêm, dù họ hứa cho rút | phải nằm trong hai việc đầu | Còn nạp là còn mất. |
| Gọi ngân hàng theo số in trên thẻ, báo khoản vừa chuyển | không ràng buộc | Báo càng sớm, ngân hàng càng dễ kiểm tra giúp. |
| Lưu tin nhắn và biên lai chuyển tiền | không ràng buộc | Có bằng chứng thì đi trình báo mới rõ. |
| Báo cáo trên Lá chắn, rồi rời nhóm | phải đứng cuối | Rời nhóm sau cùng, kẻo không mở lại được tin nhắn. |

- Cách chấm: chỉ chấm hai chỗ mà thứ tự thật sự quan trọng. "Không nạp thêm" phải nằm trong hai việc đầu (người gọi ngân hàng trước rồi mới ngừng nạp không bị coi là sai). "Báo cáo rồi rời nhóm" phải đứng cuối, vì rời nhóm rồi có khi không mở lại được tin nhắn. Gọi ngân hàng và lưu bằng chứng việc nào trước cũng được. Lời không hứa ngân hàng lấy lại được tiền. Sau khi đạt, màn hình hiện thứ tự Bé Nai gợi ý như bảng trên.
- Đúng, **Bé Nai** *(reo)*: Chuẩn luôn! Không đóng thêm đồng nào, báo ngân hàng liền, giữ bằng chứng, rồi mới rời nhóm. Xong thì cùng người nhà đi báo công an nha.
- "Không nạp thêm" bị để xuống sau, **Bé Nai** *(nhẹ nhàng)*: Mấy việc đó cần làm thiệt. Nhưng họ đang giục chú đóng thêm phí kìa. Việc gì phải làm liền để chú không mất thêm?
- "Báo cáo rồi rời nhóm" chưa đứng cuối, **Bé Nai** *(nhẹ nhàng)*: Gần đúng rồi. Mà rời nhóm rồi thì có khi không mở lại được tin nhắn. Việc đó mình để sau cùng nha.
- Gợi ý (hiện chữ): 1. Nhớ lúc chú Tư ôm cuốn sổ tiết kiệm hông, chú đang định làm gì với nó? 2. Tiền đã chuyển thì khó đòi. Vậy trước tiên phải giữ phần tiền nào? 3. Việc nào làm mất dấu vết thì để sau cùng.
- Xong phần luyện, **Bé Nai** *(khen đúng việc)*: Bạn biết phải làm gì trước rồi đó. Lỡ có chuyện, mình không cuống nữa.

**C. Thử thách · Gọi video khuyên chú Tư** (avatar 117, cảnh `tu-9` của màn gọi video)

**Bé Nai** *(hào hứng)* mở đầu: Tới thử thách cuối bài rồi. Chú Tư đang gọi hỏi ý bạn đó. Bạn khuyên chú sao cho chú hiểu nha.

1. **Chú Tư** *(hào hứng pha chút lưỡng lự)* A lô, Vy đó hả con? Mấy người trong nhóm rủ chú nạp thêm, nói lãi gấp đôi. Lần trước chú rút được thiệt mà. Chú có nên nạp không con?
2. **Chú Tư** *(chưng hửng)* Ủa, vậy sao lần đầu họ cho chú rút được vậy con?
3. **Chú Tư** *(thở ra, cười)* May mà chú hỏi con. Để chú lưu tin nhắn, báo cáo rồi rời nhóm nha con.

- Bốn ý được chấm: khuyên chú đừng nạp thêm; giải thích lần đầu cho rút là mồi nhử; nêu ít nhất một dấu hiệu khác (lãi chắc chắn, đòi phí, giục gấp); rủ chú báo cáo.
- Lời 3 chỉ dùng khi người học đã khuyên chú dừng. Người học khuyên nạp thì chú hỏi lại *(phân vân)*: Vậy nếu họ đòi chú nạp thêm mới cho rút thì sao con?
- Gợi ý của Bé Nai: 1. Bạn nhớ khung hai hông, mấy đồng lời đầu tiên là để làm gì? 2. Ngoài chuyện cho rút trước, trong nhóm còn hứa hẹn điều gì nghe khó tin không ta? (không nêu thẳng dấu hiệu, vì "nêu thêm một dấu hiệu khác" là một ý được chấm) 3. Sau cùng, làm gì để mấy người khác trong nhóm không mất tiền?
- Về lại bài, Bé Nai nói theo kết quả. Đủ ý *(mừng)*: Bạn khuyên chú Tư thuyết phục ghê. Cuốn sổ tiết kiệm của chú an toàn rồi. Thiếu ý *(nhẹ nhàng)*: Bạn khuyên được một phần rồi. Bạn coi lại ý còn thiếu, rồi thử gọi chú Tư lần nữa nha. Bỏ dở *(hiền)*: Cuộc gọi chưa xong nè. Lúc nào tiện, bạn gọi lại cho chú Tư nha. Không được ý nào *(nhẹ nhàng)*: Lần này chưa được ý nào. Không sao, bạn gọi lại cho chú Tư thử lần nữa nha.

### Bài 10 · Cài ứng dụng giả mạo

Cho bà Hoa. Vẽ mới 4 khung (`comic10-1` đến `comic10-4`).

**A. Truyện**

| Khung | Tranh | Lời |
|---|---|---|
| 1 | Bà Hoa nghe máy, bong bóng có hình tờ giấy và cây bút | **Bé Nai** *(kể thong thả)* Sáng thứ Hai, có người gọi cho bà Hoa.<br>**Người gọi** *(lễ phép, ra vẻ nghiêm)* Dạ thưa bà, con là cán bộ ở phường. Hồ sơ của bà bị thiếu, hôm nay phải cập nhật gấp.<br>**Bà Hoa** *(lo)* Vậy hả cậu? Giờ tôi phải làm sao? |
| 2 | Điện thoại nhận tin nhắn có mũi tên chỉ xuống một ô vuông lạ màu đỏ; hạt đậu xám chỉ tay | **Người gọi** *(dỗ ngọt)* Dễ lắm bà. Con gửi đường dẫn qua tin nhắn rồi, bà bấm vô cài ứng dụng là xong.<br>**Bé Nai** *(hơi lo)* Bà Hoa đeo kính lên, lần mò bấm theo. |
| 3 | Trên màn hình có con mắt và bàn tay xám thò vào; Bé Nai giơ tay chặn | **Bé Nai** *(căng)* Ứng dụng lạ đó hiện lên một câu hỏi. Nó xin được xem và bấm thay bà trên màn hình.<br>**Người gọi** *(giục)* Bà cứ bấm Cho phép hết giúp con.<br>**Bé Nai** *(hô lên)* Khoan đã bà ơi! Cho phép cái này là họ điều khiển được máy của bà luôn đó. |
| 4 | Bà Hoa và anh Minh cùng xem điện thoại, có túi đựng đồ với dấu tích xanh | **Bà Hoa** *(cứng rắn)* Thôi, để tôi hỏi con tôi đã.<br>**Minh** *(dặn dò, thương)* Mẹ nhớ nha, ứng dụng nào cũng phải tải từ kho ứng dụng của máy. Ai gửi đường dẫn bảo cài là mẹ cúp máy liền.<br>**Bà Hoa** *(gật gù)* Ừ, mẹ nhớ rồi. |

- Dấu hiệu: bảo cài ứng dụng qua đường dẫn trong tin nhắn; ứng dụng xin quyền điều khiển màn hình; người gọi hướng dẫn từng bước và không cho cúp máy.
- Nhớ một câu, **Bé Nai** *(ấm áp)*: Ứng dụng lạ, ai bảo cài bà cũng khoan đã. Hỏi con cháu trước nhé.

**B. Luyện**

*B2 · Cài hay khoan.* Hai nút to "Khoan đã" và "Được".

| Thẻ | Đáp án |
|---|---|
| Người lạ gọi, gửi đường dẫn, bảo bấm để cài (mẫu) | Khoan đã |
| Anh Minh ngồi cạnh, cài giúp bà từ kho ứng dụng của máy (mẫu) | Được |
| Ứng dụng xin quyền "xem và điều khiển màn hình" | Khoan đã |
| Người gọi bảo bà tắt Lá chắn đi cho dễ cài | Khoan đã |
| Ứng dụng xem thời tiết xin quyền biết vị trí | Được |

*B6 · Nghe và bấm Dừng.*

| Câu | Người gọi (mô phỏng) | Bấm ở đây được |
|---|---|---|
| 1 | *(lễ phép)* Dạ chào bà, con gọi để hướng dẫn bà cập nhật thông tin ạ. | chưa tính |
| 2 | *(dỗ)* Con vừa gửi đường dẫn qua tin nhắn, bà bấm vô để cài ứng dụng nha. | 3 sao |
| 3 | *(giục)* Máy hỏi gì bà cứ bấm Cho phép hết giúp con. | 2 sao |
| 4 | *(nài)* Bà giữ máy, đừng tắt, để con làm giúp bà trên màn hình. | 1 sao |

**C. Thử thách · Ông Tư gọi nhờ bà chỉ** (avatar 117)

1. **Ông Tư** *(bối rối)* Chị ơi, có cậu xưng cán bộ gọi cho tôi, bảo bấm vô đường dẫn để cài ứng dụng. Tôi cài được không chị?
2. **Ông Tư** *(hỏi thật thà)* Vậy tôi muốn làm giấy tờ thiệt thì làm sao cho chắc hả chị?
3. **Ông Tư** *(nhẹ người)* Cảm ơn chị nghen. Tôi xóa cái tin đó liền.

- Ba ý được chấm: đừng bấm đường dẫn, đừng cài; không cho ai xem hay điều khiển màn hình; hỏi con cháu hoặc ra phường hỏi trực tiếp.
- Bà trả lời bằng giọng nói hoặc chọn nút: "Anh đừng cài, hỏi con cháu đã", "Anh cứ cài thử xem".

---

## 6. Tệp nội dung của một bài

Trang `prototype/hoc.html` đọc `prototype/hoc/danh-sach.json` (danh sách phát hành: thứ tự các dòng là số bài người học nhìn thấy, `"mo": false` là chưa hiện; dùng cho thư viện và để mở bài theo `?bai=<mã nội bộ>` hoặc `?kieu=<ma_kieu>`) và mỗi bài một tệp `prototype/hoc/bai-NN.json`. Thêm bài mới là thêm một tệp và một dòng trong danh sách phát hành, không phải viết mã.

Một **câu nói** ở đâu cũng có cùng dạng: `{"ai", "cam_xuc", "chu", "giong"}`. `ai` là người nói (`be-nai`, `ba-hoa`, `minh`, `vy`, `ong-tu`, `nguoi-goi-nam`, `nguoi-goi-nu`); `cam_xuc` chỉ dùng làm lời dặn lúc thu; `chu` vừa hiện trên màn vừa là lời đọc; `giong` là tệp tiếng, tính từ thư mục `prototype/` (thiếu `giong` thì chỉ hiện chữ). `tools/thu-bai-hoc.py` gom mọi câu có `giong` nằm dưới `hoc/giong/` để thu.

```json
{
  "ma": "bai-09", "so": 9, "ma_kieu": "dau-tu-lai-cao", "ten": "Đầu tư lãi cao, nhóm kín",
  "che_do": "day-du", "nhan_vat": "Chú Tư", "bia": "comic9-1.png",
  "truyen": [
    { "tranh": "comic9-1.png", "tom_tat": "Chú Tư được mời vô nhóm kín khoe lãi.", "loi": [ câu nói, câu nói ] },
    { "tranh": "comic9-3.png", "loi": [ … ],
      "re": [ { "chu": "Chú nạp đi, lần trước rút được mà", "toi": "ngo-cut" }, { "chu": "Chú khoan nạp, để con coi kỹ đã", "toi": "an-toan" } ] }
  ],
  "ngo_cut": { "tranh": "comic9-4.png", "loi": [ … ] },
  "an_toan": { "tranh": "comic9-5.png", "loi": [ … ] },
  "dau_hieu": ["Hứa lãi cao, cam kết không lỗ", "…"],
  "nho_mot_cau": câu nói (thêm "hien" nếu chữ hiện trên màn ngắn hơn lời đọc),
  "viec_o_nha": "chữ hiện ở màn kết (không bắt buộc)",
  "luyen": [ bài tập, bài tập ],
  "thu_thach": { "dang": "goi-video", "canh": "tu-9", "ten": "…", "nguoi": "Chú Tư", "anh": "../assets/chan-dung-ong-tu.png", "mo_ta": "…",
                 "mo_dau": câu nói, "y": ["các ý được chấm"], "goi_y": [ … ], "ket": { "du": câu nói, "thieu": câu nói, "bo": câu nói } }
}
```

Mọi bài đều có điểm rẽ: khung cuối của `truyen` có `re` (đúng hai lựa chọn), kèm `ngo_cut` và `an_toan`. Bài cho ông bà thêm `ai`, `cam_xuc`, `giong` vào từng lựa chọn để Bé Nai đọc to cả hai (trang sáng nút đang đọc); quay về từ ngõ cụt thì Bé Nai hỏi lại rồi đọc lại hai lựa chọn. Mỗi **bài tập** có `dang`, `ma`, `ten`, `mo_dau`, `goi_y` (ba câu), `xong` (lời khen cuối), `dap_an` (chữ hiện khi bấm "Xem đáp án"), cộng các trường riêng:

| `dang` | Trường riêng |
|---|---|
| `cham-bat-bai` (B1) | `tin.tu`, `tin.doan[]`: mỗi đoạn `{"chu", "loai": "dau-hieu" / "nhieu" / "thuong", "ten", "mau", "giai_thich"}` |
| `that-hay-lua` (B2) | `the[]`: câu nói kèm `"dap_an": "lua" / "can-kiem-tra" / "binh-thuong"`, `"mau"`, `"giai_thich"`; lời chung `dung`, `sai`, `can_than` |
| `noi-chieu` (B4) | `kieu` (`goi` hoặc `nhom`), `nguoi`, `loi_mau`, `chieu[]`: `{"ten", "khong_phai", "nhieu"}`, `cap[]`: `{"chu", "giong", "chieu", "mau", "giai_thich"}`; lời chung `dung`, `sai` |
| `viec-nao-truoc` (B5) | `mau`: `{"loi", "tinh_huong", "viec"[2], "giai_thich"}`, `tinh_huong`, `hoi`, `viec[]`. Chọn việc đầu: đánh dấu `"dung": true`, mỗi việc có `giai_thich`. Xếp thứ tự: `viec[]` viết theo thứ tự gợi ý, ràng buộc `"toi_da": n` (phải nằm trong n việc đầu), `"toi_thieu": n` (không sớm hơn vị trí n), kèm `"sai"` (lời khi phạm ràng buộc) và `"vi_sao"`; lời `dung` |
| `nghe-bam-dung` (B6) | `nguoi_goi`, `mau`: `{"loi", "cau"[2], "giai_thich"}`, `toi_luot`, `cau[]`: câu nói của người gọi, câu có dấu hiệu thêm `"dau_hieu": {"ten", "nhieu", "sao", "cum", "luc", "nhac"}`; lời `som`, `hoi_xac_nhan`, `ket` (theo số sao), `het`, `tong_ket` |

`dau_hieu.luc` là mốc giây (tính trên tệp giọng đã cắt và lọc của chính câu đó) lúc cụm `cum` vừa nói xong; đo bằng `tools/do-moc-dau-hieu.py`, thu lại thì đo lại.

## 7. Thứ tự sản xuất đề xuất

1. **Duyệt kịch bản này** (câu chữ, phân vai avatar, danh sách 10 kiểu).
2. **Bài 1, 2, 3 trước:** tranh có sẵn, chỉ cần viết khối B2, B5, B6 và thu giọng Minh. Xong bước này đã có đủ ba dạng bài mới và một avatar mới để trình diễn.
3. **Vẽ tranh Bài 4 đến 10** bằng Codex theo `tools/ve-tranh/`, mỗi bài một lượt, xem từng tấm trước khi nhận.
4. **Thu giọng** mỗi bài một lượt dài rồi cắt; đổi một chữ thì thu lại cả lượt.
5. **Avatar 117 và 125:** chép gói sang `vendor/`, thử với bộ khớp miệng tạm, rồi mới quyết có chạy `lip_fit.py` hay không.
