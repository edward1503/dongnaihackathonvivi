// U3: A05b Phân tích tin nhắn, tô đỏ từng dấu hiệu
import { Fragment } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { hhmm, LEVEL } from '../lib/format.js'
import { openLearn } from '../lib/links.js'
import { useApp } from '../lib/state.jsx'

const LINK_RE = /(bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|s\.id|rb\.gy)\/\S+|[\w-]+(\.[\w-]+)*\.(top|xyz|click|info|icu|cyou|com|vn|net)\b\S*/i
const isLink = (q) => LINK_RE.test(q) && !/\s/.test(q.trim())

// Gộp mọi đoạn trích (có thể chồng nhau) thành các khoảng tô màu không chồng nhau
export function highlight(text, quotes) {
  const ranges = []
  for (const q of quotes) {
    if (!q) continue
    let from = 0
    for (;;) {
      const at = text.indexOf(q, from)
      if (at < 0) break
      ranges.push([at, at + q.length, isLink(q)])
      from = at + q.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) { last[1] = Math.max(last[1], r[1]); last[2] = last[2] && r[2] }
    else merged.push([...r])
  }
  const out = []
  let pos = 0
  merged.forEach(([s, e, link], i) => {
    if (s > pos) out.push(<Fragment key={`t${i}`}>{text.slice(pos, s)}</Fragment>)
    out.push(<span key={`h${i}`} className={link ? 'hl warn' : 'hl'}>{text.slice(s, e)}</span>)
    pos = e
  })
  if (pos < text.length) out.push(<Fragment key="end">{text.slice(pos)}</Fragment>)
  return out
}

// Đối tượng để báo cho cộng đồng: đường dẫn trong tin nếu có, không thì chính tin nhắn
export function reportTarget(result) {
  const quotes = result.signs.flatMap((s) => s.quotes)
  const link = quotes.find(isLink) || (result.maskedText || '').match(LINK_RE)?.[0]
  if (link) return { kind: 'link', target: link, noun: 'đường dẫn này' }
  return { kind: 'message', target: (result.maskedText || '').slice(0, 120), noun: 'tin này' }
}

const BANNER = {
  danger: { card: 'card danger', box: 'icon-box solid-danger', ink: 'c-danger-ink' },
  suspicious: { card: 'card warn', box: 'icon-box', boxStyle: { background: 'var(--warn)', color: '#fff' }, ink: 'c-warn-ink' },
}

export default function MessageResult() {
  const nav = useNavigate()
  const { result, setReport, toast, mode } = useApp()
  if (!result || result.kind !== 'message') return <Navigate to="/kiem-tra/tin-nhan" replace />

  const b = BANNER[result.level] || BANNER.suspicious
  const lv = LEVEL[result.level] || LEVEL.suspicious
  const quotes = result.signs.flatMap((s) => s.quotes)
  const target = reportTarget(result)
  const fromNotification = result.from === 'notification'

  const toCommunity = () => {
    setReport({ draft: { kind: target.kind, target: target.target, story: result.scamLabel, fromResult: result } })
    nav('/bao-cao/cong-dong')
  }

  return (
    <Phone name="A05b-phan-tich-tin-nhan">
      <AppBar title="Phân tích tin nhắn" />
      <div className="content" style={{ paddingTop: 0, gap: 12 }}>
        <div className="row gap-6 wrap">
          <span className="chip outline"><Icon name="message" size={14} />{fromNotification ? 'Ứng dụng nhắn tin' : 'Tin nhắn dán vào'}</span>
          {fromNotification && <span className="chip outline">Người lạ</span>}
          <span className="chip outline"><Icon name="clock" size={14} />{hhmm()}</span>
        </div>

        <div className="bubble in" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>{highlight(result.maskedText || '', quotes)}</div>

        <div className={`${b.card} row gap-12`}>
          <div className={b.box} style={b.boxStyle}><Icon name={lv.icon} size={20} /></div>
          <div className="col grow">
            <div className={`t-h2 ${b.ink}`}>{lv.label}</div>
            <div className={`t-label ${b.ink}`}>{result.scamLabel}</div>
          </div>
        </div>

        <div className="card soft row gap-12" style={{ padding: '12px 16px', borderColor: 'var(--outline-2)' }}>
          <Icon name="hand" className="c-danger" />
          <div className="t-label bold grow">{result.headline}</div>
        </div>

        {result.signs.length > 0 && (
          <div className="card ai col gap-8">
            <div className="ai-tag"><Icon name="sparkles" size={14} />AI giải thích</div>
            {result.signs.map((s) => (
              <div className="row top gap-10" key={s.text}><span className="dot ai" style={{ marginTop: 6 }} /><div className="t-label c-ai-ink grow">{s.text}</div></div>
            ))}
          </div>
        )}

        <div className="card brand col gap-12">
          <div className="col gap-2">
            <div className="t-label bold c-brand-ink">Báo {target.noun} cho cộng đồng?</div>
            <div className="t-cap c-brand-ink">{mode === 'full' ? 'Giúp cảnh báo các bạn khác trong trường.' : 'Giúp cảnh báo mọi người trong khu phố.'}</div>
          </div>
          <div className="row gap-8">
            <button type="button" className="btn sm primary" style={{ flex: 1 }} onClick={toCommunity}>Báo cho cộng đồng</button>
            <button type="button" className="btn sm outline" onClick={() => { toast('Đã bỏ qua'); nav('/') }}>Không</button>
          </div>
        </div>

        {result.scamType && (
          <button type="button" className="btn ghost" style={{ height: 44 }} onClick={() => openLearn(result.scamType, toast)}>
            <Icon name="book" size={20} />Xem truyện 1 phút về chiêu này
          </button>
        )}
      </div>
    </Phone>
  )
}
