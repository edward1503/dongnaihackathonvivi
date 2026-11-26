package vn.doi18.lachanso

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Phần thuần của lớp nối với máy chủ chung (Api.kt): đổi mức, nhãn, lời khuyên, bản chép lời, đối tượng báo cáo. */
class ApiTest {
    @Test fun mucKhongBaoGioSuyRaAnToan() {
        assertEquals(Muc.NGUY_HIEM, Api.muc("danger"))
        assertEquals(Muc.NGHI_NGO, Api.muc("suspicious"))
        assertEquals(Muc.AN_TOAN, Api.muc("safe"))
        for (la in listOf("unknown", "", null, "SAFE", "ok", "an-toan")) assertEquals(Muc.CHUA_CO_DU_LIEU, Api.muc(la))
    }

    @Test fun mucDiVaVeKhopNhau() {
        for (m in Muc.entries) assertEquals(m, Api.muc(Api.level(m)))
    }

    @Test fun thuBacKhongChoMayChuLamNheCanhBao() {
        assert(Api.nang(Muc.NGUY_HIEM) > Api.nang(Muc.NGHI_NGO))
        assert(Api.nang(Muc.NGHI_NGO) > Api.nang(Muc.CHUA_CO_DU_LIEU))
        assert(Api.nang(Muc.CHUA_CO_DU_LIEU) > Api.nang(Muc.AN_TOAN))
    }

    @Test fun nhanVietThuongChuDau() {
        assertEquals("giả danh công an", Api.nhan("Giả danh công an"))
        assertEquals("việc nhẹ lương cao", Api.nhan(" Việc nhẹ lương cao. "))
        assertEquals("", Api.nhan(""))
    }

    @Test fun loiKhuyenNoiTuTodoHoacHeadline() {
        assertEquals("Đừng nạp tiền. Đừng mở đường dẫn trong tin.", Api.giaiThich(listOf("Đừng nạp tiền", " Đừng mở đường dẫn trong tin. "), "x"))
        assertEquals("Cúp máy đi!", Api.giaiThich(listOf("Cúp máy đi!"), "x"))
        assertEquals("14 người đã báo số này.", Api.giaiThich(listOf(" ", ""), " 14 người đã báo số này. "))
        assertEquals("", Api.giaiThich(emptyList(), ""))
    }

    @Test fun banChepLoiTachNguoiNoi() {
        val kq = Api.chepLoi("Người gọi: Tôi là cán bộ điều tra.\n\nBà Hoa: Dạ, tôi nghe.\nmột dòng không có tên người nói\nGiờ là 10: 30 sáng nha bà ơi, bà nghe cho rõ")
        assertEquals(4, kq.size)
        assertEquals("Người gọi" to "Tôi là cán bộ điều tra.", kq[0])
        assertEquals("Bà Hoa" to "Dạ, tôi nghe.", kq[1])
        assertEquals("" to "một dòng không có tên người nói", kq[2])
        assertEquals("Giờ là 10", kq[3].first)   // dấu hai chấm đầu tiên trong 24 ký tự được coi là tên người nói
        assertEquals(emptyList<Pair<String, String>>(), Api.chepLoi("  \n "))
    }

    @Test fun doiTuongBaoCaoUuTienSoRoiDuongDan() {
        assertEquals("0934567890", Api.doiTuongBaoCao("0934 567 890", "nạp trước 200k tại bit.ly/viec-nhe"))
        assertEquals("84934567890", Api.doiTuongBaoCao("+84934567890", "x"))
        assertEquals("bit.ly/viec-nhe", Api.doiTuongBaoCao("Tuyển dụng", "Nạp trước 200k tại bit.ly/viec-nhe."))
        assertEquals("https://qua-tri-an.top/nhan?x=1", Api.doiTuongBaoCao("", "Vào https://qua-tri-an.top/nhan?x=1, nhận quà"))
        assertEquals("Shop 24h", Api.doiTuongBaoCao(" Shop 24h ", "chuyển khoản gấp nha"))
        assertEquals("tin nhắn", Api.doiTuongBaoCao("", "chuyển khoản gấp nha"))
    }

    private val liveFields = mapOf(
        "id" to "0123456789abcdef", "chu" to "Chị hiểu rồi.", "pcm" to "AAABAA==",
        "tanSo" to 24000, "giay" to 0.000083333, "y" to listOf("cup"), "sai" to false, "het" to true,
    )

    @Test fun parsesLiveReply() {
        val reply = checkNotNull(Api.parseLiveReply(liveFields::get))
        assertEquals("0123456789abcdef", reply.id)
        assertEquals("Chị hiểu rồi.", reply.line)
        assertEquals("AAABAA==", reply.pcm)
        assertEquals(24000, reply.sampleRate)
        assertEquals(0.000083333, reply.seconds, 0.0)
        assertEquals(listOf("cup"), reply.ideas)
        assertEquals(false, reply.wrong)
        assertEquals(true, reply.finished)
        assertArrayEquals(byteArrayOf(0, 0, 1, 0), reply.audio)
    }

    @Test fun rejectsInvalidLiveReply() {
        for ((field, value) in listOf(
            "id" to "../0123456789abc", "chu" to "", "pcm" to "A==", "pcm" to "AA==",
            "tanSo" to 0, "tanSo" to 24000.5, "giay" to Double.NaN, "y" to listOf(1),
            "sai" to "false", "het" to null,
        )) {
            val fields = liveFields + (field to value)
            assertNull(field, Api.parseLiveReply(fields::get))
        }
    }

    @Test fun writesPcm16MonoWavHeader() {
        val expected = byteArrayOf(
            82, 73, 70, 70, 40, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32,
            16, 0, 0, 0, 1, 0, 1, 0, -64, 93, 0, 0, -128, -69, 0, 0,
            2, 0, 16, 0, 100, 97, 116, 97, 4, 0, 0, 0,
        )
        assertArrayEquals(expected, Api.wavHeader(4, 24000))
    }
}
