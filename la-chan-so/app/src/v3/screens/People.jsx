// A4 người thân và đường dây nóng · A4c thêm người thân · A4a chưa có người thân
// Hỏi người thân: gửi · chờ · lời trả lời (đồng bộ với trang Zalo của Minh qua máy chủ) · A8 màn gọi điện mô phỏng
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, IconBox, Row, Screen, Speak, StateView, Tag, fmtPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { native } from '../../lib/native.js'
import { buzz } from '../../lib/sound.js'
import { FAMILY_ROOM, useApp } from '../../lib/state.jsx'

const HOTLINES = [['Công an', '113'], ['Báo cuộc gọi rác', '156']]
const APP_NAME = 'Lá chắn số'
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
const relationLabel = (r) => (r.relation ? r.relation[0].toUpperCase() + r.relation.slice(1) : '')

export function Relatives() {
  const nav = useNavigate()
  const { relatives } = useApp()
  const call = useCall()
  return (
    <Screen name="A4-nguoi-than" bar={<Bar title="Người thân" />}>
      {relatives.map((r, i) => (
        <div key={r.id} className="card tight row g12">
          <div className={`avatar${i ? ' amber' : ''}`}>{r.name[0]}</div>
          <button type="button" className="col grow g2 tap" style={{ textAlign: 'left' }} aria-label={`Sửa ${r.name}`} onClick={() => nav(`/nguoi-than/them?id=${encodeURIComponent(r.id)}`)}>
            <span className="t-row">{r.name}</span>
            <span className="row g6" style={{ flexWrap: 'wrap' }}><span className="t-sm">{relationLabel(r)}</span>{r.paired && <Tag kind="on" icon="check">Đã ghép</Tag>}</span>
          </button>
          <button type="button" className="tap" aria-label={`Gọi ${r.name}`} onClick={() => call(r.name, r.phone)}><span className="round-btn"><I n="phone" z={22} /></span></button>
          <button type="button" className="tap" aria-label={`Nhắn ${r.name}`} onClick={() => nav(`/hoi-nguoi-than?to=${r.id}`)}><span className="round-btn solid"><I n="msg" z={22} /></span></button>
        </div>
      ))}
      <button type="button" className="card tight row g12 tap" onClick={() => nav('/nguoi-than/them')}>
        <IconBox icon="plus" tone="pri" z={20} /><span className="t-row grow c-pri">Thêm người thân</span>
      </button>
      <div className="t-head" style={{ marginTop: 8 }}>Đường dây nóng</div>
      <div className="group">
        {HOTLINES.map(([name, num]) => (
          <div key={num} className="li">
            <IconBox icon="phone" tone="dang" size="sm" z={20} />
            <div className="t-row grow">{name}</div>
            <button type="button" className="btn p sm" onClick={() => call(name, num)}>Gọi {num}</button>
          </div>
        ))}
      </div>
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
      <label className="col g8"><span className="t-head">Tên</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Lan" autoComplete="off" /></label>
      <label className="col g8"><span className="t-head">Số điện thoại</span><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="09xx xxx xxx" /></label>
      <div className="col g8"><span className="t-head">Là</span>
        <div className="chips">{RELATIONS.map((x) => <button key={x} type="button" className={`chip${rel === x ? ' on' : ''}`} onClick={() => setRel(x)}>{x}</button>)}</div>
      </div>
    </Screen>
  )
}

// ---------- A4a (E01b) ----------
export function NoRelatives() {
  const nav = useNavigate()
  const call = useCall()
  return (
    <Screen name="E01b-chua-co-nguoi-than"
      bar={<Bar title="Hỏi người thân" right={<Speak text="Chưa có người thân nào. Thêm con, cháu để Lá chắn báo ngay khi có nguy hiểm." />} />}
      foot={<>
        <Btn icon="users" onClick={() => nav('/nguoi-than/them', { replace: true })}>Thêm người thân</Btn>
        <button type="button" className="btn ghost" onClick={() => call('Công an', '113')}><I n="phone" />Cần gấp? Gọi 113</button>
      </>}>
      <StateView art="gia-dinh" square title="Chưa có người thân nào" text="Thêm con, cháu để Lá chắn báo ngay khi có nguy hiểm." />
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

// Tô đậm mức cảnh báo trong lời nhắn ("NGUY HIỂM" màu đỏ thẫm)
const WORD_TONE = { 'NGUY HIỂM': 'c-dang-ink', 'NGHI NGỜ': 'c-warn-ink', 'AN TOÀN': 'c-safe-ink', 'CHƯA RÕ': 'c-ink' }
function AskText({ text }) {
  return text.split(/(NGUY HIỂM|NGHI NGỜ|AN TOÀN|CHƯA RÕ)/).map((part, i) =>
    WORD_TONE[part] ? <b key={i} className={WORD_TONE[part]}>{part}</b> : part)
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
    <Screen name="A08a-hoi-nguoi-than-gui" bar={<Bar title="Hỏi người thân" right={<Speak text={text} />} />}
      foot={<><Btn icon="send" onClick={send} busy={busy}>Gửi cho {to.name}</Btn><Btn kind="o" icon="phone" onClick={() => call(to.name, to.phone)}>Gọi điện cho {to.name}</Btn></>}>
      {relatives.map((r, i) => i === idx ? (
        <div key={r.id} className="card row as g12" aria-current="true">
          <div className="avatar big">{r.name[0]}</div>
          <div className="col grow g2">
            <div className="h-m">{r.name}{r.relation ? ` (${r.relation})` : ''}</div>
            <div className="t-sm">{r.paired ? `Nhận qua ${APP_NAME}` : 'Gửi tin nhắn thường'}</div>
            {r.paired && <span style={{ marginTop: 6 }}><Tag kind="on" icon="check">Đã ghép</Tag></span>}
          </div>
        </div>
      ) : (
        <button key={r.id} type="button" className="card tight row g12 tap" aria-label={`Gửi cho ${r.name}`} onClick={() => setIdx(i)}>
          <div className="avatar amber">{r.name[0]}</div>
          <div className="col grow"><div className="t-row">{r.name}</div>{r.relation && <div className="t-sm">{relationLabel(r)}</div>}</div>
          <Tag kind="line">{r.paired ? 'Đã ghép' : 'Dự phòng'}</Tag>
        </button>
      ))}
      <div className="card tone-pri col g8 rise">
        <div className="t-over c-pri-ink">Tin sẽ gửi</div>
        <div className="t-body"><AskText text={text} /></div>
      </div>
    </Screen>
  )
}

// ---------- A08b đang chờ ----------
export function AskWait() {
  const nav = useNavigate()
  const { ask, persona } = useApp()
  const call = useCall()
  useEffect(() => { if (ask?.reply) nav('/hoi-nguoi-than/tra-loi', { replace: true }) }, [ask?.reply, nav])
  if (!ask) return <Navigate to="/" replace />
  const elder = persona === 'elder'
  const name = ask.to.name
  const hint = elder ? 'Trong lúc chờ, bà đừng chuyển tiền và đừng nghe lại số lạ.' : 'Trong lúc chờ, đừng chuyển tiền và đừng nghe lại số lạ.'
  return (
    <Screen name="A08b-hoi-nguoi-than-cho" bar={<Bar title="Hỏi người thân" onLeft={() => nav('/', { replace: true })} right={<Speak text={`Đã gửi cho ${name}. ${hint}`} />} />}
      foot={<Btn kind="o" icon="phone" onClick={() => call(name, ask.to.phone)}>Gọi điện cho {name}</Btn>}>
      <div className="col ac center" style={{ padding: '28px 0 12px' }}>
        <IconBox icon="send" tone="pri" size="xl" z={40} />
        <div className="h-l" style={{ marginTop: 16 }}>Đã gửi cho {name}</div>
        <div className="t-lbl" style={{ marginTop: 4, fontWeight: 500 }}>lúc {new Date(ask.sentAt).toTimeString().slice(0, 5)}</div>
      </div>
      <div className="card tl" style={{ padding: '18px 20px' }} role="status">
        <div className="tl-row"><span className="tl-dot safe" /><span className="t-body">Đã gửi</span></div>
        <div className={`tl-line${ask.seen ? ' safe' : ''}`} />
        <div className="tl-row"><span className={`tl-dot${ask.seen ? ' safe' : ''}`} /><span className={`t-body${ask.seen ? '' : ' c-mute'}`}>{ask.seen ? `${name} đã xem` : `${name} chưa xem`}</span></div>
        <div className="tl-line" />
        <div className="tl-row"><span className="tl-dot pri" /><span className="t-body t-b">Đang chờ trả lời…</span></div>
      </div>
      <div className="card tone-warn row as g12">
        <I n="hand" z={28} c="warn" />
        <div className="t-body c-warn-ink grow" style={{ fontWeight: 500 }}>{hint}</div>
      </div>
    </Screen>
  )
}

// ---------- A08c người thân trả lời ----------
export function AskReply() {
  const nav = useNavigate()
  const { ask, result, persona } = useApp()
  const call = useCall()
  const [blocked, setBlocked] = useState(false)
  const phone = !ask?.fromInbox && result && (result.kind === 'phone' || result.kind === 'call') ? result.display : null
  const say = ask?.reply ? `${ask.to?.name || 'Người thân'} trả lời rồi nè bà: ${ask.reply.text}` : ''
  useEffect(() => {
    if (!ask?.reply) return
    buzz([200, 100, 200])
    native.speak(say)
    if (phone && ask.reply.preset === 'dung_chuyen' && native.available()) setBlocked(native.blockNumber(phone))
    return () => native.stopSpeaking()
  }, [ask?.reply, phone])
  useEffect(() => {
    if (!ask?.reply?.id) return
    let timer, active = true
    const acknowledge = async () => {
      clearTimeout(timer)
      if (document.hidden) return
      try { await api.replySeen(ask.askId, ask.reply.id) }
      catch (error) { if (active && (!error.status || error.status >= 500)) timer = setTimeout(acknowledge, 5000) }
    }
    acknowledge()
    document.addEventListener('visibilitychange', acknowledge)
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', acknowledge) }
  }, [ask?.askId, ask?.reply?.id])
  if (!ask?.reply) return <Navigate to="/hoi-nguoi-than" replace />
  const stop = ask.reply.preset !== 'nguoi_quen'
  const name = ask.to.name
  const elder = persona === 'elder'
  return (
    <Screen name="A08c-hoi-nguoi-than-tra-loi" bar={<Bar title="Hỏi người thân" onLeft={() => nav('/', { replace: true })} right={<Speak text={`${name} trả lời: ${ask.reply.text}`} />} />}
      foot={stop && phone
        ? <><Btn icon="flag" onClick={() => nav('/bao-cao')}>{elder ? 'Báo cuộc vừa nhận' : 'Báo cáo'}</Btn><Btn kind="o" icon="phone" onClick={() => call(name, ask.to.phone)}>Gọi {name}</Btn></>
        : <><Btn icon="phone" onClick={() => call(name, ask.to.phone)}>Gọi {name}</Btn><Btn kind="o" icon="home" onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn></>}>
      <div className="card tone-safe r24 col g20 pop" style={{ padding: '24px 20px 24px' }}>
        <div className="row g12">
          <div className="avatar big">{name[0]}</div>
          <div className="t-head c-safe-ink grow">{name} trả lời</div>
          <div className="t-sm">{new Date(ask.reply.at || Date.now()).toTimeString().slice(0, 5)}</div>
        </div>
        <div className="answer">{ask.reply.text}</div>
        <div className="row jb g8">
          <button type="button" className="tag w tap" onClick={() => native.speak(say)}><I n="vol" z={16} />Nghe lại</button>
          {stop && <Art name="dung" z={56} />}
        </div>
      </div>
      <div className="sp" />
      {phone && stop && (blocked ? (
        <div className="card tight row g12">
          <IconBox icon="ban" tone="dang" z={20} />
          <div className="col grow g2"><div className="t-head">Đã chặn số {fmtPhone(phone)}</div><div className="t-sm">Số này không gọi được cho {elder ? 'bà' : 'bạn'} nữa</div></div>
        </div>
      ) : (
        <div className="card tight row g12">
          <IconBox icon="ban" tone="dang" z={20} />
          <div className="col grow g2"><div className="t-head">Chặn số {fmtPhone(phone)}</div><div className="t-sm">Để số này không gọi được nữa</div></div>
          <button type="button" className="btn o sm" onClick={() => setBlocked(native.blockNumber(phone) || true)}>Chặn</button>
        </div>
      ))}
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
