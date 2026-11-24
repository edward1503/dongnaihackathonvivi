**A. “Chỉ hỏi khi đã bị báo làm phiền” sẽ hỏi nhầm shipper và bỏ qua nạn nhân đầu tiên của một số lừa đảo mới.** Lá chắn không đọc được nhãn nhà mạng, còn dữ liệu riêng lúc ra mắt rất mỏng. Báo cáo “gọi quảng cáo” chỉ đủ căn cứ để hiện đúng nhãn đó. Số lượng cuộc gọi không cho biết người gọi muốn gì.

**B. Quy tắc cho bản 24 giờ.** Áp dụng mức cao nhất đủ điều kiện. Các ngưỡng dưới đây là giả thuyết để thử nghiệm.

| Mức | Khi nào kích hoạt |
|---|---|
| Im lặng | Mặc định, kể cả số chưa lưu. Shipper gọi 20 giây để giao hàng sẽ không bị hỏi. |
| Nhãn nhẹ | Có ít nhất một báo cáo quảng cáo đã duyệt. Hiện “Đã có người báo gọi quảng cáo” khi đổ chuông. Tổng đài quảng cáo dừng ở mức này nếu chỉ có bằng chứng đó. |
| Hỏi | Số chưa quen, đã nghe **từ 5 phút**. Số mới gọi 15 phút vẫn được hỏi dù chưa ai báo. Thời lượng chỉ đủ để hỏi một câu về nội dung. |
| Cảnh báo | Có báo cáo lừa đảo đã xác minh, hoặc người nghe xác nhận bị yêu cầu đọc OTP hay chuyển tiền vào “tài khoản an toàn”. Khi có quyền đọc bản ghi của máy, có thể dùng câu yêu cầu rõ nghĩa sau cuộc gọi. Chỉ nhắc đến “tiền” là tín hiệu yếu. |
| Tạm dừng | Đã đạt mức cảnh báo **và** mở app ngân hàng trong **10 phút** sau cuộc gọi. Hiện A10a một lần, cho gọi người thân hoặc tiếp tục. Lá chắn chỉ tạo điểm dừng trước thao tác, không khóa được giao dịch. |

Năm phút giúp bỏ qua cuộc trao đổi giao nhận ngắn. Mười phút giới hạn việc gán một lần mở ngân hàng cho cuộc gọi trước đó. Mở ngân hàng hoặc vừa nhận OTP, đứng riêng, đều là tín hiệu yếu.

**C. Số quen.** Con cháu dùng số chưa lưu được miễn hỏi nếu người dùng chọn “Tôi biết số này”, hoặc lịch sử 60 ngày có ít nhất hai cuộc gọi đi đã kết nối từ 30 giây, vào hai ngày khác nhau. Gọi nhử nhiều lần từ phía bên kia không đạt ngưỡng. Số quen vẫn chịu cảnh báo khi có bằng chứng mạnh. Thiếu quyền lịch sử thì dùng lựa chọn đã nhớ trên máy.

**D. Mỗi ngày tối đa một câu hỏi chủ động.** Hỏi “Họ có bảo đọc mã OTP hoặc chuyển tiền để bảo vệ tài khoản không?” Cho bỏ qua một chạm. Trả lời “Không” khép lại lần hỏi đó. Chỉ ghi nhớ số quen khi người dùng chủ động chọn.

**E. Một giờ thiết kế.** A03a tách “Từ chối” khỏi “Chặn số”. A03b ẩn thẻ mặc định. A04a bỏ “Câu 1/3”, thêm “Bỏ qua”. A04b đưa câu đáng ngờ lên ngay dưới kết quả. A04c đổi “3 câu hỏi” thành “Trả lời một câu”. A10a dùng “Khoan chuyển tiền”, ghi lý do cụ thể và đổi nút thành “Gọi [tên]”.

**F. Web tình nguyện.** Theo dõi số lần hỏi/100 cuộc đã nghe, tỷ lệ “Tôi biết số này” và bỏ qua theo từng quy tắc. Đo bỏ sót bằng tỷ lệ vụ lừa đã xác minh từng không được cảnh báo. Khảo sát ngẫu nhiên một mẫu cuộc im lặng có người dùng đồng ý để tìm vụ chưa báo.

**G. Rủi ro lớn nhất là đếm trùng bằng chứng.** Một lần thanh toán hợp lệ có thể vừa mở ngân hàng vừa sinh OTP. Cộng hai sự kiện thành “nguy hiểm” sẽ phạt đúng hành vi bình thường.