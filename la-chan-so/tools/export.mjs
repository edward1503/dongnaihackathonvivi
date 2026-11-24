// Xuất mọi .frame trong screens/*.html thành SVG (lớp chỉnh sửa được trong Figma) + PNG 2x.
// Không cần cài thêm gói nào: chỉ dùng Node (fetch, WebSocket có sẵn) + Chromium headless.
// Chạy:  node tools/export.mjs            (xuất tất cả)
//        node tools/export.mjs A01 A07    (chỉ các file có tên bắt đầu bằng A01, A07)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_SVG = path.join(ROOT, 'export', 'svg');
const OUT_PNG = path.join(ROOT, 'export', 'png');
const PORT = 8765 + Math.floor(Math.random() * 500);
const DBG = 9300 + Math.floor(Math.random() * 500);
const CHROME = ['/usr/bin/chromium', '/usr/bin/google-chrome-stable', '/usr/bin/brave'].find(existsSync);
const only = process.argv.slice(2);

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw new Error('outside');
    const buf = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(PORT, '127.0.0.1');

// ---------- Hàm chạy TRONG trang: DOM -> SVG ----------
function pageSerializer() {
  const out = [];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n2 = n => +(+n).toFixed(2);
  const n4 = n => +(+n).toFixed(4);
  const parseColor = c => {
    if (!c) return null;
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1; if (a === 0) return null;
    return { hex: '#' + p.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''), a };
  };
  const fillAttr = (c, k = 'fill') => `${k}="${c.hex}"` + (c.a < 1 ? ` ${k}-opacity="${n2(c.a)}"` : '');
  let defs = [], idc = 0, names = {};
  const layerName = el => {
    const base = (el.dataset && el.dataset.layer) || (el.classList && el.classList[0]) || el.tagName.toLowerCase();
    names[base] = (names[base] || 0) + 1;
    return base + '-' + names[base];
  };
  function rrPath(x, y, w, h, r) {
    const [a, b, c, d] = r.map(v => Math.max(0, Math.min(v, w / 2, h / 2)));
    return `M${n2(x + a)} ${n2(y)}H${n2(x + w - b)}` + (b ? `A${n2(b)} ${n2(b)} 0 0 1 ${n2(x + w)} ${n2(y + b)}` : '') +
      `V${n2(y + h - c)}` + (c ? `A${n2(c)} ${n2(c)} 0 0 1 ${n2(x + w - c)} ${n2(y + h)}` : '') +
      `H${n2(x + d)}` + (d ? `A${n2(d)} ${n2(d)} 0 0 1 ${n2(x)} ${n2(y + h - d)}` : '') +
      `V${n2(y + a)}` + (a ? `A${n2(a)} ${n2(a)} 0 0 1 ${n2(x + a)} ${n2(y)}` : '') + 'Z';
  }
  function shape(x, y, w, h, r, attrs) {
    if (w <= 0 || h <= 0) return '';
    if (r.every(v => v === r[0])) {
      const rx = Math.max(0, Math.min(r[0], w / 2, h / 2));
      return `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${rx ? ` rx="${n2(rx)}"` : ''} ${attrs}/>`;
    }
    return `<path d="${rrPath(x, y, w, h, r)}" ${attrs}/>`;
  }
  const cvs = document.createElement('canvas').getContext('2d');
  function textNode(node, cs, ox, oy) {
    let str = node.nodeValue; if (!str.trim()) return '';
    const fill = parseColor(cs.color); if (!fill) return '';
    const fs = parseFloat(cs.fontSize);
    cvs.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = cvs.measureText('Hg'); const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    const upper = cs.textTransform === 'uppercase';
    const range = document.createRange(); const lines = [];
    const re = /\S+/g; let mt;
    while ((mt = re.exec(str))) {
      range.setStart(node, mt.index); range.setEnd(node, mt.index + mt[0].length);
      const rects = range.getClientRects(); if (!rects.length) continue;
      const rc = rects[0]; const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - rc.top) < 3) { last.text += ' ' + mt[0]; }
      else lines.push({ top: rc.top, left: rc.left, height: rc.height, text: mt[0] });
    }
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const ls = parseFloat(cs.letterSpacing);
    const deco = cs.textDecorationLine && cs.textDecorationLine !== 'none' ? ` text-decoration="${cs.textDecorationLine}"` : '';
    let s = '';
    for (const ln of lines) {
      const base = ln.top - oy + (ln.height - (asc + desc)) / 2 + asc;
      const t = upper ? ln.text.toUpperCase() : ln.text;
      s += `<text x="${n2(ln.left - ox)}" y="${n2(base)}" font-family="${esc(fam)}" font-size="${n2(fs)}" font-weight="${cs.fontWeight}"` +
        (ls ? ` letter-spacing="${n2(ls)}"` : '') + deco + ` ${fillAttr(fill)} xml:space="preserve">${esc(t)}</text>`;
    }
    return s;
  }
  function svgNode(el, x, y, w, h) {
    const vb = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.width ? el.viewBox.baseVal : { x: 0, y: 0, width: w, height: h };
    const sx = w / vb.width, sy = h / vb.height;
    let inner = '';
    for (const c of el.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse')) {
      const st = getComputedStyle(c); const k = c.cloneNode(false);
      const f = st.fill === 'none' ? null : parseColor(st.fill), sk = st.stroke === 'none' ? null : parseColor(st.stroke);
      ['class', 'style', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray'].forEach(a => k.removeAttribute(a));
      k.setAttribute('fill', f ? f.hex : 'none'); if (f && f.a < 1) k.setAttribute('fill-opacity', n2(f.a));
      if (sk) {
        k.setAttribute('stroke', sk.hex); k.setAttribute('stroke-width', parseFloat(st.strokeWidth));
        k.setAttribute('stroke-linecap', st.strokeLinecap); k.setAttribute('stroke-linejoin', st.strokeLinejoin);
        if (sk.a < 1) k.setAttribute('stroke-opacity', n2(sk.a));
        if (st.strokeDasharray && st.strokeDasharray !== 'none') k.setAttribute('stroke-dasharray', st.strokeDasharray.replace(/px/g, ''));
      }
      const o = parseFloat(st.opacity); if (o < 1) k.setAttribute('opacity', o);
      inner += new XMLSerializer().serializeToString(k).replace(/ xmlns="[^"]*"/g, '');
    }
    return `<g id="${layerName(el.parentElement || el)}" transform="translate(${n2(x - vb.x * sx)} ${n2(y - vb.y * sy)}) scale(${n4(sx)} ${n4(sy)})">${inner}</g>`;
  }
  function imgNode(el, x, y, w, h, radii) {
    if (!el.naturalWidth) return shape(x, y, w, h, radii, 'fill="#E2E8F0"');
    const sc = 2, c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    const ctx = c.getContext('2d'); const iw = el.naturalWidth, ih = el.naturalHeight;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (getComputedStyle(el).objectFit === 'cover') { const ar = w / h; if (iw / ih > ar) { sw = ih * ar; sx = (iw - sw) / 2; } else { sh = iw / ar; sy = (ih - sh) / 2; } }
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.86);
    let clip = '';
    if (radii.some(v => v > 0)) { const id = 'clip' + (idc++); defs.push(`<clipPath id="${id}">${shape(x, y, w, h, radii, '')}</clipPath>`); clip = ` clip-path="url(#${id})"`; }
    return `<image id="${layerName(el)}" x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" preserveAspectRatio="none" xlink:href="${data}"${clip}/>`;
  }
  function walk(el, ox, oy, isRoot) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return '';
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return '';
    const r = el.getBoundingClientRect();
    const x = r.left - ox, y = r.top - oy, w = r.width, h = r.height;
    const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius]
      .map(v => { const f = parseFloat(v) || 0; return v.includes('%') ? f / 100 * Math.min(w, h) : f; });
    let s = '';
    if (tag === 'svg') s = svgNode(el, x, y, w, h);
    else if (tag === 'img') s = imgNode(el, x, y, w, h, radii);
    else {
      const bg = parseColor(cs.backgroundColor);
      const sides = ['Top', 'Right', 'Bottom', 'Left'];
      const bw = sides.map(k => parseFloat(cs['border' + k + 'Width']) || 0);
      const bs = sides.map(k => cs['border' + k + 'Style']);
      const bc = sides.map((k, i) => (bw[i] > 0 && bs[i] !== 'none') ? parseColor(cs['border' + k + 'Color']) : null);
      const inline = cs.display === 'inline';
      const rects = inline ? [...el.getClientRects()] : [r];
      if (bg) for (const rc of rects) s += shape(rc.left - ox, rc.top - oy, rc.width, rc.height, radii, fillAttr(bg));
      if (!inline) {
        const uni = bc[0] && bc.every((c, i) => c && c.hex === bc[0].hex && c.a === bc[0].a && bw[i] === bw[0]);
        if (uni) {
          const t = bw[0];
          s += shape(x + t / 2, y + t / 2, w - t, h - t, radii.map(v => Math.max(0, v - t / 2)),
            `fill="none" ${fillAttr(bc[0], 'stroke')} stroke-width="${t}"` + (bs[0] === 'dashed' ? ` stroke-dasharray="${t * 4} ${t * 3}"` : ''));
        } else {
          if (bc[0]) s += shape(x, y, w, bw[0], [0, 0, 0, 0], fillAttr(bc[0]));
          if (bc[1]) s += shape(x + w - bw[1], y, bw[1], h, [0, 0, 0, 0], fillAttr(bc[1]));
          if (bc[2]) s += shape(x, y + h - bw[2], w, bw[2], [0, 0, 0, 0], fillAttr(bc[2]));
          if (bc[3]) s += shape(x, y, bw[3], h, [0, 0, 0, 0], fillAttr(bc[3]));
        }
      }
      let kids = 0;
      for (const n of el.childNodes) {
        if (n.nodeType === 1) { s += walk(n, ox, oy, false); kids++; }
        else if (n.nodeType === 3) s += textNode(n, cs, ox, oy);
      }
      if (!s) return '';
      const op = parseFloat(cs.opacity);
      if (kids > 0 || op < 1) s = `<g id="${isRoot ? 'frame' : layerName(el)}"${op < 1 ? ` opacity="${op}"` : ''}>${s}</g>`;
    }
    return s;
  }
  for (const f of document.querySelectorAll('.frame')) {
    defs = []; names = {};
    const r = f.getBoundingClientRect(); const w = Math.round(r.width), h = Math.round(r.height);
    const body = walk(f, r.left, r.top, true);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body + `</svg>`;
    out.push({ name: f.dataset.name || ('frame-' + out.length), x: r.left + scrollX, y: r.top + scrollY, w, h, svg });
  }
  return out;
}

// ---------- CDP tối giản ----------
function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const waiters = [];
    ws.onopen = () => resolve({
      send(method, params = {}) { return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); }); },
      once(event) { return new Promise(res => waiters.push({ event, res })); },
      close() { ws.close(); }
    });
    ws.onerror = e => reject(new Error('ws error ' + (e.message || '')));
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); }
      else if (msg.method) { for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].event === msg.method) { waiters[i].res(msg.params); waiters.splice(i, 1); } }
    };
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const profile = path.join(os.tmpdir(), 'lcs-chrome-' + process.pid);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--disable-gpu', '--window-size=1600,1000', 'about:blank'], { stdio: 'ignore' });
let exitCode = 0;
try {
  let ver; for (let i = 0; i < 60; i++) { try { ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(150); } }
  if (!ver) throw new Error('Chromium không khởi động được');
  await mkdir(OUT_SVG, { recursive: true }); await mkdir(OUT_PNG, { recursive: true });
  const files = (await readdir(path.join(ROOT, 'screens'))).filter(f => f.endsWith('.html')).filter(f => !only.length || only.some(o => f.startsWith(o))).sort();
  const summary = [];
  for (const file of files) {
    const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: 'PUT' })).json();
    const c = await cdp(t.webSocketDebuggerUrl);
    await c.send('Page.enable'); await c.send('Runtime.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1900, height: 1100, deviceScaleFactor: 1, mobile: false });
    const loaded = c.once('Page.loadEventFired');
    await c.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/screens/${encodeURIComponent(file)}` });
    await loaded;
    await c.send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>0)))).then(()=>true)', awaitPromise: true });
    await sleep(120);
    const r = await c.send('Runtime.evaluate', { expression: `(${pageSerializer.toString()})()`, returnByValue: true });
    if (r.exceptionDetails) throw new Error(file + ': ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    for (const fr of r.result.value) {
      await writeFile(path.join(OUT_SVG, fr.name + '.svg'), fr.svg);
      const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: fr.x, y: fr.y, width: fr.w, height: fr.h, scale: 2 } });
      await writeFile(path.join(OUT_PNG, fr.name + '.png'), Buffer.from(shot.data, 'base64'));
      summary.push(`${fr.name}  ${fr.w}x${fr.h}  svg ${(fr.svg.length / 1024).toFixed(0)} KB`);
    }
    if (process.env.AUDIT) { // rà lỗi bố cục: phần tử tràn ra ngoài khung, chữ bị cắt, ảnh hỏng, chữ quá nhỏ
      const a = await c.send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
        const out = [];
        for (const f of document.querySelectorAll('.frame')) {
          const fr = f.getBoundingClientRect(); const name = f.dataset.name; const probs = new Set();
          for (const el of f.querySelectorAll('*')) {
            const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
            const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
            if (el.closest('.scrim,.float-card,.notif,.sheet')) {}
            const lbl = (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) + ' "' + (el.textContent || '').trim().slice(0, 28) + '"';
            if (r.right > fr.right + 1 || r.bottom > fr.bottom + 1 || r.left < fr.left - 1) probs.add('ra ngoài khung: ' + lbl);
            const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
            if (hasText && el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') probs.add('chữ bị cắt ngang: ' + lbl);
            if (hasText && parseFloat(cs.fontSize) < 12) probs.add('chữ < 12px: ' + lbl);
            if (el.tagName === 'IMG' && !el.naturalWidth) probs.add('ảnh không nạp: ' + el.getAttribute('src'));
            if (hasText) { const p = el.parentElement.getBoundingClientRect(); if (r.right > p.right + 2 && getComputedStyle(el.parentElement).overflow !== 'visible') probs.add('chữ tràn khỏi khối cha: ' + lbl); }
          }
          if (probs.size) out.push(name + '\\n   - ' + [...probs].slice(0, 6).join('\\n   - '));
        }
        return out;
      })()` });
      if (a.result.value.length) console.log('AUDIT ' + file + ':\n' + a.result.value.join('\n'));
    }
    if (process.env.CHECK) { // dựng lại từ SVG trong cùng trang (font đã nạp) để so với ảnh chụp HTML
      await mkdir(path.join(ROOT, 'export', 'check'), { recursive: true });
      for (const fr of r.result.value) {
        await c.send('Runtime.evaluate', { expression: `document.body.style.cssText='margin:0;padding:0;display:block;background:#fff';document.body.innerHTML=${JSON.stringify(fr.svg)};window.scrollTo(0,0);true` });
        await sleep(250);
        const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: fr.w, height: fr.h, scale: 1 } });
        await writeFile(path.join(ROOT, 'export', 'check', fr.name + '.png'), Buffer.from(shot.data, 'base64'));
      }
    }
    c.close();
    await fetch(`http://127.0.0.1:${DBG}/json/close/${t.id}`).catch(() => 0);
  }
  console.log(summary.join('\n')); console.log(`\n${summary.length} khung -> export/svg và export/png`);
} catch (e) { console.error('LỖI:', e.message); exitCode = 1; }
finally { chrome.kill(); server.close(); await sleep(200); await rm(profile, { recursive: true, force: true }).catch(() => 0); process.exit(exitCode); }
