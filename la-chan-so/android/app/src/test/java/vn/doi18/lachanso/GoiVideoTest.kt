package vn.doi18.lachanso

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Trang mở đầu của màn gọi video và bài học lấy từ Intent (màn để exported): chỉ nhận hai trang của chính app. */
class GoiVideoTest {
    @Test fun nhanTrangCuaApp() {
        for (t in listOf("prototype/hoc.html", "prototype/video-call.html", "prototype/video-call.html?canh=minh-1", "prototype/video-call.html?canh=tu-9&ve=hoc.html%3Fbai%3D9", "prototype/hoc.html#bai-3"))
            assertEquals(t, GoiVideoActivity.trangHopLe(t))
    }

    @Test fun boTrangLa() {
        for (t in listOf(null, "", "prototype/index.html", "prototype/hoc.html/../../x", "prototype/../ds.css", "/prototype/hoc.html", "https://evil.example/prototype/hoc.html",
            "//evil.example/prototype/hoc.html", "@evil.example/prototype/hoc.html", "prototype/hoc.html?u=https://evil.example", "prototype/hoc.html?a=//b", "prototype/hoc.html\\x",
            "prototype/hoc.htmlx", "prototype/hoc.html?a b", "prototype/hoc.html\n", "javascript:alert(1)", "prototype/video-call.html?canh=<script>", "prototype/hoc.html?" + "a".repeat(301)))
            assertNull(t, GoiVideoActivity.trangHopLe(t))
    }
}
