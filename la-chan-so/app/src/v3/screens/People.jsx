// A4 người thân và đường dây nóng · A4c thêm người thân · A4a chưa có người thân
// Hỏi người thân: gửi · chờ · lời trả lời (đồng bộ với trang Zalo của Minh qua máy chủ) · A8 màn gọi điện mô phỏng
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, Row, Screen, Speak, StateView, Tag, fmtPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { native } from '../../lib/native.js'
import { buzz } from '../../lib/sound.js'
import { FAMILY_ROOM, useApp } from '../../lib/state.jsx'

const HOTLINES = [['Công an', '113'], ['Báo cuộc gọi rác', '156']]
const RELATIONS = ['Con', 'Cháu', 'Vợ / chồng', 'Khác']

// Gọi người thân: máy Android quay số thật (số do người dùng lưu); trình duyệt và đường dây nóng: màn gọi mô phỏng
export function useCall() {
  const nav = useNavigate()
  return (name, phone) => {
    const hotline = HOTLINES.some(([, n]) => n === phone)
    if (phone && !hotline && native.available() && window.LCSNative.call) return native.call(phone)
    nav(`/goi?ten=${encodeURIComponent(name)}${phone ? `&so=${encodeURIComponent(phone)}` : ''}`)
  }
}

// ---------- A4 ----------
export function Relatives() {
  const nav = useNavigate()
  const { relatives } = useApp()
  const call = useCall()
  return (
    <Screen name="A4-nguoi-than" nav="/nguoi-than">
      <div className="h-xl" style={{ paddingTop: 10 }}>Người thân</div>
      <Group>
        {relatives.map((r) => (
          <div key={r.id} className="li tall">
            <div className="avatar">{r.name[0]}</div>
            <button type="button" className="col grow g2 tap" style={{ textAlign: 'left' }} aria-label={`Sửa ${r.name}`} onClick={() => nav(`/nguoi-than/them?id=${encodeURIComponent(r.id)}`)}><div className="t-row">{r.name}</div><div className="t-sub">{r.relation[0].toUpperCase() + r.relation.slice(1)}{r.paired ? ' · đã ghép' : ''}</div></button>
            <button type="button" className="tap" aria-label={`Gọi ${r.name}`} onClick={() => call(r.name, r.phone)}><Circle z={46} bg="pg" c="ink" icon="phone" iz={22} /></button>
            <button type="button" className="tap" aria-label={`Nhắn ${r.name}`} onClick={() => nav(`/hoi-nguoi-than?to=${r.id}`)}><Circle z={46} bg="pri" c="w" icon="msg" iz={22} /></button>
          </div>
        ))}
        <Row icon="plus" title="Thêm người thân" onClick={() => nav('/nguoi-than/them')} />
      </Group>
      <div className="sec">Đường dây nóng</div>
      <Group>
        {HOTLINES.map(([name, num]) => (
          <div key={num} className="li">
            <I n="phone" z={26} />
            <div className="t-row grow">{name}</div>
            <button type="button" className="btn p sm" style={{ height: 42 }} onClick={() => call(name, num)}>Gọi {num}</button>
          </div>
        ))}
      </Group>
    </Screen>
  )
}

// ---------- A4c ----------
export function AddRelative() {
  const nav = useNavigate()
  const { relatives, setRelatives, toast } = useApp()
  const [params] = useSearchParams()
  const existing = relatives.find((r) => r.id === params.get('id'))
  const [name, setName] = useState(existing?.name || '')
  const [phone, setPhone] = useState(existing?.phone || '')
  const [rel, setRel] = useState(RELATIONS.find((r) => r.toLowerCase() === existing?.relation) || existing?.relation || 'Con')
  const save = () => {
    if (!name.trim()) return toast('Bạn nhập tên người thân nhé')
    const id = name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\W+/g, '-') + '-' + Date.now().toString(36).slice(-3)
    const relative = { id, channel: 'Gọi điện, nhắn tin', paired: false, ...existing, name: name.trim(), relation: rel.toLowerCase(), phone: phone.replace(/\D/g, '') }
    const next = existing ? relatives.map((r) => r.id === existing.id ? relative : r) : [...relatives, relative]
    setRelatives(next)
    const main = next.find((r) => r.phone)
    if (main || existing?.phone) window.LCSNative?.saveRelative?.(main?.name || '', main?.phone || '')
    toast(`Đã lưu ${name.trim()}`)
    if (window.history.state?.idx > 0) nav(-1)
    else nav('/nguoi-than', { replace: true })
  }
  return (
    <Screen name="A4c-them-nguoi-than" bar={<Bar title="Người thân" />} foot={<Btn onClick={save}>Lưu</Btn>}>
      <label className="col g8"><span className="t-lbl">Tên</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Lan" autoComplete="off" /></label>
      <label className="col g8"><span className="t-lbl">Số điện thoại</span><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="09xx xxx xxx" /></label>
      <div className="col g8"><span className="t-lbl">Là</span>
        <div className="chips">{RELATIONS.map((x) => <button key={x} type="button" className={`chip${rel === x ? ' on' : ''}`} onClick={() => setRel(x)}>{x}</button>)}</div>
      </div>
    </Screen>
  )
}

// ---------- A4a ----------
export function NoRelatives() {
  const nav = useNavigate()
  return (
    <Screen name="A4a-chua-co-nguoi-than" bar={<Bar title="Hỏi người thân" />} foot={<Btn onClick={() => nav('/nguoi-than/them', { replace: true })}>Chọn người thân</Btn>}>
      <StateView art="gia-dinh" title="Chưa có người thân" text="Thêm con cháu để Lá chắn báo ngay khi có cuộc gọi đáng ngờ." />
    </Screen>
  )
}

// ---------- Hỏi người thân ----------
const LEVEL_WORD = { danger: 'NGUY HIỂM', suspicious: 'NGHI NGỜ', safe: 'AN TOÀN', unknown: 'CHƯA RÕ' }
export function composeAsk(r, persona, to) {
  const me = persona === 'student' ? 'Con' : 'Mẹ'
  const hi = `${to?.name || 'Con'} ơi, `
  if (!r) return `${hi}${me.toLowerCase()} vừa nhận cuộc gọi lạ đòi tiền. Có phải lừa đảo không?`
  const what = {
    phone: `số ${r.display} gọi ${me.toLowerCase()}`, call: `số ${r.display} gọi ${me.toLowerCase()}`,
    link: `${me.toLowerCase()} nhận đường dẫn ${r.display}`, account: `${me.toLowerCase()} định chuyển vào tài khoản ${r.display}`,
    message: `${me.toLowerCase()} nhận một tin nhắn lạ`,
  }[r.kind] || `${me.toLowerCase()} gặp chuyện lạ`
  const money = [...(r.why || []), ...(r.signs || []).map((s) => s.text)].some((t) => /chuyển tiền|nạp/i.test(t))
  return `${hi}${what}${money ? ' đòi tiền' : ''}. Lá chắn báo ${LEVEL_WORD[r.level] || 'CHƯA RÕ'}${r.scamLabel && r.level !== 'unknown' && r.level !== 'safe' ? ` (${r.scamLabel.toLowerCase()})` : ''}. Có phải lừa đảo không?`
}

export function AskSend() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { relatives, result, persona, setAsk, toast } = useApp()
  const call = useCall()
  const [idx, setIdx] = useState(() => Math.max(0, relatives.findIndex((r) => r.id === params.get('to'))))
  const [busy, setBusy] = useState(false)
  const to = relatives[idx] || relatives.find((r) => r.paired)
  const text = useMemo(() => composeAsk(result, persona, to), [result, persona, to])
  if (!to) return <Navigate to="/chua-co-nguoi-than" replace />
  const send = async () => {
    setBusy(true)
    try {
      const isCall = result && (result.kind === 'phone' || result.kind === 'call')
      const r = await api.ask({
        room: FAMILY_ROOM, to: to.id, text, from: persona === 'student' ? 'vy' : 'ba-hoa',
        phone: isCall ? result.display : null, level: result?.level === 'suspicious' ? 'warn' : 'danger',
        scamType: result?.scamType || null, scamLabel: result?.scamLabel || null, asksMoney: /tiền|nạp/i.test(text),
      })
      setAsk({ askId: r.askId, to, text, sentAt: new Date().toISOString(), seen: false, reply: null })
      nav('/hoi-nguoi-than/cho', { replace: true })
    } catch (e) {
      toast(e.offline ? `Không có mạng. Bấm “Gọi điện” cho ${to.name} nhé` : e.message)
    } finally { setBusy(false) }
  }
  return (
    <Screen name="A4-hoi-nguoi-than" bar={<Bar title="Hỏi người thân" right={<Speak text={text} />} />}
      foot={<><Btn icon="send" onClick={send} busy={busy}>Gửi cho {to.name}</Btn><Btn kind="o" icon="phone" onClick={() => call(to.name, to.phone)}>Gọi điện</Btn></>}>
      <div className="li" style={{ background: '#fff', borderRadius: 24 }}>
        <div className="avatar">{to.name[0]}</div>
        <div className="col grow g2"><div className="t-row">{to.name}</div><div className="t-sub">{to.relation[0].toUpperCase() + to.relation.slice(1)}</div></div>
        {relatives.length > 1 && <button type="button" className="t-b c-pri tap" style={{ padding: 8, fontSize: 17 }} onClick={() => setIdx((i) => (i + 1) % relatives.length)}>Đổi</button>}
      </div>
      <div className="bubble rise">{text}</div>
      <div className="t-sm" style={{ textAlign: 'right', padding: '0 6px' }}>{to.paired ? 'Gửi qua ứng dụng nhắn tin đã ghép' : 'Gửi tin nhắn thường'}</div>
    </Screen>
  )
}

export function AskWait() {
  const nav = useNavigate()
  const { ask } = useApp()
  const call = useCall()
  useEffect(() => { if (ask?.reply) nav('/hoi-nguoi-than/tra-loi', { replace: true }) }, [ask?.reply, nav])
  if (!ask) return <Navigate to="/" replace />
  return (
    <Screen name="A4b-cho-tra-loi" bar={<Bar title="Hỏi người thân" left="x" onLeft={() => nav('/', { replace: true })} />}
      foot={<><Btn icon="phone" onClick={() => call(ask.to.name, ask.to.phone)}>Gọi điện</Btn><Btn kind="o" onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn></>}>
      <StateView icon="clock" title={`Chờ ${ask.to.name} trả lời`} text="Đừng chuyển tiền.">
        <div className="row g8 jc" style={{ marginTop: 6 }}>
          <Tag kind="ok" icon="check">Đã gửi {new Date(ask.sentAt).toTimeString().slice(0, 5)}</Tag>
          {ask.seen && <Tag kind="on" icon="check">{ask.to.name} đã xem</Tag>}
        </div>
      </StateView>
    </Screen>
  )
}

export function AskReply() {
  const nav = useNavigate()
  const { ask, result } = useApp()
  const call = useCall()
  const [blocked, setBlocked] = useState(false)
  const phone = result && (result.kind === 'phone' || result.kind === 'call') ? result.display : null
  useEffect(() => {
    if (!ask?.reply) return
    buzz([200, 100, 200])
    native.speak(ask.reply.text)
    if (phone && ask.reply.preset === 'dung_chuyen' && native.available()) setBlocked(native.blockNumber(phone))
    return () => native.stopSpeaking()
  }, [ask?.reply, phone])
  if (!ask?.reply) return <Navigate to="/hoi-nguoi-than" replace />
  const stop = ask.reply.preset !== 'nguoi_quen'
  return (
    <Screen name="A4r-nguoi-than-tra-loi" tone={stop ? 'dang' : 'safe'} bar={<Bar title="" left="x" onLeft={() => nav('/', { replace: true })} right={<Speak text={ask.reply.text} />} />}
      foot={<>
        <Btn icon="phone" onClick={() => call(ask.to.name, ask.to.phone)}>Gọi {ask.to.name}</Btn>
        {phone && !blocked && stop && <Btn kind="o" icon="phoneoff" onClick={() => setBlocked(native.blockNumber(phone) || true)}>Chặn số {fmtPhone(phone)}</Btn>}
        {blocked && <div className="row jc"><Tag kind="on" icon="check">Đã chặn số</Tag></div>}
      </>}>
      <div className="col ac g8 center" style={{ paddingTop: 6 }}>
        <div className="avatar pop" style={{ width: 88, height: 88, borderRadius: 44, fontSize: 36, background: '#fff' }}>{ask.to.name[0]}</div>
        <div className="t-row c-ink2" style={{ fontWeight: 500 }}>{ask.to.name} trả lời lúc {new Date(ask.reply.at || Date.now()).toTimeString().slice(0, 5)}</div>
      </div>
      <div className="bubble in rise" style={{ fontSize: 24, lineHeight: '33px', fontWeight: 700, padding: '20px 22px', maxWidth: '100%', alignSelf: 'stretch' }}>{ask.reply.text}</div>
      {stop && <div className="row g10 jc"><Art name="dung" z={64} /><div className="t-row c-dang">Đừng chuyển tiền</div></div>}
    </Screen>
  )
}

// ---------- A8 màn gọi điện (mô phỏng) ----------
export function SimCall() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const name = params.get('ten') || 'Người thân'
  const num = params.get('so') || ''
  const [sec, setSec] = useState(-3)
  const t = useRef(null)
  useEffect(() => { t.current = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t.current) }, [])
  const timer = sec < 0 ? 'Đang gọi…' : `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  return (
    <Screen name="A8-goi-dien-mo-phong" tone="night">
      <div className="call-who" style={{ paddingTop: 60 }}>
        <div className="call-av pulse">{/^\d+$/.test(num) && num.length <= 4 ? <I n="phone" z={44} /> : <span style={{ fontSize: 42, fontWeight: 700, color: '#fff' }}>{name[0]}</span>}</div>
        <div className="h-xl" style={{ marginTop: 14 }}>{name}</div>
        <div className="t-sub" style={{ color: '#CBD5E1' }}>{num ? `${fmtPhone(num)} · ` : ''}{timer}</div>
      </div>
      <div className="sp" />
      <div className="col ac g12" style={{ paddingBottom: 20 }}>
        <button type="button" className="call-round tap" style={{ background: 'var(--dang)' }} aria-label="Cúp máy" onClick={() => nav(-1)}><I n="phoneoff" z={32} /></button>
        <div className="t-sm" style={{ color: '#94A3B8' }}>Trình gọi điện của máy (mô phỏng)</div>
      </div>
    </Screen>
  )
}
