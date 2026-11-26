package vn.doi18.lachanso

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import java.io.File

/**
 * Nhận một bản ghi âm cuộc gọi được chia sẻ sang Lá chắn (máy dùng app Điện thoại của Google: bản ghi nằm riêng trong app đó,
 * Lá chắn không tự đọc được). Gắn bản ghi vào cuộc gọi ĐẾN gần nhất trong nhật ký cuộc gọi rồi mở màn phân tích sau cuộc gọi.
 * Đây là đường phụ cho người nhà làm giúp; đường chính vẫn là câu hỏi của Bé Nai.
 */
class ShareRecordingActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val source = sharedUri(intent)
        if (source == null) return done("Không nhận được tệp ghi âm")
        if (CaiDat.mayChu(this).isBlank()) return done("Cần kết nối máy chủ của Lá chắn để AI nghe bản ghi")
        val now = System.currentTimeMillis()
        val event = ReceivedEvents.list(this).filter { it.type == "call_log" && now - it.time <= MAX_AGE_MS }.maxByOrNull { it.time }
            ?: return done("Không thấy cuộc gọi đến nào trong 6 giờ qua để gắn bản ghi")
        val mime = intent.type?.takeIf { it.startsWith("audio/") } ?: contentResolver.getType(source) ?: "audio/mpeg"
        val copy = try {
            copyToApp(source, mime)
        } catch (e: Exception) {
            NhatKy.ghi(this, "Không chép được bản ghi được chia sẻ (${e.javaClass.simpleName})")
            return done("Không đọc được tệp ghi âm này")
        }
        ReceivedEvents.bindSharedRecording(this, event, copy, mime)
        NhatKy.ghi(this, "Nhận bản ghi được chia sẻ cho cuộc gọi đến …${event.target.takeLast(3)}")
        startActivity(
            Intent(this, HoiSauCuocGoiActivity::class.java)
                .putExtra("so", event.target).putExtra("giay", event.duration ?: 0L).putExtra("den", true)
                .putExtra("ma", event.time).putExtra("eventId", event.id).putExtra("requested", false)
                .putExtra("khongHoi", false).putExtra("tinhLuotHoi", false)
                .putExtra("banGhi", Uri.fromFile(copy).toString()).putExtra("banGhiKieu", mime)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        finish()
    }

    private fun sharedUri(i: Intent?): Uri? {
        if (i?.action != Intent.ACTION_SEND) return null
        @Suppress("DEPRECATION")
        return i.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri ?: i.clipData?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.uri
    }

    /** Quyền đọc tệp được chia sẻ chỉ tạm thời: chép vào vùng riêng của app, giữ tối đa 5 bản gần nhất. */
    private fun copyToApp(source: Uri, mime: String): File {
        val dir = File(filesDir, "shared-recordings").apply { mkdirs() }
        val ext = when { "wav" in mime -> "wav"; "ogg" in mime || "opus" in mime -> "ogg"; "amr" in mime -> "amr"; "mpeg" in mime || "mp3" in mime -> "mp3"; else -> "m4a" }
        val out = File(dir, "${System.currentTimeMillis()}.$ext")
        contentResolver.openInputStream(source).use { input ->
            requireNotNull(input)
            out.outputStream().use { var total = 0L; val buf = ByteArray(64 * 1024)
                while (true) { val n = input.read(buf); if (n < 0) break; total += n; require(total <= MAX_BYTES); it.write(buf, 0, n) } }
        }
        require(out.length() > 0)
        dir.listFiles()?.sortedByDescending { it.lastModified() }?.drop(5)?.forEach { it.delete() }
        return out
    }

    private fun done(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        finish()
    }

    private companion object {
        const val MAX_AGE_MS = 6L * 60 * 60 * 1000
        const val MAX_BYTES = 30L * 1024 * 1024
    }
}
