// U4: Hỏi người thân phía bà Hoa · A08a soạn và gửi · A08b đang chờ · A08c người thân trả lời
// Đồng bộ với máy Minh qua S5 (sự kiện ask.sent, ask.seen, ask.reply).
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { api } from '../lib/api.js'
import { hhmm, LEVEL } from '../lib/format.js'
import { native } from '../lib/native.js'
import { FAMILY_ROOM, useApp } from '../lib/state.jsx'

const css = `
.tl-row{display:flex;align-items:center;gap:12px}
.tl-dot{width:12px;height:12px;border-radius:6px;flex:none;background:var(--ink-3)}
.tl-dot.safe{background:var(--safe)}.tl-dot.brand{background:var(--brand)}
.tl-line{width:2px;height:20px;margin:-6px 0 -6px 5px;border-radius:1px;background:var(--outline);flex:none}
.tl-line.safe{background:var(--safe)}
.answer{font-size:34px;line-height:42px;font-weight:700}
`

// Lời nhắn soạn sẵn từ kết quả vừa kiểm tra. Trả về [trước, MỨC, sau] để tô đậm phần mức độ.
export function composeAsk(result, mode) {
  const me = mode === 'full' ? 'Con' : 'Mẹ'
  const ask = mode === 'full' ? 'Bố mẹ xem giúp con.' : 'Con xem giúp mẹ.'
  if (!result) return [`${me} vừa nhận cuộc gọi lạ. `, '', ask]
  const level = (LEVEL[result.level] || LEVEL.unknown).label.toUpperCase()
  const what = {
    phone: `${me} vừa nhận cuộc gọi từ số ${result.display}.`,
    call: `${me} vừa nhận cuộc gọi từ số ${result.display}.`,
    link: `${me} vừa nhận đường dẫn ${result.display}.`,
    account: `${me} định chuyển tiền vào tài khoản ${result.display}.`,
    message: `${me} vừa nhận một tin nhắn lạ.`,
  }[result.kind] || `${me} vừa gặp chuyện lạ.`
  const details = []
  if (result.scamLabel && result.level !== 'unknown') details.push(result.scamLabel.charAt(0).toLowerCase() + result.scamLabel.slice(1))
  if ([...(result.why || []), ...(result.signs || []).map((s) => s.text)].some((t) => /chuyển tiền|nạp/i.test(t))) details.push('đòi chuyển tiền')
  return [`${what} Lá chắn báo `, level, `${details.length ? ': ' + details.join(', ') : ''}. ${ask}`]
}

function Speaker({ text }) {
  return (
    <button type="button" className="tap c-brand" aria-label="Đọc to" onClick={() => native.speak(text)}>
      <Icon name="volume" />
    </button>
  )
}

function callRelative(rel, toast) {
  if (rel?.phone) native.call(rel.phone)
  else toast(`Đang gọi ${rel?.name || 'người thân'}…`)
}

export function AskSend() {
  const nav = useNavigate()
  const { result, mode, relatives, setAsk, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const parts = useMemo(() => composeAsk(result, mode), [result, mode])
  const to = relatives.find((r) => r.paired) || relatives[0]
  const backup = relatives.find((r) => r !== to)
  if (!to) return <Navigate to="/chua-co-nguoi-than" replace />
  const text = parts.join('')

  const send = async () => {
    setBusy(true)
    try {
      const r = await api.ask({ room: FAMILY_ROOM, to: to.id, text, from: 'ba-hoa' })
      setAsk({ askId: r.askId, to, text, sentAt: new Date().toISOString(), seen: false, reply: null })
      nav('/hoi-nguoi-than/cho')
    } catch (e) {
      toast(e.offline ? `Không có mạng. Bà bấm “Gọi điện cho ${to.name}” nhé` : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Phone name="A08a-hoi-nguoi-than-gui" lg>
      <style>{css}</style>
      <AppBar title="Hỏi người thân"><Speaker text={text} /></AppBar>
      <div className="content" style={{ paddingTop: 4 }}>
        <div className="card row top gap-12">
          <div className="avatar lgx">{to.name[0]}</div>
          <div className="col grow gap-2">
            <div className="t-h2">{to.name} ({to.relation})</div>
            <div className="t-cap muted">{to.channel}</div>
            {to.paired && <span className="chip safe" style={{ alignSelf: 'flex-start', marginTop: 6 }}><Icon name="check" size={14} />Đã ghép</span>}
          </div>
        </div>

        {backup && (
          <button type="button" className="card row gap-12 tap" style={{ padding: '12px 16px' }} onClick={() => toast(`${backup.name} là người nhận dự phòng`)}>
            <div className="avatar amber">{backup.name[0]}</div>
            <div className="t-label semi grow">{backup.name} ({backup.relation})</div>
            <span className="chip outline">Dự phòng</span>
          </button>
        )}

        <div className="card brand col gap-8">
          <div className="t-over c-brand-ink">Tin sẽ gửi</div>
          <div className="t-body c-ink">{parts[0]}{parts[1] && <span className="bold c-danger-ink">{parts[1]}</span>}{parts[2]}</div>
        </div>

        <div className="col gap-12 mt-auto">
          <button type="button" className="btn primary xl block" disabled={busy} onClick={send}><Icon name="send" />Gửi cho {to.name}</button>
          <button type="button" className="btn outline xl block" onClick={() => callRelative(to, toast)}><Icon name="phone" />Gọi điện cho {to.name}</button>
        </div>
      </div>
    </Phone>
  )
}

export function AskWait() {
  const nav = useNavigate()
  const { ask, toast } = useApp()
  useEffect(() => { if (ask?.reply) nav('/hoi-nguoi-than/tra-loi', { replace: true }) }, [ask?.reply, nav])
  if (!ask) return <Navigate to="/hoi-nguoi-than" replace />
  const name = ask.to.name
  const say = `Đã gửi cho ${name}. Đang chờ trả lời. Trong lúc chờ, bà đừng chuyển tiền và đừng nghe lại số lạ.`

  return (
    <Phone name="A08b-hoi-nguoi-than-cho" lg>
      <style>{css}</style>
      <AppBar title="Hỏi người thân" onBack={() => nav('/')}><Speaker text={say} /></AppBar>
      <div className="content" style={{ paddingTop: 4 }}>
        <div className="col acenter" style={{ padding: '36px 0 16px' }}>
          <div className="icon-box xl brand"><Icon name="send" size={40} /></div>
          <div className="t-h1 mt-16">Đã gửi cho {name}</div>
          <div className="t-label muted mt-4">lúc {hhmm(new Date(ask.sentAt))}</div>
        </div>

        <div className="card col" style={{ padding: '18px 20px' }}>
          <div className="tl-row"><div className="tl-dot safe" /><div className="t-body">Đã gửi</div></div>
          <div className={`tl-line${ask.seen ? ' safe' : ''}`} />
          <div className="tl-row"><div className={`tl-dot${ask.seen ? ' safe' : ''}`} /><div className={`t-body${ask.seen ? '' : ' faint'}`}>{name} đã xem</div></div>
          <div className="tl-line" />
          <div className="tl-row"><div className="tl-dot brand" /><div className="t-body bold">Đang chờ trả lời…</div></div>
        </div>

        <div className="card warn row top gap-12">
          <Icon name="hand" size={28} className="c-warn" />
          <div className="t-body c-warn-ink medium grow">Trong lúc chờ, bà đừng chuyển tiền và đừng nghe lại số lạ.</div>
        </div>

        <button type="button" className="btn outline xl block mt-auto" onClick={() => callRelative(ask.to, toast)}><Icon name="phone" />Gọi điện cho {name}</button>
      </div>
    </Phone>
  )
}

export function AskReply() {
  const nav = useNavigate()
  const { ask, result, setReport, toast } = useApp()
  const phone = result && (result.kind === 'phone' || result.kind === 'call') ? result.display : null
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!ask?.reply) return
    native.speak(ask.reply.text)
    // Minh bảo đừng chuyển: chặn luôn số vừa gọi nếu máy cho phép (Android, Mảng 1)
    if (phone && ask.reply.preset === 'dung_chuyen' && native.available()) setBlocked(native.blockNumber(phone))
    return () => native.stopSpeaking()
  }, [ask?.reply, phone])

  if (!ask?.reply) return <Navigate to="/hoi-nguoi-than" replace />
  const name = ask.to.name

  const block = () => {
    if (native.blockNumber(phone)) setBlocked(true)
    else toast('Máy này chưa cho chặn số từ ứng dụng')
  }
  const report = () => {
    setReport({ draft: { kind: 'call', target: phone || '', fromResult: result } })
    nav('/bao-cao')
  }

  return (
    <Phone name="A08c-hoi-nguoi-than-tra-loi" lg>
      <style>{css}</style>
      <AppBar title="Hỏi người thân" onBack={() => nav('/')}><Speaker text={ask.reply.text} /></AppBar>
      <div className="content" style={{ paddingTop: 4 }}>
        <div className="card safe r24 col gap-20" style={{ padding: '24px 20px 28px' }}>
          <div className="row gap-12">
            <div className="avatar lgx">{name[0]}</div>
            <div className="t-label bold c-safe-ink grow">{name} trả lời</div>
            <div className="t-cap muted">{hhmm(new Date(ask.reply.at || Date.now()))}</div>
          </div>
          <div className="answer c-ink">{ask.reply.text}</div>
          <button type="button" className="chip solid-white tap" style={{ alignSelf: 'flex-start' }} onClick={() => native.speak(ask.reply.text)}>
            <Icon name="volume" size={14} />Đang đọc to
          </button>
        </div>

        <div className="col gap-12 mt-auto">
          {phone && (blocked ? (
            <div className="card row gap-12">
              <div className="icon-box danger"><Icon name="ban" size={20} /></div>
              <div className="col grow gap-2">
                <div className="t-label bold">Đã chặn số {phone}</div>
                <div className="t-cap muted">Số này không gọi được cho bà nữa</div>
              </div>
            </div>
          ) : (
            <button type="button" className="card row gap-12 tap" onClick={block}>
              <div className="icon-box danger"><Icon name="ban" size={20} /></div>
              <div className="col grow gap-2">
                <div className="t-label bold">Chặn số {phone}</div>
                <div className="t-cap muted">Để số này không gọi được cho bà nữa</div>
              </div>
            </button>
          ))}
          {phone && <button type="button" className="btn primary xl block" onClick={report}><Icon name="flag" />Báo cáo số này</button>}
          <button type="button" className="btn outline xl block" onClick={() => nav('/')}><Icon name="home" />Về trang chủ</button>
        </div>
      </div>
    </Phone>
  )
}
