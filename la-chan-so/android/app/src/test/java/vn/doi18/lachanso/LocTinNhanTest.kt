package vn.doi18.lachanso

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LocTinNhanTest {
    private val viecNhe = "Chào em, bên chị đang tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày, không cần kinh nghiệm. " +
        "Chỉ cần nạp trước 200k để kích hoạt tài khoản, hoàn tiền kèm hoa hồng 20% ngay. Số lượng có hạn, đăng ký trong hôm nay tại bit.ly/viec-nhe-xyz"

    @Test fun gapGiuNguyenDoDai() {
        val s = "Đường dẫn rút gọn ở Đồng Nai"
        assertEquals(s.length, LocTinNhan.gap(s).length)
        assertEquals("duong dan rut gon o dong nai", LocTinNhan.gap(s))
    }

    @Test fun tinViecNheLaNguyHiem() {
        val kq = LocTinNhan.phanTich(viecNhe)
        assertEquals(Muc.NGUY_HIEM, kq.muc)
        assertEquals("Lừa đảo tuyển cộng tác viên", kq.kieu)
        assertTrue(kq.nhom.size >= 4)
        // Vị trí tô đỏ phải cắt đúng chữ trong câu gốc.
        val doan = kq.dauHieu.map { viecNhe.substring(it.dau, it.cuoi) }
        assertTrue(doan.toString(), "việc nhẹ lương cao" in doan)
        assertTrue(doan.toString(), "nạp trước 200k" in doan)
        assertTrue(doan.toString(), "bit.ly/viec-nhe-xyz" in doan)
        assertTrue(doan.toString(), "trong hôm nay" in doan)
    }

    @Test fun tinGiaDanhCongAn() {
        val kq = LocTinNhan.phanTich("Tôi là cán bộ điều tra công an. Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút, không được nói với ai.")
        assertEquals(Muc.NGUY_HIEM, kq.muc)
        assertEquals("Giả danh cơ quan, ngân hàng", kq.kieu)
    }

    @Test fun tinThuongKhongCanhBao() {
        for (t in listOf(
            "Mẹ ơi tối nay con về muộn, mẹ ăn cơm trước nhé, con mua thêm ít trái cây.",
            "Shipper giao hàng cho chị, đơn 120k, chị xuống lấy giúp em ở cổng nha.",
            "Chiều mai họp phụ huynh lúc 14 giờ tại phòng 203, anh chị sắp xếp tới dự.",
            "Alo, gọi lại anh nhé",
        )) assertEquals(t, Muc.CHUA_CO_DU_LIEU, LocTinNhan.phanTich(t).muc)
    }

    @Test fun boQuaTinCoMaXacThuc() {
        assertTrue(LocTinNhan.laOtp("Ma OTP cua quy khach la 482913. Tuyet doi khong cung cap cho ai."))
        assertTrue(LocTinNhan.laOtp("Mã xác thực Zalo của bạn: 1234"))
        assertFalse(LocTinNhan.laOtp(viecNhe))
        // Tin đòi đọc mã nhưng không chứa mã thì vẫn phải được phân tích.
        assertFalse(LocTinNhan.laOtp("Anh là nhân viên ngân hàng, chị đọc mã OTP vừa nhận cho anh ngay lập tức nhé."))
    }

    @Test fun cheSoTruocKhiGui() {
        val che = LocTinNhan.che("Chuyển vào STK 0123456789 hoặc gọi 0912 345 678, phí 200k")
        assertFalse(che, che.contains("0123456789"))
        assertFalse(che, che.contains("345"))
        assertTrue(che, che.contains("200k"))
    }

    @Test fun hieuCoVaKhong() {
        assertEquals(true, LocTinNhan.hieuCoKhong(listOf("Có")))
        assertEquals(true, LocTinNhan.hieuCoKhong(listOf("dạ có ạ")))
        assertEquals(true, LocTinNhan.hieuCoKhong(listOf("đúng rồi")))
        assertEquals(false, LocTinNhan.hieuCoKhong(listOf("Không")))
        assertEquals(false, LocTinNhan.hieuCoKhong(listOf("không có đâu")))
        assertEquals(false, LocTinNhan.hieuCoKhong(listOf("chưa")))
        assertNull(LocTinNhan.hieuCoKhong(listOf("alo ai đấy")))
        assertNull(LocTinNhan.hieuCoKhong(emptyList()))
        // Câu dài hoặc mơ hồ không được hiểu thành Có hay Không: trả lời "Có" sẽ báo cho người thân.
        assertNull(LocTinNhan.hieuCoKhong(listOf("cô ấy hỏi đường")))
        assertNull(LocTinNhan.hieuCoKhong(listOf("tôi không nhớ")))
        assertNull(LocTinNhan.hieuCoKhong(listOf("cô")))
        assertEquals(true, LocTinNhan.hieuCoKhong(listOf("Dạ, có ạ.")))
        assertEquals(false, LocTinNhan.hieuCoKhong(listOf("dạ không ạ")))
        assertEquals(true, LocTinNhan.hieuCoKhong(listOf("co")))        // máy nghe trả chữ không dấu
        assertEquals(false, LocTinNhan.hieuCoKhong(listOf("khong co")))
    }

    @Test fun maDungMotLanKhongRoiMay() {
        val tin = "Mã dùng một lần 482913 có hiệu lực trong 5 phút. Không cung cấp mật khẩu cho ai."
        assertTrue(LocTinNhan.laOtp(tin))
        assertTrue(LocTinNhan.laOtp("Ma bao mat cua ban la 12 34 56"))
        assertTrue(LocTinNhan.laOtp("Mã OTP: 123-456, hết hạn sau 2 phút"))
        // Dù có lọt bộ nhận mã thì bước che cũng không để dãy 6 chữ số rời máy.
        assertFalse(LocTinNhan.che(tin).contains("482913"))
        assertFalse(LocTinNhan.che("STK 1234567 chi nhánh A").contains("1234567"))
        assertFalse(LocTinNhan.che("gọi 0912\u00A0345\u00A0678").contains("345"))
    }

    @Test fun vong2() {
        // Phương án phụ của máy nghe không đủ để coi là "Có"; "ừm" là ậm ừ, chưa phải trả lời.
        assertNull(LocTinNhan.hieuCoKhong(listOf("cô", "có")))
        assertNull(LocTinNhan.hieuCoKhong(listOf("ừm")))
        // Mã viết bằng gạch ngang kiểu khác vẫn là mã, và vẫn bị che.
        assertTrue(LocTinNhan.laOtp("OTP 12\u201334\u201356"))
        assertFalse(LocTinNhan.che("OTP 12\u201334\u201356").contains("34"))
        // Con số ở xa chữ "mã kích hoạt" không biến một tin đòi nạp tiền thành tin có mã.
        assertFalse(LocTinNhan.laOtp("Nạp tiền ngay lập tức để lấy mã kích hoạt, áp dụng cho các hồ sơ đăng ký trong năm học mới 2026"))
        assertFalse(LocTinNhan.laOtp("Nạp tiền ngay lập tức để lấy mã kích hoạt cho hồ sơ 2026"))
        assertTrue(LocTinNhan.laOtp("Ma OTP giao dich cua quy khach la 482913"))
        // "Miễn phí giao lại" không phải là đòi tiền.
        assertFalse(LocTinNhan.coDauHieuManh(LocTinNhan.phanTich("Miễn phí giao lại trong hôm nay, theo dõi tại bit.ly/don123").nhom))
        // "người dùng" không phải là "đừng".
        assertTrue("Đòi mã xác thực, mật khẩu" in LocTinNhan.phanTich("Người dùng nhập mật khẩu ngay lập tức để tránh bị khóa").nhom)
        assertTrue("Đòi mã xác thực, mật khẩu" in LocTinNhan.phanTich("Nguoi dung nhap mat khau ngay lap tuc").nhom)
        assertFalse("Đòi mã xác thực, mật khẩu" in LocTinNhan.phanTich("Không được phép cung cấp mật khẩu. Liên hệ ngay lập tức nếu mất thẻ.").nhom)
        assertFalse("Đòi mã xác thực, mật khẩu" in LocTinNhan.phanTich("Quy khach dung cung cap mat khau cho bat ky ai").nhom)
        // Đòi thanh toán phí giao lại kèm đường dẫn rút gọn là đủ để lên tiếng.
        val phi = LocTinNhan.phanTich("Thanh toán phí giao lại trong hôm nay tại bit.ly/don123")
        assertTrue(LocTinNhan.coDauHieuManh(phi.nhom))
        assertEquals(Muc.NGUY_HIEM, phi.muc)
    }

    @Test fun tinThatKhongBiBatNham() {
        // Lời dặn của ngân hàng không phải là đòi mật khẩu.
        val nganHang = LocTinNhan.phanTich("Ngân hàng thông báo: Không cung cấp mật khẩu cho ai. Liên hệ ngay lập tức nếu mất thẻ.")
        assertFalse(nganHang.nhom.toString(), "Đòi mã xác thực, mật khẩu" in nganHang.nhom)
        assertEquals(Muc.CHUA_CO_DU_LIEU, nganHang.muc)
        // Tin giao hàng thật: chỉ có "trong hôm nay" và đường dẫn rút gọn, chưa đủ để lên tiếng.
        val giaoHang = LocTinNhan.phanTich("Đơn sẽ giao trong hôm nay, theo dõi tại bit.ly/don123")
        assertFalse(LocTinNhan.coDauHieuManh(giaoHang.nhom))
        assertEquals(Muc.CHUA_CO_DU_LIEU, giaoHang.muc)
        // Thêm tên miền lạ hoặc lời đòi tiền thì vẫn bị bắt.
        assertEquals(Muc.NGHI_NGO, LocTinNhan.phanTich("Tài khoản sắp hết hạn, cập nhật trong hôm nay tại ngan-hang-xacminh.top").muc)
        assertTrue(LocTinNhan.coDauHieuManh(LocTinNhan.phanTich("Chuyển khoản trước 35k phí giao lại trong hôm nay tại bit.ly/don123").nhom))
    }

    @Test fun loiKeLai() {
        assertEquals(Muc.NGUY_HIEM, LocTinNhan.phanTichLoiKe("nó nói là công an bảo tôi chuyển tiền vào tài khoản rồi không được nói với ai").muc)
        assertEquals(Muc.NGUY_HIEM, LocTinNhan.phanTichLoiKe("bên ngân hàng gọi bảo đọc mã otp cho họ").muc)
        assertEquals(Muc.NGHI_NGO, LocTinNhan.phanTichLoiKe("họ kêu tôi chuyển khoản cho họ thôi à").muc)
        assertEquals(Muc.CHUA_CO_DU_LIEU, LocTinNhan.phanTichLoiKe("thằng cháu nó hỏi thăm sức khỏe rồi hẹn chủ nhật về ăn cơm").muc)
    }

    @Test fun xungHo() {
        assertEquals("con", Xung("bà").toi)
        assertEquals("mình", Xung("bạn").toi)
        assertEquals("Ông", Xung("ông").Ban)
        assertTrue(Xung("bà").laBa)
        assertFalse(Xung("chú").laBa)
    }

    @Test fun chuanHoaSo() {
        assertEquals("0912345678", TraCuu.chuanHoa("+84 912 345 678"))
        assertEquals("0912345678", TraCuu.chuanHoa("0912.345.678"))
        assertEquals("0912345678", TraCuu.chuanHoa("84912345678"))
        assertEquals("113", TraCuu.chuanHoa("113"))
        assertEquals("0912 345 678", TraCuu.dinhDang("+84912345678"))
    }
}
