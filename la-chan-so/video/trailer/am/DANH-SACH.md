# Âm thanh trailer: danh sách tệp

Tạo ngày 26/11/2026. Mọi số đo dưới đây đo bằng máy (ffmpeg, numpy và `video/loc-giong-buoc.py --do`); **chưa ai nghe bằng tai**. Xem mục "Cần người nghe lại" ở cuối.

Tạo lại:

```
uv run --no-project --with numpy python -I cong-cu/am-thanh.py                                      # hiệu ứng
uv run --no-project --with librosa --with numpy --with scipy python -I cong-cu/xu-ly-tieng.py all   # nhạc, tiếng app, sóng âm
```

Đỉnh ghi ở đây là đỉnh mẫu (dBFS); đỉnh thật (dBTP, `ebur128=peak=true`) của mọi tệp nằm trong khoảng −3,8 đến −3,4.

## 1. Hiệu ứng tự tổng hợp (`am/*.wav`)

48 kHz, stereo, 16 bit. Chỉ dùng numpy, không dùng tệp ngoài. Đỉnh −3,5 dBFS, mờ vào 5 ms và mờ ra 20 ms ở hai biên tệp, không mẫu nào chạm trần. Mốc bên trong từng tệp (giây tính từ đầu tệp) ghi máy đọc được ở `am/hieu-ung.json`.

| Tệp | Là gì | Dài (s) | RMS (dBFS) | Mốc bên trong |
|---|---|---|---|---|
| `chuong.wav` | Chuông một lượt như `ringOnce` của `app/src/lib/sound.js`: 440 + 480 Hz, kêu 0,5 s, nghỉ 0,2 s, kêu 0,5 s. Dốc lên/xuống hàm mũ 20 ms (app dùng 30 ms) | 1,30 | −10,9 | kêu 0–0,5 và 0,7–1,2 |
| `chuong-lap.wav` | Ba lượt chuông, mỗi lượt cách 3 s như `startRinging` | 7,30 | −13,6 | kêu 0–0,5; 0,7–1,2; 3,0–3,5; 3,7–4,2; 6,0–6,5; 6,7–7,2 |
| `rung.wav` | Rung máy, nhịp thường của app [400, 200, 400] ms: xung vuông 150 Hz làm mềm (lọc dưới 2,5 kHz), rung nhẹ tần số, tiếng lạch cạch mặt bàn rất nhỏ | 1,05 | −6,6 | rung 0–0,4 và 0,6–1,0 (khung rung 2 px theo các mốc này) |
| `rung-manh.wav` | Như trên, nhịp nguy hiểm của app [500, 150, 500, 150, 500] ms | 1,85 | −6,4 | rung 0–0,5; 0,65–1,15; 1,3–1,8 |
| `doi-tram.wav` | Tiếng dội trầm: sin trượt 80 → 40 Hz, tắt dần (hằng số 0,75 s), bão hòa nhẹ để có hài 120–400 Hz (phần dải 200 Hz–4 kHz chiếm −19 dB năng lượng) | 2,40 | −12,3 | đánh ở 0 |
| `luot.wav` | Tiếng lướt: nhiễu qua dải lọc quét 400 Hz → 4 kHz → 1,5 kHz, lia trái sang phải | 0,90 | −21,1 | to nhất ở 0,495 |
| `thong-bao.wav` | Thông báo hai nốt đi lên: Si5 (987,8 Hz) rồi Mi6 (1318,5 Hz), âm sắc mộc cầm mềm | 1,00 | −17,0 | nốt ở 0 và 0,14 |
| `tinh.wav` | "Tinh" khi lên hạng: nốt lướt Si5 rồi chuông Mi6 có bậc không điều hòa, chút lấp lánh 6–11 kHz | 1,40 | −16,9 | chuông chính ở 0,07 |
| `trong.wav` | Một nhịp trống nhẹ: màng trầm 120 → 65 Hz, thêm các mode 1,59–2,65 lần và tiếng chạm tay dưới 1,8 kHz | 1,20 | −13,9 | đánh ở 0 |
| `trong-ba-nhip.wav` | Ba nhịp trống cho khung kết, cách nhau hai phách của `nen.wav` (1,486 s), mạnh dần (0,75; 0,87; 1,0) | 4,37 | −15,5 | 0; 1,486; 2,972. Nếu ba từ "Chính mình. Người thân. Cộng đồng." không cách đều thì đặt riêng từng `trong.wav` theo mốc lời |
| `tach.wav` | "Tách" nhẹ khi máy bật ra: dao động tắt nhanh 2,4 kHz, thân 900 Hz, nhiễu 1,5–6 kHz rất ngắn | 0,12 | −23,6 | đánh ở 0 |

`loc-giong-buoc.py --do`: không tệp nào có cụm bật to. Riêng `tach.wav` bị đánh dấu `('dau', 0.03)` vì cả tiếng "tách" nằm trong 10 ms đầu rồi im: đó chính là tiếng cần có, không phải tiếng rẹt.

## 2. Tiếng trong app (`am/app/`)

Quy trình chung (`cong-cu/xu-ly-tieng.py voices`): giải mã 48 kHz mono, cắt ở khoảng lặng đã đo, chạy `python3 video/loc-giong-buoc.py <thư mục tạm>` (cắt cụm nổ đầu/đuôi nếu có, lọc thông cao 70 Hz, `adeclick`, đưa đỉnh về −4 dB rồi giới hạn −3,6 dBFS, mờ vào 20 ms, mờ ra 30 ms), đổi lại 48 kHz, mờ thêm 20 ms. Trước khi lọc, công cụ đo không thấy cụm nổ hay tiếng click biên nào ở cả chín đoạn cắt, nên không cắt đuôi đoạn nào (nhật ký ở `am/app/do-dac.json`).

| Tệp | Nguồn và đoạn cắt | Lời | Dài (s) | Đỉnh (dBFS) | RMS (dBFS) | Đã làm gì |
|---|---|---|---|---|---|---|
| `be-nai-hoi.wav` | `prototype/audio/benai-10.m4a`, 4,44–6,56 s | "Người vừa gọi có bảo bà chuyển tiền không ạ?" | 2,12 | −3,83 | −16,2 | Lọc rẹt. Lời bắt đầu ở 0,12 s trong tệp |
| `benai-11.wav` | `prototype/audio/benai-11.m4a`, cả tệp | "Bà đừng chuyển tiền nhé. Con báo anh Minh ngay, anh ấy sẽ gọi cho bà." | 4,81 | −3,61 | −18,8 | Lọc rẹt. Lời bắt đầu ở 0,70 s. Kế hoạch: đặt nhỏ hơn lời dẫn 6 dB |
| `benai-13.wav` | `prototype/audio/benai-13.m4a`, cả tệp | "Bà ơi, khoan chuyển tiền đã. Bà gọi anh Minh hỏi trước cho chắc nha." | 4,14 | −3,71 | −17,0 | Lọc rẹt. Lời bắt đầu ở 0,30 s |
| `ke-gian.wav` | `prototype/hoc/giong/b01/gn-06.m4a`, 0,22–2,50 s, rồi thêm 0,2 s đuôi | "Bà chuyển hết tiền vào tài khoản tạm giữ giúp tôi" (dừng ở dấu phẩy, bỏ "để chứng minh bà trong sạch") | 2,48 | −3,50 | −21,2 | Lọc rẹt, rồi giả tiếng qua điện thoại: lọc 300–3400 Hz (Butterworth bậc 4 và 6), hạ về 8 kHz qua mã hóa mu-law 8 bit (như G.711) rồi nâng lại, bão hòa tanh nhẹ (hệ số 1,8), lọc dải lần nữa, nền đường dây −54 dBFS. Năng lượng trên 4 kHz: −61 dB. Giọng AI đóng vai: gắn nhãn "Mô phỏng · giọng AI đóng vai" |
| `ghi-am-mau.m4a` | `b01/gn-04`, `gn-05`, `bh-02` (0,72–3,12 s), `gn-06`, `gn-07` nối thành một cuộc gọi | xem bảng dưới | 21,17 | −3,45 | −22,3 | Lọc rẹt từng câu, bỏ lặng đầu đuôi từng câu, lọc 300–3400 Hz. Giọng người gọi (gn) thêm mu-law 8 kHz và bão hòa nhẹ (1,4); giọng bà (bh) chỉ lọc dải. Nền đường dây −56 dBFS suốt tệp. AAC 128 kb/s, mono, 48 kHz, `+faststart` (gửi app với kiểu `audio/mp4`) |

Mốc câu trong `ghi-am-mau.m4a` (giây):

| Câu | Từ | Đến | Lời |
|---|---|---|---|
| gn-04 | 0,70 | 2,94 | "Dạ alo, bà nghe máy có rõ không ạ?" |
| gn-05 | 4,04 | 7,49 | "Tôi là cán bộ điều tra. Bà đang có liên quan tới một vụ án." |
| bh-02 | 8,29 | 10,69 | "Trời đất ơi, tôi có làm gì đâu!" |
| gn-06 | 11,99 | 15,52 | "Bà chuyển hết tiền vào tài khoản tạm giữ giúp tôi, để chứng minh bà trong sạch." |
| gn-07 | 16,92 | 19,97 | "Việc này bà đừng nói với ai, kể cả con cháu nha bà." |

`gn-04` là câu mở của cùng người gọi trong Bài 1, thêm vào vì bốn câu được giao chỉ dài khoảng 17 s kể cả khoảng nghỉ tự nhiên, chưa tới 20 s. Không thu giọng mới.

Cách xác định chỗ cắt (năng lượng khung 10–20 ms và đếm đỉnh âm tiết trong dải 300–2500 Hz):
- `benai-10.m4a` (7,06 s) có bốn khoảng lặng dưới −45 dB: 1,03–1,32; 2,06–2,28; **4,05–4,56**; 6,41–7,06. Bốn cụm lời đếm được 2, 3, 10 và 11 âm tiết, khớp "Bà ơi, / con là Bé Nai, / trợ lý Lá chắn anh Minh cài cho bà. / Người vừa gọi có bảo bà chuyển tiền không ạ?". Vậy câu hỏi là **4,56–6,41 s, lời dài 1,85 s**, không phải "khoảng 3,4 s cuối" như ước trong kế hoạch (3,4 s cuối sẽ lẫn cả "cài cho bà").
- `gn-06.m4a`: lời 0,32–3,68 s, lặng ở dấu phẩy 2,40–2,60 s; trước dấu phẩy 12 đỉnh âm tiết (câu có 11 âm tiết), sau dấu phẩy 7 (câu có 6). Câu cắt ra chỉ dài 2,3 s lời, nên tệp 2,48 s, hơi ngắn hơn khung 2,5 s của cảnh C0.
- `bh-02.m4a` (5,32 s): lời "Trời đất ơi" 0,80–1,48 s và "tôi có làm gì đâu" 2,08–3,04 s. Bỏ hai chỗ không rõ là gì: một tiếng ngắn 0,20–0,28 s (−26 dB) và một đoạn −38 đến −48 dB ở 4,24–5,12 s (có thể là tiếng thở).

## 3. Sóng âm (`am/song/*.json`)

Mỗi tệp là **một mảng số 0–1**, phần tử thứ k là RMS của khung [k/30, (k+1)/30) giây tính từ đầu tệp tiếng tương ứng (trộn về mono), chia cho khung to nhất của chính tệp đó, làm tròn 3 chữ số.

| Tệp | Cho tệp tiếng | Số khung | Khung to nhất |
|---|---|---|---|
| `be-nai-hoi.json` | `app/be-nai-hoi.wav` | 64 | −8,4 dBFS |
| `ke-gian.json` | `app/ke-gian.wav` | 75 | −10,2 dBFS |
| `nen.json` | `nhac/nen.wav` | 3024 | (tính trên bản đã chuẩn đỉnh −1,5 dBFS) |
| `nen-phuong-an-b.json` | `nhac/nen-phuong-an-b.wav` | 3045 | |

Vì mỗi tệp tự chuẩn về 1, muốn so độ to giữa các tệp thì nhân với mức khung to nhất ở bảng trên.

## 4. Nhạc nền (ở `nhac/`, ghi tóm tắt cho tiện)

- `nhac/nen.wav`: "Aphelion" của Scott Buckley (CC BY 4.0), 48 kHz stereo 16 bit, dài 100,79 s, nghe như hết ở 97,9 s; đỉnh −1,5 dBFS (đỉnh thật −1,5 dBTP); độ to −18,1 LUFS, LRA 10,8 LU. 80,75 phách mỗi phút.
- Mốc (`nhac/phach.json`): đổi hợp âm, vào giai điệu 10,54; dâng lên 13,54; **điểm bung 58,56**; hợp âm chủ sau câu kết 76,56; bắt đầu lắng 79,55; hết hẳn 97,9.
- Phương án B `nhac/nen-phuong-an-b.wav`: "Convergence", 89,1 phách mỗi phút, điểm bung 60,05, kết dứt ở khoảng 98,8; −15,8 LUFS.
- Giấy phép, dòng ghi công: `nhac/GIAY-PHEP.md`.

## 5. Cần người nghe lại

Máy không đánh giá được những điểm sau; cần người nghe bằng tai (loa ngoài, tốt nhất là loa của nơi chiếu):

1. **Nhạc `nen.wav`, ba chỗ nối** (đã chọn chỗ giống nhau nhất về hợp âm và âm sắc, nối chéo trên phách mạnh):
   - 10,54 s: từ hợp âm nền của phần mở sang đoạn có giai điệu. Độ đổi phổ ở đây lớn hơn mọi phách mạnh tự nhiên trong bài (1,03 so với tối đa 0,65), nghe có thể như một lần chuyển cảnh đột ngột. Nối chéo hai phách, trùng lúc tiếng dội trầm và tên sản phẩm hiện lên nên có thể được che.
   - 79,55 s: từ cao trào xuống phần lắng, nhạc nhỏ đi 7,3 dB trong khoảng 1,5 s (phách mạnh tự nhiên đổi tối đa 5,9 dB).
   - 88,54 s: phần lắng nhỏ thêm 4,9 dB.
2. Chất nhạc: phần mở có đủ "bất an" không; cao trào (58,6–79,6 s) có kèn hay trống to đè lên giọng đọc nữ không khi đã hạ nhạc 12–14 dB; phần kết lắng dần có đủ "dứt khoát" không (nếu không, nghe thử phương án B, kết dứt hơn).
3. `be-nai-hoi.wav` (2,12 s): chữ "Người" đầu câu có bị mất hơi đầu không.
4. `ke-gian.wav` (2,48 s): độ méo có vừa "qua điện thoại" hay quá rè; câu dừng ở "giúp tôi" có tự nhiên không.
5. Bộ giọng `prototype/hoc/giong/b01` **chưa từng được nghe lại** (`BAN-GIAO.md` mục 9). Nên chạy `tools/nghe-lai.py` (gói này không được gọi Gemini nên chưa chạy) trên `ke-gian.wav` và `ghi-am-mau.m4a`, hỏi đích danh có đọc lẫn lời dặn giọng không, ở giây nào; và người nghe `bh-02` (hai chỗ đã bỏ nêu ở mục 2).
6. Mọi hiệu ứng dưới 1 giây (`tach`, `luot`, `thong-bao`) và tiếng trầm (`doi-tram`, `trong`, `trong-ba-nhip`, phần lớn năng lượng dưới 200 Hz): nghe trên loa máy chiếu, loa nhỏ có thể gần như mất tiếng trầm.
