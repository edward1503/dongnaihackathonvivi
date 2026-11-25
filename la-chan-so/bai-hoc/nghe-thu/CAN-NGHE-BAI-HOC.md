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
| 1 | `hoc/giong/b02/bn-22.m4a` (4,2 s, Bài 2, lời Bé Nai khi cuộc gọi không được ý nào) | Lần này chưa được ý nào. Không sao, **bạn** gọi lại cho chị Lan thử lần nữa nha. | Riêng: G35 hai lần "bà gọi lại", G3P "ba gọi lại", T "bà gọi lại". Cả lượt (G35, T): "bạn gọi lại". | Bốn lần nghe riêng ra "bà". Bài 2 cho học sinh, Bé Nai phải gọi "bạn". Nếu đúng là "bà" thì thu lại lượt Bé Nai Bài 2 (22 câu). | |
| 2 | `hoc/giong/b02/bn-17.m4a` (3,4 s) | **Chưa khớp rồi.** Bạn đọc lại coi câu đó nhắc tới cái gì nha. | Riêng: "Cuộc họp rồi" (G35), "Kêu họp rồi" (G35), "Khó rồi" (G3P), "Kêu khớp rồi" (T). Cả lượt: đúng. | Bốn lần nghe riêng đều không ra "Chưa khớp". | |
| 3 | `hoc/giong/b09/bn-15.m4a` (3,6 s, Bài 4) | **Chưa khớp rồi.** Bạn đọc lại coi câu đó nhắc tới cái gì nha. | T: "Chịu khớp rồi". Cả lượt (G38): đúng. | Cùng câu với hàng 2, cùng cách đọc. | |
| 4 | `hoc/giong/b01/bh-02.m4a` (2,9 s, bà Hoa) | Trời đất ơi, **tôi** có làm gì đâu! | T: "đâu có làm gì đâu". G3P: "tao có làm gì đâu". Cả lượt (G35): đúng. | Chữ "tôi" mỗi máy nghe một kiểu; "tao" thì sai vai. | |
| 5 | `hoc/giong/b03/bn-27.m4a` (Bài 3) | **Số lạ** nhắn đòi tiền viện phí, còn dặn bà đừng gọi cho ai. | Riêng (T): "**Cô Lan** nhắn đòi tiền viện phí…". Cả lượt (T): đúng. | Đổi nghĩa nếu đúng như máy nghe riêng. | |
| 6 | `hoc/giong/b03/bn-28.m4a` (Bài 3) | **Họ vừa đòi tiền**, vừa ngăn bà hỏi lại. Bà gọi người nhà theo số đã lưu trước ạ. | Riêng (T): "**Hà vừa nói Tiên** vừa ngăn bà hỏi lại…". Cả lượt (T): đúng. | Bốn chữ đầu lệch hẳn khi nghe riêng. | |
| 7 | `hoc/giong/b09/ot-01.m4a` (3,8 s, chú Tư) và `hoc/giong/b09/ot-03.m4a` (2,7 s) | **Vy** coi nè con, người ta lời mỗi ngày mấy triệu luôn! · Chú tính nạp hết. **Con** thấy sao hả **Vy**? | Mọi máy (G35, G3P, T, cả lượt): "Gì/Dì/Kì/Chị coi nè con"; "…**cũng** thấy sao hả **dì/gì**?" | Có thể chỉ do giọng Nam. Nhưng tên người học phải nghe ra là "Vy" (cùng vấn đề với câu mở cuộc gọi chú Tư, hàng 1 của `CAN-NGHE.md`). "Con" thành "cũng" thì câu lạ. | |
| 8 | `hoc/giong/b09/ot-05.m4a` (3,5 s) | **Ờ ha.** May mà chú chưa đụng tới cuốn sổ. | "Ơ hả" (G35 yếu), "ừ hử" (lite), "ờ… hả…" (G3P), T: "Ờ ha, **mãi** mà…"; cả lượt T bỏ hẳn "Ờ ha". | Tiếng đệm đầu câu và chữ "May". | |
| 9 | `hoc/giong/b02/vy-04.m4a` (2,4 s, Vy) | Trời ơi, hai triệu của mình. | T: "**Trả iPhone** 2 triệu của mình". G3P: đúng. | Hai chữ đầu. | |
| 10 | `hoc/giong/b01/bn-28.m4a` (4,4 s) | Thẻ này thì Được. Bà **ấy** chỉ rủ đi chợ, không xin gì hết ạ. | T: "Bà chỉ rủ đi chợ" (thiếu "ấy"). | Thiếu chữ "ấy" thì câu thành nói về người học. | |
| 11 | `hoc/giong/b01/bn-07.m4a` (6,7 s) | Giờ con cho bà nghe thử một cuộc gọi giả nha. Người gọi là máy đóng vai **thôi ạ**. Nghe thấy lạ là bà bấm Dừng liền. | T: "máy đóng vai **thoại đạ**". | Hai chữ cuối câu giữa. | |
| 12 | `hoc/giong/b09/bn-16.m4a` (12,3 s) | Mình làm mẫu trước nha. Giả sử **chú Tư** mới được rủ vô nhóm, chưa nạp đồng nào. Việc một… | T hai lần: "Giả sử **chưa từng** mới được rủ…". Cả lượt (G38): đúng. | Tên nhân vật. | |
| 13 | `hoc/giong/b03/bn-41.m4a` (Bài 3) | Cuộc gọi **chưa** xong bà ơi. Lúc nào tiện, bà bấm gọi lại nha. | Riêng (G3P): "Cuộc gọi **chú** xong". Cả lượt (T): đúng. | Nhẹ. | |

## B. Chỗ cắt vừa sửa tay (nghe đầu và đuôi câu: có cụt chữ, có dính chữ câu bên cạnh không)

| # | Tệp | Lời mong đợi | Đã làm | Người nghe |
|---|---|---|---|---|
| 14 | `hoc/giong/b02/bn-05.m4a` (2,9 s) | Bắt bài! Việc thật thì ai lại bắt mình nạp tiền **trước**. | Máy tự cắt để "Chuẩn luôn!" của câu sau dính vào đuôi câu này; đã dời ranh giới bằng `--moc`. Một máy yếu nghe thiếu chữ "trước". | |
| 15 | `hoc/giong/b02/bn-06.m4a` (4,6 s) | **Chuẩn luôn!** Hứa hoàn tiền kèm hoa hồng là để mình yên tâm mà nạp đó. | Như trên: "Chuẩn luôn!" nay ở đầu câu này. T nghe "Chồng lo hứa…", G3P đúng. | |
| 16 | `hoc/giong/b09/bn-13.m4a` … `bn-16.m4a` | (bốn câu liền nhau: "Họ biết con cháu…", "Chuẩn luôn!", "Chưa khớp rồi…", "Mình làm mẫu trước nha…") | Máy tự cắt lệch một câu ở cả ba ranh giới; đã dời bằng `--moc`, chép lại từng câu thì khớp. | |
| 17 | `hoc/giong/b01/bn-01.m4a` và `hoc/giong/b09/bn-01.m4a` | Trưa đó bà Hoa đang ngồi nghỉ thì điện thoại reo… · Dạo này chú Tư của Vy vui lắm… | Lượt thu đọc lẫn **cả lời dặn giọng** ở đầu (b01: 129,6 giây đầu; b09: 67 giây đầu), đã bỏ phần đó. Nghe giây đầu tiên: không còn đuôi lời dặn ("…không thêm lời nào"). | |

## C. Clip ngắn, máy nghe không kiểm được

| # | Tệp | Lời mong đợi | Máy nghe | Người nghe |
|---|---|---|---|---|
| 18 | `hoc/giong/b02/bn-16.m4a` (0,87 s) | Chuẩn luôn! | T: "Chuẩn luôn." G35: "chuẩn dùng/đúng". G3P: lặp hai lần + lời dặn (bịa, clip chưa tới 1 giây). | |
| 19 | `hoc/giong/b09/bn-14.m4a` (0,95 s) | Chuẩn luôn! | T: "Chuẩn luôn." | |
| 20 | `hoc/giong/b01/bn-35.m4a` (1,24 s) | Dạ đúng rồi ạ! | T: đúng. | |
| 21 | `hoc/giong/b03/bn-31.m4a` (1,41 s) | Dạ đúng rồi ạ! | T: đúng. | |
| 22 | `hoc/giong/b01/bn-08.m4a` (1,35 s) | Con làm mẫu trước nha bà. | T: đúng. Đọc rất nhanh, nghe có đủ chữ không. | |

## D. Giọng chưa ai duyệt (nghe một hai câu mỗi giọng là đủ)

| # | Giọng | Tệp để nghe | Hỏi | Người nghe |
|---|---|---|---|---|
| 23 | Bà Hoa (Gemini Gacrux) | `hoc/giong/b01/bh-01.m4a`, `hoc/giong/b03/bh-02.m4a` | Có ra giọng bà cụ miền Nam 65 tuổi không | |
| 24 | Người gọi nam (Alnilam, kẻ gian Bài 1) | `hoc/giong/b01/gn-01.m4a`, `gn-03.m4a` | Lễ phép, vội, không quát; khác hẳn giọng anh Minh | |
| 25 | Người gọi nữ (Despina, kẻ gian Bài 2) | `hoc/giong/b02/gu-01.m4a`, `gu-03.m4a` | Ngọt, nhanh nhảu; "Mấy đơn đầu **chị** chuyển…", "**Nạp** hai triệu…" (T nghe "chỉ", "Lạp") | |
| 26 | Vy (Zephyr) | `hoc/giong/b02/vy-02.m4a`, `hoc/giong/b09/vy-01.m4a` | "Tiền **về** thiệt nè!" (máy nghe "dễ"); "để mình tin **đó** chú" | |
| 27 | Bé Nai giữa bốn bài | `hoc/giong/b01/bn-01.m4a`, `b02/bn-01.m4a`, `b03/bn-01.m4a`, `b09/bn-01.m4a` | Mỗi bài là một lượt 3.8 riêng: chất giọng giữa các bài có lệch nhau nhiều không; so thêm với giọng Bé Nai ở phần khác của app (`audio/benai-*`) | |

## E. Đã nghi rồi gỡ (không cần nghe, trừ khi muốn chắc)

- `hoc/giong/b01/bh-03.m4a` "Trời ơi, hết hồn. Suýt nữa thì mất hết.": G35 hai lần nghe "hốt hoảng" kèm CÓ LỜI DẶN (đoạn trước đó có lời dặn cảm xúc "hoảng hốt"), nhưng T, G38, gemini-3.7-flash, G3P và chép cả lượt đều ra "hết hồn".
- `hoc/giong/b03/bh-01.m4a` "Trời đất, tin gì ghê vậy nè?": máy yếu (lite) nghe sai, T và G3P chép đúng; lượt cắt cũ bị dính đầu câu sau, đã cắt lại.
- `hoc/giong/b09/vy-01.m4a` "…để mình tin đó chú": một máy yếu nghe "nó", T và G3P nghe "đó".
