package vn.doi18.lachanso

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.content.Intent
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.nio.FloatBuffer

/**
 * Mô hình khẩu hình của một nhân vật LiteAvatar, chạy bằng mã gốc của máy (onnxruntime, XNNPACK).
 * Trên máy thử (Dimensity 1200) mỗi khung mất khoảng 75 ms, so với 136 ms khi chạy WASM 4 luồng trong trình duyệt.
 * Vào: khung tham chiếu k (dáng đầu của nhân vật ở khung video đó) và 32 thông số miệng. Ra: ảnh miệng 384×384, byte CHW.
 */
class MayMieng(c: Context, id: String, kieu: String = "x2") {
    private val goc = "web/vendor/vlearn-avatar/stage/_shared/voice/models/lite/$id"
    private val env = OrtEnvironment.getEnvironment()
    private val viTri: LongArray
    private val refs: ByteArray = c.assets.open("$goc/refs.bin").use { it.readBytes() }
    private val phien: OrtSession
    val cach: String
    /** Ảnh tham chiếu đã giải mã, dạng byte CHW (442 KB mỗi ảnh, 150 ảnh). Giải mã sẵn ở nền để lúc nói không phải chờ. */
    private val nho = arrayOfNulls<ByteArray>(512)
    private val vao = FloatArray(3 * N * N)
    private val raF = FloatArray(3 * N * N)
    private var tong = 0L
    private var dem = 0
    @Volatile private var dong = false

    init {
        val meta = JSONObject(c.assets.open("$goc/meta.json").use { it.readBytes().toString(Charsets.UTF_8) })
        val o = meta.getJSONArray("ref_offsets")
        viTri = LongArray(o.length()) { o.getLong(it) }
        val model = c.assets.open("$goc/lite.onnx").use { it.readBytes() }
        // kieu: "x<N>" = XNNPACK N luồng, "c<N>" = CPU N luồng. Mặc định 2 luồng: khi cuộc gọi đang chạy, 4 luồng chỉ nhanh hơn không đáng kể
        // (140 so với 160 ms mỗi hình trên máy thử) nhưng chiếm hết nhân mạnh làm tiếng bị hụt, nghe rẹt rẹt.
        val n = kieu.drop(1).toIntOrNull()?.coerceIn(1, 8) ?: 4
        var ten = if (kieu.startsWith("c")) "CPU $n luồng" else "XNNPACK $n luồng"
        phien = try {
            if (kieu.startsWith("c")) env.createSession(model, OrtSession.SessionOptions().apply { setIntraOpNumThreads(n) })
            else env.createSession(model, OrtSession.SessionOptions().apply { addXnnpack(mapOf("intra_op_num_threads" to "$n")); setIntraOpNumThreads(1) })
        } catch (e: Throwable) {
            ten = "CPU 2 luồng"
            env.createSession(model, OrtSession.SessionOptions().apply { setIntraOpNumThreads(2) })
        }
        cach = ten
        Thread({ for (k in 0 until viTri.size - 1) { if (dong) break; try { thamChieu(k) } catch (_: Throwable) {} } }, "giai-ma-tham-chieu").apply { priority = Thread.MIN_PRIORITY }.start()
    }

    private fun thamChieu(k: Int): ByteArray {
        nho[k]?.let { return it }
        val a = viTri[k].toInt()
        val anh = BitmapFactory.decodeByteArray(refs, a, viTri[k + 1].toInt() - a)
        val nhoLai = if (anh.width == N && anh.height == N) anh else Bitmap.createScaledBitmap(anh, N, N, true)
        val px = IntArray(N * N)
        nhoLai.getPixels(px, 0, N, 0, 0, N, N)
        val q = N * N
        val b = ByteArray(3 * q)
        for (i in 0 until q) { val p = px[i]; b[i] = (p shr 16).toByte(); b[q + i] = (p shr 8).toByte(); b[2 * q + i] = p.toByte() }
        nho[k] = b
        return b
    }

    @Synchronized
    fun chay(k: Int, thongSo: FloatArray): ByteArray {
        check(!dong) { "mô hình miệng đã đóng" }
        val t = System.nanoTime()
        val b = thamChieu(k)
        for (i in vao.indices) vao[i] = (b[i].toInt() and 255) / 127.5f - 1
        OnnxTensor.createTensor(env, FloatBuffer.wrap(vao), longArrayOf(1, 3, N.toLong(), N.toLong())).use { ref ->
            OnnxTensor.createTensor(env, FloatBuffer.wrap(thongSo), longArrayOf(1, 32)).use { ts ->
                phien.run(mapOf("ref" to ref, "params" to ts)).use { kq ->
                    (kq[0] as OnnxTensor).floatBuffer.get(raF)
                    val ra = ByteArray(raF.size)
                    for (i in ra.indices) { val v = raF[i] * 127.5f + 127.5f; ra[i] = (if (v < 0f) 0 else if (v > 255f) 255 else v.toInt()).toByte() }
                    tong += System.nanoTime() - t
                    if (++dem % 40 == 0) { Log.i("GoiVideo", "mô hình miệng ($cach): trung bình %.0f ms mỗi hình".format(tong / 1e6 / 40)); tong = 0 }
                    return ra
                }
            }
        }
    }

    /** Nhả mô hình và ảnh tham chiếu khi đổi sang nhân vật khác hoặc đóng màn. Yêu cầu tính miệng tới sau đó sẽ báo lỗi, trang bỏ qua khung ấy. */
    @Synchronized
    fun dong() { dong = true; try { phien.close() } catch (_: Throwable) {}; nho.fill(null) }

    companion object { const val N = 384 }
}

/**
 * H3. Gọi video với nhân vật do AI đóng (chị Lan, anh Minh, ông Tư). Hình và lời do trang prototype/video-call.html vẽ trong WebView;
 * riêng việc nặng nhất, tính hình miệng cho từng khung, do [MayMieng] làm bằng mã gốc để miệng chạy kịp tiếng.
 *
 * Cùng màn này cũng mở trang bài học (prototype/hoc.html): trang bài học dẫn sang cuộc gọi bằng đường dẫn thường
 * (video-call.html?canh=…&ve=…) rồi cuộc gọi dẫn về. Trang mở đầu lấy từ extra "trang" của Intent, chỉ nhận hai trang đó của chính app.
 * Trang biết mình đang chạy trong app qua cầu nối LaChan.thamSo(), không cần tham số trên địa chỉ.
 */
class GoiVideoActivity : Activity() {
    private lateinit var web: WebView
    private val may = HashMap<String, MayMieng>()
    private var nghe: SpeechRecognizer? = null

    /**
     * Cầu nối cho trang: mở micro nghe người học nói một lượt. Kết quả trả về trang qua window.__nghe(loại, chữ):
     * "tam" (chữ đang nghe dở), "ket-qua" (câu cuối), "im-lang" (không ai nói), "loi" (máy không nghe được).
     * Lời người học chỉ nằm trong trang đang mở, app không lưu.
     */
    inner class Cau {
        @JavascriptInterface fun coMicro(): Boolean =
            Quyen.co(this@GoiVideoActivity, android.Manifest.permission.RECORD_AUDIO) && SpeechRecognizer.isRecognitionAvailable(this@GoiVideoActivity)
        /** Nhờ AI hiểu ý một lượt của người học (máy chủ của đội, hoặc khóa chủ máy tự nhập). Trả về trang qua window.__y(mã, kết quả hoặc null); không có máy chủ thì null ngay. */
        @JavascriptInterface fun hieuY(ma: String, than: String) {
            Luong.nen {
                // Có máy chủ của đội thì hỏi máy chủ; không thì app tự gọi AI bằng khóa chủ máy đã nhập; không có cả hai thì trang dùng luật trên máy.
                val kq = try {
                    val j = JSONObject(than); val c = this@GoiVideoActivity; val canh = HieuY.canh(c, j.optString("canh"))
                    if (canh == null || !canh.laLan) null   // chỉ cảnh của chị Lan có bộ ý định cho AI phân loại (ở máy chủ cũng vậy)
                    else (if (CaiDat.mayChu(c).isBlank()) null else Api.roleplayIntent(c, j))
                        ?: HieuY.hoi(c, canh, j.optString("loi"), j.optString("cau_hoi", "mo-dau"), j.optJSONArray("da_cham")?.let { a -> (0 until a.length()).map { a.optString(it) } } ?: emptyList())
                } catch (_: Exception) { null }
                runOnUiThread {
                    if (!isFinishing && !isDestroyed) web.evaluateJavascript("window.__y && window.__y(${JSONObject.quote(ma)}, ${kq?.toString() ?: "null"})", null)
                }
            }
        }
        /** Ca ngoài kịch bản: nhờ AI viết và đọc một lượt đáp. Trả về trang qua window.__tl(mã, {chu, pcm, tanSo} hoặc null). */
        @JavascriptInterface fun traLoi(ma: String, than: String) {
            Luong.nen {
                val kq = try {
                    val j = JSONObject(than)
                    val tl = HieuY.traLoi(this@GoiVideoActivity, HieuY.canh(this@GoiVideoActivity, j.optString("canh")), j.optString("loi"), j.optString("cau_hoi", "mo-dau"), j.optJSONArray("da_cham")?.let { a -> (0 until a.length()).map { a.optString(it) } } ?: emptyList())
                    ghiCaLa(j, tl)
                    tl
                } catch (_: Exception) { null }
                runOnUiThread {
                    if (!isFinishing && !isDestroyed) web.evaluateJavascript("window.__tl && window.__tl(${JSONObject.quote(ma)}, ${kq?.toString() ?: "null"})", null)
                }
            }
        }
        /** Chế độ AI nói chuyện trực tiếp: một lượt chấm, đáp và đọc. Trả về qua window.__ls(mã, kết quả hoặc null). */
        @JavascriptInterface fun luotSong(ma: String, than: String) {
            Luong.nen {
                val kq = try { val j = JSONObject(than); HieuY.luotSong(this@GoiVideoActivity, HieuY.canh(this@GoiVideoActivity, j.optString("canh")), j.getJSONArray("lich_su"), j.optJSONArray("da_cham")?.let { a -> (0 until a.length()).map { a.optString(it) } } ?: emptyList()) } catch (_: Exception) { null }
                runOnUiThread { if (!isFinishing && !isDestroyed) web.evaluateJavascript("window.__ls && window.__ls(${JSONObject.quote(ma)}, ${kq?.toString() ?: "null"})", null) }
            }
        }
        /** Đọc một câu bằng giọng Gemini của nhân vật trong cảnh. Trả về qua window.__doc(mã, kết quả hoặc null). */
        @JavascriptInterface fun doc(ma: String, canh: String, chu: String) {
            Luong.nen {
                val kq = try { HieuY.canh(this@GoiVideoActivity, canh)?.let { HieuY.doc(this@GoiVideoActivity, it, chu.take(400)) } } catch (_: Exception) { null }
                runOnUiThread { if (!isFinishing && !isDestroyed) web.evaluateJavascript("window.__doc && window.__doc(${JSONObject.quote(ma)}, ${kq?.toString() ?: "null"})", null) }
            }
        }
        @JavascriptInterface fun coTraLoi(): Boolean = canPlayLive()
        /**
         * Tham số của app cho trang, dạng JSON: goc = đang chạy trong app (mô hình miệng chạy bằng mã gốc), song = bật chế độ AI nói chuyện trực tiếp
         * (công tắc ở màn chính và có máy chủ hoặc đủ khóa trên máy), auto = chạy cuộc gọi mẫu.
         */
        @JavascriptInterface fun thamSo(): String = JSONObject().put("goc", true)
            .put("song", CaiDat.goiSong(this@GoiVideoActivity) && canPlayLive())
            .put("auto", intent.getBooleanExtra("auto", false)).toString()
        @JavascriptInterface fun nghe() { runOnUiThread { this@GoiVideoActivity.batDauNghe() } }
        @JavascriptInterface fun dungNghe() { runOnUiThread { this@GoiVideoActivity.dungNghe() } }
        /** Nút ✕ ở thư viện bài học: đóng màn bài học, về màn chính của app. */
        @JavascriptInterface fun dong() { runOnUiThread { this@GoiVideoActivity.dungNghe(); finish() } }
    }

    private fun canPlayLive(): Boolean = CaiDat.mayChu(this).isNotBlank() ||
        (CaiDat.khoaAI(this).isNotBlank() && CaiDat.khoaGiong(this).isNotBlank())

    /**
     * Sổ các ca ngoài kịch bản: người học nói điều mà bộ câu thu sẵn không có câu đáp hợp. Đội đọc sổ này để chọn ca đáng đưa vào
     * bộ lời ở lượt thu sau (kéo về máy tính bằng tools/keo-ca-la.sh). Mỗi dòng: lúc nào, chị vừa hỏi câu gì, người học nói gì
     * (đã che mọi dãy từ 4 chữ số), AI đã đáp gì (trống nếu không tạo được). Tệp nằm trong vùng riêng của app, giữ tối đa 500 dòng.
     */
    @Synchronized
    private fun ghiCaLa(hoi: JSONObject, tl: JSONObject?) {
        try {
            val f = java.io.File(filesDir, "ca-ngoai-kich-ban.jsonl")
            val dong = JSONObject().put("luc", System.currentTimeMillis()).put("canh", hoi.optString("canh").take(24)).put("cau_hoi", hoi.optString("cau_hoi"))
                .put("da_cham", hoi.optJSONArray("da_cham") ?: org.json.JSONArray())
                .put("nguoi_hoc", LocTinNhan.che(hoi.optString("loi")).take(400))
                .put("chi_lan", tl?.optString("chu") ?: "").put("giay", tl?.optDouble("giay") ?: 0.0)
            val cu = if (f.exists()) f.readLines().takeLast(499) else emptyList()
            f.writeText((cu + dong.toString()).joinToString("\n") + "\n")
        } catch (_: Exception) {
        }
    }

    private fun tra(loai: String, chu: String = "") {
        if (isFinishing || isDestroyed) return
        web.evaluateJavascript("window.__nghe && window.__nghe(${JSONObject.quote(loai)}, ${JSONObject.quote(chu)})", null)
    }

    private fun dungNghe() {
        try { nghe?.destroy() } catch (_: Exception) {}
        nghe = null
    }

    private fun batDauNghe() {
        dungNghe()
        try {
            nghe = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onResults(r: Bundle?) = tra("ket-qua", r?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty())
                    override fun onPartialResults(p: Bundle?) { p?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let { if (it.isNotBlank()) tra("tam", it) } }
                    override fun onError(ma: Int) = tra(if (ma == SpeechRecognizer.ERROR_NO_MATCH || ma == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) "im-lang" else "loi")
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
                )
            }
        } catch (e: Exception) {
            tra("loi")
        }
    }

    private fun mayCua(id: String) = synchronized(may) {
        // Đổi nhân vật trong cùng màn (bài học dẫn qua nhiều cuộc gọi): bỏ mô hình của nhân vật trước, mỗi mô hình giữ khoảng 60 MB ảnh tham chiếu.
        if (!may.containsKey(id)) { may.values.forEach { it.dong() }; may.clear() }
        may.getOrPut(id) { MayMieng(applicationContext, id, intent.getStringExtra("kieu") ?: "x2").also { NhatKy.ghi(this, "Gọi video: mô hình miệng $id chạy bằng ${it.cach}") } }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        web = WebView(this)
        setContentView(web)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
        }
        web.addJavascriptInterface(Cau(), "LaChan")
        if (!Quyen.co(this, android.Manifest.permission.RECORD_AUDIO)) requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO), 21)
        web.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(m: ConsoleMessage): Boolean {
                if (m.messageLevel() == ConsoleMessage.MessageLevel.ERROR) NhatKy.ghi(this@GoiVideoActivity, "Gọi video, lỗi trang: ${m.message().take(120)}")
                Log.i("GoiVideo", "${m.messageLevel()} ${m.message()}")
                return true
            }
            override fun onPermissionRequest(r: PermissionRequest) {
                // Chỉ trang của chính app mới được xin micro, và chỉ khi app đã có quyền ghi âm.
                if (r.origin.host == HOST && Quyen.co(this@GoiVideoActivity, android.Manifest.permission.RECORD_AUDIO)) {
                    r.grant(r.resources.filter { it == PermissionRequest.RESOURCE_AUDIO_CAPTURE }.toTypedArray())
                } else r.deny()
            }
        }
        web.webViewClient = object : WebViewClient() {
            // Trang chỉ được ở trong chính app: không cho chuyển sang địa chỉ ngoài (cầu nối micro không được lộ cho trang lạ).
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest) = r.url.host != HOST || r.url.scheme != "https"
            // Rời một trang (bấm Quay lại giữa cuộc gọi, hoặc cuộc gọi dẫn về bài học) thì micro của trang đó phải tắt.
            override fun onPageStarted(v: WebView, url: String?, anh: Bitmap?) { dungNghe() }
            override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? {
                val u = r.url
                if (u.host != HOST) return null
                return try {
                    val path = u.path.orEmpty()
                    when {
                        path == "/__mieng" -> mieng(u.getQueryParameter("id") ?: "21", u.getQueryParameter("k")!!.toInt(), u.getQueryParameter("p")!!)
                        path.startsWith("/__song/") -> serveLiveFile(path)
                        else -> LocalWebAssets.open(assets, path)
                    }
                } catch (e: Throwable) {
                    Log.w("GoiVideo", "không trả được ${u.path}: $e")
                    WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), ByteArrayInputStream(ByteArray(0)))
                }
            }
        }
        val trang = trangHopLe(intent.getStringExtra("trang"))
        if (trang != null) web.loadUrl("https://$HOST/$trang")
        else {   // mặc định: cuộc gọi với chị Lan, địa chỉ như trước khi có nhiều cảnh
            val them = (if (intent.getBooleanExtra("auto", false)) "&auto=1" else "") + (if (CaiDat.goiSong(this) && canPlayLive()) "&song=1" else "")
            web.loadUrl("https://$HOST/prototype/video-call.html?goc=1$them")
        }
    }

    /** Nút Quay lại: đang ở trang mở từ trang khác (cuộc gọi mở từ bài học) thì lùi về trang trước, hết thì đóng màn. */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Đang ở thư viện bài học thì vuốt lùi là về app luôn, không lần ngược qua các trang bài đã mở.
        val u = Uri.parse(web.url ?: "")
        val thuVien = u.path == "/prototype/hoc.html" && u.getQueryParameter("bai") == null && u.getQueryParameter("kieu") == null
        if (thuVien || !web.canGoBack()) { dungNghe(); @Suppress("DEPRECATION") super.onBackPressed() } else { dungNghe(); web.goBack() }
    }

    private fun mieng(id: String, k: Int, p: String): WebResourceResponse {
        val ts = p.split(',').map { it.toFloat() }.toFloatArray()
        require(ts.size == 32 && id.all { it.isLetterOrDigit() })
        val anh = mayCua(id).chay(k, ts)
        return WebResourceResponse("application/octet-stream", null, 200, "OK", mapOf("Cache-Control" to "no-store"), ByteArrayInputStream(anh))
    }

    private fun serveLiveFile(path: String): WebResourceResponse {
        val (id, extension) = requireNotNull(Api.livePath.matchEntire(path)).destructured
        val mime = when (extension) {
            "wav" -> "audio/wav"
            "lip.json" -> "application/json"
            else -> "video/mp4"
        }
        val file = File(cacheDir, "song/$id.$extension")
        return WebResourceResponse(mime, if (extension == "lip.json") "utf-8" else null, 200, "OK",
            mapOf("Cache-Control" to "no-store", "Content-Length" to file.length().toString()), file.inputStream())
    }

    override fun onPause() { dungNghe(); super.onPause(); web.onPause() }
    override fun onResume() { super.onResume(); web.onResume() }
    override fun onDestroy() { dungNghe(); web.destroy(); synchronized(may) { may.values.forEach { it.dong() }; may.clear() }; super.onDestroy() }

    companion object {
        const val HOST = "lachan.app"
        /**
         * Trang mở đầu do nơi gọi đưa vào (extra "trang"). Màn này để exported nên app khác cũng gửi Intent tới được: chỉ nhận đúng hai trang của app,
         * trang gọi video và trang bài học, kèm phần ?… hoặc #… gồm các ký tự thường gặp. Mọi thứ khác bị bỏ qua (mở cuộc gọi mặc định).
         */
        fun trangHopLe(t: String?): String? =
            t?.takeIf { Regex("^prototype/(video-call|hoc)\\.html([?#][A-Za-z0-9_.~%&=+\\-]{0,300})?$").matches(it) && !it.contains("..") }
        fun coTrang(c: Context, trang: String) = try { c.assets.open("web/" + trang.substringBefore('?').substringBefore('#')).close(); true } catch (_: Exception) { false }
    }
}
