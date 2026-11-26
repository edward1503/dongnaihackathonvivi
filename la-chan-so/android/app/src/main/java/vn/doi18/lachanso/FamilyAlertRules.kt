package vn.doi18.lachanso

import java.time.Instant

internal const val FAMILY_CHANNEL = "family-alerts"
internal fun isAppRole(role: String) = role in setOf("elder", "student", "relative", "team")

internal data class FamilyNotice(val id: String, val time: Long, val text: String, val isMessage: Boolean = false)

internal fun parseFamilyNotice(id: String, at: String, level: String, number: String, kind: String = "call"): FamilyNotice? {
    if (!id.matches(Regex("[a-zA-Z0-9_-]{1,100}"))) return null
    val time = runCatching { Instant.parse(at).toEpochMilli() }.getOrNull() ?: return null
    val digits = number.filter(Char::isDigit)
    val display = if (digits.length >= 8) "${digits.take(2)}xx xxx ${digits.takeLast(3)}" else "Số chưa rõ"
    val label = when (level) {
        "danger" -> "Nguy hiểm"
        "suspicious", "warn" -> "Nghi ngờ"
        "safe" -> "Khớp danh bạ"
        else -> "Chưa rõ"
    }
    return FamilyNotice(id, time, "$label · $display", kind == "message")
}

internal fun newFamilyNotices(rows: List<FamilyNotice>, notified: Set<String>, since: Long) =
    rows.filter { it.time >= since && it.id !in notified }.distinctBy { it.id }.sortedBy { it.time }
