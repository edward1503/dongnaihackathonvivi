// Lá chắn cuộc gọi (phần ban giám khảo thích), vẽ theo V3:
//   A03 đổ chuông có thẻ cảnh báo · A04a Bé Nai hỏi một câu · A04b AI chép lời, phân tích, tự báo Minh
//   A10a/A10b "Dừng lại" khi mở ứng dụng ngân hàng · A05a thông báo nổi khi có tin nhắn lạ
// Android (Mảng 1) mở các đường dẫn này trong WebView:
//   #/cuoc-goi?so=…   #/sau-cuoc-goi?so=…&giay=252&ghiam=1   #/dung-lai?phut=4   #/dung-lai?danggoi=1&so=…&giay=401
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, Logo, Row, Screen, Speak, Tag, fmtPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { hhmm } from '../../lib/format.js'
import { native } from '../../lib/native.js'
import { buzz, playSound, startRinging, stopSound } from '../../lib/sound.js'
import { FAMILY_ROOM, useApp } from '../../lib/state.jsx'
import { highlight } from './Check.jsx'
import { useCall } from './People.jsx'
import askAudio from '../../../../prototype/audio/benai-10.m4a'
import yesAudio from '../../../../prototype/audio/benai-11.m4a'
import noAudio from '../../../../prototype/audio/benai-12.m4a'
import stopAudio from '../../../../prototype/audio/benai-13.m4a'

const CALL_DEMO = '0912345678'
const DEMO_TRANSCRIPT = [
  'Người gọi: Tôi là cán bộ điều tra. Bà có liên quan đến một vụ án rửa tiền.',
  'Người gọi: Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút.',
  'Người gọi: Việc này không được nói với ai, kể cả con cái.',
].join('\n')

function useVoice() {
  useEffect(() => () => stopSound(), [])
  return playSound
}
const words = (sec) => { const s = Math.max(0, Math.round(sec || 0)); return `${Math.floor(s / 60)} phút ${s % 60} giây` }

// ---------- A03 đổ chuông ----------
export function IncomingCall() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { setCall, toast } = useApp()
  const phone = params.get('so') || CALL_DEMO
  const [r, setR] = useState(null)
  useEffect(() => {
    let alive = true
    api.lookupPhone(phone).then((x) => alive && setR(x)).catch(() => alive && setR({ level: 'unknown', display: phone, reports: {} }))
    return () => { alive = false }
  }, [phone])
  const danger = r?.level === 'danger'
  useEffect(() => (native.available() || !r ? undefined : startRinging({ danger })), [r, danger])
  const answer = () => {
    setCall({ phone, display: r?.display || phone, lookup: r, startedAt: new Date().toISOString(), seconds: 252, hasRecording: true })
    if (!native.available()) toast('Mô phỏng: bà nghe máy 4 phút rồi cúp')
    nav(`/sau-cuoc-goi?so=${encodeURIComponent(phone)}&giay=252&ghiam=1`, { replace: true })
  }
  return (
    <Screen name={danger ? 'A03a-do-chuong-nguy-hiem' : 'A03b-do-chuong-chua-ro'} tone="night" pad="8px 0 0">
      {r && danger && (
        <div className="warn-card rise">
          <div className="row g8"><Logo z={24} /><span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.8px' }}>LÁ CHẮN SỐ CẢNH BÁO</span></div>
          <div className="row g10"><I n="xoct" z={30} /><span style={{ fontSize: 28, lineHeight: '34px', fontWeight: 700 }}>Nghi lừa đảo</span></div>
          <div style={{ fontSize: 17, lineHeight: '24px', fontWeight: 500 }}>{r.headline}</div>
          {r.reports?.lastWhen && <span className="tag w" style={{ alignSelf: 'flex-start' }}><I n="clock" z={15} />Báo cáo gần nhất: {r.reports.lastWhen}</span>}
          <button type="button" className="btn w" style={{ height: 54 }} onClick={() => { native.blockNumber(phone); toast(`Đã chặn số ${fmtPhone(phone)}`); nav('/', { replace: true }) }}>Chặn số này</button>
        </div>
      )}
      {r && !danger && (
        <div className="row g10 rise" style={{ margin: '0 14px', padding: '12px 16px', borderRadius: 20, background: 'rgba(255,255,255,.08)', color: '#CBD5E1' }}>
          <Logo z={26} />
          <span style={{ fontSize: 15, lineHeight: '21px' }}>{r.level === 'safe' ? 'Số khớp danh bạ tổng đài. Đừng đọc mã xác thực cho ai.' : 'Lá chắn chưa thấy dấu hiệu rủi ro nên không cảnh báo.'}</span>
        </div>
      )}
      <div className="call-who">
        <div className="call-av"><I n="user" z={50} /></div>
        <div className="call-num" style={{ marginTop: 12 }}>{fmtPhone(r?.display || phone)}</div>
        <div className="t-sub" style={{ color: '#94A3B8' }}>{danger ? 'Cuộc gọi đến · Số lạ' : 'Cuộc gọi đến · Số chưa lưu'}</div>
      </div>
      <div className="sp" />
      <div className="call-btns">
        <button type="button" className="call-btn tap" onClick={() => { toast('Đã từ chối cuộc gọi'); nav('/', { replace: true }) }}>
          <div className="call-round" style={{ background: 'var(--dang)' }}><I n="phoneoff" z={32} /></div>Từ chối
        </button>
        <button type="button" className="call-btn tap" onClick={answer}>
          <div className="call-round ringing" style={{ background: '#1B9E4B' }}><I n="phone" z={32} /></div>Nghe
        </button>
      </div>
    </Screen>
  )
}

// ---------- Điều phối sau khi cúp máy ----------
export function AfterCall() {
  const [params] = useSearchParams()
  const { call, setCall } = useApp()
  const phone = params.get('so') || call?.phone || CALL_DEMO
  const seconds = Number(params.get('giay') || call?.seconds || 0)
  const hasRecording = params.get('ghiam') === '1'
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setCall((c) => ({ ...(c?.phone === phone ? c : {}), phone, display: c?.display || phone, seconds, hasRecording, answeredYes: false, endedAt: new Date().toISOString() }))
    setReady(true)
  }, [phone, seconds, hasRecording, setCall])
  return ready ? <Navigate to="/hoi-nhanh" replace /> : null
}

// ---------- A04a Bé Nai hỏi một câu ----------
export function QuickAsk() {
  const nav = useNavigate()
  const { call, setCall, toast } = useApp()
  const play = useVoice()
  const [listening, setListening] = useState(false)
  useEffect(() => { play(askAudio) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const yes = () => {
    play(yesAudio)
    setCall((c) => ({ ...(c || { phone: CALL_DEMO, seconds: 252, hasRecording: true }), answeredYes: true }))
    nav(call?.hasRecording === false ? '/ke-lai' : '/phan-tich-cuoc-goi', { replace: true })
  }
  const no = () => { play(noAudio); toast('Dạ vậy thì tốt rồi ạ'); setTimeout(() => nav('/', { replace: true }), 1200) }
  const listen = async () => {
    setListening(true)
    const heard = ((await native.listen()) || '').toLowerCase()
    setListening(false)
    if (/\bkhông\b|\bko\b/.test(heard)) no()
    else if (/\bcó\b/.test(heard)) yes()
    else toast('Bà bấm Có hoặc Không nhé')
  }
  return (
    <Screen name="A04a-be-nai-hoi" tone="white" bar={<Bar title="Bé Nai hỏi thăm" left="x" onLeft={() => nav('/', { replace: true })}
      right={<button type="button" className="ib" aria-label="Nghe lại" onClick={() => play(askAudio)}><I n="vol" /></button>} />}
      foot={<>
        <div className="row g12">
          <button type="button" className="btn p" style={{ height: 78, fontSize: 26, flex: 1, width: 'auto' }} onClick={yes}>Có</button>
          <button type="button" className="btn o" style={{ height: 78, fontSize: 26, flex: 1, width: 'auto' }} onClick={no}>Không</button>
        </div>
        <button type="button" className="t-b c-pri center tap" style={{ padding: 6, fontSize: 17 }} onClick={() => {
          const list = JSON.parse(localStorage.getItem('lcs.known') || '[]')
          if (call?.phone) localStorage.setItem('lcs.known', JSON.stringify([...new Set([...list, call.phone])]))
          toast('Bé Nai nhớ rồi, lần sau số này gọi sẽ không hỏi nữa'); nav('/', { replace: true })
        }}>Tôi biết số này</button>
      </>}>
      <div className="col ac g14 center grow jc">
        <Art name="nghi" z={210} className="pop bounce" />
        <button type="button" className="row g8 c-pri tap" onClick={listen}><I n="mic" z={20} /><span className="t-lbl c-pri">{listening ? 'Bé Nai đang nghe bà…' : 'Bé Nai đang hỏi bà…'}</span></button>
        <div className="h-l rise">Người vừa gọi có bảo bà chuyển tiền không ạ?</div>
        {call?.phone && <div className="t-sub">{fmtPhone(call.phone)} · {words(call.seconds)}</div>}
      </div>
    </Screen>
  )
}

// ---------- A04b AI chép lời, phân tích, tự báo Minh ----------
function split(text) {
  return (text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(Người gọi|Người nghe|Bà kể)\s*:\s*(.*)$/)
    return m ? { who: m[1], text: m[2] } : { who: '', text: l }
  })
}

export function CallAnalysis() {
  const nav = useNavigate()
  const { call, relatives, ask, setAsk, setResult, toast } = useApp()
  const callTo = useCall()
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const [alerted, setAlerted] = useState(null)
  const started = useRef(false)
  const minh = relatives.find((x) => x.paired) || relatives[0]
  const c = call || { phone: CALL_DEMO, seconds: 252, hasRecording: true }
  useEffect(() => { if (alerted && ask?.askId === alerted.id && ask.reply) nav('/hoi-nguoi-than/tra-loi', { replace: true }) }, [ask, alerted, nav])
  useEffect(() => { if (!started.current) { started.current = true; run() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    setError(null)
    try {
      let res
      if (native.available() && window.LCSNative.analyzeRecording && c.hasRecording) {
        res = JSON.parse(await window.LCSNative.analyzeRecording(String(c.phone || '')))
        if (!res) throw new Error("Chưa tìm thấy bản ghi phù hợp để phân tích.")
      } else {
        const form = new FormData()
        form.append('phone', c.phone || '')
        form.append('unknownNumber', 'true')
        form.append('transcript', c.story ? `Bà kể: ${c.story}` : DEMO_TRANSCRIPT)
        res = await api.analyzeCall(form)
      }
      if (c.answeredYes) {
        res = { ...res, why: ['Bà trả lời: có đòi chuyển tiền', ...(res.why || [])] }
        if (res.level !== 'danger') res = { ...res, level: 'danger', reason: null, headline: res.headline || 'Người gọi đòi chuyển tiền.' }
      }
      setR(res)
      setResult(res)
      if (res.level === 'danger') buzz([300, 120, 300])
      if (res.level === 'danger' && minh) notify(res)
    } catch (e) {
      setError(e.offline ? 'Không có mạng. Bà gọi Minh trước nhé.' : e.message || 'Chưa phân tích được')
    }
  }

  async function notify(res) {
    const timeline = [
      { t: hhmm(new Date(c.startedAt || Date.now() - (c.seconds || 0) * 1000)), text: `Cuộc gọi đến từ ${res.display}, dài ${words(c.seconds)}`, tone: '' },
      { t: hhmm(), text: `Lá chắn phân tích ${res.maskedText ? 'bản ghi âm' : 'cuộc gọi'}: Nguy hiểm`, tone: 'danger' },
    ]
    if (c.answeredYes) timeline.push({ t: hhmm(), text: 'Mẹ trả lời: có đòi chuyển tiền', tone: 'danger' })
    const summary = [res.headline, res.signs?.length ? `Dấu hiệu: ${res.signs.map((s) => s.text.toLowerCase()).join(', ')}.` : ''].filter(Boolean).join(' ')
    try {
      const a = await api.alert({
        room: FAMILY_ROOM, level: 'danger', who: 'Mẹ Hoa', phone: c.phone, scamType: res.scamType, scamLabel: res.scamLabel,
        asksMoney: Boolean(c.answeredYes) || (res.signs || []).some((s) => /chuyển tiền|nạp/i.test(s.text)),
        callSeconds: c.seconds, summary, timeline, from: 'ba-hoa', eventId: `web-${c.phone}-${c.endedAt || c.startedAt || ''}`,
      })
      setAlerted({ id: a.id, at: new Date() })
      setAsk({ askId: a.id, to: minh, text: summary, sentAt: new Date().toISOString(), seen: false, reply: null })
    } catch {
      toast(`Chưa báo được cho ${minh.name}. Bà bấm “Gọi ${minh.name} ngay” nhé`)
    }
  }

  if (error) {
    return (
      <Screen name="A04b-phan-tich-ghi-am" bar={<Bar title="Phân tích cuộc gọi" left="x" onLeft={() => nav('/', { replace: true })} />}
        foot={<><Btn icon="refresh" onClick={run}>Thử lại</Btn><Btn kind="o" icon="phone" onClick={() => callTo(minh?.name || 'Người thân', minh?.phone)}>Gọi {minh?.name || 'người thân'}</Btn></>}>
        <div className="col ac jc g12 grow center"><Art name="nghi" z={160} /><div className="h-m">{error}</div></div>
      </Screen>
    )
  }
  if (!r) {
    return (
      <Screen name="A04b-phan-tich-ghi-am" tone="white" bar={<Bar title="Phân tích cuộc gọi" left="x" onLeft={() => nav('/', { replace: true })} />}>
        <div className="col ac jc g14 grow center">
          <Art name="nghi" z={180} className="bounce" />
          <div className="h-m">AI đang nghe lại cuộc gọi…</div>
          <div className="t-sub">Số điện thoại, số tài khoản được che trước khi gửi AI</div>
          <I n="refresh" z={28} c="pri" className="spin" />
        </div>
      </Screen>
    )
  }
  const lines = split(r.maskedText)
  const quotes = (r.signs || []).flatMap((s) => s.quotes)
  const danger = r.level === 'danger'
  return (
    <Screen name="A04b-phan-tich-ghi-am" tone={danger ? 'dang' : undefined} bar={<Bar title="Phân tích cuộc gọi" left="x" onLeft={() => nav('/', { replace: true })} right={<Speak text={`${danger ? 'Nguy hiểm' : ''}. ${r.headline}`} />} />}
      foot={<><Btn icon="phone" onClick={() => callTo(minh?.name || 'Người thân', minh?.phone)}>Gọi {minh?.name || 'người thân'} ngay</Btn><Btn kind="o" onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn></>}>
      <div className="row g12 rise">
        <Circle z={64} bg={danger ? 'dang' : 'warn'} c="w" icon={danger ? 'xoct' : 'tri'} iz={32} />
        <div className="col grow g2">
          <div className="h-m" style={{ color: `var(--${danger ? 'dang' : 'warn'})` }}>{danger ? 'NGUY HIỂM' : 'NGHI NGỜ'}</div>
          <div className="t-sub c-ink">{r.headline}</div>
        </div>
      </div>
      {danger && (minh
        ? <div className="li" style={{ background: '#fff', borderRadius: 22 }}><I n="send" z={24} c="safe" /><div className="t-row grow" style={{ fontSize: 17 }}>{alerted ? `Đã báo cho ${minh.name} lúc ${hhmm(alerted.at)}` : `Đang báo cho ${minh.name}…`}</div>{alerted && <Tag kind="on" icon="check">Đã gửi</Tag>}</div>
        : <Group><Row icon="users" iconColor="warn" title="Chưa có người thân để báo" onClick={() => nav('/nguoi-than/them')} /></Group>)}
      {lines.length > 0 && (
        <div className="card col g10">
          <div className="t-lbl">Bản ghi đã che số</div>
          {lines.map((l, i) => (
            <div key={i} className="col g2">
              {l.who && <div className="t-sm t-s">{l.who}</div>}
              <div className="sms" style={{ fontSize: 16, lineHeight: '24px', padding: '10px 14px' }}>{highlight(l.text, quotes)}</div>
            </div>
          ))}
        </div>
      )}
      {r.signs?.length > 0 && <Group>{r.signs.map((s, i) => <Row key={s.text} lead={<Circle z={34} bg="dang-t" c="dang"><b>{i + 1}</b></Circle>} title={s.text} />)}</Group>}
    </Screen>
  )
}

// ---------- A10a / A10b "Dừng lại" ----------
export function StopScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { relatives, toast } = useApp()
  const play = useVoice()
  const minh = relatives.find((x) => x.paired) || relatives[0]
  const inCall = params.get('danggoi') === '1'
  const phone = params.get('so') || '0987654321'
  const [sec, setSec] = useState(Number(params.get('giay') || 401))
  useEffect(() => {
    if (!inCall) return undefined
    const t = setInterval(() => setSec((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [inCall])
  useEffect(() => {
    buzz([600, 200, 600])
    if (inCall) native.speak('Dừng lại. Bà đang nghe máy với số chưa quen và mở ứng dụng ngân hàng. Người gọi giục chuyển tiền thì bà cúp máy nhé.')
    else play(stopAudio)
    return () => native.stopSpeaking()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const mmss = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  const hangUp = () => {
    native.stopSpeaking()
    if (window.LCSNative?.endCall) window.LCSNative.endCall()
    else toast('Mô phỏng: đã cúp máy')
    nav(`/sau-cuoc-goi?so=${encodeURIComponent(phone)}&giay=${sec}&ghiam=1`, { replace: true })
  }
  return (
    <Screen name={inCall ? 'A10b-phanh-dang-goi' : 'A10a-phanh-sau-cuoc-goi'} tone="red"
      foot={<>
        {inCall
          ? <Btn kind="w" icon="phoneoff" onClick={hangUp}>Cúp máy ngay</Btn>
          : <Btn kind="w" icon="users" onClick={() => nav('/hoi-nguoi-than', { replace: true })}>Hỏi con {minh?.name || ''} trước</Btn>}
        {inCall
          ? <Btn kind="ow" icon="users" onClick={() => nav('/hoi-nguoi-than', { replace: true })}>Hỏi con {minh?.name || ''} trước</Btn>
          : <Btn kind="ow" onClick={() => { window.LCSNative?.dismissStop?.(); nav('/', { replace: true }) }}>Đóng cảnh báo</Btn>}
        <div className="t-sm center" style={{ color: '#FFE4E4' }}>Không cơ quan nào yêu cầu chuyển tiền qua điện thoại.</div>
      </>}>
      <div className="col ac g12 center" style={{ paddingTop: 6 }}>
        {inCall
          ? <span className="tag w" style={{ height: 38, fontSize: 15, color: 'var(--dang)' }}><I n="phone" z={16} />Đang gọi với số chưa quen · {mmss}</span>
          : <button type="button" className="tag w tap" style={{ height: 38, fontSize: 15, color: 'var(--dang)' }} onClick={() => play(stopAudio)}><I n="vol" z={16} />Đang đọc to</button>}
        <div className="circ pop" style={{ width: 150, height: 150, background: '#fff' }}><Art name="dung" z={136} /></div>
        <div className="h-xxl" style={{ fontSize: 46, lineHeight: '54px' }}>DỪNG LẠI</div>
        <div className="t-body" style={{ color: '#FFE9E9' }}>
          {inCall ? 'Bà đang nghe máy với số chưa quen và mở ứng dụng ngân hàng.' : 'Bà vừa nghe một cuộc gọi nghi lừa đảo và đang mở ứng dụng ngân hàng.'}
        </div>
      </div>
      <div className="card col g6 center rise" style={{ color: 'var(--ink)', marginTop: 'auto' }}>
        <div className="h-m c-dang">{inCall ? 'Người gọi đang giục bà chuyển tiền?' : 'Đừng chuyển tiền.'}</div>
        <div className="t-sub">{inCall ? 'Hãy cúp máy. Người thật sẽ không giận.' : `Hãy gọi ${minh?.name || 'người thân'} để kiểm tra.`}</div>
      </div>
    </Screen>
  )
}

// ---------- A05a thông báo nổi ----------
export const SAMPLE_SMS = 'Chào em, bên chị tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày. '
  + 'Em nạp trước 200k để kích hoạt tài khoản nhé, đăng ký trong hôm nay: bit.ly/viec-nhe-luong-cao'

export function Notification() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { setResult } = useApp()
  const text = params.get('tin') || SAMPLE_SMS
  const preview = params.get('tin') ? text.slice(0, 46).trim() + '…' : 'Việc nhẹ lương cao 500k/ngày, nạp trước 200k…'
  const [r, setR] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    api.analyzeMessage(text).then((x) => { if (alive) { setR({ ...x, from: 'notification' }); buzz([200, 100, 200]) } }).catch(() => alive && setFailed(true))
    return () => { alive = false }
  }, [text])
  const n = r?.signs?.length || 0
  return (
    <Screen name="A05a-thong-bao-noi" tone="night" className="wallpaper" pad="0">
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg,#5C72B5 0%,#344D9C 55%,#1E2C5E 100%)' }} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4,60px)', justifyContent: 'space-between', rowGap: 30, padding: '0 30px', marginTop: 'auto', marginBottom: 40 }}>
        {Array.from({ length: 16 }, (_, i) => <div key={i} style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,.22)' }} />)}
      </div>
      {(r || failed) && (
        <div className="notif" role="alert" style={{ color: 'var(--ink)' }}>
          <div className="row g8"><Logo z={26} /><span className="t-b" style={{ fontSize: 15 }}>Lá chắn số</span><span className="t-sm">· bây giờ</span></div>
          <div className="t-row" style={{ fontSize: 18 }}>{r && r.level === 'unknown' ? 'Tin nhắn từ người lạ' : 'Tin nhắn đáng ngờ từ người lạ'}</div>
          <div className="t-sub">“{preview}” {r ? (n ? `có ${n} dấu hiệu lừa đảo.` : 'Lá chắn chưa thấy dấu hiệu rõ.') : 'Lá chắn chưa phân tích được vì mất mạng.'}</div>
          <div className="row g8">
            <button type="button" className="btn p sm" onClick={() => { if (!r) return nav('/kiem-tra?loai=text'); setResult(r); nav(r.reason ? '/chua-du-thong-tin' : '/phan-tich') }}>{r ? 'Xem phân tích' : 'Kiểm tra lại'}</button>
            <button type="button" className="btn o sm" style={{ height: 46 }} onClick={() => nav('/', { replace: true })}>Bỏ qua</button>
          </div>
        </div>
      )}
    </Screen>
  )
}
