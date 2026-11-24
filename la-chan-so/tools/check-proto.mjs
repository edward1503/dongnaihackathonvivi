// Kiểm tra prototype có chuyển động bằng Chromium headless (CDP, không cần cài gói).
// Chạy: node tools/check-proto.mjs  -> ảnh trong export/preview/motion-*.png, in lỗi console nếu có.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'export', 'preview');
const PORT = 8300 + Math.floor(Math.random() * 400), DBG = 9800 + Math.floor(Math.random() * 150);
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable', '/usr/bin/brave'].find(existsSync);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw 0;
    const buf = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(PORT, '127.0.0.1');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const subs = [];
    ws.onopen = () => resolve({
      send(method, params = {}) { return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); }); },
      on(event, cb) { subs.push({ event, cb }); }, close() { ws.close(); }
    });
    ws.onerror = () => reject(new Error('ws error'));
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
      else if (m.method) subs.filter(s => s.event === m.method).forEach(s => s.cb(m.params));
    };
  });
}
const profile = path.join(os.tmpdir(), 'lcs-proto-' + process.pid);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const problems = [];
async function page(url, w, h) {
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
  const c = await cdp(t.webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
  c.on('Runtime.exceptionThrown', p => problems.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text) + ' @ ' + (p.exceptionDetails.url || '')));
  c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error' || p.type === 'warning') problems.push('CONSOLE.' + p.type + ' ' + p.args.map(a => a.value || a.description || '').join(' ')); });
  c.on('Log.entryAdded', p => { if (p.entry.level === 'error') problems.push('LOG ' + p.entry.text + ' ' + (p.entry.url || '')); });
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url });
  return { c, id: t.id };
}
const shot = async (c, name, scale = 1) => { const r = await c.send('Page.captureScreenshot', { format: 'png', clip: undefined }); await writeFile(path.join(OUT, name), Buffer.from(r.data, 'base64')); console.log('ảnh', name); };
const press = async (c, key) => { await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: key === 'ArrowRight' ? 39 : 37 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key }); };
let code = 0;
try {
  for (let i = 0; i < 60; i++) { try { await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(150); } }
  await mkdir(OUT, { recursive: true });
  // --- 1. Prototype
  const { c } = await page(`http://127.0.0.1:${PORT}/prototype/index.html`, 1440, 900);
  await sleep(2600); await shot(c, 'motion-1-A01a.png');
  await press(c, 'ArrowRight'); await sleep(620); await shot(c, 'motion-2a-A03a-som.png');
  await sleep(2300); await shot(c, 'motion-2b-A03a-xong.png');
  for (let k = 0; k < 4; k++) { await press(c, 'ArrowRight'); await sleep(450); }   // -> Z01a (máy Minh)
  await sleep(1700); await shot(c, 'motion-3-Z01a.png');
  for (let k = 0; k < 8; k++) { await press(c, 'ArrowRight'); await sleep(450); }   // -> W01
  await sleep(620); await shot(c, 'motion-4a-W01-giua.png');
  await sleep(3100); await shot(c, 'motion-4b-W01-xong.png');
  const info = await c.send('Runtime.evaluate', { expression: `JSON.stringify({step:document.getElementById('step').textContent,code:document.getElementById('code').textContent,devices:document.querySelectorAll('.device').length,isIframe:!!document.querySelector('.device iframe'),isImg:!!document.querySelector('.device img')})`, returnByValue: true });
  console.log('trạng thái prototype:', info.result.value);
  c.close();
  // --- 2. Một khung mở trực tiếp: giữa chuyển động và khi đã đứng yên
  const p2 = await page(`http://127.0.0.1:${PORT}/screens/A10-phanh.html?frame=A10a-phanh-sau-cuoc-goi`, 360, 800);
  await sleep(400 + 350); await shot(p2.c, 'motion-5a-A10a-som.png');
  await sleep(1600); await shot(p2.c, 'motion-5b-A10a-2s.png');
  await sleep(7600); await shot(p2.c, 'motion-5c-A10a-dung-yen.png');
  p2.c.close();
  console.log(problems.length ? 'VẤN ĐỀ:\n' + [...new Set(problems)].join('\n') : 'Không có lỗi console hay exception.');
} catch (e) { console.error('LỖI:', e.message); code = 1; }
finally { chrome.kill(); server.close(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(code); }
