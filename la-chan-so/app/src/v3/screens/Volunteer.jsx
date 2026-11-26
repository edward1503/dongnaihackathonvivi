// Đội tình nguyện: C0 mã đội · C1 trang chủ · C2 thống kê, điểm nóng · C3 kiểu mới · C4 duyệt báo cáo · C5 chia sẻ cảnh báo
// Dùng chung máy chủ với web đội tình nguyện của Mảng 6 (/web): duyệt ở đây thì web cũng thấy.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Btn, Circle, Group, I, Row, Screen, StateView, Switch, Tag, TopRow } from '../ui.jsx'
import { api, memberRole, saveTeam } from '../../lib/api.js'
import { useApp } from '../../lib/state.jsx'
import { levels, reportStatuses, voteProgress } from '../review.js'
import { highlight } from './Check.jsx'

function useStats() {
  const { persona } = useApp()
  const [s, setS] = useState(null)
  useEffect(() => {
    let active = true
    let latest = 0
    function refresh() {
      const request = ++latest
      api.stats(persona === 'volunteer').then((stats) => {
        if (active && request === latest) setS(stats)
      }).catch(() => { if (active && request === latest) setS(false) })
    }
    refresh()
    window.addEventListener('lcs-community-update', refresh)
    return () => { active = false; window.removeEventListener('lcs-community-update', refresh) }
  }, [persona])
  return s
}

// ---------- C0 ----------
export function TeamCode() {
  const nav = useNavigate()
  const { setMode, setOnboarded } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function login(event) {
    event.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setError('')
    try {
      const session = await api.teamLogin(code.trim())
      if (!session.token || !['lead', 'volunteer'].includes(session.member?.role)) throw new Error('Máy chủ chưa cấp phiên đội. Bạn thử lại nhé.')
      saveTeam(session)
      setMode('volunteer')
      setOnboarded(true)
      nav('/', { replace: true })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  return (
    <Screen name={error ? 'C0b-ma-doi-sai' : 'C0-ma-doi'} bar={<Bar title="Đăng nhập đội" onLeft={() => nav('/vai', { replace: true })} />}>
      <form className="col g14" onSubmit={login}>
        <label className="col g8"><span className="t-row">Mã do đội cấp</span>
          <input className="field" type="password" autoComplete="current-password" value={code} required
            onChange={(e) => { setCode(e.target.value); setError('') }} /></label>
        {error && <p role="alert" className="t-sub c-dang">{error}</p>}
        <Btn type="submit" busy={busy} disabled={!code.trim()}>Đăng nhập</Btn>
      </form>
    </Screen>
  )
}

// ---------- C1 ----------
export function VolunteerHome() {
  const nav = useNavigate()
  const { team } = useApp()
  const s = useStats()
  const top = (s?.byType || []).slice(0, 2)
  return (
    <Screen name="C1-trang-chu-tinh-nguyen" nav="/">
      <TopRow right={<span className="pill"><I n="pin" z={20} />{team.member.ward}</span>} />
      <div className="col g2"><h1 className="h-l">{team.member.name}</h1><p className="t-sub">{memberRole(team.member)}</p></div>
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
        {team.member.role === 'lead' && <Row icon="mega" title="Báo nhầm và cảnh báo khu phố" onClick={() => nav('/chia-se')} />}
      </Group>
    </Screen>
  )
}

// ---------- C2 ----------
const HEAT = ['#344D9C', '#5C72B5', '#9AA8D3', '#CDD4EA', '#E9EDF8']
export function Stats() {
  const { team } = useApp()
  const nav = useNavigate()
  const s = useStats()
  if (!s) return <Screen name="C2-thong-ke" bar={<Bar title="Thống kê" />}><StateView icon={s === false ? 'wifioff' : 'chart'} title={s === false ? 'Chưa tải được số liệu' : 'Đang tải…'} /></Screen>
  if (!s.total) return <Screen name="C2c-chua-co-bao-cao" bar={<Bar title="Thống kê" />}><StateView icon="chart" title="Chưa có báo cáo" /></Screen>
  const max = Math.max(...s.byArea.map((a) => a.count))
  const maxT = Math.max(...s.byType.map((t) => t.count))
  return (
    <Screen name="C2-thong-ke" bar={<Bar title="Thống kê" />} foot={team?.member.role === 'lead' && <Btn icon="share" onClick={() => nav('/chia-se')}>Chia sẻ cảnh báo</Btn>}>
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
  const { persona, team, ward } = useApp()
  const nav = useNavigate()
  const s = useStats()
  const e = s?.emerging
  if (!e) return <Screen name="C3-kieu-moi" bar={<Bar title="Kiểu lừa đảo mới" />}><StateView icon="tri" iconBg="warn-t" iconColor="warn" title={s === null ? 'Đang tải…' : 'Chưa có kiểu mới'} /></Screen>
  return (
    <Screen name="C3-kieu-moi" bar={<Bar title="Kiểu lừa đảo mới" />} foot={persona === 'volunteer' && team?.member.role === 'lead' && <Btn icon="share" onClick={() => nav('/chia-se')}>Chia sẻ cảnh báo</Btn>}>
      <div className="card tone-warn col g8">
        <div className="row g8 c-warn"><I n="mega" z={18} /><span className="t-over">Kiểu lừa đảo mới{ward ? ` ở ${ward}` : ''}</span></div>
        <div className="h-l">{e.title}</div>
      </div>
      <div className="row g12">
        <div className="card col g2 grow"><div className="t-display c-warn-ink">{e.count}</div><div className="t-sub">lượt tuần này</div></div>
        <div className="card col g2 grow"><div className="t-display c-warn-ink">{e.days}</div><div className="t-sub">ngày gần đây</div></div>
      </div>
      {(e.quotes || []).map((q) => <div key={q} className="bubble in">{highlight(q, ['cắt', 'phím 9', 'nợ tiền điện'])}</div>)}
      <div className="card col g8" style={{ padding: 14 }}>
        <div className="t-head">Dấu hiệu</div>
        {['Dọa cắt điện trong vài giờ', 'Bắt bấm phím hoặc đường dẫn lạ để "xử lý"', 'Điện lực thật không gọi đòi tiền'].map((t, i) => (
          <div key={t} className="why reason"><I n={i === 2 ? 'info' : 'alert'} z={18} c={i === 2 ? 'pri' : 'warn'} /><span>{t}</span></div>
        ))}
      </div>
    </Screen>
  )
}

// ---------- C5 ----------
export function Share() {
  const nav = useNavigate()
  const { team, toast } = useApp()
  const ward = team.member.ward
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
    <Screen name="C5-chia-se-canh-bao" bar={<Bar title="Việc của trưởng đội" left="x" />}>
      <Appeals />
      <h2 className="h-m">Gửi cảnh báo khu phố</h2>
      <div className="t-lbl">Nội dung gửi cho người dân</div>
      <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} style={{ background: 'var(--pri)', color: '#fff', borderColor: 'var(--pri)', minHeight: 210 }} aria-label="Nội dung cảnh báo" />
      <div className="sec">Gửi tới</div>
      <Group>
        <Row icon="users" title="Người thân đã ghép" sub="Qua ứng dụng nhắn tin" right={<Switch on={zalo} onChange={setZalo} label="Gửi người thân" />} />
        <Row icon="mega" title="Bảng tin khu phố" sub={ward} right={<Switch on={board} onChange={setBoard} label="Gửi bảng tin" />} />
      </Group>
      <Btn icon="send" onClick={send} busy={busy} disabled={!text.trim() || (!zalo && !board)}>Gửi cảnh báo</Btn>
    </Screen>
  )
}

// Cases and appeals can change while another team member is reviewing them.
function useQueue(read) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    let pending = false
    async function load() {
      if (pending || document.hidden) return
      pending = true
      try {
        const data = await read()
        const list = Array.isArray(data) ? data : data.items
        if (!Array.isArray(list)) throw new Error('Chưa đọc được danh sách. Bạn tải lại nhé.')
        if (active) { setItems(list); setError('') }
      } catch (e) { if (active) setError(e.message) }
      finally { pending = false }
    }
    load()
    const timer = setInterval(load, 10000)
    window.addEventListener('lcs-community-update', load)
    document.addEventListener('visibilitychange', load)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('lcs-community-update', load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [read, revision])
  return { items, error, reload: () => setRevision((n) => n + 1) }
}

function QueueMessage({ items, error, reload, empty }) {
  if (error) return <div className="col g8"><p role="alert" className="t-sub c-dang">{error}</p><Btn kind="o" onClick={reload}>Tải lại</Btn></div>
  if (items === null) return <p role="status" className="t-sub">Đang tải…</p>
  return items.length ? null : <p className="t-sub">{empty}</p>
}

const flags = { burst: 'Báo dồn', conflict: 'Ý kiến trái nhau', appeal: 'Đang xét báo nhầm', w2: 'Bản ghi chờ xét', w3: 'Cụm nhiều máy' }
const decisions = { confirm: 'Xác nhận', reject: 'Bác', spam: 'Spam' }
const answers = { yes: 'Có đòi chuyển tiền', no: 'Không đòi chuyển tiền', known: 'Tôi biết số này', 'dung-chuyen': 'Đừng chuyển', 'nguoi-quen': 'Người quen' }
const scamTypes = { gia_danh_cong_an: 'Giả danh công an', duong_dan_gia: 'Đường dẫn giả mạo', viec_nhe_luong_cao: 'Việc nhẹ lương cao',
  nguoi_than_tai_nan: 'Người thân gặp nạn', gia_dien_luc: 'Giả nhân viên điện lực', qua_tri_an: 'Quà tri ân', dau_tu_lai_cao: 'Đầu tư lãi cao', khac: 'Khác' }

// Describe evidence in this review. The server alone awards points and sets the public level.
function evidenceGroup(report) {
  if (report.status === 'validated') return 'W1'
  if (report.status === 'unvalidated' || (report.analysisId && report.status === 'confirmed')) return 'W2'
  if (!report.analysisId && ['call_log', 'sms_received', 'screenshot'].includes(report.evidence?.type)) return 'W3'
  return 'Chờ phân nhóm'
}

function Evidence({ reports }) {
  const mix = { W1: 0, W2: 0, W3: 0 }
  for (const report of reports) {
    const group = evidenceGroup(report)
    if (group in mix) mix[group]++
  }
  return (
    <details className="review-evidence">
      <summary>Bằng chứng · {Object.entries(mix).map(([group, count]) => `${group} · ${count}`).join(' / ')}</summary>
      <div className="col g12">{reports.map((report) => {
        const when = report.evidence?.at
        const source = { call_log: 'Cuộc gọi đến', sms_received: 'Tin nhắn đến', screenshot: 'Ảnh đã che' }[report.evidence?.type]
        return <div className="col g4" key={report.id}>
          <div className="t-lbl">{source} · {evidenceGroup(report)}</div>
          {when && <div className="t-sm">{new Date(when).toLocaleString('vi-VN')}</div>}
          <div className="t-sub">{reportStatuses[report.status]}</div>
          <div className="t-sm">AI · {levels[report.aiLevel] || 'Chưa có nhãn bản ghi'}{report.aiScamType && ` · ${scamTypes[report.aiScamType] || report.aiScamType}`}</div>
          {report.summary && <p className="t-sub">{report.summary}</p>}
          {report.story && <p className="t-sub">{report.story}</p>}
          <div className="t-sm">Người nhận · {answers[report.selfAnswer] || 'Chưa trả lời'}</div>
          <div className="t-sm">Người thân · {answers[report.relativeChoice] || 'Chưa trả lời'}</div>
          {report.lateAnswers?.map((answer, index) => <div key={index} className="t-sm">
            {answer.actor === 'self' ? 'Người nhận' : 'Người thân'} trả lời muộn · {answers[answer.choice] || answer.choice}</div>)}
        </div>
      })}</div>
    </details>
  )
}

function CaseCard({ item, reload }) {
  const { toast } = useApp()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState('')
  const conflict = item.flags.includes('conflict')
  async function vote(decision) {
    setBusy(true)
    setError('')
    try {
      await api.vote(item.key, { reviewId: item.reviewId, decision, note: note.trim() || undefined })
      setVoted(true)
      toast('Đã ghi nhận phiếu của bạn.')
    } catch (e) { setError(e.message) }
    finally { setBusy(false); reload() }
  }
  return (
    <article className="card col g10" style={{ overflowWrap: 'anywhere' }}>
      <h2 className="h-m">{item.reports[0]?.target || item.key}</h2>
      <p className="t-row">{item.reportedCount ?? item.count} máy đã báo</p>
      <p className="t-sm">Mức công khai · {levels[item.level]} · {item.count} máy được tính</p>
      <div className="chips">{item.flags.map((flag) => <Tag key={flag} kind="new">{flags[flag] || flag}</Tag>)}</div>
      <Evidence reports={item.reports} />
      <p className="t-lbl">{voteProgress(item.votes)}</p>
      {item.notes?.filter((vote) => vote.note).map((vote) => <p className="t-sm" key={vote.member}>{decisions[vote.decision]} · {vote.note}</p>)}
      {item.myVote && <p className="t-sm">Phiếu của bạn · {decisions[item.myVote]}</p>}
      {item.reasonCannotVote && <p className="t-sub">{item.reasonCannotVote}</p>}
      {item.canVote && !voted && <>
        <label className="col g6"><span className="t-lbl">{conflict ? 'Lý do xử lý ý kiến trái nhau (bắt buộc)' : 'Nhận xét (nếu có)'}</span>
          <textarea className="field" rows={2} style={{ minHeight: 78 }} required={conflict} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="review-actions">{Object.entries(decisions).map(([decision, label]) =>
          <Btn key={decision} kind={decision === 'confirm' ? 'p sm' : 'o sm'} disabled={busy || (conflict && !note.trim())}
            onClick={() => vote(decision)}>{label}</Btn>)}</div>
      </>}
      {error && <p role="alert" className="t-sub c-dang">{error}</p>}
    </article>
  )
}

export function Review() {
  const queue = useQueue(api.cases)
  return (
    <Screen name="C4-duyet-bao-cao" nav="/duyet">
      <h1 className="h-xl">Hồ sơ chờ xét</h1>
      <QueueMessage {...queue} empty="Đã xét hết hồ sơ đang chờ." />
      {queue.items?.map((item) => <CaseCard key={item.reviewId} item={item} reload={queue.reload} />)}
    </Screen>
  )
}

const appealStates = { pending_verification: 'Chờ chủ số xác minh', verified: 'Đã xác minh', resolved: 'Đã giải quyết', remove: 'Đã gỡ nhãn', keep: 'Đã giữ nhãn' }

function AppealCard({ item, reload }) {
  const { toast } = useApp()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [error, setError] = useState('')
  async function resolve(outcome) {
    setBusy(true)
    setError('')
    try {
      await api.resolveAppeal(item.id, { outcome, note: note.trim() || undefined })
      setResolved(true)
      toast(outcome === 'remove' ? 'Đã gỡ nhãn.' : 'Đã giữ nhãn.')
    } catch (e) { setError(e.message) }
    finally { setBusy(false); reload() }
  }
  return (
    <section className="card col g8">
      <h3 className="t-row">{item.target || item.key}</h3>
      <p className="t-sub">{appealStates[item.outcome || item.status]}</p>
      {item.contact && <p className="t-sm">Số liên hệ · {item.contact}</p>}
      {item.text && <p className="t-sub">{item.text}</p>}
      {item.note && <p className="t-sub">{item.note}</p>}
      {item.status === 'verified' && !resolved && <>
        <label className="col g6"><span className="t-lbl">Lý do quyết định (nếu có)</span>
          <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="review-actions">
          <Btn kind="o sm" disabled={busy} onClick={() => resolve('keep')}>Giữ nhãn</Btn>
          <Btn kind="o sm" disabled={busy} onClick={() => resolve('remove')}>Gỡ nhãn</Btn>
        </div>
      </>}
      {error && <p role="alert" className="t-sub c-dang">{error}</p>}
    </section>
  )
}

function Appeals() {
  const queue = useQueue(api.appeals)
  return <>
    <h2 className="h-m">Yêu cầu xem lại số</h2>
    <QueueMessage {...queue} empty="Chưa có yêu cầu xem lại." />
    {queue.items?.map((item) => <AppealCard key={item.id} item={item} reload={queue.reload} />)}
  </>
}
