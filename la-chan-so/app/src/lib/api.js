// Gọi máy chủ Lá chắn số. Hợp đồng dữ liệu: VAI-VA-KIEM-DUYET.md mục 4.
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

const deviceKey = 'lcs.device.' + (API_BASE || location.origin)
let registration

async function registerBrowserDevice() {
  const saved = localStorage.getItem(deviceKey)
  if (saved) return saved
  const { deviceId } = await req('/api/devices', { method: 'POST' })
  if (!deviceId) throw new ApiError('Chưa đăng ký được máy. Bạn thử lại nhé.', 0, false)
  localStorage.setItem(deviceKey, deviceId)
  return deviceId
}

export async function getDeviceId() {
  if (window.LCSNative) {
    const id = await window.LCSNative.deviceId?.()
    if (!id) throw new ApiError('Chưa lấy được mã máy Android. Bạn thử lại nhé.', 0, false)
    return id
  }
  if (!registration) {
    registration = (navigator.locks
      ? navigator.locks.request(deviceKey, registerBrowserDevice)
      : registerBrowserDevice()).finally(() => { registration = null })
  }
  return registration
}

export function readTeam() {
  try {
    const session = JSON.parse(localStorage.getItem('lcs.team'))
    if (session?.base === API_BASE && session.token && ['volunteer', 'lead'].includes(session.member?.role)) return session
  } catch { /* Older versions stored a demo code here. */ }
  return null
}

export function saveTeam(session) {
  if (session) localStorage.setItem('lcs.team', JSON.stringify({ ...session, base: API_BASE }))
  else localStorage.removeItem('lcs.team')
  window.dispatchEvent(new Event('lcs-team-change'))
}

export const memberRole = (member) => member?.role === 'lead' ? 'Trưởng đội' : 'Tình nguyện viên'

async function req(path, { method = 'GET', body, form, device = false, team = false, timeout = 15000 } = {}) {
  const headers = form ? {} : { 'Content-Type': 'application/json' }
  const token = team ? readTeam()?.token : null
  if (team && !token) throw new ApiError('Bạn đăng nhập đội nhé.', 401, false)
  if (token) headers['X-LCS-Team'] = token
  if (device || team) headers['X-LCS-Device'] = await getDeviceId()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      signal: ctrl.signal,
      headers,
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError('Không có mạng', 0, true)
  } finally {
    clearTimeout(timer)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token && readTeam()?.token === token) saveTeam(null)
  if (!res.ok) throw new ApiError(typeof data.detail === 'string' ? data.detail : 'Có lỗi, bạn thử lại nhé', res.status, false)
  return data
}

export const api = {
  health: () => req('/api/health', { timeout: 5000 }),
  check: (value, kind) => req('/api/check', { method: 'POST', body: { value, kind } }),
  lookupPhone: (phone) => req(`/api/lookup/phone/${encodeURIComponent(phone)}`, { timeout: 5000 }),
  analyzeCall: (form) => req('/api/analyze/call', { method: 'POST', form, timeout: 60000 }),
  alert: (body) => req('/api/alerts', { method: 'POST', body, device: true }),
  reset: () => req('/api/demo/reset', { method: 'POST' }),
  analyzeMessage: (text) => req('/api/analyze/message', { method: 'POST', body: { text } }),
  ask: (body) => req('/api/asks', { method: 'POST', body, device: true }),
  askSeen: id => req(`/api/asks/${encodeURIComponent(id)}/seen`, { method: 'POST' }),
  unreadReplies: () => req('/api/family/unread', { device: true }),
  replySeen: (id, replyId) => req(`/api/alerts/${encodeURIComponent(id)}/reply/${encodeURIComponent(replyId)}/seen`, { method: 'POST', device: true }),
  stats: (team = false) => req('/api/stats', { team }),
  events: (room, since) => req(`/api/events?room=${encodeURIComponent(room)}&since=${since}`, { timeout: 8000 }),
  // Buổi trình diễn: laptop điều khiển điện thoại (sự kiện demo.go), lấy địa chỉ LAN và mã QR
  demoGo: (data) => req('/api/events', { method: 'POST', body: { type: 'demo.go', room: 'gia-dinh-hoa', from: 'dieu-khien', data } }),
  demoLinks: () => req('/api/demo/links', { timeout: 5000 }),
  // Đội tình nguyện (dùng chung với web của Mảng 6)
  teamLogin: (code) => req('/api/team/login', { method: 'POST', body: { code }, device: true }),
  cases: () => req('/api/cases?status=open&limit=100', { team: true }),
  vote: (key, body) => req(`/api/cases/${encodeURIComponent(key)}/vote`, { method: 'POST', body, team: true }),
  broadcast: (body) => req('/api/broadcasts', { method: 'POST', body, team: true }),
  createAppeal: (body) => req('/api/appeals', { method: 'POST', body, device: true }),
  verifyAppeal: (id, code) => req(`/api/appeals/${encodeURIComponent(id)}/verify`, { method: 'POST', body: { code }, device: true }),
  appeals: () => req('/api/appeals', { team: true }),
  resolveAppeal: (id, body) => req(`/api/appeals/${encodeURIComponent(id)}/resolve`, { method: 'POST', body, team: true }),
}

export const qrUrl = (path) => `${API_BASE}/api/demo/qr.svg?path=${encodeURIComponent(path)}`

export function wsUrl(path) {
  const base = API_BASE || location.origin
  return base.replace(/^http/, 'ws') + path
}
