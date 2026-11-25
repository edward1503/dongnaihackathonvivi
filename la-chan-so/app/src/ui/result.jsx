// Các khối của màn kết quả (A07a–d), dùng lại ở màn mất mạng (E01c).
import { useState } from 'react'
import Icon from './Icon.jsx'
import { KIND, LEVEL, SELF_CHECKS } from '../lib/format.js'

export function ObjectCard({ result }) {
  const k = KIND[result.kind] || KIND.phone
  return (
    <div className="card obj row gap-12">
      <div className="icon-box"><Icon name={k.icon} size={20} /></div>
      <div className="col grow">
        <div className="t-body semi" style={{ overflowWrap: 'anywhere' }}>{result.display}</div>
        <div className="t-cap muted">{k.label}</div>
      </div>
    </div>
  )
}

const BANNER = {
  danger: { card: 'card danger', box: 'icon-box lgx solid-danger', ink: 'c-danger-ink', over: 'c-danger-ink' },
  suspicious: { card: 'card warn', box: 'icon-box lgx', boxStyle: { background: 'var(--warn)', color: '#fff' }, ink: 'c-warn-ink', over: 'c-warn-ink' },
  safe: { card: 'card safe', box: 'icon-box lgx solid-safe', ink: 'c-safe-ink', over: 'c-safe-ink' },
  unknown: { card: 'card soft', cardStyle: { borderColor: 'var(--outline)' }, box: 'icon-box lgx', boxStyle: { background: 'var(--ink-2)', color: '#fff' }, ink: 'c-ink', over: 'muted' },
}

export function LevelBanner({ result }) {
  const b = BANNER[result.level] || BANNER.unknown
  const lv = LEVEL[result.level] || LEVEL.unknown
  return (
    <div className={`${b.card} r24 p-20 col gap-12`} style={b.cardStyle}>
      <div className="row gap-12">
        <div className={b.box} style={b.boxStyle}><Icon name={lv.icon} size={32} /></div>
        <div className="col grow">
          <div className={`t-over ${b.over}`}>Kết quả</div>
          <div className={`t-display ${b.ink} level`}>{lv.label}</div>
        </div>
      </div>
      <div className="t-body c-ink sum">
        <div>{result.headline}</div>
        {result.note && <div className={result.level === 'unknown' ? 'semi' : ''}>{result.note}</div>}
      </div>
    </div>
  )
}

const WHY_ICONS = {
  danger: ['users', 'message-alert', 'shield-check'],
  safe: ['shield-check', 'users'],
}

function whyIcon(level, text, i) {
  if (level === 'suspicious') {
    if (/mới đăng ký/.test(text)) return 'clock'
    if (/gần giống/.test(text)) return 'eye'
    return 'link'
  }
  return (WHY_ICONS[level] || [])[i] || 'info'
}

export function WhyCard({ result }) {
  if (!result.why?.length) return null
  const color = result.level === 'danger' ? 'c-danger' : result.level === 'suspicious' ? 'c-warn' : 'c-safe'
  return (
    <div className="card sec">
      <div className="t-label bold">Vì sao?</div>
      {result.why.map((w, i) => (
        <div className="why" key={w}><Icon name={whyIcon(result.level, w, i)} size={18} className={color} /><div className="t-label">{w}</div></div>
      ))}
    </div>
  )
}

export function TodoCard({ result, onStory }) {
  if (result.level === 'safe') {
    return (
      <div className="card soft sec">
        {result.todo.map((t) => (
          <div className="why" key={t}><Icon name="info" size={18} className="muted" /><div className="t-label">{t}</div></div>
        ))}
      </div>
    )
  }
  if (!result.todo?.length) return null
  return (
    <div className="card soft sec">
      <div className="t-label bold">Bạn nên làm gì</div>
      {result.todo.map((t, i) => (
        <div className="todo" key={t}><div className="num">{i + 1}</div><div className="t-label">{t}</div></div>
      ))}
      {result.level === 'danger' && result.scamType && onStory && (
        <button type="button" className="row gap-6 c-brand story-link tap" onClick={onStory}>
          <Icon name="book" size={16} /><div className="t-cap bold">Xem truyện 1 phút về chiêu này</div>
        </button>
      )}
    </div>
  )
}

export function SelfCheckCard({ title = 'Tự kiểm tra trước khi chuyển tiền', onAllChecked }) {
  const [done, setDone] = useState([])
  const toggle = (i) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i]
    setDone(next)
    if (next.length === SELF_CHECKS.length) onAllChecked?.()
  }
  return (
    <div className="card sec" style={{ gap: 4 }}>
      <div className="t-label bold" style={{ marginBottom: 4 }}>{title}</div>
      {SELF_CHECKS.map((t, i) => (
        <button type="button" className="tick-row tap" key={t} onClick={() => toggle(i)} aria-pressed={done.includes(i)}>
          <div className="tick" style={done.includes(i) ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
            {done.includes(i) && <Icon name="check" size={16} weight={3} />}
          </div>
          <div className="t-label grow">{t}</div>
        </button>
      ))}
    </div>
  )
}
