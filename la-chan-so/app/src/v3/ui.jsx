// Thành phần dùng chung của giao diện V3: khung màn, thanh tiêu đề, dòng, nút, thanh điều hướng, Bé Nai.
import { useNavigate } from 'react-router-dom'
import I from './icons.jsx'
import { hhmm } from '../lib/format.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'
import chao from './art/chao.webp'
import mung from './art/mung.webp'
import dung from './art/dung.webp'
import nghi from './art/nghi.webp'
import anToan from './art/an-toan.webp'
import giaDinh from './art/gia-dinh.webp'

export { I }
const ART = { chao, mung, dung, nghi, 'an-toan': anToan, 'gia-dinh': giaDinh }
export const APP = 'Lá chắn số'

// ---------- Khung màn ----------
export function Screen({ name, tone, nav, bar, foot, children, gap, pad, scrollRef, className = '' }) {
  const dark = tone === 'night' || tone === 'red'
  return (
    <div className="shell">
      <div className={['phone', tone ? `t-${tone}` : '', nav ? 'has-nav' : '', className].filter(Boolean).join(' ')} data-name={name}>
        <div className="sbar" style={{ color: dark ? '#fff' : 'var(--ink)' }}>
          <span>{hhmm()}</span>
          <span className="notch" />
          <span className="sb-ic"><I n="wifi" z={17} sw={2.4} /><I n="battery" z={22} /></span>
        </div>
        {bar}
        <div className="scroll" ref={scrollRef}>
          <div className="body screen-in" style={{ ...(gap != null ? { gap } : {}), ...(pad ? { padding: pad } : {}) }}>{children}</div>
        </div>
        {foot && <div className="foot">{foot}</div>}
        {nav && <Nav active={nav} />}
      </div>
    </div>
  )
}

export function Bar({ title, left = 'back', right, onLeft, dark = false }) {
  const nav = useNavigate()
  const go = onLeft || (() => (window.history.length > 1 ? nav(-1) : nav('/', { replace: true })))
  return (
    <div className="bar">
      {left ? <button type="button" className={`ib${dark ? ' on-dark' : ''}`} aria-label={left === 'x' ? 'Đóng' : 'Quay lại'} onClick={go}><I n={left} /></button> : <span className="ib ghost" />}
      <div className="title">{title}</div>
      {right || <span className="ib ghost" />}
    </div>
  )
}

// Nút loa: đọc to nội dung màn (người cao tuổi)
export function Speak({ text, dark }) {
  return <button type="button" className={`ib${dark ? ' on-dark' : ''}`} aria-label="Đọc to" onClick={() => native.speak(text)}><I n="vol" /></button>
}

// ---------- Logo: khiên của đội (không dùng biểu trưng cơ quan nào) ----------
export function Logo({ z = 30 }) {
  return (
    <svg width={z} height={z} viewBox="0 0 40 40" aria-hidden="true" style={{ flex: 'none' }}>
      <rect width="40" height="40" rx="12" fill="#344D9C" />
      <path d="M20 31.5s9-4.5 9-11.25V12.4L20 9l-9 3.4v7.85C11 27 20 31.5 20 31.5z" fill="#fff" />
      <path d="m15.8 20.2 3 3 5.6-5.8" fill="none" stroke="#FFCE02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AppPill() {
  return <div className="pill" style={{ paddingLeft: 9, gap: 9 }}><Logo z={30} /><span style={{ fontSize: 18, fontWeight: 700 }}>{APP}</span></div>
}

export function Art({ name, z = 160, className = '', style }) {
  return <div className={`art ${className}`} style={{ width: z, height: z, ...style }}><img src={ART[name]} alt="Bé Nai" width={z} height={z} /></div>
}

// ---------- Dòng, nhóm, nhãn ----------
export function Group({ children, style }) { return <div className="group" style={style}>{children}</div> }

export function Row({ icon, iconColor = 'ink', lead, title, sub, value, right, onClick, chev = true, tall = false }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className={`li${tall ? ' tall' : ''}`} onClick={onClick}>
      {lead || (icon && <I n={icon} z={26} c={iconColor} />)}
      <div className="col grow g2">
        <div className="t-row">{title}</div>
        {sub && <div className="t-sub">{sub}</div>}
      </div>
      {value && <div className="t-sub none" style={{ fontSize: 17 }}>{value}</div>}
      {right}
      {onClick && chev && <I n="next" z={22} className="chev" />}
    </Tag>
  )
}

export function Circle({ z = 52, bg = 'pri-t', icon, iz = 26, c = 'pri', children, style }) {
  return <div className="circ" style={{ width: z, height: z, background: `var(--${bg})`, color: `var(--${c})`, ...style }}>{icon ? <I n={icon} z={iz} /> : children}</div>
}

export function Tag({ kind = 'ok', icon, children }) {
  return <span className={`tag ${kind}`}>{icon && <I n={icon} z={16} sw={2.4} />}{children}</span>
}

export function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`sw${on ? ' on' : ''}`} onClick={() => onChange(!on)}><i /></button>
}

export function Btn({ kind = 'p', icon, children, onClick, disabled, busy, style, type = 'button' }) {
  return (
    <button type={type} className={`btn ${kind}`} onClick={onClick} disabled={disabled || busy} style={style}>
      {busy ? <I n="refresh" className="spin" /> : icon && <I n={icon} />}{children}
    </button>
  )
}

export function StateView({ art, icon, iconBg = 'pri-t', iconColor = 'pri', title, text, small, children }) {
  return (
    <div className="col ac jc g12 center grow" style={{ padding: '0 10px' }}>
      {art ? <Art name={art} z={180} className="pop" /> : icon && <Circle z={112} bg={iconBg} c={iconColor} icon={icon} iz={52} style={{ animation: 'pop .45s var(--ease) both' }} />}
      <div className="h-l rise">{title}</div>
      {text && <div className="t-body c-ink2 rise" style={{ animationDelay: '.05s' }}>{text}</div>}
      {small && <div className="t-sub">{small}</div>}
      {children}
    </div>
  )
}

// ---------- Đầu trang, ô tìm, thẻ nổi bật ----------
export function TopRow({ right }) {
  return <div className="row jb"><AppPill />{right}</div>
}

export function Search({ placeholder, onClick }) {
  return (
    <button type="button" className="search tap" onClick={onClick}>
      <I n="search" />
      <span className="grow" style={{ textAlign: 'left' }}>{placeholder}</span>
      <Circle z={46} bg="pri" c="w" icon="next" iz={24} />
    </button>
  )
}

export function Banner({ bg = 'pri', title, btn, icon, art, onClick }) {
  return (
    <button type="button" className="banner tap" style={{ background: `var(--${bg})` }} onClick={onClick}>
      <div className="col g12 grow">
        <div style={{ fontSize: 22, lineHeight: '27px', fontWeight: 700 }}>{title}</div>
        <span className="bb" style={{ color: `var(--${bg})` }}>{btn}</span>
      </div>
      {art ? <Art name={art} z={92} /> : <div className="circ" style={{ width: 84, height: 84, background: 'rgba(255,255,255,.16)' }}><I n={icon} z={42} c="w" /></div>}
    </button>
  )
}

// ---------- Thanh điều hướng theo đối tượng ----------
const NAVS = {
  elder: [['shieldok', 'Kiểm tra', '/'], ['users', 'Người thân', '/nguoi-than'], ['book', 'Bài học', '/bai-hoc'], ['user', 'Cá nhân', '/ca-nhan']],
  student: [['shieldok', 'Kiểm tra', '/'], ['users', 'Người thân', '/nguoi-than'], ['book', 'Bài học', '/bai-hoc'], ['user', 'Cá nhân', '/ca-nhan']],
  volunteer: [['chart', 'Thống kê', '/'], ['check', 'Duyệt', '/duyet'], ['book', 'Bài học', '/bai-hoc'], ['user', 'Cá nhân', '/ca-nhan']],
}

export function Nav({ active }) {
  const nav = useNavigate()
  const { persona } = useApp()
  return (
    <nav className="nav" aria-label="Điều hướng chính">
      {NAVS[persona].map(([icon, label, to]) => (
        <button key={to} type="button" className={active === to ? 'on' : ''} aria-current={active === to ? 'page' : undefined}
          onClick={() => active !== to && nav(to)}>
          <I n={icon} />{label}
        </button>
      ))}
    </nav>
  )
}

// ---------- Bàn phím số và chọn loại ----------
export function Keypad({ onKey }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="keys">
      {keys.map((k, i) => k === '' ? <span key={i} /> : (
        <button key={i} type="button" className="key" aria-label={k === 'del' ? 'Xóa' : k} onClick={() => onKey(k)}>
          {k === 'del' ? <I n="del" z={28} /> : k}
        </button>
      ))}
    </div>
  )
}

export function Seg({ items, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {items.map((it) => (
        <button key={it.key} type="button" role="tab" aria-selected={value === it.key} className={value === it.key ? 'on' : ''} onClick={() => onChange(it.key)}>
          <I n={it.icon} z={22} />{it.label}
        </button>
      ))}
    </div>
  )
}

export function Progress({ total, at }) {
  return <div className="progress">{Array.from({ length: total }, (_, i) => <i key={i} className={i < at ? 'on' : ''} />)}</div>
}

// "09xx xxx 123": che bớt số cho người thân, tình nguyện viên
export function maskPhone(s) {
  const d = String(s || '').replace(/\D/g, '')
  if (d.length < 8) return s || ''
  return `${d.slice(0, 2)}xx xxx ${d.slice(-3)}`
}

export function fmtPhone(s) {
  const d = String(s || '').replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`
  if (d.length === 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return d.replace(/(\d{3})(?=\d)/g, '$1 ')
}
