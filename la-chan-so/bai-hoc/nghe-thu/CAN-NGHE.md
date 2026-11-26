# Câu thu sẵn cần người nghe (anh Minh, chú Tư)

Cập nhật ngày 25/11/2026. **Chưa người nào nghe các câu này.** Bảng dưới đây lấy từ các lượt nghe bằng máy. Đường dẫn tính từ `prototype/`. Nghe trên máy tính: `mpv prototype/audio/minh/b1-mo-dau.m4a` (hoặc mở thẳng tệp). Trên điện thoại: chép thư mục `prototype/audio/minh` và `prototype/audio/tu` sang máy rồi mở bằng trình nghe nhạc. Ghi vào cột cuối: **đúng**, hoặc **sai** kèm chữ nghe được. Có câu sai thật thì thu lại **cả lượt** của giọng đó (một lượt Gemini TTS), không vá riêng một câu.

Kết quả từng câu cũng ghi ở trường `kiem` của `prototype/loi-minh.json` và `prototype/loi-tu.json`.

## A. Anh Minh (giọng Achird, 42 câu, thu lại ngày 25/11/2026 cho hai cảnh mới)

Hai cảnh: `minh-1` "Anh Minh hoảng hốt gọi" (câu `b1-…`, Minh vừa bị kẻ giả công an dọa) và `minh-3` "Anh Minh hỏi mẹ về bé Vy" (câu `b3-…`). Thu một lượt dài 179 giây bằng `gemini-3.8-flash-tts`, lời dặn chia ba phần cảm xúc (chung: ấm, hơi lo; `b3`: lo, thương mẹ, chậm; `b1`: hoảng, nói nhanh, hụt hơi, rồi bình tĩnh dần, cuối cùng nhẹ nhõm).

Máy đã nghe:
- **O**: OpenAI `gpt-4o-transcribe` nghe từng câu.
- **T**: `gpt-4o-transcribe` và `whisper-1` nghe cả lượt thu (whisper có mốc thời gian). Cả hai chép đúng thứ tự câu từ câu đầu "Dạ, dạ.", không có đoạn nào là lời dặn giọng.
- Gemini **chưa nghe** (hết hạn mức trong ngày).

### A1. Nghe trước: cảm xúc và câu nghi đọc sai

| # | Tệp | Lời | Máy nghe | Cần nghe gì | Người nghe |
|---|---|---|---|---|---|
| 1 | `audio/minh/b1-mo-dau.m4a` (8,7 s, câu mở đầu cảnh hoảng) | Mẹ ơi, mẹ ơi… công an mới gọi con. Họ nói tài khoản con dính vụ rửa tiền, phải chuyển hết vô tài khoản tạm giữ trong hôm nay. Con nên chuyển không mẹ? | O (hai lần, lần sau do phiên chính chạy) và gpt-4o nghe cả lượt: khớp; whisper: "Con, con nên chuyển". Lời soạn là "Con có nên chuyển", máy đọc bỏ chữ "có" nên phụ đề đã sửa theo tiếng. | Giọng hoảng có rõ, có quá lố không; câu cuối có bị nói vấp không. | |
| 2 | Cả nhóm câu hoảng: `b1-goi-cup`, `b1-im-mot`, `b1-dem-da`, `b1-dem-nghe`, `b1-dem-tho`, `b1-dem-nghi`, `b1-sua` | | Lời đúng. | Có nghe ra hoảng, hụt hơi không; người cao tuổi có theo kịp không. | |
| 3 | `audio/minh/b1-nhan-cup.m4a`, `b1-ket-du.m4a` | Dạ… dạ, con cúp máy, không chuyển đồng nào hết. Nghe mẹ nói con bớt run rồi. / Trời ơi, nghe mẹ nói con nhẹ cả người. … | O đúng; hai lượt T nghe "bớt **rung**", một lượt nghe "con **cấp** máy". | Có nghe ra bình tĩnh dần, rồi nhẹ nhõm không; chữ "run", "cúp". | |
| 4 | `audio/minh/b3-goi-goihoi.m4a` (5,1 s) | Lỡ Vy đang ngồi trong lớp, máy tắt. Ngoài Vy ra, mẹ còn hỏi được ai nữa hả mẹ? | O lần một: "**Lâu Bi** đang ngồi trong lớp … Ngoài **Bi** ra"; O lần hai: "**Láo** Vi đang ngồi trong lớp … Ngoài Vi ra"; T: "Lỡ Vi … ngoài Vi ra", "… **Mẹ gọi Vi ra**". Đầu tệp có 80 ms lặng rồi mới vào lời, câu trước kết thúc trước đó 0,6 giây: ranh giới cắt đúng. | Chữ đầu "Lỡ" và cụm "Ngoài Vy ra" ("Vi" với "Vy" là một). | |
| 5 | `audio/minh/chao-cup.m4a` (1,8 s, câu chào khi người học xin dừng) | Dạ, vậy con cúp máy nha mẹ. | O đúng cả hai lần; hai lượt nghe cả take nghe "con **cướp** máy". | Chữ "cúp" (máy nghe riêng tệp thì đúng, nghe trong cả lượt thì lệch). | |

### A2. Tệp dưới 1,5 giây (máy không nghe tin được, bắt buộc tai người)

| # | Tệp | Lời | Máy nghe | Ghi chú | Người nghe |
|---|---|---|---|---|---|
| 6 | `audio/minh/dem-o.m4a` (0,7 s) | Ờ ha. | O: "aha" | Dưới 1 giây. | |
| 7 | `audio/minh/dem-um.m4a` (1,0 s, lời khoảng 0,7 s) | Ừm. | O: chữ Trung "嗯"; hai lượt T bỏ qua. | Dưới 1 giây lời. | |
| 8 | `audio/minh/dem-nghi.m4a` (1,1 s) | Để con nghĩ chút nha. | O: "Để con nghỉ chút nha". | 5 tiếng trong khoảng 0,7 giây, rất nhanh. | |
| 9 | `audio/minh/dem-vay.m4a` (1,3 s) | À, vậy hả mẹ. | O: chữ Trung vô nghĩa; T: đúng. | | |
| 10 | `audio/minh/dem-coi.m4a`, `dem-nghe.m4a`, `dem-cho.m4a` (1,3–1,5 s) | Dạ, để con coi. / Dạ, con nghe nè. / Mẹ chờ con xíu nha. | O và T: đúng. | | |

### A3. Lệch nhẹ (nghe nếu còn thời gian)

| # | Tệp | Lời | Chỗ lệch | Người nghe |
|---|---|---|---|---|
| 11 | `audio/minh/b1-goi-hoilai.m4a` | Con muốn biết chắc họ có phải công an thiệt không. … | O: "Con **không** biết chắc"; hai lượt T đúng "muốn". | |
| 12 | `audio/minh/b1-dem-tho.m4a` | Khoan, để con thở một chút đã. | O và gpt-4o nghe "thở một chút", whisper nghe "thở chút"; phụ đề theo hai lượt đầu. | |
| 13 | `audio/minh/im-mot.m4a`, `b1-im-mot.m4a` | … mẹ còn nghe con không? | O nghe "mẹ **có** nghe"; T nghe đúng "còn". | |
| 14 | `audio/minh/lo-so.m4a`, `b3-sua.m4a` | Ấy mẹ, … | Mọi lượt nghe "Ấy" thành "Ê". | |
| 15 | `audio/minh/b3-hoi-goihoi.m4a` | Mà gọi Vy hoài không được, … | O bỏ mất chữ "Vy"; T nghe "Vi". | |

**Tốc độ:** câu dùng chung khoảng 4,9 tiếng mỗi giây (nhanh hơn lượt thu trước), câu của hai cảnh khoảng 4,1. Cần người nghe xem câu chung có nhanh quá với người cao tuổi không.

## B. Chú Tư (giọng Algenib, 34 câu)

Máy đã nghe: OpenAI `gpt-4o-transcribe` từng câu; Gemini 3.5 Flash nghe cả lượt thu hai lần (một lần hỏi đích danh về lời dặn giọng). Gemini chưa nghe từng câu của chú Tư (hết hạn mức). Không lượt nào nghe thấy lời dặn giọng bị đọc lẫn. Lời dặn giọng và giọng của chú Tư chưa đổi (người dùng đang quyết có giữ giọng ông lão hiện giờ không).

### B1. Nghe trước

| # | Tệp | Lời | Máy nghe | Vì sao bị gắn cờ | Người nghe |
|---|---|---|---|---|---|
| 16 | `audio/tu/b9-ket-du.m4a` (5,1 s) | May mà chú hỏi con. Để chú lưu tin nhắn, báo cáo rồi rời nhóm nha con. | O, T: đúng | Câu an toàn mới: thứ tự "lưu tin nhắn, báo cáo rồi rời nhóm". | |
| 17 | `audio/tu/b9-mo-dau.m4a` (9,0 s) | A lô, Vy đó hả con? … | O: "Di đó hả con"; T: "Gì đó hả con", "Duy đó hả con". | **Người dùng đã chấp nhận** chú Tư đọc "Vy" nghe như "Di" (giọng Nam). Không cần nghe lại. | đã chấp nhận |
| 18 | `audio/tu/b9-nhan-moinhu.m4a` (3,4 s) | Trời đất, té ra mấy đồng lời đó là để nhử chú. | O: "… để **giữ chúa**"; T (hai lần): "… để **dụ** chú". | Chữ "nhử" là ý chính; không lượt nào nghe ra "nhử". | |
| 19 | `audio/tu/nghe-hai.m4a` (4,4 s) | Máy chú nghe câu được câu mất. Con nói chậm chậm, từng ý một nghen. | O: đúng (trừ "nha"). T: "Máy chú **nghẽn, nghe không được tiếng mất**", "Máy chú nghe **an** câu được câu mất". | Hai lượt Gemini nghe lệch phần giữa câu. | |

### B2. Tệp dưới 1,5 giây

| # | Tệp | Lời | Máy nghe | Người nghe |
|---|---|---|---|---|
| 20 | `audio/tu/dem-vay.m4a` (1,0 s, lời khoảng 0,6 s) | Vậy hả con. | O: chữ Trung vô nghĩa; hai lượt T không thấy câu này. Đã cắt tay lại vì lần cắt đầu dính chữ "ờ" của câu trước. | |
| 21 | `audio/tu/dem-um.m4a` (0,9 s) | Ừm. | O: "Hmm"; T: "Hm", "Hừm". | |
| 22 | `audio/tu/dem-cha.m4a` (1,2 s) | Chà. | O: "Já"; T: "chà"; Gemini 3.7 Flash nghe riêng tệp: "Dạ". | |
| 23 | `audio/tu/dem-cho.m4a` (1,2 s) | Con chờ chú chút nghen. | O: "Con chờ chút nga" (thiếu "chú"); T: đúng. Đọc rất nhanh. | |

### B3. Lệch nhẹ (nghe nếu còn thời gian)

| # | Tệp | Lời | Chỗ lệch | Người nghe |
|---|---|---|---|---|
| 24 | `audio/tu/b9-goi-dauhieu.m4a` | Ông thầy trong nhóm nói chắc ăn lắm, … | T đúng; O: "Ông thầy **trưởng** nhóm … **Còn** nghe vậy thấy **làm** sao?" | |
| 25 | `audio/tu/b9-hoi-baocao.m4a` | Mà trong nhóm còn nhiều người lắm con. … | O đúng; T (hai lần): "trong nhóm **có** nhiều người". | |
| 26 | `audio/tu/dem-o.m4a`, `dem-sao.m4a` | Ờ, ờ. / Ờ, sao ta. | Chỉ là tiếng đệm; O: "Au, au", "À, sao ta?". | |

Chữ cuối câu "nghen" của chú Tư thường bị O chép thành "nghe" hoặc "nha"; hai lượt T đều nghe ra "nghen". Không cần nghe riêng.

## Nghe chung cho cả hai giọng

- Tiếng rẹt ở đầu và đuôi câu: đã lọc bằng `tools/loc-giong.py`, chưa người nghe.
- Ranh giới cắt: máy nghe từng câu khớp lời. Đã cắt tay lại hai câu của anh Minh (`b1-dem-nghi`, `b1-sua`: "để con nghĩ coi" từng bị dồn sang đầu `b1-sua`) và bốn câu đệm đầu lượt của chú Tư; nghe xem đầu và cuối các tệp này có bị cụt chữ không.
