// Kiểm trang bài học (prototype/hoc.html) bằng Chromium không màn hình: chơi trọn từng bài ở hai cỡ máy,
// bấm đúng chữ trên nút như người dùng. Đáp án lấy từ tệp nội dung, không lấy từ trang.
// Chạy:  node tools/kiem-bai-hoc.mjs [--bai 1,9] [--anh <thư mục lưu ảnh>] [--nhanh] [--khong-tieng]
//   --nhanh: chỉ cỡ máy 360×740.   --khong-tieng: không coi thiếu tệp giọng là lỗi (dùng khi chưa thu xong).
// Kiểm: mọi bài tập làm được; sai có giải thích và làm lại được; gợi ý mở đủ ba bước; xem đáp án thì không đạt;
// màn không tràn, không cuộn; nút chế độ chữ lớn cao từ 56px; không lỗi console, không tệp 404; mọi tệp giọng có và giải mã được;
// địa chỉ chuyển sang cuộc gọi video và đường về có điểm (giả lập bằng localStorage), kể cả khi bỏ dở.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const co = k => process.argv.includes(k);
const ANH = arg('--anh') ? path.resolve(arg('--anh')) : path.join(ROOT, 'export', 'preview', 'hoc');
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable'].find(existsSync);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const khong404 = [];
const server = createServer(async (req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    const p = path.join(ROOT, duong); if (!p.startsWith(ROOT)) throw 0;
    const buf = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(buf);
  } catch { if (!/favicon/.test(duong)) khong404.push(duong); res.writeHead(404); res.end('not found'); }
});
let PORT = 0;
for (const p of [8811, 8812, 8813, 8814, 8815, 8816, 8817, 8818, 8819]) {
  const ok = await new Promise(r => { server.once('error', () => r(false)); server.listen(p, '127.0.0.1', () => r(true)); });
  if (ok) { PORT = p; break; }
}
if (!PORT) { console.error('Các cổng 8811–8819 đều đang bận.'); process.exit(2); }
const GOC = `http://127.0.0.1:${PORT}/prototype/`;
const DBG = 9300 + Math.floor(Math.random() * 300);
const profile = path.join(os.tmpdir(), 'lcs-hoc-' + process.pid);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--mute-audio',
  '--autoplay-policy=no-user-gesture-required', '--window-size=420,900', 'about:blank'], { stdio: 'ignore' });

function cdp(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url); let id = 0; const p = new Map(); const logs = [];
    ws.onopen = () => res({ send(m, params = {}) { return new Promise((a, b) => { const i = ++id; p.set(i, { a, b }); ws.send(JSON.stringify({ id: i, method: m, params })); }); }, logs, close() { ws.close(); } });
    ws.onerror = rej;
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && p.has(m.id)) { const q = p.get(m.id); p.delete(m.id); m.error ? q.b(new Error(m.error.message)) : q.a(m.result); }
      else if (m.method === 'Runtime.exceptionThrown') logs.push('NGOẠI LỆ ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
      else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    };
  });
}

let c, dat = 0, hong = 0, soAnh = 0, soMan = 0; const loi = [], nhan = { vp: '', bai: '' };
const ev = async expr => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'lỗi eval: ' + expr.slice(0, 80)); return r.result.value; };
const J = v => JSON.stringify(v);
const tt = () => ev('JSON.stringify(window.__hoc||{})').then(s => JSON.parse(s));
function ghi(ok, ten, them) { if (ok) dat++; else { hong++; loi.push(`[${nhan.vp} · Bài ${nhan.bai}] ${ten}${them ? ' → ' + them : ''}`); console.log('    ✗', ten, them || ''); } return ok; }
async function cho(dk, ms = 12000, ten) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await ev(dk)) return true; } catch { } await sleep(40); }
  ghi(false, 'chờ quá lâu: ' + (ten || dk), J(await tt().catch(() => ({})))); return false;
}
const choMan = (m, ms) => cho(`window.__hoc && window.__hoc.man===${J(m)}`, ms, 'màn ' + m);
const choPha = (p, ms) => cho(`window.__hoc && String(window.__hoc.pha).indexOf(${J(p)})===0`, ms, 'pha ' + p);
// bấm phần tử đang hiện có đúng chữ này (nút, cụm chữ trong tin nhắn, thẻ câu, tên chiêu)
async function bam(chu, vung = '#app') {
  const r = await ev(`(()=>{const ds=[...document.querySelectorAll(${J(vung)}+' button, '+${J(vung)}+' .doan')].filter(e=>e.getClientRects().length);
    const b=ds.find(e=>e.textContent.trim()===${J(chu)})||ds.find(e=>{const n=e.querySelector('.nd,.chu,span:not(.so):not(.gan)');return n&&n.textContent.trim()===${J(chu)};});
    if(!b) return 'không thấy'; if(b.disabled) return 'đang tắt'; b.click(); return 'ok';})()`);
  return ghi(r === 'ok', 'bấm "' + chu + '"', r === 'ok' ? '' : r + ' · ' + J(await tt()));
}
const coNut = chu => ev(`[...document.querySelectorAll('#app button')].some(e=>e.getClientRects().length&&e.textContent.trim()===${J(chu)})`);
async function anh(ten) {
  await mkdir(ANH, { recursive: true }); const s = await c.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ANH, `${nhan.vp}-b${nhan.bai}-${ten}.png`), Buffer.from(s.data, 'base64')); soAnh++;
}
// Màn không được tràn, không được cuộn; chữ không bị cắt trong ô; chế độ chữ lớn: nút cao từ 56px
const KIEM = `(()=>{const W=innerWidth,H=innerHeight,x=[];const d=document.documentElement;
  if(d.scrollHeight>H+1||d.scrollWidth>W+1) x.push('trang cuộn được '+d.scrollWidth+'x'+d.scrollHeight);
  const t=document.querySelector('#app .than'); if(t&&!t.classList.contains('cuon')&&t.scrollHeight>t.clientHeight+1) x.push('vùng nội dung tràn '+t.scrollHeight+'>'+t.clientHeight);
  for(const e of document.querySelectorAll('#app *')){const r=e.getBoundingClientRect(); if(!r.width||!r.height||e.closest('.cuon')) continue;
    if(r.bottom>H+1||r.right>W+1||r.left<-1||r.top<-1){x.push('ra ngoài màn: '+(e.className||e.tagName)+' "'+e.textContent.trim().slice(0,30)+'"');break;}}
  for(const e of document.querySelectorAll('#app .btn,#app .chieu,#app .viec,#app .lua-chon,#app .the,#app .cau-noi,#app .bong,#app .loi,#app .tinh-huong,#app .cau,#app .phan,#app .o-bai,#app .tin,#app .cap-ds,#app .viec-ds,#app .the-khung,#app .goi,#app .chan')){
    if(!e.getClientRects().length) continue; if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1) x.push('chữ tràn trong ô: "'+e.textContent.trim().slice(0,36)+'"');}
  if(document.querySelector('#app.lg')) for(const e of document.querySelectorAll('#app button')){const r=e.getBoundingClientRect(); if(r.height&&!e.disabled&&r.height<55.5) x.push('nút thấp '+Math.round(r.height)+'px: "'+(e.textContent.trim()||e.getAttribute('aria-label'))+'"');}
  for(const i of document.querySelectorAll('#app i.ic')) if(i.title&&i.title.indexOf('thiếu icon')===0) x.push(i.title);
  for(const im of document.querySelectorAll('#app img')) if(im.complete&&!im.naturalWidth) x.push('ảnh không hiện: '+im.getAttribute('src'));
  return x;})()`;
let sttMong = 0;
async function kiem(ten, chup) { await sleep(430);       // chờ hết chuyển động (rung, trượt) rồi mới soát
  if (sttMong) { const so = await ev(`(((document.querySelector('#app .thanh')||{}).textContent||'').match(/Bài [0-9]+/g)||[])`); ghi(so.every(x => x === 'Bài ' + sttMong), 'số bài trên màn ' + ten + ' là số hiển thị', J(so)); }
  const x = await ev(KIEM); soMan++; ghi(!x.length, 'bố cục màn ' + ten, x.join(' | ')); if (chup) await anh(ten); }
async function quaKhung(ten) { for (let q = 0; q < 8 && (await tt()).man === ten; q++) { await bam('Tiếp'); await sleep(90); } }
async function mo(url, w, h) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await c.send('Page.navigate', { url: GOC + url }); await cho('!!window.__hoc && window.__hoc.man', 10000, 'trang mở ' + url); await sleep(150);
}

/* ---------- gợi ý ba bước ---------- */
async function thuGoiY(bt, xemDapAn) {
  if (!bt.goi_y || !bt.goi_y.length) return;
  await bam('Gợi ý'); await cho(`!!document.querySelector('.to-goi-y')`, 3000, 'ô gợi ý mở');
  for (let k = 1; k <= bt.goi_y.length; k++) {
    const n = await ev(`document.querySelectorAll('.to-goi-y .buoc:not(.dap)').length`);
    ghi(n === k, `gợi ý mở dần: bước ${k}`, 'đang hiện ' + n + ' bước');
    const chu = await ev(`[...document.querySelectorAll('.to-goi-y .buoc')].map(e=>e.textContent).join('|')`);
    ghi(chu.includes(bt.goi_y[k - 1].chu), `gợi ý bước ${k} đúng chữ`);
    if (k < bt.goi_y.length) { ghi(!(await coNut('Xem đáp án')), 'chưa đủ ba bước thì chưa có nút Xem đáp án'); await bam('Gợi ý tiếp'); await sleep(80); }
  }
  await sleep(320); await kiem('goi-y', bt.ma === 'B6' || bt.ma === 'B1');
  if (xemDapAn) { await bam('Xem đáp án'); await sleep(100); ghi(await ev(`!!document.querySelector('.to-goi-y .buoc.dap')`), 'đáp án hiện sau khi bấm Xem đáp án'); await kiem('dap-an', true); }
  await bam('Đóng'); await sleep(120);
}

/* ---------- người giải cho từng dạng bài ---------- */
const GIAI = {
  async 'that-hay-lua'(bt, lg, o) {
    const NUT = lg ? { 'lua': 'Khoan đã', 'can-kiem-tra': 'Khoan đã', 'binh-thuong': 'Được' } : { 'lua': 'Lừa', 'can-kiem-tra': 'Cần kiểm tra', 'binh-thuong': 'Bình thường' };
    const SAI = lg ? { 'lua': 'Được', 'can-kiem-tra': 'Được', 'binh-thuong': 'Khoan đã' } : { 'lua': 'Bình thường', 'can-kiem-tra': 'Bình thường', 'binh-thuong': 'Lừa' };
    let daSai = false, daGoiY = false;
    for (let i = 0; i < bt.the.length; i++) {
      await choPha('the:' + i); const chu = await ev(`document.querySelector('.the .chu').textContent`); const t = bt.the.find(x => x.chu === chu);
      if (!ghi(!!t, 'thẻ ' + (i + 1) + ' có trong tệp nội dung', chu)) return;
      if (i < 2) ghi(!!t.mau === true, 'hai thẻ đầu là mẫu');
      if (t.mau) { await bam('Tiếp'); await cho(`!!document.querySelector('.the .dau')`, 3000, 'thẻ mẫu hiện đáp án'); await cho(`window.__hoc.noi===${J(t.giai_thich.chu)}`, 4000, 'Bé Nai giải thích thẻ mẫu'); if (i === 0) await kiem('b2-mau', true); await bam('Tiếp'); continue; }
      if (!daGoiY) { daGoiY = true; await thuGoiY(bt, false); }
      if (!daSai) {
        daSai = true; await bam(SAI[t.dap_an]); await choPha('sai:' + i);
        await cho(`window.__hoc.noi===${J(t.giai_thich.chu)}`, 15000, 'bấm sai thì Bé Nai giải thích'); await kiem('b2-sai', true);
        ghi(!(await ev(`!!document.querySelector('.the .dau')`)), 'bấm sai chưa lộ đáp án trên thẻ, còn làm lại được');
      } else if (i === 2) await kiem('b2-the', true);
      await bam(NUT[t.dap_an]); await choPha('dung:' + i); await cho(`!!document.querySelector('.the .dau')`, 3000, 'thẻ đóng dấu khi đúng');
      await cho(`window.__hoc.noi===${J(t.giai_thich.chu)}`, 15000, 'bấm đúng thì Bé Nai giải thích'); await kiem('b2-dung', i === 3); await bam('Tiếp');
    }
  },
  async 'nghe-bam-dung'(bt, lg, o) {
    await choPha('mo'); await kiem('b6-mo-dau', true);
    await bam('Nghe Bé Nai làm mẫu'); await choPha('mau'); await kiem('b6-mau');
    await choPha('mau-xong', 40000); ghi(await ev(`document.querySelector('.goi .nhan-cau.do').textContent.trim()===${J(bt.mau.cau[bt.mau.cau.length - 1].dau_hieu.ten)}`), 'lượt mẫu: Bé Nai bấm Dừng ở dấu hiệu'); await kiem('b6-mau-xong', true);
    const dangCau = k => `window.__hoc.pha==='luot' && document.querySelector('.goi .cau').textContent.includes(${J(bt.cau[k].chu)})`;
    // lượt 1: bấm Dừng ngay ở câu chào → an toàn, không có sao, bài vẫn xong
    await bam('Tới lượt ' + (lg ? 'bà' : 'bạn')); await cho(dangCau(0), 30000, 'cuộc gọi tới câu 1'); await kiem('b6-dang-nghe', true);
    await bam('DỪNG'); await choPha('som'); let s = await tt();
    ghi(s.ketQua && s.ketQua.dat === true && s.ketQua.sao === 0, 'dừng trước dấu hiệu: an toàn, bài xong, chưa có sao', J(s.ketQua)); await kiem('b6-som', true);
    await thuGoiY(bt, false);
    // lượt 2: không bấm gì → Bé Nai nhắc, cho nghe lại
    await bam('Nghe lượt nữa'); await choPha('het', 60000); await kiem('b6-het', true);
    // lượt 3: dừng ở câu có dấu hiệu thứ hai → 2 sao, chọn nhầm câu xác nhận thì Bé Nai nhắc lại
    const co = bt.cau.map((x, k) => x.dau_hieu ? k : -1).filter(k => k >= 0);
    await bam('Nghe lại'); await cho(dangCau(co[1]), 60000, 'cuộc gọi tới câu ' + (co[1] + 1)); await sleep(60);
    await cho(`document.querySelector('audio')===null && window.__hoc.dangNoi`, 2000, 'đang phát');
    await sleep(Math.max(120, (bt.cau[co[1]].dau_hieu.luc || 0) * 1000 / TOC + 150));
    await bam('DỪNG'); await choPha('hoi'); await kiem('b6-hoi', true);
    const d2 = bt.cau[co[1]].dau_hieu; await bam(d2.nhieu); await choPha('xong'); s = await tt();
    ghi(s.xacNhan === false && s.ketQua.sao === d2.sao, 'dừng ở dấu hiệu thứ hai: ' + d2.sao + ' sao', J(s.ketQua)); await cho(`window.__hoc.noi===${J(d2.nhac.chu)}`, 5000, 'chọn nhầm thì Bé Nai nhắc lại điều vừa nghe'); await kiem('b6-ket-2', true);
    // lượt 4: dừng ngay sau dấu hiệu đầu → 3 sao
    await bam('Nghe lại để được 3 sao'); await cho(dangCau(co[0]), 60000, 'cuộc gọi tới câu ' + (co[0] + 1));
    await sleep(Math.max(120, (bt.cau[co[0]].dau_hieu.luc || 0) * 1000 / TOC + 150));
    await bam('DỪNG'); await choPha('hoi'); const d1 = bt.cau[co[0]].dau_hieu; await bam(d1.ten); await choPha('xong'); s = await tt();
    ghi(s.xacNhan === true && s.ketQua.sao === 3 && s.ketQua.dat === true, 'dừng ngay sau dấu hiệu đầu: 3 sao, đạt', J(s.ketQua));
    ghi(await ev(`document.querySelectorAll('.ds-chieu div').length`) === co.length, 'màn kết liệt kê đủ các chiêu của cuộc gọi'); await kiem('b6-ket-3', true);
    if (bt.cau[co[0]].dau_hieu.luc > 0.2) {      // bấm trước mốc dấu hiệu của chính câu đó → vẫn coi là dừng sớm
      await bam('Nghe lượt nữa'); await cho(`['chuan-bi','luot'].includes(window.__hoc.pha)`, 5000, 'bắt đầu nghe lại');
      await bam('Gợi ý'); await cho(`window.__hoc.pha==='tam'`, 3000, 'mở gợi ý thì cuộc gọi tạm dừng'); await bam('Đóng'); await sleep(80);
      ghi(await coNut('Nghe lại từ đầu') && (await coNut('Bài luyện tiếp') || await coNut('Tới thử thách')), 'đóng gợi ý giữa lượt nghe lại: có nút nghe tiếp và nút đi tiếp, không kẹt ở DỪNG'); await kiem('b6-tam', true);
      await bam('Nghe lại từ đầu'); await cho(dangCau(co[0]), 60000, 'cuộc gọi tới câu ' + (co[0] + 1)); await bam('DỪNG'); await sleep(80); s = await tt();
      ghi(s.pha === 'som', 'bấm trước khi dấu hiệu kịp vang lên: coi là dừng sớm', J(s.dungO) + ' pha ' + s.pha);
      const luu = JSON.parse(await ev(`localStorage.getItem('lcs-hoc-v1')`)).bai[String(await ev('window.__hoc.bai'))].b[0];
      ghi(luu.sao === 3 && luu.dat === true, 'kết quả tốt nhất của bài luyện được giữ lại', J(luu));
      await bam('Qua bài sau'); return 'da-qua';
    }
  },
  async 'cham-bat-bai'(bt, lg, o) {
    await choPha('lam'); const D = bt.tin.doan, can = D.filter(d => d.loai === 'dau-hieu' && !d.mau), nhieu = D.filter(d => d.loai === 'nhieu');
    ghi(D.filter(d => d.mau).length === 2, 'B1 có hai chỗ mẫu tô sẵn'); await kiem('b1-dau', true);
    ghi(await ev(`document.querySelectorAll('.doan.bat,.doan.hien').length`) === 2, 'chỉ hai chỗ mẫu được tô lúc đầu');
    await bam(nhieu[0].chu); await choPha('nham:1'); await cho(`window.__hoc.noi===${J(nhieu[0].giai_thich.chu)}`, 4000, 'chạm nhầm thì Bé Nai giải thích'); await kiem('b1-nham', true);
    await bam(nhieu[0].chu); await sleep(80); ghi((await tt()).pha === 'nham:1', 'chạm lại đúng chỗ nhầm cũ không bị đếm thêm', (await tt()).pha);
    await thuGoiY(bt, !!o.xem);
    if (o.xem) { const s = await tt(); ghi(s.pha === 'xong' && s.ketQua.dat === false, 'xem đáp án rồi thì bài không tính là đạt', J(s.ketQua)); ghi(await coNut('Làm lại để đạt'), 'có nút làm lại'); await kiem('b1-da-xem', true); await bam('Làm lại để đạt'); await choPha('lam'); }
    for (let k = 0; k < can.length; k++) { await bam(can[k].chu); if (k < can.length - 1) { await choPha('bat:' + (k + 1)); await cho(`window.__hoc.noi===${J(can[k].giai_thich.chu)}`, 4000, 'chạm đúng thì Bé Nai giải thích'); if (k === 1) await kiem('b1-giua', true); } }
    await choPha('xong'); const s = await tt(); ghi(s.ketQua.dat === true, 'B1 tìm đủ thì đạt', J(s.ketQua)); await kiem('b1-xong', true);
  },
  async 'noi-chieu'(bt, lg, o) {
    await choPha('mau'); ghi(bt.cap.filter(x => x.mau).length === 2, 'B4 có hai cặp mẫu'); await kiem('b4-mau', true);
    await bam('Tới lượt ' + (lg ? 'bà' : 'bạn')); await choPha('lam'); await kiem('b4-lam', true);
    const lam = bt.cap.filter(x => !x.mau), nhieu = bt.chieu.find(t => t.nhieu);
    const thuTu = await ev(`[...document.querySelectorAll('.chieu')].map(e=>e.textContent.trim())`);
    ghi(thuTu.length === lam.length + 1 && thuTu.includes(nhieu.ten), 'có đủ tên chiêu và một tên gây nhiễu', J(thuTu));
    await bam(lam[0].chu); await bam(nhieu.ten); await choPha('sai:1');
    ghi((await ev(`document.querySelector('.dong-tt').textContent`)).includes(nhieu.khong_phai), 'nối nhầm thì có dòng giải thích vì sao chưa khớp'); await kiem('b4-sai', true);
    await thuGoiY(bt, false);
    for (let k = 0; k < lam.length; k++) { await bam(lam[k].chu); await bam(lam[k].chieu); if (k < lam.length - 1) { await choPha('dung:' + (k + 1)); if (k === 0) await kiem('b4-dung', true); } }
    await choPha('xong'); const s = await tt(); ghi(s.ketQua.dat === true, 'B4 nối đủ thì đạt', J(s.ketQua)); await kiem('b4-xong', true);
  },
  async 'viec-nao-truoc'(bt, lg, o) {
    await choPha('mau'); ghi(bt.mau.viec.length === 2, 'B5 có lượt mẫu hai việc'); await kiem('b5-mau', true);
    await bam('Tới lượt ' + (lg ? 'bà' : 'bạn')); await choPha('lam'); await kiem('b5-lam', true);
    const V = bt.viec, chiChon = V.some(v => v.dung) || !V.some(v => v.toi_da || v.toi_thieu), toiLuot = 'Tới lượt ' + (lg ? 'bà' : 'bạn');
    const lamLai = async () => { ghi((await tt()).ketQua.dat === false && await coNut('Làm lại để đạt'), 'sai quá mức cho phép: xong nhưng chưa đạt, có nút làm lại', J((await tt()).ketQua)); await kiem('b5-chua-dat', true);
      await bam('Làm lại để đạt'); await choPha('mau'); await bam(toiLuot); await choPha('lam'); };
    if (chiChon) {
      const dung = V.find(v => v.dung) || V.find(v => v.toi_da), sai = V.find(v => v !== dung && !(v.toi_da && !V.some(x => x.dung)));
      await bam(sai.chu); await choPha('sai'); const gt = (sai.giai_thich || sai.sai || bt.sai || {}).chu;
      if (gt) await cho(`window.__hoc.noi===${J(gt)}`, 4000, 'chọn sai thì Bé Nai giải thích'); await kiem('b5-sai', true);
      await thuGoiY(bt, false);
      await bam(dung.chu); await choPha('xong');
      await lamLai(); await bam(dung.chu); await choPha('xong');           // chọn đúng ngay lần đầu thì mới đạt
    } else {
      const cuoi = V.find(v => v.toi_thieu), dau = V.find(v => v.toi_da), con = V.filter(v => v !== cuoi && v !== dau);
      ghi(!(await ev(`[...document.querySelectorAll('#app .chan button')].find(e=>e.textContent.trim()==='Kiểm tra').disabled`)) === false, 'chưa xếp đủ thì chưa kiểm tra được');
      for (const v of [cuoi, dau, ...con]) await bam(v.chu);
      await kiem('b5-da-xep', true); await bam('Kiểm tra'); await choPha('sai'); await cho(`window.__hoc.noi===${J(cuoi.sai.chu)}`, 4000, 'xếp sai thì Bé Nai giải thích đúng chỗ sai'); await kiem('b5-sai', true);
      await thuGoiY(bt, false);
      await bam('Xếp lại'); for (const v of [...con, dau, cuoi]) await bam(v.chu);
      await bam('Kiểm tra'); await choPha('sai'); await cho(`window.__hoc.noi===${J(dau.sai.chu)}`, 4000, 'việc gấp bị để sau thì Bé Nai nhắc');
      await bam('Xếp lại'); for (const v of [con[0], dau, ...con.slice(1), cuoi]) await bam(v.chu);       // một thứ tự hợp lệ khác với thứ tự gợi ý
      await bam('Kiểm tra'); await choPha('xong');
      await lamLai(); for (const v of [con[0], dau, ...con.slice(1), cuoi]) await bam(v.chu);   // kiểm sai hai lần ở lượt trước nên phải làm lại
      await bam('Kiểm tra'); await choPha('xong');
      ghi(await ev(`document.querySelectorAll('.viec.dung .vi').length`) === V.filter(v => v.vi_sao).length, 'sau khi đạt hiện thứ tự gợi ý kèm lý do');
    }
    const s = await tt(); ghi(s.ketQua.dat === true, 'B5 làm đúng thì đạt', J(s.ketQua)); await kiem('b5-xong', true);
  }
};

/* ---------- chơi trọn một bài ---------- */
let TOC = 6;
async function choiBai(B, w, h, o) {
  const lg = B.che_do === 'don-gian', T = B.thu_thach; nhan.bai = B.so; sttMong = B.stt;
  await mo(`hoc.html?bai=${B.so}&toc=${TOC}`, w, h); await ev(`localStorage.clear()`); await mo(`hoc.html?bai=${B.so}&toc=${TOC}`, w, h);
  await choMan('bia'); ghi((await ev(`document.querySelector('#app').classList.contains('lg')`)) === lg, 'chế độ chữ lớn đúng theo bài'); await kiem('bia', true);
  ghi((await ev(`document.querySelector('.thanh .tt b').textContent`)) === 'Bài ' + B.stt, 'bìa hiện số bài theo vị trí phát hành (Bài ' + B.stt + ')');
  await bam('Bắt đầu');
  // A. truyện
  for (let k = 0; k < B.truyen.length; k++) {
    await choMan('truyen:' + k); const cuoi = B.truyen[k].loi[B.truyen[k].loi.length - 1].chu;
    if (k === 0) { await cho(`window.__hoc.dangNoi===true`, 4000, 'giọng kể tự phát'); await kiem('truyen-1', true); }
    if (B.truyen[k].re) {
      await cho(`window.__hoc.pha==='re'`, 60000, 'tới điểm rẽ sau khi kể xong');
      ghi(await ev(`document.querySelectorAll('#app .lua-chon').length`) === 2, 'điểm rẽ có đúng hai lựa chọn');
      if (B.truyen[k].re.some(r => r.giong)) ghi(await cho(`!!document.querySelector('#app .lua-chon.doc')`, 8000, 'Bé Nai đọc lựa chọn'), 'điểm rẽ: Bé Nai đọc to từng lựa chọn');
      await kiem('diem-re', true);
      const sai = B.truyen[k].re.find(r => r.toi === 'ngo-cut'), dung = B.truyen[k].re.find(r => r.toi === 'an-toan');
      await bam(sai.chu); await choMan('truyen:ngo-cut'); await kiem('ngo-cut', true); await cho(`window.__hoc.pha==='het-loi'`, 60000, 'kể xong ngõ cụt'); await bam('Quay lại điểm rẽ');
      await choMan('truyen:' + k); await choPha('re'); await bam(dung.chu); await choMan('truyen:an-toan'); await kiem('an-toan', true); await quaKhung('truyen:an-toan');
    } else {
      if (k === 0) {        // kể xong tự sang khung kế, cả hai chế độ (chữ lớn chờ lâu hơn); trước khi sang phải hiện đủ lời của khung
        await cho(`window.__hoc.pha==='het-loi' && document.querySelector('.loi .chu').textContent===${J(cuoi)}`, 90000, 'kể hết lời khung 1');
        ghi(await choMan('truyen:1', 8000), 'kể xong khung 1 thì tự sang khung 2, không cần bấm Tiếp'); continue;
      }
      await kiem('truyen-' + (k + 1), k === 2);
      if (k === 1) { await bam('Tiếp'); await sleep(90); const s1 = await tt(); ghi(s1.man === 'truyen:1' && s1.cau === 1, 'bấm Tiếp giữa chừng chỉ sang câu kế, không bỏ qua lời của khung', J([s1.man, s1.cau])); }
      await quaKhung('truyen:' + k);
    }
  }
  await choMan('on-lai'); ghi(await ev(`document.querySelectorAll('.chip.dh').length`) === B.dau_hieu.length, 'màn ôn lại hiện đủ dấu hiệu'); await kiem('on-lai', true);
  ghi((await ev(`JSON.parse(localStorage.getItem('lcs-hoc-v1')).bai[${B.so}].a`)) === true, 'xem xong truyện được ghi lại');
  await bam('Vào phần luyện');
  // B. luyện
  for (let i = 0; i < B.luyen.length; i++) {
    const bt = B.luyen[i]; await choMan('luyen:' + i);
    ghi(!!GIAI[bt.dang], 'có người giải cho dạng ' + bt.dang); if (!GIAI[bt.dang]) return;
    const kq = await GIAI[bt.dang](bt, lg, o || {});
    if (kq !== 'da-qua') await bam(i + 1 < B.luyen.length ? 'Bài luyện tiếp' : 'Tới thử thách');
  }
  // C. thử thách: chuyển sang cuộc gọi video rồi quay về có điểm
  await choMan('thu-thach'); await kiem('thu-thach', true);
  if (T.goi_y) { await bam('Gợi ý'); await sleep(100); ghi(!(await coNut('Xem đáp án')), 'gợi ý thử thách không có đáp án'); await bam('Gợi ý tiếp'); await bam('Gợi ý tiếp'); await sleep(320); await kiem('thu-thach-goi-y', true); await bam('Đóng'); }
  await ev(`window.__hocChan=u=>{window.__di=u}`); await bam('Nghe máy');
  const di = await ev('window.__di'), mong = `video-call.html?canh=${T.canh}&ve=${encodeURIComponent(`hoc.html?bai=${B.so}&sau=goi`)}`;
  ghi(di === mong, 'địa chỉ chuyển sang cuộc gọi video', di + ' ≠ ' + mong);
  const ve = new URLSearchParams(di.split('?')[1]).get('ve'), khoa = J('lcs-goi-' + T.canh), n = T.y.length;
  // giả lập trang gọi: gt = biểu thức JS cho giá trị trang gọi ghi lại (null = bỏ dở, không ghi gì); goi = có bấm "Nghe máy" trước không
  const veTuGoi = async (gt, goi = true) => {
    if (goi) { await mo(`hoc.html?bai=${B.so}&phan=c&toc=${TOC}`, w, h); await choMan('thu-thach'); await ev(`window.__hocChan=u=>{window.__di=u}`); await bam('Nghe máy'); }
    await ev(gt == null ? `localStorage.removeItem(${khoa})` : `localStorage.setItem(${khoa}, ${gt})`);
    await mo(ve + `&toc=${TOC}`, w, h); await choMan('ket-qua'); return (await tt()).pha;
  };
  ghi(await veTuGoi(null, false) === 'bo', 'bỏ dở cuộc gọi: màn kết báo chưa có điểm'); await kiem('ket-qua-bo-do', true);
  ghi(await veTuGoi(`JSON.stringify({diem:${n},tong:${n},luc:1000})`) === 'bo', 'điểm của cuộc gọi cũ (ghi trước lúc bấm gọi) không được tính');
  ghi(await veTuGoi(`'{hỏng'`) === 'bo', 'khóa điểm hỏng thì coi như bỏ dở, trang không vỡ');
  ghi(await veTuGoi(`JSON.stringify({diem:${n},tong:${n},luc:Date.now()})`, false) === 'bo', 'không bấm "Nghe máy" mà mở thẳng địa chỉ quay về thì không được điểm');
  ghi(await veTuGoi(`JSON.stringify({diem:0,tong:${n},luc:Date.now()})`) === 'thieu' && (await tt()).noi === T.ket.khong.chu, 'không được ý nào: Bé Nai nói câu riêng');
  ghi(await veTuGoi(`JSON.stringify({diem:1,tong:${n},luc:Date.now()})`) === 'thieu', 'cuộc gọi thiếu ý');
  ghi((await ev(`document.querySelector('.diem-to').textContent`)).startsWith(`1/${n} ý`), 'màn kết quả hiện điểm cuộc gọi (thiếu ý)'); await kiem('ket-qua-thieu', true);
  await mo(ve + `&toc=${TOC}`, w, h); await choMan('ket-qua'); ghi((await tt()).pha === 'bo', 'mở lại địa chỉ quay về lần nữa: điểm không được nhận lại');
  ghi(await veTuGoi(`JSON.stringify({diem:40,tong:50,luc:Date.now()})`) === 'bo', 'bản ghi vượt tổng (sai hợp đồng) không được nhận');
  ghi(await veTuGoi(`JSON.stringify({diem:0.5,tong:${J(String(n))},luc:Date.now()})`) === 'bo', 'bản ghi sai kiểu (điểm lẻ, tổng là chữ) không được nhận');
  ghi(await veTuGoi(`JSON.stringify({diem:${n},tong:${n}})`) === 'bo', 'bản ghi thiếu mốc luc không được nhận');
  ghi(await veTuGoi(`JSON.stringify({diem:${n},tong:${n},luc:Date.now()})`) === 'du', 'cuộc gọi đủ ý');
  ghi((await ev(`document.querySelector('.diem-to').textContent`)).startsWith(`${n}/${n} ý · +${n * 10} điểm`), 'điểm không vượt quá số ý của bài, mỗi ý mười điểm', await ev(`document.querySelector('.diem-to').textContent`)); await kiem('ket-qua-du', true);
  ghi(await veTuGoi(`JSON.stringify({diem:0,tong:${n},luc:Date.now()})`) === 'thieu', 'gọi lại được điểm thấp hơn');
  const kho = JSON.parse(await ev(`localStorage.getItem('lcs-hoc-v1')`)).bai[B.so];
  ghi(kho.a && kho.b.length === B.luyen.length && kho.b.every(x => x.dat) && kho.c_tot.diem === T.y.length && kho.c.diem === 0, 'tiến độ lưu đủ ba phần, giữ điểm cuộc gọi tốt nhất', J(kho));
  ghi(await ev(`document.querySelectorAll('#app .card.solid-navy .sao .ic.co').length`) === 3, 'đủ ba phần thì ba sao');
  sttMong = 0; await bam('Về thư viện'); await choMan('thu-vien'); await kiem('thu-vien', true);
}

let ma = 0;
try {
  for (let k = 0; k < 80; k++) { try { await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(150); } }
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
  c = await cdp(t.webSocketDebuggerUrl); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  const DS = JSON.parse(readFileSync(path.join(ROOT, 'prototype/hoc/danh-sach.json'), 'utf8')), ML = { bai: DS.phat_hanh.filter(b => b.mo !== false) };
  ML.bai.forEach((b, i) => { b.stt = i + 1; });
  const chon = arg('--bai') ? arg('--bai').split(',').map(Number) : ML.bai.map(b => b.so);
  const BAI = ML.bai.filter(b => chon.includes(b.so)).map(b => Object.assign(JSON.parse(readFileSync(path.join(ROOT, 'prototype', b.tep), 'utf8')), { stt: b.stt }));
  const MAY = co('--nhanh') ? [[360, 740]] : [[393, 873], [360, 740]];
  for (const [w, h] of MAY) {
    nhan.vp = w + 'x' + h; console.log('== Cỡ máy', nhan.vp);
    for (const B of BAI) { const t0 = Date.now(), truoc = hong; console.log('  Bài', B.so, '·', B.ten); await choiBai(B, w, h, { xem: w === 360 }); console.log('   ', hong === truoc ? '✓ chơi trọn bài' : '✗ có lỗi', Math.round((Date.now() - t0) / 1000) + ' giây'); }
    // các biến thể và đường vào khác
    nhan.bai = 'khác';
    await mo('hoc.html?toc=' + TOC, w, h); await choMan('thu-vien'); ghi(await ev(`document.querySelectorAll('.o-bai').length`) === ML.bai.length, 'thư viện liệt kê đủ bài'); await kiem('thu-vien-day', true);
    const soHien = await ev(`[...document.querySelectorAll('.o-bai .ten')].map(e=>parseInt(e.textContent.replace('Bài ',''),10))`);
    ghi(J(soHien) === J(ML.bai.map((_, i) => i + 1)), 'số bài hiển thị chạy liên tục từ 1, không lặp, không hở', J(soHien));
    const chu = await ev(`document.querySelector('#app').textContent`), lo = ML.bai.map(b => b.so).filter(so => so > ML.bai.length && chu.includes('Bài ' + so));
    ghi(!lo.length, 'thư viện không lộ mã nội bộ của bài', 'thấy Bài ' + lo.join(', '));
    // ?kieu=: mã của kịch bản, mã của máy chủ (gạch dưới), mã chưa có bài, mã lạ, rỗng
    for (const [kieu, soMong] of [['dau-tu-lai-cao', 9], ['gia_danh_cong_an', 1], ['viec_nhe_luong_cao', 2], ['nguoi_than_tai_nan', 3], ['gia-danh-co-quan', 1], [' Gia_Danh_Cong_An ', 1]]) {
      if (!chon.includes(soMong)) continue;
      await mo('hoc.html?kieu=' + encodeURIComponent(kieu) + '&im=1', w, h); const s1 = await tt(); ghi(s1.man === 'bia' && s1.bai === soMong, `kieu=${kieu.trim()} mở đúng bài (mã nội bộ ${soMong})`, J([s1.man, s1.bai]));
    }
    for (const kieu of ['duong_dan_gia', 'gia_dien_luc', 'qua_tri_an', 'khac', 'khong-co', '', '<img src=x onerror=window.__xss=1>']) {
      await mo('hoc.html?kieu=' + encodeURIComponent(kieu) + '&im=1', w, h); const s1 = await tt();
      ghi(s1.man === 'thu-vien' && await ev(`document.querySelectorAll('.o-bai').length`) === ML.bai.length && !(await ev(`!!document.querySelector('.thong-bao')`)) && !(await ev('!!window.__xss')) && !(await ev(`document.querySelector('#app').innerHTML`)).includes('onerror'), `kieu=${kieu || '(rỗng)'} chưa có bài: mở thư viện, không báo lỗi, không chèn giá trị vào trang`);
    }
    await mo('hoc.html?bai=77&im=1', w, h); ghi((await tt()).man === 'thu-vien', 'bai= lạ: về thư viện');
    if (chon.includes(1)) {         // B2 bản đầy đủ: ba nút và vuốt thẻ
      const bt = BAI.find(b => b.so === 1).luyen.find(x => x.dang === 'that-hay-lua');
      await mo('hoc.html?bai=1&phan=b2&che_do=day-du&im=1', w, h); await choPha('the:0'); await bam('Tiếp'); await bam('Tiếp'); await choPha('the:1'); await bam('Tiếp'); await bam('Tiếp'); await choPha('the:2');
      ghi(await coNut('Lừa') && await coNut('Cần kiểm tra') && await coNut('Bình thường'), 'B2 bản đầy đủ có ba nút'); await kiem('b2-day-du', true);
      const chu = await ev(`document.querySelector('.the .chu').textContent`), td = bt.the.find(x => x.chu === chu), r = await ev(`(()=>{const e=document.querySelector('.the').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]})()`);
      const dx = td.dap_an === 'binh-thuong' ? 130 : -130;
      for (const [loai, x] of [['mousePressed', r[0]], ['mouseMoved', r[0] + dx / 2], ['mouseMoved', r[0] + dx], ['mouseReleased', r[0] + dx]]) await c.send('Input.dispatchMouseEvent', { type: loai, x, y: r[1], button: 'left', buttons: loai === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
      await choPha('dung:2', 4000); ghi((await tt()).pha === 'dung:2', 'B2 bản đầy đủ: vuốt thẻ đúng hướng thì được tính');
      if (td.dap_an === 'lua') { /* đã vuốt trái */ }
    }
    if (chon.includes(9)) {         // B5 bản chữ lớn trên dữ liệu xếp thứ tự: vẫn xếp đủ bốn việc (cùng yêu cầu để đạt), xưng "bạn" theo bài
      await mo('hoc.html?bai=9&phan=b2&che_do=don-gian&im=1', w, h); await choPha('mau'); await bam('Tới lượt bạn'); await choPha('lam');
      ghi(await coNut('Kiểm tra'), 'B5 chữ lớn trên dữ liệu xếp thứ tự vẫn phải xếp, có nút Kiểm tra'); await kiem('b5-chu-lon', true);
      const bt = BAI.find(b => b.so === 9).luyen.find(x => x.dang === 'viec-nao-truoc'), V = bt.viec, cuoi = V.find(v => v.toi_thieu), dau = V.find(v => v.toi_da);
      for (const v of [dau, ...V.filter(v => v !== dau && v !== cuoi), cuoi]) await bam(v.chu);
      await bam('Kiểm tra'); await choPha('xong'); ghi((await tt()).ketQua.dat === true, 'B5 chữ lớn: xếp đúng thì đạt');
    }
    if (chon.includes(1)) {         // tiến độ cũ có điểm vượt trần: thư viện không cộng điểm đó
      await mo('hoc.html?im=1', w, h); await ev(`localStorage.setItem('lcs-hoc-v1', JSON.stringify({bai:{1:{c_tot:{diem:40,tong:50},c:{diem:40,tong:50},b:[{xong:false,dat:true},{xong:false,dat:true}]}}}))`);
      await mo('hoc.html?im=1', w, h); await choMan('thu-vien');
      ghi((await ev(`document.querySelector('#app .card.solid-navy').textContent`)).includes('0/' + ML.bai.length * 3 + ' sao · 0 điểm'), 'tiến độ hỏng (điểm vượt trần, đạt mà chưa xong) không được tính', await ev(`document.querySelector('#app .card.solid-navy').textContent`));
      await ev(`localStorage.clear()`);
    }
    if (chon.includes(2)) {         // B1 bản chữ lớn
      await mo('hoc.html?bai=2&phan=b1&che_do=don-gian&im=1', w, h); await choPha('lam'); await kiem('b1-chu-lon', true);
    }
  }
  // hợp đồng với trang gọi video: cảnh có tồn tại và số ý được chấm khớp với bài (chỉ đọc tệp của phần kia, không sửa)
  nhan.vp = 'hợp đồng';
  for (const B of BAI) {
    nhan.bai = B.so; const f = path.join(ROOT, 'prototype/canh', B.thu_thach.canh + '.json');
    if (!ghi(existsSync(f), 'có tệp cảnh gọi video ' + B.thu_thach.canh)) continue;
    const C = JSON.parse(readFileSync(f, 'utf8')); ghi(Array.isArray(C.y) && C.y.length === B.thu_thach.y.length, 'số ý được chấm của cảnh ' + B.thu_thach.canh + ' khớp với bài', (C.y || []).length + ' ≠ ' + B.thu_thach.y.length);
  }
  // tệp giọng: có trên đĩa và trình duyệt giải mã được
  nhan.vp = 'tiếng'; nhan.bai = '-'; let soTiep = 0, thieu = [];
  for (const B of BAI) {
    const ds = new Set(); (function duyet(o) { if (Array.isArray(o)) o.forEach(duyet); else if (o && typeof o === 'object') { if (typeof o.giong === 'string') ds.add(o.giong); Object.values(o).forEach(duyet); } })(B);
    for (const g of ds) {
      soTiep++; if (!existsSync(path.join(ROOT, 'prototype', g))) { thieu.push(g); continue; }
      const giay = await ev(`(async()=>{try{const b=await (await fetch(${J(g)})).arrayBuffer();const a=new (window.AudioContext||window.webkitAudioContext)();const d=await a.decodeAudioData(b);a.close();return d.duration;}catch(e){return -1}})()`);
      if (!(giay > 0.3)) thieu.push(g + ' (không giải mã được hoặc quá ngắn: ' + giay + ')');
    }
  }
  if (co('--khong-tieng')) console.log(`Tệp giọng: ${soTiep - thieu.length}/${soTiep} đã có (chưa coi thiếu là lỗi).`);
  else ghi(!thieu.length, `đủ ${soTiep} tệp giọng và giải mã được`, thieu.slice(0, 12).join(', ') + (thieu.length > 12 ? ` … (${thieu.length} tệp)` : ''));
  const bo = co('--khong-tieng') ? l => !/\.m4a/.test(l) && !/Failed to load resource/.test(l) : () => true;
  const log = [...new Set(c.logs)].filter(bo), k404 = [...new Set(khong404)].filter(x => !co('--khong-tieng') || !/\.m4a$/.test(x));
  nhan.vp = 'chung';
  ghi(!log.length, 'console sạch', log.slice(0, 8).join(' || ')); ghi(!k404.length, 'không có tệp 404', k404.slice(0, 10).join(', '));
  console.log(`\nĐạt ${dat}, lỗi ${hong} · ${soMan} lượt soát bố cục · ${soAnh} ảnh trong ${ANH}`);
  if (loi.length) console.log('Các lỗi:\n' + loi.map(x => ' - ' + x).join('\n'));
} catch (e) { console.error('LỖI KIỂM THỬ:', e.stack || e.message); ma = 1; }
finally { chrome.kill(); server.close(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(ma || (hong ? 1 : 0)); }
