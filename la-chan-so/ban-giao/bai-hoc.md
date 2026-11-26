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

---

## Phiên Opus 2 (25/11/2026, khoảng 15:20–17:00, nhánh `android-and-lessons`)

Không còn tiến trình nền nào của phiên này. Chưa commit gì (phiên chính tự commit các điểm dừng). Trong mục này `$S` vẫn là `ban-giao/tam-hoc`.

### Đã làm
1. **Thu Bé Nai Bài 9, 3, 1, mỗi bài MỘT lượt** bằng `gemini-3.8-flash-tts` (`$S/thu-bn.sh 9 3 1`, lần thử đầu đều được: 219,5 / 228,4 / 343,0 giây). Cả 4 bài Bé Nai giờ đúng quy trình một lượt mỗi bài.
   - **Lỗi lớn đã gặp và đã sửa:** lượt b01 và b09 **đọc lẫn toàn bộ lời dặn giọng** (phần chỉ đạo, danh sách cảm xúc từng đoạn, câu "Mỗi đoạn dưới đây là một câu riêng…") ở ĐẦU lượt, rồi mới đọc lời. Máy cắt vẫn chia đủ số câu nên các tệp bị lệch hết và có câu chứa lời dặn (bản này đã lỡ được commit ở điểm dừng đầu, đã báo phiên chính). Cách sửa, không thu lại: tùy chọn mới `--bo-dau=<giây>` của `tools/thu-bai-hoc.py` bỏ đoạn đầu lượt rồi mới cắt (b01 bỏ 129,6 giây, b09 bỏ 67,0 giây; điểm bỏ tìm bằng cách chép từng đoạn ngắn quanh các quãng lặng). b09 phải dời thêm 3 ranh giới bằng `--moc` (bn-14, 15, 16). Lệnh tái tạo đúng bản hiện tại:
     `$S/chay.sh python3 tools/thu-bai-hoc.py 1 be-nai --cat-lai --khong-nghe --bo-dau=129.6 --moc=5.21,12.65,15.53,19.09,21.62,25.19,32.32,33.98,40.65,43.94,47.32,49.49,51.99,60.17,63.25,68.43,76.26,82.52,88.53,95.89,100.37,104.15,107.21,115.24,119.38,126.19,129.22,134.26,137.80,141.69,144.80,149.37,153.20,159.20,161.05,164.61,169.54,173.52,177.81,183.38,187.39,193.76,198.08,203.54,208.08`
     `$S/chay.sh python3 tools/thu-bai-hoc.py 9 be-nai --cat-lai --khong-nghe --bo-dau=67.0 --moc=6.98,11.16,16.93,19.70,23.04,28.37,36.04,40.72,46.76,55.69,62.37,67.35,70.75,72.63,77.25,91.02,98.41,105.26,111.89,121.00,126.09,131.88,137.31,143.15,148.46`
   - b02: sửa ranh giới bn-05/bn-06 ("Chuẩn luôn!" của bn-06 bị dính vào đuôi bn-05) bằng `--moc` (mốc thứ năm 30.27 thay 31.25, các mốc khác như cũ).
   - **Bài học cho lần sau:** sau MỖI lượt thu dài phải chép nguyên văn cả lượt (`$S/chep-tron.py` với `gemini-3.5-transcribe`) và so số tiếng với lời gốc TRƯỚC khi cắt; lượt dài hơn hẳn mức đọc (b01: 343 giây cho 730 tiếng) là dấu hiệu đọc lẫn lời dặn. Chưa đưa bước này vào `thu-bai-hoc.py`.
2. `tools/thu-bai-hoc.py`: `lam_sach()` bỏ mốc giờ dạng `00:23`, `0m3s`, `4.2s` và số đứng riêng (lời thu không có chữ số), hết báo nhầm "dài hơn lời gốc"; `hoi_moc()` thử thêm `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3-flash-preview` khi `gemini-3.5-flash` hết lượt (nhận `NGHE_LAI_MO_HINH`); thêm `--bo-dau`. `tools/nghe-lai.py`: thứ tự mô hình mặc định đưa các bản flash mạnh lên trước bản lite.
3. **Cắt lại + nghe lại các giọng khác** (cùng lượt thu cũ, không thu lại giọng nào ngoài Bé Nai): b01 bà Hoa, b03 bà Hoa (lượt cắt cũ dính đầu câu sau, nay đúng), b09 ông Tư, b09 Vy, b02 Vy, b02 người gọi nữ. Không giọng nào hỏng tới mức phải thu lại; các câu còn ngờ ghi ở tờ nghe.
4. **Tờ nghe cho người:** `bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md` (27 hàng: 13 câu nghi sai chữ, 4 chỗ cắt sửa tay, 5 clip ngắn, 5 giọng chưa ai duyệt).
5. **Kiểm tự động + ảnh:** xem mục "Kết quả kiểm".
6. **Astra lượt cuối** (`$S/astra/p3.txt` → `$S/astra/out3.md`, 23 nhận xét), đã đối chiếu từng mục với mã; bảng ở dưới.
7. Việc phiên chính giao thêm giữa chừng: sửa câu mở của chú Tư trong `KICH-BAN-BAI-HOC.md` theo bản đã thu ("A lô, Vy đó hả con? …", không thu lại; `bai-09.json` không chép câu này); **bài ông bà cũng tự sang khung tranh kế** (chờ 2 giây, bài học sinh 0,7 giây; không tự sang ở khung ngõ cụt, khi trang ẩn, điểm rẽ vẫn chờ chọn) theo duyệt của người dùng sau khi thử trên máy thật.

### Bảng trạng thái giọng (17:00)
| Bài · giọng | Lượt | Trạng thái |
|---|---|---|
| b01 Bé Nai (46 câu) | 3.8, một lượt, bỏ 129,6 giây đầu (lời dặn) | Chép nguyên văn cả lượt 731/730 tiếng, không còn lời dặn; chép từng câu 46/46 đúng chỗ; `nghe-lai.py` cả lượt (gemini-3-flash-preview): KHÔNG CÓ LỜI DẶN. Câu ngờ: bn-07, bn-28 (tờ nghe) |
| b02 Bé Nai (22 câu) | 3.8, một lượt | `nghe-lai.py` cả lượt (gemini-3.5-flash) 384/385, không lời dặn; chép cả lượt khớp. Câu ngờ: **bn-22 có thể đọc "bà" thay "bạn"** (4 lần nghe riêng), bn-17, bn-05/06 (cắt sửa tay), bn-16 (0,87 s) |
| b03 Bé Nai (42 câu) | 3.8, một lượt, không dính lời dặn | Chép cả lượt 683/683; `nghe-lai.py` cả lượt KHÔNG CÓ LỜI DẶN (685/683); chép từng câu 42/42 đúng chỗ. Câu ngờ: bn-27, bn-28 (nghe riêng lệch, cả lượt đúng) |
| b09 Bé Nai (26 câu) | 3.8, một lượt, bỏ 67,0 giây đầu (lời dặn) | Chép cả lượt 490/492; `nghe-lai.py` cả lượt (gemini-3.8-flash) KHÔNG CÓ LỜI DẶN; chép từng câu 26/26 sau khi sửa 3 ranh giới. Câu ngờ: bn-15, bn-16, bn-14 (0,95 s) |
| b01 bà Hoa (3) | lượt cũ, cắt lại | bh-03 "hết hồn" đã gỡ nghi (5 máy); bh-02 chữ "tôi" còn ngờ |
| b03 bà Hoa (4) | lượt cũ, cắt lại | Cắt đúng; chép cả lượt khớp. Giọng chưa ai duyệt |
| b01 người gọi nam (7) | không đụng | Như trước; mốc `luc` B6 còn đúng |
| b01/b03 Minh (1+1) | không đụng | Khớp |
| b09 ông Tư (5) | lượt cũ, cắt lại | Mọi máy nghe "Vy" thành "Dì/gì" (có thể chỉ do giọng Nam), ot-05 "Ờ ha … May" lệch: CẦN NGƯỜI NGHE |
| b09 Vy (1), b02 Vy (5) | lượt cũ, cắt lại | b02 vy-04 còn ngờ; còn lại khớp ở máy mạnh |
| b02 người gọi nữ (5) | lượt cũ, cắt lại | Chép từng câu và cả lượt khớp (trừ dấu thanh "chị/chỉ", "Nạp/Lạp") |

Về máy nghe: hạn mức NGÀY (gói miễn phí, theo project, theo mô hình) của `gemini-3.5-flash` và `gemini-2.5-flash` hết lúc khoảng 15:45; `gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.5-transcribe` cũng hết vào cuối phiên. `gemini-3-flash-preview` với lời hỏi của `nghe-lai.py` hay **bịa lại chính các câu ví dụ trong lời hỏi** ("hơi lo lắng nhưng thân thiện", "tốc độ vừa phải") rồi kết luận CÓ LỜI DẶN, kể cả với clip chưa tới 1 giây: kết luận CÓ LỜI DẶN của nó không đáng tin (các câu nó gắn cờ đều được `gemini-3.5-transcribe` chép sạch). Lượt kiểm lại các câu đó bằng 3.7/3.8-flash không chạy được vì hết hạn mức (ghi ở `$S/nghe/g3p-co-loi-dan-kiem-lai.log`).

### Kết quả kiểm
- `node tools/kiem-bai-hoc.mjs --anh $S/anh5` (lượt cuối, sau mọi sửa, `$S/kiem-10.log`): **đạt 1358, lỗi 0**, 214 lượt soát bố cục, 178 ảnh, hai cỡ 393×873 và 360×740, 176 tệp giọng có và giải mã được. Lượt trước đó (`$S/anh4`, `kiem-9.log`, 1362/0, trước sửa tự sang khung) tôi đã ghép thành 16 tờ (`$S/to4/`) và **xem hết bằng mắt**; của lượt cuối chỉ xem thêm tờ các màn truyện chữ lớn (`$S/to4/anh5-truyen-chu-lon.png`), phần còn lại giống lượt trước: không thấy tràn, đè, cắt chữ; tin nhắn B1 Bài 2 theo thứ tự mới đọc tự nhiên; màn tạm dừng B6 có đủ hai nút; ô Gợi ý phủ mờ nền. Lượt `kiem-8` (trước khi chỉnh bố cục) bắt được 5 lỗi tràn ở 360×740 do chính các sửa theo Astra, đã sửa hết (rút gọn lời báo chưa đạt, thu gọn ô cuộc gọi khi tạm dừng, chỉ giữ việc đúng ở B5 khi chưa đạt, lý do từng việc chỉ hiện khi đạt như kịch bản, B5 xếp chữ lớn thu khoảng cách, tiêu đề màn kết quả ngắn lại).
- Kiểm mới thêm vào `kiem-bai-hoc.mjs`: chạm lại cùng chỗ nhầm ở B1 không đếm thêm; mở rồi đóng Gợi ý khi đang nghe lại B6 không kẹt ở nút DỪNG; B5 sai trước rồi mới đúng thì chưa đạt và làm lại được; bản ghi cuộc gọi sai hợp đồng (vượt tổng, điểm lẻ, tổng là chữ, thiếu `luc`) không được nhận; tiến độ hỏng (điểm vượt trần, "đạt" mà chưa xong) không được tính trên thư viện; B5 chữ lớn trên dữ liệu xếp thứ tự vẫn phải xếp; kể xong khung 1 thì tự sang khung 2 ở cả hai chế độ.
- `node $S/khu-hoi.mjs 8818` (đi thật từ bài học sang `video-call.html` rồi quay về; đã sửa bộ chờ: bấm Kết thúc thì trang gọi chuyển sang trạng thái `ended`, không phải `done`; thêm `node $S/khu-hoi.mjs 8818 sai` để chỉ chạy hai lượt trả lời chưa an toàn): lượt cuối `$S/khu-hoi-3.log` **ĐẠT HẾT** cả 6 lượt (4 bài trả lời đúng: nhận đúng điểm 2/2, 4/4, 2/2, 4/4; Bài 1 và Bài 4 trả lời chưa an toàn rồi cúp: nhận 0 điểm, lời Bé Nai đúng nhánh), khóa `lcs-goi-*` bị xóa sau khi nhận, mở lại `?sau=goi` không nhận lần hai, không lỗi trang, không tệp 404. Ảnh ở `$S/anh-khu-hoi/`.
- CHƯA thử trên WebView Android thật (phiên chính đã cài APK 16:30 lên điện thoại cho người dùng thử; bản đó chưa có sửa tự sang khung và bỏ viền tiêu điểm ở `hoc.js`).

### Astra lượt cuối (`$S/astra/out3.md`): đã sửa
| # | Nhận xét | Sửa |
|---|---|---|
| 1 | Bản ghi cuộc gọi sai hợp đồng vẫn được điểm (làm tròn 0,5, bỏ qua `tong`, thiếu `luc`) | `sauGoi()` chỉ nhận `diem` nguyên trong 0..số ý, `tong` đúng số ý của bài, `luc` sau lúc bấm gọi; sai thì coi như chưa có kết quả |
| 2 | Tiến độ cũ điểm vượt trần lên thư viện; "đạt" mà chưa "xong" vẫn được sao | `chuanKho()`: điểm nguyên, tổng ≤ 10 ý; `dat` chỉ khi `xong` |
| 3 | Mở Gợi ý khi đang nghe lại B6 (bài đã xong) thì kẹt ở nút DỪNG | Đóng gợi ý luôn gọi `khiDongGoiY`; B6 dựng nút nghe tiếp + nút đi tiếp khi bài đã xong, thu gọn ô cuộc gọi |
| 5 | Tải lại màn kết quả hiện điểm tốt nhất thay vì lượt vừa gọi | `ketQua()` đọc `c` trước `c_tot` |
| 6 | Máy cấm lưu thì gọi xong vẫn không có điểm mà không báo | Màn thử thách báo trước "cuộc gọi vẫn tập được nhưng chưa tính điểm" |
| 7 | Lời hứa của lượt B6 cũ đặt `trong=false` cho lượt mới, cho 3 sao trước mốc | Chỉ đổi cờ khi đúng lượt |
| 8 | Ép `?che_do=don-gian` làm B5 Bài 4 dễ hơn | Dữ liệu xếp thứ tự thì luôn xếp, kể cả chữ lớn |
| 9 | B1 quét từ cuối tin nhắn là đạt; chạm đúp một chỗ nhầm tính hai | Đếm chỗ nhầm khác nhau; đổi thứ tự các cụm trong tin nhắn Bài 2 (chỉ chữ hiện, không đổi lời thu) để quét từ đầu hay từ cuối đều vấp hai cụm nhiễu trước khi đủ bốn chỗ |
| 10 | Bấm hết các nút vẫn được sao B | Ngưỡng sai (luật mới ở mục 1 kịch bản): B2, B4 sai tối đa 1 lần; B5 chọn việc đầu phải đúng ngay; B5 xếp kiểm sai tối đa 1 lần; quá thì xong nhưng chưa đạt, có "Làm lại để đạt" |
| 11 | Trang nằm nền vẫn tự kể hết truyện và được sao A | Không tự sang khung khi `document.hidden` |
| 12 | Xem đáp án xong vẫn làm tiếp trên lượt đã kết thúc | Khóa thao tác ở B1, B4, B5 khi lượt đã kết thúc; B5 xem đáp án thì hiện việc đúng |
| 13 | Tệp tiếng treo (không lỗi, không phát) làm kẹt lượt mẫu | `phat()` có canh giờ: 8 giây không phát, hoặc quá độ dài tệp + 4 giây, thì đi tiếp bằng thời gian đọc chữ |
| 15 (một phần) | Đổi chế độ thì lời báo gọi sai người | Lời báo "đã xem đáp án", "Gần đúng rồi" lấy xưng hô theo bài; nhãn bìa "Dành cho ông bà/học sinh" theo bài, "chữ lớn" theo cỡ chữ |
| 16 (Bài 4) | Gợi ý 2 phần C nêu thẳng một ý được chấm | "Ngoài chuyện cho rút trước, trong nhóm còn hứa hẹn điều gì nghe khó tin không ta?" (chữ hiện, không thu) |
| 18 | Lời giải mẫu B4 Bài 4 rộng quá sự thật ("Ai cam kết không lỗ là nói xạo") | "Hứa lãi cao mà chắc chắn không lỗ là dấu hiệu phải dừng lại" (chữ hiện) |
| 19 | Ô Gợi ý không phải hộp thoại, Tab tới được nút phía sau | `role=dialog`, nền `inert`, tiêu điểm vào nút Đóng (không vẽ viền), đóng thì trả tiêu điểm |
| 20 | Lượt mẫu B6 bấm Dừng muộn hơn cách chấm | Mẫu cúp tại mốc `luc` + 0,5 giây |
| 21 | Loa của câu đã nối đúng không phát; loa ở lượt mẫu không dùng phím được | Chạm câu đã nối thì nghe lại; loa mẫu có `tabIndex` và phím Enter/Space |
| 22 | `pointercancel` được chấm như vuốt | Tách riêng: chỉ đặt thẻ về chỗ |
| 23 | Lời "coi lại ý còn thiếu" mà màn liệt kê đủ bốn ý | Tiêu đề thẻ đổi thành "Coi lại các ý được chấm" (lời thu giữ nguyên) |

### Astra lượt cuối: không sửa, và lý do
- **4** (hai tab cùng bài nhận nhầm điểm): app chạy trong một WebView, một trang; trình duyệt máy tính chỉ để thử.
- **14** (Back đóng cả bài khi đang mở Gợi ý; mỗi màn chưa có mục lịch sử riêng): đổi lớn, phải thử trên WebView thật cùng nút Back của app; Back hiện về thư viện, không phải ngõ cụt.
- **15** phần lời thu: chỉ xảy ra khi ép `?che_do=` (tham số thử); sửa phải thu lại cả lượt.
- **16** phần Bài 1 (gợi ý 2 của B6 nêu "vụ án"): lời đã thu (`b01/bn-22`), là gợi ý của phần luyện không tính điểm và đứng sau gợi ý 1; sửa phải thu lại cả lượt Bé Nai Bài 1.
- **17** (thẻ "dặn bà đừng kể cho con cháu" gắn nhãn lừa): Bài 1 dùng hai nút nên "Lừa" và "Cần kiểm tra" đều là "Khoan đã"; kịch bản coi "dặn giấu con cháu" là dấu hiệu lừa.

### Lệch cần người dùng quyết
- ~~Tranh ông Tư trong Bài 4 lệch avatar 117~~: **đã xử lý**, agent vẽ đã vẽ lại cả bộ chú Tư (`comic9-*`, `chan-dung-ong-tu.png`, `ong-tu-bang-nhan-vat.png`) thành người đàn ông khoảng 45, vest xanh đen, sơ mi trắng, cà vạt xanh.
- Điểm rẽ và khung ngõ cụt cho Bài 1, Bài 3: người dùng đã duyệt rồi TẠM DỪNG (có thể sửa cốt truyện hai bài trước vì bị lặp). Phiên này chưa làm gì cho phần đó.

### Tệp đã sửa trong phiên này
- `prototype/hoc/hoc.js`, `prototype/hoc/hoc.css`, `prototype/hoc/bai-02.json` (thứ tự cụm tin nhắn B1), `prototype/hoc/bai-09.json` (gợi ý 2 phần C, lời giải mẫu B4).
- `prototype/hoc/giong/b01|b03|b09/bn-*.m4a` (thu lại), `b02/bn-05, bn-06` (cắt lại), `b01/bh-*`, `b03/bh-*`, `b09/ot-*`, `b09/vy-01`, `b02/vy-*`, `b02/gu-*` (cắt lại từ lượt cũ).
- `tools/thu-bai-hoc.py`, `tools/nghe-lai.py`, `tools/kiem-bai-hoc.mjs`.
- `bai-hoc/KICH-BAN-BAI-HOC.md` (luật sao B có ngưỡng sai; luật tự sang khung; tin nhắn B1 Bài 2; gợi ý 2 và lời giải mẫu Bài 4; câu mở chú Tư), `bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md` (mới).
- Trong `$S` (git bỏ qua): `chep-tron.py` (lượt nghe thứ ba, chỉ chép nguyên văn), `nghe-bn2.sh`, `nghe-khac.sh`, `nghe-b03.sh`, `khu-hoi.mjs` (sửa), `astra/p3.txt`, `astra/out3.md`, `nghe/*.log`, `anh3`, `anh4`, `anh5`, `to4/`, `kiem-8..10.log`, `khu-hoi-1..3.log`, `sao-luu/giong-opus2-dau/` (giọng + JSON lúc đầu phiên). Bản `hoc.js` và `kiem-bai-hoc.mjs` trước khi sửa theo Astra ở thư mục nháp của phiên (có thể đã mất), dùng `git diff` để xem.
- Không đụng: `android/**`, `prototype/video-call.html`, `prototype/audio/**`, `prototype/loi-*.json`, `prototype/canh/**`, `bai-hoc/nghe-thu/CAN-NGHE.md`, `bai-hoc/nghe-thu/cho-thu-lai/`, `app/`, `server/`, `mvp/`, `de2/`. Các lượt thu cũ đã tách (`audio-goc/hoc/bNN/bn-p*-take*.wav`, `bn-p*-cat/`) vẫn còn, chưa xóa.

### Việc còn lại, theo thứ tự
1. Người dùng nghe `bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md`, trước hết hàng 1 (b02/bn-22 "bà" hay "bạn"): nếu sai thì thu lại lượt Bé Nai Bài 2 (một lần gọi 3.8), rồi chép nguyên văn cả lượt trước khi cắt.
2. Khi có lại hạn mức nghe (ngày mai): chạy `tools/nghe-lai.py` bằng `gemini-3.5-flash` cho từng câu của b01, b03, b09 Bé Nai (phiên này mới chép từng câu bằng `gemini-3.5-transcribe` và hỏi lời dặn ở mức cả lượt), và kiểm lại các câu `gemini-3-flash-preview` gắn CÓ LỜI DẶN (`b02/gu-01, gu-03, vy-02, vy-03, vy-05, bn-05, bn-12, bn-16`, `b03/bh-01`).
3. Đưa bước "chép nguyên văn cả lượt, so số tiếng, cảnh báo đọc lẫn lời dặn ở đầu" vào `tools/thu-bai-hoc.py` ngay sau khi thu.
4. Thử trên WebView thật bản có tự sang khung (APK cần dựng lại với `hoc.js` mới): tự phát tiếng, nút Back, Gợi ý, đi từ bài học sang cuộc gọi và về.
5. Nếu người dùng chốt cốt truyện mới cho Bài 1, Bài 3: làm điểm rẽ + ngõ cụt (lời, tranh Codex, thu lại cả lượt Bé Nai và bà Hoa của bài đó), sửa `bai-01.json`, `bai-03.json`, mục 1 kịch bản, `kiem-bai-hoc.mjs`.
6. ~~Người dùng quyết lệch tranh ông Tư và avatar 117~~: đã vẽ lại (xem mục "Phiên Opus 3").

---

## Phiên Opus 3 (25/11/2026, khoảng 16:50–17:50): điểm rẽ cho Bài 1, cốt truyện mới cho Bài 3

Không còn tiến trình nền nào của phiên. Chưa commit. Không dùng Gradle, máy ảo, điện thoại. Không đụng `prototype/canh/**`, `loi-minh.json`, `prototype/audio/minh/**`, và các tranh agent vẽ đã làm (`comic9-*`, `chan-dung-ong-tu.png`, `ong-tu-bang-nhan-vat.png`, `avatar-chi-lan.png`, `chan-dung-minh.png`).

### Gia đình chung (người dùng chốt)
Bà Hoa; con trai anh Minh (khoảng 30, khớp avatar 125: tóc đen ngắn, vest đen, sơ mi trắng hở cổ, không cà vạt); Vy là cháu ngoại, anh Minh là cậu của Vy.

### Lời từng nhánh
**Bài 1** (truyện giữ nguyên, thêm điểm rẽ ở khung 3 ngay lúc Lá chắn hiện "Khoan đã"):
- Khung 1 thêm câu mở: Bé Nai "Con kể bà nghe chuyện bà Hoa nha. Tới đoạn gay cấn, bà chọn giúp bà Hoa nha."
- Khung 3 (`comic1-3`) thêm Bé Nai "Nếu là bà Hoa, bà làm gì ạ?"; hai nút to, Bé Nai đọc to từng nút: **Chuyển tiền cho xong** → ngõ cụt; **Cúp máy, gọi cho con** → khung 4 cũ (nay là `an_toan`).
- Ngõ cụt (`comic1-5`): Bé Nai "Bà bỏ qua lời nhắc, chuyển hết tiền. Lát sau gọi lại số kia thì không ai nghe máy nữa." · bà Hoa "Tiền dành dụm bao lâu nay, mất hết rồi." · Bé Nai "Không sao đâu bà, đây chỉ là truyện thôi. Mình quay lại chọn lại nha." Về lại điểm rẽ: Bé Nai hỏi lại và đọc lại hai lựa chọn.
- Thử thách: **Anh Minh hoảng hốt gọi** (`minh-1`). Ý: "Cúp máy, không chuyển tiền"; "Hỏi lại công an phường hoặc người nhà, đừng giấu". Bé Nai mở đầu "Tới thử thách rồi bà ơi. Anh Minh đang gọi, giọng hoảng lắm. Bà bình tĩnh khuyên con nha."; đủ ý "Bà trấn an anh Minh giỏi ghê. Anh Minh hết sợ rồi ạ."; thiếu ý "Bà khuyên được một phần rồi ạ. Lúc nào rảnh, bà gọi lại anh Minh tập thêm nha."; bỏ dở, không được ý nào như cũ.

**Bài 3** (đổi truyện: kẻ gian giả làm cháu Vy):
- Khung 1 (`comic3-5`): Bé Nai câu mở như Bài 1 · "Sáng đó, bà Hoa đang tưới kiểng ngoài hiên. Bỗng điện thoại reo, đầu dây bên kia có tiếng con gái khóc." · người gọi giả làm cháu "Bà ngoại ơi, con Vy nè! Con bị xe tông, đang nằm bệnh viện. Con mượn máy bạn gọi bà."
- Khung 2 (`comic3-2` dùng lại): bà Hoa "Trời đất, con Vy! Con có sao không con?" · người gọi "Bà chuyển giùm con năm triệu tiền viện phí liền nha. Bà đừng nói với ai, con sợ mẹ la." · Bé Nai "Bà cuống hết cả lên, tay run run đi tìm cái ví."
- Khung 3 (`comic3-6`, điểm rẽ, nút thắt mới): Bé Nai "Bà gọi số của Vy mà bà lưu sẵn, nhưng máy Vy tắt, gọi hoài không được." · bà Hoa "Sao con nhỏ không bắt máy vậy nè? Hay là bị nặng lắm rồi?" · Bé Nai "Bà Hoa sốt ruột quá, chỉ muốn chuyển tiền liền cho xong. Nếu là bà Hoa, bà làm gì ạ?" · **Chuyển tiền liền cho kịp** → ngõ cụt; **Gọi anh Minh hỏi trước** → an toàn.
- Ngõ cụt (`comic3-7`): Bé Nai "Bà chuyển năm triệu. Lát sau gọi lại số kia thì không ai nghe máy nữa. Còn Vy thì vẫn ngồi học trong lớp." · bà Hoa "Trời ơi, tiền đi mất rồi, mà con Vy có sao đâu." · Bé Nai câu an ủi như Bài 1.
- An toàn (`comic3-8`): Bé Nai "Bà gọi anh Minh. Anh Minh gọi ngay cho cô giáo của Vy." · Minh "Mẹ ơi, cô giáo nói Vy đang ngồi học bình thường nè. Người gọi hồi nãy là kẻ gian đó mẹ." · bà Hoa "Vậy là con Vy không sao. Mẹ mừng quá." · Bé Nai "Rồi bà bấm báo cáo số lạ, để người khác biết mà dè chừng."
- Dấu hiệu: xưng là cháu, gọi bằng máy lạ; khóc lóc, đòi tiền gấp; dặn đừng nói với ai. Nhớ một câu: "Gọi cháu không được thì bà hỏi người nhà khác, khoan chuyển tiền nha." Việc ở nhà: lưu sẵn số cô giáo của cháu và số người nhà.
- Luyện: B5 hỏi "Người lạ xưng là cháu, khóc đòi tiền viện phí. Bà gọi số cháu thì không được. Bà làm việc nào trước ạ?", đúng là **Gọi người nhà khác hỏi lại** (hai việc kia: gọi lại số vừa gọi tới; chuyển tiền trước cho kịp). B2: thẻ mẫu 2 đổi thành "Bà gọi anh Minh, anh Minh hỏi cô giáo, Vy vẫn đang đi học."; lời giải thẻ "người lạ khóc, xưng là cháu", gợi ý 1 và lời khen cuối theo bài học mới.
- Thử thách: **Anh Minh hỏi mẹ về bé Vy** (`minh-3`). Ý: "Chưa chuyển tiền khi chưa hỏi lại được"; "Gọi người nhà khác hoặc cô giáo bằng số đã lưu". Bé Nai mở đầu "Tới thử thách rồi bà ơi. Anh Minh gọi hỏi bà chuyện bé Vy. Bà cứ trả lời như ở nhà nha."; đủ ý "Bà trả lời anh Minh rành rọt ghê. Bé Vy mà nghe chắc mừng lắm ạ."
- Lời Minh trong hai thử thách: agent gọi video viết trong `prototype/canh/minh-1.json`, `minh-3.json`; kịch bản để chỗ cho phiên chính chép vào.

### Tranh mới (Codex `gpt-6.1-sol`, cách làm như Bài 4; lời nhờ `$S/ve13/prompt-13.txt`, bản gốc `$S/ve13/out/`)
`assets/comic1-4.png` (vẽ lại, cùng bố cục, Minh mặc vest), `comic1-5.png` (ngõ cụt Bài 1), `comic3-5.png` (bà tưới kiểng nghe máy), `comic3-6.png` (gọi Vy không được), `comic3-7.png` (ngõ cụt Bài 3, Vy vẫn ngồi học), `comic3-8.png` (Minh và cô giáo, Vy ngồi học). Bảng nhân vật Minh vẽ trước để giữ cho giống (`$S/ve13/out/minh-bang-nhan-vat.png`, không đưa vào app). Tôi đã xem từng tấm: không chữ, không số, không logo, Minh mặc vest đen, sơ mi trắng hở cổ, không cà vạt, kẻ gian là hạt đậu xám. Chữ thập đỏ trên xe cấp cứu (`comic3-6` và tranh cũ `comic3-1`, là biểu tượng được pháp luật bảo hộ) **đã bỏ**, thay bằng trái tim hồng: sửa đúng vùng đó bằng ImageMagick (tô lại thân xe trắng rồi vẽ trái tim), mọi chỗ khác giữ nguyên từng điểm ảnh; bản cũ ở `$S/ve13/cu/`, tờ so sánh `$S/ve13/so-sanh-chu-thap.png`. Đã xem hết tranh trong `assets/`: không còn tấm nào có chữ thập đỏ. `tools/ve-tranh/STYLE.txt` và `prompt-c1/c2/c3.txt` từng gợi ý vẽ "red cross" trong bóng nói, đã bỏ và thêm luật không vẽ chữ thập đỏ, lưỡi liềm đỏ. Tranh cũ `comic3-1`, `comic3-3`, `comic3-4` không còn dùng trong bài (vẫn còn trong `screens/`). Sửa mô tả Minh trong `tools/ve-tranh/STYLE.txt`, `prompt-c1.txt`, `prompt-c3.txt`, `prompt-comic1.txt`, `prompt-comic3.txt`; mô tả chú Tư mới trong `prompt-comic9.txt` và kịch bản Bài 4.

### Giọng (chỉ gemini-3.8-flash-tts)
| Bài · giọng | Lượt | Trạng thái |
|---|---|---|
| b01 Bé Nai (52 câu) | thu lại lúc 17:14 với `--it-loi-dan`, 235,4 s | Chép cả lượt (OpenAI, phiên chính chạy) 796/796, sạch; cắt lại bằng mốc whisper (`$S/moc-tu-whisper.py`, mốc ở `$S/nghe/moc-b01.txt`); chép từng câu sau cắt lại: đúng chỗ |
| b03 Bé Nai (48 câu) | thu lại lúc 17:12 với `--it-loi-dan`, 240,8 s | 762/762, sạch; sửa ranh giới bn-14, 15, 16 bằng `--moc`; chép từng câu: đúng chỗ |
| b01 bà Hoa (4), b03 bà Hoa (4) | thu mới | Chép khớp; bh-04 (b01), bh-03, bh-04 (b03) người dùng đã nghe: đạt |
| b03 Minh (1) | thu mới (Achird, theo `nhan-vat.json`) | Khớp |
| b03 người gọi giả làm cháu (2) | giọng mới `nguoi-goi-chau`, Gemini Achernar | Khớp (trừ "Vy"); giọng chưa ai duyệt |
| b01 người gọi nam, b01 Minh | không đụng | Mốc `luc` B6 còn đúng |

- **Lỗi đã gặp:** hai lượt Bé Nai đầu (17:02, 17:05) đọc cả lời dặn ở đầu rồi **bịa hẳn lời khác** (chuyện đi bộ, nấu cơm, Trạng Quỳnh…), dài 444 và 515 giây. Đã bỏ (lưu ở `audio-goc/hoc/b0N/bn-take-doc-loi-dan.wav`). Thu lại với `--it-loi-dan` (tùy chọn mới của `tools/thu-bai-hoc.py`: bỏ danh sách cảm xúc từng đoạn khỏi lời dặn) thì sạch ngay lần đầu. `thu-bai-hoc.py` nay cũng tự cảnh báo khi lượt dài bất thường so với số tiếng ("NGHI ĐỌC LẪN LỜI DẶN"). Khuyên: lượt Bé Nai dài từ nay dùng `--it-loi-dan`.
- **Máy nghe:** hạn mức ngày của mọi mô hình Gemini nghe tốt đã hết; gemini-3-flash-preview còn lượt nhưng **bịa cả đoạn hội thoại** khi chép câu ngắn (quảng cáo ví điện tử, phỏng vấn xin việc…), không dùng được. Việc chép OpenAI gpt-4o-transcribe do phiên chính chạy (người dùng cho phép dùng để kiểm giọng; bộ kiểm quyền chặn lệnh tôi gọi OpenAI). Bảng chép ở `/tmp/claude-1000/lcs-chep/` (thư mục tạm, có thể mất); bảng đối chiếu tệp → lời gốc ở `$S/chep-danh-sach/*.tsv`.

### Mã và kiểm
- `prototype/hoc/hoc.js`: điểm rẽ đọc to từng lựa chọn có `giong` (sáng nút đang đọc), quay về từ ngõ cụt thì hỏi lại rồi đọc lại; "Tới lượt bà/bạn quyết định" theo bài; vai `nguoi-goi-chau` (hình hạt đậu, nhãn mô phỏng). `hoc.css`: nút lựa chọn chữ lớn (cao 68px, chữ 20px), viền sáng khi đang đọc.
- Dữ liệu: `prototype/hoc/bai-01.json`, `bai-03.json` (sinh bằng `$S/sua-cot-truyen-13.py` từ bản sao lưu `$S/sao-luu/opus3-dau/`, đánh số lại tệp giọng theo thứ tự xuất hiện), `danh-sach.json` (tên thử thách, bìa Bài 3 là `comic3-5`), `tools/giong-bai-hoc.json` (giọng mới).
- `tools/kiem-bai-hoc.mjs`: điểm rẽ phải có đúng hai lựa chọn; bài ông bà thì Bé Nai phải đọc lựa chọn.
- **Kiểm tự động hai cỡ (`$S/kiem-12.log`, ảnh `$S/anh7`): đạt 1386, lỗi 0**, 218 lượt soát bố cục, 186 ảnh. Đã xem tờ ghép các màn truyện mới hai cỡ (`$S/to4/anh6-*-truyen-moi.png`) và màn luyện Bài 3 (`$S/to4/anh7-b3-luyen.png`): không tràn, không đè.
- **`khu-hoi.mjs` (đi thật sang `video-call.html` rồi về) với cảnh `minh-1`, `minh-3` mới: ĐẠT HẾT 6 lượt** (`$S/khu-hoi-5.log`). Đã sửa `khu-hoi.mjs` cho cảnh có bộ nút riêng từng lượt (bấm nút đầu tới khi nhân vật tự kết thúc). Lượt chạy trước đó (`khu-hoi-4.log`) có một tệp 404 `/screens/A11-truyen-tranh.html` từ trang gọi video (lượt sau không còn).

### Việc còn lại
1. Người dùng nghe mục F của `bai-hoc/nghe-thu/CAN-NGHE-BAI-HOC.md` (F4–F14: các câu máy nghe lệch giống nhau hai lần, câu ngắn, giọng người gọi giả làm cháu). Sai câu nào thì thu lại cả lượt của giọng đó trong bài đó, dùng `--it-loi-dan`.
2. Phiên chính chép lời Minh của hai thử thách mới vào kịch bản.
3. Dựng lại APK (đổi: `prototype/hoc/*`, giọng b01, b03, tranh `comic1-4`, `comic1-5`, `comic3-5…8`) và thử trên máy thật: điểm rẽ chữ lớn, đọc lựa chọn, ngõ cụt rồi quay về.
