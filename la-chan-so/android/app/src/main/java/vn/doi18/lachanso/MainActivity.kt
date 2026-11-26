package vn.doi18.lachanso

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONObject

class MainActivity : Activity() {
    private val page = "https://lachan.app/app/index.html"
    private lateinit var web: WebView
    private lateinit var bridge: AppBridge
    private var server = ""

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        web = WebView(this)
        bridge = AppBridge(this, web)
        val frame = FrameLayout(this)
        frame.setBackgroundColor(Color.WHITE)
        frame.addView(web)
        setContentView(frame)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.WHITE
        window.navigationBarColor = Color.WHITE
        WindowCompat.getInsetsController(window, frame).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        ViewCompat.setOnApplyWindowInsetsListener(frame) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or
                WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            allowFileAccess = false
            allowContentAccess = false
        }
        web.addJavascriptInterface(bridge, "LCSAndroid")
        val shim = resources.openRawResource(R.raw.app_bridge).bufferedReader().use { it.readText() }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (request.isForMainFrame && uri.scheme == "https" && uri.authority == "lachan.app") {
                    if (uri.path == "/app/index.html") return false
                    val story = GoiVideoActivity.trangHopLe(uri.toString().removePrefix("https://lachan.app/"))
                    if (story != null) startActivity(Intent(this@MainActivity, GoiVideoActivity::class.java).putExtra("trang", story))
                }
                return true
            }

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val uri = request.url
                if (uri.scheme != "https" || uri.authority != "lachan.app") {
                    return if (request.isForMainFrame) missing() else null
                }
                val path = uri.path.orEmpty()
                return try {
                    when {
                        path == "/app/index.html" -> {
                            val nonce = java.util.UUID.randomUUID().toString()
                            val base = JSONObject.quote(CaiDat.mayChu(this@MainActivity)).replace("<", "\\u003c")
                            val html = assets.open("web/app/index.html").bufferedReader().use { it.readText() }
                                .replaceFirst("<head>", "<head><script nonce=\"$nonce\">window.LCS_API_BASE=$base;\n$shim</script>")
                            val headers = mapOf("Cache-Control" to "no-store",
                                "Content-Security-Policy" to "script-src 'self' 'nonce-$nonce'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'")
                            WebResourceResponse("text/html", "utf-8", 200, "OK", headers, html.byteInputStream())
                        }
                        !request.isForMainFrame && (path.startsWith("/app/") || path == "/prototype/hoc.html") ->
                            LocalWebAssets.open(assets, path)
                        else -> missing()
                    }
                } catch (_: Exception) { missing() }
            }
        }
        server = CaiDat.mayChu(this)
        web.loadUrl(page + route(intent).orEmpty())
    }

    private fun missing() = WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), "".byteInputStream())

    private fun route(intent: Intent) = intent.getStringExtra("route")?.takeIf { it.startsWith("#/") }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        route(intent)?.let { web.loadUrl(page + it) }
    }

    override fun onResume() {
        super.onResume()
        DichVuLaChan.batDau(this)
        val current = CaiDat.mayChu(this)
        if (server != current) {
            server = current
            web.reload()
        }
        web.evaluateJavascript("window.dispatchEvent(new Event('lcs-layers'))", null)
    }

    override fun onRequestPermissionsResult(code: Int, permissions: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, permissions, results)
        if (code == AppBridge.AUDIO_REQUEST) bridge.onAudioPermission()
    }

    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else finish()
    }

    override fun onStop() {
        bridge.stop()
        super.onStop()
    }

    override fun onDestroy() {
        bridge.close()
        (web.parent as? FrameLayout)?.removeView(web)
        web.destroy()
        super.onDestroy()
    }
}
