// A2/B2 Kiểm tra nhanh · A2a đang kiểm tra · A2b mất mạng · A3 kết quả 4 mức · B3 phân tích tin nhắn · E01d chưa đủ thông tin
import { Fragment, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, IconBox, Row, Screen, Seg, Speak, StateView, Tag, fmtPhone, maskPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { native } from '../../lib/native.js'
import { useApp } from '../../lib/state.jsx'
import { openLesson } from '../lessons.js'

const TABS = [
  { key: 'phone', icon: 'phone', label: 'Điện thoại' },
  { key: 'text', icon: 'msg', label: 'Tin nhắn' },
  { key: 'account', icon: 'cardi', label: 'Tài khoản' },
]
const SAMPLES = { phone: ['0912345678', '1900555588', '0987654321'], text: ['qua-tri-an-khach-hang.top'], account: ['190388885678'] }
export const NOUN = { phone: 'số này', call: 'số này', link: 'đường dẫn này', account: 'tài khoản này', message: 'tin này' }

export function routeFor(r) {
  if (r.kind === 'message') return r.reason ? '/chua-du-thong-tin' : '/phan-tich'
  return '/ket-qua'
}

// Chạy kiểm tra: hiện màn "Đang kiểm tra" trong lúc chờ, xong thì sang màn kết quả
export function useCheckRunner() {
  const nav = useNavigate()
  const { setResult, addRecent, toast } = useApp()
  const [busy, setBusy] = useState(null)
  const run = async (value, kind) => {
    const v = String(value || '').trim()
    if (!v) return toast(kind === 'text' ? 'Bạn dán tin nhắn hoặc đường dẫn trước nhé' : 'Bạn nhập số trước nhé')
    setBusy({ value: v, kind })
    try {
      const k = kind === 'text' ? undefined : kind
      const r = kind === 'text' && /\s/.test(v) && v.length > 30 ? await api.analyzeMessage(v) : await api.check(v, k)
      setResult(r.kind === 'account' ? { ...r, lookupValue: v } : r)
      addRecent(r, v)
      nav(routeFor(r))
    } catch (e) {
      if (e.offline) nav('/mat-mang', { state: { value: v, kind } })
      else { toast(e.message); setBusy(null) }
    }
  }
  return [run, busy]
}

export function Checking({ value, kind }) {
  return (
    <Screen name="A2a-dang-kiem-tra" bar={<Bar title="Kiểm tra" />}>
      <StateView art="nghi" title="Đang kiểm tra…" text={kind === 'text' ? 'Lá chắn đang đọc tin nhắn' : fmtPhone(value)}>
        <I n="refresh" z={30} c="pri" className="spin" />
      </StateView>
    </Screen>
  )
}

// ---------- A2, B2 ----------
// Đổi tham số (?loai, ?v, ?tudong) thì dựng lại màn, để "kiểm tra lại" từ danh sách Gần đây chạy ngay
export function CheckRoute() {
  const { search } = useLocation()
  return <Check key={search} />
}

export function Check() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { persona, toast } = useApp()
  const [tab, setTab] = useState(params.get('loai') || (persona === 'student' ? 'text' : 'phone'))
  const [num, setNum] = useState(params.get('v') && tab !== 'text' ? params.get('v').replace(/\D/g, '') : '')
  const [text, setText] = useState(params.get('v') && tab === 'text' ? params.get('v') : '')
  const [listening, setListening] = useState(false)
  const [run, busy] = useCheckRunner()
  const demo = new URLSearchParams(location.search).get('demo') === '1'
  const auto = useRef(params.get('tudong') === '1')
  useEffect(() => {
    if (!auto.current) return
    auto.current = false
    // Bỏ ?tudong khỏi mục lịch sử hiện tại trước khi tự kiểm tra: vuốt lùi từ màn kết quả thì về ô nhập (đã điền sẵn),
    // không tự kiểm tra rồi đẩy sang kết quả lần nữa (vòng lặp không thoát được).
    try {
      const [path, query = ''] = location.hash.slice(1).split('?')
      const q = new URLSearchParams(query); q.delete('tudong')
      history.replaceState(history.state, '', `${location.pathname}${location.search}#${path}${q.toString() ? `?${q}` : ''}`)
    } catch { /* trình duyệt chặn đổi địa chỉ: vẫn kiểm tra bình thường */ }
    run(params.get('v'), tab)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (busy) return <Checking {...busy} />

  const paste = async () => {
    try {
      const t = (await navigator.clipboard.readText()).trim()
      if (!t) return toast('Bộ nhớ tạm đang trống')
      if (tab === 'text') setText(t)
      else setNum(t.replace(/\D/g, '').slice(0, 14))
    } catch { toast('Máy chưa cho đọc bộ nhớ tạm. Bạn nhấn giữ ô nhập rồi chọn Dán nhé') }
  }
  const voice = async () => {
    setListening(true)
    const heard = await listenOnce()
    setListening(false)
    if (heard === null) return nav('/doc-so?loi=1')
    const d = heard.replace(/\D/g, '')
    if (d) setNum(d.slice(0, 14))
    else toast(heard ? `Lá chắn nghe: “${heard}”` : 'Chưa nghe rõ, bạn đọc lại nhé')
  }
  const value = tab === 'text' ? text : num

  return (
    <Screen name={tab === 'text' ? 'B2-kiem-tra-tin-nhan' : tab === 'account' ? 'A2t-kiem-tra-tai-khoan' : 'A2-kiem-tra-so'} nav="/kiem-tra"
      bar={<Bar title="Kiểm tra nhanh" left={null} />}>
      <Seg items={TABS} value={tab} onChange={setTab} />
      {tab === 'text' ? (
        <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán tin nhắn hoặc đường dẫn lạ vào đây" aria-label="Tin nhắn hoặc đường dẫn" />
      ) : (
        <label className="field inbox">
          <I n={tab === 'account' ? 'cardi' : 'phone'} z={22} c="ink2" />
          <input value={num ? fmtPhone(num) : ''} inputMode="numeric" autoComplete="off" aria-label={tab === 'account' ? 'Số tài khoản' : 'Số điện thoại'}
            placeholder={tab === 'account' ? 'Nhập số tài khoản' : 'Nhập số điện thoại'}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 14))}
            onKeyDown={(e) => { if (e.key === 'Enter' && num) run(num, tab) }} />
          {num && <button type="button" className="tap" aria-label="Xóa" onClick={() => setNum('')}><I n="x" z={20} c="mute" /></button>}
        </label>
      )}
      <div className="row g8" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="chip tap" onClick={paste}><I n="clip" z={18} />Dán</button>
        {tab === 'phone' && <button type="button" className="chip tap" onClick={voice}><I n="mic" z={18} c={listening ? 'dang' : undefined} />{listening ? 'Đang nghe…' : 'Đọc số'}</button>}
      </div>
      <Btn icon="search" onClick={() => run(value, tab)} disabled={!value.trim()}>Kiểm tra</Btn>
      {demo && (
        <div className="row g8" style={{ flexWrap: 'wrap' }}>
          {(SAMPLES[tab] || []).map((x) => <button key={x} type="button" className="chip" onClick={() => (tab === 'text' ? setText(x) : setNum(x))}>{x}</button>)}
        </div>
      )}
      <RecentChecks />
    </Screen>
  )
}

// "Vừa kiểm tra" (A06a): the last checks on this phone, tap to check again
const LEVEL_TAG = {
  danger: ['dang', 'off', 'Nguy hiểm'], suspicious: ['warn', 'new', 'Nghi ngờ'],
  safe: ['safe', 'on', 'An toàn'], unknown: ['', 'no', 'Chưa có dữ liệu'],
}
const KIND_ICON = { phone: 'phone', call: 'phone', link: 'link', account: 'cardi', message: 'msg' }

function ago(iso) {
  const d = new Date(iso)
  const days = Math.round((new Date(new Date().toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days <= 0) return `Hôm nay ${d.toTimeString().slice(0, 5)}`
  if (days === 1) return 'Hôm qua'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function RecentChecks() {
  const nav = useNavigate()
  const { recent } = useApp()
  if (!recent.length) return null
  return (
    <>
      <div className="sec">Vừa kiểm tra</div>
      <Group>
        {recent.slice(0, 4).map((x) => {
          const [tone, tag, label] = LEVEL_TAG[x.level] || LEVEL_TAG.unknown
          const title = x.kind === 'link' || x.kind === 'message' ? x.display : x.kind === 'account' ? `TK ${maskPhone(x.value)}` : fmtPhone(x.display)
          return (
            <Row key={x.display + x.at} lead={<IconBox icon={KIND_ICON[x.kind] || 'search'} tone={tone} />} title={<span style={{ overflowWrap: 'anywhere' }}>{title}</span>}
              sub={ago(x.at)} right={<Tag kind={tag}>{label}</Tag>} chev={false}
              onClick={() => nav(`/kiem-tra?loai=${x.kind === 'link' || x.kind === 'message' ? 'text' : x.kind}&v=${encodeURIComponent(x.value)}&tudong=1`)} />
          )
        })}
      </Group>
    </>
  )
}

// Nghe một câu: Android (LCSNative.listen) hoặc nhận giọng nói của trình duyệt. null = máy không cho dùng micro.
export async function listenOnce() {
  if (native.available() && window.LCSNative.listen) return (await native.listen()) || ''
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  return new Promise((resolve) => {
    const r = new SR()
    r.lang = 'vi-VN'
    r.interimResults = false
    r.maxAlternatives = 1
    let done = false
    const finish = (v) => { if (!done) { done = true; resolve(v) } }
    r.onresult = (e) => finish(e.results[0][0].transcript || '')
    r.onerror = (e) => finish(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? null : '')
    r.onend = () => finish('')
    try { r.start() } catch { finish(null) }
    setTimeout(() => { try { r.stop() } catch { /* đã dừng */ } }, 8000)
  })
}

// ---------- A2b mất mạng (E01c) ----------
export function Offline() {
  const nav = useNavigate()
  const { state } = useLocation()
  const [run, busy] = useCheckRunner()
  if (busy) return <Checking {...busy} />
  return (
    <Screen name="E01c-mat-mang" nav="/kiem-tra" gap={16} bar={<Bar title="Kiểm tra nhanh" />}>
      <div className="card tone-warn row g12">
        <IconBox icon="wifioff" tone="white warn" />
        <div className="col grow"><div className="h-m c-warn-ink">Không có mạng</div><div className="t-sub c-ink">Chưa tra được dữ liệu cộng đồng.</div></div>
      </div>
      {state?.value && <Btn kind="o" icon="refresh" onClick={() => run(state.value, state.kind)}>Thử lại</Btn>}
      <div className="t-head" style={{ marginTop: 8 }}>Trong lúc chờ, tự kiểm tra bằng 3 câu</div>
      <SelfCheck />
      <button type="button" className="card tone-gray row g12 tap" onClick={() => nav('/bai-hoc')}>
        <I n="book" c="ink2" /><span className="reason grow">Các bài học 1 phút vẫn đọc được khi mất mạng.</span>
      </button>
      <button type="button" className="link-btn" onClick={() => nav('/nguoi-than')}><I n="phone" z={18} />Gọi người thân</button>
    </Screen>
  )
}

// Tự hỏi 3 câu trước khi chuyển tiền (A07d, E01c): đánh dấu từng câu
const SELF = ['Tôi biết người nhận ngoài đời thật', 'Không ai giục tôi chuyển gấp', 'Không ai bảo tôi giữ bí mật']
function SelfCheck({ title }) {
  const [ticks, setTicks] = useState([])
  return (
    <div className="card col self-check">
      {title && <div className="t-head" style={{ padding: '4px 0 4px' }}>{title}</div>}
      {SELF.map((t) => {
        const on = ticks.includes(t)
        return (
          <button key={t} type="button" className="tick-row" role="checkbox" aria-checked={on}
            onClick={() => setTicks((a) => (on ? a.filter((x) => x !== t) : [...a, t]))}>
            <span className={`tick${on ? ' on' : ''}`}>{on && <I n="check" z={16} sw={3} />}</span>
            <span className="reason grow">{t}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------- A3 kết quả ----------
const LOOK = {
  danger: { tone: 'dang', word: 'Nguy hiểm', icon: 'alert-oct', c: 'dang', box: 'solid-dang', say: 'Đừng chuyển tiền!' },
  suspicious: { tone: 'warn', word: 'Nghi ngờ', icon: 'alert', c: 'warn', box: 'solid-warn', say: 'Hỏi người thân trước đã.' },
  safe: { tone: 'safe', word: 'An toàn', icon: 'check-circle', c: 'safe', box: 'solid-safe', say: '' },
  unknown: { tone: null, word: 'Chưa có dữ liệu', icon: 'help', c: 'ink', box: 'solid-ink', say: 'Chưa chắc là an toàn.' },
}
// Biểu tượng cho từng lý do "Vì sao?", đoán theo nội dung câu
function reasonIcon(t) {
  if (/báo cáo|máy (đã )?báo/i.test(t)) return 'users'
  if (/tình nguyện|xác nhận|xác thực|danh bạ|tổng đài/i.test(t)) return 'shield-check'
  if (/mới đăng ký|gần nhất|ngày qua|hôm qua/i.test(t)) return 'clock'
  if (/đường dẫn|đuôi|tên miền|link/i.test(t)) return 'link'
  if (/giống|giả mạo/i.test(t)) return 'eye'
  if (/xưng|giả danh|đòi|giục|OTP|chuyển tiền/i.test(t)) return 'message-alert'
  return 'alert'
}
// Fallback steps when the server sends no advice
const STEPS = {
  danger: ['Cúp máy, không gọi lại.', 'Không chuyển tiền, không đọc mã xác thực (OTP).'],
  suspicious: ['Khoan chuyển tiền.', 'Hỏi người thân hoặc gọi tổng đài chính thức để xác minh.'],
  unknown: ['Nếu ai giục chuyển tiền gấp, hãy dừng lại.', 'Hỏi người thân trước khi chuyển.'],
  safe: [],
}
const KIND_LABEL = { phone: 'Số điện thoại', call: 'Cuộc gọi', link: 'Đường dẫn', account: 'Số tài khoản', message: 'Tin nhắn' }
// Bé Nai đọc kết quả cho bà, cùng giọng văn với màn hỏi sau cuộc gọi của Android (HoiSauCuocGoiActivity)
const sayElder = (level, headline, ten) => ({
  danger: `Nguy hiểm. Bà đừng chuyển tiền nhé. ${headline} Bà gọi ${ten} hỏi trước cho chắc nha.`,
  suspicious: `Bà khoan chuyển tiền nhé. ${headline} Bà gọi ${ten} hỏi trước cho chắc nha.`,
  safe: `Con chưa thấy dấu hiệu lừa đảo. Nếu họ gọi lại đòi tiền, bà cứ cúp máy nha.`,
}[level] || `Con chưa đủ thông tin về cái này. Nếu ai giục chuyển tiền, bà gọi ${ten} hỏi trước cho chắc nha.`)
function CommunityStatus({ result }) {
  const nav = useNavigate()
  return (
    <div className="col g6">
      {result.appealOpen ? <p className="t-sub">Đang xét báo nhầm</p> :
        result.canAppeal && <button type="button" className="quiet-link" onClick={() => nav('/bao-nham')}>Số của tôi bị báo nhầm</button>}
    </div>
  )
}

// Refresh a public lookup while it is on screen, including after an appeal.
// Call and message analysis describe a particular conversation and must be preserved.
function useLiveLookup(result, setResult) {
  const kind = result?.kind
  const value = result?.lookupValue || result?.display
  useEffect(() => {
    if (!value || !['phone', 'link', 'account'].includes(kind)) return
    let active = true
    let pending = false
    async function refresh() {
      if (pending || document.hidden) return
      pending = true
      try {
        const next = await api.check(value, kind)
        if (active) setResult((old) => {
          if ((old?.lookupValue || old?.display) !== value || old?.kind !== kind) return old
          const updated = { ...next, id: old.id, lookupValue: old.lookupValue }
          return JSON.stringify(updated) === JSON.stringify(old) ? old : updated
        })
      } catch { /* A lookup already on screen remains readable offline. */ }
      finally { pending = false }
    }
    refresh()
    const timer = setInterval(refresh, 10000)
    window.addEventListener('lcs-community-update', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('lcs-community-update', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [kind, value, setResult])
}

export function Result() {
  const nav = useNavigate()
  const { result: r, setResult, persona, relatives } = useApp()
  useLiveLookup(r, setResult)
  const ten = (relatives.find((x) => x.paired) || relatives[0])?.name || 'con cháu'
  const L = LOOK[r?.level] || LOOK.unknown
  // Câu đọc to viết theo văn nói (không đọc nguyên chữ trên màn hình)
  const spoken = r ? (persona === 'elder' ? sayElder(r.level, r.headline, ten) : `Kết quả là ${L.word.toLowerCase()}. ${r.headline} ${L.say}`) : ''
  useEffect(() => {
    if (r && persona === 'elder' && localStorage.getItem('lcs.autoSpeak') !== '0') native.speak(spoken)
    return () => native.stopSpeaking()
  }, [spoken, persona])
  if (!r) return <Navigate to="/kiem-tra" replace />
  const elder = persona === 'elder'
  const isNum = ['phone', 'call'].includes(r.kind)
  // Lý do ngắn gọn: bỏ dòng trùng với tiêu đề, tối đa 3 dòng
  const head = (r.headline || '').toLowerCase()
  const reasons = [
    ...(r.scamLabel && r.scamType !== 'khac' && r.level !== 'safe' && r.level !== 'unknown' && !head.includes(r.scamLabel.toLowerCase()) ? [r.scamLabel] : []),
    ...(r.why || []).filter((text) => !(r.appealOpen && text.replace(/\.$/, '') === 'Đang xét báo nhầm')),
  ].slice(0, 3)
  const reportLabel = elder ? 'Báo cuộc vừa nhận' : r.level === 'unknown' ? 'Vẫn nghi ngờ? Báo cáo' : 'Báo cáo'
  const steps = r.level === 'danger' || r.level === 'suspicious' ? ((r.todo && r.todo.length ? r.todo : STEPS[r.level]) || []).slice(0, 3) : []
  return (
    <Screen name={`A3-ket-qua-${r.level}`} bar={<Bar title="Kết quả kiểm tra" right={<Speak text={spoken} />} />}
      foot={r.level === 'safe'
        ? <Btn kind="o" icon="search" onClick={() => nav('/kiem-tra', { replace: true })}>Kiểm tra số khác</Btn>
        : <><Btn icon="users" onClick={() => nav('/hoi-nguoi-than')}>Hỏi người thân</Btn><Btn kind="o" icon="flag" onClick={() => nav('/bao-cao')}>{reportLabel}</Btn></>}>
      <div className="card row g12" style={{ padding: '12px 14px' }}>
        <IconBox icon={KIND_ICON[r.kind] || 'search'} z={20} />
        <div className="col grow">
          <div className="t-row" style={{ overflowWrap: 'anywhere' }}>{isNum ? fmtPhone(r.display) : r.display}</div>
          <div className="t-sm">{KIND_LABEL[r.kind] || 'Kết quả'}</div>
        </div>
      </div>
      <div className={`verdict ${L.tone || 'none'} rise`}>
        <div className="row g12">
          <IconBox icon={L.icon} tone={L.box} size="lgx" z={32} />
          <div className="col grow">
            <div className={`t-over c-${L.tone ? L.tone + '-ink' : 'ink2'}`}>Kết quả</div>
            <div className={`t-display c-${L.tone ? L.tone + '-ink' : 'ink'}`}>{L.word}</div>
          </div>
        </div>
        <div className="t-body">
          {r.headline}
          {r.note && <><br /><span className={r.level === 'unknown' ? 't-s' : undefined}>{r.note}</span></>}
        </div>
      </div>
      {(reasons.length > 0 || r.appealOpen || r.canAppeal) && (
        <div className="card col g8 rise" style={{ padding: 14, animationDelay: '.04s' }}>
          {reasons.length > 0 && <div className="t-head">Vì sao?</div>}
          {reasons.map((t) => <div key={t} className="why reason"><I n={reasonIcon(t)} z={18} c={L.tone ? L.c : 'ink2'} /><span>{t}</span></div>)}
          <CommunityStatus result={r} />
        </div>
      )}
      {steps.length > 0 && (
        <div className="card tone-gray col g8 rise" style={{ padding: 14, animationDelay: '.08s' }}>
          <div className="t-head">Bạn nên làm gì</div>
          {steps.map((t, i) => (
            <div key={t} className="row as g8 reason"><span className="step-no">{i + 1}</span><span>{t}</span></div>
          ))}
          {r.lesson && <button type="button" className="link-btn" onClick={() => openLesson(nav, r.scamType, r.lesson)}><I n="book" z={16} />Xem truyện 1 phút về chiêu này</button>}
        </div>
      )}
      {r.level === 'unknown' && <SelfCheck title="Tự kiểm tra trước khi chuyển tiền" />}
      {r.level === 'safe' && <>
        <div className="card tone-gray row as g8" style={{ padding: 14 }}>
          <I n="info" z={18} c="ink2" style={{ marginTop: 1 }} />
          <span className="reason">Đừng đọc mã xác thực (OTP) cho bất kỳ ai, kể cả người tự xưng tổng đài.</span>
        </div>
        <div className="col">
          <button type="button" className="link-btn" onClick={() => nav('/hoi-nguoi-than')}><I n="users" z={18} />Vẫn lo? Hỏi người thân</button>
          <button type="button" className="link-btn" onClick={() => nav('/bao-cao')}><I n="flag" z={18} />{elder ? 'Báo cuộc vừa nhận' : 'Báo cáo'}</button>
        </div>
      </>}
    </Screen>
  )
}

// ---------- B3 phân tích tin nhắn ----------
const LINK_RE = /(bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|s\.id|rb\.gy)\/\S+|[\w-]+(\.[\w-]+)*\.(top|xyz|click|info|icu|cyou|com|vn|net)\b\S*/i
const isLink = (q) => LINK_RE.test(q) && !/\s/.test(q.trim())

export function highlight(text, quotes) {
  const ranges = []
  for (const q of quotes) {
    if (!q) continue
    for (let from = 0; ;) {
      const at = text.indexOf(q, from)
      if (at < 0) break
      ranges.push([at, at + q.length, isLink(q)])
      from = at + q.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const x of ranges) {
    const last = merged[merged.length - 1]
    if (last && x[0] <= last[1]) { last[1] = Math.max(last[1], x[1]); last[2] = last[2] && x[2] } else merged.push([...x])
  }
  const out = []
  let pos = 0
  merged.forEach(([s, e, link], i) => {
    if (s > pos) out.push(<Fragment key={`t${i}`}>{text.slice(pos, s)}</Fragment>)
    out.push(<mark key={`h${i}`} className={link ? 'hl link' : 'hl'}>{text.slice(s, e)}</mark>)
    pos = e
  })
  if (pos < text.length) out.push(<Fragment key="end">{text.slice(pos)}</Fragment>)
  return out
}

export function MessageResult() {
  const nav = useNavigate()
  const { result: r, persona } = useApp()
  const [askReport, setAskReport] = useState(true)
  if (!r || r.kind !== 'message') return <Navigate to="/kiem-tra?loai=text" replace />
  const L = LOOK[r.level] || LOOK.unknown
  const quotes = (r.signs || []).flatMap((s) => s.quotes)
  const fromNotif = r.from === 'notification'
  const at = r.at ? new Date(r.at) : null
  const tone = L.tone || 'gray'
  return (
    <Screen name="A05b-phan-tich-tin-nhan" bar={<Bar title="Phân tích tin nhắn" right={<Speak text={`Tin nhắn này được đánh giá là ${L.word.toLowerCase()}. ${r.headline}`} />} />}>
      <div className="row g6" style={{ flexWrap: 'wrap' }}>
        <Tag kind="line" icon="msg">{fromNotif ? 'Ứng dụng nhắn tin' : 'Tin dán vào'}</Tag>
        {fromNotif && <Tag kind="line">Người lạ</Tag>}
        {at && !Number.isNaN(at.getTime()) && <Tag kind="line" icon="clock">{at.toTimeString().slice(0, 5)}</Tag>}
      </div>
      <div className="bubble in rise">{highlight(r.maskedText || '', quotes)}</div>
      <div className={`card tone-${tone} row g12 rise`} style={{ animationDelay: '.05s' }}>
        <IconBox icon={L.icon} tone={L.box} z={22} />
        <div className="col grow">
          <div className={`h-m c-${L.tone ? L.tone + '-ink' : 'ink'}`}>{L.word}</div>
          <div className={`t-sub c-${L.tone ? L.tone + '-ink' : 'ink2'}`}>{r.scamLabel && r.level !== 'unknown' ? r.scamLabel : r.signs?.length ? `${r.signs.length} dấu hiệu` : 'Chưa thấy dấu hiệu rõ'}</div>
        </div>
      </div>
      {r.headline && (
        <div className="card tone-gray col g6 tight">
          <div className="row g12"><I n="hand" z={24} c={L.tone ? L.c : 'ink2'} /><div className="t-head grow">{r.headline}</div></div>
          {r.todo?.slice(0, 2).map((t) => <div key={t} className="why reason" style={{ paddingLeft: 36 }}><I n="check" z={16} c="safe" sw={2.6} /><span>{t}</span></div>)}
        </div>
      )}
      {r.signs?.length > 0 && (
        <div className="card tone-ai col g8">
          <div className="ai-tag"><I n="sparkles" z={14} />AI giải thích</div>
          {r.signs.map((s) => <div key={s.text} className="row as g10"><span className="dotx ai" style={{ marginTop: 7 }} /><div className="reason c-ai-ink grow">{s.text}</div></div>)}
        </div>
      )}
      <CommunityStatus result={r} />
      {askReport && r.level !== 'safe' && (
        <div className="card tone-pri col g12">
          <div className="col g2">
            <div className="t-head c-pri-ink">Báo tin này cho cộng đồng?</div>
            <div className="t-sm c-pri-ink">{persona === 'student' ? 'Giúp cảnh báo các bạn khác.' : 'Giúp cảnh báo mọi người.'}</div>
          </div>
          <div className="row g8">
            <button type="button" className="btn p sm grow" onClick={() => nav('/bao-cao')}>Báo cho cộng đồng</button>
            <button type="button" className="btn o sm" onClick={() => setAskReport(false)}>Không</button>
          </div>
        </div>
      )}
      {r.lesson
        ? <button type="button" className="btn ghost" onClick={() => openLesson(nav, r.scamType, r.lesson)}><I n="book" z={20} />Xem truyện 1 phút về chiêu này</button>
        : <button type="button" className="btn ghost" onClick={() => nav('/hoi-nguoi-than')}><I n="users" z={20} />Hỏi người thân</button>}
    </Screen>
  )
}

// ---------- E01d chưa đủ thông tin / tin có mã OTP ----------
export function NotEnough() {
  const nav = useNavigate()
  const { result } = useApp()
  const otp = result?.reason === 'otp'
  const short = (result?.maskedText || '').length < 60
  const options = [
    ...(otp ? [] : [{ icon: 'clipboard', tone: 'ai', title: 'Dán thêm các tin trước đó', to: '/kiem-tra?loai=text' }]),
    { icon: 'phone', tone: 'pri', title: 'Kiểm tra số gửi tin', to: '/kiem-tra?loai=phone' },
    { icon: 'users', tone: 'safe', title: 'Hỏi người thân', to: '/hoi-nguoi-than' },
  ]
  return (
    <Screen name="E01d-chua-du-thong-tin" bar={<Bar title="Phân tích tin nhắn" />}>
      {result?.maskedText && <div className="bubble in" style={{ alignSelf: 'flex-start' }}>{result.maskedText}</div>}
      <div className="card tone-gray col g10" style={{ borderColor: 'var(--bd)' }}>
        {!otp && <span className="ai-tag"><I n="sparkles" z={14} />Kết quả phân tích của AI</span>}
        <div className="row as g12">
          <IconBox icon={otp ? 'lock' : 'help'} tone="solid-ink" />
          <div className="col grow g4">
            <div className="h-m">{otp ? 'Tin có mã xác thực' : 'Chưa đủ thông tin để kết luận'}</div>
            <div className="t-sub">{otp ? 'Lá chắn không gửi tin này đi. Đừng đọc mã cho bất kỳ ai, kể cả người xưng ngân hàng, công an.' : short ? 'Tin nhắn quá ngắn. AI không đoán bừa.' : 'Chưa thấy dấu hiệu rõ. AI không đoán bừa, chưa chắc là an toàn.'}</div>
          </div>
        </div>
      </div>
      <div className="t-head" style={{ marginTop: 4 }}>Bạn có thể</div>
      {options.map((o) => (
        <button key={o.title} type="button" className="card tight row g12 tap" onClick={() => nav(o.to)}>
          <IconBox icon={o.icon} tone={o.tone} z={20} />
          <span className="t-row grow">{o.title}</span>
          <I n="next" z={20} className="chev" c="mute" />
        </button>
      ))}
      <div className="col ac jc grow" style={{ minHeight: 132 }}><Art name="nghi" z={120} /></div>
    </Screen>
  )
}
