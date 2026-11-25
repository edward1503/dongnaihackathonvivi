// A05a: thông báo nổi khi Lá chắn tin nhắn thấy tin đáng ngờ (N4).
// Trên Android đây là thông báo thật của hệ thống; trên trình duyệt app vẽ lại màn hình chính của máy và thông báo
// để trình diễn. Thông báo chỉ hiện sau khi máy chủ phân tích xong, như trên máy thật. "Xem phân tích" mở A05b.
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { Phone } from '../ui/Phone.jsx'
import { api } from '../lib/api.js'
import { buzz } from '../lib/sound.js'
import { useApp } from '../lib/state.jsx'

const css = `
.frame.notif-home{background:#E2E8F0}
.home-grid{display:grid;grid-template-columns:repeat(4,56px);justify-content:space-between;row-gap:32px}
.app-ico{width:56px;height:56px;border-radius:16px;background:#fff}
.notif.in{animation:notif-in .35s ease-out}
@keyframes notif-in{from{opacity:0;transform:translateY(-16px)}}
`
export const SAMPLE_SMS = 'Chào em, bên chị tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày. '
  + 'Em nạp trước 200k để kích hoạt tài khoản nhé, đăng ký trong hôm nay: bit.ly/viec-nhe-luong-cao'
const SAMPLE_PREVIEW = 'Việc nhẹ lương cao 500k/ngày, nạp trước 200k…'

export default function Notification() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { setResult, addRecent } = useApp()
  const text = params.get('tin') || SAMPLE_SMS
  const preview = params.get('tin') ? text.slice(0, 46).trim() + '…' : SAMPLE_PREVIEW
  const [r, setR] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    api.analyzeMessage(text)
      .then((x) => { if (alive) { setR({ ...x, from: 'notification' }); buzz([200, 100, 200]) } })
      .catch(() => alive && setFailed(true))
    return () => { alive = false }
  }, [text])

  const open = () => {
    if (!r) return nav('/kiem-tra/tin-nhan')
    setResult(r)
    addRecent(r, text)
    nav(r.reason ? '/chua-du-thong-tin' : '/phan-tich')
  }
  const n = r?.signs?.length || 0
  const show = r || failed

  return (
    <Phone name="A05a-thong-bao-noi" className="notif-home">
      <style>{css}</style>
      <div className="content" style={{ padding: '24px 28px 28px' }}>
        <div className="home-grid mt-auto">
          {Array.from({ length: 16 }, (_, i) => <div key={i} className="app-ico" />)}
        </div>
      </div>
      {show && (
        <div className="notif in" role="alert">
          <div className="row gap-8">
            <div className="icon-box solid-danger" style={{ width: 28, height: 28, borderRadius: 8 }}><Icon name="shield-alert" size={16} /></div>
            <div className="t-cap bold">Lá chắn số</div>
            <div className="t-cap muted">· bây giờ</div>
          </div>
          <div className="col gap-4">
            <div className="t-label bold">{r && r.level === 'unknown' ? 'Tin nhắn từ người lạ' : 'Tin nhắn đáng ngờ từ người lạ'}</div>
            <div className="t-label muted">
              “{preview}” {r ? (n ? `có ${n} dấu hiệu lừa đảo.` : 'Lá chắn chưa thấy dấu hiệu rõ.') : 'Lá chắn chưa phân tích được vì mất mạng.'}
            </div>
          </div>
          <div className="row gap-8">
            <button type="button" className="btn sm primary" onClick={open}>{r ? 'Xem phân tích' : 'Kiểm tra lại'}</button>
            <button type="button" className="btn sm outline" onClick={() => nav('/', { replace: true })}>Bỏ qua</button>
          </div>
        </div>
      )}
    </Phone>
  )
}
