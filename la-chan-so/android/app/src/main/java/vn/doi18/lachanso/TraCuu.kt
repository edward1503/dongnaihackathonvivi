package vn.doi18.lachanso

import android.content.Context
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import org.json.JSONObject
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

enum class Muc(val ma: String, val ten: String) {
    NGUY_HIEM("nguy-hiem", "Nguy hiểm"),
    NGHI_NGO("nghi-ngo", "Nghi ngờ"),
    AN_TOAN("an-toan", "An toàn"),
    CHUA_CO_DU_LIEU("chua-co-du-lieu", "Chưa có dữ liệu");

    companion object {
        fun tu(ma: String?) = entries.firstOrNull { it.ma == ma } ?: CHUA_CO_DU_LIEU
    }
}

data class KetQuaSo(
    val muc: Muc,
    val soNguoiBao: Int = 0,
    val nhan: String = "",
    val baoGanNhat: String = "",
    val tuMayChu: Boolean = false,
)

/**
 * Đường truyền tới máy chủ của đội (mảng 2). Tên đường dẫn và tên trường của hợp đồng chung nằm ở Api.kt; xem android/HOP-DONG-DU-LIEU.md.
 * Mọi hàm trả null khi chưa cấu hình máy chủ hoặc khi lỗi mạng: bên gọi phải có đường dự phòng trên máy.
 */
object MayChu {
    private fun mo(c: Context, duong: String, choMs: Int): HttpURLConnection? {
        val goc = CaiDat.mayChu(c)
        if (goc.isBlank()) return null
        return (URL(goc + duong).openConnection() as HttpURLConnection).apply {
            connectTimeout = choMs
            readTimeout = choMs
            setRequestProperty("Accept", "application/json")
        }
    }

    private fun doc(k: HttpURLConnection): JSONObject? = try {
        if (k.responseCode in 200..299) JSONObject(k.inputStream.bufferedReader().readText()) else null
    } finally {
        k.disconnect()
    }

    fun lay(c: Context, duong: String, choMs: Int = 1500): JSONObject? = try {
        mo(c, duong, choMs)?.let { doc(it) }
    } catch (e: Exception) {
        null
    }

    fun gui(c: Context, duong: String, than: JSONObject, choMs: Int = 8000): JSONObject? = try {
        mo(c, duong, choMs)?.let { k ->
            k.requestMethod = "POST"
            k.doOutput = true
            k.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            k.outputStream.use { it.write(than.toString().toByteArray()) }
            doc(k)
        }
    } catch (e: Exception) {
        null
    }

    fun guiTep(c: Context, duong: String, tep: InputStream, kieu: String, choMs: Int = 60000): JSONObject? = try {
        mo(c, duong, choMs)?.let { k ->
            k.requestMethod = "POST"
            k.doOutput = true
            k.setChunkedStreamingMode(64 * 1024)
            k.setRequestProperty("Content-Type", kieu)
            k.outputStream.use { ra -> tep.use { it.copyTo(ra) } }
            doc(k)
        }
    } catch (e: Exception) {
        null
    }

    /**
     * Gửi biểu mẫu nhiều phần (multipart/form-data): các trường chữ, và nếu có thì một tệp gửi kiểu chunked (không nạp cả tệp vào bộ nhớ).
     */
    fun guiNhieuPhan(
        c: Context, duong: String, truong: Map<String, String>,
        tenTruongTep: String? = null, tenTep: String = "", kieuTep: String = "", tep: InputStream? = null, choMs: Int = 60000,
    ): JSONObject? = try {
        mo(c, duong, choMs)?.let { k ->
            val ranh = "----lachanso" + System.nanoTime().toString(36)
            k.requestMethod = "POST"
            k.doOutput = true
            k.setChunkedStreamingMode(64 * 1024)
            k.setRequestProperty("Content-Type", "multipart/form-data; boundary=$ranh")
            k.outputStream.use { ra ->
                fun viet(s: String) = ra.write(s.toByteArray())
                for ((ten, giaTri) in truong) viet("--$ranh\r\nContent-Disposition: form-data; name=\"$ten\"\r\n\r\n$giaTri\r\n")
                if (tenTruongTep != null && tep != null) {
                    viet("--$ranh\r\nContent-Disposition: form-data; name=\"$tenTruongTep\"; filename=\"$tenTep\"\r\nContent-Type: ${kieuTep.ifBlank { "application/octet-stream" }}\r\n\r\n")
                    tep.use { it.copyTo(ra) }
                    viet("\r\n")
                }
                viet("--$ranh--\r\n")
            }
            doc(k)
        }
    } catch (e: Exception) {
        null
    }

    fun ma(s: String): String = URLEncoder.encode(s, "UTF-8")
}

object TraCuu {
    /** Dữ liệu giả lập, trùng với prototype/mock-data.js. Dùng khi chưa có máy chủ hoặc mất mạng. */
    private val SO_BI_BAO = mapOf(
        "0912345678" to KetQuaSo(Muc.NGUY_HIEM, 14, "giả danh công an", "hôm qua"),
        "02899991234" to KetQuaSo(Muc.NGUY_HIEM, 9, "giả danh ngân hàng", "3 ngày trước"),
        "0934567890" to KetQuaSo(Muc.NGUY_HIEM, 6, "tuyển cộng tác viên, đòi nạp tiền", "tuần này"),
        "0987111222" to KetQuaSo(Muc.NGUY_HIEM, 5, "báo trúng thưởng", "tuần này"),
    )
    /** Nhãn nhẹ do cộng đồng gắn, không phải cảnh báo (màn A03b). */
    private val NHAN_NHE = mapOf(
        "0909000111" to KetQuaSo(Muc.CHUA_CO_DU_LIEU, 23, "giao hàng"),
    )
    private val TONG_DAI_THAT = setOf("1900555588", "113", "1900545454")

    /** Chỉ giữ chữ số, đổi +84 và 84 đầu số về 0. */
    fun chuanHoa(so: String): String {
        var s = so.filter { it.isDigit() || it == '+' }
        if (s.startsWith("+84")) s = "0" + s.substring(3)
        s = s.filter { it.isDigit() }
        if (s.length >= 11 && s.startsWith("84")) s = "0" + s.substring(2)
        return s
    }

    fun dinhDang(so: String): String {
        val s = chuanHoa(so)
        return if (s.length == 10) "${s.substring(0, 4)} ${s.substring(4, 7)} ${s.substring(7)}" else s.ifBlank { "Số ẩn" }
    }

    /** Tra một số. Chạy trên luồng nền: có thể gọi mạng (tối đa 1,5 giây) rồi mới dùng dữ liệu trên máy. */
    fun tra(c: Context, so: String): KetQuaSo {
        val s = chuanHoa(so)
        if (s.isBlank()) return KetQuaSo(Muc.CHUA_CO_DU_LIEU)
        if (s == chuanHoa(CaiDat.soThu(c))) return KetQuaSo(Muc.NGUY_HIEM, 14, "giả danh công an (số thử)", "hôm qua")
        Api.lookupPhone(c, s)?.let { kq ->
            // Máy chủ chưa có báo cáo nào về số này: vẫn cho hiện nhãn nhẹ của cộng đồng nếu máy đang có (màn A03b).
            return if (kq.muc == Muc.CHUA_CO_DU_LIEU) NHAN_NHE[s] ?: kq else kq
        }
        return when {
            s in TONG_DAI_THAT -> KetQuaSo(Muc.AN_TOAN, nhan = "tổng đài đã xác thực")
            else -> SO_BI_BAO[s] ?: NHAN_NHE[s] ?: KetQuaSo(Muc.CHUA_CO_DU_LIEU)
        }
    }
}

/**
 * "Số quen" theo màn D05: người lớn tuổi thường nhớ số chứ không lưu, nên không dùng "chưa lưu danh bạ" làm dấu hiệu.
 * Một số được coi là quen khi: là người thân đã ghép, chủ máy bấm "Tôi biết số này", có trong danh bạ,
 * hoặc chủ máy từng gọi đi cho số đó ít nhất 2 lần, mỗi lần từ 30 giây, vào 2 ngày khác nhau trong 60 ngày.
 * Cuộc gọi đến không được tính: người lạ gọi nhử nhiều lần không thành số quen.
 * Số đang bị cộng đồng báo thì lịch sử cuộc gọi không được tính. Các ngưỡng là giả thuyết để thử.
 */
object SoQuen {
    private const val MOT_NGAY = 24L * 3600 * 1000

    fun laQuen(c: Context, so: String, truocLuc: Long = System.currentTimeMillis(), biBao: Boolean = false): Boolean {
        val s = TraCuu.chuanHoa(so)
        if (s.isBlank()) return false
        if (s == TraCuu.chuanHoa(CaiDat.soNguoiThan(c))) return true
        if (s in CaiDat.soTuDanhDauQuen(c) || trongDanhBa(c, s)) return true
        return !biBao && trongLichSu(c, s, truocLuc)
    }

    private fun trongDanhBa(c: Context, so: String): Boolean = try {
        val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(so))
        c.contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup._ID), null, null, null)
            ?.use { it.moveToFirst() } ?: false
    } catch (e: Exception) {
        false
    }

    private fun trongLichSu(c: Context, so: String, truocLuc: Long): Boolean = try {
        val ngayGoiDi = HashSet<Long>()
        val mui = java.util.TimeZone.getDefault()
        c.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DURATION, CallLog.Calls.DATE),
            // Lọc ngay trong truy vấn, để giới hạn số dòng chỉ tính các cuộc gọi đi đủ dài.
            "${CallLog.Calls.DATE} < ? AND ${CallLog.Calls.DATE} > ? AND ${CallLog.Calls.TYPE} = ${CallLog.Calls.OUTGOING_TYPE} AND ${CallLog.Calls.DURATION} >= 30",
            arrayOf((truocLuc - 5000).toString(), (truocLuc - 60 * MOT_NGAY).toString()),
            "${CallLog.Calls.DATE} DESC",
        )?.use { k ->
            var dem = 0
            while (k.moveToNext() && dem++ < 2000) {
                if (TraCuu.chuanHoa(k.getString(0).orEmpty()) != so) continue
                val luc = k.getLong(3)
                ngayGoiDi += (luc + mui.getOffset(luc)) / MOT_NGAY
            }
        }
        ngayGoiDi.size >= 2
    } catch (e: Exception) {
        false
    }
}

/** Một dòng trong nhật ký cuộc gọi của máy (cần quyền đọc nhật ký cuộc gọi). [giay] = 0: chưa hề nói chuyện. */
data class CuocGoiCuoi(val so: String, val giay: Long, val den: Boolean, val luc: Long)

/**
 * Dòng nhật ký của đúng cuộc gọi vừa kết thúc: cùng chiều [den], bắt đầu từ [tu] trở đi và, nếu đã biết số, khớp [so].
 * Không lấy "dòng mới nhất": khi có cuộc gọi chờ bị nhỡ trong lúc đang nghe, dòng mới nhất là cuộc nhỡ ấy.
 * Không lấy dòng khác chiều: gọi đi rồi hủy, người kia gọi lại ngay thì dòng gọi đi 0 giây không phải là cuộc vừa nghe.
 * Chỉ xét dòng bắt đầu trong vòng [saiSo] quanh [tu] (1,5 giây khi [tu] là mốc chính xác của dịch vụ sàng lọc) và lấy dòng gần [tu] nhất: gọi đi, hủy rồi gọi lại ngay thì
 * dòng 0 giây của lần trước không bị lấy nhầm. Chưa phân biệt được hai SIM.
 */
fun cuocGoiCuaPhien(c: Context, so: String, tu: Long, den: Boolean, saiSo: Long = 6000): CuocGoiCuoi? = try {
    val s = TraCuu.chuanHoa(so)
    val loaiCan = if (den) CallLog.Calls.INCOMING_TYPE else CallLog.Calls.OUTGOING_TYPE   // bỏ cuộc nhỡ, bị từ chối, bị chặn
    var tot: CuocGoiCuoi? = null
    c.contentResolver.query(
        CallLog.Calls.CONTENT_URI,
        arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.DURATION, CallLog.Calls.TYPE, CallLog.Calls.DATE),
        "${CallLog.Calls.DATE} >= ? AND ${CallLog.Calls.DATE} <= ? AND ${CallLog.Calls.TYPE} = $loaiCan",
        arrayOf((tu - saiSo).toString(), (tu + saiSo).toString()), "${CallLog.Calls.DATE} ASC",
    )?.use { k ->
        while (k.moveToNext()) {
            val soDong = k.getString(0).orEmpty()
            if (s.isNotBlank() && TraCuu.chuanHoa(soDong) != s) continue
            val dong = CuocGoiCuoi(soDong, k.getLong(1), den, k.getLong(3))
            if (tot == null || kotlin.math.abs(dong.luc - tu) < kotlin.math.abs(tot!!.luc - tu)) tot = dong
        }
    }
    tot
} catch (e: Exception) {
    null
}
