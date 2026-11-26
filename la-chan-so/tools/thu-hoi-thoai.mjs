// Chạy thử cuộc gọi video bằng chữ, không cần điện thoại, không cần mạng (luật trên máy và bộ câu thu sẵn).
//   node tools/thu-hoi-thoai.mjs "không chị ơi" "tại lương cao bất thường" "(im)" "(loi)" …          (chị Lan, cảnh lan-2)
//   node tools/thu-hoi-thoai.mjs --canh minh-1 "mẹ cúp máy" "mẹ vẫn gọi cho con"                     (cảnh khác: minh-1, minh-3, tu-9)
//   node tools/thu-hoi-thoai.mjs [--canh <mã>] --tep <tệp .txt, mỗi dòng một lượt; dòng trống ngăn giữa các cuộc gọi>
// "(im)" = người học không nói gì; "(loi)" = máy không nghe ra. In ra nhân vật đáp câu nào, ý nào được chấm, cuộc gọi kết thúc ra sao.
import { readFileSync } from 'node:fs';
import { taoHoiThoai, napBoLoi } from '../prototype/hoi-thoai.js';
import { taoHoiThoaiCanh } from '../prototype/hoi-thoai-canh.js';
const doc = (p) => JSON.parse(readFileSync(new URL('../prototype/' + p, import.meta.url), 'utf8'));
const a = process.argv.slice(2);
const ma = a[0] === '--canh' ? (a.shift(), a.shift()) : 'lan-2';
const canh = doc(`canh/${ma}.json`), d = doc(canh.bo_loi), b = napBoLoi({ loi: d.loi, y_dinh: d.y_dinh || [], luat: d.luat || [] });
const cau = (id) => b.loi[canh.tien_to + id] || b.loi[id], TEN = canh.song.ten_nv;
const taoMay = () => (canh.bo_may === 'chi-lan' ? taoHoiThoai(b) : taoHoiThoaiCanh(canh, (id) => !!cau(id)));
const cuoc = a[0] === '--tep' ? readFileSync(a[1], 'utf8').split(/\n\s*\n/).map((x) => x.split('\n').map((y) => y.trim()).filter(Boolean)).filter((x) => x.length) : [a];
const noi = (ids) => ids.forEach((id) => console.log(`   ${TEN} [${id}]: ` + (cau(id)?.chu || '??? KHÔNG CÓ CÂU NÀY')));
cuoc.forEach((luot, n) => {
  if (cuoc.length > 1) console.log('\n===== Cuộc gọi ' + (n + 1) + ' =====');
  const ht = taoMay(); noi(ht.moDau());
  let k = { het: false };
  for (const c of luot) {
    if (k.het) { console.log('BẠN: ' + c + '   (cuộc gọi đã kết thúc, bỏ qua)'); continue; }
    k = ht.nhan(c === '(im)' ? { loai: 'im-lang' } : c === '(loi)' ? { loai: 'loi' } : { loai: 'loi-noi', chu: c });
    console.log('BẠN: ' + c + '   → ý định: ' + (k.yDinh || 'không rõ') + (k.tick.length ? ' · chấm: ' + k.tick.join(', ') : ''));
    noi(k.noi);
  }
  console.log(`   ⇒ ${ht.co.size}/${canh.y.length} ý` + (k.het ? ', đã kết thúc' : ', còn đang gọi'));
});
