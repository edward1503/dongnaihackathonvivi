package vn.doi18.lachanso

import android.content.Context
import android.os.SystemClock
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Base64

/** Kết quả phân tích của máy chủ, đã đổi sang kiểu dữ liệu của app. */
data class KetQuaAI(
    val muc: Muc,
    val kieu: String = "",        // tên kiểu lừa đảo để hiện, ví dụ "Giả danh công an"
    val maKieu: String = "",      // mã kiểu của máy chủ (scamType), dùng để mở đúng bài học
    val giaiThich: String = "",   // việc nên làm, đã nối thành một đoạn
    val dauHieu: List<String> = emptyList(),
    val chepLoi: List<Pair<String, String>> = emptyList(),   // (người nói, lời) của bản ghi âm; đã che số ở máy chủ
)

/**
 * Hợp đồng dữ liệu CHUNG của đội: máy chủ FastAPI ở server/ (xem server/README.md và KE-HOACH-MANG-2-3.md mục 2).
 * Đường dẫn và tên trường trên đường truyền đều bằng tiếng Anh; kết quả phân tích luôn có dạng AnalysisResult
 * {level, scamType, scamLabel, headline, why[], todo[], signs[{text, quotes}], maskedText, reports{count, lastWhen}, source}.
 *
 * Đây là chỗ DUY NHẤT trong app biết tên trên đường truyền. Phần còn lại của app dùng Muc, KetQuaSo, KetQuaAI.
 * Mọi hàm trả null (hoặc false) khi chưa nhập địa chỉ máy chủ, lỗi mạng, quá giờ, hoặc trả lời thiếu trường bắt buộc:
 * bên gọi luôn có đường dự phòng trên máy và không được báo sai là "đã gửi".
 */
object Api {
    /** Phòng đồng bộ của gia đình mẫu. Còn thiếu: mã ghép đôi thật giữa máy bà và máy người thân. */
    const val ROOM = "gia-dinh-hoa"
    private const val SENDER = "android"

    // ---------- Phần thuần (có bài kiểm ở ApiTest) ----------

    fun muc(level: String?): Muc = when (level) {
        "danger" -> Muc.NGUY_HIEM
        "suspicious" -> Muc.NGHI_NGO
        "safe" -> Muc.AN_TOAN
        else -> Muc.CHUA_CO_DU_LIEU   // "unknown", thiếu, hoặc giá trị lạ: không bao giờ suy ra "an toàn"
    }

    fun level(m: Muc): String = when (m) {
        Muc.NGUY_HIEM -> "danger"
        Muc.NGHI_NGO -> "suspicious"
        Muc.AN_TOAN -> "safe"
        Muc.CHUA_CO_DU_LIEU -> "unknown"
    }

    /** Thứ bậc để so hai kết quả: kết quả của máy chủ không được làm nhẹ đi cảnh báo app đã tự thấy trên máy. */
    fun nang(m: Muc): Int = when (m) { Muc.NGUY_HIEM -> 3; Muc.NGHI_NGO -> 2; Muc.CHUA_CO_DU_LIEU -> 1; Muc.AN_TOAN -> 0 }

    /** scamLabel ("Giả danh công an") nối sau câu "14 người đã báo số này …" nên viết thường chữ đầu. */
    fun nhan(scamLabel: String): String = scamLabel.trim().trimEnd('.').replaceFirstChar { it.lowercase() }

    /** todo[] của máy chủ thành một đoạn lời khuyên; không có thì dùng headline. */
    fun giaiThich(todo: List<String>, headline: String): String =
        todo.map { it.trim() }.filter { it.isNotEmpty() }.joinToString(" ") { if (it.last() in ".!?…") it else "$it." }.ifBlank { headline.trim() }

    /** maskedText của bản ghi âm: mỗi dòng "Người nói: lời". Dòng không có người nói thì để trống tên. */
    fun chepLoi(maskedText: String): List<Pair<String, String>> = maskedText.lines().map { it.trim() }.filter { it.isNotEmpty() }.map { d ->
        val k = d.indexOf(": ")
        if (k in 1..24) d.substring(0, k) to d.substring(k + 2).trim() else "" to d
    }

    /** Đối tượng của một báo cáo tin nhắn: số gửi tin, không có thì đường dẫn đầu tiên trong tin, không có nữa thì tên người gửi. */
    fun doiTuongBaoCao(nguoiGui: String, tin: String): String {
        val so = nguoiGui.filter { it.isDigit() }
        if (so.length >= 8 && nguoiGui.count { it.isLetter() } == 0) return so
        Regex("""(?i)\b(?:https?://)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?""").find(tin)?.let { return it.value.trimEnd('.', ',', ')', '!', '?') }
        return nguoiGui.trim().ifBlank { "tin nhắn" }
    }

    // ---------- Gọi máy chủ ----------

    /** org.json trả chuỗi "null" cho giá trị null; máy chủ lại gửi null ở mọi trường không có. */
    private fun chu(j: JSONObject, k: String): String = if (j.isNull(k)) "" else j.optString(k).trim()
    private fun mang(a: JSONArray?): List<String> = (0 until (a?.length() ?: 0)).mapNotNull { i -> a!!.opt(i)?.takeIf { it is String }?.toString()?.trim()?.takeIf { it.isNotEmpty() } }

    private fun phanTich(j: JSONObject, laBanGhi: Boolean): KetQuaAI? {
        if (j.isNull("level")) return null
        val signs = j.optJSONArray("signs")
        val dauHieu = (0 until (signs?.length() ?: 0)).mapNotNull { signs!!.optJSONObject(it)?.let { s -> chu(s, "text") }?.takeIf { it.isNotEmpty() } }
        return KetQuaAI(
            muc(chu(j, "level")), chu(j, "scamLabel"), chu(j, "scamType"),
            giaiThich(mang(j.optJSONArray("todo")), chu(j, "headline")),
            // why[] là bằng chứng máy chủ rút từ bản ghi ("Bản ghi có câu đòi chuyển tiền"): với tin nhắn và lời kể thì không dùng.
            ((if (laBanGhi) mang(j.optJSONArray("why")) else emptyList()) + dauHieu).distinct(),
            if (laBanGhi) chepLoi(chu(j, "maskedText")) else emptyList(),
        )
    }

    /** GET /api/lookup/phone/{số}: tra số lúc đổ chuông, không gọi AI. */
    fun lookupPhone(c: Context, so: String): KetQuaSo? {
        val j = MayChu.lay(c, "/api/lookup/phone/${MayChu.ma(so)}") ?: return null
        if (j.isNull("level")) return null
        val m = muc(chu(j, "level")); val r = j.optJSONObject("reports")
        return KetQuaSo(
            m, r?.optInt("count") ?: 0,
            if (m == Muc.AN_TOAN) "tổng đài đã xác thực" else nhan(chu(j, "scamLabel")),
            r?.let { chu(it, "lastWhen") }.orEmpty(), tuMayChu = true,
        )
    }

    /** POST /api/analyze/message {text}: phân tích một tin nhắn. Bên gọi đã che mọi dãy số và không gửi tin có mã xác thực. */
    fun analyzeMessage(c: Context, tinDaChe: String): KetQuaAI? =
        MayChu.gui(c, "/api/analyze/message", JSONObject().put("text", tinDaChe))?.let { phanTich(it, false) }

    /**
     * POST /api/analyze/call (multipart, trường audio): phân tích bản ghi âm của máy. Không gửi số điện thoại.
     * Máy chủ chạy ở chế độ trình diễn sẽ trả một bản chép lời MẪU khi không chép lời được (source = "fallback"):
     * với cuộc gọi thật, kết quả đó là giả nên app bỏ, coi như chưa phân tích được và chuyển sang hỏi một câu.
     */
    fun analyzeRecording(c: Context, tep: InputStream, mime: String, soLa: Boolean): KetQuaAI? =
        recordingResult(c, tep, mime, soLa)?.let { phanTich(it, true) }

    fun recordingResult(c: Context, audio: InputStream, mime: String, unknownNumber: Boolean): JSONObject? {
        val duoi = when { "mpeg" in mime || "mp3" in mime -> "mp3"; "wav" in mime -> "wav"; "ogg" in mime -> "ogg"; "amr" in mime -> "amr"; "flac" in mime -> "flac"; "aac" in mime -> "aac"; else -> "m4a" }
        val j = MayChu.guiNhieuPhan(c, "/api/analyze/call", mapOf("unknownNumber" to unknownNumber.toString()), "audio", "ghi-am.$duoi", mime, audio, 60000) ?: return null
        if (chu(j, "source") == "fallback") return null
        return j.takeUnless { it.isNull("level") }
    }

    /** POST /api/analyze/call (trường transcript): chủ máy kể lại cuộc gọi, lời kể đã che số. Không gửi số điện thoại. */
    fun analyzeTranscript(c: Context, loiKeDaChe: String): KetQuaAI? =
        MayChu.guiNhieuPhan(c, "/api/analyze/call", mapOf("transcript" to loiKeDaChe), choMs = 8000)?.let { phanTich(it, false) }

    /**
     * POST /api/alerts: báo người thân. Người thân chỉ nhận mức cảnh báo và tóm tắt đã che số.
     * Chỉ coi là đã báo khi máy chủ trả về cảnh báo có mã (id). Máy chủ chưa chống gửi trùng, nên bên gọi tự nhớ cuộc gọi nào đã báo.
     */
    fun createAlert(c: Context, muc: Muc, so: String, giay: Int, tomTatDaChe: String, thu: Boolean): Boolean {
        val than = JSONObject().put("room", ROOM).put("from", SENDER).put("level", level(muc)).put("phone", so)
            .put("callSeconds", giay).put("summary", (if (thu) "[Thử] " else "") + tomTatDaChe)
        return MayChu.gui(c, "/api/alerts", than, 4000)?.let { chu(it, "id").isNotEmpty() } == true
    }

    /** POST /api/reports: báo một tin nhắn cho cộng đồng. story là nội dung tin đã che số. Chỉ coi là đã gửi khi máy chủ trả về báo cáo có mã. */
    fun createReport(c: Context, nguoiGui: String, tin: String, tinDaChe: String): Boolean {
        val than = JSONObject().put("kind", "message").put("target", doiTuongBaoCao(nguoiGui, tin)).put("story", tinDaChe)
        return MayChu.gui(c, "/api/reports", than)?.optJSONObject("report")?.let { chu(it, "id").isNotEmpty() } == true
    }

    // ---------- Cuộc gọi video (mảng 4) ----------
    // Trang gọi video và HieuY dùng dạng dữ liệu riêng bên trong app.

    private val roleplayHeaders
        get() = if (BuildConfig.LCS_TOKEN.isEmpty()) emptyMap() else mapOf("X-LCS-Token" to BuildConfig.LCS_TOKEN)

    private const val LIVE_ID = "[0-9a-fA-F]{16}"
    internal val liveId = Regex(LIVE_ID)
    internal val livePath = Regex("/__song/($LIVE_ID)\\.(wav|lip\\.json|mieng\\.mp4)")

    internal data class LiveReply(
        val id: String, val line: String, val pcm: String, val sampleRate: Int, val seconds: Double,
        val ideas: List<String>, val wrong: Boolean, val finished: Boolean, val audio: ByteArray,
    ) {
        fun forPage(): JSONObject = JSONObject().put("chu", line).put("pcm", pcm).put("tanSo", sampleRate)
            .put("giay", seconds).put("y", JSONArray(ideas)).put("sai", wrong).put("het", finished)
    }

    internal data class LiveMouth(val lip: JSONObject, val video: ByteArray)
    internal data class LiveTurn(val reply: LiveReply, val mouth: LiveMouth?)

    internal fun parseLiveReply(field: (String) -> Any?): LiveReply? {
        val id = (field("id") as? String)?.takeIf(liveId::matches) ?: return null
        val line = (field("chu") as? String)?.takeIf { it.isNotBlank() } ?: return null
        val pcm = field("pcm") as? String ?: return null
        val sampleRate = (field("tanSo") as? Number)?.toDouble() ?: return null
        if (sampleRate !in 1.0..(Int.MAX_VALUE / 2).toDouble() || sampleRate != sampleRate.toInt().toDouble()) return null
        val seconds = (field("giay") as? Number)?.toDouble()?.takeIf { it.isFinite() && it > 0 } ?: return null
        val ideas = (field("y") as? List<*>)?.map { it as? String ?: return null } ?: return null
        val wrong = field("sai") as? Boolean ?: return null
        val finished = field("het") as? Boolean ?: return null
        val audio = try { Base64.getDecoder().decode(pcm) } catch (_: IllegalArgumentException) { return null }
        if (audio.isEmpty() || audio.size % 2 != 0) return null
        return LiveReply(id, line, pcm, sampleRate.toInt(), seconds, ideas, wrong, finished, audio)
    }

    internal fun wavHeader(byteCount: Int, sampleRate: Int): ByteArray =
        ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
            .put("RIFF".toByteArray()).putInt(36 + byteCount).put("WAVEfmt ".toByteArray())
            .putInt(16).putShort(1).putShort(1).putInt(sampleRate).putInt(sampleRate * 2)
            .putShort(2).putShort(16).put("data".toByteArray()).putInt(byteCount).array()

    /** POST /api/roleplay/live: một lượt chấm, đáp, đọc và dựng khẩu hình. */
    internal fun roleplayLive(c: Context, scene: String, history: JSONArray, scored: List<String>): LiveTurn? {
        val request = JSONObject().put("scene", scene).put("history", history).put("scored", JSONArray(scored))
        val start = SystemClock.elapsedRealtime()
        var size = 0
        val response = try {
            MayChu.gui(c, "/api/roleplay/live", request, 40000, roleplayHeaders) { size = it }
        } finally {
            Log.i("LcsTiming", "server live ms=${SystemClock.elapsedRealtime() - start} bytes=$size")
        } ?: return null
        val reply = parseLiveReply { name ->
            val value = response.opt(name)
            if (value is JSONArray) List(value.length()) { value.opt(it) } else value
        } ?: return null
        if (response.isNull("mouth")) return LiveTurn(reply, null)
        val mouth = response.optJSONObject("mouth") ?: return null
        val lip = mouth.optJSONObject("lip") ?: return null
        if (lip.optJSONObject("mieng")?.optString("tep") != "${reply.id}.mieng.mp4" ||
            lip.optJSONArray("params") == null || lip.optJSONArray("bg") == null) return null
        val video = try { Base64.getDecoder().decode(chu(mouth, "mp4")) } catch (_: IllegalArgumentException) { return null }
        return if (video.isEmpty()) null else LiveTurn(reply, LiveMouth(lip, video))
    }

    /**
     * POST /api/roleplay/intent {scene, text, lastLine, scored} → {ideas[], intent, wantsStop, offScript}: phân loại ý một lượt của người học.
     * vao là dạng của trang {canh, loi, cau_hoi, da_cham}; trả về dạng của trang {y, yDinh, xinDung, ngoai} hoặc null.
     * Lời người học đã được trang thay dãy số riêng tư trước khi tới đây. Máy chủ không viết lời cho nhân vật và không lưu lời người học.
     */
    fun roleplayIntent(c: Context, vao: JSONObject): JSONObject? {
        val than = JSONObject().put("scene", vao.optString("canh")).put("text", vao.optString("loi"))
            .put("lastLine", vao.optString("cau_hoi", "mo-dau")).put("scored", vao.optJSONArray("da_cham") ?: JSONArray())
        val j = MayChu.gui(c, "/api/roleplay/intent", than, 6000, roleplayHeaders) ?: return null
        val y = j.optJSONArray("ideas") ?: return null
        return JSONObject().put("y", y).put("yDinh", if (j.isNull("intent")) JSONObject.NULL else j.optString("intent"))
            .put("xinDung", j.optBoolean("wantsStop")).put("ngoai", j.optBoolean("offScript"))
    }

    /**
     * POST /api/roleplay/speak {text, character} → {text, audio (PCM16 một kênh, base64), sampleRate, seconds}:
     * máy chủ đọc một câu bằng giọng Gemini của nhân vật và đã lọc rẹt. Trả về dạng của trang {chu, pcm, tanSo, giay} hoặc null.
     */
    fun roleplaySpeak(c: Context, chu: String, nhanVat: String): JSONObject? {
        val j = MayChu.gui(c, "/api/roleplay/speak", JSONObject().put("text", chu).put("character", nhanVat), 25000, roleplayHeaders) ?: return null
        val pcm = chu(j, "audio").ifEmpty { return null }
        val tanSo = j.optInt("sampleRate", 24000)
        return JSONObject().put("chu", chu).put("pcm", pcm).put("tanSo", tanSo).put("giay", j.optDouble("seconds", pcm.length * 3 / 4 / 2.0 / tanSo))
    }
}
