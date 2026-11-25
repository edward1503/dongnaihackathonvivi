import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Art, Bar, Btn, Circle, Group, I, Progress, Row, Screen, Tag } from '../ui.jsx'
import { useApp } from '../../lib/state.jsx'
import { LESSONS, QUIZ, COMICS, PRACTICE_CALLS, openComic, openPracticeCall } from '../lessons.js'

export function Lessons() {
  const nav = useNavigate()
  const { persona } = useApp()
  const role = persona === 'elder' ? 'elder' : 'student'
  const comics = persona === 'relative' ? [...COMICS.elder, ...COMICS.student].sort((a, b) => a[1].localeCompare(b[1])) : COMICS[role]
  const calls = persona === 'relative' ? [...PRACTICE_CALLS.elder, ...PRACTICE_CALLS.student] : PRACTICE_CALLS[role]
  return (
    <Screen name="B5-bai-hoc" nav="/bai-hoc">
      <div className="row g12"><Art name="chao" z={64} /><h1 className="h-l">Truyện tranh cùng Bé Nai</h1></div>
      <Group>{comics.map(([slug, label, title]) =>
        <Row key={slug} icon="book" title={title} sub={label} onClick={() => openComic(slug)} />)}
        <Row icon="book" title="Tất cả bài" onClick={() => openComic('')} />
      </Group>
      <h2 className="sec">Gọi video luyện tập</h2>
      <Group>{calls.map(([scene, name, topic]) =>
        <Row key={scene} icon="phone" title={name} sub={topic} onClick={() => openPracticeCall(scene)} />)}</Group>
      <h2 className="sec">Ôn nhanh</h2>
      <Group>{LESSONS.map((lesson) => <Row key={lesson.id} icon={lesson.icon} title={lesson.title} sub="Bài học 1 phút" onClick={() => nav(`/bai-hoc/${lesson.id}`)} />)}</Group>
      <Btn icon="grad" onClick={() => nav('/kiem-tra-bai')}>Làm bài kiểm tra 5 câu</Btn>
    </Screen>
  )
}


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
