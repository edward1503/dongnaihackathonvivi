# Đề 2 – Phản ánh hiện trường · phần của Claude

Thư mục này chỉ chứa sản phẩm Claude tạo ra. Các thư mục khác ở gốc repo (`prototype/`, `docs/`, `design_pdf/`, `server.js`…) là phần việc riêng, không nằm ở đây.

## Nội dung

| Thư mục | Là gì | Cách mở |
|---|---|---|
| `prototype/index.html` | Web prototype bấm được, 4 vai trò (Người dân, Đoàn viên, Cán bộ phường, Đơn vị xử lý) dùng chung dữ liệu, có thanh gợi ý kịch bản demo 3 phút | Mở thẳng file bằng trình duyệt. Trên điện thoại tự chuyển sang toàn màn hình |
| `ux/ho-so-ux.html` | Hồ sơ UX: sơ đồ 5 làn, vòng đời phản ánh, luồng gửi 3 bước và các nhánh lỗi, quy tắc gắn cờ tin cậy, kịch bản demo, user journey 3 nhân vật, 20 user stories có ưu tiên MVP | Mở thẳng file bằng trình duyệt |
| `slides/index.html` | Deck 18 slide 16:9 trình bày bài toán và giải pháp. Bên phải mỗi slide là màn hình prototype thật (bấm được) hoặc sơ đồ / user journey. Nút **Xuất PDF** | Mở bằng Chrome hoặc Edge. Phím ← → để chuyển slide. Xuất PDF: chọn "Lưu dưới dạng PDF", bật "Đồ họa nền" |
| `design-canvas/` | Mã nguồn 11 artboard MH-01 → MH-10 (`.dc.html`) và `canvas.json` | Chỉ hiển thị trên canvas claude.ai (cần runtime của canvas), giữ ở đây để lưu trữ |

## Bản online (riêng tư, cần bấm Share trên trang để người khác xem)

- Prototype: https://claude.ai/artifact/HwLir6w2aeD528A6ce2T9n
- Hồ sơ UX: https://claude.ai/artifact/PAagsGNtG4Xb6nRKWvf1Lr
- Canvas thiết kế: https://claude.ai/artifact/CDroX4txJ78HMWZV56qwqh

## Kịch bản demo trong prototype

1. **Người dân**: Gửi phản ánh → Chụp ảnh → Dùng ảnh này → Đúng vị trí → **+1 Đồng tình**
2. **Cán bộ phường**: chọn PA-0461 → **Gộp** PA-0463 → chọn hạn → **Giao việc**
3. **Đơn vị xử lý**: mở PA-0461 → Chụp ảnh sau → **Hoàn thành** (47/64 → 48/64)
4. **Người dân**: bấm thông báo → kéo Trước/Sau → chấm sao

Nút **Đặt lại demo** trên thanh trên cùng đưa dữ liệu về ban đầu. Các tình huống phụ: ảnh mờ, mất mạng, chế độ chữ lớn, đoàn viên xác minh và gửi hộ.

## Công cụ AI đã dùng (cho mục (e) bản thuyết minh)

Claude (Anthropic): phân tích đề và tiêu chí chấm, góp ý danh sách màn hình, dựng mock UI trên canvas, viết web prototype, vẽ sơ đồ quy trình, user journey và user stories.
