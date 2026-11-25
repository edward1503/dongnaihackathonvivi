// U2: A06a Kiểm tra nhanh (số, đường dẫn, tài khoản) · U3: A06b Kiểm tra tin nhắn
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { BottomNav, Phone, AppBar } from '../ui/Phone.jsx'
import { KIND, LEVEL, recentLabel, whenLabel } from '../lib/format.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'
import { useRunCheck } from '../lib/useCheck.js'
import '../ui/result.css'

const TABS = ['phone', 'link', 'account', 'message']
const PLACEHOLDER = { phone: 'Nhập số điện thoại', link: 'Dán đường dẫn', account: 'Nhập số tài khoản' }
const SAMPLE_MESSAGE = 'Tài khoản ngân hàng của quý khách sẽ bị khóa trong 24h. Xác minh ngay tại ngan-hang-xacminh.top để tránh gián đoạn.'
// Mẫu nhanh khi trình diễn (?demo=1), giống hàng "Thử nhanh" của bản mẫu
const DEMO = [['phone', '0912 345 678'], ['link', 'qua-tri-an-khach-hang.top'], ['phone', '1900 5555 88'], ['phone', '0987 654 321']]

function Seg({ kind, onPick }) {
  return (
    <div className="seg" role="tablist">
      {TABS.map((k) => (
        <button key={k} type="button" role="tab" aria-selected={k === kind} className={`seg-item${k === kind ? ' active' : ''}`} onClick={() => onPick(k)}>
          {KIND[k].tab}
        </button>
      ))}
    </div>
  )
}

async function readClipboard() {
  try { return (await navigator.clipboard.readText()).trim() } catch { return '' }
}

export function CheckNumber() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { recent, toast } = useApp()
  const [kind, setKind] = useState(TABS.includes(params.get('loai')) ? params.get('loai') : 'phone')
  const [value, setValue] = useState(params.get('v') || '')
  const [run, busy] = useRunCheck()
  const demo = new URLSearchParams(location.search).get('demo') === '1'

  const pick = (k) => (k === 'message' ? nav('/kiem-tra/tin-nhan') : setKind(k))

  const paste = async () => {
    const t = await readClipboard()
    if (t) setValue(t)
    else toast('Chưa có gì để dán. Bạn chép số hoặc đường dẫn trước nhé')
  }
  const listen = async () => {
    const heard = await native.listen()
    if (heard) setValue(heard)
    else toast('Máy này chưa nghe được giọng nói. Bạn gõ số nhé')
  }
  const fromCallLog = async () => {
    const calls = await native.recentCalls()
    if (calls[0]) {
      setKind('phone')
      setValue(calls[0].phone)
      toast('Lấy số vừa gọi đến')
    }
  }

  return (
    <Phone name="A06a-kiem-tra-so" gesture="solid">
      <AppBar title="Kiểm tra nhanh" back={false} />
      <div className="content" style={{ paddingTop: 4 }}>
        <Seg kind={kind} onPick={pick} />

        <form className="input focus" onSubmit={(e) => { e.preventDefault(); run(value, kind) }}>
          <Icon name={KIND[kind].icon} size={20} className="muted" />
          <input
            className="field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={PLACEHOLDER[kind]}
            inputMode={kind === 'link' ? 'url' : 'tel'}
            autoComplete="off"
            aria-label={PLACEHOLDER[kind]}
          />
          {value && (
            <button type="button" className="tap faint" aria-label="Xóa" onClick={() => setValue('')}><Icon name="x-circle" size={20} /></button>
          )}
        </form>

        <div className="row gap-8 wrap">
          <button type="button" className="chip outline tap chip-40" onClick={paste}><Icon name="clipboard" size={16} />Dán</button>
          <button type="button" className="chip outline tap chip-40" onClick={listen}><Icon name="mic" size={16} />Nói</button>
          <button type="button" className="chip outline tap chip-40" onClick={fromCallLog}><Icon name="history" size={16} />Từ nhật ký gọi</button>
        </div>

        {demo && (
          <div className="row gap-6 wrap">
            {DEMO.map(([k, v]) => (
              <button key={v} type="button" className="chip brand tap" onClick={() => { setKind(k); setValue(v) }}>{v}</button>
            ))}
          </div>
        )}

        <button type="button" className="btn primary block" disabled={busy} onClick={() => run(value, kind)}>
          <Icon name={busy ? 'refresh' : 'search'} size={20} className={busy ? 'spin' : ''} />{busy ? 'Đang kiểm tra…' : 'Kiểm tra'}
        </button>

        {recent.length > 0 && (
          <div className="col gap-8 mt-8">
            <div className="t-label bold">Vừa kiểm tra</div>
            <div className="card" style={{ padding: '4px 16px' }}>
              {recent.slice(0, 3).map((item, i, arr) => {
                const lv = LEVEL[item.level] || LEVEL.unknown
                return (
                  <button type="button" key={item.display} className={`list-item tap w-full${i === arr.length - 1 ? ' last' : ''}`} onClick={() => run(item.value, item.kind)}>
                    <div className={`icon-box ${lv.box}`}><Icon name={KIND[item.kind]?.icon || 'phone'} size={20} /></div>
                    <div className="col grow gap-4">
                      <div className="t-label semi" style={{ overflowWrap: 'anywhere' }}>{recentLabel(item)}</div>
                      <div className="row between">
                        <div className="t-cap muted">{whenLabel(item.at)}</div>
                        <span className={`chip ${lv.chip}`}><Icon name={lv.icon} size={14} />{lv.label}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <BottomNav active="check" />
    </Phone>
  )
}

export function CheckMessage() {
  const nav = useNavigate()
  const { toast } = useApp()
  const { state } = useLocation()
  const [text, setText] = useState(state?.text || '')
  const [run, busy] = useRunCheck()

  const pick = (k) => (k === 'message' ? null : nav(`/kiem-tra?loai=${k}`))
  const paste = async () => {
    const t = await readClipboard()
    setText(t || SAMPLE_MESSAGE)
    if (!t) toast('Đã dán tin mẫu để thử')
  }

  return (
    <Phone name="A06b-kiem-tra-tin-nhan" gesture="solid">
      <AppBar title="Kiểm tra nhanh" back={false} />
      <div className="content" style={{ paddingTop: 4 }}>
        <Seg kind="message" onPick={pick} />

        <div className="input area focus" style={{ height: 150 }}>
          <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán tin nhắn đáng ngờ vào đây" aria-label="Tin nhắn cần kiểm tra" />
        </div>

        <div className="row gap-8">
          <button type="button" className="chip outline tap chip-40" onClick={paste}><Icon name="clipboard" size={16} />Dán</button>
          <button type="button" className="chip outline tap chip-40" onClick={() => toast('Đọc chữ trong ảnh chụp màn hình: giai đoạn sau')}><Icon name="image" size={16} />Chọn ảnh chụp màn hình</button>
        </div>

        <div className="card ai col gap-4" style={{ padding: '12px 14px' }}>
          <div className="ai-tag"><Icon name="sparkles" size={14} />AI sẽ phân tích nội dung</div>
          <div className="t-cap c-ai-ink">Tô đỏ từng dấu hiệu và giải thích bằng lời dễ hiểu.</div>
        </div>

        <div className="col gap-12">
          <div className="row top gap-8">
            <Icon name="lock" size={14} className="muted" style={{ marginTop: 1 }} />
            <div className="t-cap muted grow">Số tài khoản và số điện thoại được che trước khi gửi phân tích.</div>
          </div>
          <button type="button" className="btn primary block" disabled={busy} onClick={() => run(text, 'message')}>
            {busy && <Icon name="refresh" size={20} className="spin" />}{busy ? 'Đang phân tích…' : 'Phân tích tin nhắn'}
          </button>
        </div>
      </div>
      <BottomNav active="check" />
    </Phone>
  )
}
