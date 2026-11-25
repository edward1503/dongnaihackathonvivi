#!/usr/bin/env python3
"""Đo mốc thời gian của từng dấu hiệu trong bài "Nghe và bấm Dừng" (B6) rồi ghi vào tệp nội dung.
    python3 tools/do-moc-dau-hieu.py prototype/hoc/bai-01.json [--chi-xem]
Mỗi câu của người gọi có "dau_hieu": {"cum": "cụm chữ làm lộ dấu hiệu", "luc": giây}. "luc" là lúc cụm đó vừa được nói xong, tính từ đầu tệp
giọng ĐÃ CẮT VÀ LỌC của câu (đo trên tệp cuối cùng, nên thu lại hoặc cắt lại thì phải chạy lại). Người học bấm Dừng trước mốc này thì coi là
chưa nghe ra dấu hiệu của câu đó. Cách đo: dò các quãng lặng trong tệp, chia phần có tiếng theo số tiếng (âm tiết) của câu, lấy thời điểm
kết thúc tiếng cuối của cụm, lùi 0,15 giây cho rộng rãi. Sai số khoảng 0,2 giây."""
import json, re, subprocess, sys, pathlib, unicodedata
tep = pathlib.Path(sys.argv[1]); chi_xem = '--chi-xem' in sys.argv; goc = tep.resolve().parent.parent
bai = json.loads(tep.read_text(encoding='utf-8'))
chuan = lambda s: re.sub(r'[^\w\s]', ' ', unicodedata.normalize('NFC', s.lower())).split()


def moc(cau):
    d = cau['dau_hieu']; f = goc / cau['giong']
    if not f.exists(): return None, 'chưa có tệp giọng'
    tot = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', o)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', o)]
    if len(en) < len(st): en.append(tot)
    tieng = []; truoc = 0.0
    for s, e in zip(st, en):
        if s - truoc > 0.03: tieng.append((truoc, s))
        truoc = e
    if tot - truoc > 0.03: tieng.append((truoc, tot))
    tu = chuan(cau['chu']); cum = chuan(d['cum']); vt = next((i for i in range(len(tu) - len(cum) + 1) if tu[i:i + len(cum)] == cum), None)
    if vt is None: return None, 'không thấy cụm "' + d['cum'] + '" trong câu'
    T = sum(e - s for s, e in tieng); dich = T * (vt + len(cum)) / len(tu); t = tieng[-1][1]
    for s, e in tieng:
        if dich <= e - s: t = s + dich; break
        dich -= e - s
    return max(0.0, round(t - 0.15, 1)), f'tệp dài {tot:.1f}s, {len(tieng)} đoạn có tiếng'


doi = 0
for bt in bai.get('luyen', []):
    if bt.get('dang') != 'nghe-bam-dung': continue
    for cau in list((bt.get('mau') or {}).get('cau', [])) + bt.get('cau', []):
        d = cau.get('dau_hieu')
        if not d or not d.get('cum'): continue
        t, ghi_chu = moc(cau)
        print(f"{pathlib.Path(cau['giong']).name}: cụm \"{d['cum']}\" → {t} giây ({ghi_chu}); đang ghi {d.get('luc')}")
        if t is not None and d.get('luc') != t: d['luc'] = t; doi += 1
if doi and not chi_xem: tep.write_text(json.dumps(bai, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print('Đã ghi', doi, 'mốc vào', tep)
