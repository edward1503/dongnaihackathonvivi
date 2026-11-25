package vn.doi18.lachanso

import org.junit.Assert.*
import org.junit.Test

class ReceiptRulesTest {
    @Test fun signsExactUtf8FieldsAndKeepsEmptyDuration() {
        val at = "2026-11-25T04:05:06Z"
        val device = "0123456789abcdef"
        val call = ReceiptRules.canonical("evt", device, "call_log", "0912345678", at, 42)
        assertEquals("evt|0123456789abcdef|call_log|incoming|0912345678|2026-11-25T04:05:06Z|42", call)
        assertEquals("d378873b132cc52eddaddc0b18f89dfe22a060c8832739c189d357dd04345695", ReceiptRules.sign("unit-test-key", call))
        val sms = ReceiptRules.canonical("evt", device, "sms_received", "bit.ly/offer", at, null)
        assertTrue(sms.endsWith("|"))
        assertEquals("800c110770c19f8bd64d9f32707a6bdf547252a7b2f7afa93df5961e1462b658", ReceiptRules.sign("unit-test-key", sms))
        assertEquals(at, ReceiptRules.utc(java.time.Instant.parse(at).toEpochMilli() + 999))
    }

    @Test fun signingAnalysisHidesTheNumberAndBindsTheSameEvent() {
        val device = DeviceRegistration("0123456789abcdef", "unit-test-key")
        val event = ReceivedEvent("call_log", "0912345678", 1795579506123L, "call", "0912345678", 32)
        val analysis = event.fields(device, forAnalysis = true)
        val report = event.fields(device, forAnalysis = false)
        assertEquals(ReceiptRules.hash(event.key), analysis["targetKey"])
        assertFalse(analysis.containsValue(event.target))
        assertEquals(event.key, report["targetKey"])
        assertEquals(report["eventId"], analysis["eventId"])
        assertNotEquals(report["receipt"], analysis["receipt"])
    }

    @Test fun eventIdentitySurvivesReloadAndDistinguishesRepeatCalls() {
        val time = 1795579506123L
        val expected = "98cd2053deb3c04b073d0543088b12a62664584017e7df002e3021d96d82475a"
        val original = ReceivedEvent("call_log", "0912345678", time, "call", "0912345678", 10)
        assertEquals(expected, original.id)
        assertEquals(expected, original.copy(duration = 11).id)
        assertNotEquals(expected, original.copy(time = time + 1).id)
        assertNotEquals(expected, original.copy(type = "sms_received").id)
        assertNotEquals(expected, original.copy(sender = "02899991234").id)
    }

    @Test fun normalizesLikeServerTextTargetKey() {
        assertEquals("0912345678", ReceiptRules.targetKey("phone", "(+84) 912-345-678"))
        assertEquals("02899991234", ReceiptRules.targetKey("call", "028 9999 1234"))
        assertEquals("842899991234", ReceiptRules.targetKey("phone", "+84 28 9999 1234"))
        assertEquals("84912345678", ReceiptRules.targetKey("account", "84 912 345 678"))
        assertEquals("qua-tri-an.top", ReceiptRules.targetKey("link", " HTTPS://WWW.Qua-Tri-An.TOP/qua?utm=1 "))
        assertEquals("bit.ly/offer", ReceiptRules.targetKey("link", "https://www.Bit.Ly/Offer?tag=Q#abc"))
        assertEquals("t.co", ReceiptRules.targetKey("link", "t.co/A"))
        assertEquals("Bé Nai", ReceiptRules.targetKey("message", " Be\u0301 Nai "))
    }

    @Test fun keepsKnownDistinctFromNoAndSkip() {
        assertEquals("yes", ReceiptRules.selfAnswer("Có"))
        assertEquals("no", ReceiptRules.selfAnswer("Không"))
        assertEquals("known", ReceiptRules.selfAnswer("Tôi biết số này"))
        assertNull(ReceiptRules.selfAnswer("Không biết"))
        assertNull(ReceiptRules.selfAnswer(""))
    }

    @Test fun allowsOnlyPublishedDemosAndScenes() {
        for (key in listOf("ring", "ringKnown", "afterCall", "stop", "message", "bankWatch")) assertTrue(isDemoKey(key))
        for (scene in listOf("minh-1", "minh-3", "lan-2", "tu-9")) assertTrue(isCallScene(scene))
        for (other in listOf("", "ring/../stop", "tu-9&auto=1", "MINH-1")) {
            assertFalse(isDemoKey(other))
            assertFalse(isCallScene(other))
        }
    }
}
