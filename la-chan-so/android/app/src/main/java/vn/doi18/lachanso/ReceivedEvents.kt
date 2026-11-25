package vn.doi18.lachanso

import android.content.Context
import android.net.Uri
import android.provider.CallLog.Calls
import android.provider.DocumentsContract.Document
import org.json.JSONArray
import org.json.JSONObject

internal data class ReceivedEvent(
    val type: String, val sender: String, val time: Long, val kind: String, val target: String,
    val duration: Long? = null, val maskedText: String = "", val alternatives: Map<String, String> = emptyMap(),
) {
    val id = ReceiptRules.eventId(type, sender, time)
    val at = ReceiptRules.utc(time)
    val key = ReceiptRules.targetKey(kind, target)

    fun fields(device: DeviceRegistration, forAnalysis: Boolean): Map<String, String> {
        val signedKey = if (forAnalysis) ReceiptRules.hash(key) else key
        return buildMap {
            put("eventId", id)
            put("type", type)
            put("direction", "incoming")
            put("at", at)
            duration?.let { put("durationSec", it.toString()) }
            put("targetKey", signedKey)
            put("receipt", device.sign(ReceiptRules.canonical(id, device.id, type, signedKey, at, duration)))
        }
    }
}

internal object ReceivedEvents {
    private const val WEEK = 7L * 86_400_000
    private fun prefs(c: Context) = c.getSharedPreferences("received-events", Context.MODE_PRIVATE)
    private fun inWindow(time: Long, now: Long) = time > now - WEEK && time <= now

    fun call(number: String, time: Long, duration: Long): ReceivedEvent? {
        val key = ReceiptRules.targetKey("call", cleanPhone(number) ?: return null)
        if (key.length < 3 || duration <= 0 || !inWindow(time, System.currentTimeMillis())) return null
        return ReceivedEvent("call_log", key, time, "call", key, duration)
    }

    private fun calls(c: Context, now: Long): List<ReceivedEvent> = buildList {
        try {
            c.contentResolver.query(Calls.CONTENT_URI, arrayOf(Calls.NUMBER, Calls.DATE, Calls.DURATION),
                "${Calls.TYPE} = ? AND ${Calls.DURATION} > 0 AND ${Calls.NUMBER_PRESENTATION} = ? AND ${Calls.DATE} > ? AND ${Calls.DATE} <= ?",
                arrayOf(Calls.INCOMING_TYPE.toString(), Calls.PRESENTATION_ALLOWED.toString(), (now - WEEK).toString(), now.toString()),
                "${Calls.DATE} DESC")?.use { rows ->
                while (rows.moveToNext()) call(rows.getString(0).orEmpty(), rows.getLong(1), rows.getLong(2))?.let(::add)
            }
        } catch (_: SecurityException) {
            // SMS still works when READ_CALL_LOG is off.
        }
    }

    private fun smsRows(c: Context, now: Long): List<JSONObject> {
        val rows = JSONArray(prefs(c).getString("sms", null) ?: "[]")
        return (0 until rows.length()).mapNotNull(rows::optJSONObject).filter { inWindow(it.optLong("time"), now) }
    }

    private val linkPattern = Regex("""(?i)\b(?:https?://)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?""")
    private val accountPattern = Regex("""(?i)(?:stk|số tài khoản|tài khoản)\s*[:#]?\s*(\d{6,20})\b""")
    private val phonePattern = Regex("""(?<![\d+])(?:0\d{9,10}|\+84\d{9})(?!\d)""")

    @Synchronized fun saveSms(c: Context, sender: String, time: Long, text: String): String? {
        val now = System.currentTimeMillis()
        if (!inWindow(time, now) || sender.isBlank()) return null
        val targets = linkedMapOf<String, String>()
        val number = cleanPhone(sender)?.takeIf { it.count(Char::isDigit) >= 3 }
        if (number != null) targets[ReceiptRules.targetKey("phone", number)] = "phone"
        for (match in linkPattern.findAll(text)) {
            targets[ReceiptRules.targetKey("link", match.value.trimEnd('.', ',', ')', '!', '?'))] = "link"
        }
        for (match in phonePattern.findAll(text)) targets[ReceiptRules.targetKey("phone", match.value)] = "phone"
        for (match in accountPattern.findAll(text)) targets[match.groupValues[1]] = "account"
        // The server detects a target kind again for message reports. A display name such as
        // "Shop 24h" would turn into the account "24", which is not this sender.
        if (number == null && sender.none(Char::isDigit)) targets[sender.trim()] = "message"
        if (targets.isEmpty()) return null
        val row = JSONObject().put("sender", number?.let { ReceiptRules.targetKey("phone", it) } ?: sender.trim())
            .put("time", time).put("text", LocTinNhan.che(text).take(1200)).put("target", targets.keys.first())
            .put("targets", JSONObject().apply { targets.forEach { (value, kind) -> put(value, kind) } })
        val event = smsEvent(row)
        val rows = smsRows(c, now).filterNot { smsEvent(it).id == event.id }
        prefs(c).edit().putString("sms", JSONArray((rows + row).sortedByDescending { it.getLong("time") }.take(100)).toString()).apply()
        return event.id
    }

    private fun smsEvent(row: JSONObject): ReceivedEvent {
        val targets = row.getJSONObject("targets")
        val target = row.getString("target")
        return ReceivedEvent("sms_received", row.getString("sender"), row.getLong("time"), targets.getString(target), target,
            maskedText = row.getString("text"), alternatives = targets.keys().asSequence().associateWith(targets::getString))
    }

    fun list(c: Context): List<ReceivedEvent> {
        val now = System.currentTimeMillis()
        return (calls(c, now) + smsRows(c, now).map(::smsEvent)).sortedByDescending { it.time }
    }

    fun find(c: Context, id: String) = list(c).firstOrNull { it.id == id }

    // Keep the URI only when the dialer's finished file has a stable size and modification time.
    private fun fileStamp(c: Context, uri: Uri): String? = runCatching {
        c.contentResolver.query(uri, arrayOf(Document.COLUMN_SIZE, Document.COLUMN_LAST_MODIFIED), null, null, null)?.use {
            if (it.moveToFirst() && it.getLong(0) > 0 && it.getLong(1) > 0) "${it.getLong(0)}|${it.getLong(1)}" else null
        }
    }.getOrNull()

    @Synchronized fun bindRecording(c: Context, event: ReceivedEvent, file: GhiAm.BanGhi) {
        val stamp = fileStamp(c, file.uri) ?: return
        val ownerKey = "owner-" + ReceiptRules.hash("${file.uri}|$stamp")
        val owner = prefs(c).getString(ownerKey, null)
        if (owner != null && owner != event.id) return
        val data = JSONObject().put("uri", file.uri.toString()).put("mime", file.kieu).put("stamp", stamp)
        prefs(c).edit().putString(ownerKey, event.id).putString("file-${event.id}", data.toString()).apply()
    }

    fun recording(c: Context, id: String): Pair<Uri, String>? {
        val file = prefs(c).getString("file-$id", null)?.let(::JSONObject) ?: return null
        val uri = Uri.parse(file.getString("uri"))
        return if (fileStamp(c, uri) == file.getString("stamp")) uri to file.getString("mime") else null
    }
}
