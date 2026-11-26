// Cầu nối với ứng dụng Android (KE-HOACH-MANG-2-3.md mục 4.4).
// Android gắn đối tượng window.LCSNative bằng addJavascriptInterface. Mở trên trình duyệt thì dùng cách thay thế.

const N = () => window.LCSNative

function parse(v) {
  if (typeof v !== 'string') return v
  try { return JSON.parse(v) } catch { return v }
}

async function bridgeJson(method, ...args) {
  const bridge = N()
  if (!bridge?.[method]) throw new Error('Bạn cập nhật app Lá chắn số rồi thử lại nhé.')
  const result = parse(await bridge[method](...args))
  if (!result || typeof result !== 'object') throw new Error('Chưa nhận được phản hồi từ app. Bạn thử lại nhé.')
  if (result.detail) throw new Error(result.detail)
  return result
}

export const native = {
  available: () => Boolean(N()),

  recentEvents: () => bridgeJson('recentEvents'),
  reportEvent: (id, story) => bridgeJson('reportEvent', id, story),
  withdrawReport: (id) => bridgeJson('withdrawReport', id),

  speak(text) {
    if (N()?.speak) return N().speak(text)
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'vi-VN'
    u.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  },

  stopSpeaking() {
    if (N()?.stopSpeaking) return N().stopSpeaking()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  },

  // Trả về chữ nghe được, hoặc null nếu máy không hỗ trợ
  async listen() {
    if (N()?.listen) return await N().listen()
    return null
  },

  call(phone) {
    const p = String(phone || '').replace(/\s/g, '')
    if (N()?.call) return N().call(p)
    window.location.href = 'tel:' + p
  },

  // true nếu máy đã chặn được số
  blockNumber(phone) {
    if (N()?.blockNumber) return Boolean(parse(N().blockNumber(String(phone).replace(/\s/g, ''))))
    return false
  },

  // A10b "Cúp máy ngay": Android ngắt cuộc gọi đang diễn ra (TelecomManager.endCall)
  endCall() {
    if (N()?.endCall) return N().endCall()
    return false
  },

  // [{phone, at, durationSec}] mới nhất trước
  async recentCalls() {
    if (N()?.recentCalls) return parse(await N().recentCalls()) || []
    return [{ phone: '0912 345 678', at: '10:38', durationSec: 252 }]
  },
}
