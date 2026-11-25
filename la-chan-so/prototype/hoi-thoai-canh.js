// Lá chắn số · máy hội thoại ngoại tuyến cho các cảnh gọi video mới (anh Minh, chú Tư): hiểu một lượt của người học bằng luật từ khóa
// và chọn câu thu sẵn của nhân vật. Không cần mạng, không cần khóa AI: đây là đường lùi khi hết lượt API hoặc mất mạng.
// Cảnh của chị Lan (lan-2) có máy riêng, kỹ hơn, ở hoi-thoai.js. Hai máy cùng một mặt ngoài: co, cauHoi, moDau(), hieu(chữ), nhan(lượt).
// Luật của từng cảnh nằm trong prototype/canh/<mã>.json: y[].luat (và luat_dau), ngoai_tuyen.sai, ngoai_tuyen.theo_cau.
// Chạy thử bằng chữ: node tools/thu-hoi-thoai.mjs --canh minh-1 "mẹ cúp máy" …   Bộ ca kiểm: node tools/kiem-hoi-thoai.mjs
import { boDau, loSo } from './hoi-thoai.js';

// lời còn dấu, viết thường, bỏ dấu câu: cho những chữ mà bỏ dấu thì lẫn nghĩa ("mồi" với "mới", "nhử" với "như")
export const coDau = (t) => ' ' + t.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{Nd} ]/gu, ' ').replace(/ +/g, ' ').trim() + ' ';

// Phủ định phủ lên cụm khớp đứng sau nó trong cùng một vế ("mẹ không gọi con", "đừng có cúp máy", "mẹ chưa định cúp máy hay gọi con") thì cụm đó
// không tính. Tầm phủ: tối đa sáu chữ sau từ phủ định, và dừng khi gặp chủ ngữ mới hoặc từ nối ("không, mẹ cúp máy", "không chuyển mà cúp máy" vẫn tính).
// Lời còn dấu thì "đúng" và "dùng" được tách khỏi "đừng" trước khi bỏ dấu (xem tachDau); lời gõ không dấu thì "dung" vẫn hiểu là "đừng".
const PHU_DINH = / (khong|ko|hong|hok|chang|cha|dung|khoi|chua|dau co)(?: (?!(?:me|toi|ba|con|chu|minh|ho|no|ma|nhung|thi|roi) )\S+){0,6} $/;
const PHU_DINH_DAU = / (không|ko|hông|hổng|chẳng|chả|đừng|khỏi|chưa|đâu có)(?: (?!(?:mẹ|tôi|bà|con|chú|mình|họ|nó|mà|nhưng|thì|rồi|chứ) )\S+){0,6} $/;
// Người học nhắc lại lời kẻ gian ("họ bảo chuyển liền", "nhóm rủ nạp đi"): cụm "khuyên sai" đứng sau động từ thuật lại trong vòng bốn chữ thì bỏ qua.
const THUAT_LAI = / (bao|keu|doi|bat|giuc|noi|dan|ep|xui|ru|hua|doa)( \S+){0,3} $/;
// Với các ý ĐÚNG thì chỉ bỏ qua khi rõ là lời của kẻ gian ("họ bảo mẹ cúp máy rồi gọi con" không phải việc mẹ định làm); "con dặn mẹ gọi con" vẫn tính.
// Tầm của lời thuật lại: tối đa bảy chữ, dừng ở chỗ người học chuyển sang việc của mình ("… thì mẹ cúp máy", "… mẹ vẫn gọi con").
const KE_GIAN_NOI = / (ho|nguoi ta|no|tui no|chung no|ke gian|ben do|nguoi goi|nhom|nhom do|trong nhom|thay|ong thay) (bao|keu|doi|bat|giuc|noi|dan|ep|xui|ru|hua|doa)(?: (?!(?:thi|nhung|ma|van|cu|la) )\S+){0,7} $/;
// Câu hỏi lại ("mẹ có nên gọi con không?", "mẹ cúp máy rồi gọi con hả?") chưa phải câu trả lời. Lời gõ kết thúc bằng dấu hỏi cũng là câu hỏi.
const LA_HOI = / (co nen|co can|co phai|nen hay|hay la) .*(khong|hong|ko|ha|nhi|ta) $| (duoc|phai|dung|duq) (khong|hong|ko)( con| chu| me| a)? $| (ha|hay sao|nhi)( con| chu| me| a)? $/;
// "đúng" và "dùng" bỏ dấu thì trùng "đừng": khi lời còn dấu, đổi hai chữ đó thành mã riêng (duq, dux) trước khi bỏ dấu.
const tachDau = (chu) => chu.replace(/đúng/giu, 'duq').replace(/dùng/giu, 'dux');
// Người học gạt đi việc đúng ("báo cáo làm gì cho mệt", "gọi con chi cho mệt", "khỏi cần đâu"): lượt đó không được ý nào, dù có cụm từ của ý đúng.
// "Khỏi cần", "cần gì" không nằm ở đây: chúng là phủ định, chỉ xóa cụm đứng sau ("khỏi cần báo cáo" không được ý, "khỏi cần chuyển tiền, mẹ cúp máy" vẫn được).
const GAT = / (lam gi cho met|chi cho met|lam chi cho met|cho met|mat cong|ton cong|de lam gi|lam gi dau|co sao dau|sao dau|khong can dau|ke no di|ke di|la du roi|du roi) | lam (gi|chi)( chu| con| me| a| vay| ha| nua| the)* $/;
const XIN_DUNG = / (de bua khac|bua khac noi|khong muon noi nua|dung o day|thoi nghi|nghi nha|tam biet|ket thuc cuoc goi|dang ban|ban roi|met roi) /;
const AI_LA = / (nguoi that|may hay nguoi|la may ha|la may a|robot|ro bot|tri tue nhan tao|ai dong vai|la ai vay|ai day|co phai (la )?(may|nguoi)) /;

// mọi chỗ khớp còn hiệu lực của một luật trên lời t (đã chuẩn hóa); phuDinh: biểu thức bắt phủ định đứng sát trước
function khop(luat, t, phuDinh, thuatLai = null) {
  if (!luat) return false;
  const re = new RegExp(luat, 'gu');
  for (let m; (m = re.exec(t));) {
    const truoc = t.slice(0, m.index + 1);
    if (!phuDinh.test(truoc) && !(thuatLai && thuatLai.test(truoc))) return true;
    if (m[0] === '') re.lastIndex++;
  }
  return false;
}

// Một lượt của người học → { y: các ý được chấm, yDinh, xinDung }. cauHoi = mã câu nhân vật vừa hỏi (để hiểu câu trả lời cụt).
// Lời có dấu câu thì xét từng vế (phủ định và lời thuật lại không tràn qua dấu phẩy); bất kỳ vế nào khuyên sai thì cả lượt không được ý nào.
export function hieuCanh(canh, chu, cauHoi = 'mo-dau') {
  if (loSo(chu)) return { y: [], yDinh: 'lo-thong-tin', xinDung: false };
  if (/\?\s*$/.test(chu)) return { y: [], yDinh: 'hoi-lai', xinDung: false };
  const ve = chu.split(/[,.;!?…\n]+/).map((x) => x.trim()).filter(Boolean);
  if (ve.length < 2) return hieuVe(canh, chu, cauHoi);
  const kq = ve.map((x) => hieuVe(canh, x, cauHoi)), xinDung = kq.some((k) => k.xinDung);
  for (const loai of ['lo-thong-tin', 'ai-la', 'sai']) if (kq.some((k) => k.yDinh === loai)) return { y: [], yDinh: loai, xinDung };
  const y = [...new Set(kq.flatMap((k) => k.y))];
  return { y, yDinh: y.length ? 'y-dung' : (kq.find((k) => k.yDinh)?.yDinh || null), xinDung };
}
function hieuVe(canh, chu, cauHoi) {
  const t = boDau(tachDau(chu)), d = coDau(chu), nt = canh.ngoai_tuyen || {};
  const xinDung = (nt.xin_dung ? new RegExp(nt.xin_dung, 'u') : XIN_DUNG).test(t);
  if (AI_LA.test(t)) return { y: [], yDinh: 'ai-la', xinDung };
  if (LA_HOI.test(t)) return { y: [], yDinh: 'hoi-lai', xinDung };   // xét trước luật "khuyên sai": "chú có nên nạp không" là câu hỏi, chưa phải lời khuyên
  if (GAT.test(t) || khop(nt.sai, t, PHU_DINH, THUAT_LAI) || khop(nt.sai_dau, d, PHU_DINH_DAU)) return { y: [], yDinh: 'sai', xinDung };
  const y = canh.y.filter((x) => khop(x.luat, t, PHU_DINH, KE_GIAN_NOI) || khop(x.luat_dau, d, PHU_DINH_DAU)).map((x) => x.id);
  for (const c of nt.theo_cau || []) if (new RegExp(c.cau, 'u').test(cauHoi) && !y.includes(c.y) && khop(c.luat, t, PHU_DINH)) y.push(c.y);
  return { y, yDinh: y.length ? 'y-dung' : (xinDung ? 'xin-dung' : null), xinDung };
}

// Một cuộc gọi. coCau(mã) cho biết bộ lời có câu đó không (đã tính tiền tố của cảnh).
// nhan(lượt) trả về { noi: [mã câu], tick: [ý mới được chấm], het, yDinh, nenGo, ngoai } như máy của chị Lan.
export function taoHoiThoaiCanh(canh, coCau = () => true, { toiDaLuot } = {}) {
  const ids = canh.y.map((x) => x.id), co = new Set(), daHoi = {};
  const gioiHan = toiDaLuot || (canh.ngoai_tuyen || {}).toi_da_luot || 4 + 2 * ids.length;
  let im = 0, lo = 0, mo = 0, luot = 0, het = false, cauHoi = 'mo-dau', chao = 0, trong = 0;   // trong: số lượt LIỀN NHAU không thu được lời (im lặng hoặc nghe lỗi)
  // câu hỏi cho ý còn thiếu đầu tiên: lần đầu dùng câu hỏi (hoi-), các lần sau xoay giữa câu gợi mở (goi-) và câu hỏi, không lặp một câu hai lần liền
  const hoi = () => {
    const thieu = ids.find((x) => !co.has(x)); if (!thieu) return [];
    const n = daHoi[thieu] = (daHoi[thieu] || 0) + 1;
    const ung = (n % 2 ? ['hoi-', 'goi-'] : ['goi-', 'hoi-']).map((p) => p + thieu).filter(coCau);
    const id = ung.find((x) => x !== cauHoi) || ung[0]; if (!id) return [];
    cauHoi = id; return [id];
  };
  const tra = (noi, tick, yDinh, them = {}) => ({ noi: noi.filter(coCau), tick, het, yDinh, ...them });
  return {
    co,
    get cauHoi() { return cauHoi; },
    moDau: () => { daHoi[ids[0]] = 1; return ['mo-dau']; },   // câu mở đầu chính là câu hỏi cho ý thứ nhất
    hieu: (chu) => hieuCanh(canh, chu, cauHoi),
    // Chế độ kết hợp: lượt vừa rồi do AI đáp, AI thường hỏi tiếp ý còn thiếu đầu tiên. Báo cho máy luật để nếu lượt sau AI hỏng, câu trả lời cụt vẫn được hiểu đúng.
    aiVuaHoi(daCo) { daCo.forEach((x) => co.add(x)); mo = 0; trong = 0; const thieu = ids.find((x) => !co.has(x)); if (thieu) { cauHoi = 'hoi-' + thieu; daHoi[thieu] = Math.max(1, daHoi[thieu] || 0); } },
    nhan(r, hieuNgoai) {
      if (het) return { noi: [], tick: [], het: true, yDinh: null };
      if (r.loai === 'loi') {   // máy không nghe ra: hỏi lại; hai lần liền thì mời gõ chữ
        lo++; im = 0; trong++;
        return tra([lo % 2 ? 'nghe-mot' : 'nghe-hai'], [], lo % 2 ? 'nghe-lo-lan-mot' : 'nghe-lo-lan-hai', { nenGo: lo >= 2 || trong >= 4 });
      }
      if (r.loai !== 'loi-noi') {   // không nói gì: hỏi lại chứ không đi tiếp; ba lần LIỀN NHAU thì hẹn lúc khác
        im++; lo = 0; trong++; if (im >= 3) het = true;
        return tra([['im-mot', 'im-hai', 'im-ba'][Math.min(2, im - 1)]], [], 'im-lan-' + ['mot', 'hai', 'ba'][Math.min(2, im - 1)], { nenGo: !het && trong >= 4 });   // im lặng xen với nghe lỗi mãi thì mời gõ
      }
      im = 0; lo = 0; trong = 0; luot++;
      const k = hieuNgoai || hieuCanh(canh, r.chu, cauHoi), moi = (k.y || []).filter((x) => ids.includes(x) && !co.has(x));
      if (k.xinDung && !moi.length) { het = true; return tra([['chao-cup', 'chao-bua'][chao++ % 2]], [], 'xin-dung'); }
      let noi = [], ngoai = false, yDinh = k.yDinh;
      if (moi.length) {
        mo = 0; moi.forEach((x) => co.add(x)); yDinh = 'y-dung';
        // đủ ý: câu kết; bộ lời chưa có câu kết (đã gỡ vì sai, đang chờ thu lại) thì nhân vật nhận ý sau cùng vừa nói rồi dừng
        if (co.size === ids.length) { het = true; return tra([coCau('ket-du') ? 'ket-du' : 'nhan-' + moi.at(-1)], moi, yDinh); }
        noi = ['nhan-' + moi[0]];
        if (k.xinDung) { het = true; return tra(noi.concat(['chao-cup', 'chao-bua'][chao++ % 2]), moi, yDinh); }   // vừa trả lời đúng vừa xin dừng: ghi điểm rồi chào
      } else if (k.yDinh === 'lo-thong-tin') noi = ['lo-so'];
      else if (k.yDinh === 'ai-la') noi = ['ai-la'];
      else if (k.yDinh === 'sai') { mo = 0; noi = ['sua']; }
      else { mo++; noi = [mo % 2 ? 'chua-ro' : 'chua-ro-hai']; ngoai = !k.yDinh; yDinh = k.yDinh || (k.y?.length ? 'lap-y-cu' : null); }
      if (luot >= gioiHan || mo >= 3) { het = true; return tra(noi.concat('ket-thieu'), moi, yDinh); }
      return tra(noi.concat(hoi()), moi, yDinh, { ngoai });
    },
  };
}
