package vn.doi18.lachanso

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * N2 và N3. Sau một cuộc gọi đáng ngờ:
 *  - có bản ghi âm của máy và có máy chủ: gửi đi chép lời, hiện kết quả phân tích (A04b);
 *  - không thì Bé Nai hỏi một câu bằng giọng nói, luôn kèm hai nút Có và Không (A04a);
 *  - chủ máy cũng có thể kể lại cuộc gọi bằng giọng nói để phân tích (A04c).
 */
class HoiSauCuocGoiActivity : Activity() {
    companion object {
        private const val DANG_GUI = 1
        private const val DA_BAO = 2
        /** Trạng thái báo người thân theo mã cuộc gọi, để dựng lại màn không báo lần hai. Chỉ đọc và ghi trên luồng chính. */
        private val baoNguoiThan = HashMap<Long, Int>()
    }

    /** Mã sự kiện: thời điểm bắt đầu cuộc gọi. */
    private var ma = 0L
    /** Màn đang hiện trước mắt người dùng. Rời màn (Home, khóa máy) thì không nghe, không đọc nữa. */
    private var dangHien = false
    /** Lượt giọng do màn này phát gần nhất: rời màn chỉ dừng đúng lượt đó. */
    private var luotGiong = -1
    /** Đã rời màn ít nhất một lần (micro và giọng đã bị dừng). */
    private var daDung = false
    /** Khung đang hiện. */
    private var khung = 0
    /** Câu hỏi đang chờ màn hiện lên mới đọc và nghe; giá trị là có đọc to hay không. */
    private var choHoi: Boolean? = null
    /** Hôm nay đã hết lượt hỏi (D05): màn này chỉ để phân tích bản ghi, không được hỏi. */
    private var khongHoi = false
    private var tinhLuotHoi = false
    private var thu = false
    private var so = ""
    private var giay = 0L
    private var den = true
    private var soNguoiBao = 0
    private var nhan = ""
    private var nghe: SpeechRecognizer? = null
    private var lanNghe = 0
    private var daTraLoi = false
    /** Đang ở màn kể lại: máy nghe liên tục và ghép các câu. */
    private var dangKe = false
    private val loiKe = StringBuilder()
    private var keTu = 0L

    private fun <T : View> v(id: Int): T = findViewById(id)
    private val ten get() = CaiDat.tenNguoiThan(this)
    private val x get() = xung()
    /** Các câu thu sẵn của Bé Nai gọi chủ máy là "bà" và nhắc tên "anh Minh"; khác đi thì dùng giọng đọc của máy. */
    private fun tep(id: Int, nhacTen: Boolean = true): Int? = if (x.laBa && (!nhacTen || ten == "Minh")) id else null

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.hoi_sau_goi)
        ThongBao.huy(this, ThongBao.ID_SAU_GOI)

        ma = intent.getLongExtra("ma", 0)
        khongHoi = intent.getBooleanExtra("khongHoi", false)
        tinhLuotHoi = intent.getBooleanExtra("tinhLuotHoi", false)
        thu = intent.getBooleanExtra("thu", false)
        so = intent.getStringExtra("so").orEmpty()
        giay = intent.getLongExtra("giay", 0)
        den = intent.getBooleanExtra("den", true)
        soNguoiBao = intent.getIntExtra("soNguoiBao", 0)
        nhan = intent.getStringExtra("nhan").orEmpty()

        v<Button>(R.id.nutCo).setOnClickListener { traLoi(true) }
        v<Button>(R.id.nutKhong).setOnClickListener { traLoi(false) }
        v<Button>(R.id.nutKe).setOnClickListener { batDauKe() }
        v<Button>(R.id.nutKeXong).setOnClickListener { keXong() }
        v<Button>(R.id.nutKeThoi).setOnClickListener { dangKe = false; dungNghe(); hoi(docTo = false) }
        v<Button>(R.id.nutBietSo).setOnClickListener {
            CaiDat.themSoQuen(this, so)
            RuiRo.dong(this)
            NhatKy.ghi(this, "Người dùng bấm Tôi biết số này")
            finish()
        }
        v<Button>(R.id.nutDong).setOnClickListener { finish() }

        val banGhi = intent.getStringExtra("banGhi")
        if (banGhi != null && CaiDat.mayChu(this).isNotBlank()) phanTichBanGhi(Uri.parse(banGhi), intent.getStringExtra("banGhiKieu") ?: "audio/mpeg")
        else hoi()
    }

    /** Có cuộc gọi đáng ngờ mới trong lúc màn cũ còn mở: dựng lại với dữ liệu mới. */
    override fun onNewIntent(i: Intent) {
        super.onNewIntent(i)
        // Cùng một cuộc gọi tới hai lần (mở thẳng và thông báo toàn màn hình): giữ màn đang có, không hỏi lại, không gửi lại.
        if (ma != 0L && i.getLongExtra("ma", 0) == ma) return
        setIntent(i)
        recreate()
    }

    override fun onStart() {
        super.onStart()
        dangHien = true
        val cho = choHoi
        choHoi = null
        when {
            daTraLoi -> {}
            cho != null -> hoi(cho)
            // Quay lại màn sau khi rời đi: đang hỏi hoặc đang kể dở thì trở về câu hỏi và nghe lại, không để màn "đang nghe" mà micro đã tắt.
            daDung && (khung == R.id.khungHoi || khung == R.id.khungKe) -> hoi(docTo = false)
        }
        daDung = false
    }

    override fun onStop() {
        dangHien = false
        daDung = true
        dangKe = false
        dungNghe()
        Giong.dung(luotGiong)
        super.onStop()
    }

    override fun onDestroy() {
        dungNghe()
        Giong.dung(luotGiong)
        super.onDestroy()
    }

    private fun hien(khungMoi: Int) {
        khung = khungMoi
        for (id in listOf(R.id.khungHoi, R.id.khungKe, R.id.khungCho, R.id.khungKetQua)) v<View>(id).visibility = if (id == khungMoi) View.VISIBLE else View.GONE
    }

    private fun thoiLuong() = "${giay / 60}:%02d".format(giay % 60)
    private fun song() = dangHien && !isFinishing && !isDestroyed
    private fun docDuoc() = dangHien && CaiDat.hoiBangGiong(this)

    private fun ngheDuoc() = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED &&
        SpeechRecognizer.isRecognitionAvailable(this)

    private fun dungNghe() {
        try { nghe?.destroy() } catch (_: Exception) {}
        nghe = null
    }

    /** Nghe một lượt nói. [tungPhan] nhận chữ tạm trong lúc đang nói; [xong] nhận các phương án cuối (rỗng nếu lỗi). */
    private fun ngheMotLuot(tungPhan: (String) -> Unit = {}, xong: (List<String>) -> Unit) {
        try {
            dungNghe()
            nghe = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onResults(r: Bundle?) = xong(r?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION).orEmpty())
                    override fun onError(ma: Int) = xong(emptyList())
                    override fun onPartialResults(p: Bundle?) {
                        p?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let(tungPhan)
                    }
                    override fun onReadyForSpeech(p: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(r: Float) {}
                    override fun onBufferReceived(b: ByteArray?) {}
                    override fun onEndOfSpeech() {}
                    override fun onEvent(t: Int, p: Bundle?) {}
                })
                startListening(
                    Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "vi-VN")
                        .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                        .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                )
            }
        } catch (e: Exception) {
            xong(emptyList())
        }
    }

    // ---------- N2: phân tích bản ghi âm của máy ----------

    private fun phanTichBanGhi(uri: Uri, kieu: String) {
        hien(R.id.khungCho)
        v<TextView>(R.id.choPhu).text = "Bản ghi âm của máy · ${thoiLuong()}"
        Luong.nen {
            val kq = try {
                contentResolver.openInputStream(uri)?.let {
                    Api.analyzeRecording(this, it, kieu, soLa = !SoQuen.laQuen(this, so))
                }
            } catch (e: Exception) {
                null
            }
            Luong.chinh {
                if (isFinishing || isDestroyed) return@chinh
                if (kq == null) {
                    NhatKy.ghi(this, "Chưa phân tích được bản ghi âm, chuyển sang hỏi một câu")
                    hoi()
                } else {
                    hienPhanTich(kq, "Bản ghi")
                }
            }
        }
    }

    /** Kết quả AI trả về cho bản ghi âm hoặc lời kể. */
    private fun hienPhanTich(kq: KetQuaAI, nguon: String) {
        val muc = kq.muc
        val dauHieu = kq.dauHieu
        val chep = kq.chepLoi.joinToString("\n\n") { (ai, loi) -> if (ai.isBlank()) loi else "$ai: $loi" }
        NhatKy.ghi(this, "AI phân tích ${nguon.lowercase()}: ${muc.ten}, ${dauHieu.size} dấu hiệu")
        when {
            muc == Muc.NGUY_HIEM || muc == Muc.NGHI_NGO -> ketQuaXau(muc, kq.giaiThich, dauHieu.map { "$nguon: $it" })
            // AI không thấy gì (hoặc trả lời thiếu mức): đó chưa phải là "an toàn". Bản ghi thì hỏi lại một câu, lời kể thì nói rõ "chưa thấy".
            nguon == "Bản ghi" -> { daTraLoi = false; hoi() }
            else -> on(chuaThay = true)
        }
        if (chep.isNotBlank()) {
            v<View>(R.id.kqChepLoiKhung).visibility = View.VISIBLE
            v<TextView>(R.id.kqChepLoi).text = chep
        }
    }

    // ---------- N3: hỏi một câu bằng giọng nói ----------

    private fun hoi(docTo: Boolean = true) {
        if (khongHoi) {
            // Hôm nay đã hỏi một câu rồi. Bản ghi không cho kết luận gì thì im lặng, không hỏi thêm.
            NhatKy.ghi(this, "Hôm nay đã hỏi một câu rồi: không hỏi nữa")
            finish()
            return
        }
        hien(R.id.khungHoi)
        val nguoi = if (den) "Người vừa gọi" else "Người ${x.ban} vừa gọi"
        val cau = "$nguoi có bảo ${x.ban} chuyển tiền không ạ?"
        v<TextView>(R.id.cauHoi).text = cau
        v<TextView>(R.id.goiY).text = "${x.Ban} bấm Có hoặc Không"
        v<TextView>(R.id.trangThai).text = "Bé Nai đang hỏi ${x.ban}…"
        v<View>(R.id.nutKe).visibility = if (ngheDuoc()) View.VISIBLE else View.GONE
        // Màn chưa hiện trước mắt người dùng (vừa dựng, hoặc kết quả về lúc họ đã rời đi): chờ onStart rồi mới tính lượt, đọc và nghe.
        if (!dangHien) { choHoi = docTo; return }
        // Lượt hỏi trong ngày (D05) chỉ bị tính khi câu hỏi thật sự hiện ra.
        if (tinhLuotHoi) { tinhLuotHoi = false; CaiDat.datHoiGanNhat(this, System.currentTimeMillis()) }
        if (!CaiDat.hoiBangGiong(this)) {
            v<TextView>(R.id.trangThai).text = "Bé Nai hỏi thăm"
            return
        }
        if (!docTo) return batDauNghe()
        luotGiong = Giong.phat(this, if (den) tep(R.raw.benai_10) else null, "${x.Ban} ơi, ${x.toi} là Bé Nai, trợ lý Lá chắn. $cau") { batDauNghe() }
    }

    private fun batDauNghe() {
        if (daTraLoi || dangKe || !song()) return
        if (!ngheDuoc()) {
            v<TextView>(R.id.trangThai).text = "${x.Ban} bấm giúp ${x.toi} nhé"
            return
        }
        v<TextView>(R.id.goiY).text = "${x.Ban} nói “có” hoặc “không”, hoặc bấm"
        v<TextView>(R.id.trangThai).text = "Bé Nai đang nghe…"
        ngheMotLuot { cacCau ->
            if (daTraLoi || dangKe || !song()) return@ngheMotLuot
            when (LocTinNhan.hieuCoKhong(cacCau)) {
                true -> traLoi(true)
                false -> traLoi(false)
                null -> if (++lanNghe < 3) Luong.sau(500) { batDauNghe() }
                else v<TextView>(R.id.trangThai).text = "Bé Nai chưa nghe rõ, ${x.ban} bấm giúp ${x.toi} nhé"
            }
        }
    }

    private fun traLoi(co: Boolean) {
        if (daTraLoi) return
        daTraLoi = true
        dangKe = false
        dungNghe()
        NhatKy.ghi(this, "Trả lời câu hỏi sau cuộc gọi: " + if (co) "Có" else "Không")
        if (co) ketQuaXau(Muc.NGUY_HIEM, "", listOf("${x.Ban} cho biết người gọi bảo chuyển tiền")) else on()
    }

    // ---------- A04c: kể lại bằng giọng nói ----------

    private fun batDauKe() {
        if (!ngheDuoc()) return
        Giong.dung(luotGiong)
        dangKe = true
        loiKe.clear()
        keTu = System.currentTimeMillis()
        hien(R.id.khungKe)
        v<TextView>(R.id.keTieuDe).text = "${x.Ban} kể, Bé Nai nghe"
        v<TextView>(R.id.keLoi).text = ""
        ngheKe()
    }

    private fun ngheKe() {
        if (!dangKe || !song()) return
        // Tối đa 90 giây, để micro không mở mãi.
        if (System.currentTimeMillis() - keTu > 90_000) return keXong()
        v<TextView>(R.id.keTrangThai).text = "Bé Nai đang nghe ${x.ban} kể…"
        ngheMotLuot(
            tungPhan = { tam -> if (dangKe) v<TextView>(R.id.keLoi).text = (loiKe.toString() + " " + tam).trim() },
        ) { cacCau ->
            if (!dangKe || !song()) return@ngheMotLuot
            cacCau.firstOrNull()?.takeIf { it.isNotBlank() }?.let { loiKe.append(' ').append(it) }
            v<TextView>(R.id.keLoi).text = loiKe.toString().trim()
            Luong.sau(400) { ngheKe() }
        }
    }

    private fun keXong() {
        if (!dangKe) return
        dangKe = false
        dungNghe()
        // Lấy đúng chữ đang hiện trên màn: nó gồm cả câu cuối mà máy nghe chưa kịp chốt lúc người dùng bấm "Kể xong".
        val loi = v<TextView>(R.id.keLoi).text.toString().trim().ifBlank { loiKe.toString().trim() }
        loiKe.clear()   // lời kể không được giữ lại sau khi phân tích
        if (loi.length < 12) {
            NhatKy.ghi(this, "Lời kể quá ngắn, quay lại câu hỏi")
            hoi(docTo = false)
            v<TextView>(R.id.trangThai).text = "Bé Nai chưa nghe đủ để kết luận"
            return
        }
        daTraLoi = true
        hien(R.id.khungCho)
        v<TextView>(R.id.choPhu).text = "Lời ${x.ban} vừa kể"
        Luong.nen {
            // Lọc trên máy trước; có máy chủ thì gửi bản đã che số cho AI.
            val tren = LocTinNhan.phanTichLoiKe(loi)
            // Như với tin nhắn: AI "chưa đủ căn cứ" không được làm nhẹ đi điều bộ lọc trên máy đã thấy.
            val ai = Api.analyzeTranscript(this, LocTinNhan.che(loi))?.takeIf { Api.nang(it.muc) >= Api.nang(tren.muc) }
            Luong.chinh {
                if (isFinishing || isDestroyed) return@chinh
                if (ai != null) return@chinh hienPhanTich(ai, "Lời kể")
                NhatKy.ghi(this, "Lọc lời kể trên máy: ${tren.muc.ten}, ${tren.nhom.size} dấu hiệu")
                when (tren.muc) {
                    Muc.NGUY_HIEM, Muc.NGHI_NGO -> ketQuaXau(tren.muc, "", tren.nhom.map { "Lời kể: $it" })
                    else -> on(chuaThay = true)
                }
            }
        }
    }

    // ---------- Kết quả ----------

    /** Nguy hiểm: tự báo người thân. Nghi ngờ: không tự báo, chỉ đưa nút gọi. */
    private fun ketQuaXau(muc: Muc, giaiThich: String, bangChungThem: List<String>) {
        val nguyHiem = muc == Muc.NGUY_HIEM
        hien(R.id.khungKetQua)
        v<TextView>(R.id.kqPhu).text = "${TraCuu.dinhDang(so)} · ${thoiLuong()}"
        v<View>(R.id.kqThe).setBackgroundResource(if (nguyHiem) R.drawable.the_do else R.drawable.the_vang)
        v<TextView>(R.id.kqMuc).apply { text = muc.ten; setTextColor(getColor(if (nguyHiem) R.color.danger else R.color.warn)) }
        v<TextView>(R.id.kqLoi).text = giaiThich.ifBlank { if (nguyHiem) "${x.Ban} đừng chuyển tiền nhé." else "${x.Ban} khoan chuyển tiền, hỏi $ten trước đã." }
        val bangChung = buildList {
            if (soNguoiBao > 0) add("$soNguoiBao người đã báo số này" + if (nhan.isNotBlank()) " $nhan" else "")
            add("Số chưa quen với máy này")
            addAll(bangChungThem)
        }
        v<TextView>(R.id.kqBangChung).text = bangChung.joinToString("\n") { "•  $it" }
        RuiRo.mo(this, so)

        v<View>(R.id.kqNguoiThan).visibility = View.VISIBLE
        val tt = v<TextView>(R.id.ntTrangThai)
        val phu = v<TextView>(R.id.ntPhu)
        val soNt = CaiDat.soNguoiThan(this)
        v<Button>(R.id.nutGoi).apply {
            text = "Gọi $ten ngay"
            setOnClickListener { if (soNt.isBlank()) startActivity(Intent(this@HoiSauCuocGoiActivity, MainActivity::class.java)) else goiDien(soNt) }
        }
        val chuaBao = if (soNt.isBlank()) "Chưa có số của $ten. Bấm nút dưới để thêm." else "${x.Ban} bấm nút dưới để gọi $ten ngay."
        if (!nguyHiem) {
            tt.text = "Hỏi $ten cho chắc"
            phu.text = chuaBao
            if (docDuoc()) luotGiong = Giong.noi(this, "${x.Ban} khoan chuyển tiền nhé. ${x.Ban} gọi $ten hỏi trước cho chắc nha.")
            return
        }
        fun hienDaBao() {
            tt.text = "Đã báo cho $ten"
            phu.text = "$ten sẽ gọi cho ${x.ban}. ${x.Ban} không cần bấm gì."
        }
        tt.text = "Đang báo cho $ten…"
        phu.text = ""
        // Mỗi cuộc gọi chỉ báo một lần: giữ chỗ trước khi gọi mạng, để màn dựng lại giữa chừng không gửi lần hai.
        when (baoNguoiThan[ma]) {
            DA_BAO -> return hienDaBao()
            DANG_GUI -> {
                // Lượt gửi của màn trước còn đang chạy: chờ kết quả thật của nó, không gửi thêm, không báo thất bại sớm.
                fun xemLai(lan: Int) {
                    Luong.sau(2000) {
                        if (isFinishing || isDestroyed) return@sau
                        when {
                            baoNguoiThan[ma] == DA_BAO -> hienDaBao()
                            baoNguoiThan[ma] == DANG_GUI && lan < 4 -> xemLai(lan + 1)
                            else -> { tt.text = "Chưa báo được cho $ten"; phu.text = chuaBao }
                        }
                    }
                }
                xemLai(0)
                return
            }
        }
        if (ma != 0L) baoNguoiThan[ma] = DANG_GUI
        Luong.nen {
            // Người thân chỉ nhận mức cảnh báo và tóm tắt, không nhận nội dung cuộc gọi.
            // Tóm tắt có thể chứa dấu hiệu do AI viết ra: che mọi dãy số trước khi gửi.
            // Chỉ khi máy chủ trả về cảnh báo có mã mới được nói là đã báo. Trả lời rỗng hay báo lỗi đều là chưa báo.
            val daBao = Api.createAlert(this, muc, TraCuu.chuanHoa(so), giay.toInt(), LocTinNhan.che(bangChung.joinToString("; ")), thu)
            Luong.chinh {
                if (ma != 0L) { if (daBao) baoNguoiThan[ma] = DA_BAO else baoNguoiThan.remove(ma) }
                if (isFinishing || isDestroyed) return@chinh
                if (daBao) {
                    tt.text = "Đã báo cho $ten · ${SimpleDateFormat("HH:mm", Locale.US).format(Date())}"
                    phu.text = "$ten sẽ gọi cho ${x.ban}. ${x.Ban} không cần bấm gì."
                    NhatKy.ghi(this, "Đã báo cho người thân qua máy chủ")
                    if (docDuoc()) luotGiong = Giong.phat(this, tep(R.raw.benai_11), "${x.Ban} đừng chuyển tiền nhé. ${x.Toi} báo $ten ngay, $ten sẽ gọi cho ${x.ban}.")
                } else {
                    tt.text = "Chưa báo được cho $ten"
                    phu.text = chuaBao
                    NhatKy.ghi(this, "Chưa báo được cho người thân (chưa nối máy chủ hoặc mất mạng)")
                    if (docDuoc()) luotGiong = Giong.noi(this, "${x.Ban} đừng chuyển tiền nhé. ${x.Ban} gọi $ten hỏi trước cho chắc nha.")
                }
            }
        }
    }

    /** Không thấy dấu hiệu. [chuaThay]: kết luận từ lời kể, nên nói rõ là "chưa thấy" chứ không phải "an toàn". */
    private fun on(chuaThay: Boolean = false) {
        hien(R.id.khungKetQua)
        v<TextView>(R.id.kqPhu).text = "${TraCuu.dinhDang(so)} · ${thoiLuong()}"
        v<View>(R.id.kqThe).setBackgroundResource(R.drawable.the_xanh)
        v<TextView>(R.id.kqMuc).apply {
            text = if (chuaThay) "Chưa thấy dấu hiệu lừa đảo" else "Dạ vậy thì tốt rồi ạ"
            setTextColor(getColor(R.color.safe)); textSize = 26f
        }
        v<TextView>(R.id.kqLoi).text = "Nếu họ gọi lại đòi tiền, ${x.ban} cứ cúp máy nha."
        v<View>(R.id.kqNguoiThan).visibility = View.GONE
        if (soNguoiBao > 0) {
            v<TextView>(R.id.kqBangChung).text = "Số này vẫn bị $soNguoiBao người báo. Lá chắn sẽ nhắc nếu ${x.ban} mở ứng dụng ngân hàng."
        } else {
            v<TextView>(R.id.kqBangChung).visibility = View.GONE
            RuiRo.dong(this)
        }
        if (docDuoc()) {
            if (chuaThay) luotGiong = Giong.noi(this, "${x.Toi} chưa thấy dấu hiệu lừa đảo. Nếu họ gọi lại đòi tiền, ${x.ban} cứ cúp máy nha.")
            else luotGiong = Giong.phat(this, tep(R.raw.benai_12, nhacTen = false), "Dạ vậy thì tốt rồi ạ. Nếu họ gọi lại đòi tiền, ${x.ban} cứ cúp máy nha.")
        }
    }
}
