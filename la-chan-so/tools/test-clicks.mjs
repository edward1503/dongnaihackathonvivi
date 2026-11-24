// Kiểm tra prototype bấm được: chạy luồng người cao tuổi, học sinh, tình nguyện viên bằng cách bấm đúng chữ trên nút.
// Chạy: node tools/test-clicks.mjs   (cần chromium; tự mở máy chủ http tạm)
import { spawn } from 'node:child_process';
import { writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 7100 + Math.floor(Math.random() * 800), DBG = 9600 + Math.floor(Math.random() * 300);
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable'].find(existsSync);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const profile = path.join(os.tmpdir(), 'lcs-click-' + process.pid);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars',
  '--window-size=1600,1000', '--mute-audio', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
function cdp(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const p = new Map(); const logs = [];
  ws.onopen = () => res({ send(m, params = {}) { return new Promise((a, b) => { const i = ++id; p.set(i, { a, b }); ws.send(JSON.stringify({ id: i, method: m, params })); }); }, logs, close() { ws.close(); } });
  ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && p.has(m.id)) { const q = p.get(m.id); p.delete(m.id); m.error ? q.b(new Error(m.error.message)) : q.a(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('ERR ' + m.params.args.map(a => a.value || a.description).join(' '));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); }; }); }
let c, fails = 0, passes = 0;
const ev = async (expr) => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval'); return r.result.value; };
async function waitFor(name, ms = 6000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await ev("typeof cur!=='undefined' && cur && !pending ? cur.name : null").catch(()=>null); if (v === name) { await sleep(450); return true; } await sleep(150); }
  const got = await ev("typeof cur!=='undefined' && cur && cur.name").catch(()=>null); console.log('  ✗ chờ', name, '→ đang ở', got); fails++; return false; }
async function tap(text) { const ok = await ev(`(()=>{ const d=cur.view.contentDocument; if(!d) return 'nodoc'; const el=[...d.querySelectorAll('.hs')].find(e=>e._rule&&e._rule.t===${JSON.stringify(text)}); if(!el) return 'missing'; el.click(); return 'ok'; })()`);
  if (ok !== 'ok') { console.log('  ✗ không thấy chỗ bấm', JSON.stringify(text), '(' + ok + ') trên', await ev('cur.name')); fails++; } return ok === 'ok'; }
async function tapAny() { await ev(`cur.view.contentDocument.querySelector('.frame .content, .frame').dispatchEvent(new MouseEvent('click',{bubbles:true}))`); }
async function step(label, fn, expect) { await fn(); if (await waitFor(expect)) { passes++; console.log('  ✓', label, '→', expect); } }
async function voice(clip) { await sleep(300); const r = await ev("({src: player.src.split('/').pop(), playing: !player.paused})");
  const ok = r.src === clip + '.m4a' && r.playing; console.log(ok ? '  ✓ đang phát ' + clip : '  ✗ giọng: mong ' + clip + ', thấy ' + JSON.stringify(r)); ok ? passes++ : fails++; }
async function shot(file) { const s = await c.send('Page.captureScreenshot', { format: 'png' }); await writeFile(path.join(ROOT, 'export/preview', file), Buffer.from(s.data, 'base64')); }
async function fill(v) { return ev(`(()=>{ const d=cur.view.contentDocument; const i=d.querySelector('.lcs-in,.lcs-ta'); if(!i) return false; i.value=${JSON.stringify(v)}; return true; })()`); }
const topClick = sel => ev(`(()=>{ const b=[...document.querySelectorAll(${JSON.stringify(sel.q)})].find(x=>x.textContent.trim().startsWith(${JSON.stringify(sel.t)})); if(!b) return false; b.click(); return true; })()`);
try {
  let ver; for (let k = 0; k < 60; k++) { try { ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(150); } }
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
  c = await cdp(t.webSocketDebuggerUrl); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/prototype/index.html` });
  console.log('Người cao tuổi');
  await waitFor('A01a-trang-chu-don-gian', 9000); await shot('proto-1-trang-chu.png');
  await step('mô phỏng cuộc gọi lạ', () => topClick({ q: '#sims button', t: 'Có cuộc gọi lạ' }), 'A03a-do-chuong-nguy-hiem');
  await step('Nghe', () => tap('Nghe'), 'A04a-hoi-nhanh'); await voice('benai-10'); await shot('proto-2-be-nai-hoi.png');
  await step('Có', () => tap('Có'), 'A04b-phan-tich-ghi-am'); await voice('benai-11');
  await step('Gọi Minh ngay', () => tap('Gọi Minh ngay'), 'Z01a-tin-canh-bao-trong-chat');
  await step('Mẹ đừng chuyển', () => tap('Mẹ đừng chuyển, con gọi ngay'), 'Z01c-mini-app-da-gui');
  await step('Gọi mẹ ngay', () => tap('Gọi mẹ ngay'), 'A08c-hoi-nguoi-than-tra-loi');
  await step('Về trang chủ', () => tap('Về trang chủ'), 'A01a-trang-chu-don-gian');
  await step('mở app ngân hàng', () => topClick({ q: '#sims button', t: 'Bà mở app ngân hàng' }), 'A10a-phanh-sau-cuoc-goi');
  await step('Đóng cảnh báo', () => tap('Đóng cảnh báo'), 'A01a-trang-chu-don-gian');
  await step('thẻ Hỏi người thân', () => tap('Hỏi người thân'), 'A08a-hoi-nguoi-than-gui');
  await step('Quay lại', () => topClick({ q: '#back', t: '← Quay lại' }), 'A01a-trang-chu-don-gian');
  console.log('Học sinh');
  await step('chọn Vy', () => topClick({ q: '#personas button', t: 'Vy' }), 'A01b-trang-chu-day-du');
  await step('Kiểm tra trước khi chuyển tiền', () => tap('Kiểm tra trước khi chuyển tiền'), 'A06a-kiem-tra-so');
  await fill('0912 345 678'); await shot('proto-3-kiem-tra.png');
  await step('Kiểm tra 0912 345 678', () => tap('Kiểm tra'), 'A07a-ket-qua-nguy-hiem');
  for (const [v, exp] of [['ngan-hang-moi.xyz', 'A07b-ket-qua-nghi-ngo'], ['1900 5555 88', 'A07c-ket-qua-an-toan'], ['0987 654 321', 'A07d-ket-qua-chua-co-du-lieu']]) {
    await topClick({ q: '#back', t: '← Quay lại' }); await waitFor('A06a-kiem-tra-so'); await fill(v);
    await step('Kiểm tra ' + v, () => tap('Kiểm tra'), exp);
    const shown = await ev(`cur.view.contentDocument.querySelector('.shot.on .card.row').textContent.includes(${JSON.stringify(v)})`);
    console.log(shown ? '  ✓ màn kết quả hiện đúng giá trị vừa nhập' : '  ✗ màn kết quả chưa hiện giá trị vừa nhập'); shown ? passes++ : fails++;
  }
  await shot('proto-4-ket-qua.png');
  await step('mô phỏng tin nhắn lạ', () => topClick({ q: '#sims button', t: 'Có tin nhắn lạ' }), 'A05a-thong-bao-noi');
  await step('Xem phân tích', () => tap('Xem phân tích'), 'A05b-phan-tich-tin-nhan');
  await step('Báo cho cộng đồng', () => tap('Báo cho cộng đồng'), 'A09b-bao-cong-dong');
  await step('Gửi báo cáo', () => tap('Gửi báo cáo'), 'A09c-bao-cao-xong');
  await step('vào học', () => topClick({ q: '#sims button', t: 'Vào học' }), 'A11a-thu-vien-truyen');
  await step('Chơi tiếp', () => tap('Chơi tiếp'), 'A11e-truyen-co-loi-ke'); await voice('benai-1');
  await step('chạm màn truyện', () => tapAny(), 'A11c-doc-tung-khung');
  await step('Nạp ngay', () => tap('Nạp ngay kẻo mất suất'), 'A11f-chon-sai-chon-lai'); await voice('benai-5'); await shot('proto-5-ngo-cut.png');
  await step('Quay lại điểm rẽ', () => tap('Quay lại điểm rẽ'), 'A11c-doc-tung-khung');
  await step('Dừng lại, hỏi cô giáo → tranh hỏi cô giáo', () => tap('Dừng lại, hỏi cô giáo'), 'A11j-chon-dung-hoi-co-giao'); await step('Tới thử thách cuối bài → gọi video', () => tap('Tới thử thách cuối bài'), '@video');
  await voice('benai-8'); await sleep(2200); await shot('proto-6-goi-video.png');
  await step('cuộc gọi xong → bảng điểm', () => ev(`cur.view.contentWindow.location.href='../screens/A11-truyen-tranh.html?frame=A11i-bang-diem-cuoi-bai'`), 'A11i-bang-diem-cuoi-bai'); await voice('benai-9');
  await step('Làm bài kiểm tra', () => tap('Làm bài kiểm tra 5 câu'), 'A12a-cau-hoi');
  await step('chọn Lừa đảo', () => tap('Lừa đảo'), 'A12b-giai-thich');
  await step('Câu tiếp theo', () => tap('Câu tiếp theo'), 'A12c-ket-qua');
  console.log('Tình nguyện viên, trạng thái lỗi');
  await step('chọn Khoa', () => topClick({ q: '#personas button', t: 'Khoa' }), 'W01-thong-ke');
  await step('Kiểm duyệt', () => tap('Kiểm duyệt'), 'W02-kiem-duyet');
  await step('Xác nhận lừa đảo', () => tap('Xác nhận lừa đảo'), 'W01-thong-ke');
  await step('Mất mạng', () => topClick({ q: '#errs button', t: 'Mất mạng' }), 'E01c-mat-mang');
  await step('Thử lại', () => tap('Thử lại'), 'A06a-kiem-tra-so');
  console.log('Chế độ xem theo luồng');
  await step('mở luồng học sinh', () => topClick({ q: '.tabs button', t: 'Xem luồng: học sinh' }), 'A01b-trang-chu-day-du');
  await step('bấm chỗ trống → bước tiếp', () => tapAny(), 'A06a-kiem-tra-so');
  console.log(`\nĐạt ${passes}, lỗi ${fails}`);
  const errs = c.logs.filter(l => !/favicon/.test(l)); console.log(errs.length ? 'Lỗi trong console:\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'Console sạch');
} catch (e) { console.error('LỖI:', e.message); fails++; }
finally { chrome.kill(); srv.kill(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(fails ? 1 : 0); }
