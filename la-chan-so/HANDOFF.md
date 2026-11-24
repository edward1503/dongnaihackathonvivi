# Bàn giao Lá chắn số (13:28, 24/11/2026)

## (a) Đã xong và đã kiểm chứng
- 53 khung trong `screens/*.html` (D01–D05, A01–A12 gồm A11a–A11i, Z01, W01–W03, E01). Xuất bằng `tools/export.mjs`, rà bằng `AUDIT=1`: sạch lúc 13:18.
- Bản xuất: `export/svg` (kéo vào Figma), `export/png` (2x). Ảnh trước khi sửa theo Astra: `export/before/`.
- `export/La-chan-so-thiet-ke-du-phong.pdf`: dựng lúc 13:05, CHƯA có A11h, A11i bản mới. Dựng lại theo lệnh ở (c).
- Tranh vẽ mới với linh vật Bé Nai: `assets/comic1-*`, `comic2-*`, `comic3-*`, `spot-*`, `mascot-stop|think|cheer.png`, `avatar-huong*.png`, `avatar-chi-lan.png`. Tranh cũ (tê tê/khiên) ở `assets/old/`.
- Ảnh từ avatar của repo vlearn (mã 21): `assets/video-chi-lan.jpg`, `assets/video-chi-lan-mat.jpg`.
- Giọng (`prototype/audio/`), mỗi file đã chép lại bằng Gemini để kiểm:
  - `chi-lan-1..3.m4a`: chị Lan.
  - `benai-1..13.m4a`: Bé Nai, thứ tự câu theo `tools/lines-benai.json`.
  - `vy-1..3.m4a`: Vy, học sinh trả lời mẫu cho demo; `vy-2` đã cắt bỏ phần thừa.
- `prototype/video-call.html`: lip sync thật bằng avatar 21, phát `chi-lan-*`. Subagent đã kiểm trên Chromium headless; ảnh `export/preview/lipsync-*.png`. Phải mở qua http, không chạy được với `file://`. Avatar và runtime nằm ở `vendor/vlearn-avatar/` (39 MB).
- Thuyết minh `thuyet-minh.md` / `.docx`, 3 trang, đã có Bé Nai, phần học như chơi game, gọi video cuối bài. Còn trống: mã đội, công cụ AI khác.
- Kịch bản thoại: `KICH-BAN-THOAI.md`. Review của Astra: `tools/astra-*.md`.

## (b) Đang dở
- **Subagent prototype bấm được (fork):** đã nhắn dừng lúc 13:28. Nó sửa `prototype/index.html`, `motion.js`, và tạo mới `prototype/mock-data.js`, `prototype/hotspots.js`. Mục tiêu:
  - chế độ dùng thử tự do, đổi vai Hoa/Vy/Minh/Khoa;
  - ô kiểm tra tra dữ liệu mock (0912 345 678 → A07a; `.top` → A07b; 1900 5555 88 → A07c; còn lại → A07d);
  - phát giọng Bé Nai theo bảng ở (d);
  - nối `video-call.html` vào luồng học sinh.
  Chưa rõ làm tới đâu; xem báo cáo của nó hoặc mở trang để thử.
- **Subagent video-call:** đã nhắn dừng. Đang thêm chế độ "Chạy demo tự động": Lan 1 → Vy 1 → Lan 2 → Vy 2 → Lan 3 → Vy 3, rồi tới bảng điểm A11i với 3/4 ý; ý chưa đánh dấu là "Cách xác minh". Có thể còn dở.
- `la-chan-so-ban-giao.zip` dựng lúc 13:05, CHƯA có video-call, audio, vendor, HANDOFF.

## (c) Lệnh
- Xuất khung và rà lỗi bố cục: `cd la-chan-so && AUDIT=1 node tools/export.mjs [MÃ…]`. Bỏ mã thì xuất tất cả; ví dụ `node tools/export.mjs A11`. Thêm `CHECK=1` để dựng lại từ SVG, kết quả ở `export/check/`.
- Máy chủ: `cd la-chan-so && python3 -m http.server 8000`.
  - Prototype: `http://localhost:8000/prototype/index.html`.
  - Gọi video: `http://localhost:8000/prototype/video-call.html`.
- Một khung có chuyển động: `screens/<file>.html?frame=<data-name>`.
- Kiểm prototype bằng Chromium headless: `node tools/check-proto.mjs` (do subagent viết).
- PDF dự phòng: `ORDER="export/png/D01-bia-y-tuong.png export/png/D02-luong-chinh.png export/png/D05-khi-nao-len-tieng.png export/png/D03-design-system.png export/png/D04-chuyen-dong.png $(ls export/png/A*.png export/png/Z*.png export/png/W*.png export/png/E*.png)"; magick $ORDER -units PixelsPerInch -density 144 -quality 88 -compress jpeg export/La-chan-so-thiet-ke-du-phong.pdf`
- Thuyết minh .docx: `python3 tools/md2doc.py thuyet-minh.md > thuyet-minh.html && soffice --headless --convert-to 'docx:MS Word 2007 XML' thuyet-minh.html`
- Zip: `zip -qr la-chan-so-ban-giao.zip export/svg export/png export/La-chan-so-thiet-ke-du-phong.pdf prototype vendor motion.css motion.js icons.js ds.css screens assets thuyet-minh.docx thuyet-minh.md HUONG-DAN-FIGMA.md KICH-BAN-THOAI.md HANDOFF.md tools/astra-review.md tools/astra-thao-luan-1.md tools/astra-thao-luan-2.md`
- Vẽ tranh: `codex exec --skip-git-repo-check -s workspace-write -C la-chan-so -m gpt-6.1-sol -i assets/spot-mascot.png -i tools/refs/style-panel.png … - < prompt.txt`. Quy tắc vẽ trong `tools/STYLE-TETE.txt` (đã đổi sang Bé Nai); ảnh mẫu phong cách ở `tools/refs/`.

## (d) Thu giọng TTS
- **Khóa:** `GEMINI_API_KEYS` (và `GEMINI_BASE_URL` nếu có) trong `/run/media/rin/Rin/AI-Thuc-Chien/vlearn-lesson-lab/.env`. Người dùng cho phép dùng tạm. Nạp bằng `set -a; . <đường dẫn .env> >/dev/null 2>&1; set +a`. Không in khóa ra.
- **Model:** `gemini-3.8-flash-tts`, dự phòng `gemini-3.1-flash-tts-preview`.
- **Cách viết prompt:** "# DIRECTOR'S NOTES (không đọc phần này)" + kiểu giọng, rồi "# TRANSCRIPT" + lời. Không có phần này thì máy đọc luôn cả lời dặn.
- **Thu lượt dài rồi cắt** (người dùng dặn, để giọng không lệch tông): `python3 tools/gemini_take.py <giọng> "<kiểu giọng>" prototype/audio/<tiền tố> tools/lines-<x>.json`. Nếu cắt sai thì `python3 tools/split_take.py <take.wav> <lines.json> <tiền tố>`.
- **Câu lẻ (giọng chị Lan):** `tools/gemini_tts.py`.
- **Kiểm lại bằng chép lời:** `python3 tools/gemini_stt_check.py <file…>`.
- **Giọng từng nhân vật:**
  - Bé Nai: `Leda`, trong trẻo, dễ thương, chậm rõ với người già.
  - Vy: `Zephyr`.
  - Chị Lan: `Aoede`, giống avatar 21.
- **Bé Nai dùng ở đâu:**
  - A11e: 1 rồi 2.
  - Cảnh 2: 3.
  - A11c: 4.
  - A11f: 5 rồi 6.
  - Sau khi chọn đúng: 7 rồi 8.
  - A11i: 9.
  - A04a: 10; sau "Có" phát 11, sau "Không" phát 12.
  - A10a: 13.

## (e) Việc còn lại
**Trước 14:15:**
1. Mở `prototype/index.html` và `video-call.html` qua http, bấm thử hai luồng: người già (A01a → A03a → A04a → A04b → Z01 → A08c → A10a) và học sinh (A01b → A06a → A11a → A11e → A11c → A11f → gọi video → A11i → A12). Sửa chỗ gãy.
2. Nối `video-call.html` vào luồng học sinh nếu fork chưa làm.
3. Dựng lại PDF và zip theo (c).
4. Người dùng chưa chốt nộp bản nào: An Tâm (repo `dongnaihackathonvivi`, nhánh `thiet-ke-an-tam`, hạn đóng băng 14:15) hay Lá chắn số. Review An Tâm đã gửi người dùng trong phiên này.

**Trước 15:00:**
1. Quay video demo.
2. Nhập SVG vào Figma, xuất PDF từ Figma.
3. Điền mã đội vào thuyết minh.
4. Đặt bài vào thư mục `Doi[mã]_De4`.

## (f) Dễ làm sai
- **Thiết kế:** tranh không có chữ (lời kể là chữ thật trên giao diện); không quốc huy, không bản đồ, không logo thật, không mặt người thật. Ngoại lệ: avatar 21, chỉ cho vai chị Lan.
- **Avatar người thật:** KHÔNG dùng cho vai kẻ gian (A11g dùng avatar hoạt hình). Còn phải xem điều khoản LiteAvatarGallery trước khi công khai.
- **Linh vật:** là Bé Nai. Không dùng Lexce (linh vật của VinUni/vlearn), không dùng tê tê.
- **Người cao tuổi:**
  - ưu tiên giọng nói;
  - Bé Nai hiện to, hỏi bằng giọng, có hai nút Có/Không, không có khung chat;
  - Lá chắn tự báo người thân, bà không phải bấm;
  - "Hỏi bằng giọng nói" là công tắc trong app (hỏi lúc thiết lập, người trẻ cũng bật được).
- **Quy tắc lên tiếng:** mặc định im lặng với số chưa lưu (người lớn nhớ số chứ không lưu; shipper hay bị báo oan); 5 mức, trang D05.
- **Học sinh:** học như chơi game (truyện có giọng kể, điểm rẽ, ngõ cụt, nhập vai có chấm). Gọi video với chị Lan là bài kiểm tra cuối bài, kèm bảng điểm tự chấm.
- **Xếp hạng:** theo nhóm tự lập trong trường / phường / thành phố, không theo tên lớp.
- **Giọng:** thoại tự nhiên, dễ hiểu; thu lượt dài rồi cắt; "thành phố Đồng Nai" chứ không phải "tỉnh".
- **Prototype:** dữ liệu mock, không dùng database kiểu Supabase.
- **Sửa giao diện:** do Claude sửa theo design system (`ds.css`), không để Astra/Codex tự sửa.
- **Không sửa gì** trong repo vlearn-lesson-lab hay dongnaihackathonvivi; đọc thôi.
