// Bảng mô phỏng cho buổi trình diễn, chỉ hiện khi mở với ?demo=1.
// Thay cho những việc Android làm thật: có cuộc gọi đến, mở ứng dụng ngân hàng, có tin nhắn lạ, máy tắt Lá chắn.
// - Laptop (rộng từ 900px): bảng bên trái, công tắc "Máy này / Điện thoại". Chọn "Điện thoại" thì mỗi nút gửi sự kiện
//   demo.go qua máy chủ, điện thoại đang mở app tự đổi màn. Bên phải là mã QR để quét mở app trên điện thoại.
// - Điện thoại: mấu nhỏ ở mép trái, chạm vào thì mở bảng ngay trên máy.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import I from '../v3/icons.jsx'
import { api, qrUrl } from '../lib/api.js'
import { setLayersForDemo } from '../lib/layers.js'
import { CLIENT_ID, useApp } from '../lib/state.jsx'

const css = `
.dp{position:fixed;left:20px;top:20px;z-index:40;width:256px;display:none;flex-direction:column;gap:6px;max-height:calc(100vh - 40px);overflow:auto;
  background:#fff;border:1px solid var(--line);border-radius:22px;padding:14px;box-shadow:0 12px 34px rgba(20,33,61,.12)}
.dp h4,.dq h4{font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:var(--ink2);margin:6px 2px 2px}
.dp button.a{flex:none;min-height:40px;border-radius:12px;padding:9px 12px;line-height:20px;text-align:left;font-size:14px;font-weight:600;background:var(--pg);color:var(--ink)}
.dp button.a.main{background:var(--pri);color:#fff}
.dp button.a.red{background:var(--dang-t);color:var(--dang)}
.dp .seg2{display:flex;gap:4px;background:var(--pg);border-radius:12px;padding:3px}
.dp .seg2 button{flex:1;height:32px;border-radius:9px;text-align:center;font-size:13px;font-weight:600}
.dp .seg2 button.on{background:#fff;box-shadow:0 1px 3px rgba(20,33,61,.12)}
.dp .hint{font-size:12px;line-height:16px;color:var(--ink2)}
.dq{position:fixed;right:20px;top:20px;z-index:40;width:236px;display:none;flex-direction:column;gap:8px;
  background:#fff;border:1px solid var(--line);border-radius:22px;padding:14px;box-shadow:0 12px 34px rgba(20,33,61,.12)}
.dq img{width:100%;aspect-ratio:1;border-radius:10px}
.dq select{height:38px;border-radius:12px;border:1px solid var(--line);padding:0 8px;font:inherit;font-size:13px;background:var(--pg)}
.dq .url{font-size:12px;line-height:16px;word-break:break-all;color:var(--ink2)}
.dq .warn{font-size:12px;line-height:16px;color:var(--warn);background:var(--warn-t);border-radius:10px;padding:6px 8px}
.dfab{position:fixed;left:0;top:42%;z-index:60;width:26px;height:56px;border-radius:0 12px 12px 0;background:rgba(20,33,61,.45);color:#fff;display:flex;align-items:center;justify-content:center}
.dclose{position:absolute;right:10px;top:10px;width:32px;height:32px;border-radius:16px;background:var(--pg);display:flex;align-items:center;justify-content:center}
@media (min-width:900px){.dp,.dq{display:flex}.dfab,.dclose{display:none !important}}
@media (max-width:899px){.dp.open{display:flex;left:12px;right:12px;top:auto;bottom:calc(12px + env(safe-area-inset-bottom));width:auto;max-height:75vh;z-index:70;box-shadow:0 -10px 40px rgba(20,33,61,.25)}.dp .seg-wrap{display:none !important}}
`

const GROUPS = [
  ['Cuộc gọi', [
    { label: 'Có cuộc gọi lạ (số bị báo)', mode: 'simple', path: '/cuoc-goi?so=0912345678', cls: 'main' },
    { label: 'Số chưa ai báo gọi tới', mode: 'simple', path: '/cuoc-goi?so=0987654321' },
    { label: 'Đang bị gọi đòi tiền', mode: 'simple', path: '/khan-cap', cls: 'red' },
    { label: 'Đang gọi số lạ, mở app ngân hàng', mode: 'simple', path: '/dung-lai?danggoi=1&giay=401' },
    { label: 'Mở app ngân hàng sau cuộc gọi', mode: 'simple', path: '/dung-lai?phut=4' },
  ]],
  ['Tin nhắn, trạng thái', [
    { label: 'Có tin nhắn lạ', mode: 'full', path: '/thong-bao' },
    { label: 'Máy tắt Lá chắn (hết pin)', mode: 'simple', path: '/', layers: { asleep: true } },
    { label: 'Thiết lập lần đầu', mode: 'simple', path: '/thiet-lap', layers: { calls: true, messages: false, banking: false, asleep: false } },
  ]],
  ['Đổi vai', [
    { label: 'Người lớn tuổi (bà Hoa)', mode: 'simple', path: '/' },
    { label: 'Học sinh (Vy)', mode: 'full', path: '/' },
    { label: 'Đăng nhập đội', mode: 'volunteer', path: '/' },
  ]],
]

export default function DemoPanel() {
  const nav = useNavigate()
  const { setMode, setOnboarded, toast } = useApp()
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

  const remote = target === 'phone' && window.matchMedia('(min-width: 900px)').matches
  const pickTarget = (t) => { setTarget(t); localStorage.setItem('lcs.demoTarget', t) }
  const go = async ({ mode, path, layers }) => {
    if (remote) {
      try { await api.demoGo({ path, mode, layers, client: CLIENT_ID }); toast('Đã gửi tới điện thoại') } catch { toast('Chưa gửi được. Máy chủ còn chạy không?') }
      return
    }
    if (layers) setLayersForDemo(layers)
    setMode(mode)
    setOnboarded(true)
    nav(path)
    setOpen(false)
  }
  const reset = async () => {
    try { await api.reset() } catch { /* máy chủ tắt: vẫn xóa phía app */ }
    ;['lcs.recent', 'lcs.points', 'lcs.awardedTotal', 'lcs.known'].forEach((k) => localStorage.removeItem(k))
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
      {!open && <button type="button" className="dfab" aria-label="Mở bảng mô phỏng" onClick={() => setOpen(true)}><I n="play" z={16} /></button>}
      <div className={`dp${open ? ' open' : ''}`}>
        <button type="button" className="dclose" aria-label="Đóng" onClick={() => setOpen(false)}><I n="x" z={18} /></button>
        <h4>Mô phỏng (trình diễn)</h4>
        <div className="seg-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="seg2" role="group" aria-label="Bấm nút thì đổi màn ở đâu">
            <button type="button" className={target === 'here' ? 'on' : ''} onClick={() => pickTarget('here')}>Máy này</button>
            <button type="button" className={target === 'phone' ? 'on' : ''} onClick={() => pickTarget('phone')}>Điện thoại</button>
          </div>
          {target === 'phone' && <div className="hint">Nút bên dưới đổi màn trên điện thoại đang mở app.</div>}
        </div>
        {GROUPS.map(([title, list]) => (
          <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h4>{title}</h4>
            {list.map((a) => <button key={a.label} type="button" className={`a ${a.cls || ''}`} onClick={() => go(a)}>{a.label}</button>)}
          </div>
        ))}
        <h4>&nbsp;</h4>
        <button type="button" className="a" onClick={reset}>Đặt lại demo</button>
      </div>

      <div className="dq">
        <h4>Mở trên điện thoại</h4>
        <select value={qrPath} onChange={(e) => setQrPath(e.target.value)} aria-label="Trang cần mở">
          {(links?.links || [{ path: '/?mode=simple', label: 'Máy bà Hoa' }]).map((l) => <option key={l.path} value={l.path}>{l.label}</option>)}
        </select>
        <img src={qrUrl(qrPath)} alt={`Mã QR mở ${current?.label || 'app'}`} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        {current && <div className="url">{current.url}</div>}
        {links && !links.https && <div className="warn">Điện thoại cần HTTPS để dùng micro và chạy avatar mượt. Chạy <b>python chay-demo.py</b> trong thư mục server.</div>}
      </div>
    </>
  )
}
