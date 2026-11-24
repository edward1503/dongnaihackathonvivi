// U1: A01a Trang chủ chế độ đơn giản (chữ lớn, tối đa 3 lựa chọn) · A01b Trang chủ chế độ đầy đủ
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { BottomNav, Phone } from '../ui/Phone.jsx'
import { api } from '../lib/api.js'
import { openLearn, openProfile } from '../lib/links.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'

const DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function today() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

// Số cảnh báo trong tuần do Android đếm (Mảng 1); trình duyệt dùng số mẫu của thiết kế
function weekStats() {
  try {
    const s = window.LCSNative?.weekStats?.()
    if (s) return typeof s === 'string' ? JSON.parse(s) : s
  } catch { /* dùng số mẫu */ }
  return { calls: 3, messages: 2, layersOn: 3 }
}

export default function Home() {
  const { mode } = useApp()
  return mode === 'full' ? <HomeFull /> : <HomeSimple />
}

function HomeSimple() {
  const nav = useNavigate()
  const { setMode, relatives, toast } = useApp()
  const stats = weekStats()
  const first = relatives.find((r) => r.paired) || relatives[0]

  const talk = async () => {
    const heard = (await native.listen()) || ''
    const t = heard.toLowerCase()
    if (!heard) toast('Máy này chưa nghe được giọng nói. Bà bấm vào thẻ nhé')
    else if (t.includes('kiểm tra')) nav('/kiem-tra')
    else if (t.includes('gọi')) nav('/hoi-nguoi-than')
    else toast(`Lá chắn nghe: “${heard}”`)
  }

  return (
    <Phone name="A01a-trang-chu-don-gian" lg gesture="solid">
      <div className="content" style={{ gap: 10, paddingTop: 10, paddingBottom: 12 }}>
        <div className="row between">
          <div className="col gap-2">
            <div className="t-label muted">{today()}</div>
            <div className="t-h1">Chào bà Hoa</div>
          </div>
          <button type="button" className="chip brand tap" onClick={() => { setMode('full'); toast('Đã chuyển sang chế độ đầy đủ') }}>
            <Icon name="eye" size={14} />Chữ lớn
          </button>
        </div>

        <button type="button" className="card solid-brand r24 col gap-10 tap" style={{ padding: 16 }} onClick={() => toast('Lá chắn đang chạy ngầm, bà không cần mở app')}>
          <div className="row gap-12">
            <div className="icon-box lgx white" style={{ color: '#1D4ED8' }}><Icon name="shield-check" size={32} /></div>
            <div className="col grow">
              <div className="t-h2 c-white">Lá chắn đang bật</div>
              <div className="t-label" style={{ color: '#DBEAFE' }}>Bà đang được bảo vệ</div>
            </div>
          </div>
          <div className="t-label c-white">Tuần này đã cảnh báo {stats.calls} cuộc gọi và {stats.messages} tin nhắn đáng ngờ.</div>
        </button>

        <BigCard icon="search" box="brand" title="Kiểm tra trước khi chuyển tiền" onClick={() => nav('/kiem-tra')} />
        <BigCard icon="users" box="safe" title="Hỏi người thân" sub={first ? `Gửi ngay cho con: ${first.name}` : 'Thêm con, cháu'} onClick={() => nav('/hoi-nguoi-than')} />
        <BigCard icon="flag" box="danger" title="Báo lừa đảo" sub={<>Kể lại để cảnh báo<br />mọi người</>} onClick={() => nav('/bao-cao')} />

        <button type="button" className="row gap-12 tap" onClick={talk}
          style={{ height: 60, borderRadius: 30, background: '#1D4ED8', color: '#fff', padding: '0 8px 0 20px', flex: 'none' }}>
          <div className="col grow">
            <div style={{ fontSize: 17, lineHeight: '22px', fontWeight: 700 }}>Nói với Lá chắn</div>
            <div style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#DBEAFE' }}>“Gọi con {first?.name || 'Minh'}” · “Kiểm tra số này”</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: '#fff', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="mic" />
          </div>
        </button>
      </div>
      <BottomNav active="home" />
    </Phone>
  )
}

function BigCard({ icon, box, title, sub, onClick }) {
  return (
    <button type="button" className="card row gap-10 tap" style={{ padding: '10px 16px', flex: 1, minHeight: 0 }} onClick={onClick}>
      <div className={`icon-box lgx ${box}`}><Icon name={icon} size={28} /></div>
      <div className="col grow gap-4">
        <div className="t-h2">{title}</div>
        {sub && <div className="t-label muted">{sub}</div>}
      </div>
      <Icon name="chev-right" className="faint" />
    </button>
  )
}

function HomeFull() {
  const nav = useNavigate()
  const { toast, points } = useApp()
  const stats = weekStats()
  const [emerging, setEmerging] = useState(null)

  useEffect(() => {
    let alive = true
    api.stats().then((s) => { if (alive) setEmerging(s.emerging?.[0] || null) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const layers = [
    { icon: 'phone-in', title: 'Lá chắn cuộc gọi', sub: 'Cảnh báo khi đổ chuông, phân tích sau cuộc gọi' },
    { icon: 'message', title: 'Lá chắn tin nhắn', sub: 'SMS, Zalo, Messenger' },
    { icon: 'hand', title: 'Nhắc trước khi chuyển tiền', sub: 'Nhắc khi mở app ngân hàng sau cuộc gọi lạ' },
  ]

  return (
    <Phone name="A01b-trang-chu-day-du" gesture="solid">
      <div className="appbar" style={{ gap: 10 }}>
        <div className="icon-box solid-brand" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name="shield-check" size={20} /></div>
        <div className="title" style={{ whiteSpace: 'nowrap' }}>Lá chắn số</div>
        <button type="button" className="chip warn tap" onClick={() => openLearn(null, toast)}><Icon name="award" size={14} />{points} điểm</button>
        <button type="button" className="tap muted" aria-label="Thông báo" onClick={() => nav('/kiem-tra/tin-nhan')}><Icon name="bell" /></button>
        <button type="button" className="avatar tap" style={{ width: 32, height: 32, fontSize: 13 }} aria-label="Hồ sơ" onClick={() => openProfile(toast)}>V</button>
      </div>

      <div className="content" style={{ paddingTop: 8, gap: 16 }}>
        <button type="button" className="card col gap-12 tap" onClick={() => openProfile(toast)}>
          <div className="row between">
            <div className="col">
              <div className="t-h2">Bạn đang được bảo vệ</div>
              <div className="t-cap muted">Tuần này: {stats.calls + stats.messages} cảnh báo</div>
            </div>
            <span className="chip safe"><Icon name="check" size={14} />{stats.layersOn}/3 lớp</span>
          </div>
          <div className="divider" />
          {layers.map((l, i) => (
            <div className="row gap-12" key={l.title}>
              <div className="icon-box brand"><Icon name={l.icon} size={20} /></div>
              <div className="col grow"><div className="t-label semi">{l.title}</div><div className="t-cap muted">{l.sub}</div></div>
              <span className={`dot ${i < stats.layersOn ? 'safe' : ''}`} />
            </div>
          ))}
        </button>

        <button type="button" className="btn primary block" onClick={() => nav('/kiem-tra')}><Icon name="search" size={20} />Kiểm tra trước khi chuyển tiền</button>

        <div className="row gap-8">
          <Tile icon="clipboard" box="ai" label="Dán tin" onClick={() => nav('/kiem-tra/tin-nhan')} />
          <Tile icon="users" box="safe" label="Người thân" onClick={() => nav('/hoi-nguoi-than')} />
          <Tile icon="flag" box="danger" label="Báo cáo" onClick={() => nav('/bao-cao')} />
        </div>

        {emerging && (
          <button type="button" className="card warn col gap-8 tap" onClick={() => openLearn(emerging.scamType, toast)}>
            <div className="row gap-8"><Icon name="trend-up" size={18} className="c-warn" /><div className="t-over c-warn-ink">Kiểu lừa đảo mới ở khu vực bạn</div></div>
            <div className="t-label c-ink semi">{emerging.title || emerging.label}</div>
            <div className="row between">
              <div className="t-cap c-warn-ink">{emerging.count} báo cáo trong {emerging.days} ngày qua</div>
              <div className="row gap-4 c-brand"><div className="t-cap bold">Xem truyện 1 phút</div><Icon name="arrow-right" size={14} /></div>
            </div>
          </button>
        )}
      </div>
      <BottomNav active="home" />
    </Phone>
  )
}

function Tile({ icon, box, label, onClick }) {
  return (
    <button type="button" className="card col gap-6 grow acenter tap" style={{ padding: '12px 4px' }} onClick={onClick}>
      <div className={`icon-box ${box} round`}><Icon name={icon} size={20} /></div>
      <div className="t-cap semi">{label}</div>
    </button>
  )
}
