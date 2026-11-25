// N6 phía giao diện: A02a Thiết lập lá chắn (đang làm) · A02b Lá chắn đã sẵn sàng
// Mở từ tab "Tôi". Nút "Bật" gọi Android mở đúng màn xin quyền (LCSNative.enableLayer); trình duyệt thì bật ngay để trình diễn.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { LAYERS, useLayers } from '../lib/layers.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'

const css = `
.layer-btn{height:56px !important;font-size:17px !important;line-height:24px !important;padding:0 18px !important;flex:none}
.switch{width:52px;height:32px;border-radius:16px;padding:4px;display:flex;align-items:center;flex:none;transition:background .15s}
.switch > i{width:24px;height:24px;border-radius:12px;background:#fff;display:block}
`

export default function Setup() {
  const { on } = useLayers()
  return on === LAYERS.length ? <SetupDone /> : <SetupSteps />
}

function SetupSteps() {
  const nav = useNavigate()
  const { toast } = useApp()
  const { state, on, enable } = useLayers()
  const next = LAYERS.find((l) => !state[l.key])?.key

  const say = () => native.speak(`Bật ba lớp bảo vệ. Mỗi lớp chỉ cần bật một lần. Bà đã bật ${on} trên 3 lớp.`)
  const askHelp = async () => {
    const text = 'Con ơi, con cài giúp mẹ Lá chắn số trên máy mẹ nhé: ' + location.origin + location.pathname
    try {
      if (navigator.share) { await navigator.share({ title: 'Lá chắn số', text }); return }
      await navigator.clipboard.writeText(text)
      toast('Đã chép lời nhờ. Bà dán vào Zalo gửi cho con nhé')
    } catch { /* bà bấm hủy */ }
  }

  return (
    <Phone name="A02a-thiet-lap-dang-lam" lg>
      <style>{css}</style>
      <AppBar title={<span style={{ fontSize: 20, lineHeight: '26px' }}>Thiết lập lá chắn</span>} onBack={() => nav('/', { replace: true })}>
        <button type="button" className="tap c-brand" aria-label="Đọc to" onClick={say}><Icon name="volume" /></button>
      </AppBar>

      <div className="content" style={{ paddingTop: 4, gap: 10 }}>
        <div className="row gap-12">
          <div className="icon-box lgx brand"><Icon name="shield" size={32} /></div>
          <div className="col grow">
            <div className="t-h1">Bật 3 lớp bảo vệ</div>
            <div className="t-label muted">Mỗi lớp chỉ cần bật một lần.</div>
          </div>
        </div>

        <div className="row gap-12">
          <div className="steps" style={{ flex: 1 }}>{LAYERS.map((l) => <div key={l.key} className={`step${state[l.key] ? ' on' : ''}`} />)}</div>
          <div className="t-cap bold c-brand none">Đã bật {on}/3</div>
        </div>

        {LAYERS.map((l) => {
          const isOn = state[l.key]
          const isNext = l.key === next
          return (
            <div key={l.key} className={`card ${isOn ? 'safe' : isNext ? '' : 'soft'} col gap-6`}
              style={{ padding: '12px 14px', ...(isNext ? { border: '1.5px solid var(--brand)' } : !isOn ? { borderColor: 'var(--outline-2)' } : {}) }}>
              <div className="row gap-12">
                <div className={`icon-box ${isOn ? 'solid-safe' : isNext ? 'brand' : ''}`} style={!isOn && !isNext ? { background: '#fff' } : undefined}><Icon name={l.icon} size={20} /></div>
                <div className="t-h2 grow">{l.key === 'banking' ? <>Nhắc trước khi<br />chuyển tiền</> : l.title}</div>
              </div>
              <div className="row gap-12">
                <div className={`t-cap grow ${isOn ? 'c-safe-ink' : 'muted'}`}>{l.sub}</div>
                {isOn ? (
                  <span className="chip safe" style={{ background: '#fff', height: 32, borderRadius: 16, fontSize: 14, lineHeight: '20px' }}><Icon name="check" size={16} />Đã bật</span>
                ) : (
                  <button type="button" className={`btn ${isNext ? 'primary' : 'outline'} sm layer-btn`} onClick={() => enable(l.key)}>Bật</button>
                )}
              </div>
            </div>
          )
        })}

        <button type="button" className="btn outline block mt-auto" onClick={askHelp}><Icon name="users" />Nhờ người thân cài hộ</button>
        <div className="row top gap-8">
          <Icon name="lock" size={16} className="muted" style={{ marginTop: 2 }} />
          <div className="t-cap muted grow">Lá chắn không lưu nội dung cuộc gọi, tin nhắn. Bản ghi chỉ được gửi đi khi bà chọn báo cáo.</div>
        </div>
      </div>
    </Phone>
  )
}

function SetupDone() {
  const nav = useNavigate()
  const { relatives } = useApp()
  const first = relatives.find((r) => r.paired)
  const [voice, setVoice] = useState(() => localStorage.getItem('lcs.voiceAsk') !== '0')
  const toggle = () => {
    const v = !voice
    setVoice(v)
    localStorage.setItem('lcs.voiceAsk', v ? '1' : '0')
    window.LCSNative?.setVoiceAsk?.(v)
  }

  return (
    <Phone name="A02b-thiet-lap-hoan-tat" lg>
      <style>{css}</style>
      <div className="content" style={{ gap: 12 }}>
        <div className="col acenter" style={{ padding: '12px 0 0' }}>
          <div className="icon-box xl solid-safe"><Icon name="shield-check" size={48} /></div>
          <div className="t-h1 center" style={{ marginTop: 12 }}>Lá chắn đã sẵn sàng</div>
          <div className="t-body muted center" style={{ marginTop: 4 }}>3/3 lớp đang bảo vệ bà</div>
        </div>

        <div className="card col" style={{ padding: '4px 16px' }}>
          {LAYERS.map((l, i) => (
            <div key={l.key} className={`list-item${i === LAYERS.length - 1 ? ' last' : ''}`} style={{ gap: 10 }}>
              <div className="icon-box brand" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name={l.icon} size={20} /></div>
              <div className="t-label semi grow">{l.title}</div>
              <span className="chip safe">Đã bật</span>
            </div>
          ))}
        </div>

        {first ? (
          <div className="card col gap-8" style={{ padding: '12px 16px' }}>
            <div className="t-label semi muted">Người thân nhận cảnh báo</div>
            <div className="row gap-12">
              <div className="avatar" style={{ width: 48, height: 48, borderRadius: 24, fontSize: 18 }}>{first.name[0]}</div>
              <div className="col grow gap-2">
                <div className="row between gap-8">
                  <div className="t-label semi">{first.name}{first.relation ? ` (${first.relation})` : ''}</div>
                  <span className="chip safe">Đã ghép</span>
                </div>
                <div className="t-cap muted">Đã ghép qua ứng dụng nhắn tin</div>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className="card col gap-8 tap" style={{ padding: '12px 16px' }} onClick={() => nav('/chua-co-nguoi-than')}>
            <div className="t-label semi muted">Người thân nhận cảnh báo</div>
            <div className="row gap-8 c-brand"><Icon name="plus" size={18} /><div className="t-label semi">Thêm con, cháu nhận cảnh báo</div></div>
          </button>
        )}

        <div className="card row gap-10" style={{ padding: '12px 16px' }}>
          <div className="icon-box brand"><Icon name="mic" size={20} /></div>
          <div className="col grow gap-2">
            <div className="t-label bold">Hỏi bằng giọng nói</div>
            <div className="t-cap muted">Sau cuộc gọi đáng ngờ, Lá chắn hỏi bà bằng lời. Tắt được bất cứ lúc nào.</div>
          </div>
          <button type="button" role="switch" aria-checked={voice} aria-label="Hỏi bằng giọng nói" className="switch tap" onClick={toggle}
            style={{ background: voice ? '#1D4ED8' : 'var(--outline)', justifyContent: voice ? 'flex-end' : 'flex-start' }}><i /></button>
        </div>

        <button type="button" className="btn primary block mt-auto" onClick={() => nav('/', { replace: true })}>Về trang chủ</button>
      </div>
    </Phone>
  )
}
