// Đội tình nguyện: C0 mã đội · C1 trang chủ · C2 thống kê, điểm nóng · C3 kiểu mới · C4 duyệt báo cáo · C5 chia sẻ cảnh báo
// Dùng chung máy chủ với web đội tình nguyện của Mảng 6 (/web): duyệt ở đây thì web cũng thấy.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Btn, Circle, Group, I, Keypad, Row, Screen, StateView, Switch, Tag, TopRow, maskPhone } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { useApp } from '../../lib/state.jsx'
import { highlight } from './Check.jsx'

const TEAM_CODE = '246810'   // mã thử cho buổi trình diễn; triển khai thật thì phường cấp mã cho từng đội

function useStats() {
  const [s, setS] = useState(null)
  useEffect(() => {
    let alive = true
    api.stats().then((x) => alive && setS(x)).catch(() => alive && setS(false))
    return () => { alive = false }
  }, [])
  return s
}

// ---------- C0 ----------
export function TeamCode() {
  const nav = useNavigate()
  const { setOnboarded } = useApp()
  const [code, setCode] = useState('')
  const [bad, setBad] = useState(false)
  const key = (k) => { setBad(false); setCode((c) => (k === 'del' ? c.slice(0, -1) : c.length < 6 ? c + k : c)) }
  const go = () => {
    if (code !== TEAM_CODE) { setBad(true); return }
    localStorage.setItem('lcs.team', code)
    setOnboarded(true)
    nav('/', { replace: true })
  }
  const shown = (code + '••••••').slice(0, 6)
  return (
    <Screen name={bad ? 'C0b-ma-doi-sai' : 'C0-ma-doi'} bar={<Bar title="Mã đội" />} foot={<Btn onClick={go} disabled={code.length < 6}>{bad ? 'Thử lại' : 'Vào'}</Btn>}>
      <div className="t-sub center">Nhập mã do phường cấp</div>
      <div className="numdisp" style={{ letterSpacing: 6, color: bad ? 'var(--dang)' : undefined, borderColor: bad ? 'var(--dang)' : undefined }}>{shown.slice(0, 3)} {shown.slice(3)}</div>
      {bad ? <div className="t-sm c-dang center t-s">Mã chưa đúng.</div> : <div className="t-sm center">Mã thử cho buổi trình diễn: 246 810</div>}
      <Keypad onKey={key} />
    </Screen>
  )
}

// ---------- C1 ----------
export function VolunteerHome() {
  const nav = useNavigate()
  const { ward } = useApp()
  const s = useStats()
  const top = (s?.byType || []).slice(0, 2)
  return (
    <Screen name="C1-trang-chu-tinh-nguyen" nav="/">
      <TopRow right={<button type="button" className="pill tap" onClick={() => nav('/phuong')}><I n="pin" z={20} />{ward}</button>} />
      <div className="row g12">
        <div className="card col g2 grow"><div className="h-xl c-pri">{s ? s.total : '…'}</div><div className="t-sub">báo cáo tháng này</div></div>
        <div className="card col g2 grow"><div className="h-xl c-pri">{s ? `${s.linkPct}%` : '…'}</div><div className="t-sub">đường dẫn giả</div></div>
      </div>
      <div className="sec">Mới tuần này</div>
      <Group>
        {s?.emerging && <Row tall lead={<Circle z={52} bg="warn-t" c="warn" icon="tri" />} title={s.emerging.label} sub={`${s.emerging.count} lượt · ${s.emerging.days} ngày`}
          right={<Tag kind="new">Mới</Tag>} onClick={() => nav('/kieu-moi')} />}
        {top.map((t) => <Row key={t.scamType} tall lead={<Circle z={52} bg="pri-t" c="pri" icon={t.scamType === 'duong_dan_gia' ? 'link' : 'flag'} />} title={t.label} sub={`${t.count} lượt trong tháng`} />)}
        {s === false && <Row icon="wifioff" title="Chưa tải được số liệu" sub="Kiểm tra mạng rồi mở lại" />}
      </Group>
      <Group>
        <Row icon="chart" title="Điểm nóng theo khu phố" onClick={() => nav('/thong-ke')} />
        <Row icon="check" title="Chờ duyệt" right={s ? <Tag kind="off">{s.needsReview}</Tag> : null} onClick={() => nav('/duyet')} />
        <Row icon="mega" title="Gửi cảnh báo cho người dân" onClick={() => nav('/chia-se')} />
      </Group>
    </Screen>
  )
}

// ---------- C2 ----------
const HEAT = ['#344D9C', '#5C72B5', '#9AA8D3', '#CDD4EA', '#E9EDF8']
export function Stats() {
  const nav = useNavigate()
  const s = useStats()
  if (!s) return <Screen name="C2-thong-ke" bar={<Bar title="Thống kê" />}><StateView icon={s === false ? 'wifioff' : 'chart'} title={s === false ? 'Chưa tải được số liệu' : 'Đang tải…'} /></Screen>
  if (!s.total) return <Screen name="C2c-chua-co-bao-cao" bar={<Bar title="Thống kê" />} foot={<Btn onClick={() => nav('/bao-cao')}>Ghi nhận báo cáo</Btn>}><StateView icon="chart" title="Chưa có báo cáo" /></Screen>
  const max = Math.max(...s.byArea.map((a) => a.count))
  const maxT = Math.max(...s.byType.map((t) => t.count))
  return (
    <Screen name="C2-thong-ke" bar={<Bar title="Thống kê" />} foot={<Btn icon="share" onClick={() => nav('/chia-se')}>Chia sẻ cảnh báo</Btn>}>
      <div className="t-sub">Tháng {s.month} · {s.area} · {s.totalDelta}</div>
      <div className="card col g12">
        <div className="t-row">Điểm nóng</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {s.byArea.map((a, i) => {
            const lvl = Math.min(4, Math.round((1 - a.count / max) * 4))
            return (
              <div key={a.area} className="col g2 pop" style={{ background: HEAT[lvl], color: lvl < 2 ? '#fff' : 'var(--ink)', borderRadius: 16, padding: '10px 12px', animationDelay: `${i * 0.04}s` }}>
                <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{a.area}</span><span style={{ fontSize: 24, fontWeight: 700 }}>{a.count}</span>
              </div>
            )
          })}
        </div>
        <div className="row g6 t-sm"><span>Ít</span>{[...HEAT].reverse().map((c) => <span key={c} style={{ width: 22, height: 10, borderRadius: 3, background: c }} />)}<span>Nhiều</span></div>
      </div>
      <div className="card col g10">
        <div className="t-row">Kiểu lừa đảo</div>
        {s.byType.map((t) => (
          <div key={t.scamType} className="col g4">
            <div className="row jb"><span style={{ fontSize: 16 }}>{t.label}</span><span className="t-b">{t.count}</span></div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--pri-t)' }}><div style={{ width: `${(t.count / maxT) * 100}%`, height: 8, borderRadius: 4, background: 'var(--pri)', transition: 'width .6s var(--ease)' }} /></div>
          </div>
        ))}
      </div>
      <div className="card row g12"><I n="clock" z={24} c="pri" /><div className="t-sub c-ink grow">Giờ cao điểm: <b>{s.peakHours}</b></div></div>
    </Screen>
  )
}

// ---------- C3 ----------
export function NewType() {
  const nav = useNavigate()
  const s = useStats()
  const e = s?.emerging
  if (!e) return <Screen name="C3-kieu-moi" bar={<Bar title="Kiểu mới" />}><StateView icon="tri" iconBg="warn-t" iconColor="warn" title={s === null ? 'Đang tải…' : 'Chưa có kiểu mới'} /></Screen>
  return (
    <Screen name="C3-kieu-moi" bar={<Bar title="Kiểu mới" />} foot={<Btn icon="share" onClick={() => nav('/chia-se')}>Chia sẻ cảnh báo</Btn>}>
      <div className="h-l">{e.title}</div>
      <div className="row g12">
        <div className="card col g2 grow"><div className="h-xl c-warn">{e.count}</div><div className="t-sub">lượt tuần này</div></div>
        <div className="card col g2 grow"><div className="h-xl c-warn">{e.days}</div><div className="t-sub">ngày gần đây</div></div>
      </div>
      {(e.quotes || []).map((q) => <div key={q} className="sms">{highlight(q, ['cắt', 'phím 9', 'nợ tiền điện'])}</div>)}
      <div className="card col g10">
        {['Dọa cắt điện trong vài giờ', 'Bắt bấm phím hoặc đường dẫn lạ để "xử lý"', 'Điện lực thật không gọi đòi tiền'].map((t, i) => (
          <div key={t} className="why"><I n={i === 2 ? 'info' : 'tri'} z={22} c={i === 2 ? 'pri' : 'warn'} /><span>{t}</span></div>
        ))}
      </div>
    </Screen>
  )
}

// ---------- C4 ----------
export function Review() {
  const nav = useNavigate()
  const { toast } = useApp()
  const [items, setItems] = useState(null)
  const [gone, setGone] = useState({})
  useEffect(() => {
    let alive = true
    api.reportsQueue(8).then((x) => alive && setItems(x.items || [])).catch(() => alive && setItems(false))
    return () => { alive = false }
  }, [])
  const decide = async (r, status) => {
    setGone((g) => ({ ...g, [r.id]: status }))
    try { await api.reviewReport(r.id, status); toast(status === 'confirmed' ? 'Đã xác nhận. Số này sẽ bị cảnh báo 90 ngày' : 'Đã bỏ báo cáo') } catch (e) {
      setGone((g) => { const n = { ...g }; delete n[r.id]; return n })
      toast(e.message)
    }
  }
  const left = (items || []).filter((r) => !gone[r.id])
  if (items && !left.length) {
    return (
      <Screen name="C4b-da-duyet-het" nav="/duyet" foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
        <StateView art="an-toan" title="Đã duyệt hết" text="Cảm ơn đội đã giữ an toàn cho khu phố." />
      </Screen>
    )
  }
  return (
    <Screen name="C4-duyet-bao-cao" nav="/duyet">
      <div className="h-xl" style={{ paddingTop: 10 }}>Duyệt báo cáo</div>
      {items === null && <div className="t-sub">Đang tải…</div>}
      {items === false && <div className="t-sub">Chưa tải được danh sách. Kiểm tra mạng rồi mở lại.</div>}
      {left.map((r) => (
        <div key={r.id} className="card col g10 rise">
          <div className="row g8" style={{ flexWrap: 'wrap' }}>
            <Tag kind="ok">{r.ai?.scamLabel || 'Chưa rõ kiểu'}</Tag>
            <span className="t-sm">{r.area} · {r.reporterCount} lượt · AI chắc {Math.round((r.ai?.confidence || 0) * 100)}%</span>
          </div>
          <div className="t-row" style={{ wordBreak: 'break-all' }}>{r.kind === 'link' ? r.target : maskPhone(r.target)}</div>
          {r.story && <div className="t-sub">“{r.story}”</div>}
          <div className="row g10">
            <button type="button" className="btn o sm" style={{ flex: 1 }} onClick={() => decide(r, 'rejected')}>Bỏ</button>
            <button type="button" className="btn p sm" style={{ flex: 1.4 }} onClick={() => decide(r, 'confirmed')}><I n="check" z={20} />Xác nhận</button>
          </div>
        </div>
      ))}
    </Screen>
  )
}

// ---------- C5 ----------
export function Share() {
  const nav = useNavigate()
  const { ward, toast } = useApp()
  const [text, setText] = useState(`Cảnh báo ${ward}: có người giả danh điện lực gọi báo cắt điện, gửi đường dẫn thu tiền. Đừng bấm, đừng chuyển tiền. Gọi tổng đài điện lực bằng số in trên hóa đơn.`)
  const [zalo, setZalo] = useState(true)
  const [board, setBoard] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const send = async () => {
    setBusy(true)
    try {
      const to = [zalo && 'Người thân đã ghép (Zalo)', board && `Bảng tin khu phố ${ward}`].filter(Boolean)
      await api.broadcast({ title: `Cảnh báo ${ward}`, body: text.trim(), to })
      setSent(true)
    } catch (e) { toast(e.message) } finally { setBusy(false) }
  }
  if (sent) {
    return (
      <Screen name="C5b-da-gui-canh-bao" bar={<Bar title="Chia sẻ" left="x" onLeft={() => nav('/', { replace: true })} />} foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
        <StateView art="mung" title="Đã gửi cảnh báo" text={zalo ? 'Người thân đã ghép nhận ngay trên Zalo.' : 'Cảnh báo đã lên bảng tin khu phố.'} />
      </Screen>
    )
  }
  return (
    <Screen name="C5-chia-se-canh-bao" bar={<Bar title="Chia sẻ" left="x" />} foot={<Btn icon="send" onClick={send} busy={busy} disabled={!text.trim() || (!zalo && !board)}>Gửi cảnh báo</Btn>}>
      <div className="t-lbl">Nội dung gửi cho người dân</div>
      <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} style={{ background: 'var(--pri)', color: '#fff', borderColor: 'var(--pri)', minHeight: 210 }} aria-label="Nội dung cảnh báo" />
      <div className="sec">Gửi tới</div>
      <Group>
        <Row icon="users" title="Người thân đã ghép" sub="Qua ứng dụng nhắn tin" right={<Switch on={zalo} onChange={setZalo} label="Gửi người thân" />} />
        <Row icon="mega" title="Bảng tin khu phố" sub={ward} right={<Switch on={board} onChange={setBoard} label="Gửi bảng tin" />} />
      </Group>
    </Screen>
  )
}
