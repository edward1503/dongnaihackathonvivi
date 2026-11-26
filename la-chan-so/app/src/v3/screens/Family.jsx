import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, saveTeam } from '../../lib/api.js'
import { familyAlerts, familyCall, familyReply } from '../../lib/family.js'
import { native } from '../../lib/native.js'
import { FAMILY_ROOM, useApp } from '../../lib/state.jsx'
import { Art, Bar, Btn, Group, I, IconBox, Screen, StateView, Tag, maskPhone } from '../ui.jsx'
import './family.css'

const Inbox = createContext(null)
const levels = {
  danger: ['Nguy hiểm', 'dang', 'off', 'alert-oct'], warn: ['Nghi ngờ', 'warn', 'new', 'alert'],
  unknown: ['Chưa rõ', 'pri', 'ok', 'help'], safe: ['Khớp danh bạ', 'safe', 'on', 'shield-check'],
}
levels.suspicious = levels.warn
const levelOf = level => levels[level] || levels.unknown
const stamp = time => time ? new Date(time).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
const masked = text => String(text || '').replace(/\+?\d(?:[ .()-]?\d){7,}/g, maskPhone)
const familyNumber = number => number && number.replace(/\D/g, '').length >= 8 ? maskPhone(number) : 'Số chưa rõ'
const validPhone = value => /^\+?\d{8,15}$/.test(value.replace(/[\s()-]/g, ''))
const phoneKey = 'lcs.motherPhone'
const messageFor = error => error instanceof TypeError || error?.name === 'TimeoutError'
  ? 'Chưa kết nối được. Anh kiểm tra mạng và địa chỉ máy chủ nhé.' : error.message

export function FamilyPair() {
  const nav = useNavigate()
  const { familyCode, setFamilyCode, setMode, setOnboarded } = useApp()
  const [code, setCode] = useState(familyCode || FAMILY_ROOM)
  const [phone, setPhone] = useState(() => localStorage.getItem(phoneKey) || '')
  const [error, setError] = useState('')
  const submit = event => {
    event.preventDefault()
    if (code.trim() !== FAMILY_ROOM) return setError('Mã chưa khớp. Anh xem lại mã trên điện thoại của mẹ nhé.')
    if (phone.trim() && !validPhone(phone)) return setError('Anh kiểm tra lại số điện thoại của mẹ nhé.')
    localStorage.setItem(phoneKey, phone.trim())
    setFamilyCode(code.trim())
    setMode('relative')
    saveTeam(null)
    setOnboarded(true)
    nav('/', { replace: true })
  }
  return <Screen name="family-pair" bar={<Bar title="Ghép với máy mẹ" />}>
    <Art name="gia-dinh" z={108} />
    <form className="col g16" onSubmit={submit}>
      <label className="col g6"><span className="h-m">Mã gia đình</span>
        <span className="t-sub">Trên điện thoại của mẹ, anh mở Cá nhân để xem mã gia đình.</span>
        <input className="field" autoCapitalize="none" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} /></label>
      <label className="col g6"><span className="t-lbl">Số điện thoại của mẹ (tuỳ chọn)</span>
        <input className="field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
      {error && <p className="t-sub c-dang" role="alert">{error}</p>}
      <Btn type="submit" icon="users">Nhận cảnh báo gia đình</Btn>
    </form>
  </Screen>
}

// Poll the room for changes and periodically reconcile the snapshot after a server restart or lost events.
export function FamilyInbox({ children, code }) {
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const revision = useRef(0)
  useEffect(() => {
    let active = true, since = 0, refreshed = 0, timer, running = false
    async function poll() {
      clearTimeout(timer)
      if (running || !active || document.hidden) return
      running = true
      try {
        let changed = Date.now() - refreshed >= 30000
        if (!changed) {
          const { events } = await api.events(code, since)
          since = events.at(-1)?.id ?? since
          changed = events.length > 0
        }
        if (changed && active) {
          const version = revision.current
          const rows = await familyAlerts()
          if (active && version === revision.current) {
            setAlerts([...rows].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)))
            refreshed = Date.now()
          }
        }
        if (active) setError('')
      } catch (e) {
        if (active) setError(messageFor(e))
        refreshed = 0
      } finally {
        running = false
        if (active && !document.hidden) timer = setTimeout(poll, 2500)
      }
    }
    function resume() { refreshed = 0; poll() }
    poll()
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    return () => {
      active = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
    }
  }, [code, attempt])
  function update(row) {
    revision.current++
    setAlerts(rows => rows?.map(old => old.id === row.id ? { ...old, ...row } : old))
  }
  return <Inbox.Provider value={{ alerts, error, update, retry: () => setAttempt(a => a + 1) }}>{children}</Inbox.Provider>
}

function LoadStatus({ error, retry }) {
  return error ? <div className="card col g8" role="status"><p>{error}</p><Btn kind="o" onClick={retry}>Thử lại</Btn></div>
    : <p className="t-sub" role="status">Đang lấy cảnh báo của mẹ…</p>
}

export function FamilyHome() {
  const nav = useNavigate()
  const { alerts, error, retry } = useContext(Inbox)
  return <Screen name="family-alerts" nav="/" bar={<Bar title="Cảnh báo gia đình" left={null} />}>
    {(!alerts || error) && <LoadStatus error={error} retry={retry} />}
    {alerts?.length === 0 && !error && <StateView art="gia-dinh" title="Chưa có cảnh báo" text="Khi máy mẹ gặp cuộc gọi hay tin nhắn đáng ngờ, Bé Nai sẽ báo anh ở đây." />}
    {alerts?.length > 0 && <Group>{alerts.map(a => {
      const [label, tone, kind, icon] = levelOf(a.level)
      return <button className="li family-alert" key={a.id} onClick={() => nav('/canh-bao/' + encodeURIComponent(a.id))}>
        <IconBox icon={icon} tone={tone} z={22} />
        <div className="col grow g6"><div className="row jb"><Tag kind={kind}>{label}</Tag><time className="t-sm">{stamp(a.at)}</time></div>
          <strong className="t-row">{a.who} · {familyNumber(a.number)}</strong>
          <span className="t-sub">{a.reply ? 'Đã trả lời' : 'Chờ anh trả lời'}</span></div><I n="next" className="chev" />
      </button>
    })}</Group>}
  </Screen>
}

function CallMother({ id }) {
  const [phone, setPhone] = useState(() => localStorage.getItem(phoneKey) || '')
  const [editing, setEditing] = useState(false)
  const call = () => {
    if (!validPhone(phone)) { setEditing(true); return }
    localStorage.setItem(phoneKey, phone)
    familyCall(id).catch(() => {})
    native.call(phone.replace(/[\s()-]/g, ''))
  }
  return <>
    {editing && <label className="col g6"><span className="t-lbl">Số điện thoại của mẹ</span>
      <input autoFocus className="field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>}
    <Btn kind="family-call" icon="phone" disabled={editing && !validPhone(phone)} onClick={call}>Gọi mẹ ngay</Btn>
  </>
}

export function FamilyDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const { alerts, error, update, retry } = useContext(Inbox)
  const a = alerts?.find(row => row.id === id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sendError, setSendError] = useState('')
  useEffect(() => {
    if (a?.source !== 'ask' || a.reply || document.hidden) return
    api.askSeen(id).catch(() => {})
  }, [id, a?.source, Boolean(a?.reply)])
  const back = () => nav('/', { replace: true })
  const bar = <Bar title="Cảnh báo gia đình" onLeft={params.has('sent') ? () => setParams({}, { replace: true }) : back} />
  if (!a) return <Screen name="family-detail" bar={bar}>{!alerts || error
    ? <LoadStatus error={error} retry={retry} /> : <StateView art="nghi" title="Không tìm thấy cảnh báo" text="Anh quay lại danh sách để xem các cảnh báo của mẹ nhé." />}</Screen>
  const [label, tone, , icon] = levelOf(a.level)
  const send = async choice => {
    setBusy(true)
    setSendError('')
    try {
      const preset = choice === 'dung-chuyen' ? 'Mẹ đừng chuyển! Con gọi mẹ ngay.' : 'Đây là người quen, mẹ yên tâm.'
      const text = !a.reportId && message.trim() ? preset + ' ' + message.trim() : ''
      update(await familyReply(id, choice, text))
      setParams({ sent: '1' })
    }
    catch (e) { setSendError(messageFor(e)) }
    finally { setBusy(false) }
  }
  if (a.reply && params.get('sent') === '1') return <Screen name="family-sent" bar={bar}>
    <div className="col ac jc center g12 grow family-confirm">
      <IconBox icon="check" tone="solid-safe" size="xl" z={44} /><h1 className="h-l">Đã gửi cho mẹ</h1>
      <p className="t-body c-ink2" role="status">{a.reply.seenAt ? 'Mẹ đã xem lúc ' + stamp(a.reply.seenAt) : 'Đang chờ mẹ xem lời nhắn của anh.'}</p>
    </div>
    <div className="card tone-safe col g8 family-message"><span className="t-lbl c-safe-ink">Lời anh gửi cho mẹ</span><p className="h-m">{a.reply.text}</p></div>
    {error && <LoadStatus error={error} retry={retry} />}
    {a.reportId && a.case && <p className="card t-sub">Mức cộng đồng · {levelOf(a.case.level)[0]} · {a.case.count} máy</p>}
    <CallMother id={id} /><Btn kind="o" onClick={back}>Về danh sách cảnh báo</Btn>
  </Screen>
  const answer = { yes: 'Có, người gọi bảo mẹ chuyển tiền.', no: 'Không, người gọi không bảo mẹ chuyển tiền.', known: 'Mẹ biết số này.' }[a.selfAnswer]
  return <Screen name="family-detail" bar={bar}>
    <div className={`card row g12 tone-${tone}`}>
      <IconBox icon={icon} tone={`solid-${tone}`} size="lgx" z={28} /><div><h1 className={`h-m c-${tone}-ink`}>{label}</h1>
        <time className="t-sub">{stamp(a.at)}{a.kind === 'message' ? ' · Tin nhắn' : a.reportId || a.callSeconds != null ? ' · Cuộc gọi' : ''}</time></div>
    </div>
    <div className="row g12"><div className="avatar">{(a.who || 'Hoa').trim().split(/\s+/).at(-1)[0]}</div>
      <div><div className="t-row">{a.who}</div><div className="t-sub">Số hiển thị · {familyNumber(a.number)}</div></div></div>
    {a.timeline?.length > 0 && <section className="card col g10"><h2 className="t-head">Diễn biến</h2>
      <ol className="family-timeline">{a.timeline.map((item, i) => <li key={i} data-tone={item.tone}>
        <time className="t-sm">{item.t}</time><p>{masked(item.text)}</p></li>)}</ol></section>}
    <section className="card tone-ai col g8 family-summary"><h2 className="ai-tag"><I n="sparkles" z={16} />{a.source === 'ask' ? 'Lời mẹ nhắn (đã che số)' : a.aiLevel || a.source === 'demo' ? 'Tóm tắt của AI (đã che thông tin riêng)' : 'Tóm tắt đã che thông tin riêng'}</h2>
      {a.scenario && <p>{masked(a.scenario)}</p>}
      {a.aiLevel && <strong>Nhãn AI của bản ghi · {levelOf(a.aiLevel)[0]}</strong>}
      <p>{masked(a.summaryMasked) || 'Chưa có tóm tắt cho cảnh báo này.'}</p>
      {answer && <p><strong>Mẹ trả lời Bé Nai</strong><br />{answer}</p>}
      {a.reportId && <p>Bà đã báo cuộc này, câu trả lời của anh giúp xác nhận.</p>}
    </section>
    <CallMother id={id} />
    {a.reply && <Btn kind="o" icon="check" onClick={() => setParams({ sent: '1' })}>Xem lời đã gửi</Btn>}
    {!a.reportId && <label className="col g6"><span className="t-sub">Lời nhắn thêm cho mẹ (tuỳ chọn)</span>
      <input className="field" maxLength={160} value={message} onChange={e => setMessage(e.target.value)} /></label>}
    {sendError && <p role="alert" className="c-dang">{sendError}</p>}
    <Btn kind="d" icon="send" disabled={busy} onClick={() => send('dung-chuyen')}>Đừng chuyển</Btn>
    <Btn kind="o" disabled={busy} onClick={() => send('nguoi-quen')}>Người quen</Btn>
  </Screen>
}
