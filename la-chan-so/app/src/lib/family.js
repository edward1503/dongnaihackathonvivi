import { API_BASE } from './api.js'

async function familyRequest(id, action, body) {
  const bridge = window.LCSNative
  if (bridge) {
    if (!(action ? bridge.familyAction : bridge.familyAlerts)) throw new Error('Anh cập nhật ứng dụng để nhận cảnh báo gia đình nhé.')
    const value = action ? await bridge.familyAction(id, action, JSON.stringify(body)) : await bridge.familyAlerts()
    const result = typeof value === 'string' ? JSON.parse(value) : value
    if (result?.detail) throw new Error(result.detail)
    return result
  }
  // The demo session cookie is HttpOnly and scoped to the server serving the app (or Vite proxy).
  const root = new URL(API_BASE || location.origin, location.href)
  if (root.origin !== location.origin) throw new Error('Anh mở ứng dụng từ địa chỉ máy chủ của gia đình để ghép máy nhé.')
  const path = action ? `/api/alerts/${encodeURIComponent(id)}/${action}` : '/api/alerts'
  const request = () => fetch(API_BASE + path, {
    method: action ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(10000),
    ...(action && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })
  let response = await request()
  if (response.status === 401) {
    await fetch(API_BASE + '/zalo', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    response = await request()
  }
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Chưa kết nối được với gia đình.')
  return data
}

export const familyAlerts = () => familyRequest()
export const familyReply = (id, choice, text) => familyRequest(id, 'reply', { choice, ...(text && { text }) })
export const familyCall = id => familyRequest(id, 'call', {})
