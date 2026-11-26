import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useApp } from '../../lib/state.jsx'
import { Bar, Btn, IconBox, Screen, StateView } from '../ui.jsx'

export function Appeal() {
  const nav = useNavigate()
  const { result, setResult } = useApp()
  const [contact, setContact] = useState('')
  const [appealId, setAppealId] = useState('')
  const [code, setCode] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const target = result?.target || result?.display
  const kind = ['call', 'message'].includes(result?.kind) ? 'phone' : result?.kind
  const back = result?.kind === 'message' ? '/phan-tich' : '/ket-qua'
  if ((!result?.canAppeal && !done) || !target) return <Navigate to={result ? back : '/kiem-tra'} replace />

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (!appealId && !/^\+?\d{3,15}$/.test(contact.replace(/[ ().-]/g, ''))) {
      setError('Bạn kiểm tra lại số điện thoại để đội liên hệ nhé.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (appealId) {
        await api.verifyAppeal(appealId, code.trim())
        setDone(true)
        setResult((current) => current && { ...current, appealOpen: true, canAppeal: false })
      } else {
        const data = await api.createAppeal({ target, kind, contact: contact.trim() })
        const id = data.id || data.appeal?.id
        if (!id) throw new Error('Chưa nhận được mã hồ sơ. Bạn thử lại nhé.')
        setAppealId(id)
      }
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <Screen name="appeal" bar={<Bar title="Báo nhầm" onLeft={() => nav(back, { replace: true })} />}
      foot={done && <Btn onClick={() => nav(back, { replace: true })}>Xem kết quả tra cứu</Btn>}>
      {done ? <StateView art="an-toan" title="Đã xác minh số điện thoại" text="Đội sẽ xem lại trong 24 giờ." /> :
        <form className="col g14" onSubmit={submit}>
          <div className="row g12">
            <IconBox icon="shield-alert" tone="pri" size="lgx" z={28} />
            <h1 className="h-l grow">{appealId ? 'Xác minh số bị báo' : 'Số của tôi bị báo nhầm'}</h1>
          </div>
          <div className="card tone-gray tight col g2">
            <span className="t-sm">Số bị báo</span>
            <strong className="t-row">{target}</strong>
            <span className="t-sm">Mã xác minh được gửi đến chính số này.</span>
          </div>
          {appealId ? <label className="col g8"><span className="t-head">Mã xác minh</span>
            <input key="code" className="field" autoComplete="one-time-code" inputMode="numeric" type="password" required value={code} onChange={(e) => setCode(e.target.value)} /></label> :
            <label className="col g8"><span className="t-head">Số điện thoại để đội liên hệ</span>
              <input key="contact" type="tel" autoComplete="tel" className="field" required value={contact} onChange={(e) => setContact(e.target.value)} /></label>}
          {error && <p role="alert" className="t-sub c-dang">{error}</p>}
          <Btn type="submit" busy={busy} disabled={!(appealId ? code : contact).trim()}>{appealId ? 'Xác minh' : 'Nhận mã xác minh'}</Btn>
        </form>}
    </Screen>
  )
}
