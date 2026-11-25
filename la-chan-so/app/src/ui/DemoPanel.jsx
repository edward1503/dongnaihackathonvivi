// Bảng mô phỏng cho buổi trình diễn, chỉ hiện khi mở với ?demo=1.
// Thay cho những việc Android làm thật: có cuộc gọi đến, mở ứng dụng ngân hàng sau cuộc gọi lạ.
//
// - Trên laptop (rộng từ 900px): bảng bên trái, công tắc "Máy này / Điện thoại". Chọn "Điện thoại" thì mỗi nút gửi
//   sự kiện demo.go qua máy chủ, điện thoại đang mở app tự chuyển màn (đổ chuông, Bé Nai hỏi…). Bên phải là mã QR.
// - Trên điện thoại: một mấu nhỏ ở mép trái, chạm vào thì mở bảng ngay trên máy.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { api, qrUrl } from '../lib/api.js'
import { setLayersForDemo } from '../lib/layers.js'
import { CLIENT_ID, useApp } from '../lib/state.jsx'

const css = `
.demo-panel{position:fixed;left:24px;top:24px;z-index:40;width:250px;display:none;flex-direction:column;gap:8px;
  background:#fff;border:1px solid var(--outline-2);border-radius:16px;padding:14px;box-shadow:0 10px 30px rgba(15,23,42,.10)}
.demo-panel button{flex:none;min-height:40px;border-radius:10px;padding:9px 12px;line-height:20px;text-align:left;font-size:14px;font-weight:600;background:var(--surface-2);color:var(--ink)}
.demo-panel button.main{background:var(--brand);color:#fff}
.demo-seg{display:flex;gap:4px;background:var(--surface-2);border-radius:10px;padding:3px}
.demo-panel .demo-seg button{flex:1;height:32px;min-height:0;border-radius:8px;text-align:center;font-size:13px;background:none;padding:0}
.demo-panel .demo-seg button.on{background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.12)}
.demo-qr{position:fixed;right:24px;top:24px;z-index:40;width:236px;display:none;flex-direction:column;gap:8px;
  background:#fff;border:1px solid var(--outline-2);border-radius:16px;padding:14px;box-shadow:0 10px 30px rgba(15,23,42,.10)}
.demo-qr img{width:100%;aspect-ratio:1;border-radius:8px;background:#fff}
.demo-qr select{height:36px;border-radius:10px;border:1px solid var(--outline-2);padding:0 8px;font:inherit;font-size:13px;background:var(--surface-2)}
.demo-qr .url{font-size:12px;line-height:16px;word-break:break-all;color:var(--ink-2)}
.demo-qr .warn{font-size:12px;line-height:16px;color:var(--warning-ink, #92400E);background:var(--warning-soft, #FEF3C7);border-radius:8px;padding:6px 8px}
.demo-fab{position:fixed;left:0;top:42%;z-index:60;width:26px;height:56px;border-radius:0 12px 12px 0;
  background:rgba(15,23,42,.45);color:#fff;display:flex;align-items:center;justify-content:center}
.demo-close{position:absolute;right:10px;top:10px;width:32px !important;height:32px !important;min-height:0 !important;padding:0 !important;display:flex;align-items:center;justify-content:center;border-radius:16px !important}
@media (min-width: 900px){.demo-panel,.demo-qr{display:flex}.demo-fab,.demo-close{display:none !important}}
@media (max-width: 899px){
  .demo-panel.open{display:flex;left:12px;right:12px;top:auto;bottom:calc(12px + env(safe-area-inset-bottom));width:auto;max-height:75vh;overflow:auto;z-index:60;
    box-shadow:0 -10px 40px rgba(15,23,42,.25)}
  .demo-panel .demo-seg-wrap{display:none}
}
`

const ACTIONS = [
  { label: 'Có cuộc gọi lạ (số bị báo)', mode: 'simple', path: '/cuoc-goi?so=0912345678', main: true },
  { label: 'Số chưa ai báo gọi tới', mode: 'simple', path: '/cuoc-goi?so=0987654321' },
  { label: 'Đang gọi số lạ, mở app ngân hàng', mode: 'simple', path: '/dung-lai?danggoi=1&giay=401' },
  { label: 'Mở app ngân hàng sau cuộc gọi', mode: 'simple', path: '/dung-lai?phut=4' },
  { label: 'Có tin nhắn lạ', mode: 'full', path: '/thong-bao' },
  { label: 'Máy không có ghi âm', mode: 'simple', path: '/khong-ghi-am' },
  { label: 'Máy tắt Lá chắn (hết pin)', mode: 'simple', path: '/', layers: { asleep: true } },
  { label: 'Thiết lập lần đầu', mode: 'simple', path: '/thiet-lap', layers: { calls: true, messages: false, banking: false, asleep: false } },
  { label: 'Máy bà Hoa', mode: 'simple', path: '/' },
  { label: 'Máy Vy', mode: 'full', path: '/' },
]

export default function DemoPanel() {
  const nav = useNavigate()
  const { setMode, toast } = useApp()
  const [target, setTarget] = useState(() => localStorage.getItem('lcs.demoTarget') || 'here')
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState(null)
  const [qrPath, setQrPath] = useState('/?mode=simple')
  const on = new URLSearchParams(location.search).get('demo') === '1'

  useEffect(() => {
    if (!on || !window.matchMedia('(min-width: 900px)').matches) return
    api.demoLinks().then(setLinks).catch(() => setLinks(null))
  }, [on])

  if (!on) return null

  const pickTarget = (t) => { setTarget(t); localStorage.setItem('lcs.demoTarget', t) }
  const remote = target === 'phone' && window.matchMedia('(min-width: 900px)').matches

  const go = async ({ mode, path, layers }) => {
    if (remote) {
      try {
        await api.demoGo({ path, mode, layers, client: CLIENT_ID })
        toast('Đã gửi tới điện thoại')
      } catch {
        toast('Chưa gửi được. Máy chủ còn chạy không?')
      }
      return
    }
    if (layers) setLayersForDemo(layers)
    setMode(mode)
    nav(path)
    setOpen(false)
  }
  const reset = async () => {
    try { await api.reset() } catch { /* máy chủ tắt: vẫn xóa phía app */ }
    ;['lcs.recent', 'lcs.points', 'lcs.known'].forEach((k) => localStorage.removeItem(k))
    setLayersForDemo(null)
    toast('Đã đặt lại kịch bản demo')
    if (remote) await api.demoGo({ path: '/', mode: 'simple', client: CLIENT_ID }).catch(() => {})
    else nav('/')
    setOpen(false)
  }
  const current = links?.links?.find((l) => l.path === qrPath)

  return (
    <>
      <style>{css}</style>
      {!open && <button type="button" className="demo-fab tap" aria-label="Mở bảng mô phỏng" onClick={() => setOpen(true)}><Icon name="play" size={16} /></button>}
      <div className={`demo-panel${open ? ' open' : ''}`}>
        <button type="button" className="demo-close" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="x" size={18} /></button>
        <div className="t-over muted">Mô phỏng (trình diễn)</div>
        <div className="demo-seg-wrap col gap-4">
          <div className="demo-seg" role="group" aria-label="Bấm nút thì đổi màn ở đâu">
            <button type="button" className={target === 'here' ? 'on' : ''} onClick={() => pickTarget('here')}>Máy này</button>
            <button type="button" className={target === 'phone' ? 'on' : ''} onClick={() => pickTarget('phone')}>Điện thoại</button>
          </div>
          {target === 'phone' && <div className="t-cap muted">Nút bên dưới đổi màn trên điện thoại đang mở app.</div>}
        </div>
        {ACTIONS.map((a) => (
          <button key={a.label} type="button" className={a.main ? 'main' : ''} onClick={() => go(a)}>{a.label}</button>
        ))}
        <button type="button" onClick={reset}>Đặt lại demo</button>
      </div>

      <div className="demo-qr">
        <div className="t-over muted">Mở trên điện thoại</div>
        <select value={qrPath} onChange={(e) => setQrPath(e.target.value)} aria-label="Trang cần mở">
          {(links?.links || [{ path: '/?mode=simple', label: 'Máy bà Hoa' }]).map((l) => <option key={l.path} value={l.path}>{l.label}</option>)}
        </select>
        <img src={qrUrl(qrPath)} alt={`Mã QR mở ${current?.label || 'app'}`} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        {current && <div className="url">{current.url}</div>}
        {links && !links.https && (
          <div className="warn">Điện thoại cần HTTPS để dùng micro và chạy avatar mượt. Chạy <b>python chay-demo.py</b> trong thư mục server.</div>
        )}
      </div>
    </>
  )
}
