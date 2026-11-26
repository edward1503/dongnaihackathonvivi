package vn.doi18.lachanso

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/** The parent foreground service owns this watcher. Only one request is in flight per generation. */
internal class FamilyAlertWatcher(private val context: Context) {
    private val handler = Handler(Looper.getMainLooper())
    private var generation = 0
    private var scope = ""
    private val poll = Runnable { fetch() }

    fun configure() {
        val next = if (CaiDat.relative(context) && CaiDat.familyCode(context) == Api.ROOM)
            CaiDat.mayChu(context) else ""
        if (next == scope) return
        stop()
        if (next.isEmpty()) return
        scope = next
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(FAMILY_CHANNEL, "Cảnh báo của gia đình", NotificationManager.IMPORTANCE_HIGH).apply {
                enableVibration(true)
            }
        )
        handler.post(poll)
    }

    fun stop() {
        generation++
        scope = ""
        handler.removeCallbacks(poll)
    }

    private fun fetch() {
        val current = generation
        Luong.nen {
            val rows = runCatching {
                val snapshot = FamilySession.list(context)
                (0 until snapshot.length()).mapNotNull { i ->
                    val row = snapshot.optJSONObject(i) ?: return@mapNotNull null
                    if (!row.isNull("reply") || row.optString("source") == "demo") return@mapNotNull null
                    parseFamilyNotice(row.optString("id"), row.optString("at"), row.optString("level"), row.optString("number"), row.optString("kind"))
                }
            }.getOrNull()
            handler.post {
                if (current != generation) return@post
                if (rows != null && CaiDat.relative(context) && scope == CaiDat.mayChu(context)) notifyNew(rows)
                handler.postDelayed(poll, 15_000)
            }
        }
    }

    private fun notifyNew(rows: List<FamilyNotice>) {
        val manager = context.getSystemService(NotificationManager::class.java)
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled() ||
            manager.getNotificationChannel(FAMILY_CHANNEL)?.importance == NotificationManager.IMPORTANCE_NONE) return
        val prefs = context.getSharedPreferences("family-notifications", Context.MODE_PRIVATE)
        val key = ReceiptRules.hash(scope + "|" + CaiDat.familyCode(context))
        val notified = prefs.getStringSet(key, emptySet()).orEmpty().toMutableSet()
        val since = CaiDat.familySince(context)
        val baseline = "$key-since"
        if (prefs.getLong(baseline, -1) != since) notified.addAll(rows.filter { it.time < since }.map { it.id })
        for (notice in newFamilyNotices(rows, notified, 0)) {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                data = Uri.parse("lachanso://family/" + notice.id)
                putExtra("route", "#/canh-bao/" + notice.id)
            }
            val notification = NotificationCompat.Builder(context, FAMILY_CHANNEL)
                .setSmallIcon(R.drawable.ic_khien)
                .setContentTitle(if (notice.isMessage) "Mẹ vừa nhận tin nhắn đáng ngờ" else "Mẹ vừa gặp cuộc gọi đáng ngờ")
                .setContentText(notice.text)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(ThongBao.moManHinh(context, intent, 0))
                .build()
            manager.notify(notice.id, FAMILY_NOTIFICATION_ID, notification)
            notified.add(notice.id)
        }
        // A replied alert cannot become unanswered. Drop IDs no longer in the snapshot.
        prefs.edit().putLong(baseline, since).putStringSet(key, notified.intersect(rows.map { it.id }.toSet())).apply()
    }

    companion object {
        private const val FAMILY_NOTIFICATION_ID = 6801
        fun clear(context: Context) {
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.activeNotifications.filter { it.id == FAMILY_NOTIFICATION_ID }.forEach { manager.cancel(it.tag, it.id) }
        }
    }
}
