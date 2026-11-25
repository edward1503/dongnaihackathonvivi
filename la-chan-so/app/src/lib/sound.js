// Tiếng và rung trên điện thoại.
//
// Trình duyệt điện thoại chặn tự phát tiếng khi người dùng chưa chạm vào trang. Khi màn đổi do sự kiện từ xa
// (laptop bấm "Có cuộc gọi lạ"), Bé Nai vẫn phải nói được. Vì vậy app dùng MỘT phần tử <audio> và một AudioContext,
// mở khóa cả hai ngay lần chạm đầu tiên (unlockAudio), rồi dùng lại cho mọi câu sau.

const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='
let el = null
let ctx = null
let unlocked = false

function audio() {
  if (!el) {
    el = new Audio()
    el.preload = 'auto'
  }
  return el
}

function context() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!ctx && AC) ctx = new AC()
  return ctx
}

export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  try {
    const a = audio()
    a.src = SILENT
    a.play().then(() => a.pause()).catch(() => { unlocked = false })
  } catch { unlocked = false }
  try { context()?.resume() } catch { /* không có Web Audio */ }
}

export function installAudioUnlock() {
  const once = () => {
    unlockAudio()
    window.removeEventListener('pointerdown', once, true)
    window.removeEventListener('keydown', once, true)
  }
  window.addEventListener('pointerdown', once, true)
  window.addEventListener('keydown', once, true)
}

export function playSound(src) {
  try {
    const a = audio()
    a.pause()
    a.src = src
    a.currentTime = 0
    return a.play().catch(() => {})
  } catch { return Promise.resolve() }
}

export function stopSound() {
  try { el?.pause() } catch { /* bỏ qua */ }
}

// Tiếng chuông điện thoại tổng hợp (hai tần số 440 và 480 Hz như chuông thường), không cần tệp âm thanh
function ringOnce() {
  const c = context()
  if (!c || c.state !== 'running') return
  const t = c.currentTime
  const gain = c.createGain()
  gain.gain.value = 0
  gain.connect(c.destination)
  for (const f of [440, 480]) {
    const o = c.createOscillator()
    o.frequency.value = f
    o.connect(gain)
    o.start(t)
    o.stop(t + 1.3)
  }
  for (const [start, end] of [[0, 0.5], [0.7, 1.2]]) {
    gain.gain.setValueAtTime(0.0001, t + start)
    gain.gain.exponentialRampToValueAtTime(0.12, t + start + 0.03)
    gain.gain.setValueAtTime(0.12, t + end - 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + end)
  }
}

function vibrate(pattern) {
  try { navigator.vibrate?.(pattern) } catch { /* máy không rung được */ }
}

// Đổ chuông cho tới khi gọi hàm trả về. danger: rung mạnh hơn để bà chú ý thẻ cảnh báo.
export function startRinging({ danger = false } = {}) {
  let stopped = false
  const tick = () => {
    if (stopped) return
    ringOnce()
    vibrate(danger ? [500, 150, 500, 150, 500] : [400, 200, 400])
  }
  tick()
  const timer = setInterval(tick, 3000)
  return () => {
    stopped = true
    clearInterval(timer)
    vibrate(0)
  }
}

export function buzz(pattern = [200, 100, 200]) {
  vibrate(pattern)
}
