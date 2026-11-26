package vn.doi18.lachanso

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.app.AppOpsManager
import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationManagerCompat

/** Kiểm tra từng quyền mà ba lớp bảo vệ cần. */
object Quyen {
    val CUOC_GOI = arrayOf(Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG, Manifest.permission.READ_CONTACTS)

    fun co(c: Context, q: String) = c.checkSelfPermission(q) == PackageManager.PERMISSION_GRANTED
    fun coTatCa(c: Context, qs: Array<String>) = qs.all { co(c, it) }

    fun sangLocCuocGoi(c: Context) = c.getSystemService(RoleManager::class.java).isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
    fun docThongBao(c: Context) = c.packageName in NotificationManagerCompat.getEnabledListenerPackages(c)
    /** Thông báo của app còn bật, và riêng kênh "Cảnh báo lừa đảo" chưa bị tắt. */
    fun guiThongBao(c: Context): Boolean {
        val nm = NotificationManagerCompat.from(c)
        if (!nm.areNotificationsEnabled()) return false
        val kenh = nm.getNotificationChannel(ThongBao.KENH_CANH_BAO) ?: return true
        // Kênh bị hạ mức thì cảnh báo không còn nổi lên và không mở được toàn màn hình.
        return kenh.importance >= android.app.NotificationManager.IMPORTANCE_HIGH
    }
    /** Android 14 trở lên: quyền hiện thông báo toàn màn hình, đường dự phòng khi máy không cho mở màn hình từ nền. */
    fun toanManHinh(c: Context) =
        Build.VERSION.SDK_INT < 34 || c.getSystemService(android.app.NotificationManager::class.java).canUseFullScreenIntent()
    fun hienTrenAppKhac(c: Context) = Settings.canDrawOverlays(c)
    fun boQuaTietKiemPin(c: Context) = c.getSystemService(PowerManager::class.java).isIgnoringBatteryOptimizations(c.packageName)

    fun xemAppDangMo(c: Context): Boolean {
        val ops = c.getSystemService(AppOpsManager::class.java)
        return ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.packageName) == AppOpsManager.MODE_ALLOWED
    }

    fun laXiaomi() = Build.MANUFACTURER.lowercase() in setOf("xiaomi", "redmi", "poco")

    fun lop1(c: Context) = sangLocCuocGoi(c) && coTatCa(c, CUOC_GOI)
    fun lop2(c: Context) = docThongBao(c) && guiThongBao(c)
    fun lop3(c: Context) = xemAppDangMo(c) && hienTrenAppKhac(c)
    fun soLopDaBat(c: Context) = listOf(lop1(c), lop2(c), lop3(c)).count { it }
}

/** N6, màn A02: dẫn người dùng bật từng quyền, mỗi quyền một dòng, nói rõ dùng để làm gì. */
class ThietLapActivity : Activity() {
    private class Buoc(val ten: String, val moTa: String, val xong: () -> Boolean, val bat: () -> Unit)

    private val MA_QUYEN = 11
    private val MA_VAI_TRO = 12
    private val MA_THU_MUC = 13
    private var hoiSauKhiVe: String? = null

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setContentView(R.layout.thiet_lap)
        findViewById<Button>(R.id.nutXong).setOnClickListener { finish() }
    }

    override fun onResume() {
        super.onResume()
        DichVuLaChan.batDau(this)
        findViewById<TextView>(R.id.ghiChu).text = "Lá chắn không lưu nội dung cuộc gọi, tin nhắn. Bản ghi âm chỉ được gửi đi chép lời sau một cuộc gọi đáng ngờ, và chỉ khi ${xung().ban} đã chọn thư mục ghi âm ở dưới."
        hoiSauKhiVe?.let { k ->
            hoiSauKhiVe = null
            AlertDialog.Builder(this)
                .setMessage("Đã bật xong mục vừa rồi chưa?")
                .setPositiveButton("Đã bật") { _, _ -> CaiDat.datDaXacNhan(this, k, true); ve() }
                .setNegativeButton("Chưa", null)
                .show()
        }
        ve()
    }

    private fun mo(i: Intent, duPhong: Intent? = null) {
        try {
            startActivity(i)
        } catch (e: Exception) {
            try { startActivity(duPhong ?: chiTietApp()) } catch (_: Exception) {}
        }
    }

    private fun chiTietApp() = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))

    private fun xin(vararg q: String) = requestPermissions(arrayOf(*q), MA_QUYEN)

    private fun ve() {
        val c = this
        val ds = findViewById<LinearLayout>(R.id.danhSach)
        ds.removeAllViews()
        findViewById<TextView>(R.id.tienDo).text = "Đã bật ${Quyen.soLopDaBat(c)}/3"

        nhom(ds, "1 · Lá chắn cuộc gọi", Quyen.lop1(c))
        dong(ds, Buoc("Nhận diện cuộc gọi lạ", "Android cho Lá chắn biết số đang gọi tới để tra. Lá chắn không chặn cuộc gọi nào.", { Quyen.sangLocCuocGoi(c) }) {
            try {
                @Suppress("DEPRECATION")
                startActivityForResult(getSystemService(RoleManager::class.java).createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), MA_VAI_TRO)
            } catch (e: Exception) {
                NhatKy.ghi(c, "Máy không mở được màn xin vai trò sàng lọc cuộc gọi")
            }
        })
        dong(ds, Buoc("Biết số nào là số quen", "Đọc trạng thái cuộc gọi, nhật ký cuộc gọi và danh bạ để không làm phiền khi người quen gọi.", { Quyen.coTatCa(c, Quyen.CUOC_GOI) }) { xin(*Quyen.CUOC_GOI) })

        nhom(ds, "2 · Lá chắn tin nhắn", Quyen.lop2(c))
        dong(ds, Buoc("Đọc thông báo tin nhắn", "Để phát hiện tin lừa đảo. Bỏ qua mọi tin chứa mã xác thực (OTP).", { Quyen.docThongBao(c) }) {
            mo(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        })
        dong(ds, Buoc("Gửi cảnh báo", "Cho phép Lá chắn hiện thông báo khi thấy nguy hiểm.", { Quyen.guiThongBao(c) }) {
            // Đã có quyền mà vẫn chưa đạt: kênh "Cảnh báo lừa đảo" đang bị tắt, phải bật trong cài đặt thông báo.
            if (Build.VERSION.SDK_INT >= 33 && !Quyen.co(c, Manifest.permission.POST_NOTIFICATIONS)) xin(Manifest.permission.POST_NOTIFICATIONS)
            else mo(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, packageName))
        })
        if (Build.VERSION.SDK_INT >= 34) {
            dong(ds, Buoc("Cảnh báo toàn màn hình", "Để câu hỏi của Bé Nai và màn “Dừng lại” tự hiện lên khi máy đang khóa.", { Quyen.toanManHinh(c) }) {
                mo(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:$packageName")))
            })
        }

        nhom(ds, "3 · Nhắc trước khi chuyển tiền", Quyen.lop3(c))
        dong(ds, Buoc("Biết ứng dụng nào đang mở", "Chỉ xem tên ứng dụng, chỉ trong lúc có cuộc gọi lạ. Không đọc nội dung ứng dụng.", { Quyen.xemAppDangMo(c) }) {
            mo(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        })
        dong(ds, Buoc("Hiện cảnh báo trên ứng dụng khác", "Để thẻ cảnh báo và màn “Dừng lại” hiện lên đúng lúc.", { Quyen.hienTrenAppKhac(c) }) {
            mo(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        })

        nhom(ds, "Tùy chọn", null)
        dong(ds, Buoc("Trả lời bằng giọng nói", "Dùng micro để nghe ${xung().ban} nói “có” hoặc “không”, hoặc kể lại cuộc gọi.", { Quyen.co(c, Manifest.permission.RECORD_AUDIO) }) { xin(Manifest.permission.RECORD_AUDIO) })
        dong(ds, Buoc("Cúp máy giúp khi nguy hiểm", "Cho nút “Cúp máy ngay” trên màn “Dừng lại” hoạt động.", { Quyen.co(c, Manifest.permission.ANSWER_PHONE_CALLS) }) { xin(Manifest.permission.ANSWER_PHONE_CALLS) })
        // Bật tự động ghi âm trong app gọi điện của máy: Lá chắn không tự thu âm, chỉ đọc bản ghi máy đã lưu.
        val googleDialer = c.getSystemService(android.telecom.TelecomManager::class.java)?.defaultDialerPackage == "com.google.android.dialer"
        dong(ds, Buoc("Bật tự động ghi âm cuộc gọi",
            if (googleDialer) "Máy dùng app Điện thoại của Google: bản ghi nằm riêng trong app đó, Lá chắn không đọc được. Sau cuộc gọi lạ, Bé Nai sẽ hỏi ${xung().ban} một câu thay cho việc nghe bản ghi."
            else "Mở cài đặt cuộc gọi của máy, chọn “Ghi âm cuộc gọi” rồi bật tự động ghi âm cho số lạ. Có bản ghi thì AI phân tích được nội dung cuộc gọi.",
            { CaiDat.daXacNhan(c, "ghi-am-tu-dong") }) {
            hoiSauKhiVe = "ghi-am-tu-dong"
            // App gọi điện của Google: màn ghi âm của MIUI không có tác dụng, mở cài đặt của chính app Google.
            // Máy khác: thử màn ghi âm của MIUI, rồi cài đặt cuộc gọi của app gọi điện mặc định, rồi Cài đặt của máy.
            val dich = listOfNotNull(
                if (googleDialer) null else Intent().setClassName("com.android.phone", "com.android.phone.settings.CallRecordSetting"),
                Intent(android.telecom.TelecomManager.ACTION_SHOW_CALL_SETTINGS),
                Intent(Settings.ACTION_SETTINGS),
            )
            dich.firstOrNull { runCatching { startActivity(it) }.isSuccess } ?: NhatKy.ghi(c, "Máy không mở được cài đặt ghi âm cuộc gọi")
        })
        if (!googleDialer) dong(ds, Buoc("Thư mục ghi âm cuộc gọi", "Nếu máy tự ghi âm cuộc gọi, chọn thư mục chứa bản ghi để AI chép lời. Lá chắn không tự thu âm.", { CaiDat.thuMucGhiAm(c).isNotBlank() }) {
            try {
                @Suppress("DEPRECATION")
                // Mở sẵn thư mục ghi âm cuộc gọi của máy Xiaomi nếu có, để chỉ còn một lần bấm.
                val i = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
                if (Quyen.laXiaomi()) i.putExtra(
                    android.provider.DocumentsContract.EXTRA_INITIAL_URI,
                    android.provider.DocumentsContract.buildDocumentUri("com.android.externalstorage.documents", "primary:MIUI/sound_recorder/call_rec"),
                )
                startActivityForResult(i, MA_THU_MUC)
            } catch (e: Exception) {
                NhatKy.ghi(c, "Máy không mở được màn chọn thư mục")
            }
        })

        nhom(ds, "Giữ Lá chắn không bị máy tắt", null)
        dong(ds, Buoc("Không tắt để tiết kiệm pin", "Cho Lá chắn chạy nền không giới hạn.", { Quyen.boQuaTietKiemPin(c) }) {
            mo(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName")), Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        })
        if (Quyen.laXiaomi()) {
            dong(ds, Buoc("Tiết kiệm pin: Không hạn chế (máy Xiaomi)", "Chọn “Không hạn chế” để máy không cho Lá chắn ngủ đông. Nếu ngủ đông, lúc có cuộc gọi lạ Lá chắn không kịp tra số.", { CaiDat.daXacNhan(c, "pin-khong-han-che") }) {
                hoiSauKhiVe = "pin-khong-han-che"
                val nhan = applicationInfo.loadLabel(packageManager).toString()
                listOf(
                    Intent().setComponent(ComponentName("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity"))
                        .putExtra("package_name", packageName).putExtra("package_label", nhan),
                    chiTietApp(),
                ).firstOrNull { runCatching { startActivity(it) }.isSuccess }
            })
            dong(ds, Buoc("Tự khởi chạy (máy Xiaomi)", "Bật “Tự khởi chạy” cho Lá chắn số để máy không tắt lá chắn.", { CaiDat.daXacNhan(c, "tu-khoi-chay") }) {
                hoiSauKhiVe = "tu-khoi-chay"
                mo(Intent().setComponent(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")))
            })
            dong(ds, Buoc("Hiện cửa sổ khi chạy nền (máy Xiaomi)", "Trong “Quyền khác”, bật “Hiển thị cửa sổ bật lên khi chạy trong nền” và “Hiển thị trên màn hình khóa”.", { CaiDat.daXacNhan(c, "cua-so-nen") }) {
                hoiSauKhiVe = "cua-so-nen"
                mo(
                    Intent("miui.intent.action.APP_PERM_EDITOR")
                        .setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity")
                        .putExtra("extra_pkgname", packageName)
                )
            })
        }
    }

    private fun nhom(ds: LinearLayout, ten: String, xong: Boolean?) {
        val t = TextView(this, null, 0, R.style.Chu_Muc)
        t.text = when (xong) {
            true -> "$ten · ĐÃ BẬT"
            false -> "$ten · CHƯA XONG"
            null -> ten
        }.uppercase()
        if (xong == true) t.setTextColor(getColor(R.color.safe))
        val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        lp.topMargin = (22 * resources.displayMetrics.density).toInt()
        ds.addView(t, lp)
    }

    private fun dong(ds: LinearLayout, b: Buoc) {
        val v = LayoutInflater.from(this).inflate(R.layout.dong_thiet_lap, ds, false)
        v.findViewById<TextView>(R.id.tieuDe).text = b.ten
        v.findViewById<TextView>(R.id.moTa).text = b.moTa
        val xong = b.xong()
        v.findViewById<View>(R.id.daBat).visibility = if (xong) View.VISIBLE else View.GONE
        v.findViewById<Button>(R.id.nutBat).apply {
            visibility = if (xong) View.GONE else View.VISIBLE
            setOnClickListener { b.bat() }
        }
        ds.addView(v)
    }

    override fun onRequestPermissionsResult(ma: Int, quyen: Array<out String>, kq: IntArray) {
        super.onRequestPermissionsResult(ma, quyen, kq)
        // Người dùng đã chọn "không hỏi lại": đưa tới trang quyền của ứng dụng.
        val biTuChoiHan = quyen.indices.any { kq.getOrNull(it) != PackageManager.PERMISSION_GRANTED && !shouldShowRequestPermissionRationale(quyen[it]) }
        if (biTuChoiHan) mo(chiTietApp())
        ve()
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(ma: Int, kq: Int, d: Intent?) {
        super.onActivityResult(ma, kq, d)
        if (ma == MA_THU_MUC && kq == RESULT_OK) {
            d?.data?.let { uri ->
                try {
                    contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    CaiDat.datThuMucGhiAm(this, uri.toString())
                    NhatKy.ghi(this, "Đã chọn thư mục ghi âm cuộc gọi")
                } catch (e: Exception) {
                    NhatKy.ghi(this, "Không giữ được quyền đọc thư mục ghi âm")
                }
            }
        }
        ve()
    }
}
