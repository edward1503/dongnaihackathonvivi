package vn.doi18.lachanso

import android.content.res.AssetManager
import android.webkit.WebResourceResponse

internal object LocalWebAssets {
    fun open(assets: AssetManager, path: String): WebResourceResponse {
        require(!path.contains(".."))
        val mime = when (path.substringAfterLast('.', "").lowercase()) {
            "html" -> "text/html"; "js", "mjs" -> "text/javascript"; "css" -> "text/css"; "json" -> "application/json"
            "png" -> "image/png"; "jpg", "jpeg" -> "image/jpeg"; "mp4" -> "video/mp4"; "m4a" -> "audio/mp4"
            "woff2" -> "font/woff2"; "ttf" -> "font/ttf"; "svg" -> "image/svg+xml"; "webp" -> "image/webp"; "gif" -> "image/gif"
            "mp3" -> "audio/mpeg"; "wav" -> "audio/wav"; "txt" -> "text/plain"
            else -> "application/octet-stream"
        }
        val isText = mime.startsWith("text/") || mime == "application/json"
        return WebResourceResponse(mime, if (isText) "utf-8" else null, 200, "OK", mapOf("Cache-Control" to "max-age=3600"), assets.open("web$path"))
    }
}
