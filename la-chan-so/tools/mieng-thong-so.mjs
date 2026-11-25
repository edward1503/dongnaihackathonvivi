// Tính thông số khẩu hình (32 số mỗi khung, 30 khung/giây) cho một tệp giọng, bằng đúng bộ khớp miệng mà trang gọi video dùng.
//   node tools/mieng-thong-so.mjs <tệp giọng> <bộ khớp miệng .json> <tệp ra .json>
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { lipFromSamples } from '../vendor/vlearn-avatar/player/hoc-lipfit.js';
const [,, giong, khop, ra] = process.argv;
const pcm = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', giong, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 2);
const lip = lipFromSamples(x, JSON.parse(readFileSync(khop, 'utf8')));
writeFileSync(ra, JSON.stringify({ fps: 30, params: lip.params.map((p) => Array.from(p, (v) => +v.toFixed(4))), bg: Array.from(lip.bg, (v) => +v.toFixed(3)) }));
console.log(ra, lip.params.length, 'khung');
