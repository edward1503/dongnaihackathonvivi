package vn.doi18.lachanso

import android.content.Context
import android.util.AtomicFile
import androidx.core.util.readText
import androidx.core.util.writeText
import org.json.JSONObject
import java.io.File

object FlaggedNumbers {
    private const val MAX_AGE_MS = 3L * 24 * 60 * 60 * 1000
    private data class Snapshot(val fetchedAt: Long, val numbers: Map<String, KetQuaSo>)

    @Volatile private var cached: Snapshot? = null
    private val cacheLock = Any()

    internal fun numberHash(number: String) = ReceiptRules.hash(TraCuu.chuanHoa(number))

    internal fun isFresh(fetchedAt: Long, now: Long) = fetchedAt > 0 && now - fetchedAt in 0L..MAX_AGE_MS

    private fun file(context: Context) = AtomicFile(File(context.filesDir, "flagged-numbers.json"))

    private fun parse(json: JSONObject): Snapshot {
        val items = json.getJSONArray("items")
        val numbers = HashMap<String, KetQuaSo>(items.length())
        for (index in 0 until items.length()) {
            val item = items.getJSONObject(index)
            val level = Api.muc(item.getString("level"))
            require(level == Muc.NGUY_HIEM || level == Muc.NGHI_NGO)
            numbers[item.getString("hash")] = KetQuaSo(
                level, soNguoiBao = item.getInt("count"), nhan = "",
                baoGanNhat = item.getString("lastWhen"), tuMayChu = true,
            )
        }
        return Snapshot(json.getLong("fetchedAt"), numbers)
    }

    private fun read(context: Context): Snapshot = try {
        parse(JSONObject(file(context).readText()))
    } catch (_: Exception) {
        Snapshot(0, emptyMap())
    }

    private fun current(context: Context): Snapshot = cached ?: synchronized(cacheLock) {
        cached ?: read(context).also { cached = it }
    }

    @Synchronized fun sync(context: Context) {
        if (CaiDat.mayChu(context).isBlank()) return
        // Nạp bản cũ trước khi gọi mạng để lúc đổ chuông chỉ cần tra trong bộ nhớ.
        current(context)
        val json = MayChu.lay(context, "/api/lookup/flagged", 8000) ?: return
        json.put("fetchedAt", System.currentTimeMillis())
        val snapshot = parse(json)
        file(context).writeText(json.toString())
        cached = snapshot
    }

    fun find(context: Context, number: String): KetQuaSo? {
        val snapshot = current(context)
        if (!isFresh(snapshot.fetchedAt, System.currentTimeMillis())) return null
        return snapshot.numbers[numberHash(number)]
    }
}
