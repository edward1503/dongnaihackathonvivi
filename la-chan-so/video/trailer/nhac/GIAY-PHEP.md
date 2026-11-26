# Giấy phép nhạc nền trailer

Ngày xem trang và tải: 26/11/2026, khoảng 04:24–04:28 (giờ Việt Nam).
Bằng chứng lưu kèm: bản HTML của từng trang bài nhạc lúc xem ở `tai-ve/trang/*.html` (không có ảnh chụp màn hình), tệp gốc ở `tai-ve/mp3/` (mã SHA-256 ở cuối tệp này).

## Bài chính: "Aphelion" của Scott Buckley

| Mục | Nội dung |
|---|---|
| Trang bài | https://www.scottbuckley.com.au/library/aphelion/ |
| Tác giả | Scott Buckley (thẻ ID3 trong tệp: artist và composer đều là Scott Buckley) |
| Tên bài | Aphelion |
| Giấy phép | Creative Commons Attribution 4.0 International (CC BY 4.0). Đường dẫn giấy phép trên trang: http://creativecommons.org/licenses/by/4.0/ |
| Ngày đăng (thẻ `article:published_time` của trang) | 29/04/2026 |
| Tệp tải | https://www.scottbuckley.com.au/library/wp-content/uploads/2026/04/Aphelion.mp3 (nút "MP3 (Full Mix)" trên trang), 7 phút 2 giây, MP3 320 kb/s 44,1 kHz |
| Dùng trong trailer | `nen.wav`: cắt ghép thành 100,8 giây (nghe như hết ở 97,9 giây), xem `phach.json` mục `segments` |

Trích nguyên văn trên trang bài:

> This work is licensed under a Creative Commons Attribution 4.0 International License; meaning it’s free for use in any project (including commercial) as long as I’m credited.

> For YouTube videos, credits must appear in the video description.

> Attribution format:
> 'Aphelion' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

> All music is licensed under Creative Commons Attribution 4.0, which means it’s free to use, as long as you credit me.

Mô tả bài trên trang: "An epic, cinematic hybrid track – starting out slow and contemplative, but building to an epic, emotional energy with synth and full orchestra."

**Dòng ghi công chính xác (theo mẫu tác giả yêu cầu):**

```
'Aphelion' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au
```

Dòng đặt ở khung cuối trailer. CC BY 4.0 đòi ghi rõ là đã sửa, nên đề xuất thêm một dòng tiếng Việt ngay dưới:

```
Nhạc: "Aphelion" – Scott Buckley (www.scottbuckley.com.au), CC BY 4.0 (creativecommons.org/licenses/by/4.0), đã cắt ghép
```

Nếu đưa trailer lên YouTube: chép dòng ghi công vào phần mô tả video (yêu cầu trên trang).

## Phương án dự phòng: "Convergence" của Scott Buckley

| Mục | Nội dung |
|---|---|
| Trang bài | https://www.scottbuckley.com.au/library/convergence/ |
| Tác giả, tên bài | Scott Buckley, Convergence |
| Giấy phép | CC BY 4.0, cùng các câu trên trang như bài chính |
| Ngày đăng | 02/04/2026 |
| Tệp tải | https://www.scottbuckley.com.au/library/wp-content/uploads/2026/04/Convergence.mp3 (3 phút 40 giây) |
| Dùng | `nen-phuong-an-b.wav` (101,5 giây, nghe như hết ở 98,8 giây), `phach-phuong-an-b.json` |

Trích nguyên văn:

> This work is licensed under a Creative Commons Attribution 4.0 International License; meaning it’s free for use in any project (including commercial) as long as I’m credited.

> Attribution format:
> 'Convergence' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

Mô tả: "An emotional, melancholic (but also surprisingly upbeat) track with strings and synth – with a final section with a subtle 4/4 kick creating a driving energy."

## Các ứng viên khác đã tải và giữ (cùng tác giả, cùng giấy phép, chưa dùng)

Trang nào cũng có đúng câu "This work is licensed under a Creative Commons Attribution 4.0 International License; …" và mẫu ghi công `'<tên bài>' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au`.

| Bài | Trang | Vì sao không chọn làm bài chính |
|---|---|---|
| A Kind Of Hope (ứng viên đầu trong kế hoạch) | https://www.scottbuckley.com.au/library/a-kind-of-hope/ | Piano co giãn nhịp (độ lệch giữa các phách 30 ms, Aphelion 18 ms) nên khó cắt đúng phách; 6,5 giây đầu gần như im; dâng rất chậm, chỗ bật lên rõ nhất (+6 dB) ở phút 2:26, không có điểm bung gọn |
| Starfire | https://www.scottbuckley.com.au/library/starfire/ | Sáng (trọng tâm phổ phần cao trào khoảng 1,5 kHz, Aphelion 0,7 kHz) nên dễ tranh với giọng nữ; điểm bung chỉ +4,7 dB |
| With These Hands | https://www.scottbuckley.com.au/library/with-these-hands/ | Hoài niệm, mơ màng; điểm bung yếu (+3–5 dB) |
| Wildflowers | https://www.scottbuckley.com.au/library/wildflowers/ | 103 phách mỗi phút, ngoài khoảng 70–100 |
| Hiraeth (dự phòng trong kế hoạch) | https://www.scottbuckley.com.au/library/hiraeth/ | Vào to ngay từ giây thứ 2–6 (−23 rồi −18 dB), không có phần mở thưa |

Kevin MacLeod (incompetech.com) chỉ được tra trong danh mục `pieces.json` của trang, không tải: "Inspired" ghi 120 phách mỗi phút (ngoài khoảng), "Deliberate Thought" 69 phách mỗi phút và có bè hợp xướng.

## Vì sao chọn Aphelion

Đo trên tệp gốc (librosa và tự tương quan luồng phổ tự viết, xem `cong-cu/xu-ly-tieng.py`):
- Nhịp 80,75 phách mỗi phút, đều (lệch chuẩn khoảng cách phách 18 ms), nên cắt ghép đúng phách được.
- Mở thưa và tối: 8 ô nhịp đầu ở −26 đến −31 dB, trọng tâm phổ 0,7–0,9 kHz, chỉ một hợp âm La.
- Có điểm bung rõ nhất trong các bài đã đo: +6,3 dB ở ô 36 (1:49,6 trong bản gốc). Bản ghép đặt điểm này ở **58,56 s**.
- Ngay sau điểm bung có câu kết tự nhiên Rê thứ → La (hợp âm chủ) ở ô 41–42, dùng làm `cadence` (76,56 s); đoạn kết của bài là hợp âm La lắng dần, nên trailer kết đúng chủ âm.
- Phần cao trào nhiều bè trầm, trọng tâm phổ thấp, ít đè lên dải giọng nói.

Đổi lại: kết của Aphelion là một đoạn lắng dần, không dứt cái rụp; Convergence kết dứt khoát hơn nhưng điểm bung nhẹ (+1,3 đến +2,8 dB tùy cách đo). Hai bản đều để sẵn để người dùng nghe và chọn.

## Mã SHA-256 của tệp gốc

```
57ae03dbc122f0859e0f9a273e59503e34883728ddb5b06761fbf8244b0eb23e  Aphelion.mp3
c7fd63d6ad0e8902dbedbb08e7be1770902efb440f8e3896b1beb992ac18c0ae  Convergence.mp3
d0dc554c0db9ea208b4f59e4f0c1b4446aa7ef622c7bfeffca278130a46c51f1  AKindOfHope.mp3
d97bd4c5256fd4ccceaab1e5660844b92905c66d570c0e40f774b73c711e8c1c  Starfire.mp3
e450028d152becd5c68dec24899f05a71ac1c13d6934dfebf71dbbae5472db9b  WithTheseHands.mp3
8beb04451d69523608d1f2f45eb228b6b752534091afc22a889c512c5e88834a  Wildflowers.mp3
f790c7d53b8d802981ff7cdd8c59e22cdfe103ea66aba296c6cf1a65fe7fcf01  sb_hiraeth.mp3
```
