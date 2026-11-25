// Trang chủ theo đối tượng: A1 người lớn tuổi · B1 học sinh · C1 đội tình nguyện (Volunteer.jsx)
// Lá chắn bị máy tắt (E01a) thì thẻ đỏ "Lá chắn đang ngủ" thay cho thẻ nổi bật.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banner, Btn, Circle, Group, I, Row, Screen, Search, Tag, TopRow, fmtPhone, maskPhone } from '../ui.jsx'
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

const LV = {
  danger: ['xoct', 'dang', 'Nguy hiểm'], suspicious: ['tri', 'warn', 'Nghi ngờ'],
  safe: ['shieldok', 'safe', 'An toàn'], unknown: ['info', 'ink2', 'Chưa có dữ liệu'],
}

function ago(iso) {
  const d = new Date(iso)
  const days = Math.round((new Date(new Date().toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days <= 0) return d.toTimeString().slice(0, 5)
  if (days === 1) return 'Hôm qua'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function SleepCard() {
  const nav = useNavigate()
  const { state, on, wakeUp } = useLayers()
  const { toast } = useApp()
  return (
    <div className="card col g12 rise" data-state="E01a-la-chan-dang-ngu" style={{ background: 'var(--dang-t)', border: '1.5px solid #F3B7B7' }}>
      <div className="row g12">
        <Circle z={56} bg="dang" c="w" icon="shieldoff" iz={28} />
        <div className="col grow"><div className="h-m c-dang">Lá chắn đang ngủ</div><div className="t-sub c-ink">Bạn chưa được bảo vệ</div></div>
      </div>
      <div className="t-body">{state.asleep ? 'Máy đã tắt Lá chắn để tiết kiệm pin.' : `Mới bật ${on}/3 lớp bảo vệ.`}</div>
      <Btn kind="d" icon="power" onClick={() => (state.asleep ? (wakeUp(), toast('Lá chắn đã bật lại')) : nav('/thiet-lap'))}>{state.asleep ? 'Bật lại ngay' : 'Bật tiếp'}</Btn>
    </div>
  )
}

function PersonHome({ student }) {
  const nav = useNavigate()
  const { recent, ward } = useApp()
  const { asleep, on } = useLayers()
  const [alert, setAlert] = useState(null)
  useEffect(() => {
    let alive = true
    api.stats().then((s) => alive && setAlert(s.emerging || null)).catch(() => {})
    return () => { alive = false }
  }, [])
  const recheck = (x) => nav(`/kiem-tra?loai=${x.kind === 'link' ? 'text' : x.kind}&v=${encodeURIComponent(x.value)}&tudong=1`)

  return (
    <Screen name={asleep ? 'E01a-la-chan-dang-ngu' : student ? 'B1-trang-chu-hoc-sinh' : 'A1-trang-chu-lon-tuoi'} nav="/">
      <TopRow right={<button type="button" className="pill report-entry tap" onClick={() => nav('/bao-cao')}><I n="flag" z={20} /> {student ? 'Báo cáo' : 'Báo cuộc vừa nhận'}</button>} />
      {!asleep && (
        <button type="button" className="row g8 tap" style={{ padding: '0 6px' }} onClick={() => nav('/thiet-lap')}>
          <I n="shieldok" z={20} c="safe" /><span className="t-sub c-ink" style={{ fontWeight: 600 }}>Lá chắn đang bật · {on}/3 lớp</span>
        </button>
      )}
      <Search placeholder={student ? 'Dán tin nhắn, đường dẫn' : 'Số lạ, đường dẫn'} onClick={() => nav(student ? '/kiem-tra?loai=text' : '/kiem-tra')} />
      {asleep ? <SleepCard /> : student
        ? <Banner bg="pri" title={<>Thử tài nhận diện<br />lừa đảo</>} btn="Làm 5 câu" art="chao" onClick={() => nav('/kiem-tra-bai')} />
        : <Banner bg="dang" title={<>Đang bị gọi<br />đòi tiền?</>} btn="Xử lý ngay" icon="phoneoff" onClick={() => nav('/khan-cap')} />}
      <div className="sec">Gần đây</div>
      <Group>
        {alert && (
          <Row tall lead={<Circle z={52} bg="pri-t" c="pri" icon="pin" />} title={`Cảnh báo ${ward}`} sub={`Mới: ${alert.label.toLowerCase()}`}
            onClick={() => nav('/canh-bao-khu-pho')} chev={false} />
        )}
        {recent.slice(0, 4).map((x) => {
          const [icon, c, label] = LV[x.level] || LV.unknown
          return (
            <Row key={x.display + x.at} tall lead={<Circle z={52} bg={c === 'ink2' ? 'pg' : `${c}-t`} c={c} icon={icon} />}
              title={x.kind === 'link' ? x.display : x.kind === 'account' ? `TK ${maskPhone(x.value)}` : fmtPhone(x.display)}
              sub={x.label || label} value={ago(x.at)} onClick={() => recheck(x)} chev={false} />
          )
        })}
        {!recent.length && !alert && <Row icon="search" iconColor="mute" title="Chưa kiểm tra gì" sub="Số lạ, đường dẫn lạ: kiểm tra trước khi chuyển tiền" />}
      </Group>
      {student && <div className="row jc"><Tag kind="ok" icon="book">Học 1 phút mỗi ngày ở mục Bài học</Tag></div>}
    </Screen>
  )
}
