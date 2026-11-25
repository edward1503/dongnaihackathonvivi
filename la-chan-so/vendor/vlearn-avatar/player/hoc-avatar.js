// Teach-back call tile for /hoc/: the role-play character as a LiteAvatar (lip-sync, head motion, blink, moving office background),
// speaking pre-made lines. Lip parameters are computed once offline from each voice file (tools/stage-demo/scripts/lip_params.py ->
// /stage/<aid>/lip/<line>.json), so the call needs no voice server.
import { mountLiteAvatar, prepareLite } from './hoc-lite.js';
import { lipFromSamples, to16k } from './hoc-lipfit.js';

// base64 PCM16 little-endian parts (Gemini TTS) -> Float32 samples
export function pcmFrom(parts) {
  const bins = parts.map(b => atob(b)), n = bins.reduce((a, b) => a + b.length, 0) >> 1, out = new Float32Array(n); let o = 0;
  for (const b of bins) for (let i = 0; i + 1 < b.length; i += 2) { const v = b.charCodeAt(i) | (b.charCodeAt(i + 1) << 8); out[o++] = (v > 32767 ? v - 65536 : v) / 32768; }
  const f = Math.min(120, n >> 2); for (let i = 0; i < f; i++) { const g = i / f; out[i] *= g; out[n - 1 - i] *= g; }   // 5 ms fades: no click at either end
  return out;
}

const webgl = () => { try { const c = document.createElement('canvas'), gl = c.getContext('webgl'); if (!gl) return false; gl.getExtension('WEBGL_lose_context')?.loseContext(); return true; } catch { return false; } };

// Start loading the character a few scenes before the call (18/11, user: the call took a long time to open). Nothing to do where the
// tile cannot be drawn (no WebGL) or the learner asked to save data. Returns the shared preparation, or null.
export function prepareCall(id) {
  if (!webgl() || (navigator.connection && navigator.connection.saveData)) return null;
  const P = prepareLite(id); P.load.catch(e => console.warn('LiteAvatar preload', e)); P.ready.catch(() => {});
  return P;
}

// onProgress(0..1): loading share while the character is not live yet (the page shows it on the connecting screen)
export async function mountCall(host, id, onProgress = () => {}, readyWait = 15000) {   // readyWait: la-chan-so vendor addition
  if (!webgl()) throw new Error('no WebGL');   // decide before downloading ~30 MB that could never be drawn
  const P = prepareLite(id), off = P.progress(onProgress);
  // a deep output buffer: the mouth model keeps the CPU busy, and a small buffer runs dry under that load, which crackles ("rẹt rẹt", 19/11);
  // the lip timing subtracts the output latency (hoc-lite.js), so the mouth still meets the sound
  const ctx = new AudioContext({ latencyHint: 'playback' }); await ctx.resume().catch(() => {});
  const layer = document.createElement('div'); Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' }); host.appendChild(layer);
  let av;
  try { av = await mountLiteAvatar(layer, id, ctx); }
  catch (e) { off(); layer.remove(); ctx.close().catch(() => {}); throw e; }   // no WebGL / no WASM: the page keeps the still picture
  await Promise.race([av.ready, new Promise(r => setTimeout(r, readyWait))]);   // the rest poses; never wait forever on a slow machine
  off(); onProgress(1);
  host.querySelectorAll('.still').forEach(x => x.remove());
  return {
    async speak(audioUrl, lipUrl) {
      const [buf, lip] = await Promise.all([
        fetch(audioUrl).then(r => { if (!r.ok) throw new Error('no voice ' + audioUrl); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b)),
        fetch(lipUrl).then(r => (r.ok ? r.json() : null)).catch(() => null)]);
      if (!lip) throw new Error('no lip params ' + lipUrl);
      await av.say({ buf, params: lip.params, bg: lip.bg || [] }, () => false);
    },
    // a live reply (voiced at run time): the mouth comes from the sound itself (hoc-lipfit.js), no lip file exists for it
    async speakLive(parts, rate, M) {
      const pcm = pcmFrom(parts);
      // la-chan-so (25/11/2026): KHÔNG đặt thẳng mẫu 24 kHz vào AudioBuffer rồi phát ở đầu phát 48 kHz. Khi tần số bộ đệm khác tần số đầu phát,
      // AudioBufferSourceNode chỉ nội suy tuyến tính, sinh méo ở dải cao nghe "rẹt rẹt" (đo trên máy thử: không hụt tiếng lần nào, tiếng đã lọc
      // bằng ffmpeg mà vẫn rẹt; câu thu sẵn đi qua decodeAudioData thì sạch). Gói thành WAV rồi để decodeAudioData đổi tần số bằng bộ lọc tốt.
      const n = Math.max(1, pcm.length), wav = new ArrayBuffer(44 + n * 2), dv = new DataView(wav), chu = (o, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(o + i, t.charCodeAt(i)); };
      chu(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); chu(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); chu(36, 'data'); dv.setUint32(40, n * 2, true);
      for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767, true);
      let buf;
      try { buf = await ctx.decodeAudioData(wav); }
      catch { buf = ctx.createBuffer(1, n, rate); buf.getChannelData(0).set(pcm); }   // máy không giải mã được WAV: đành phát thẳng
      const lip = lipFromSamples(await to16k(buf), M);
      await av.say({ buf, params: lip.params, bg: lip.bg }, () => false);
    },
    // la-chan-so vendor addition (24/11/2026): play an audio FILE; lip params from lipUrl when given and found,
    // otherwise computed in the browser from the sound (same lipfit path as speakLive). Resolves { lip: 'file' | 'lipfit' } when done.
    async speakFile(audioUrl, lipUrl, M, onStart, opt) {
      const [buf, lipF] = await Promise.all([
        fetch(audioUrl).then(r => { if (!r.ok) throw new Error('no voice ' + audioUrl); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b)),
        lipUrl ? fetch(lipUrl).then(r => (r.ok ? r.json() : null)).catch(() => null) : null]);
      const lip = lipF || lipFromSamples(await to16k(buf), M);
      // la-chan-so (25/11/2026): tệp khẩu hình có trường "mieng" = hình miệng đã dựng sẵn thành video (tools/dung-mieng.py); opt.nhanh = tiếng đệm
      const mieng = lipF?.mieng ? { url: new URL(lipF.mieng.tep, new URL(lipUrl, location.href)).href, F: lipF.mieng.F } : null;
      onStart?.(buf.duration, mieng ? 'dung-san' : lipF ? 'file' : 'lipfit', lip);
      await av.say({ buf, params: lip.params, bg: lip.bg || [], mieng, nhanh: !!opt?.nhanh }, () => false);
      return { lip: mieng ? 'dung-san' : lipF ? 'file' : 'lipfit', duration: buf.duration };
    },
    stop() { try { av.stop(); } catch {} },
    ctx,
    destroy() { try { av.destroy(); } catch {} ctx.close().catch(() => {}); },
  };
}
