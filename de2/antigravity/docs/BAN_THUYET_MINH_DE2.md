# BẢN THUYẾT MINH GIẢI PHÁP THIẾT KẾ UX/UI
**Cuộc thi Hackathon Thành phố Đồng Nai năm 2026 – Vòng Sơ loại**
- **Đề thi lựa chọn:** Đề số 2 – PHẢN ÁNH HIỆN TRƯỜNG *(Chính quyền số – Đô thị thông minh)*
- **Tên giải pháp:** **TrấnBiên Trực Tuyến (SmartReport Đồng Nai)** – Nền tảng Phản ánh Hiện trường 3 bước & Điều phối Đô thị Minh bạch
- **Đường dẫn mở Bản mẫu bấm được (Prototype):** Mở tệp `./prototype/index.html` trực tiếp trên trình duyệt (chạy độc lập 100% ngoại tuyến, hỗ trợ chuyển đổi trực tiếp giữa 3 vai trò).

---

## (a) Vấn đề thực tiễn và Chân dung người dùng tại Đồng Nai

Tại các địa bàn đô thị mật độ cao của TP. Đồng Nai (điển hình là **Phường Trấn Biên** với nhiều trục giao thông huyết mạch, khu dân cư lâu năm xen kẽ trường học, chợ dân sinh), các sự cố hạ tầng đời sống như **đèn đường hỏng, ổ gà mặt đường, ngập nước cục bộ sau mưa, rác thải tự phát** diễn ra hàng ngày. Thực tế ghi nhận 03 điểm nghẽn lớn:

| Nhóm người dùng | Đặc điểm & Bối cảnh sử dụng | Nỗi đau cốt lõi (Pain Points) | Giải pháp UX giải quyết trực tiếp |
| :--- | :--- | :--- | :--- |
| **1. Người dân**<br>*(Bao gồm người cao tuổi 60–70 tuổi ít rành công nghệ)* | Đi bộ tập thể dục, đi chợ, đi làm về trong khu phố; chủ yếu dùng điện thoại thông minh phổ thông và nhóm Zalo khu phố. | • Không biết báo cho đơn vị nào; ngại tải ứng dụng nặng và đăng ký tài khoản phức tạp.<br>• Chữ nhỏ, nhiều biểu mẫu hành chính gây nản.<br>• Báo xong "rơi vào im lặng", không biết phường đã xử lý hay chưa. | • **Mobile-First PWA** mở ngay qua link/QR Zalo khu phố không cần cài đặt.<br>• **Gửi trong 03 bước (<15 giây)**, AI điền hộ từ ảnh chụp.<br>• **Chế độ Chữ lớn (1.5x)** tương phản cao.<br>• Theo dõi timeline & đối chiếu ảnh **Trước/Sau**. |
| **2. Đội thanh niên tình nguyện**<br>*(Đoàn viên khu phố)* | Năng động, thông thuộc từng hẻm nhỏ, thường xuyên ra quân Ngày Chủ nhật xanh và hỗ trợ chuyển đổi số cộng đồng. | • Muốn hỗ trợ phường kiểm tra tin báo ảo/mờ hoặc báo hộ các cụ lớn tuổi nhưng thiếu công cụ tác nghiệp tại chỗ trên điện thoại. | • Màn hình **Xác minh thực địa 1 chạm** cho các phản ánh gần vị trí hoặc có độ tin cậy AI trung bình.<br>• Chế độ **"Gửi phản ánh hộ người dân"**. |
| **3. Cán bộ tiếp nhận UBND Phường** | Làm việc trên máy tính tại UBND phường, kiêm nhiệm nhiều đầu việc tổng hợp báo cáo. | • Tin báo nằm rải rác trên Zalo, điện thoại; **trùng lặp nhiều người báo cùng 1 ổ gà** gây quá tải.<br>• Khó theo dõi hạn xử lý (SLA) của từng bộ phận chuyên môn và mất thời gian tổng hợp số liệu. | • **Web Dashboard tập trung**, tự động **gộp phản ánh trùng bán kính 50m**.<br>• Phân công 2 cú nhấp chuột, cảnh báo trễ hạn SLA, bắt buộc nghiệm thu bằng **Ảnh sau xử lý**. |

> **Dữ liệu bối cảnh thiết kế (Phường Trấn Biên – Tháng 11/2026):** Tổng số **64 phản ánh** (*Rác thải: 21; Đèn đường: 18; Ngập nước: 15; Mặt đường: 10*), đã xử lý hoàn tất **47 phản ánh (73,4%)**, đang xử lý/chờ xác minh **17 phản ánh**, thời gian xử lý trung bình đạt **3,2 ngày**.

---

## (b) Luồng sử dụng chính (End-to-End Flow) & Xử lý trải nghiệm đặc thù

Giải pháp kết nối 03 vai trò trên **01 vòng đời phản ánh khép kín duy nhất**, loại bỏ hoàn toàn các bước nhập liệu thừa:

1. **Bước 1 – Gửi phản ánh 03 bước & AI nhận diện kèm Độ tin cậy (Người dân):**
   - **Thao tác 1 (Chụp ảnh):** Người dân chụp/chọn ảnh sự cố $\rightarrow$ **AI Vision** phân tích tức thì, gợi ý sẵn *Loại sự cố + Mô tả ngắn* kèm **Chỉ số Độ tin cậy AI (%)** và từ khóa bằng chứng trực quan:
     - *Tin cậy Cao ($\ge 85\%$):* Tự động chọn sẵn danh mục (người dân vẫn sửa lại được bằng 1 chạm).
     - *Tin cậy Trung bình ($60\% - 84\%$):* Hiển thị nhãn vàng *"Cần kiểm chứng thêm"*, gợi ý Top 2 phân loại gần nhất và tự động gắn cờ chuyển Đội tình nguyện xác minh.
     - *Tin cậy Thấp ($< 60\%$ – Ảnh mờ/tối/sai lệch):* Kích hoạt **Error State** thân thiện nhắc chụp lại rõ hơn.
   - **Thao tác 2 (Vị trí trên bản đồ & Gộp trùng 50m):** Tự động ghim tọa độ GPS hiện tại. Hệ thống quét bán kính `50m` các phản ánh cùng loại chưa đóng: nếu phát hiện trùng lặp, hiển thị thẻ **"Gộp phản ánh trùng vị trí"** để người dân bấm **"+1 Đồng tình & Bổ sung ảnh"** (tăng độ ưu tiên cho sự cố thay vì sinh đơn rác). Nếu mất GPS (**Error State**), cho phép chọn nhanh *Khu phố + Tên đường* từ danh mục Phường Trấn Biên.
   - **Thao tác 3 (Chốt phân loại & Gửi):** Chạm xác nhận 1 trong 4 nút biểu tượng lớn (*Đèn đường / Mặt đường / Ngập nước / Rác thải*) $\rightarrow$ Nhận mã theo dõi ngay lập tức.
2. **Bước 2 – Xác minh tại chỗ (Đội thanh niên tình nguyện):** Đoàn viên khu phố nhận thông báo các sự cố cần kiểm chứng thực địa (hoặc độ tin cậy AI $<85\%$) $\rightarrow$ Xác nhận *"Đúng hiện trạng / Mức độ khẩn cấp"* tại chỗ để hỗ trợ lọc nhiễu trước khi giao đơn vị thi công.
3. **Bước 3 – Tiếp nhận, Phân loại & Giao hạn xử lý SLA (Cán bộ Phường):** Trên Dashboard, các phản ánh có nhiều lượt đồng tình (+1) và đã xác minh được đẩy lên đầu. Cán bộ chọn **Đơn vị xử lý** (*Công ty Môi trường Đô thị / Điện chiếu sáng / Tổ Quản lý Đô thị*) và ấn định **Hạn xử lý (SLA)**.
4. **Bước 4 – Cập nhật Ảnh sau xử lý & Đánh giá hài lòng (Khép kín vòng minh bạch):** Bộ phận xử lý tải **Ảnh sau khắc phục** và ghi chú kết quả $\rightarrow$ Ghim trên *Bản đồ quanh tôi* đổi từ Đỏ/Vàng sang **Xanh lá** $\rightarrow$ Người dân kéo thanh trượt đối chiếu **Ảnh Trước – Ảnh Sau** và chấm điểm **Mức độ hài lòng (1–5 sao)**.

---

## (c) Phạm vi tính năng hiện thực hóa trong 24 giờ tại Vòng Chung kết (MVP)

Thiết kế giao diện được tính toán chặt chẽ để đội thi **lập trình chạy thật 100% trọn luồng trong 24 giờ** mà không phụ thuộc hạ tầng bên thứ ba rủi ro:

| Phân nhóm | Tính năng triển khai thật trong 24 giờ (MVP) | Thời lượng dự kiến |
| :--- | :--- | :---: |
| **1. Luồng Người dân (Mobile PWA)** | • Gửi phản ánh 3 bước (Chụp/tải ảnh, định vị GPS bản đồ, chọn 4 phân loại).<br>• Bản đồ các phản ánh quanh tôi (ghim màu theo trạng thái, bộ lọc theo loại).<br>• Theo dõi trạng thái phản ánh của tôi (Timeline 4 mốc thời gian thực).<br>• Xem đối chiếu ảnh Trước – Sau xử lý (Before/After Slider) & Đánh giá 1–5 sao. | **08 giờ** |
| **2. Luồng Cán bộ & Đoàn viên** | • Dashboard Cán bộ phường: Thống kê KPI (64 đơn, tỷ lệ giải quyết, TB 3,2 ngày), lọc danh sách, giao đơn vị phụ trách, đặt hạn xử lý (SLA).<br>• Form cập nhật kết quả kèm tải lên Ảnh sau xử lý.<br>• Màn hình Đoàn viên tình nguyện xác minh hiện trường & gửi hộ người cao tuổi. | **07 giờ** |
| **3. Nhóm Điểm cộng & Sáng tạo** | • **AI Vision phân loại ảnh tự động + Hiển thị Độ tin cậy (%) & Ngưỡng cảnh báo**.<br>• **Thuật toán Gộp phản ánh trùng vị trí** (khoảng cách Haversine $\le 50\text{m}$ + cùng loại).<br>• **Chế độ Chữ lớn (Senior Mode)** chuyển đổi tức thì bằng 1 nút gạt. | **05 giờ** |
| **4. Hoàn thiện & Kiểm thử** | • Xử lý đầy đủ Empty/Error States (mất GPS, ảnh lỗi, vùng sạch sự cố), nạp dữ liệu mẫu Phường Trấn Biên, kiểm thử chéo đa thiết bị Mobile/Laptop. | **04 giờ** |

---

## (d) Kiến trúc hệ thống & Công nghệ dự kiến

Giải pháp chọn kiến trúc **Mobile-First Progressive Web App (PWA) kết hợp Responsive Web Admin** trên **01 mã nguồn thống nhất**, tối ưu cho khả năng triển khai thực tế cấp xã, phường tại Đồng Nai:

```
[Người dân / Người cao tuổi / Đoàn viên (Mobile PWA - Mở từ QR/Zalo)]   [Cán bộ UBND Phường (Desktop Web Dashboard)]
                                      │                                                       │
                                      └───────────────────┬───────────────────────────────────┘
                                                          ▼
                           [Next.js Fullstack App (React + TypeScript + Tailwind CSS)]
                            ├── Định vị & Bản đồ: Leaflet.js + OpenStreetMap (Miễn phí, nhẹ)
                            ├── Gộp trùng không gian: Thuật toán Haversine (Bán kính <= 50m)
                            ├── Phân tích ảnh AI: Gemini 2.5 Flash Vision API (JSON + Độ tin cậy)
                            └── Cơ sở dữ liệu & Lưu trữ ảnh: Supabase (PostgreSQL + Storage + Realtime)
```

- **Vì sao khả thi cao khi triển khai thật tại 95 xã, phường của TP. Đồng Nai:**
  1. **Không rào cản cài đặt cho người dân:** Người cao tuổi chỉ cần chạm vào đường dẫn ghim trên nhóm Zalo Khu phố hoặc quét mã QR tại nhà văn hóa khu phố là mở ngay giao diện như ứng dụng gốc; dễ dàng nâng cấp thành **Zalo Mini App** trên Zalo OA của Phường.
  2. **Chi phí vận hành gần bằng 0:** Sử dụng bản đồ mở `OpenStreetMap/Leaflet` (không tốn phí bản quyền API đắt đỏ như Google Maps), mô hình AI nhẹ `Gemini Flash` chi phí chỉ vài chục nghìn đồng cho hàng nghìn lượt phân tích ảnh/tháng.

---

## (e) Minh bạch Công cụ Trí tuệ nhân tạo đã sử dụng (Vòng Sơ loại)

Tuân thủ quy chế cuộc thi, đội thi khai báo chi tiết việc ứng dụng công cụ AI (**Google Antigravity / Mô hình Gemini**) trong quá trình làm bài Vòng sơ loại:
1. **Phân tích nghiệp vụ & Người dùng:** Rà soát các tình huống thực tế của người cao tuổi, đoàn viên khu phố và cán bộ phường tại Đồng Nai để tối ưu luồng gửi phản ánh còn đúng 03 bước.
2. **Thiết kế UX Microcopy & Kịch bản biên:** Gợi ý câu từ giao diện ngắn gọn, dễ đọc cho người lớn tuổi; chuẩn hóa quy tắc phản hồi theo 03 ngưỡng Độ tin cậy AI và các trạng thái lỗi/trạng thái trống.
3. **Khởi tạo dữ liệu giả lập hợp lý:** Mở rộng chi tiết danh sách sự cố mẫu (tên tuyến đường tại Phường Trấn Biên, thời gian xử lý, ghi chú nghiệm thu) khớp chính xác với tổng số liệu đề bài (64 phản ánh, 47 đã xử lý, TB 3,2 ngày) và không chứa thông tin cá nhân thật.
4. **Hỗ trợ dựng Bản mẫu bấm được (Prototype):** Sinh mã khung HTML/CSS/JavaScript cho giao diện tương tác ngoại tuyến và trình bày bố cục xuất tệp PDF thiết kế. Toàn bộ kiến trúc giải pháp, luồng màn hình và quyết định thiết kế đều do đội thi chủ động định hình, kiểm chứng và hoàn thiện, không sao chép giao diện của bất kỳ sản phẩm có sẵn nào.
