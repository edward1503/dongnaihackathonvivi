// Trang chủ theo đối tượng: A1 người lớn tuổi · B1 học sinh · C1 đội tình nguyện (Volunteer.jsx)
// Lá chắn bị máy tắt (E01a) thì thẻ đỏ "Lá chắn đang ngủ" thay cho thẻ nổi bật.
import { RankCard } from './Leaderboard.jsx'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { APP, Art, Btn, Circle, Group, I, IconBox, Logo, Row, Screen, Tag } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { useLayers } from '../../lib/layers.js'
import { useApp } from '../../lib/state.jsx'
import { VolunteerHome } from './Volunteer.jsx'

export default function Home() {
  const { persona, onboarded } = useApp()
  if (!onboarded) return <Navigate to="/chao" replace />
  if (persona === 'volunteer') return <VolunteerHome />
  return <PersonHome student={persona === 'student'} />
}

function SleepCard() {
  const nav = useNavigate()
  const { state, on, wakeUp } = useLayers()
  const { toast, persona } = useApp()
  return (
    <div className="card tone-dang col g12 rise" data-state="E01a-la-chan-dang-ngu">
      <div className="row g12">
        <IconBox icon="shield-off" tone="solid-dang" size="lgx" z={30} />
        <div className="col grow"><div className="h-l c-dang-ink">Lá chắn đang ngủ</div><div className="t-lbl c-ink" style={{ fontWeight: 500 }}>{persona === 'elder' ? 'Bà' : 'Bạn'} chưa được bảo vệ</div></div>
      </div>
      <div className="t-body">{state.asleep ? 'Máy đã tắt Lá chắn để tiết kiệm pin.' : `Mới bật ${on}/3 lớp bảo vệ.`}</div>
      <Btn kind="d" icon="power" onClick={() => (state.asleep ? (wakeUp(), toast('Lá chắn đã bật lại')) : nav('/thiet-lap'))}>{state.asleep ? 'Bật lại ngay' : 'Bật tiếp'}</Btn>
    </div>
  )
}

function FamilyReplies() {
  const nav = useNavigate()
  const { setAsk, relatives } = useApp()
  const [unread, setUnread] = useState([])
  useEffect(() => {
    let active = true
    const refresh = () => {
      if (!document.hidden) api.unreadReplies().then(rows => { if (active) setUnread(rows) }).catch(() => {})
    }
    refresh()
    window.addEventListener('lcs-family-reply', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.removeEventListener('lcs-family-reply', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  if (!unread.length) return null
  return <Group>{unread.map(({ askId, reply }) => <Row key={askId} icon="msg" title="Minh gửi lời nhắn cho mẹ" sub={new Date(reply.at).toLocaleString('vi-VN')}
    onClick={() => {
      setAsk({ askId, fromInbox: true, to: relatives.find(r => r.id === 'minh') || { name: 'Minh' },
        reply: { ...reply, id: reply.id || reply.at, text: reply.text.replace(/^Minh: /, ''), preset: reply.choice === 'nguoi-quen' ? 'nguoi_quen' : 'dung_chuyen' } })
      nav('/hoi-nguoi-than/tra-loi')
    }} />)}</Group>
}

// Short descriptions of the three protection layers, as in the submitted A01b
const LAYER_ROWS = [
  { key: 'calls', icon: 'phonein', title: 'Lá chắn cuộc gọi', sub: 'Cảnh báo khi đổ chuông, phân tích sau cuộc gọi' },
  { key: 'messages', icon: 'msg', title: 'Lá chắn tin nhắn', sub: 'SMS, Zalo, Messenger' },
  { key: 'banking', icon: 'cardi', title: 'Nhắc trước khi chuyển tiền', sub: 'Nhắc khi mở app ngân hàng sau cuộc gọi lạ' },
]

function today() {
  const t = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function Action({ icon, tone, title, sub, onClick }) {
  return (
    <button type="button" className="act tap" onClick={onClick}>
      <IconBox icon={icon} tone={tone} size="lgx" />
      <div className="col grow g2"><div className="h-m">{title}</div>{sub && <div className="t-sub">{sub}</div>}</div>
      <I n="next" z={24} className="chev" />
    </button>
  )
}

function PersonHome({ student }) {
  return student ? <StudentHome /> : <ElderHome />
}

// A01a: one status card, three large actions, emergency bar (chữ lớn)
function ElderHome() {
  const nav = useNavigate()
  const { relatives } = useApp()
  const { asleep, on } = useLayers()
  const kin = relatives.find((r) => r.paired) || relatives[0]
  const kinSub = kin ? (/^con/.test(kin.relation || '') ? `Gửi ngay cho con: ${kin.name}` : `Gửi ngay cho ${kin.name}`) : 'Thêm người thân để hỏi nhanh'
  return (
    <Screen name={asleep ? 'E01a-la-chan-dang-ngu' : 'A1-trang-chu-lon-tuoi'} nav="/" className="home-elder">
      <div className="col g2" style={{ paddingTop: 6 }}>
        <div className="t-lbl c-ink2" style={{ fontWeight: 500 }}>{today()}</div>
        <div className="h-l">Chào bà</div>
      </div>
      <FamilyReplies />
      {asleep ? <SleepCard /> : (
        <button type="button" className="card solid-pri col g10 tap" style={{ textAlign: 'left' }} onClick={() => nav('/thiet-lap')}>
          <div className="row g12">
            <IconBox icon="shieldok" tone="white" size="lgx" z={30} />
            <div className="col grow">
              <div className="h-m">Lá chắn đang bật</div>
              <div className="t-lbl" style={{ color: '#DBEAFE', fontWeight: 500 }}>Bà đang được bảo vệ</div>
            </div>
          </div>
          <div className="t-lbl" style={{ fontWeight: 500, color: '#fff' }}>
            {on >= 3 ? 'Đang bật đủ 3 lớp: cuộc gọi, tin nhắn, nhắc trước khi chuyển tiền.' : `Mới bật ${on}/3 lớp. Bà bấm vào đây để bật thêm.`}
          </div>
        </button>
      )}
      <Action icon="search" tone="pri" title="Kiểm tra trước khi chuyển tiền" onClick={() => nav('/kiem-tra')} />
      <Action icon="users" tone="safe" title="Hỏi người thân" sub={kinSub} onClick={() => nav(kin ? '/hoi-nguoi-than' : '/nguoi-than/them')} />
      <Action icon="flag" tone="dang" title="Báo cuộc vừa nhận" sub="Để cảnh báo mọi người" onClick={() => nav('/bao-cao')} />
      <button type="button" className="sos tap" onClick={() => nav('/khan-cap')}>
        <div className="col grow">
          <div style={{ fontSize: 19, lineHeight: '25px', fontWeight: 700 }}>Đang bị gọi đòi tiền?</div>
          <div style={{ fontSize: 15, lineHeight: '20px', fontWeight: 500, color: '#FEE2E2' }}>Bấm để được giúp ngay</div>
        </div>
        <div className="circ" style={{ width: 46, height: 46, background: '#fff', color: 'var(--dang)' }}><I n="phoneoff" z={24} /></div>
      </button>
    </Screen>
  )
}

// A01b: protection card with the three layers, main action, three shortcuts, new scam type nearby
function StudentHome() {
  const nav = useNavigate()
  const { points, ward } = useApp()
  const layers = useLayers()
  const { asleep, on } = layers
  const [alert, setAlert] = useState(null)
  useEffect(() => {
    let alive = true
    api.stats().then((s) => alive && setAlert(s.emerging || null)).catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <Screen name={asleep ? 'E01a-la-chan-dang-ngu' : 'B1-trang-chu-hoc-sinh'} nav="/">
      <div className="row g10" style={{ minHeight: 48 }}>
        <Logo z={36} />
        <div className="h-m grow">{APP}</div>
        {Number.isFinite(points) && points > 0 && <Tag kind="new" icon="award">{points} điểm</Tag>}
      </div>
      {asleep ? <SleepCard /> : (
        <button type="button" className="card col g12 tap" style={{ textAlign: 'left' }} onClick={() => nav('/thiet-lap')}>
          <div className="row jb g8">
            <div className="col"><div className="h-m">Bạn đang được bảo vệ</div><div className="t-sm">Lá chắn chạy ngầm trên máy</div></div>
            <Tag kind={on >= 3 ? 'on' : 'new'} icon={on >= 3 ? 'check' : 'tri'}>{on}/3 lớp</Tag>
          </div>
          <div style={{ height: 1, background: 'var(--line)' }} />
          {LAYER_ROWS.map((l) => (
            <div key={l.key} className="row g12">
              <IconBox icon={l.icon} tone="pri" z={20} />
              <div className="col grow"><div className="t-row" style={{ fontSize: 15 }}>{l.title}</div><div className="t-sm">{l.sub}</div></div>
              <span className={`dotx ${layers.state?.[l.key] === false ? 'off' : 'on'}`} />
            </div>
          ))}
        </button>
      )}
      <Btn icon="search" onClick={() => nav('/kiem-tra?loai=text')}>Kiểm tra trước khi chuyển tiền</Btn>
      <RankCard />
      <div className="row g8">
        <button type="button" className="tile tap" onClick={() => nav('/kiem-tra?loai=text')}><IconBox icon="clip" tone="pri" round z={20} />Dán tin</button>
        <button type="button" className="tile tap" onClick={() => nav('/nguoi-than')}><IconBox icon="users" tone="safe" round z={20} />Người thân</button>
        <button type="button" className="tile tap" onClick={() => nav('/bao-cao')}><IconBox icon="flag" tone="dang" round z={20} />Báo cáo</button>
      </div>
      {alert && (
        <button type="button" className="card col g6 tap" style={{ textAlign: 'left', background: 'var(--warn-t)', borderColor: '#FCD34D' }} onClick={() => nav('/canh-bao-khu-pho')}>
          <div className="row g8 c-warn"><I n="mega" z={18} /><span className="t-over">Kiểu lừa đảo mới ở {ward}</span></div>
          <div className="t-row">{alert.title || alert.label}</div>
          <div className="row jb g8">
            <span className="t-sm" style={{ color: '#78350F' }}>{alert.count} báo cáo trong {alert.days || 3} ngày qua</span>
            <span className="row g4 c-pri" style={{ fontSize: 13, fontWeight: 700 }}>Xem chi tiết<I n="next" z={16} /></span>
          </div>
        </button>
      )}
      <button type="button" className="act tap" style={{ minHeight: 72 }} onClick={() => nav('/kiem-tra-bai')}>
        <Art name="chao" z={52} />
        <div className="col grow g2"><div className="t-row">Thử tài nhận diện lừa đảo</div><div className="t-sm">5 câu cùng Bé Nai</div></div>
        <I n="next" z={22} className="chev" />
      </button>
    </Screen>
  )
}
