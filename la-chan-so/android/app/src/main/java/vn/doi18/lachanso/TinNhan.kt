package vn.doi18.lachanso

import android.app.Activity
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Typeface
import android.os.Bundle
import android.provider.ContactsContract
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.SpannableString
import android.text.Spanned
import android.text.style.BackgroundColorSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.text.Normalizer

data class DauHieu(val nhom: String, val dau: Int, val cuoi: Int)

data class KetQuaTin(val muc: Muc, val kieu: String, val loiKhuyen: String, val dauHieu: List<DauHieu>) {
    val nhom: List<String> get() = dauHieu.map { it.nhom }.distinct()
}

/**
 * Lọc sơ bộ ngay trên máy, không gọi mạng. Chỉ tin vượt ngưỡng mới được gửi cho AI, và gửi bản đã che số.
 */
object LocTinNhan {
    /** Bỏ dấu, viết thường, giữ nguyên độ dài để vị trí khớp với câu gốc. */
    fun gap(s: String): String = buildString(s.length) {
        for (ch in s) {
            var b = Normalizer.normalize(ch.toString(), Normalizer.Form.NFD)[0].lowercaseChar()
            if (b == 'đ') b = 'd'
            append(b)
        }
    }

    private val TU_DEM = setOf("dạ", "ạ", "à", "ờ", "thưa", "ơi", "nha", "nhé", "nhá", "đó", "đấy", "nè", "rồi", "thì", "bé", "nai", "con", "cháu", "em", "tôi", "bà", "ông")
    private val CAU_CO = setOf("có", "có chứ", "có luôn", "có bảo", "có có", "đúng", "đúng vậy", "phải", "vâng", "ừ", "chính xác")
    private val CAU_KHONG = setOf(
        "không", "không có", "không có đâu", "không đâu", "không phải", "không hề", "không không",
        "chưa", "chưa có", "đâu có", "đâu có đâu", "làm gì có", "hông", "hông có", "hổng có",
    )

    /**
     * Hiểu câu trả lời "có" hoặc "không" từ các phương án máy nghe được. null: chưa rõ.
     * Chỉ nhận câu trả lời ngắn và rõ nghĩa. Câu dài hoặc mơ hồ ("cô ấy hỏi đường", "tôi không nhớ") trả null,
     * vì trả lời "Có" sẽ báo cho người thân: thà hỏi lại bằng hai nút còn hơn hiểu nhầm.
     */
    fun hieuCoKhong(cacCau: List<String>): Boolean? {
        // Chỉ tin phương án đầu tiên (máy nghe chắc nhất). Phương án phụ kiểu ["cô", "có"] không đủ để báo cho người thân.
        for (c in cacCau.take(1)) {
            val cau = Normalizer.normalize(c.lowercase(), Normalizer.Form.NFC)
                .replace(Regex("[^\\p{L}\\p{Nd} ]"), " ").trim().split(Regex(" +"))
                .filter { it.isNotBlank() && it !in TU_DEM }.joinToString(" ")
            if (cau.isBlank()) continue
            if (cau in CAU_CO) return true
            if (cau in CAU_KHONG) return false
            // Máy nghe trả chữ không dấu: so bản bỏ dấu, chỉ khi cả câu vốn không có dấu.
            if (cau == gap(cau)) {
                if (CAU_CO.any { gap(it) == cau }) return true
                if (CAU_KHONG.any { gap(it) == cau }) return false
            }
        }
        return null
    }

    private val MA_XAC_THUC = Regex(
        "otp|ma xac (thuc|minh|nhan)|ma dang nhap|ma giao dich|ma dung mot lan|mat khau dung mot lan|ma bao mat|ma kich hoat|" +
            "ma an toan|ma pin|ma code|verification code|security code|one[- ]time|passcode"
    )
    private val KHONG_PHAI_MA = Regex("ho so|nam|ngay|thang|phi|tien|don hang|hop dong|han")
    /** Một dãy chữ số, cho phép cách nhau bằng dấu cách (kể cả dấu cách không ngắt), dấu chấm, gạch nối. */
    private val CHUOI_SO = Regex("\\d(?:[ \\u00A0\\u202F.\\-\\u2010-\\u2015]?\\d)*")
    private fun soChuSo(s: String) = s.count { it.isDigit() }

    /** Tin chứa mã xác thực: Lá chắn bỏ qua hoàn toàn, không phân tích, không gửi đi đâu. Mã có thể viết tách nhóm ("12 34 56"). */
    fun laOtp(tin: String): Boolean {
        val g = gap(tin)
        // Mã phải nằm gần chữ "mã xác thực" (trong 40 ký tự sau hoặc 15 ký tự trước), không tính con số ở chỗ khác trong tin.
        return MA_XAC_THUC.findAll(g).any { m ->
            val sau = g.substring(m.range.last + 1, minOf(g.length, m.range.last + 41))
            val truoc = g.substring(maxOf(0, m.range.first - 15), m.range.first)
            // Con số đứng sau "hồ sơ", "năm", "phí"… là số của thứ khác, không phải mã ("mã kích hoạt cho hồ sơ 2026").
            CHUOI_SO.findAll(sau).any { soChuSo(it.value) in 4..8 && !KHONG_PHAI_MA.containsMatchIn(sau.substring(0, it.range.first)) } ||
                CHUOI_SO.findAll(truoc).any { soChuSo(it.value) in 4..8 }
        }
    }

    /** Che mọi dãy từ 4 chữ số (số điện thoại, số tài khoản, mã) trước khi gửi ra khỏi máy. Số tiền kiểu "200k" được giữ. */
    fun che(tin: String): String = CHUOI_SO.replace(tin) { if (soChuSo(it.value) >= 4) "•••" else it.value }

    /** Thêm cho lời kể lại bằng miệng: người kể nói gọn hơn tin nhắn. */
    private val LUAT_LOI_KE: List<Pair<String, List<Regex>>> = listOf(
        "Đòi nạp tiền, chuyển tiền trước" to listOf("chuyen tien", "chuyen khoan", "rut tien", "nop tien", "gui tien"),
        "Giả danh cơ quan, ngân hàng" to listOf("ngan hang", "dieu tra", "vu an", "rua tien", "lenh bat", "buu dien", "dien luc", "thue"),
        "Đòi mã xác thực, mật khẩu" to listOf("ma otp", "ma xac (thuc|minh|nhan)", "mat khau", "so the"),
        "Bắt giữ bí mật" to listOf("khong (duoc |cho )?(noi|ke|bao)", "bi mat", "dung noi"),
        "Giục làm gấp" to listOf("gap", "ngay bay gio", "nhanh"),
    ).map { (ten, mau) -> ten to mau.map { Regex(it) } }

    private const val DUONG_DAN_RUT_GON = "Đường dẫn rút gọn"
    private const val GIUC_GAP = "Giục làm gấp"
    private const val DOI_MA = "Đòi mã xác thực, mật khẩu"
    /** Hai dấu hiệu này tin thật cũng hay có (tin giao hàng: "giao trong hôm nay, theo dõi tại bit.ly/…"): riêng chúng thì chưa đủ để lên tiếng. */
    private val DAU_HIEU_YEU = setOf(GIUC_GAP, DUONG_DAN_RUT_GON)
    fun coDauHieuManh(nhom: List<String>) = nhom.any { it !in DAU_HIEU_YEU }
    /** Lời dặn của chính ngân hàng ("không cung cấp mật khẩu cho ai") không phải là đòi mật khẩu. */
    private val PHU_DINH_CO_DAU = Regex("(không|đừng|chẳng|cấm|chớ)( bao giờ| được phép| được| nên| hề)? $")
    /** Tin không dấu: "dung" có thể là "đừng" hoặc "dùng" (người dùng, sử dụng). */
    private val PHU_DINH_KHONG_DAU = Regex("(?<!nguoi )(?<!su )(khong|dung|chang|cam)( bao gio| duoc phep| duoc| nen| he)? $")
    /** [truoc] là đoạn chữ thường, còn nguyên dấu, đứng ngay trước chỗ khớp. */
    private fun biPhuDinh(truoc: String): Boolean {
        val t = Normalizer.normalize(truoc, Normalizer.Form.NFC)
        return if (t.any { it.code > 127 }) PHU_DINH_CO_DAU.containsMatchIn(t) else PHU_DINH_KHONG_DAU.containsMatchIn(t)
    }

    private val LUAT: List<Pair<String, List<Regex>>> = listOf(
        "Hứa thu nhập cao bất thường" to listOf(
            "viec nhe luong cao", "luong cao", "hoa hong( \\d+ ?%)?", "\\d+ ?(k|nghin|trieu|tr) ?/ ?(ngay|gio|don)",
            "thu nhap (cao|\\d+)", "cong tac vien", "kiem tien (online|tai nha)",
        ),
        "Đòi nạp tiền, chuyển tiền trước" to listOf(
            "nap truoc( \\d+ ?(k|nghin|trieu|tr))?", "nap tien", "chuyen khoan truoc", "dat coc", "phi kich hoat",
            "chuyen (tien|khoan) (vao|den|toi|ngay)", "tai khoan tam giu", "tai khoan an toan",
            "thanh toan (\\d+ ?(k|nghin|trieu|tr) )?phi", "(dong|nop) (\\d+ ?(k|nghin|trieu|tr) )?phi", "(?<!mien )phi giao lai",
        ),
        "Giục làm gấp" to listOf(
            "trong hom nay", "ngay lap tuc", "lap tuc", "trong (vong )?\\d+ ?(phut|gio|h)", "so luong co han", "khan cap", "nhanh tay", "sap het han",
        ),
        DUONG_DAN_RUT_GON to listOf("(https?://)?(bit\\.ly|tinyurl\\.com|t\\.co|rb\\.gy|cutt\\.ly|s\\.id|goo\\.gl)/[^\\s]+"),
        "Tên miền lạ" to listOf("(https?://)?[a-z0-9.-]+\\.(top|xyz|click|icu|cyou|vip|cc|info)(/[^\\s]*)?"),
        "Giả danh cơ quan, ngân hàng" to listOf(
            "cong an", "vien kiem sat", "toa an", "co quan dieu tra", "can bo dieu tra", "vneid", "dinh danh muc \\d",
            "tai khoan (cua )?(ban|quy khach|anh|chi|ong|ba) (da |se |dang )?bi (khoa|dong bang|tam khoa|phong toa)",
        ),
        "Đòi mã xác thực, mật khẩu" to listOf("(cung cap|doc|gui|nhap|cho) (ma )?(otp|ma xac (thuc|minh|nhan)|mat khau)"),
        "Báo trúng thưởng, tặng quà" to listOf("trung thuong", "nhan qua", "qua tang", "tri an khach hang"),
        "Bắt giữ bí mật" to listOf("khong (duoc )?(noi|ke|bao) (voi|cho) ai", "giu bi mat"),
    ).map { (ten, mau) -> ten to mau.map { Regex(it) } }

    /** Lời chủ máy kể lại cuộc gọi (A04c). Dùng thêm bộ luật cho lời nói; chỉ cần 2 nhóm dấu hiệu là Nguy hiểm. */
    fun phanTichLoiKe(loi: String): KetQuaTin {
        val kq = phanTich(loi, LUAT + LUAT_LOI_KE)
        val n = kq.nhom.size
        return kq.copy(muc = if (n >= 2) Muc.NGUY_HIEM else if (n == 1) Muc.NGHI_NGO else Muc.CHUA_CO_DU_LIEU)
    }

    fun phanTich(tin: String): KetQuaTin = phanTich(tin, LUAT)

    private fun phanTich(tin: String, luat: List<Pair<String, List<Regex>>>): KetQuaTin {
        val g = gap(tin)
        val thuong = buildString(tin.length) { for (ch in tin) append(ch.lowercaseChar()) }   // cùng vị trí với g
        val tim = mutableListOf<DauHieu>()
        for ((ten, mau) in luat) for (r in mau) for (m in r.findAll(g)) {
            if (ten == DOI_MA && biPhuDinh(thuong.substring(maxOf(0, m.range.first - 28), m.range.first))) continue
            // Một đoạn chỉ tô một lần: bỏ kết quả nằm trong đoạn đã có.
            if (tim.none { m.range.first >= it.dau && m.range.last < it.cuoi }) tim += DauHieu(ten, m.range.first, m.range.last + 1)
        }
        val nhom = tim.map { it.nhom }.distinct()
        val muc = when {
            nhom.size >= 3 -> Muc.NGUY_HIEM
            nhom.size == 2 && coDauHieuManh(nhom) -> Muc.NGHI_NGO
            else -> Muc.CHUA_CO_DU_LIEU
        }
        val kieu = when {
            "Hứa thu nhập cao bất thường" in nhom -> "Lừa đảo tuyển cộng tác viên"
            "Giả danh cơ quan, ngân hàng" in nhom -> "Giả danh cơ quan, ngân hàng"
            "Báo trúng thưởng, tặng quà" in nhom -> "Báo trúng thưởng giả"
            "Đòi mã xác thực, mật khẩu" in nhom -> "Lừa lấy mã xác thực"
            else -> "Tin nhắn có dấu hiệu lừa đảo"
        }
        val loi = buildList {
            if ("Đòi nạp tiền, chuyển tiền trước" in nhom) add("Đừng nạp tiền, đừng chuyển khoản.")
            if (DUONG_DAN_RUT_GON in nhom || "Tên miền lạ" in nhom) add("Đừng mở đường dẫn trong tin.")
            if ("Đòi mã xác thực, mật khẩu" in nhom) add("Đừng đọc mã xác thực cho ai.")
            if (isEmpty()) add("Đừng làm theo tin này khi chưa hỏi người thân.")
        }.joinToString(" ")
        return KetQuaTin(muc, kieu, loi, tim.sortedBy { it.dau })
    }
}

/** N4. Đọc thông báo của các ứng dụng nhắn tin. Chỉ xem tiêu đề và nội dung hiện trên thông báo. */
class NgheThongBao : NotificationListenerService() {
    companion object {
        val APP_NHAN_TIN = setOf(
            "com.google.android.apps.messaging", "com.android.mms", "com.samsung.android.messaging",
            "com.zing.zalo", "com.facebook.orca", "org.telegram.messenger", "com.viber.voip", "com.whatsapp",
        )
    }

    /** Máy ngắt kết nối (thường do tiết kiệm pin): xin nối lại ngay. */
    override fun onListenerDisconnected() {
        NhatKy.ghi(this, "Máy ngắt quyền đọc thông báo, đang xin nối lại")
        try { requestRebind(android.content.ComponentName(this, NgheThongBao::class.java)) } catch (_: Exception) {}
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in APP_NHAN_TIN) return
        val n = sbn.notification ?: return
        if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
        val e = n.extras ?: return
        val nguoi = e.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val tin = (e.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: e.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
        val c = applicationContext
        Luong.nen { XuLyTinNhan.xuLy(c, nguoi, tin) }
    }
}

object XuLyTinNhan {
    private var daXem: LinkedHashSet<String>? = null

    /** true nếu tin này chưa từng được xét. Chỉ lưu mã băm, không lưu nội dung. */
    @Synchronized
    private fun lanDau(c: Context, ma: String): Boolean {
        val ds = daXem ?: LinkedHashSet(CaiDat.tinDaXet(c)).also { daXem = it }
        if (!ds.add(ma)) return false
        while (ds.size > 150) ds.remove(ds.first())
        CaiDat.datTinDaXet(c, ds.toList())
        return true
    }

    fun xuLy(c: Context, nguoi: String, tin: String) {
        if (tin.isBlank()) return   // tin ngắn vẫn xét: "Nạp tiền ở pay.top" đã đủ hai dấu hiệu
        // Ứng dụng nhắn tin cập nhật cùng một thông báo nhiều lần: mỗi tin chỉ xét một lần.
        val ma = (nguoi + "|" + tin).hashCode()
        if (!lanDau(c, ma.toString())) return
        if (LocTinNhan.laOtp(tin)) {
            NhatKy.ghi(c, "Bỏ qua một tin có mã xác thực")
            return
        }
        val kq = LocTinNhan.phanTich(tin)
        if (kq.nhom.isEmpty()) return   // không có dấu hiệu nào: không làm gì, không gửi đi đâu
        // Người gửi hiện bằng số (chưa lưu danh bạ): tra xem số ấy có đang bị báo không.
        val soGui = if (Regex("^\\+?[\\d .-]{8,}$").matches(nguoi.trim())) TraCuu.chuanHoa(nguoi) else ""
        val soBiBao = if (soGui.isNotBlank()) TraCuu.tra(c, soGui).takeIf { it.muc == Muc.NGUY_HIEM }?.soNguoiBao ?: 0 else 0
        val soDauHieu = kq.nhom.size + if (soBiBao > 0) 1 else 0
        if (soDauHieu < 2) return       // chưa đủ dấu hiệu để lên tiếng
        if (!LocTinNhan.coDauHieuManh(kq.nhom) && soBiBao == 0) return   // chỉ có "giục gấp" và đường dẫn rút gọn: tin giao hàng thật cũng vậy
        val quen = laTenTrongDanhBa(c, nguoi)
        NhatKy.ghi(c, "Tin nhắn đáng ngờ: $soDauHieu dấu hiệu" + (if (soBiBao > 0) ", số gửi đang bị báo" else "") + if (quen) " (người gửi có trong danh bạ)" else "")
        val id = ThongBao.ID_TIN_NHAN + (ma and 0x3ff)
        val mo = Intent(c, PhanTichTinNhanActivity::class.java)
            .putExtra("nguoi", nguoi).putExtra("tin", tin).putExtra("quen", quen).putExtra("id", id).putExtra("soBiBao", soBiBao)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val boQua = PendingIntent.getBroadcast(
            c, id, Intent(c, NutThongBao::class.java).putExtra("id", id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val moPi = ThongBao.moManHinh(c, mo, id)
        val trich = tin.replace('\n', ' ').take(46).trimEnd()
        ThongBao.canhBao(
            c, id,
            if (quen) "Tin nhắn đáng ngờ" else "Tin nhắn đáng ngờ từ người lạ",
            "“$trich…” có $soDauHieu dấu hiệu lừa đảo.",
            moPi,
            noiDungKhoa = "Có một tin nhắn có $soDauHieu dấu hiệu lừa đảo. Mở khóa để xem.",
            nut = listOf(
                NotificationCompat.Action(0, "Xem phân tích", moPi),
                NotificationCompat.Action(0, "Bỏ qua", boQua),
            ),
        )
    }

    private fun laTenTrongDanhBa(c: Context, ten: String): Boolean = try {
        ten.isNotBlank() && c.contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI, arrayOf(ContactsContract.Contacts._ID),
            "${ContactsContract.Contacts.DISPLAY_NAME} = ?", arrayOf(ten), null,
        )?.use { it.moveToFirst() } == true
    } catch (e: Exception) {
        false
    }
}

/** A05b: tin nhắn với từng dấu hiệu được tô đỏ. */
class PhanTichTinNhanActivity : Activity() {
    private fun <T : View> v(id: Int): T = findViewById(id)

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setContentView(R.layout.phan_tich_tin_nhan)
        val nguoi = intent.getStringExtra("nguoi").orEmpty()
        val tin = intent.getStringExtra("tin").orEmpty()
        val quen = intent.getBooleanExtra("quen", false)
        ThongBao.huy(this, intent.getIntExtra("id", 0))
        val soBiBao = intent.getIntExtra("soBiBao", 0)
        val kq0 = LocTinNhan.phanTich(tin)
        // Số gửi đang bị cộng đồng báo được tính như một dấu hiệu nữa.
        val soDauHieu = kq0.nhom.size + if (soBiBao > 0) 1 else 0
        val kq = kq0.copy(muc = if (soDauHieu >= 3) Muc.NGUY_HIEM else Muc.NGHI_NGO)

        v<TextView>(R.id.nguoiGui).text = if (quen) nguoi else "Người lạ" + if (nguoi.isNotBlank()) " · $nguoi" else ""
        v<TextView>(R.id.noiDung).text = SpannableString(tin).apply {
            for (d in kq.dauHieu) {
                if (d.cuoi > length) continue
                setSpan(BackgroundColorSpan(getColor(R.color.danger_c)), d.dau, d.cuoi, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                setSpan(ForegroundColorSpan(getColor(R.color.danger_ink)), d.dau, d.cuoi, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                setSpan(StyleSpan(Typeface.BOLD), d.dau, d.cuoi, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        hienKetQua(kq.muc, kq.kieu, kq.loiKhuyen)
        v<TextView>(R.id.nguon).text = "Dấu hiệu nhận ra (lọc trên máy)"
        v<TextView>(R.id.dauHieu).text = (kq.nhom + if (soBiBao > 0) listOf("Số gửi tin đã bị $soBiBao người báo") else emptyList()).joinToString("\n") { "•  $it" }

        // Chỉ tin đã vượt ngưỡng trên máy mới tới đây, và chỉ gửi bản đã che số.
        if (!LocTinNhan.laOtp(tin)) Luong.nen {
            val ai = Api.analyzeMessage(this, LocTinNhan.che(tin)) ?: return@nen
            // Máy chủ không được làm nhẹ đi cảnh báo app đã tự thấy trên máy: AI "chưa đủ căn cứ" thì giữ nguyên kết quả lọc trên máy.
            if (Api.nang(ai.muc) < Api.nang(kq.muc)) return@nen
            Luong.chinh {
                if (isFinishing || isDestroyed) return@chinh
                hienKetQua(ai.muc, ai.kieu.ifBlank { kq.kieu }, ai.giaiThich.ifBlank { kq.loiKhuyen })
                if (ai.dauHieu.isNotEmpty()) {
                    v<TextView>(R.id.nguon).text = "AI giải thích"
                    v<TextView>(R.id.dauHieu).text = ai.dauHieu.joinToString("\n") { "•  $it" }
                }
            }
        }

        v<Button>(R.id.nutBao).setOnClickListener {
            if (LocTinNhan.laOtp(tin)) return@setOnClickListener   // tin có mã xác thực không bao giờ rời máy
            Luong.nen {
                // Chỉ coi là đã gửi khi máy chủ trả về báo cáo có mã. Kiểu lừa đảo do máy chủ tự phân loại lại từ nội dung đã che số.
                val daGui = Api.createReport(this, nguoi, tin, LocTinNhan.che(tin))
                Luong.chinh {
                    Toast.makeText(this, if (daGui) "Đã gửi, chờ đội tình nguyện duyệt" else "Chưa gửi được, thử lại sau", Toast.LENGTH_LONG).show()
                    if (daGui) finish()
                }
            }
        }
        v<Button>(R.id.nutKhong).setOnClickListener { finish() }
    }

    private fun hienKetQua(muc: Muc, kieu: String, loi: String) {
        val nguyHiem = muc == Muc.NGUY_HIEM
        v<View>(R.id.theKq).setBackgroundResource(if (nguyHiem) R.drawable.the_do else R.drawable.the_vang)
        v<TextView>(R.id.muc).apply { text = muc.ten; setTextColor(getColor(if (nguyHiem) R.color.danger else R.color.warn)) }
        v<TextView>(R.id.kieu).text = kieu
        v<TextView>(R.id.loiKhuyen).text = loi
    }
}
