package vn.doi18.lachanso

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast

/**
 * Màn chính của phần chạy nền: trạng thái ba lớp bảo vệ (kể cả trạng thái "Lá chắn đang ngủ", E01a),
 * cài đặt, các nút giả lập để thử khi không có cuộc gọi thật, và nhật ký.
 */
class AdvancedSettingsActivity : Activity() {
    private fun <T : View> v(id: Int): T = findViewById(id)
    private val h = Handler(Looper.getMainLooper())
    private val lamMoi = object : Runnable {
        override fun run() {
            veTrangThai()
            v<TextView>(R.id.nhatKy).text = NhatKy.doc(this@AdvancedSettingsActivity).ifBlank { "Chưa có gì." }
            h.postDelayed(this, 2000)
        }
    }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setContentView(R.layout.main)
        val c = this

        v<EditText>(R.id.tenNguoiThan).setText(CaiDat.tenNguoiThan(c).takeIf { it != "người thân" }.orEmpty())
        v<EditText>(R.id.soNguoiThan).setText(CaiDat.soNguoiThan(c))
        v<EditText>(R.id.mayChu).setText(CaiDat.mayChu(c))
        // Khóa AI không bao giờ được hiện lại: chỉ báo là đã có, kèm bốn ký tự cuối để nhận ra.
        fun goiYKhoa() {
            val k = CaiDat.khoaAI(c); v<EditText>(R.id.khoaAI).hint = if (k.isBlank()) "Khóa AI (OpenAI), chỉ lưu trên máy này" else "Đã lưu khóa AI (…${k.takeLast(4)}). Gõ khóa mới để thay, gõ - để xóa"
            val g = HieuY.dsKhoaGiong(c); v<EditText>(R.id.khoaGiong).hint = if (g.isEmpty()) "Khóa giọng đọc (Gemini), nhiều khóa cách nhau dấu phẩy" else "Đã lưu ${g.size} khóa giọng đọc. Gõ khóa mới để thay, gõ - để xóa"
        }
        goiYKhoa()
        v<EditText>(R.id.appThu).setText(CaiDat.appThu(c))
        v<EditText>(R.id.soThu).setText(CaiDat.soThu(c))
        val cachXung = listOf("bà", "ông", "cô", "chú", "bác", "anh", "chị", "bạn")
        v<android.widget.Spinner>(R.id.xungHo).apply {
            adapter = android.widget.ArrayAdapter(c, android.R.layout.simple_spinner_dropdown_item, cachXung.map { "Bé Nai gọi chủ máy là: $it" })
            setSelection(cachXung.indexOf(CaiDat.xungHo(c)).coerceAtLeast(0))
            onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
                override fun onItemSelected(a: android.widget.AdapterView<*>?, v2: View?, i: Int, id: Long) { CaiDat.datXungHo(c, cachXung[i]); veTrangThai() }
                override fun onNothingSelected(a: android.widget.AdapterView<*>?) {}
            }
        }
        v<Button>(R.id.nutBoChan).setOnClickListener { CaiDat.boChanTatCa(c); veTrangThai() }
        v<Switch>(R.id.hoiBangGiong).apply { isChecked = CaiDat.hoiBangGiong(c); setOnCheckedChangeListener { _, b2 -> CaiDat.datHoiBangGiong(c, b2) } }
        v<Switch>(R.id.goiSong).apply { isChecked = CaiDat.goiSong(c); setOnCheckedChangeListener { _, b2 -> CaiDat.datGoiSong(c, b2) } }
        v<Switch>(R.id.trinhDien).apply { isChecked = CaiDat.trinhDien(c); setOnCheckedChangeListener { _, b2 -> CaiDat.datTrinhDien(c, b2) } }

        v<Button>(R.id.nutThietLap).setOnClickListener { startActivity(Intent(c, ThietLapActivity::class.java)) }
        v<Button>(R.id.nutLuu).setOnClickListener {
            CaiDat.datTenNguoiThan(c, v<EditText>(R.id.tenNguoiThan).text.toString())
            CaiDat.datSoNguoiThan(c, v<EditText>(R.id.soNguoiThan).text.toString())
            CaiDat.datMayChu(c, v<EditText>(R.id.mayChu).text.toString())
            val khoa = v<EditText>(R.id.khoaAI).text.toString().trim()
            if (khoa == "-") CaiDat.datKhoaAI(c, "") else if (khoa.isNotBlank()) CaiDat.datKhoaAI(c, khoa)
            val giong = v<EditText>(R.id.khoaGiong).text.toString().trim()
            if (giong == "-") CaiDat.datKhoaGiong(c, "") else if (giong.isNotBlank()) CaiDat.datKhoaGiong(c, giong)
            v<EditText>(R.id.khoaAI).setText(""); v<EditText>(R.id.khoaGiong).setText(""); goiYKhoa()
            CaiDat.datAppThu(c, v<EditText>(R.id.appThu).text.toString())
            CaiDat.datSoThu(c, v<EditText>(R.id.soThu).text.toString())
            Toast.makeText(c, "Đã lưu", Toast.LENGTH_SHORT).show()
        }

        // ----- Giả lập: đi thẳng vào từng lớp, dùng đúng mã của luồng thật -----
        v<Button>(R.id.thuDoChuong).setOnClickListener { DemoActions.run(c, "ring") }
        v<Button>(R.id.thuNhan).setOnClickListener { DemoActions.run(c, "ringKnown") }
        v<Button>(R.id.thuSauGoi).setOnClickListener { DemoActions.run(c, "afterCall") }
        v<Button>(R.id.thuDungLai).setOnClickListener { DemoActions.run(c, "stop") }
        v<Button>(R.id.thuTinNhan).setOnClickListener { DemoActions.run(c, "message") }
        v<Button>(R.id.thuCuaSo).setOnClickListener { DemoActions.run(c, "bankWatch") }
        v<Button>(R.id.thuGoiVideo).setOnClickListener { startActivity(Intent(c, GoiVideoActivity::class.java)) }
        // Bài học và các cảnh gọi video khác mở trong cùng màn WebView, bằng đường dẫn thường như trang bài học sẽ dùng (không kèm ?goc=1).
        fun moTrang(trang: String) {
            if (GoiVideoActivity.coTrang(c, trang)) startActivity(Intent(c, GoiVideoActivity::class.java).putExtra("trang", trang))
            else Toast.makeText(c, "Bản cài này chưa có trang đó", Toast.LENGTH_LONG).show()
        }
        v<Button>(R.id.moBaiHoc).setOnClickListener { moTrang("prototype/hoc.html") }
        v<Button>(R.id.goiMinh1).setOnClickListener { moTrang("prototype/video-call.html?canh=minh-1") }
        v<Button>(R.id.goiMinh3).setOnClickListener { moTrang("prototype/video-call.html?canh=minh-3") }
        v<Button>(R.id.goiTu9).setOnClickListener { moTrang("prototype/video-call.html?canh=tu-9") }
        v<Button>(R.id.nutXoaNhatKy).setOnClickListener { NhatKy.xoa(c); v<TextView>(R.id.nhatKy).text = "Chưa có gì." }
    }

    override fun onResume() {
        super.onResume()
        DichVuLaChan.batDau(this)
        veTrangThai()
        h.post(lamMoi)
    }

    override fun onPause() {
        h.removeCallbacks(lamMoi)
        super.onPause()
    }

    private fun veTrangThai() {
        val soChan = CaiDat.soChan(this).size
        v<Button>(R.id.nutBoChan).apply {
            visibility = if (soChan > 0) View.VISIBLE else View.GONE
            text = "Bỏ chặn $soChan số đã chặn"
        }
        val n = Quyen.soLopDaBat(this)
        val the = v<View>(R.id.theTrangThai)
        val td = v<TextView>(R.id.ttTieuDe)
        val phu = v<TextView>(R.id.ttPhu)
        val nai = v<ImageView>(R.id.nai)
        when {
            CaiDat.relative(this) -> {
                the.setBackgroundResource(R.drawable.the_xanh)
                td.text = "Cảnh báo của gia đình"
                td.setTextColor(getColor(R.color.safe_ink))
                phu.text = if (CaiDat.mayChu(this).isBlank()) "Anh nhập địa chỉ máy chủ để nhận cảnh báo của mẹ."
                    else "Máy của anh nhận cảnh báo từ gia đình."
                nai.setImageResource(R.drawable.nai_chao)
            }
            n == 3 && DichVuLaChan.dangChay -> {
                the.setBackgroundResource(R.drawable.the_xanh)
                td.text = "Lá chắn đang bảo vệ"; td.setTextColor(getColor(R.color.safe_ink))
                phu.text = "3/3 lớp đang bật"
                nai.setImageResource(R.drawable.nai_chao)
            }
            n == 0 || !DichVuLaChan.dangChay -> {
                the.setBackgroundResource(R.drawable.the_do)
                td.text = "Lá chắn đang ngủ"; td.setTextColor(getColor(R.color.danger_ink))
                phu.text = if (n == 0) "${xung().Ban} chưa được bảo vệ. Bấm Thiết lập để bật." else "Máy đã tắt Lá chắn. Mở lại app để bật."
                nai.setImageResource(R.drawable.nai_think)
            }
            else -> {
                the.setBackgroundResource(R.drawable.the_vang)
                td.text = "Mới bật $n/3 lớp"; td.setTextColor(getColor(R.color.warn_ink))
                phu.text = "Bấm Thiết lập để bật các lớp còn lại."
                nai.setImageResource(R.drawable.nai_think)
            }
        }
    }
}
