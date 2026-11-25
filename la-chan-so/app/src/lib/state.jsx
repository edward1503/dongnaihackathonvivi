// Trạng thái chung của app: chế độ hiển thị, kết quả vừa kiểm tra, lịch sử, người thân, câu hỏi đang chờ.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { connectRoom } from './relay.js'
import { setLayersForDemo } from './layers.js'

const Ctx = createContext(null)
export const FAMILY_ROOM = 'gia-dinh-hoa'

const DEFAULT_RELATIVES = [
  { id: 'minh', name: 'Minh', relation: 'con trai', channel: 'Nhận qua ứng dụng nhắn tin', paired: true },
  { id: 'lan', name: 'Lan', relation: 'con gái', channel: 'Dự phòng', paired: false },
]

// Ba mục mẫu của màn A06a để lần mở đầu không trống
const SAMPLE_RECENT = [
  { value: '028 9999 1234', display: '028 9999 1234', kind: 'phone', level: 'danger', at: todayAt(9, 12) },
  { value: 'qua-tri-an-khach-hang.top', display: 'qua-tri-an-khach-hang.top', kind: 'link', level: 'suspicious', at: daysAgo(1) },
  { value: '190388885678', display: '1903 xxxx 5678', kind: 'account', level: 'unknown', at: daysAgo(4) },
]

function todayAt(h, m) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* bộ nhớ đầy: bỏ qua */ }
}

// mode: simple = người lớn tuổi (bà Hoa), full = học sinh (Vy), volunteer = đội tình nguyện (Khoa)
export const PERSONA = { simple: 'elder', full: 'student', volunteer: 'volunteer' }
const MODE_PARAM = new URLSearchParams(location.search).get('mode')

function initialMode() {
  if (PERSONA[MODE_PARAM]) {
    save('lcs.mode', MODE_PARAM)
    save('lcs.onboarded', true)   // mở từ mã QR hoặc bảng mô phỏng: vào thẳng trang chủ
    return MODE_PARAM
  }
  const m = load('lcs.mode', 'simple')
  return PERSONA[m] ? m : 'simple'
}

function initialRelatives() {
  if (new URLSearchParams(location.search).get('nguoithan') === '0') save('lcs.relatives', [])
  return load('lcs.relatives', DEFAULT_RELATIVES)
}

// Mã của tab này, để máy điều khiển không tự nhận lại lệnh demo.go của chính nó
export const CLIENT_ID = (() => {
  try {
    let id = sessionStorage.getItem('lcs.client')
    if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('lcs.client', id) }
    return id
  } catch { return Math.random().toString(36).slice(2, 10) }
})()

export function AppProvider({ children }) {
  const [mode, setModeState] = useState(initialMode)
  const [result, setResult] = useState(null)
  const [recent, setRecent] = useState(() => load('lcs.recent', SAMPLE_RECENT))
  const [relatives, setRelativesState] = useState(initialRelatives)
  const [ask, setAsk] = useState(null)
  const [report, setReport] = useState(null) // {draft, response}
  const [call, setCall] = useState(null) // cuộc gọi vừa rồi: {phone, display, seconds, hasRecording, answeredYes, story}
  const [pointsBy, setPointsBy] = useState(() => load('lcs.points', { vy: 120, 'ba-hoa': 120 }))
  const [ward, setWardState] = useState(() => load('lcs.ward', 'Trấn Biên'))
  const [onboarded, setOnboardedState] = useState(() => load('lcs.onboarded', false))
  const [toastMsg, setToastMsg] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const toastTimer = useRef(null)
  const askRef = useRef(null)
  askRef.current = ask

  const setMode = useCallback((m) => { if (PERSONA[m]) { setModeState(m); save('lcs.mode', m) } }, [])
  const setWard = useCallback((w) => { setWardState(w); save('lcs.ward', w) }, [])
  const setOnboarded = useCallback((v) => { setOnboardedState(v); save('lcs.onboarded', v) }, [])
  const persona = PERSONA[mode] || 'elder'
  const setRelatives = useCallback((list) => { setRelativesState(list); save('lcs.relatives', list) }, [])
  const addDefaultRelatives = useCallback(() => setRelatives(DEFAULT_RELATIVES), [setRelatives])
  const reporter = mode === 'full' ? 'vy' : mode === 'volunteer' ? 'tnv' : 'ba-hoa'
  const points = pointsBy[reporter] ?? 0
  const setPoints = useCallback((n) => {
    if (typeof n !== 'number') return
    setPointsBy((m) => { const next = { ...m, [reporter]: n }; save('lcs.points', next); return next })
  }, [reporter])

  const toast = useCallback((msg) => {
    clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const addRecent = useCallback((r, value) => {
    if (!r || r.kind === 'message' || r.kind === 'call') return
    setRecent((list) => {
      const item = { value, display: r.display, kind: r.kind, level: r.level, label: r.level === 'unknown' ? null : r.scamLabel, at: new Date().toISOString() }
      const next = [item, ...list.filter((x) => x.display !== r.display)].slice(0, 10)
      save('lcs.recent', next)
      return next
    })
  }, [])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // S5: nghe phòng gia đình để nhận "Minh đã xem" và lời trả lời
  useEffect(() => connectRoom(FAMILY_ROOM, 'ba-hoa', (ev) => {
    const cur = askRef.current
    // Sự kiện phát lại lúc vừa mở trang (replay): không làm lại lệnh trình diễn cũ
    if (ev.replay && (ev.type === 'demo.reset' || ev.type === 'demo.go')) return
    if (ev.type === 'demo.reset') {
      setAsk(null)
      setResult(null)
      setReport(null)
      setCall(null)
      setLayersForDemo(null)
      return
    }
    if (ev.type === 'demo.go') {
      // Laptop bấm ở bảng mô phỏng (chế độ "Điện thoại"): máy này chuyển màn như khi Android mở WebView
      const d = ev.data || {}
      if (d.client === CLIENT_ID || typeof d.path !== 'string' || !d.path.startsWith('/')) return
      if (PERSONA[d.mode]) setMode(d.mode)
      if (d.layers && typeof d.layers === 'object') setLayersForDemo(d.layers)
      window.location.hash = '#' + d.path
      return
    }
    if (!cur || (ev.data?.askId ?? ev.data?.alertId) !== cur.askId) return
    if (ev.type === 'ask.seen') setAsk((a) => ({ ...a, seen: true }))
    if (ev.type === 'ask.reply') setAsk((a) => ({ ...a, seen: true, reply: { text: ev.data.text, preset: ev.data.preset, at: ev.at } }))
    if (ev.type === 'alert.call') toast(`${cur.to?.name || 'Người thân'} đang gọi cho bà`)
  }), [toast, setMode])

  const value = useMemo(() => ({
    mode, setMode, persona, ward, setWard, onboarded, setOnboarded, result, setResult, recent, addRecent, relatives, setRelatives, addDefaultRelatives,
    ask, setAsk, report, setReport, toast, online, points, setPoints, reporter, call, setCall,
  }), [mode, setMode, persona, ward, setWard, onboarded, setOnboarded, result, recent, addRecent, relatives, setRelatives, addDefaultRelatives, ask, report, toast, online, points, setPoints, reporter, call])

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
