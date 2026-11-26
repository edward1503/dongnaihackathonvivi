package vn.doi18.lachanso

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

/**
 * Kho giọng đã lưu của cuộc gọi video: mọi câu AI đã đọc (tiếng ĐÃ lọc rẹt) và mọi lượt AI đã đáp được giữ lại trong vùng riêng của app
 * (files/kho-giong). Mục đích: hết lượt API hoặc mất mạng vẫn phát lại được đúng những lượt đã từng chạy, tiện quay video giới thiệu.
 *
 *  - Tiếng: khóa = giọng + lời (đã chuẩn hóa). Câu nào đã đọc rồi thì lần sau phát lại ngay, không gọi API.
 *  - Lượt: khóa CHẶT = nhân vật + cả đoạn trò chuyện + các ý đã chấm; khóa LỎNG = nhân vật + câu cuối của người học + các ý đã chấm.
 *    Trùng khóa chặt thì dùng luôn (gõ lại đúng kịch bản cũ sẽ ra đúng lời cũ, không tốn lượt API). Khóa lỏng chỉ dùng khi gọi AI hỏng.
 *
 * Tên tệp là mã băm nên kho KHÔNG chứa lời người học. Riêng bản debug ghi thêm câu cuối của người học vào tệp lượt, để đội biết gõ lại câu gì
 * khi quay video. Kéo kho về máy tính: tools/keo-giong.sh; đẩy lại vào máy: tools/keo-giong.sh day.
 */
object KhoGiong {
    private const val TOI_DA = 1200   // số tệp tối đa trong kho; đầy thì bỏ các tệp cũ nhất

    private fun thuMuc(c: Context) = File(c.filesDir, "kho-giong").apply { mkdirs() }
    fun chuan(s: String) = s.lowercase().replace(Regex("[^\\p{L}\\p{Nd}]+"), " ").trim()
    private fun bam(s: String) = MessageDigest.getInstance("SHA-1").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }.take(24)

    /** Tiếng đã lưu của một câu: {"chu","pcm","tanSo","giay","tuKho":true} hoặc null. */
    fun layTieng(c: Context, giong: String, chu: String): JSONObject? = try {
        val ten = "tieng-" + bam(giong + "|" + chuan(chu)); val d = thuMuc(c)
        val tep = File(d, "$ten.pcm"); val mo = File(d, "$ten.json")
        if (!tep.exists() || !mo.exists() || tep.length() < 4000) null else {
            val m = JSONObject(mo.readText()); val tanSo = m.optInt("tanSo", 24000)
            JSONObject().put("chu", chu).put("pcm", android.util.Base64.encodeToString(tep.readBytes(), android.util.Base64.NO_WRAP))
                .put("tanSo", tanSo).put("giay", tep.length() / 2.0 / tanSo).put("tuKho", true)
        }
    } catch (_: Exception) { null }

    /** Lưu tiếng đã lọc của một câu (PCM16 một kênh, base64). */
    fun luuTieng(c: Context, giong: String, chu: String, pcmB64: String, tanSo: Int) {
        try {
            val ten = "tieng-" + bam(giong + "|" + chuan(chu)); val d = thuMuc(c)
            val pcm = android.util.Base64.decode(pcmB64, android.util.Base64.DEFAULT)
            File(d, "$ten.pcm").writeBytes(pcm)
            File(d, "$ten.json").writeText(JSONObject().put("giong", giong).put("chu", chu).put("tanSo", tanSo).put("giay", pcm.size / 2.0 / tanSo).put("luc", System.currentTimeMillis()).toString())
            don(d)
        } catch (_: Exception) {
        }
    }

    private fun doan(lichSu: JSONArray): String {
        val sb = StringBuilder()
        for (i in 0 until lichSu.length()) { val x = lichSu.getJSONObject(i); sb.append(x.optString("ai")).append(':').append(chuan(x.optString("chu"))).append('\n') }
        return sb.toString()
    }
    private fun cauCuoi(lichSu: JSONArray) = if (lichSu.length() == 0) "" else lichSu.getJSONObject(lichSu.length() - 1).optString("chu")
    fun khoaChat(nhanVat: String, lichSu: JSONArray, daCham: List<String>) = "luot-" + bam(nhanVat + "|" + doan(lichSu) + "|" + daCham.sorted().joinToString(","))
    fun khoaLong(nhanVat: String, lichSu: JSONArray, daCham: List<String>) = "long-" + bam(nhanVat + "|" + chuan(cauCuoi(lichSu)) + "|" + daCham.sorted().joinToString(","))

    /** Lượt đã lưu: {"chu","y":[…],"sai","het"} hoặc null. */
    fun layLuot(c: Context, khoa: String): JSONObject? = try {
        File(thuMuc(c), "$khoa.json").takeIf { it.exists() }?.let { JSONObject(it.readText()) }?.takeIf { it.optString("chu").isNotBlank() }
    } catch (_: Exception) { null }

    /** Lưu một lượt AI vừa đáp, dưới cả khóa chặt và khóa lỏng. */
    fun luuLuot(c: Context, nhanVat: String, lichSu: JSONArray, daCham: List<String>, chu: String, y: List<String>, sai: Boolean, het: Boolean) {
        try {
            val j = JSONObject().put("nhan_vat", nhanVat).put("chu", chu).put("y", JSONArray(y)).put("sai", sai).put("het", het)
                .put("da_cham", JSONArray(daCham.sorted())).put("luot_thu", lichSu.length()).put("luc", System.currentTimeMillis())
            if (BuildConfig.DEBUG) j.put("nguoi_hoc", cauCuoi(lichSu).take(300))   // chỉ bản debug: để đội biết gõ lại câu gì khi quay video
            val d = thuMuc(c)
            File(d, khoaChat(nhanVat, lichSu, daCham) + ".json").writeText(j.toString())
            File(d, khoaLong(nhanVat, lichSu, daCham) + ".json").writeText(j.toString())
            don(d)
        } catch (_: Exception) {
        }
    }

    private fun don(d: File) {
        val ds = d.listFiles() ?: return
        if (ds.size > TOI_DA) ds.sortedBy { it.lastModified() }.take(ds.size - TOI_DA + 50).forEach { it.delete() }
    }
}
