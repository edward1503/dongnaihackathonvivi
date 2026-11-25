package vn.doi18.lachanso

import org.junit.Assert.*
import org.junit.Test

class BridgeRulesTest {
    @Test fun mapsOnlyPublishedLessons() {
        assertEquals("gia-danh-co-quan", lessonSlug("gia_danh_cong_an"))
        assertEquals("nguoi-than-gap-nan", lessonSlug("nguoi_than_tai_nan"))
        assertEquals("viec-nhe-luong-cao", lessonSlug("viec_nhe_luong_cao"))
        assertEquals("dau-tu-lai-cao", lessonSlug("dau_tu_lai_cao"))
        assertNull(lessonSlug("duong_dan_gia"))
        assertNull(lessonSlug(""))
    }

    @Test fun reportsAllLayerCombinations() {
        for (mask in 0..7) {
            val calls = mask and 1 != 0
            val messages = mask and 2 != 0
            val banking = mask and 4 != 0
            assertEquals("""{"calls":$calls,"messages":$messages,"banking":$banking,"asleep":${mask == 0}}""",
                layersJson(calls, messages, banking))
        }
    }

    @Test fun cleansFormattedNumbersWithoutAcceptingDialCommands() {
        assertEquals("+84901234567", cleanPhone(" (+84) 901-234.567 "))
        assertEquals("0901234567", dialNumber("090 123 4567"))
        for (input in listOf("", "abc", "*123#", "123;456", "1+23")) assertNull(cleanPhone(input))
    }

    @Test fun refusesShortNumbersAndHotlinesAfterCleaning() {
        for (input in listOf("9", "+12", "111", "1 13", "(114)", "+115", "1-56")) assertNull(dialNumber(input))
        assertEquals("116", dialNumber("116"))
    }
}
