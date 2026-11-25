// B4 báo cáo (B4a thiếu thông tin) · B4b đã gửi · B5 bài học 1 phút · B6 thẻ bài học · B7 bài kiểm tra · B8 kết quả
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, Progress, Row, Screen, StateView, Tag } from '../ui.jsx'
import { api } from '../../lib/api.js'
import { useApp } from '../../lib/state.jsx'
import { LESSONS, QUIZ, hasHocPage } from '../lessons.js'

// ---------- B4 ----------
const TYPES = ['Giả công an', 'Nhận quà', 'Tuyển việc', 'Giả người thân', 'Giả ngân hàng', 'Khác']
function kindOf(target, fallback) {
  const t = target.trim()
  if (fallback && fallback !== 'phone') return fallback
  if (/^[\d\s.+-]{6,}$/.test(t)) return t.replace(/\D/g, '').length > 11 ? 'account' : 'call'
  if (/\.[a-z]{2,}/i.test(t) && !/\s/.test(t)) return 'link'
  return 'message'
}

export function Report() {
  const nav = useNavigate()
  const { report, setReport, setPoints, reporter, toast } = useApp()
  const seed = report?.draft || {}
  const [type, setType] = useState(seed.type || null)
  const [target, setTarget] = useState(seed.target || '')
  const [story, setStory] = useState(seed.story || '')
  const [anon, setAnon] = useState(true)
  const [bad, setBad] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!target.trim()) { setBad(true); return }
    setBusy(true)
    try {
      const response = await api.report({
        kind: kindOf(target, seed.kind), target: target.trim(),
        story: [type ? `Kiểu: ${type}.` : '', story.trim()].filter(Boolean).join(' ') || null,
        hasAudio: false, lostMoney: false, reporter: anon ? 'an-danh' : reporter,
      })
      if (typeof response.totalPoints === 'number') setPoints(response.totalPoints)
      setReport({ draft: { type, target, story }, response })
      nav('/bao-cao/xong', { replace: true })
    } catch (e) {
      toast(e.offline ? 'Không có mạng. Báo cáo chưa gửi được, bạn thử lại nhé' : e.message)
    } finally { setBusy(false) }
  }
  return (
    <Screen name={bad ? 'B4a-bao-cao-thieu-thong-tin' : 'B4-bao-cao'}
      bar={<Bar title="Báo cáo" right={<button type="button" className={`pill tap${anon ? '' : ' off'}`} style={{ height: 44, padding: '0 12px', fontSize: 15 }} aria-pressed={anon} onClick={() => setAnon(!anon)}><I n="lock" z={18} c={anon ? 'pri' : 'mute'} />Ẩn danh</button>} />}
      foot={<Btn icon="send" onClick={submit} busy={busy}>Gửi báo cáo</Btn>}>
      <div className="col g8"><span className="t-lbl">Kiểu lừa đảo</span>
        <div className="chips">{TYPES.map((x) => <button key={x} type="button" className={`chip${type === x ? ' on' : ''}`} onClick={() => setType(type === x ? null : x)}>{x}</button>)}</div>
      </div>
      <label className="col g8"><span className="t-lbl">Số hoặc đường dẫn</span>
        <input className={`field${bad ? ' bad' : ''}`} value={target} onChange={(e) => { setTarget(e.target.value); setBad(false) }} placeholder="09xx xxx xxx hoặc viec-nhe.example" autoComplete="off" />
        {bad && <span className="t-sm c-dang t-s">Nhập số hoặc đường dẫn.</span>}
      </label>
      <label className="col g8"><span className="t-lbl">Kể ngắn (không bắt buộc)</span>
        <textarea className="field" style={{ minHeight: 110 }} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Người đó nói gì, đòi gì?" />
      </label>
      <div className="why t-sub"><I n="lock" z={18} /><span>Số tài khoản, số điện thoại trong lời kể được che trước khi gửi AI.</span></div>
    </Screen>
  )
}

export function ReportDone() {
  const nav = useNavigate()
  const { report, ward } = useApp()
  if (!report?.response) return <Navigate to="/bao-cao" replace />
  const st = report.response.report?.status
  const points = report.response.points
  return (
    <Screen name="B4b-da-gui" bar={<Bar title="Báo cáo" left="x" onLeft={() => nav('/', { replace: true })} />}
      foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
      <StateView art="mung" title="Đã gửi!" text={`Đội tình nguyện ${ward} đã nhận.`}>
        <div className="row g8 jc" style={{ flexWrap: 'wrap', marginTop: 4 }}>
          <Tag kind={st === 'ai_confirmed' || st === 'confirmed' ? 'on' : 'new'}>{st === 'ai_confirmed' || st === 'confirmed' ? 'Đã xác nhận' : 'Chờ đội duyệt'}</Tag>
          {points ? <Tag kind="ok" icon="award">+{points} điểm</Tag> : null}
        </div>
        <div className="t-sm" style={{ marginTop: 6 }}>Dự kiến chuyển công an phường (mô phỏng)</div>
      </StateView>
    </Screen>
  )
}

// ---------- B5 ----------
export function Lessons() {
  const nav = useNavigate()
  const [hoc, setHoc] = useState(false)
  useEffect(() => { hasHocPage().then(setHoc) }, [])
  return (
    <Screen name="B5-bai-hoc" nav="/bai-hoc">
      <div className="h-xl" style={{ paddingTop: 10 }}>Bài học 1 phút</div>
      <Group>{LESSONS.map((l) => <Row key={l.id} icon={l.icon} title={l.title} onClick={() => nav(`/bai-hoc/${l.id}`)} />)}</Group>
      <Btn icon="grad" onClick={() => nav('/kiem-tra-bai')}>Làm bài kiểm tra</Btn>
      <button type="button" className="card row g12 tap" style={{ background: 'var(--cream)', textAlign: 'left' }}
        onClick={() => { window.location.href = hoc ? '/prototype/hoc.html' : '/prototype/video-call.html' }}>
        <Art name="chao" z={72} />
        <div className="col grow g2"><div className="t-row">{hoc ? 'Truyện tranh cùng Bé Nai' : 'Gọi video khuyên chị Lan'}</div>
          <div className="t-sub">{hoc ? 'Chọn lối rẽ, gọi video với nhân vật AI đóng vai' : 'Nhân vật AI đóng vai, chấm 4 ý'}</div></div>
        <I n="next" z={22} className="chev" />
      </button>
    </Screen>
  )
}

// ---------- B6 ----------
export function LessonCards() {
  const nav = useNavigate()
  const { id } = useParams()
  const l = LESSONS.find((x) => x.id === id)
  const [step, setStep] = useState(1)
  if (!l) return <Navigate to="/bai-hoc" replace />
  const next = () => (step < 4 ? setStep(step + 1) : nav('/kiem-tra-bai', { replace: true }))
  const label = ['Xem dấu hiệu', 'Nên làm gì?', 'Tiếp', 'Làm bài kiểm tra'][step - 1]
  return (
    <Screen name={`B6-bai-hoc-the-${step}`} bar={<Bar title={l.title} left="x" onLeft={() => nav('/bai-hoc', { replace: true })} right={<span className="pill" style={{ height: 44 }}>{step}/4</span>} />}
      foot={<Btn onClick={next}>{label}</Btn>}>
      <Progress total={4} at={step} />
      <div key={step} className="col g14 screen-in">
        {step === 1 && <><div className="sms">{l.sms}</div><div className="h-l">Có gì đáng ngờ?</div></>}
        {step === 2 && <><div className="h-l">{l.signs.length} dấu hiệu</div>
          {l.signs.map(([icon, t]) => <div key={t} className="li" style={{ background: '#fff', minHeight: 70 }}><Circle z={44} bg="dang-t" c="dang" icon={icon} iz={22} /><div className="t-row grow" style={{ fontSize: 18 }}>{t}</div></div>)}</>}
        {step === 3 && <><div className="h-l">Nên làm gì?</div>
          {l.todo.map((t) => <div key={t} className="li" style={{ background: '#fff', minHeight: 70 }}><Circle z={44} bg="safe-t" c="safe" icon="check" iz={22} /><div className="t-row grow" style={{ fontSize: 18 }}>{t}</div></div>)}</>}
        {step === 4 && <div className="col ac g12 center" style={{ paddingTop: 20 }}><Art name="mung" z={180} className="pop" /><div className="h-l">Nhớ nhé!</div><div className="t-body c-ink2">{l.todo[0]}.</div></div>}
      </div>
    </Screen>
  )
}

// ---------- B7, B8 ----------
export function Quiz() {
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [score, setScore] = useState(0)
  const q = QUIZ[i]
  const answered = pick !== null
  const choose = (k) => { if (answered) return; setPick(k); if (k === q.right) setScore((s) => s + 1) }
  const next = () => {
    if (i + 1 < QUIZ.length) { setI(i + 1); setPick(null) } else nav(`/kiem-tra-bai/ket-qua?diem=${score}`, { replace: true })
  }
  return (
    <Screen name={`B7-bai-kiem-tra-${answered ? (pick === q.right ? 'dung' : 'sai') : 'chua-tra-loi'}`}
      bar={<Bar title="Bài kiểm tra" left="x" onLeft={() => nav(-1)} right={<span className="pill" style={{ height: 44 }}>{i + 1}/{QUIZ.length}</span>} />}
      foot={<Btn onClick={next} disabled={!answered}>Câu tiếp</Btn>}>
      <Progress total={QUIZ.length} at={i + 1} />
      <div key={i} className="col g14 screen-in">
        <div className="sms">{q.sms}</div>
        <div className="h-l">Bạn làm gì?</div>
        {q.options.map((o, k) => {
          const right = answered && k === q.right
          const wrong = answered && k === pick && k !== q.right
          return (
            <button key={o} type="button" className="li tap" onClick={() => choose(k)} aria-pressed={pick === k}
              style={{ background: right ? 'var(--safe-t)' : wrong ? 'var(--dang-t)' : '#fff', border: `1.5px solid ${right ? 'var(--safe)' : wrong ? 'var(--dang)' : 'var(--line)'}`, minHeight: 64 }}>
              {right && <I n="check" z={22} c="safe" sw={2.6} />}{wrong && <I n="x" z={22} c="dang" sw={2.6} />}
              <div className="t-row grow" style={{ fontSize: 18, color: right ? 'var(--safe)' : wrong ? 'var(--dang)' : undefined }}>{o}</div>
            </button>
          )
        })}
        {answered && (
          <div className="card rise" style={{ background: pick === q.right ? 'var(--safe-t)' : 'var(--dang-t)' }}>
            <div className="t-row" style={{ color: `var(--${pick === q.right ? 'safe' : 'dang'})` }}>{pick === q.right ? 'Đúng rồi!' : 'Chưa đúng.'}</div>
            <div className="t-sub c-ink" style={{ marginTop: 4 }}>{q.why}</div>
          </div>
        )}
      </div>
    </Screen>
  )
}

export function QuizResult() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const score = Number(params.get('diem') || 0)
  const good = score >= 4
  return (
    <Screen name="B8-ket-qua-bai-kiem-tra" bar={<Bar title="Kết quả" left="x" onLeft={() => nav('/', { replace: true })} />}
      foot={<><Btn kind="o" icon="book" onClick={() => nav('/bai-hoc', { replace: true })}>Học lại</Btn><Btn onClick={() => nav('/', { replace: true })}>Trang chủ</Btn></>}>
      <div className="col ac jc g10 grow center">
        <Art name={good ? 'mung' : 'nghi'} z={190} className="pop" />
        <div className="h-xxl" style={{ fontSize: 54, lineHeight: '62px' }}>{score}/{QUIZ.length}</div>
        <div className="h-m">{good ? 'Rất tốt!' : score >= 3 ? 'Khá lắm!' : 'Cùng ôn lại nhé!'}</div>
        {good && <Tag kind="new" icon="award">Hiệp sĩ Lá chắn</Tag>}
      </div>
    </Screen>
  )
}
