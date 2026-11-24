// Quay thao tác thật trên web (Chromium không giao diện + CDP screencast) theo kịch bản JSON.
//   node ghi.mjs <kịch bản.json> <thư mục ra>
// Kịch bản: { base, viewport: [w, h], scale, steps: [...] }
// Bước:
//   {seg:"tên"}                       mở đoạn mới (mỗi đoạn là một bước của video; Remotion giữ khung đầu/cuối khi lời dài hơn)
//   {goto:"/duong-dan", settle}      mở trang
//   {waitFor:"biểu thức JS"}         chờ đến khi đúng
//   {wait: ms}                        đứng yên (vẫn quay)
//   {move: q, dur}                    đưa chuột tới phần tử q (đường cong, chậm dần), hover thật
//   {click: q, settle}                đưa chuột tới rồi nhấn, giữ, nhả
//   {type: q, text, clear}           bấm vào ô rồi gõ từng ký tự
//   {select: q, value}                chọn giá trị trong <select> (bảng chọn gốc không hiện khi quay không giao diện)
//   {scroll: q | {by: px}, dur}       cuộn mượt bằng con lăn tới phần tử q (đặt giữa màn) hoặc thêm by px
//   {focus: q, name}                  ghi khung phần tử (toạ độ CSS) để camera phóng tới; name mặc định "dich"
//   {eval: "JS", settle}
// q: {text, css, nth, within, up} như drive.mjs. Ra: frames/*.jpg + log.json (mốc khung, chuột, khung focus theo đoạn).
import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const [scenarioFile, outDir] = process.argv.slice(2)
const sc = JSON.parse(readFileSync(scenarioFile, "utf8"))
const [W, H] = sc.viewport ?? [1440, 810]
const scale = sc.scale ?? 2
rmSync(join(outDir, "frames"), { recursive: true, force: true })
mkdirSync(join(outDir, "frames"), { recursive: true })
const port = 9300 + Math.floor(Math.random() * 400)
const prof = mkdtempSync(join(outDir, ".chrome-"))
const chrome = spawn("chromium", ["--headless=new", "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb", "--mute-audio", "--autoplay-policy=no-user-gesture-required", ...(process.env.LCS_CHROME_FLAGS ? process.env.LCS_CHROME_FLAGS.split(" ") : []),
  `--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const now = () => performance.now() / 1000
const log = { viewport: [W, H], scale, frames: [], segs: [] }
let seg = null
let cursor = { x: W * 0.62, y: H * 0.72 }

try {
  let targets
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break } catch { await sleep(200) } }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0, nframe = 0, recording = false
  const pending = new Map()
  // Lệnh CDP quá 30 s (vd. trang mở hộp in làm treo JS) thì báo lỗi thay vì chờ mãi.
  const send = (method, params = {}) => new Promise((r, reject) => {
    const my = ++id
    const timer = setTimeout(() => { pending.delete(my); reject(new Error("CDP quá 30 s: " + method)) }, 30000)
    pending.set(my, (d) => { clearTimeout(timer); r(d) })
    ws.send(JSON.stringify({ id: my, method, params }))
  })
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return }
    if (d.method === "Page.screencastFrame") {
      const { data, sessionId } = d.params
      send("Page.screencastFrameAck", { sessionId }).catch(() => {})
      if (!recording) return
      const name = `${String(nframe++).padStart(6, "0")}.jpg`
      writeFileSync(join(outDir, "frames", name), Buffer.from(data, "base64"))
      log.frames.push({ t: now(), name })
    }
  }
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "lỗi evaluate")
    return r.result?.result?.value
  }
  // Lá chắn số: trang vỏ nạp từng màn trong iframe cùng nguồn (cur.view). Tìm ở cả trang vỏ lẫn trong iframe,
  // rồi đổi khung chữ nhật của phần tử trong iframe ra toạ độ trang (iframe bị CSS scale bởi hàm fit).
  //   q.hs: chữ trên nút (.hs có _rule.t) trong iframe;  q.top: chỉ tìm ở trang vỏ;  q.frame: chỉ tìm trong iframe.
  const finder = (q) => `(() => {
    const q = ${JSON.stringify(q)}
    const fr = (typeof cur !== "undefined" && cur && cur.view && cur.view.tagName === "IFRAME") ? cur.view : null
    let fdoc = null
    try { fdoc = fr && fr.contentDocument } catch (e) {}
    if ((q.hs || q.frame) && (!fdoc || (typeof pending !== "undefined" && pending))) return null
    const docs = (q.top ? [document] : (q.hs || q.frame) ? [fdoc] : [fdoc, document]).filter(Boolean)
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = el.ownerDocument.defaultView.getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0" }
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim().toLowerCase()
    let list = []
    for (const doc of docs) {
      if (q.hs) {
        const hs = [...doc.querySelectorAll(".hs")].filter((e) => e._rule && visible(e))
        list = hs.filter((e) => e._rule.t === q.hs)
        if (!list.length) list = hs.filter((e) => norm(e.textContent).startsWith(norm(q.hs)))
      }
      else if (q.css) list = [...doc.querySelectorAll(q.css)].filter(visible).filter((el) => !q.text_has || (el.textContent || "").includes(q.text_has))
      else {
        const text = q.text.toLowerCase()
        const all = [...doc.querySelectorAll(q.within ? q.within + " *" : "button, a, [role=button], [role=tab], [role=menuitem], [role=option], label, summary, input, textarea, select, h1, h2, h3, h4, p, span, div, td, th, li, b, strong, code")].filter(visible)
        const own = (el) => norm([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" "))
        list = all.filter((el) => norm(el.textContent) === text)
        if (!list.length) list = all.filter((el) => own(el).includes(text))
        if (!list.length) list = all.filter((el) => norm(el.textContent).includes(text))
        list.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)
        if (!q.raw) list = [...new Set(list.map((el) => el.closest("button, a, [role=button], [role=tab], [role=menuitem], [role=option], label, summary, .hs") || el))]
      }
      if (list.length) break
    }
    let el = list[q.nth || 0]
    if (!el) return null
    if (q.up) el = el.closest(q.up) || el
    const doc = el.ownerDocument, win = doc.defaultView, inner = doc !== document
    // box: leo lên khối bao (thẻ, bảng, khung) đủ lớn để nhìn ra là một vùng, không lấy riêng một chữ.
    if (q.box) {
      const area = win.innerWidth * win.innerHeight
      for (let p = el; p && p !== doc.body; p = p.parentElement) {
        const b = p.getBoundingClientRect()
        if (b.width * b.height > area * 0.7) break
        el = p
        if (b.width >= Math.min(300, win.innerWidth * 0.8) && b.height >= 64) break
      }
    }
    window.__found = el
    let r = el.getBoundingClientRect()
    let rad = parseFloat(win.getComputedStyle(el).borderTopLeftRadius) || 0
    let x = r.x, y = r.y, w = r.width, h = r.height
    if (inner) {
      // Phần tử nằm ngoài khung nhìn của iframe (màn dài): cuộn mượt trong iframe rồi để vòng chờ tìm lại.
      if (!q.noscroll && (r.y < 0 || r.y + Math.min(r.height, 120) > win.innerHeight)) {
        const key = Math.round(r.y)
        if (window.__scr !== key) { window.__scr = key; el.scrollIntoView({ block: "center", behavior: "smooth" }) }
        return null
      }
      const fb = fr.getBoundingClientRect(), sx = fb.width / fr.offsetWidth, sy = fb.height / fr.offsetHeight
      const y0 = Math.max(0, r.y), y1 = Math.min(win.innerHeight, r.y + r.height)
      x = fb.x + r.x * sx; y = fb.y + y0 * sy; w = r.width * sx; h = Math.max(1, y1 - y0) * sy; rad *= sx
    }
    return { x, y, w, h, r: rad, n: list.length, inner, fixed: true }
  })()`
  const locate = async (q, need = true) => {
    for (let i = 0; i < 30; i++) { const r = await evaluate(finder(q)); if (r) return r; await sleep(200) }
    if (need) throw new Error("Không thấy phần tử: " + JSON.stringify(q))
    return null
  }
  const ev = (e) => { if (seg) seg.events.push({ t: now(), ...e }) }
  const mouse = (type, x, y, extra = {}) => send("Input.dispatchMouseEvent", { type, x, y, button: type === "mouseMoved" ? "none" : "left", clickCount: 1, ...extra })
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
  // Đường chuột hơi cong, nhanh ở giữa, chậm khi tới đích; mỗi 16 ms một mouseMoved để trang nhận hover thật.
  async function glide(x, y, dur) {
    const from = { ...cursor }
    const dist = Math.hypot(x - from.x, y - from.y)
    if (dist < 2) return
    const ms = dur ?? Math.min(1100, 380 + dist * 0.75)
    const bend = Math.min(80, dist * 0.12) * (from.x < x ? -1 : 1)
    const mx = (from.x + x) / 2 + (y - from.y) / (dist || 1) * bend, my = (from.y + y) / 2 - (x - from.x) / (dist || 1) * bend
    ev({ type: "move", x: from.x, y: from.y })
    const t0 = now()
    for (;;) {
      const p = Math.min(1, (now() - t0) * 1000 / ms)
      const e = ease(p)
      const px = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * mx + e * e * x
      const py = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * my + e * e * y
      cursor = { x: px, y: py }
      await mouse("mouseMoved", px, py)
      ev({ type: "move", x: px, y: py })
      if (p >= 1) break
      await sleep(16)
    }
  }
  // Điểm bấm: lệch nhẹ khỏi tâm như tay người, nằm trong phần tử.
  const aim = (r) => ({ x: r.x + Math.min(r.w / 2, Math.max(Math.min(14, r.w / 2), r.w * 0.42)), y: r.y + r.h / 2 + Math.min(3, r.h * 0.08) })
  async function scrollTo(q, dur = 900) {
    if (q.by === undefined) await locate(q)   // chờ phần tử xuất hiện (trang vừa chuyển)
    // Khung cuộn: tổ tiên cuộn được gần nhất của phần tử đích (hoặc của điểm dưới chuột khi cuộn theo by), mặc định là trang.
    const info = await evaluate(`(() => {
      const q = ${JSON.stringify(q)}
      let el = null, want = 0
      if (q.by !== undefined) { el = document.elementFromPoint(${cursor.x}, ${cursor.y}); want = q.by }
      else {
        const r = ${finder(q)}
        if (!r) return null
        el = window.__found
        want = r.y + r.h / 2 - (q.block === "start" ? 140 : innerHeight / 2)
      }
      const scrollable = (n) => { for (; n && n !== document.body && n !== document.documentElement; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 2) return n } return null }
      const box = el && scrollable(el)
      if (box) { const b = box.getBoundingClientRect(); if (q.by === undefined) { const r2 = el.getBoundingClientRect(); want = r2.y + Math.min(r2.height, b.height * 0.8) / 2 - (q.block === 'start' ? b.y + 24 : (Math.max(b.y, 0) + Math.min(b.bottom, innerHeight)) / 2) } return { dy: Math.max(-box.scrollTop, Math.min(box.scrollHeight - box.clientHeight - box.scrollTop, want)), box: [Math.max(0, b.x), Math.max(0, b.y), Math.min(innerWidth, b.right), Math.min(innerHeight, b.bottom)] } }
      const s = document.scrollingElement
      // Cuộn cả trang: chỉ lăn chuột ở chỗ không có khung cuộn riêng (vd. cột chứa phần tử đích), kẻo lăn nhầm khung chi tiết.
      const freeAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && !scrollable(e) }
      let point = null
      if (q.by === undefined && el) {
        const r2 = el.getBoundingClientRect()
        const x = Math.min(innerWidth - 20, Math.max(280, r2.x + Math.min(r2.width / 2, 200)))
        for (const y of [innerHeight / 2, innerHeight * 0.35, innerHeight * 0.65, 140, innerHeight - 60]) if (freeAt(x, y)) { point = [x, y]; break }
      }
      if (!point && !freeAt(${cursor.x}, ${cursor.y})) {
        for (const [x, y] of [[420, innerHeight / 2], [700, innerHeight / 2], [420, 200]]) if (freeAt(x, y)) { point = [x, y]; break }
      }
      return { dy: Math.max(-s.scrollTop, Math.min(s.scrollHeight - s.clientHeight - s.scrollTop, want)), box: [264, 64, innerWidth, innerHeight], point }
    })()`)
    if (!info) throw new Error("Không thấy phần tử để cuộn tới: " + JSON.stringify(q))
    const dy = info.dy
    const [bx0, by0, bx1, by1] = info.box
    if (info.point) await glide(info.point[0], info.point[1], 450)
    else if (!(cursor.x > bx0 + 10 && cursor.x < bx1 - 10 && cursor.y > by0 + 10 && cursor.y < by1 - 10))
      await glide(Math.min(bx1 - 60, Math.max(bx0 + 60, (bx0 + bx1) / 2)), Math.min(by1 - 60, Math.max(by0 + 60, (by0 + by1) / 2 + 40)), 450)
    const n = Math.max(6, Math.round(dur / 16))
    ev({ type: "scroll0" })
    let done = 0
    for (let i = 1; i <= n; i++) {
      const target = Math.round(dy * ease(i / n))
      const d = target - done
      done = target
      if (d) await mouse("mouseWheel", cursor.x, cursor.y, { deltaX: 0, deltaY: d })
      await sleep(16)
    }
    ev({ type: "scroll", dy })
    await sleep(250)
  }

  // Tìm phần tử; nếu nằm ngoài màn (hoặc dưới thanh trên) thì cuộn mượt cho nó vào giữa, như người dùng cuộn tới rồi mới bấm.
  async function reach(q) {
    let r = await locate(q)
    // Phần tử trong thanh trên, thanh bên hay hộp thoại luôn nằm yên trên màn: không cuộn.
    if (!r.fixed && (r.y < 64 || r.y + Math.min(r.h, 120) > H - 16)) {
      await scrollTo({ ...q, block: r.h > H * 0.6 ? "start" : undefined }, 800)
      r = await locate(q)
    }
    return r
  }

  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: scale, mobile: false })
  // Lá chắn số: ghi mốc phát tiếng gốc của prototype (thẻ audio, Web Audio) trong mọi frame, để Remotion đặt lại file tiếng.
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const T=()=>{try{return window.top}catch(e){return window}};const log=(k,u,d)=>{try{const t=T();(t.__lcsAud||(t.__lcsAud=[])).push({k,u:String(u||''),d:d||0,t:Date.now()})}catch(e){}};
const P=HTMLMediaElement.prototype;const op=P.play;P.play=function(){log('play',this.src||this.currentSrc,this.duration);return op.apply(this,arguments)};const pp=P.pause;P.pause=function(){if(!this.paused)log('pause',this.src||this.currentSrc);return pp.apply(this,arguments)};
const ab=Response.prototype.arrayBuffer;Response.prototype.arrayBuffer=function(){const u=this.url;return ab.call(this).then(b=>{try{b.__u=u}catch(e){};return b})};
if(window.BaseAudioContext){const d=BaseAudioContext.prototype.decodeAudioData;BaseAudioContext.prototype.decodeAudioData=function(b,...r){const u=b&&b.__u;const p=d.call(this,b,...r);return p&&p.then?p.then(x=>{try{x.__u=u}catch(e){};return x}):p}}
if(window.AudioBufferSourceNode){const S=AudioBufferSourceNode.prototype;const st=S.start;S.start=function(){log('start',this.buffer&&this.buffer.__u,this.buffer&&this.buffer.duration);return st.apply(this,arguments)};const sp=S.stop;S.stop=function(){log('stop',this.buffer&&this.buffer.__u);return sp.apply(this,arguments)}}})()` })
  // Tuỳ chọn khi quay: LCS_THREADS=n → thêm ?threads=n cho trang gọi video (bộ khớp miệng ONNX dùng n luồng wasm).
  if (process.env.LCS_THREADS) await send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{try{if(/video-call\\.html$/.test(location.pathname)&&!/threads=/.test(location.search))history.replaceState(null,'',location.pathname+(location.search?location.search+'&':'?')+'threads=${Number(process.env.LCS_THREADS)}'+location.hash)}catch(e){}})()` })
  await send("Page.enable")
  await send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * scale, maxHeight: H * scale, everyNthFrame: 1 })
  // Ép trang vẽ liên tục để screencast ra khung đều (nếu không, trang đứng yên sẽ không có khung mới).
  const keepAlive = `(() => { if (window.__tick) return; const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:2147483647'; document.documentElement.appendChild(d); let k = 0; window.__tick = setInterval(() => { d.style.background = (k++ % 2) ? '#fefefe' : '#fdfdfd' }, 33) })()`
  let stepNo = 0
  for (const step of sc.steps) {
    stepNo++; globalThis.__where = `bước ${stepNo} (đoạn ${seg?.name ?? '-'}): ${JSON.stringify(step).slice(0, 160)}`
    if (step.seg !== undefined) {
      recording = true
      seg = { name: step.seg, start: now(), events: [{ t: now(), type: "move", x: cursor.x, y: cursor.y }], focus: {}, beats: [{ t: now(), n: 0 }] }
      log.segs.push(seg)
      seg.lastPath = await evaluate("(typeof cur !== 'undefined' && cur && cur.name) ? '/' + cur.name : location.pathname + location.search")
      seg.events.push({ t: now(), type: "url", text: seg.lastPath })
      continue
    }
    if (step.end) { if (seg) seg.end = now(); seg = null; continue }
    if (step.goto !== undefined) { await send("Page.navigate", { url: sc.base + step.goto }); await sleep(step.settle ?? 2500); await evaluate(keepAlive) }
    else if (step.waitFor) {
      const until = Date.now() + (step.timeout ?? 60000)
      let ok = false
      while (Date.now() < until) { if (await evaluate(step.waitFor)) { ok = true; break } await sleep(250) }
      if (!ok) throw new Error("Chờ quá lâu: " + step.waitFor)
      await evaluate(keepAlive)
      await sleep(step.settle ?? 400)
    }
    else if (step.wait) await sleep(step.wait)
    else if (step.scale) {
      // Đổi độ nét giữa chừng (đoạn gọi video quay nhẹ hơn để khẩu hình mượt): đặt lại tỉ lệ điểm ảnh rồi mở lại screencast.
      await send("Page.stopScreencast")
      await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: step.scale, mobile: false })
      await send("Page.startScreencast", { format: "jpeg", quality: step.quality ?? 92, maxWidth: W * step.scale, maxHeight: H * step.scale, everyNthFrame: 1 })
      await sleep(step.settle ?? 900)
    }
    else if (step.closeDialog) {
      // Còn bảng/hộp thoại mở thì đóng bằng Esc như người dùng, rồi mới bấm sang chỗ khác.
      if (await evaluate("!!document.querySelector('[role=dialog]')")) {
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
        ev({ type: "key", text: "Escape" }); await sleep(600)
      }
    }
    else if (step.move) { const r = await reach(step.move); const p = aim(r); ev({ type: "aim", rect: r, act: "move" }); await glide(p.x, p.y, step.dur); await sleep(step.settle ?? 300) }
    else if (step.click) {
      const r = await reach(step.click); const p = aim(r); ev({ type: "aim", rect: r, act: "click", zoom: step.zoom })
      if (seg && step.mark !== false) seg.focus[step.name ?? "dich"] ??= { x: r.x, y: r.y, w: r.w, h: r.h, r: r.r }
      await glide(p.x, p.y, step.dur); await sleep(140)
      await mouse("mousePressed", p.x, p.y); ev({ type: "down", x: p.x, y: p.y }); await sleep(95)
      await mouse("mouseReleased", p.x, p.y); ev({ type: "up", x: p.x, y: p.y })
      await sleep(step.settle ?? 900)
    }
    else if (step.type) {
      const r = await reach(step.type); const p = aim(r); ev({ type: "aim", rect: r, act: "type", zoom: step.zoom })
      if (seg && step.mark !== false) seg.focus[step.name ?? "dich"] ??= { x: r.x, y: r.y, w: r.w, h: r.h, r: r.r }
      await glide(p.x, p.y); await sleep(120)
      await mouse("mousePressed", p.x, p.y); ev({ type: "down", x: p.x, y: p.y }); await sleep(80)
      await mouse("mouseReleased", p.x, p.y); ev({ type: "up", x: p.x, y: p.y }); await sleep(250)
      if (step.clear) {
        // Xoá như người dùng: chọn hết rồi Backspace.
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, modifiers: 2, commands: ["selectAll"] })
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, modifiers: 2 })
        await sleep(120)
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 })
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 })
        await sleep(250)
      }
      ev({ type: "type", text: step.text })
      for (const ch of step.text) { await send("Input.insertText", { text: ch }); await sleep(28 + Math.random() * 40 + (ch === " " ? 30 : 0)) }
      await sleep(step.settle ?? 500)
    }
    else if (step.select) {
      const r = await reach(step.select); const p = aim(r); ev({ type: "aim", rect: r, act: "select", zoom: step.zoom })
      if (seg && step.mark !== false) seg.focus[step.name ?? "dich"] ??= { x: r.x, y: r.y, w: r.w, h: r.h, r: r.r }
      await glide(p.x, p.y); await sleep(140)
      await mouse("mousePressed", p.x, p.y); ev({ type: "down", x: p.x, y: p.y }); await sleep(90); await mouse("mouseReleased", p.x, p.y); ev({ type: "up", x: p.x, y: p.y })
      await sleep(350)
      const q = step.select
      const ok = await evaluate(`(() => { const r = ${finder({ ...q })}; const els = [...document.querySelectorAll(${JSON.stringify(q.css || "select")})]; const el = els.find(e => { const b = e.getBoundingClientRect(); return Math.abs(b.x - r.x) < 1 && Math.abs(b.y - r.y) < 1 }) || els[0];
        const opt = [...el.options].find(o => o.value === ${JSON.stringify(step.value)} || o.textContent.trim() === ${JSON.stringify(step.value)}); if (!opt || opt.disabled) return false;
        const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(el, opt.value); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); return opt.textContent.trim() })()`)
      if (!ok) throw new Error("Không chọn được: " + JSON.stringify(step))
      ev({ type: "select", text: ok })
      await sleep(step.settle ?? 700)
    }
    else if (step.scroll) await scrollTo(step.scroll, step.dur)
    else if (step.beat !== undefined) { if (seg) seg.beats.push({ t: now(), n: step.beat }) }
    else if (step.key) {
      const k = { Escape: [27, "Escape"], Enter: [13, "Enter"], Tab: [9, "Tab"] }[step.key]
      const text = step.key === "Enter" ? "\r" : undefined   // Enter cần ký tự \r thì Chrome mới gửi form
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: k[1], code: k[1], windowsVirtualKeyCode: k[0], text, unmodifiedText: text })
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: k[1], code: k[1], windowsVirtualKeyCode: k[0] })
      ev({ type: "key", text: step.key }); await sleep(step.settle ?? 500)
    }
    else if (step.back) { await evaluate("history.back()"); await sleep(step.settle ?? 1200) }
    else if (step.file) {
      const doc = await send("DOM.getDocument", { depth: -1, pierce: true })
      const q = await send("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: step.file })
      await send("DOM.setFileInputFiles", { nodeId: q.result.nodeId, files: [step.path] })
      ev({ type: "file", text: step.path.split("/").pop() }); await sleep(step.settle ?? 1500)
    }
    else if (step.focus) {
      const r = await reach(step.focus)
      if (seg) seg.focus[step.name ?? "dich"] = { x: r.x, y: r.y, w: r.w, h: r.h, r: r.r, t: now() }
      ev({ type: "look", rect: r, hold: step.hold ?? 2.5, zoom: step.zoom })
    }
    else if (step.eval) { const v = await evaluate(step.eval); if (step.print) console.log("eval:", JSON.stringify(v)?.slice(0, 800)); await sleep(step.settle ?? 300) }
    if (seg && (step.click || step.back || step.goto !== undefined || step.seg !== undefined || step.key || step.waitFor)) {
      const path = await evaluate("(typeof cur !== 'undefined' && cur && cur.name) ? '/' + cur.name : location.pathname + location.search")
      if (path !== seg.lastPath) { seg.lastPath = path; ev({ type: "url", text: path }) }
    }
    if (step.seg === undefined && step.log) console.log(step.log)
  }
  if (seg) seg.end = now()
  try {   // tiếng gốc: đổi giờ trang (Date.now) sang giờ bộ quay rồi gắn vào đoạn chứa nó
    const pageNow = await evaluate("Date.now()"), nodeNow = now()
    const aud = (await evaluate("JSON.stringify(window.__lcsAud||[])")) || "[]"
    const list = JSON.parse(aud).map((a) => ({ ...a, t: a.t / 1000 - pageNow / 1000 + nodeNow }))
    for (const a of list) { const sg = log.segs.find((x) => a.t >= x.start && a.t <= (x.end ?? 1e12)); if (sg) sg.events.push({ t: a.t, type: "audio", k: a.k, src: a.u.split("/").pop().split("?")[0], d: a.d || 0 }) }
    console.log("tiếng gốc:", list.length, "sự kiện; crossOriginIsolated trong gọi video:", await evaluate("String(window.__iso)"))
  } catch (e) { console.log("không lấy được mốc tiếng gốc:", e.message) }
  await sleep(300)
  recording = false
  await send("Page.stopScreencast")
  const t0 = log.frames[0]?.t ?? 0
  const rel = (t) => Math.round((t - t0) * 1000) / 1000
  log.frames = log.frames.map((f) => ({ t: rel(f.t), name: f.name }))
  log.segs = log.segs.map((s) => ({ name: s.name, start: rel(s.start), end: rel(s.end), focus: Object.fromEntries(Object.entries(s.focus).map(([k, v]) => [k, v.t === undefined ? v : { ...v, t: rel(v.t) }])),
    events: s.events.map((e) => ({ ...e, t: rel(e.t) })), beats: s.beats.map((b) => ({ n: b.n, t: rel(b.t) })) }))
  writeFileSync(join(outDir, "log.json"), JSON.stringify(log))
  const dur = log.frames.at(-1)?.t ?? 0
  console.log(`quay xong: ${log.frames.length} khung trong ${dur.toFixed(1)} s (${(log.frames.length / Math.max(1, dur)).toFixed(1)} khung/s), ${log.segs.length} đoạn`)
} catch (e) {
  console.error("LỖI:", e.message, "\n  tại", globalThis.__where)
  process.exitCode = 1
} finally {
  chrome.kill("SIGKILL")
  await sleep(300)
  rmSync(prof, { recursive: true, force: true })
  process.exit(process.exitCode ?? 0)   // còn hẹn giờ CDP treo thì không chờ
}
