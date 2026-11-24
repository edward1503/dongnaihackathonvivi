// Khung màn hình dùng chung: thanh trạng thái (chỉ hiện khi xem trên máy tính), thanh tiêu đề, thanh điều hướng.
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { hhmm } from '../lib/format.js'
import { useApp } from '../lib/state.jsx'
import { openLearn, openProfile } from '../lib/links.js'

export function Phone({ name, lg = false, className = '', dark = false, gesture = 'clear', children }) {
  return (
    <div className="app-shell">
      <div className={['frame', 'phone', lg ? 'lg' : '', className].filter(Boolean).join(' ')} data-name={name}>
        <div className={`statusbar${dark ? ' on-dark' : ''}`}>
          <span>{hhmm()}</span>
          <span className="sb-icons"><Icon name="signal" size={14} /><Icon name="wifi" size={14} /><Icon name="battery" size={16} /></span>
        </div>
        {children}
        <div className={['gesture', gesture === 'clear' ? 'clear' : '', dark ? 'on-dark' : ''].filter(Boolean).join(' ')}><div className="pill" /></div>
      </div>
    </div>
  )
}

export function AppBar({ title, back = true, onBack, children }) {
  const nav = useNavigate()
  return (
    <div className="appbar">
      {back && (
        <button type="button" className="tap" aria-label="Quay lại" onClick={onBack || (() => nav(-1))}>
          <Icon name="arrow-left" />
        </button>
      )}
      <div className="title">{title}</div>
      {children}
    </div>
  )
}

const NAV = [
  { key: 'home', label: 'Lá chắn', icon: 'shield', to: '/' },
  { key: 'check', label: 'Kiểm tra', icon: 'search', to: '/kiem-tra' },
  { key: 'learn', label: 'Học', icon: 'book' },
  { key: 'me', label: 'Tôi', icon: 'user' },
]

export function BottomNav({ active }) {
  const nav = useNavigate()
  const { toast } = useApp()
  const go = (item) => {
    if (item.to) nav(item.to)
    else if (item.key === 'learn') openLearn(null, toast)
    else openProfile(toast)
  }
  return (
    <nav className="bottomnav">
      {NAV.map((item) => (
        <button key={item.key} type="button" className={`nav-item${active === item.key ? ' active' : ''}`} onClick={() => go(item)}>
          <Icon name={item.icon} />{item.label}
        </button>
      ))}
    </nav>
  )
}
