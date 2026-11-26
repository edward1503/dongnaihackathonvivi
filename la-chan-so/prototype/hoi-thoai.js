// Lá chắn số · hội thoại gọi video với nhân vật AI: hiểu một lượt của người học và chọn câu thu sẵn của nhân vật.
// Thuần logic, không đụng tới trang hay âm thanh, để chạy thử hàng loạt bằng tools/thu-hoi-thoai.mjs.
// Bộ lời (prototype/loi-chi-lan.json): y_dinh = các kiểu lượt nói của người học kèm từ khóa, loi = mọi câu đã thu, luat = ý định → câu đáp.
// Nguyên tắc: nhân vật là người được giúp, không tự nói ra đáp án; người học im lặng thì hỏi lại, không tự đi tiếp.

export const boDau = (t) => ' ' + t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim() + ' ';

// Bốn ý được chấm (khớp bốn thẻ trên màn hình). Luật chạy ngay trên máy, không cần mạng; có máy chủ AI thì kết quả của AI được ưu tiên.
// Mỗi ý chỉ được chấm khi có HÀNH ĐỘNG đi kèm ("tra tên công ty", "báo cáo tài khoản"), không chấm theo danh từ đứng một mình
// ("tên công ty là gì chị" là câu hỏi, "kiểm tra toán" là chuyện khác). Bộ thử 25/11/2026: 83 cuộc gọi của người kiểm thử độc lập.
const Y_LUAT = {
  nap: / (dung|khong|ko|hong|hong co|chang|cho) (co )?(nen )?(nap|chuyen|dong tien|lam|tin|tham gia|dua|dua tien)| lua dao (do|ro|roi|chac|a|chi)| khong nen | hong nen | dung tin | giu (lai |tien )| cat (tien|hai xi|hai tram)/,
  dauhieu: / luong (gi ma )?cao (bat thuong|qua|vay|the|du)| bat thuong | (nap|dong|chuyen|dua) (tien )?truoc | giuc | hoi thuc | hoi chot | (lam|chot|quyet) gap | dau hieu | moi nhu | tha moi | viec nhe (luong|ma)| du minh | con (co )?hai suat /,
  xacminh: / tra (ten|cuu|thu|tren|rieng|lai|cho)| kiem tra (lai|thu|ten|cong ty|thong tin|xem|coi|cho|ky|truoc|chinh)| tim hieu | hoi (lai |thu )?(nguoi lon|ba|me|ma|bo|thay|co giao|co|nguoi nha|nguoi than|anh|chi hai)| giay phep | xac minh | (dung|khong|ko|hong) (co )?(bam|nhan|mo|vo) | len mang (coi|xem|tra)| trang chinh thuc | goi tong dai | doi chieu | (keu|nho) (ma|me|ba|bo|co|thay|nguoi lon) (coi|xem)/,
  baocao: / bao cao | bao cong an | to cao | bao (cai )?(so|tai khoan|nick|acc)| bao (cho|voi|len) (la chan|cong an|moi nguoi|san|ben)| bao xau | report | phan anh /,
};
// Câu trả lời cụt cho câu hỏi "chị có nên làm không": "không chị ơi", "đừng chị". Chỉ tính khi chị vừa hỏi đúng câu đó.
const Y_CUT = /^ (da |a |u |o |thoi |chi oi )*(khong|dung|thoi|khong nen|hong nen|dung co)( chi| a| nha| dau| oi| co| nen)* $/;
// Người học khuyên làm theo kẻ gian, hoặc gạt đi điều đúng: lượt đó không được ý nào, dù trong câu có cụm từ của ý đúng.
const Y_SAI = / (nap di|cu nap|lam di|nen lam|nen nap|cu lam|lam thu|chuyen di|duoc do|nap dai|dong di|thu it|nap it|rut lien|bam vo thu|bam thu|mo thu) /;
const Y_GAT = / (ngon ma|ngon lanh|ngon vay|binh thuong ma|binh thuong thoi|la binh thuong|co sao dau|sao dau|lam gi cho met|chi cho met|so gi|khoi can|can gi|ke no di|khong can dau|la du roi|du roi) /;
// Phủ định kép hoặc ý trái nhau trong một câu: không đoán, hỏi lại và giữ nguyên điểm.
const Y_KEP = / dung co khong | khong phai (la )?khong | khong lua (dau|ma)| khong phai lua | chac khong lua | (dung|khong nen) nap .* (cu nap|nap di)| (cu nap|nap di) .* (dung|khong nen) nap /;
// Dãy số đọc thành tiếng ("không chín một hai…") hoặc viết liền: người học đang lộ số riêng. Số tiền trong đề bài thì không tính.
const SO_CHU = /( (khong|mot|hai|ba|bon|nam|sau|bay|tam|chin|linh|le)){6,} /;
const laLoSo = (chu, t) => SO_CHU.test(t) || (chu.replace(/\d[\d.,]* ?(k|đ|d|đồng|dong|nghìn|nghin|ngàn|ngan|triệu|trieu|tr)\b/gi, '').match(/\d/g) || []).length >= 6;
export const loSo = (chu) => laLoSo(chu, boDau(chu));   // dùng chung cho máy hội thoại của các cảnh khác (hoi-thoai-canh.js)
const Y_DINH_CUA_Y = { nap: 'khuyen-dung-nap', dauhieu: 'nghi-luong', xacminh: 'tra-cong-ty', baocao: 'ru-bao-cao' };
const TEN = { nap: 'nap', dauhieu: 'dau', xacminh: 'xac', baocao: 'bao' }, KEYS = ['nap', 'dauhieu', 'xacminh', 'baocao'];
const LA_CAU_HOI = /^(goi-|tu-nghi|mo-ho|ve-don|chuyen-|sai-|khac-nghe|ngap-cho|giong-|dua-lo|rieng-)/;   // nhân vật vừa hỏi hoặc đang chờ thì không hỏi dồn thêm
const Y_DINH_SAI = ['bao-cu-nap', 'bao-thu-it', 'bao-rut-lien', 'khuyen-lieu-khac'];
const KHONG_DEM = new Set([...Y_DINH_SAI, 'lo-thong-tin', 'xin-dung', 'noi-nang', 'noi-bay', 'loi-trai-nhau']);   // không ậm ừ trước các lượt này

// Một lượt của người học → { y: các ý được chấm, yDinh: ý định khớp nhất, xinDung }. cauHoi = mã câu chị vừa hỏi.
export function hieu(b, chu, cauHoi = 'mo-dau') {
  const t = boDau(chu);
  if (laLoSo(chu, t)) return { y: [], yDinh: 'lo-thong-tin', xinDung: false };
  let tot = null, diem = 0;
  for (const d of b.yDinh) {
    const n = (d.tu_khoa || []).reduce((a, k) => a + (t.includes(' ' + k + ' ') ? k.length : 0), 0);
    if (n > diem) { diem = n; tot = d; }
  }
  let yDinh = tot ? tot.id : null;
  const xinDung = yDinh === 'xin-dung' || / (em cup|cup may|dung o day|khong muon noi nua|de bua khac) /.test(t);
  if (Y_KEP.test(t)) return { y: [], yDinh: 'loi-trai-nhau', xinDung };
  if (Y_SAI.test(t) || Y_GAT.test(t) || Y_DINH_SAI.includes(yDinh)) return { y: [], yDinh: Y_DINH_SAI.includes(yDinh) ? yDinh : 'bao-cu-nap', xinDung };
  const y = KEYS.filter((k) => Y_LUAT[k].test(t));
  if (/^(mo-dau|goi-nap)/.test(cauHoi) && Y_CUT.test(t) && !y.includes('nap')) y.unshift('nap');
  for (const k of (tot && tot.cham) || []) if (!y.includes(k)) y.push(k);
  return { y, yDinh, xinDung };
}

// Một cuộc gọi. moDau() và nhan(lượt) trả về danh sách mã câu nhân vật sẽ nói.
// lượt = { loai: 'loi-noi' | 'im-lang' | 'loi', chu }; hieuNgoai = kết quả hiểu ý từ máy chủ AI (cùng dạng hieu()), không có thì dùng luật.
// Kết quả: { noi: [mã câu], tick: [ý mới được chấm], het, yDinh, khongDem: không ậm ừ trước lượt này, nenGo: nên mời người học gõ chữ,
//            ngoai: ca ngoài kịch bản (câu trong noi chỉ là câu hỏi lại thu sẵn, dùng khi không có AI trả lời trực tiếp) }.
export function taoHoiThoai(b, { toiDaLuot = 10 } = {}) {
  const co = new Set(), daHoi = {}, daDung = {};
  let im = 0, lo = 0, mo = 0, luot = 0, het = false, cauHoi = 'mo-dau';
  const chon = (ids) => { const id = [...ids].sort((x, y) => (daDung[x] || 0) - (daDung[y] || 0))[0]; daDung[id] = (daDung[id] || 0) + 1; return id; };   // xoay vòng: lấy câu ít dùng nhất
  const luatCua = (yd) => b.luat[yd] || b.luat['tuy-chi'];
  const ket = (du) => [chon(du ? ['du-may', 'du-vung', 'du-nhe'] : ['thieu-nghi', 'thieu-de', 'thieu-mung']), chon(['chao-cup', 'chao-bua', 'chao-nghi'])];
  const tra = (noi, tick, yDinh, them = {}) => { const hoi = [...noi].reverse().find((x) => LA_CAU_HOI.test(x)); if (hoi) cauHoi = hoi; return { noi, tick, het, yDinh, khongDem: KHONG_DEM.has(yDinh), ...them }; };
  return {
    co,
    get cauHoi() { return cauHoi; },
    moDau: () => ['mo-dau'],
    hieu: (chu) => hieu(b, chu, cauHoi),
    nhan(r, hieuNgoai) {
      if (het) return { noi: [], tick: [], het: true, yDinh: null };
      if (r.loai === 'loi') {   // máy không nghe ra: hỏi lại; hai lần liền thì mời gõ chữ
        lo++; im = 0;
        return tra([lo % 2 ? 'nghe-mot' : 'nghe-hai'], [], lo % 2 ? 'nghe-lo-lan-mot' : 'nghe-lo-lan-hai', { nenGo: lo >= 2 });
      }
      if (r.loai !== 'loi-noi') {   // không nói gì: hỏi lại chứ không đi tiếp; ba lần LIỀN NHAU thì hẹn bữa khác
        im++; lo = 0; if (im >= 3) het = true;
        return tra([['im-mot', 'im-hai', 'im-ba'][Math.min(2, im - 1)]], [], 'im-lan-' + ['mot', 'hai', 'ba'][Math.min(2, im - 1)]);
      }
      im = 0; lo = 0; luot++;
      const k = hieuNgoai || hieu(b, r.chu, cauHoi), moi = k.y.filter((x) => KEYS.includes(x) && !co.has(x)), noi = [];
      let vua, nenHoi, ngoai = false;
      if (moi.length) {
        mo = 0; moi.forEach((x) => co.add(x));
        const ydCuaY = k.yDinh && (b.yDinh.find((d) => d.id === k.yDinh)?.cham || []).includes(moi[0]) ? k.yDinh : Y_DINH_CUA_Y[moi[0]];
        vua = chon(luatCua(moi.length > 1 ? 'gop-nhieu-y' : ydCuaY).dap); noi.push(vua); nenHoi = true;
        if (co.size === 4) { het = true; return tra(noi.concat(ket(true)), moi, k.yDinh); }
      } else {
        const yd = k.ngoai ? null : (k.yDinh || (k.y.length ? 'lap-y-cu' : null));   // k.ngoai: AI báo không câu thu sẵn nào hợp
        if (!yd) ngoai = true;   // không ý định nào khớp: ca ngoài kịch bản, trang có thể nhờ AI trả lời thay cho câu hỏi lại thu sẵn
        if (yd && yd !== 'lac-de' && yd !== 'noi-dua') mo = 0; else mo++;   // chỉ đếm các lượt LIỀN NHAU mà chị không hiểu
        const lu = luatCua(yd || (mo % 2 ? 'tuy-chi' : 'lac-de'));
        vua = chon(lu.dap); noi.push(vua); nenHoi = !!lu.roi_hoi;
      }
      if (k.xinDung) { het = true; if (k.yDinh !== 'xin-dung') noi.push(chon(['chao-cup', 'chao-bua', 'chao-nghi'])); return tra(noi, moi, k.yDinh); }
      if (luot >= toiDaLuot || mo >= 4) { het = true; return tra(noi.concat(ket(false)), moi, k.yDinh); }
      if (nenHoi && !LA_CAU_HOI.test(vua)) {   // hỏi gợi ý cho ý còn thiếu đầu tiên; ba mức gợi mở xoay vòng, không lặp một câu mãi
        const thieu = KEYS.find((x) => !co.has(x));
        daHoi[thieu] = (daHoi[thieu] || 0) + 1;
        noi.push('goi-' + TEN[thieu] + '-' + ['mot', 'hai', 'ba'][(daHoi[thieu] - 1) % 3]);
      }
      return tra(noi, moi, k.yDinh, { ngoai });
    },
  };
}

// Đổi tệp bộ lời thành dạng tra nhanh mà hai hàm trên dùng.
export const napBoLoi = (d) => ({ ds: d.loi, loi: Object.fromEntries(d.loi.map((x) => [x.id, x])), yDinh: d.y_dinh, luat: Object.fromEntries(d.luat.map((x) => [x.y_dinh, x])) });
