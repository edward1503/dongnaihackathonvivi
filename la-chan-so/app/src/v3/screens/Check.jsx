// A2/B2 Kiểm tra nhanh · A2a đang kiểm tra · A2b mất mạng · A3 kết quả 4 mức · B3 phân tích tin nhắn · E01d chưa đủ thông tin
import { Fragment, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, Keypad, Row, Screen, Seg, Speak, StateView, Tag, fmtPhone } from '../ui.jsx'
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
      setResult(r)
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
    if (auto.current) { auto.current = false; run(params.get('v'), tab) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (busy) return <Checking {...busy} />

  const key = (k) => setNum((n) => (k === 'del' ? n.slice(0, -1) : n.length < 14 ? n + k : n))
  const paste = async () => {
    try {
      const t = (await navigator.clipboard.readText()).trim()
      if (!t) return toast('Bộ nhớ tạm đang trống')
      if (tab === 'text') setText(t)
      else setNum(t.replace(/\D/g, ''))
    } catch { toast('Máy chưa cho đọc bộ nhớ tạm. Bạn nhấn giữ ô nhập rồi chọn Dán nhé') }
  }
  const voice = async () => {
    setListening(true)
    const heard = await listenOnce()
    setListening(false)
    if (heard === null) return nav('/doc-so?loi=1')
    const d = heard.replace(/\D/g, '')
    if (d) setNum(d)
    else toast(heard ? `Lá chắn nghe: “${heard}”` : 'Chưa nghe rõ, bạn đọc lại nhé')
  }
  const value = tab === 'text' ? text : num

  return (
    <Screen name={tab === 'text' ? 'B2-kiem-tra-tin-nhan' : tab === 'account' ? 'A2t-kiem-tra-tai-khoan' : 'A2-kiem-tra-so'} bar={<Bar title="Kiểm tra" />}
      foot={<Btn icon="search" onClick={() => run(value, tab)} disabled={!value.trim()}>Kiểm tra</Btn>}>
      <Seg items={TABS} value={tab} onChange={setTab} />
      {tab === 'text' ? (
        <>
          <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán tin nhắn hoặc đường dẫn lạ vào đây" aria-label="Tin nhắn hoặc đường dẫn" />
          <div className="row g10"><button type="button" className="pill tap" onClick={paste}><I n="clip" z={20} />Dán</button></div>
        </>
      ) : (
        <>
          <div className={`numdisp${num ? '' : ' empty'}`} aria-live="polite">{num ? fmtPhone(num) : tab === 'account' ? 'Nhập số tài khoản' : 'Nhập số điện thoại'}</div>
          <div className="row jc g10">
            <button type="button" className="pill tap" onClick={paste}><I n="clip" z={20} />Dán</button>
            {tab === 'phone' && <button type="button" className="pill tap" onClick={voice}><I n="mic" z={20} c={listening ? 'dang' : undefined} />{listening ? 'Đang nghe…' : 'Đọc số'}</button>}
          </div>
          <Keypad onKey={key} />
        </>
      )}
      {demo && (
        <div className="row g8" style={{ flexWrap: 'wrap' }}>
          {(SAMPLES[tab] || []).map((s) => <button key={s} type="button" className="chip" style={{ height: 38 }} onClick={() => (tab === 'text' ? setText(s) : setNum(s))}>{s}</button>)}
        </div>
      )}
    </Screen>
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

// ---------- A2b mất mạng ----------
export function Offline() {
  const nav = useNavigate()
  const { state } = useLocation()
  const [run, busy] = useCheckRunner()
  if (busy) return <Checking {...busy} />
  return (
    <Screen name="A2b-mat-mang" bar={<Bar title="Kiểm tra" />}
      foot={<>{state?.value && <Btn icon="refresh" onClick={() => run(state.value, state.kind)}>Thử lại</Btn>}<Btn kind="o" icon="users" onClick={() => nav('/nguoi-than')}>Gọi người thân</Btn></>}>
      <StateView icon="wifioff" iconBg="warn-t" iconColor="warn" title="Mất mạng" text="Đừng chuyển tiền khi chưa kiểm tra được." />
    </Screen>
  )
}

// ---------- A3 kết quả ----------
const LOOK = {
  danger: { tone: 'dang', word: 'NGUY HIỂM', icon: 'xoct', c: 'dang', say: 'Đừng chuyển tiền!' },
  suspicious: { tone: 'warn', word: 'NGHI NGỜ', icon: 'tri', c: 'warn', say: 'Hỏi người thân trước đã.' },
  safe: { tone: 'safe', word: 'AN TOÀN', icon: 'shieldok', c: 'safe', say: '' },
  unknown: { tone: null, word: 'CHƯA RÕ', icon: 'info', c: 'ink2', say: 'Chưa chắc là an toàn.' },
}
const SELF = ['Tôi biết người nhận ngoài đời thật', 'Không ai giục tôi chuyển gấp', 'Không ai bảo tôi giữ bí mật']

export function Result() {
  const nav = useNavigate()
  const { result: r, setReport, persona } = useApp()
  const [ticks, setTicks] = useState([])
  const L = LOOK[r?.level] || LOOK.unknown
  const spoken = r ? `${L.word}. ${r.headline} ${L.say}` : ''
  useEffect(() => {
    if (r && persona === 'elder' && localStorage.getItem('lcs.autoSpeak') !== '0') native.speak(spoken)
    return () => native.stopSpeaking()
  }, [r]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Navigate to="/kiem-tra" replace />
  const isNum = ['phone', 'account', 'call'].includes(r.kind)
  const report = () => { setReport({ draft: { kind: r.kind === 'phone' ? 'call' : r.kind, target: r.display } }); nav('/bao-cao') }
  // Lý do ngắn gọn: bỏ dòng trùng với tiêu đề, tối đa 3 dòng
  const head = (r.headline || '').toLowerCase()
  const reasons = [
    ...(r.scamLabel && r.level !== 'safe' && r.level !== 'unknown' && !head.includes(r.scamLabel.toLowerCase()) ? [{ icon: 'users', text: r.scamLabel }] : []),
    ...(r.why || []).map((t) => ({ icon: /báo cáo/.test(t) ? 'flag' : /xác nhận|xác thực|danh bạ/.test(t) ? 'shieldok' : 'tri', text: t })),
  ].slice(0, 3)
  return (
    <Screen name={`A3-ket-qua-${r.level}`} tone={L.tone} bar={<Bar title="Kết quả" right={<Speak text={spoken} />} />}
      foot={r.level === 'safe'
        ? <><Btn icon="search" onClick={() => nav('/kiem-tra', { replace: true })}>Kiểm tra số khác</Btn><Btn kind="o" icon="users" onClick={() => nav('/hoi-nguoi-than')}>Hỏi người thân</Btn></>
        : <><Btn icon="users" onClick={() => nav('/hoi-nguoi-than')}>Hỏi người thân</Btn><Btn kind="o" icon="flag" onClick={report}>Báo cáo</Btn></>}>
      <div className="hero">
        <div className="ring pop" style={{ background: L.tone ? '#fff' : 'var(--pri-t)' }}>
          <Circle z={108} bg={L.tone ? L.c : 'mute'} c="w" icon={L.icon} iz={54} />
        </div>
        <div className={`word c-${L.c} rise`}>{L.word}</div>
        <div className="t-row c-ink2 rise" style={{ fontWeight: 500, wordBreak: 'break-all', textAlign: 'center' }}>{isNum ? fmtPhone(r.display) : r.display}</div>
      </div>
      <div className="card col g12 rise" style={{ animationDelay: '.06s' }}>
        <div className="h-m">{L.say || r.headline}</div>
        {L.say && <div className="t-sub">{r.headline}</div>}
        {reasons.map((x) => <div key={x.text} className="why"><I n={x.icon} z={22} c={L.tone ? L.c : 'ink2'} /><span>{x.text}</span></div>)}
        {r.note && <div className="why t-sub"><I n="info" z={20} /><span>{r.note}</span></div>}
      </div>
      {r.level === 'unknown' && (
        <Group>
          <div className="sec" style={{ padding: '10px 20px 2px' }}>Trước khi chuyển, tự hỏi 3 câu</div>
          {SELF.map((t) => (
            <button key={t} type="button" className="li" onClick={() => setTicks((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]))}>
              <span className={`radio${ticks.includes(t) ? ' on' : ''}`} /><div className="t-row grow" style={{ fontWeight: 500, fontSize: 18 }}>{t}</div>
            </button>
          ))}
        </Group>
      )}
      {r.lesson && r.level !== 'safe' && (
        <Group><Row icon="book" iconColor="pri" title="Bài học 1 phút về chiêu này" onClick={() => openLesson(nav, r.scamType, r.lesson)} /></Group>
      )}
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

export function reportTarget(r) {
  const quotes = (r.signs || []).flatMap((s) => s.quotes)
  const link = quotes.find(isLink) || (r.maskedText || '').match(LINK_RE)?.[0]
  if (link) return { kind: 'link', target: link }
  return { kind: 'message', target: (r.maskedText || '').slice(0, 120) }
}

export function MessageResult() {
  const nav = useNavigate()
  const { result: r, setReport } = useApp()
  if (!r || r.kind !== 'message') return <Navigate to="/kiem-tra?loai=text" replace />
  const L = LOOK[r.level] || LOOK.unknown
  const quotes = (r.signs || []).flatMap((s) => s.quotes)
  const fromNotif = r.from === 'notification'
  const report = () => { setReport({ draft: { ...reportTarget(r), story: r.maskedText } }); nav('/bao-cao') }
  return (
    <Screen name="B3-phan-tich-tin-nhan" bar={<Bar title="Tin nhắn lạ" right={<Speak text={`${L.word}. ${r.headline}`} />} />}
      foot={<><Btn icon="flag" onClick={report}>Báo cáo</Btn>{r.lesson ? <Btn kind="o" icon="book" onClick={() => openLesson(nav, r.scamType, r.lesson)}>Xem bài học</Btn> : <Btn kind="o" icon="users" onClick={() => nav('/hoi-nguoi-than')}>Hỏi người thân</Btn>}</>}>
      <div className="row g8"><Tag kind="no" icon="msg">{fromNotif ? 'Ứng dụng nhắn tin · Người lạ' : 'Tin dán vào'}</Tag></div>
      <div className="sms rise">{highlight(r.maskedText || '', quotes)}</div>
      <div className="card row g12 rise" style={{ background: L.tone ? `var(--${L.tone}-t)` : '#fff', animationDelay: '.05s' }}>
        <Circle z={52} bg={L.tone ? L.c : 'mute'} c="w" icon={L.icon} iz={26} />
        <div className="col grow g2">
          <div className="h-m" style={{ color: `var(--${L.c})` }}>{L.word}</div>
          <div className="t-sub">{r.signs?.length ? `${r.signs.length} dấu hiệu` : 'Chưa thấy dấu hiệu rõ'}{r.scamLabel && r.level !== 'unknown' ? ` · ${r.scamLabel}` : ''}</div>
        </div>
      </div>
      {r.signs?.length > 0 && (
        <Group>
          {r.signs.map((s, i) => (
            <Row key={s.text} lead={<Circle z={36} bg={i === 0 ? 'dang' : 'dang-t'} c={i === 0 ? 'w' : 'dang'}><b>{i + 1}</b></Circle>} title={s.text} />
          ))}
        </Group>
      )}
      {r.todo?.length > 0 && <div className="card col g10">{r.todo.map((t) => <div key={t} className="why"><I n="check" z={22} c="safe" sw={2.6} /><span>{t}</span></div>)}</div>}
    </Screen>
  )
}

// ---------- E01d chưa đủ thông tin / tin có mã OTP ----------
export function NotEnough() {
  const nav = useNavigate()
  const { result } = useApp()
  const otp = result?.reason === 'otp'
  return (
    <Screen name="E01d-chua-du-thong-tin" bar={<Bar title="Tin nhắn lạ" />}
      foot={<><Btn icon="users" onClick={() => nav('/hoi-nguoi-than')}>Hỏi người thân</Btn><Btn kind="o" onClick={() => nav('/kiem-tra?loai=text', { replace: true })}>Kiểm tra tin khác</Btn></>}>
      <StateView art="nghi" title={otp ? 'Tin có mã xác thực' : 'Chưa đủ thông tin'}
        text={otp ? 'Lá chắn không gửi tin này đi. Đừng đọc mã cho bất kỳ ai, kể cả người xưng ngân hàng, công an.' : 'Tin ngắn quá để kết luận. Chưa chắc là an toàn.'} />
    </Screen>
  )
}
