// Ba lớp bảo vệ (A02a, A02b, E01a, A01b).
// Android (Mảng 1) trả trạng thái thật qua LCSNative.layers() = {"calls","messages","banking","asleep"}
// và mở đúng màn xin quyền qua LCSNative.enableLayer(key). Trình duyệt lưu trong máy để trình diễn.
import { useCallback, useEffect, useState } from 'react'

export const LAYERS = [
  { key: 'calls', icon: 'phone-in', title: 'Lá chắn cuộc gọi', sub: 'Nhận diện cuộc gọi lạ · Phân tích bản ghi nếu điện thoại có ghi âm' },
  { key: 'messages', icon: 'message', title: 'Lá chắn tin nhắn', sub: 'Đọc thông báo tin nhắn để phát hiện lừa đảo. Bỏ qua tin chứa mã xác thực (OTP).' },
  { key: 'banking', icon: 'hand', title: 'Nhắc trước khi chuyển tiền', sub: 'Cho phép Lá chắn nhắc bà khi bà mở ứng dụng ngân hàng sau cuộc gọi lạ.' },
]

const KEY = 'lcs.layers'
const DEFAULT = { calls: true, messages: true, banking: true, asleep: false }

export function readLayers() {
  try {
    const s = window.LCSNative?.layers?.()
    if (s) return { ...DEFAULT, ...(typeof s === 'string' ? JSON.parse(s) : s) }
  } catch { /* Android trả sai: dùng bản lưu trong máy */ }
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return { ...DEFAULT } }
}

function write(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* bộ nhớ đầy */ }
  window.dispatchEvent(new Event('lcs-layers'))
}

// Bảng mô phỏng dùng: "Máy tắt Lá chắn", "Thiết lập lần đầu", "Đặt lại demo"
export function setLayersForDemo(next) {
  if (next === null) {
    try { localStorage.removeItem(KEY) } catch { /* bỏ qua */ }
    window.dispatchEvent(new Event('lcs-layers'))
    return
  }
  write({ ...readLayers(), ...next })
}

export function useLayers() {
  const [state, setState] = useState(readLayers)
  useEffect(() => {
    // Người dùng cấp quyền ở màn hệ thống rồi quay lại app: đọc lại trạng thái
    const again = () => setState(readLayers())
    window.addEventListener('lcs-layers', again)
    window.addEventListener('focus', again)
    document.addEventListener('visibilitychange', again)
    return () => {
      window.removeEventListener('lcs-layers', again)
      window.removeEventListener('focus', again)
      document.removeEventListener('visibilitychange', again)
    }
  }, [])

  const enable = useCallback((key) => {
    if (window.LCSNative?.enableLayer) {
      try { window.LCSNative.enableLayer(key) } catch { /* Android tự báo lỗi */ }
      setTimeout(() => setState(readLayers()), 800)
      return
    }
    write({ ...readLayers(), [key]: true, asleep: false })
  }, [])

  const wakeUp = useCallback(() => {
    if (window.LCSNative?.enableLayer) {
      const off = LAYERS.find((l) => !readLayers()[l.key])
      try { window.LCSNative.enableLayer(off ? off.key : 'calls') } catch { /* Android tự báo lỗi */ }
      setTimeout(() => setState(readLayers()), 800)
      return
    }
    write({ calls: true, messages: true, banking: true, asleep: false })
  }, [])

  const on = LAYERS.filter((l) => state[l.key]).length
  return { state, on, asleep: Boolean(state.asleep) || on < LAYERS.length, enable, wakeUp }
}
