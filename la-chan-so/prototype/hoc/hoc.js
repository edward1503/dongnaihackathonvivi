/* Lá chắn số · Trình phát bài học (prototype/hoc.html)
   Mọi nội dung đọc từ tệp: hoc/danh-sach.json (danh sách phát hành: thứ tự và bài nào đang mở) và hoc/bai-NN.json (truyện, hai bài luyện, thử thách).
   Số bài người học nhìn thấy ("Bài 1" … "Bài 4") là VỊ TRÍ trong danh sách phát hành, không phải số trong tên tệp hay trong ?bai=.
   Mã nội bộ (tên tệp bai-09.json, ?bai=9, mã cảnh tu-9, ma_kieu) giữ nguyên theo bảng 10 bài của kịch bản.
   Thêm bài mới chỉ cần thêm tệp nội dung; năm dạng bài tập bên dưới là khối dùng lại:
     cham-bat-bai (B1) · that-hay-lua (B2) · noi-chieu (B4) · viec-nao-truoc (B5) · nghe-bam-dung (B6)
   Địa chỉ:  hoc.html                 thư viện bài học
             hoc.html?bai=9           mở bài có mã nội bộ 9 (&phan=a|b1|b2|c|kq: vào thẳng một phần)
             hoc.html?kieu=<mã kiểu>  mở bài của một kiểu lừa đảo (app gọi sau khi vừa cảnh báo); nhận ma_kieu của kịch bản và mã của máy chủ
                                      (vd gia_danh_cong_an) qua bảng "bi_danh" trong danh-sach.json; mã chưa có bài thì mở thư viện
             hoc.html?bai=1&sau=goi   quay về sau cuộc gọi video: đọc điểm ở localStorage['lcs-goi-<cảnh>']
   Tham số thử: che_do=don-gian|day-du (ép chế độ), toc=<1..16> (tua nhanh giọng), im=1 (tắt tiếng).
   Điểm chỉ tính ở phần thử thách (mỗi ý mười điểm). Phần luyện không tính điểm; đã xem đáp án thì không tính là đạt.
   Đáp án không ghi vào thuộc tính nào của trang, thứ tự nút lựa chọn đổi mỗi lần mở. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  const app = document.getElementById('app');
  const KHO = 'lcs-hoc-v1';
  const TOC = Math.min(16, Math.max(1, parseFloat(Q.get('toc')) || 1));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const ic = (ten, lop) => '<i class="ic ' + (lop || '') + '" data-i="' + ten + '"></i>';
  const ve = () => { if (typeof paintIcons === 'function') paintIcons(app); };
  const xao = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const cho = ms => new Promise(r => setTimeout(r, ms / TOC));
  const docLau = chu => Math.min(7000, 900 + 60 * String(chu || '').length);     // thời gian đọc chữ khi không có tiếng

  const NGUOI = {
    'be-nai': { ten: 'Bé Nai', anh: '../assets/spot-mascot.png' },
    'ba-hoa': { ten: 'Bà Hoa', anh: '../assets/chan-dung-ba-hoa.png' },
    'minh': { ten: 'Anh Minh', anh: '../assets/chan-dung-minh.png' },
    'vy': { ten: 'Vy', anh: '../assets/chan-dung-vy.png' },
    'ong-tu': { ten: 'Chú Tư', anh: '../assets/chan-dung-ong-tu.png' },
    'nguoi-goi-nam': { ten: 'Người gọi (mô phỏng)', anh: '../assets/avatar-hat-dau.png', keGian: true },
    'nguoi-goi-nu': { ten: 'Người gọi (mô phỏng)', anh: '../assets/avatar-huong.png', keGian: true }
  };
  const MAT = { cheer: '../assets/mascot-cheer.png', stop: '../assets/mascot-stop.png', think: '../assets/mascot-think.png', thuong: '../assets/spot-mascot.png' };

  let ML = null, DS = [], BAI = null, STT = 0, LG = false, BAN = 'bạn', luot = 0;      // STT: số bài hiển thị (vị trí trong danh sách phát hành)
  // Trạng thái để kiểm thử tự động đọc (không chứa đáp án)
  const S = window.__hoc = { man: '', pha: '', noi: '', dangNoi: false, thieu: [], chan: false, im: Q.get('im') === '1' };

  /* ---------------- Lưu tiến độ ---------------- */
  let khoTam = null;            // bản trong bộ nhớ: máy cấm lưu thì tiến độ vẫn còn trong lượt học này
  const laVat = o => !!o && typeof o === 'object' && !Array.isArray(o);
  // điểm là số ý nguyên; không bài nào chấm quá mười ý (mỗi ý mười điểm), nên bản ghi tổng lớn hơn là bản hỏng hoặc bị sửa tay
  const diemHopLe = c => laVat(c) && Number.isInteger(c.diem) && Number.isInteger(c.tong) && c.tong > 0 && c.tong <= 10 && c.diem >= 0 && c.diem <= c.tong;
  const hoa = s => s.charAt(0).toUpperCase() + s.slice(1);
  function chuanKho(d) {        // dữ liệu cũ hoặc hỏng: giữ phần đúng kiểu, bỏ phần sai
    const ra = { bai: {} }; if (!laVat(d) || !laVat(d.bai)) return ra;
    Object.keys(d.bai).forEach(k => {
      const b = d.bai[k]; if (!laVat(b)) return; const m = ra.bai[k] = {};
      if (b.a === true) m.a = true;
      if (Array.isArray(b.b)) m.b = b.b.map(x => (laVat(x) ? { xong: x.xong === true, dat: x.xong === true && x.dat === true, sao: Math.max(0, Math.min(3, Math.round(+x.sao) || 0)) } : null));
      if (diemHopLe(b.c)) m.c = { diem: b.c.diem, tong: b.c.tong, luc: +b.c.luc || 0 };
      if (diemHopLe(b.c_tot)) m.c_tot = { diem: b.c_tot.diem, tong: b.c_tot.tong, luc: +b.c_tot.luc || 0 };
      if (Number.isFinite(b.goi_tu)) m.goi_tu = b.goi_tu;
    });
    return ra;
  }
  function docKho() { if (khoTam) return chuanKho(khoTam); try { return chuanKho(JSON.parse(localStorage.getItem(KHO))); } catch (e) { return chuanKho(null); } }
  function ghiKho(d) { khoTam = d; try { localStorage.setItem(KHO, JSON.stringify(d)); if (localStorage.getItem(KHO)) khoTam = null; } catch (e) { /* máy không cho lưu: giữ trong bộ nhớ */ } }
  function tienDo(so) { const d = docKho(); return (d.bai && d.bai[so]) || {}; }
  function capNhat(so, sua) { const d = docKho(); d.bai = d.bai || {}; const b = d.bai[so] = d.bai[so] || {}; sua(b); ghiKho(d); return b; }
  function datB(t, soBaiLuyen) { const b = t.b || []; for (let i = 0; i < soBaiLuyen; i++) if (!(b[i] && b[i].dat)) return false; return soBaiLuyen > 0; }
  function datC(t) { const c = t.c_tot || t.c; return !!(c && c.tong > 0 && c.diem * 2 >= c.tong); }
  function soSao(t, soBaiLuyen) { return (t.a ? 1 : 0) + (datB(t, soBaiLuyen) ? 1 : 0) + (datC(t) ? 1 : 0); }
  function diemBai(t) { const c = t.c_tot || t.c; return c ? Math.max(0, c.diem) * 10 : 0; }
  const saoHtml = (n, lop) => '<span class="sao ' + (lop || '') + '" aria-label="' + n + ' trên 3 sao">' + [0, 1, 2].map(i => ic('star', i < n ? 'co' : '')).join('') + '</span>';

  /* ---------------- Tiếng ---------------- */
  const loa = new Audio(); loa.preload = 'auto';
  let phatSo = 0, huyPhat = null, noiSo = 0, tDauPhat = 0, coTieng = false;
  function dungTieng() { phatSo++; noiSo++; try { loa.pause(); } catch (e) { } if (huyPhat) huyPhat(); S.dangNoi = false; }
  function phat(src) {
    const so = ++phatSo; if (huyPhat) huyPhat();
    return new Promise(xongP => {
      let da = false, canh = 0;
      const ket = k => { if (da) return; da = true; clearTimeout(canh); loa.onended = loa.onerror = loa.onplaying = null; if (huyPhat === huy) huyPhat = null; xongP(so === phatSo || k === 'huy' ? k : 'huy'); };
      const huy = () => ket('huy'); huyPhat = huy;
      tDauPhat = performance.now(); coTieng = false;
      if (!src || S.im) { ket('khong'); return; }
      // Canh treo: tệp không phát mà cũng không báo lỗi (tải đứng giữa chừng) thì coi như không có tiếng, để lượt đi tiếp bằng thời gian đọc chữ.
      const treo = () => { if (da) return; try { loa.pause(); } catch (e) { } ket('loi'); };
      canh = setTimeout(treo, 8000);
      loa.onplaying = () => { coTieng = true; clearTimeout(canh); const d = loa.duration; canh = setTimeout(treo, ((Number.isFinite(d) && d > 0 ? d : 30) / TOC + 4) * 1000); };
      loa.onended = () => ket('het');
      loa.onerror = () => { if (S.thieu.indexOf(src) < 0) S.thieu.push(src); ket('loi'); };
      try {
        loa.src = src; loa.defaultPlaybackRate = TOC; loa.playbackRate = TOC;
        const p = loa.play();
        if (p && p.then) p.then(() => { coTieng = true; }, e => { if (e && e.name === 'NotAllowedError') { if (!S.chan) baoNho('Chạm vào nút loa để bật tiếng Bé Nai.'); S.chan = true; ket('chan'); } else if (!(e && e.name === 'AbortError')) ket('loi'); });
      } catch (e) { ket('loi'); }
    });
  }
  // Phát một câu rồi chờ xong. Không có tiếng (thiếu tệp, máy chặn tự phát) thì chờ đúng bằng thời gian đọc chữ. false = bị ngắt.
  async function phatCau(cau) {
    const so = ++noiSo; S.dangNoi = true; S.noi = cau.chu || '';
    const k = await phat(cau.giong);
    if (so !== noiSo) return false;
    if (k === 'huy') { S.dangNoi = false; return false; }
    if (k !== 'het') { await cho(docLau(cau.chu)); if (so !== noiSo) return false; }
    S.dangNoi = false; return true;
  }
  const thoiDiemPhat = () => (coTieng ? loa.currentTime : (performance.now() - tDauPhat) / 1000 * TOC);

  /* ---------------- Khung màn ---------------- */
  function man(ten, lop) {
    luot++; dungTieng(); S.man = ten; S.pha = ''; S.noi = '';
    app.className = (LG ? 'lg ' : '') + (lop || ''); app.innerHTML = '';
    return luot;
  }
  function thanh(nho, to, veDau, phai) {
    const el = h('<div class="thanh"><button class="ve" aria-label="Quay lại">' + ic('arrow-left') + '</button><div class="tt"><small>' + esc(nho) + '</small><b>' + esc(to) + '</b></div></div>');
    el.querySelector('.ve').onclick = veDau; if (phai) el.append(phai); app.append(el); return el;
  }
  function vung() { const than = h('<div class="than"></div>'), chan = h('<div class="chan"></div>'); app.append(than, chan); return { than, chan }; }
  function datNut(chan, ds, doc) {
    chan.innerHTML = ''; chan.classList.toggle('doc', !!doc);
    ds.forEach(n => {
      const b = h('<button class="btn ' + (n.lop || (n.chinh ? 'primary' : 'outline')) + (n.to ? ' to' : '') + '">' + (n.icon ? ic(n.icon, 's20') : '') + '<span>' + esc(n.chu) + '</span></button>');
      if (n.tat) b.disabled = true; b.onclick = () => n.bam(b); chan.append(b); n.el = b;
    });
    ve();
    // nhiều nút mà một hàng không đủ chỗ cho chữ thì xếp dọc, mỗi nút một hàng
    if (!doc && ds.length > 1 && ds.some(n => { const cs = getComputedStyle(n.el); return n.el.querySelector('span').offsetWidth + (n.icon ? 28 : 0) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) > n.el.clientWidth + 0.5; })) chan.classList.add('doc');
    return ds;
  }
  function baoNho(chu) { const t = h('<div class="thong-bao">' + esc(chu) + '</div>'); app.append(t); setTimeout(() => t.remove(), 3200); }
  function diChuyen(u) { if (typeof window.__hocChan === 'function') return window.__hocChan(u); location.href = u; }

  /* ---------------- Bé Nai nói (ô lời ở đầu mỗi bài luyện) ---------------- */
  function taoNai(noiVao) {
    const el = h('<div class="nai"><div class="col gap-6 acenter none"><img src="' + MAT.thuong + '" alt="Bé Nai"><button class="loa" aria-label="Nghe lại">' + ic('volume', 's20') + '</button></div><div class="bong"><div class="chu"></div></div></div>');
    noiVao.append(el); let cuoi = null;
    const nai = {
      el,
      khoaLoa(b) { el.querySelector('.loa').disabled = !!b; },      // đang có cuộc gọi mô phỏng thì không cho bấm nghe lại, kẻo ngắt cuộc gọi
      async noi(cau, o) {
        if (!cau) return true; o = o || {}; cuoi = cau;
        el.querySelector('img').src = MAT[o.mat] || MAT.thuong;
        el.querySelector('.chu').textContent = cau.chu; el.classList.add('dang');
        const ok = await phatCau(cau); if (cuoi === cau) el.classList.remove('dang'); return ok;
      }
    };
    el.querySelector('.loa').onclick = () => { if (cuoi) nai.noi(cuoi); };
    return nai;
  }

  /* ============================================================ THƯ VIỆN */
  function thuVien(bao) {
    BAI = null; LG = false; man('thu-vien');
    const d = docKho().bai || {}; let tongSao = 0, tongDiem = 0;
    DS.forEach(b => { const t = d[b.so] || {}; tongSao += soSao(t, b.luyen.length); tongDiem += diemBai(t); });
    app.append(h('<div class="tv-dau"><img src="' + MAT.cheer + '" alt=""><div class="col grow gap-2"><div class="t-h1">Học cùng Bé Nai</div><div class="t-label muted">Mỗi bài: truyện 1 phút, 2 bài luyện, 1 thử thách</div></div></div>'));
    const than = h('<div class="than cuon"></div>'); app.append(than);
    than.append(h('<div class="card solid-navy r20 row gap-12" style="padding:12px 16px"><div class="col grow gap-2"><div class="t-cap" style="color:#CBD5E1">Bạn đã có</div><div style="font-size:20px;line-height:26px;font-weight:700">' + tongSao + '/' + DS.length * 3 + ' sao · ' + tongDiem + ' điểm</div></div>' + ic('award', 's32') + '</div>'));
    DS.forEach(b => {             // một danh sách liền, đúng thứ tự phát hành; số hiển thị là vị trí trong danh sách
      const t = d[b.so] || {}, n = soSao(t, b.luyen.length);
      const o = h('<button class="o-bai"><img src="../assets/' + esc(b.bia) + '" alt=""><span class="col grow gap-2" style="min-width:0"><span class="ten">Bài ' + b.stt + ' · ' + esc(b.ten) + '</span><span class="phu">' + (b.che_do === 'don-gian' ? 'Cho ông bà · chữ lớn' : 'Cho học sinh') + ' · ' + esc(b.luyen.join(', ')) + '</span></span><span class="col gap-4 acenter none">' + saoHtml(n) + '<span class="t-cap ' + (n ? 'c-safe' : 'muted') + '">' + (n === 3 ? 'Xong' : n ? 'Đang học' : 'Mới') + '</span></span></button>');
      o.onclick = () => { location.href = 'hoc.html?bai=' + b.so; }; than.append(o);
    });
    if (ML.sap_co && ML.sap_co.length) than.append(h('<div class="card soft row gap-10 top" style="padding:12px">' + ic('lock', 's20 faint') + '<div class="col grow gap-2"><div class="t-label semi">Sắp có ' + ML.sap_co.length + ' bài nữa</div><div class="t-cap muted">' + esc(ML.sap_co.join(' · ')) + '</div></div></div>'));
    ve(); if (bao) baoNho(bao);
  }

  /* ============================================================ BÌA BÀI */
  function bia() {
    const B = BAI, t = tienDo(B.so), n = B.luyen.length; man('bia');
    thanh((B.che_do === 'don-gian' ? 'Dành cho ông bà' : 'Dành cho học sinh') + (LG ? ' · chữ lớn' : ''), 'Bài ' + STT, () => { location.href = 'hoc.html'; }, h('<span class="none">' + saoHtml(soSao(t, n)) + '</span>'));
    const v = vung();
    v.than.append(h('<div class="bia-anh"><img src="../assets/' + esc(B.bia) + '" alt=""></div>'));
    v.than.append(h('<div class="t-h1">' + esc(B.ten) + '</div>'));
    const c = t.c_tot || t.c;
    const phan = [
      ['A', 'Truyện 1 phút', 'Bé Nai kể chuyện ' + B.nhan_vat.replace(/^(Bà|Chú|Ông) /, m => m.toLowerCase()), !!t.a, () => truyen(0)],
      ['B', 'Luyện ' + n + ' bài · không tính điểm', B.luyen.map(x => x.ten).join(' · '), datB(t, n), () => luyen(0)],
      ['C', 'Thử thách · có tính điểm', B.thu_thach.ten + (c ? ' · ' + c.diem + '/' + c.tong + ' ý' : ''), datC(t), () => thuThach()]
    ];
    phan.forEach(p => {
      const o = h('<button class="phan' + (p[3] ? ' xong' : '') + '"><span class="so">' + (p[3] ? ic('check', 's20') : p[0]) + '</span><span class="col grow" style="min-width:0"><span class="ten">' + esc(p[1]) + '</span><span class="phu">' + esc(p[2]) + '</span></span>' + ic('chev-right', 's20 faint') + '</button>');
      o.onclick = p[4]; v.than.append(o);
    });
    const tiep = !t.a ? phan[0] : !datB(t, n) ? phan[1] : phan[2];
    datNut(v.chan, [{ chu: t.a ? 'Học tiếp' : 'Bắt đầu', chinh: true, icon: 'play', bam: tiep[4] }]);
    S.pha = 'san-sang';
  }

  /* ============================================================ A · TRUYỆN */
  function truyen(vt, chiRe) {
    const B = BAI, canh = typeof vt === 'number' ? B.truyen[vt] : vt === 'ngo-cut' ? B.ngo_cut : B.an_toan;
    const viTriRe = B.truyen.findIndex(x => x.re), tong = B.truyen.length + (B.an_toan ? 1 : 0);
    const nay = typeof vt === 'number' ? vt : vt === 'an-toan' ? B.truyen.length : viTriRe;
    const tk = man('truyen:' + vt, LG ? '' : 'toi');
    thanh('Bài ' + STT + ' · Truyện 1 phút', 'Bé Nai kể chuyện', bia, vt === 'ngo-cut' ? h('<span class="chip solid-danger">' + ic('alert', 's14') + 'Chưa đúng</span>') : vt === 'an-toan' ? h('<span class="chip solid-safe">' + ic('check', 's14') + 'Chọn đúng</span>') : null);
    const v = vung();
    v.than.append(h('<div class="tien">' + Array.from({ length: tong }, (_, i) => '<i class="' + (i < nay ? 'xong' : i === nay ? 'nay' : '') + '"></i>').join('') + '</div>'));
    if (canh.tranh) v.than.append(h('<div class="tranh"><img src="../assets/' + esc(canh.tranh) + '" alt="' + esc(canh.tom_tat || '') + '"></div>'));
    else {            // điểm rẽ không có tranh riêng: nhắc lại hai tranh vừa xem
      const truoc = B.truyen.slice(0, vt).filter(x => x.tranh).slice(-2);
      v.than.append(h('<div class="col gap-12 jcenter" style="flex:1;min-height:0"><div class="hai-tranh">' + truoc.map(x => '<img src="../assets/' + esc(x.tranh) + '" alt="">').join('') + '</div><div class="t-over center" style="color:#FFBF69">Tới lượt bạn quyết định</div></div>'));
    }
    const oLoi = h('<div class="loi"><div class="ai"><img alt=""><span class="ten"></span>' + ic('wave', 's16 song') + '</div><div class="chu"></div></div>'); v.than.append(oLoi);
    const hien = cau => {
      const ng = NGUOI[cau.ai] || NGUOI['be-nai'];
      oLoi.querySelector('img').src = ng.anh; oLoi.querySelector('.ten').textContent = ng.ten + (cau.ai === 'be-nai' ? ' kể' : '');
      oLoi.querySelector('.chu').textContent = cau.chu; oLoi.classList.toggle('ke-gian', !!ng.keGian);
    };
    let daRe = false, iCau = 0, soKe = 0;
    const quaKhung = () => {
      if (canh.re) return hienRe();
      if (vt === 'ngo-cut') return truyen(viTriRe, true);
      if (vt === 'an-toan') return xongTruyen();
      if (vt + 1 < B.truyen.length) return truyen(vt + 1);
      return B.an_toan && viTriRe < 0 ? truyen('an-toan') : xongTruyen();
    };
    function hienRe() {
      if (daRe) return; daRe = true; dungTieng(); oLoi.classList.remove('dang'); S.pha = 're';
      hien(canh.loi[canh.loi.length - 1]);
      v.chan.innerHTML = ''; v.chan.classList.add('doc');
      xao(canh.re).forEach((r, i) => {
        const o = h('<button class="lua-chon"><span class="so">' + (i + 1) + '</span><span>' + esc(r.chu) + '</span></button>');
        o.onclick = () => truyen(r.toi); v.chan.append(o);
      });
    }
    async function ke(tu) {
      const id = ++soKe; S.pha = 'ke';
      for (iCau = tu || 0; iCau < canh.loi.length; iCau++) {
        const cau = canh.loi[iCau]; S.cau = iCau; hien(cau); oLoi.classList.add('dang');
        const ok = await phatCau(cau); if (tk !== luot || daRe || id !== soKe) return;
        oLoi.classList.remove('dang'); if (!ok) return;
        await cho(250); if (tk !== luot || daRe || id !== soKe) return;
      }
      iCau = canh.loi.length - 1; S.pha = 'het-loi';
      if (canh.re) return hienRe();
      // Kể xong thì tự sang khung kế, cả bài học sinh lẫn bài ông bà (người già ít phải bấm); chữ lớn chờ lâu hơn (2 giây) cho kịp nhìn tranh.
      // Không tự sang ở khung ngõ cụt (chờ bấm "Quay lại điểm rẽ") và khi trang đang ẩn (nằm nền thì không tính là đã xem truyện; người học bấm Tiếp khi quay lại).
      if (vt !== 'ngo-cut') { await cho(LG ? 2000 : 700); if (tk === luot && S.pha === 'het-loi' && !document.hidden) quaKhung(); }
    }
    if (chiRe && canh.re) { hienRe(); return; }
    datNut(v.chan, [
      { chu: 'Nghe lại', icon: 'volume', ngan: true, bam: () => { dungTieng(); ke(0); } },
      // Tiếp: còn câu chưa hiện thì sang câu kế, hiện đủ lời của khung rồi mới sang khung sau (bấm liền tay cũng không bỏ sót lời)
      { chu: vt === 'ngo-cut' ? 'Quay lại điểm rẽ' : 'Tiếp', icon: vt === 'ngo-cut' ? 'refresh' : 'arrow-right', chinh: true, ngan: true, bam: () => { if (S.pha === 'ke' && iCau < canh.loi.length - 1) { dungTieng(); ke(iCau + 1); } else quaKhung(); } }
    ]);
    ke(0);
  }
  function xongTruyen() { capNhat(BAI.so, b => { b.a = true; }); onLai(); }

  function onLai() {
    const B = BAI; const tk = man('on-lai');
    thanh('Bài ' + STT + ' · Truyện 1 phút', 'Ôn lại', bia);
    const v = vung(), tr = B.truyen.filter(x => x.tranh).map(x => x.tranh).concat(B.an_toan ? [B.an_toan.tranh] : []).slice(0, 4);
    v.than.append(h('<div class="bon-tranh">' + tr.map((x, i) => '<div><img src="../assets/' + esc(x) + '" alt=""><span>' + (i + 1) + '</span></div>').join('') + '</div>'));
    v.than.append(h('<div class="card danger col gap-8" style="padding:12px 14px"><div class="row gap-6">' + ic('alert-oct', 's16 c-danger') + '<div class="t-over c-danger-ink">Dấu hiệu nhận biết</div></div><div class="row wrap gap-8">' + B.dau_hieu.map(x => '<span class="chip dh">' + esc(x) + '</span>').join('') + '</div></div>'));
    const nho = B.nho_mot_cau;
    v.than.append(h('<div class="card safe row gap-12" style="padding:12px 14px"><img src="' + MAT.thuong + '" width="56" height="56" style="border-radius:28px;flex:none" alt=""><div class="col grow gap-4"><div class="row gap-6">' + ic('check-circle', 's16 c-safe') + '<div class="t-over c-safe-ink">Nhớ một câu</div></div><div class="t-body bold c-safe-ink">' + esc(nho.hien || nho.chu) + '</div></div></div>'));
    datNut(v.chan, [{ chu: 'Nghe lại', icon: 'volume', ngan: true, bam: () => phatCau(nho) }, { chu: 'Vào phần luyện', icon: 'arrow-right', chinh: true, ngan: true, bam: () => luyen(0) }]);
    S.pha = 'san-sang'; phatCau(nho).then(() => { if (tk === luot) S.pha = 'het-loi'; });
  }

  /* ============================================================ B · LUYỆN (khung chung) */
  function luyen(i) {
    const B = BAI, bt = B.luyen[i], n = B.luyen.length;
    const tk = man('luyen:' + i, bt.dang === 'nghe-bam-dung' ? 'dem' : '');
    const nutGoiY = h('<button class="nut-nho">' + ic('sparkles', 's16') + 'Gợi ý</button>');
    thanh('Bài ' + STT + ' · Luyện ' + (i + 1) + '/' + n, bt.ten, bia, bt.goi_y && bt.goi_y.length ? nutGoiY : null);
    const than = h('<div class="than"></div>'), chan = h('<div class="chan"></div>'); app.append(than, chan);
    const nai = taoNai(than);
    const c = {
      bt, lg: LG, i, than, chan, daXem: false, buocGoiY: 0, ketQua: null,
      song: () => tk === luot, noi: (cau, o) => nai.noi(cau, o), khoaLoa: b => nai.khoaLoa(b), phatCau, cho, dungTieng, thoiDiem: thoiDiemPhat,
      nut: (ds, doc) => datNut(chan, ds, doc),
      ghi(kq) {           // lưu kết quả tốt nhất của bài luyện này
        capNhat(B.so, b => { b.b = b.b || []; const cu = b.b[i] || {}; b.b[i] = { xong: true, dat: !!(cu.dat || kq.dat), sao: Math.max(cu.sao || 0, kq.sao || 0) }; });
        c.ketQua = kq; S.ketQua = { dat: !!kq.dat, sao: kq.sao || 0 };
      },
      tiep() { if (i + 1 < n) luyen(i + 1); else thuThach(); },
      lamLai() { luyen(i); },
      // Kết thúc bài luyện. giu = giữ nguyên màn của khối; truoc = các câu Bé Nai nói trước lời khen cuối.
      async ket(o) {
        o = o || {}; const dat = !c.daXem && o.dat !== false; S.pha = 'xong'; c.daKet = true; c.ghi({ dat, sao: o.sao || 0 });
        than.querySelectorAll('.bao-xem').forEach(x => x.remove());
        const ds = [{ chu: i + 1 < n ? 'Bài luyện tiếp' : 'Tới thử thách', icon: 'arrow-right', chinh: true, bam: c.tiep }];
        if (!dat) ds.push({ chu: 'Làm lại để đạt', icon: 'refresh', bam: c.lamLai });
        c.nut(ds);
        if (!o.giu) {
          [...than.children].forEach(x => { if (x !== nai.el) x.remove(); });
          than.append(h('<div class="col gap-12 acenter jcenter vao" style="flex:1;min-height:0"><img src="' + MAT.cheer + '" style="width:120px;height:120px;border-radius:60px" alt=""><div class="t-h1 center">Xong bài luyện ' + (i + 1) + '/' + n + '</div>' + (dat ? '<span class="chip solid-safe" style="height:32px">' + ic('check', 's14') + 'Đạt</span>' : '') + '</div>'));
        }
        if (!dat) than.querySelectorAll('.dong-tt').forEach(x => x.remove());
        if (!dat) than.append(h('<div class="card warn row gap-8 top bao-xem" style="padding:10px 12px;flex:none">' + ic('info', 's18 c-warn') + '<div class="t-label c-warn-ink">' + esc((!c.daXem && o.ghiChu) || ('Đã xem đáp án nên bài này chưa tính là đạt. ' + hoa(BAN) + ' làm lại lúc nào cũng được.')) + '</div></div>'));
        ve();
        for (const cau of (o.truoc || [])) { if (cau && !(await c.noi(cau, { mat: 'cheer' }))) return; }
        if (bt.xong && dat) await c.noi(bt.xong, { mat: 'cheer' });
      },
      moGoiY() { moGoiY(c); },
      // bấm bừa không được tính: sai quá mức cho phép thì bài xong nhưng chưa đạt (luật sao ở mục 1 của kịch bản)
      chuaDat(viec) { return { dat: false, ghiChu: viec + ' nên chưa tính là đạt.' }; }
    };
    nutGoiY.onclick = () => moGoiY(c);
    (DANG[bt.dang] || (() => { than.append(h('<div class="card warn">Dạng bài "' + esc(bt.dang) + '" chưa dựng.</div>')); c.nut([{ chu: 'Tiếp', chinh: true, bam: c.tiep }]); }))(c);
    ve();
  }

  // Gợi ý ba bước, mở dần. Mở đủ ba bước mới có nút "Xem đáp án"; đã xem thì bài không tính là đạt.
  function moGoiY(c) {
    const ds = c.bt.goi_y || []; if (!ds.length) return;
    if (c.khiMoGoiY) c.khiMoGoiY();
    if (c.buocGoiY === 0) c.buocGoiY = 1;
    // Ô gợi ý là hộp thoại: phần trang phía sau không bấm, không Tab tới được (inert) cho tới khi đóng; tiêu điểm vào nút Đóng rồi trả về nút Gợi ý.
    const nen = [...app.children], truocDo = document.activeElement;
    const phu = h('<div class="man-phu" role="dialog" aria-modal="true" aria-label="Gợi ý của Bé Nai"><div class="to-goi-y"></div></div>'), to = phu.firstElementChild; app.append(phu); S.goiY = c.buocGoiY;
    nen.forEach(x => { x.inert = true; });
    const dong = () => {
      dungTieng(); nen.forEach(x => { x.inert = false; }); phu.remove(); S.goiY = 0;
      if (c.khiDongGoiY) c.khiDongGoiY();          // B6 tự lo trường hợp lượt đã kết thúc (c.daKet) khi dựng lại nút
      if (truocDo && truocDo.isConnected && truocDo.focus) try { truocDo.focus({ preventScroll: true }); } catch (e) { }
    };
    phu.onclick = e => { if (e.target === phu) dong(); };
    function veTo(doc) {
      to.innerHTML = '<div class="row between"><div class="ai-tag">' + ic('sparkles', 's14') + 'Gợi ý của Bé Nai · ' + Math.min(c.buocGoiY, ds.length) + '/' + ds.length + '</div></div>' +
        ds.slice(0, c.buocGoiY).map((g, k) => '<div class="buoc"><b>Bước ' + (k + 1) + '</b>' + esc(g.chu) + '</div>').join('') +
        (c.daXem ? '<div class="buoc dap"><b>Đáp án</b>' + esc(c.dapAn ? c.dapAn() : (c.bt.dap_an || '')) + '</div>' : '') + '<div class="row gap-10 nut"></div>';
      const hang = to.querySelector('.nut'), them = (chu, lop, bam) => { const b = h('<button class="btn ' + lop + '" style="flex:1;min-width:0;height:' + (LG ? 60 : 52) + 'px">' + esc(chu) + '</button>'); b.onclick = bam; hang.append(b); };
      them('Đóng', 'outline', dong);
      if (c.buocGoiY < ds.length) them('Gợi ý tiếp', 'tonal', () => { c.buocGoiY++; S.goiY = c.buocGoiY; veTo(true); });
      else if (!c.daXem && (c.dapAn || c.bt.dap_an)) them('Xem đáp án', 'nhat', () => {      // xem đáp án là kết thúc lượt này: xong nhưng chưa đạt, muốn đạt thì làm lại
        c.daXem = true; S.daXem = true; if (c.khiXem) c.khiXem(); if (c.ket && !c.daKet) c.ket({ giu: true, dat: false }); veTo(false); });
      ve();
      const nutDong = hang.querySelector('button'); if (nutDong) try { nutDong.focus({ preventScroll: true, focusVisible: false }); } catch (e) { }      // không vẽ viền tiêu điểm khi người học chạm (người cao tuổi dễ tưởng là nút đang được chọn)
      if (doc) { const g = ds[c.buocGoiY - 1]; if (g && g.giong) phatCau(g); }
    }
    veTo(true);
  }

  /* ============================================================ B2 · THẬT HAY LỪA
     Chữ lớn: hai nút to "Khoan đã" / "Được" (thẻ lừa và thẻ cần kiểm tra đều là "Khoan đã").
     Đầy đủ: vuốt thẻ sang trái (Lừa), sang phải (Bình thường), hoặc bấm một trong ba nút. */
  function b2(c) {
    const bt = c.bt, ds = bt.the.filter(t => t.mau).concat(xao(bt.the.filter(t => !t.mau)));
    const NUT = c.lg
      ? [{ k: 'khoan', chu: 'Khoan đã', icon: 'hand', lop: 'khoan', to: true, ngan: true }, { k: 'duoc', chu: 'Được', icon: 'check', lop: 'safe', to: true, ngan: true }]
      : [{ k: 'lua', chu: 'Lừa', lop: 'danger hep' }, { k: 'can-kiem-tra', chu: 'Cần kiểm tra', lop: 'khoan hep' }, { k: 'binh-thuong', chu: 'Bình thường', lop: 'safe hep' }];
    const NHAN = c.lg ? { 'lua': 'Khoan đã', 'can-kiem-tra': 'Khoan đã', 'binh-thuong': 'Được' } : { 'lua': 'Lừa', 'can-kiem-tra': 'Cần kiểm tra', 'binh-thuong': 'Bình thường' };
    const yen = d => d === 'binh-thuong' || d === 'duoc';
    const khung = h('<div class="the-khung"><div class="the-dem"></div><div class="the"><div class="chu"></div></div>' + (c.lg ? '' : '<div class="vuot"><span>← Lừa</span><span>Bình thường →</span></div>') + '</div>');
    c.than.append(khung); const the = khung.querySelector('.the'); let i = 0, mo = false, saiLan = 0;
    const dongDau = t => {
      if (the.querySelector('.dau')) return; the.classList.add(yen(t.dap_an) ? 'duoc' : 'khoan');
      the.append(h('<div class="dau">' + ic(yen(t.dap_an) ? 'check' : 'hand', 's18') + esc(NHAN[t.dap_an]) + '</div>')); ve();
    };
    c.dapAn = () => 'Thẻ này: ' + NHAN[ds[Math.min(i, ds.length - 1)].dap_an] + '.';
    async function moThe() {
      const t = ds[i]; mo = false; S.pha = 'the:' + i + (t.mau ? ':mau' : '');
      the.className = 'the vao'; the.style.transform = ''; the.innerHTML = (t.mau ? '<span class="chip ai mau">' + ic('sparkles', 's14') + 'Bé Nai làm mẫu</span>' : '') + '<div class="chu">' + esc(t.chu) + '</div>';
      khung.querySelector('.the-dem').textContent = 'Thẻ ' + (i + 1) + '/' + ds.length;
      if (t.mau) c.nut([{ chu: 'Tiếp', icon: 'arrow-right', chinh: true, bam: () => { if (!mo) { mo = true; dongDau(t); c.noi(t.giai_thich); } else sau(); } }]);
      else c.nut(NUT.map(n => Object.assign({}, n, { bam: () => chon(n.k) })));
      if (i === 0 && bt.mo_dau) { if (!(await c.noi(bt.mo_dau))) return; }
      if (!(await c.noi(t))) return;
      if (t.mau && !mo) { mo = true; dongDau(t); await c.noi(t.giai_thich); }
    }
    async function chon(k) {
      const t = ds[i]; if (mo || c.daKet) return;
      if (!c.lg && k !== t.dap_an && !yen(k) && !yen(t.dap_an)) {       // ba nút: nhầm giữa "Lừa" và "Cần kiểm tra" là gần đúng, cho chọn lại
        S.pha = 'gan:' + i; the.classList.remove('lac', 'vao'); void the.offsetWidth; the.classList.add('lac');
        c.noi({ chu: 'Gần đúng rồi. ' + hoa(BAN) + ' coi lại, chuyện này đã chắc là lừa chưa, hay còn phải kiểm tra thêm?' }, { mat: 'think' }); return;
      }
      if (c.lg ? yen(k) === yen(t.dap_an) : k === t.dap_an) {
        mo = true; S.pha = 'dung:' + i; dongDau(t); c.nut([{ chu: 'Tiếp', icon: 'arrow-right', chinh: true, bam: sau }]);
        if (await c.noi(bt.dung, { mat: 'cheer' })) await c.noi(t.giai_thich, { mat: 'cheer' });
      } else {
        S.pha = 'sai:' + i; saiLan++; the.classList.remove('lac', 'vao'); void the.offsetWidth; the.classList.add('lac'); the.style.transform = '';
        const canThan = yen(t.dap_an);          // người học cẩn thận quá với một chuyện bình thường
        if (await c.noi(canThan ? bt.can_than : bt.sai, { mat: canThan ? 'think' : 'stop' })) await c.noi(t.giai_thich, { mat: 'think' });
      }
    }
    // bấm thử hết các nút thì không tính: chọn sai từ hai lần trở lên (không kể "gần đúng") là xong nhưng chưa đạt
    function sau() { i++; if (i >= ds.length) { i = ds.length - 1; c.ket(saiLan > 1 ? c.chuaDat('Xong rồi, nhưng chọn sai ' + saiLan + ' lần') : {}); } else moThe(); }
    if (!c.lg) {          // vuốt thẻ
      let x0 = null;
      the.onpointerdown = e => { if (mo || ds[i].mau) return; x0 = e.clientX; the.setPointerCapture(e.pointerId); };
      the.onpointermove = e => { if (x0 == null) return; const dx = e.clientX - x0; the.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 30 + 'deg)'; };
      the.onpointerup = e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; the.style.transform = ''; if (Math.abs(dx) > 70) chon(dx < 0 ? 'lua' : 'binh-thuong'); };
      the.onpointercancel = () => { x0 = null; the.style.transform = ''; };      // hệ thống lấy cử chỉ (cuộn…): chỉ đặt thẻ về chỗ, không chấm
    }
    moThe();
  }

  /* ============================================================ B6 · NGHE VÀ BẤM DỪNG
     Bấm Dừng lúc nào cũng ngắt cuộc gọi ngay. Dừng sau dấu hiệu đầu tiên: ba sao, càng trễ càng ít sao.
     Dừng trước khi có dấu hiệu: vẫn là xử lý an toàn (bài xong, không có sao), Bé Nai mời nghe thêm một lượt. */
  function b6(c) {
    const bt = c.bt, cau = bt.cau, ng = bt.nguoi_goi || {};
    const goi = h('<div class="goi"><span class="chip" style="background:#1E293B;color:#C4B5FD">' + ic('sparkles', 's14') + 'Mô phỏng · AI đóng vai</span><img class="anh" src="' + esc(ng.anh || '../assets/avatar-hat-dau.png') + '" alt=""><div class="ten">' + esc(ng.ten || 'Số lạ') + '</div><div class="tt"></div><div class="cau trong"></div><div class="phu-cau row gap-8 jcenter" style="min-height:36px"></div></div>');
    c.than.append(goi);
    const oTt = goi.querySelector('.tt'), oCau = goi.querySelector('.cau'), oPhu = goi.querySelector('.phu-cau');
    let pha = 'mo', k = -1, trong = false, luotGoi = 0, lanDau = true, lanHet = 0;
    const datPha = p => { pha = p; S.pha = p; c.khoaLoa(p === 'mau' || p === 'chuan-bi' || p === 'luot'); };
    const thuGon = (b, an) => { goi.classList.toggle('nho', !!b); goi.classList.toggle('an-nguoi', !!an); oCau.style.display = b ? 'none' : ''; oPhu.style.display = b ? 'none' : ''; };
    const tt = (chu, song) => { oTt.innerHTML = (song ? ic('wave', 's16') : '') + '<span>' + esc(chu) + '</span>'; ve(); };
    const hienCau = (x, j, n) => {
      oCau.classList.toggle('trong', !x); oCau.textContent = x ? '“' + x.chu + '”' : 'Lời người gọi sẽ hiện ở đây';
      oPhu.innerHTML = n ? '<span class="cham-cau">' + Array.from({ length: n }, (_, q) => '<i class="' + (q < j ? 'qua' : q === j ? 'nay' : '') + '"></i>').join('') + '</span>' : '';
    };
    const nutDung = bat => { const d = c.nut([{ chu: 'DỪNG', icon: 'phone-off', lop: 'dung', tat: !bat, bam: bamDung }])[0]; return d.el; };
    const dapAnChu = bt.dap_an; c.dapAn = () => dapAnChu;
    let phaTruoc = '';
    c.khiMoGoiY = () => { if (pha === 'luot' || pha === 'mau' || pha === 'chuan-bi') { phaTruoc = pha; luotGoi++; dungTieng(); datPha('tam'); tt('Tạm dừng'); } };
    const nutNgheNua = chu => (c.daXem ? { chu: 'Làm lại để đạt', icon: 'refresh', bam: c.lamLai } : { chu, icon: 'refresh', bam: chayLuot });
    // Đóng gợi ý khi cuộc gọi đang tạm dừng: cho nghe lại; nếu bài đã xong từ lượt trước (nghe lại sau khi đã dừng, hoặc vừa xem đáp án) thì thêm nút đi tiếp.
    c.khiDongGoiY = () => {
      if (pha !== 'tam') return;
      const ds = [phaTruoc === 'mau' ? { chu: 'Nghe lại lượt mẫu', icon: 'play', chinh: true, bam: chayMau } : Object.assign(nutNgheNua('Nghe lại từ đầu'), { chinh: true })];
      if (c.daKet) { thuGon(true); ds.push({ chu: c.i + 1 < BAI.luyen.length ? 'Bài luyện tiếp' : 'Tới thử thách', icon: 'arrow-right', bam: c.tiep }); }
      c.nut(ds);
    };

    function moDau() {
      datPha('mo'); tt('Chưa gọi'); hienCau(null);
      c.nut([{ chu: 'Nghe Bé Nai làm mẫu', icon: 'play', chinh: true, bam: chayMau }]);
      c.noi(bt.mo_dau);
    }
    async function chayMau() {
      const id = ++luotGoi, M = bt.mau; datPha('mau'); const nut = nutDung(false);
      if (!(await c.noi(M.loi)) || id !== luotGoi) return;
      for (let j = 0; j < M.cau.length; j++) {
        const m = M.cau[j]; hienCau(m, j, M.cau.length); tt('Đang nói…', true);
        let ok;
        if (m.dau_hieu && Number.isFinite(m.dau_hieu.luc)) {     // Bé Nai cúp ngay khi dấu hiệu vang lên (mốc "luc"), đúng như cách chấm lượt thật
          let het = false; const p = c.phatCau(m).then(x => { het = true; return x; });
          while (!het && c.thoiDiem() < m.dau_hieu.luc + 0.5) { await c.cho(100); if (id !== luotGoi || !c.song()) return; }
          if (het) ok = await p; else { c.dungTieng(); await p; ok = true; }
        } else ok = await c.phatCau(m);
        if (!ok || id !== luotGoi || !c.song()) return;
        if (m.nhan) { oPhu.innerHTML = '<span class="nhan-cau">' + ic('check', 's14') + esc(m.nhan) + '</span>'; ve(); await c.cho(1100); if (id !== luotGoi || !c.song()) return; }
        if (m.dau_hieu) {
          nut.classList.add('nhay'); await c.cho(500); if (id !== luotGoi || !c.song()) return;
          tt('Bé Nai đã bấm Dừng'); oPhu.innerHTML = '<span class="nhan-cau do">' + ic('alert', 's14') + esc(m.dau_hieu.ten) + '</span>'; ve(); break;
        }
      }
      datPha('mau-xong');
      c.nut([{ chu: 'Tới lượt ' + BAN, icon: 'play', chinh: true, bam: chayLuot }]);
      c.noi(M.giai_thich, { mat: 'stop' });
    }
    async function chayLuot() {
      const id = ++luotGoi; datPha('chuan-bi'); thuGon(false); goi.querySelectorAll('.kq').forEach(x => x.remove());
      k = -1; trong = false; hienCau(null, 0, cau.length); tt('Đang đổ chuông…'); nutDung(true);      // cúp máy được ngay từ lúc đổ chuông
      if (lanDau && bt.toi_luot) { lanDau = false; await c.noi(bt.toi_luot); if (id !== luotGoi || !c.song()) return; }
      else { c.dungTieng(); await c.cho(500); if (id !== luotGoi || !c.song()) return; }
      datPha('luot');
      for (k = 0; k < cau.length; k++) {
        hienCau(cau[k], k, cau.length); tt('Đang nói…', true); trong = true;
        const ok = await c.phatCau(cau[k]);
        if (id !== luotGoi) return;       // lời hứa của lượt cũ về muộn: không được đụng tới cờ "đang nói" của lượt mới
        trong = false;
        if (!ok || !c.song() || pha !== 'luot') return;
        await c.cho(600); if (id !== luotGoi || !c.song() || pha !== 'luot') return;
      }
      datPha('het'); lanHet++; tt('Người gọi đã nói hết');
      c.nut([{ chu: 'Nghe lại', icon: 'refresh', chinh: true, bam: chayLuot }]);
      if (c.daKet) return;
      await c.noi(bt.het, { mat: 'think' });
    }
    function bamDung() {
      if (pha !== 'luot' && pha !== 'chuan-bi') return;
      const kk = pha === 'chuan-bi' ? -1 : Math.min(k, cau.length - 1), t = trong ? c.thoiDiem() : Infinity; luotGoi++; c.dungTieng();
      let nghe = null;           // câu có dấu hiệu gần nhất mà người học đã kịp nghe
      for (let j = 0; j <= kk; j++) { const d = cau[j].dau_hieu; if (d && (j < kk || t >= (d.luc || 0))) nghe = cau[j]; }
      tt('Đã cúp máy'); thuGon(true); S.dungO = { cau: kk, t: Math.round(t * 100) / 100 };
      if (!nghe) {
        datPha('som'); c.ghi({ dat: !c.daXem, sao: 0 });
        c.nut([Object.assign(nutNgheNua('Nghe lượt nữa'), { chinh: true }), { chu: 'Qua bài sau', icon: 'arrow-right', bam: c.tiep }]);
        c.noi(bt.som, { mat: 'cheer' }); return;
      }
      datPha('hoi'); const d = nghe.dau_hieu;
      c.nut(xao([{ chu: d.ten, dung: true }, { chu: d.nhieu }]).map(x => ({ chu: x.chu, lop: 'outline', bam: () => tra(d, !!x.dung) })), true);
      c.noi(bt.hoi_xac_nhan, { mat: 'think' });
    }
    async function tra(d, dung) {
      datPha('ket'); thuGon(true, true);
      goi.append(h('<div class="kq col gap-8 acenter w-full vao">' + saoHtml(d.sao, 'lon') + '<div class="ds-chieu">' + cau.filter(x => x.dau_hieu).map(x => '<div class="' + (x.dau_hieu === d ? 'day' : '') + '">' + ic('alert', 's18') + '<span>' + esc(x.dau_hieu.ten) + '</span></div>').join('') + '</div></div>'));
      S.xacNhan = dung;
      c.ket({ giu: true, sao: d.sao, truoc: [dung ? null : d.nhac, bt.ket[String(d.sao)], bt.tong_ket] });
      const ds = [{ chu: 'Bài luyện tiếp', icon: 'arrow-right', chinh: true, bam: c.tiep }, nutNgheNua(d.sao < 3 ? 'Nghe lại để được 3 sao' : 'Nghe lượt nữa')];
      if (c.i + 1 >= BAI.luyen.length) ds[0].chu = 'Tới thử thách';
      c.nut(ds);
    }
    moDau();
  }

  /* ============================================================ B1 · CHẠM BẮT BÀI */
  function b1(c) {
    const bt = c.bt, D = bt.tin.doan, can = D.filter(d => d.loai === 'dau-hieu' && !d.mau), bat = new Set(), nhamDa = new Set(); let nham = 0, het = false;   // nham = số chỗ nhầm KHÁC NHAU
    const el = h('<div class="tin"><div class="tu"><span class="avatar gray" style="width:36px;height:36px">' + ic('user', 's20') + '</span><span>' + esc(bt.tin.tu || 'Số lạ') + '</span><span class="chip ai" style="margin-left:auto">' + ic('sparkles', 's14') + 'Tin mô phỏng</span></div><div class="bong-tin"></div></div>');
    const oTt = h('<div class="dong-tt"></div>'); c.than.append(el, oTt); const bong = el.querySelector('.bong-tin'), nut = new Map();
    const capTt = () => { oTt.innerHTML = ic('flag', 's18 c-danger') + '<span>Đã bắt ' + bat.size + '/' + can.length + ' chỗ đáng ngờ' + (nham ? ' · chạm nhầm ' + nham : '') + '</span>'; ve(); };
    D.forEach(d => {
      const s = document.createElement('span'); s.className = 'doan' + (d.mau ? (d.loai === 'dau-hieu' ? ' bat' : ' hien') : ''); s.textContent = d.chu; s.setAttribute('role', 'button');
      s.tabIndex = 0; s.onclick = () => cham(d, s); s.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cham(d, s); } }; bong.append(s, ' '); nut.set(d, s);
    });
    c.dapAn = () => 'Các chỗ đáng ngờ đã được tô vàng trong tin nhắn.';
    c.khiXem = () => { can.forEach(d => { if (!bat.has(d)) nut.get(d).classList.add('lo'); }); het = true; };
    function cham(d, s) {
      if (d.mau || bat.has(d) || het || c.daKet) { if (d.giai_thich) c.noi(d.giai_thich); return; }      // bài đã xong hoặc đã xem đáp án: chạm chỉ để nghe giải thích
      if (d.loai === 'dau-hieu') {
        bat.add(d); s.classList.remove('lo'); s.classList.add('bat'); capTt(); S.pha = 'bat:' + bat.size;
        if (bat.size === can.length) {      // chạm bừa hết mọi chỗ thì không tính: nhầm từ hai chỗ trở lên là xong nhưng chưa đạt
          het = true; const gon = nham <= (bt.nham_toi_da == null ? 1 : bt.nham_toi_da);
          c.ket({ giu: true, dat: gon, truoc: [d.giai_thich], ghiChu: gon ? '' : 'Bắt đủ rồi, nhưng chạm nhầm ' + nham + ' chỗ nên chưa tính là đạt. Làm lại, thử bắt cho gọn nha.' });
        }
        else c.noi(d.giai_thich, { mat: 'cheer' });
      } else if (d.giai_thich) {
        nhamDa.add(d); nham = nhamDa.size; s.classList.remove('lac'); void s.offsetWidth; s.classList.add('lac'); capTt(); S.pha = 'nham:' + nham; c.noi(d.giai_thich, { mat: 'think' });
      }
    }
    capTt(); c.nut([]); S.pha = 'lam'; c.noi(bt.mo_dau);
  }

  /* ============================================================ B4 · NỐI LỜI VỚI CHIÊU
     Chạm một câu rồi chạm tên chiêu để gắn vào (không kéo thả). Hai cặp đầu là mẫu; có một tên chiêu gây nhiễu. */
  function b4(c) {
    const bt = c.bt, mau = bt.cap.filter(x => x.mau), lam = xao(bt.cap.filter(x => !x.mau)), xong = new Set();
    const canTen = new Set(lam.map(x => x.chieu)), dungRoi = new Set(mau.map(x => x.chieu)), chieu = xao(bt.chieu.filter(t => canTen.has(t.ten) || !dungRoi.has(t.ten)));
    const kieu = bt.kieu === 'nhom' ? ' nhom' : ''; let chon = null, sai = 0;
    const theCau = (x, gan) => '<div class="dong"><span class="chu">' + esc(x.chu) + '</span>' + (x.giong ? '<span class="nghe" role="button" aria-label="Nghe câu này">' + ic('volume', 's18') + '</span>' : '') + '</div>' + gan;
    c.dapAn = () => lam.map(x => '“' + x.chu + '” là ' + x.chieu).join('; ') + '.';
    function buocMau() {
      S.pha = 'mau'; const ds = h('<div class="cap-ds"><div class="t-cap bold muted">' + esc(bt.nguoi || 'Lời kẻ gian (mô phỏng)') + '</div></div>');
      mau.forEach(x => {
        const o = h('<div class="cau-noi xong' + kieu + '">' + theCau(x, '<span class="gan">' + ic('check', 's14') + esc(x.chieu) + '</span><span class="vi">' + esc(x.giai_thich ? x.giai_thich.chu : '') + '</span>') + '</div>'); const ng = o.querySelector('.nghe');
        if (ng) { ng.tabIndex = 0; ng.onclick = () => c.phatCau(x); ng.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.phatCau(x); } }; }
        ds.append(o);
      });
      c.than.append(ds); c.nut([{ chu: 'Tới lượt ' + BAN, icon: 'play', chinh: true, bam: () => { ds.remove(); buocLam(); } }]);
      (async () => { if (await c.noi(bt.mo_dau)) await c.noi(bt.loi_mau); })();
    }
    function buocLam() {
      S.pha = 'lam'; c.dungTieng();
      const ds = h('<div class="cap-ds"><div class="t-cap bold muted">' + esc(bt.nguoi || 'Lời kẻ gian (mô phỏng)') + '</div></div>'), oTt = h('<div class="dong-tt"></div>'), luoi = h('<div class="chieu-ds"></div>');
      const oCau = new Map();
      // câu đã nối đúng: chạm chỉ để nghe lại
      const chonCau = (x, nghe) => { if (xong.has(x)) { if (nghe && x.giong) c.phatCau(x); return; } chon = x; oCau.forEach((o, y) => o.classList.toggle('chon', y === x)); if (nghe && x.giong) c.phatCau(x); };
      lam.forEach(x => {
        const o = h('<button class="cau-noi' + kieu + '">' + theCau(x, '<span class="gan cho">Chưa gắn chiêu</span>') + '</button>');
        o.onclick = () => chonCau(x, true); ds.append(o); oCau.set(x, o);
      });
      chieu.forEach(t => {
        const b = h('<button class="chieu">' + esc(t.ten) + '</button>');
        b.onclick = () => {
          if (c.daKet) return;            // đã xong hoặc đã xem đáp án: lượt này khóa, muốn làm thì bấm "Làm lại để đạt"
          if (!chon || xong.has(chon)) chonCau(lam.find(y => !xong.has(y)));
          if (!chon || xong.has(chon)) return;
          const x = chon, o = oCau.get(x);
          if (t.ten === x.chieu) {
            xong.add(x); if (!lam.some(y => !xong.has(y) && y.chieu === t.ten)) b.classList.add('het'); o.classList.remove('chon'); o.classList.add('xong'); o.disabled = false;
            o.querySelector('.gan').outerHTML = '<span class="gan">' + ic('check', 's14') + esc(t.ten) + '</span>';
            oTt.innerHTML = ic('check-circle', 's18 c-safe') + '<span class="c-safe-ink">' + esc(t.ten) + ': đúng rồi</span>'; ve(); S.pha = 'dung:' + xong.size;
            const con = lam.find(y => !xong.has(y));
            if (!con) { luoi.remove(); c.ket(Object.assign({ giu: true, truoc: [bt.dung, x.giai_thich] }, sai > 1 ? c.chuaDat('Nối đủ rồi, nhưng nối nhầm ' + sai + ' lần') : {})); }
            else { chonCau(con); (async () => { if (await c.noi(bt.dung, { mat: 'cheer' })) await c.noi(x.giai_thich, { mat: 'cheer' }); })(); }
          } else {
            sai++; b.classList.remove('lac'); void b.offsetWidth; b.classList.add('lac'); S.pha = 'sai:' + sai;
            oTt.innerHTML = ic('info', 's18 c-warn') + '<span class="c-warn-ink">' + esc(t.khong_phai || 'Chưa khớp.') + '</span>'; ve();
            c.noi(bt.sai, { mat: 'think' });
          }
        };
        luoi.append(b);
      });
      c.khiXem = () => { oTt.innerHTML = ic('info', 's18 c-warn') + '<span class="c-warn-ink">Đáp án đang hiện trong ô gợi ý.</span>'; ve(); };
      c.than.append(ds, oTt, luoi); c.nut([]); chonCau(lam[0]); ve();
      c.noi(bt.nhac || { chu: 'Chạm một câu, rồi chạm tên chiêu của nó nha.' });
    }
    if (mau.length) buocMau(); else buocLam();
  }

  /* ============================================================ B5 · VIỆC NÀO TRƯỚC
     Đầy đủ: chạm lần lượt các việc theo thứ tự nên làm; chỉ chấm ràng buộc ghi trong tệp ("toi_da": phải nằm trong mấy việc đầu,
     "toi_thieu": không được sớm hơn vị trí đó). Chữ lớn (hoặc tệp chỉ đánh dấu "dung"): chỉ chọn việc đầu tiên. */
  function b5(c) {
    // Dữ liệu xếp thứ tự thì luôn xếp, kể cả khi ép chữ lớn: cùng một bài thì cùng một yêu cầu để đạt.
    const bt = c.bt, V = bt.viec, xep = V.some(v => v.toi_da || v.toi_thieu) && !V.some(v => v.dung);
    const dungDau = v => (V.some(x => x.dung) ? !!v.dung : !(v.toi_thieu > 1));      // dữ liệu xếp thứ tự: việc nào được phép đứng đầu thì chọn đầu là đúng
    c.dapAn = () => bt.dap_an || ('Việc đầu tiên: ' + V.filter(dungDau).map(v => v.chu).join(' hoặc '));
    function buocMau() {
      const M = bt.mau; S.pha = 'mau';
      const o = h('<div class="col gap-12" style="flex:1;min-height:0;justify-content:center"><span class="chip ai" style="align-self:flex-start">' + ic('sparkles', 's14') + 'Bé Nai làm mẫu</span><div class="tinh-huong">' + ic('message-alert', 's20') + '<span>' + esc(M.tinh_huong) + '</span></div>' +
        M.viec.map((x, j) => '<div class="viec dung"><span class="so">' + (j + 1) + '</span><span class="nd">' + esc(x) + '</span></div>').join('') + '<div class="t-label muted">' + esc(M.giai_thich || '') + '</div></div>');
      c.than.append(o); c.nut([{ chu: 'Tới lượt ' + BAN, icon: 'play', chinh: true, bam: () => { o.remove(); (xep ? buocXep : buocChon)(); } }]);
      c.noi(M.loi);
    }
    function buocChon() {               // chỉ chọn việc đầu tiên
      S.pha = 'lam'; const ds = xao(V), khung = h('<div class="viec-ds"></div>'); let xong = false, saiChon = 0;
      c.than.append(h('<div class="tinh-huong">' + ic('message-alert', 's20') + '<span>' + esc(bt.tinh_huong) + '</span></div>'), khung);
      const o = new Map(); ds.forEach(v => { const b = h('<button class="viec"><span class="so">' + ic('chev-right', 's18') + '</span><span class="nd">' + esc(v.chu) + '</span></button>'); b.onclick = () => chon(v); khung.append(b); o.set(v, b); });
      c.nut([]); ve();
      c.khiXem = () => { o.forEach((b, y) => { if (dungDau(y)) { b.classList.remove('sai'); b.classList.add('dung'); } else b.remove(); }); xong = true; };
      async function chon(v) {
        if (xong || c.daKet) return; o.forEach(b => b.classList.remove('doc'));
        if (dungDau(v)) {
          xong = true; S.pha = 'dung'; o.forEach((b, y) => { if (y === v) { b.classList.add('dung'); b.querySelector('.so').innerHTML = '1'; } else if (saiChon) b.remove(); else b.style.opacity = '.5'; });
          // chỉ một câu hỏi: phải chọn đúng ngay lần đầu mới đạt (bấm lần lượt từng việc thì không tính)
          c.ket(Object.assign({ giu: true, truoc: [v.giai_thich || (v.vi_sao ? { chu: v.vi_sao } : bt.dung)] }, saiChon ? c.chuaDat('Chọn đúng rồi, nhưng lần đầu chọn chưa đúng') : {}));
        } else {
          S.pha = 'sai'; saiChon++; const b = o.get(v); b.classList.add('sai', 'lac'); b.disabled = true; b.querySelector('.so').innerHTML = ic('x', 's18'); ve();
          c.noi(v.giai_thich || v.sai || bt.sai, { mat: 'stop' });
        }
      }
      (async () => {                     // Bé Nai đọc câu hỏi rồi đọc lần lượt từng việc
        if (!(await c.noi(bt.hoi, { mat: 'think' }))) return;
        for (const v of ds) { if (xong || !v.giong) continue; o.get(v).classList.add('doc'); const ok = await c.noi(v, { mat: 'think' }); o.get(v).classList.remove('doc'); if (!ok) return; }
      })();
    }
    function buocXep() {                 // chạm lần lượt theo thứ tự
      S.pha = 'lam'; const ds = xao(V), khung = h('<div class="viec-ds xep"></div>'), thu = []; let khoa = false, saiXep = 0;
      c.than.append(h('<div class="tinh-huong">' + ic('message-alert', 's20') + '<span>' + esc(bt.tinh_huong) + '</span></div>'), khung);
      const o = new Map(); ds.forEach(v => { const b = h('<button class="viec"><span class="so"></span><span class="nd">' + esc(v.chu) + '</span></button>'); b.onclick = () => cham(v); khung.append(b); o.set(v, b); });
      const veLai = () => {
        o.forEach((b, v) => { const p = thu.indexOf(v); b.classList.toggle('co', p >= 0); b.classList.remove('sai'); b.querySelector('.so').textContent = p >= 0 ? p + 1 : ''; });
        nutK.el.disabled = thu.length < V.length; nutX.el.disabled = !thu.length;
      };
      const xepLai = () => { if (khoa === 'xong' || c.daKet) return; thu.length = 0; khoa = false; veLai(); S.pha = 'lam'; };
      function cham(v) {
        if (khoa === 'xong' || c.daKet) return; if (khoa) xepLai();
        const p = thu.indexOf(v); if (p < 0) thu.push(v); else if (p === thu.length - 1) thu.pop(); else return;
        veLai();
      }
      function kiem() {
        if (khoa === 'xong' || c.daKet) return;
        let loi = thu.find((v, p) => v.toi_da && p + 1 > v.toi_da); if (!loi) loi = thu.find((v, p) => v.toi_thieu && p + 1 < v.toi_thieu);
        if (loi) { khoa = true; S.pha = 'sai'; saiXep++; const b = o.get(loi); b.classList.remove('co'); b.classList.add('sai', 'lac'); nutK.el.disabled = true; c.noi(loi.sai || bt.sai, { mat: 'think' }); return; }
        khoa = 'xong'; S.pha = 'dung'; khung.innerHTML = '<div class="t-cap bold muted">Thứ tự Bé Nai gợi ý</div>'; const dat = saiXep <= 1;
        V.forEach((v, j) => khung.append(h('<div class="viec dung"><span class="so">' + (j + 1) + '</span><span class="nd">' + esc(v.chu) + (v.vi_sao && dat ? '<span class="vi">' + esc(v.vi_sao) + '</span>' : '') + '</span></div>')));
        if (!dat) { const th = c.than.querySelector('.tinh-huong'); if (th) th.remove(); }      // chưa đạt: nhường chỗ tình huống cho dòng báo
        c.ket(Object.assign({ giu: true, truoc: [bt.dung] }, !dat ? c.chuaDat('Xếp đúng rồi, nhưng đã kiểm sai ' + saiXep + ' lần') : {}));
      }
      const nut = c.nut([{ chu: 'Xếp lại', icon: 'refresh', ngan: true, bam: xepLai }, { chu: 'Kiểm tra', icon: 'check', chinh: true, ngan: true, bam: kiem }]), nutX = nut[0], nutK = nut[1];
      veLai(); c.noi(bt.hoi, { mat: 'think' });
    }
    if (bt.mau) buocMau(); else (xep ? buocXep : buocChon)();
  }

  const DANG = { 'that-hay-lua': b2, 'nghe-bam-dung': b6, 'cham-bat-bai': b1, 'noi-chieu': b4, 'viec-nao-truoc': b5 };

  /* ============================================================ C · THỬ THÁCH (gọi video do trang video-call.html lo) */
  function thuThach() {
    const B = BAI, T = B.thu_thach; const tk = man('thu-thach');
    const nutGoiY = T.goi_y && T.goi_y.length ? h('<button class="nut-nho">' + ic('sparkles', 's16') + 'Gợi ý</button>') : null;
    thanh('Bài ' + STT + ' · Thử thách', T.ten, bia, nutGoiY);
    const than = h('<div class="than"></div>'), chan = h('<div class="chan"></div>'); app.append(than, chan);
    const nai = taoNai(than);
    than.append(h('<div class="col gap-12 acenter jcenter" style="flex:1;min-height:0"><img class="nguoi" src="' + esc(T.anh) + '" alt=""><div class="t-h1 center">' + esc(T.nguoi) + ' đang gọi</div><div class="t-body center muted">' + esc(T.mo_ta || '') + '</div><div class="row gap-8 wrap jcenter"><span class="chip ai">' + ic('sparkles', 's14') + 'AI đóng vai</span><span class="chip warn">' + ic('award', 's14') + 'Chấm ' + T.y.length + ' ý · mỗi ý 10 điểm</span></div></div>'));
    // Máy cấm lưu (localStorage) thì trang gọi không ghi được kết quả và trang này không nhớ lượt đang gọi: nói trước là cuộc gọi chỉ để tập.
    const luuDuoc = (() => { try { const k = 'lcs-thu-luu'; localStorage.setItem(k, '1'); const ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k); return ok; } catch (e) { return false; } })();
    if (!luuDuoc) than.append(h('<div class="card warn row gap-8 top" style="padding:10px 12px;flex:none">' + ic('info', 's18 c-warn') + '<div class="t-label c-warn-ink">Máy này đang chặn lưu dữ liệu, nên cuộc gọi vẫn tập được nhưng chưa tính điểm.</div></div>'));
    if (nutGoiY) { const c = { bt: { goi_y: T.goi_y }, buocGoiY: 0, daXem: false }; nutGoiY.onclick = () => moGoiY(c); }
    datNut(chan, [{ chu: 'Nghe máy', icon: 'phone', lop: 'safe', to: true, bam: () => {
      capNhat(B.so, b => { b.goi_tu = Date.now(); });
      try { localStorage.removeItem('lcs-goi-' + T.canh); } catch (e) { }      // bỏ kết quả của cuộc gọi trước, chỉ nhận điểm của lượt này
      diChuyen('video-call.html?canh=' + encodeURIComponent(T.canh) + '&ve=' + encodeURIComponent('hoc.html?bai=' + B.so + '&sau=goi'));
    } }]);
    ve(); S.pha = 'san-sang'; nai.noi(T.mo_dau).then(() => { if (tk === luot) S.pha = 'het-loi'; });
  }

  // Về từ cuộc gọi: trang gọi ghi localStorage['lcs-goi-<cảnh>'] = {diem, tong, luc}. Không có khóa (bỏ dở) thì báo nhẹ nhàng.
  function sauGoi() {
    const B = BAI, T = B.thu_thach, t = tienDo(B.so), tong = T.y.length; let kq = null;
    // Chỉ nhận điểm khi đang có một lượt gọi chờ kết quả (đã bấm "Nghe máy") và kết quả được ghi sau lúc bấm; nhận xong là hết lượt.
    if (Number.isFinite(t.goi_tu)) {
      try {
        const r = JSON.parse(localStorage.getItem('lcs-goi-' + T.canh));
        // Đúng hợp đồng mới nhận: diem là số ý nguyên trong 0..số ý của bài, tong đúng bằng số ý của bài, luc ghi sau lúc bấm gọi.
        // Bản ghi sai kiểu, vượt tổng, thiếu luc hay cũ hơn lúc bấm thì coi như chưa có kết quả (không làm tròn, không kẹp cho vừa).
        if (laVat(r) && Number.isInteger(r.diem) && r.diem >= 0 && r.diem <= tong && r.tong === tong && Number.isFinite(r.luc) && r.luc >= t.goi_tu && r.luc <= Date.now() + 60000) kq = { diem: r.diem, tong, luc: Date.now() };
      } catch (e) { kq = null; }
      try { localStorage.removeItem('lcs-goi-' + T.canh); } catch (e) { }
    }
    capNhat(B.so, b => {
      delete b.goi_tu;
      if (kq) { const cu = b.c_tot || b.c; b.c = kq; b.c_tot = cu && cu.diem / cu.tong >= kq.diem / kq.tong ? cu : kq; }
    });
    try { history.replaceState(null, '', 'hoc.html?bai=' + B.so + '&phan=kq' + (kq ? '' : '&bo=1')); } catch (e) { }
    ketQua(kq, true);
  }

  function ketQua(kq, vuaGoi) {
    const B = BAI, T = B.thu_thach, t = tienDo(B.so), n = B.luyen.length; const tk = man('ket-qua');
    if (!kq && !vuaGoi) kq = t.c || t.c_tot || null;       // tải lại màn kết quả: hiện lượt gọi gần nhất (c); bìa và thư viện mới dùng lượt tốt nhất (c_tot)
    thanh('Bài ' + STT + ' · Thử thách', 'Kết quả', bia);
    const than = h('<div class="than"></div>'), chan = h('<div class="chan"></div>'); app.append(than, chan);
    const nai = taoNai(than), sao = soSao(t, n), du = kq && kq.diem >= kq.tong;
    than.append(h('<div class="card solid-navy r20 row gap-12" style="padding:12px 16px;flex:none"><div class="col grow gap-4"><div class="t-cap" style="color:#CBD5E1">' + esc(T.ten) + '</div><div class="diem-to">' + (kq ? kq.diem + '/' + kq.tong + ' ý · +' + kq.diem * 10 + ' điểm' : 'Chưa có điểm') + '</div></div>' + saoHtml(sao, 'vua') + '</div>'));
    than.append(h('<div class="ba-phan">' + [['Truyện', !!t.a], ['Luyện', datB(t, n)], ['Thử thách', datC(t)]].map(x => '<span class="' + (x[1] ? 'co' : '') + '">' + ic(x[1] ? 'check-circle' : 'help', 's18') + x[0] + '</span>').join('') + '</div>'));
    const nho = B.nho_mot_cau;
    if (kq && !du) than.append(h('<div class="card col gap-6" style="padding:10px 14px;flex:none"><div class="t-label bold">Coi lại các ý được chấm</div><div class="y-ds">' + T.y.map(x => '<div>' + ic('flag', 's18 c-brand') + '<span>' + esc(x) + '</span></div>').join('') + '</div></div>'));
    else than.append(h('<div class="card safe col gap-4" style="padding:12px 14px;flex:none"><div class="row gap-6">' + ic('check-circle', 's16 c-safe') + '<div class="t-over c-safe-ink">Nhớ một câu</div></div><div class="t-body bold c-safe-ink">' + esc(nho.hien || nho.chu) + '</div></div>'));
    if (B.viec_o_nha) than.append(h('<div class="card brand row gap-8 top" style="padding:10px 12px;flex:none">' + ic('home', 's18 c-brand') + '<div class="t-label c-brand-ink"><b>Việc làm ở nhà:</b> ' + esc(B.viec_o_nha) + '</div></div>'));
    datNut(chan, [{ chu: 'Gọi lại', icon: 'phone', ngan: true, bam: thuThach }, { chu: 'Về thư viện', icon: 'book', chinh: true, ngan: true, bam: () => { location.href = 'hoc.html'; } }]);
    ve(); S.pha = kq ? (du ? 'du' : 'thieu') : 'bo'; S.diem = kq ? kq.diem : null;
    nai.noi(kq ? (du ? T.ket.du : (kq.diem === 0 && T.ket.khong) || T.ket.thieu) : T.ket.bo, { mat: kq ? 'cheer' : 'think' });
  }

  /* ============================================================ KHỞI ĐỘNG */
  function loiTai(chu) {
    man('loi'); const v = vung();
    v.than.append(h('<div class="col gap-12 acenter jcenter" style="flex:1"><img src="' + MAT.think + '" width="120" height="120" style="border-radius:60px" alt=""><div class="t-h2 center">Chưa mở được bài học</div><div class="t-body center muted">' + esc(chu) + '</div></div>'));
    datNut(v.chan, [{ chu: 'Thử lại', icon: 'refresh', chinh: true, bam: () => location.reload() }]);
  }
  async function taiJson(u) { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }
  async function khoiDong() {
    try { ML = await taiJson('hoc/danh-sach.json'); DS = ML.phat_hanh.filter(b => b.mo !== false); DS.forEach((b, i) => { b.stt = i + 1; }); } catch (e) { return loiTai('Không đọc được danh sách bài. Bạn kiểm tra mạng rồi thử lại nha.'); }
    // ?kieu= nhận cả mã của kịch bản (gạch nối) lẫn mã của máy chủ (gạch dưới): chuẩn hóa rồi so với "ma_kieu" và "bi_danh" trong danh sách phát hành.
    // Giá trị này chỉ dùng để so khớp, không bao giờ chèn vào trang. Mã chưa có bài (hoặc rỗng, lạ) thì mở thư viện, không báo lỗi.
    const so = parseInt(Q.get('bai'), 10), kieu = String(Q.get('kieu') || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
    const muc = so ? DS.find(b => b.so === so) : kieu ? DS.find(b => b.ma_kieu === kieu || (Array.isArray(b.bi_danh) && b.bi_danh.indexOf(kieu) >= 0)) : null;
    if (!muc) return thuVien(so ? 'Chưa có bài học này. Bạn chọn một bài khác nha.' : '');
    try { BAI = await taiJson(muc.tep); } catch (e) { return loiTai('Không đọc được nội dung Bài ' + muc.stt + '.'); }
    STT = muc.stt;
    const cheDo = Q.get('che_do') || BAI.che_do; LG = cheDo === 'don-gian'; BAN = BAI.che_do === 'don-gian' ? 'bà' : 'bạn';      // xưng hô theo bài, không theo cỡ chữ
    S.bai = BAI.so; S.stt = STT; S.cheDo = cheDo;
    [BAI.bia].concat(BAI.truyen.map(x => x.tranh), [BAI.ngo_cut && BAI.ngo_cut.tranh, BAI.an_toan && BAI.an_toan.tranh]).filter(Boolean).forEach(x => { new Image().src = '../assets/' + x; });
    if (Q.get('sau') === 'goi') return sauGoi();
    const p = Q.get('phan');
    if (p === 'a') return truyen(0);
    if (p === 'b1') return luyen(0);
    if (p === 'b2') return luyen(Math.min(1, BAI.luyen.length - 1));
    if (p === 'c') return thuThach();
    if (p === 'kq') return ketQua(null, Q.get('bo') === '1');
    bia();
  }
  window.addEventListener('pagehide', dungTieng);
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });      // trang lấy lại từ lịch sử: dựng lại cho khỏi kẹt giữa chừng
  khoiDong();
})();
