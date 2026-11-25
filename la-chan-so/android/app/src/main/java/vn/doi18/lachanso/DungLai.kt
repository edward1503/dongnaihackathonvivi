package vn.doi18.lachanso

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.telecom.TelecomManager
import android.view.ContextThemeWrapper
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * N5. Dịch vụ chạy nền: giữ cho Lá chắn không bị máy tắt, và trong lúc có rủi ro
 * (đang nghe số chưa quen, hoặc vừa xong một cuộc gọi đáng ngờ) thì mỗi giây xem ứng dụng nào đang mở.
 * Lúc không có rủi ro, dịch vụ không đọc gì cả.
 */
class DichVuLaChan : Service() {
    companion object {
        @Volatile var dangChay = false; private set
        /** Ứng dụng đang ở trước mặt người dùng có phải ứng dụng ngân hàng không (cập nhật mỗi giây trong lúc canh). */
        @Volatile var dangONganHang = false; private set

        fun batDau(c: Context) {
            if (dangChay) return
            try {
                ContextCompat.startForegroundService(c, Intent(c, DichVuLaChan::class.java))
            } catch (e: Exception) {
                NhatKy.ghi(c, "Chưa chạy nền được (${e.javaClass.simpleName})")
            }
        }

        /** Tên gói các ứng dụng ngân hàng, ví phổ biến. Cần đội rà lại trên máy thật trước buổi trình diễn. */
        val NGAN_HANG = setOf(
            "com.VCB", "com.vietinbank.ipay", "com.vnpay.bidv", "com.bidv.smartbanking", "com.vnpay.Agribank3g",
            "vn.com.techcombank.bb.app", "com.mbmobile", "com.tpb.mb.gprsandroid", "com.vnpay.vpbankonline",
            "mobile.acb.com.vn", "com.sacombank.ewallet", "com.vib.myvib2", "com.vnpay.hdbank",
            "vn.com.msb.smartBanking", "com.ocb.omniextra", "vn.shb.mbanking", "com.vnpay.SCB",
            "com.mservice.momotransfer", "vn.com.vng.zalopay", "com.viettel.viettelpay",
        )

        fun laNganHang(c: Context, goi: String) = goi in NGAN_HANG || (goi.isNotBlank() && goi == CaiDat.appThu(c))

        /** Đọc lại ngay lúc này: ứng dụng trước mặt người dùng có còn là ứng dụng ngân hàng không. Không đọc được thì tin lần kiểm gần nhất. */
        fun conONganHang(c: Context): Boolean = try {
            val gio = System.currentTimeMillis()
            val sk = c.getSystemService(UsageStatsManager::class.java).queryEvents(gio - 10 * 60_000, gio)
            val e = UsageEvents.Event()
            var cuoi: String? = null
            while (sk.hasNextEvent()) { sk.getNextEvent(e); if (e.eventType == UsageEvents.Event.ACTIVITY_RESUMED) cuoi = e.packageName }
            if (cuoi == null) dangONganHang else laNganHang(c, cuoi!!)
        } catch (ex: Exception) {
            dangONganHang
        }
    }

    private val h = Handler(Looper.getMainLooper())
    private var appCuoi: String? = null
    private var docTu = 0L
    private val vong = object : Runnable {
        override fun run() {
            try { kiemTra() } catch (e: Exception) { NhatKy.ghi(this@DichVuLaChan, "Lỗi khi canh ứng dụng: ${e.javaClass.simpleName}") }
            h.postDelayed(this, 1000)
        }
    }

    override fun onBind(i: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val tb: Notification = NotificationCompat.Builder(this, ThongBao.KENH_NEN)
            .setSmallIcon(R.drawable.ic_khien)
            .setContentTitle("Lá chắn đang bảo vệ")
            .setContentIntent(ThongBao.moManHinh(this, Intent(this, MainActivity::class.java), 0))
            .setOngoing(true)
            .setGroup("nen")
            .build()
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(ThongBao.ID_NEN, tb, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            else startForeground(ThongBao.ID_NEN, tb)
        } catch (e: Exception) {
            // Android 12 trở lên không cho chạy nền lại khi app đang ở nền và chưa đủ quyền: chờ lần mở app sau.
            NhatKy.ghi(this, "Máy chưa cho chạy nền lại (${e.javaClass.simpleName})")
            stopSelf()
            return
        }
        dangChay = true
        RuiRo.napLai(this)
        NhatKy.ghi(this, "Lá chắn bắt đầu chạy nền")
        h.post(vong)
    }

    override fun onStartCommand(i: Intent?, flags: Int, startId: Int) = START_STICKY

    override fun onDestroy() {
        h.removeCallbacks(vong)
        DungLai.thuLopPhu(applicationContext)   // dịch vụ dừng thì không còn ai gỡ lớp phủ: gỡ ngay
        if (dangChay) NhatKy.ghi(this, "Lá chắn bị dừng chạy nền")
        dangChay = false
        super.onDestroy()
    }

    private var dem = 0
    private var daBaoNgu = false
    private var dangCanh = false

    /**
     * E01a. Mỗi phút xem ba lớp còn đủ không. Đã từng bật đủ mà nay thiếu (máy thu hồi quyền, người dùng lỡ tắt)
     * thì báo một lần "Lá chắn đang ngủ"; bật lại đủ thì gỡ thông báo.
     */
    private fun kiemTraLop() {
        val n = Quyen.soLopDaBat(this)
        if (n == 3) {
            if (!CaiDat.daTungDu(this)) CaiDat.datDaTungDu(this, true)
            if (daBaoNgu) { daBaoNgu = false; ThongBao.huy(this, ThongBao.ID_NGU); NhatKy.ghi(this, "Đã bật lại đủ 3 lớp") }
        } else if (CaiDat.daTungDu(this) && !daBaoNgu) {
            daBaoNgu = true
            NhatKy.ghi(this, "Lá chắn đang ngủ: chỉ còn $n/3 lớp")
            ThongBao.canhBao(
                this, ThongBao.ID_NGU, "Lá chắn đang ngủ", "Chỉ còn $n/3 lớp bảo vệ. Chạm để bật lại.",
                ThongBao.moManHinh(this, Intent(this, ThietLapActivity::class.java), ThongBao.ID_NGU),
            )
        }
    }

    private fun kiemTra() {
        if (dem++ % 60 == 0) kiemTraLop()
        val gio = System.currentTimeMillis()
        val kq = PhienGoi.ketQua
        val dangGoi = PhienGoi.trangThai == PhienGoi.DANG_NGHE && PhienGoi.quen == false && kq?.muc != Muc.AN_TOAN
        val giay = if (dangGoi) (SystemClock.elapsedRealtime() - PhienGoi.batDauNghe) / 1000 else 0
        val sauGoi = RuiRo.dangMo()
        if (!dangGoi && !sauGoi) {
            if (dangCanh) {
                // Vừa hết lý do canh: gỡ lớp phủ dự phòng (kể cả lượt đang chờ vẽ) và thông báo "Dừng lại" còn sót.
                dangCanh = false
                DungLai.thuLopPhu(applicationContext)
                ThongBao.huy(this, ThongBao.ID_DUNG_LAI)
            }
            appCuoi = null; docTu = 0
            return
        }
        dangCanh = true
        if (DungLai.coLopPhu) {
            // Lớp phủ không tự biết người dùng đã rời app ngân hàng (bấm Home): dịch vụ phải gỡ giúp.
            val app = if (Quyen.xemAppDangMo(this)) appDangMo(gio) else null
            if (app != null && !laNganHang(this, app)) DungLai.thuLopPhu(applicationContext)
            return
        }
        if (!Quyen.xemAppDangMo(this)) return
        // Đọc ứng dụng trước mặt cả trong lúc tạm nghỉ, để lượt vẽ dự phòng biết người dùng còn ở app ngân hàng hay không.
        val app = appDangMo(gio)
        dangONganHang = app != null && laNganHang(this, app)
        if (gio < RuiRo.tamNgungDen || DungLai.dangHien) return
        if (!dangONganHang) return
        when {
            dangGoi && (giay >= CaiDat.nguongGiay(this) || kq?.muc == Muc.NGUY_HIEM) -> DungLai.hien(this, dangGoi = true, giay = giay)
            sauGoi -> DungLai.hien(this, dangGoi = false, phut = (gio - RuiRo.ketThucLuc) / 60_000)
        }
    }

    /** Ứng dụng vừa được đưa lên trước màn hình, đọc từ nhật ký sử dụng của máy (không đọc nội dung ứng dụng). */
    private fun appDangMo(gio: Long): String? {
        val usm = getSystemService(UsageStatsManager::class.java)
        val tu = if (docTu == 0L) gio - 30 * 60_000 else docTu
        val sk = usm.queryEvents(tu, gio)
        val e = UsageEvents.Event()
        while (sk.hasNextEvent()) {
            sk.getNextEvent(e)
            if (e.eventType == UsageEvents.Event.ACTIVITY_RESUMED) appCuoi = e.packageName
        }
        docTu = gio - 2000
        return appCuoi
    }
}

/** Sau khi mở máy hoặc cập nhật app: chạy nền lại. */
class KhoiDongLai : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        DichVuLaChan.batDau(c.applicationContext)
    }
}

/** A10a, A10b: màn "Dừng lại". Mở bằng Activity; nếu máy không cho mở từ nền thì vẽ lớp phủ toàn màn hình. */
object DungLai {
    @Volatile var dangHien = false
    private var lopPhu: View? = null
    /** Tăng mỗi lần mở hoặc đóng, để đường dự phòng biết mình còn hợp lệ không. */
    @Volatile private var luot = 0
    private var luotGiong = -1

    fun hien(c: Context, dangGoi: Boolean, giay: Long = 0, phut: Long = 0) {
        if (dangHien) return
        val lan = ++luot
        RuiRo.tamNgungDen = System.currentTimeMillis() + 6000   // không bắn lặp trong lúc đang mở
        NhatKy.ghi(c, if (dangGoi) "DỪNG LẠI: đang nghe số chưa quen và mở ứng dụng ngân hàng" else "DỪNG LẠI: mở ứng dụng ngân hàng sau cuộc gọi đáng ngờ")
        val i = Intent(c, DungLaiActivity::class.java).putExtra("dangGoi", dangGoi).putExtra("giay", giay).putExtra("phut", phut)
        moTuNen(c, i, ThongBao.ID_DUNG_LAI, "DỪNG LẠI · Đừng chuyển tiền", "Hãy gọi ${CaiDat.tenNguoiThan(c)} để kiểm tra trước.")
        // Đường dự phòng chỉ vẽ khi lý do cảnh báo còn đó và chưa ai hủy lượt này.
        Luong.sau(1500) {
            // dangONganHang = false: người dùng đã rời app ngân hàng (bấm Home) trong lúc chờ, không vẽ màn đỏ lên màn hình chính.
            if (!dangHien && luot == lan && DichVuLaChan.conONganHang(c) && (RuiRo.dangMo() || PhienGoi.trangThai == PhienGoi.DANG_NGHE)) {
                hienLopPhu(c.applicationContext, dangGoi, giay, phut)
            }
        }
    }

    private fun hienLopPhu(c: Context, dangGoi: Boolean, giay: Long, phut: Long) {
        if (!Settings.canDrawOverlays(c)) {
            NhatKy.ghi(c, "Máy không cho mở màn Dừng lại từ nền và chưa có quyền hiển thị trên ứng dụng khác")
            return
        }
        try {
            val v = LayoutInflater.from(ContextThemeWrapper(c, R.style.GiaoDien_Do)).inflate(R.layout.dung_lai, null)
            val wm = c.getSystemService(WindowManager::class.java)
            gan(v, c, dangGoi, giay, phut) {
                goLopPhu(c)
                dong(c)
            }
            wm.addView(
                v,
                WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                        @Suppress("DEPRECATION") WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
                    PixelFormat.OPAQUE,
                ).apply { screenOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT },   // màn cảnh báo luôn dọc
            )
            lopPhu = v
            dangHien = true
            ThongBao.huy(c, ThongBao.ID_DUNG_LAI)   // màn đỏ đã hiện: gỡ thông báo nổi để nó không che phần trên của màn
            NhatKy.ghi(c, "Màn Dừng lại hiện bằng lớp phủ")
            docTo(c)
        } catch (e: Exception) {
            NhatKy.ghi(c, "Không vẽ được lớp phủ Dừng lại: ${e.javaClass.simpleName}")
        }
    }

    /** Điền chữ và nút cho bố cục dung_lai, dùng chung cho Activity và lớp phủ. */
    fun gan(v: View, c: Context, dangGoi: Boolean, giay: Long, phut: Long, dongLai: () -> Unit) {
        val ten = CaiDat.tenNguoiThan(c)
        val x = c.xung()
        val lyDo = v.findViewById<TextView>(R.id.lyDo)
        val loi1 = v.findViewById<TextView>(R.id.loi1)
        val loi2 = v.findViewById<TextView>(R.id.loi2)
        val nutCup = v.findViewById<Button>(R.id.nutCup)
        if (dangGoi) {
            v.findViewById<TextView>(R.id.dongTren).text = "Đang gọi với số chưa quen · %02d:%02d".format(giay / 60, giay % 60)
            lyDo.text = "${x.Ban} đang nghe máy với số chưa quen và mở ứng dụng ngân hàng. Đây là dấu hiệu lừa đảo thường gặp nhất."
            loi1.text = "Hãy cúp máy."
            loi2.text = "Người thật sẽ không giận."
            if (c.checkSelfPermission(Manifest.permission.ANSWER_PHONE_CALLS) == PackageManager.PERMISSION_GRANTED) {
                nutCup.visibility = View.VISIBLE
                nutCup.setOnClickListener {
                    try {
                        @Suppress("DEPRECATION")
                        c.getSystemService(TelecomManager::class.java).endCall()
                        NhatKy.ghi(c, "Đã cúp máy theo nút Cúp máy ngay")
                    } catch (e: Exception) {
                        NhatKy.ghi(c, "Không cúp máy được: ${e.javaClass.simpleName}")
                    }
                    dongLai()
                }
            }
        } else {
            lyDo.text = if (phut < 1) "${x.Ban} vừa nghe xong một cuộc gọi nghi lừa đảo và đang mở ứng dụng ngân hàng."
            else "${x.Ban} vừa nghe một cuộc gọi nghi lừa đảo $phut phút trước và đang mở ứng dụng ngân hàng."
            loi1.text = "Đừng chuyển tiền."
            loi2.text = "Hãy gọi $ten để kiểm tra."
        }
        v.findViewById<Button>(R.id.nutHoi).apply {
            text = "Hỏi $ten trước"
            setOnClickListener {
                val so = CaiDat.soNguoiThan(c)
                if (so.isBlank()) c.startActivity(Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                else c.goiDien(so)
                dongLai()
            }
        }
        v.findViewById<Button>(R.id.nutDong).setOnClickListener { dongLai() }
    }

    fun docTo(c: Context) {
        val ten = CaiDat.tenNguoiThan(c)
        val x = c.xung()
        luotGiong = Giong.phat(c, if (ten == "Minh" && x.laBa) R.raw.benai_13 else null, "${x.Ban} ơi, khoan chuyển tiền đã. ${x.Ban} gọi $ten hỏi trước cho chắc nha.")
    }

    val coLopPhu get() = lopPhu != null

    /** Gỡ lớp phủ dự phòng và đặt lại trạng thái, khi không còn lý do để hiện. */
    fun thuLopPhu(c: Context) = Luong.chinh {
        luot++   // hủy cả lượt vẽ dự phòng còn đang chờ
        if (lopPhu != null) {
            goLopPhu(c)
            dong(c)
        }
    }

    fun goLopPhu(c: Context) {
        val v = lopPhu ?: return
        lopPhu = null
        try { c.getSystemService(WindowManager::class.java).removeView(v) } catch (_: Exception) {}
    }

    fun dong(c: Context) {
        luot++
        dangHien = false
        RuiRo.tamNgungDen = System.currentTimeMillis() + 90_000
        Giong.dung(luotGiong)   // chỉ dừng lời "Dừng lại", không cắt câu hỏi của Bé Nai nếu màn hỏi vừa mở
        ThongBao.huy(c, ThongBao.ID_DUNG_LAI)
        NhatKy.ghi(c, "Đã đóng màn Dừng lại")
    }
}

class DungLaiActivity : Activity() {
    private var daDong = false

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.dung_lai)
        DungLai.goLopPhu(applicationContext)   // nếu lớp phủ dự phòng đã hiện trước thì thay bằng màn này
        DungLai.dangHien = true
        ThongBao.huy(this, ThongBao.ID_DUNG_LAI)
        DungLai.gan(
            findViewById(android.R.id.content), this,
            intent.getBooleanExtra("dangGoi", false), intent.getLongExtra("giay", 0), intent.getLongExtra("phut", 0),
        ) { finish() }
        DungLai.docTo(this)
    }

    override fun onStart() {
        super.onStart()
        DungLai.dangHien = true
    }

    /** Bấm Home hay chuyển app cũng là đóng cảnh báo: không để cờ "đang hiện" kẹt lại. */
    override fun onStop() {
        dongMotLan()
        if (!isFinishing) finish()
        super.onStop()
    }

    override fun onDestroy() {
        dongMotLan()
        super.onDestroy()
    }

    private fun dongMotLan() {
        if (!daDong) { daDong = true; DungLai.dong(this) }
    }
}
