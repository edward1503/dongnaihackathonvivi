// U6: E01b Chưa có người thân · E01c Mất mạng · E01d AI chưa đủ thông tin
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, BottomNav, Phone } from '../ui/Phone.jsx'
import { SELF_CHECKS } from '../lib/format.js'
import { openLearn } from '../lib/links.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'
import { useRunCheck } from '../lib/useCheck.js'
import spotFamily from '../../../assets/spot-family.png'
import mascotThink from '../../../assets/mascot-think.png'

const css = `
.check-row{display:flex;align-items:center;gap:12px;min-height:60px;border-bottom:1px solid var(--outline-2);width:100%}
.check-row.last{border-bottom-color:transparent}
.check-box{width:22px;height:22px;border-radius:6px;border:1.5px solid var(--outline);background:#fff;flex:none;display:flex;align-items:center;justify-content:center}
.check-box.on{background:var(--brand);border-color:var(--brand);color:#fff}
`

export function NoRelatives() {
  const nav = useNavigate()
  const { addDefaultRelatives, toast } = useApp()
  const add = (msg) => { addDefaultRelatives(); toast(msg); nav('/hoi-nguoi-than', { replace: true }) }
  const say = 'Chưa có người thân nào. Thêm con, cháu để Lá chắn báo ngay khi có nguy hiểm.'
  return (
    <Phone name="E01b-chua-co-nguoi-than" lg>
      <AppBar title="Hỏi người thân">
        <button type="button" className="tap c-brand" aria-label="Đọc to" onClick={() => native.speak(say)}><Icon name="volume" /></button>
      </AppBar>
      <div className="content" style={{ paddingTop: 4, gap: 12 }}>
        <div className="col acenter jcenter grow gap-8">
          <img src={spotFamily} width="200" height="200" alt="" style={{ borderRadius: 24, display: 'block' }} />
          <div className="t-h1 center mt-12">Chưa có người thân nào</div>
          <div className="t-body muted center">Thêm con, cháu để Lá chắn báo ngay khi có nguy hiểm.</div>
        </div>
        {/* Bản 24 giờ: người thân mẫu là Minh; chọn danh bạ và quét mã ghép đôi thật do Android (Mảng 1) làm */}
        <button type="button" className="btn primary xl block" onClick={() => add('Đã thêm Minh')}><Icon name="users" />Thêm từ danh bạ</button>
        <button type="button" className="btn outline xl block" onClick={() => add('Đã ghép với Minh')}><Icon name="qr" />Quét mã ghép đôi</button>
        <button type="button" className="btn ghost block" onClick={() => native.call('113')}><Icon name="phone" />Cần gấp? Gọi 113</button>
      </div>
    </Phone>
  )
}

export function Offline() {
  const { state } = useLocation()
  const { toast } = useApp()
  const [run, busy] = useRunCheck()
  const [done, setDone] = useState([])
  const retry = () => (state?.value ? run(state.value, state.kind) : toast(navigator.onLine ? 'Đã có mạng lại' : 'Vẫn chưa có mạng'))
  return (
    <Phone name="E01c-mat-mang" gesture="solid">
      <style>{css}</style>
      <AppBar title="Kiểm tra nhanh" back={false} />
      <div className="content" style={{ paddingTop: 4, gap: 20 }}>
        <div className="card warn row gap-12">
          <div className="icon-box warn" style={{ background: '#fff' }}><Icon name="wifi-off" /></div>
          <div className="col grow">
            <div className="t-h2 c-warn-ink">Không có mạng</div>
            <div className="t-label">Chưa tra được dữ liệu cộng đồng.</div>
          </div>
        </div>
        <button type="button" className="btn outline block" disabled={busy} onClick={retry}>
          <Icon name="refresh" size={20} className={busy ? 'spin' : ''} />Thử lại
        </button>
        <div className="col gap-12 mt-4">
          <div className="t-label bold">Trong lúc chờ, tự kiểm tra bằng 3 câu</div>
          <div className="card col" style={{ padding: '4px 16px' }}>
            {SELF_CHECKS.map((t, i) => {
              const on = done.includes(i)
              return (
                <button type="button" key={t} className={`check-row tap${i === SELF_CHECKS.length - 1 ? ' last' : ''}`} aria-pressed={on}
                  onClick={() => setDone(on ? done.filter((x) => x !== i) : [...done, i])}>
                  <div className={`check-box${on ? ' on' : ''}`}>{on && <Icon name="check" size={16} weight={3} />}</div>
                  <div className="grow" style={{ fontSize: 15, lineHeight: '22px' }}>{t}</div>
                </button>
              )
            })}
          </div>
        </div>
        <button type="button" className="card soft row gap-12 tap" onClick={() => openLearn(null, toast)}>
          <Icon name="book" className="muted" />
          <div className="t-label grow">Các truyện đã tải vẫn đọc được khi mất mạng.</div>
        </button>
      </div>
      <BottomNav active="check" />
    </Phone>
  )
}

export function NotEnoughInfo() {
  const nav = useNavigate()
  const { result } = useApp()
  if (!result || result.kind !== 'message') return <Navigate to="/kiem-tra/tin-nhan" replace />
  const otp = result.reason === 'otp'
  return (
    <Phone name="E01d-ai-chua-du-thong-tin">
      <AppBar title="Phân tích tin nhắn" />
      <div className="content" style={{ paddingTop: 4 }}>
        {!otp && <div className="bubble in" style={{ whiteSpace: 'pre-wrap' }}>{result.maskedText}</div>}
        <div className="card soft col gap-10" style={{ borderColor: 'var(--outline)' }}>
          <span className="ai-tag"><Icon name="sparkles" size={14} />Kết quả phân tích của AI</span>
          <div className="row top gap-12">
            <div className="icon-box" style={{ background: 'var(--ink-2)', color: '#fff' }}><Icon name={otp ? 'lock' : 'help'} /></div>
            <div className="col grow gap-4">
              <div className="t-h2">{otp ? 'Lá chắn không gửi tin này đi' : 'Chưa đủ thông tin để kết luận'}</div>
              <div className="t-label muted">{result.headline}</div>
              {result.note && <div className="t-label semi">{result.note}</div>}
            </div>
          </div>
        </div>
        <div className="col gap-10">
          <div className="t-label bold">Bạn có thể</div>
          <Option icon="clipboard" box="ai" label="Dán thêm các tin trước đó" onClick={() => nav('/kiem-tra/tin-nhan', { state: { text: otp ? '' : result.maskedText } })} />
          <Option icon="phone" box="brand" label="Kiểm tra số gửi tin" onClick={() => nav('/kiem-tra')} />
          <Option icon="users" box="safe" label="Hỏi người thân" onClick={() => nav('/hoi-nguoi-than')} />
        </div>
        <div className="col acenter jcenter grow">
          <img src={mascotThink} width="120" height="120" alt="" style={{ borderRadius: 60, display: 'block' }} />
        </div>
      </div>
    </Phone>
  )
}

function Option({ icon, box, label, onClick }) {
  return (
    <button type="button" className="card row gap-12 tap" style={{ padding: '12px 16px' }} onClick={onClick}>
      <div className={`icon-box ${box}`}><Icon name={icon} size={20} /></div>
      <div className="t-label semi grow">{label}</div>
      <Icon name="chev-right" className="faint" />
    </button>
  )
}
