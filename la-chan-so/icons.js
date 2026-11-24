/* Bộ icon nét (24x24, stroke 2). Dùng: <i class="ic" data-i="shield"></i>
   Màu icon lấy theo thuộc tính CSS `color` của phần tử cha. */
const ICONS = {
  'shield': '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/>',
  'shield-check': '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  'shield-alert': '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M12 8v4"/><path d="M12 15.5v.5"/>',
  'shield-off': '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M4 4l16 16"/>',
  'phone': '<path d="M6.6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z"/>',
  'phone-in': '<path d="M6.6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z"/><path d="M21 3l-6 6"/><path d="M15 4v5h5"/>',
  'phone-off': '<path d="M3 15c5-5 13-5 18 0l-2 2.5-3.5-1.5v-2.5a9 9 0 0 0-7 0V16L5 17.5 3 15z"/>',
  'message': '<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
  'message-alert': '<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M12 8v4"/><path d="M12 14.5v.5"/>',
  'link': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  'card': '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
  'bank': '<path d="M3 10l9-6 9 6"/><path d="M5 10v8"/><path d="M9.5 10v8"/><path d="M14.5 10v8"/><path d="M19 10v8"/><path d="M3 20h18"/>',
  'alert': '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4"/><path d="M12 17v.5"/>',
  'alert-oct': '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5z"/><path d="M12 8v5"/><path d="M12 16v.5"/>',
  'ban': '<circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/>',
  'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  'x': '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
  'help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8"/><path d="M12 17v.5"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.5"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.8c2.4.8 4 2.9 4 6.2"/>',
  'heart-hand': '<path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.6 12 20 12 20z"/>',
  'flag': '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4 2.5 4H5"/>',
  'book': '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M8 7h7"/><path d="M8 11h5"/>',
  'award': '<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>',
  'home': '<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-5h4v5"/>',
  'search': '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  'mic': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  'volume': '<path d="M4 9.5h3l5-4v13l-5-4H4v-5z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>',
  'play': '<path d="M8 5l11 7-11 7V5z"/>',
  'pause': '<path d="M8 5v14"/><path d="M16 5v14"/>',
  'chev-right': '<path d="M9 5l7 7-7 7"/>',
  'chev-left': '<path d="M15 5l-7 7 7 7"/>',
  'chev-down': '<path d="M5 9l7 7 7-7"/>',
  'arrow-left': '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  'arrow-right': '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17L17 7"/><path d="M9 7h8v8"/>',
  'trend-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'sparkles': '<path d="M11 4l1.8 5.2L18 11l-5.2 1.8L11 18l-1.8-5.2L4 11l5.2-1.8L11 4z"/><path d="M18.5 3v4"/><path d="M16.5 5h4"/><path d="M19 17v3"/><path d="M17.5 18.5h3"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  'eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><path d="M4 4l16 16"/>',
  'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 21h4"/>',
  'settings': '<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/>',
  'chart': '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/>',
  'list': '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.5"/><path d="M4.5 12h.5"/><path d="M4.5 18h.5"/>',
  'inbox': '<path d="M3 13l3-8h12l3 8v6H3v-6z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  'megaphone': '<path d="M4 10v4h3l8 4V6l-8 4H4z"/><path d="M18 9.5a3.5 3.5 0 0 1 0 5"/><path d="M7 14v5h3"/>',
  'clipboard': '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 3h6v4H9z"/><path d="M9 12h6"/><path d="M9 16h4"/>',
  'share': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6"/><path d="M8.2 13.2l7.6 4.6"/>',
  'image': '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  'file-audio': '<path d="M6 3h8l4 4v14H6V3z"/><path d="M14 3v4h4"/><path d="M9 14v2"/><path d="M12 12v6"/><path d="M15 14v2"/>',
  'wave': '<path d="M3 12h2"/><path d="M7 8v8"/><path d="M11 5v14"/><path d="M15 9v6"/><path d="M19 11v2"/>',
  'battery': '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10.5v3"/><path d="M5 10v4"/><path d="M8 10v4"/><path d="M11 10v4"/><path d="M14 10v4"/>',
  'battery-low': '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10.5v3"/><path d="M5 10v4"/>',
  'signal': '<path d="M4 19v-3"/><path d="M9 19v-7"/><path d="M14 19V8"/><path d="M19 19V4"/>',
  'wifi': '<path d="M3 9a13 13 0 0 1 18 0"/><path d="M6.5 12.5a8 8 0 0 1 11 0"/><path d="M10 16a3 3 0 0 1 4 0"/><path d="M12 19.5v.5"/>',
  'wifi-off': '<path d="M3 9a13 13 0 0 1 18 0"/><path d="M6.5 12.5a8 8 0 0 1 11 0"/><path d="M12 19.5v.5"/><path d="M4 4l16 16"/>',
  'more': '<path d="M5 12h.5"/><path d="M12 12h.5"/><path d="M19 12h.5"/>',
  'filter': '<path d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/>',
  'download': '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  'send': '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7z"/>',
  'qr': '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2z"/><path d="M19 14v6"/><path d="M14 19.5h2"/>',
  'hand': '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 10V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10V6a1.5 1.5 0 0 1 3 0v8"/><path d="M8 11.5L6.5 10A1.6 1.6 0 0 0 4 12l3.5 6A6 6 0 0 0 12.6 21H13a6 6 0 0 0 6-6v-4.5a1.5 1.5 0 0 0-2-1.4"/>',
  'zap': '<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
  'calendar': '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  'star': '<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5L12 16.6l-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 4z"/>',
  'refresh': '<path d="M20 11a8 8 0 0 0-14.6-4.2L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.6 4.2L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  'map-off': '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6z"/>',
  'gift': '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3z"/><path d="M12 7v13"/><path d="M12 7c-1.5-3-5-3.5-5-1.5S9 7 12 7z"/><path d="M12 7c1.5-3 5-3.5 5-1.5S15 7 12 7z"/>',
  'briefcase': '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3"/><path d="M3 13h18"/>',
  'ambulance': '<path d="M3 8h11v9H3z"/><path d="M14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M8.5 10.5v4"/><path d="M6.5 12.5h4"/>',
  'smartphone': '<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M11 18h2"/>',
  'layers': '<path d="M12 4l9 5-9 5-9-5 9-5z"/><path d="M3 14l9 5 9-5"/>',
  'power': '<path d="M12 4v8"/><path d="M7 7a7 7 0 1 0 10 0"/>',
  'pencil': '<path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M14 7l3 3"/>',
  'trash': '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  'folder': '<path d="M3 6h7l2 3h9v10H3V6z"/>',
  'box': '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8z"/><path d="M4 8l8 4 8-4"/><path d="M12 12v8"/>',
  'history': '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4.5l3 1.5"/>'
};
function paintIcons(root){
  (root||document).querySelectorAll('i.ic[data-i]').forEach(el=>{
    const d = ICONS[el.dataset.i];
    if(!d){ el.title='thiếu icon: '+el.dataset.i; el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/></svg>'; return; }
    const filled = el.classList.contains('fill');
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="'+(filled?'currentColor':'none')+'" stroke="currentColor" stroke-width="'+(el.dataset.w||2)+'" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>paintIcons()); else paintIcons();

/* Chế độ prototype: mở màn với ?frame=<data-name> để chỉ hiện một khung và nạp lớp chuyển động.
   Bản xuất SVG/PNG không dùng tham số này nên không bị ảnh hưởng. */
(function(){
  const name=new URLSearchParams(location.search).get('frame'); if(!name) return;
  document.documentElement.classList.add('proto');
  document.documentElement.style.visibility='hidden';
  const l=document.createElement('link'); l.rel='stylesheet'; l.href='../motion.css'; document.head.appendChild(l);
  const s=document.createElement('script'); s.src='../motion.js'; document.head.appendChild(s);
  setTimeout(()=>{document.documentElement.style.visibility='';},1500); // phòng khi motion.js không nạp được
})();
