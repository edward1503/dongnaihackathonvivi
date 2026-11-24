// Mouth parameters for live speech in the /hoc/ call (18/11). The character's replies are voiced at run time, and no LiteAvatar
// audio2mouth server runs behind the Worker, so the page derives the 32 Lite mouth parameters from the sound: a ridge regression from
// short-time spectra, fitted on the character's pre-voiced lines (tools/stage-demo/scripts/lip_fit.py -> /stage/<aid>/lipfit-<char>.json).
// Features mirror lip_fit.py exactly: 16 kHz mono; frame i centred at i/30 s; 640-sample periodic Hann window, FFT 1024; 16 log10 band
// energies (edges from the model file) + window RMS in dB; frames i+ctx stacked; standardised; params = W·z + b; bg = smoothstep of -RMS dB.

function fftPow(re, im) {   // in-place radix-2 FFT (n = power of two); returns |X|² for bins 0..n/2
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const p = i + k, q = p + len / 2, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  const out = new Float64Array(n / 2 + 1); for (let k = 0; k <= n / 2; k++) out[k] = re[k] * re[k] + im[k] * im[k];
  return out;
}

// x: Float32Array of 16 kHz mono samples -> { params: [[32]…], bg: […] } (ceil(dur·30) + tail frames, as the Lite lip files)
export function lipFromSamples(x, M) {
  const SR = M.sr, WIN = M.win, NFFT = M.nfft, NB = M.edges.length - 1, F = NB + 1;
  const nf = Math.ceil(x.length / SR * 30) + (M.tail || 9);
  const hann = new Float64Array(WIN); for (let i = 0; i < WIN; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WIN);
  const bands = []; for (let k = 0; k < NB; k++) { const b = []; for (let j = 0; j <= NFFT / 2; j++) { const f = j * SR / NFFT; if (f >= M.edges[k] && f < M.edges[k + 1]) b.push(j); } bands.push(b); }
  const feat = new Float64Array(nf * F), re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (let i = 0; i < nf; i++) {
    const c = Math.round(i / 30 * SR), a = c - WIN / 2; let s2 = 0;
    re.fill(0); im.fill(0);
    for (let k = 0; k < WIN; k++) { const t = a + k, v = t >= 0 && t < x.length ? x[t] : 0; s2 += v * v; re[k] = v * hann[k]; }
    const p = fftPow(re, im);
    for (let k = 0; k < NB; k++) { let e = 0; for (const j of bands[k]) e += p[j]; feat[i * F + k] = Math.log10(e + 1e-9); }
    feat[i * F + NB] = 20 * Math.log10(Math.sqrt(s2 / WIN) + 1e-9);
  }
  const D = M.ctx.length * F, z = new Float64Array(D), params = [], bg = [];
  for (let i = 0; i < nf; i++) {
    M.ctx.forEach((o, ci) => { const r = Math.min(nf - 1, Math.max(0, i + o)); for (let k = 0; k < F; k++) z[ci * F + k] = (feat[r * F + k] - M.mean[ci * F + k]) / M.std[ci * F + k]; });
    params.push(M.W.map((w, j) => { let s = M.b[j]; for (let k = 0; k < D; k++) s += w[k] * z[k]; return s; }));
    const q = -feat[i * F + NB], t = Math.min(1, Math.max(0, (q - M.bg[0]) / (M.bg[1] - M.bg[0]))); bg.push(t * t * (3 - 2 * t));
  }
  return { params, bg };
}

// AudioBuffer (any rate) -> 16 kHz mono samples, through an OfflineAudioContext (the browser's own resampler)
export async function to16k(buf) {
  const n = Math.ceil(buf.duration * 16000), oc = new OfflineAudioContext(1, n, 16000), src = oc.createBufferSource();
  src.buffer = buf; src.connect(oc.destination); src.start(); return (await oc.startRendering()).getChannelData(0);
}

