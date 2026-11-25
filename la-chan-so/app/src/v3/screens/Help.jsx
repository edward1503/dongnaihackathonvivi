// A5 khẩn cấp (đang bị gọi đòi tiền) · A6 kể lại cuộc gọi bằng 4 câu Có/Không · A7 đọc số bằng giọng nói
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, I, Screen, Speak, StateView, fmtPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { native } from '../../lib/native.js'
import { buzz } from '../../lib/sound.js'
import { useApp } from '../../lib/state.jsx'
import { listenOnce, useCheckRunner, Checking } from './Check.jsx'
import { useCall } from './People.jsx'

// ---------- A5 ----------
const STEPS = [['minus', 'Dừng lại'], ['phoneoff', 'Cúp máy'], ['users', 'Gọi người thân']]
export function Emergency() {
  const nav = useNavigate()
  const { relatives, persona } = useApp()
  const call = useCall()
  const first = relatives.find((r) => r.paired) || relatives[0]
  const elder = persona === 'elder'
  // Bé Nai nói với bà Hoa cùng giọng văn với các màn Android (DungLai, HoiSauCuocGoiActivity)
  const say = elder
    ? `Bà bình tĩnh nha. Bà đừng chuyển tiền nhé. Bà cúp máy, rồi gọi ${first?.name || 'con cháu'} hỏi trước cho chắc nha.`
    : `Bạn bình tĩnh nhé, đừng chuyển tiền. Cúp máy, rồi gọi ${first?.name || 'người thân'} hỏi trước cho chắc.`
  useEffect(() => { buzz([400, 150, 400]); native.speak(say); return () => native.stopSpeaking() }, [])
  return (
    <Screen name="A5-khan-cap" tone="dang" bar={<Bar title="" left="x" onLeft={() => nav('/', { replace: true })} right={<Speak text={say} />} />}
      foot={<>
        <Btn icon="phone" onClick={() => call(first?.name || 'Người thân', first?.phone)}>Gọi cho {first?.name || 'người thân'}</Btn>
        <Btn kind="o" onClick={() => nav('/ke-lai')}>Kể lại cuộc gọi</Btn>
      </>}>
      <div className="row g12 as">
        <div className="h-xl c-dang grow rise">{elder ? <>Bà bình tĩnh nha.<br />Đừng chuyển tiền ạ.</> : <>Bình tĩnh.<br />Đừng chuyển tiền.</>}</div>
        <Art name="dung" z={96} className="pop" />
      </div>
      <div className="col g12">
        {STEPS.map(([icon, text], i) => (
          <div key={text} className="li rise" style={{ background: '#fff', minHeight: 76, animationDelay: `${0.08 * i}s` }}>
            <Circle z={44} bg="dang" c="w"><b style={{ fontSize: 20 }}>{i + 1}</b></Circle>
            <div className="t-row grow" style={{ fontSize: 21 }}>{text}</div>
            <I n={icon} z={28} c="dang" />
          </div>
        ))}
      </div>
      <div className="t-sub center">Không cơ quan nào yêu cầu chuyển tiền qua điện thoại.</div>
    </Screen>
  )
}

// ---------- A6 (cũng là A04c "máy không có ghi âm") ----------
const QUESTIONS = [
  ['police', 'Xưng công an, ngân hàng?', 'Người gọi xưng là công an hoặc nhân viên ngân hàng.'],
  ['money', 'Đòi tiền, mã OTP?', 'Người gọi đòi chuyển tiền vào tài khoản tạm giữ và đòi đọc mã OTP.'],
  ['urgent', 'Giục làm ngay?', 'Người gọi giục làm ngay trong 30 phút.'],
  ['secret', 'Dặn giữ bí mật?', 'Người gọi dặn không được nói với ai, kể cả con cái.'],
]
export function AfterCallQuestions() {
  const nav = useNavigate()
  const { call, setResult, setCall, toast } = useApp()
  const [ans, setAns] = useState({})
  const [busy, setBusy] = useState(false)
  const all = QUESTIONS.every(([k]) => ans[k] !== undefined)
  const submit = async () => {
    const yes = QUESTIONS.filter(([k]) => ans[k]).map(([, , s]) => s)
    setBusy(true)
    try {
      const form = new FormData()
      if (call?.phone) form.append('phone', call.phone)
      form.append('unknownNumber', 'true')
      form.append('transcript', yes.length ? yes.map((s) => `Bà kể: ${s}`).join('\n') : 'Bà kể: Người gọi hỏi thăm bình thường, không đòi gì.')
      const r = await api.analyzeCall(form)
      setCall((c) => ({ ...(c || {}), answeredYes: Boolean(ans.money), story: yes.join(' ') }))
      setResult(r)
      nav('/ket-qua', { replace: true })
    } catch (e) {
      if (e.offline) nav('/mat-mang')
      else { toast(e.message); setBusy(false) }
    }
  }
  if (busy) return <Checking value="" kind="text" />
  return (
    <Screen name="A6-ke-lai-cuoc-goi" bar={<Bar title="Cuộc gọi lạ" right={<Speak text="Bà nhớ lại giúp con nha. Người gọi có xưng là công an hay nhân viên ngân hàng không ạ? Họ có đòi tiền hay đòi mã OTP không bà? Họ có giục bà làm liền không? Rồi họ có dặn bà giữ bí mật, đừng nói với ai không ạ?" />} />}
      foot={<Btn onClick={submit} disabled={!all}>Xem kết quả</Btn>}>
      <div className="t-sub" style={{ padding: '0 4px' }}>{call?.phone ? `Cuộc gọi từ ${fmtPhone(call.phone)}. ` : ''}Bà nhớ lại và chọn Có hoặc Không.</div>
      {QUESTIONS.map(([k, q], i) => (
        <div key={k} className="li rise" style={{ background: '#fff', minHeight: 76, animationDelay: `${0.05 * i}s` }}>
          <div className="t-row grow" style={{ fontSize: 18 }}>{q}</div>
          <div className="row g6">
            {[[true, 'Có'], [false, 'Không']].map(([v, l]) => (
              <button key={l} type="button" className={`chip${ans[k] === v ? ' on' : ''}`} style={{ height: 44, padding: '0 16px' }}
                aria-pressed={ans[k] === v} onClick={() => setAns((a) => ({ ...a, [k]: v }))}>{l}</button>
            ))}
          </div>
        </div>
      ))}
    </Screen>
  )
}

// ---------- A7 đọc số ----------
export function Voice() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [num, setNum] = useState('')
  const [state, setState] = useState(params.get('loi') === '1' ? 'denied' : 'idle')
  const [run, busy] = useCheckRunner()
  const going = useRef(false)
  if (busy) return <Checking {...busy} />
  if (state === 'denied') {
    return (
      <Screen name="A7b-chua-co-quyen-micro" bar={<Bar title="Đọc số" />}
        foot={<><Btn onClick={() => nav('/kiem-tra', { replace: true })}>Nhập bằng bàn phím</Btn><Btn kind="o" onClick={() => setState('idle')}>Cho phép lại</Btn></>}>
        <StateView icon="mic" iconBg="warn-t" iconColor="warn" title="Chưa có quyền micro" text="Máy chưa cho Lá chắn nghe. Bạn nhập số bằng bàn phím nhé." />
      </Screen>
    )
  }
  const listen = async () => {
    if (going.current) return
    going.current = true
    setState('listening')
    const heard = await listenOnce()
    going.current = false
    if (heard === null) return setState('denied')
    const d = heard.replace(/\D/g, '')
    if (d) setNum(d)
    setState('idle')
  }
  return (
    <Screen name="A7-doc-so" bar={<Bar title="Đọc số" />} foot={<Btn icon="search" onClick={() => run(num, 'phone')} disabled={!num}>Kiểm tra</Btn>}>
      <div className="col ac jc g20 grow center">
        <div className={`numdisp wfull${num ? '' : ' empty'}`}>{num ? fmtPhone(num) : 'Đọc to số điện thoại'}</div>
        <div className="row g4 ac" style={{ height: 40 }} aria-hidden="true">
          {Array.from({ length: 13 }, (_, i) => <span key={i} style={{ width: 5, borderRadius: 3, background: 'var(--pri)', height: state === 'listening' ? 8 + ((i * 37) % 30) : 6, transition: 'height .2s', opacity: 0.8 }} />)}
        </div>
        <button type="button" className={`circ tap${state === 'listening' ? ' pulse' : ''}`} style={{ width: 104, height: 104, background: state === 'listening' ? 'var(--dang)' : 'var(--pri)', color: '#fff' }}
          aria-label="Bấm để đọc số" onClick={listen}><I n="mic" z={44} /></button>
        <div className="t-lbl">{state === 'listening' ? 'Đang nghe…' : 'Bấm rồi đọc số'}</div>
      </div>
    </Screen>
  )
}
