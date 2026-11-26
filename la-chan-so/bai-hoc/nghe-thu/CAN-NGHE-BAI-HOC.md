# Câu trong bốn bài học cần người nghe

Lập chiều 25/11/2026. **Chưa ai nghe các câu này bằng tai.** Chỉ có máy nghe, và máy nghe đã tỏ ra không đáng tin ở câu ngắn và ở giọng miền Nam. Đường dẫn tính từ `prototype/`. Cả tờ khoảng năm phút nghe.

Cách nghe trên máy tính: `mpv prototype/hoc/giong/b02/bn-22.m4a` (hoặc mở thẳng tệp). Trên điện thoại: mở bài trong app, hoặc chép thư mục `prototype/hoc/giong/` sang máy rồi mở bằng trình nghe nhạc. Thư mục `b01`, `b02`, `b03`, `b09` là Bài 1, 2, 3, 4 người học thấy (`b09` là Bài 4).

Ghi vào cột cuối: **đúng**, hoặc **sai** kèm chữ nghe được. Nếu một câu sai thật thì phải **thu lại cả lượt của giọng đó trong bài đó** (một lần gọi Gemini TTS), không vá riêng một câu.

Máy nghe đã dùng:
- **G35** gemini-3.5-flash và **G38** gemini-3.8-flash với `tools/nghe-lai.py` (hỏi đích danh lời dặn bị đọc lẫn).
- **G3P** gemini-3-flash-preview với `tools/nghe-lai.py`: hay **bịa lại chính các câu ví dụ trong lời hỏi** ("hơi lo lắng nhưng thân thiện", "tốc độ vừa phải") rồi kết luận CÓ LỜI DẶN, kể cả với câu dài chưa tới 1 giây. Kết luận CÓ LỜI DẶN của G3P không đáng tin; phần chữ nó chép thì vẫn dùng để so.
- **T** gemini-3.5-transcribe với `ban-giao/tam-hoc/chep-tron.py` (chỉ chép nguyên văn, không nhắc lời dặn).
- "Cả lượt" là chép nguyên lượt thu trước khi cắt; "riêng" là chép từng câu sau khi cắt.

Giọng miền Nam đọc "v" gần như "d": máy hay chép "Vy" thành "Dì/gì", "việc" thành "diệt/duyệt", "ví" thành "dí". Đó là giọng đọc đúng; chỉ ghi sai khi tai người nghe thấy sai.

## A. Nghi đọc sai chữ hoặc đổi nghĩa (nghe trước)

| # | Tệp | Lời mong đợi | Máy nghe | Vì sao bị gắn cờ | Người nghe |
|---|---|---|---|---|---|
| 1 | `hoc/giong/b02/bn-22.m4a` (4,2 s, Bài 2, lời Bé Nai khi cuộc gọi không được ý nào) | Lần này chưa được ý nào. Không sao, **bạn** gọi lại cho chị Lan thử lần nữa nha. | Riêng: G35 hai lần "bà gọi lại", G3P "ba gọi lại", T "bà gọi lại". Cả lượt (G35, T): "bạn gọi lại". | Bốn lần nghe riêng ra "bà". Bài 2 cho học sinh, Bé Nai phải gọi "bạn". Nếu đúng là "bà" thì thu lại lượt Bé Nai Bài 2 (22 câu). | **Người dùng đã nghe: đạt** (25/11) |
| 2 | `hoc/giong/b02/bn-17.m4a` (3,4 s) | **Chưa khớp rồi.** Bạn đọc lại coi câu đó nhắc tới cái gì nha. | Riêng: "Cuộc họp rồi" (G35), "Kêu họp rồi" (G35), "Khó rồi" (G3P), "Kêu khớp rồi" (T). Cả lượt: đúng. | Bốn lần nghe riêng đều không ra "Chưa khớp". | **Người dùng đã nghe: đạt** (25/11) |
| 3 | `hoc/giong/b09/bn-15.m4a` (3,6 s, Bài 4) | **Chưa khớp rồi.** Bạn đọc lại coi câu đó nhắc tới cái gì nha. | T: "Chịu khớp rồi". Cả lượt (G38): đúng. | Cùng câu với hàng 2, cùng cách đọc. | |
| 4 | `hoc/giong/b01/bh-02.m4a` (2,9 s, bà Hoa) | Trời đất ơi, **tôi** có làm gì đâu! | T: "đâu có làm gì đâu". G3P: "tao có làm gì đâu". Cả lượt (G35): đúng. | Chữ "tôi" mỗi máy nghe một kiểu; "tao" thì sai vai. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 5 | `hoc/giong/b03/bn-27.m4a` (Bài 3) | **Số lạ** nhắn đòi tiền viện phí, còn dặn bà đừng gọi cho ai. | Riêng (T): "**Cô Lan** nhắn đòi tiền viện phí…". Cả lượt (T): đúng. | Đổi nghĩa nếu đúng như máy nghe riêng. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 6 | `hoc/giong/b03/bn-28.m4a` (Bài 3) | **Họ vừa đòi tiền**, vừa ngăn bà hỏi lại. Bà gọi người nhà theo số đã lưu trước ạ. | Riêng (T): "**Hà vừa nói Tiên** vừa ngăn bà hỏi lại…". Cả lượt (T): đúng. | Bốn chữ đầu lệch hẳn khi nghe riêng. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 7 | `hoc/giong/b09/ot-01.m4a` (3,8 s, chú Tư) và `hoc/giong/b09/ot-03.m4a` (2,7 s) | **Vy** coi nè con, người ta lời mỗi ngày mấy triệu luôn! · Chú tính nạp hết. **Con** thấy sao hả **Vy**? | Mọi máy (G35, G3P, T, cả lượt): "Gì/Dì/Kì/Chị coi nè con"; "…**cũng** thấy sao hả **dì/gì**?" | Có thể chỉ do giọng Nam. Nhưng tên người học phải nghe ra là "Vy" (cùng vấn đề với câu mở cuộc gọi chú Tư, hàng 1 của `CAN-NGHE.md`). "Con" thành "cũng" thì câu lạ. | **Người dùng đã chấp nhận** (25/11): giọng Nam đọc "Vy" nghe như "Di" |
| 8 | `hoc/giong/b09/ot-05.m4a` (3,5 s) | **Ờ ha.** May mà chú chưa đụng tới cuốn sổ. | "Ơ hả" (G35 yếu), "ừ hử" (lite), "ờ… hả…" (G3P), T: "Ờ ha, **mãi** mà…"; cả lượt T bỏ hẳn "Ờ ha". | Tiếng đệm đầu câu và chữ "May". | **Người dùng đã chấp nhận** (25/11), cùng đợt với hàng 7 |
| 9 | `hoc/giong/b02/vy-04.m4a` (2,4 s, Vy) | Trời ơi, hai triệu của mình. | T: "**Trả iPhone** 2 triệu của mình". G3P: đúng. | Hai chữ đầu. | |
| 10 | `hoc/giong/b01/bn-28.m4a` (4,4 s) | Thẻ này thì Được. Bà **ấy** chỉ rủ đi chợ, không xin gì hết ạ. | T: "Bà chỉ rủ đi chợ" (thiếu "ấy"). | Thiếu chữ "ấy" thì câu thành nói về người học. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 11 | `hoc/giong/b01/bn-07.m4a` (6,7 s) | Giờ con cho bà nghe thử một cuộc gọi giả nha. Người gọi là máy đóng vai **thôi ạ**. Nghe thấy lạ là bà bấm Dừng liền. | T: "máy đóng vai **thoại đạ**". | Hai chữ cuối câu giữa. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 12 | `hoc/giong/b09/bn-16.m4a` (12,3 s) | Mình làm mẫu trước nha. Giả sử **chú Tư** mới được rủ vô nhóm, chưa nạp đồng nào. Việc một… | T hai lần: "Giả sử **chưa từng** mới được rủ…". Cả lượt (G38): đúng. | Tên nhân vật. | |
| 13 | `hoc/giong/b03/bn-41.m4a` (Bài 3) | Cuộc gọi **chưa** xong bà ơi. Lúc nào tiện, bà bấm gọi lại nha. | Riêng (G3P): "Cuộc gọi **chú** xong". Cả lượt (T): đúng. | Nhẹ. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |

## B. Chỗ cắt vừa sửa tay (nghe đầu và đuôi câu: có cụt chữ, có dính chữ câu bên cạnh không)

| # | Tệp | Lời mong đợi | Đã làm | Người nghe |
|---|---|---|---|---|
| 14 | `hoc/giong/b02/bn-05.m4a` (2,9 s) | Bắt bài! Việc thật thì ai lại bắt mình nạp tiền **trước**. | Máy tự cắt để "Chuẩn luôn!" của câu sau dính vào đuôi câu này; đã dời ranh giới bằng `--moc`. Một máy yếu nghe thiếu chữ "trước". | |
| 15 | `hoc/giong/b02/bn-06.m4a` (4,6 s) | **Chuẩn luôn!** Hứa hoàn tiền kèm hoa hồng là để mình yên tâm mà nạp đó. | Như trên: "Chuẩn luôn!" nay ở đầu câu này. T nghe "Chồng lo hứa…", G3P đúng. | |
| 16 | `hoc/giong/b09/bn-13.m4a` … `bn-16.m4a` | (bốn câu liền nhau: "Họ biết con cháu…", "Chuẩn luôn!", "Chưa khớp rồi…", "Mình làm mẫu trước nha…") | Máy tự cắt lệch một câu ở cả ba ranh giới; đã dời bằng `--moc`, chép lại từng câu thì khớp. | |
| 17 | `hoc/giong/b09/bn-01.m4a` (phần b01 đã thay bằng lượt mới, xem mục F) | Trưa đó bà Hoa đang ngồi nghỉ thì điện thoại reo… · Dạo này chú Tư của Vy vui lắm… | Lượt thu đọc lẫn **cả lời dặn giọng** ở đầu (b01: 129,6 giây đầu; b09: 67 giây đầu), đã bỏ phần đó. Nghe giây đầu tiên: không còn đuôi lời dặn ("…không thêm lời nào"). | |

## C. Clip ngắn, máy nghe không kiểm được

| # | Tệp | Lời mong đợi | Máy nghe | Người nghe |
|---|---|---|---|---|
| 18 | `hoc/giong/b02/bn-16.m4a` (0,87 s) | Chuẩn luôn! | T: "Chuẩn luôn." G35: "chuẩn dùng/đúng". G3P: lặp hai lần + lời dặn (bịa, clip chưa tới 1 giây). | |
| 19 | `hoc/giong/b09/bn-14.m4a` (0,95 s) | Chuẩn luôn! | T: "Chuẩn luôn." | |
| 20 | `hoc/giong/b01/bn-35.m4a` (1,24 s) | Dạ đúng rồi ạ! | T: đúng. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 21 | `hoc/giong/b03/bn-31.m4a` (1,41 s) | Dạ đúng rồi ạ! | T: đúng. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |
| 22 | `hoc/giong/b01/bn-08.m4a` (1,35 s) | Con làm mẫu trước nha bà. | T: đúng. Đọc rất nhanh, nghe có đủ chữ không. | Bỏ: Bài 1 và Bài 3 đã thu lại cả lượt với cốt truyện mới (Phiên Opus 3), tệp này nay là câu khác; xem mục F |

## D. Giọng chưa ai duyệt (nghe một hai câu mỗi giọng là đủ)

| # | Giọng | Tệp để nghe | Hỏi | Người nghe |
|---|---|---|---|---|
| 23 | Bà Hoa (Gemini Gacrux) | `hoc/giong/b01/bh-01.m4a`, `hoc/giong/b03/bh-02.m4a` (lượt thu mới của Phiên Opus 3) | Có ra giọng bà cụ miền Nam 65 tuổi không | |
| 24 | Người gọi nam (Alnilam, kẻ gian Bài 1) | `hoc/giong/b01/gn-01.m4a`, `gn-03.m4a` | Lễ phép, vội, không quát; khác hẳn giọng anh Minh | |
| 25 | Người gọi nữ (Despina, kẻ gian Bài 2) | `hoc/giong/b02/gu-01.m4a`, `gu-03.m4a` | Ngọt, nhanh nhảu; "Mấy đơn đầu **chị** chuyển…", "**Nạp** hai triệu…" (T nghe "chỉ", "Lạp") | |
| 26 | Vy (Zephyr) | `hoc/giong/b02/vy-02.m4a`, `hoc/giong/b09/vy-01.m4a` | "Tiền **về** thiệt nè!" (máy nghe "dễ"); "để mình tin **đó** chú" | |
| 27 | Bé Nai giữa bốn bài | `hoc/giong/b01/bn-01.m4a`, `b02/bn-01.m4a`, `b03/bn-01.m4a`, `b09/bn-01.m4a` | Mỗi bài là một lượt 3.8 riêng: chất giọng giữa các bài có lệch nhau nhiều không; so thêm với giọng Bé Nai ở phần khác của app (`audio/benai-*`) | |

## E. Đã nghi rồi gỡ (không cần nghe, trừ khi muốn chắc)

- `hoc/giong/b01/bh-03.m4a` "Trời ơi, hết hồn. Suýt nữa thì mất hết.": G35 hai lần nghe "hốt hoảng" kèm CÓ LỜI DẶN (đoạn trước đó có lời dặn cảm xúc "hoảng hốt"), nhưng T, G38, gemini-3.7-flash, G3P và chép cả lượt đều ra "hết hồn".
- `hoc/giong/b03/bh-01.m4a` "Trời đất, tin gì ghê vậy nè?": máy yếu (lite) nghe sai, T và G3P chép đúng; lượt cắt cũ bị dính đầu câu sau, đã cắt lại.
- `hoc/giong/b09/vy-01.m4a` "…để mình tin đó chú": một máy yếu nghe "nó", T và G3P nghe "đó".

## F. Phiên Opus 3: cốt truyện mới Bài 1 và Bài 3 (thu lại cả lượt, 25/11 chiều)

Bé Nai Bài 1 (52 câu) và Bài 3 (48 câu), bà Hoa Bài 1 (4) và Bài 3 (4), Minh trong truyện Bài 3 (1), người gọi giả làm cháu (Bài 3, 2) đều là lượt thu mới bằng gemini-3.8-flash-tts. Hai lượt Bé Nai đầu tiên đọc lẫn lời dặn rồi bịa lời khác, đã bỏ và thu lại bằng lời dặn rút gọn. Kiểm bằng OpenAI gpt-4o-transcribe (phiên chính chạy): chép cả lượt khớp số tiếng (Bé Nai 796/796 và 762/762, không còn lời dặn); chép từng câu sau khi cắt lại: không còn câu nào dính câu kế hay thiếu đuôi. Máy nghe hay lệch giọng miền Nam ("giục" ra "dụ", "ạ" ra "à", "Vy" ra "Vi/Di"); "Vy" nghe như "Di" người dùng đã chấp nhận.

| # | Tệp | Lời mong đợi | Máy nghe (hai lượt OpenAI cùng lệch một kiểu) | Người nghe |
|---|---|---|---|---|
| F1 | `hoc/giong/b01/bh-04.m4a` (3,7 s, bà Hoa, an toàn) | Trời ơi, hết hồn. Suýt nữa thì mất hết. | thiếu "Trời ơi" | **Người dùng đã nghe: đạt** (25/11) |
| F2 | `hoc/giong/b03/bh-03.m4a` (4,2 s, bà Hoa, ngõ cụt) | Trời ơi, tiền đi mất rồi, mà con Vy có sao đâu. | "mà con Vy" ra "mạng gì" | **Người dùng đã nghe: đạt** (25/11) |
| F3 | `hoc/giong/b03/bh-04.m4a` (2,8 s, bà Hoa, an toàn) | Vậy là con Vy không sao. Mẹ mừng quá. | "Vậy là con Vy" ra "Vậy là gì" | **Người dùng đã nghe: đạt** (25/11) |
| F4 | `hoc/giong/b03/bn-01.m4a` (4,7 s) | Con kể bà nghe chuyện bà Hoa nha. **Tới đoạn gay cấn, bà chọn giúp** bà Hoa nha. | "Thất rảnh thì cớn bà chồng giúp…" | |
| F5 | `hoc/giong/b03/bn-05.m4a` (6,0 s, câu hỏi ở điểm rẽ) | Bà Hoa sốt ruột quá, **chỉ muốn chuyển tiền liền** cho xong. Nếu là bà Hoa, bà làm gì ạ? | "chỉ mong chuẩn bị liền" | |
| F6 | `hoc/giong/b03/bn-06.m4a` (1,3 s, lựa chọn ở điểm rẽ) | Chuyển tiền liền cho kịp | "Khiển định liền cho kịp" | |
| F7 | `hoc/giong/b03/bn-34.m4a` (5,2 s) | **Họ vừa đòi tiền**, vừa ngăn bà hỏi lại. Bà gọi người nhà theo số đã lưu trước ạ. | "Hầu vừa nói tin, vụng ngăn…" | |
| F8 | `hoc/giong/b03/bn-38.m4a` (2,4 s) | **Chưa đúng rồi** bà ơi. Bà nghe con nói nè. | "Thưa má, bà ơi" | |
| F9 | `hoc/giong/b03/bn-44.m4a` (5,2 s, mở đầu thử thách) | **Tới thử thách rồi** bà ơi. Anh Minh gọi hỏi bà chuyện bé Vy. Bà cứ trả lời như ở nhà nha. | "Tối thứ sáu bà ở nhà" | |
| F10 | `hoc/giong/b01/bn-14.m4a` (1,4 s) | Con làm mẫu trước nha bà. | "Con lầm lỗ trước nhà bà" | |
| F11 | `hoc/giong/b01/bn-16.m4a` (3,7 s) | **Giờ tới lượt** bà nha. Cuộc gọi này khác một chút đó ạ. | "Nhớ tới luật bà nha" | |
| F12 | `hoc/giong/b03/bn-37.m4a` (1,3 s) và `hoc/giong/b01/bn-41.m4a` (1,1 s) | Dạ đúng rồi ạ! | b03: máy nghe không ra (tiếng nói 0,93 s nằm gọn giữa hai quãng lặng, không cắt hỏng) | |
| F13 | Lựa chọn ở điểm rẽ: `hoc/giong/b01/bn-07.m4a` (1,3 s), `bn-08.m4a` (1,7 s), `hoc/giong/b03/bn-07.m4a` (1,3 s) | Chuyển tiền cho xong · Cúp máy, gọi cho con · Gọi anh Minh hỏi trước | câu ngắn, đọc to để bà nghe lựa chọn | |
| F14 | Giọng mới: người gọi giả làm cháu (Gemini Achernar), `hoc/giong/b03/gc-01.m4a` (6,2 s), `gc-02.m4a` (4,7 s) | Bà ngoại ơi, con Vy nè! Con bị xe tông, đang nằm bệnh viện. Con mượn máy bạn gọi bà. · Bà chuyển giùm con năm triệu tiền viện phí liền nha. Bà đừng nói với ai, con sợ mẹ la. | chữ khớp (trừ "Vy"); giọng chọn thẳng, chưa thử mẫu: có ra giọng con gái trẻ mếu máo, khác hẳn giọng Vy thật (`b02/vy-*`) không | |
