// Port of the Helix prototype runtime/lite-avatar.js (LiteAvatar 2D call tile used by the Day 5 demo), copied 17/11/2026 for /hoc/.
// Changes: files under /stage/_shared/voice/ (same layout as the prototype's /voice-files/), and the plain WASM build of onnxruntime-web
// (ort.wasm.min.mjs + ort-wasm-simd-threaded.wasm, 15 MB) instead of the WebGPU bundle (its 29 MB jsep wasm is over the 25 MiB asset limit).
// Avatar LiteAvatar 2D cho màn gọi video, vẽ ngay trong trình duyệt (thử nghiệm nội bộ, xem tools/VOICE.md mục "LiteAvatar 2D").
// Không cần GPU máy chủ lúc chạy: video người (màu | alpha cạnh nhau) phát lặp, WebGL uốn nhẹ theo cử động đầu và ghép lên
// nền động đã làm mờ + lưng ghế; khi nói, bộ vẽ miệng của Lite (ONNX ~1 MB, onnxruntime-web WASM) vẽ vùng miệng 384×384 mỗi
// khung từ ảnh tham chiếu của đúng khung video đang phát và 32 thông số khẩu hình do máy chủ tính từ giọng (CPU).
// Chỉ dán phần đang cử động, không đè lên quần áo; lúc im hiện miệng thật của video (không chạy model).
// Tài nguyên mỗi nhân vật: /voice-files/models/lite/<mã>/ {meta.json, person.mp4|webm, refs.bin, protect.png, lite.onnx} (tools/lipcal/web_export.py).

// la-chan-so vendor copy (24/11/2026): VF resolved relative to this file (../stage/_shared/voice/) instead of the site root,
// and a missing background video no longer fails the load (only the .mp4 background is vendored).
const VF = new URL("../stage/_shared/voice/", import.meta.url).href, N = 384, HN = 192, CW = 1280, CH = 720, TAIL = 8; // TAIL: số khung khép miệng máy chủ thêm sau khi hết tiếng (lite_timeline.py)
let ortP = null;

export function loadOrt() {
  ortP ||= (async () => {
    const ort = await import(`${VF}ort/ort.wasm.min.mjs`);
    ort.env.wasm.wasmPaths = `${VF}ort/`;
    const q = new URLSearchParams(location.search); // núm thử: ?threads=<số luồng>&proxy=0
    ort.env.wasm.proxy = q.get("proxy") === "1"; // /hoc/: off by default (the proxy worker hung under wrangler dev, 17/11); ?proxy=1 to try it
    // leave two cores to the browser (audio, video, page): a saturated CPU made the sound crackle (19/11)
    if (crossOriginIsolated) ort.env.wasm.numThreads = +q.get("threads") || Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 2));
    return ort;
  })();
  return ortP;
}

const VS = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
// Mỗi điểm trên khung ra -> toạ độ khung gốc -> trừ độ dịch của phép uốn đầu (cùng công thức tools/lipcal/head_warp.py) -> lấy màu,
// alpha và miếng miệng (alpha của miếng = trọng số dán).
const FS = `precision highp float;
uniform sampler2D uVid, uMouth, uPrev; uniform float uFade;
uniform vec2 uSrc; uniform vec3 uView; uniform vec4 uBox, uFace, uPiv; uniform vec3 uPose; uniform vec2 uShift; uniform float uMouthOn;
vec4 M(vec2 m){ return mix(texture2D(uPrev, m), texture2D(uMouth, m), uFade); } // hoà từ miếng miệng trước sang miếng mới
void main(){
  vec2 c = vec2(gl_FragCoord.x, ${CH}.0 - gl_FragCoord.y);
  vec2 p = vec2((c.x - uView.y) / uView.x, c.y / uView.x + uView.z);
  vec2 e = (p - uFace.xy) / vec2(0.78 * uFace.z, 0.92 * uFace.w);
  float k = clamp(1.0 - dot(e, e), 0.0, 1.0), depth = uPiv.w * uFace.z * k * k;
  float u = clamp((p.y - uPiv.z) / (0.5 * uFace.w), 0.0, 1.0), wv = 1.0 - u * u * (3.0 - 2.0 * u);
  vec2 r = p - uPiv.xy; float cr = cos(uPose.z), sr = sin(uPose.z);
  vec2 q = p - (wv * (vec2(cr * r.x - sr * r.y, sr * r.x + cr * r.y) - r + uShift * uFace.z) + uPose.xy * depth);
  if (q.x < 0.0 || q.y < 0.0 || q.x > uSrc.x || q.y > uSrc.y) { gl_FragColor = vec4(0.0); return; }
  vec2 uv = q / uSrc; float hx = clamp(uv.x * 0.5, 0.0005, 0.4995);
  vec3 col = texture2D(uVid, vec2(hx, uv.y)).rgb;
  float a = texture2D(uVid, vec2(0.5 + hx, uv.y)).g;
  vec2 m = (q - uBox.xy) / (uBox.zw - uBox.xy);
  if (uMouthOn > 0.5 && m.x > 0.0 && m.y > 0.0 && m.x < 1.0 && m.y < 1.0) {
    vec4 t = M(m); float d = 1.0 / ${N}.0;
    vec3 nb = (M(m + vec2(d, 0.0)).rgb + M(m - vec2(d, 0.0)).rgb + M(m + vec2(0.0, d)).rgb + M(m - vec2(0.0, d)).rgb) * 0.25;
    col = mix(col, clamp(t.rgb + 0.6 * (t.rgb - nb), 0.0, 1.0), t.a); // làm nét nhẹ: ảnh bộ vẽ mềm hơn video gốc
  }
  gl_FragColor = vec4(col * a, a);
}`;

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// /hoc/ 18/11: the heavy part of a character (files, mouth model, rest poses of all reference frames: ~30 MB and ~150 model runs,
// 7–11 s on a dev machine) is prepared once per page by prepareLite(), which needs no WebGL and no host, so the lesson can start it a
// few scenes before the call and the call opens with the character already live. mountLiteAvatar() reuses it.
const preps = new Map();
export function prepareLite(id) {
  if (preps.has(id)) return preps.get(id);
  const base = `${VF}models/lite/${id}`, fans = new Set();
  const P = { id, pct: 0, busy: false, hold: () => false, rests: null, ms: 0, runs: 0,
    progress(f) { fans.add(f); f(P.pct); return () => fans.delete(f); } };
  const prog = (v) => { P.pct = Math.max(P.pct, v); fans.forEach((f) => { try { f(P.pct); } catch (e) { /* listener gone */ } }); };
  let got = 0; const step = (x) => { prog(0.35 * ++got / 7); return x; }; // 7 downloads/steps = first 35 %, rest poses the other 65 %
  const blobUrl = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error("không nạp được " + u); return r.blob(); }).then((b) => URL.createObjectURL(b));
  P.load = (async () => {
    const ext = document.createElement("video").canPlayType('video/mp4; codecs="avc1.640028"') ? "mp4" : "webm"; // Chromium nguyên bản không có H.264: dùng bản VP9
    const [meta, ort, refsBuf, protImg] = await Promise.all([
      fetch(`${base}/meta.json`).then((r) => r.json()).then(step), loadOrt().then(step),
      fetch(`${base}/refs.bin`).then((r) => r.arrayBuffer()).then(step),
      new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = `${base}/protect.png`; }).then(step),
    ]);
    // the two videos are kept whole in memory (blob URLs, ~13 MB) so the call never waits on the network for them
    const [sess, vidUrl, bgUrl] = await Promise.all([
      ort.InferenceSession.create(`${base}/lite.onnx`, { executionProviders: ["wasm"] }).then(step),
      blobUrl(`${base}/person.${ext}`).then(step),
      meta.bg.name ? blobUrl(`${VF}assets/bg/${meta.bg.name}.mp4`).catch(() => blobUrl(`${VF}assets/bg/${meta.bg.name}.${ext}`)).catch(() => "").then(step) : step(""),
    ]);
    const NR = meta.refs, rc = Object.assign(document.createElement("canvas"), { width: N, height: N }).getContext("2d", { willReadFrequently: true });
    rc.imageSmoothingQuality = "low";
    const refs = new Array(NR);
    P.refTensor = async (k) => {
      if (!refs[k]) {
        const bmp = await createImageBitmap(new Blob([refsBuf.slice(meta.ref_offsets[k], meta.ref_offsets[k + 1])], { type: "image/jpeg" }));
        rc.drawImage(bmp, 0, 0, N, N); bmp.close();
        const d = rc.getImageData(0, 0, N, N).data, u = new Uint8Array(3 * N * N);
        for (let i = 0, Q = N * N; i < Q; i++) { u[i] = d[i * 4]; u[Q + i] = d[i * 4 + 1]; u[2 * Q + i] = d[i * 4 + 2]; }
        refs[k] = u;
      }
      const u = refs[k], refT = new Float32Array(u.length); // mảng mới mỗi lần: onnxruntime-web chuyển hẳn bộ đệm sang worker
      for (let i = 0; i < u.length; i++) refT[i] = u[i] / 127.5 - 1;
      return new ort.Tensor("float32", refT, [1, 3, N, N]);
    };
    P.run = async (k, params) => {
      const t = performance.now();
      const out = await sess.run({ ref: await P.refTensor(k), params: new ort.Tensor("float32", Float32Array.from(params), [1, 32]) });
      const dt = performance.now() - t; P.ms = P.ms ? P.ms * 0.9 + dt * 0.1 : dt; P.runs++;
      return out.mouth.data;
    };
    P.rests = new Array(NR);
    return { meta, ort, protImg, vidUrl, bgUrl, ext };
  })();
  // ảnh dáng khép cho từng khung tham chiếu (để biết phần nào của miệng đang cử động): tính nền, nhường khi đang nói
  P.ready = P.load.then(async ({ meta }) => {
    const NR = meta.refs;
    for (let k = 0; k < NR; k++) {
      while (P.busy || P.hold()) await new Promise((ok) => setTimeout(ok, 30));
      P.busy = true;
      try { P.rests[k] = half(await P.run(k, meta.rest)); } finally { P.busy = false; }
      prog(0.35 + 0.65 * (k + 1) / NR);
      await new Promise((ok) => setTimeout(ok, 40));   // paced: this runs while the story is still being narrated, which must not crackle
    }
  });
  P.load.catch(() => preps.delete(id)); // a failed preparation (offline, no WASM) may be tried again by the call
  preps.set(id, P);
  return P;
}
// ảnh bộ vẽ [-1,1] CHW 384 -> Uint8 192×192×3 (trung bình 2×2)
function half(d) {
  const o = new Uint8Array(HN * HN * 3), P = N * N;
  for (let c = 0; c < 3; c++) for (let y = 0; y < HN; y++) for (let x = 0; x < HN; x++) {
    const i = c * P + 2 * y * N + 2 * x;
    o[(y * HN + x) * 3 + c] = Math.max(0, Math.min(255, ((d[i] + d[i + 1] + d[i + N] + d[i + N + 1]) * 0.125 + 0.5) * 255));
  }
  return o;
}

// Gắn avatar vào host (khối 16:9). Trả về { say(clip), stop(), speaking(), stats(), ready (Promise chuẩn bị xong ảnh dáng khép), meta }.
// clip = { buf: AudioBuffer, params: [[32]...], bg: [...] }; audioCtx dùng chung với trang.
export async function mountLiteAvatar(host, id, audioCtx) {
  const PR = prepareLite(id), { meta, ort, protImg, vidUrl, bgUrl } = await PR.load, rests = PR.rests, run = PR.run;
  const [W, H] = meta.size, [bx1, by1, bx2, by2] = meta.box, g = meta.warp, NR = meta.refs;
  const s = CH / (meta.view.bottom - meta.view.y0), ox = (CW - W * s) / 2, y0 = meta.view.y0;

  // ----- các lớp: nền động (mờ) -> ghế -> người (WebGL) -----
  host.style.position = "relative"; host.style.overflow = "hidden"; host.style.background = "#222";
  const abs = { position: "absolute", left: "0", top: "0" };
  const bgv = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, autoplay: true });
  if (bgUrl) bgv.src = bgUrl;
  Object.assign(bgv.style, abs, { maxWidth: "none" });
  const chair = Object.assign(document.createElement("canvas"), { width: CW, height: CH });
  const cv = Object.assign(document.createElement("canvas"), { width: CW, height: CH });
  for (const c of [chair, cv]) Object.assign(c.style, abs, { width: "100%", height: "100%" });
  host.append(bgv, chair, cv);
  const layout = () => {
    const w = host.clientWidth, h = host.clientHeight, vw = bgv.videoWidth || 1280, vh = bgv.videoHeight || 738;
    const k = Math.max(w / vw, h / vh) * meta.bg.zoom, eye = (meta.eye_y - y0) * s * (h / CH);
    const top = Math.min(0, Math.max(h - vh * k, eye - meta.bg.horizon * vh * k)); // đường chân trời của nền ngang tầm mắt nhân vật
    Object.assign(bgv.style, { width: `${vw * k}px`, height: `${vh * k}px`, left: `${(w - vw * k) / 2}px`, top: `${top}px`, filter: `blur(${meta.bg.blur * w / CW}px)` });
    chair.style.filter = `blur(${2.2 * w / CW}px)`;
  };
  new ResizeObserver(layout).observe(host); bgv.addEventListener("loadedmetadata", layout); layout();
  drawChair(chair.getContext("2d"), meta.chair, s, ox, y0);

  // ----- video người + WebGL -----
  const vid = Object.assign(document.createElement("video"), { src: vidUrl, muted: true, loop: true, playsInline: true });
  await new Promise((ok, no) => { vid.addEventListener("loadeddata", ok, { once: true }); vid.addEventListener("error", () => no(new Error("không nạp được video nhân vật")), { once: true }); });
  const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) throw new Error("trình duyệt này không bật WebGL (cần để vẽ nhân vật)");
  const prog = gl.createProgram();
  for (const [t, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error("shader: " + gl.getShaderInfoLog(sh));
    gl.attachShader(prog, sh);
  }
  gl.bindAttribLocation(prog, 0, "p"); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const tex = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return t; };
  // hai miếng miệng luân phiên: bộ vẽ chậm hơn 30 khung/giây (WASM ~50–100 ms/khung) nên hoà dần giữa hai miếng liên tiếp cho mượt
  const tVid = tex(0), tM = [tex(1), tex(2)];
  for (const u of [1, 2]) { gl.activeTexture(gl.TEXTURE0 + u); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(N * N * 4)); }
  let cur = 0, tPatch = 0, gap = 60;
  const uM = U("uMouth"), uP = U("uPrev"), uFade = U("uFade");
  gl.uniform1i(U("uVid"), 0);
  gl.uniform2f(U("uSrc"), W, H); gl.uniform3f(U("uView"), s, ox, y0); gl.uniform4f(U("uBox"), bx1, by1, bx2, by2);
  gl.uniform4f(U("uFace"), g.cx, g.cy, g.fw, g.fh); gl.uniform4f(U("uPiv"), g.piv[0], g.piv[1], g.chin_y, g.depth);
  const uPose = U("uPose"), uShift = U("uShift"), uOn = U("uMouthOn");

  // ----- dữ liệu cho miếng miệng (không gian 384×384 của bộ vẽ) -----
  const pc = Object.assign(document.createElement("canvas"), { width: protImg.width, height: protImg.height }).getContext("2d", { willReadFrequently: true });
  pc.drawImage(protImg, 0, 0);
  const pd = pc.getImageData(0, 0, protImg.width, protImg.height).data, PC = meta.protect.cols, PS = meta.protect.cell, PW = protImg.width;
  const bw = bx2 - bx1, bh = by2 - by1, fg = new Float32Array(N * N), zone = new Float32Array(N * N);
  const [r0, r1, c0, c1] = meta.zone, zx = (c0 + c1) / 2, zy = (r0 + r1) / 2, za = (c1 - c0) * 0.62, zb = (r1 - r0) * 0.62;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.min(x * bw / N, (N - 1 - x) * bw / N, y * bh / N, (N - 1 - y) * bh / N); // cách mép hộp (px khung gốc)
    fg[y * N + x] = sstep(2, 20, d);
    zone[y * N + x] = 1 - sstep(0.85, 1.15, Math.hypot((x - zx) / za, (y - zy) / zb)); // vùng miệng: luôn dùng ảnh vẽ
  }
  const patch = new Uint8Array(N * N * 4), mv = new Float32Array(HN * HN), tmp = new Float32Array(HN * HN);
  function compose(d, k, bgw) {
    const P = N * N, rest = rests[k];
    if (rest) { // phần đang cử động: khác ảnh dáng khép của cùng khung tham chiếu (ngưỡng 4..14 /255), nới 2 ô rồi làm mềm
      for (let y = 0, j = 0; y < HN; y++) for (let x = 0; x < HN; x++, j++) {
        let m = 0;
        for (let c = 0; c < 3; c++) { const i = c * P + 2 * y * N + 2 * x; m = Math.max(m, Math.abs(((d[i] + d[i + 1] + d[i + N] + d[i + N + 1]) * 0.125 + 0.5) * 255 - rest[j * 3 + c])); }
        mv[j] = sstep(4, 14, m);
      }
      for (const [src, dst, st, mode] of [[mv, tmp, 1, 0], [tmp, mv, HN, 0], [mv, tmp, 1, 1], [tmp, mv, HN, 1]]) // lớn nhất rồi trung bình, tách hai chiều
        for (let y = 0; y < HN; y++) for (let x = 0; x < HN; x++) {
          const j = y * HN + x, lim = st === 1 ? x : y; let v = mode ? 0 : src[j], n = 0;
          for (let o = -2; o <= 2; o++) { if (lim + o < 0 || lim + o >= HN) continue; const w = src[j + o * st]; if (mode) { v += w; n++; } else if (w > v) v = w; }
          dst[j] = mode ? v / n : v;
        }
    } else mv.fill(0);
    const px = (k % PC) * PS, py = Math.floor(k / PC) * PS;
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++) {
      const hy = y >> 1, hx = x >> 1, prot = pd[((py + hy) * PW + px + hx) * 4] / 255;
      const a = fg[i] * (1 - bgw) * Math.max(mv[hy * HN + hx], zone[i]) * (1 - prot);
      patch[i * 4] = (d[i] * 0.5 + 0.5) * 255; patch[i * 4 + 1] = (d[P + i] * 0.5 + 0.5) * 255; patch[i * 4 + 2] = (d[2 * P + i] * 0.5 + 0.5) * 255; patch[i * 4 + 3] = a * 255;
    }
    const now = performance.now(), first = !mouthOn;
    if (tPatch && now - tPatch < 400) gap = gap * 0.7 + (now - tPatch) * 0.3;
    tPatch = now; cur ^= 1;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (const u of first ? [1, 2] : [1 + cur]) { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, tM[u - 1]); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, patch); }
  }

  // ----- vòng vẽ -----
  let frame = 0, newFrame = true, clip = null, t0 = 0, mouthOn = false, env = 0, src = null, analyser = null, alive = true, done = null;
  const kr = () => { const j = frame % (2 * NR); return j < NR ? j : 2 * NR - 1 - j; };
  if (vid.requestVideoFrameCallback) { const on = (_, m) => { frame = Math.round(m.mediaTime * meta.fps) % meta.frames; newFrame = true; if (alive) vid.requestVideoFrameCallback(on); }; vid.requestVideoFrameCallback(on); }
  const TW = 20, w = (t, k, ph = 0) => Math.sin(2 * Math.PI * k * t / TW + ph), rad = Math.PI / 180, lv = new Float32Array(512);
  function tick() {
    if (!alive) return;
    requestAnimationFrame(tick);
    if (!vid.requestVideoFrameCallback) { const f = Math.floor(vid.currentTime * meta.fps) % meta.frames; newFrame = f !== frame; frame = f; }
    if (newFrame && vid.readyState >= 2) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tVid); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid); }
    // khẩu hình theo đồng hồ âm thanh, lấy trước một khoảng bằng thời gian vẽ + nửa thời gian hoà để miệng khớp tiếng
    if (clip) {
      const i = Math.floor((audioCtx.currentTime - t0 - (audioCtx.outputLatency || audioCtx.baseLatency || 0) + Math.min(0.2, Math.max(0.04, 1.5 * PR.ms / 1000))) * 30);   // what is heard now = currentTime − output latency
      // còn câu chờ sẵn thì kết thúc ngay khi hết tiếng (bỏ mấy khung khép miệng cuối) để câu sau nối liền
      if (i >= clip.params.length - (clip.more?.() ? TAIL : 0)) { clip = null; mouthOn = false; done?.(); }
      else if (i >= 0) {
        const bgw = clip.bg[i] ?? 0;
        if (bgw >= 0.999) mouthOn = false;
        else if (!PR.busy && newFrame) { PR.busy = true; const k = kr(); run(k, clip.params[i]).then((d) => { if (clip) { compose(d, k, bgw); mouthOn = true; } }).catch((e) => console.warn("miệng Lite:", e)).finally(() => (PR.busy = false)); }
      }
    }
    newFrame = false;
    if (analyser && clip) { analyser.getFloatTimeDomainData(lv); let q = 0; for (let i = 0; i < lv.length; i++) q += lv[i] * lv[i]; env += (Math.min(1, Math.sqrt(q / lv.length) * 6) - env) * 0.25; } else env *= 0.9;
    const t = performance.now() / 1000; // lắc lư chậm + gật nhẹ theo giọng (cùng đường cong tools/lipcal/idle_motion.py)
    gl.uniform3f(uPose, rad * (2.2 * w(t, 2) + 1.0 * w(t, 5, 1.0) + 0.4 * w(t, 9, 2.1)), rad * (1.3 * w(t, 3, 0.5) + 0.7 * w(t, 8, 1.7) + 1.4 * env), rad * (1.1 * w(t, 1, 0.8) + 0.5 * w(t, 4, 2.6)));
    gl.uniform2f(uShift, 0.012 * w(t, 2, 0.4) + 0.006 * w(t, 7, 1.2), 0.006 * w(t, 5, 2.0));
    gl.uniform1f(uOn, mouthOn ? 1 : 0); gl.uniform1i(uM, 1 + cur); gl.uniform1i(uP, 2 - cur);
    gl.uniform1f(uFade, Math.min(1, (performance.now() - tPatch) / Math.max(20, gap)));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  await vid.play().catch(() => {}); bgv.play().catch(() => {});
  tick();

  PR.hold = () => !!clip;   // the shared rest-pose loop (prepareLite) waits while this tile speaks

  function stop() { try { src?.stop(); } catch (e) { /* đã dừng */ } src = null; clip = null; mouthOn = false; done?.(); }
  // phát một câu đã chuẩn bị; trả về khi nói xong (kể cả vài khung khép miệng sau khi hết tiếng) hoặc bị dừng
  // more(): hàm cho biết còn câu kế tiếp đã sẵn sàng hay chưa
  function say(c, more) {
    stop(); c = { ...c, more };
    return new Promise((ok) => {
      done = () => { done = null; ok(); };
      analyser ||= Object.assign(audioCtx.createAnalyser(), { fftSize: 512 });
      src = audioCtx.createBufferSource(); src.buffer = c.buf; src.connect(analyser); src.connect(audioCtx.destination);
      // tab bị ẩn thì trình duyệt ngừng requestAnimationFrame nên vòng vẽ không báo xong câu: tiếng vẫn phát,
      // nên hết tiếng mà tab đang ẩn thì tự kết thúc câu để cuộc gọi chạy tiếp (12/11, người dùng: chuyển tab vẫn nghe tiếp được)
      src.onended = () => { if (clip === c && document.hidden) { clip = null; mouthOn = false; done?.(); } };
      t0 = audioCtx.currentTime + 0.02; clip = c; src.start(t0);
    });
  }
  return { say, stop, ready: PR.ready, meta, speaking: () => !!clip, stats: () => ({ ms: Math.round(PR.ms * 10) / 10, runs: PR.runs, threads: crossOriginIsolated ? ort.env.wasm.numThreads : 1 }),
    destroy() { alive = false; stop(); PR.hold = () => false; vid.pause(); bgv.pause(); bgv.remove(); chair.remove(); cv.remove(); } };
}

// lưng ghế văn phòng vẽ tay phía sau nhân vật (làm mờ bằng CSS): rộng hơn vai một chút, bo góc, tối màu
function drawChair(c, ch, s, ox, y0) {
  const cx = ch.cx * s + ox, w = ch.w * s, top = (ch.top - y0) * s, x = cx - w / 2, r = 0.26 * w, da = ch.kind === "da";
  c.beginPath(); c.moveTo(x, CH); c.lineTo(x, top + r); c.quadraticCurveTo(x, top, x + r, top); c.lineTo(x + w - r, top); c.quadraticCurveTo(x + w, top, x + w, top + r); c.lineTo(x + w, CH); c.closePath();
  const g = c.createLinearGradient(0, top, 0, CH), b = da ? [30, 31, 34] : [37, 38, 40];
  g.addColorStop(0, `rgb(${b.map((v) => Math.round(v * 1.25)).join(",")})`); g.addColorStop(1, `rgb(${b.map((v) => Math.round(v * 0.8)).join(",")})`);
  c.globalAlpha = da ? 0.98 : 0.95; c.fillStyle = g; c.fill();
  c.save(); c.clip();
  const sh = c.createLinearGradient(x, 0, x + w, 0); sh.addColorStop(0, "rgba(0,0,0,.28)"); sh.addColorStop(0.5, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.28)");
  c.globalAlpha = 1; c.fillStyle = sh; c.fillRect(x, top, w, CH - top);
  if (da) { c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 6; for (let y = top + 0.22 * w; y < CH; y += 0.24 * w) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); } }
  c.restore();
}
