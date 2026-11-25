# Câu thu sẵn cần người nghe (anh Minh, chú Tư)

Lập ngày 25/11/2026 cho bộ giọng hiện tại: anh Minh (giọng Achird, 37 câu) và chú Tư (giọng Algenib, 34 câu), mỗi giọng thu một lượt dài bằng `gemini-3.8-flash-tts` rồi cắt, lọc rẹt. **Chưa người nào nghe các câu này.** Bảng dưới đây lấy từ các lượt nghe bằng máy:

- **O**: OpenAI `gpt-4o-transcribe`, nghe từng câu.
- **G**: Gemini 3.5 Flash nghe từng câu. Chỉ có cho anh Minh; với chú Tư Gemini hết hạn mức trong ngày nên chưa nghe từng câu.
- **T**: Gemini 3.5 Flash nghe cả lượt thu, hai lần (một lần hỏi đích danh về lời dặn giọng), có mốc thời gian.

Không lượt nào nghe thấy lời dặn giọng bị đọc lẫn. Kết quả từng câu cũng ghi ở trường `kiem` của `prototype/loi-minh.json` và `prototype/loi-tu.json`.

Đường dẫn tính từ `prototype/`. Nghe trên máy tính: `mpv prototype/audio/tu/b9-mo-dau.m4a` (hoặc mở thẳng tệp). Trên điện thoại: chép thư mục `prototype/audio/minh` và `prototype/audio/tu` sang máy rồi mở bằng trình nghe nhạc. Ghi vào cột cuối: **đúng**, hoặc **sai** kèm chữ nghe được. Có câu sai thật thì thu lại **cả lượt** của giọng đó (một lượt Gemini TTS), không vá riêng một câu.

## 1. Câu mới thay hai câu dạy sai (nghe trước)

Ba câu này là lý do thu lại cả hai giọng: câu cũ mời người học đọc số, hoặc bảo rời nhóm trước khi báo cáo.

| # | Tệp | Lời mong đợi | Máy nghe | Cần nghe gì | Người nghe |
|---|---|---|---|---|---|
| 1 | `audio/minh/b3-hoi-soluu.m4a` (2,1 s) | Mà mẹ tìm số của con ở đâu vậy mẹ? | O, T (hai lần): đúng. G: "Mẹ ơi tìm **sổ** của con ở đâu vậy mẹ?" | Chữ "số" có rõ là "số" không (G nghe thành "sổ"). | |
| 2 | `audio/minh/b3-goi-soluu.m4a` (4,5 s) | Trong tin nhắn họ cũng để sẵn một số điện thoại. Mẹ tìm số của con ở chỗ nào cho chắc hả mẹ? | O, T: đúng. G: "**không** nhắn, họ cũng để sẵn …" | Hai chữ đầu "Trong tin" có rõ không. | |
| 3 | `audio/tu/b9-ket-du.m4a` (5,1 s) | May mà chú hỏi con. Để chú lưu tin nhắn, báo cáo rồi rời nhóm nha con. | O, T: đúng | Thứ tự "lưu tin nhắn, báo cáo rồi rời nhóm" nghe rõ. | |

## 2. Nghi đọc sai

| # | Tệp | Lời mong đợi | Máy nghe | Vì sao bị gắn cờ | Người nghe |
|---|---|---|---|---|---|
| 4 | `audio/tu/b9-mo-dau.m4a` (9,0 s, câu mở đầu cuộc gọi chú Tư) | A lô, Vy đó hả con? Mấy người trong nhóm rủ chú nạp thêm, nói lãi gấp đôi. Lần trước chú rút được thiệt mà. Chú có nên nạp không con? | O: "A lô, **Di** đó hả con?". T: "**Gì** đó hả con?", "**Duy** đó hả con?". Phần sau đúng. | Ba lượt nghe ra ba chữ khác nhau ở tên "Vy". Giọng Nam đọc "Vy" gần như "Di" là bình thường; cần tai người xem có nghe ra tên không, hay thành "Gì đó hả con?". | |
| 5 | `audio/tu/b9-nhan-moinhu.m4a` (3,4 s) | Trời đất, té ra mấy đồng lời đó là để nhử chú. | O: "Tội đức té ra … là để **giữ chúa**". T (hai lần): "… là để **dụ** chú". | Chữ "nhử" là ý chính của câu; không lượt nào nghe ra "nhử". | |
| 6 | `audio/tu/nghe-hai.m4a` (4,4 s, câu khi không nghe rõ người học) | Máy chú nghe câu được câu mất. Con nói chậm chậm, từng ý một nghen. | O: đúng (trừ "nha"). T: "Máy chú **nghẽn, nghe không được tiếng mất**", "Máy chú nghe **an** câu được câu mất". | Hai lượt Gemini nghe lệch phần giữa câu. | |

## 3. Tệp dưới 1 giây (máy không nghe tin được, bắt buộc tai người)

| # | Tệp | Lời mong đợi | Máy nghe | Ghi chú | Người nghe |
|---|---|---|---|---|---|
| 7 | `audio/tu/dem-vay.m4a` (1,0 s, lời khoảng 0,6 s) | Vậy hả con. | O: chép ra chữ Trung vô nghĩa. Cả hai lượt T **không thấy câu này** trong lượt thu. | Câu đọc rất nhanh. Lúc cắt lần đầu, câu này bị dính chữ "ờ" của câu trước; đã cắt tay lại (`ban-giao/tam-nv/cat-tay-tu.sh`). Khi còn dính "ờ" thì O nghe ra "Ờ, vậy hả con?". | |
| 8 | `audio/minh/dem-um.m4a` (0,9 s) | Ừm. | O: chữ Trung "嗯". G: "ừm". | Tiếng đệm lúc chờ AI. | |
| 9 | `audio/tu/dem-um.m4a` (0,9 s) | Ừm. | O: "Hmm". T: "Hm", "Hừm". | Tiếng đệm lúc chờ AI. | |
| 10 | `audio/minh/dem-o.m4a` (0,9 s) | Ờ ha. | O: "Ừ ha". G: "Ờ, ha". | Tiếng đệm. | |

## 4. Tệp 1 đến 1,5 giây (nghe sau)

| # | Tệp | Lời mong đợi | Máy nghe | Người nghe |
|---|---|---|---|---|
| 11 | `audio/tu/dem-cha.m4a` (1,2 s) | Chà. | O: "Já". T: "chà". Gemini 3.7 Flash nghe riêng tệp: "**Dạ**". | |
| 12 | `audio/tu/dem-cho.m4a` (1,2 s) | Con chờ chú chút nghen. | O: "Con chờ chút nga" (thiếu "chú"). T (hai lần): đúng. Câu đọc rất nhanh (5 tiếng trong khoảng 0,9 giây); cũng đã cắt tay lại như hàng 7. | |
| 13 | `audio/minh/dem-da.m4a` (1,3 s) | Dạ, dạ. | O: "Ja, ja". G, T: đúng. | |
| 14 | `audio/minh/dem-nghe.m4a` (1,1 s) | Dạ, con nghe nè. | O: "Ya con nghe nè". G, T: đúng. | |
| 15 | `audio/minh/dem-coi.m4a`, `dem-nghi.m4a`, `dem-cho.m4a` (1,3–1,5 s) | Dạ, để con coi. / Để con nghĩ chút nha. / Mẹ chờ con xíu nha. | Cả ba lượt đều đúng (G nghe "nghỉ" thay cho "nghĩ"). | |
| 16 | `audio/minh/b1-nhan-cup.m4a` (1,3 s), `b3-nhan-goithang.m4a` (1,2 s) | Dạ đúng rồi mẹ. / Dạ, phải rồi mẹ. | Cả ba lượt đều đúng. | |

## 5. Lệch nhẹ, có thể chỉ do giọng Nam (nghe nếu còn thời gian)

| # | Tệp | Lời mong đợi | Chỗ lệch | Người nghe |
|---|---|---|---|---|
| 17 | `audio/tu/b9-goi-dauhieu.m4a` | Ông thầy trong nhóm nói chắc ăn lắm, không bao giờ lỗ. Con nghe vậy thấy sao? | T (hai lần) đúng; O: "Ông thầy **trưởng** nhóm … **Còn** nghe vậy thấy **làm** sao?" | |
| 18 | `audio/tu/b9-hoi-baocao.m4a` | Mà trong nhóm còn nhiều người lắm con. … | O đúng; T (hai lần): "trong nhóm **có** nhiều người". | |
| 19 | `audio/minh/lo-so.m4a` | Ấy mẹ, mẹ đừng đọc số ra nha. … | O: "đừng đọc số **đó** nha"; T: đúng chữ "ra". | |
| 20 | `audio/minh/b1-sua.m4a`, `b3-sua.m4a` | Ấy mẹ ơi, … / Ấy mẹ, khoan đã mẹ. … | Mọi lượt nghe chữ "Ấy" thành "Ê", "Ới" hoặc "Ế". | |
| 21 | `audio/tu/dem-o.m4a`, `dem-sao.m4a` (1,7 s, 2,0 s) | Ờ, ờ. / Ờ, sao ta. | O: "Au, au", "À, sao ta?"; T: "Ờ, ừ", "Sao ta?". Chỉ là tiếng đệm. | |

Chữ cuối câu "nghen" của chú Tư thường bị O chép thành "nghe" hoặc "nha" (`nghe-mot`, `chao-cup`, `chao-bua`, `b9-ket-thieu`); hai lượt T đều nghe ra "nghen". Không cần nghe riêng.

## Nghe chung một lượt cho cả hai giọng

- Tiếng rẹt ở đầu và đuôi câu: đã lọc bằng `tools/loc-giong.py`, chưa người nghe.
- Tốc độ: anh Minh khoảng 4,6 tiếng mỗi giây (trung vị các câu từ 10 tiếng), chú Tư khoảng 3,9. Anh Minh có thể nhanh với người cao tuổi.
- Ranh giới cắt: các câu của anh Minh và mọi câu dài của chú Tư khớp lời khi máy nghe từng câu. Bốn câu đệm đầu lượt của chú Tư (`dem-o`, `dem-vay`, `dem-sao`, `dem-cho`) đã cắt tay lại vì công cụ cắt tự động đặt sai ranh giới; nghe xem đầu và cuối các tệp này có bị cụt chữ không.
