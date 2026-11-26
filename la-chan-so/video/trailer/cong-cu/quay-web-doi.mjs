// Quay web đội tình nguyện (máy chủ demo công khai): đăng nhập, mở Kiểm duyệt, mở hồ sơ đầu, ghi nhận xét, rà chuột lên "Xác nhận dấu hiệu".
// Chạy với máy chủ riêng trên laptop (LCS_BASE, mặc định http://127.0.0.1:8766), nên được bấm bỏ phiếu. Số điện thoại trên trang được che ngay trong trang.
//   node quay-web-doi.mjs <thư mục ra>   → <ra>/w9-kiem-duyet.mp4 + .moc.json
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
const out = process.argv[2]
const BASE = process.env.LCS_BASE || 'http://127.0.0.1:8766'
const W = 1440, H = 810, SCALE = 2
const fr = join(out, 'w9-frames'); rmSync(fr, { recursive: true, force: true }); mkdirSync(fr, { recursive: true })
const port = 9466
const prof = mkdtempSync(join(out, '.chrome-'))
const ch = spawn('chromium', ['--headless=new', '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', `--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let t; for (let i = 0; i < 50; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break } catch { await sleep(200) } }
const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r))
let id = 0; const wait = new Map(); const frames = []; let rec = false; const t0 = performance.now(); const moc = []
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id) { wait.get(d.id)?.(d); wait.delete(d.id); return }
  if (d.method === 'Page.screencastFrame') {
    send('Page.screencastFrameAck', { sessionId: d.params.sessionId })
    if (rec) { const n = frames.length; writeFileSync(join(fr, `${String(n).padStart(5, '0')}.jpg`), Buffer.from(d.params.data, 'base64')); frames.push((performance.now() - t0) / 1000) }
  }
}
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
const mark = (ten) => { moc.push({ ten, t: frames.length ? frames[frames.length - 1] - frames[0] : 0 }); console.log('mốc', ten) }
let mouse = { x: W * 0.6, y: H * 0.7 }
async function moveTo(x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16)); const a = { ...mouse }
  for (let i = 1; i <= steps; i++) { const k = i / steps, e = 1 - Math.pow(1 - k, 3); mouse = { x: a.x + (x - a.x) * e, y: a.y + (y - a.y) * e }; await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: mouse.x, y: mouse.y }); await sleep(16) }
}
async function center(sel) { return ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2} })()`) }
async function click(sel) { const c = await center(sel); if (!c) throw new Error('không thấy ' + sel); await moveTo(c.x, c.y); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', clickCount: 1 }); await sleep(90); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x, y: c.y, button: 'left', clickCount: 1 }) }
async function type(text) { for (const ch of text) { await send('Input.insertText', { text: ch }); await sleep(55) } }
// Che số điện thoại trên trang (chạy trước khi trang dựng)
const MASK = `(() => { const re = /(?:\\+?84|0)\\d{2,3}[ .]?\\d{3}[ .]?\\d{3,4}/g;
  const fix = () => { if (!document.body) return; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const v = n.nodeValue; const m = v.replace(re, (x) => x.slice(0, 2) + '•• ••• •••'); if (m !== v) n.nodeValue = m }
    document.querySelectorAll('input,textarea').forEach((e) => { if (re.test(e.value)) e.value = e.value.replace(re, (x) => x.slice(0, 2) + '•• ••• •••'); re.lastIndex = 0 }) };
  setInterval(fix, 30); document.addEventListener('DOMContentLoaded', fix) })()`
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false })
await send('Page.addScriptToEvaluateOnNewDocument', { source: MASK })
await send('Page.navigate', { url: BASE + '/web' }); await sleep(2500)
await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W * SCALE, maxHeight: H * SCALE, everyNthFrame: 1 })
rec = true; await sleep(1200); mark('dang-nhap')
await click('#code'); await type('246810'); await sleep(300)
await click('#login button'); await sleep(2200); mark('tong-quan')
await click('[data-go="mod"]'); await sleep(2200); mark('kiem-duyet')
const first = await ev(`(() => { const r = [...document.querySelectorAll('#md-list button')].find(b => /10 máy/.test(b.textContent)) || document.querySelector('#md-list button'); if (!r) return null; r.setAttribute('data-quay', '1'); return r.textContent.slice(0, 40) })()`)
console.log('hồ sơ đầu:', first ? 'có' : 'không có')
if (first) { await click('[data-quay="1"]'); await sleep(1800); mark('mo-ho-so') }
if (await center('#vote-note')) { await click('#vote-note'); await type('Nhiều máy nhận cùng kịch bản, khớp nhật ký cuộc gọi đến.'); await sleep(500); mark('nhan-xet')
  await click('[data-vote="confirm"]'); mark('xac-nhan'); await sleep(2600); mark('da-ghi-nhan') }
await sleep(800); rec = false; await send('Page.stopScreencast'); ch.kill()
// Ghép khung theo thời gian thật thành video 30 fps
const list = frames.map((tt, i) => `file '${String(i).padStart(5, '0')}.jpg'\nduration ${((frames[i + 1] ?? tt + 1 / 30) - tt).toFixed(4)}`).join('\n') + `\nfile '${String(frames.length - 1).padStart(5, '0')}.jpg'\n`
writeFileSync(join(fr, 'list.txt'), list)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(fr, 'list.txt'), '-vf', 'fps=30,scale=2880:1620:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-movflags', '+faststart', join(out, 'w9-kiem-duyet.mp4')])
writeFileSync(join(out, 'w9-kiem-duyet.moc.json'), JSON.stringify({ ma: 'w9', nguon: 'trinh-duyet', rong: 2880, cao: 1620, giay: frames[frames.length - 1] - frames[0], moc }, null, 1))
console.log('xong', frames.length, 'khung')
process.exit(0)
