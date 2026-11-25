// Kiểm trang gọi video (prototype/video-call.html) cho từng cảnh bằng Chromium headless, màn dọc cỡ điện thoại, KHÔNG cần mạng hay khóa AI
// (trang chạy ở chế độ câu thu sẵn vì không có cầu nối của app).   node tools/kiem-goi-video.mjs [cổng=8803] [cảnh …]
// Mỗi cảnh: nạp nhân vật, bấm gọi, chờ câu mở đầu, gõ các lượt trả lời, tới màn kết quả; kiểm hợp đồng với trang bài học
// (localStorage['lcs-goi-<cảnh>'], nút quay về ?ve=). Ảnh chụp ở export/preview/goi-<cảnh>-*.png: PHẢI MỞ RA XEM, máy không tự biết miệng có đẹp không.
// Mỗi cảnh chạy thêm một lượt "như trong app": trang được đưa một cầu nối LaChan giả (thamSo() báo goc, không micro, không AI) và địa chỉ KHÔNG có
// ?go=1&goc=1, để kiểm trang tự nhận ra app qua cầu nối và kiểm bố cục phủ kín màn hình (nút trả lời sẵn không bị thanh gõ che, nút kết quả nằm trong màn).
// Ở lượt này máy tính không có mô hình miệng gốc của app, nên máy chủ thử trả một ảnh miệng GIẢ (xám đều) cho /__mieng, chỉ để nhân vật dựng lên được.
// Lượt này vì vậy KHÔNG kiểm việc tính miệng tại chỗ (chỉ điện thoại và máy ảo kiểm được); câu thu sẵn thì dùng video miệng dựng trước, không cần mô hình.
//   node tools/kiem-goi-video.mjs --anh-tinh     chụp lại ảnh tĩnh của nhân vật (prototype/canh/minh.jpg, tu.jpg) từ chính avatar đang chạy
// Thoát mã 1 nếu có kỳ vọng không đạt. Trên máy có đường dẫn tạm dài, đặt TMPDIR ngắn (Chromium giới hạn độ dài đường dẫn hồ sơ).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'export', 'preview');
const a = process.argv.slice(2), ANH_TINH = a[0] === '--anh-tinh' && !!a.shift(), PORT = /^\d+$/.test(a[0] || '') ? +a.shift() : 8803, DBG = 9700 + Math.floor(Math.random() * 90);
const VE = 'hoc.html?bai=1#thu-thach';
// lượt gõ cho mỗi cảnh (đường đủ ý) và kỳ vọng; "sai" = một cuộc gọi khác, trả lời sai rồi bấm Kết thúc
const KICH = {
  'lan-2': { ten: 'Chị Lan', tong: 4, avatar: '21', luot: ['chị đừng nạp, lương cao bất thường, chị tra tên công ty đi rồi báo cáo tài khoản đó'], sai: 'cứ nạp đi chị',
    song: { y: ['nap', 'dauhieu', 'xacminh', 'baocao'], ai: ['chi-lan', 'em'], lui: false }, luotSong: ['chị đừng nạp', 'lương cao bất thường', 'chị tra tên công ty đi', 'báo cáo tài khoản đó đi chị'] },
  // nutDoi: sau khi bấm nút đúng lúc mở đầu, nhân vật hỏi ý còn lại và hai nút phải đổi sang đúng các câu này (nut_theo_cau của tệp cảnh)
  'minh-1': { ten: 'Anh Minh', tong: 2, avatar: '125', luot: ['con cúp máy đi, đừng chuyển', 'con lên công an phường hỏi cho chắc'], sai: 'Con làm theo họ cho xong đi', nut: 2,
    nutDoi: ['Con lên công an phường hỏi, đừng giấu', 'Thôi con giấu đi, đừng nói ai'], song: { y: ['cup', 'hoilai'], ai: ['nv', 'nh'], lui: true } },
  'minh-3': { ten: 'Anh Minh', tong: 2, avatar: '125', luot: ['mẹ chưa chuyển đâu', 'mẹ gọi cô giáo của Vy hỏi thử'], sai: 'Mẹ chuyển trước cho kịp', nut: 2, song: { y: ['chuachuyen', 'goihoi'], ai: ['nv', 'nh'], lui: true } },
  'tu-9': { ten: 'Chú Tư', tong: 4, avatar: '117', luot: ['không chú ơi', 'họ cho rút trước để chú tin', 'lãi gấp đôi là bất thường', 'chú báo cáo nhóm đó đi'], sai: 'chú cứ nạp đi', song: { y: ['nap', 'moinhu', 'dauhieu', 'baocao'], ai: ['nv', 'nh'], lui: true } },
};
const CANH = a.length ? a : Object.keys(KICH);
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable', '/usr/bin/brave'].find(existsSync);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
const thieu = new Set();
const MIENG_GIA = Buffer.alloc(3 * 384 * 384, 128);
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/__mieng')) { res.writeHead(200, { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' }); return res.end(MIENG_GIA); }
  try {
    // Chỉ phục vụ tài nguyên web mà trang cần. Gốc kho có tệp .env chứa khóa: mọi phần đường dẫn bắt đầu bằng dấu chấm đều bị từ chối, và chỉ nhận các thư mục, tệp trong danh sách.
    const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname), phan = duong.split('/').filter(Boolean);
    if (phan.some((x) => x.startsWith('.')) || !(['prototype', 'vendor', 'assets'].includes(phan[0]) || (phan.length === 1 && ['ds.css', 'icons.js', 'motion.css', 'motion.js'].includes(phan[0])))) throw 0;
    const p = path.join(ROOT, duong);
    if (!p.startsWith(ROOT + path.sep)) throw 0;
    const buf = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : buf);
  } catch { thieu.add(req.url.split('?')[0]); res.writeHead(404); res.end('not found'); }
}).listen(PORT, '127.0.0.1');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const subs = [];
    ws.onopen = () => resolve({
      send(method, params = {}) { return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); }); },
      on(event, cb) { subs.push({ event, cb }); }, close() { ws.close(); },
    });
    ws.onerror = () => reject(new Error('ws error'));
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
      else if (m.method) subs.filter((s) => s.event === m.method).forEach((s) => s.cb(m.params));
    };
  });
}
const profile = path.join(os.tmpdir(), 'lcs-goi-' + process.pid);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--window-size=360,780', 'about:blank'], { stdio: 'ignore' });
// bị dừng giữa chừng (Ctrl+C, timeout) thì vẫn tắt trình duyệt và xóa hồ sơ tạm, không để sót tiến trình
for (const tin of ['SIGINT', 'SIGTERM']) process.on(tin, async () => { try { chrome.kill(); server.close(); } catch { /* đã tắt */ } await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(130); });
let hong = 0;
const mong = (dk, ten, them = '') => { if (!dk) hong++; console.log((dk ? '  ok  ' : '  SAI ') + ten + (them ? ' · ' + them : '')); };

// Cầu nối giả cho chế độ kết hợp (AI nói chuyện trực tiếp): luotSong trả lần lượt các kết quả trong window.__kichAI (null = AI hỏng: hết lượt API, mất mạng).
// Kết quả có tiếng là nửa giây im lặng, chỉ để trang đi hết đường phát tiếng trực tiếp. Mọi lời gọi được ghi vào window.__daGoi để kiểm trang gửi gì cho app.
const IM = Buffer.alloc(24000).toString('base64');
const cauSong = (kich) => `window.__kichAI = ${JSON.stringify(kich)}; window.__daGoi = [];
window.LaChan = { thamSo: () => JSON.stringify({ goc: true, song: true, auto: false }), coMicro: () => false, coTraLoi: () => true, nghe() {}, dungNghe() {},
  luotSong(ma, than) { const j = JSON.parse(than); window.__daGoi.push(j); const k = window.__kichAI.shift() ?? null;
    setTimeout(() => window.__ls(ma, k && { chu: k.chu, pcm: ${JSON.stringify(IM)}, tanSo: 24000, giay: 0.5, y: k.y, sai: !!k.sai, het: !!k.het }), 300); } };`;
const CAU_GIA = `window.LaChan = { thamSo: () => JSON.stringify({ goc: true, song: false, auto: false }), coMicro: () => false, coTraLoi: () => false, nghe() {}, dungNghe() {} };`;
async function trang(url, van, { cauGia = false, rong = 360, cao = 780 } = {}) {   // cauGia: true = cầu nối giả không AI, chuỗi = mã cầu nối tự đưa
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
  const c = await cdp(t.webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
  if (cauGia) await c.send('Page.addScriptToEvaluateOnNewDocument', { source: cauGia === true ? CAU_GIA : cauGia });
  c.on('Runtime.exceptionThrown', (p) => van.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
  c.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error' || p.type === 'warning') van.push('CONSOLE.' + p.type + ' ' + p.args.map((x) => x.value || x.description || '').join(' ')); });
  await c.send('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 2, mobile: true });
  await c.send('Page.navigate', { url });
  const js = async (expr) => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const cho = async (expr, ms, moTa) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await js(expr)) return true; } catch { /* trang đang nạp */ } await sleep(200); } console.log('  (hết giờ chờ: ' + moTa + ')'); return false; };
  const anh = async (ten) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); await writeFile(path.join(OUT, ten), Buffer.from(r.data, 'base64')); console.log('  ảnh export/preview/' + ten); };
  return { c, js, cho, anh };
}
const go = (chu) => `(() => { if (!window.__go) return false; window.__go(${JSON.stringify(chu)}); return true; })()`;

async function motCanh(ma) {
  const K = KICH[ma], van = []; console.log('\n== ' + ma);
  const t = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?go=1&canh=${ma}&ve=${encodeURIComponent(VE)}`, van);
  mong(await t.cho(`window.__call && document.getElementById('tenNV').textContent === ${JSON.stringify(K.ten)}`, 15000, 'nạp cảnh'), 'nạp cảnh, tên nhân vật trên màn hình', K.ten);
  mong(await t.js(`document.querySelectorAll('#keys .k').length`) === K.tong && await t.js(`document.getElementById('tongY').textContent`) === String(K.tong), 'số thẻ ý theo cảnh', String(K.tong));
  await t.cho(`/sẵn sàng|không vẽ được/.test(document.getElementById('prog').textContent)`, 60000, 'chuẩn bị nhân vật');
  await t.anh(`goi-${ma}-1-cho.png`);
  await t.js(`document.getElementById('go').click()`);
  await t.cho(`window.__call.state === 'speaking'`, 40000, 'bắt đầu nói câu mở đầu'); await sleep(1500);
  await t.anh(`goi-${ma}-2-dang-noi.png`);
  const noi = JSON.parse(await t.js(`JSON.stringify({ line: __call.line, lip: __call.lip, coHinh: !!document.querySelector('#avhost canvas'), conAnhTinh: !!document.querySelector('#avhost .still'), phuDe: document.getElementById('capText').textContent })`));
  mong(noi.line === 'mo-dau', 'câu mở đầu được phát', JSON.stringify(noi.phuDe).slice(0, 70));
  mong(noi.coHinh && !noi.conAnhTinh, 'nhân vật ' + K.avatar + ' đã dựng (có canvas, hết ảnh tĩnh)');
  mong(noi.lip === 'dung-san', 'miệng dùng video dựng sẵn', 'lip = ' + noi.lip);
  // Miệng có cử động khi nói không: đọc thẳng điểm ảnh của canvas nhân vật ở vùng quanh miệng (hộp meta.box quy ra khung 1280×720) qua 10 khung cách nhau 120 ms,
  // so với 10 khung lúc đã im. Đây chỉ là bằng chứng miệng CÓ ĐỘNG khi nói và ĐỨNG khi im; khớp tiếng hay không thì phải người xem.
  const DO = `(async (n) => { const cv = [...document.querySelectorAll('#avhost canvas')].at(-1), meta = await fetch('../vendor/vlearn-avatar/stage/_shared/voice/models/lite/${K.avatar}/meta.json').then((r) => r.json());
    const s = 720 / (meta.view.bottom - meta.view.y0), ox = (1280 - meta.size[0] * s) / 2, [x1, y1, x2, y2] = meta.box, X = Math.round(x1 * s + ox), Y = Math.round((y1 - meta.view.y0) * s), W = Math.round((x2 - x1) * s), H = Math.round((y2 - y1) * s);
    const tam = Object.assign(document.createElement('canvas'), { width: W, height: H }).getContext('2d', { willReadFrequently: true }); let truoc = null; const khac = [];
    for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r));   // canvas WebGL chỉ đọc được ngay trong khung hình nó vừa vẽ (không bật preserveDrawingBuffer)
      tam.clearRect(0, 0, W, H); tam.drawImage(cv, X, Y, W, H, 0, 0, W, H); const d = tam.getImageData(Math.round(W * 0.3), Math.round(H * 0.35), Math.round(W * 0.4), Math.round(H * 0.45)).data;
      if (truoc) { let t = 0; for (let k = 0; k < d.length; k += 4) t += Math.abs(d[k] - truoc[k]) + Math.abs(d[k + 1] - truoc[k + 1]) + Math.abs(d[k + 2] - truoc[k + 2]); khac.push(+(t / (d.length / 4) / 3).toFixed(2)); }
      truoc = d.slice(); await new Promise((r) => setTimeout(r, 120)); }
    return JSON.stringify(khac); })(10)`;
  let dangNoi = []; try { if ((await t.js('__call.state')) === 'speaking') dangNoi = JSON.parse(await t.js(DO)); } catch (e) { console.log('  (không đo được miệng: ' + e.message.slice(0, 80) + ')'); }
  mong(await t.cho(`window.__call.state === 'listening'`, 60000, 'nói xong câu mở đầu'), 'nói xong thì tới lượt người học');
  await sleep(700); let luIm = []; try { luIm = JSON.parse(await t.js(DO)); } catch { /* bỏ qua */ }
  const tb = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  // Chỉ in ra để tham khảo, KHÔNG tính đạt hay hỏng: đầu nhân vật lắc lư cả khi im nên số đo này không tách được cử động miệng (đo 25/11/2026). Kiểm miệng bằng tools/do-mieng.py và bằng mắt.
  console.log(`  (tham khảo) thay đổi điểm ảnh quanh miệng · khi nói: ${tb(dangNoi).toFixed(2)} · khi im: ${tb(luIm).toFixed(2)}`);
  if (K.nut) mong(await t.js(`[...document.querySelectorAll('#nutNhanh button')].filter((b) => b.offsetHeight >= 56).length`) === K.nut, 'nút trả lời sẵn hiện, cao từ 56px', String(K.nut));
  await t.anh(`goi-${ma}-3-toi-luot.png`);
  for (const [i, chu] of K.luot.entries()) {
    mong(await t.cho(go(chu), 60000, 'gửi lượt ' + (i + 1)), 'gửi lượt gõ ' + (i + 1), chu);
    if (i < K.luot.length - 1) { await t.cho(`window.__call.state !== 'listening'`, 5000, 'máy nhận lượt'); await t.cho(`window.__call.state === 'listening' || window.__call.state === 'done'`, 90000, 'nhân vật đáp'); }
  }
  mong(await t.cho(`window.__call.state === 'done'`, 90000, 'kết thúc'), 'cuộc gọi tự kết thúc khi đủ ý');
  await sleep(400);
  const kq = JSON.parse(await t.js(`JSON.stringify({ diem: +document.getElementById('pts').textContent, nhan: document.querySelector('.score .t-label').textContent, loi: document.getElementById('kqLoi').textContent,
    luu: localStorage.getItem('lcs-goi-${ma}'), coVe: document.body.classList.contains('co-ve'), href: document.querySelector('#finish a').getAttribute('href'), nut: document.querySelector('#finish a').textContent.trim(),
    nutHien: getComputedStyle(document.querySelector('#finish a')).display !== 'none', errors: __call.errors, cuoi: __call.line })`));
  mong(kq.diem === K.tong, 'đủ điểm', kq.diem + '/' + K.tong + ' · ' + kq.nhan);
  const luu = JSON.parse(kq.luu || 'null');
  mong(!!luu && luu.diem === K.tong && luu.tong === K.tong && Math.abs(Date.now() - luu.luc) < 120000, 'localStorage lcs-goi-' + ma, kq.luu || '(không có)');
  mong(kq.coVe && kq.href === VE && kq.nutHien, 'nút chính quay về bài học', kq.nut + ' → ' + kq.href);
  mong(!kq.errors.length, 'không có lỗi phát câu', kq.errors.join(' | '));
  await t.anh(`goi-${ma}-4-ket-qua.png`);
  await t.js(`document.querySelector('#finish a').click()`); await sleep(700);
  mong((await t.js('location.pathname + location.search + location.hash')) === '/prototype/' + VE, 'bấm nút thì về đúng địa chỉ ve');
  t.c.close();
  // cuộc gọi thứ hai: trả lời sai rồi kết thúc sớm, không có ve
  const t2 = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?go=1&canh=${ma}&ve=${encodeURIComponent('https://evil.example/hoc.html')}`, van);
  await t2.cho(`window.__call && /sẵn sàng|không vẽ được/.test(document.getElementById('prog').textContent)`, 60000, 'chuẩn bị nhân vật');
  await t2.js(`document.getElementById('go').click()`);
  await t2.cho(`window.__call.state === 'listening'`, 90000, 'tới lượt');
  await t2.cho(go(K.sai), 10000, 'gửi câu sai'); await t2.cho(`window.__call.state !== 'listening'`, 5000, 'máy nhận lượt');
  await t2.cho(`window.__call.state === 'listening' || window.__call.state === 'done'`, 90000, 'nhân vật đáp câu sai');
  const s2 = JSON.parse(await t2.js(`JSON.stringify({ diem: +document.getElementById('pts').textContent, yDinh: __call.yDinh, line: __call.line })`));
  mong(s2.diem === 0, 'trả lời sai thì 0 ý', 'ý định ' + s2.yDinh + ', câu đáp cuối ' + s2.line);
  await t2.anh(`goi-${ma}-5-sau-cau-sai.png`);
  await t2.js(`document.getElementById('end').click()`); await sleep(400);
  const k2 = JSON.parse(await t2.js(`JSON.stringify({ luu: localStorage.getItem('lcs-goi-${ma}'), coVe: document.body.classList.contains('co-ve'), nhan: document.querySelector('.score .t-label').textContent })`));
  mong(JSON.parse(k2.luu || '{}').diem === 0, 'kết thúc sớm vẫn ghi kết quả', k2.luu + ' · ' + k2.nhan);
  mong(!k2.coVe, 've trỏ ra ngoài bị bỏ qua');
  t2.c.close();
  // lượt "như trong app": cầu nối giả, địa chỉ không có ?go=1 hay ?goc=1
  const t3 = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?canh=${ma}&ve=${encodeURIComponent(VE)}`, [], { cauGia: true });
  await t3.cho(`window.__call && document.getElementById('tenNV').textContent === ${JSON.stringify(K.ten)}`, 15000, 'nạp cảnh (cầu nối giả)');
  const b3 = JSON.parse(await t3.js(`JSON.stringify({ app: document.body.classList.contains('app'), that: document.body.classList.contains('that'), r: document.querySelector('.call').getBoundingClientRect().toJSON(), vw: innerWidth, vh: innerHeight })`));
  mong(b3.app && b3.that, 'trang tự nhận ra app qua LaChan.thamSo() (không cần ?goc=1)');
  mong(Math.abs(b3.r.width - b3.vw) < 2 && Math.abs(b3.r.height - b3.vh) < 3 && Math.abs(b3.r.left) < 1 && Math.abs(b3.r.top) < 1, 'khung cuộc gọi phủ kín màn hình', `${Math.round(b3.r.width)}×${Math.round(b3.r.height)} trên ${b3.vw}×${b3.vh}`);
  const phong0 = await t3.js(`getComputedStyle(document.body).fontFamily`);
  await t3.js(`document.getElementById('go').click()`);
  await t3.cho(`window.__call.state === 'listening'`, 90000, 'tới lượt (cầu nối giả)');
  const m3 = JSON.parse(await t3.js(`JSON.stringify({ state: __call.state, lip: __call.lip, coHinh: !!document.querySelector('#avhost canvas'), conAnhTinh: !!document.querySelector('#avhost .still'), errors: __call.errors })`));
  mong(m3.state === 'listening' && m3.lip === 'dung-san' && m3.coHinh && !m3.conAnhTinh, 'trong bố cục app: nhân vật dựng được, mở đầu phát bằng video miệng dựng sẵn, rồi tới lượt người học', JSON.stringify(m3));
  await sleep(300);
  const g3 = JSON.parse(await t3.js(`JSON.stringify({ go: document.body.classList.contains('dang-go'), phong: getComputedStyle(document.body).fontFamily, cao: document.body.getBoundingClientRect().height,
    thanh: document.getElementById('goBox').getBoundingClientRect().top, nut: [...document.querySelectorAll('#nutNhanh button')].map((b) => b.getBoundingClientRect().bottom),
    luot: document.getElementById('luot').getBoundingClientRect().height, phuDe: document.getElementById('caption').getBoundingClientRect().bottom, bang: document.querySelector('.lower').getBoundingClientRect().top })`));
  mong(g3.go && g3.phong === phong0, 'mở ô gõ không làm đổi phông chữ của trang', g3.phong.slice(0, 40));
  mong(g3.luot < 56, 'dòng trạng thái giữ đúng cỡ khi đang gõ', Math.round(g3.luot) + 'px');
  if (K.nut) mong(g3.nut.length === K.nut && g3.nut.every((y) => y <= g3.thanh + 0.5), 'thanh gõ không che nút trả lời sẵn', `nút cuối kết thúc ở ${Math.round(Math.max(...g3.nut))}, thanh gõ bắt đầu ở ${Math.round(g3.thanh)}`);
  mong(g3.phuDe <= g3.bang + 0.5, 'phụ đề nằm trên bảng dưới, không bị che', `${Math.round(g3.phuDe)} ≤ ${Math.round(g3.bang)}`);
  await t3.anh(`goi-${ma}-6-app-toi-luot.png`);
  if (K.nut) {   // bấm nút trả lời sẵn thứ nhất (nút đúng); cảnh có nút đổi theo câu hỏi thì bấm tiếp nút đúng của câu sau
    await t3.js(`document.querySelector('#nutNhanh button').click()`);
    if (K.nutDoi) {
      await t3.cho(`window.__call.state !== 'listening'`, 5000, 'máy nhận lượt'); await t3.cho(`window.__call.state === 'listening' || window.__call.state === 'done'`, 90000, 'nhân vật hỏi ý còn lại');
      const chuNut = JSON.parse(await t3.js(`JSON.stringify([...document.querySelectorAll('#nutNhanh button')].map((b) => b.textContent))`));
      mong(JSON.stringify(chuNut) === JSON.stringify(K.nutDoi), 'nhân vật hỏi ý còn lại thì hai nút đổi theo câu hỏi', chuNut.join(' / '));
      await t3.anh(`goi-${ma}-6b-app-nut-doi.png`);
      await t3.js(`document.querySelector('#nutNhanh button').click()`);
    }
  }
  else for (const chu of K.luot) { await t3.cho(go(chu), 60000, 'gửi lượt'); await t3.cho(`window.__call.state !== 'listening'`, 5000, 'máy nhận lượt'); await t3.cho(`window.__call.state === 'listening' || window.__call.state === 'done'`, 90000, 'nhân vật đáp'); }
  mong(await t3.cho(`window.__call.state === 'done'`, 90000, 'kết thúc (cầu nối giả)'), K.nut ? 'bấm nút trả lời sẵn là trả lời xong' : 'gõ đủ ý thì kết thúc', (await t3.js(`document.getElementById('pts').textContent`)) + '/' + K.tong);
  await sleep(400);
  const k3 = JSON.parse(await t3.js(`JSON.stringify({ vh: innerHeight, chinh: document.querySelector('#finish a').getBoundingClientRect().toJSON(), lai: document.getElementById('again').getBoundingClientRect().toJSON(), laiChu: document.getElementById('again').textContent })`));
  mong(k3.chinh.height >= 48 && k3.chinh.bottom <= k3.vh && k3.lai.height > 0 && k3.lai.bottom <= k3.vh + 0.5, 'màn kết quả: nút chính và nút "Gọi lại" đều nằm trong màn hình', `nút chính tới ${Math.round(k3.chinh.bottom)}, "${k3.laiChu}" tới ${Math.round(k3.lai.bottom)} / ${k3.vh}`);
  await t3.anh(`goi-${ma}-7-app-ket-qua.png`);
  t3.c.close();
  // đường dẫn đúng như trang bài học dùng, mở bằng trình duyệt (không ?go=1): có ve hợp lệ thì phải là hội thoại thật; ?auto=1 chỉ có tác dụng ở cảnh có bản diễn
  const t4 = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?canh=${ma}&auto=1&ve=${encodeURIComponent(VE)}`, []);
  await t4.cho(`window.__call && !document.getElementById('go').disabled`, 20000, 'trang sẵn sàng');
  const b4 = JSON.parse(await t4.js(`JSON.stringify({ that: document.body.classList.contains('that'), autoAn: getComputedStyle(document.getElementById('auto')).display === 'none' })`));
  mong(b4.that, 'mở từ bài học bằng trình duyệt (có ve, không ?go=1) vẫn là hội thoại thật');
  if (ma !== 'lan-2') { await t4.js(`document.getElementById('go').click()`); await t4.cho(`window.__call.state === 'speaking' || window.__call.state === 'listening'`, 60000, 'mở đầu');
    const a4 = JSON.parse(await t4.js(`JSON.stringify({ auto: !!__call.auto, line: __call.line })`)); mong(b4.autoAn && !a4.auto && a4.line === 'mo-dau', '?auto=1 không chạy cuộc gọi mẫu của chị Lan ở cảnh khác', JSON.stringify(a4)); }
  t4.c.close();
  if (K.song) await kiemKetHop(ma, K);
  const loc = [...new Set(van)].filter((x) => !/favicon|GroupMarkerNotSet|Automatic fallback to software WebGL|GPU stall/.test(x));
  mong(!loc.length, 'không có lỗi console hay exception', loc.join('\n         ').slice(0, 900));
}

// Chế độ kết hợp với cầu nối giả. Ba cuộc gọi: AI đáp đủ; AI hỏng mọi lượt (phải lùi về luật trên máy và câu thu sẵn); AI đáp lượt đầu rồi hỏng.
async function kiemKetHop(ma, K) {
  const luot = async (t, chu) => { await t.cho(go(chu), 60000, 'gửi lượt'); await t.cho(`window.__call.state !== 'listening'`, 5000, 'máy nhận lượt'); await t.cho(`window.__call.state === 'listening' || window.__call.state === 'done'`, 90000, 'nhân vật đáp'); };
  const mo = async (kich) => {
    const van = [], t = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?canh=${ma}`, van, { cauGia: cauSong(kich) });
    await t.cho(`window.__call && /sẵn sàng|không vẽ được/.test(document.getElementById('prog').textContent)`, 60000, 'chuẩn bị nhân vật');
    await t.js(`document.getElementById('go').click()`); await t.cho(`window.__call.state === 'listening'`, 90000, 'tới lượt');
    return { t, van };
  };
  const xem = async (t) => JSON.parse(await t.js(`JSON.stringify({ state: __call.state, cheDo: __call.cheDo, diem: +document.getElementById('pts').textContent, hong: __call.hong || 0, song: __call.song || 0, line: __call.line, errors: __call.errors, goi: window.__daGoi, luu: localStorage.getItem('lcs-goi-${ma}') })`));
  // 1. AI đáp đủ: mỗi lượt chấm một ý, lượt cuối báo kết thúc
  let { t } = await mo(K.song.y.map((y, i) => ({ chu: 'Ừ.', y: [y], het: i === K.song.y.length - 1 })));
  for (const chu of (K.luotSong || K.luot).slice(0, K.song.y.length)) await luot(t, chu);
  await t.cho(`window.__call.state === 'done'`, 30000, 'kết thúc'); let k = await xem(t);
  mong(k.cheDo === 'ket-hop' && k.state === 'done' && k.diem === K.tong && k.song === K.song.y.length && k.hong === 0, 'kết hợp, AI đáp đủ: điểm lấy từ AI, tiếng phát trực tiếp', `${k.diem}/${K.tong}, ${k.song} lượt trực tiếp`);
  const g = k.goi[0] || {}, vai = (g.lich_su || []).map((x) => x.ai);
  mong(g.canh === ma && vai[0] === K.song.ai[0] && vai.at(-1) === K.song.ai[1] && Array.isArray(g.da_cham), 'trang gửi cho app đúng mã cảnh và đúng tên vai trong lịch sử', JSON.stringify({ canh: g.canh, vai }));
  mong((k.goi[1]?.da_cham || []).join() === K.song.y[0], 'lượt sau gửi kèm các ý đã chấm', JSON.stringify(k.goi[1]?.da_cham));
  t.c.close();
  // 2. AI hỏng mọi lượt (hết lượt API): cuộc gọi vẫn đi hết bằng luật trên máy và câu thu sẵn
  ({ t } = await mo([]));
  for (const chu of K.luot) { if ((await t.js('__call.state')) === 'done') break; await luot(t, chu); }
  await t.cho(`window.__call.state === 'done'`, 30000, 'kết thúc'); k = await xem(t);
  if (K.song.lui) mong(k.state === 'done' && k.diem === K.tong && k.hong >= 1 && k.song === 0 && !k.errors.length, 'kết hợp, AI hỏng mọi lượt: lùi về câu thu sẵn, vẫn chấm đủ', `${k.diem}/${K.tong}, ${k.hong} lượt lùi, câu cuối ${k.line}`);
  else mong(k.state !== 'done' && k.diem === 0 && k.hong === 0, 'cảnh lan-2 giữ cách cũ khi AI hỏng: nhắc nói lại, không tự đổi sang câu thu sẵn', `trạng thái ${k.state}, ${k.diem}/${K.tong}`);
  await t.anh(`goi-${ma}-8-ket-hop-ai-hong.png`); t.c.close();
  if (!K.song.lui) return;
  // 3. AI đáp lượt đầu rồi hỏng: máy luật phải biết ý AI đã chấm, không chấm lại, và đi tiếp tới hết
  ({ t } = await mo([{ chu: 'Ừ.', y: [K.song.y[0]] }]));
  for (const chu of K.luot) { if ((await t.js('__call.state')) === 'done') break; await luot(t, chu); }
  await t.cho(`window.__call.state === 'done'`, 30000, 'kết thúc'); k = await xem(t);
  mong(k.state === 'done' && k.diem === K.tong && k.song === 1 && k.hong >= 1, 'kết hợp, AI đáp một lượt rồi hỏng: nối tiếp bằng câu thu sẵn, điểm cộng dồn đúng', `${k.diem}/${K.tong}, ${k.song} lượt AI, ${k.hong} lượt lùi`);
  mong(JSON.parse(k.luu || '{}').diem === K.tong, 'kết quả ghi vào localStorage ở chế độ kết hợp', k.luu);
  t.c.close();
}

// hàm veHopLe lấy thẳng từ mã nguồn trang, chạy với địa chỉ của app
function kiemVe() {
  console.log('\n== địa chỉ quay về (?ve=)');
  const src = readFileSync(path.join(ROOT, 'prototype/video-call.html'), 'utf8').match(/function veHopLe\(v\) \{[\s\S]*?\n\}/)[0];
  const veHopLe = new Function('location', src + '; return veHopLe;')({ href: 'https://lachan.app/prototype/video-call.html?canh=minh-1', origin: 'https://lachan.app' });
  for (const v of ['hoc.html', 'hoc.html?bai=1', 'hoc.html#c', 'hoc.html?bai=3&buoc=c#x']) mong(veHopLe(v) === v, 'nhận', v);
  for (const v of [null, '', 'https://evil.example/hoc.html', '//evil.example/hoc.html', '/prototype/hoc.html', './hoc.html', '../hoc.html', 'hoc.html/../../x', 'hoc.htmlx', 'hoc.html.evil.example',
    'hoc.html@evil.example', 'hoc.html?u=https://evil.example', 'hoc.html?u=//evil.example', 'hoc.html\\evil', 'hoc.html?a=\\\\evil', 'javascript:alert(1)//hoc.html', 'JAVASCRIPT:alert(1)', 'data:text/html,hoc.html',
    ' hoc.html', 'hoc.html ?x', 'hoc.html\n?x', 'hoc.html\t', 'Hoc.html', 'video-call.html?ve=hoc.html', 'hoc.html:80', 'hoc%2ehtml', '%2f%2fevil.example'])
    mong(veHopLe(v) === null, 'từ chối', JSON.stringify(v));
}

let code = 0;
try {
  let len = false; for (let i = 0; i < 200 && !len; i++) { try { await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); len = true; } catch { await sleep(150); } }
  if (!len) throw new Error('Chromium không lên sau 30 giây');
  await mkdir(OUT, { recursive: true });
  if (ANH_TINH) {   // ảnh tĩnh 16:9 của nhân vật lúc đang im (dùng cho màn chờ và khi máy không vẽ được nhân vật)
    for (const [ma, ten] of [['minh-1', 'minh'], ['tu-9', 'tu']]) {
      const t = await trang(`http://127.0.0.1:${PORT}/prototype/video-call.html?go=1&canh=${ma}`, [], { rong: 924, cao: 520 });
      await t.cho(`window.__call && /sẵn sàng|không vẽ được/.test(document.getElementById('prog').textContent)`, 60000, 'chuẩn bị nhân vật');
      await t.js(`document.getElementById('go').click()`); await t.cho(`window.__call.state === 'listening'`, 90000, 'nói xong câu mở đầu'); await sleep(1200);
      await t.js(`(() => { const st = document.createElement('style'); st.textContent = 'body{padding:0!important;display:block!important}.call{transform:none!important;border-radius:0!important;box-shadow:none!important;width:924px!important;height:520px!important;position:fixed!important;left:0;top:0}#tile{width:924px!important;overflow:visible!important}#avhost{left:0!important}.call>*:not(#tile),.shade-top,#goBox{display:none!important}'; document.head.append(st); })()`);
      await sleep(600);
      const r = await t.c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 924, height: 520, scale: 1 } });
      const tam = path.join(os.tmpdir(), `lcs-anh-${ten}.png`), ra = path.join(ROOT, 'prototype', 'canh', ten + '.jpg'); await writeFile(tam, Buffer.from(r.data, 'base64'));
      await new Promise((ok, no) => spawn('ffmpeg', ['-loglevel', 'error', '-y', '-i', tam, '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '3', ra]).on('exit', (m) => (m ? no(new Error('ffmpeg ' + m)) : ok())));
      await rm(tam, { force: true }); console.log('ảnh tĩnh', ra); t.c.close();
    }
    throw Object.assign(new Error('xong'), { xong: true });
  }
  kiemVe();
  for (const ma of CANH) await motCanh(ma);
  const t = [...thieu].filter((x) => !/favicon|\/prototype\/hoc\.html$/.test(x));
  mong(!t.length, 'không có tệp nào bị thiếu (404)', t.join(', '));
  console.log(hong ? `\n${hong} KỲ VỌNG KHÔNG ĐẠT` : '\nMọi kỳ vọng đều đạt.'); code = hong ? 1 : 0;
} catch (e) { if (!e.xong) { console.error('LỖI:', e.stack || e.message); code = 1; } }
finally { chrome.kill(); server.close(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(code); }
