#!/usr/bin/env python3
"""Dựng PDF thiết kế: mỗi trang một màn, có dải tên màn ở đầu trang (mã + tên dễ đọc).
Tên lấy từ <div class="shot-name"> đứng trước mỗi khung trong screens/*.html. Dùng: python3 tools/pdf-co-ten.py <out.pdf>"""
import re, sys, subprocess, pathlib, glob
root = pathlib.Path(__file__).resolve().parent.parent
names = {}
for f in sorted(glob.glob(str(root / 'screens/*.html'))):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'class="shot-name">([^<]*)</div>\s*<div class="frame[^"]*"[^>]*data-name="([^"]+)"', s):
        names[m.group(2)] = re.sub(r'\s+', ' ', m.group(1)).replace('&amp;', '&').strip()
png = root / 'export/png'; tmp = root / 'export/pdf-trang'; tmp.mkdir(exist_ok=True)
for old in tmp.glob('*.png'): old.unlink()
order = [n for g in (['D01', 'D02', 'D05', 'D03', 'D04'], ['A'], ['Z'], ['W'], ['E']) for p in g for n in sorted(x.stem for x in png.glob(p + '*.png'))]
font = '/usr/share/fonts/Adwaita/AdwaitaSans-Regular.ttf'
pages = []
for i, n in enumerate(order, 1):
    label = names.get(n, n)
    out = tmp / f'{i:02d}-{n}.png'
    w = int(subprocess.check_output(['magick', 'identify', '-format', '%w', str(png / f'{n}.png')]))
    size = 30 if w < 1000 else 40
    band = size * 3
    fit = int((w - 2 * size) / (0.56 * len(label)))   # thu nhỏ chữ nếu tên dài để không bị cắt
    size = max(18, min(size, fit))
    subprocess.run(['magick', str(png / f'{n}.png'), '-background', '#0F172A', '-gravity', 'north', '-splice', '0x' + str(band),
                    '-font', font, '-pointsize', str(size), '-fill', 'white', '-gravity', 'northwest', '-annotate', f'+24+{int((band-size)/2)}',
                    label, str(out)], check=True)
    pages.append(str(out))
subprocess.run(['magick', *pages, '-units', 'PixelsPerInch', '-density', '144', '-quality', '88', '-compress', 'jpeg', sys.argv[1]], check=True)
print(len(pages), 'trang ->', sys.argv[1], '| thiếu tên:', [n for n in order if n not in names])
