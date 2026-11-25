package vn.doi18.lachanso

import android.content.Context
import android.os.SystemClock
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Hiểu ý một lượt của người học trong cuộc gọi video bằng mô hình ngôn ngữ, gọi thẳng từ app bằng khóa chủ máy tự nhập.
 * Cùng lời nhắc, cùng lược đồ và cùng cách lọc kết quả với máy chủ (android/hieu_y.py); lời nhắc là một tệp dùng chung.
 * Mô hình chỉ PHÂN LOẠI (ý định và các ý được chấm kèm bằng chứng nguyên văn). Câu nhân vật nói vẫn là câu thu sẵn do app chọn.
 */
object HieuY {
    /**
     * Một cảnh gọi video (prototype/canh/<mã>.json kèm nhân vật trong prototype/nhan-vat.json): ai đóng, giọng nào, chấm những ý nào, lời nhắc nào.
     * maKho = mã nhân vật trong khóa của [KhoGiong]. Cảnh của chị Lan giữ "chi-lan" và giọng "Aoede" như trước khi có nhiều cảnh,
     * nên các lượt đã lưu trên máy vẫn phát lại được.
     */
    class Canh(val ma: String, val nhanVat: String, val maKho: String, val giong: String, val loiDan: String, val nhan: List<String>,
               val boLoi: String, val tienTo: String, val laLan: Boolean, val song: JSONObject, val traLoi: JSONObject?)

    private val cacCanh = HashMap<String, Canh>()
    private fun docTep(c: Context, duong: String) = c.assets.open("web/prototype/$duong").use { it.readBytes().toString(Charsets.UTF_8) }
    /** Đường dẫn tệp ghi trong tệp cảnh chỉ được trỏ vào thư mục prototype của chính app. */
    private fun duongSach(d: String) = d.takeIf { Regex("^[A-Za-z0-9_./-]{1,80}$").matches(it) && !it.contains("..") && !it.startsWith("/") }

    /** Cảnh theo mã (mặc định lan-2). Mã lạ, tệp hỏng hoặc thiếu trường thì trả null: app không gọi AI cho cảnh đó, trang dùng câu thu sẵn.
     *  Lời dặn giọng cho câu AI đọc trực tiếp: song.loi_dan của cảnh nếu có (cảm xúc riêng của cảnh), không thì loi_dan của nhân vật. */
    @Synchronized
    fun canh(c: Context, ma: String?): Canh? {
        val id = ma?.takeIf { it.isNotBlank() } ?: "lan-2"
        if (!Regex("^[a-z0-9-]{1,24}$").matches(id)) return null
        cacCanh[id]?.let { return it }
        return try {
            val j = JSONObject(docTep(c, "canh/$id.json"))
            val nv = JSONObject(docTep(c, "nhan-vat.json")).getJSONObject(j.getString("nhan_vat"))
            val y = j.getJSONArray("y"); val song = j.getJSONObject("song")
            val nhan = (0 until y.length()).map { y.getJSONObject(it).getString("id") }
            require(nhan.isNotEmpty() && nhan.all { Regex("^[a-z0-9]{1,16}$").matches(it) })
            require(Regex("^[a-z_]{3,24}$").matches(song.getString("truong_loi")) && duongSach(song.getString("loi_nhac")) != null && duongSach(j.getString("bo_loi")) != null)
            Canh(id, j.getString("nhan_vat"), j.getString("ma_kho"), nv.getString("giong"), song.optString("loi_dan").ifBlank { nv.getString("loi_dan") }, nhan, j.getString("bo_loi"), j.optString("tien_to"),
                j.optString("bo_may") == "chi-lan", song, j.optJSONObject("tra_loi")).also { cacCanh[id] = it }
        } catch (e: Exception) { null }
    }

    private val SAI = setOf("bao-cu-nap", "bao-thu-it", "bao-rut-lien", "khuyen-lieu-khac", "loi-trai-nhau", "tuy-chi", "khong-biet")
    private var bo: JSONObject? = null
    private var loiNhac = ""

    private fun nap(c: Context): JSONObject = bo ?: JSONObject(c.assets.open("web/prototype/loi-chi-lan.json").use { it.readBytes().toString(Charsets.UTF_8) }).also {
        bo = it
        loiNhac = c.assets.open("web/prototype/hieu-y-loi-nhac.txt").use { f -> f.readBytes().toString(Charsets.UTF_8) }.trim()
    }

    private val LUOC_DO = JSONObject(
        """{"name":"hieu_y","strict":true,"schema":{"type":"object","additionalProperties":false,"required":["y_dinh","y_dung","can_hoi_lai","xin_dung","ngoai_kich_ban"],
        "properties":{"y_dinh":{"type":"string"},"y_dung":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["nhan","bang_chung"],
        "properties":{"nhan":{"type":"string","enum":["nap","dauhieu","xacminh","baocao"]},"bang_chung":{"type":"string"}}}},
        "can_hoi_lai":{"type":"boolean"},"xin_dung":{"type":"boolean"},"ngoai_kich_ban":{"type":"boolean"}}}}"""
    )

    /** Trả về {"y": [...], "yDinh": ..., "xinDung": ...} cùng dạng hàm hieu() của trang, hoặc null nếu chưa có khóa, mất mạng, quá giờ. */
    fun hoi(c: Context, canh: Canh?, loi: String, cauHoi: String, daCham: List<String>, choMs: Int = 6000): JSONObject? {
        if (canh == null || !canh.laLan) return null   // bộ ý định cho AI phân loại chỉ có ở cảnh của chị Lan; cảnh khác dùng luật trên máy
        val NHAN = canh.nhan
        val khoa = CaiDat.khoaAI(c)
        if (khoa.isBlank()) return null
        return try {
            val b = nap(c)
            val yd = b.getJSONArray("y_dinh"); val ds = StringBuilder(); val cham = HashMap<String, JSONArray>()
            for (i in 0 until yd.length()) {
                val y = yd.getJSONObject(i); val id = y.getString("id")
                cham[id] = y.optJSONArray("cham") ?: JSONArray()
                if (!id.startsWith("im-lan") && !id.startsWith("nghe-lo")) ds.append("- ").append(id).append(": ").append(y.optString("mo_ta")).append('\n')
            }
            val l = b.getJSONArray("loi"); var cau = ""; var moDau = ""
            for (i in 0 until l.length()) { val x = l.getJSONObject(i); if (x.getString("id") == cauHoi) cau = x.getString("chu"); if (x.getString("id") == "mo-dau") moDau = x.getString("chu") }
            val nguoi = "Câu chị Lan vừa hỏi: \"${cau.ifBlank { moDau }}\"\nCác ý đã chấm: ${daCham.joinToString(", ").ifBlank { "chưa có" }}\nDanh sách ý định hợp lệ:\n$ds\nLời học sinh: \"${loi.take(600)}\""
            val than = JSONObject().put("model", CaiDat.moHinhAI(c))
                .put("messages", JSONArray().put(JSONObject().put("role", "system").put("content", loiNhac)).put(JSONObject().put("role", "user").put("content", nguoi)))
                .put("response_format", JSONObject().put("type", "json_schema").put("json_schema", LUOC_DO))
            val response = post("https://api.openai.com/v1/chat/completions", than, mapOf("Authorization" to "Bearer $khoa"), choMs) ?: return null
            val j = JSONObject(response.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content"))
            val xinDung = j.optBoolean("xin_dung")
            val yDinh = j.optString("y_dinh").takeIf { it in cham.keys && !it.startsWith("im-lan") && !it.startsWith("nghe-lo") }
            val ra = JSONObject().put("xinDung", xinDung)
            if (j.optBoolean("can_hoi_lai")) return ra.put("y", JSONArray()).put("yDinh", "loi-trai-nhau")
            if (yDinh in SAI) return ra.put("y", JSONArray()).put("yDinh", yDinh)   // khuyên sai hoặc nửa vời: lượt này không được ý nào
            // nhận ý có bằng chứng thật sự nằm trong lời học sinh, và ý đi kèm ý định "khuyên đúng" mà mô hình đã chọn
            val y = LinkedHashSet<String>(); val thuong = loi.lowercase(); val yDung = j.getJSONArray("y_dung")
            for (i in 0 until yDung.length()) {
                val x = yDung.getJSONObject(i); val bc = x.optString("bang_chung").trim().lowercase().trim(' ', '.', ',', '!', '?', '"', '\'')
                if (bc.isNotBlank() && thuong.contains(bc) && x.optString("nhan") in NHAN) y += x.getString("nhan")
            }
            cham[yDinh]?.let { a -> for (i in 0 until a.length()) y += a.getString(i) }
            // ngoai: không câu thu sẵn nào hợp và lượt này không được ý nào; trang sẽ để AI viết một lượt đáp riêng
            ra.put("y", JSONArray(y.toList())).put("yDinh", yDinh ?: JSONObject.NULL).put("ngoai", j.optBoolean("ngoai_kich_ban") && y.isEmpty())
        } catch (e: Exception) {
            null   // mất mạng, quá giờ, mô hình trả sai dạng: trang tự dùng luật trên máy
        }
    }

    private fun post(url: String, than: JSONObject, dau: Map<String, String>, choMs: Int, ttsModel: String? = null): JSONObject? {
        val start = SystemClock.elapsedRealtime()
        val k = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"; connectTimeout = 3000; readTimeout = choMs; doOutput = true
            setRequestProperty("Content-Type", "application/json"); dau.forEach { (a, b) -> setRequestProperty(a, b) }
        }
        var status = -1
        try {
            k.outputStream.use { it.write(than.toString().toByteArray()) }
            status = k.responseCode
            if (status !in 200..299) return null
            return JSONObject(k.inputStream.use { it.readBytes().toString(Charsets.UTF_8) })
        } finally {
            val service = if (ttsModel == null) "OpenAI" else "Gemini TTS model=$ttsModel"
            Log.i("LcsTiming", "$service code=$status ms=${SystemClock.elapsedRealtime() - start}")
            k.disconnect()
        }
    }

    /**
     * Ca ngoài kịch bản: không câu thu sẵn nào hợp với điều người học vừa nói. AI viết một lượt đáp ngắn cho nhân vật (OpenAI),
     * rồi đọc thành tiếng bằng đúng giọng đã thu (Gemini, Aoede). Trả về {"chu", "pcm" (PCM16 base64), "tanSo"} hoặc null: thiếu khóa,
     * mất mạng, quá giờ, câu vi phạm luật lời nói, hoặc tiếng dài bất thường (dấu hiệu máy đọc lẫn lời dặn). Khi null, trang dùng câu thu sẵn.
     */
    fun traLoi(c: Context, canh: Canh?, loi: String, cauHoi: String, daCham: List<String>): JSONObject? {
        val khoa = CaiDat.khoaAI(c); val khoaGiong = CaiDat.khoaGiong(c)
        val tl = canh?.traLoi ?: return null
        if (khoa.isBlank() || khoaGiong.isBlank()) return null
        return try {
            // câu nhân vật vừa nói: tìm trong bộ lời của cảnh, câu riêng của cảnh (có tiền tố) được ưu tiên hơn câu dùng chung
            val l = JSONObject(docTep(c, duongSach(canh.boLoi)!!)).getJSONArray("loi"); var cau = ""; var chung = ""
            for (i in 0 until l.length()) { val x = l.getJSONObject(i); if (x.getString("id") == canh.tienTo + cauHoi) cau = x.getString("chu"); if (x.getString("id") == cauHoi) chung = x.getString("chu") }
            cau = cau.ifBlank { chung }
            val heThong = docTep(c, duongSach(tl.getString("loi_nhac"))!!).trim()
            val nguoi = "${tl.getString("cau_nv")}: \"$cau\"\n${tl.getString("cau_da")}: ${daCham.joinToString(", ").ifBlank { "chưa có" }}\n${tl.getString("cau_nh")}: \"${loi.take(400)}\""
            val r = post("https://api.openai.com/v1/chat/completions", JSONObject().put("model", CaiDat.moHinhAI(c))
                .put("messages", JSONArray().put(JSONObject().put("role", "system").put("content", heThong)).put(JSONObject().put("role", "user").put("content", nguoi))),
                mapOf("Authorization" to "Bearer $khoa"), 7000) ?: return null
            val chu = r.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content").trim().trim('"', '“', '”')
            // luật lời nói: ngắn, không số, không đường dẫn, không dấu lạ. Vi phạm thì bỏ, dùng câu thu sẵn.
            val soTieng = chu.split(Regex("\\s+")).size
            if (soTieng !in 2..32 || Regex("[0-9:;()\\[\\]/@]|https?|www").containsMatchIn(chu)) return null
            docGemini(c, canh, chu)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Lọc tiếng "rẹt" cho tiếng tạo tại chỗ (PCM16 một kênh, base64): bỏ lặng và tiếng nổ ở hai đầu, sửa mẫu nhảy vọt (click),
     * lọc bỏ ù dưới 70 Hz, hạ 3 dB chống vỡ, làm mềm hai đầu. Câu thu sẵn thì đã lọc kỹ hơn bằng tools/loc-giong.py.
     */
    fun locRet(b64: String, tanSo: Int): String {
        val raw = android.util.Base64.decode(b64, android.util.Base64.DEFAULT); val n = raw.size / 2
        if (n < tanSo / 5) return b64
        val x = FloatArray(n) { ((raw[2 * it].toInt() and 255) or (raw[2 * it + 1].toInt() shl 8)).toShort() / 32768f }
        // Cụm nhiễu ở đuôi: sau khi lời dứt vài trăm mili giây, Gemini hay phát thêm một hai cụm nhiễu rất to (nghe "rẹt rẹt" cuối mỗi câu).
        // Đo trên 7 câu: câu nào cũng có, 40 ms rất to, lặng 30 ms, 90 ms rất to. Đi lùi từ cuối: gặp quãng lặng từ 100 ms mà phần sau nó
        // ngắn (không quá 250 ms có tiếng) và có khung to hơn −9 dB → xóa phần đó.
        run {
            val kh = tanSo / 100; val soKh = n / kh
            if (soKh >= 30) {
                val db = FloatArray(soKh) { k -> var s = 0.0; for (q in k * kh until (k + 1) * kh) s += x[q] * x[q]; (10 * Math.log10(s / kh + 1e-12)).toFloat() }
                var k = soKh - 1
                while (k > maxOf(30, soKh - 150)) {
                    if (db[k] < -50f) {
                        var dau = k; while (dau > 0 && db[dau - 1] < -50f) dau--
                        val sau = (k + 1 until soKh).filter { db[it] > -40f }
                        if (k - dau + 1 >= 10 && sau.isNotEmpty() && sau.size <= 25 && sau.maxOf { db[it] } > -9f) { for (q in minOf(n, (dau + 6) * kh) until n) x[q] = 0f; break }
                        k = dau - 1
                    } else k--
                }
            }
        }
        // click: mẫu nhảy vọt so với mức biến thiên quanh nó (độ dốc lớn gấp nhiều lần trung bình 4 ms xung quanh) thì nối thẳng qua 5 mẫu
        run {
            val d = FloatArray(n); for (k in 1 until n) d[k] = kotlin.math.abs(x[k] - x[k - 1])
            val cua = tanSo / 250; var tong = 0.0; for (k in 0 until minOf(n, cua)) tong += d[k]
            var k = 2
            while (k < n - 6) {
                if (k >= cua) tong += d[k] - d[k - cua]
                val tb = (tong / cua).toFloat()
                if (d[k] > 0.12f && d[k] > 9 * tb) { val a0 = x[k - 2]; val b0 = x[k + 4]; for (q in 0..5) x[k - 2 + q] = a0 + (b0 - a0) * q / 5f; k += 5 } else k++
            }
        }
        // lọc thông cao một cực ở 70 Hz
        val a = 1f / (1f + (2 * Math.PI * 70 / tanSo).toFloat()); var yTruoc = 0f; var xTruoc = 0f
        for (k in 0 until n) { val y = a * (yTruoc + x[k] - xTruoc); xTruoc = x[k]; yTruoc = y; x[k] = y * 0.708f }
        // cắt lặng hai đầu theo khung 10 ms (ngưỡng −45 dB), chừa 40 ms
        val w = tanSo / 100; fun to(k: Int): Boolean { var s = 0.0; for (q in k until minOf(n, k + w)) s += x[q] * x[q]; return Math.sqrt(s / w) > 0.0056 }
        var dau = 0; while (dau + w < n && !to(dau)) dau += w
        var cuoi = n - w; while (cuoi > dau && !to(cuoi)) cuoi -= w
        dau = maxOf(0, dau - 4 * w); cuoi = minOf(n, cuoi + 5 * w)
        val m = cuoi - dau; if (m < tanSo / 10) return b64
        // quãng nghỉ giữa các tiếng: hạ hẳn nhiễu nền (dưới −48 dB thì kéo dần về 0), có làm mượt để không nghe tiếng đóng mở
        run {
            val he = FloatArray(n) { 1f }; var kTruoc = 1f
            var k = dau
            while (k < cuoi) {
                var s2 = 0.0; val het = minOf(cuoi, k + w); for (q in k until het) s2 += x[q] * x[q]
                val rms = Math.sqrt(s2 / w).toFloat(); val dich = if (rms < 0.004f) 0.08f else if (rms < 0.008f) 0.5f else 1f
                for (q in k until het) { kTruoc += (dich - kTruoc) * 0.02f; he[q] = kTruoc }
                k = het
            }
            for (q in dau until cuoi) x[q] *= he[q]
        }
        val vao = tanSo * 15 / 1000; val ra = tanSo * 40 / 1000
        val o = ByteArray(m * 2)
        for (k in 0 until m) {
            var v = x[dau + k]
            if (k < vao) v *= k.toFloat() / vao
            if (k > m - ra) v *= (m - k).toFloat() / ra
            val sh = (v.coerceIn(-1f, 1f) * 32767).toInt(); o[2 * k] = sh.toByte(); o[2 * k + 1] = (sh shr 8).toByte()
        }
        return android.util.Base64.encodeToString(o, android.util.Base64.NO_WRAP)
    }

    /** Đọc một câu bằng giọng Gemini của nhân vật trong cảnh (trùng giọng bộ câu thu sẵn của nhân vật đó). Trả về {"chu","pcm","tanSo","giay"} hoặc null. */
    /** Ô "Khóa giọng đọc" nhận nhiều khóa Gemini, cách nhau dấu phẩy, chấm phẩy hoặc xuống dòng. */
    fun dsKhoaGiong(c: Context): List<String> = CaiDat.khoaGiong(c).split(Regex("[,;\\s]+")).map { it.trim() }.filter { it.isNotEmpty() }.distinct()
    @Volatile private var khoaTot = 0   // vị trí khóa vừa đọc được; lần sau thử khóa đó trước

    /**
     * Gọi Gemini đọc giọng, tự chuyển sang khóa kế khi một khóa bị từ chối (hết hạn mức, khóa hỏng: máy chủ trả mã lỗi).
     * Lỗi mạng hay quá giờ thì dừng luôn, vì đổi khóa cũng không đỡ, chỉ làm người học chờ lâu hơn.
     */
    private fun goiGiong(c: Context, than: JSONObject): JSONObject? {
        val ds = dsKhoaGiong(c); if (ds.isEmpty()) return null
        for (m in listOf("gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview")) for (i in ds.indices) {
            val k = (khoaTot + i) % ds.size
            val kq = try { post("https://generativelanguage.googleapis.com/v1beta/models/$m:generateContent", than, mapOf("x-goog-api-key" to ds[k]), 12000, ttsModel = m) } catch (_: Exception) { return null }
            if (kq != null) { khoaTot = k; return kq }
        }
        return null
    }

    fun docGemini(c: Context, canh: Canh, chu: String): JSONObject? {
        if (chu.isBlank()) return null
        val GIONG = canh.giong
        KhoGiong.layTieng(c, GIONG, chu)?.let { return it }   // câu này đã đọc rồi: phát lại bản đã lưu, không gọi API
        if (dsKhoaGiong(c).isEmpty()) return null
        return try {
            val soTieng = chu.split(Regex("\\s+")).size
            val loiDan = "# DIRECTOR'S NOTES (không đọc phần này)\n${canh.loiDan}\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n$chu"
            val than = JSONObject().put("contents", JSONArray().put(JSONObject().put("parts", JSONArray().put(JSONObject().put("text", loiDan)))))
                .put("generationConfig", JSONObject().put("responseModalities", JSONArray().put("AUDIO"))
                    .put("speechConfig", JSONObject().put("voiceConfig", JSONObject().put("prebuiltVoiceConfig", JSONObject().put("voiceName", GIONG)))))
            // Gemini đôi khi đọc cả câu HAI LẦN (hoặc đọc lẫn lời dặn): tiếng dài bất thường so với số tiếng thì đọc lại một lần.
            var tot: Pair<String, Int>? = null
            for (lan in 1..2) {
                val d = (goiGiong(c, than) ?: return null).getJSONArray("candidates").getJSONObject(0).getJSONObject("content").getJSONArray("parts").getJSONObject(0).getJSONObject("inlineData")
                val pcm = d.getString("data"); val tanSo = Regex("rate=(\\d+)").find(d.optString("mimeType"))?.groupValues?.get(1)?.toInt() ?: 24000
                val sach = locRet(pcm, tanSo)
                luuTieng(c, chu, pcm, sach)
                // Đo SAU khi lọc (đã cắt lặng và cụm nhiễu đuôi). Đọc một lần: khoảng 0,25–0,3 giây mỗi tiếng; đọc lặp: 0,5–0,63 (cùng ngưỡng với server/lcs/giong.py)
                val giaySach = sach.length * 3 / 4 / 2.0 / tanSo
                if (giaySach >= 0.2 && giaySach <= soTieng * 0.42 + 1.2) { tot = sach to tanSo; break }
                Log.i("LcsTiming", "giọng dài bất thường ${"%.1f".format(giaySach)} s cho $soTieng tiếng, đọc lại (lần $lan)")
            }
            val (sach, tanSo) = tot ?: return null
            KhoGiong.luuTieng(c, GIONG, chu, sach, tanSo)
            JSONObject().put("chu", chu).put("pcm", sach).put("tanSo", tanSo).put("giay", sach.length * 3 / 4 / 2.0 / tanSo)
        } catch (e: Exception) { null }
    }

    /** Bản debug: giữ lại 12 câu vừa phát (bản thô và bản đã lọc) trong vùng riêng của app, để kiểm đúng tiếng người dùng đã nghe. */
    private fun luuTieng(c: Context, chu: String, tho: String, sach: String) {
        if (!BuildConfig.DEBUG) return
        try {
            val thuMuc = java.io.File(c.filesDir, "tieng-da-phat").apply { mkdirs() }
            val ten = System.currentTimeMillis().toString() + "-" + chu.split(Regex("\\s+")).take(3).joinToString("-").replace(Regex("[^\\p{L}\\p{Nd}-]"), "")
            java.io.File(thuMuc, "$ten.tho.pcm").writeBytes(android.util.Base64.decode(tho, android.util.Base64.DEFAULT))
            java.io.File(thuMuc, "$ten.loc.pcm").writeBytes(android.util.Base64.decode(sach, android.util.Base64.DEFAULT))
            thuMuc.listFiles()?.sortedBy { it.name }?.dropLast(24)?.forEach { it.delete() }
        } catch (_: Exception) {
        }
    }

    /**
     * Đọc một câu cho cuộc gọi trực tiếp, luôn bằng giọng Gemini của nhân vật trong cảnh (chị Lan: Aoede, anh Minh: Achird, ông Tư: Algenib; xem prototype/nhan-vat.json).
     * Có máy chủ của đội thì nhờ máy chủ đọc: ở đó tiếng được lọc rẹt bằng đúng chuỗi ffmpeg của các câu thu sẵn.
     * Không có máy chủ thì app tự gọi Gemini và lọc nhẹ trên máy (locRet). Giọng OpenAI đã bỏ: người dùng nghe thấy máy móc (25/11/2026).
     */
    fun doc(c: Context, canh: Canh, chu: String): JSONObject? {
        val GIONG = canh.giong
        KhoGiong.layTieng(c, GIONG, chu)?.let { return it }
        if (CaiDat.mayChu(c).isNotBlank()) {
            // Mọi tiếng Gemini phải qua lớp lọc trước khi phát. Máy chủ đọc hỏng thì thử lại một lần; vẫn hỏng thì KHÔNG phát bản chỉ lọc nhẹ:
            // trả null để trang dùng câu thu sẵn hoặc nhắc người học nói lại.
            repeat(2) { try { Api.roleplaySpeak(c, chu, canh.nhanVat)?.let { KhoGiong.luuTieng(c, GIONG, chu, it.getString("pcm"), it.optInt("tanSo", 24000)); return it } } catch (_: Exception) {} }
            return null
        }
        return docGemini(c, canh, chu)
    }

    /** Lược đồ trả lời của một lượt trực tiếp: nhãn các ý và tên trường lời nhân vật lấy theo cảnh (cảnh chị Lan ra đúng lược đồ cũ). */
    private fun luocDoSong(canh: Canh): JSONObject {
        val nhan = canh.nhan.joinToString(",") { "\"$it\"" }; val truong = canh.song.getString("truong_loi")
        return JSONObject(
            """{"name":"luot_song","strict":true,"schema":{"type":"object","additionalProperties":false,"required":["y_dung","khuyen_sai","$truong","ket_thuc"],
            "properties":{"y_dung":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["nhan","bang_chung"],
            "properties":{"nhan":{"type":"string","enum":[$nhan]},"bang_chung":{"type":"string"}}}},
            "khuyen_sai":{"type":"boolean"},"$truong":{"type":"string"},"ket_thuc":{"type":"boolean"}}}}"""
        )
    }

    /**
     * Chế độ "AI nói chuyện trực tiếp": một lượt gồm chấm lời người học và viết lời chị Lan (một lần gọi mô hình), rồi đọc bằng giọng Gemini.
     * lichSu = [{"ai": "chi-lan" | "em", "chu": …}], lượt cuối là của người học. Trả về {"chu","pcm","tanSo","giay","y":[…],"sai","het"} hoặc null.
     */
    fun luotSong(c: Context, canh: Canh?, lichSu: JSONArray, daCham: List<String>): JSONObject? {
        if (canh == null || lichSu.length() == 0) return null
        if (CaiDat.mayChu(c).isNotBlank()) {
            val serverReply = try { serverLive(c, canh, lichSu, daCham) } catch (_: Exception) { null }
            if (serverReply != null) return serverReply
        }
        val NHAN_VAT = canh.maKho
        // Đúng đoạn trò chuyện này đã từng chạy: phát lại lượt đã lưu (không tốn lượt API, tiện quay video).
        KhoGiong.layLuot(c, KhoGiong.khoaChat(NHAN_VAT, lichSu, daCham))?.let { luu -> phatLuu(c, canh, luu)?.let { return it } }
        val moi = try { luotMoi(c, canh, lichSu, daCham) } catch (_: Exception) { null }
        if (moi != null) return moi
        // Gọi AI hỏng (hết lượt, mất mạng, quá giờ): tìm lượt đã lưu có cùng câu cuối của người học và cùng các ý đã chấm.
        return KhoGiong.layLuot(c, KhoGiong.khoaLong(NHAN_VAT, lichSu, daCham))?.let { phatLuu(c, canh, it) }
    }

    private fun serverLive(c: Context, scene: Canh, history: JSONArray, scored: List<String>): JSONObject? {
        val maskedHistory = JSONArray()
        for (index in 0 until history.length()) {
            val turn = history.getJSONObject(index)
            val speaker = turn.getString("ai")
            val line = turn.getString("chu")
            maskedHistory.put(JSONObject().put("ai", speaker)
                .put("chu", if (speaker == scene.song.getString("ai_nh")) LocTinNhan.che(line) else line))
        }
        val (reply, mouth) = Api.roleplayLive(c, scene.ma, maskedHistory, scored) ?: return null
        val directory = File(c.cacheDir, "song").apply { mkdirs() }
        fun writeFile(extension: String, write: (java.io.OutputStream) -> Unit) {
            val temp = File.createTempFile(reply.id, ".tmp", directory)
            try {
                temp.outputStream().use(write)
                check(temp.renameTo(File(directory, "${reply.id}.$extension")))
            } finally {
                temp.delete()
            }
        }
        writeFile("wav") { stream ->
            stream.write(Api.wavHeader(reply.audio.size, reply.sampleRate))
            stream.write(reply.audio)
        }
        if (mouth != null) {
            writeFile("mieng.mp4") { it.write(mouth.video) }
            writeFile("lip.json") { it.write(mouth.lip.toString().toByteArray()) }
        }
        KhoGiong.luuTieng(c, scene.giong, reply.line, reply.pcm, reply.sampleRate)
        KhoGiong.luuLuot(c, scene.maKho, history, scored, reply.line, reply.ideas, reply.wrong, reply.finished)
        return reply.forPage().apply { if (mouth != null) put("song", reply.id) }
    }

    private fun phatLuu(c: Context, canh: Canh, luu: JSONObject): JSONObject? =
        docGemini(c, canh, luu.getString("chu"))?.put("y", luu.optJSONArray("y") ?: JSONArray())?.put("sai", luu.optBoolean("sai"))?.put("het", luu.optBoolean("het"))?.put("tuKho", true)

    private fun luotMoi(c: Context, canh: Canh, lichSu: JSONArray, daCham: List<String>): JSONObject? {
        val khoa = CaiDat.khoaAI(c); if (khoa.isBlank()) return null
        val sg = canh.song; val NHAN = canh.nhan; val NHAN_VAT = canh.maKho
        val heThong = docTep(c, duongSach(sg.getString("loi_nhac"))!!).trim()
        val sb = StringBuilder("Các ý đã chấm: ${daCham.joinToString(", ").ifBlank { "chưa có" }}\nCuộc trò chuyện tới giờ:\n")
        for (i in 0 until lichSu.length()) { val x = lichSu.getJSONObject(i); sb.append(if (x.optString("ai") == sg.getString("ai_nh")) sg.getString("ten_nh") + ": " else sg.getString("ten_nv") + ": ").append(LocTinNhan.che(x.optString("chu")).take(500)).append('\n') }   // dãy từ 4 chữ số (mã PIN, số tài khoản) được che trước khi rời máy
        val cuoi = lichSu.getJSONObject(lichSu.length() - 1).optString("chu")
        val r = post("https://api.openai.com/v1/chat/completions", JSONObject().put("model", CaiDat.moHinhAI(c))
            .put("messages", JSONArray().put(JSONObject().put("role", "system").put("content", heThong)).put(JSONObject().put("role", "user").put("content", sb.toString())))
            .put("response_format", JSONObject().put("type", "json_schema").put("json_schema", luocDoSong(canh))), mapOf("Authorization" to "Bearer $khoa"), 9000) ?: return null
        val j = JSONObject(r.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content"))
        val chu = j.getString(sg.getString("truong_loi")).trim().trim('"', '“', '”')
        if (chu.split(Regex("\\s+")).size !in 2..45 || Regex("[0-9;()\\[\\]/@]|https?|www").containsMatchIn(chu)) return null
        val sai = j.optBoolean("khuyen_sai"); val y = LinkedHashSet<String>(); val thuong = cuoi.lowercase(); val yd = j.getJSONArray("y_dung")
        var biLoai = false   // mô hình đưa ra một ý mới mà app không nhận (bằng chứng không có trong lời, hoặc chỉ là một chữ rời)
        val caCau = thuong.trim().trim(' ', '.', ',', '!', '?', '"', '\'')
        if (!sai) for (i in 0 until yd.length()) {   // chỉ nhận ý có bằng chứng nguyên văn trong lượt mới nhất của người học
            val x = yd.getJSONObject(i); val bc = x.optString("bang_chung").trim().lowercase().trim(' ', '.', ',', '!', '?', '"', '\'')
            val nhan = x.optString("nhan"); if (nhan !in NHAN || nhan in daCham) continue
            // bằng chứng phải dài từ bốn ký tự ("giục", "đừng"), trừ khi nó là cả câu trả lời: một chữ rời như "mẹ", "ừ" có trong mọi câu, không chứng minh được gì
            if (bc.isNotBlank() && thuong.contains(bc) && (bc.length >= 4 || bc == caCau)) y += nhan else biLoai = true
        }
        // Mô hình báo kết thúc vì tưởng đã đủ ý, nhưng có ý bị app loại và thực tế chưa đủ: không kết thúc, để người học nói tiếp.
        val het = j.optBoolean("ket_thuc") && !(biLoai && (daCham + y).toSet().size < NHAN.size)
        val tieng = docGemini(c, canh, chu) ?: return null
        KhoGiong.luuLuot(c, NHAN_VAT, lichSu, daCham, chu, y.toList(), sai, het)
        return tieng.put("y", JSONArray(y.toList())).put("sai", sai).put("het", het)
    }
}
