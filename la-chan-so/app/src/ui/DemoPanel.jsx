// Bảng mô phỏng cho buổi trình diễn: chỉ hiện khi mở với ?demo=1 và màn hình rộng (nằm ngoài khung điện thoại).
// Thay cho những việc Android làm thật: có cuộc gọi đến, mở ứng dụng ngân hàng sau cuộc gọi lạ.
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/state.jsx'

const css = `
.demo-panel{position:fixed;left:24px;top:24px;z-index:40;width:250px;display:none;flex-direction:column;gap:8px;
  background:#fff;border:1px solid var(--outline-2);border-radius:16px;padding:14px}
.demo-panel button{height:40px;border-radius:10px;padding:0 12px;text-align:left;font-size:14px;font-weight:600;background:var(--surface-2);color:var(--ink)}
.demo-panel button.main{background:var(--brand);color:#fff}
@media (min-width: 900px){.demo-panel{display:flex}}
`

export default function DemoPanel() {
  const nav = useNavigate()
  const { setMode, toast } = useApp()
  if (new URLSearchParams(location.search).get('demo') !== '1') return null
  const go = (mode, to) => { setMode(mode); nav(to) }
  const reset = async () => {
    try { await api.reset() } catch { /* máy chủ tắt: vẫn xóa phía app */ }
    ;['lcs.recent', 'lcs.points', 'lcs.known'].forEach((k) => localStorage.removeItem(k))
    toast('Đã đặt lại kịch bản demo')
    nav('/')
  }
  return (
    <div className="demo-panel">
      <style>{css}</style>
      <div className="t-over muted">Mô phỏng (trình diễn)</div>
      <button type="button" className="main" onClick={() => go('simple', '/cuoc-goi?so=0912345678')}>Có cuộc gọi lạ (số bị báo)</button>
      <button type="button" onClick={() => go('simple', '/cuoc-goi?so=0987654321')}>Số chưa ai báo gọi tới</button>
      <button type="button" onClick={() => go('simple', '/dung-lai?phut=4')}>Mở app ngân hàng sau cuộc gọi</button>
      <button type="button" onClick={() => go('simple', '/khong-ghi-am')}>Máy không có ghi âm</button>
      <button type="button" onClick={() => go('simple', '/')}>Máy bà Hoa</button>
      <button type="button" onClick={() => go('full', '/')}>Máy Vy</button>
      <button type="button" onClick={reset}>Đặt lại demo</button>
    </div>
  )
}
