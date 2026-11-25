// Lá chắn cuộc gọi (phần ban giám khảo thích):
//   A03a/A03b đổ chuông · A04a Bé Nai hỏi một câu · A04b AI chép lời và phân tích ghi âm, tự báo Minh
//   A04c máy không có ghi âm · A10a "Dừng lại" khi mở ứng dụng ngân hàng sau cuộc gọi lạ
//
// Android (Mảng 1) mở các đường dẫn này trong WebView:
//   #/cuoc-goi?so=0912345678                       lúc đổ chuông (hoặc dùng lớp phủ gốc, rồi chỉ mở các màn sau)
//   #/sau-cuoc-goi?so=0912345678&giay=252&ghiam=1  khi cúp máy (ghiam=1: máy có tệp ghi âm)
//   #/dung-lai?so=0912345678&phut=4                khi mở ứng dụng ngân hàng trong 5 phút sau cuộc gọi lạ
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { api } from '../lib/api.js'
import { hhmm, LEVEL } from '../lib/format.js'
import { native } from '../lib/native.js'
import { FAMILY_ROOM, useApp } from '../lib/state.jsx'
import { highlight } from './MessageResult.jsx'
import spotMascot from '../../../assets/spot-mascot.png'
import askAudio from '../../../prototype/audio/benai-10.m4a'
import yesAudio from '../../../prototype/audio/benai-11.m4a'
import noAudio from '../../../prototype/audio/benai-12.m4a'
import stopAudio from '../../../prototype/audio/benai-13.m4a'

const css = `
.call{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 44px 36px}
.call-avatar{width:96px;height:96px;border-radius:48px;background:#1E293B;color:#94A3B8;display:flex;align-items:center;justify-content:center;flex:none}
.call-num{font-size:30px;line-height:38px;font-weight:700;color:#fff;margin-top:20px}
.call-sub{font-size:16px;line-height:24px;font-weight:500;color:#CBD5E1;margin-top:4px}
.call-actions{display:flex;justify-content:space-between;width:100%;margin-top:64px}
.call-act{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:14px;line-height:20px;font-weight:500;color:#CBD5E1}
.call-round{width:68px;height:68px;border-radius:34px;display:flex;align-items:center;justify-content:center;color:#fff;flex:none}
.call-round.ring{animation:ring 1.2s ease-in-out infinite}
@keyframes ring{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}
.over12{font-size:12px;line-height:16px;font-weight:700;letter-spacing:.8px;text-transform:uppercase}
.stop{font-size:44px;line-height:52px;font-weight:700;color:#fff;text-align:center}
.chip.big{height:36px;border-radius:18px;padding:0 14px;font-size:14px;line-height:20px;color:var(--danger-ink)}
.btn.on-red{background:var(--danger);border-color:#fff;color:#fff;padding:0 8px}
.card.plain{border-color:#fff}
.big-answer{flex:1;min-width:0;height:76px;font-size:26px;line-height:32px;font-weight:700;border-radius:22px}
`
const CALL_DEMO = '0912345678'
const DEMO_TRANSCRIPT = [
  'Người gọi: Tôi là cán bộ điều tra. Bà có liên quan đến một vụ án rửa tiền.',
  'Người gọi: Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút.',
  'Người gọi: Việc này không được nói với ai, kể cả con cái.',
].join('\n')

function duration(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function durationWords(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  return `${Math.floor(s / 60)} phút ${s % 60} giây`
}

// Phát giọng Bé Nai thu sẵn (Gemini, giọng Leda); máy chặn tự phát thì bỏ qua
function useVoice() {
  const ref = useRef(null)
  const play = (src) => {
    try {
      ref.current?.pause()
      ref.current = new Audio(src)
      ref.current.play().catch(() => {})
    } catch { /* trình duyệt không phát được */ }
  }
  useEffect(() => () => ref.current?.pause(), [])
  return play
}

// ---------------- A03a, A03b: đổ chuông ----------------

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
  const answer = () => {
    setCall({ phone, display: r?.display || phone, lookup: r, startedAt: new Date().toISOString(), seconds: 252, hasRecording: true })
    if (!native.available()) toast('Mô phỏng: bà nghe máy 4 phút rồi cúp')
    nav(`/sau-cuoc-goi?so=${encodeURIComponent(phone)}&giay=252&ghiam=1`, { replace: true })
  }
  const block = () => {
    native.blockNumber(phone)
    toast(`Đã chặn số ${r?.display || phone}`)
    nav('/', { replace: true })
  }

  return (
    <Phone name={danger ? 'A03a-do-chuong-nguy-hiem' : 'A03b-do-chuong-chua-ro'} className="bg-navy" dark>
      <style>{css}</style>
      <div className="call">
        <div className="call-avatar"><Icon name="user" size={48} /></div>
        <div className="call-num">{r?.display || phone}</div>
        <div className="call-sub">{danger ? 'Cuộc gọi đến · Số lạ' : 'Cuộc gọi đến · Số chưa lưu'}</div>
        <div className="call-actions">
          <button type="button" className="call-act tap" onClick={() => { toast('Đã từ chối cuộc gọi'); nav('/', { replace: true }) }}>
            <div className="call-round" style={{ background: '#DC2626' }}><Icon name="phone-off" size={32} /></div>Từ chối
          </button>
          <button type="button" className="call-act tap" onClick={answer}>
            <div className="call-round ring" style={{ background: '#16A34A' }}><Icon name="phone" size={32} /></div>Nghe
          </button>
        </div>
      </div>

      {r && danger && (
        <div className="float-card" style={{ top: 44, background: 'var(--danger)', color: '#fff' }}>
          <div className="row gap-8"><Icon name="shield-alert" size={20} /><div className="over12">Lá chắn số cảnh báo</div></div>
          <div className="col gap-6">
            <div className="row gap-10"><Icon name="alert-oct" size={28} /><div style={{ fontSize: 26, lineHeight: '32px', fontWeight: 700 }}>Nghi lừa đảo</div></div>
            <div style={{ fontSize: 17, lineHeight: '24px', fontWeight: 500 }}>{r.headline}</div>
          </div>
          {r.reports?.lastAt && (
            <span className="chip solid-white" style={{ alignSelf: 'flex-start' }}><Icon name="clock" size={14} />Báo cáo gần nhất: {r.reports.lastWhen || lastWhen(r.reports.lastAt)}</span>
          )}
          <button type="button" className="btn white block" style={{ height: 56, fontSize: 17 }} onClick={block}>Chặn số này</button>
        </div>
      )}

      {r && !danger && (
        <div className="float-card" style={{ top: 44, background: '#1E293B', color: '#CBD5E1', padding: '12px 16px', gap: 0, borderRadius: 16 }}>
          <div className="row gap-10">
            <Icon name="shield-check" size={20} style={{ color: '#93C5FD' }} />
            <div style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500 }}>
              {r.level === 'safe' ? 'Số này khớp danh bạ tổng đài. Đừng đọc mã xác thực cho ai.' : 'Lá chắn không thấy dấu hiệu rủi ro nên không cảnh báo và không hỏi lại.'}
            </div>
          </div>
        </div>
      )}
    </Phone>
  )
}

function lastWhen(iso) {
  const days = Math.round((new Date(new Date().toDateString()) - new Date(new Date(iso).toDateString())) / 86400000)
  return days <= 0 ? 'hôm nay' : days === 1 ? 'hôm qua' : `${days} ngày trước`
}

// ---------------- Điều phối sau khi cúp máy ----------------

export function AfterCall() {
  const [params] = useSearchParams()
  const { call, setCall } = useApp()
  const phone = params.get('so') || call?.phone || CALL_DEMO
  const seconds = Number(params.get('giay') || call?.seconds || 0)
  const hasRecording = params.get('ghiam') === '1'
  const [next, setNext] = useState(null)
  useEffect(() => {
    setCall((c) => ({ ...(c?.phone === phone ? c : {}), phone, display: c?.display || phone, seconds, hasRecording, answeredYes: false, endedAt: new Date().toISOString() }))
    // Mặc định: Bé Nai hỏi một câu (D05 mức 3). Câu trả lời "Có" mới dẫn tới phân tích ghi âm và báo Minh.
    setNext('/hoi-nhanh')
  }, [phone, seconds, hasRecording, setCall])
  return next ? <Navigate to={next} replace /> : null
}

// ---------------- A04a: Bé Nai hỏi một câu ----------------

export function QuickAsk() {
  const nav = useNavigate()
  const { call, setCall, toast } = useApp()
  const play = useVoice()
  const [listening, setListening] = useState(false)
  useEffect(() => { play(askAudio) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const yes = () => {
    play(yesAudio)
    setCall((c) => ({ ...(c || { phone: CALL_DEMO, seconds: 252, hasRecording: true }), answeredYes: true }))
    nav('/phan-tich-cuoc-goi', { replace: true })
  }
  const no = () => {
    play(noAudio)
    toast('Dạ vậy thì tốt rồi ạ')
    setTimeout(() => nav('/', { replace: true }), 1200)
  }
  const known = () => {
    const list = JSON.parse(localStorage.getItem('lcs.known') || '[]')
    if (call?.phone) localStorage.setItem('lcs.known', JSON.stringify([...new Set([...list, call.phone])]))
    toast('Bé Nai nhớ rồi, lần sau số này gọi sẽ không hỏi nữa')
    nav('/', { replace: true })
  }
  const listen = async () => {
    setListening(true)
    const heard = ((await native.listen()) || '').toLowerCase()
    setListening(false)
    if (/\bkhông\b|\bko\b/.test(heard)) no()
    else if (/\bcó\b|\bcó ạ\b/.test(heard)) yes()
    else toast(heard ? `Bé Nai nghe: “${heard}”. Bà bấm Có hoặc Không nhé` : 'Bà bấm Có hoặc Không nhé')
  }

  return (
    <Phone name="A04a-hoi-nhanh" lg>
      <style>{css}</style>
      <div className="appbar">
        <button type="button" className="tap" aria-label="Đóng" onClick={() => nav('/', { replace: true })}><Icon name="x" /></button>
        <div className="title" style={{ fontSize: 20, lineHeight: '26px' }}>Bé Nai hỏi thăm</div>
        <button type="button" className="tap c-brand" aria-label="Nghe lại" onClick={() => play(askAudio)}><Icon name="volume" /></button>
      </div>
      <div className="content" style={{ paddingTop: 8, gap: 16, alignItems: 'center' }}>
        <div className="call-avatar" style={{ width: 208, height: 208, borderRadius: 104, background: '#FFF7ED', border: '6px solid #DBEAFE', marginTop: 12 }}>
          <img src={spotMascot} width="190" height="190" style={{ borderRadius: 95 }} alt="Bé Nai" />
        </div>
        <div className="row gap-8 c-brand"><Icon name="wave" size={20} /><div className="t-label bold">{listening ? 'Bé Nai đang nghe bà…' : 'Bé Nai đang hỏi bà…'}</div></div>
        <div className="center" style={{ fontSize: 22, lineHeight: '30px', fontWeight: 600, color: 'var(--ink)', padding: '0 8px' }}>
          Người vừa gọi có bảo bà chuyển tiền không ạ?
        </div>
        <div className="col gap-12 mt-auto w-full">
          <button type="button" className="row gap-8 jcenter muted tap" onClick={listen}>
            <Icon name="mic" size={18} /><div className="t-label">Bà nói “có” hoặc “không”, hoặc bấm</div>
          </button>
          <div className="row gap-12">
            <button type="button" className="btn primary big-answer" onClick={yes}>Có</button>
            <button type="button" className="btn outline big-answer" onClick={no}>Không</button>
          </div>
          <button type="button" className="t-label bold c-brand center tap" onClick={known}>Tôi biết số này</button>
        </div>
      </div>
    </Phone>
  )
}

// ---------------- A04b: AI chép lời và phân tích, tự báo Minh ----------------

function splitTranscript(text) {
  return (text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(Người gọi|Người nghe|Bà kể)\s*:\s*(.*)$/)
    return m ? { speaker: m[1], text: m[2] } : { speaker: '', text: l }
  })
}

export function CallAnalysis() {
  const nav = useNavigate()
  const { call, relatives, ask, setAsk, setResult, toast } = useApp()
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const [alerted, setAlerted] = useState(null)
  const started = useRef(false)
  const minh = relatives.find((x) => x.paired) || relatives[0]
  const c = call || { phone: CALL_DEMO, seconds: 252, hasRecording: true }

  // Minh trả lời thì chuyển ngay sang màn hiện lời trả lời (A08c)
  useEffect(() => {
    if (alerted && ask?.askId === alerted.id && ask.reply) nav('/hoi-nguoi-than/tra-loi', { replace: true })
  }, [ask, alerted, nav])

  useEffect(() => {
    if (started.current) return
    started.current = true
    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    setError(null)
    try {
      let res
      if (native.available() && window.LCSNative.analyzeRecording && c.hasRecording) {
        // Android đọc tệp ghi âm của máy và gửi lên /api/analyze/call, trả về kết quả dạng JSON
        res = JSON.parse(await window.LCSNative.analyzeRecording(String(c.phone || '')))
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
      if (res.level === 'danger' && minh) notify(res)
    } catch (e) {
      setError(e.offline ? 'Không có mạng. Bà gọi Minh trước nhé.' : e.message || 'Chưa phân tích được')
    }
  }

  async function notify(res) {
    const lines = splitTranscript(res.maskedText)
    const timeline = [
      { t: hhmm(new Date(c.startedAt || Date.now() - (c.seconds || 0) * 1000)), text: `Cuộc gọi đến từ ${res.display}, dài ${durationWords(c.seconds)}`, tone: '' },
      { t: hhmm(), text: `Lá chắn phân tích ${lines.length ? 'bản ghi âm' : 'cuộc gọi'}: Nguy hiểm`, tone: 'danger' },
    ]
    if (c.answeredYes) timeline.push({ t: hhmm(), text: 'Mẹ trả lời: có đòi chuyển tiền', tone: 'danger' })
    const summary = [res.headline, res.signs?.length ? `Dấu hiệu: ${res.signs.map((s) => s.text.toLowerCase()).join(', ')}.` : ''].filter(Boolean).join(' ')
    try {
      const a = await api.alert({
        room: FAMILY_ROOM, level: 'danger', who: 'Mẹ Hoa', phone: c.phone, scamType: res.scamType, scamLabel: res.scamLabel,
        asksMoney: Boolean(c.answeredYes) || (res.signs || []).some((s) => /chuyển tiền|nạp/i.test(s.text)),
        callSeconds: c.seconds, summary, timeline, from: 'ba-hoa',
      })
      setAlerted({ id: a.id, at: new Date() })
      setAsk({ askId: a.id, to: minh, text: summary, sentAt: new Date().toISOString(), seen: false, reply: null })
    } catch {
      toast(`Chưa báo được cho ${minh.name}. Bà bấm “Gọi ${minh.name} ngay” nhé`)
    }
  }

  const callMinh = () => (minh?.phone ? native.call(minh.phone) : toast(`Đang gọi ${minh?.name || 'người thân'}…`))
  const say = r ? `${(LEVEL[r.level] || LEVEL.unknown).label}. ${r.headline} ${alerted ? `Con đã báo cho anh ${minh.name}. Anh ấy sẽ gọi cho bà.` : ''}` : ''
  const lines = r ? splitTranscript(r.maskedText) : []
  const quotes = r ? r.signs.flatMap((s) => s.quotes) : []
  const danger = r?.level === 'danger'

  return (
    <Phone name="A04b-phan-tich-ghi-am" lg>
      <style>{css}</style>
      <AppBar title="Phân tích cuộc gọi" onBack={() => nav('/', { replace: true })}>
        <button type="button" className="tap c-brand" aria-label="Đọc to" onClick={() => say && native.speak(say)}><Icon name="volume" /></button>
      </AppBar>
      <div className="content" style={{ paddingTop: 4, gap: 12 }}>
        <div className="row gap-12">
          <div className="icon-box ai"><Icon name="file-audio" size={20} /></div>
          <div className="col grow gap-4">
            <div className="t-label semi">{c.story ? 'Lời bà kể lại' : `Bản ghi âm của máy · ${duration(c.seconds)}`}</div>
            {r ? (
              <span className="chip ai" style={{ alignSelf: 'flex-start' }}><Icon name="sparkles" size={14} />{c.story ? 'AI đã nghe lời kể' : 'AI đã chép lời'}</span>
            ) : (
              <span className="chip ai" style={{ alignSelf: 'flex-start' }}><Icon name="refresh" size={14} className="spin" />AI đang chép lời…</span>
            )}
          </div>
        </div>

        {error && (
          <div className="card warn col gap-8">
            <div className="t-label bold c-warn-ink">{error}</div>
            <button type="button" className="btn outline sm" onClick={run}><Icon name="refresh" size={16} />Thử lại</button>
          </div>
        )}

        {r && (
          <div className={`card ${danger ? 'danger' : r.level === 'suspicious' ? 'warn' : 'soft'} r24 col gap-12`}>
            <div className="row gap-12">
              <div className={`icon-box lgx ${danger ? 'solid-danger' : ''}`} style={danger ? undefined : { background: 'var(--ink-2)', color: '#fff' }}>
                <Icon name={(LEVEL[r.level] || LEVEL.unknown).icon} size={32} />
              </div>
              <div className="col grow">
                <div className={`t-cap semi ${danger ? 'c-danger-ink' : 'muted'}`}>Kết quả</div>
                <div className={`t-display ${danger ? 'c-danger-ink' : 'c-ink'}`}>{(LEVEL[r.level] || LEVEL.unknown).label}</div>
              </div>
            </div>
            <div className={`t-body ${danger ? 'c-danger-ink' : 'c-ink'}`}>{r.headline}</div>
            {r.why?.length > 0 && (
              <div className="col gap-6">
                <div className={`t-cap bold ${danger ? 'c-danger-ink' : ''}`}>Bằng chứng kết hợp</div>
                <div className={`t-cap ${danger ? 'c-danger-ink' : ''}`}>{r.why.join(' · ')}</div>
              </div>
            )}
          </div>
        )}

        {r && danger && !minh && (
          <button type="button" className="card warn row gap-12 tap" onClick={() => nav('/chua-co-nguoi-than')}>
            <Icon name="users" size={20} className="c-warn" />
            <div className="col grow">
              <div className="t-label bold c-warn-ink">Chưa có người thân để báo</div>
              <div className="t-cap c-ink">Bấm để thêm con, cháu.</div>
            </div>
            <Icon name="chev-right" className="c-warn" />
          </button>
        )}

        {r && danger && minh && (alerted ? (
          <div className="card safe row gap-12">
            <div className="icon-box solid-safe round"><Icon name="check" size={20} /></div>
            <div className="col grow">
              <div className="t-label bold c-safe-ink">Đã báo cho {minh.name} · {hhmm(alerted.at)}</div>
              <div className="t-cap c-ink">{minh.name} sẽ gọi cho bà. Bà không cần bấm gì.</div>
            </div>
          </div>
        ) : (
          <div className="card soft row gap-12">
            <Icon name="refresh" size={20} className="spin muted" />
            <div className="t-label grow">Đang báo cho {minh?.name || 'người thân'}…</div>
          </div>
        ))}

        <button type="button" className="btn primary xl block" onClick={callMinh}><Icon name="phone" />Gọi {minh?.name || 'người thân'} ngay</button>

        {r?.signs?.length > 0 && (
          <div className="card ai col gap-8">
            <div className="ai-tag" style={{ fontSize: 14, lineHeight: '20px' }}><Icon name="sparkles" size={16} />AI nhận ra {r.signs.length} dấu hiệu</div>
            {r.signs.map((s) => (
              <div className="row gap-8" key={s.text}><Icon name="check" size={20} className="c-ai" /><div className="t-label c-ai-ink">{s.text}</div></div>
            ))}
          </div>
        )}

        {lines.length > 0 && (
          <div className="card col gap-10">
            <div className="t-over muted">{c.story ? 'Lời kể' : 'Bản chép lời'}</div>
            {lines.map((l, i) => (
              <div className="col gap-2" key={i}>
                {l.speaker && <div className={`t-cap bold ${l.speaker === 'Người gọi' ? 'c-danger' : 'muted'}`}>{l.speaker}</div>}
                <div style={{ fontSize: 17, lineHeight: '24px' }}>{highlight(l.text, quotes)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Phone>
  )
}

// ---------------- A04c: máy không có ghi âm ----------------

export function NoRecording() {
  const nav = useNavigate()
  const { call, setCall, toast } = useApp()
  const c = call || { phone: CALL_DEMO, display: '0912 345 678', seconds: 252 }
  const tell = async () => {
    const story = await native.listen()
    if (!story) { toast('Máy này chưa nghe được giọng nói. Bà trả lời một câu hỏi nhé'); return }
    setCall({ ...c, story, hasRecording: false })
    nav('/phan-tich-cuoc-goi', { replace: true })
  }
  const say = 'Máy này không có sẵn tính năng ghi âm cuộc gọi. Lá chắn vẫn kiểm tra được theo 2 cách: trả lời một câu hỏi, hoặc kể lại bằng giọng nói.'
  return (
    <Phone name="A04c-khong-co-ghi-am" lg>
      <div className="appbar">
        <button type="button" className="tap" aria-label="Đóng" onClick={() => nav('/', { replace: true })}><Icon name="x" /></button>
        <div className="title" style={{ fontSize: 20, lineHeight: '26px' }}>Cuộc gọi vừa rồi</div>
        <button type="button" className="tap c-brand" aria-label="Đọc to" onClick={() => native.speak(say)}><Icon name="volume" /></button>
      </div>
      <div className="content" style={{ paddingTop: 4, gap: 16 }}>
        <div className="card row gap-12" style={{ padding: '14px 16px' }}>
          <div className="icon-box brand" style={{ width: 48, height: 48, borderRadius: 14 }}><Icon name="phone-in" /></div>
          <div className="col grow">
            <div className="t-h2">{c.display || c.phone}</div>
            <div className="t-cap muted">Số lạ · {durationWords(c.seconds)} · {hhmm(new Date(c.startedAt || Date.now()))}</div>
          </div>
        </div>
        <div className="card soft col gap-12" style={{ borderColor: 'var(--outline-2)' }}>
          <div className="icon-box" style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', color: 'var(--brand)' }}><Icon name="info" size={28} /></div>
          <div className="col gap-6">
            <div className="t-h2">Máy này không có sẵn tính năng ghi âm cuộc gọi.</div>
            <div className="t-label muted">Lá chắn vẫn kiểm tra được<br />theo 2 cách:</div>
          </div>
        </div>
        <button type="button" className="card row gap-12 tap" style={{ padding: '24px 16px' }} onClick={() => nav('/hoi-nhanh', { replace: true })}>
          <div className="icon-box lgx brand"><Icon name="list" size={28} /></div>
          <div className="col grow gap-2"><div className="t-h2">Trả lời một câu hỏi</div><div className="t-cap muted">Mất khoảng 5 giây</div></div>
          <Icon name="chev-right" className="faint" />
        </button>
        <button type="button" className="card row gap-12 tap" style={{ padding: '24px 16px' }} onClick={tell}>
          <div className="icon-box lgx ai"><Icon name="mic" size={28} /></div>
          <div className="col grow gap-2"><div className="t-h2">Kể lại bằng<br />giọng nói</div><div className="t-cap muted">Bà kể, AI nghe và phân tích</div></div>
          <Icon name="chev-right" className="faint" />
        </button>
        <div className="row gap-8 jcenter mt-auto"><Icon name="lock" size={16} className="muted" /><div className="t-cap muted">Lời kể được phân tích xong sẽ xoá.</div></div>
      </div>
    </Phone>
  )
}

// ---------------- A10a: Dừng lại ----------------

export function StopScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { relatives } = useApp()
  const play = useVoice()
  const minh = relatives.find((x) => x.paired) || relatives[0]
  const minutes = params.get('phut') || '4'
  useEffect(() => { play(stopAudio) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Phone name="A10a-phanh-sau-cuoc-goi" lg className="bg-danger" dark>
      <style>{css}</style>
      <div className="content acenter" style={{ padding: '16px 16px 12px', gap: 32 }}>
        <button type="button" className="chip solid-white big tap" onClick={() => play(stopAudio)}><Icon name="volume" size={16} className="c-danger" />Đang đọc to</button>
        <div className="icon-box xl white"><Icon name="hand" size={48} /></div>
        <div className="col gap-8 w-full">
          <div className="stop">DỪNG LẠI</div>
          <div className="t-body c-white center">Bà vừa nghe một cuộc gọi nghi lừa đảo {minutes} phút trước và đang mở ứng dụng ngân hàng.</div>
        </div>
        <div className="card plain r20 col gap-8 w-full" style={{ padding: '28px 20px', marginTop: 'auto', marginBottom: 'auto' }}>
          <div className="t-h2 c-danger-ink center">Đừng chuyển tiền.</div>
          <div className="t-label c-ink center">Hãy gọi {minh?.name || 'người thân'} để kiểm tra.</div>
        </div>
        <div className="col gap-12 w-full">
          <button type="button" className="btn white xl block" onClick={() => nav('/hoi-nguoi-than', { replace: true })}><Icon name="users" />Hỏi con {minh?.name || ''} trước</button>
          <button type="button" className="btn xl block on-red" onClick={() => { window.LCSNative?.dismissStop?.(); nav('/', { replace: true }) }}>Đóng cảnh báo</button>
          <div className="t-cap c-white center">Không cơ quan nào yêu cầu<br />chuyển tiền qua điện thoại.</div>
        </div>
      </div>
    </Phone>
  )
}
