// A12c · Xếp hạng nhóm: các lớp trong trường, các trường toàn Đồng Nai, các phường toàn Đồng Nai.
// Học sinh chọn trường và lớp một lần (lưu trên máy). Máy chủ chỉ giữ điểm cao nhất của mỗi máy và chỉ trả số gộp.
// Điểm thi đua = cộng điểm tốt nhất của từng bạn: rủ thêm bạn làm bài luôn cộng điểm cho lớp, không bao giờ kéo lớp tụt.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { api } from '../../lib/api.js'
import { useNavigate } from 'react-router-dom'
import { Bar, Btn, I, Screen, Tag } from '../ui.jsx'

const KEY = 'lcs.lop'
const SCOPES = [['group', 'Các lớp trong trường', 'Lớp'], ['school', 'Các trường toàn Đồng Nai', 'Trường'], ['ward', 'Các phường toàn Đồng Nai', 'Phường']]
const MINE = { group: 'lớp bạn', school: 'trường bạn', ward: 'phường bạn' }
const fmt = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 })

function readClass() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    return v?.school && v?.group ? v : null
  } catch { return null }
}
function saveClass(v) {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* trình duyệt chặn lưu: vẫn dùng được trong lần này */ }
}

export function Leaderboard({ correct, total }) {
  const [mine, setMine] = useState(readClass)
  const [picking, setPicking] = useState(!mine)
  const [scope, setScope] = useState('group')
  const [board, setBoard] = useState(null)
  const [state, setState] = useState('loading')      // loading | ok | off
  const [rise, setRise] = useState(null)             // thứ hạng mới khi lớp vừa lên hạng
  const [tick, setTick] = useState(0)
  const sent = useRef(false)

  useEffect(() => {
    if (!mine || picking) return
    let live = true
    ;(async () => {
      try {
        if (!sent.current && Number.isFinite(correct)) {
          // Xem bảng trước khi cộng điểm, gửi điểm, rồi xem lại: lớp lên hạng thì các dòng đổi chỗ có hiệu ứng.
          const before = await api.quizBoard('group', mine.school, mine.group)
          if (!live) return
          setScope('group'); setBoard(before); setState('ok')
          await api.quizResult({ quiz: 'nhan-dien', school: mine.school, group: mine.group, correct, total })
          sent.current = true
          const after = await api.quizBoard('group', mine.school, mine.group)
          const was = before.items.find((x) => x.mine)?.rank
          const now = after.items.find((x) => x.mine)?.rank
          if (!live) return
          if (now && (!was || now < was)) setTimeout(() => { if (live) { setBoard(after); setRise(now) } }, 900)
          else setBoard(after)
          return
        }
        const j = await api.quizBoard(scope, mine.school, mine.group)
        if (live) { setBoard(j); setState('ok') }
      } catch {
        if (live) setState('off')
      }
    })()
    return () => { live = false }
  }, [mine, picking, scope, tick, correct, total])

  if (picking) {
    return <Picker initial={mine} onCancel={mine ? () => setPicking(false) : null}
      onDone={(v) => { saveClass(v); sent.current = false; setRise(null); setBoard(null); setState('loading'); setMine(v); setPicking(false) }} />
  }
  if (state === 'off' && !board) {
    return (
      <div className="card col g10">
        <div className="t-over c-ink2">Xếp hạng</div>
        <div className="t-sub">Chưa tải được bảng thi đua. Bạn kiểm tra mạng rồi thử lại nhé.</div>
        <Btn kind="o" icon="refresh" onClick={() => { setState('loading'); setTick((t) => t + 1) }}>Thử lại</Btn>
      </div>
    )
  }
  const items = board?.items || []
  const me = items.find((x) => x.mine)
  const kind = board?.scope || scope
  const rest = items.slice(3, 6)
  if (me && me.rank > 6) rest.push(me)
  const lead = items[0]?.points || 1
  return (
    <div className="card col g12 lb-card">
      <div className="lb-tabs" role="tablist" aria-label="Phạm vi xếp hạng">
        {SCOPES.map(([k, , short]) => (
          <button key={k} type="button" role="tab" aria-selected={scope === k} className={scope === k ? 'on' : ''}
            onClick={() => { if (scope !== k) { setRise(null); setScope(k) } }}>{short}</button>
        ))}
      </div>
      {!board ? <div className="lb-wait t-sm">Đang tải bảng thi đua…</div> : <>
        <div className="lb-scope-title">{board.title}</div>
        {me && <Hero key={`${kind}-${me.rank}`} me={me} total={items.length} label={MINE[kind]} rise={!!rise} />}
        <Podium items={items.slice(0, 3)} />
        {rest.length > 0 && <Rows items={rest} lead={lead} />}
      </>}
      <div className="row jb ac g12">
        <span className="t-sm">{board?.demo ? 'Điểm là dữ liệu minh họa' : 'Mỗi bạn góp điểm lần làm tốt nhất'}</span>
        <button type="button" className="link-btn" onClick={() => setPicking(true)}>Đổi trường, lớp</button>
      </div>
    </div>
  )
}

const MEDAL = ['gold', 'silver', 'bronze']
// Trên bục chỉ còn chỗ cho tên ngắn: dòng phạm vi phía trên đã nói là trường hay phường.
const shortName = (n) => n.replace(/^THPT\s+/, '').replace(/^Phường\s+/, '')
const Crown = () => (
  <svg className="lb-crown" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" fill="#F5B301" stroke="#B7791F" strokeWidth="1.2" strokeLinejoin="round" /></svg>
)

// Thẻ nổi bật: hạng của lớp (trường, phường) mình, điểm, và còn bao nhiêu điểm để vượt hạng trên.
function Hero({ me, total, label, rise }) {
  const who = label.replace(' bạn', '')
  const Who = who[0].toUpperCase() + who.slice(1)
  const pct = me.next ? Math.max(6, Math.round(100 * me.points / (me.points + me.next.need))) : 100
  const friends = me.next ? Math.ceil(me.next.need / 100) : 0
  return (
    <div className={`lb-hero${rise ? ' rise' : ''}`}>
      <div className="lb-hero-top">
        <div className={`lb-badge ${MEDAL[me.rank - 1] || 'plain'}`}>{me.rank === 1 && <Crown />}<b>#{me.rank}</b></div>
        <div className="col grow g2" style={{ minWidth: 0 }}>
          <div className="lb-hero-over">{Who} bạn · hạng {me.rank}/{total}</div>
          <div className="lb-hero-name">{me.name}</div>
          {rise && <span className="lb-up">▲ Vừa lên hạng {me.rank}</span>}
          <div className="lb-hero-pts"><b>{fmt(me.points)}</b> điểm · {me.players} bạn</div>
        </div>
      </div>
      <div className="lb-prog"><i style={{ width: `${pct}%` }} /></div>
      <div className="lb-hero-goal">
        {me.next
          ? <>Còn <b>{fmt(me.next.need)} điểm</b> để vượt {me.next.name}: {friends === 1 ? 'chỉ cần 1 bạn làm đúng hết 5 câu!' : `khoảng ${friends} bạn làm đúng hết là được!`}</>
          : <>{Who} bạn đang dẫn đầu! Rủ thêm bạn làm bài để giữ ngôi số 1.</>}
      </div>
    </div>
  )
}

// Bục vinh danh top 3: hạng 2 bên trái, hạng 1 ở giữa cao nhất, hạng 3 bên phải.
function Podium({ items }) {
  const order = [items[1], items[0], items[2]].filter(Boolean)
  return (
    <div className="lb-podium">
      {order.map((it) => (
        <div key={it.id} className={`lb-pod r${it.rank}${it.mine ? ' me' : ''}`}>
          <div className={`lb-medal ${MEDAL[it.rank - 1]}`}>{it.rank === 1 && <Crown />}{it.rank}</div>
          <div className="lb-step">
            <div className="lb-pod-name">{shortName(it.name)}</div>
            <div className="lb-pod-pts">{fmt(it.points)}</div>
            {it.mine && <span className="lb-you">Bạn</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Hạng 4 trở đi: thanh điểm so với hạng 1. Các dòng đổi chỗ mượt (FLIP).
function Rows({ items, lead }) {
  const refs = useRef(new Map())
  const tops = useRef(new Map())
  useLayoutEffect(() => {
    const next = new Map()
    refs.current.forEach((el, id) => {
      if (!el) return
      const top = el.getBoundingClientRect().top
      next.set(id, top)
      const old = tops.current.get(id)
      if (old !== undefined && Math.abs(old - top) > 1) {
        el.style.transition = 'none'
        el.style.transform = `translateY(${old - top}px)`
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)'
          el.style.transform = ''
        }))
      }
    })
    tops.current = next
  }, [items])
  return (
    <div className="col g6">
      {items.map((it) => (
        <div key={it.id} ref={(el) => { if (el) refs.current.set(it.id, el); else refs.current.delete(it.id) }} className={`lb-row${it.mine ? ' me' : ''}`}>
          <b className="lb-rank">{it.rank}</b>
          <span className="col grow g4" style={{ minWidth: 0 }}>
            <span className="row jb ac g8"><span className="lb-name">{it.name}</span><b className="lb-pts">{fmt(it.points)}</b></span>
            <span className="lb-bar"><i style={{ width: `${Math.max(4, Math.round(100 * it.points / lead))}%` }} /></span>
          </span>
        </div>
      ))}
    </div>
  )
}

function Picker({ initial, onDone, onCancel }) {
  const [list, setList] = useState(null)
  const [err, setErr] = useState(false)
  const [school, setSchool] = useState(initial?.school || '')
  const [group, setGroup] = useState(initial?.group || '')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setErr(false)
    api.quizSchools().then((j) => live && setList(j), () => live && setErr(true))
    return () => { live = false }
  }, [tick])
  const picked = list?.schools.find((s) => s.id === school)
  const wards = list ? [...new Set(list.schools.map((s) => s.ward))] : []
  return (
    <div className="card col g10">
      <div className="t-over c-ink2">Thi đua cùng lớp</div>
      <div className="t-row">Cộng điểm cho lớp của bạn</div>
      <div className="t-sm">Chọn trường và lớp một lần. Bảng chỉ hiện điểm của cả lớp, không hiện tên ai.</div>
      {err ? <Btn kind="o" icon="refresh" onClick={() => setTick((t) => t + 1)}>Chưa tải được danh sách trường, thử lại</Btn> : <>
        <select className="field lb-select" value={school} disabled={!list} aria-label="Trường"
          onChange={(e) => { setSchool(e.target.value); setGroup('') }}>
          <option value="" disabled>{list ? 'Chọn trường' : 'Đang tải danh sách trường…'}</option>
          {wards.map((w) => (
            <optgroup key={w} label={`Phường ${w}`}>
              {list.schools.filter((s) => s.ward === w).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
        <select className="field lb-select" value={group} disabled={!picked} aria-label="Lớp" onChange={(e) => setGroup(e.target.value)}>
          <option value="" disabled>Chọn lớp</option>
          {picked?.groups.map((g) => <option key={g} value={g}>Lớp {g}</option>)}
        </select>
        {list?.demo && <div className="t-sm">Tên trường theo danh sách của Sở GD&amp;ĐT Đồng Nai; điểm trên bảng hiện là dữ liệu minh họa.</div>}
        <Btn icon="award" disabled={!school || !group} onClick={() => onDone({ school, group })}>Vào bảng thi đua</Btn>
        {onCancel && <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={onCancel}>Để sau</button>}
      </>}
    </div>
  )
}

// Trang xem bảng thi đua (mở từ màn Bài học): chỉ xem, không nộp điểm.
export function LeaderboardPage() {
  const nav = useNavigate()
  return (
    <Screen name="A12d-bang-thi-dua" bar={<Bar title="Bảng thi đua" />}>
      <Leaderboard />
      <Btn icon="award" onClick={() => nav('/kiem-tra-bai')}>Làm bài kiểm tra để góp điểm</Btn>
    </Screen>
  )
}

// Thẻ thi đua trên trang chủ học sinh: hạng hiện tại của lớp mình, chạm để mở bảng.
export function RankCard() {
  const nav = useNavigate()
  const [mine] = useState(readClass)
  const [me, setMe] = useState(null)
  useEffect(() => {
    if (!mine) return undefined
    let live = true
    api.quizBoard('group', mine.school, mine.group).then((j) => { if (live) setMe(j.items.find((x) => x.mine) || null) }, () => {})
    return () => { live = false }
  }, [mine])
  return (
    <button type="button" className="lb-home tap" onClick={() => nav('/thi-dua')}>
      <div className={`lb-badge ${me ? MEDAL[me.rank - 1] || 'plain' : 'plain'}`}>{me?.rank === 1 && <Crown />}{me ? <b>#{me.rank}</b> : <I n="award" z={28} />}</div>
      <div className="col grow g2" style={{ minWidth: 0 }}>
        <div className="lb-hero-over">Bảng thi đua · lớp, trường, phường</div>
        <div className="lb-home-title">{me ? `${me.name} đang hạng ${me.rank}` : 'Lớp bạn đứng hạng mấy?'}</div>
        <div className="lb-home-sub">{me ? (me.next ? `Còn ${fmt(me.next.need)} điểm để vượt ${me.next.name}` : `${fmt(me.points)} điểm · đang dẫn đầu trường`) : 'Chọn lớp, làm bài, cộng điểm cho lớp'}</div>
      </div>
      <I n="next" z={24} />
    </button>
  )
}
