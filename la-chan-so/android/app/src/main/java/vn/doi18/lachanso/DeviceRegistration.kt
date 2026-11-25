package vn.doi18.lachanso

import android.content.Context
import org.json.JSONObject

internal class DeviceRegistration(val id: String, private val secret: String) {
    fun sign(value: String) = ReceiptRules.sign(secret, value)

    companion object {
        @Synchronized fun get(c: Context): DeviceRegistration? {
            val server = CaiDat.mayChu(c)
            if (server.isBlank()) return null
            val prefs = c.getSharedPreferences("device-" + ReceiptRules.hash(server), Context.MODE_PRIVATE)
            val id = prefs.getString("deviceId", null)
            val secret = prefs.getString("deviceSecret", null)
            if (id != null && secret != null) return DeviceRegistration(id, secret)
            val response = MayChu.gui(c, "/api/devices", JSONObject()) ?: return null
            val newId = response.optString("deviceId")
            val newSecret = response.optString("deviceSecret")
            if (!newId.matches(Regex("[a-fA-F0-9]{16}")) || response.isNull("deviceSecret") || newSecret.isBlank()) return null
            if (!prefs.edit().putString("deviceId", newId).putString("deviceSecret", newSecret).commit()) return null
            return DeviceRegistration(newId, newSecret)
        }
    }
}
