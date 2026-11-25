package vn.doi18.lachanso

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.media.MediaPlayer
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.telecom.TelecomManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.io.File
import java.util.Base64
import java.util.Locale

internal class AppBridge(private val activity: Activity, private val web: WebView) {
    companion object { const val AUDIO_REQUEST = 501 }

    private var reader: TextToSpeech? = null
    private var player: MediaPlayer? = null
    private var generation = 0L
    private var speechTimeout: Runnable? = null
    private var ready = false
    private var queuedText: String? = null
    private var recognizer: SpeechRecognizer? = null
    private var listening: String? = null
    private var awaitingPermission = false
    private val handler = Handler(Looper.getMainLooper())
    private val timeout = Runnable { finishListening(null) }

    private fun ui(action: () -> Unit) = activity.runOnUiThread {
        if (!activity.isFinishing && !activity.isDestroyed) action()
    }

    private fun resolve(id: String, json: String) = ui {
        web.evaluateJavascript("window.__lcsResolve?.(${JSONObject.quote(id)}, $json)", null)
    }

    @JavascriptInterface fun speak(text: String) = ui {
        cancelSpeech()
        if (text.isBlank()) return@ui
        val request = generation
        val context = activity.applicationContext
        val file = File(File(context.cacheDir, "speak"), speechFileName(text))
        if (file.isFile && playSpeech(file, text)) return@ui
        if (CaiDat.mayChu(context).isBlank()) {
            readWithPhone(text)
            return@ui
        }

        val deadline = Runnable {
            cancelSpeech()
            readWithPhone(text)
        }
        speechTimeout = deadline
        handler.postDelayed(deadline, 20_000)
        Luong.nen {
            val saved = runCatching {
                val reply = Api.roleplaySpeak(context, text, "be-nai") ?: return@runCatching false
                val pcm = Base64.getDecoder().decode(reply.getString("pcm"))
                saveSpeech(file, pcm, reply.getInt("tanSo"))
                true
            }.getOrDefault(false)
            ui {
                if (generation == request) {
                    handler.removeCallbacks(deadline)
                    speechTimeout = null
                    if (!saved || !playSpeech(file, text)) readWithPhone(text)
                }
            }
        }
    }

    private fun playSpeech(file: File, text: String): Boolean {
        val current = MediaPlayer()
        player = current
        return try {
            current.setOnCompletionListener {
                if (player === current) releasePlayer()
            }
            current.setOnErrorListener { _, _, _ ->
                if (player === current) {
                    releasePlayer()
                    file.delete()
                    readWithPhone(text)
                }
                true
            }
            current.setDataSource(file.absolutePath)
            current.prepare()
            current.start()
            true
        } catch (_: Exception) {
            releasePlayer()
            file.delete()
            false
        }
    }

    private fun releasePlayer() {
        player?.release()
        player = null
    }

    private fun readWithPhone(text: String) {
        queuedText = text
        if (reader == null) {
            reader = TextToSpeech(activity.applicationContext) { status ->
                ui {
                    ready = status == TextToSpeech.SUCCESS &&
                        (reader?.setLanguage(Locale("vi", "VN")) ?: -1) >= 0
                    if (ready) {
                        reader?.setSpeechRate(0.9f)
                        readQueuedText()
                    } else {
                        reader?.shutdown()
                        reader = null
                        queuedText = null
                    }
                }
            }
        } else if (ready) readQueuedText()
    }

    private fun readQueuedText() {
        queuedText?.let { reader?.speak(it, TextToSpeech.QUEUE_FLUSH, null, "react") }
        queuedText = null
    }

    @JavascriptInterface fun stopSpeaking() = ui { cancelSpeech() }

    private fun cancelSpeech() {
        generation++
        speechTimeout?.let { handler.removeCallbacks(it) }
        speechTimeout = null
        releasePlayer()
        queuedText = null
        reader?.stop()
    }

    @JavascriptInterface fun startListen(id: String) = ui {
        if (listening != null) {
            resolve(id, "null")
            return@ui
        }
        listening = id
        if (Quyen.co(activity, Manifest.permission.RECORD_AUDIO)) recognize()
        else {
            awaitingPermission = true
            activity.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), AUDIO_REQUEST)
        }
    }

    fun onAudioPermission() {
        awaitingPermission = false
        if (listening == null) return
        if (Quyen.co(activity, Manifest.permission.RECORD_AUDIO)) recognize() else finishListening(null)
    }

    private fun recognize() {
        val id = listening ?: return
        try {
            val service = SpeechRecognizer.createSpeechRecognizer(activity)
            recognizer = service
            service.setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: Bundle?) {
                    if (listening == id) finishListening(results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull())
                }
                override fun onError(error: Int) { if (listening == id) finishListening(null) }
                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(value: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onPartialResults(results: Bundle?) {}
                override fun onEvent(event: Int, params: Bundle?) {}
            })
            handler.postDelayed(timeout, 30_000)
            service.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "vi-VN"))
        } catch (_: Exception) { finishListening(null) }
    }

    private fun finishListening(text: String?) {
        val id = listening ?: return
        listening = null
        handler.removeCallbacks(timeout)
        recognizer?.destroy()
        recognizer = null
        resolve(id, text?.let(JSONObject::quote) ?: "null")
    }

    @JavascriptInterface fun call(phone: String) = ui {
        dialNumber(phone)?.let { activity.goiDien(it) }
    }

    @JavascriptInterface fun blockNumber(phone: String): Boolean {
        val number = cleanPhone(phone) ?: return false
        CaiDat.themSoChan(activity, number)
        return true
    }

    @JavascriptInterface fun startAnalyzeRecording(id: String, phone: String) {
        val context = activity.applicationContext
        Luong.nen {
            val result = runCatching {
                if (CaiDat.mayChu(context).isBlank()) return@runCatching null
                val number = cleanPhone(phone) ?: return@runCatching null
                val recording = GhiAm.timMoi(context, 0L, number, latestNamed = true) ?: return@runCatching null
                context.contentResolver.openInputStream(recording.uri)?.use {
                    Api.recordingResult(context, it, recording.kieu, !SoQuen.laQuen(context, number))
                }
            }.getOrNull()
            resolve(id, result?.let { JSONObject.quote(it.toString()) } ?: "null")
        }
    }

    @Suppress("DEPRECATION")
    @JavascriptInterface fun endCall(): Boolean = Quyen.co(activity, Manifest.permission.ANSWER_PHONE_CALLS) &&
        runCatching { activity.getSystemService(TelecomManager::class.java).endCall() }.getOrDefault(false)

    @JavascriptInterface fun dismissStop() { DungLai.thuLopPhu(activity.applicationContext) }

    @JavascriptInterface fun layers() = layersJson(Quyen.lop1(activity), Quyen.lop2(activity), Quyen.lop3(activity))

    @JavascriptInterface fun enableLayer(key: String) = ui {
        if (key in setOf("calls", "messages", "banking")) activity.startActivity(Intent(activity, ThietLapActivity::class.java))
    }

    @JavascriptInterface fun setVoiceAsk(on: Boolean) = CaiDat.datHoiBangGiong(activity, on)

    @JavascriptInterface fun openStory(scamType: String) = ui {
        val path = "prototype/hoc.html" + lessonSlug(scamType)?.let { "?kieu=$it" }.orEmpty()
        activity.startActivity(Intent(activity, GoiVideoActivity::class.java).putExtra("trang", path))
    }

    @JavascriptInterface fun weekStats() =
        """{"calls":0,"messages":0,"layersOn":${Quyen.soLopDaBat(activity)}}"""

    // App chỉ lưu mốc cuộc vừa xử lý, không lưu danh sách cuộc gọi.
    @JavascriptInterface fun startRecentCalls(id: String) = resolve(id, "[]")

    @JavascriptInterface fun saveRelative(name: String, phone: String) {
        CaiDat.datTenNguoiThan(activity, name)
        CaiDat.datSoNguoiThan(activity, phone)
    }

    @JavascriptInterface fun openAdvanced() = ui {
        activity.startActivity(Intent(activity, AdvancedSettingsActivity::class.java))
    }

    fun stop() {
        cancelSpeech()
        if (!awaitingPermission) finishListening(null)
    }

    fun close() {
        cancelSpeech()
        finishListening(null)
        reader?.shutdown()
        reader = null
    }
}
