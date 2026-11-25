package vn.doi18.lachanso

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

/** Luồng nền dùng chung và luồng giao diện. */
object Luong {
    private val nen = Executors.newCachedThreadPool()
    private val chinh = Handler(Looper.getMainLooper())
    fun nen(viec: () -> Unit) {
        nen.execute {
            try { viec() } catch (e: Throwable) { Log.e("LaChan", "Lỗi luồng nền", e) }
        }
    }
    fun chinh(viec: () -> Unit) = chinh.post(viec)
    fun sau(ms: Long, viec: () -> Unit) = chinh.postDelayed(viec, ms)
}

class LaChanApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ThongBao.taoKenh(this)
        DichVuLaChan.batDau(this)
    }
}

/** Cài đặt lưu trên máy. */
object CaiDat {
    private fun p(c: Context) = c.getSharedPreferences("cai-dat", Context.MODE_PRIVATE)
    private fun chu(c: Context, k: String, md: String = "") = p(c).getString(k, md) ?: md
    private fun dat(c: Context, k: String, v: String) = p(c).edit().putString(k, v).apply()
    private fun co(c: Context, k: String, md: Boolean) = p(c).getBoolean(k, md)
    private fun dat(c: Context, k: String, v: Boolean) = p(c).edit().putBoolean(k, v).apply()

    fun tenNguoiThan(c: Context) = chu(c, "ten-nguoi-than", "Minh").ifBlank { "người thân" }
    fun datTenNguoiThan(c: Context, v: String) = dat(c, "ten-nguoi-than", v.trim())
    fun soNguoiThan(c: Context) = chu(c, "so-nguoi-than")
    fun datSoNguoiThan(c: Context, v: String) = dat(c, "so-nguoi-than", v.trim())

    /** Địa chỉ máy chủ của đội (mảng 2). Để trống thì chỉ dùng dữ liệu trên máy. */
    fun mayChu(c: Context) = chu(c, "may-chu").trimEnd('/')
    fun datMayChu(c: Context, v: String) = dat(c, "may-chu", v.trim())

    /**
     * Khóa AI (OpenAI) do chủ máy tự nhập, để cuộc gọi video hiểu ý người học khi không có máy chủ của đội.
     * Lưu trong tệp riêng của app trên chính máy này, không nằm trong APK, không ghi vào nhật ký, không gửi đi đâu ngoài nhà cung cấp AI.
     */
    private fun pKhoa(c: Context) = c.getSharedPreferences("khoa-ai", Context.MODE_PRIVATE)
    fun khoaAI(c: Context) = pKhoa(c).getString("openai", "") ?: ""
    fun datKhoaAI(c: Context, v: String) = pKhoa(c).edit().putString("openai", v.trim()).apply()
    fun moHinhAI(c: Context) = (pKhoa(c).getString("mo-hinh", "") ?: "").ifBlank { "gpt-6-luna" }
    /** Khóa Gemini: chỉ dùng để đọc thành tiếng các câu nhân vật nói NGOÀI bộ thu sẵn, bằng đúng giọng đã thu (Aoede). */
    fun khoaGiong(c: Context) = pKhoa(c).getString("gemini", "") ?: ""
    fun datKhoaGiong(c: Context, v: String) = pKhoa(c).edit().putString("gemini", v.trim()).apply()
    /** Gọi video kiểu "AI nói chuyện trực tiếp": mỗi lượt AI vừa đáp vừa chấm, đọc bằng giọng Gemini. Tắt thì dùng bộ câu thu sẵn. */
    fun goiSong(c: Context) = co(c, "goi-song", false)
    fun datGoiSong(c: Context, v: Boolean) = dat(c, "goi-song", v)

    fun hoiBangGiong(c: Context) = co(c, "hoi-bang-giong", true)
    fun datHoiBangGiong(c: Context, v: Boolean) = dat(c, "hoi-bang-giong", v)

    /** Chế độ trình diễn rút ngưỡng 5 phút xuống 15 giây để thử trong buổi demo. */
    fun trinhDien(c: Context) = co(c, "trinh-dien", false)
    fun datTrinhDien(c: Context, v: Boolean) = dat(c, "trinh-dien", v)
    /** Ngưỡng "đã nghe số chưa quen từ 5 phút" (giả thuyết ở màn D05). */
    fun nguongGiay(c: Context) = if (trinhDien(c)) 15 else 300
    /** Sau một cuộc gọi đáng ngờ, Lá chắn canh ứng dụng ngân hàng trong bao lâu. */
    fun cuaSoGiay(c: Context) = if (trinhDien(c)) 120 else 600

    fun thuMucGhiAm(c: Context) = chu(c, "thu-muc-ghi-am")
    fun datThuMucGhiAm(c: Context, v: String) = dat(c, "thu-muc-ghi-am", v)

    /** Gói ứng dụng dùng thay app ngân hàng khi thử (app ngân hàng tự chặn khi bật gỡ lỗi USB). */
    fun appThu(c: Context) = chu(c, "app-thu")
    fun datAppThu(c: Context, v: String) = dat(c, "app-thu", v.trim())

    /** Số của máy dùng để gọi thử: Lá chắn coi như số này đang bị báo lừa đảo. Chỉ để thử, không gửi đi đâu. */
    fun soThu(c: Context) = chu(c, "so-thu")
    fun datSoThu(c: Context, v: String) = dat(c, "so-thu", v.trim())

    /** Cách Bé Nai gọi chủ máy: bà, ông, cô, chú, bác, anh, chị, bạn. */
    fun xungHo(c: Context) = chu(c, "xung-ho", "bà").ifBlank { "bà" }
    fun datXungHo(c: Context, v: String) = dat(c, "xung-ho", v.trim().lowercase())

    /** Số do chính chủ máy bấm "Chặn số này". Lá chắn không tự chặn số nào khác. */
    fun soChan(c: Context): Set<String> = p(c).getStringSet("so-chan", emptySet()) ?: emptySet()
    fun themSoChan(c: Context, so: String) {
        val s = TraCuu.chuanHoa(so)
        if (s.isNotBlank()) p(c).edit().putStringSet("so-chan", soChan(c) + s).apply()
    }
    fun boChanTatCa(c: Context) = p(c).edit().remove("so-chan").apply()

    /** Mã băm các tin đã xét (không lưu nội dung), để app khởi động lại không cảnh báo lại tin cũ. */
    fun tinDaXet(c: Context): List<String> = chu(c, "tin-da-xet").split(',').filter { it.isNotBlank() }
    fun datTinDaXet(c: Context, ds: List<String>) = dat(c, "tin-da-xet", ds.takeLast(150).joinToString(","))

    /** Khoảng canh ứng dụng ngân hàng, lưu lại để không mất khi máy tắt app giữa chừng. */
    fun ruiRo(c: Context): Triple<Long, Long, String> = Triple(p(c).getLong("rui-ro-den", 0), p(c).getLong("rui-ro-tu", 0), chu(c, "rui-ro-so"))
    fun datRuiRo(c: Context, den: Long, tu: Long, so: String) = p(c).edit().putLong("rui-ro-den", den).putLong("rui-ro-tu", tu).putString("rui-ro-so", so).apply()

    /** Đã có lúc bật đủ ba lớp: từ đó thiếu lớp nào thì báo "Lá chắn đang ngủ". */
    fun daTungDu(c: Context) = co(c, "da-tung-du", false)
    fun datDaTungDu(c: Context, v: Boolean) = dat(c, "da-tung-du", v)

    /** Lần gần nhất Bé Nai hỏi sau một cuộc gọi từ số lạ nghe lâu (D05: mỗi ngày tối đa một câu). */
    fun hoiGanNhat(c: Context) = p(c).getLong("hoi-gan-nhat", 0)
    fun datHoiGanNhat(c: Context, luc: Long) = p(c).edit().putLong("hoi-gan-nhat", luc).apply()

    /** Thời điểm bắt đầu của cuộc gọi đã xử lý xong gần nhất, để một cuộc gọi không bị hỏi hai lần. */
    fun cuocDaXuLy(c: Context) = p(c).getLong("cuoc-da-xu-ly", 0)
    fun datCuocDaXuLy(c: Context, luc: Long) = p(c).edit().putLong("cuoc-da-xu-ly", luc).apply()

    /** Phiên gọi đang nghe, lưu tối thiểu để còn xử lý được nếu máy tắt app giữa cuộc gọi. */
    class Phien(val tu: Long, val so: String, val den: Boolean)
    fun phienDangNghe(c: Context) = Phien(p(c).getLong("phien-tu", 0), chu(c, "phien-so"), co(c, "phien-den", true))
    fun datPhienDangNghe(c: Context, tu: Long, so: String, den: Boolean) =
        p(c).edit().putLong("phien-tu", tu).putString("phien-so", so).putBoolean("phien-den", den).apply()
    /** Chỉ xóa nếu phiên đang lưu đúng là phiên [tu] (một cuộc gọi mới có thể đã bắt đầu trong lúc xử lý cuộc cũ). */
    fun xoaPhienDangNghe(c: Context, tu: Long) { if (p(c).getLong("phien-tu", 0) == tu) p(c).edit().remove("phien-tu").remove("phien-so").remove("phien-den").apply() }

    fun daXacNhan(c: Context, k: String) = co(c, "xac-nhan-$k", false)
    fun datDaXacNhan(c: Context, k: String, v: Boolean) = dat(c, "xac-nhan-$k", v)

    fun soTuDanhDauQuen(c: Context): Set<String> = p(c).getStringSet("so-quen", emptySet()) ?: emptySet()
    fun themSoQuen(c: Context, so: String) {
        if (so.isBlank()) return
        p(c).edit().putStringSet("so-quen", soTuDanhDauQuen(c) + TraCuu.chuanHoa(so)).apply()
    }
}

/** Xưng hô trong lời Bé Nai: [ban] là chủ máy, [toi] là Bé Nai tự xưng. */
class Xung(val ban: String) {
    @get:JvmName("banHoa") val Ban get() = ban.replaceFirstChar { it.uppercase() }
    val toi get() = if (ban in setOf("bà", "ông", "cô", "chú", "bác")) "con" else "mình"
    @get:JvmName("toiHoa") val Toi get() = toi.replaceFirstChar { it.uppercase() }
    /** Các câu thu sẵn của Bé Nai gọi chủ máy là "bà". */
    val laBa get() = ban == "bà"
}

fun Context.xung() = Xung(CaiDat.xungHo(this))

/** Nhật ký trên máy: xem được trong app, để thử khi không cắm USB. Không ghi nội dung tin nhắn hay cuộc gọi. */
object NhatKy {
    private const val TOI_DA = 150
    private val gio = SimpleDateFormat("HH:mm:ss", Locale.US)
    private fun tep(c: Context) = File(c.filesDir, "nhat-ky.txt")

    @Synchronized
    fun ghi(c: Context, dong: String) {
        Log.i("LaChan", dong)
        try {
            val t = tep(c)
            val cu = if (t.exists()) t.readLines() else emptyList()
            t.writeText((listOf("${gio.format(Date())}  $dong") + cu).take(TOI_DA).joinToString("\n"))
        } catch (_: Exception) {
        }
    }

    @Synchronized
    fun doc(c: Context): String = try { tep(c).takeIf { it.exists() }?.readText().orEmpty() } catch (_: Exception) { "" }

    @Synchronized
    fun xoa(c: Context) { tep(c).delete() }
}

/** Kênh và mã thông báo. */
object ThongBao {
    const val KENH_NEN = "nen"
    const val KENH_CANH_BAO = "canh-bao"
    const val ID_NEN = 1
    const val ID_DO_CHUONG = 2
    const val ID_SAU_GOI = 3
    const val ID_DUNG_LAI = 4
    const val ID_NGU = 5
    const val ID_TIN_NHAN = 100

    fun taoKenh(c: Context) {
        val nm = c.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(KENH_NEN, "Lá chắn đang bảo vệ", NotificationManager.IMPORTANCE_MIN).apply { setShowBadge(false) }
        )
        nm.createNotificationChannel(
            NotificationChannel(KENH_CANH_BAO, "Cảnh báo lừa đảo", NotificationManager.IMPORTANCE_HIGH).apply {
                enableVibration(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
        )
    }

    fun moManHinh(c: Context, intent: Intent, ma: Int): PendingIntent =
        PendingIntent.getActivity(c, ma, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun canhBao(
        c: Context, id: Int, tieuDe: String, noiDung: String,
        mo: PendingIntent? = null, toanManHinh: Boolean = false,
        nut: List<NotificationCompat.Action> = emptyList(),
        /** Khác null: thông báo có trích nội dung riêng tư. Trên màn hình khóa chỉ hiện câu chung này. */
        noiDungKhoa: String? = null,
    ) {
        val b = NotificationCompat.Builder(c, KENH_CANH_BAO)
            .setSmallIcon(R.drawable.ic_khien)
            .setColor(c.getColor(R.color.danger))
            .setContentTitle(tieuDe)
            .setContentText(noiDung)
            .setStyle(NotificationCompat.BigTextStyle().bigText(noiDung))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setGroup("canh-bao-$id")   // không gộp chung với thông báo "đang bảo vệ"
            .setAutoCancel(true)
        if (mo != null) {
            b.setContentIntent(mo)
            if (toanManHinh) b.setFullScreenIntent(mo, true)
        }
        nut.forEach { b.addAction(it) }
        if (noiDungKhoa != null) {
            b.setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            b.setPublicVersion(
                NotificationCompat.Builder(c, KENH_CANH_BAO).setSmallIcon(R.drawable.ic_khien).setColor(c.getColor(R.color.danger))
                    .setContentTitle(tieuDe).setContentText(noiDungKhoa).build()
            )
        }
        try {
            NotificationManagerCompat.from(c).notify(id, b.build())
        } catch (e: SecurityException) {
            NhatKy.ghi(c, "Chưa có quyền gửi thông báo")
        }
    }

    fun huy(c: Context, id: Int) = NotificationManagerCompat.from(c).cancel(id)
}

/** Nút "Bỏ qua" trên thông báo. */
class NutThongBao : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        ThongBao.huy(c, i.getIntExtra("id", 0))
    }
}

/** Giọng Bé Nai: phát tệp thu sẵn, không có thì đọc bằng giọng của máy. */
object Giong {
    private var mp: MediaPlayer? = null
    private var tts: TextToSpeech? = null
    private var ttsSan = false
    /** Tăng mỗi lần dừng: giọng của máy khởi tạo chậm, không được đọc một câu đã bị dừng từ trước. */
    @Volatile private var luot = 0

    /** Trả về mã lượt phát. Màn nào phát thì chỉ dừng đúng lượt của mình ([dung] với mã đó), không cắt tiếng của màn khác vừa mở. */
    fun phat(c: Context, tep: Int?, cau: String, xong: () -> Unit = {}): Int {
        dung()
        if (tep != null) {
            try {
                val p = MediaPlayer()
                p.setAudioAttributes(
                    AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build()
                )
                val afd = c.resources.openRawResourceFd(tep)
                p.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                afd.close()
                p.setOnCompletionListener { it.release(); if (mp === it) mp = null; xong() }
                p.setOnErrorListener { m, _, _ -> m.release(); if (mp === m) mp = null; xong(); true }
                p.prepare()
                p.start()
                mp = p
                return luot
            } catch (e: Exception) {
                NhatKy.ghi(c, "Không phát được tệp giọng, chuyển sang giọng của máy")
            }
        }
        return noi(c, cau, xong)
    }

    fun noi(c: Context, cau: String, xong: () -> Unit = {}): Int {
        val app = c.applicationContext
        val lan = luot
        fun doc() {
            if (lan != luot) return
            val t = tts ?: run { xong(); return }
            t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}
                override fun onDone(id: String?) { Luong.chinh(xong) }
                @Deprecated("Deprecated in Java")
                override fun onError(id: String?) { Luong.chinh(xong) }
            })
            t.speak(cau, TextToSpeech.QUEUE_FLUSH, null, "lachan")
        }
        if (ttsSan) { doc(); return lan }
        tts = TextToSpeech(app) { st ->
            val kq = if (st == TextToSpeech.SUCCESS) tts?.setLanguage(Locale("vi", "VN")) else null
            if (kq != null && kq != TextToSpeech.LANG_MISSING_DATA && kq != TextToSpeech.LANG_NOT_SUPPORTED) {
                ttsSan = true
                Luong.chinh { doc() }
            } else {
                NhatKy.ghi(app, "Máy không có giọng đọc tiếng Việt")
                try { tts?.shutdown() } catch (_: Exception) {}
                tts = null
                Luong.chinh(xong)
            }
        }
        return lan
    }

    /** [neuLa] khác null: chỉ dừng khi lượt đang phát đúng là lượt đó. */
    fun dung(neuLa: Int? = null) {
        if (neuLa != null && neuLa != luot) return
        luot++
        try { mp?.release() } catch (_: Exception) {}
        mp = null
        try { tts?.stop() } catch (_: Exception) {}
    }
}

fun Context.goiDien(so: String) {
    if (so.isBlank()) return
    try {
        startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$so")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {
    }
}
