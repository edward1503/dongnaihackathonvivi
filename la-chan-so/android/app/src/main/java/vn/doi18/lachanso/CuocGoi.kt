package vn.doi18.lachanso

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.os.SystemClock
import android.provider.DocumentsContract
import android.provider.Settings
import android.telecom.Call
import android.telecom.CallScreeningService
import android.telephony.TelephonyManager
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView

/**
 * N1. Android gọi dịch vụ này khi có cuộc gọi đến hoặc đi (app phải giữ vai trò "sàng lọc cuộc gọi").
 * Lá chắn không tự chặn cuộc gọi: chỉ lấy số để tra và hiện thẻ cảnh báo.
 * Ngoại lệ duy nhất là các số mà chính chủ máy đã bấm "Chặn số này".
 */
class SangLocCuocGoi : CallScreeningService() {
    override fun onScreenCall(d: Call.Details) {
        val den = d.callDirection == Call.Details.DIRECTION_INCOMING
        if (CaiDat.relative(this)) {
            if (den) respondToCall(d, CallResponse.Builder().build())
            return
        }
        val so = d.handle?.schemeSpecificPart.orEmpty()
        if (den && TraCuu.chuanHoa(so).let { it.isNotBlank() && it in CaiDat.soChan(this) }) {
            respondToCall(d, CallResponse.Builder().setDisallowCall(true).setRejectCall(true).build())
            NhatKy.ghi(this, "Đã từ chối một cuộc gọi từ số chủ máy đã chặn")
            return
        }
        if (den) respondToCall(d, CallResponse.Builder().build())   // cho đổ chuông bình thường, trả lời ngay
        // creationTimeMillis là đúng mốc máy ghi vào nhật ký cuộc gọi: dùng nó để tìm lại đúng dòng nhật ký sau khi cúp.
        PhienGoi.tuSangLoc(applicationContext, so, den, d.creationTimeMillis)
    }
}

/** Trạng thái máy: đổ chuông, đang nghe, rảnh. Nguồn thứ hai cho số gọi đến khi app chưa giữ vai trò sàng lọc. */
class TheoDoiCuocGoi : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        if (CaiDat.relative(c)) return
        if (i.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        val tt = i.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        @Suppress("DEPRECATION")
        val so = i.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
        PhienGoi.chuyen(c.applicationContext, tt, so)
    }
}

/** Cuộc gọi đang diễn ra. */
object PhienGoi {
    const val RANH = "IDLE"
    const val DO_CHUONG = "RINGING"
    const val DANG_NGHE = "OFFHOOK"

    @Volatile var trangThai = RANH; private set
    @Volatile var so = ""; private set
    @Volatile var den = false; private set
    /** Lúc bắt đầu nghe, theo đồng hồ từ khi mở máy. */
    @Volatile var batDauNghe = 0L; private set
    @Volatile var batDauLuc = 0L; private set
    /** null: chưa tra xong. */
    @Volatile var quen: Boolean? = null; private set
    @Volatile var ketQua: KetQuaSo? = null; private set

    private var soLuc = 0L
    /** [batDauLuc] lấy từ dịch vụ sàng lọc, trùng với mốc trong nhật ký cuộc gọi (không phải lúc app nghe tin đổ chuông). */
    private var mocChinhXac = false
    private var daTra = ""
    /** Đã có lúc nghe máy trong phiên này (để cuộc gọi chờ không làm mất bước xử lý sau cuộc gọi). */
    private var daNghe = false

    private fun datSo(moi: String) {
        if (moi.isBlank()) return
        so = moi
        soLuc = SystemClock.elapsedRealtime()
    }

    private fun datLai() {
        so = ""; den = false; batDauNghe = 0; batDauLuc = 0; quen = null; ketQua = null; daTra = ""; soLuc = 0; daNghe = false; mocChinhXac = false
    }

    @Synchronized
    fun tuSangLoc(c: Context, soMoi: String, laDen: Boolean, taoLuc: Long = 0) {
        if (trangThai == DANG_NGHE || daNghe) return   // cuộc gọi chờ: giữ nguyên cuộc đang nghe
        if (trangThai == RANH) datLai()
        datSo(soMoi)
        den = laDen
        if (taoLuc > 0) {
            val pending = c.getSharedPreferences("ring-report", Context.MODE_PRIVATE)
            if (batDauLuc > 0 && pending.getLong("start", -1) == batDauLuc && laDen && pending.getString("number", "") == soMoi) {
                pending.edit().putLong("start", taoLuc).apply()
            }
            batDauLuc = taoLuc
            mocChinhXac = true
        }
        if (batDauLuc == 0L) batDauLuc = System.currentTimeMillis()
        traSo(c)
    }

    @Synchronized
    fun chuyen(c: Context, moi: String, soMoi: String?) {
        if (moi != RANH) {
            // Số còn sót từ cuộc gọi trước (máy tắt app giữa chừng) thì bỏ.
            if (trangThai == RANH && soLuc != 0L && SystemClock.elapsedRealtime() - soLuc > 15_000) datLai()
            if (moi == DO_CHUONG && !daNghe) den = true
            // Cuộc gọi chờ đổ chuông trong lúc đang nghe: không lấy số của nó cho cuộc đang nghe.
            if (so.isBlank() && !(daNghe && moi == DO_CHUONG)) {
                datSo(soMoi.orEmpty())
                if (daNghe && so.isNotBlank()) CaiDat.datPhienDangNghe(c, batDauLuc, so, den)   // số tới muộn: cập nhật phiên đã lưu
            }
            if (moi == DO_CHUONG && batDauLuc == 0L) batDauLuc = System.currentTimeMillis()
            traSo(c)
        }
        // Tiến trình mới (máy đã tắt app giữa cuộc gọi) chỉ thấy lúc cúp máy, khi trạng thái trong bộ nhớ vẫn là "rảnh".
        if (moi == RANH && trangThai == RANH && !daNghe) return khoiPhuc(c)
        if (moi == trangThai) return
        val cu = trangThai
        trangThai = moi
        when (moi) {
            DO_CHUONG -> {
                if (batDauLuc == 0L) batDauLuc = System.currentTimeMillis()
                NhatKy.ghi(c, "Đổ chuông")
            }
            DANG_NGHE -> {
                if (!daNghe && cu == RANH && batDauLuc == 0L) {
                    // Tiến trình mới (máy vừa tắt app) nhận lại bản tin "đang nghe" của cuộc gọi đang dở: giữ mốc, chiều và số đã lưu.
                    val p = CaiDat.phienDangNghe(c)
                    if (p.tu != 0L && System.currentTimeMillis() - p.tu < 4 * 3600_000L && (so.isBlank() || p.so.isBlank() || so == p.so)) {
                        batDauLuc = p.tu; den = p.den
                        if (so.isBlank()) datSo(p.so)
                    }
                }
                if (batDauLuc == 0L) batDauLuc = System.currentTimeMillis()
                if (!daNghe) {
                    batDauNghe = SystemClock.elapsedRealtime()
                    RuiRo.tamNgungDen = 0   // cuộc gọi mới: không giữ khoảng tạm nghỉ của lần đóng cảnh báo trước
                }
                daNghe = true
                CaiDat.datPhienDangNghe(c, batDauLuc, so, den)
                NhatKy.ghi(c, if (den) "Đã nghe máy" else "Đang gọi đi")
                DichVuLaChan.batDau(c)
                // Đã nghe máy: thẻ không che màn hình nữa. Gọi đi thì giữ lâu hơn, vì máy báo "đang nghe" ngay từ lúc bấm gọi.
                Luong.sau(if (den) 6000 else 20_000) { if (trangThai == DANG_NGHE) TheCanhBao.an(c) }
                // Số ẩn: không có gì để tra, coi là số chưa quen.
                Luong.sau(3000) { if (trangThai == DANG_NGHE && so.isBlank() && quen == null) quen = false }
            }
            RANH -> {
                TheCanhBao.an(c)
                if (cu == DANG_NGHE || daNghe) ketThuc(c) else { NhatKy.ghi(c, "Không nghe máy"); datLai() }
            }
        }
    }

    private fun traSo(c: Context) {
        val s = so
        if (s.isBlank() || daTra == s) return
        daTra = s
        val luc = batDauLuc
        val laDen = den
        Luong.nen {
            val kq = TraCuu.tra(c, s)
            val q = SoQuen.laQuen(c, s, if (luc == 0L) System.currentTimeMillis() else luc, biBao = kq.muc == Muc.NGUY_HIEM)
            if (so != s) return@nen
            ketQua = kq
            quen = q
            NhatKy.ghi(c, "Tra số …${s.takeLast(3)}: ${kq.muc.ten}" + (if (q) ", số quen" else ", số chưa quen") + (if (kq.tuMayChu) " (máy chủ)" else " (dữ liệu trên máy)"))
            if (q) return@nen
            when {
                // Số bị báo: cảnh báo cả khi chủ máy gọi đi (gọi lại theo lời dụ).
                kq.muc == Muc.NGUY_HIEM || kq.muc == Muc.NGHI_NGO -> if (!laDen || trangThai != DANG_NGHE) TheCanhBao.hien(c, s, kq, cuaPhien = true)
                // Số chưa ai báo nhưng có nhãn cộng đồng: chỉ một nhãn nhẹ, không hỏi lại.
                laDen && kq.soNguoiBao > 0 && kq.nhan.isNotBlank() && trangThai != DANG_NGHE -> TheCanhBao.hienNhan(c, kq, s)
            }
        }
    }

    /** Vừa cúp máy sau khi đã nghe. */
    private fun ketThuc(c: Context) {
        val soTam = so
        val batDau = batDauLuc
        val giayTam = (SystemClock.elapsedRealtime() - batDauNghe) / 1000
        val kqTam = ketQua
        val laDen = den
        val chinhXac = mocChinhXac
        datLai()
        sauKhiCup(c, soTam, batDau, giayTam, kqTam, laDen, saiSo = if (chinhXac) 1500 else 6000)
    }


    /** Dựa vào phiên đã lưu lúc bắt đầu nghe và nhật ký cuộc gọi của máy. */
    private fun khoiPhuc(c: Context) {
        val p = CaiDat.phienDangNghe(c)
        if (p.tu == 0L) return
        if (System.currentTimeMillis() - p.tu > 4 * 3600_000L) return CaiDat.xoaPhienDangNghe(c, p.tu)
        sauKhiCup(c, p.so, p.tu, 0, null, p.den, khoiPhuc = true)
    }

    private val dangXuLy = HashSet<Long>()

    /**
     * [giayTam] chỉ dùng khi không đọc được nhật ký cuộc gọi. Mỗi cuộc gọi chỉ xử lý một lần, kể cả khi máy báo "rảnh"
     * hai lần (hai bản tin, hai SIM). Phiên đã lưu chỉ được xóa sau khi đã quyết định xong, để app bị tắt giữa chừng vẫn làm lại được.
     */
    private fun sauKhiCup(c: Context, soTam: String, batDau: Long, giayTam: Long, kqTam: KetQuaSo?, laDen: Boolean, khoiPhuc: Boolean = false, saiSo: Long = 6000) {
        val endedAt = System.currentTimeMillis()
        synchronized(dangXuLy) {
            if (CaiDat.cuocDaXuLy(c) == batDau || !dangXuLy.add(batDau)) return
        }
        if (khoiPhuc) NhatKy.ghi(c, "App bị tắt giữa cuộc gọi, xem lại từ nhật ký cuộc gọi")
        DichVuLaChan.batDau(c)   // giữ tiến trình sống trong lúc chờ nhật ký và tìm bản ghi
        Luong.nen {
            try {
                Thread.sleep(1500)   // chờ máy ghi xong nhật ký cuộc gọi
                var cg = cuocGoiCuaPhien(c, soTam, batDau, laDen, saiSo)
                val pending = c.getSharedPreferences("ring-report", Context.MODE_PRIVATE)
                val requested = pending.getLong("start", -1) == batDau && laDen && pending.getString("number", "") == soTam
                var attempts = if (requested) 8 else 1
                while ((cg == null || requested && cg.giay == 0L) && attempts-- > 0 && Quyen.co(c, android.Manifest.permission.READ_CALL_LOG)) {
                    Thread.sleep(1500)   // có máy ghi nhật ký chậm
                    cg = cuocGoiCuaPhien(c, soTam, batDau, laDen, saiSo)
                }
                // Khôi phục sau khi app bị tắt: chỉ tin nhật ký, và chỉ khi cuộc gọi ấy vừa kết thúc trong một phút qua.
                if (khoiPhuc && (cg == null || System.currentTimeMillis() - (cg.luc + cg.giay * 1000) > 60_000)) return@nen
                // Gọi đi: máy báo "đang nghe" ngay từ lúc quay số, nên phải có nhật ký mới biết bên kia đã nghe hay chưa.
                if (!laDen && cg == null) {
                    NhatKy.ghi(c, "Không xác nhận được cuộc gọi đi đã kết nối, không hỏi gì")
                    return@nen
                }
                if (requested && (cg == null || cg.giay == 0L)) {
                    ThongBao.canhBao(c, ThongBao.ID_DO_CHUONG, "Chưa gửi báo cáo",
                        "Bé Nai chưa tìm thấy cuộc gọi đến đã nghe máy. Bà có thể xem lại ở mục Báo cáo nha.")
                }
                if (cg != null && cg.giay == 0L) {
                    NhatKy.ghi(c, "Cuộc gọi chưa kết nối, không hỏi gì")
                    return@nen
                }
                val soThat = cg?.so?.takeIf { it.isNotBlank() } ?: soTam
                val giay = cg?.giay ?: giayTam
                val kq = kqTam ?: TraCuu.tra(c, soThat)
                val quen = SoQuen.laQuen(c, soThat, batDau, biBao = kq.muc == Muc.NGUY_HIEM)
                NhatKy.ghi(c, "Kết thúc cuộc gọi ${giay}s" + (if (quen) ", số quen" else ", số chưa quen"))
                val matched = cg?.takeIf { it.den && soTam.isNotBlank() }?.let { row ->
                    if (row.luc == batDau) row else cuocGoiCuaPhien(c, soTam, batDau, true, saiSo, requireUnique = true)
                }
                val event = matched?.let { ReceivedEvents.call(it.so, it.luc, it.giay) }
                SauCuocGoi.xuLy(c, soThat, giay, kq, quen, batDau, laDen, event = event, requested = requested, endedAt = endedAt)
            } finally {
                CaiDat.datCuocDaXuLy(c, batDau)
                CaiDat.xoaPhienDangNghe(c, batDau)
                synchronized(dangXuLy) { dangXuLy.remove(batDau) }
            }
        }
    }
}

/** Quyết định sau cuộc gọi: im lặng, hay hỏi một câu (N3), hay phân tích bản ghi âm (N2). */
object SauCuocGoi {
    /** [thu]: gọi từ nút giả lập. Khi đó không đụng tới thư mục ghi âm thật, và lời báo người thân được đánh dấu là thử. */
    internal fun xuLy(c: Context, so: String, giay: Long, kq: KetQuaSo, quen: Boolean, batDau: Long, den: Boolean, thu: Boolean = false, event: ReceivedEvent? = null, requested: Boolean = false, endedAt: Long = System.currentTimeMillis()) {
        val biBao = kq.muc == Muc.NGUY_HIEM
        val showScreen = requested || !quen && kq.muc != Muc.AN_TOAN && (den || biBao) && (biBao || giay >= CaiDat.nguongGiay(c))
        if (showScreen) RuiRo.mo(c, so)
        val banGhi = if (thu || !showScreen && event == null) null else GhiAm.timMoi(
            c, batDau, so, earliestModified = event?.let { it.time + giay * 1000 - 999 },
            latestModified = endedAt + 5000,
        )
        if (event != null && banGhi != null) ReceivedEvents.bindRecording(c, event, banGhi)
        if (!showScreen) return
        if (requested && event != null) Luong.nen {
            val reply = EventReports.report(c, event.id)
            val message = EventReports.message(reply)
            ThongBao.canhBao(c, ThongBao.ID_DO_CHUONG, "Báo cuộc vừa nhận", message)
            Luong.chinh {
                c.sendBroadcast(Intent(EventReports.UPDATED).setPackage(c.packageName)
                    .putExtra("eventId", event.id).putExtra("message", message))
            }
        }
        // D05: số lạ nghe lâu thì mỗi ngày hỏi tối đa một câu. Giới hạn chỉ áp cho CÂU HỎI: vẫn canh ứng dụng ngân hàng,
        // vẫn phân tích bản ghi nếu có. Số đang bị báo thì lần nào cũng hỏi. Lượt hỏi được ghi lúc câu hỏi thật sự hiện ra.
        val gio = System.currentTimeMillis()
        val mui = java.util.TimeZone.getDefault()
        fun ngay(t: Long) = (t + mui.getOffset(t)) / 86_400_000L
        val hetLuotHoi = !biBao && !thu && !CaiDat.trinhDien(c) && ngay(CaiDat.hoiGanNhat(c)) == ngay(gio)
        if (!requested && hetLuotHoi && (banGhi == null || CaiDat.mayChu(c).isBlank())) {
            NhatKy.ghi(c, "Hôm nay đã hỏi một câu rồi: không hỏi nữa, vẫn canh ứng dụng ngân hàng")
            return
        }
        NhatKy.ghi(c, "Hỏi sau cuộc gọi" + (if (banGhi != null) ", có bản ghi âm của máy" else ", không thấy bản ghi âm"))
        val i = Intent(c, HoiSauCuocGoiActivity::class.java)
            .putExtra("so", so).putExtra("giay", giay).putExtra("den", den).putExtra("ma", batDau)
            .putExtra("eventId", event?.id).putExtra("requested", requested && event != null)
            .putExtra("khongHoi", hetLuotHoi).putExtra("tinhLuotHoi", !biBao && !thu && !CaiDat.trinhDien(c)).putExtra("thu", thu)
            // Chỉ số lượt báo lừa đảo mới là bằng chứng. Nhãn cộng đồng kiểu "giao hàng" thì không.
            .putExtra("soNguoiBao", if (kq.muc == Muc.NGUY_HIEM || kq.muc == Muc.NGHI_NGO) kq.soNguoiBao else 0)
            .putExtra("nhan", if (kq.muc == Muc.NGUY_HIEM || kq.muc == Muc.NGHI_NGO) kq.nhan else "")
            .putExtra("banGhi", banGhi?.uri?.toString()).putExtra("banGhiKieu", banGhi?.kieu)
        moTuNen(c, i, ThongBao.ID_SAU_GOI, "Bé Nai hỏi thăm", "Người vừa gọi có bảo chuyển tiền không? Chạm để trả lời.")
    }
}

/**
 * Mở một màn hình khi app đang ở nền. Android chỉ cho mở thẳng khi app có quyền "hiển thị trên ứng dụng khác"
 * (Xiaomi cần thêm "hiện cửa sổ bật lên khi chạy nền"), nên luôn kèm một thông báo toàn màn hình làm đường dự phòng.
 */
fun moTuNen(c: Context, i: Intent, id: Int, tieuDe: String, noiDung: String) {
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    ThongBao.canhBao(c, id, tieuDe, noiDung, ThongBao.moManHinh(c, i, id), toanManHinh = true)
    try {
        c.startActivity(i)
    } catch (e: Exception) {
        NhatKy.ghi(c, "Không mở thẳng được màn hình, đã gửi thông báo thay thế")
    }
}

/** Khoảng thời gian sau một cuộc gọi đáng ngờ mà Lá chắn canh ứng dụng ngân hàng (N5). */
object RuiRo {
    @Volatile var denLuc = 0L; private set
    @Volatile var so = ""; private set
    @Volatile var ketThucLuc = 0L; private set
    /** Sau khi người dùng đóng cảnh báo, tạm không hiện lại tới lúc này. */
    @Volatile var tamNgungDen = 0L

    fun mo(c: Context, soGoi: String) {
        val gio = System.currentTimeMillis()
        so = soGoi
        ketThucLuc = gio
        denLuc = gio + CaiDat.cuaSoGiay(c) * 1000L
        tamNgungDen = 0
        CaiDat.datRuiRo(c, denLuc, ketThucLuc, so)
        NhatKy.ghi(c, "Canh ứng dụng ngân hàng trong ${CaiDat.cuaSoGiay(c) / 60} phút")
        DichVuLaChan.batDau(c)
    }

    fun dong(c: Context) {
        denLuc = 0
        CaiDat.datRuiRo(c, 0, 0, "")
    }

    /** Gọi khi dịch vụ nền khởi động: lấy lại khoảng canh còn hiệu lực nếu app vừa bị máy tắt. */
    fun napLai(c: Context) {
        if (denLuc != 0L) return
        val (den, tu, soLuu) = CaiDat.ruiRo(c)
        if (den > System.currentTimeMillis()) { denLuc = den; ketThucLuc = tu; so = soLuu }
    }

    fun dangMo() = System.currentTimeMillis() < denLuc
}

/**
 * A03a: thẻ nổi trên màn đổ chuông (đỏ khi số bị báo, vàng khi nghi ngờ), có nút "Chặn số này".
 * A03b: nhãn nhẹ khi số chỉ có nhãn cộng đồng. Không có quyền hiển thị trên ứng dụng khác thì chỉ còn thông báo.
 */
object TheCanhBao {
    private var the: View? = null

    private fun ve(c: Context, v: View, tyLeY: Float, tuAnSau: Long) {
        val wm = c.getSystemService(WindowManager::class.java)
        val cao = c.resources.displayMetrics.heightPixels
        val p = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or @Suppress("DEPRECATION") WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
            PixelFormat.TRANSLUCENT,
        ).apply { gravity = Gravity.TOP; y = (cao * tyLeY).toInt() }
        wm.addView(v, p)
        the = v
        Luong.sau(tuAnSau) { if (the === v) go(c) }
    }

    /** [cuaPhien]: thẻ của một cuộc gọi thật. Tới lúc vẽ mà cuộc gọi ấy đã đổi (số khác, đã cúp) thì bỏ, không dán thẻ nhầm cuộc. */
    fun hien(c: Context, so: String, kq: KetQuaSo, cuaPhien: Boolean = false) = Luong.chinh {
        // Chỉ so số: dịch vụ sàng lọc thường tra xong TRƯỚC khi máy báo đổ chuông, lúc trạng thái còn là "rảnh". Cúp máy thì số của phiên đã bị xóa.
        if (cuaPhien && PhienGoi.so != so) return@chinh
        go(c)
        val nguyHiem = kq.muc == Muc.NGUY_HIEM
        val tieuDe = if (nguyHiem) "Nghi lừa đảo" else "Cần cẩn thận"
        val dong1 = when {
            kq.daXacMinh && kq.soNguoiBao > 0 -> "Lá chắn số đã xác minh số này lừa đảo. Đã có ${kq.soNguoiBao} máy báo cáo."
            kq.daXacMinh -> "Lá chắn số đã xác minh số này lừa đảo. ${c.xung().Ban} đừng nghe máy nha."
            kq.soNguoiBao > 0 -> "Cuộc gọi hiển thị số này đã bị báo cáo từ ${kq.soNguoiBao} máy."
            else -> "${c.xung().Ban} cẩn thận khi nghe cuộc gọi này nha."
        }
        val dong2 = if (kq.baoGanNhat.isNotBlank()) "Báo cáo gần nhất: ${kq.baoGanNhat}" else ""
        ThongBao.canhBao(c, ThongBao.ID_DO_CHUONG, "$tieuDe · ${TraCuu.dinhDang(so)}", "$dong1 $dong2".trim())
        NhatKy.ghi(c, "Cảnh báo khi đổ chuông: ${kq.muc.ten}, ${kq.soNguoiBao} người báo")
        if (!Settings.canDrawOverlays(c)) {
            NhatKy.ghi(c, "Chưa có quyền hiển thị trên ứng dụng khác: chỉ gửi thông báo")
            return@chinh
        }
        try {
            val v = LayoutInflater.from(ContextThemeWrapper(c, R.style.GiaoDien)).inflate(R.layout.the_canh_bao, null)
            if (!nguyHiem) v.findViewById<View>(R.id.the).setBackgroundResource(R.drawable.the_canh_bao_vang)
            v.findViewById<TextView>(R.id.tieuDe).text = tieuDe
            v.findViewById<TextView>(R.id.noiDung).text = dong1
            v.findViewById<TextView>(R.id.phu).apply { text = dong2; visibility = if (dong2.isBlank()) View.GONE else View.VISIBLE }
            v.findViewById<View>(R.id.dong).setOnClickListener { go(c) }
            val start = PhienGoi.batDauLuc
            v.findViewById<android.widget.Button>(R.id.reportCall).apply {
                visibility = if (!cuaPhien || PhienGoi.den) View.VISIBLE else View.GONE
                isEnabled = cuaPhien && PhienGoi.den && start > 0
                if (!cuaPhien) contentDescription = "Báo cuộc vừa nhận. Đây là cuộc gọi thử."
                setOnClickListener {
                    if (PhienGoi.batDauLuc != start || !PhienGoi.den || PhienGoi.so != so) return@setOnClickListener
                    c.getSharedPreferences("ring-report", Context.MODE_PRIVATE).edit().putLong("start", start).putString("number", so).apply()
                    isEnabled = false
                    text = "Bé Nai sẽ đối chiếu khi bà cúp máy"
                }
            }
            v.findViewById<View>(R.id.chan).setOnClickListener {
                CaiDat.themSoChan(c, so)
                NhatKy.ghi(c, "Chủ máy bấm Chặn số này")
                // Chỉ ngắt khi máy đang đổ chuông đúng số này: không bao giờ cúp nhầm một cuộc gọi khác.
                if (PhienGoi.so == so && PhienGoi.trangThai == PhienGoi.DO_CHUONG &&
                    c.checkSelfPermission(android.Manifest.permission.ANSWER_PHONE_CALLS) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    try {
                        @Suppress("DEPRECATION")
                        c.getSystemService(android.telecom.TelecomManager::class.java).endCall()
                    } catch (_: Exception) {
                    }
                }
                go(c)
                android.widget.Toast.makeText(c, "Đã chặn số này. Lần sau máy sẽ tự từ chối.", android.widget.Toast.LENGTH_LONG).show()
            }
            ve(c, v, 0.36f, 45_000)
        } catch (e: Exception) {
            NhatKy.ghi(c, "Không vẽ được thẻ cảnh báo: ${e.javaClass.simpleName}")
        }
    }

    /** A03b: số chưa lưu, không thấy rủi ro. Chỉ hiện nhãn cộng đồng, không cảnh báo, không hỏi lại. */
    fun hienNhan(c: Context, kq: KetQuaSo, soPhien: String? = null) = Luong.chinh {
        if (soPhien != null && PhienGoi.so != soPhien) return@chinh
        go(c)
        if (!Settings.canDrawOverlays(c)) return@chinh
        try {
            val v = LayoutInflater.from(ContextThemeWrapper(c, R.style.GiaoDien)).inflate(R.layout.nhan_nhe, null)
            v.findViewById<TextView>(R.id.noiDung).text = "${kq.soNguoiBao} người từng gắn nhãn “${kq.nhan}”"
            ve(c, v, 0.30f, 20_000)
        } catch (e: Exception) {
            NhatKy.ghi(c, "Không vẽ được nhãn: ${e.javaClass.simpleName}")
        }
    }

    fun an(c: Context) = Luong.chinh { go(c) }

    private fun go(c: Context) {
        val v = the ?: return
        the = null
        try { c.getSystemService(WindowManager::class.java).removeView(v) } catch (_: Exception) {}
    }
}

/**
 * N2. Tìm bản ghi âm mà trình gọi điện của máy vừa lưu, trong thư mục người dùng đã cấp quyền một lần.
 * Lá chắn không tự thu âm cuộc gọi.
 */
object GhiAm {
    data class BanGhi(val uri: Uri, val ten: String, val kieu: String)

    private val DUOI = listOf(".mp3", ".m4a", ".aac", ".amr", ".wav", ".ogg", ".opus", ".3gp")

    /** Các cụm chữ số trông như số điện thoại trong tên tệp (9 đến 12 chữ số), đã chuẩn hóa. Dấu thời gian dài hơn nên không lẫn. */
    private fun soTrongTen(ten: String) = Regex("\\d+").findAll(ten).map { it.value }.filter { it.length in 9..12 }.map { TraCuu.chuanHoa(it) }.toList()

    /**
     * Chọn bản ghi của đúng cuộc gọi. Trả về (tệp, mơ hồ).
     *  - Biết số: phải có đúng một tệp mang đúng số đó trong tên (trình gọi của Xiaomi đặt tên tệp theo số khi số chưa lưu danh bạ).
     *    Không có tệp nào mang số thì không gửi gì: một tệp chỉ khớp về thời gian có thể là bản ghi của cuộc gọi trước.
     *  - Số ẩn: chỉ nhận khi có đúng một tệp mới và tên nó không mang số điện thoại nào.
     */
    private fun chon(ung: List<BanGhi>, so: String): Pair<BanGhi?, Boolean> {
        if (ung.isEmpty()) return null to false
        if (so.length >= 9) {
            val khop = ung.filter { so in soTrongTen(it.ten) }
            return khop.singleOrNull() to (khop.size > 1)
        }
        return if (so.isBlank() && ung.size == 1 && soTrongTen(ung[0].ten).isEmpty()) ung[0] to false else null to true
    }

    /**
     * Chỉ trả về khi chắc đó là bản ghi của cuộc gọi vừa xong (xem [chon]) và máy đã ghi xong tệp:
     * kích thước đứng yên qua hai lần quét. Còn mơ hồ thì không gửi tệp nào, app chuyển sang hỏi một câu.
     */
    fun timMoi(c: Context, sauLuc: Long, so: String = "", latestNamed: Boolean = false,
               earliestModified: Long? = null, latestModified: Long = Long.MAX_VALUE): BanGhi? {
        val goc = CaiDat.thuMucGhiAm(c)
        if (goc.isBlank()) return null
        val cay = Uri.parse(goc)
        val s = TraCuu.chuanHoa(so)
        // Bản ghi của cuộc vừa xong được máy ghi xong quanh lúc cúp máy (hàm này chạy vài giây sau đó).
        // Tệp sửa lần cuối sớm hơn thế là của cuộc gọi trước, không lấy.
        if (latestNamed && s.length < 9) return null
        val tu = if (latestNamed) 0L else maxOf(earliestModified ?: (sauLuc - 3000), System.currentTimeMillis() - 20_000)
        var truoc: Pair<String, Long>? = null   // (tên, kích thước) của tệp được chọn ở lần quét trước
        repeat(5) { lan ->
            try {
                val con = DocumentsContract.buildChildDocumentsUriUsingTree(cay, DocumentsContract.getTreeDocumentId(cay))
                val ung = ArrayList<BanGhi>()
                var newest = Long.MIN_VALUE
            val kichThuoc = HashMap<String, Long>()
                c.contentResolver.query(
                    con,
                    arrayOf(
                        DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                        DocumentsContract.Document.COLUMN_LAST_MODIFIED, DocumentsContract.Document.COLUMN_MIME_TYPE,
                        DocumentsContract.Document.COLUMN_SIZE,
                    ), null, null, null,
                )?.use { k ->
                    while (k.moveToNext()) {
                        val ten = k.getString(1).orEmpty()
                        if (k.getLong(2) !in tu..latestModified || k.getLong(4) <= 0) continue
                        if (DUOI.none { ten.lowercase().endsWith(it) }) continue
                        if (latestNamed) {
                            val modified = k.getLong(2)
                            if (s !in soTrongTen(ten) || modified < newest) continue
                            if (modified > newest) ung.clear()
                            newest = modified
                        }
                        ung += BanGhi(DocumentsContract.buildDocumentUriUsingTree(cay, k.getString(0)), ten, k.getString(3) ?: "audio/mpeg")
                        kichThuoc[ten] = k.getLong(4)
                    }
                }
                val (tep, moHo) = chon(ung, s)
                if (moHo) {
                    NhatKy.ghi(c, "Có ${ung.size} tệp âm thanh mới, không chắc tệp nào của cuộc gọi này: không gửi tệp nào")
                    return null
                }
                if (tep != null) {
                    val gio = tep.ten to (kichThuoc[tep.ten] ?: 0L)
                    if (truoc == gio) return tep
                    truoc = gio
                }
            } catch (e: Exception) {
                NhatKy.ghi(c, "Không đọc được thư mục ghi âm: ${e.javaClass.simpleName}")
                return null
            }
            if (lan < 4) Thread.sleep(1200)   // máy cần vài giây để lưu xong tệp
        }
        return null
    }
}
