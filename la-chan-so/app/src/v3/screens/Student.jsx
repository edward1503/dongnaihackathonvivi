// A11a thư viện bài học · bài học 1 phút theo thẻ · A12a/A12b bài kiểm tra 5 câu · A12c kết quả
import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { APP, Art, Bar, Btn, I, IconBox, Progress, Screen, Tag } from '../ui.jsx'
import { useApp } from '../../lib/state.jsx'
import { LESSONS, COMICS, PRACTICE_CALLS, openComic, openPracticeCall, quizFor, lessonsFor } from '../lessons.js'
import biaGiaDanh from '../art/bia-gia-danh-co-quan.webp'
import biaViecNhe from '../art/bia-viec-nhe-luong-cao.webp'
import biaNguoiThan from '../art/bia-nguoi-than-gap-nan.webp'
import biaDauTu from '../art/bia-dau-tu-lai-cao.webp'
import { Leaderboard } from './Leaderboard.jsx'

// Ảnh bìa nhỏ và lời giới thiệu của từng truyện (không hiện số bài)
const COMIC_INFO = {
  'gia-danh-co-quan': [biaGiaDanh, 'Truyện cùng bà Hoa'],
  'viec-nhe-luong-cao': [biaViecNhe, 'Truyện cùng Vy'],
  'nguoi-than-gap-nan': [biaNguoiThan, 'Truyện cùng bà Hoa'],
  'dau-tu-lai-cao': [biaDauTu, 'Truyện cùng chú Tư'],
}

function Cover({ slug, z }) {
  const src = COMIC_INFO[slug]?.[0]
  return src ? <img className="thumb" src={src} width={z} height={z} alt="" /> : <IconBox icon="book" tone="pri" z={20} />
}

export function Lessons() {
  const nav = useNavigate()
  const { persona, points } = useApp()
  const role = persona === 'elder' ? 'elder' : 'student'
  const comics = persona === 'relative' ? [...COMICS.elder, ...COMICS.student].sort((a, b) => a[1].localeCompare(b[1])) : COMICS[role]
  const calls = persona === 'relative' ? [...PRACTICE_CALLS.elder, ...PRACTICE_CALLS.student] : PRACTICE_CALLS[role]
  const [first] = comics
  return (
    <Screen name="A11a-thu-vien-truyen" nav="/bai-hoc"
      bar={<Bar title="Bài học" left={null} right={persona === 'student' && Number.isFinite(points) && points > 0 ? <Tag kind="new" icon="award">{points} điểm</Tag> : null} />}>
      {first && (
        <div className="card navy row g12 rise" style={{ padding: 16 }}>
          <div className="col grow g6">
            <div className="t-over" style={{ color: '#FBBF24' }}>Truyện tranh có lời kể</div>
            <div className="lesson-hero-title">{first[2]}</div>
            <div className="t-sm" style={{ color: '#CBD5E1' }}>Nghe kể chuyện, chọn cách xử lý cùng Bé Nai.</div>
            <div className="row g8" style={{ marginTop: 4 }}>
              <button type="button" className="btn p sm" onClick={() => openComic(first[0])}><I n="play" z={16} fill />Đọc truyện</button>
            </div>
          </div>
          <Cover slug={first[0]} z={84} />
        </div>
      )}
      <div className="t-head" style={{ marginTop: 4 }}>Chọn truyện</div>
      <div className="group">
        {comics.map(([slug, , title]) => (
          <button key={slug} type="button" className="li" onClick={() => openComic(slug)}>
            <Cover slug={slug} z={44} />
            <span className="col grow g2"><span className="t-row">{title}</span><span className="t-sm">{COMIC_INFO[slug]?.[1] || 'Truyện tranh có lời kể'}</span></span>
            <I n="next" z={20} className="chev" />
          </button>
        ))}
        <button type="button" className="li" onClick={() => openComic('')}>
          <IconBox icon="book" tone="pri" size="sm" z={20} />
          <span className="t-row grow">Tất cả truyện</span>
          <I n="next" z={20} className="chev" />
        </button>
      </div>
      <div className="t-head" style={{ marginTop: 4 }}>Gọi video luyện tập</div>
      <div className="group">
        {calls.map(([scene, name, topic]) => (
          <button key={scene} type="button" className="li" onClick={() => openPracticeCall(scene)}>
            <IconBox icon="phone" tone="safe" size="sm" z={20} />
            <span className="col grow g2"><span className="t-row">{name}</span><span className="t-sm">{topic}</span></span>
            <Tag kind="line" icon="phone">Gọi</Tag>
          </button>
        ))}
      </div>
      <div className="t-head" style={{ marginTop: 4 }}>Ôn nhanh 1 phút</div>
      <div className="group">
        {lessonsFor(persona).map((lesson) => (
          <button key={lesson.id} type="button" className="li" onClick={() => nav(`/bai-hoc/${lesson.id}`)}>
            <IconBox icon={lesson.icon} tone="dang" size="sm" z={20} />
            <span className="t-row grow">{lesson.title}</span>
            <I n="next" z={20} className="chev" />
          </button>
        ))}
      </div>
      <button type="button" className="act tap" style={{ minHeight: 72 }} onClick={() => nav('/kiem-tra-bai')}>
        <Art name="chao" z={52} />
        <div className="col grow g2"><div className="t-row">Thử tài nhận diện lừa đảo</div><div className="t-sm">5 câu cùng Bé Nai</div></div>
        <I n="next" z={22} className="chev" />
      </button>
      {persona !== 'elder' && (
        <button type="button" className="act tap" style={{ minHeight: 72 }} onClick={() => nav('/thi-dua')}>
          <IconBox icon="award" tone="pri" z={24} />
          <div className="col grow g2"><div className="t-row">Bảng thi đua</div><div className="t-sm">Lớp, trường, phường nào học tốt nhất</div></div>
          <I n="next" z={22} className="chev" />
        </button>
      )}
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
    <Screen name={`B6-bai-hoc-the-${step}`} bar={<Bar title={l.title} left="x" onLeft={() => nav('/bai-hoc', { replace: true })} right={<span className="t-lbl none" style={{ fontWeight: 500 }}>{step}/4</span>} />}
      foot={<Btn onClick={next}>{label}</Btn>}>
      <Progress total={4} at={step} />
      <div key={step} className="col g12 screen-in">
        {step === 1 && <>
          <div className="t-over c-ink2">Tình huống</div>
          <div className="card tone-gray col g10" style={{ padding: 12 }}>
            <div className="row g10"><div className="avatar gray"><I n="user" z={20} /></div><div className="t-row">Số lạ</div></div>
            <div className="bubble in">{l.sms}</div>
          </div>
          <div className="h-m">Có gì đáng ngờ?</div>
        </>}
        {step === 2 && <>
          <div className="h-m">{l.signs.length} dấu hiệu</div>
          {l.signs.map(([icon, t]) => <div key={t} className="card tight row g12"><IconBox icon={icon} tone="dang" z={20} /><div className="t-row grow">{t}</div></div>)}
        </>}
        {step === 3 && <>
          <div className="h-m">Nên làm gì?</div>
          {l.todo.map((t) => <div key={t} className="card tight row g12"><IconBox icon="check" tone="safe" z={20} /><div className="t-row grow">{t}</div></div>)}
        </>}
        {step === 4 && <div className="col ac g12 center" style={{ paddingTop: 20 }}><Art name="mung" z={168} className="pop" /><div className="h-l">Nhớ nhé!</div><div className="t-body c-ink2">{l.todo[0]}.</div></div>}
      </div>
    </Screen>
  )
}

// ---------- A12a câu hỏi · A12b giải thích ----------
// Chọn một đáp án rồi bấm "Trả lời"; sau đó hiện đúng/sai và lời giải thích
export function Quiz() {
  const nav = useNavigate()
  const { persona } = useApp()
  const QUIZ = quizFor(persona)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState([])
  const q = QUIZ[i]
  const last = i + 1 === QUIZ.length
  const answer = () => {
    if (pick === null) return
    setAnswered(true)
    if (pick === q.right) setScore((s) => s + 1)
    else setWrong((w) => [...w, i])
  }
  const next = () => {
    if (!last) { setI(i + 1); setPick(null); setAnswered(false); return }
    nav(`/kiem-tra-bai/ket-qua?diem=${score}${wrong.length ? `&sai=${wrong.join(',')}` : ''}`, { replace: true })
  }
  const correct = answered && pick === q.right
  return (
    <Screen name={answered ? `A12b-giai-thich-${correct ? 'dung' : 'sai'}` : 'A12a-cau-hoi'}
      bar={<Bar title="Bài kiểm tra" left="x" onLeft={() => nav(-1)} right={<span className="t-lbl none" style={{ fontWeight: 500 }}>Câu {i + 1}/{QUIZ.length}</span>} />}
      foot={answered
        ? <Btn onClick={next}>{last ? 'Xem kết quả' : 'Câu tiếp theo'}<I n="arrow-right" z={20} /></Btn>
        : <Btn onClick={answer} disabled={pick === null}>Trả lời</Btn>}>
      <div className="pbar"><i style={{ width: `${((i + 1) / QUIZ.length) * 100}%` }} /></div>
      <div key={i} className="col g14 screen-in">
        {answered ? (
          <div className="card tone-gray row as g10" style={{ padding: 12 }}>
            <I n="message" z={18} c="ink2" style={{ marginTop: 2 }} />
            <div className="col grow g2"><div className="t-sm t-s">Số lạ</div><div className="reason">{q.sms}</div></div>
          </div>
        ) : <>
          <div className="col g4"><div className="t-over c-ink2">Tình huống</div><div className="t-body">Tin này đến từ một số lạ</div></div>
          <div className="card tone-gray col g10" style={{ padding: 12 }}>
            <div className="row g10"><div className="avatar gray small"><I n="user" z={20} /></div><div className="t-row">Số lạ</div></div>
            <div className="bubble in" style={{ alignSelf: 'flex-start' }}>{q.sms}</div>
          </div>
        </>}
        <div className="h-m">Bạn làm gì?</div>
        <div className="col g8" role="radiogroup">
          {q.options.map((o, k) => {
            const right = answered && k === q.right
            const bad = answered && k === pick && k !== q.right
            const cls = right ? 'ok' : bad ? 'bad' : answered ? 'dim' : pick === k ? 'sel' : ''
            return (
              <button key={o} type="button" role="radio" aria-checked={pick === k} className={`opt ${cls}`} disabled={answered} onClick={() => setPick(k)}>
                {right ? <I n="check-circle" z={22} c="safe" /> : bad ? <I n="x-circle" z={22} c="dang" /> : <span className={`radio${pick === k ? ' on' : ''}`} />}
                <span className="grow">{o}</span>
                {right && <Tag kind="solid-safe">{pick === q.right ? 'Chính xác' : 'Đáp án đúng'}</Tag>}
                {bad && <Tag kind="solid-dang">Chưa đúng</Tag>}
              </button>
            )
          })}
        </div>
        {answered ? (
          <div className="card tone-pri col g8 rise" style={{ padding: '14px 16px' }}>
            <div className="row g6 t-head c-pri-ink"><I n="info" z={16} />Vì sao?</div>
            <div className="row as g8"><I n="alert" z={16} c="dang" style={{ marginTop: 2 }} /><div className="reason grow">{q.why}</div></div>
          </div>
        ) : (
          <div className="row g8 jc"><I n="info" z={16} c="ink2" /><div className="t-sm">Chọn một đáp án rồi bấm Trả lời</div></div>
        )}
      </div>
    </Screen>
  )
}

// ---------- A12c kết quả ----------
export function QuizResult() {
  const nav = useNavigate()
  const { persona, toast } = useApp()
  const QUIZ = quizFor(persona)
  const [params] = useSearchParams()
  const score = Number(params.get('diem') || 0)
  const wrong = (params.get('sai') || '').split(',').filter(Boolean).map(Number).filter((n) => QUIZ[n])
  const good = score >= 4
  const student = persona === 'student'
  const challenge = async () => {
    const url = `${location.origin}${location.pathname}#/kiem-tra-bai`
    const text = `Mình được ${score}/${QUIZ.length} câu bài kiểm tra nhận diện lừa đảo của ${APP}. Bạn thử xem được mấy câu nhé!`
    try {
      if (navigator.share) await navigator.share({ title: APP, text, url })
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast('Đã chép lời thách, bạn dán gửi cho bạn bè nhé') }
    } catch { /* bấm hủy */ }
  }
  return (
    <Screen name="A12c-ket-qua" bar={<Bar title="Kết quả" left="x" onLeft={() => nav('/', { replace: true })} />}
      foot={student
        ? <><Btn icon="share" onClick={challenge}>Thách bạn bè làm bài</Btn><Btn kind="o" icon="refresh" onClick={() => nav('/kiem-tra-bai', { replace: true })}>Làm lại</Btn></>
        : <><Btn icon="refresh" onClick={() => nav('/kiem-tra-bai', { replace: true })}>Làm lại</Btn><Btn kind="o" icon="book" onClick={() => nav('/bai-hoc', { replace: true })}>Học lại</Btn></>}>
      <div className="col ac g10 center" style={{ paddingTop: 4 }}>
        <div className="score-ring pop"><b>{score}/{QUIZ.length}</b><span className="t-sm">câu đúng</span></div>
        <div className="h-l" style={{ marginTop: 4 }}>{good ? 'Rất tốt!' : score >= 3 ? 'Khá lắm!' : 'Cùng ôn lại nhé!'}</div>
        <div className="row g8 jc">
          <Art name={good ? 'mung' : 'nghi'} z={44} />
          {good && <Tag kind="new" icon="award">Hiệp sĩ Lá chắn</Tag>}
        </div>
      </div>
      {wrong.length > 0 && (
        <div className="card col g12">
          <div className="t-over c-ink2">Câu bạn làm sai</div>
          {wrong.map((n) => (
            <div key={n} className="row as g12">
              <IconBox icon="x" tone="dang" z={20} />
              <div className="col grow g4">
                <div className="reason t-s">{QUIZ[n].sms}</div>
                <div className="t-sm">Nên: {QUIZ[n].options[QUIZ[n].right]}</div>
              </div>
            </div>
          ))}
          <button type="button" className="link-btn" onClick={() => nav('/bai-hoc')}>Ôn bài học 1 phút<I n="arrow-right" z={16} /></button>
        </div>
      )}
      {student && <Leaderboard correct={score} total={QUIZ.length} />}
      {!student && <div className="sp" />}
      {student && <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => nav('/bai-hoc', { replace: true })}><I n="book" z={18} />Học lại</button>}
    </Screen>
  )
}
