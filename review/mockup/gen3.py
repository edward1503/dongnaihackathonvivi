#!/usr/bin/env python3
"""Sinh bản V3 (gọn, 3 đối tượng): xuất mockup HTML để xem trước và mã dựng Figma.
Chạy:  python3 gen3.py   (tạo v3.html, figma_v3_console.js, figma_v3_mcp_*.js cùng thư mục)"""
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
P = {'pri': '#344D9C', 'gold': '#FFCE02', 'safe': '#1B7F3B', 'safeT': '#E8F5EC', 'warn': '#9A5B00', 'warnT': '#FFF3D6',
     'dang': '#C62828', 'dangT': '#FDE7E7', 'priT': '#E9EDF8', 'pg': '#F4F5F7', 'line': '#E6E8EC', 'ink': '#14213D',
     'ink2': '#56607A', 'w': '#FFFFFF', 'mute': '#A3ABBD', 'bd': '#CBD1DC', 'sms': '#E7EAF0', 'no': '#E9EBEF', 'ring': '#DCE2F3',
     'h0': '#344D9C', 'h1': '#5C72B5', 'h2': '#9AA8D3', 'h3': '#CDD4EA', 'h4': '#E9EDF8', 'pg2': '#CFD5E2'}
IC = {
 'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
 'phoneoff': '<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="M23 1 1 23"/>',
 'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
 'cardi': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
 'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 'book': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
 'vol': '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
 'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
 'back': '<path d="m15 18-6-6 6-6"/>', 'next': '<path d="m9 18 6-6-6-6"/>',
 'xoct': '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
 'tri': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 'shieldok': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
 'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
 'send': '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
 'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
 'pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
 'clip': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
 'grad': '<path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
 'mega': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
 'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 'wifioff': '<path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
 'check': '<path d="M20 6 9 17l-5-5"/>',
 'award': '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
 'del': '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6"/><path d="m12 9 6 6"/>',
 'msg': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 'hand': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
 'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
 'chart': '<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>',
 'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
}

# ---------- nguyên tố ----------
def B(o=None, k=None):
    return {'t': 'B', 'o': {a: b for a, b in (o or {}).items() if b is not None}, 'k': [x for x in (k or []) if x]}
def T(s, z, w='r', c='ink', **o): return {'t': 'T', 's': s, 'z': z, 'w': w, 'c': c, 'o': o}
def R(w, h, r, c='ink', **o): return {'t': 'R', 'w': w, 'h': h, 'r': r, 'c': c, 'o': o}
def I(n, z=24, c='ink', sw=2): return {'t': 'I', 'n': n, 'z': z, 'c': c, 'sw': sw, 'o': {}}
def SP(): return {'t': 'SP', 'o': {}}
def L(z): return {'t': 'L', 'z': z, 'o': {}}   # biểu trưng tỉnh Đồng Nai, cao z px

# ---------- thành phần ----------
def Cir(z, bg, ic, iz, icc, **o):
    d = dict(n='Ô biểu tượng', d='h', w=z, h=z, r=z / 2, bg=bg, ja='CENTER', aa='CENTER'); d.update(o)
    return B(d, [I(ic, iz, icc)])
def S(): return B(dict(n='Khoảng trống', fw=1, fh=1))
def Gap(w=48, h=48): return B(dict(n='Trống', w=w, h=h))
def Div(inset=20): return B(dict(n='Kẻ', d='h', p=[0, inset, 0, inset], fw=1), [R(10, 1, 0, 'line', fw=1)])
def SBar(c='ink'):
    sig = B(dict(n='Sóng', d='h', g=2, aa='MAX'), [R(3, 5, 1, c), R(3, 7, 1, c), R(3, 9, 1, c), R(3, 11, 1, c)])
    bat = B(dict(n='Pin', d='h', g=1, aa='CENTER'), [B(dict(d='h', w=26, h=13, r=4, st=c, sw=1.5, p=2.5), [R(17, 8, 2, c)]), R(2, 5, 1, c)])
    return B(dict(n='Thanh trạng thái iPhone', d='h', h=54, p=[10, 30, 0, 34], aa='CENTER', fw=1),
             [B(dict(d='h', fw=1, aa='CENTER'), [T('9:41', 17, 'b', c)]), R(118, 34, 17, '#0B0F1A'),
              B(dict(d='h', fw=1, g=6, ja='MAX', aa='CENTER'), [sig, I('wifi', 18, c, 2.6), bat])])
def IB(ic, to='BACK'):
    return B(dict(n='Nút tròn', d='h', w=48, h=48, r=24, bg='w', st='line', ja='CENTER', aa='CENTER', to=to), [I(ic, 24, 'ink')])
def Pill(t, ic=None, to=None, c='ink'):
    return B(dict(n='Viên thuốc/' + t, d='h', h=48, r=24, p=[0, 16], g=8, bg='w', st='line', aa='CENTER', ja='CENTER', to=to),
             [ic and I(ic, 22, c), T(t, 16, 's', c)])
def AB(t, left='back', right=None):
    return B(dict(n='Thanh tiêu đề', d='h', g=12, p=[6, 20, 10, 20], aa='CENTER', fw=1),
             [IB(left) if left else Gap(), T(t or ' ', 22, 'b', 'ink', fw=1, al='CENTER'), right or Gap()])
def Nghe(): return Cir(48, 'w', 'vol', 24, 'ink', st='line', n='Nút nghe')
def Btn(k, l, ic=None, to=None, h=None, op=None):
    c = 'w' if k == 'p' else 'ink'
    return B(dict(n='Nút/' + l, d='h', g=10, h=h or (62 if k == 'p' else 58), r=32, bg='pri' if k == 'p' else 'w',
                  st=None if k == 'p' else 'bd', sw=1.5, ja='CENTER', aa='CENTER', fw=1, to=to, op=op),
             [ic and I(ic, 24, c), T(l, 19, 'b', c)])
def Body(kids, **o):
    d = dict(n='Nội dung', g=14, p=[8, 20, 30, 20], fw=1, fh=1); d.update(o)
    if len(d['p']) == 4 and d['p'][2] == 20: d['p'] = [d['p'][0], d['p'][1], 30, d['p'][3]]
    return B(d, kids)
def Card(kids, **o):
    d = dict(n='Thẻ', bg='w', r=28, p=18, fw=1); d.update(o)
    return B(d, kids)
def Lbl(t, c='ink2'): return T(t, 16, 's', c)
def Group(rows):
    k = []
    for i, r in enumerate(rows):
        if i: k.append(Div())
        k.append(r)
    return Card(k, n='Nhóm dòng', p=[4, 0], g=0)
def Row(ic, t, to=None, val=None, right=None, chev=True, icc='ink'):
    return B(dict(n='Dòng/' + t, d='h', g=14, h=66, p=[0, 20], aa='CENTER', fw=1, to=to),
             [ic and I(ic, 26, icc), T(t, 19, 's', 'ink', fw=1), val and T(val, 17, 'r', 'ink2'), right, chev and I('next', 22, 'mute')])
STC = {'ok': ('priT', 'pri'), 'no': ('no', 'ink2'), 'on': ('safeT', 'safe'), 'off': ('dangT', 'dang'), 'new': ('warnT', 'warn')}
def St(t, k): return B(dict(n='Nhãn/' + t, d='h', h=34, r=17, p=[0, 14], bg=STC[k][0], aa='CENTER'), [T(t, 16, 'b', STC[k][1])])
def Sw(): return B(dict(n='Công tắc', d='h', w=56, h=32, r=16, bg='pri', p=3, ja='MAX', aa='CENTER'), [R(26, 26, 13, 'w')])
def State(icon, h, p=None, small=None):
    return B(dict(n='Trạng thái', g=12, aa='CENTER', ja='CENTER', fw=1, fh=1, p=[0, 10]),
             [icon, T(h, 26, 'b', 'ink', al='CENTER', fw=1), p and T(p, 19, 'r', 'ink2', al='CENTER', fw=1, lh=140),
              small and T(small, 16, 'r', 'ink2', al='CENTER', fw=1)])
def OkIc(): return B(dict(n='Biểu tượng xong', d='h', w=136, h=136, r=68, bg='safeT', ja='CENTER', aa='CENTER'), [Cir(112, 'safe', 'check', 56, 'w')])
NAVS = {'A': [('shieldok', 'Kiểm tra', 'A1'), ('users', 'Người thân', 'rel'), ('book', 'Bài học', 'B5'), ('user', 'Cá nhân', 'me')],
        'B': [('shieldok', 'Kiểm tra', 'B1'), ('users', 'Người thân', 'A4a'), ('book', 'Bài học', 'B5'), ('user', 'Cá nhân', 'me')],
        'C': [('chart', 'Thống kê', 'C1'), ('check', 'Duyệt', 'C4'), ('book', 'Bài học', 'B5'), ('user', 'Cá nhân', 'me')]}
def Nav(on, kind='A'):
    return B(dict(n='Thanh điều hướng', d='h', w=366, h=74, r=37, p=7, bg='w', st='line', sh=[10, 28, .14], abs=[12, 746]),
             [B(dict(n='Mục/' + t, g=2, r=30, bg='pg' if i == on else None, aa='CENTER', ja='CENTER', fw=1, fh=1, to=None if i == on else to),
                [I(ic, 24, 'ink' if i == on else 'ink2'), T(t, 16, 's', 'ink' if i == on else 'ink2')]) for i, (ic, t, to) in enumerate(NAVS[kind])])
def TopRow(ward=None):
    return B(dict(n='Đầu trang', d='h', aa='CENTER', ja='SPACE_BETWEEN', fw=1),
             [B(dict(n='Tên ứng dụng', d='h', h=48, r=24, p=[0, 16], g=8, bg='w', st='line', aa='CENTER'), [L(30), T(APP, 18, 'x')]),
              Pill(ward, 'pin', to='ward') if ward else Pill('Báo cáo', 'flag', to='B4')])
def CRow(ic, col, t, sub, time, to):
    return B(dict(n='Mục/' + t, d='h', g=14, h=76, p=[0, 18], aa='CENTER', fw=1, to=to),
             [Cir(52, col + 'T', ic, 26, col), B(dict(g=1, fw=1), [T(t, 19, 's'), T(sub, 16, 'r', 'ink2')]), T(time, 16, 'r', 'ink2') if time else None])
def PRow(initial, name, rel, call=None):
    return B(dict(n='Người thân/' + name, d='h', g=12, h=76, p=[0, 18], aa='CENTER', fw=1),
             [B(dict(n='Ảnh đại diện', d='h', w=52, h=52, r=26, bg='priT', ja='CENTER', aa='CENTER'), [T(initial, 22, 'b', 'pri')]),
              B(dict(g=1, fw=1), [T(name, 19, 's'), T(rel, 16, 'r', 'ink2')]),
              Cir(46, 'pg', 'phone', 22, 'ink', n='Nút gọi', to=call), Cir(46, 'pri', 'msg', 22, 'w', n='Nút nhắn', to='A4')])
def HRow(t, num):
    return B(dict(n='Đường dây nóng/' + num, d='h', g=14, h=70, p=[0, 18], aa='CENTER', fw=1),
             [I('phone', 26, 'ink'), T(t, 19, 's', 'ink', fw=1), B(dict(n='Nút/Gọi ' + num, d='h', h=42, r=21, p=[0, 16], bg='pri', aa='CENTER', to='call' + num), [T('Gọi ' + num, 16, 'b', 'w')])])
def Search(ph, to):
    return B(dict(n='Ô tìm kiếm', d='h', h=60, r=30, p=[0, 7, 0, 18], g=10, bg='w', st='line', aa='CENTER', fw=1, to=to),
             [I('search', 24, 'ink2'), T(ph, 18, 'r', 'ink2', fw=1), Cir(46, 'pri', 'next', 24, 'w')])
def Banner(bg, title, btn, ic, to):
    return B(dict(n='Thẻ nổi bật', d='h', g=12, p=[18, 20], r=28, bg=bg, aa='CENTER', fw=1, to=to),
             [B(dict(g=12, fw=1), [T(title, 22, 'x', 'w', lh=120), B(dict(n='Nút/' + btn, d='h', h=46, r=23, p=[0, 20], bg='w', aa='CENTER'), [T(btn, 17, 'b', bg)])]),
              B(dict(d='h', w=84, h=84, r=42, bg='w', bo=.16, ja='CENTER', aa='CENTER'), [I(ic, 42, 'w')])])
SEG = [('phone', 'Điện thoại', 'A2'), ('link', 'Đường dẫn', 'B2'), ('cardi', 'Tài khoản', 'A2t')]
def Seg(on):
    return B(dict(n='Thanh chọn', d='h', g=6, p=6, r=40, bg='w', st='line', fw=1),
             [B(dict(n='Mục/' + t, g=4, h=64, r=32, bg='pri' if i == on else None, ja='CENTER', aa='CENTER', fw=1, to=None if i == on else to),
                [I(ic, 24, 'w' if i == on else 'ink2'), T(t, 16, 's', 'w' if i == on else 'ink2')]) for i, (ic, t, to) in enumerate(SEG)])
def Key(k):
    return B(dict(n='Phím/' + (k or 'trống'), d='h', w=88, h=62, r=31, bg=None if k in ('', 'del') else 'w', ja='CENTER', aa='CENTER'),
             [I('del', 30, 'ink') if k == 'del' else (T(k, 26, 's') if k else None)])
def Pad():
    return B(dict(n='Bàn phím số', g=10, fw=1), [B(dict(d='h', ja='SPACE_BETWEEN', fw=1, p=[0, 14]), [Key(k) for k in r])
                                              for r in (('1', '2', '3'), ('4', '5', '6'), ('7', '8', '9'), ('', '0', 'del'))])
def Num(v):
    return B(dict(n='Số đang nhập', fw=1), [B(dict(h=70, ja='CENTER', aa='CENTER', fw=1), [T(v, 32, 'b', 'ink', ls=1)]), R(10, 3, 2, 'pri', fw=1)])
def Why(ic, t, k): return B(dict(n='Lý do', d='h', g=12, aa='CENTER', fw=1), [Cir(40, k + 'T', ic, 22, k), T(t, 19, 'm', 'ink', fw=1)])
def Chip(t, on): return B(dict(n='Lựa chọn/' + t, d='h', h=58, r=29, bg='pri' if on else 'w', st=None if on else 'line', ja='CENTER', aa='CENTER', fw=1), [T(t, 18, 's', 'w' if on else 'ink')])
def Chips(rows, on): return B(dict(n='Lựa chọn', g=10, fw=1), [B(dict(d='h', g=10, fw=1), [Chip(t, t == on) for t in r]) for r in rows])
def Inp(l, v, **o):
    d = dict(n='Ô nhập/' + l, g=2, p=[14, 20], r=24, bg='w', fw=1); d.update(o)
    return B(d, [T(l, 16, 'r', 'ink2'), T(v, 24, 'b')])
def Prog(n, on): return B(dict(n='Tiến độ', d='h', g=6, p=[4, 20, 0, 20], fw=1), [R(50, 6, 3, 'pri' if i < on else 'pg2', fw=1) for i in range(n)])
def Bubble(tx): return B(dict(n='Hàng tin nhắn', fw=1, p=[0, 36, 0, 0]), [B(dict(n='Tin nhắn', p=[16, 18], r=22, rr=[6, 22, 22, 22], bg='sms', fw=1), [tx])])
def Sms(t, marks=None): return Bubble(T(t, 19, 'r', 'ink', fw=1, lh=140, marks=marks or []))
def ABL(t, n): return B(dict(n='Thanh tiêu đề', d='h', g=12, p=[12, 20, 10, 20], aa='CENTER', fw=1), [IB('x'), T(t, 20, 'b', 'ink', fw=1, al='CENTER'), Pill(n)])
def Opt(t, k=None, to=None):
    col = {'ok': 'safe', 'bad': 'dang'}.get(k, 'ink')
    return B(dict(n='Đáp án/' + t, d='h', g=10, h=62, r=31, p=[0, 20], bg={'ok': 'safeT', 'bad': 'dangT'}.get(k, 'w'),
                  st={'ok': 'safe', 'bad': 'dang'}.get(k, 'line'), sw=2.5 if k else 1, aa='CENTER', fw=1, to=to),
             [k == 'ok' and I('check', 24, 'safe'), k == 'bad' and I('x', 24, 'dang'), T(t, 19, 'b' if k else 'm', col, fw=1)])
def Fb(k, h, t): return B(dict(n='Phản hồi', g=2, p=[14, 18], r=24, bg=k + 'T', fw=1), [T(h, 19, 'b', k), T(t, 17, 'r', 'ink', fw=1, lh=135)])
def Kpi(n, l, to=None): return B(dict(n='Chỉ số/' + l, g=4, p=16, r=24, bg='w', fw=1, to=to), [T(n, 34, 'x', 'pri', lh=110), T(l, 16, 'r', 'ink2')])
def Tile(t, n, l): return B(dict(n='Ô/' + t, h=84, p=10, r=14, bg='h%d' % l, ja='SPACE_BETWEEN', fw=1), [T(t, 16, 's', 'w' if l < 2 else 'ink', lh=110, fw=1), T(str(n), 22, 'x', 'w' if l < 2 else 'ink', lh=100)])
def Bar(t, n, top=False):
    return B(dict(n='Thanh/' + t, d='h', g=10, h=34, aa='CENTER', fw=1),
             [B(dict(d='h', w=162, aa='CENTER'), [T(t, 16, 'r')]), B(dict(d='h', fw=1, aa='CENTER'), [R(round(n / 42 * 100), 12, 6, 'pri' if top else 'h2')]),
              B(dict(d='h', w=30, ja='MAX', aa='CENTER'), [T(str(n), 16, 'b')])])

APP = 'An Tâm'   # tên sản phẩm; đổi ở đây là đổi trên mọi màn
PHONES = []
def Phone(key, name, kids, bg='pg', tall=False, after=None, group='0', dark=False):
    hc = '#FFFFFF' if dark else '#0B0F1A'
    home = B(dict(n='Vạch home', fw=1, aa='CENTER', p=[0, 0, 8, 0]), [R(134, 5, 3, hc)]) if tall else R(134, 5, 3, hc, abs=[128, 831])
    PHONES.append(dict(key=key, name=name, group=group, after=after,
                       tree=B(dict(n=name, w=390, h=None if tall else 844, bg=bg, clip=1, r=44), kids + [home])))

# ====================== MÀN CHUNG ======================
G = '0'
Phone('splash', '00. Màn chào', [SBar(), B(dict(n='Nội dung', g=10, p=[8, 20, 40, 20], aa='CENTER', fw=1, fh=1),
    [S(), L(210), B(dict(h=14)), T(APP, 38, 'x'), T('Kiểm tra trước khi chuyển tiền', 19, 'r', 'ink2'), S(),
     T('Sản phẩm dự thi Hackathon Đồng Nai 2026', 16, 'm', 'ink2')])], bg='w', after=['role', 1.5], group=G)
def Role(ic, t, to, on=False):
    return B(dict(n='Vai trò/' + t, d='h', g=16, h=88, p=[0, 20], r=28, bg='w', aa='CENTER', fw=1, st='pri' if on else None, sw=2.5, to=to),
             [Cir(52, 'priT', ic, 28, 'pri'), T(t, 21, 'b', 'ink', fw=1), I('next', 22, 'mute')])
Phone('role', '0. Chọn vai trò', [SBar(), Body([
    L(92), T(APP, 34, 'x'), T('Bạn là ai?', 20, 's', 'ink2'),
    Role('user', 'Người lớn tuổi', 'priv', True), Role('grad', 'Học sinh', 'B1'), Role('mega', 'Đội tình nguyện', 'C0')], p=[18, 20, 20, 20], g=14)], group=G)
Phone('priv', '0b. Quyền riêng tư', [SBar(), Body([Cir(72, 'priT', 'lock', 36, 'pri'), T('Quyền riêng tư', 28, 'x'),
    Group([Row('mic', 'Micro', right=St('Khi đọc số', 'ok'), chev=False), Row('users', 'Danh bạ', right=St('Không', 'no'), chev=False),
           Row('msg', 'Tin nhắn', right=St('Không', 'no'), chev=False), Row('phone', 'Cuộc gọi', right=St('Không', 'no'), chev=False)]),
    S(), Btn('p', 'Đồng ý', to='A1')], p=[24, 20, 20, 20])], group=G)
WARDS = ['Trấn Biên', 'Biên Hòa', 'Tam Hiệp', 'Long Bình', 'Trảng Dài', 'Hố Nai', 'Long Hưng', 'Tam Phước', 'Phước Tân']
def Radio(on): return B(dict(n='Chọn', d='h', w=26, h=26, r=13, st='pri' if on else 'mute', sw=2.5, bg='w', ja='CENTER', aa='CENTER'), [R(12, 12, 6, 'pri') if on else None])
Phone('ward', '0c. Chọn phường', [SBar(), AB('Chọn phường'), Body([Group([Row(None, w, right=Radio(i == 0), chev=False, to='BACK') for i, w in enumerate(WARDS)])])], group=G)
Phone('me', '0d. Cá nhân', [SBar(), Body([T('Cá nhân', 30, 'x'),
    Group([Row('users', 'Người thân', val='Lan', to='rel'), Row('pin', 'Phường', val='Trấn Biên', to='ward'), Row('user', 'Vai trò', val='Người lớn tuổi', to='role')]),
    Group([Row('vol', 'Tự đọc to', right=Sw(), chev=False), Row('mic', 'Micro', right=St('Đã cho phép', 'on'), chev=False), Row('lock', 'Quyền riêng tư', to='priv')])],
    p=[14, 20, 20, 20]), Nav(3, 'A')], group=G)

# ====================== A. NGƯỜI LỚN TUỔI ======================
G = 'A'
ALERT = ('pin', 'pri', 'Cảnh báo Trấn Biên', 'Mới: giả danh điện lực', '', 'C3')
Phone('A1', 'A1. Người lớn tuổi – Trang chủ', [SBar(), Body([TopRow(), Search('Số lạ, đường dẫn', 'A2'),
    Banner('dang', 'Đang bị gọi\nđòi tiền?', 'Xử lý ngay', 'phoneoff', 'A5'), Lbl('Gần đây'),
    Group([CRow(*ALERT), CRow('xoct', 'dang', '09xx xxx 123', 'Giả danh công an', '09:30', 'A3d'),
           CRow('tri', 'warn', '1903 xxxx 5678', 'Chưa ai báo cáo', 'Hôm qua', 'A3w'),
           CRow('shieldok', 'safe', '0251 3xxx 888', 'Số của phường', '20/11', 'A3s')])], p=[6, 20, 20, 20]), Nav(0, 'A')], group=G)
Phone('rel', 'A4. Người thân – Danh bạ', [SBar(), Body([T('Người thân', 30, 'x'),
    Group([PRow('L', 'Lan', 'Con gái', 'callL'), PRow('M', 'Minh', 'Cháu', 'callL'), Row('plus', 'Thêm người thân', to='A4c')]),
    Lbl('Đường dây nóng'), Group([HRow('Công an', '113'), HRow('Báo cuộc gọi rác', '156')])], p=[14, 20, 20, 20]), Nav(1, 'A')], group=G)
Phone('A2', 'A2. Kiểm tra nhanh – Số điện thoại', [SBar(), AB('Kiểm tra'), Body([Seg(0), Num('09xx xxx 123'),
    B(dict(d='h', g=12, fw=1), [Btn('s', 'Dán', 'clip', h=54), Btn('s', 'Đọc số', 'mic', to='A7a', h=54)]), Pad(), S(), Btn('p', 'Kiểm tra', 'search', to='A2a')])], group=G)
Phone('A2t', 'A2. Kiểm tra nhanh – Số tài khoản', [SBar(), AB('Kiểm tra'), Body([Seg(2), Num('1903 xxxx 5678'),
    Btn('s', 'Dán', 'clip', h=54), Pad(), S(), Btn('p', 'Kiểm tra', 'search', to='A2b')])], group=G)
Phone('A2a', 'A2a. Kiểm tra nhanh – Đang kiểm tra', [SBar(), AB('Kiểm tra'), Body([State(SP(), 'Đang kiểm tra…', '09xx xxx 123')])], after=['A3d', 1.2], group=G)
Phone('A2b', 'A2b. Kiểm tra nhanh – Mất mạng', [SBar(), AB('Kiểm tra'), Body([State(Cir(112, 'warnT', 'wifioff', 56, 'warn'), 'Mất mạng', 'Đừng chuyển tiền.'), Btn('p', 'Thử lại', to='A3w')])], group=G)
def Res(key, name, k, title, ic, what, head, whys, b1, b2):
    sheet = B(dict(n='Tấm trắng', g=14, p=[24, 20, 22, 20], bg='w', rr=[30, 30, 0, 0], fw=1, fh=1),
              [T(head, 23, 'b', 'ink', fw=1, lh=125)] + [Why(a, b, k) for a, b in whys] + [S(), Btn('p', b1[1], b1[0], to=b1[2], h=60), Btn('s', b2[1], b2[0], to=b2[2], h=56)])
    Phone(key, name, [SBar(), AB('Kết quả', right=Nghe()),
        B(dict(n='Mức', g=12, aa='CENTER', p=[14, 20, 30, 20], fw=1),
          [B(dict(n='Biểu tượng mức', d='h', w=148, h=148, r=74, bg='w', bo=.55, ja='CENTER', aa='CENTER'), [Cir(120, k, ic, 64, 'w')]),
           T(title, 36, 'x', k, ls=.5), B(dict(n='Thứ đã kiểm tra', d='h', h=44, r=22, p=[0, 20], bg='w', aa='CENTER'), [T(what, 19, 's')])]), sheet], bg=k + 'T', group=G)
Res('A3d', 'A3. Kết quả kiểm tra – Nguy hiểm', 'dang', 'NGUY HIỂM', 'xoct', '09xx xxx 123', 'Đừng chuyển tiền!',
    [('user', 'Giả danh công an'), ('flag', '12 người đã báo cáo')], ('users', 'Hỏi người thân', 'A4'), ('flag', 'Báo cáo', 'B4'))
Res('A3w', 'A3. Kết quả kiểm tra – Nghi ngờ', 'warn', 'NGHI NGỜ', 'tri', '1903 xxxx 5678', 'Hỏi người thân trước đã.',
    [('clock', 'Chưa ai báo cáo'), ('search', 'Không có trong danh bạ')], ('users', 'Hỏi người thân', 'A4'), ('flag', 'Báo cáo', 'B4'))
Res('A3s', 'A3. Kết quả kiểm tra – An toàn', 'safe', 'AN TOÀN', 'shieldok', '0251 3xxx 888', 'Số chính thức của phường.',
    [('flag', 'Chưa ai báo cáo'), ('tri', 'Tổng đài thật không đòi tiền')], ('search', 'Kiểm tra số khác', 'A2'), ('users', 'Hỏi người thân', 'A4'))
Phone('A4', 'A4. Hỏi người thân', [SBar(), AB('Hỏi người thân'), Body([
    Card([B(dict(n='Ảnh đại diện', d='h', w=64, h=64, r=32, bg='priT', ja='CENTER', aa='CENTER'), [T('L', 26, 'b', 'pri')]),
          B(dict(g=1, fw=1), [T('Lan', 22, 'b'), T('Con gái', 17, 'r', 'ink2')]), B(dict(n='Đổi', to='A4c'), [T('Đổi', 17, 's', 'pri')])], n='Người thân', d='h', g=14, aa='CENTER'),
    B(dict(n='Hàng bong bóng', fw=1, p=[6, 0, 0, 36]), [B(dict(n='Bong bóng', p=[16, 18], r=22, rr=[22, 22, 6, 22], bg='pri', fw=1),
        [T('Lan ơi, số 09xx xxx 123 gọi mẹ đòi tiền. Có phải lừa đảo không con?', 20, 'r', 'w', fw=1, lh=140)])]),
    S(), Btn('p', 'Gửi cho Lan', 'send', to='A4b'), Btn('s', 'Gọi điện', 'phone', to='callL')])], group=G)
Phone('A4a', 'A4a. Hỏi người thân – Chưa có người thân', [SBar(), AB('Hỏi người thân'), Body([State(Cir(112, 'priT', 'users', 56, 'pri'), 'Chưa có người thân'), Btn('p', 'Chọn người thân', to='A4c')])], group=G)
Phone('A4b', 'A4b. Hỏi người thân – Chờ trả lời', [SBar(), AB('Hỏi người thân', left='x'), Body([State(Cir(112, 'priT', 'clock', 56, 'pri'), 'Chờ Lan trả lời', 'Đừng chuyển tiền.'), Btn('p', 'Gọi điện', 'phone', to='callL'), Btn('s', 'Về trang chủ', to='A1')])], group=G)
Phone('A4c', 'A4c. Hỏi người thân – Thêm người thân', [SBar(), AB('Người thân'), Body([Inp('Tên', 'Lan'), Inp('Số điện thoại', '09xx xxx 889'), Chips([['Con', 'Cháu'], ['Vợ / chồng', 'Khác']], 'Con'), S(), Btn('p', 'Lưu', to='A4')])], group=G)
def Step(n, t, ic):
    return B(dict(n='Bước/' + t, d='h', g=16, h=84, p=[0, 20], r=28, bg='w', aa='CENTER', fw=1),
             [B(dict(d='h', w=46, h=46, r=23, bg='dang', ja='CENTER', aa='CENTER'), [T(str(n), 22, 'x', 'w')]), T(t, 23, 'b', 'ink', fw=1), I(ic, 28, 'dang')])
Phone('A5', 'A5. Khẩn cấp – Đang bị gọi đòi tiền', [SBar(), AB('', left='x'), Body([T('Bình tĩnh.\nĐừng chuyển tiền.', 30, 'x', 'dang', lh=120, fw=1),
    Step(1, 'Dừng lại', 'hand'), Step(2, 'Cúp máy', 'phoneoff'), Step(3, 'Gọi người thân', 'users'), S(), Btn('p', 'Gọi cho Lan', 'phone', to='callL'), Btn('s', 'Kể lại cuộc gọi', to='A6')], g=16)], bg='dangT', group=G)
def YN(t, on): return B(dict(n='Nút/' + t, d='h', w=70, h=54, r=27, bg='pri' if on else 'pg', ja='CENTER', aa='CENTER'), [T(t, 18, 'b', 'w' if on else 'ink')])
def Q(t, y): return B(dict(n='Câu hỏi', d='h', g=10, h=82, p=[0, 14, 0, 20], r=28, bg='w', aa='CENTER', fw=1), [T(t, 19, 'b', 'ink', fw=1, lh=125), B(dict(d='h', g=8), [YN('Có', y), YN('Không', not y)])])
Phone('A6', 'A6. Sau cuộc gọi lạ – Trả lời 4 câu', [SBar(), AB('Cuộc gọi lạ'), Body([Q('Xưng công an?', 1), Q('Đòi tiền, OTP?', 1), Q('Giục làm ngay?', 1), Q('Dặn giữ bí mật?', 0), S(), Btn('p', 'Xem kết quả', to='A3d')])], group=G)
Phone('A7a', 'A7a. Giọng nói – Xin quyền micro', [SBar(), AB('Đọc số'), Body([State(Cir(112, 'priT', 'mic', 56, 'pri'), 'Cho dùng micro?', 'Chỉ dùng để đọc số.'), Btn('p', 'Cho phép', to='A7'), Btn('s', 'Để sau', to='A7b')])], group=G)
def Wave(): return B(dict(n='Sóng âm', d='h', g=5, h=64, aa='CENTER', ja='CENTER'), [R(6, h, 3, 'pri') for h in (14, 30, 48, 22, 56, 36, 18, 44, 60, 28, 40, 16, 52, 34, 20, 46, 26, 12)])
Phone('A7', 'A7. Giọng nói – Đọc số', [SBar(), AB('Đọc số'), Body([B(dict(n='Đang nghe', g=10, aa='CENTER', ja='CENTER', fw=1, fh=1),
    [Wave(), T('09xx xxx 123', 32, 'b'), B(dict(n='Nút micro', d='h', w=132, h=132, r=66, bg='ring', ja='CENTER', aa='CENTER'), [Cir(104, 'pri', 'mic', 48, 'w')]), T('Giữ để đọc', 19, 's')]),
    Btn('p', 'Kiểm tra', 'search', to='A2a')])], group=G)
Phone('A7b', 'A7b. Giọng nói – Chưa có quyền micro', [SBar(), AB('Đọc số'), Body([State(Cir(112, 'warnT', 'mic', 56, 'warn'), 'Chưa có quyền micro'), Btn('p', 'Nhập bằng bàn phím', to='A2'), Btn('s', 'Cho phép lại', to='A7a')])], group=G)

# ====================== B. HỌC SINH ======================
G = 'B'
Phone('B1', 'B1. Học sinh – Trang chủ', [SBar(), Body([TopRow(), Search('Dán tin nhắn, đường dẫn', 'B2'),
    Banner('pri', 'Thử tài nhận diện\nlừa đảo', 'Làm 5 câu', 'award', 'B7a'), Lbl('Gần đây'),
    Group([CRow(*ALERT), CRow('msg', 'dang', 'Tin tuyển việc', 'Bắt nộp tiền trước', '10:12', 'B3'),
           CRow('link', 'warn', 'qua-tang.example', 'Chưa ai báo cáo', 'Hôm qua', 'A3w')])], p=[6, 20, 20, 20]), Nav(0, 'B')], group=G)
MSG = 'Tuyển cộng tác viên chốt đơn. Nộp 500.000đ, nhận 650.000đ sau 5 phút. Đăng ký: viec-nhe.example'
Phone('B2', 'B2. Kiểm tra nhanh – Tin nhắn, đường dẫn', [SBar(), AB('Kiểm tra'), Body([Seg(1),
    B(dict(n='Ô dán', h=190, p=18, r=24, bg='w', st='pri', sw=2.5, fw=1), [T(MSG, 19, 'r', 'ink', fw=1, lh=140)]),
    Btn('s', 'Dán', 'clip', h=54), S(), Btn('p', 'Kiểm tra', 'search', to='B3')])], group=G)
Phone('B3', 'B3. AI phân tích tin nhắn', [SBar(), AB('Tin nhắn lạ', right=Nghe()), Body([Sms(MSG, ['Nộp 500.000đ', '650.000đ sau 5 phút', 'viec-nhe.example']),
    B(dict(n='Mức', d='h', g=14, p=[14, 16], r=28, bg='dangT', aa='CENTER', fw=1), [Cir(52, 'dang', 'xoct', 24, 'w'), B(dict(g=0), [T('NGUY HIỂM', 23, 'x', 'dang', lh=115), T('3 dấu hiệu', 17, 'r')])]),
    Why('cardi', 'Bắt nộp tiền trước', 'dang'), Why('clock', 'Hứa lãi cao, nhanh', 'dang'), Why('link', 'Đường dẫn lạ', 'dang'),
    S(), Btn('p', 'Báo cáo', 'flag', to='B4', h=60), Btn('s', 'Xem bài học', 'book', to='B6a', h=56)])], group=G)
TYPES = [['Giả công an', 'Nhận quà'], ['Tuyển việc', 'Giả người thân'], ['Giả ngân hàng', 'Khác']]
def AnD(): return Pill('Ẩn danh', 'lock')
Phone('B4', 'B4. Báo cáo', [SBar(), AB('Báo cáo', right=AnD()), Body([Chips(TYPES, 'Tuyển việc'), Inp('Số hoặc đường dẫn', 'viec-nhe.example'), S(), Btn('p', 'Gửi báo cáo', 'send', to='B4b')])], group=G)
Phone('B4a', 'B4a. Báo cáo – Thiếu thông tin', [SBar(), AB('Báo cáo', right=AnD()), Body([Chips(TYPES, 'Tuyển việc'), Inp('Số hoặc đường dẫn', ' ', st='dang', sw=2.5), T('Nhập số hoặc đường dẫn.', 17, 's', 'dang'), S(), Btn('p', 'Gửi báo cáo', 'send', to='B4b')])], group=G)
Phone('B4b', 'B4b. Báo cáo – Đã gửi', [SBar(), AB('Báo cáo', left='x'), Body([State(OkIc(), 'Đã gửi!', 'Đội tình nguyện Trấn Biên đã nhận.', 'Dự kiến chuyển Công an (mô phỏng)'), Btn('p', 'Về trang chủ', to='B1')])], group=G)
Phone('B5', 'B5. Bài học – Danh sách', [SBar(), Body([T('Bài học 1 phút', 30, 'x'),
    Group([Row('user', 'Giả danh công an', to='B6a'), Row('msg', 'Việc nhẹ lương cao', to='B6a'), Row('link', 'Đường dẫn nhận quà', to='B6a')]),
    Btn('p', 'Làm bài kiểm tra', 'award', to='B7a')], p=[14, 20, 20, 20]), Nav(2, 'B')], group=G)
Phone('B6a', 'B6. Bài học 1 phút – Thẻ 1', [SBar(), Prog(4, 1), ABL('Việc nhẹ lương cao', '1/4'), Body([Sms('Tuyển cộng tác viên chốt đơn. Bấm thích video, nhận 300.000đ/ngày!'), T('Có gì đáng ngờ?', 26, 'b'), S(), Btn('p', 'Xem dấu hiệu', to='B6b')])], group=G)
Phone('B6b', 'B6. Bài học 1 phút – Thẻ 2', [SBar(), Prog(4, 2), ABL('Việc nhẹ lương cao', '2/4'), Body([T('2 dấu hiệu', 26, 'b'), Why('clock', 'Việc dễ, tiền cao bất thường', 'dang'), Why('cardi', 'Bắt nộp tiền trước', 'dang'), S(), Btn('p', 'Nên làm gì?', to='B7a')])], group=G)
def QZ(key, name, a, b, c, fb, dim=False, links=False):
    Phone(key, name, [SBar(), Prog(5, 1), ABL('Bài kiểm tra', '1/5'), Body([Sms('Nộp 500.000đ, nhận ngay 650.000đ sau 5 phút.'), T('Bạn làm gì?', 26, 'b'),
        Opt('Chuyển thử 500.000đ', a, to='B7c' if links else None), Opt('Dừng lại và báo cáo', b, to='B7b' if links else None), Opt('Mượn tiền nạp thêm', c), fb, S(),
        Btn('p', 'Câu tiếp', to=None if dim else 'B8', op=.4 if dim else None)])], group=G)
QZ('B7a', 'B7. Bài kiểm tra – Chưa trả lời', None, None, None, None, dim=True, links=True)
QZ('B7b', 'B7. Bài kiểm tra – Trả lời đúng', None, 'ok', None, Fb('safe', 'Đúng rồi!', 'Lãi nhỏ trước, khóa tài khoản sau.'))
QZ('B7c', 'B7a. Bài kiểm tra – Chọn sai', 'bad', None, None, Fb('dang', 'Chưa đúng!', 'Chuyển là mất. Hãy dừng lại.'))
Phone('B8', 'B8. Kết quả bài kiểm tra', [SBar(), AB('Kết quả', left='x'), Body([Card([Cir(112, 'gold', 'award', 56, 'ink'), T('4/5', 72, 'x', 'pri', lh=100), T('Rất tốt!', 24, 'b'),
    B(dict(n='Huy hiệu', d='h', h=34, r=17, p=[0, 14], bg='priT', aa='CENTER'), [T('Hiệp sĩ ' + APP, 16, 'b', 'pri')])], n='Điểm', g=12, p=[34, 18], aa='CENTER'),
    S(), Btn('p', 'Học lại', 'book', to='B5'), Btn('s', 'Trang chủ', to='B1')])], group=G)

# ====================== C. ĐỘI TÌNH NGUYỆN ======================
G = 'C'
def Code(v, err=False, to=None):
    return B(dict(n='Mã đang nhập', fw=1, g=8, aa='CENTER', to=to), [B(dict(h=70, ja='CENTER', aa='CENTER', fw=1), [T(v, 34, 'b', 'dang' if err else 'ink', ls=6)]), R(10, 3, 2, 'dang' if err else 'pri', fw=1),
                                                         T('Mã chưa đúng.', 17, 's', 'dang') if err else None])
Phone('C0', 'C0. Đội tình nguyện – Nhập mã đội', [SBar(), AB('Mã đội'), Body([T('Nhập mã do phường cấp', 19, 'r', 'ink2', fw=1, al='CENTER'), Code('482 •••', to='C0a'), Pad(), S(), Btn('p', 'Vào', to='C1')])], group=G)
Phone('C0a', 'C0a. Đội tình nguyện – Sai mã đội', [SBar(), AB('Mã đội'), Body([T('Nhập mã do phường cấp', 19, 'r', 'ink2', fw=1, al='CENTER'), Code('482 915', True), Pad(), S(), Btn('p', 'Thử lại', to='C0')])], group=G)
Phone('C1', 'C1. Đội tình nguyện – Trang chủ', [SBar(), Body([TopRow('Biên Hòa'),
    B(dict(d='h', g=12, fw=1), [Kpi('120', 'lượt báo cáo', 'C2'), Kpi('35%', 'đường dẫn giả', 'C2')]),
    Lbl('Mới tuần này'), Group([CRow('tri', 'warn', 'Giả danh điện lực', '9 lượt · 3 phường', 'Mới', 'C3'),
                                 CRow('link', 'pri', 'Đường dẫn nhận quà', '42 lượt trong tháng', '', 'C2')]),
    Group([Row('chart', 'Điểm nóng theo phường', to='C2'), Row('flag', 'Ghi nhận báo cáo', to='B4a')])],
    p=[6, 20, 20, 20]), Nav(0, 'C')], group=G)
WD = [[('Trấn Biên', 28, 0), ('Long Bình', 24, 0), ('Tam Hiệp', 18, 1)], [('Trảng Dài', 16, 1), ('Hố Nai', 12, 2), ('Biên Hòa', 10, 2)], [('Long Hưng', 5, 3), ('Tam Phước', 4, 4), ('Phước Tân', 3, 4)]]
Phone('C2', 'C2. Thống kê – Điểm nóng và kiểu lừa đảo', [SBar(), AB('Thống kê'), Body([B(dict(n='Đổi khu vực', to='C2a'), [Lbl('Tháng 11/2026 · Biên Hòa')]),
    Card([T('Điểm nóng', 19, 'b'), B(dict(n='Bản đồ ô', g=8, fw=1), [B(dict(d='h', g=8, fw=1), [Tile(*a) for a in r]) for r in WD]),
          B(dict(n='Chú giải', d='h', g=6, aa='CENTER'), [T('Ít', 16, 'r', 'ink2')] + [R(26, 10, 5, 'h%d' % i) for i in (4, 3, 2, 1, 0)] + [T('Nhiều', 16, 'r', 'ink2')])], n='Điểm nóng', g=12),
    Card([T('Kiểu lừa đảo', 19, 'b'), B(dict(n='Biểu đồ', fw=1), [Bar('Đường dẫn giả', 42, True), Bar('Giả danh công an', 22), Bar('Tuyển cộng tác viên', 18), Bar('Giả ngân hàng', 14), Bar('Người thân gặp nạn', 12), Bar('Kiểu khác', 12)])], n='Kiểu lừa đảo', g=12),
    Btn('p', 'Chia sẻ cảnh báo', 'send', to='C5')], fh=None)], tall=True, group=G)
Phone('C2a', 'C2a. Thống kê – Chưa có dữ liệu', [SBar(), AB('Thống kê'), Body([Lbl('Tháng 11/2026 · Phước Tân'), State(Cir(112, 'priT', 'chart', 56, 'pri'), 'Chưa có báo cáo'), Btn('p', 'Ghi nhận báo cáo', 'flag', to='B4')])], group=G)
Phone('C3', 'C3. Kiểu lừa đảo mới – Chi tiết', [SBar(), AB('Kiểu mới'), Body([T('Giả danh điện lực', 26, 'x'),
    B(dict(d='h', g=12, fw=1), [Kpi('9', 'lượt tuần này'), Kpi('3', 'phường')]),
    Sms('Điện lực báo nợ cước. Thanh toán tại dien-luc.example để không bị cắt điện.', ['dien-luc.example', 'cắt điện']),
    Why('clock', 'Dọa cắt điện', 'dang'), Why('link', 'Đường dẫn lạ', 'dang'), S(), Btn('p', 'Chia sẻ cảnh báo', 'send', to='C5')])], group=G)

def Rep(kind, meta, val):
    return Card([B(dict(d='h', g=10, aa='CENTER', fw=1), [St(kind, 'ok'), T(meta, 16, 'r', 'ink2')]), T(val, 22, 'b'),
                 B(dict(d='h', g=10, fw=1), [Btn('s', 'Bỏ', h=52, to='C4a'), Btn('p', 'Xác nhận', 'check', h=52, to='C4a')])], n='Báo cáo chờ duyệt', g=12)
Phone('C4', 'C4. Duyệt báo cáo', [SBar(), AB('Duyệt báo cáo'), Body([Rep('Giả công an', 'Trấn Biên · 3 lượt', '09xx xxx 777'), Rep('Đường dẫn', 'Long Bình · 5 lượt', 'qua-tri-an.example'),
    Rep('Tuyển việc', 'Tam Hiệp · 2 lượt', '1903 xxxx 5678')])], group=G)
Phone('C4a', 'C4a. Duyệt báo cáo – Đã duyệt hết', [SBar(), AB('Duyệt báo cáo'), Body([State(OkIc(), 'Đã duyệt hết'), Btn('p', 'Về trang chủ', to='C1')])], group=G)

def CallScr(key, name, who, sub):
    Phone(key, name, [SBar('w'), B(dict(n='Nội dung', g=8, p=[70, 20, 44, 20], aa='CENTER', fw=1, fh=1),
        [B(dict(n='Ảnh đại diện', d='h', w=120, h=120, r=60, bg='#2A3350', ja='CENTER', aa='CENTER'), [I('phone', 52, 'w')]),
         B(dict(h=12)), T(who, 32, 'b', 'w'), T(sub, 19, 'r', '#B8C0D4'), T('Đang gọi…', 19, 'r', '#B8C0D4'), S(),
         B(dict(n='Nút/Kết thúc', d='h', w=76, h=76, r=38, bg='dang', ja='CENTER', aa='CENTER', to='BACK'), [I('phoneoff', 34, 'w')]),
         B(dict(h=8)), T('Trình gọi điện của máy (mô phỏng)', 16, 'r', '#B8C0D4')])], bg='#111827', group='A', dark=True)
CallScr('callL', 'A8. Gọi điện – Người thân (mô phỏng)', 'Lan', 'Con gái · 09xx xxx 889')
CallScr('call113', 'A8. Gọi điện – Công an 113 (mô phỏng)', 'Công an', '113')
CallScr('call156', 'A8. Gọi điện – Tổng đài 156 (mô phỏng)', 'Báo cuộc gọi rác', '156')
Phone('C5', 'C5. Chia sẻ cảnh báo – Xem trước', [SBar(), AB('Chia sẻ'), Body([Lbl('Nội dung gửi vào nhóm'),
    B(dict(n='Hàng bong bóng', fw=1, p=[0, 0, 0, 36]), [B(dict(n='Bong bóng', p=[16, 18], r=22, rr=[22, 22, 6, 22], bg='pri', fw=1),
        [T('Cảnh báo Trấn Biên: có tin giả danh điện lực gửi đường dẫn thu tiền. Đừng bấm, đừng chuyển tiền.', 19, 'r', 'w', fw=1, lh=140)])]),
    S(), Btn('p', 'Gửi vào nhóm', 'send', to='C1')])], group='C')

GROUPS = [('0', 'Chung cho cả 3 đối tượng'), ('A', 'A. Người lớn tuổi: nhận cuộc gọi lạ'), ('B', 'B. Học sinh: nhận tin "việc nhẹ lương cao"'), ('C', 'C. Đội tình nguyện: thống kê và tuyên truyền')]

# ---------- vị trí trên trang Figma ----------
def positions():
    pos, labels, y = {}, [], 0
    for g, title in GROUPS:
        ph = [p for p in PHONES if p['group'] == g]
        labels.append(dict(text=title, x=0, y=y))
        y += 110
        for i, p in enumerate(ph):
            pos[p['key']] = [(i % 9) * 450, y + (i // 9) * 1000]
        rows = (len(ph) + 8) // 9
        y += rows * 1000 + (420 if any(p['tree']['o'].get('h') is None for p in ph) else 160)
    return pos, labels

def links():
    out = []
    def walk(n, key, path):
        to = n['o'].get('to') if n['t'] == 'B' else None
        if to: out.append([key, path, to])
        for i, c in enumerate(n.get('k', [])): walk(c, key, path + [i])
    for p in PHONES: walk(p['tree'], p['key'], [])
    return out

# ====================== XUẤT HTML ======================
WT = {'r': 400, 'm': 500, 's': 600, 'b': 700, 'x': 800}
JA = {'MIN': 'flex-start', 'CENTER': 'center', 'MAX': 'flex-end', 'SPACE_BETWEEN': 'space-between'}
def col(c): return P.get(c, c)
def rgba(c, a):
    h = col(c); return 'rgba(%d,%d,%d,%s)' % (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)
def emit(n, pd):
    o = n['o']; st = ['flex-shrink:0']
    if o.get('fw'): st.append('align-self:stretch' if pd == 'v' else 'flex:1 1 0;min-width:0')
    if o.get('fh'): st.append('flex:1 1 0;min-height:0' if pd == 'v' else 'align-self:stretch')
    if n['t'] == 'T':
        s = html.escape(n['s'])
        for m in o.get('marks', []):
            s = s.replace(html.escape(m), '<b style="color:%s;text-decoration:underline">%s</b>' % (P['warn'], html.escape(m)))
        st += ['font-size:%spx' % n['z'], 'font-weight:%d' % WT[n['w']], 'color:' + col(n['c']), 'line-height:%s%%' % o.get('lh', 130),
               'white-space:' + ('pre-wrap' if o.get('fw') else 'pre')]
        if o.get('al'): st.append('text-align:' + o['al'].lower())
        if o.get('ls'): st.append('letter-spacing:%spx' % o['ls'])
        return '<div style="%s">%s</div>' % (';'.join(st), s)
    if n['t'] == 'R':
        st += ['height:%spx' % n['h'], 'border-radius:%spx' % n['r'], 'background:' + col(n['c'])]
        if not o.get('fw'): st.append('width:%spx' % n['w'])
        if o.get('abs'): st += ['position:absolute', 'left:%spx' % o['abs'][0], 'top:%spx' % o['abs'][1]]
        return '<div style="%s"></div>' % ';'.join(st)
    if n['t'] == 'I':
        return '<svg style="flex-shrink:0" width="%s" height="%s" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (n['z'], n['z'], col(n['c']), n['sw'], IC[n['n']])
    if n['t'] == 'L':
        return '<img src="logo-dong-nai.svg" alt="Biểu trưng tỉnh Đồng Nai" style="flex-shrink:0;height:%spx;width:auto">' % n['z']
    if n['t'] == 'SP':
        return '<div style="flex-shrink:0;width:84px;height:84px;border-radius:50%%;border:9px solid %s;border-top-color:%s;box-sizing:border-box"></div>' % (P['ring'], P['pri'])
    d = 'h' if o.get('d') == 'h' else 'v'
    p = o.get('p', 0); p = p if isinstance(p, list) else [p] * 4
    if len(p) == 2: p = [p[0], p[1], p[0], p[1]]
    st += ['display:flex', 'flex-direction:' + ('row' if d == 'h' else 'column'), 'gap:%spx' % o.get('g', 0), 'padding:%spx %spx %spx %spx' % tuple(p),
           'justify-content:' + JA[o.get('ja', 'MIN')], 'align-items:' + JA[o.get('aa', 'MIN')], 'box-sizing:border-box', 'position:relative']
    if o.get('bg'): st.append('background:' + rgba(o['bg'], o.get('bo', 1)))
    if 'rr' in o: st.append('border-radius:%spx %spx %spx %spx' % tuple(o['rr']))
    elif 'r' in o: st.append('border-radius:%spx' % o['r'])
    sh = []
    if o.get('st'): sh.append('inset 0 0 0 %spx %s' % (o.get('sw', 1), col(o['st'])))
    if o.get('sh'): sh.append('0 %spx %spx rgba(20,33,61,%s)' % tuple(o['sh']))
    if sh: st.append('box-shadow:' + ','.join(sh))
    if 'w' in o: st.append('width:%spx' % o['w'])
    if 'h' in o: st.append('height:%spx' % o['h'])
    if o.get('clip'): st.append('overflow:hidden')
    if o.get('abs'): st += ['position:absolute', 'left:%spx' % o['abs'][0], 'top:%spx' % o['abs'][1]]
    if o.get('op'): st.append('opacity:%s' % o['op'])
    return '<div style="%s">%s</div>' % (';'.join(st), ''.join(emit(c, d) for c in n['k']))

def write_html():
    parts = []
    for g, title in GROUPS:
        parts.append('<h2>%s</h2><div class="board">' % html.escape(title))
        for p in PHONES:
            if p['group'] == g:
                parts.append('<figure><figcaption>%s</figcaption>%s</figure>' % (html.escape(p['name']), emit(p['tree'], 'v')))
        parts.append('</div>')
    doc = '''<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>An Tâm (Đề 4 – Lá chắn số) – V3</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>body{font-family:"Be Vietnam Pro",system-ui,sans-serif;background:#DDE1E9;margin:0;padding:28px;color:#14213D}
h1{font-size:24px;margin:0 0 4px}h2{font-size:20px;margin:34px 0 14px}p{margin:0;color:#56607A}
.board{display:flex;flex-wrap:wrap;gap:36px 34px;align-items:flex-start}figure{margin:0}figcaption{font-size:14px;font-weight:700;margin-bottom:8px;max-width:390px}
figure>div{box-shadow:0 8px 24px rgba(20,33,61,.14)}</style></head><body>
<h1>An Tâm – bài dự thi Đề 4 “Lá chắn số” (V3: gọn, chia theo 3 đối tượng)</h1><p>%d màn. Dữ liệu trong hình là giả lập.</p>%s</body></html>''' % (len(PHONES), ''.join(parts))
    open(os.path.join(HERE, 'v3.html'), 'w', encoding='utf-8').write(doc)

# ====================== XUẤT MÃ FIGMA ======================
LIB = r'''
const hx=h=>{h=P[h]||h;return{r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}};
const sol=(h,o)=>[{type:'SOLID',color:hx(h),opacity:o==null?1:o}];
const FW={r:'Regular',m:'Medium',s:'SemiBold',b:'Bold',x:'ExtraBold'};
for(const k in FW)await figma.loadFontAsync({family:'Be Vietnam Pro',style:FW[k]});
function fit(k,o){if(o.fw){if(k.type==='TEXT')k.textAutoResize='HEIGHT';k.layoutSizingHorizontal='FILL';}
 if(o.fh)k.layoutSizingVertical='FILL';
 if(o.abs){k.layoutPositioning='ABSOLUTE';k.x=o.abs[0];k.y=o.abs[1];}}
function build(n){const o=n.o||{};
 if(n.t==='T'){const t=figma.createText();t.fontName={family:'Be Vietnam Pro',style:FW[n.w]};t.characters=n.s;t.fontSize=n.z;t.fills=sol(n.c);t.lineHeight={unit:'PERCENT',value:o.lh||130};
  if(o.al)t.textAlignHorizontal=o.al;if(o.ls)t.letterSpacing={unit:'PIXELS',value:o.ls};
  for(const m of (o.marks||[])){const i=n.s.indexOf(m);if(i<0)continue;t.setRangeFontName(i,i+m.length,{family:'Be Vietnam Pro',style:'Bold'});t.setRangeFills(i,i+m.length,sol('warn'));t.setRangeTextDecoration(i,i+m.length,'UNDERLINE');}
  return t;}
 if(n.t==='R'){const x=figma.createRectangle();x.resize(n.w,n.h);x.cornerRadius=n.r;x.fills=sol(n.c);return x;}
 if(n.t==='I'){const f=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="'+n.z+'" height="'+n.z+'" viewBox="0 0 24 24" fill="none" stroke="'+(P[n.c]||n.c)+'" stroke-width="'+n.sw+'" stroke-linecap="round" stroke-linejoin="round">'+IC[n.n]+'</svg>');f.name='icon/'+n.n;return f;}
 if(n.t==='L'){let g=null;try{if(LOGO){g=figma.createNodeFromSvg(LOGO);g.rescale(n.z/g.height);g.name='Biểu trưng Đồng Nai';}}catch(e){g=null;}
  if(!g){g=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="'+n.z+'" height="'+n.z+'" viewBox="0 0 24 24" fill="none" stroke="'+P.pri+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.shieldok+'</svg>');g.name='Biểu trưng (tạm)';}
  return g;}
 if(n.t==='SP'){const f=figma.createFrame();f.resize(84,84);f.fills=[];f.name='Vòng xoay';const a=figma.createEllipse();a.resize(84,84);a.fills=sol('ring');a.arcData={startingAngle:0,endingAngle:6.2832,innerRadius:.79};const b=figma.createEllipse();b.resize(84,84);b.fills=sol('pri');b.arcData={startingAngle:-1.5708,endingAngle:0,innerRadius:.79};f.appendChild(a);f.appendChild(b);return f;}
 const H=o.d==='h';const f=figma.createFrame();f.layoutMode=H?'HORIZONTAL':'VERTICAL';f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='AUTO';
 f.name=o.n||'Khối';f.itemSpacing=o.g||0;
 let p=o.p==null?[0,0,0,0]:(Array.isArray(o.p)?o.p:[o.p,o.p,o.p,o.p]);if(p.length==2)p=[p[0],p[1],p[0],p[1]];
 f.paddingTop=p[0];f.paddingRight=p[1];f.paddingBottom=p[2];f.paddingLeft=p[3];
 f.fills=o.bg?sol(o.bg,o.bo):[];
 if(o.rr){f.topLeftRadius=o.rr[0];f.topRightRadius=o.rr[1];f.bottomRightRadius=o.rr[2];f.bottomLeftRadius=o.rr[3];}else if(o.r!=null)f.cornerRadius=o.r;
 if(o.st){f.strokes=sol(o.st);f.strokeWeight=o.sw||1;f.strokeAlign='INSIDE';}
 f.primaryAxisAlignItems=o.ja||'MIN';f.counterAxisAlignItems=o.aa||'MIN';
 if(o.sh)f.effects=[{type:'DROP_SHADOW',color:{r:.08,g:.13,b:.24,a:o.sh[2]},offset:{x:0,y:o.sh[0]},radius:o.sh[1],spread:0,visible:true,blendMode:'NORMAL'}];
 f.clipsContent=!!o.clip;if(o.op)f.opacity=o.op;
 for(const kn of (n.k||[])){const c=build(kn);f.appendChild(c);fit(c,kn.o||{});}
 if(o.w!=null||o.h!=null){f.resize(o.w!=null?o.w:Math.max(1,f.width),o.h!=null?o.h:Math.max(1,f.height));
  f.primaryAxisSizingMode=(H?o.w:o.h)!=null?'FIXED':'AUTO';f.counterAxisSizingMode=(H?o.h:o.w)!=null?'FIXED':'AUTO';}
 return f;}
'''
WIRE = r'''
const frames={};for(const f of page.children){if(f.type==='FRAME')frames[f.name]=f;}
const miss=PH.filter(p=>!frames[p.name]).map(p=>p.name);if(miss.length)return {error:'thiếu khung',miss};
const byKey={};for(const p of PH)byKey[p.key]=frames[p.name];
let wired=0;
for(const l of LINKS){let n=byKey[l[0]];for(const i of l[1])n=n.children[i];
 const act=l[2]==='BACK'?{type:'BACK'}:{type:'NODE',destinationId:byKey[l[2]].id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:false};
 await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[act]}]);wired++;}
for(const p of PH){if(p.after)await byKey[p.key].setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:p.after[1]},actions:[{type:'NODE',destinationId:byKey[p.after[0]].id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:false}]}]);}
page.flowStartingPoints=[{nodeId:byKey.splash.id,name:'Luồng chính'},{nodeId:byKey.A1.id,name:'A. Người lớn tuổi'},{nodeId:byKey.B1.id,name:'B. Học sinh'},{nodeId:byKey.C1.id,name:'C. Đội tình nguyện'}];
'''
PAGE = "V3 – Gọn, 3 đối tượng"
def js(x): return json.dumps(x, ensure_ascii=False, separators=(',', ':'))
LOGO_SVG = open(os.path.join(HERE, 'logo-dong-nai.svg'), encoding='utf-8').read()
LOGO_SVG = LOGO_SVG[LOGO_SVG.index('<svg'):]
def head(logo=False): return 'const P=%s;\nconst IC=%s;\nconst LOGO=%s;\n' % (js(P), js(IC), js(LOGO_SVG) if logo else 'null')
def page_get(create):
    s = "let page=figma.root.children.find(p=>p.name===%s);\n" % js(PAGE)
    if create: s += "if(!page){page=figma.createPage();page.name=%s;}\n" % js(PAGE)
    return s + "if(figma.setCurrentPageAsync)await figma.setCurrentPageAsync(page);else figma.currentPage=page;\n"
def build_block(phones, pos, labels):
    s = 'const DATA=%s;\nconst POS=%s;\nconst LABELS=%s;\n' % (js([dict(key=p['key'], name=p['name'], tree=p['tree']) for p in phones]), js({p['key']: pos[p['key']] for p in phones}), js(labels))
    s += "const made=[];\nfor(const L of LABELS){const t=figma.createText();t.fontName={family:'Be Vietnam Pro',style:'ExtraBold'};t.characters=L.text;t.fontSize=48;t.fills=sol('ink');t.x=L.x;t.y=L.y;page.appendChild(t);}\n"
    s += "for(const d of DATA){const f=build(d.tree);page.appendChild(f);f.x=POS[d.key][0];f.y=POS[d.key][1];made.push(d.name);}\n"
    return s
def wire_block():
    return 'const PH=%s;\nconst LINKS=%s;\n' % (js([dict(key=p['key'], name=p['name'], after=p['after']) for p in PHONES]), js(links())) + WIRE

def write_figma():
    pos, labels = positions()
    # 1) Bản dán vào bảng điều khiển (console) của trình duyệt: một lần chạy
    body = head(True) + page_get(True) + "for(const c of [...page.children])c.remove();\n" + LIB + build_block(PHONES, pos, labels) + wire_block() + "return {khung:made.length,lienKet:wired};\n"
    con = "(async()=>{\n" + body + "})().then(r=>console.log('XONG',r)).catch(e=>console.error('LỖI',e));\n"
    open(os.path.join(HERE, 'figma_v3_console.js'), 'w', encoding='utf-8').write(con)
    # 2) Bản chia nhỏ cho công cụ use_figma (mỗi phần dưới 50.000 ký tự)
    parts, cur = [], []
    for p in PHONES:
        test = head() + page_get(True) + LIB + build_block(cur + [p], pos, [])
        if cur and len(test) > 46000:
            parts.append(cur); cur = [p]
        else: cur.append(p)
    if cur: parts.append(cur)
    files = []
    for i, ph in enumerate(parts):
        code = head() + page_get(True) + (("for(const c of [...page.children])c.remove();\n") if i == 0 else '') + LIB + build_block(ph, pos, labels if i == 0 else []) + "return {made};\n"
        fn = 'figma_v3_mcp_%d.js' % (i + 1); open(os.path.join(HERE, fn), 'w', encoding='utf-8').write(code); files.append((fn, len(code)))
    code = "const P=%s;\n" % js(P) + page_get(False) + wire_block() + "return {wired};\n"
    fn = 'figma_v3_mcp_%d_noi_prototype.js' % (len(parts) + 1); open(os.path.join(HERE, fn), 'w', encoding='utf-8').write(code); files.append((fn, len(code)))
    return len(con), files

if __name__ == '__main__':
    write_html()
    n, files = write_figma()
    ks = {p['key'] for p in PHONES}
    bad = [l for l in links() if l[2] != 'BACK' and l[2] not in ks]
    print(len(PHONES), 'màn;', len(links()), 'liên kết; console.js', n, 'ký tự; liên kết sai:', bad)
    adj = {p['key']: set() for p in PHONES}
    for k, _, to in links():
        if to != 'BACK': adj[k].add(to)
    for p in PHONES:
        if p['after']: adj[p['key']].add(p['after'][0])
    seen, todo = {'splash'}, ['splash']
    while todo:
        for t in adj[todo.pop()]:
            if t not in seen: seen.add(t); todo.append(t)
    print('không tới được từ màn chào:', [p['name'] for p in PHONES if p['key'] not in seen])
    dead = []
    def walk(nd, key):
        if nd['t'] == 'B':
            nm = nd['o'].get('n', '')
            if nm.startswith('Nút/') and not nd['o'].get('to') and nd['o'].get('op') is None: dead.append(key + ':' + nm[4:])
            for c in nd['k']: walk(c, key)
    for p in PHONES: walk(p['tree'], p['key'])
    print('nút chưa nối:', dead)
