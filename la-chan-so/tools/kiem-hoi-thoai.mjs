// Chạy bộ ca khó của phần hiểu ý qua luật trên máy (không cần mạng).   node tools/kiem-hoi-thoai.mjs        (thoát mã 1 nếu có ca sai)
// 1. Chị Lan (tools/ca-hoi-thoai.json, máy prototype/hoi-thoai.js). Mỗi ca: [lời người học, các ý phải được chấm | "mã ý định"].
//    Bộ ca lấy từ lần kiểm thử độc lập 25/11/2026: những câu có từ khóa nhưng nghĩa ngược ("lương cao vậy ngon mà chị") phải được 0 ý.
// 2. Các cảnh mới: anh Minh, chú Tư (tools/ca-hoi-thoai-canh.json, máy prototype/hoi-thoai-canh.js). Ngoài ca từng lượt còn có ca cả cuộc gọi,
//    và kiểm rằng mọi câu máy chọn đều có trong bộ lời kèm đủ tệp giọng.
import { readFileSync, existsSync } from 'node:fs';
import { hieu, napBoLoi } from '../prototype/hoi-thoai.js';
import { hieuCanh, taoHoiThoaiCanh } from '../prototype/hoi-thoai-canh.js';
const doc = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const b = napBoLoi(doc('../prototype/loi-chi-lan.json'));
const ca = doc('./ca-hoi-thoai.json');
let sai = 0, tong = ca.length;
const giong = (a, m) => JSON.stringify([...a].sort()) === JSON.stringify([...m].sort());
for (const [chu, mong] of ca) {
  const k = hieu(b, chu, 'mo-dau');
  const dung = typeof mong === 'string' ? k.yDinh === mong : giong(k.y, mong);
  if (!dung) { sai++; console.log('SAI (chị Lan):', chu, '→', JSON.stringify(k.y), k.yDinh, '| mong', JSON.stringify(mong)); }
}
console.log(`chị Lan: ${ca.length - sai}/${ca.length} ca đạt`);
for (const [ma, bo] of Object.entries(doc('./ca-hoi-thoai-canh.json'))) {
  if (ma.startsWith('_')) continue;
  const canh = doc(`../prototype/canh/${ma}.json`), loi = new Map(doc('../prototype/' + canh.bo_loi).loi.map((x) => [x.id, x]));
  const cau = (id) => loi.get(canh.tien_to + id) || loi.get(id), coCau = (id) => !!cau(id);
  let s = 0, n = 0;
  const hong = (...a) => { s++; console.log(`SAI (${ma}):`, ...a); };
  for (const [chu, mong, cauHoi] of bo.luot) {
    n++; const k = hieuCanh(canh, chu, cauHoi || 'mo-dau');
    if (!(typeof mong === 'string' ? k.yDinh === mong : giong(k.y, mong) && k.yDinh !== 'sai')) hong(chu, '→', JSON.stringify(k.y), k.yDinh, '| mong', JSON.stringify(mong));
  }
  for (const c of bo.cuoc) {
    n++; const ht = taoHoiThoaiCanh(canh, coCau); let k = { het: false, noi: ht.moDau() }, cuoi = k.noi.at(-1);
    for (const l of c.luot) {
      if (k.het) break;
      k = ht.nhan(l === '(im)' ? { loai: 'im-lang' } : l === '(loi)' ? { loai: 'loi' } : { loai: 'loi-noi', chu: l });
      if (!k.noi.length) hong('lượt không có câu đáp:', l);
      for (const id of k.noi) if (!existsSync(new URL('../prototype/' + cau(id).tep, import.meta.url))) hong('thiếu tệp giọng của câu', id);
      cuoi = k.noi.at(-1) || cuoi;
    }
    if (ht.co.size !== c.diem || !!k.het !== c.het || (c.cuoi && cuoi !== c.cuoi)) hong(JSON.stringify(c.luot), '→', ht.co.size, 'ý, het', !!k.het, 'cuối', cuoi, '| mong', c.diem, c.het, c.cuoi || '');
  }
  // mọi câu máy có thể chọn phải có trong bộ lời
  // Ngoại lệ có chủ ý (bo.thieu_co_chu_y): câu đã gỡ khỏi bộ lời vì sai nội dung, đang chờ thu lại; máy tự lùi (ket-du → nhan-<ý cuối>, thiếu câu hỏi → chỉ nhận ý).
  const thieuDuoc = new Set(bo.thieu_co_chu_y || []);
  for (const id of ['mo-dau', 'ket-du', 'ket-thieu', 'sua', 'chua-ro', 'chua-ro-hai', 'lo-so', 'ai-la', 'chao-cup', 'chao-bua', 'im-mot', 'im-hai', 'im-ba', 'nghe-mot', 'nghe-hai',
    ...canh.y.flatMap((y, i) => ['nhan-' + y.id, 'goi-' + y.id, ...(i ? ['hoi-' + y.id] : [])])]) { n++; if (!coCau(id) && !thieuDuoc.has(id)) hong('bộ lời thiếu câu', id); }
  // An toàn: không câu nào được mời người học đọc số, hay khuyên rời nhóm trước khi báo cáo (rời trước là mất bằng chứng)
  for (const [id, x] of loi) { n++; if (/bằng số nào|hay số nào|rời nhóm rồi báo cáo/i.test(x.chu)) hong('câu không an toàn còn trong bộ lời', id, x.chu); }
  for (const p of [canh.song?.loi_nhac, canh.tra_loi?.loi_nhac].filter(Boolean)) { n++; if (/bằng số nào|hay số nào|rời nhóm rồi báo cáo/i.test(readFileSync(new URL('../prototype/' + p, import.meta.url), 'utf8'))) hong('lời nhắc AI còn câu không an toàn', p); }
  console.log(`${ma}: ${n - s}/${n} ca đạt`); sai += s; tong += n;
}
// 3. Tệp cảnh và bảng nhân vật: đủ trường mà trang và app (HieuY.canh) cần, tệp trỏ tới đều có, và cảnh chị Lan giữ đúng các giá trị cũ
//    (mã kho "chi-lan", giọng Aoede, lời dặn từng chữ) để kho giọng đã lưu trên máy và lời nhắc gửi cho AI không đổi.
{
  let s = 0, n = 0; const kt = (dk, ...a) => { n++; if (!dk) { s++; console.log('SAI (tệp cảnh):', ...a); } };
  const co = (p) => existsSync(new URL('../prototype/' + p, import.meta.url)), chu = (p) => readFileSync(new URL('../prototype/' + p, import.meta.url), 'utf8');
  const nv = doc('../prototype/nhan-vat.json');
  const DAN_CU = 'Giọng nữ trẻ miền Nam, nhẹ nhàng, tự nhiên như đang gọi video hỏi ý kiến em họ, hơi lo lắng nhưng thân thiện, tốc độ vừa phải.';   // hằng số cũ trong HieuY.kt và doc_giong.py
  kt(nv.lan.giong === 'Aoede' && nv.lan.loi_dan === DAN_CU && nv.lan.avatar === 21, 'nhân vật lan phải giữ giọng Aoede, avatar 21 và lời dặn cũ');
  for (const k of ['lan', 'minh', 'tu']) kt(nv[k].chot === true && nv[k].giong && nv[k].loi_dan && co(`../vendor/vlearn-avatar/stage/_shared/voice/models/lite/${nv[k].avatar}/lite.onnx`) && co(`../vendor/vlearn-avatar/stage/_shared/voice/assets/bg/${nv[k].nen}.mp4`), 'nhân vật', k, 'thiếu trường, avatar hoặc nền');
  for (const ma of ['lan-2', 'minh-1', 'minh-3', 'tu-9']) {
    const c = doc(`../prototype/canh/${ma}.json`), sg = c.song || {}, tl = c.tra_loi || {};
    kt(c.ma === ma && nv[c.nhan_vat] && /^[a-z0-9-]+$/.test(c.ma_kho || '') && co(c.bo_loi) && co(c.anh), ma, 'thiếu ma, nhan_vat, ma_kho, bo_loi hoặc anh');
    kt(Array.isArray(c.y) && c.y.length >= 2 && c.y.every((y) => /^[a-z0-9]{1,16}$/.test(y.id) && y.nhan), ma, 'các ý');
    kt(['tieu_de', 'ten', 'ten_thuong', 'nguoi_hoc', 'nhan_bai', 'huong_dan', 'go_goi_y', 'kq_du', 'kq_thieu', 'kq_loi_du', 'kq_loi_thieu', 'nut_ve'].every((k) => c.chu?.[k]), ma, 'thiếu chữ trên màn hình');
    kt(co(sg.loi_nhac || '?') && /^[a-z_]{3,24}$/.test(sg.truong_loi || '') && chu(sg.loi_nhac).includes('(' + sg.truong_loi + ')') && sg.ai_nv && sg.ai_nh && sg.ten_nv && sg.ten_nh && sg.che_so, ma, 'phần song (lời nhắc phải nhắc đúng tên trường lời nhân vật)');
    kt(c.y.every((y) => chu(sg.loi_nhac).includes('- ' + y.id + ':')), ma, 'lời nhắc trực tiếp phải mô tả đủ các ý được chấm');
    kt(co(tl.loi_nhac || '?') && tl.cau_nv && tl.cau_da && tl.cau_nh, ma, 'phần tra_loi');
    if (c.bo_may !== 'chi-lan') kt(c.y.every((y) => y.luat) && c.ngoai_tuyen?.sai && c.lui_khi_hong === true, ma, 'cảnh mới phải có luật ngoại tuyến cho từng ý và bật lui_khi_hong');
  }
  const lan = doc('../prototype/canh/lan-2.json');
  kt(lan.ma_kho === 'chi-lan' && lan.bo_may === 'chi-lan' && lan.song.truong_loi === 'loi_chi_lan' && lan.song.ai_nv === 'chi-lan' && lan.song.ai_nh === 'em' && lan.song.ten_nv === 'CHỊ LAN' && lan.song.ten_nh === 'EM'
    && lan.song.loi_nhac === 'hoi-thoai-song-loi-nhac.txt' && lan.tra_loi.loi_nhac === 'tra-loi-loi-nhac.txt' && lan.y.map((y) => y.id).join() === 'nap,dauhieu,xacminh,baocao' && !lan.lui_khi_hong, 'cảnh lan-2 phải giữ nguyên các giá trị cũ');
  console.log(`tệp cảnh: ${n - s}/${n} điều kiện đạt`); sai += s; tong += n;
}
console.log(`tổng: ${tong - sai}/${tong}`); process.exit(sai ? 1 : 0);
