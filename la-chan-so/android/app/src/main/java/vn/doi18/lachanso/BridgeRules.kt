package vn.doi18.lachanso

internal fun lessonSlug(scamType: String): String? = when (scamType.trim().lowercase().replace('_', '-')) {
    "gia-danh-cong-an", "gia-danh-co-quan" -> "gia-danh-co-quan"
    "nguoi-than-tai-nan", "nguoi-than-gap-nan" -> "nguoi-than-gap-nan"
    "viec-nhe-luong-cao" -> "viec-nhe-luong-cao"
    "dau-tu-lai-cao" -> "dau-tu-lai-cao"
    else -> null
}

internal fun cleanPhone(phone: String): String? {
    val number = phone.trim().replace(Regex("[\\s().-]"), "")
    return number.takeIf { it.matches(Regex("\\+?[0-9]+")) }
}

internal fun dialNumber(phone: String): String? = cleanPhone(phone)?.takeIf {
    val digits = it.removePrefix("+")
    digits.length >= 3 && digits !in setOf("111", "113", "114", "115", "156")
}

internal fun layersJson(calls: Boolean, messages: Boolean, banking: Boolean): String =
    """{"calls":$calls,"messages":$messages,"banking":$banking,"asleep":${!calls && !messages && !banking}}"""

internal fun isDemoKey(key: String) = key in setOf("ring", "ringKnown", "afterCall", "stop", "message", "bankWatch")
internal fun isCallScene(scene: String) = scene in setOf("minh-1", "minh-3", "lan-2", "tu-9")
