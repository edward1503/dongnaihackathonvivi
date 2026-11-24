# Lá chắn số · Đội 18 · Đề 4

Bài dự thi Hackathon thành phố Đồng Nai 2026. Lớp bảo vệ chống lừa đảo chạy ngầm, có người thân và cộng đồng đứng sau. Thư mục này là bản thiết kế 53 màn và bản mẫu bấm được của vòng sơ loại; dữ liệu trong bản mẫu là dữ liệu giả lập.

- Bản chạy trên mạng: https://la-chan-so-doi18.vercel.app (`/web` web quản trị, `/zalo` phía người thân, `/hoc-sinh`, `/ba-hoa`)
- Thiết kế trên Figma: https://www.figma.com/design/KqUeRMoL69j6OfeDTwWp2v
- Chia việc cho bản MVP 24 giờ: [`PHAN-CONG-TINH-NANG.md`](PHAN-CONG-TINH-NANG.md)
- Bản thuyết minh 3 trang: [`thuyet-minh.md`](thuyet-minh.md)

## Chạy bản mẫu tại máy

```bash
python3 may-chu.py 8018 .        # rồi mở http://127.0.0.1:8018/prototype/index.html
```

Phải mở qua `may-chu.py` (không mở thẳng tệp html): máy chủ này thêm tiêu đề COOP/COEP để khẩu hình avatar chạy đa luồng.

## Cấu trúc

| Thư mục, tệp | Nội dung |
|---|---|
| `screens/` | 53 màn thiết kế bằng HTML, dùng chung `ds.css` (design system), `icons.js`, `motion.css`, `motion.js` |
| `prototype/` | Bản mẫu bấm được: vỏ `index.html`, chỗ bấm `hotspots.js`, dữ liệu giả lập `mock-data.js`, gọi video `video-call.html`, giọng `audio/` |
| `server/` | Máy chủ và AI (Mảng 2): FastAPI, kiểm tra nhanh, phân tích tin nhắn và cuộc gọi, đồng bộ ba máy, báo cáo. Xem `server/README.md` |
| `app/` | App React (Mảng 3), 18 màn của bà Hoa và Vy, chạy trong WebView hoặc trình duyệt. Xem `app/README.md` |
| `assets/` | Tranh truyện, linh vật Bé Nai, phông chữ |
| `vendor/vlearn-avatar/` | Bộ avatar khớp miệng (LiteAvatar) cho nhân vật chị Lan. Xem điều khoản của bộ avatar trước khi dùng công khai |
| `export/` | Bản xuất từng màn: `svg/` (kéo vào Figma), `png/` (bản mẫu dùng làm ảnh dự phòng) |
| `tools/` | `export.mjs` (xuất màn), `test-clicks.mjs` và `check-proto.mjs` (kiểm bản mẫu), `dong-goi.sh` (gom thư mục nộp), `BRIEF.md` (quy ước dựng màn), công cụ thu và lọc giọng |
| `tools/ve-tranh/` | Lời dặn và ảnh mẫu phong cách để vẽ thêm tranh truyện, linh vật |
| `video/` | Đường dây quay video demo (quay CDP, giọng Gemini, Whisper, Remotion). Cách chạy: `video/CHAY-LAI.md`. Cần đặt biến `LCS_RENDER_HOST` |
| `thuyet-minh.*`, `KICH-BAN-THOAI.md`, `HUONG-DAN-FIGMA.md` | Bản thuyết minh, kịch bản thoại, hướng dẫn Figma |

## Kiểm tra

```bash
node tools/test-clicks.mjs       # cần chromium; đi hết ba luồng bằng cách bấm nút
AUDIT=1 node tools/export.mjs    # xuất lại toàn bộ màn và rà lỗi bố cục
```

## Quy ước

- **Thiết kế:** tranh không có chữ (lời kể là chữ thật trên giao diện); không quốc huy, không bản đồ, không logo thật, không mặt người thật. Ngoại lệ: avatar chị Lan, có nhãn "AI đóng vai"; không dùng avatar người thật cho vai kẻ gian.
- **Linh vật:** Bé Nai. Viết "thành phố Đồng Nai".
- **Người cao tuổi:** ưu tiên giọng nói, hai nút Có và Không, không có khung chat; Lá chắn tự báo người thân.
- **Khi nào lên tiếng:** mặc định im lặng với số chưa lưu; 5 mức, xem màn D05.
- **Xếp hạng:** theo nhóm tự lập trong trường, phường, thành phố; không theo tên lớp.
- **Giọng:** Bé Nai `Leda`, Vy `Zephyr`, chị Lan `Aoede`, lời dẫn `Kore` (Gemini TTS). Thu một lượt dài rồi cắt để giọng không lệch tông; thứ tự câu trong `tools/lines-*.json`.
- **Sửa giao diện:** theo `ds.css`; màn mới theo `tools/BRIEF.md`.

## Không nằm trong kho

Video demo, PDF 53 trang, khung hình quay, các bản render và giọng thu thô (xem `.gitignore`). Video và PDF nằm trong thư mục nộp `Doi18_De4`; PDF dựng lại được bằng `tools/dong-goi.sh`. Khóa API không nằm trong kho; các công cụ đọc khóa từ biến môi trường.
