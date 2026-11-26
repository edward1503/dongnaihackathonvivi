package vn.doi18.lachanso

import android.content.Context
import android.content.Intent
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL

/**
 * Sau khi Lá chắn báo cho người thân, máy người lớn tuổi canh lời nhắn trả lời (3 giây một lần, tối đa 10 phút).
 * Có lời nhắn mới thì bật app lên màn chính; màn chính tự mở lời nhắn to và đọc thành tiếng.
 */
object LoiNhanNguoiThan {
    private const val CANH_MS = 10 * 60_000L
    @Volatile private var den = 0L
    @Volatile private var dangChay = false
    private val daHien = mutableSetOf<String>()

    fun canh(c: Context) {
        val app = c.applicationContext
        den = System.currentTimeMillis() + CANH_MS
        synchronized(this) {
            if (dangChay) return
            dangChay = true
        }
        Luong.nen {
            try {
                while (System.currentTimeMillis() < den) {
                    layMoi(app)?.let { (ten, loi) -> hien(app, ten, loi) }
                    Thread.sleep(3000)
                }
            } finally {
                dangChay = false
            }
        }
    }

    /** Lời nhắn chưa đọc mới nhất mà máy này chưa bật lên. Không ghi nội dung vào nhật ký. */
    private fun layMoi(c: Context): Pair<String, String>? {
        val goc = CaiDat.mayChu(c).ifBlank { return null }
        val may = DeviceRegistration.get(c) ?: return null
        val k = (URL("$goc/api/family/unread").openConnection() as HttpURLConnection).apply {
            setRequestProperty("X-LCS-Device", may.id)
            setRequestProperty("Accept", "application/json")
            connectTimeout = 4000
            readTimeout = 4000
        }
        return try {
            if (k.responseCode != 200) return null
            val ds = JSONArray(k.inputStream.bufferedReader().readText())
            var moi: Pair<String, String>? = null
            for (i in 0 until ds.length()) {
                val r = ds.optJSONObject(i)?.optJSONObject("reply") ?: continue
                val ma = r.optString("id").ifBlank { r.optString("at") }
                if (ma.isBlank() || !synchronized(daHien) { daHien.add(ma) }) continue
                val ten = r.optString("by").ifBlank { "Người thân" }
                moi = ten to r.optString("text").removePrefix("$ten: ")
            }
            moi
        } catch (_: Exception) {
            null
        } finally {
            k.disconnect()
        }
    }

    private fun hien(c: Context, ten: String, loi: String) {
        NhatKy.ghi(c, "Có lời nhắn của người thân")
        val i = Intent(c, MainActivity::class.java).putExtra("route", "#/")
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        Luong.chinh { moTuNen(c, i, ThongBao.ID_LOI_NHAN, "$ten gửi lời nhắn cho ${c.xung().ban}", loi) }
    }
}
