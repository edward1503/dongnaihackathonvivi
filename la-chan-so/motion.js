/* Lớp chuyển động của prototype. Chỉ chạy khi màn được mở với ?frame=<data-name>. */
(function () {
  const name = new URLSearchParams(location.search).get('frame');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function run() {
    const f = document.querySelector('.frame[data-name="' + name + '"]') || document.querySelector('.frame');
    if (!f) return;
    f.closest('.shot').classList.add('on');

    // 1. Nội dung xuất hiện lần lượt từ trên xuống
    let items = [...f.querySelectorAll(':scope > .content > *, :scope > .main > *, :scope > .sidebar > *')];
    if (!items.length) items = [...f.children].filter(e => !e.matches('.statusbar,.gesture,.bottomnav,.float-card,.notif,.scrim,.sheet,.appbar'));
    // web: tách thêm một cấp các lưới thẻ để thẻ hiện lần lượt
    items = items.flatMap(e => e.matches('.grid-2,.grid-3,.grid-4') ? [...e.children] : [e]);
    items.forEach((e, i) => { e.style.setProperty('--i', i); e.classList.add('m-in'); });

    // 2. Chỉ số cho các nhóm chạy theo thứ tự
    f.querySelectorAll('.hl').forEach((e, i) => e.style.setProperty('--h', i));
    f.querySelectorAll('.panel').forEach((e, i) => e.style.setProperty('--p', i));
    f.querySelectorAll('.bar-fill,.progress-bar').forEach((e, i) => e.style.setProperty('--b', i));

    // 3. Khoảnh khắc riêng
    const leafWith = t => [...f.querySelectorAll('div,span')].find(e => e.children.length === 0 && e.textContent.trim().startsWith(t));
    const stop = leafWith('DỪNG LẠI'); if (stop) stop.classList.add('m-slam');
    const wait = leafWith('Đang chờ trả lời'); if (wait) wait.classList.add('m-wait');
    const listen = leafWith('Đang nghe bà nói'); if (listen) listen.parentElement.classList.add('m-wait');
    const reply = leafWith('Mẹ đừng chuyển! Con gọi mẹ ngay'); if (reply && !reply.closest('.bubble')) reply.classList.add('m-big');

    if (!reduce) {
      // 4. Web: số đếm lên, đường biểu đồ vẽ dần
      f.querySelectorAll('.t-num').forEach(el => {
        const raw = el.textContent.trim(); const m = raw.match(/^(\D*)([\d.]+)(\D*)$/);
        if (!m || !f.classList.contains('web')) return;
        const target = parseInt(m[2].replace(/\./g, ''), 10); if (!isFinite(target)) return;
        const dotted = m[2].includes('.'); const t0 = performance.now() + 350, dur = 900;
        const fmt = v => dotted ? v.toLocaleString('vi-VN') : String(v);
        el.textContent = m[1] + fmt(0) + m[3];
        (function tick(now) {
          const p = Math.min(1, Math.max(0, (now - t0) / dur)); const e = 1 - Math.pow(1 - p, 3);
          el.textContent = m[1] + fmt(Math.round(target * e)) + m[3];
          if (p < 1) requestAnimationFrame(tick); else el.textContent = raw;
        })(performance.now());
      });
      f.querySelectorAll('svg polyline, svg path').forEach(el => {
        if (el.closest('.ic') || !el.getTotalLength) return;
        const cs = getComputedStyle(el); if (cs.stroke === 'none' || cs.fill !== 'none') return;
        const len = el.getTotalLength(); if (len < 80) return;
        el.style.strokeDasharray = len;
        el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1300, delay: 600, easing: 'cubic-bezier(.2,0,0,1)', fill: 'both' });
      });
    }

    // 5. Báo kích thước cho trang prototype và chuyển tiếp thao tác
    document.documentElement.classList.add('go');   // bắt đầu mọi chuyển động từ thời điểm này
    document.documentElement.style.visibility = '';
    if (window.parent !== window) await protoClicks(f, name);
    const r = f.getBoundingClientRect();
    parent.postMessage({ lcs: 'ready', name, w: Math.round(r.width), h: Math.round(r.height) }, '*');
  }


  /* ---------- Chỗ bấm của prototype (chỉ khi màn nằm trong khung prototype) ---------- */
  const CLICKABLE = '.btn,.card,.list-item,.chip,.seg-item,.nav-item,.side-item,.call-act,.pl,.ib,.bubble,.panel,.tick-row,.check-row,a';
  const nrm = e => e.textContent.normalize('NFC').replace(/\s+/g, ' ').trim();
  function loadScript(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); }); }
  async function protoClicks(f, name) {
    document.querySelectorAll('.shot:not(.on)').forEach(shot => shot.remove());
    const params = new URLSearchParams(location.search);
    const st = document.createElement('style');
    st.textContent = '.hs{cursor:pointer}.hs:hover{filter:brightness(.97)}.hs:active{transform:scale(.97)}' +
      '.lcs-flash .hs{outline:2px solid rgba(29,78,216,.55);outline-offset:2px;border-radius:12px}' +
      '.lcs-on{background:var(--brand)!important;border-color:var(--brand)!important}' +
      '.lcs-unchecked{background:var(--surface-2);outline:1px solid var(--outline)}';
    document.head.appendChild(st);
    const post = m => parent.postMessage(Object.assign({ lcs: 'go' }, m), '*');
    await Promise.all([loadScript('../prototype/hotspots.js'), loadScript('../prototype/mock-data.js')]);
    const rules = (window.LCS_HOTSPOTS || {})[name] || [];
    const mock = window.LCS_MOCK_SETUP?.(f, name, params) || {};
    mock.submit = () => act(rules.find(r => r.to === '@lookup'));
    const all = [...f.querySelectorAll(CLICKABLE)].filter(e => !e.closest('.lcs-samples'));
    function bind(el, r) {
      if (el._rule) return;
      el._rule = r;
      el.classList.add('hs');
      if (!el.matches('a,button')) { el.tabIndex = 0; el.setAttribute('role', 'button'); }
      if (r.sel && !nrm(el)) el.setAttribute('aria-label', r.t);
    }
    for (const r of rules) {
      if (r.t === '*') continue;
      if (r.sel) { f.querySelectorAll(r.sel).forEach(el => bind(el, r)); continue; }
      const exact = all.find(e => !e._rule && nrm(e) === r.t);
      const matches = all.filter(e => !e._rule && nrm(e).startsWith(r.t));
      const leaves = [...f.querySelectorAll('div,span,b,a')].filter(e => !e._rule && nrm(e).startsWith(r.t));
      const el = exact || matches.find(e => !matches.some(m => m !== e && e.contains(m)))
        || leaves.find(e => ![...e.children].some(c => nrm(c).startsWith(r.t)));
      if (el) bind(el, r);
    }
    const story = all.find(el => el._rule?.toast === '@story');
    if (story) {
      story.classList.toggle('on', !params.has('flow'));
      story.setAttribute('aria-pressed', !params.has('flow'));
    }
    const bar = ':is(.appbar, .hd, .chat-head)';
    f.querySelectorAll(bar + ' > :is([data-i=arrow-left], [data-i=x])').forEach(el =>
      bind(el, { sel: true, t: 'Quay lại', to: name.startsWith('A11') && !/^A11[ab]-/.test(name) ? '@learn' : '@back' }));
    f.querySelectorAll(bar + ' > [data-i=volume]').forEach(el =>
      bind(el, { sel: true, t: 'Đọc to', toast: '@speak' }));
    const ask = all.find(el => el._rule?.toast === '@ask');
    function showAsk(on) {
      const toggle = ask.lastElementChild;
      toggle.style.background = on ? 'var(--brand)' : 'var(--ink-3)';
      toggle.style.justifyContent = on ? 'flex-end' : 'flex-start';
      ask.setAttribute('aria-pressed', on);
    }
    if (ask) {
      showAsk(params.get('ask') !== '0');
      addEventListener('message', e => { if (e.source === parent && e.data?.lcs === 'ask') showAsk(e.data.on); });
    }
    function act(r, el) {
      if (!r) return;
      const tt = r.toast || '';
      if (r.to === '@lookup') {
        const res = window.LCS_LOOKUP ? window.LCS_LOOKUP(mock.value ? mock.value() : '', mock.kind) : {};
        if (res.to) post({ to: res.to, v: res.v, toast: res.toast }); else post({ to: null, toast: res.toast });
        return;
      }
      if (tt.startsWith('@fill:')) {
        const [v, msg] = tt.slice(6).split('|');
        mock.fill?.(v);
        if (el.matches('.seg-item')) {
          for (const opt of el.parentElement.children) opt.classList.toggle('active', opt === el);
        }
        if (msg) post({toast: msg});
        return;
      }
      if (tt === '@edit') { f.querySelector('[contenteditable]').focus(); return; }
      if (tt === '@paste') { if (mock.paste) mock.paste(); return; }
      if (tt === '@speak') { post({ to: null, speak: true }); return; }
      if (tt === '@ask') { post({ ask: true }); return; }
      if (tt === '@story') {
        const on = el.classList.toggle('on');
        el.setAttribute('aria-pressed', on);
        post({story: on});
        return;
      }
      if (tt === '@captions') {
        f.querySelector('.cc').style.visibility = el.classList.toggle('on') ? '' : 'hidden';
        return;
      }
      if (tt === '@pick') {
        for (const option of el.parentElement.children) {
          if (el.matches('.seg-item')) option.classList.toggle('active', option === el);
          else {
            option.classList.toggle('solid-brand', option === el);
            option.classList.toggle('outline', option !== el);
          }
        }
        return;
      }
      if (tt === '@check') {
        const box = el.querySelector('.tick,.check-box,.none.bg-brand,.none.lcs-unchecked');
        if (!box) return;
        if (box.classList.contains('tick') || box.classList.contains('check-box')) box.classList.toggle('lcs-on');
        else {
          const checked = box.classList.toggle('bg-brand');
          box.classList.toggle('lcs-unchecked', !checked);
          box.firstElementChild.hidden = !checked;
          box.firstElementChild.style.visibility = checked ? '' : 'hidden';
        }
        return;
      }
      post({ to: r.to || null, v: r.v, toast: tt.startsWith('@') ? '' : tt, say: r.say || null });
    }
    document.addEventListener('click', e => {
      const el = e.target.closest('.hs');
      if (el && el._rule) {
        e.preventDefault(); act(el._rule, el); return;
      }
      if (e.target.closest('input,textarea,[contenteditable],.lcs-samples')) return;
      const star = rules.find(r => r.t === '*');
      if (star && f.contains(e.target)) { act(star); return; }
      f.classList.add('lcs-flash'); setTimeout(() => f.classList.remove('lcs-flash'), 900);
      parent.postMessage({ lcs: 'next' }, '*');
    }, true);
    addEventListener('keydown', e => {
      if (e.defaultPrevented) return;
      const el = e.target.closest('.hs');
      if (el && !el.matches('a,button') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault(); el.click(); return;
      }
      if (e.target.closest('input,textarea,[contenteditable]')) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        parent.postMessage({ lcs: 'key', key: e.key }, '*');
      }
    });
  }

  const start = () => (document.fonts && document.fonts.ready ? document.fonts.ready.then(run) : run());
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
