package vn.doi18.lachanso

import org.junit.Assert.*
import org.junit.Test

class FamilyAlertRulesTest {
    @Test fun acceptsOnlyBridgeRoles() {
        for (role in listOf("elder", "student", "relative", "team")) assertTrue(isAppRole(role))
        for (role in listOf("volunteer", "lead", "", "Relative")) assertFalse(isAppRole(role))
    }

    @Test fun parsesAlertSnapshotWithoutExposingTheCallerNumber() {
        val time = "2026-11-25T10:42:00+07:00"
        val notice = parseFamilyNotice("ask_1", time, "warn", "0912 345 678")!!
        assertEquals("Nghi ngờ · 09xx xxx 678", notice.text)
        assertEquals("Chưa rõ · Số chưa rõ", parseFamilyNotice("a", time, "", "")!!.text)
        assertTrue(parseFamilyNotice("a", time, "danger", "123", "message")!!.isMessage)
        assertNull(parseFamilyNotice("a", "invalid", "danger", "123"))
        assertNull(parseFamilyNotice("a/b", time, "danger", "123"))
    }

    @Test fun ignoresOldAndAlreadyNotifiedIdsIncludingDuplicateRows() {
        val first = FamilyNotice("a", 10, "")
        val next = FamilyNotice("b", 20, "")
        val rows = listOf(next, first, next, FamilyNotice("old", 9, ""))
        assertEquals(listOf(first, next), newFamilyNotices(rows, emptySet(), 10))
        assertEquals(listOf(next), newFamilyNotices(rows, setOf("a"), 10))
        assertTrue(newFamilyNotices(rows, setOf("a", "b"), 10).isEmpty())
    }
}
