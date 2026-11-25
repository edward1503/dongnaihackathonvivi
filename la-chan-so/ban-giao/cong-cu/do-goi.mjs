// Đo cuộc gọi video AI trên Chrome của điện thoại qua cổng gỡ lỗi (adb forward tcp:9222 localabstract:chrome_devtools_remote).
const [,, url, maxS = '150'] = process.argv;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let tab;
for (let i = 0; i < 20 && !tab; i++) {
  const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json()).catch(() => []);
  tab = tabs.find(t => t.type === 'page' && t.url.includes('video-call.html'));
  if (!tab) await sleep(500);
}
if (!tab) { console.log('KHÔNG thấy tab'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const wait = new Map(); const logs = [];
ws.onmessage = (m) => { const j = JSON.parse(m.data);
  if (j.id && wait.has(j.id)) { wait.get(j.id)(j.result || j.error); wait.delete(j.id); }
  else if (j.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(j.params.type)) logs.push(j.params.type + ': ' + j.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
  else if (j.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (j.params.exceptionDetails.exception?.description || j.params.exceptionDetails.text).slice(0, 200));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression, userGesture = false) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture })).result?.value;
await send('Runtime.enable');
if (url) { await send('Page.enable'); await send('Page.navigate', { url }); await sleep(1500); }
await ev(`(() => { if (window.__do) return; const d = window.__do = { f: 0, lt: 0, ltMax: 0, gaps: [] }; let p = performance.now();
  const tick = (t) => { d.f++; const g = t - p; if (g > 50) d.gaps.push(Math.round(g)); p = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { d.lt += e.duration; d.ltMax = Math.max(d.ltMax, e.duration); } }).observe({ entryTypes: ['longtask'] }); } catch {} })()`);
const t0 = Date.now(); let ready = null;
for (let i = 0; i < 240; i++) { const p = await ev(`document.querySelector('#prog')?.textContent`); if (/sẵn sàng|không vẽ được/.test(p || '')) { ready = Date.now() - t0; console.log('nạp nhân vật:', (ready / 1000).toFixed(1) + 's ·', p); break; } if (i % 10 === 0) console.log('  …', p); await sleep(500); }
const info = await ev(`(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return { ua: navigator.userAgent.replace(/.*(Android [0-9]+).*(Chrome\\/[0-9]+).*/, '$1 $2'), gl: gl ? (e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'có') : 'KHÔNG', nhan: navigator.hardwareConcurrency, ram: navigator.deviceMemory, coi: crossOriginIsolated, man: innerWidth + 'x' + innerHeight + '@' + devicePixelRatio }; })()`);
console.log('máy:', JSON.stringify(info));
await ev(`window.__do.f = 0, window.__do.gaps = [], window.__do.lt = 0, window.__do.ltMax = 0, 1`);
const tc = Date.now(); await ev(`document.querySelector('#auto').click()`, true);
let last = '', lastF = 0, lastT = Date.now(); const rows = []; let tSpeak = null;
for (let i = 0; i < Number(maxS) * 2; i++) {
  await sleep(500);
  const s = await ev(`JSON.stringify({ st: __call.state, line: __call.line, lip: __call.lip, demo: __call.demo, err: __call.errors, f: __do.f, lt: Math.round(__do.lt), ltMax: Math.round(__do.ltMax), gaps: __do.gaps.splice(0), vid: [...document.querySelectorAll('video')].map(v => v.readyState + (v.paused ? 'p' : 'r')).join(','), cv: [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height).join(',') })`);
  if (!s) continue; const j = JSON.parse(s); const now = Date.now(); const fps = Math.round((j.f - lastF) * 1000 / (now - lastT)); lastF = j.f; lastT = now;
  const key = j.st + '|' + j.line;
  if (j.st === 'speaking' && tSpeak === null) { tSpeak = now - tc; console.log('bấm gọi → chị Lan bắt đầu nói:', (tSpeak / 1000).toFixed(1) + 's'); }
  rows.push({ t: now - tc, key, fps, gaps: j.gaps });
  if (key !== last) { console.log(((now - tc) / 1000).toFixed(1).padStart(6) + 's', key.padEnd(24), 'khẩu hình:', j.lip, '· video:', j.vid, '· canvas:', j.cv, j.demo ? '· ĐOẠN MẪU TẠM' : ''); last = key; }
  if (j.st === 'done' || j.st === 'ended') { console.log('lỗi trong trang:', JSON.stringify(j.err), '· tác vụ dài tổng', j.lt + 'ms, dài nhất', j.ltMax + 'ms'); break; }
}
const by = {}; for (const r of rows) { const k = r.key.split('|')[0]; (by[k] ||= []).push(r); }
for (const [k, rs] of Object.entries(by)) { const f = rs.map(r => r.fps).sort((a, b) => a - b); const g = rs.flatMap(r => r.gaps);
  console.log(k.padEnd(18), 'fps trung vị', f[f.length >> 1], '· thấp nhất', f[0], '· khung trễ >50ms:', g.length, g.length ? '(dài nhất ' + Math.max(...g) + 'ms)' : ''); }
console.log('mô hình miệng:', await ev());
console.log('cảnh báo/lỗi console:', logs.length); for (const l of [...new Set(logs)].slice(0, 8)) console.log('  ', l);
ws.close();
