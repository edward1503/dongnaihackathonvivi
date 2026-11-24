/* Lá chắn số · dữ liệu giả lập cho prototype (chạy trong từng màn khi mở bằng ?frame=).
   Không gọi mạng, không lưu gì ngoài địa chỉ trang. */
(function (g) {
  const norm = s => (s || '').toLowerCase().normalize('NFC').trim();
  const digits = s => (s || '').replace(/\D/g, '');

  // Danh sách đã duyệt (giả lập)
  const DANGER_NUM = ['0912345678', '02899991234', '0934567890', '0987111222'];
  const OFFICIAL_NUM = ['1900555588', '113', '1900545454'];
  const DANGER_LINK = ['qua-tri-an.top', 'ngan-hang-xacminh.top', 'bit.ly/viec-nhe-xyz', 'viec-nhe-xyz'];
  const SUSPECT_TLD = ['.top', '.xyz', '.click', '.info', '.icu', '.cyou'];
  const OFFICIAL_LINK = ['dichvucong.gov.vn', 'chinhphu.vn'];
  const SCAM_WORDS = ['nạp', 'việc nhẹ', 'hoa hồng', 'trúng thưởng', 'chuyển khoản', 'khóa trong 24h', 'xác minh ngay', 'mã otp', 'đóng phí', 'tạm giữ'];

  g.LCS_SAMPLES = {
    number: [['Số bị báo lừa đảo', '0912 345 678'], ['Đường dẫn lạ', 'qua-tri-an-khach-hang.top'], ['Tổng đài thật', '1900 5555 88'], ['Số chưa ai báo', '0987 654 321']],
    message: 'Chào em, bên chị tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày. Chỉ cần nạp trước 200k để kích hoạt, hoàn tiền kèm hoa hồng 20%. Đăng ký trong hôm nay tại bit.ly/viec-nhe-xyz'
  };

  // Trả về khung kết quả cho một giá trị người dùng nhập
  g.LCS_LOOKUP = function (raw, kind) {
    const v = norm(raw);
    if (!v) return { to: null, toast: 'Bạn nhập số, đường dẫn hoặc dán tin nhắn trước nhé' };
    if (kind === 'message' || (v.split(/\s+/).length > 4)) {
      if (SCAM_WORDS.some(w => v.includes(w))) return { to: 'A05b-phan-tich-tin-nhan' };
      return { to: 'E01d-ai-chua-du-thong-tin' };
    }
    const isLink = /[a-z]/.test(v) && v.includes('.') && !/\s/.test(v);
    if (isLink) {
      const host = v.replace(/^https?:\/\//, '');
      if (OFFICIAL_LINK.some(d => host === d || host.endsWith('.' + d))) return { to: 'A07c-ket-qua-an-toan', v: raw };
      if (DANGER_LINK.some(d => host.includes(d))) return { to: 'A07b-ket-qua-nghi-ngo', v: raw };
      if (SUSPECT_TLD.some(t => host.split('/')[0].endsWith(t))) return { to: 'A07b-ket-qua-nghi-ngo', v: raw };
      return { to: 'A07d-ket-qua-chua-co-du-lieu', v: raw };
    }
    const d = digits(v);
    if (d.length < 3) return { to: null, toast: 'Số này ngắn quá, bạn kiểm tra lại nhé' };
    if (DANGER_NUM.includes(d)) return { to: 'A07a-ket-qua-nguy-hiem', v: raw };
    if (OFFICIAL_NUM.includes(d)) return { to: 'A07c-ket-qua-an-toan', v: raw };
    return { to: 'A07d-ket-qua-chua-co-du-lieu', v: raw };
  };

  // Gắn ô nhập thật và mẫu nhanh vào màn kiểm tra; điền giá trị vừa kiểm tra vào màn kết quả
  g.LCS_MOCK_SETUP = function (f, name, params) {
    const css = document.createElement('style');
    css.textContent = '.lcs-in{all:unset;flex:1;min-width:0;font:inherit;color:var(--ink);font-size:16px;line-height:24px}' +
      '.lcs-ta{all:unset;display:block;width:100%;min-height:120px;font:inherit;color:var(--ink);font-size:15px;line-height:22px;white-space:pre-wrap}' +
      '.lcs-in::placeholder,.lcs-ta::placeholder{color:#94A3B8}' +
      '.lcs-samples{display:flex;flex-wrap:wrap;gap:6px}.lcs-samples span{height:30px;border-radius:15px;padding:0 10px;display:inline-flex;align-items:center;font-size:12px;font-weight:600;background:#EEF2FF;color:#1E3A8A;cursor:pointer}' +
      '.lcs-samples b{font-weight:700;margin-right:4px;color:#475569}';
    document.head.appendChild(css);
    const api = {};
    const editable = name.startsWith('A09a-') ? '.input > .grow' : name.startsWith('W03-') ? '.input' : null;
    if (editable) f.querySelectorAll(editable).forEach(field => {
      field.contentEditable = 'plaintext-only';
      field.setAttribute('role', 'textbox');
      field.setAttribute('aria-label', field.closest('.input').previousElementSibling.textContent);
    });
    if (name === 'A06a-kiem-tra-so') {
      const box = f.querySelector('.input'); if (!box) return api;
      const leaf = [...box.querySelectorAll('div,span')].find(e => e.children.length === 0 && /\d|\./.test(e.textContent));
      const inp = document.createElement('input'); inp.className = 'lcs-in'; inp.placeholder = 'Nhập số, đường dẫn, tài khoản'; inp.inputMode = 'text';
      if (leaf) leaf.replaceWith(inp); else box.appendChild(inp);
      const row = document.createElement('div'); row.className = 'lcs-samples';
      row.innerHTML = '<b>Thử nhanh:</b>' + g.LCS_SAMPLES.number.map(s => '<span data-v="' + s[1] + '" title="' + s[0] + '">' + s[1] + '</span>').join('');
      box.insertAdjacentElement('afterend', row);
      row.addEventListener('click', e => { const s = e.target.closest('[data-v]'); if (s) { inp.value = s.dataset.v; inp.focus(); e.stopPropagation(); } });
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); api.submit && api.submit(); } e.stopPropagation(); });
      api.value = () => inp.value; api.kind = 'number'; api.fill = v => { inp.value = v; inp.focus(); };
      const sample = params.get('v');
      if (sample) {
        inp.value = sample;
        const tab = sample.includes('.') ? 'Đường dẫn' : 'Tài khoản';
        f.querySelectorAll('.seg-item').forEach(el => el.classList.toggle('active', el.textContent.trim() === tab));
      }
      if (!params.has('flow')) setTimeout(() => inp.focus({ preventScroll: true }), 300);
    }
    if (name === 'A06b-kiem-tra-tin-nhan') {
      const box = f.querySelector('.input.area') || f.querySelector('.input'); if (!box) return api;
      const ta = document.createElement('textarea'); ta.className = 'lcs-ta'; ta.placeholder = 'Dán tin nhắn đáng ngờ vào đây';
      box.innerHTML = ''; box.appendChild(ta);
      ta.addEventListener('click', e => e.stopPropagation()); ta.addEventListener('keydown', e => e.stopPropagation());
      api.value = () => ta.value; api.kind = 'message'; api.fill = v => { ta.value = v; ta.focus(); };
      api.paste = () => api.fill(g.LCS_SAMPLES.message);
    }
    // Màn kết quả: thay giá trị mẫu bằng giá trị vừa kiểm tra
    const v = params.get('v');
    if (v && /^A07/.test(name)) {
      const row = f.querySelector('.card.row');
      const leaf = row && [...row.querySelectorAll('div')].find(e => e.children.length === 0 && e.textContent.trim().length > 3);
      if (leaf) leaf.textContent = v;
      // Nhãn, icon và câu kết luận phải khớp loại dữ liệu vừa nhập (số điện thoại, đường dẫn, tài khoản)
      const d = v.replace(/\D/g, '');
      const T = /[a-z]/i.test(v) && /[.\/]/.test(v) ? ['Đường dẫn', 'link', 'đường dẫn này']
        : /^(0\d{9}|84\d{9}|1[89]00\d{4,6})$/.test(d) ? ['Số điện thoại', 'phone', 'số này']
        : ['Số tài khoản', 'card', 'tài khoản này'];
      const cap = row && row.querySelector('.t-cap'); if (cap) cap.textContent = T[0];
      const ic = row && row.querySelector('i.ic[data-i]');
      if (ic && ic.getAttribute('data-i') !== T[1]) { ic.setAttribute('data-i', T[1]); ic.innerHTML = ''; const pi = (f.ownerDocument && f.ownerDocument.defaultView && f.ownerDocument.defaultView.paintIcons) || g.paintIcons; if (typeof pi === 'function') pi(row); }
      f.querySelectorAll('.nw').forEach(e => { if (/^Chưa ai báo cáo .+ này\.$/.test(e.textContent.trim())) e.textContent = 'Chưa ai báo cáo ' + T[2] + '.'; });
    }
    return api;
  };
})(window);
