package vn.doi18.lachanso

import java.security.MessageDigest
import java.text.Normalizer
import java.time.Instant
import java.util.Locale
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

internal object ReceiptRules {
    private val shorteners = setOf("bit.ly", "tinyurl.com", "cutt.ly", "t.ly", "s.id", "rb.gy", "shorturl.at")
    private val scheme = Regex("^[a-z][a-z0-9+.-]*://")

    fun targetKey(kind: String, value: String): String {
        val normalized = Normalizer.normalize(value, Normalizer.Form.NFC).trim()
        return when (kind) {
            "phone", "call", "account" -> {
                val digits = normalized.filter(Char::isDigit)
                if (kind != "account" && digits.length == 11 && digits.startsWith("84")) "0" + digits.drop(2) else digits
            }
            "link" -> {
                val link = normalized.lowercase(Locale.ROOT).replaceFirst(scheme, "").removePrefix("www.").trimEnd('/')
                val path = link.substringBefore('?').substringBefore('#')
                val host = path.substringBefore('/')
                if (host in shorteners) path else host
            }
            else -> normalized
        }
    }

    private const val HEX = "0123456789abcdef"
    private fun hex(bytes: ByteArray) = buildString(bytes.size * 2) {
        for (byte in bytes) {
            append(HEX[(byte.toInt() and 255) ushr 4])
            append(HEX[byte.toInt() and 15])
        }
    }
    fun hash(value: String) = hex(MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8)))
    fun eventId(type: String, sender: String, timestamp: Long) = hash("$type|$sender|$timestamp")
    fun utc(timestamp: Long) = Instant.ofEpochSecond(timestamp / 1000).toString()
    fun canonical(eventId: String, deviceId: String, type: String, key: String, at: String, duration: Long?) =
        "$eventId|$deviceId|$type|incoming|$key|$at|${duration ?: ""}"

    fun sign(secret: String, value: String): String = Mac.getInstance("HmacSHA256").run {
        init(SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256"))
        hex(doFinal(value.toByteArray(Charsets.UTF_8)))
    }

    fun selfAnswer(label: String) = when (label.trim().lowercase(Locale.ROOT)) {
        "có" -> "yes"
        "không" -> "no"
        "tôi biết số này" -> "known"
        else -> null
    }
}
