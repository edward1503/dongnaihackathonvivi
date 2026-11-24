// Lá chắn số · máy chủ MVP cho mảng 5 (Zalo người thân) và mảng 6 (web đội tình nguyện).
// Không phụ thuộc gói ngoài. Chạy từ thư mục la-chan-so:  node mvp/server.mjs [cổng]
// Đây là bản tối thiểu của S5 (đồng bộ) và S6 (lưu báo cáo); mảng 2 có thể thay thế, giữ nguyên hợp đồng
// trong mvp/HOP-DONG-DU-LIEU.md. Dữ liệu nằm trong bộ nhớ, tắt máy chủ là mất; toàn bộ là dữ liệu giả lập.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8020;
const NOW = () => new Date().toISOString();
const hhmm = () => new Date().toTimeString().slice(0, 5);
const uid = p => p + Math.random().toString(36).slice(2, 8);
const MS90 = 90 * 24 * 3600 * 1000;

// ---------- Dữ liệu mẫu ----------
const demoAlert = () => ({
  id: 'al_demo', level: 'danger', at: NOW(), who: 'Mẹ Hoa', number: '0912 345 678',
  scenario: 'Giả danh công an', askedTransfer: true, callSeconds: 252,
  summary: 'Người gọi tự xưng cán bộ điều tra, yêu cầu chuyển tiền vào tài khoản tạm giữ và giữ bí mật.',
  timeline: [
    { t: '10:38', text: 'Cuộc gọi đến từ 0912 345 678, dài 4 phút 12 giây', tone: '' },
    { t: '10:42', text: 'Lá chắn phân tích bản ghi âm: Nguy hiểm', tone: 'danger' },
    { t: '10:43', text: 'Mẹ trả lời: có đòi chuyển tiền', tone: 'danger' },
    { t: '10:43', text: 'Mẹ mở ứng dụng ngân hàng. Lá chắn đã nhắc dừng.', tone: 'warn' }
  ],
  reply: null, status: 'open'
});
const SEED = [
  ['0934 567 890', 'Giả danh công an', 71, 1, 'Khu phố 4', 'phone'],
  ['ngan-hang-xacminh.top', 'Đường dẫn giả mạo', 68, 2, 'Khu phố 1', 'link'],
  ['0283 999 1234', 'Spam quảng cáo?', 55, 3, 'Khu phố 2', 'phone'],
  ['TK 1903 xxxx 5678', 'Việc nhẹ lương cao', 62, 1, 'Khu phố 4', 'account'],
  ['0987 111 222', 'Người thân tai nạn', 59, 1, 'Khu phố 1', 'phone'],
  ['qua-tri-an.top', 'Quà tri ân', 74, 2, 'Khu phố 3', 'link'],
  ['0909 555 666', 'Giao hàng?', 40, 1, 'Khu phố 2', 'phone']
];
const seedReports = () => SEED.map(([value, guess, conf, count, area, kind], i) => ({
  id: 'rp_seed' + i, value, kind, aiGuess: guess, confidence: conf, count, area, status: 'pending',
  at: new Date(Date.now() - (i + 1) * 3600e3).toISOString(), source: 'seed', consent: true,
  signs: i === 0 ? ['Tự xưng cán bộ điều tra', 'Yêu cầu chuyển tiền vào tài khoản tạm giữ', 'Yêu cầu giữ bí mật'] : ['Có dấu hiệu theo kiểu "' + guess + '"'],
  whyUnsure: i === 0 ? ['Mới có 1 người báo', 'Số mới xuất hiện 2 ngày, chưa có lịch sử'] : ['Mới có ' + count + ' người báo'],
  history: i === 0 ? ['22/11 — Số xuất hiện lần đầu trong hệ thống', '24/11 10:45 — Báo cáo đầu tiên (đang xem)'] : []
}));
const state = {
  alerts: [demoAlert()], reports: seedReports(), broadcasts: [], labels: {},
  weekly: [22, 27, 31, 40],
  baseScam: [['Đường dẫn giả mạo', 42], ['Giả danh công an', 30], ['Việc nhẹ lương cao', 24], ['Người thân gặp tai nạn', 12], ['Khác', 12]],
  base: { total: 120, aiConfirmed: 78, aiRejected: 18, appeals: 2, pending: 24 }
};

// ---------- AI phân loại trước (giả lập bằng quy tắc; mảng 2 thay bằng gọi AI thật) ----------
const RULES = [
  [/công an|điều tra|tạm giữ|viện kiểm sát/i, 'Giả danh công an', 86],
  [/điện lực|cắt điện|tiền điện/i, 'Giả nhân viên điện lực', 84],
  [/việc nhẹ|hoa hồng|cộng tác viên|nạp trước/i, 'Việc nhẹ lương cao', 82],
  [/tai nạn|cấp cứu|viện phí/i, 'Người thân gặp tai nạn', 81],
  [/trúng thưởng|quà tri ân|nhận quà/i, 'Quà tri ân', 80],
  [/giao hàng|đơn hàng|ship/i, 'Giao hàng?', 45]
];
function classify(r) {
  const text = [r.value, r.note].filter(Boolean).join(' ');
  for (const [re, label, conf] of RULES) if (re.test(text)) return { aiGuess: label, confidence: conf };
  if (r.kind === 'link' && /\.(top|xyz|click|icu|cyou)(\/|$)/i.test(r.value)) return { aiGuess: 'Đường dẫn giả mạo', confidence: 82 };
  return { aiGuess: 'Chưa rõ', confidence: 35 };
}
// Che số dài trước khi lưu hoặc đẩy sang máy khác (S4)
const mask = s => String(s || '').replace(/\d{6,}/g, m => m.slice(0, 3) + '•'.repeat(m.length - 5) + m.slice(-2));

// ---------- Thống kê (W1): số mẫu cộng thêm báo cáo thật vừa nhận ----------
function stats() {
  const live = state.reports.filter(r => r.source !== 'seed');
  const scam = state.baseScam.map(([l, v]) => [l, v]);
  const bump = k => { const row = scam.find(s => s[0] === k) || scam[scam.length - 1]; row[1]++; };
  for (const r of live) bump(r.kind === 'link' ? 'Đường dẫn giả mạo' : r.aiGuess);
  const total = state.base.total + live.length;
  const confirmedLive = live.filter(r => r.status === 'confirmed').length;
  const decided = state.reports.filter(r => r.source === 'seed' && r.status !== 'pending').length;
  const pending = state.base.pending - decided + live.filter(r => r.status === 'pending').length;
  const aiConfirmed = state.base.aiConfirmed + confirmedLive;
  const weekly = [...state.weekly]; weekly[3] += live.length;
  return {
    month: '11/2026', area: 'Phường Trấn Biên', total, totalDelta: '+18% so với tháng 10',
    links: scam[0][1], linkPct: Math.round(scam[0][1] / total * 100),
    aiConfirmed, aiPct: Math.round(aiConfirmed / total * 100), pending, scam, weekly,
    emerging: { title: 'Giả nhân viên điện lực báo cắt điện', reports: 7, days: 3, quotes: ['Nhà chị nợ tiền điện, 2 tiếng nữa cắt…', 'Bấm phím 9 để gặp nhân viên xử lý…'] },
    targets: [['Người cao tuổi', 46], ['Học sinh', 31], ['Khác', 23]], peak: '9–11 giờ sáng',
    areas: [['Khu phố 1', 31], ['Khu phố 4', 26], ['Khu phố 2', 21], ['Khu phố 3', 17], ['Khu phố 5', 13]],
    appeals: state.base.appeals, aiRejected: state.base.aiRejected
  };
}

// ---------- Đồng bộ thời gian thực (SSE) ----------
const clients = new Set();
const emit = (type, data) => { const m = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(m); };

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = req => new Promise(ok => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });
const pages = { '/zalo': 'mvp/zalo.html', '/web': 'mvp/web.html', '/': 'mvp/index.html' };
const findAlert = id => state.alerts.find(x => x.id === id);

async function api(req, res, p, url) {
  const b = req.method === 'POST' ? await readBody(req) : {};
  const POST = req.method === 'POST';
  let m;
  // --- cảnh báo (S5): máy bà Hoa gửi lên, Minh nhận ---
  if (p === '/api/alerts' && !POST) return send(res, 200, state.alerts);
  if (p === '/api/alerts' && POST) {
    const a = { id: uid('al_'), level: b.level === 'warn' ? 'warn' : 'danger', at: NOW(), who: b.who || 'Mẹ Hoa', number: b.number || '0912 345 678',
      scenario: b.scenario || 'Giả danh công an', askedTransfer: b.askedTransfer !== false, callSeconds: b.callSeconds || 252,
      summary: mask(b.summary || 'Người gọi yêu cầu chuyển tiền gấp và giữ bí mật.'),
      timeline: b.timeline || [{ t: hhmm(), text: 'Lá chắn phát hiện cuộc gọi nghi lừa đảo', tone: 'danger' }], reply: null, status: 'open' };
    state.alerts.unshift(a); emit('alert', a); return send(res, 201, a);
  }
  if ((m = p.match(/^\/api\/alerts\/(\w+)\/reply$/)) && POST) {
    const a = findAlert(m[1]); if (!a) return send(res, 404, { error: 'không thấy cảnh báo' });
    const choice = b.choice || 'dung-chuyen';
    const text = choice === 'nguoi-quen' ? 'Minh: Đây là người quen, mẹ yên tâm.' : (b.text || 'Minh: Mẹ đừng chuyển! Con gọi mẹ ngay.');
    a.reply = { by: 'Minh', text, choice, at: NOW(), delivered: true };
    if (choice === 'nguoi-quen') a.status = 'cleared';
    a.timeline.push({ t: hhmm(), text: 'Minh trả lời: ' + text.replace(/^Minh: /, ''), tone: 'safe' });
    emit('reply', { alertId: a.id, reply: a.reply }); return send(res, 200, a);
  }
  if ((m = p.match(/^\/api\/alerts\/(\w+)\/call$/)) && POST) {
    const a = findAlert(m[1]); if (!a) return send(res, 404, {});
    a.timeline.push({ t: hhmm(), text: 'Minh bấm gọi mẹ', tone: 'safe' });
    emit('call', { alertId: a.id, at: NOW() }); return send(res, 200, a);
  }
  // --- báo cáo (S6): Minh hoặc bà Hoa báo, đội tình nguyện duyệt ---
  if (p === '/api/reports' && !POST) return send(res, 200, state.reports);
  if (p === '/api/reports' && POST) {
    if (!b.value || !String(b.value).trim()) return send(res, 400, { error: 'thiếu đối tượng cần báo' });
    const norm = s => String(s).replace(/\s/g, '').toLowerCase();
    const dup = state.reports.find(r => norm(r.value) === norm(b.value) && r.status === 'pending');
    if (dup) { dup.count++; dup.at = NOW(); dup.confidence = Math.min(95, dup.confidence + 8); emit('report', dup); return send(res, 200, dup); }
    const kind = b.kind || (/[a-z]/i.test(b.value) && /[./]/.test(b.value) ? 'link' : /^[\d\s+]{9,}$/.test(b.value) ? 'phone' : 'other');
    const r = { id: uid('rp_'), value: String(b.value).trim(), kind, note: mask(b.note || ''), area: b.area || 'Khu phố 4', count: 1, status: 'pending', at: NOW(),
      source: b.source || 'zalo', consent: b.consent !== false, signs: [], whyUnsure: ['Mới có 1 người báo'], history: [], ...classify({ ...b, kind }) };
    if (r.confidence >= 80) { r.status = 'confirmed'; r.auto = true; r.signs = ['Khớp mẫu "' + r.aiGuess + '"']; r.whyUnsure = []; state.labels[r.value] = { until: new Date(Date.now() + MS90).toISOString(), kind: r.aiGuess }; }
    else r.signs = [r.aiGuess === 'Chưa rõ' ? 'AI chưa nhận ra kiểu lừa đảo quen thuộc' : 'Có dấu hiệu theo kiểu "' + r.aiGuess + '"'];
    state.reports.unshift(r); emit('report', r); return send(res, 201, r);
  }
  if ((m = p.match(/^\/api\/reports\/(\w+)\/decision$/)) && POST) {
    const r = state.reports.find(x => x.id === m[1]); if (!r) return send(res, 404, {});
    const d = b.decision; // confirmed | spam | rejected | label | police
    r.status = { confirmed: 'confirmed', spam: 'spam', rejected: 'rejected', label: 'labeled', police: 'forwarded' }[d] || r.status;
    r.decidedAt = NOW(); r.decidedBy = 'Khoa';
    if (d === 'confirmed' || d === 'label') {
      r.label = d === 'label' ? (b.label || 'Giao hàng') : r.aiGuess;
      state.labels[r.value] = { until: new Date(Date.now() + MS90).toISOString(), kind: r.label };   // nhãn tự hết hạn sau 90 ngày
    }
    emit('report', r); return send(res, 200, r);
  }
  if (p === '/api/lookup') {
    const v = (url.searchParams.get('v') || '').replace(/\s/g, '').toLowerCase();
    const hit = Object.entries(state.labels).find(([k]) => k.replace(/\s/g, '').toLowerCase() === v && new Date(state.labels[k].until) > new Date());
    return send(res, 200, hit ? { level: 'danger', kind: state.labels[hit[0]].kind, until: state.labels[hit[0]].until } : { level: 'unknown' });
  }
  // --- thống kê, tuyên truyền (W1, W3) ---
  if (p === '/api/stats') return send(res, 200, stats());
  if (p === '/api/broadcasts' && !POST) return send(res, 200, state.broadcasts);
  if (p === '/api/broadcasts' && POST) {
    if (!b.title || !b.body) return send(res, 400, { error: 'thiếu tiêu đề hoặc nội dung' });
    const x = { id: uid('bc_'), title: b.title, body: b.body, to: b.to || [], at: NOW(), by: 'Khoa' };
    state.broadcasts.unshift(x);
    if (x.to.some(t => t.startsWith('Người thân'))) emit('broadcast', x);   // hiện thành tin OA ở Zalo của Minh
    return send(res, 201, x);
  }
  if (p === '/api/reset' && POST) {
    state.alerts = [demoAlert()]; state.reports = seedReports(); state.broadcasts = []; state.labels = {};
    emit('reset', {}); return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'không có API này' });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 1500\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  if (p.startsWith('/api/')) return api(req, res, p, url).catch(e => send(res, 500, { error: String(e) }));
  const file = path.join(ROOT, pages[p] || decodeURIComponent(p));
  if (!file.startsWith(ROOT)) return send(res, 403, 'cấm', 'text/plain');
  fs.readFile(file, (err, data) => err ? send(res, 404, 'không thấy', 'text/plain; charset=utf-8') : send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream'));
}).listen(PORT, () => console.log(`Lá chắn số MVP: http://127.0.0.1:${PORT}/zalo  ·  http://127.0.0.1:${PORT}/web`));
