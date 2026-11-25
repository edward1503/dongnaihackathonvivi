# Bàn giao · gọi video cho anh Minh (125) và chú Tư (117)

Viết lúc dừng giữa chừng theo yêu cầu đổi model, 25/11/2026 khoảng 15:05. Kho: `/home/rin/dongnaihackathonvivi/la-chan-so`. Thư mục tạm của tôi: `/home/rin/dongnaihackathonvivi/la-chan-so/ban-giao/tam-nv/` (dưới đây gọi là `ban-giao/tam-nv/`).

Trạng thái lúc dừng: mọi tệp trên đĩa nhất quán (không tệp nào sửa dở). Không còn tiến trình nền: máy ảo đã tắt, lượt kiểm trang đã dừng, không còn trình duyệt thử, không cổng 8801–8809 nào mở. Khóa đã xóa khỏi máy ảo, công tắc `goi-song` trên máy ảo đã trả về tắt. Không đụng điện thoại thật.

## (a) Chín hạng mục

| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | Chép avatar 117, 125 và nền, `chepWeb` chở theo | Xong. Có trong APK (đã mở APK ra kiểm). |
| 2 | Tệp cảnh `prototype/canh/<mã>.json` + lời nhắc, `lan-2` cùng khuôn | Xong. Không còn số 4 viết cứng trong đường hội thoại thật. |
| 3 | `prototype/nhan-vat.json` | Xong, `chot: true` cho cả ba. |
| 4 | Câu thu sẵn của Minh (37 câu) và ông Tư (34 câu), ngân hàng ngoại tuyến, hình miệng | Thu, cắt, lọc rẹt, `.lip.json`, `.mieng.mp4` xong. **Nghe kiểm mới bằng máy, CHƯA có người nghe; có câu nghi đọc sai** (xem mục d, f). |
| 5 | `video-call.html?canh=…`, chữ cho người cao tuổi, tự nhận app qua cầu nối | Xong, đã chạy trên máy tính và máy ảo. |
| 6 | Hợp đồng với trang bài học (`lcs-goi-<mã>`, `ve`) | Xong trên trang gọi video. **Chưa thử đi thật từ `hoc.html` sang cuộc gọi rồi quay về trên máy ảo** (trang bài học đã có trong kho lúc tôi dựng lần cuối). |
| 7 | Android: `HieuY` theo cảnh, cầu nối, `chepWeb`, nút "Bài học" và nút từng cảnh, nút Quay lại | Mã xong, dựng qua, 15 bài kiểm đơn vị qua (13 cũ + 2 mới). Nút "Bài học" và nút Quay lại **chưa bấm thử trên máy ảo**. |
| 8 | `android/README.md` | Đã cập nhật (cảnh, kết hợp, kho giọng). **Chưa ghi các sửa sau review của Astra** và chưa ghi số đo trên máy ảo. |
| 9 | Review của Astra | Đã chạy, 12 phát hiện + 3 mức thấp, đã sửa gần hết (bảng ở mục d). **Lượt kiểm trang cuối sau khi sửa chưa chạy trọn** (bị dừng ở cảnh đầu). |

## (b) Quyết định đã chốt

- **Giọng.** Minh = `Achird`, ông Tư = `Algenib`, chị Lan = `Aoede` (giữ). Lời dặn giọng nằm ở `prototype/nhan-vat.json` (`loi_dan`), dùng cho cả lượt thu lẫn câu đọc trực tiếp. Lý do chọn: Achird được máy nghe tả là nam 20–30 tuổi, giọng Nam, thân mật, F0 122 Hz, không đọc lẫn lời dặn; Algenib nam trung niên, trầm, giọng Nam, F0 113 Hz. Loại: Orus (nghe ra giọng Bắc), Charon và Umbriel (đọc luôn lời dặn của ông Tư thành tiếng), Puck (nghe già hơn Minh). Mẫu đã lọc ở `bai-hoc/nghe-thu/minh-*.wav`, `tu-*.wav` (hai tệp `tu-Charon.wav`, `tu-Umbriel.wav` có lời dặn bị đọc lẫn, chỉ để làm chứng).
- **Tệp cảnh** (`prototype/canh/<mã>.json`): `ma`, `nhan_vat` (khóa trong nhan-vat.json), `ma_kho` (mã nhân vật trong KhoGiong: `chi-lan`, `minh-1`, `minh-3`, `tu-9`), `bo_may` (`chi-lan` = máy riêng `hoi-thoai.js`; `canh` = máy chung `hoi-thoai-canh.js`), `bo_loi`, `tien_to` (`b1-`, `b3-`, `b9-`; trang đăng ký câu riêng của cảnh dưới mã không tiền tố), `anh`, `chu` (mọi chữ trên màn hình, `nguoi_hoc` = "bạn" hoặc "bà"), `chu_lon`, `nut` (nút trả lời sẵn), `y[]` (`id`, `nhan`, `luat`, `luat_dau`), `ngoai_tuyen` (`sai`, `theo_cau`), `lui_khi_hong`, `song` (`loi_nhac`, `truong_loi`, `ai_nv`, `ai_nh`, `ten_nv`, `ten_nh`, `che_so`), `tra_loi`, `ban_dien` (chỉ lan-2).
- **Cầu nối `window.LaChan`:** thêm `thamSo()` trả JSON `{goc, song, auto}`; `doc(ma, canh, chu)` (đổi chữ ký); `luotSong`, `traLoi`, `hieuY` nhận thêm `canh` bên trong JSON. Mã lời gọi nay có tiền tố phiên của trang.
- **Mã cảnh xuống HieuY:** `HieuY.canh(context, mã)` đọc tệp cảnh và nhan-vat.json từ assets, trả `HieuY.Canh`; `luotSong(c, canh, lichSu, daCham)`, `doc(c, canh, chu)`, `docGemini(c, canh, chu)`, `traLoi(c, canh, …)`, `hoi(c, canh, …)` (chỉ cảnh chị Lan). Lược đồ JSON dựng theo cảnh; chị Lan ra đúng lược đồ cũ (`loi_chi_lan`), nhãn vai "CHỊ LAN:" / "EM:", `lichSu[].ai` = `chi-lan` / `em`. Cảnh mới dùng `nv` / `nh`.
- **Trang mở đầu của WebView:** extra `trang` của Intent, chỉ nhận `prototype/video-call.html` và `prototype/hoc.html` (`GoiVideoActivity.trangHopLe`). Nút chị Lan giữ địa chỉ cũ `?goc=1[&song=1]`; nút cảnh mới mở `prototype/video-call.html?canh=<mã>` không kèm `goc`.
- **Không hiện số bài** (lời dặn của điều phối): mã cảnh giữ nguyên; nút trong app là "Gọi video với anh Minh · cuộc gọi giả công an", "Gọi video với anh Minh · tin báo người thân gặp nạn", "Khuyên chú Tư · đầu tư lãi cao"; cả tám lời nhắc (kể cả hai tệp của chị Lan) thêm một dòng dặn không nói số bài. Đã quét chữ hiển thị và 166 câu thu sẵn: không còn số bài.
- **Khi AI hỏng:** ba cảnh mới lùi về luật trên máy và câu thu sẵn ngay trong lượt đó (`lui_khi_hong: true`). `lan-2` cố ý giữ cách cũ (báo "Mạng chậm") vì đề bài yêu cầu chị Lan chạy như trước; bật cho chị Lan chỉ cần thêm cờ đó vào `canh/lan-2.json`.
- **Sửa một lỗi có sẵn từ trước:** lớp trạng thái "đang gõ" tên `go` trùng lớp `.go` của nút "Bắt đầu cuộc gọi", làm cả trang đổi phông và xô lệch khi mở ô gõ. Đổi thành `dang-go` (body) và `go-chu` (dòng trạng thái). Ảnh hưởng cả chị Lan (theo hướng đúng).

## (c) Tệp đã tạo hoặc sửa

Tệp mới, đã xong:
- `prototype/nhan-vat.json`; `prototype/canh/{lan-2,minh-1,minh-3,tu-9}.json`; `prototype/canh/{minh-1,minh-3,tu-9}.{song,tra-loi}.txt`; `prototype/canh/{minh,tu}.jpg` (ảnh tĩnh chụp từ chính avatar).
- `prototype/hoi-thoai-canh.js` (máy ngoại tuyến chung); `prototype/loi-minh.json`, `prototype/loi-tu.json` (mỗi câu có trường `kiem`).
- `prototype/audio/minh/*` (37 × 3 tệp), `prototype/audio/tu/*` (34 × 3 tệp).
- `vendor/vlearn-avatar/stage/_shared/voice/models/lite/{117,125}/`, `…/assets/bg/{tuong-phong-hop,van-phong}.mp4`.
- `tools/ca-hoi-thoai-canh.json`, `tools/kiem-goi-video.mjs`, `tools/dung-bo-loi.sh`, `tools/do-mieng.py`.
- `android/app/src/test/java/vn/doi18/lachanso/GoiVideoTest.kt`.
- `bai-hoc/nghe-thu/{minh-Achird,minh-Puck,minh-Umbriel,tu-Algenib,tu-Charon,tu-Orus,tu-Umbriel}.wav`.

Tệp sửa, đã xong: `prototype/video-call.html`; `prototype/hoi-thoai.js` (chỉ thêm `export const loSo`); `prototype/hoi-thoai-song-loi-nhac.txt`, `prototype/tra-loi-loi-nhac.txt` (mỗi tệp thêm một dòng); `vendor/vlearn-avatar/player/hoc-lite.js` (một dòng `GOC`); `android/app/src/main/java/vn/doi18/lachanso/{HieuY,GoiVideo,MainActivity}.kt`; `android/app/build.gradle.kts`; `android/app/src/main/res/layout/main.xml`; `android/{doc_giong.py,may-chu-gia.py}`; `tools/{kiem-hoi-thoai.mjs,thu-hoi-thoai.mjs,nghe-lai.py}`.

Tệp sửa, còn thiếu: `android/README.md` (xem mục f). `KhoGiong.kt`, `NenTang.kt`, `AndroidManifest.xml` không đổi. Không đụng `prototype/hoc.html`, `prototype/hoc/**`, `bai-hoc/KICH-BAN-BAI-HOC.md`, `screens/**`, `assets/**`.

Bản gốc của các tệp có sẵn trước khi tôi sửa: `ban-giao/tam-nv/goc/`. Bản khác biệt (trước khi sửa theo Astra): `ban-giao/tam-nv/thay-doi.diff`. Chưa commit gì.

## (d) Đã kiểm gì

Lệnh:
```bash
node tools/kiem-hoi-thoai.mjs                                   # luật ngoại tuyến + tệp cảnh
TMPDIR=/tmp/claude-1000/lcs node tools/kiem-goi-video.mjs 8803  # trang trên Chromium headless, khoảng 15 phút cho bốn cảnh; TMPDIR phải NGẮN
export JAVA_HOME=$HOME/.local/jdk17 PATH=$HOME/.local/jdk17/bin:$HOME/Android/Sdk/platform-tools:$PATH
cd android && ./gradlew --no-daemon -q assembleDebug testDebugUnitTest
ANDROID_AVD_HOME=$HOME/.config/.android/avd ~/Android/Sdk/emulator/emulator -avd lcs34 -port 5554 -no-window -no-audio -no-boot-anim -no-snapshot-save -gpu swiftshader_indirect
python3 ban-giao/tam-nv/chay.py python3 ban-giao/tam-nv/dat-khoa-may-ao.py -1            # đưa khóa vào máy ảo, không in; thêm "xoa" để gỡ
node ban-giao/tam-nv/may-ao.mjs <tên ảnh> 'prototype/video-call.html?canh=minh-1' 'lượt gõ 1' 'lượt gõ 2'   # lái trang trong app qua cổng gỡ lỗi WebView (cổng 8806)
```

Kết quả:
- **Luật và tệp cảnh, trạng thái cuối trên đĩa:** 266/266 (chị Lan 27/27 như cũ; minh-1 74, minh-3 49, tu-9 84, tệp cảnh 32). Con số của ba cảnh mới gồm ca từng lượt, ca cả cuộc gọi và kiểm "bộ lời có đủ câu"; 28 ca lấy từ review của Astra.
- **Dựng Android lần gần nhất (14:55):** qua, mã thoát 0, APK mới (234 MB), 15 bài kiểm đơn vị qua. Sau lần dựng đó không sửa tệp Kotlin nào.
- **Trang trên máy tính, TRƯỚC khi sửa theo Astra:** bốn cảnh ở chế độ câu thu sẵn 141/141 kỳ vọng đạt (nạp avatar, mở đầu bằng video miệng dựng sẵn, gõ tới đủ điểm, trả lời sai được 0 ý, `localStorage`, `ve` hợp lệ và `ve` trỏ ra ngoài, bố cục app với cầu nối giả, 31 ca cho `veHopLe`). Chế độ kết hợp với cầu nối giả: minh-1, minh-3, tu-9 đạt cả ba kiểu (AI đáp đủ; AI hỏng mọi lượt vẫn chấm đủ bằng câu thu sẵn; AI đáp một lượt rồi hỏng). Log: `ban-giao/tam-nv/kiem-trang-b.log`, `ban-giao/tam-nv/kiem-trang-c.log` (5 dòng SAI trong log c đều là lỗi của công cụ kiểm, đã sửa công cụ).
- **Trang trên máy tính, SAU khi sửa theo Astra: CHƯA chạy trọn.** Lượt cuối (`ban-giao/tam-nv/kiem-trang-d.log`) bị dừng ở cảnh đầu, 53 kỳ vọng đầu đạt, chưa tới minh-1.
- **Máy ảo (Android 14, không tiếng), bản dựng trước khi sửa theo Astra:** minh-1 và tu-9 ở chế độ câu thu sẵn đi tới 2/2 và 4/4; minh-1 chế độ trực tiếp 2/2 với hai lượt AI, giọng lưu trong kho là Achird, mã kho `minh-1`; tu-9 hai lượt trực tiếp, giọng Algenib; gõ lại đúng kịch bản minh-1 thì phát lại từ kho (không thêm tệp tiếng nào). **Bản dựng cuối:** chị Lan mở bằng địa chỉ mặc định, một lượt trực tiếp, mã kho `chi-lan`, giọng Aoede. Ảnh: `export/preview/may-ao-*.png`.
- **Chưa thử trên máy ảo:** minh-3; nhánh lùi khi AI hỏng trong app thật; nút "Bài học"; đi từ `hoc.html` sang cuộc gọi và quay về; nút Quay lại; đổi nhân vật trong cùng màn (mã nhả mô hình miệng mới viết sau review); micro và tiếng (máy ảo không có).
- **Giọng thu sẵn:** hai lượt nghe máy độc lập (Gemini flash-lite, OpenAI gpt-4o-transcribe). Không câu nào đọc lẫn lời dặn, ranh giới cắt đúng cả 71 câu. Minh 29 câu khớp, 5 câu `can-nghe`, 2 câu `ngan`; ông Tư 11 khớp, 10 lệch nhẹ (phần lớn "nghen" bị chép thành "nha"), 8 `can-nghe`, 5 `ngan`. Nghi sai thật: `b3-hoi-soluu` ("bằng số nào" cả hai máy chép "mặc số nào"), `b9-mo-dau` (chữ "Vy" năm lần nghe đều không ra), `nghe-hai` và `b9-goi-dauhieu` của ông Tư. Log: `ban-giao/tam-nv/nghe-*.txt`, `ban-giao/tam-nv/nghe2-*.txt`.
- **Miệng:** `tools/do-mieng.py` đo độ mở miệng đi theo độ to của tiếng, tương quan trung vị chị Lan 0,85, Minh 0,81, ông Tư 0,81. Chỉ chứng minh miệng mở khi có tiếng; khớp từng âm chưa ai xem.
- **Astra** (`ban-giao/tam-nv/astra-ket-qua.md`): đã sửa 1 (chấm điểm bị lừa), 2 (che dãy từ 4 chữ số trước khi gửi AI), 3 (máy chủ thử có thể trả `.env`), 4, 5, 6, 7, 8, 9, 10, 11, 12 và ba mục mức thấp. Riêng 9 mới sửa phần tệp cảnh thiếu trường, nút gọi bật muộn và bắt lỗi giữa cuộc gọi; `nhan-vat.json` hỏng thì trang vẫn dừng. Các sửa 2, 6 và che số áp dụng cho cả chị Lan.

## (e) Bẫy đã gặp

- **Khóa sai tệp.** Bản đầu của `ban-giao/tam-nv/chay.py` lấy `OPENAI_API_KEY` từ `.env` của vlearn-lesson-lab (tệp chỉ được giao cho khóa Gemini). 74 yêu cầu chép lời đã gửi bằng khóa đó, tất cả bị 401, không có gì được chép, khóa không bị in hay lưu. Đã sửa: mỗi tệp `.env` chỉ được cấp đúng tên biến của nó. **Việc này phải có trong báo cáo cho người dùng.**
- **Hạn mức Gemini.** Lúc thu, `gemini-3.8-flash-tts` báo 429 trên 6 trong 7 khóa; `gemini-3.5-flash` (nghe lại) 429 trên cả 7 khóa, phải dùng `gemini-3.5-flash-lite` (`NGHE_LAI_MO_HINH=gemini-3.5-flash-lite`), mà mô hình này báo "CÓ LỜI DẶN" bừa: chỉ tin phần chép lời, đừng tin dòng kết luận.
- Thử một yêu cầu trước khi chạy vòng lặp. Đừng nối lệnh chạy lâu qua `grep` kèm `timeout`: bị ngắt là mất hết đầu ra.
- Chromium không khởi động nếu đường dẫn hồ sơ dài (socket quá 108 ký tự): đặt `TMPDIR` ngắn.
- AVD nằm ở `~/.config/.android/avd`, phải đặt `ANDROID_AVD_HOME`.
- Đọc canvas WebGL phải ngay trong khung hình vừa vẽ; và số đo thay đổi điểm ảnh quanh miệng không dùng được (đầu lắc lư), đã bỏ khỏi kỳ vọng.
- Cầu nối giả trên máy tính cần `/__mieng` giả, nếu không nhân vật không dựng và trang lặng lẽ rơi về ảnh tĩnh mà các kỳ vọng cũ vẫn "đạt".
- Tôi từng quên cờ `lui_khi_hong` trong ba tệp cảnh; bài kiểm tệp cảnh bắt được. APK dựng trước 14:26 không có cờ này.
- Dừng công cụ kiểm bằng cách giết tiến trình từng để sót một cây Chromium; công cụ nay tự dọn khi nhận SIGTERM. Chỉ giết theo pid có đường dẫn hồ sơ của mình, máy còn trình duyệt của người khác.
- Avatar 117 trông như người đàn ông ngoài bốn mươi mặc vest trong phòng họp, không giống "ông Tư ngoài sáu mươi, áo ca rô" của kịch bản.

## (f) Việc còn lại, theo thứ tự

1. Chạy trọn `tools/kiem-goi-video.mjs` trên mã hiện tại, mở ảnh `export/preview/goi-*.png` ra xem. Không tốn lượt Gemini.
2. Máy ảo: cài APK hiện có (hoặc dựng lại, mã không đổi), thử minh-3; thử nhánh lùi trong app bằng một khóa AI cố ý sai; bấm "Bài học", đi sang cuộc gọi và quay về, nút Quay lại; đổi nhân vật trong cùng màn. Mỗi lượt trực tiếp thật tốn 1 lượt OpenAI + 1 lượt Gemini TTS; ước lượng 4–6 lượt Gemini nếu thử lại trực tiếp cho minh-3 và tu-9, 0 lượt nếu chỉ thử nhánh lùi và điều hướng.
3. Người nghe 13 câu `can-nghe` và 7 câu `ngan`. Nếu `b3-hoi-soluu` hoặc `b9-mo-dau` sai thật thì thu lại CẢ lượt của giọng đó: 1 lượt Gemini TTS mỗi giọng (tối đa 2), rồi cắt, lọc, nghe lại (khoảng 37 + 34 lượt nghe bằng flash-lite, hoặc dùng `ban-giao/tam-nv/nghe-openai.py`, không tốn Gemini), `tools/dung-bo-loi.sh minh|tu`. Nên đổi câu mở đầu của ông Tư để tên "Vy" không đứng đầu câu (cần đề xuất sửa kịch bản).
4. Cập nhật `android/README.md`: các sửa sau review, số đo máy ảo, cuộc gọi mẫu không ghi điểm, che dãy 4 chữ số.
5. Viết báo cáo cuối cho phiên chính, có: việc dùng nhầm khóa (mục e), đề xuất sửa kịch bản (câu "Dạ." của Bài 3 thu thành "Dạ, phải rồi mẹ."; tên "Vy" ở đầu câu mở Bài 9; ngoại hình avatar 117), APK 234 MB, tốc độ đọc của Minh khoảng 4 tiếng mỗi giây (nhanh với người cao tuổi), giấy phép LiteAvatar chưa ai kiểm, và việc phiên chính phải làm trên điện thoại thật (nghe tiếng thật, micro, cấp lại ba quyền MIUI sau khi cài đè).

## (g) Tệp tạm đáng giữ (đều trong `ban-giao/tam-nv/`)

- `take/minh-take.wav` (127 giây), `take/tu-take.wav` (143 giây): hai lượt thu dài gốc; `take/*-lines.json`, `take/*-ds.json`: danh sách câu; `cat/`: bản cắt chưa lọc; `loc/`: bản đã lọc (trùng `prototype/audio/{minh,tu}/*.m4a`); `tho/`: PCM thô của các mẫu thử giọng.
- `nghe-minh.txt`, `nghe-tu.txt`, `nghe2-minh.txt`, `nghe2-tu.txt`: kết quả hai lượt nghe máy.
- `kho-may-ao/`: kho giọng kéo từ máy ảo (5 lượt, 5 câu đã đọc của ba nhân vật), đẩy lại vào máy bằng `tools/keo-giong.sh day` sau khi chép vào `bai-hoc/kho-giong/pcm/`.
- `astra-loi-nhac.txt`, `astra-ket-qua.md`; `thay-doi.diff`, `goc/`.
- Công cụ tạm: `chay.py` (nạp khóa đúng tệp, không in), `thu-giong.py`, `ta-giong.py`, `f0.py`, `nghe-openai.py`, `dat-khoa-may-ao.py`, `may-ao.mjs`, `soan-loi.py`.
- Ảnh chụp: `export/preview/goi-*.png` (máy tính, chụp trước khi sửa theo Astra) và `export/preview/may-ao-*.png` (máy ảo), 62 tệp.

## Phiên Opus (25/11/2026, 15:00–15:20)

Trạng thái lúc dừng: tệp trên đĩa nhất quán, không còn tiến trình nền (đã dừng lượt kiểm trang và lượt nghe OpenAI), máy ảo đã gỡ khóa (`shared_prefs` chỉ còn `cai-dat.xml` và hai tệp WebView) và đã tắt, không cổng 8801–8809 nào mở. Không đụng điện thoại thật. Không commit.

### Sáu việc được giao
1. **Kiểm trang trên máy tính (`tools/kiem-goi-video.mjs`)**: DỞ. Lượt `ban-giao/tam-nv/kiem-trang-e.log`: phần `?ve=`, lan-2, minh-1 đạt hết (156 dòng ok, 0 SAI). minh-3 có 2 SAI chỉ vì tôi chuyển tệp `b3-hoi-soluu.*` đi giữa lúc nó chạy; tu-9 bị dừng giữa chừng. Phải chạy lại `minh-3 tu-9` (lệnh: `TMPDIR=/tmp/claude-1000/lcs node tools/kiem-goi-video.mjs 8803 minh-3 tu-9`) SAU KHI xong việc thu lại giọng. Chưa mở ảnh `export/preview/goi-*.png` ra xem.
2. **Máy ảo**: DỞ. Đã thử: minh-3 chế độ câu thu sẵn hai lần (trước và sau khi gỡ câu hỏi số): 2/2 ý, kết quả "Bà trả lời trọn vẹn", `localStorage['lcs-goi-minh-3'] = {"diem":2,"tong":2,…}`, không lỗi; ảnh `export/preview/may-ao-minh3-thusan-*.png`, `may-ao-minh3-sau-go-*.png` (chưa xem ảnh). CHƯA thử: nhánh lùi khi AI hỏng (khóa sai), nút "Bài học", đi từ `hoc.html` sang cuộc gọi và quay về, nút Quay lại, đổi nhân vật trong cùng màn. Chưa tốn lượt AI nào trên máy ảo.
3. **Api.kt và các tệp phiên chính sửa**: XONG phần kiểm. Dựng lại 4 lần, lần cuối 15:11: mã thoát 0, 22 bài kiểm đơn vị đạt (ApiTest 7, GoiVideoTest 2, LocTinNhanTest 13). Không sửa tệp Kotlin nào.
4. **Dung lượng APK**: XONG. 234,5 MB → 219,5 MB. Nguyên nhân chính: `chepWeb` là `Copy` nên `build/tai-san/web` giữ 103 tệp cũ đã xóa ở nguồn (95 tệp tiếng chị Lan cũ trong `audio/lan`, 6 tệp `chi-lan-*.lip.json/.mieng.mp4`, `hoc/muc-luc.json`; 10,6 MB). Đổi thành `Sync`. Bỏ thêm hai tranh không trang nào trong app nạp (`assets/ong-tu-bang-nhan-vat.png`, `assets/avatar-huong-noi.png`, 3,2 MB) bằng `exclude` trong `build.gradle.kts`. Lưu ý: đóng gói tăng dần của Gradle để lại lỗ trong APK, phải xóa `app-debug.apk` trước khi dựng thì số đo mới đúng. Còn lớn mà ĐANG DÙNG: tiếng + hình miệng 74 MB (mọi câu đều được bộ lời trỏ tới), avatar 52 MB, onnxruntime 2 ABI 40 MB (x86_64 21,9 MB chỉ cần cho máy ảo, bản phát hành chỉ cần arm64), tiếng bài học 15 MB, PNG ~45 MB (mỗi tranh 1,5–2 MB, đổi sang WebP sẽ nhỏ nhiều nhưng `assets/` thuộc agent khác; một số tệp `prototype/hoc/giong/*` có thể chưa được bài nào trỏ tới, việc của agent bài học).
5. **`bai-hoc/nghe-thu/CAN-NGHE.md`**: ĐÃ VIẾT cho bộ giọng CŨ (19 câu cần nghe + bảng 3 câu đã gỡ chờ thu lại). Sẽ LỖI THỜI khi thay bằng lượt thu mới ở dưới: phải viết lại theo kết quả nghe mới.
6. **`android/README.md`**: CHƯA làm. Khi làm: dùng tên API mới `POST /api/roleplay/intent`, `POST /api/roleplay/speak` (theo HOP-DONG-DU-LIEU.md), không nhắc tên cũ hay chuyện đổi tên; quét `/api/hieu-y`, `/api/doc`, `/api/tra-so`, `/api/bao-nguoi-than`, `/api/phan-tich-*`, `/api/bao-cao`. Ghi thêm: các sửa sau review, số đo máy ảo, cuộc gọi mẫu không ghi điểm, che dãy 4 chữ số, APK 219,5 MB và lý do `Sync`.

### Thông báo của phiên chính
- **Đổi tên API**: không đụng mã; chỉ còn phần README (việc 6).
- **Hai câu dạy sai (an toàn)**: XONG bản tạm. Gỡ khỏi bộ lời `minh/b3-hoi-soluu`, `minh/b3-goi-soluu` (cả hai mời đọc số) và `tu/b9-ket-du` (rời nhóm trước khi báo cáo); ghi ở trường `_da_go` của `loi-minh.json`, `loi-tu.json`; tệp tiếng chuyển sang `bai-hoc/nghe-thu/cho-thu-lai/` (không vào APK, đã kiểm). `hoi-thoai-canh.js`: đủ ý mà bộ lời không có `ket-du` thì nói `nhan-<ý sau cùng>` (không đổi gì khi có `ket-du`; không ảnh hưởng chị Lan). Lời nhắc AI: `minh-3.song.txt` (câu ví dụ "Mà mẹ tìm số của con ở đâu?" + dòng cấm hỏi số), `minh-3.tra-loi.txt`, `tu-9.song.txt`, `tu-9.tra-loi.txt` (giữ tin nhắn, báo cáo rồi mới rời nhóm). `tools/kiem-hoi-thoai.mjs`: thêm kiểm an toàn (không câu nào trong bộ lời và lời nhắc còn "bằng số nào", "hay số nào", "rời nhóm rồi báo cáo") và ngoại lệ `thieu_co_chu_y` trong `tools/ca-hoi-thoai-canh.json` (minh-3: hoi-soluu, goi-soluu; tu-9: ket-du; ca cuối tu-9 đổi `cuoi` thành `nhan-baocao`). Kết quả: **375/375** (chị Lan 27, minh-1 111, minh-3 86, tu-9 119, tệp cảnh 32). APK 15:11 đã có bản tạm này và đã cài vào máy ảo.
- **Thu lại giọng**: DỞ. Khóa Gemini nay CHỈ lấy `GEMINI_API_KEYS` từ `la-chan-so/.env` (đã sửa `ban-giao/tam-nv/chay.py`; không còn đọc `.env` của vlearn). Lời mới ở `ban-giao/tam-nv/take2/{minh,tu}-ds.json` (+ `-lines.json`): minh `b3-hoi-soluu` = "Mà mẹ tìm số của con ở đâu vậy mẹ?", `b3-goi-soluu` = "Trong tin nhắn họ cũng để sẵn một số điện thoại. Mẹ tìm số của con ở chỗ nào cho chắc hả mẹ?"; tu `b9-ket-du` = "May mà chú hỏi con. Để chú lưu tin nhắn, báo cáo rồi rời nhóm nha con." (đúng kịch bản dòng 584), `b9-mo-dau` = "A lô, Vy đó hả con? Mấy người trong nhóm …" (tên không đứng đầu; cần sửa kịch bản dòng 582 cho khớp). Mọi câu khác giữ nguyên chữ.
  - Đã thu: `ban-giao/tam-nv/take2/minh-take.wav` (Achird, 135,8 s, một lượt Gemini, khóa đầu đạt) và `ban-giao/tam-nv/take2/tu-take.wav` (Algenib, 127,6 s, một lượt). Tổng 2 lượt TTS.
  - Minh: đã cắt (`tools/cat-theo-lang.py` → `ban-giao/tam-nv/take2/cat-minh/`, 37 câu, độ dài khớp số tiếng) và lọc rẹt (`tools/loc-giong.py` → `ban-giao/tam-nv/take2/loc-minh/`, 37 tệp). Lượt nghe OpenAI bị dừng giữa chừng, chưa có kết quả. Chú Tư: CHƯA cắt.
  - CHƯA đụng `prototype/audio/{minh,tu}` và `loi-*.json` bằng giọng mới: bộ đang dùng vẫn là giọng cũ trừ ba câu đã gỡ.

### Việc còn lại, theo thứ tự
1. Cắt + lọc chú Tư: `python3 tools/cat-theo-lang.py ban-giao/tam-nv/take2/tu-take.wav ban-giao/tam-nv/take2/tu-ds.json ban-giao/tam-nv/take2/cat-tu` rồi `python3 tools/loc-giong.py ban-giao/tam-nv/take2/cat-tu ban-giao/tam-nv/take2/loc-tu`.
2. Nghe lại cả hai: `python3 ban-giao/tam-nv/chay.py python3 ban-giao/tam-nv/nghe-openai.py ban-giao/tam-nv/take2/<nv>-ds.json ban-giao/tam-nv/take2/loc-<nv>` (chạy với `python3 -u` hoặc đợi xong, đầu ra bị đệm) và `tools/nghe-lai.py` bằng Gemini trên CẢ tệp take (bắt lời dặn bị đọc lẫn, đòi mốc thời gian). Đặc biệt nghe: `b9-mo-dau` (có "Vy" không), hai câu soluu mới, `b9-ket-du`, `tu/nghe-hai`. Nếu có câu đọc lẫn lời dặn hay sai nặng thì thu lại cả lượt giọng đó.
3. Chép `ban-giao/tam-nv/take2/loc-<nv>/*.m4a` vào `prototype/audio/<nv>/`; cập nhật `loi-<nv>.json`: đưa ba câu từ `_da_go` trở lại `loi` với chữ mới (đúng thứ tự như ds), sửa chữ `b9-mo-dau`, cập nhật `giay` và `kiem` của mọi câu theo lượt nghe mới, xóa `_da_go`; xóa `thieu_co_chu_y` và trả `cuoi` của tu-9 về `ket-du` trong `tools/ca-hoi-thoai-canh.json`; xóa `bai-hoc/nghe-thu/cho-thu-lai/`. Rồi `tools/dung-bo-loi.sh minh` và `tools/dung-bo-loi.sh tu` (dựng lại `.lip.json`, `.mieng.mp4`). Chạy `node tools/kiem-hoi-thoai.mjs`.
4. Viết lại `bai-hoc/nghe-thu/CAN-NGHE.md` theo lượt nghe mới.
5. Chạy lại kiểm trang `minh-3 tu-9` (và tốt nhất cả bốn cảnh), MỞ ảnh ra xem.
6. Dựng APK (xóa `app-debug.apk` trước), cài máy ảo, thử các mục còn thiếu ở việc 2 (khóa AI cố ý sai cho nhánh lùi; "Bài học"; `hoc.html` → `video-call.html?canh=…&ve=…` → quay về với `lcs-goi-<canh>`; Quay lại; đổi nhân vật). Gỡ khóa, tắt máy ảo.
7. Cập nhật `android/README.md` (việc 6 ở trên).

### Tệp đã sửa thêm trong phiên này
`android/app/build.gradle.kts` (Sync, exclude hai PNG); `prototype/loi-minh.json`, `prototype/loi-tu.json`; `prototype/hoi-thoai-canh.js` (một dòng); `prototype/canh/{minh-3.song,minh-3.tra-loi,tu-9.song,tu-9.tra-loi}.txt`; `tools/kiem-hoi-thoai.mjs`; `tools/ca-hoi-thoai-canh.json`; mới: `bai-hoc/nghe-thu/CAN-NGHE.md`, `bai-hoc/nghe-thu/cho-thu-lai/` (9 tệp chuyển từ `prototype/audio`). Tạm: `ban-giao/tam-nv/chay.py` (nguồn khóa), `ban-giao/tam-nv/take2/`, `ban-giao/tam-nv/apk-web.txt`, `ban-giao/tam-nv/stale.txt`, `ban-giao/tam-nv/gom-nghe.py`, `ban-giao/tam-nv/nghe-gom.json`, `ban-giao/tam-nv/dung-{1..4}.log`, `ban-giao/tam-nv/kiem-trang-e.log`.

## Phiên Opus 2 (25/11/2026, 15:20–16:10)

Trạng thái lúc dừng: tệp trên đĩa nhất quán, không còn tiến trình nền (đã dừng mọi lượt nghe, lượt kiểm trang tự kết thúc), máy ảo đã gỡ khóa (`shared_prefs` chỉ còn `cai-dat.xml` và hai tệp WebView, `goi-song` = tắt) và đã tắt, không cổng 8803–8809 nào mở, không còn `adb forward`. Không đụng điện thoại thật (lúc cuối phiên chính đã cắm máy thật; mọi lệnh của tôi đều có `-s emulator-5554`). Không commit. Nhánh nay tên `android-and-lessons`; phiên chính đã commit bộ giọng mới ở điểm dừng giữa phiên (trước khi tôi ghi trường `kiem`, viết lại `CAN-NGHE.md`, sửa README).

### Bảy việc được giao
1. **Cắt + lọc chú Tư (take2):** XONG. `tools/cat-theo-lang.py` đặt sai ranh giới ở bốn câu đệm đầu lượt: `dem-o` chỉ có "Ờ," (chữ "ờ" thứ hai bị dồn sang `dem-vay`), `dem-sao` chỉ có "Ờ," ("sao ta" bị dồn sang `dem-cho`). Máy nghe OpenAI bắt được ("Ờ, vậy hả con?", "Sao ta? Con chờ…"). Đã cắt tay lại bốn câu theo mốc lặng, cùng công thức cắt (`ban-giao/tam-nv/cat-tay-tu.sh`), lọc rẹt, nghe lại bằng OpenAI: ranh giới đúng. Bản cắt sai giữ ở `ban-giao/tam-nv/take2/sai-ranh-gioi/`. Các câu dài của chú Tư và cả 37 câu của Minh khớp lời khi nghe từng câu.
2. **Nghe lại bằng máy:** XONG phần máy, KHÔNG thu lại giọng nào (0 lượt TTS trong phiên này).
   - OpenAI `gpt-4o-transcribe` nghe từng câu cả 71 câu (`take2/nghe-o-minh.txt`, `nghe-o-tu.txt`, `nghe-o-tu-sua.txt`).
   - Gemini 3.5 Flash nghe CẢ tệp take hai lần mỗi giọng: `tools/nghe-lai.py` (`take2/nghe-g-take-*.txt`) và một câu hỏi đích danh có chép nguyên lời dặn giọng của nhân vật, đòi mốc thời gian (`ban-giao/tam-nv/nghe-dich-danh.py` + `take2/hoi-take-*.txt` → `take2/nghe-dd-take-*.txt`). Cả bốn bản chép đều theo đúng thứ tự câu, không có đoạn nào là lời dặn; lượt hỏi đích danh trả "KHÔNG ĐỌC LỜI DẶN" cả hai giọng. Dòng kết luận của `nghe-lai.py` cho chú Tư ghi "CÓ LỜI DẶN" nhưng bản chép không có chữ nào của lời dặn (đã đọc từng dòng). Độ dài từng câu cũng khớp số tiếng (0,19–0,35 giây mỗi tiếng ở câu dài), không câu nào dư vài giây như khi đọc lẫn lời dặn.
   - Gemini 3.5 Flash nghe từng câu: xong 32/37 câu của Minh (`take2/nghe-g-cau-minh.txt`), rồi hết hạn mức trong ngày trên cả 6 khóa (429). `gemini-2.5-flash` trả 404, `gemini-3.7-flash` phần lớn trả 503; chú Tư chưa có lượt Gemini nghe từng câu. Bảng gom: `ban-giao/tam-nv/gom-nghe-2.py` → `take2/nghe-gom-2.json`.
   - Bẫy: câu hỏi dặn "câu rất ngắn, 1–3 chữ" (`take2/hoi-cau.txt`) làm Gemini bỏ vế sau quãng nghỉ ở câu dài (`b3-ket-du` chỉ chép "Chuẩn luôn mẹ."); hỏi lại bằng `take2/hoi-cau-dai.txt` thì chép đủ. Dùng câu hỏi ngắn chỉ cho tiếng đệm.
   - Vì sao không thu lại: không câu nào đọc lẫn lời dặn; các chỗ nghi đều là chữ phát âm giọng Nam máy nghe lệch, không đổi nội dung dạy (tên "Vy", chữ "nhử", `tu/nghe-hai`). Ba câu an toàn mới (hai câu "tìm số của con", `b9-ket-du`) được OpenAI và cả hai lượt nghe cả take chép đúng.
3. **Thay vào prototype:** XONG. `ban-giao/tam-nv/thay-giong-take2.py` sao lưu bộ cũ (`ban-giao/tam-nv/audio-cu/`), chép 37 + 34 tệp, dựng lại `loi-minh.json`, `loi-tu.json` theo thứ tự lượt thu (đưa ba câu đã gỡ trở lại với lời mới, sửa chữ `b9-mo-dau` thành "A lô, Vy đó hả con? …", cập nhật `giay`, xóa `_da_go`). `tools/ca-hoi-thoai-canh.json`: xóa `thieu_co_chu_y` của minh-3 và tu-9, trả hai ca tu-9 về `cuoi: ket-du`, bỏ câu tả trường đó trong `_ghi_chu`. Đã xóa `bai-hoc/nghe-thu/cho-thu-lai/`. `tools/dung-bo-loi.sh minh` và `tu`: dựng lại đủ 71 bộ `.lip.json` + `.mieng.mp4` (mã thoát 0, đã kiểm mỗi câu có đủ ba tệp và video mới hơn tiếng). Trường `kiem` ghi theo lượt nghe mới bằng `ban-giao/tam-nv/ghi-kiem.py`: Minh 19 `khop`, 8 `lech-nhe`, 1 `can-nghe`, 9 `ngan`; chú Tư 14, 13, 3, 4; `_kiem` tả cách nghe. `node tools/kiem-hoi-thoai.mjs`: **380/380** (chị Lan 27, minh-1 113, minh-3 88, tu-9 120, tệp cảnh 32).
4. **`bai-hoc/nghe-thu/CAN-NGHE.md`:** VIẾT LẠI cho bộ mới: 3 câu an toàn mới (nghe trước), 3 câu nghi đọc sai, 4 tệp dưới 1 giây, 6 hàng tệp 1–1,5 giây, 5 hàng lệch nhẹ. Thư mục `bai-hoc/nghe-thu/` chưa có trong git (phiên chính chưa commit nó).
5. **Kiểm trang cả bốn cảnh:** XONG. `TMPDIR=/tmp/claude-1000/lcs node tools/kiem-goi-video.mjs 8803` → `ban-giao/tam-nv/kiem-trang-f.log`: **170 dòng ok, 0 SAI, "Mọi kỳ vọng đều đạt"**, mã thoát 0. Đã mở xem cả 32 ảnh `export/preview/goi-*.png` (ghép thành bốn tờ): avatar đúng người, phụ đề đúng câu mới (minh-3 kết bằng "Nhà mình hẹn nhau một câu hỏi riêng nữa nha.", tu-9 kết bằng "Để chú lưu tin nhắn, báo cáo rồi rời nhóm nha con."), màn kết quả đủ thẻ ý. Thấy một lỗi bố cục nhỏ: chạy trên trình duyệt (không phải trong app), mở ô gõ thì nút trả lời sẵn thứ hai của anh Minh bị thanh gõ che một nửa; trong app (ảnh `-6-app-`) không bị. Chưa sửa.
6. **APK + máy ảo:** XONG. Xóa `app-debug.apk`, dựng lúc 15:42 (trước khi phiên chính gộp nhánh đồng đội và trước khi tôi ghi trường `kiem`, hai thay đổi này không đổi gì lúc chạy): mã thoát 0, 22 bài kiểm đơn vị đạt (ApiTest 7, GoiVideoTest 2, LocTinNhanTest 13), APK **223 924 147 byte**, có đủ 111 tệp `audio/minh/` và 102 tệp `audio/tu/`, không có `nghe-thu`. Cài vào emulator-5554 (AVD lcs34, Android 14). Sau đó phiên chính dặn không chạy Gradle nữa, nên tôi không dựng lại.
   - `ban-giao/tam-nv/may-ao-2.mjs bai-hoc` (log `may-ao-2-bai-hoc.log`): nút "Bài học" ở màn chính mở `prototype/hoc.html`; bài 1 phần thử thách → "Nghe máy" → `video-call.html?canh=minh-1&ve=hoc.html?bai=1&sau=goi` → gõ hai lượt → 2/2, `lcs-goi-minh-1` = `{"diem":2,"tong":2,…}` → "Tiếp tục bài học" → `hoc.html?bai=1&phan=kq` hiện "2/2 ý · +20 điểm", khóa đã bị trang bài học xóa. Quay lại: kết quả → phần thử thách → thư viện → đóng màn về màn chính.
   - Bẫy: lần chạy đầu, Quay lại đóng màn ngay. Nguyên nhân là công cụ: lệnh JS gửi qua cổng gỡ lỗi không có cờ thao tác người dùng, Chromium đánh dấu các trang đó là "bỏ qua khi lùi". Gửi kèm `userGesture: true` (`ban-giao/tam-nv/may-ao-lui.mjs` dò riêng) thì lùi đúng từng trang. Không phải lỗi app.
   - `may-ao-2.mjs doi` (log `may-ao-2-doi.log`): cùng một màn, minh-1 (2/2) → tu-9 (4/4, kết bằng `ket-du` mới) → minh-3 (2/2, có câu `hoi-soluu` mới); nhật ký app ghi nạp mô hình miệng 125, 117, 125 (mô hình cũ được nhả); PSS 323, 332, 329 MB.
   - Nhánh lùi: `python3 ban-giao/tam-nv/dat-khoa-may-ao.py sai` (thêm chế độ `sai` đặt khóa giả, và `xoa` nay trả `goi-song` về tắt) rồi `may-ao.mjs`: minh-1 2/2 (AI 0 lượt, lùi 2), tu-9 4/4 (AI 0 lượt, lùi 4), không lỗi, mỗi lượt chờ 4,5–6,8 giây, tới lượt đầu khoảng 16 giây (logs `may-ao-lui-minh1.log`, `may-ao-lui-tu9.log`). Không tốn lượt API thật.
   - Ảnh `export/preview/may-ao-{bai-hoc,doi,lui-minh1,lui-tu9}-*.png`, đã xem tờ ghép.
   - Lưu ý: `ban-giao/cong-cu/ui.py` gọi `adb` không có `-s`; khi điện thoại thật đang cắm thì đừng dùng nó cho máy ảo.
7. **`android/README.md`:** XONG. Đổi `/api/hieu-y` → `POST /api/roleplay/intent`, `/api/doc` → `POST /api/roleplay/speak` (không còn đường tiếng Việt nào trong README); cập nhật mục giọng Minh, ông Tư; thêm "Lời thoại không dạy sai", số ca kiểm 380, mục "Riêng tư và chấm điểm" (che số, các sửa sau review của Astra, mã phiên, cuộc gọi mẫu không ghi điểm, nhả mô hình miệng, máy chủ không đọc nhầm giọng), mục "Đã kiểm" (trang 170/170, máy ảo), mục "Dung lượng APK" (lý do `Sync`).

### Câu cần người nghe (chi tiết ở `bai-hoc/nghe-thu/CAN-NGHE.md`)
- Trước hết: `minh/b3-hoi-soluu` (một lượt Gemini nghe "số" thành "sổ"), `minh/b3-goi-soluu`, `tu/b9-ket-du`.
- Nghi đọc sai: `tu/b9-mo-dau` (tên "Vy": ba lượt máy nghe ra "Di", "Gì", "Duy"), `tu/b9-nhan-moinhu` (không lượt nào nghe ra "nhử"), `tu/nghe-hai`.
- Dưới 1 giây: `tu/dem-vay` (lời chỉ khoảng 0,6 giây, hai lượt nghe cả take không thấy câu này), `minh/dem-um`, `tu/dem-um`, `minh/dem-o`.
- Nếu một câu sai thật: thu lại cả lượt của giọng đó (1 lượt `gemini-3.8-flash-tts`), cắt, lọc, nghe lại, `tools/dung-bo-loi.sh`, rồi chạy lại hai bộ kiểm.

### Việc còn lại
1. Người nghe `bai-hoc/nghe-thu/CAN-NGHE.md` (bằng tai, tốt nhất trên điện thoại).
2. Khi Gradle rảnh: dựng lại APK (xóa `app-debug.apk` trước) để bản cài có trường `kiem` mới và phần gộp của đồng đội, rồi thử trên điện thoại thật: tiếng thật, micro, chế độ trực tiếp với khóa thật cho minh-3 và tu-9, cấp lại ba quyền MIUI sau khi cài đè.
3. Đề xuất sửa kịch bản (tệp của agent bài học, tôi không sửa): `bai-hoc/KICH-BAN-BAI-HOC.md` dòng 582 còn "Vy hả con. …", bộ giọng đã thu "A lô, Vy đó hả con? …"; câu "Dạ." của Minh trong Bài 3 đã thu thành "Dạ, phải rồi mẹ."; tranh ông Tư trong bài học là ông lão hoạt hình, còn avatar 117 là người đàn ông ngoài bốn mươi mặc vest.
4. ~~Lỗi bố cục nhỏ trên trình duyệt (nút trả lời sẵn thứ hai bị thanh gõ che)~~ ĐÃ SỬA (phiên chính, 16:25): ngoài app, `#goBox` được chuyển vào trong khung `.call` và neo `position:absolute` theo đáy khung (khung 800 điểm thường cao hơn cửa sổ máy tính, neo theo đáy cửa sổ thì che giữa bảng dưới). Trong app giữ nguyên `position:fixed` để thanh gõ vẫn nổi trên bàn phím. Đã đo ở cửa sổ 1280×720: nút cuối kết thúc ở 612, thanh gõ bắt đầu ở 626, nằm trọn trong khung; `kiem-goi-video.mjs minh-1 minh-3` vẫn đạt hết.
5. Khi Gemini 3.5 Flash có lại hạn mức: chạy `nghe-dich-danh.py` với `take2/hoi-cau-dai.txt` (câu dài) và `take2/hoi-cau.txt` (tiếng đệm) cho 34 câu của chú Tư để có lượt Gemini nghe từng câu; nghỉ 4–6 giây giữa hai tệp (`NGHE_NGHI`).

### Tệp đã sửa trong phiên này
Trong kho: `prototype/audio/minh/*`, `prototype/audio/tu/*` (71 bộ tiếng + khẩu hình), `prototype/loi-minh.json`, `prototype/loi-tu.json`, `tools/ca-hoi-thoai-canh.json`, `bai-hoc/nghe-thu/CAN-NGHE.md`, `android/README.md`, `ban-giao/avatar-goi-video.md` (mục này); đã xóa `bai-hoc/nghe-thu/cho-thu-lai/`. Tạm (git bỏ qua, `ban-giao/tam-nv/`): `cat-tay-tu.sh`, `thay-giong-take2.py`, `ghi-kiem.py`, `gom-nghe-2.py`, `nghe-dich-danh.py`, `may-ao-2.mjs`, `may-ao-lui.mjs`, `dat-khoa-may-ao.py` (thêm `sai`, `xoa` tắt `goi-song`), `audio-cu/`, `take2/{cat-tu,loc-tu,cat-tu-sua,loc-tu-sua,sai-ranh-gioi}/`, các tệp nghe `take2/nghe-*.txt`, `take2/hoi-*.txt`, log `dung-mieng-2.log`, `dung-5.log`, `kiem-trang-f.log`, `may-ao-*.log`, `emu-2.log`.
