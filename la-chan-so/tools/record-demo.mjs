// Quay video demo prototype "Lá chắn số" tự động (Chromium headless + CDP thuần + ffmpeg).
// Chạy:  node tools/record-demo.mjs [--scene all|hoa|vy|khoa|video] [--out export/video/demo.mp4] [--audio pulse|hook]
// Hình: Page.startScreencast → đẩy khung JPEG vào ffmpeg theo mốc thời gian (30 khung/giây đều).
// Tiếng: (1) null sink riêng "lcs_rec" + PULSE_SINK, thu lcs_rec.monitor; (2) dự phòng: ghi lại lúc trang phát file rồi trộn bằng ffmpeg.
// Không sửa file nào của prototype. Bước nào bấm/chờ hỏng thì ghi lại rồi nhảy bằng nav() và đi tiếp.
import { spawn, execFileSync } from 'node:child_process';
import { writeFile, rm, mkdir, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const SCENE = arg('scene', 'all');
const OUT = path.resolve(ROOT, arg('out', 'export/video/demo.mp4'));
const AUDIO_MODE = arg('audio', 'pulse');
const VW = +arg('vw', 1600), VH = +arg('vh', 900), DSF = +arg('dsf', 1.2), OW = 1920, OH = 1080, FPS = 30;
const SINK = 'lcs_rec';
let TMP = process.env.LCS_REC_TMP || '/tmp/claude-1000/-home-rin/8a757c30-917e-41c0-9736-02ecd2c83863/scratchpad/rec';
try { await mkdir(TMP, { recursive: true }); } catch { TMP = path.join(os.tmpdir(), 'lcs-rec'); await mkdir(TMP, { recursive: true }); }
await mkdir(path.dirname(OUT), { recursive: true });
const tag = path.basename(OUT, '.mp4');
const VID = path.join(TMP, tag + '.video.mp4'), AUD = path.join(TMP, tag + '.audio.mka'), LOGF = path.join(TMP, tag + '.log.json');

const PORT = 7100 + Math.floor(Math.random() * 800), DBG = 9600 + Math.floor(Math.random() * 300);
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable'].find(existsSync);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch (e) { return null; } };
const problems = [];   // bước hỏng / nhảy cóc
const J = JSON.stringify;

// ---------- Tiếng: null sink ----------
let moduleId = null, defSink0 = null, pulseOk = false;
function pulseSetup() {
  if (AUDIO_MODE !== 'pulse') return;
  if (!sh('pactl', ['info'])) { log('Không có PulseAudio/PipeWire → dùng cách 2'); return; }
  defSink0 = sh('pactl', ['get-default-sink']);
  // dọn module cũ còn sót của chính công cụ này
  for (const l of (sh('pactl', ['list', 'short', 'modules']) || '').split('\n')) if (l.includes('sink_name=' + SINK)) sh('pactl', ['unload-module', l.split('\t')[0]]);
  moduleId = sh('pactl', ['load-module', 'module-null-sink', 'sink_name=' + SINK, 'sink_properties=device.description=' + SINK]);
  if (!moduleId) { log('Không tạo được null sink → dùng cách 2'); return; }
  const d = sh('pactl', ['get-default-sink']);
  if (defSink0 && d !== defSink0) { log('Sink mặc định bị đổi thành', d, '→ trả lại', defSink0); sh('pactl', ['set-default-sink', defSink0]); }
  pulseOk = true; log('null sink', SINK, 'module', moduleId, '· sink mặc định giữ nguyên:', defSink0);
}
function pulseCleanup() {
  if (moduleId) { sh('pactl', ['unload-module', moduleId]); moduleId = null; }
  if (defSink0) { const d = sh('pactl', ['get-default-sink']); if (d && d !== defSink0) sh('pactl', ['set-default-sink', defSink0]); }
}
// nếu luồng tiếng của Chromium này lỡ ra loa thật thì chuyển nó về null sink (không đụng Chromium khác của người dùng)
function ppidOf(pid) { try { const s = execFileSync('cat', [`/proc/${pid}/stat`], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }); return +s.slice(s.lastIndexOf(')') + 2).split(' ')[1]; } catch { return 0; } }
function isOurs(pid, root) { for (let k = 0; k < 8 && pid > 1; k++) { if (pid === root) return true; pid = ppidOf(pid); } return false; }
let sinkSeen = false;
function guardSinkInputs(rootPid) {
  if (!pulseOk) return;
  let list; try { list = JSON.parse(sh('pactl', ['-f', 'json', 'list', 'sink-inputs']) || '[]'); } catch { return; }
  const sinks = (() => { try { return JSON.parse(sh('pactl', ['-f', 'json', 'list', 'short', 'sinks']) || '[]'); } catch { return []; } })();
  const ours = sinks.find(s => s.name === SINK); if (!ours) return;
  for (const si of list) {
    const pid = +(si.properties?.['application.process.id'] || 0);
    if (!pid || !isOurs(pid, rootPid)) continue;
    if (si.sink !== ours.index) { log('luồng tiếng', si.index, 'đang ở sink', si.sink, '→ chuyển về', SINK); sh('pactl', ['move-sink-input', String(si.index), SINK]); }
    else if (!sinkSeen) { sinkSeen = true; log('Chromium đang phát vào', SINK, '(đúng sink)'); }
  }
}

// ---------- Script chèn vào mọi frame: ghi mốc phát tiếng + chấm chỗ bấm ----------
const INJECT = `(()=>{
  const T=()=>Date.now(); let L; try{ L=top.__lcsAudio=top.__lcsAudio||[]; }catch(e){ L=window.__lcsAudio=[]; }
  const abs=u=>{ try{ return new URL(u,location.href).href; }catch(e){ return String(u); } };
  const P=HTMLMediaElement.prototype, play=P.play, pause=P.pause;
  P.play=function(){ if(this.__e&&!this.__e.end) this.__e.end=T(); const e={k:'media',t:T(),url:abs(this.getAttribute('src')||this.currentSrc||''),at:this.currentTime||0}; L.push(e); this.__e=e;
    this.addEventListener('ended',()=>{ if(!e.end) e.end=T(); },{once:true}); return play.apply(this,arguments); };
  P.pause=function(){ if(this.__e&&!this.__e.end&&!this.paused) this.__e.end=T(); return pause.apply(this,arguments); };
  const urls=new WeakMap(), f=window.fetch;
  if(f) window.fetch=function(i,o){ let u=''; try{ u=abs(typeof i==='string'?i:i.url); }catch(e){}
    return f.apply(this,arguments).then(r=>{ try{ const ab=r.arrayBuffer.bind(r); r.arrayBuffer=()=>ab().then(b=>{ urls.set(b,u); return b; }); }catch(e){} return r; }); };
  if(window.BaseAudioContext){ const d=BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData=function(b){ const u=urls.get(b); const p=d.apply(this,arguments); try{ p.then(buf=>{ if(u) urls.set(buf,u); },()=>{}); }catch(e){} return p; };
    const s=AudioBufferSourceNode.prototype.start, st=AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start=function(when,off){ if(!(window.OfflineAudioContext&&this.context instanceof OfflineAudioContext)){
        const e={k:'buf',t:T()+Math.max(0,((when||0)-this.context.currentTime))*1000*(when?1:0),url:(this.buffer&&urls.get(this.buffer))||null,dur:this.buffer?this.buffer.duration:0,at:off||0}; L.push(e); this.__e=e;
        this.addEventListener('ended',()=>{ if(!e.end) e.end=T(); }); }
      return s.apply(this,arguments); };
    AudioBufferSourceNode.prototype.stop=function(){ if(this.__e&&!this.__e.end) this.__e.end=T(); return st.apply(this,arguments); };
  }
  window.__recDot=(x,y)=>{ const D=top.document, d=D.createElement('div');
    d.style.cssText='position:fixed;left:'+x+'px;top:'+y+'px;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(29,78,216,.30);border:2.5px solid rgba(29,78,216,.85);box-shadow:0 0 0 6px rgba(29,78,216,.12);z-index:2147483647;pointer-events:none';
    D.body.appendChild(d); d.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1)',opacity:1,offset:.35},{transform:'scale(.82)',opacity:1,offset:.6},{transform:'scale(1.5)',opacity:0}],{duration:950,easing:'ease-out',fill:'forwards'}).onfinish=()=>d.remove(); };
  // toạ độ (trong trang ngoài) của phần tử; frame = iframe chứa nó (null nếu ở trang ngoài). Cuộn vào tầm nhìn nếu cần.
  window.__recPoint=async(el,frame)=>{ let r=el.getBoundingClientRect();
    if(frame){ const vh=frame.clientHeight; if(r.top<0||r.bottom>vh){ el.scrollIntoView({block:'center',behavior:'smooth'}); await new Promise(z=>setTimeout(z,550)); r=el.getBoundingClientRect(); }
      const fr=frame.getBoundingClientRect(), s=fr.width/(frame.offsetWidth||fr.width); const x=fr.left+(r.left+r.width/2)*s, y=fr.top+(r.top+r.height/2)*s; top.__recDot(x,y); return {x,y}; }
    const x=r.left+r.width/2, y=r.top+r.height/2; top.__recDot(x,y); return {x,y}; };
})();`;

// ---------- CDP ----------
function cdp(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const p = new Map(); const logs = []; const on = {};
  ws.onopen = () => res({ send(m, params = {}) { return new Promise((a, b) => { const i = ++id; p.set(i, { a, b }); ws.send(J({ id: i, method: m, params })); setTimeout(() => { if (p.has(i)) { p.delete(i); b(new Error('CDP quá hạn: ' + m)); } }, 20000); }); }, logs, on, close() { ws.close(); } });
  ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && p.has(m.id)) { const q = p.get(m.id); p.delete(m.id); m.error ? q.b(new Error(m.error.message)) : q.a(m.result); }
    else if (m.method && on[m.method]) on[m.method](m.params);
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.type.toUpperCase() + ' ' + m.params.args.map(a => a.value || a.description).join(' '));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); }; }); }
let c;
const ev = async (expr) => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval'); return r.result.value; };
const evq = (expr, d = null) => ev(expr).catch(() => d);
const curName = () => evq("typeof cur!=='undefined' && cur ? cur.name : null");

// ---------- Bấm / chờ (cùng cách với tools/test-clicks.mjs) ----------
async function waitFor(name, ms = 7000) { const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = await evq("typeof cur!=='undefined' && cur && !pending ? cur.name : null"); if (v === name) { await sleep(450); return true; } await sleep(120); }
  return false; }
const CLICK_LEAD = 480;   // chấm hiện trước khi bấm
async function tap(text) {
  for (let k = 0; k < 12; k++) {
    const r = await evq(`(async()=>{ const d=cur.view.contentDocument; if(!d) return 'nodoc'; const el=[...d.querySelectorAll('.hs')].find(e=>e._rule&&e._rule.t===${J(text)}); if(!el) return 'missing'; window.__recEl=el; await __recPoint(el,cur.view); return 'ok'; })()`, 'evalerr');
    if (r === 'ok') { await sleep(CLICK_LEAD); await ev('window.__recEl.click()'); return true; }
    await sleep(250);
  }
  throw new Error('không thấy chỗ bấm ' + J(text));
}
async function tapAny() { await evq(`(async()=>{ const el=cur.view.contentDocument.querySelector('.frame .content, .frame'); window.__recEl=el; const fr=cur.view.getBoundingClientRect(); top.__recDot(fr.left+fr.width/2, fr.top+fr.height*0.55); })()`); await sleep(CLICK_LEAD);
  await ev(`cur.view.contentDocument.querySelector('.frame .content, .frame').dispatchEvent(new MouseEvent('click',{bubbles:true}))`); return true; }
async function topClick(q, t) {
  const r = await ev(`(async()=>{ const b=[...document.querySelectorAll(${J(q)})].find(x=>x.textContent.trim().startsWith(${J(t)})); if(!b) return false; window.__recEl=b; await __recPoint(b,null); return true; })()`);
  if (!r) throw new Error('không thấy nút ' + q + ' ' + J(t));
  await sleep(CLICK_LEAD); await ev('window.__recEl.click()'); return true; }
// bấm phần tử theo selector trong trang gọi video
async function vclick(sel) {
  const r = await ev(`(async()=>{ const d=cur.view.contentDocument; const el=d&&d.querySelector(${J(sel)}); if(!el) return false; window.__recEl=el; await __recPoint(el,cur.view); return true; })()`);
  if (!r) throw new Error('không thấy ' + sel + ' trong trang gọi video');
  await sleep(CLICK_LEAD); await ev('window.__recEl.click()'); return true; }
// gõ từng ký tự vào ô nhập
async function type(v) {
  const ok = await ev(`(async()=>{ const d=cur.view.contentDocument; const i=d.querySelector('.lcs-in,.lcs-ta'); if(!i) return false; window.__recEl=i; await __recPoint(i,cur.view); i.focus(); i.value=''; return true; })()`);
  if (!ok) throw new Error('không thấy ô nhập');
  await sleep(500);
  for (const ch of v) { await ev(`(()=>{ const i=window.__recEl; i.value+=${J(ch)}; i.dispatchEvent(new Event('input',{bubbles:true})); })()`); await sleep(ch === ' ' ? 60 : 95 + Math.random() * 50); }
  await sleep(700); return true; }
// chờ giọng đọc (player + hàng chờ của index.html) nói hết
async function voiceDone(max = 32000) { const t0 = Date.now(); await sleep(350);
  while (Date.now() - t0 < max) { const busy = await evq("typeof player!=='undefined' && ((!player.paused && !player.ended) || (typeof queue!=='undefined' && queue.length>0))", false); if (!busy) return true; await sleep(200); }
  return false; }
async function dwell(ms, voice = true) { const t0 = Date.now(); if (voice) { const done = await voiceDone(); if (!done) log('   (giọng đọc chưa hết sau 32s, đi tiếp)'); if (Date.now() - t0 > 1500) await sleep(500); }
  const left = ms - (Date.now() - t0); if (left > 0) await sleep(left); }
// một bước: làm → chờ màn mong đợi → hỏng thì ghi lại và nhảy bằng nav() → dừng cho người xem đọc
async function step(label, fn, expect, opt = {}) {
  let err = null;
  try { await fn(); } catch (e) { err = e.message; }
  let ok = expect ? await waitFor(expect, err ? 600 : (opt.wait || 7000)) : !err;
  if (!ok) {
    const at = await curName();
    const p = { buoc: label, mong: expect, dangO: at, loi: err || 'bấm được nhưng không tới màn mong đợi' };
    if (expect) { await evq(`nav(${J(expect)})`); ok = await waitFor(expect, 7000); p.nhay = ok ? 'đã nhảy bằng nav()' : 'nav() cũng không tới, bỏ qua'; }
    problems.push(p); log('  ✗', label, '→ mong', expect, '· đang ở', at, '·', p.loi, '·', p.nhay || '');
  } else log('  ✓', label, expect ? '→ ' + expect : '');
  await dwell(opt.dwell ?? 3000, opt.voice !== false);
  return ok;
}

// ---------- Kịch bản ----------
async function sceneHoa() {
  log('Cảnh 1 · Bà Hoa');
  if (await curName() !== 'A01a-trang-chu-don-gian') await step('chọn Bà Hoa', () => topClick('#personas button', 'Bà Hoa'), 'A01a-trang-chu-don-gian');
  await step('mô phỏng: Có cuộc gọi lạ', () => topClick('#sims button', 'Có cuộc gọi lạ'), 'A03a-do-chuong-nguy-hiem', { dwell: 3500 });
  await step('Nghe', () => tap('Nghe'), 'A04a-hoi-nhanh', { dwell: 3500 });
  await step('Có', () => tap('Có'), 'A04b-phan-tich-ghi-am', { dwell: 4000 });
  await step('Gọi Minh ngay', () => tap('Gọi Minh ngay'), 'Z01a-tin-canh-bao-trong-chat', { dwell: 3500 });
  await step('Mẹ đừng chuyển, con gọi ngay', () => tap('Mẹ đừng chuyển, con gọi ngay'), 'Z01c-mini-app-da-gui', { dwell: 3000 });
  await step('Gọi mẹ ngay', () => tap('Gọi mẹ ngay'), 'A08c-hoi-nguoi-than-tra-loi', { dwell: 4000 });
  await step('Về trang chủ', () => tap('Về trang chủ'), 'A01a-trang-chu-don-gian', { dwell: 2500 });
  await step('mô phỏng: Bà mở app ngân hàng', () => topClick('#sims button', 'Bà mở app ngân hàng'), 'A10a-phanh-sau-cuoc-goi', { dwell: 4000 });
  await step('Đóng cảnh báo', () => tap('Đóng cảnh báo'), 'A01a-trang-chu-don-gian', { dwell: 2500 });
}
async function videoCall() {
  // trang gọi video: chờ Bé Nai dẫn xong (đã chờ ở bước trước), bấm "Chạy demo tự động", chờ đủ 3 câu chị Lan
  const st = () => evq("(()=>{ const w=cur.view.contentWindow; const s=w&&w.__call; return s?{state:s.state,line:s.line,lip:s.lip,demo:s.demo,errors:s.errors,auto:!!s.auto,prog:(w.document.querySelector('#prog')||{}).textContent}:null; })()");
  let s0 = await st(); log('   gọi video: trạng thái trước khi bấm', J(s0));
  let auto = true;
  try { await vclick('#auto'); } catch (e) { auto = false; log('   không có nút tự chạy:', e.message); try { await vclick('#go'); } catch (e2) { problems.push({ buoc: 'gọi video: bắt đầu', mong: '@video đang gọi', dangO: await curName(), loi: e2.message }); return false; } }
  const t0 = Date.now(); let last = '', seen = new Set(), done = false;
  while (Date.now() - t0 < 150000) {
    const s = await st(); if (!s) { if (await curName() !== '@video') break; await sleep(300); continue; }
    const k = s.state + '/' + s.line; if (k !== last) { last = k; log('   gọi video:', k, s.lip ? 'lip=' + s.lip : '', s.demo ? '(ĐOẠN MẪU TẠM)' : ''); }
    if (s.state === 'speaking' && typeof s.line === 'number') seen.add(s.line);
    if (s.state === 'done') { done = true; if (s.errors && s.errors.length) problems.push({ buoc: 'gọi video: lỗi trong trang', dangO: '@video', loi: s.errors.join(' | ') }); break; }
    if (s.state === 'ended') break;
    if (!auto && s.state === 'listening') { await sleep(900); await evq(`(()=>{ const d=cur.view.contentDocument, b=d.querySelector('#talk'); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); setTimeout(()=>b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})),700); })()`); await sleep(1200); }
    await sleep(250);
  }
  log('   gọi video: chị Lan đã nói câu', [...seen].map(x => x + 1).join(', ') || '(không)', done ? '· xong' : '· CHƯA xong');
  if (!done || seen.size < 3) problems.push({ buoc: 'gọi video: chờ đủ 3 câu chị Lan', mong: 'state=done, 3 câu', dangO: await curName(), loi: 'chỉ thấy câu ' + ([...seen].map(x => x + 1).join(',') || 'không câu nào') + ', trạng thái cuối ' + last });
  await sleep(1800);
  return done;
}
async function sceneVy() {
  log('Cảnh 2 · Vy');
  await step('chọn Vy', () => topClick('#personas button', 'Vy'), 'A01b-trang-chu-day-du', { dwell: 3500 });
  await step('Kiểm tra trước khi chuyển tiền', () => tap('Kiểm tra trước khi chuyển tiền'), 'A06a-kiem-tra-so', { dwell: 1500 });
  await step('gõ 0912 345 678', () => type('0912 345 678'), null, { dwell: 600, voice: false });
  await step('Kiểm tra 0912 345 678', () => tap('Kiểm tra'), 'A07a-ket-qua-nguy-hiem', { dwell: 4000 });
  await step('← Quay lại', () => topClick('#back', '← Quay lại'), 'A06a-kiem-tra-so', { dwell: 1200 });
  await step('gõ 1900 5555 88', () => type('1900 5555 88'), null, { dwell: 600, voice: false });
  await step('Kiểm tra 1900 5555 88', () => tap('Kiểm tra'), 'A07c-ket-qua-an-toan', { dwell: 4000 });
  await step('mô phỏng: Có tin nhắn lạ', () => topClick('#sims button', 'Có tin nhắn lạ'), 'A05a-thong-bao-noi', { dwell: 3000 });
  await step('Xem phân tích', () => tap('Xem phân tích'), 'A05b-phan-tich-tin-nhan', { dwell: 4000 });
  await step('Báo cho cộng đồng', () => tap('Báo cho cộng đồng'), 'A09b-bao-cong-dong', { dwell: 3000 });
  await step('Gửi báo cáo', () => tap('Gửi báo cáo'), 'A09c-bao-cao-xong', { dwell: 3500 });
  await step('mô phỏng: Vào học', () => topClick('#sims button', 'Vào học'), 'A11a-thu-vien-truyen', { dwell: 3000 });
  await step('Chơi tiếp', () => tap('Chơi tiếp'), 'A11e-truyen-co-loi-ke', { dwell: 4000 });
  await step('chạm màn truyện → điểm rẽ', () => tapAny(), 'A11c-doc-tung-khung', { dwell: 3500 });
  await step('chọn sai: Nạp ngay kẻo mất suất', () => tap('Nạp ngay kẻo mất suất'), 'A11f-chon-sai-chon-lai', { dwell: 4000 });
  await step('Quay lại điểm rẽ', () => tap('Quay lại điểm rẽ'), 'A11c-doc-tung-khung', { dwell: 2800, voice: false });
  await sceneVideo('Dừng lại, hỏi cô giáo → gọi video', () => tap('Dừng lại, hỏi cô giáo'));
  await step('Làm bài kiểm tra 5 câu', () => tap('Làm bài kiểm tra 5 câu'), 'A12a-cau-hoi', { dwell: 3500 });
  await step('chọn Lừa đảo', () => tap('Lừa đảo'), 'A12b-giai-thich', { dwell: 4000 });
  await step('Câu tiếp theo', () => tap('Câu tiếp theo'), 'A12c-ket-qua', { dwell: 4000 });
}
async function sceneVideo(label, fn) {
  const ok = await step(label, fn, '@video', { dwell: 2000, wait: 12000 });
  if (ok) await videoCall();
  await step('Xem bảng điểm', () => vclick('#finish a'), 'A11i-bang-diem-cuoi-bai', { dwell: 4000, wait: 9000 });
}
async function sceneKhoa() {
  log('Cảnh 3 · Khoa');
  await step('chọn Khoa', () => topClick('#personas button', 'Khoa'), 'W01-thong-ke', { dwell: 4000 });
  await step('Kiểm duyệt', () => tap('Kiểm duyệt'), 'W02-kiem-duyet', { dwell: 4000 });
  await step('Xác nhận lừa đảo', () => tap('Xác nhận lừa đảo'), 'W01-thong-ke', { dwell: 3500 });
}

// ---------- ffmpeg ----------
function run(cmd, args) { return new Promise(res => { const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d); p.on('close', code => res({ code, out })); p.on('error', e => res({ code: -1, out: String(e) })); }); }
async function volume(file, extra = []) { const r = await run('ffmpeg', ['-hide_banner', '-nostats', ...extra, '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
  const m = /mean_volume: (-?[\d.]+) dB/.exec(r.out), x = /max_volume: (-?[\d.]+) dB/.exec(r.out); return { mean: m ? +m[1] : null, max: x ? +x[1] : null }; }
async function probe(file, entry) { const r = await run('ffprobe', ['-v', 'error', '-show_entries', entry, '-of', 'csv=p=0', file]); return r.out.trim().split('\n')[0]; }
// cách 2: trộn lại các file tiếng theo mốc đã ghi
async function mixFromEvents(events, videoStartMs, durS, outFile) {
  const items = [];
  for (const e of events) { if (!e.url) continue; let p; try { p = decodeURIComponent(new URL(e.url).pathname); } catch { continue; }
    const f = path.join(ROOT, p); if (!existsSync(f) || !/\.(m4a|mp3|wav|ogg|aac|webm)$/i.test(f)) continue;
    const delay = e.t - videoStartMs; if (delay < -200) continue;
    items.push({ f, delay: Math.max(0, Math.round(delay)), at: e.at || 0, len: e.end ? Math.max(0.05, (e.end - e.t) / 1000) : null }); }
  if (!items.length) return false;
  const args = ['-hide_banner', '-y']; items.forEach(i => args.push('-i', i.f));
  const fc = items.map((i, k) => `[${k}:a]atrim=start=${i.at}${i.len ? ':duration=' + i.len.toFixed(3) : ''},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,adelay=${i.delay}:all=1[a${k}]`).join(';') +
    ';' + items.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${items.length}:normalize=0:dropout_transition=0,apad=whole_dur=${durS.toFixed(3)}[out]`;
  args.push('-filter_complex', fc, '-map', '[out]', '-t', durS.toFixed(3), '-c:a', 'pcm_s16le', outFile);
  const r = await run('ffmpeg', args); if (r.code !== 0) { log('trộn tiếng (cách 2) lỗi:', r.out.slice(-600)); return false; }
  log('cách 2: đã trộn', items.length, 'đoạn tiếng theo mốc'); return true;
}

// ---------- Chạy ----------
let srv, chrome, vidFF, audFF, guardT, cleaned = false;
async function cleanup() { if (cleaned) return; cleaned = true; clearInterval(guardT);
  try { audFF && audFF.exitCode === null && audFF.kill('SIGINT'); } catch {} try { vidFF && vidFF.exitCode === null && vidFF.stdin.end(); } catch {}
  try { chrome && chrome.kill(); } catch {} try { srv && srv.kill(); } catch {} pulseCleanup(); }
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, async () => { await cleanup(); process.exit(130); });
process.on('exit', () => { try { if (moduleId) execFileSync('pactl', ['unload-module', moduleId]); } catch {} });

let exitCode = 0;
const profile = path.join(TMP, 'profile-' + process.pid);
try {
  pulseSetup();
  srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars',
    `--window-size=${VW},${VH}`, '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb',
    ...(pulseOk ? [] : ['--mute-audio']), 'about:blank'],
    { stdio: 'ignore', env: { ...process.env, ...(pulseOk ? { PULSE_SINK: SINK } : {}) } });
  let ver; for (let k = 0; k < 80; k++) { try { ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(150); } }
  if (!ver) throw new Error('Chromium không mở được cổng gỡ lỗi');
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
  c = await cdp(t.webSocketDebuggerUrl); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: DSF, mobile: false });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: INJECT });

  // thu tiếng
  let audSpawn = 0;
  if (pulseOk) {
    await rm(AUD, { force: true });
    audFF = spawn('ffmpeg', ['-hide_banner', '-y', '-f', 'pulse', '-i', SINK + '.monitor', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', '-copyts', AUD], { stdio: ['pipe', 'ignore', 'pipe'] });
    audSpawn = Date.now(); let aerr = ''; audFF.stderr.on('data', d => { aerr = (aerr + d).slice(-1500); }); audFF.on('close', code => { if (code && code !== 255) log('ffmpeg thu tiếng thoát mã', code, aerr.slice(-300)); });
    guardT = setInterval(() => guardSinkInputs(chrome.pid), 700);
  }

  await c.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/prototype/index.html` });
  if (!await waitFor('A01a-trang-chu-don-gian', 10000)) { problems.push({ buoc: 'mở prototype', mong: 'A01a-trang-chu-don-gian', dangO: await curName(), loi: 'trang chủ không hiện sau 10s' }); }

  // quay hình
  await rm(VID, { force: true });
  vidFF = spawn('ffmpeg', ['-hide_banner', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-vf', `scale=${OW}:${OH}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-g', '60', '-r', String(FPS), '-movflags', '+faststart', VID], { stdio: ['pipe', 'ignore', 'pipe'] });
  let verr = ''; vidFF.stderr.on('data', d => { verr = (verr + d).slice(-1500); }); vidFF.stdin.on('error', () => {});
  const vidDone = new Promise(r => vidFF.on('close', r));
  let vT0 = null, written = 0, lastBuf = null, nFrames = 0, skew = [], frameSize = null;
  const pump = upTo => { if (vT0 === null || !lastBuf) return; const target = Math.floor((upTo - vT0) * FPS); while (written < target) { vidFF.stdin.write(lastBuf); written++; } };
  c.on['Page.screencastFrame'] = p => { c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
    const ts = p.metadata.timestamp || Date.now() / 1000; if (vT0 === null) { vT0 = ts; frameSize = [p.metadata.deviceWidth, p.metadata.deviceHeight]; }
    if (nFrames % 50 === 0) skew.push(Date.now() / 1000 - ts);
    pump(ts); lastBuf = Buffer.from(p.data, 'base64'); nFrames++; };
  await c.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: OW, maxHeight: OH, everyNthFrame: 1 });
  // trang đứng yên thì không có khung mới: nhích một chút để chắc có khung đầu
  await evq("document.body.animate([{opacity:.999},{opacity:1}],{duration:200})"); await sleep(400);
  const recStartWall = Date.now();
  await dwell(3000);

  const scenes = { hoa: [sceneHoa], vy: [sceneVy], khoa: [sceneKhoa], all: [sceneHoa, sceneVy, sceneKhoa],
    video: [async () => { log('Chỉ thử gọi video'); await sceneVideo('nhảy tới gọi video', () => ev("nav('@video')")); }] }[SCENE];
  if (!scenes) throw new Error('--scene phải là all|hoa|vy|khoa|video');
  for (const s of scenes) { try { await s(); } catch (e) { problems.push({ buoc: 'cả cảnh ' + s.name, loi: e.message, dangO: await curName() }); log('  ✗ cảnh', s.name, 'lỗi:', e.message); } }
  await sleep(1200);

  // dừng quay
  const events = await evq('window.__lcsAudio||[]', []);
  await c.send('Page.stopScreencast').catch(() => {});
  const endTs = Date.now() / 1000 - (skew.length ? skew.reduce((a, b) => a + b, 0) / skew.length : 0);
  pump(endTs); if (lastBuf) { vidFF.stdin.write(lastBuf); written++; }
  vidFF.stdin.end(); await vidDone;
  const durS = written / FPS;
  log(`hình: ${nFrames} khung nhận (${(nFrames / durS).toFixed(1)}/s trung bình) → ${written} khung ghi, ${durS.toFixed(1)}s, khung gốc ${frameSize}, lệch đồng hồ ~${((skew[0] || 0) * 1000).toFixed(0)}ms`);
  if (!existsSync(VID) || statSync(VID).size < 10000) throw new Error('ffmpeg hình hỏng: ' + verr.slice(-400));
  if (audFF) { clearInterval(guardT); await new Promise(r => { audFF.on('close', r); try { audFF.stdin.write('q'); } catch {} setTimeout(() => { try { audFF.kill('SIGINT'); } catch {} }, 1500); setTimeout(r, 5000); }); }
  const consoleLogs = [...new Set(c.logs.filter(l => !/favicon/.test(l)))];
  chrome.kill(); srv.kill(); pulseCleanup();

  // ghép
  let audioFile = null, audioOffset = 0, method = 0, note = '';
  if (pulseOk && existsSync(AUD) && statSync(AUD).size > 50000) {
    let aStart = parseFloat(await probe(AUD, 'format=start_time'));
    if (!(aStart > 1e9)) { note = 'không đọc được mốc đồng hồ của file tiếng, dùng mốc lúc mở ffmpeg'; aStart = audSpawn / 1000 + 0.25; }
    audioOffset = vT0 - aStart;   // tiếng bắt đầu thu sớm hơn hình bấy nhiêu giây
    const v = await volume(AUD); log('tiếng thu (cách 1):', J(v), 'lệch đầu', audioOffset.toFixed(3) + 's', note);
    if (v.mean !== null && v.mean > -80) { audioFile = AUD; method = 1; }
    else log('Tiếng thu được im lặng → thử cách 2');
  }
  if (!audioFile) { const mix = path.join(TMP, tag + '.mix.wav'); if (await mixFromEvents(events, vT0 * 1000, durS, mix)) { audioFile = mix; audioOffset = 0; method = 2; } }
  const margs = ['-hide_banner', '-y', '-i', VID];
  if (audioFile) { if (method === 1) { if (audioOffset >= 0) margs.push('-ss', audioOffset.toFixed(3)); else margs.push('-itsoffset', (-audioOffset).toFixed(3)); } margs.push('-i', audioFile, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest'); }
  else margs.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest');
  margs.push('-movflags', '+faststart', OUT);
  const m = await run('ffmpeg', margs); if (m.code !== 0) throw new Error('ghép lỗi: ' + m.out.slice(-600));
  const dur = parseFloat(await probe(OUT, 'format=duration')), size = statSync(OUT).size;
  const vol = audioFile ? await volume(OUT) : { mean: null, max: null };
  const dims = await probe(OUT, 'stream=width,height,r_frame_rate,codec_name');
  const report = { out: OUT, thoiLuongS: +dur.toFixed(1), dungLuongMB: +(size / 1048576).toFixed(1), khung: dims, cachThuTieng: method, volumedetect: vol, lechTiengHinhS: +audioOffset.toFixed(3),
    khungNhan: nFrames, buocHong: problems, tiengDaPhat: events.map(e => ({ k: e.k, s: +((e.t - vT0 * 1000) / 1000).toFixed(2), dai: e.end ? +((e.end - e.t) / 1000).toFixed(2) : null, url: e.url ? e.url.split('/').slice(-2).join('/') : null, dur: e.dur ? +e.dur.toFixed(2) : undefined })), console: consoleLogs.slice(0, 20) };
  await writeFile(LOGF, J(report, null, 1));
  console.log('\n===== KẾT QUẢ =====');
  console.log('File:', OUT, `· ${dur.toFixed(1)}s · ${(size / 1048576).toFixed(1)} MB ·`, dims);
  console.log('Tiếng: cách', method || '(không có tiếng)', '· volumedetect', J(vol));
  console.log('Bước hỏng/nhảy cóc:', problems.length ? '\n' + problems.map(p => '  - ' + J(p)).join('\n') : 'không');
  console.log('Tiếng đã phát (giây tính từ đầu video):'); for (const e of report.tiengDaPhat) console.log('  ', String(e.s).padStart(7), e.k, e.url || '(không rõ nguồn, dài ' + e.dur + 's)', e.dai != null ? '· ' + e.dai + 's' : '');
  if (consoleLogs.length) console.log('Console:\n  ' + consoleLogs.slice(0, 12).join('\n  '));
  console.log('Nhật ký:', LOGF);
  if (!method) exitCode = 2;
} catch (e) { console.error('LỖI:', e.stack || e.message); exitCode = 1; }
finally { await cleanup(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(exitCode); }
