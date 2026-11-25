# Bàn giao · trang bài học "Lá chắn số" (dừng lúc 15:02 ngày 25/11/2026)

Kho: `/home/rin/dongnaihackathonvivi/la-chan-so`. Thư mục tạm: `/home/rin/dongnaihackathonvivi/la-chan-so/ban-giao/tam-hoc/` (gọi tắt `$S`; nay đã chép sang `/home/rin/dongnaihackathonvivi/la-chan-so/ban-giao/tam-hoc`).
Không còn tiến trình nền nào của tôi đang chạy (máy chủ thử, Chromium, lượt thu, lượt nghe, Codex đều đã tắt hoặc xong). Mọi tệp JSON và mã đều ở trạng thái nhất quán (đã kiểm cú pháp sau lần sửa cuối).

## (a) Từng bước được giao

| Việc | Trạng thái |
|---|---|
| Rà kịch bản 4 bài (Bài 1, 2, 3, 9 của bảng 10 bài) | XONG, đã sửa thẳng trong `bai-hoc/KICH-BAN-BAI-HOC.md` |
| Astra lượt 1 trên kịch bản | XONG: 25 nhận xét (`$S/astra/out1.md`), thêm lượt 1b ngay trước khi thu trên 4 tệp JSON: 11 nhận xét (`$S/astra/out1b.md`). Đã xử lý hết phần thuộc tệp của tôi |
| Trình phát + 5 dạng bài tập (B1, B2, B4, B5, B6), mỗi dạng có bản chữ lớn | XONG: `prototype/hoc.html`, `prototype/hoc/hoc.js`, `hoc.css` |
| Nội dung 4 bài | XONG: `prototype/hoc/bai-01.json`, `bai-02.json`, `bai-03.json`, `bai-09.json`, `danh-sach.json` |
| Tranh bài đầu tư (Bài 9) | XONG: 5 khung + bảng nhân vật ông Tư, một lượt Codex, tôi đã xem từng tấm (không chữ, tay bình thường, Bé Nai và ông Tư nhất quán), không phải vẽ lại tấm nào |
| Thu giọng | ĐANG DỞ: 168/168 tệp đã có và giải mã được, nhưng mới KIỂM NGHE được một phần; có 3 chỗ biết chắc cắt sai hoặc cần thu lại. Chi tiết ở mục (g) |
| Bài kiểm tự động | XONG: `tools/kiem-bai-hoc.mjs`, lượt chạy cuối (có kiểm tiếng) đạt 1254, lỗi 0 |
| Astra lượt cuối (JSON + logic trình phát) | XONG: 23 nhận xét (`$S/astra/out2.md`), đã sửa phần lớn (bảng ở mục e). CHƯA chạy lại Astra sau khi sửa |
| Dặn thêm: số hiển thị 1–4 theo danh sách phát hành | XONG (kể cả kiểm tự động và ghi chú mục 4 kịch bản) |
| Dặn thêm: bảng bí danh cho `?kieu=` | XONG (kể cả kiểm tự động và ghi chú mục 4 kịch bản) |
| Báo cáo cuối đầy đủ cho người dùng | CHƯA viết (tệp này thay thế) |

## (b) Quyết định đã chốt

- **Thứ tự phát hành và số hiển thị** (theo đúng thứ tự người dùng đưa): Bài 1 = `bai-01` (cơ quan chức năng), Bài 2 = `bai-02` (việc nhẹ lương cao), Bài 3 = `bai-03` (người thân gặp nạn), Bài 4 = `bai-09` (đầu tư lãi cao). Số hiển thị = vị trí trong `prototype/hoc/danh-sach.json` (`phat_hanh[]`, `"mo": false` là ẩn). Mã nội bộ giữ nguyên: tên tệp, `?bai=1|2|3|9`, cảnh `minh-1`, `lan-2`, `minh-3`, `tu-9`, `ma_kieu`, thư mục giọng `hoc/giong/b01|b02|b03|b09`. Thư viện là một danh sách liền (không chia nhóm) nên đổi thứ tự chỉ cần đổi dòng trong tệp.
- **`?kieu=`**: chuẩn hóa (bỏ khoảng trắng, chữ thường, `_` → `-`) rồi so với `ma_kieu` và `bi_danh` trong `danh-sach.json`. Có: `gia-danh-cong-an` → bai-01, `nguoi-than-tai-nan` → bai-03; `viec-nhe-luong-cao`, `dau-tu-lai-cao` trùng `ma_kieu`. Mã không có bài, lạ, rỗng → thư viện, không báo gì, không chèn giá trị vào trang. `?bai=` lạ → thư viện kèm một dòng báo.
- **Cấu trúc JSON**: mô tả đầy đủ ở mục 6 của kịch bản. Câu nói = `{"ai","cam_xuc","chu","giong"}` (`giong` tính từ `prototype/`). Dạng bài: `cham-bat-bai`, `that-hay-lua`, `noi-chieu`, `viec-nao-truoc`, `nghe-bam-dung`. B5 xếp thứ tự chấm bằng `toi_da` / `toi_thieu`; B6 có `dau_hieu.{ten,nhieu,sao,cum,luc,nhac}`.
- **Hợp đồng với trang gọi video** (đã đối chiếu với `prototype/video-call.html` và `prototype/canh/*.json` của agent kia, số ý khớp 2/4/2/4): đi `video-call.html?canh=<id>&ve=hoc.html%3Fbai%3D<n>%26sau%3Dgoi`; về đọc `localStorage['lcs-goi-<id>']`. Trang bài học chỉ nhận điểm khi vừa bấm "Nghe máy" (có `goi_tu`), `luc` không cũ hơn lúc bấm, nhận một lần rồi xóa khóa; điểm kẹp trong 0..số ý của bài; xóa khóa cũ khi bắt đầu gọi.
- **Điểm và sao**: điểm chỉ từ phần C (mỗi ý 10 điểm). Sao của bài: A xem hết truyện, B cả hai bài luyện đạt (không xem đáp án; B1 thêm điều kiện chạm nhầm không quá 1 chỗ), C từ nửa số ý. Lưu ở `localStorage['lcs-hoc-v1']` (có chuẩn hóa dữ liệu hỏng, có bản trong bộ nhớ khi máy cấm lưu).
- **B6**: bấm Dừng lúc nào cũng ngắt cuộc gọi (kể cả lúc đổ chuông). Dừng trước dấu hiệu = an toàn, bài xong, 0 sao, mời nghe lượt nữa. Sau dấu hiệu đầu 3 sao, rồi 2, rồi 1. Câu hỏi xác nhận sau khi dừng không dùng để chấm.
- **Giọng** (bảng ở `tools/giong-bai-hoc.json`): Bé Nai `Leda`, Vy `Zephyr`, bà Hoa `Gacrux`, người gọi nam `Alnilam`, người gọi nữ `Despina`; Minh `Achird`, ông Tư `Algenib` lấy đúng giọng + lời dặn trong `prototype/nhan-vat.json` (đã `chot`). Bà Hoa và hai người gọi chọn bằng 2 mẫu thử mỗi vai + máy nghe tả lại, CHƯA có người nghe duyệt.
- **Tên miền mẫu trong B1**: `viec-nhe-xyz.example` (đuôi dành riêng, theo Astra), chỉ hiện chữ.

## (c) Chỗ đã sửa trong kịch bản và lý do

Chung: thêm luật sao của bài, luật "Xem đáp án" kết thúc lượt, làm rõ luật "hai mục đầu là mẫu" cho B5/B6 (lượt mẫu của Bé Nai), B4/B5 chạm thay kéo thả, B6 Dừng luôn ngắt máy; bảng giọng; mục 4 thêm bảng số hiển thị và bảng bí danh; mục 6 viết lại theo cấu trúc JSON thật; cấm "hú hồn" trong lời thu.

- **Bài 1**: khung 3 thêm lời người gọi (mỗi khung phải có thoại nhân vật); khung 4 "bà cúp máy rồi gọi" (dạy cúp máy trước); người gọi ở B6 đổi chỉ dẫn từ "gằn giọng, ra lệnh" sang lễ phép, vội (đúng luật kẻ gian nói ngọt); câu 1 của B6 đổi thành "bà nghe máy có rõ không ạ" (câu cũ đã là hỏi xác nhận thông tin); thêm lượt mẫu (tòa án, khác lời với lượt thật để không lộ đáp án); lời khen 3 sao bỏ ý "cơ quan thật không làm việc qua điện thoại" (rộng hơn sự thật), thay bằng "công an không bao giờ gọi điện bắt bà chuyển tiền để chứng minh trong sạch"; thẻ B2 "Được" giải thích theo nội dung cuộc gọi chứ không theo số gọi đến (số và giọng gọi đến giả được); gợi ý bước 3 không còn nói thẳng tên nút; "Giờ mình chơi thẻ" → "Giờ con đọc từng thẻ" (xưng hô); bỏ chữ "video" trong lời đọc; "Hú hồn" → "Trời ơi, hết hồn" (giọng máy diễn thành tiếng thở/cười).
- **Bài 2**: thêm thoại Vy vào truyện (giữ nguyên 7 câu Bé Nai đã thu); lời Vy ở khung 3 đưa dấu hiệu "giục gấp" vào trước điểm rẽ; B1 viết lại tin nhắn: 2 chỗ mẫu, 4 chỗ phải tìm, 3 chỗ gây nhiễu xen kẽ, "Đăng ký ngay, năm phút nữa là hết suất" thay "đăng ký trong hôm nay" (hạn thường thì chưa phải giục gấp), lời kết bỏ "xóa liền" (mất bằng chứng) thành "giữ tin lại rồi báo cáo, chặn số"; B4: 2 cặp mẫu, thêm tên chiêu gây nhiễu "Dọa nạt", câu cô lập đổi thành "Chuyện này chị em mình biết với nhau thôi" (câu cũ ghép "Dọa nạt" cũng hợp), "Bằng chứng giả" → "Khoe ảnh lấy lòng tin", thêm dòng giải thích cho từng tên chiêu chọn nhầm, lời mở đầu nói rõ giọng người gọi là máy đóng vai.
- **Bài 3**: truyện sửa cho khớp tranh có sẵn (buổi chiều, không ti vi; Minh ở chỗ làm); tin nhắn trong truyện thêm "dặn đừng gọi, máy con hư" để dấu hiệu thứ ba có trong truyện; lời "khoan, sao không gọi thằng Minh" chuyển cho bà Hoa nói; B5 nói rõ "một số lạ nhắn", thêm lượt mẫu, lời đúng thêm "cháu chưa bắt máy thì gọi người nhà khác, khoan chuyển tiền"; B2 thêm giải thích cho mọi thẻ, thay thẻ "mang thẻ bảo hiểm ra viện" (mơ hồ), thêm thẻ "cháu đổi số mới" và một thẻ "Được" nữa để đáp án không toàn "Khoan đã"; thẻ "người lạ khóc xưng là cháu" gắn nhãn cần kiểm tra; câu 2 của Minh ở phần C đổi "gọi số nào" thành "tìm số của con ở đâu" (tránh bà đọc số thật).
- **Bài 9**: "rút hết sổ tiết kiệm ra nạp", thêm "cam kết không lỗ" ở khung 3 và "đòi đóng thêm phí" ở khung an toàn (dấu hiệu phải nằm trong khung ai cũng xem); "sáu trăm" → "sáu trăm nghìn"; khung ngõ cụt rút ngắn; "chụp lại tin nhắn, báo cáo, rồi rời nhóm" (rời trước là mất bằng chứng); B5 làm lại: 4 việc, chỉ chấm "không nạp thêm nằm trong hai việc đầu" và "báo cáo rồi rời nhóm đứng cuối", gọi ngân hàng trước hay ngừng nạp trước đều đúng, không hứa ngân hàng lấy lại được tiền; lời 3 của chú Tư ở phần C sửa thứ tự lưu tin nhắn, báo cáo, rời nhóm.
- Cả 4 bài: lời Bé Nai khi về từ cuộc gọi (đủ ý, thiếu ý, bỏ dở, không được ý nào); ghi chú "câu đồng tình của Minh/chú Tư chỉ dùng khi người học trả lời an toàn".

## (d) Tệp đã tạo hoặc sửa

Tạo mới (xong, dùng được):
- `prototype/hoc.html`, `prototype/hoc/hoc.js`, `prototype/hoc/hoc.css`
- `prototype/hoc/danh-sach.json`, `bai-01.json`, `bai-02.json`, `bai-03.json`, `bai-09.json` (SINH RA từ `$S/tao-noi-dung.py`, xem mục h)
- `prototype/hoc/giong/b01|b02|b03|b09/*.m4a` (168 tệp; trạng thái từng lượt ở mục g)
- `assets/comic9-1.png` … `comic9-5.png`, `assets/ong-tu-bang-nhan-vat.png`; ảnh cắt từ tranh có sẵn: `assets/avatar-hat-dau.png`, `chan-dung-minh.png`, `chan-dung-ong-tu.png`, `chan-dung-ba-hoa.png`, `chan-dung-vy.png`
- `tools/kiem-bai-hoc.mjs` (kiểm tự động), `tools/thu-bai-hoc.py` (thu, cắt, lọc, nghe lại theo tệp nội dung), `tools/giong-bai-hoc.json`, `tools/do-moc-dau-hieu.py` (đo mốc `luc` cho B6), `tools/ta-giong.py` (nhờ máy tả giọng mẫu), `tools/ve-tranh/prompt-comic9.txt`
- `audio-goc/hoc/bNN/` (lượt thu gốc `.wav`, lời dặn, nhật ký nghe lại; thư mục này nằm trong `.gitignore`)

Sửa: `bai-hoc/KICH-BAN-BAI-HOC.md` (mục 1, 2, 3, 4, 6 và bốn bài 1, 2, 3, 9).
Không đụng: `android/**`, `prototype/video-call.html`, `prototype/audio/**`, `prototype/canh/**`, `prototype/nhan-vat.json`, `vendor/**`, các công cụ có sẵn trong `tools/`.

## (e) Đã kiểm gì

- `node tools/kiem-bai-hoc.mjs --anh $S/anh` (lượt cuối 15:01, `$S/kiem-6.log`): **đạt 1254, lỗi 0**, 212 lượt soát bố cục, 172 ảnh. Chơi trọn 4 bài ở 393×873 và 360×740: mọi bài tập làm được; sai có giải thích, làm lại được; gợi ý mở đủ ba bước; xem đáp án thì không đạt; màn không tràn, không cuộn; nút chữ lớn từ 56px; console sạch, không 404; 176 tệp giọng (168 mới + 8 có sẵn) có và giải mã được; địa chỉ sang cuộc gọi, đường về với điểm giả lập (bỏ dở, điểm cũ, khóa hỏng, không bấm gọi, 0 ý, thiếu ý, mở lại lần hai, vượt tổng, đủ ý); số hiển thị 1–4 liên tục, không lộ "Bài 9"; `?kieu=` 6 ca có bài + 7 ca không có bài (có ca chèn HTML); số ý khớp với `prototype/canh/*.json`. Tùy chọn: `--bai 1,9`, `--nhanh` (chỉ 360×740), `--khong-tieng`.
- Ảnh màn hình: tôi đã mở xem các tờ ghép `$S/anh/s1.png` … `s8.png` và sửa lỗi thấy được (ảnh Bé Nai phóng to, tiêu đề bị cắt, tranh không vuông, nút tràn chữ, tin nhắn B1 đè lên dòng trạng thái). CHƯA xem lại ảnh sau hai lần sửa cuối (xử lý Astra lượt cuối và bí danh `?kieu=`); bài kiểm bố cục tự động thì đạt.
- CHƯA thử trên WebView Android thật, chưa thử cuộc gọi video thật nối với trang bài học (mới giả lập bằng localStorage).
- Astra lượt cuối (`$S/astra/out2.md`), đã xử lý: 1 điểm cuộc gọi cũ, 2 điểm vượt tổng, 3 bấm Tiếp bỏ lời (giờ Tiếp đi từng câu), 4 B2 ba nút chấm sai mã, 5 và 17 kho tiến độ hỏng hoặc bị cấm, 7 và 8 xem đáp án kết thúc lượt, 9 Dừng lúc đổ chuông, 10 gợi ý giữa lượt mẫu, 11 trang lấy từ lịch sử, 12 B5 chữ lớn trên dữ liệu xếp thứ tự, 13 B1 chạm bừa + vị trí lộ đáp án, 14 B4 trùng tên chiêu, 15 và 16 điểm tốt nhất, 19 và 21 cỡ nút và cỡ chữ chữ lớn, 20 nhãn thẻ Bài 3, 22 xưng hô theo bài, 23 lời riêng khi 0 ý. KHÔNG làm: 18 (màn ngang, đề chỉ yêu cầu màn dọc). 6 (thiếu tệp giọng) đã hết thiếu.
- Hai nhận xét của Astra thuộc tệp của agent kia, CHƯA ai sửa, cần chuyển lời: `prototype/loi-minh.json` dòng ~289 và ~298 còn hỏi "mẹ gọi con bằng số nào" (dễ khiến bà đọc số thật; kịch bản đã đổi thành "mẹ tìm số của con ở đâu"); `prototype/loi-tu.json` dòng ~298 còn "Để chú rời nhóm rồi báo cáo luôn" (kịch bản đã đổi thành lưu tin nhắn, báo cáo, rồi rời nhóm). Thêm: câu đồng tình của Minh/chú Tư không nên phát khi người học trả lời chưa an toàn.

## (f) Bẫy đã gặp

1. **Hạn mức Gemini rất chật** (có agent khác dùng chung 7 khóa): `gemini-3.8-flash-tts` gần như luôn 429, hầu hết lượt thu rơi xuống `gemini-3.1-flash-tts-preview`. Mỗi lượt thu tốn khoảng 8–12 lần bị từ chối + 1 lần được.
2. **3.1-preview không thu được lượt dài**: 26 hay 45 câu đều trả `finishReason: SAFETY` kèm "audio stream could not be completed" sau ~45 giây (không phải do nội dung, đặt BLOCK_NONE vẫn vậy); `gemini_take.py` chỉ in `KeyError` và thử hết mọi khóa, phí lượt. Lượt 8–13 câu thì được. Vì vậy Bé Nai KHÔNG thu được "một lượt cho mỗi bài" như quy định: phải tách 2–4 lượt mỗi bài (`--tach`). Đây là chỗ lệch quy trình cần báo người dùng.
3. Máy đôi khi trả **lượt bị đứt** (32 giây cho 13 câu): công cụ giờ tự bỏ lượt ngắn hơn 0,17 giây mỗi tiếng.
4. 3.1-preview **không nghỉ 2 giây giữa các câu** và có khi nghỉ dài giữa câu: cắt theo quãng lặng dễ lệch. `thu-bai-hoc.py` cắt bằng quy hoạch động (quãng lặng + nhịp đọc + mốc máy nghe) nhưng vẫn có lượt lệch, PHẢI nghe lại mới biết.
5. **"Hú hồn"** bị giọng bà Hoa diễn thành tiếng thở/cười hai lần; đã đổi lời. Thêm câu "im lặng hẳn hai giây" vào lời dặn làm giọng bà Hoa ngắt giữa câu, đã bỏ.
6. **Máy nghe (`nghe-lai.py`) khi đầy hạn mức** tụt xuống model yếu: bản chép bị cắt giữa chừng, dòng "CÓ LỜI DẶN" xuất hiện bừa (kể cả khi bản chép khớp từng chữ), nghe "gọi" thành "gõ/gởi/gội", tên "Vy" thành "gì". Đừng tin dòng kết luận; đọc bản chép. Nghe CẢ LƯỢT một lần cho bản chép tốt hơn hẳn nghe từng câu ngắn.
7. Tiếng click 7 ms giữa hai câu lọt vào đầu câu sau: công cụ giờ xóa "đảo tiếng" dưới 90 ms giữa hai quãng lặng trước khi cắt.
8. Mốc `luc` của B6 đo trên tệp đã cắt: thu lại hoặc cắt lại giọng người gọi Bài 1 thì chạy lại `python3 tools/do-moc-dau-hieu.py prototype/hoc/bai-01.json`.
9. Không dùng `sleep` ở tiền cảnh trong phiên này (bị chặn); chờ bằng lệnh nền có vòng `until`.
10. Tệp JSON bài học là tệp SINH RA: sửa lời thì sửa trong `$S/tao-noi-dung.py` rồi chạy lại (nó giữ các mốc `luc` đã đo), hoặc sửa thẳng JSON và từ đó bỏ hẳn tệp sinh; đừng làm cả hai. Thêm/bớt một câu của một giọng làm đổi số thứ tự tệp giọng phía sau của giọng đó.

## (g) Việc còn lại, theo thứ tự nên làm

Trạng thái giọng (mọi lượt đều thu bằng 3.1-preview, trừ Minh Bài 1 và Vy Bài 2 bằng 3.8):

| Bài · giọng · lượt | Trạng thái |
|---|---|
| b01 Bé Nai p1 (bn-01..10), p4 (bn-35..46) | Đã nghe cả lượt: khớp 10/10 và 12/12, không có lời dặn |
| b01 Bé Nai p2 (bn-11..23, thu lại lần hai) | 12 câu khớp; **bn-14 cắt cụt** (chỉ còn câu đầu), các câu quanh đó cần soát lại sau khi cắt lại |
| b01 Bé Nai p3 (bn-24..34) | CHƯA kiểm xong: bản chép cả lượt dài hơn lời gốc (189 so với 157 tiếng), nghi đọc lặp hoặc máy chép lặp; lượt nghe riêng bị tôi hủy lúc bàn giao |
| b01 bà Hoa (3 câu, lượt thứ tư) | CHƯA nghe lại. Ba lượt trước đều hỏng câu 3 |
| b01 người gọi nam (7 câu) | Đã nghe riêng từng câu 2 lần: chữ khớp, trừ "gọi" nghe thành "gõ/gởi" ở gn-03; mốc `luc` đã đo và ghi |
| b01 Minh (1 câu), b03 Minh (1 câu) | Khớp |
| b09 Bé Nai p1 (bn-01..08), p3 (bn-16..26) | Khớp 8/8 và 11/11 |
| b09 Bé Nai p2 (bn-09..15) | **Cắt lệch** bn-09/bn-10 (cắt bằng trọng số cũ); chạy `--cat-lai` rồi nghe lại |
| b09 ông Tư (5 câu) | Máy nghe chép lệch 4/5 câu (giọng trầm khàn): chưa rõ lỗi đọc hay lỗi nghe, CẦN NGƯỜI NGHE |
| b09 Vy (1 câu) | Gần khớp ("đó" nghe thành "nó") |
| b02 Bé Nai p1 (bn-01..10), p2 (bn-11..22) | Đã thu, CHƯA nghe lại |
| b02 Vy (5 câu), người gọi nữ (5 câu) | Máy nghe (lúc hạn mức đầy) chép lệch nhiều: CẦN nghe lại |
| b03 Bé Nai p1..p4 | Đã thu, CHƯA nghe lại |
| b03 bà Hoa (4 câu) | **Cắt lệch** (bh-01 dính đầu câu 2); công cụ đã sửa luật cắt, chạy `--cat-lai` |

Việc nên làm:
1. Nghe lại và cắt lại (không tốn lượt thu), nạp khóa rồi chạy từng lệnh, đọc kỹ nhật ký `audio-goc/hoc/bNN/*-nghe-lai.txt`:
   `set -a; . /run/media/rin/Rin/AI-Thuc-Chien/vlearn-lesson-lab/.env; set +a` rồi
   `python3 tools/thu-bai-hoc.py 1 be-nai --tach=bn-11,bn-24,bn-35 --phan=2 --cat-lai` (và `--phan=3`); `1 ba-hoa --cat-lai`; `9 be-nai --tach=bn-09,bn-16 --phan=2 --cat-lai`; `9 ong-tu --cat-lai`; `9 vy --cat-lai`; `2 be-nai --tach=bn-11 --phan=1 --cat-lai` (và `--phan=2`); `2 vy --cat-lai`; `2 nguoi-goi-nu --cat-lai`; `3 be-nai --tach=bn-09,bn-18,bn-31 --phan=1..4 --cat-lai`; `3 ba-hoa --cat-lai`. Thêm `--nghe-cau` để nghe riêng từng câu. Ước lượng: khoảng 16 lượt nghe cả lượt + 40–80 lượt nghe riêng (model nghe, không phải TTS).
2. Thu lại những lượt nghe ra hỏng (bỏ `--cat-lai`). Dự kiến 1–4 lượt TTS (bà Hoa Bài 1 nếu vẫn hỏng, b01 p3 nếu đúng là đọc lặp, ông Tư nếu người nghe chê), mỗi lượt khoảng 10 lần gọi kể cả bị từ chối. Nếu 3.8 có lại hạn mức, cân nhắc thu lại Bé Nai mỗi bài MỘT lượt cho đúng quy trình (4 lượt).
3. Người nghe duyệt: giọng bà Hoa (Gacrux), hai người gọi, ông Tư; độ lệch chất giọng Bé Nai giữa các lượt đã tách và giữa câu cũ (`prototype/audio/benai-*`) với câu mới trong Bài 2; clip ngắn nhất `bn-16` (b02), `bn-14` (b09), `bn-35` (b01), `bn-31` (b03) ("Chuẩn luôn!", "Dạ đúng rồi ạ!", khoảng 1 giây).
4. Sau khi giọng người gọi Bài 1 ổn: `python3 tools/do-moc-dau-hieu.py prototype/hoc/bai-01.json`.
5. Chạy lại `node tools/kiem-bai-hoc.mjs` và xem lại ảnh màn hình sau các lần sửa cuối.
6. Chuyển cho agent phần gọi video hai chỗ ở `loi-minh.json`, `loi-tu.json` (mục e) và danh sách tệp cần đóng gói vào app: `prototype/hoc.html`, `prototype/hoc/**`, `assets/comic9-*.png`, `assets/chan-dung-*.png`, `assets/avatar-hat-dau.png` (cùng `ds.css`, `icons.js`, phông chữ đã có).
7. Thử trên WebView thật: tự phát tiếng (trang có báo "chạm nút loa" khi bị chặn), nút Back, đường đi về với cuộc gọi thật.
8. Tùy chọn: chạy lại Astra trên `hoc.js` sau các lần sửa; viết báo cáo cuối cho người dùng.

Tranh: không còn tấm nào phải vẽ cho 4 bài này.

## (h) Tệp tạm đáng giữ (trong `$S`)

- `tao-noi-dung.py`: nguồn sinh ra 4 tệp bài học và `danh-sach.json` (QUAN TRỌNG nếu còn sửa lời).
- `astra/p1.txt`, `p1b.txt`, `p2.txt` (lời nhờ) và `astra/out1.md`, `out1b.md`, `out2.md` (kết quả).
- `ve9/` (lời dặn vẽ, hình mẫu, `out/` bản gốc 6 tranh, `sheet9.png`).
- `kb/bai1.md` … `bai9.md` (bản nháp các mục kịch bản; bản trong kho mới là bản đúng).
- `thu/` (6 mẫu giọng thử và `mo-ta.txt`), các nhật ký `thu-*.log`, `nghe-a.log`, `nghe-b.log`, `cat-b1a.log`.
- `thu1.sh` … `thu4.sh`, `nghe1.sh`, `cat1.sh`: kịch bản chạy lượt thu/nghe (nạp khóa từ tệp .env, không chứa khóa).
- `anh/`: 172 ảnh màn hình của lượt kiểm cuối và các tờ ghép `s1.png` … `s8.png`; `kiem-1.log` … `kiem-6.log`.
- Ngoài `$S`: `audio-goc/hoc/bNN/` trong kho giữ lượt thu gốc (`*-take.wav`, `*-take-sach.wav`), lời dặn đã dùng (`*-loi-dan.txt`) và nhật ký nghe lại.

---

## Phiên Opus (dừng lúc ~15:20 ngày 25/11/2026, theo lệnh dừng của phiên chính)

Không còn tiến trình nền nào của phiên này (đã kiểm `ps`). JSON và `hoc.js` KHÔNG bị sửa trong phiên này. 176 tệp giọng mà 4 bài tham chiếu đều có và giải mã được (ffmpeg, 15:20).

### Nguồn sự thật cho 4 tệp bài: CHỌN JSON TRONG KHO
- Đã kiểm: chạy lại `$S/tao-noi-dung.py` vào thư mục thử (`$S/sinh-thu/`) → 4 tệp bài + `danh-sach.json` GIỐNG HỆT bản trong kho (diff rỗng). Từ giờ sửa thẳng `prototype/hoc/bai-NN.json`; `tao-noi-dung.py` coi như đã nghỉ (nằm ở thư mục tạm, dễ mất). Nhớ: thêm/bớt câu của một giọng thì đổi số tệp giọng phía sau.
- Đã kiểm thêm: lời trong mọi `audio-goc/hoc/bNN/*-loi.json` (lời đã thu) khớp từng chữ với JSON hiện tại.

### Khóa
- Phiên chính dặn: CHỈ lấy `GEMINI_API_KEYS` từ `/home/rin/dongnaihackathonvivi/la-chan-so/.env` (6 khóa đọc được 3.8), KHÔNG dùng `.env` của vlearn nữa. Bộ nạp an toàn: `$S/chay.sh <lệnh>` (nạp đúng một biến đó từ .env của kho, không in, rồi `cd` vào kho và chạy lệnh). Đừng dùng `set -a; . .env` (nạp cả các biến khác).

### Năm việc được giao + lời dặn mới
1. **Cắt lại + nghe lại các lượt cũ: DỞ, rồi BỎ.** Đã chạy `--cat-lai --nghe-cau` cho b01 Bé Nai p2, p3; b09 Bé Nai p2; b03 Bé Nai p1 (chỉ tới bước cắt + lọc + nghe cả lượt, phần nghe từng câu bị ngắt). Sau đó phiên chính báo 3.8 có lại hạn mức và dặn thu lại Bé Nai MỘT lượt mỗi bài, nên tôi dừng hết. Các tệp `bn-*` của b01 (bn-11..34), b09 (bn-09..15), b03 (bn-01..08) hiện là bản CẮT LẠI CHƯA NGHE (sẽ bị thay khi thu lại; bản trước đó sao lưu ở `$S/sao-luu/giong-truoc/`). Các lượt KHÔNG phải Bé Nai (b01 bà Hoa, b03 bà Hoa, b09 ông Tư, b09 Vy, b02 Vy, b02 người gọi nữ) CHƯA cắt lại, CHƯA nghe lại: vẫn như bảng mục (g).
   - Phát hiện quan trọng: cảnh báo "DÀI HƠN LỜI GỐC, có thể đọc thừa hoặc lặp" của `thu-bai-hoc.py` là BÁO NHẦM khi máy nghe ghi mốc thời gian dạng `00:23` không ngoặc: mỗi mốc thành 2 "tiếng" (b01 p2: 288 − 244 = 44 = 22 câu × 2). Nghi ngờ "b01 p3 đọc lặp" (189 so với 157) nhiều khả năng cũng chỉ là vậy; phải đọc bản chép để chắc. Nên sửa `lam_sach()` bỏ cả mốc dạng `\d+:\d+` / `\d+m\d+s`.
2. **Thu lại: MỚI XONG 1/4 lượt Bé Nai.** Bài 2: `gemini-3.8-flash-tts` thu trọn 22 câu MỘT lượt ngay lần đầu (112,3 giây, khóa đầu, không bị từ chối), cắt 0,36 giây nhiễu đuôi, cắt bằng quy hoạch động có mốc máy nghe (3.8 cũng KHÔNG nghỉ đủ 0,9 giây giữa mọi câu; ranh giới ngắn nhất 0,49 giây), lọc rẹt 22 tệp → `prototype/hoc/giong/b02/bn-01..22.m4a` đã thay. CHƯA NGHE LẠI. Lượt thô: `audio-goc/hoc/b02/bn-take.wav`, `bn-take-sach.wav`, nhật ký `$S/thu-bn.log` (có ghi giây đầu từng câu). Bài 9, 3, 1: CHƯA thu.
   - Cách thu tiếp (giãn cách, chỉ 3.8, chờ 600 giây mỗi lần gọi): `nohup $S/thu-bn.sh 9 3 1 &` (thu + cắt + lọc, `--khong-nghe`, thử lại tối đa 3 lần cách 90 giây, nghỉ 60 giây giữa các bài). Rồi nghe lại từng bài: `$S/cat-lai.sh <nhãn> "2 be-nai"` (cắt lại + nghe cả lượt + nghe từng câu; ghi `$S/nghe/*.log`, có tên mô hình nghe). Nếu tự cắt lệch: đọc bản chép cả lượt, ghi giây đầu câu 2…n rồi `--cat-lai --moc=…` (tùy chọn mới, xem dưới). Sau khi Bé Nai cả 4 bài ổn thì xóa các lượt cũ `bn-p*-take*.wav`, `bn-p*-cat/` cho khỏi nhầm (thư mục bị git bỏ qua).
   - Sau đó mới tới các giọng khác thật sự hỏng (mỗi giọng một lượt): b01 bà Hoa (3 lượt trước đều hỏng câu 3, lượt thứ tư chưa nghe), b03 bà Hoa (cắt lệch), ông Tư nếu người nghe chê. Thu lại người gọi nam Bài 1 thì chạy `python3 tools/do-moc-dau-hieu.py prototype/hoc/bai-01.json`.
3. **Tờ nghe cho người (`bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md`): CHƯA làm.** Ghi chú để làm: clip ngắn nhất hiện tại b02 `bn-16` "Chuẩn luôn!" 1,14 giây (bản vừa thu lại; đo lại); b09 `bn-14` "Chuẩn luôn!" dài 2,37 giây là bất thường (nằm trong lượt p2 cắt lệch).
4. **Kiểm tự động + xem ảnh: CHẠY XONG, XEM DỞ.** `node tools/kiem-bai-hoc.mjs --anh $S/anh2` lúc 15:10–15:15 (trước khi thay giọng Bài 2): **đạt 1254, lỗi 0**, 212 lượt soát bố cục, 172 ảnh (`$S/kiem-7.log`). Tờ ghép ở `$S/to/` (b1a, b1b, b1c, b2a, b2b, b2c, b3a, b3b, b9a, b9b, b9c). Đã XEM b1a, b1b, b1c: không thấy lỗi (thư viện, bìa, truyện, ôn lại, B6 mọi pha, B2 chữ lớn, gợi ý 3/3, thử thách, kết quả đủ/thiếu/bỏ dở, B1 chữ lớn, B2 đầy đủ, B5 chữ lớn). CHƯA xem b2a…b9c. Sau khi thay giọng phải chạy lại lần nữa.
5. **Astra lượt cuối: CHƯA chạy.** Mẫu lời nhờ cũ: `$S/astra/p2.txt`.
- **Thử đường đi thật với trang gọi video: đã VIẾT, CHƯA CHẠY** `$S/khu-hoi.mjs` (chạy từ gốc kho: `node $S/khu-hoi.mjs 8818`): mở `hoc.html?bai=N&phan=c` → bấm Nghe máy → `video-call.html` thật → trả lời (nút trả lời sẵn cho minh-1/minh-3, `window.__go` cho lan-2/tu-9) → bấm nút quay về → kiểm màn kết quả nhận đúng điểm, khóa `lcs-goi-*` bị xóa, mở lại `?sau=goi` không nhận lần hai; thêm hai lượt trả lời chưa an toàn (minh-1, tu-9). Ảnh ở `$S/anh-khu-hoi/`. Đoạn bấm "kết thúc cuộc gọi" ở lượt sai là đoán bộ chọn, có thể phải sửa.

### Bảng trạng thái giọng (cập nhật 15:20)
| Bài · giọng | Trạng thái |
|---|---|
| b02 Bé Nai (22 câu) | THU LẠI một lượt bằng 3.8, đã cắt + lọc, CHƯA NGHE |
| b01, b03, b09 Bé Nai | Chờ thu lại một lượt mỗi bài bằng 3.8. Tệp hiện có: lượt tách cũ (3.1-preview); một số phần vừa bị cắt lại chưa nghe (xem việc 1) |
| b01 bà Hoa, b03 bà Hoa, b09 ông Tư, b09 Vy, b02 Vy, b02 người gọi nữ | Như mục (g), chưa động tới |
| b01 người gọi nam, b01/b03 Minh | Như mục (g) (đã nghe, khớp; mốc `luc` B6 còn đúng vì không đụng) |

### Tệp đã sửa thêm trong phiên này (không đụng JSON, `hoc.js`, `hoc.css`)
- `tools/nghe-lai.py`: biến môi trường `NGHE_LAI_GHI_MO_HINH=1` thì ghi `[mô hình: …]` cuối dòng (mặc định không đổi gì).
- `tools/thu-bai-hoc.py`: in giây đầu các câu 2…n sau khi cắt; tùy chọn mới `--moc=t2,t3,…` (cắt theo mốc ghi tay, bám quãng lặng gần nhất).
- `tools/gemini_take.py`: biến môi trường `GEMINI_TTS_MO_HINH` (chỉ thu bằng các mô hình này), `GEMINI_TTS_CHO` (giây chờ mỗi lần gọi), in `finishReason` khi máy trả về không có tiếng. Mặc định giữ nguyên hành vi cũ.
- Tạo trong `$S`: `chay.sh`, `cat-lai.sh`, `thu-bn.sh`, `khu-hoi.mjs`, `sao-luu/` (bản giọng và JSON trước phiên), `sinh-thu/`, `nghe/`, `anh2/`, `to/`, `kiem-7.log`, `thu-bn.log`.

### Việc còn lại, theo thứ tự
1. Thu Bé Nai Bài 9, 3, 1 (`$S/thu-bn.sh 9 3 1`, giãn cách), rồi nghe lại cả 4 bài (cả lượt + từng câu), đọc bản chép, sửa chỗ cắt lệch bằng `--moc`.
2. Cắt lại / nghe lại / thu lại các giọng khác còn ngờ (b01 bà Hoa, b03 bà Hoa, ông Tư, Vy, người gọi nữ), mỗi giọng một lượt.
3. Viết `bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md`.
4. Chạy lại `node tools/kiem-bai-hoc.mjs --anh <thư mục>`, xem hết các tờ ghép; chạy `node $S/khu-hoi.mjs 8818`.
5. Astra lượt cuối trên `hoc.js` + 4 JSON (xưng hô, lộ đáp án, chấm điểm lách được, ngõ cụt, lời khuyên sai), sửa phần thật.
6. Báo cáo cuối: nêu rõ Bài 2 đã về đúng quy trình một lượt; các bài khác thì tùy kết quả thu.
