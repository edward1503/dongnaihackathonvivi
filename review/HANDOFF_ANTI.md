# Giao việc cho Antigravity – dựng lại giao diện "Lá chắn số" theo mockup

> **CẬP NHẬT 11:00 – ĐÃ DỰNG XONG TRÊN FIGMA.** Claude đã dựng toàn bộ 34 khung theo mockup trên trang mới **"V2 – Giao diện mới"** của file này (khung auto-layout, chữ và biểu tượng chỉnh sửa được), đã nối 65 liên kết prototype, nút lùi ở mọi màn và điểm bắt đầu "Luồng chính" tại "0. Chọn vai trò". **Không dựng lại, không xóa trang V2.** Trang cũ "Lá chắn số - Đồng Nai (Mobile 390×844)" giữ nguyên để đối chiếu.
> Việc còn lại (nếu Figma MCP còn lượt gọi): mở trang V2, soát bằng mắt từng khung xem có chữ bị cắt hay lệch, sửa tại chỗ. Lượt gọi Figma MCP của gói Starter đã chạm giới hạn lúc 11:00, nên có thể phải sửa tay trong Figma.
> Phần bên dưới là mô tả thiết kế, dùng để đối chiếu.

Bạn đang dựng file Figma "Lá chắn số – Đồng Nai (UX/UI Prototype)" cho vòng sơ loại Hackathon, hạn đóng băng thiết kế là **14:15 hôm nay**. Luồng và danh sách màn đã đủ; việc bây giờ là dựng lại lớp hiển thị cho giống một ứng dụng thật, ít chữ, và sửa các lỗi sẽ bị trừ điểm. Giữ font Be Vietnam Pro và ba cặp màu trạng thái (xanh lá, vàng nâu, đỏ) đang có. **Đổi màu chủ đạo** sang màu của biểu trưng tỉnh Đồng Nai theo bảng ở mục A.

**Nguồn duy nhất để làm theo:** `/home/acer/tuan/DnaiHackathon/dongnaihackathonvivi/review/mockup/huong-thiet-ke-moi.html`
File có 29 màn mẫu, mỗi màn là một khối `<figure>` với tên khung trong `<figcaption>`. Kích thước, màu, bo góc, cỡ chữ nằm trong CSS; nội dung chữ nằm trong HTML. Dựng đúng như vậy, lấy số đo và chữ từ file, không tự viết thêm chữ. Ảnh xem nhanh: `tong-quan.png` và `tong-quan-2.png` cùng thư mục.

**Giới hạn công cụ:** tài khoản Figma là gói Starter, chỉ có khoảng 20 lượt đọc mỗi tháng. Hạn chế tối đa `get_screenshot` và `get_metadata`: chỉ chụp một lần cuối mỗi đợt để tự kiểm, không chụp từng khung. Hết mỗi đợt, liệt kê tên các khung đã sửa và việc nào chưa xong.

---

## A. Quy tắc (áp cho mọi màn, kể cả màn không có trong mockup)

Kiểu hiển thị: nền trắng phẳng, mọi thứ bo tròn, ít chữ. Lấy cảm hứng từ ngôn ngữ thiết kế của các ứng dụng nhắn tin hiện đại, nhưng không chép bố cục hay nhận diện của ứng dụng nào.

**Token (đổi màu chủ đạo, thêm các token mới; ba cặp màu trạng thái giữ nguyên):**

| Tên | Giá trị | Dùng cho |
|---|---|---|
| Chủ đạo | `#344D9C` (thay `#1F4E8C`) | Xanh bánh răng trong biểu trưng Đồng Nai. Nút chính, mục đang chọn, biểu tượng, số liệu |
| Vàng điểm nhấn | `#FFCE02` | Vàng trong biểu trưng Đồng Nai. Chỉ dùng ở 2 chỗ: biểu tượng lá chắn trong ô biểu trưng (màn 0) và hình tròn huy hiệu (màn 8). Chữ hoặc biểu tượng đặt trên nền vàng phải màu `#14213D` |
| Nền ứng dụng | `#FFFFFF` | Nền mọi khung |
| Nền xám | `#F2F4F7` | Thẻ, ô nhập, phím số, mục đang chọn ở thanh điều hướng |
| Viền mảnh | `#E3E6EC` | Viền 1px của nút tròn, viên thuốc, đường kẻ giữa các dòng |
| Chủ đạo nhạt | `#E9EDF8` | Nền ô biểu tượng tròn |
| Thang màu bản đồ ô | `#344D9C`, `#5C72B5`, `#9AA8D3`, `#CDD4EA`, `#E9EDF8` | Từ nhiều tới ít; hai bậc đầu chữ trắng. Thanh biểu đồ: `#344D9C` cho thanh đầu, `#9AA8D3` cho các thanh sau |
| Chữ chính | `#14213D` | Thay `#1A1A1A` |
| Chữ phụ | `#4A5672` | Dòng phụ, nhãn |
| Bóng nhẹ | `0 2 8 rgba(20,33,61,0.05)` | Đi kèm viền mảnh ở nút tròn, viên thuốc |
| Bóng nổi | `0 10 28 rgba(20,33,61,0.14)` | Thanh điều hướng nổi |

1. **Ít chữ.** Tiêu đề tối đa 4 từ, nút tối đa 3 từ, mỗi màn nhiều nhất một câu phụ ngắn. Không có đoạn giải thích.
2. **Phẳng.** Thẻ là khối nền xám `#F2F4F7` bo góc 24, không viền, không bóng. Danh sách là các dòng trên nền trắng, ngăn nhau bằng đường kẻ 1px, không bọc thẻ.
3. **Bo tròn hết cỡ.** Nút là hình viên thuốc (bo 32). Nút biểu tượng và ô biểu tượng là hình tròn. Thanh chọn 3 mục, ô tìm kiếm, ô chọn kiểu lừa đảo đều là viên thuốc.
4. **Mỗi màn một nút chính:** nền `#344D9C`, chữ trắng 20px đậm, cao 60–64. Nút phụ: nền trắng, viền 1.5px `#C9D0DC`, chữ `#14213D`.
5. **Xanh lá, vàng, đỏ chỉ dùng cho kết quả kiểm tra, cảnh báo, phản hồi đúng/sai.** Ngoại lệ duy nhất có chủ đích: thẻ đỏ "Đang bị gọi đòi tiền?" ở trang chủ. Vàng điểm nhấn `#FFCE02` không dùng cho kết quả hay cảnh báo, để không lẫn với mức "Nghi ngờ".
6. **Khung ứng dụng:** thanh trạng thái cao 44; thanh tiêu đề gồm nút tròn 48 nền trắng viền mảnh (lùi hoặc đóng), tiêu đề 24px đậm, bên phải nếu có là viên thuốc "Nghe". Thanh điều hướng là viên thuốc nổi cách mép 12, cao 74, nền trắng, viền mảnh, bóng nổi; mục đang chọn có nền xám bo tròn. Nội dung trang chủ chạy xuống dưới thanh này. Bốn mục: "Trang chủ", "Bài học", "Báo cáo", "Cá nhân". Chỉ đặt ở màn 1, màn "6. Bài học – Danh sách" và màn "12. Cá nhân".
7. **Cỡ chữ:** nhỏ nhất 16px; chữ thân 18–20px; tiêu đề lớn 28–36px. Chỉ viết hoa cả chữ ở "NGUY HIỂM", "NGHI NGỜ", "AN TOÀN".
8. **Biểu tượng nét 2px**, luôn đi kèm chữ.
9. **Chỉ lấy màu, không dùng hình biểu trưng của tỉnh** (con nai, bánh răng) hay bất kỳ huy hiệu cơ quan nào.
10. **Không dùng ảnh chụp.** Xóa toàn bộ ảnh Wikimedia. Ảnh đại diện là hình tròn có chữ cái đầu.
11. **Không chữ nào bị cắt hay tràn. Không đưa ghi chú thiết kế vào giao diện.**

---

## ĐỢT 1 – Luồng chính (khoảng 75 phút)

Tạo thành phần dùng chung trước (thanh trạng thái, thanh tiêu đề, nút chính, nút phụ, thẻ xám, ô biểu tượng tròn, dòng danh sách, thanh điều hướng nổi), rồi dựng lại các khung sau đúng theo mockup:

| Khung | Lưu ý ngoài mockup |
|---|---|
| 0. Chọn vai trò | Nền trắng, biểu trưng là ô vuông bo góc màu chủ đạo. Xóa 3 ảnh, xóa mô tả dưới mỗi vai trò, xóa khối vàng "Gợi ý" |
| 1. Trang chủ | Không còn mảng xanh đầu trang. Từ trên xuống: hai viên thuốc (tên ứng dụng, phường), "Chào Bác!", ô tìm kiếm có nút tròn, thẻ đỏ khẩn cấp, bốn dòng danh sách, thanh điều hướng nổi. Xóa dải "Chế độ: Bác / Chữ lớn: BẬT" và nút "Bấm để nghe đọc hướng dẫn" |
| 2. Kiểm tra nhanh | Có bàn phím số 3×4, phím hình viên thuốc nền xám. Xóa nhãn "Bước 1/2" và hộp vàng |
| 2. Kiểm tra nhanh – Đường dẫn | Khung mới: mục "Đường dẫn" đang chọn, ô dán nội dung, không có bàn phím số |
| 3. Kết quả kiểm tra – Nguy hiểm | Xóa nút "Đừng chuyển tiền" (đã thành câu tiêu đề) |
| 3. Kết quả kiểm tra – Nghi ngờ | Như trên |
| 3. Kết quả kiểm tra – An toàn | Nút chính là "Kiểm tra số khác", không còn nút xanh lá "Đừng chuyển tiền" |
| 5. Hỏi người thân | Xóa ảnh người. Nút gửi màu chủ đạo, không phải xanh lá |

*Hoàn thành khi:* 8 khung trên trùng với mockup về bố cục, chữ và màu; nhìn từ xa phân biệt được ba mức kết quả bằng cả màu, hình biểu tượng và chữ.

---

## ĐỢT 2 – Các màn còn lại và trạng thái (khoảng 65 phút)

**2.1 Dựng theo mockup:** 4. Báo cáo; 6. Bài học 1 phút; 7. Bài kiểm tra – Trả lời đúng; 8. Kết quả bài kiểm tra; 9. Thống kê đội tình nguyện (khung cao hơn 844 vì là màn cuộn); 10. AI phân tích tin nhắn; 11. Giọng nói – Đọc số (đổi tên khung 11 cũ).

Những thứ đã bỏ có chủ đích, đừng thêm lại: nút "Thêm ảnh" và công tắc ẩn danh ở màn 4 (thay bằng dòng "Ẩn danh, không lưu tên."); nút tải xuống, hai viên thuốc lọc và nút "Tạo thẻ cảnh báo" ở màn 9 (thay bằng dòng chữ "Tháng 11/2026 · Biên Hòa" và nút "Chia sẻ cảnh báo"); khối "Đang đọc to kết quả" ở màn 11.

Kiểm tra số liệu màn 9: chín ô phường cộng lại bằng 120; sáu thanh kiểu lừa đảo là 42, 22, 18, 14, 12, 12. Biểu đồ chỉ dùng các bậc của màu chủ đạo.

**2.2 Tách khung trạng thái:** mỗi trạng thái một khung riêng, không khung nào chứa hai trạng thái. Có mẫu trong mockup: 2a. Kiểm tra nhanh – Đang kiểm tra; 2b. Kiểm tra nhanh – Mất mạng; 4b. Báo cáo – Đã gửi; 5a. Hỏi người thân – Chưa chọn người thân; 5b. Hỏi người thân – Chờ trả lời.

**2.3 Khung không có mẫu, dựng theo quy tắc mục A:**

| Tên khung | Nội dung |
|---|---|
| 4a. Báo cáo – Thiếu thông tin | Như khung 4, ô nhập trống có viền đỏ, dòng lỗi đỏ dưới ô: "Nhập số hoặc thêm ảnh." |
| 6. Bài học 1 phút – Thẻ 2 | Như khung 6, tiến độ 2/4, viên thuốc "2/4". Tiêu đề lớn "2 dấu hiệu". Hai hàng lý do kiểu màn kết quả (ô biểu tượng nền đỏ nhạt): "Việc dễ, tiền cao bất thường", "Bắt nộp tiền trước". Nút chính "Nên làm gì?" |
| 7. Bài kiểm tra – Chưa trả lời | Như khung 7 nhưng 3 đáp án đều là thẻ trắng, không có khối phản hồi, nút chính mờ 40% |
| 7a. Bài kiểm tra – Chọn sai | Đáp án "Chuyển thử 500.000đ" viền đỏ, nền đỏ nhạt, biểu tượng X. Khối phản hồi nền đỏ nhạt: "Chưa đúng!" / "Chuyển là mất. Hãy dừng lại và báo cáo." Nút chính "Câu tiếp" |
| 9a. Thống kê đội tình nguyện – Chưa có dữ liệu | Thanh tiêu đề và hai viên thuốc lọc như khung 9 (viên thứ hai ghi "Phước Tân"). Giữa màn: ô biểu tượng tròn 112, "Chưa có báo cáo", nút chính "Ghi nhận báo cáo" |

*Hoàn thành khi:* không còn chữ "TRẠNG THÁI" trong giao diện; không còn ảnh ở màn 7 và 9; không còn tên miền `.xyz` hay "98% Lừa đảo" ở màn 10.

---

## ĐỢT 3 – Màn mới và nối prototype (khoảng 60 phút)

**3.1 Dựng theo mockup:**
- "1b. Khẩn cấp – Đang bị gọi đòi tiền": dùng lại khung trang chủ thứ hai ("Chữ cực lớn"), đổi tên và nội dung. Sau việc này file chỉ còn một trang chủ.
- "1c. Sau cuộc gọi lạ – Trả lời 4 câu": khung mới.
- Ba khung mới để sản phẩm đủ đường đi khi viết code: "1a. Chọn phường", "5c. Hỏi người thân – Thêm người thân", "6. Bài học – Danh sách" (có thanh điều hướng dưới, mục "Bài học" đang chọn).
- "12. Cá nhân": khung mới, hai thẻ xám chứa các dòng cài đặt (Người thân, Phường, Vai trò; Tự đọc to kết quả, Micro, Quyền riêng tư), mục "Cá nhân" đang chọn ở thanh điều hướng.
- Ba khung xin quyền và riêng tư: "0b. Quyền riêng tư" (hiện một lần sau khi chọn vai trò), "11a. Giọng nói – Xin quyền micro", "11b. Giọng nói – Chưa có quyền micro". Nhãn trạng thái là viên thuốc cao 36: xanh nhạt chữ chủ đạo "Khi đọc số", xám "Không", xanh lá nhạt "Đã cho phép".

**3.2 Nối prototype:**
- Luồng chính: 0 (bấm "Người lớn tuổi") → 0b (bấm "Đồng ý") → 1 (bấm ô tìm kiếm) → 2 (bấm "Kiểm tra") → 2a → 3 Nguy hiểm (bấm "Hỏi người thân") → 5 (bấm "Gửi cho Lan") → 5b → 1.
- Nhánh phụ: 3 Nguy hiểm (bấm "Báo cáo") → 4 → 4b; 1 (bấm thẻ đỏ) → 1b (bấm "Kể lại cuộc gọi") → 1c (bấm "Xem kết quả") → 3 Nguy hiểm; 1 (bấm viên thuốc "Trấn Biên") → 1a; 1 (bấm mục "Cá nhân") → 12 (bấm "Người thân") → 5, (bấm "Phường") → 1a, (bấm "Vai trò") → 0, (bấm "Quyền riêng tư") → 0b; 2 (bấm "Đọc số") → 11a (bấm "Cho phép") → 11 (bấm "Kiểm tra") → 2a; 11a (bấm "Để sau") → 2; 5a (bấm "Chọn người thân") → 5c (bấm "Lưu") → 5; 0 (bấm "Học sinh") → 6 Danh sách (bấm "Việc nhẹ lương cao") → 6 Bài học 1 phút → 6 Thẻ 2 → 7 Chưa trả lời → 7 Trả lời đúng → 8; 0 (bấm "Đội tình nguyện") → 9.
- Nút lùi và nút đóng ở mọi màn quay về màn trước. Khung bắt đầu là "0. Chọn vai trò".

*Hoàn thành khi:* bấm trọn luồng chính từ 0 tới 5b (nếu đã bỏ khung 0b thì nối thẳng 0 → 1) mà không gặp nút chết.

**3.3 Soát lần cuối trước 14:15:**
- Không khung nào còn ảnh chụp, chữ bị cắt, ghi chú thiết kế, đoạn chữ dài hơn 2 dòng (trừ bong bóng tin nhắn).
- Xanh lá, vàng, đỏ chỉ xuất hiện ở kết quả, cảnh báo, phản hồi đúng/sai.
- Tên khung theo dạng "số. Tên màn – Trạng thái", sắp theo thứ tự để xuất PDF.
- Báo lại: danh sách khung đã sửa, khung chưa kịp sửa.

Nếu thiếu thời gian, bỏ theo thứ tự: 6 Thẻ 2, 7a, 9a, 4a, 11b, 11a, 12, 0b, 1a, 5c, 6 Danh sách, 1c, 1b. Không bỏ đợt 1 và việc 3.2.
