# Lá chắn số · Đội 18 · Đề 4

Bài dự thi vòng sơ loại Hackathon thành phố Đồng Nai 2026 (thiết kế UX/UI). Lớp bảo vệ chống lừa đảo chạy ngầm, có người thân và cộng đồng đứng sau. Dữ liệu trong bản mẫu là dữ liệu giả lập.

- Bản chạy trên mạng: https://la-chan-so-doi18.vercel.app (`/web` web quản trị, `/zalo` phía người thân, `/hoc-sinh`, `/ba-hoa`)
- Thiết kế trên Figma: https://www.figma.com/design/KqUeRMoL69j6OfeDTwWp2v

## Chạy bản mẫu tại máy

```bash
python3 may-chu.py 8018 .        # rồi mở http://127.0.0.1:8018/prototype/index.html
```

Phải mở qua `may-chu.py` (không mở thẳng tệp html): máy chủ này thêm tiêu đề COOP/COEP để khẩu hình avatar chạy đa luồng.

## Cấu trúc

| Thư mục, tệp | Nội dung |
|---|---|
| `screens/` | 53 màn thiết kế bằng HTML, dùng chung `ds.css` (design system) và `icons.js` |
| `prototype/` | Bản mẫu bấm được: vỏ `index.html`, chỗ bấm `hotspots.js`, dữ liệu giả lập `mock-data.js`, gọi video `video-call.html`, giọng `audio/` |
| `assets/` | Tranh truyện, linh vật Bé Nai, phông chữ |
| `vendor/vlearn-avatar/` | Bộ avatar khớp miệng (LiteAvatar) cho nhân vật chị Lan. Xem điều khoản của bộ avatar trước khi dùng công khai |
| `export/` | Bản xuất từng màn: `svg/` (kéo vào Figma), `png/`, và PDF 53 trang |
| `tools/` | `export.mjs` (xuất màn), `test-clicks.mjs` (kiểm bản mẫu), `dong-goi.sh` (gom thư mục nộp), công cụ thu và lọc giọng, bản review |
| `video/` | Đường dây quay video demo (quay CDP, giọng Gemini, Whisper, Remotion) và bản video nhẹ. Cách chạy: `video/CHAY-LAI.md`. Cần đặt biến `LCS_RENDER_HOST` |
| `thuyet-minh.*` | Bản thuyết minh 3 trang |
| `HANDOFF.md`, `KICH-BAN-THOAI.md`, `HUONG-DAN-FIGMA.md` | Ghi chú bàn giao, kịch bản thoại, hướng dẫn Figma |

## Kiểm tra

```bash
node tools/test-clicks.mjs       # cần chromium; đi hết ba luồng bằng cách bấm nút
AUDIT=1 node tools/export.mjs    # xuất lại toàn bộ màn và rà lỗi bố cục
```

Không đưa lên kho: khung hình quay, các bản render cũ, giọng thu thô (xem `.gitignore`). Khóa API không nằm trong kho; các công cụ đọc khóa từ biến môi trường.
