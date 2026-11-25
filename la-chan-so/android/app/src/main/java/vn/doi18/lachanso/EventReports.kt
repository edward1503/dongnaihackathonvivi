package vn.doi18.lachanso

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

internal object EventReports {
    const val UPDATED = "vn.doi18.lachanso.REPORT_UPDATED"
    fun lastMessage(c: Context, id: String) = meta(c, id).optString("message")
    private val locks = Array(16) { Any() }
    private fun lock(id: String) = locks[Math.floorMod(id.hashCode(), locks.size)]
    private fun prefs(c: Context) = c.getSharedPreferences("reports-" + ReceiptRules.hash(CaiDat.mayChu(c)), Context.MODE_PRIVATE)
    private fun meta(c: Context, id: String) = JSONObject(prefs(c).getString(id, null) ?: "{}")
    private fun save(c: Context, id: String, data: JSONObject) {
        prefs(c).edit().putString(id, data.toString()).apply()
    }

    private fun error(text: String) = JSONObject().put("detail", text)
    private fun offline() = error("Bé Nai chưa kết nối được với máy chủ. Bà thử lại sau nha.")
    fun message(response: JSONObject): String {
        val main = response.optString("detail").ifBlank { response.optString("message").ifBlank { "Máy chủ chưa trả lời ạ." } }
        return listOf(main, response.optString("alertMessage")).filter(String::isNotBlank).joinToString(" ")
    }

    fun recent(c: Context): JSONArray = JSONArray().apply {
        for (event in ReceivedEvents.list(c)) {
            val data = meta(c, event.id)
            val target = data.optString("target", event.target)
            val recording = data.optJSONObject("recording")
            val display = if (event.type == "sms_received") "Tin từ ${event.sender} · $target" else TraCuu.dinhDang(target)
            put(JSONObject().put("eventId", event.id).put("type", event.type).put("target", target).put("display", display)
                .put("at", event.at).put("durationSec", event.duration).put("analysisId", recording?.getString("analysisId"))
                .put("hasRecording", recording != null || ReceivedEvents.recording(c, event.id) != null)
                .put("reportId", data.opt("reportId")).put("reportStatus", data.opt("reportStatus")))
        }
    }

    fun needsAlert(c: Context, id: String): Boolean {
        val data = meta(c, id)
        return data.has("reportId") && data.has("recording") && !data.has("alertId") && data.optString("reportStatus") != "withdrawn"
    }

    fun rememberAnswer(c: Context, eventId: String, answer: String?) {
        if (eventId.isNotEmpty() && answer != null) prefs(c).edit().putString("answer-$eventId", answer).apply()
    }

    fun isWithdrawn(c: Context, id: String) = meta(c, id).optString("reportStatus") == "withdrawn"

    fun reportId(c: Context, id: String): String? = meta(c, id).takeUnless { it.optString("reportStatus") == "withdrawn" }
        ?.optString("reportId")?.takeIf(String::isNotBlank)

    /** Only the URI matched by the call service is eligible. Never use a file chosen by the WebView. */
    fun analyze(c: Context, event: ReceivedEvent): JSONObject? = synchronized(lock(event.id)) {
        val data = meta(c, event.id)
        data.optJSONObject("analysis")?.let { return it }
        val (uri, mime) = ReceivedEvents.recording(c, event.id) ?: return null
        val device = DeviceRegistration.get(c) ?: return null
        val result = runCatching {
            c.contentResolver.openInputStream(uri)?.use {
                Api.recordingResult(c, it, mime, !SoQuen.laQuen(c, event.target), event.fields(device, true))
            }
        }.getOrNull() ?: return null
        val id = if (!result.isNull("analysisId")) result.optString("analysisId") else result.optString("id")
        if (result.optString("source") == "ai" && id.isNotBlank() && !result.isNull("confidence")) {
            // The server can return a different community level for the displayed number.
            val hasContentLabel = !result.isNull("aiLevel")
            val recording = JSONObject().put("analysisId", id)
                .put("aiLevel", result.getString(if (hasContentLabel) "aiLevel" else "level"))
                .put("aiScamType", result.opt(if (hasContentLabel) "aiScamType" else "scamType"))
                .put("aiConfidence", result.getDouble(if (!result.isNull("aiConfidence")) "aiConfidence" else "confidence"))
            val cached = JSONObject(result.toString()).apply { remove("maskedText") }
            val summary = if (result.isNull("summary")) result.optString("headline") else result.getString("summary")
            data.put("recording", recording).put("summary", LocTinNhan.che(summary).take(1000)).put("analysis", cached)
            save(c, event.id, data)
        }
        result
    }

    fun report(c: Context, id: String, story: String = "", answer: String? = null, selectedTarget: String? = null): JSONObject =
        synchronized(lock(id)) {
            val original = ReceivedEvents.find(c, id) ?: return error("Bé Nai chưa tìm thấy cuộc gọi đến hoặc tin nhắn này trên máy ạ.")
            val device = DeviceRegistration.get(c) ?: return offline()
            var data = meta(c, id)
            if (isWithdrawn(c, id)) return error("Bà đã rút báo cáo này rồi ạ.")
            val target = data.optString("target").ifBlank { selectedTarget ?: original.target }
            if (selectedTarget != null && selectedTarget != target) return error("Tin nhắn này đã có báo cáo cho $target rồi ạ.")
            val event = if (target == original.target) original else original.copy(
                kind = original.alternatives[target] ?: return error("Đối tượng này không có trong tin nhắn bà nhận ạ."), target = target)
            if (event.type == "call_log" && !data.has("recording")) {
                analyze(c, event)
                data = meta(c, id)
            }
            val evidence = JSONObject().put("type", event.type).put("direction", "incoming").put("at", event.at)
                .put("durationSec", event.duration).put("recording", data.optJSONObject("recording"))
            val fields = event.fields(device, false)
            val body = JSONObject().put("kind", event.kind).put("target", event.target).put("relation", "self")
                .put("eventId", id).put("receipt", fields.getValue("receipt")).put("direction", "incoming").put("evidence", evidence)
                .put("story", LocTinNhan.che(story.ifBlank { event.maskedText }).take(1200))
            val choice = answer ?: prefs(c).getString("answer-$id", null)
            if (choice != null) body.put("selfAnswer", choice).put("selfAnswerSignature", device.sign("$id|$choice"))
            val response = MayChu.gui(c, "/api/reports", body) ?: return offline()
            val report = response.optJSONObject("report") ?: return if (response.has("detail")) response else offline()
            val reportId = report.optString("id").takeIf(String::isNotBlank) ?: return offline()
            data.put("target", target).put("reportId", reportId).put("reportStatus", report.optString("status"))
            prefs(c).edit().putString("event-$reportId", id).apply()
            save(c, id, data)
            val recording = data.optJSONObject("recording")
            if (recording != null && !data.has("alertId") && report.optString("status") != "withdrawn") {
                // The hackathon room is pre-paired. The server decides whether this device has a recipient.
                val bodyAlert = JSONObject().put("room", Api.ROOM).put("from", "android").put("eventId", id)
                    .put("reportId", reportId).put("analysisId", recording.getString("analysisId")).put("level", recording.getString("aiLevel"))
                    .put("phone", target).put("callSeconds", event.duration).put("summary", data.optString("summary"))
                val alert = MayChu.gui(c, "/api/alerts", bodyAlert)
                val alertId = alert?.optString("id").orEmpty()
                if (alertId.isNotBlank()) save(c, id, data.put("alertId", alertId))
                else response.put("alertMessage", alert?.optString("detail").orEmpty().ifBlank { "Chưa gửi được tóm tắt cho người thân ạ." })
            }
            save(c, id, data.put("message", message(response)))
            response
        }

    fun withdraw(c: Context, reportId: String): JSONObject {
        val id = prefs(c).getString("event-$reportId", null) ?: return error("Máy này chưa gửi báo cáo đó ạ.")
        return synchronized(lock(id)) {
            val device = DeviceRegistration.get(c) ?: return offline()
            val at = ReceiptRules.utc(System.currentTimeMillis())
            val signature = device.sign("withdraw|$reportId|${device.id}|$at")
            val reply = MayChu.gui(c, "/api/reports/${MayChu.ma(reportId)}/withdraw", JSONObject().put("at", at).put("signature", signature))
                ?: return offline()
            if (!reply.has("detail") && reply.optJSONObject("report")?.optString("id") == reportId) {
                save(c, id, meta(c, id).put("reportStatus", "withdrawn").put("message", message(reply)))
            }
            reply
        }
    }
}
