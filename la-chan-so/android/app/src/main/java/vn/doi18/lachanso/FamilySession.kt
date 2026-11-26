package vn.doi18.lachanso

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpCookie
import java.net.HttpURLConnection
import java.net.URL

/** Pairing with the family code issues an HttpOnly cookie. Keep it native, in memory and scoped to its server. */
internal object FamilySession {
    private var server = ""
    private var cookie = ""

    private fun connection(base: String, path: String) =
        (URL(base + path).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = false
            connectTimeout = 5000
            readTimeout = 8000
            useCaches = false
        }

    private fun pair(c: Context, base: String) {
        val request = connection(base, "/api/family/pair").apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
        }
        try {
            request.outputStream.use { it.write(JSONObject().put("code", CaiDat.familyCode(c)).toString().toByteArray(Charsets.UTF_8)) }
            check(request.responseCode == 200)
            cookie = request.headerFields.entries.filter { it.key.equals("Set-Cookie", true) }
                .flatMap { it.value }.flatMap(HttpCookie::parse).first { it.name == "lcs_family" }
                .let { "${it.name}=${it.value}" }
            server = base
        } finally { request.disconnect() }
    }

    fun list(c: Context): JSONArray {
        val rows = JSONArray(request(c, "/api/alerts", null))
        val sorted = (0 until rows.length()).map(rows::getJSONObject).sortedByDescending { row ->
            runCatching { java.time.Instant.parse(row.getString("at")) }.getOrNull()
        }
        return JSONArray(sorted)
    }

    fun action(c: Context, id: String, action: String, body: JSONObject): JSONObject {
        require(id.matches(Regex("[a-zA-Z0-9_-]{1,100}")) && action in setOf("reply", "call"))
        return JSONObject(request(c, "/api/alerts/$id/$action", body))
    }

    @Synchronized private fun request(c: Context, path: String, body: JSONObject?): String {
        val base = CaiDat.mayChu(c)
        check(base.isNotBlank() && CaiDat.relative(c) && CaiDat.familyCode(c) == Api.ROOM)
        repeat(2) {
            if (server != base || cookie.isEmpty()) pair(c, base)
            check(CaiDat.relative(c) && base == CaiDat.mayChu(c))
            val request = connection(base, path)
            try {
                request.setRequestProperty("Cookie", cookie)
                if (body != null) {
                    request.requestMethod = "POST"
                    request.doOutput = true
                    request.setRequestProperty("Content-Type", "application/json")
                    request.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
                }
                when (request.responseCode) {
                    401 -> cookie = ""
                    in 200..299 -> return request.inputStream.bufferedReader().use { it.readText() }
                    else -> {
                        if (body != null) return request.errorStream.bufferedReader().use { it.readText() }
                        error("Family list unavailable")
                    }
                }
            } finally { request.disconnect() }
        }
        error("Family session expired")
    }
}
