package vn.doi18.lachanso

import android.content.Context
import android.widget.Toast

internal object DemoActions {
    fun run(c: Context, key: String) {
        val samplePhone = "0912345678"
        when (key) {
            "ring" -> {
                Luong.nen {
                    val result = TraCuu.tra(c, samplePhone)
                    TheCanhBao.hien(c, samplePhone, result)
                    Luong.sau(8000) { TheCanhBao.an(c) }
                }
            }
            "afterCall" -> {
                Luong.nen { SauCuocGoi.xuLy(c, samplePhone, 252, TraCuu.tra(c, samplePhone), quen = false, batDau = System.currentTimeMillis() - 252_000, den = true, thu = true) }
            }
            "stop" -> { DungLai.hien(c, dangGoi = false, phut = 4) }
            "message" -> {
                Luong.nen {
                    XuLyTinNhan.xuLy(
                        c, "0934 567 890",
                        "Chào em, bên chị đang tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày, không cần kinh nghiệm. " +
                            "Chỉ cần nạp trước 200k để kích hoạt tài khoản, hoàn tiền kèm hoa hồng 20% ngay. " +
                            "Số lượng có hạn, đăng ký trong hôm nay tại bit.ly/viec-nhe-xyz (thử lúc ${System.currentTimeMillis() % 100000})",
                    )
                }
            }
            "ringKnown" -> {
                Luong.nen {
                    TheCanhBao.hienNhan(c, TraCuu.tra(c, "0909000111"))
                    Luong.sau(8000) { TheCanhBao.an(c) }
                }
            }
            "bankWatch" -> {
                RuiRo.mo(c, samplePhone)
                Toast.makeText(c, "Giờ mở app ngân hàng (hoặc app thử) để xem màn Dừng lại", Toast.LENGTH_LONG).show()
            }
        }
    }
}
