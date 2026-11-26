package vn.doi18.lachanso

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FlaggedNumbersTest {
    @Test fun phoneFormatsMatchServerHash() {
        val expected = "20faf05baccf8a477fa337b77c0acb0e8bff77f34664feec6a057bd3cf23235b"
        for (number in listOf("0912 345 678", "+84912345678", "84912345678")) {
            assertEquals(expected, FlaggedNumbers.numberHash(number))
        }
    }

    @Test fun expiresAfterThreeDaysFromFetch() {
        val fetchedAt = 1_700_000_000_000L
        val limit = fetchedAt + 72 * 3_600_000L
        assertTrue(FlaggedNumbers.isFresh(fetchedAt, fetchedAt))
        assertTrue(FlaggedNumbers.isFresh(fetchedAt, limit))
        assertFalse(FlaggedNumbers.isFresh(fetchedAt, limit + 1))
        assertFalse(FlaggedNumbers.isFresh(fetchedAt, fetchedAt - 1))
    }
}
