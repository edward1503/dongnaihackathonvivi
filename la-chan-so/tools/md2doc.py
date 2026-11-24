# Chuyển thuyet-minh.md (cú pháp đơn giản) sang HTML để LibreOffice đổi thành .docx
import re, html, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`(.+?)`', r'<span style="font-family:Consolas,monospace">\1</span>', s)
    return s
out, i = [], 0
while i < len(src):
    ln = src[i]
    if not ln.strip(): i += 1; continue
    if ln.startswith('# '): out.append(f'<h1>{inline(ln[2:])}</h1>'); i += 1; continue
    if ln.startswith('## '): out.append(f'<h2>{inline(ln[3:])}</h2>'); i += 1; continue
    if ln.startswith('|'):
        rows = []
        while i < len(src) and src[i].startswith('|'):
            cells = [c.strip() for c in src[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', c) for c in cells): rows.append(cells)
            i += 1
        t = '<table width="100%" border="1" cellspacing="0" cellpadding="3">'
        for r, cells in enumerate(rows):
            tag = 'th' if r == 0 else 'td'
            t += '<tr>' + ''.join(f'<{tag}>{inline(c)}</{tag}>' for c in cells) + '</tr>'
        out.append(t + '</table>'); continue
    if re.match(r'\d+\. ', ln):
        items = []
        while i < len(src) and re.match(r'\d+\. ', src[i]): items.append(re.sub(r'^\d+\. ', '', src[i])); i += 1
        out.append('<ol>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + '</ol>'); continue
    if ln.startswith('- '):
        items = []
        while i < len(src) and src[i].startswith('- '): items.append(src[i][2:]); i += 1
        out.append('<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + '</ul>'); continue
    out.append(f'<p>{inline(ln)}</p>'); i += 1
css = '''@page{size:A4;margin:1.6cm 1.8cm}
body{font-family:"Times New Roman",serif;font-size:12.5pt;line-height:1.25}
h1{font-size:14pt;text-align:center;margin:0 0 4pt}
h2{font-size:13pt;margin:7pt 0 3pt}
p{margin:0 0 4pt;text-align:justify}
ol,ul{margin:0 0 4pt 16pt;padding:0}
li{margin:0 0 1.5pt}
table{border-collapse:collapse;width:100%;margin:2pt 0 5pt}
th,td{border:0.75pt solid #000;padding:2pt 4pt;font-size:11.5pt;vertical-align:top;text-align:left}
th{background:#E8EEF7}'''
print(f'<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>{css}</style></head><body>' + '\n'.join(out) + '</body></html>')
