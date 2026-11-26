# Kịch bản trailer "Lá chắn số", bản 2

Viết lại từ đầu. Chỉ giới thiệu sản phẩm, một người dẫn, giọng trò chuyện. Không kể tình huống mở đầu, không tục ngữ, không ẩn dụ.

Ký hiệu đường dẫn: `T` = `/home/rin/dongnaihackathonvivi/la-chan-so/video/trailer`; `S` = `/tmp/claude-1000/-home-rin/8a757c30-917e-41c0-9736-02ecd2c83863/scratchpad`.

## 1. Mạch và thời lượng

**Mạch:** một câu hỏi mở → chuông đổ (thẻ đỏ) → sau cuộc gọi (Bé Nai hỏi, báo người thân) → trước khi chuyển tiền (DỪNG LẠI, kiểm tra tin nhắn) → học như chơi → thi đua → "thẻ đỏ lúc nãy từ đâu ra?" (cộng đồng có kiểm duyệt) → trao lời cho đội.

Mỗi nhịp nối sang nhịp sau bằng một câu hỏi ngắn của người dẫn ("Nhà có ông bà?", "Lỡ bà vẫn mở app ngân hàng?", "Còn bạn…", "À, thẻ đỏ lúc nãy từ đâu ra?"), nên tám tính năng đi thành một mạch chứ không phải một danh sách.

**Tổng thời lượng ước: khoảng 112 giây.** Lời dẫn 1 265 ký tự (khoảng 97 giây ở 13 ký tự mỗi giây), cộng 3 giây mở, 2,5 giây tiếng Bé Nai, hai chỗ nhạc thở 2 giây, 4 giây khung kết. Mốc giây dưới đây là ước theo số ký tự, phải chỉnh lại theo tệp giọng thật.

Nếu giọng thật đọc chậm hơn và vượt 115 giây, cắt theo thứ tự: câu "Số điện thoại cũng kiểm được." (N6), câu "Rồi năm câu kiểm tra." (N7), câu "Ai mà ngồi yên được." (N8).

## 2. Bảng từng nhịp

Kiểu hình chung: nền sáng (trắng ngả xanh của bộ nhận diện), mỗi tính năng là một hoặc hai thẻ giao diện thật bo góc, có bóng đổ mềm, nghiêng nhẹ theo phối cảnh, bay vào rồi thẳng dần. Chữ trên hình đậm, sạch, 2–5 chữ, đặt đối diện thẻ. Mọi số điện thoại trên thẻ đều che. Nhãn nhỏ "Dữ liệu minh họa" ở góc dưới suốt các nhịp N2–N9.

| Nhịp | Mốc (ước) | Lời dẫn (bản hiển thị) | Bản gửi TTS (nếu khác) | Chữ trên hình | Hình | Tiếng, hiệu ứng |
|---|---|---|---|---|---|---|
| N0 Mở | 0,0–3,0 | (không lời) | | **Lá chắn số** | Logo (`/home/rin/dongnaihackathonvivi/la-chan-so/tools/logo/logo-c.png`) nổi lên giữa nền sáng, tên sản phẩm hiện bên dưới, rồi cả cụm thu nhỏ lên góc trên trái và ở đó đến hết phim. | Nhạc vào ngay từ giây 0. |
| N1 Câu hỏi | 3,0–8,0 | Số lạ gọi tới. Nghe, hay không nghe? Để Lá chắn số xem giúp bạn. | | **Nghe, hay không nghe?** | Một thẻ điện thoại bay vào từ phải, nghiêng khoảng 12 độ: màn cuộc gọi đến của Xiaomi (nửa trái `S/khop-android/A03a.png` nếu là màn gọi đến; nếu không, khung đầu của `T/quay/a1-the-do-raw.mp4`). Số che. | Chuông điện thoại nhỏ, 2 hồi, lẫn dưới nhạc. |
| N2 Thẻ đỏ | 8,0–17,0 | Chuông vừa đổ, thẻ đỏ đã hiện: số này bị mười bốn máy báo lừa đảo. Bấm một cái là chặn. Số lạ chưa ai báo? App im lặng. | …Áp im lặng. | **Biết ngay khi chuông đổ** | Phát `T/quay/a1-the-do-raw.mp4` trong thẻ điện thoại, thẻ thẳng dần. Đúng chữ "thẻ đỏ đã hiện": tách mảnh thẻ đỏ "Nghi lừa đảo · đã bị báo cáo từ 14 máy" (cắt từ nửa phải `A03a.png`) bay nổi ra phía trước, phóng 1,6 lần. Đến "Bấm một cái là chặn": nút "Chặn số này" nháy sáng (nửa phải `A03b.png`). Đến "App im lặng": thẻ đỏ lùi, mờ đi, còn màn gọi đến trơn. | Tiếng "tách" nhẹ khi thẻ đỏ bật ra. Chuông tắt hẳn ở "im lặng". |
| N3a Bé Nai hỏi | 17,5–22,0 | Nhà có ông bà? Cúp máy xong, Bé Nai hỏi luôn bằng giọng nói. | | **Bé Nai hỏi bằng giọng nói** | Thẻ cũ trượt sang trái và mờ; thẻ `S/khop-android/A04a.png` (nửa phải, app thật) bay vào giữa. Vòng sóng âm tỏa quanh hình Bé Nai. | |
| N3 Tiếng app | 22,0–24,5 | (Bé Nai, tiếng thật trong app:) "Người vừa gọi có bảo bà chuyển tiền không ạ?" | Không gửi TTS, dùng `T/am/app/be-nai-hoi.wav` | Phụ đề đúng câu của Bé Nai | Giữ thẻ `A04a.png`, phóng vào bong bóng câu hỏi. | Nhạc hạ 6 dB trong 2,5 giây này. |
| N3b Một chữ "Có" | 24,5–30,7 | Bà chỉ cần đáp "Có". Một chữ là xong. App ghi nhận nguy hiểm, và tự báo cho con. | …Áp ghi nhận nguy hiểm, và tự báo cho con. | **Một chữ "Có" là xong** | Lật sang `S/khop-android/A04b-khi-bam-Co.png`. Tách hai mảnh nổi: nhãn kết quả "Nguy hiểm" và dòng "Đã báo cho Minh", lần lượt bật ra theo lời. | Tiếng "ting" khi "Đã báo cho Minh" hiện. |
| N4 Người thân | 30,7–36,9 | Bên kia, máy của Minh hiện ngay: "Mẹ vừa gặp cuộc gọi đáng ngờ." Minh gọi về liền. | | **Người thân biết ngay** | Thẻ của bà lùi sang trái, nhỏ lại; một đường chấm chạy từ dòng "Đã báo cho Minh" sang thẻ thứ hai bên phải: `S/khop-react/khac-2-khan-cap-nguoi-than.png`. Phóng dòng "Mẹ vừa gặp cuộc gọi đáng ngờ", rồi nút gọi lại nháy. Nếu cần thêm một khung: `S/khop-react/A08-hoi-nguoi-than.png` hoặc `khac-3-gia-dinh.png` lướt qua phía sau. | Tiếng rung thông báo ngắn. |
| N5 DỪNG LẠI | 36,9–44,1 | Lỡ bà vẫn mở app ngân hàng? Cả màn hình hiện lên: Dừng lại. Đừng chuyển tiền. Gọi Minh hỏi đã. | Lỡ bà vẫn mở áp ngân hàng? … | **Dừng lại** | Phát `T/quay/a5-dung-lai.mp4` từ giây 0 trong thẻ điện thoại đặt giữa; màn DỪNG LẠI hiện ở giây 1,5 của đoạn, canh trùng chữ "Dừng lại" trong lời. Thẻ phóng dần 1,0 → 1,15. | Một nhịp trầm của nhạc hoặc tiếng "bụp" mềm khi màn đỏ hiện. |
| Thở 1 | 44,1–46,1 | (không lời) | | **Đừng chuyển tiền** (chữ trên chính màn hình app, không thêm chữ ngoài) | Giữ màn DỪNG LẠI, dòng "Hãy gọi Minh để kiểm tra" được khoanh sáng. | Nhạc lên lại mức đầy, trọn một ô nhịp. |
| N6 Kiểm tra | 46,1–58,4 | Còn bạn, gặp tin nhắn ngờ ngợ thì dán vào đây. AI tô đỏ từng dấu hiệu: việc nhẹ lương cao, nạp trước hai trăm nghìn, đường dẫn lạ. Số điện thoại cũng kiểm được. | …Ây ai tô đỏ từng dấu hiệu… | **Kiểm tra trước khi chuyển** | Thẻ `S/khop-android/A05b.png` bay vào (ô dán tin nhắn). Chuyển sang `S/khop-react/A05b-phan-tich-tin-nhan.png`: ba mảnh chữ tô đỏ ("việc nhẹ lương cao", "nạp trước 200k", "bit.ly/…") lần lượt bật nổi khỏi thẻ đúng lúc lời đọc tới. Cuối nhịp, `S/khop-react/A07-ket-qua.png` trượt vào cạnh phải, bốn mức kết quả hiện thành một dải. | Ba tiếng "tách" nhỏ theo ba dấu hiệu. |
| N7 Học như chơi | 58,4–72,6 | Muốn tự nhận ra kẻ gian? Vào học, mà học như chơi. Truyện tranh một phút, tới ngã rẽ thì bạn tự chọn. Gọi video nhập vai với nhân vật AI, miệng nhép theo từng lời. Rồi năm câu kiểm tra. | …với nhân vật ây ai… | **Học như chơi** | Ba thẻ nối nhau, xếp bậc thang: (1) `S/khop-react/A11a-thu-vien.png` lướt qua 1 giây làm nền; (2) `T/quay/w5-truyen.mp4`, lấy đoạn quanh giây 40–44 để có ngã rẽ và nhãn "Chọn đúng" ở giây 41,6, canh trùng chữ "bạn tự chọn"; (3) `/tmp/claude-1000/lcs-ph/anh/quay-minh11/minh.mp4`, lấy 4 giây có khẩu hình rõ, thẻ này to nhất; (4) `S/khop-react/A12-bai-kiem-tra.png` bay vào góc phải ở câu cuối. | Tiếng Bé Nai trong truyện rất nhỏ (−18 dB) dưới lời dẫn. Đoạn gọi video tắt tiếng, chỉ để thấy khẩu hình. |
| Thở 2 | 72,6–74,6 | (không lời) | | (không chữ) | Thẻ gọi video giữ nguyên, nhân vật nói thêm một nhịp; thẻ bảng xếp hạng bắt đầu bay vào từ dưới. | Nhạc đầy một ô nhịp. |
| N8 Thi đua | 74,6–86,1 | Điểm của từng bạn cộng lại cho lớp, cho trường, cho phường. Kìa, 11A1 Ngô Quyền vừa lên hạng nhất. Thêm một trăm điểm nữa là vượt. Ai mà ngồi yên được. | …Kìa, mười một A một Ngô Quyền vừa lên hạng nhất… | **Thi đua lớp, trường, phường** | Phát `T/quay/w11-xep-hang.mp4` từ giây 4,6 (vào bảng); cú lên hạng ở giây 6,5 của đoạn canh trùng chữ "vừa lên hạng nhất", phóng vào dòng 11A1. Rồi tách mảnh "Thêm 100 điểm nữa là vượt…" bay nổi. Cuối nhịp là đoạn đổi phạm vi sang trường (giây 10,8). Nhãn "Dữ liệu minh họa" hiện rõ hơn ở nhịp này (tên trường thật, điểm minh họa). | Tiếng "ting" đi lên khi lên hạng. |
| N9 Cộng đồng | 86,1–102,6 | À, thẻ đỏ lúc nãy từ đâu ra? Từ chính người dùng. Có cuộc gọi đến thật trong máy thì mới báo được. Đội tình nguyện xem bằng chứng, rồi bỏ phiếu. Báo nhầm thì được yêu cầu xem lại. Và mọi máy dùng chung một danh sách. | | **Người thật báo · Đội tình nguyện duyệt** | Thẻ đỏ của N2 bay trở lại 1 giây (cùng mảnh cắt), rồi thu nhỏ. `S/khop-react/A09-bao-cao.png` (màn báo cáo trên điện thoại) bay vào ở "mới báo được". Sau đó thẻ ngang kiểu cửa sổ trình duyệt phát `T/quay/w9-kiem-duyet.mp4`: tổng quan (giây 3,7; phóng số "120 báo cáo" và "35% đường dẫn giả mạo"), mở hồ sơ (giây 9,8) ở "xem bằng chứng", bấm xác nhận và "Đã ghi nhận phiếu" (giây 16,9–19,4) ở "bỏ phiếu". Câu cuối: thẻ đỏ nhân thành nhiều thẻ điện thoại nhỏ xếp hàng. Không vẽ ý "dùng khi mất mạng". | Tiếng "tách" khi phiếu được ghi. |
| N10 Kết | 102,6–106,8 | Lá chắn số. Phần còn lại, mời bạn nghe Đội 18 kể tiếp. | …mời bạn nghe Đội mười tám kể tiếp. | **Lá chắn số** | Mọi thẻ lùi ra xa, xếp thành vòng cung mờ phía sau; logo và tên sản phẩm về giữa. | Nhạc vào câu kết. |
| Khung kết | 106,8–111 | (không lời) | | Xem mục 5 | Giữ khung kết. | Nhạc tắt dần, hết ở khoảng 110,5. |

## 3. Lời dặn giọng cho TTS

Một giọng nữ miền Nam trẻ, ấm, sáng, khoảng 25–30 tuổi, nói như đang ngồi cạnh và chỉ cho bạn mình xem một cái app mình thích: tự nhiên, hơi mỉm cười, không phải giọng đọc quảng cáo, không phải giọng phát thanh viên. Tốc độ vừa, thong thả; câu ngắn thì nghỉ một nhịp rõ sau dấu chấm, không dồn. Các câu hỏi ("Nghe, hay không nghe?", "Nhà có ông bà?", "Lỡ bà vẫn mở áp ngân hàng?", "À, thẻ đỏ lúc nãy từ đâu ra?") lên giọng thật, như hỏi thật, rồi nghỉ nửa nhịp trước khi trả lời. Ba câu "Dừng lại. Đừng chuyển tiền. Gọi Minh hỏi đã." đọc chậm và chắc hơn phần còn lại, không quát. "Một chữ là xong." và "Ai mà ngồi yên được." đọc nhẹ, có chút tinh nghịch. Câu cuối "mời bạn nghe Đội mười tám kể tiếp" hạ giọng, thân mật, như trao lời. Không nhấn kiểu khẩu hiệu, không kéo dài cuối câu, không thở mạnh. Đọc "ây ai" và "áp" đúng như chữ đã viết. Thu một lượt liền mạch cả bài (trừ câu của Bé Nai là tiếng app), sau đó mới cắt theo nhịp.

## 4. Nhạc

**Chọn: "Wildflowers" của Scott Buckley** (`T/nhac/tai-ve/mp3/Wildflowers.mp3`, 5 phút 22 giây, CC BY 4.0).

Lý do: theo số đo trong `T/nhac/GIAY-PHEP.md`, bài này 103 phách mỗi phút, nhanh nhất trong bảy bài đã tải. Ở bản trước nó bị loại chính vì nhanh hơn khoảng 70–100 dành cho mạch kể chuyện chậm; bản này là giới thiệu sản phẩm, cần nhịp đi đều và tươi để các thẻ bay vào theo phách, nên tiêu chí đảo lại. "Aphelion" mở tối và dâng thành cao trào kiểu điện ảnh, hợp chuyện kể, không hợp giọng trò chuyện. Ở 103 phách mỗi phút, một phách khoảng 0,58 giây, một ô bốn phách khoảng 2,33 giây: mỗi chỗ thở dài đúng một ô, mỗi lần đổi thẻ rơi vào đầu ô.

Chưa nghe lại bài này cho bản 2; chọn dựa trên số đo và mô tả đã ghi. Trước khi ghép phải nghe: nếu phần giữa quá dày hoặc tranh với giọng, dùng phương án dự phòng là đoạn cuối của "Convergence" (có trống 4/4 đẩy nhịp, đã có sẵn `T/nhac/nen-phuong-an-b.wav` nhưng phải cắt lại theo độ dài mới).

Chỗ nhạc được thở không lời:
- 0,0–3,0: mở, logo.
- 22,0–24,5: nhạc hạ xuống nhường tiếng Bé Nai (không phải thở, là nhường).
- 44,1–46,1: sau màn DỪNG LẠI, một ô nhịp đầy.
- 72,6–74,6: giữa phần học và phần thi đua, một ô nhịp đầy.
- 106,8–111: khung kết, nhạc lắng và tắt.

Dưới lời dẫn, nhạc ở khoảng −20 đến −18 dB so với giọng; ở chỗ thở lên −10 dB.

## 5. Khung mở và khung kết

**Khung mở (0,0–3,0):** nền sáng trơn. Logo nổi lên giữa khung, tên **Lá chắn số** hiện ngay dưới. Không có dòng phụ, không biểu trưng nào khác. Hết giây 3, cụm logo và tên thu nhỏ lên góc trên trái.

**Khung kết (102,6–111):**
- Logo và tên **Lá chắn số**, giữa khung, lớn.
- Câu kết ngắn bên dưới: **Chuông đổ là biết. Cả nhà cùng hay.**
- Dòng nhỏ: Đội 18 · Vivi · Hackathon thành phố Đồng Nai 2026
- Dòng nhỏ nhất, sát đáy, ghi công nhạc đúng mẫu tác giả yêu cầu:
  `'Wildflowers' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au`
  và dòng tiếng Việt ngay dưới: `Nhạc: "Wildflowers" – Scott Buckley (www.scottbuckley.com.au), CC BY 4.0 (creativecommons.org/licenses/by/4.0), đã cắt ghép`
- Góc dưới trái: "Dữ liệu trong phim là dữ liệu minh họa".

(Nếu đổi sang "Convergence" thì thay tên bài trong hai dòng ghi công.)

## Toàn bộ lời dẫn (bản hiển thị, đọc liền)

Số lạ gọi tới. Nghe, hay không nghe? Để Lá chắn số xem giúp bạn.

Chuông vừa đổ, thẻ đỏ đã hiện: số này bị mười bốn máy báo lừa đảo. Bấm một cái là chặn. Số lạ chưa ai báo? App im lặng.

Nhà có ông bà? Cúp máy xong, Bé Nai hỏi luôn bằng giọng nói.

(Bé Nai: "Người vừa gọi có bảo bà chuyển tiền không ạ?")

Bà chỉ cần đáp "Có". Một chữ là xong. App ghi nhận nguy hiểm, và tự báo cho con.

Bên kia, máy của Minh hiện ngay: "Mẹ vừa gặp cuộc gọi đáng ngờ." Minh gọi về liền.

Lỡ bà vẫn mở app ngân hàng? Cả màn hình hiện lên: Dừng lại. Đừng chuyển tiền. Gọi Minh hỏi đã.

Còn bạn, gặp tin nhắn ngờ ngợ thì dán vào đây. AI tô đỏ từng dấu hiệu: việc nhẹ lương cao, nạp trước hai trăm nghìn, đường dẫn lạ. Số điện thoại cũng kiểm được.

Muốn tự nhận ra kẻ gian? Vào học, mà học như chơi. Truyện tranh một phút, tới ngã rẽ thì bạn tự chọn. Gọi video nhập vai với nhân vật AI, miệng nhép theo từng lời. Rồi năm câu kiểm tra.

Điểm của từng bạn cộng lại cho lớp, cho trường, cho phường. Kìa, 11A1 Ngô Quyền vừa lên hạng nhất. Thêm một trăm điểm nữa là vượt. Ai mà ngồi yên được.

À, thẻ đỏ lúc nãy từ đâu ra? Từ chính người dùng. Có cuộc gọi đến thật trong máy thì mới báo được. Đội tình nguyện xem bằng chứng, rồi bỏ phiếu. Báo nhầm thì được yêu cầu xem lại. Và mọi máy dùng chung một danh sách.

Lá chắn số. Phần còn lại, mời bạn nghe Đội 18 kể tiếp.

## Bản gửi TTS (một lượt, không có câu của Bé Nai)

Số lạ gọi tới. Nghe, hay không nghe? Để Lá chắn số xem giúp bạn.

Chuông vừa đổ, thẻ đỏ đã hiện: số này bị mười bốn máy báo lừa đảo. Bấm một cái là chặn. Số lạ chưa ai báo? Áp im lặng.

Nhà có ông bà? Cúp máy xong, Bé Nai hỏi luôn bằng giọng nói.

Bà chỉ cần đáp "Có". Một chữ là xong. Áp ghi nhận nguy hiểm, và tự báo cho con.

Bên kia, máy của Minh hiện ngay: "Mẹ vừa gặp cuộc gọi đáng ngờ." Minh gọi về liền.

Lỡ bà vẫn mở áp ngân hàng? Cả màn hình hiện lên: Dừng lại. Đừng chuyển tiền. Gọi Minh hỏi đã.

Còn bạn, gặp tin nhắn ngờ ngợ thì dán vào đây. Ây ai tô đỏ từng dấu hiệu: việc nhẹ lương cao, nạp trước hai trăm nghìn, đường dẫn lạ. Số điện thoại cũng kiểm được.

Muốn tự nhận ra kẻ gian? Vào học, mà học như chơi. Truyện tranh một phút, tới ngã rẽ thì bạn tự chọn. Gọi video nhập vai với nhân vật ây ai, miệng nhép theo từng lời. Rồi năm câu kiểm tra.

Điểm của từng bạn cộng lại cho lớp, cho trường, cho phường. Kìa, mười một A một Ngô Quyền vừa lên hạng nhất. Thêm một trăm điểm nữa là vượt. Ai mà ngồi yên được.

À, thẻ đỏ lúc nãy từ đâu ra? Từ chính người dùng. Có cuộc gọi đến thật trong máy thì mới báo được. Đội tình nguyện xem bằng chứng, rồi bỏ phiếu. Báo nhầm thì được yêu cầu xem lại. Và mọi máy dùng chung một danh sách.

Lá chắn số. Phần còn lại, mời bạn nghe Đội mười tám kể tiếp.

## Những chỗ cần soát trước khi dựng

- Chưa mở từng ảnh để đối chiếu chữ; các câu trích trên hình lấy theo mô tả tính năng được giao. Cần soát: `khac-2-khan-cap-nguoi-than.png` có đúng dòng "Mẹ vừa gặp cuộc gọi đáng ngờ" và nút gọi lại; `A09-bao-cao.png` có đúng là màn báo cuộc gọi đến; nửa trái `A03a.png` là gì.
- Lời nói "Gọi Minh hỏi đã", màn hình ghi "Hãy gọi Minh để kiểm tra": lời dẫn nói gọn lại, không đọc nguyên chữ. Nếu muốn khớp từng chữ thì đổi lời thành "Hãy gọi Minh để kiểm tra."
- Dòng "Thêm 100 điểm nữa là vượt…": lời dẫn cố ý không nói ai vượt ai, vì chưa soát phần sau dấu ba chấm trên hình.
- Mốc giây trong `minh.mp4` có khẩu hình rõ nhất chưa chọn.
