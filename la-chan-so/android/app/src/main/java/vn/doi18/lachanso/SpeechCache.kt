package vn.doi18.lachanso

import java.io.File
import java.security.MessageDigest

internal fun speechFileName(text: String): String =
    MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) } + ".wav"

internal fun saveSpeech(file: File, pcm: ByteArray, sampleRate: Int) {
    require(pcm.isNotEmpty() && pcm.size % 2 == 0 && sampleRate > 0)
    val directory = requireNotNull(file.parentFile)
    directory.mkdirs()
    val temporary = File.createTempFile("speech-", ".tmp", directory)
    try {
        temporary.outputStream().use { stream ->
            stream.write(Api.wavHeader(pcm.size, sampleRate))
            stream.write(pcm)
        }
        check(temporary.renameTo(file))
    } finally {
        temporary.delete()
    }
}
