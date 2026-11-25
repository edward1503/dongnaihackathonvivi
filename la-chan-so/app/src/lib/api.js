// Gọi máy chủ Lá chắn số. Hợp đồng dữ liệu: KE-HOACH-MANG-2-3.md mục 2.
//
// Địa chỉ máy chủ, theo thứ tự ưu tiên:
//   1. ?api=http://192.168.1.10:8000 trên địa chỉ trang (lưu lại cho các lần mở sau)
//   2. window.LCS_API_BASE (ứng dụng Android gán trước khi nạp trang)
//   3. VITE_API_BASE lúc build
//   4. cùng địa chỉ với trang (máy chủ phục vụ luôn app, hoặc proxy của Vite khi chạy dev)

function pickBase() {
  const fromUrl = new URLSearchParams(location.search).get('api')
  if (fromUrl) localStorage.setItem('lcs.api', fromUrl)
  const b = fromUrl || localStorage.getItem('lcs.api') || window.LCS_API_BASE || import.meta.env.VITE_API_BASE || ''
  if (!b && location.protocol === 'file:') return 'http://127.0.0.1:8000'
  return b.replace(/\/$/, '')
}

export const API_BASE = pickBase()

export class ApiError extends Error {
  constructor(message, status, offline) {
    super(message)
    this.status = status
    this.offline = offline
  }
}

async function req(path, { method = 'GET', body, form, timeout = 15000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      signal: ctrl.signal,
      headers: form ? undefined : { 'Content-Type': 'application/json' },
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError('Không có mạng', 0, true)
  } finally {
    clearTimeout(timer)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(typeof data.detail === 'string' ? data.detail : 'Có lỗi, bạn thử lại nhé', res.status, false)
  return data
}

export const api = {
  health: () => req('/api/health', { timeout: 5000 }),
  check: (value, kind) => req('/api/check', { method: 'POST', body: { value, kind } }),
  lookupPhone: (phone) => req(`/api/lookup/phone/${encodeURIComponent(phone)}`, { timeout: 5000 }),
  analyzeCall: (form) => req('/api/analyze/call', { method: 'POST', form, timeout: 60000 }),
  alert: (body) => req('/api/alerts', { method: 'POST', body }),
  reset: () => req('/api/demo/reset', { method: 'POST' }),
  analyzeMessage: (text) => req('/api/analyze/message', { method: 'POST', body: { text } }),
  ask: (body) => req('/api/asks', { method: 'POST', body }),
  report: (body) => req('/api/reports', { method: 'POST', body }),
  stats: () => req('/api/stats'),
  events: (room, since) => req(`/api/events?room=${encodeURIComponent(room)}&since=${since}`, { timeout: 8000 }),
  // Buổi trình diễn: laptop điều khiển điện thoại (sự kiện demo.go), lấy địa chỉ LAN và mã QR
  demoGo: (data) => req('/api/events', { method: 'POST', body: { type: 'demo.go', room: 'gia-dinh-hoa', from: 'dieu-khien', data } }),
  demoLinks: () => req('/api/demo/links', { timeout: 5000 }),
}

export const qrUrl = (path) => `${API_BASE}/api/demo/qr.svg?path=${encodeURIComponent(path)}`

export function wsUrl(path) {
  const base = API_BASE || location.origin
  return base.replace(/^http/, 'ws') + path
}
