#!/usr/bin/env python3
"""Thu giọng cho một bài học, đọc thẳng từ tệp nội dung prototype/hoc/bai-NN.json (mọi câu có "chu" và "giong" nằm dưới hoc/giong/).
    set -a; . <tệp .env có GEMINI_API_KEYS>; set +a
    python3 tools/thu-bai-hoc.py <số bài> [giọng …]            thu, cắt, lọc rẹt, nghe lại (mặc định: mọi giọng của bài)
    python3 tools/thu-bai-hoc.py <số bài> <giọng> --cat-lai    không thu lại, chỉ cắt + lọc + nghe lại từ lượt thu đã có
    python3 tools/thu-bai-hoc.py <số bài> --liet-ke            chỉ in danh sách câu theo từng giọng
    … --khong-nghe  bỏ bước nghe lại (nghe sau bằng --cat-lai)   … --nghe-cau  nghe riêng TỪNG câu chứ không chỉ các câu còn ngờ
    python3 tools/thu-bai-hoc.py <số bài> <giọng> --tach=bn-24 lượt quá dài (máy trả lỗi hoặc quá 3 phút) thì tách thành nhiều lượt, mỗi mã ghi ở đây mở đầu một lượt mới
    … --phan=2     chỉ làm lượt thứ hai (sau khi tách)        … --khoa=3   chỉ dùng khóa thứ ba (thử một lượt dài mà không tốn lượt của các khóa khác)
    … --cat-lai --moc=5.5,8.4,…  cắt theo giây bắt đầu của câu 2…n (đọc từ bản chép cả lượt), bám quãng lặng gần nhất; dùng khi tự cắt bị lệch
    … --cat-lai --bo-dau=61.2    lượt thu đọc lẫn lời dặn ở đầu: bỏ ngần ấy giây đầu (tới ngay trước câu 1) rồi mới cắt; nghe lại để chắc phần còn lại sạch
Mỗi giọng trong một bài = MỘT lượt thu dài (tools/gemini_take.py), cắt bằng tools/cat-theo-lang.py, lọc rẹt bằng tools/loc-giong.py,
rồi nghe lại bằng tools/nghe-lai.py. Chỉ dẫn cảm xúc ("cam_xuc") chỉ đưa vào lời dặn, không nằm trong lời đọc. Đổi một chữ thì thu lại cả lượt.
Lượt thu gốc và nhật ký nghe lại nằm ở audio-goc/hoc/bNN/ (không đưa lên kho). Giọng: tools/giong-bai-hoc.json; Minh, ông Tư: prototype/nhan-vat.json."""
import array, json, math, os, pathlib, re, subprocess, sys, unicodedata, wave
GOC = pathlib.Path(__file__).resolve().parent.parent
T = GOC / 'tools'
so = int(sys.argv[1]); doi = [a for a in sys.argv[2:] if not a.startswith('--')]; co = {a.split('=')[0] for a in sys.argv[2:] if a.startswith('--')}
thamso = dict(a.split('=', 1) for a in sys.argv[2:] if a.startswith('--') and '=' in a)
if '--khoa' in thamso:
    _k = [k.strip() for k in os.environ.get('GEMINI_API_KEYS', '').split(',') if k.strip()]; os.environ['GEMINI_API_KEYS'] = _k[int(thamso['--khoa']) - 1]
bai = json.load(open(GOC / f'prototype/hoc/bai-{so:02d}.json', encoding='utf-8'))
GIONG = json.load(open(T / 'giong-bai-hoc.json', encoding='utf-8'))
NV = json.load(open(GOC / 'prototype/nhan-vat.json', encoding='utf-8')) if (GOC / 'prototype/nhan-vat.json').exists() else {}


def duyet(o, ra):
    if isinstance(o, dict):
        if 'chu' in o and str(o.get('giong', '')).startswith('hoc/giong/'): ra.append(o)
        for v in o.values(): duyet(v, ra)
    elif isinstance(o, list):
        for v in o: duyet(v, ra)


tat = []; duyet(bai, tat); theo = {}
for x in tat: theo.setdefault(x.get('ai', 'be-nai'), {})[x['giong']] = x     # cùng tệp giọng chỉ lấy một lần
if '--liet-ke' in co:
    for ai, d in theo.items():
        print(f'== {ai}: {len(d)} câu, {sum(len(x["chu"].split()) for x in d.values())} tiếng')
        for g in sorted(d): print('  ', pathlib.Path(g).stem, '·', d[g].get('cam_xuc', ''), '·', d[g]['chu'])
    sys.exit(0)


def cat_nhieu_duoi(tep_vao, tep_ra):
    """Mỗi lần gọi Gemini TTS kết thúc bằng một cụm nhiễu rất to sau khi lời đã dứt (xem android/doc_giong.py, cùng cách nhận):
    đi lùi từ cuối, gặp quãng lặng từ 100 ms mà phía sau chỉ còn một ít tiếng rất to thì cắt tại đầu quãng lặng."""
    with wave.open(str(tep_vao)) as f: rate = f.getframerate(); pcm = f.readframes(f.getnframes())
    a = array.array('h'); a.frombytes(pcm[:len(pcm) // 2 * 2]); w = rate // 100; n = len(a) // w; cat = None
    db = [20 * math.log10(max(1.0, math.sqrt(sum(x * x for x in a[k * w:(k + 1) * w]) / w)) / 32768) for k in range(max(0, n - 200), n)]
    m = len(db); k = m - 1
    while k > 20:
        if db[k] < -50:
            dau = k
            while dau > 0 and db[dau - 1] < -50: dau -= 1
            sau = [j for j in range(k + 1, m) if db[j] > -40]
            if k - dau + 1 >= 10 and sau and len(sau) <= 25 and max(db[j] for j in sau) > -9: cat = (n - m + dau + 6) * w; break
            k = dau - 1
        else: k -= 1
    if cat: a = a[:cat]
    with wave.open(str(tep_ra), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate); f.writeframes(a.tobytes())
    return f'cắt {(n * w - cat) / rate:.2f} giây nhiễu đuôi' if cat else 'không thấy nhiễu đuôi'


def chuan(s):
    s = unicodedata.normalize('NFC', s.lower()); s = re.sub(r'[^\w\s]', ' ', s); return ' '.join(s.split())


def doc_wav(p):
    with wave.open(str(p)) as f: rate = f.getframerate(); a = array.array('h'); a.frombytes(f.readframes(f.getnframes()))
    return rate, a


def ghi_wav(p, rate, a):
    with wave.open(str(p), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate); f.writeframes(a.tobytes())


def khoang_lang(wav, d=0.15):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(wav), '-af', f'silencedetect=noise=-42dB:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', o)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', o)]
    return list(zip(st, en))


def khu_dao(wav):
    """Xóa các "đảo tiếng" cực ngắn (dưới 90 ms) nằm giữa hai quãng lặng: đó là tiếng click, tiếng rẹt giữa các câu, không phải lời.
    Nhờ vậy quãng nghỉ giữa hai câu liền lại thành một và tiếng click không lọt vào đầu câu sau."""
    rate, a = doc_wav(wav); tot = len(a) / rate; L = khoang_lang(wav); dao = []; truoc = 0.0
    for s, e in L:
        if s - truoc > 0.004: dao.append((truoc, s))
        truoc = e
    xoa = [(s, e) for s, e in dao if e - s < 0.09 and s > 0.001]
    for s, e in xoa:
        for k in range(max(0, int((s - 0.004) * rate)), min(len(a), int((e + 0.004) * rate))): a[k] = 0
    if xoa: ghi_wav(wav, rate, a)
    return len(xoa)


def hoi_moc(wav, cau):
    """Nhờ máy nghe cho biết mỗi câu bắt đầu ở giây nào (dùng khi người đọc không nghỉ đủ dài giữa các câu). Trả về danh sách số hoặc None."""
    keys = [k.strip() for k in os.environ.get('GEMINI_API_KEYS', '').split(',') if k.strip()]
    base = (os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
    import base64, tempfile, urllib.request
    tam = tempfile.mktemp(suffix='.mp3'); subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(wav), '-ac', '1', '-b:a', '64k', tam], check=True)
    b = base64.b64encode(open(tam, 'rb').read()).decode(); os.unlink(tam)
    hoi = (f'Đây là một lượt thu giọng đọc tiếng Việt gồm đúng {len(cau)} câu, đọc theo đúng thứ tự dưới đây. Hãy nghe và cho biết mỗi câu BẮT ĐẦU ở giây thứ mấy '
           f'tính từ đầu tệp (số thập phân). Trả về đúng một mảng JSON gồm {len(cau)} số tăng dần, không thêm chữ nào.\n' + '\n'.join(f'{i + 1}. {x["chu"]}' for i, x in enumerate(cau)))
    import time
    for vong in range(3):               # hạn mức theo phút hay bị đầy: thử lại sau một lúc
        # mỗi mô hình có hạn mức ngày riêng (gói miễn phí): 3.5-flash hết thì dùng các bản flash khác còn lượt, bản lite (kém tin) để sau cùng
        for m in [x for x in os.environ.get('NGHE_LAI_MO_HINH', '').split(',') if x] or ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite']:
            for k in keys:
                try:
                    r = json.loads(urllib.request.urlopen(urllib.request.Request(f'{base}/models/{m}:generateContent',
                        data=json.dumps({'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/mp3', 'data': b}}, {'text': hoi}]}]}).encode(),
                        headers={'Content-Type': 'application/json', 'x-goog-api-key': k}), timeout=180).read())
                    t = r['candidates'][0]['content']['parts'][0]['text']; ds = json.loads(t[t.index('['):t.rindex(']') + 1])
                    ds = [float(x) for x in ds]
                    if len(ds) == len(cau) and all(y > x for x, y in zip(ds, ds[1:])): return ds
                except Exception:
                    continue
        time.sleep(25)
    return None


def cat(wav, cau, tho, ep=None):
    """Cắt lượt thu thành từng câu. Ranh giới luôn là một quãng lặng thật. Chọn quãng nào: nếu có đúng (số câu − 1) quãng nghỉ dài từ 0,9 giây
    thì lấy luôn; không thì quy hoạch động theo ba căn cứ: quãng lặng dài, độ dài từng câu theo số tiếng, và mốc do máy nghe báo."""
    rate, a = doc_wav(wav); tot = len(a) / rate; n = len(cau); L = khoang_lang(wav)
    dau = L[0][1] if L and L[0][0] < 0.05 else 0.0; cuoi = L[-1][0] if L and L[-1][1] > tot - 0.05 else tot
    G = [(s, e) for s, e in L if s > dau + 0.1 and e < cuoi - 0.1]; cach = 'một câu'
    if n > 1 and ep:                   # --moc: người kiểm đã đọc bản chép cả lượt và ghi giây bắt đầu của từng câu 2…n; lấy quãng lặng gần nhất
        if len(ep) != n - 1: return None, f'--moc cần đúng {n - 1} mốc, có {len(ep)}'
        chon = [min(G, key=lambda g: abs(g[1] - t)) for t in ep]; cach = 'mốc ghi tay'
        if any(y[1] <= x[1] for x, y in zip(chon, chon[1:])): return None, 'mốc ghi tay trùng hoặc không tăng dần sau khi bám quãng lặng'
    elif n > 1:
        dai = [g for g in G if g[1] - g[0] >= 0.9]; hop_ly = False
        if len(dai) == n - 1:          # chỉ tin các quãng nghỉ dài khi độ dài từng câu cắt ra cũng hợp với số tiếng của câu
            moc_ = [dau] + [g[1] for g in dai]; het_ = [g[0] for g in dai] + [cuoi]
            toc = sorted((het_[i] - moc_[i]) / max(1, len(cau[i]['chu'].split())) for i in range(n)); giua = toc[n // 2]
            hop_ly = all(0.5 * giua <= t <= 1.9 * giua for t in toc)
        if hop_ly: chon = dai; cach = 'quãng nghỉ dài'
        else:
            moc = hoi_moc(wav, cau); cach = 'quy hoạch động' + (' có mốc máy nghe' if moc else ' không có mốc máy nghe')
            syl = [len(x['chu'].split()) for x in cau]; noi = (cuoi - dau) - sum(e - s for s, e in G); b = max(0.05, (noi - n * 0.2) / sum(syl)); exp = [0.2 + b * s for s in syl]
            S = [dau] + [g[0] for g in G] + [cuoi]; E = [dau] + [g[1] for g in G] + [cuoi]; D = [0] + [g[1] - g[0] for g in G] + [0]; M = len(G)
            tich = [0.0]
            for q in D: tich.append(tich[-1] + q)
            INF = 1e18; dp = [[INF] * (M + 2) for _ in range(n + 1)]; bk = [[-1] * (M + 2) for _ in range(n + 1)]; dp[0][0] = 0
            for i in range(1, n + 1):
                for j in range(1, M + 2):
                    if (i < n) == (j == M + 1): continue
                    for p in range(max(0, j - 16), j):
                        if dp[i - 1][p] >= INF: continue
                        d = S[j] - E[p] - (tich[j] - tich[p + 1])
                        c = dp[i - 1][p] + 1.0 * ((d - exp[i - 1]) / (0.3 + 0.2 * exp[i - 1])) ** 2 - 1.6 * min(D[j], 1.2)
                        if moc and i < n: c += min(2.5, ((E[j] - moc[i]) / 1.5) ** 2)       # mốc máy nghe chỉ là gợi ý, hay lệch vài giây
                        if c < dp[i][j]: dp[i][j] = c; bk[i][j] = p
            if dp[n][M + 1] >= INF: return None, cach + ': không tìm được cách cắt'
            idx = []; j = M + 1
            for i in range(n, 0, -1): j = bk[i][j]; idx.append(j)
            chon = [G[q - 1] for q in sorted(idx) if q >= 1]
    else: chon = []
    bien = [(dau, None)] + [(g[1], g[0]) for g in chon]            # (đầu câu, cuối câu trước)
    tho.mkdir(parents=True, exist_ok=True)
    for f in tho.glob('*.m4a'): f.unlink()
    for i, x in enumerate(cau):
        s = max(0, bien[i][0] - 0.06); e = min(tot, (bien[i + 1][1] if i + 1 < n else cuoi) + 0.10)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.3f' % s, '-to', '%.3f' % e, '-i', str(wav), '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse,apad=pad_dur=0.2',
                        '-c:a', 'aac', '-b:a', '128k', str(tho / (pathlib.Path(x['giong']).stem + '.m4a'))], check=True)
    ngan = min((g[1] - g[0] for g in chon), default=0)
    return chon, f'{cach}; ranh giới ngắn nhất {ngan:.2f} giây'


def nghe(tep):
    r = subprocess.run([sys.executable, str(T / 'nghe-lai.py'), *tep], capture_output=True, text=True)
    return r.stdout, {l[3:].split(' → ')[0]: l for l in r.stdout.splitlines() if ' → ' in l}


def lam_sach(ban):
    """Bản chép của máy nghe → (chữ đã bỏ mốc thời gian và dòng kết luận, kết luận: True có lời dặn / False không / None không rõ vì bản chép bị cắt)."""
    t = re.sub(r'\[[^\]]*\]?|\([^)]*\)?', ' ', ban).replace('|', ' ')
    # Mốc thời gian không ngoặc ("00:23", "1:02.5", "0m3s", "4.2s", "12 giây") bị chuan() tách thành 2 "tiếng", làm cảnh báo "dài hơn lời gốc" báo nhầm.
    # Lời thu không có chữ số nào (đã kiểm 4 bài), nên bỏ luôn mọi số đứng riêng còn lại (số thứ tự dòng).
    t = re.sub(r'\b\d+\s*:\s*\d+(?:[.,]\d+)?\b|\b\d+m\d+(?:[.,]\d+)?s\b|\b\d+(?:[.,]\d+)?\s*(?:s|giây)\b|\b\d+(?:[.,]\d+)?\b', ' ', t)
    t = ' '.join(t.split())
    kl = False if 'KHÔNG CÓ LỜI DẶN' in t else (True if 'CÓ LỜI DẶN' in t else None)
    return re.sub(r'KHÔNG CÓ LỜI DẶN|CÓ LỜI DẶN', ' ', t), kl


def so_sanh(x, l):
    """So bản chép của máy nghe với lời mong muốn. Trả về (thiếu, thừa, có vấn đề về kết luận, bản chép).
    Bản chép bị cắt giữa chừng (máy nghe hết hạn mức trả lời dở) mà phần đã chép khớp lời gốc thì không coi là thiếu."""
    ban = l.split(' → ', 1)[-1] if l else ''
    chu, kl = lam_sach(ban); ng = chuan(chu).split(); mong = chuan(x['chu']).split()
    thieu = [t for t in mong if t not in ng]; thua = [t for t in ng if t not in mong]
    if kl is None and ng and not thua and ng == mong[:len(ng)]: thieu = []; return thieu, thua, 'bản chép bị cắt giữa chừng', ban
    return thieu, thua, ('máy kết luận CÓ LỜI DẶN' if kl else ('máy không chép được' if not ng else '')), ban


loi = 0; nguoi_nghe = []
viec = []
for ai in (doi or list(theo)):
    d = theo.get(ai)
    if not d: print('Bài này không có giọng', ai); continue
    tat_ca = [d[g] for g in sorted(d)]; moc_tach = [m for m in thamso.get('--tach', '').split(',') if m]; nhom = [[]]
    for x in tat_ca:
        if pathlib.Path(x['giong']).stem in moc_tach and nhom[-1]: nhom.append([])
        nhom[-1].append(x)
    for q, cau in enumerate(nhom):
        if '--phan' in thamso and int(thamso['--phan']) != q + 1: continue
        viec.append((ai, cau, GIONG[ai]['ma'] + (f'-p{q + 1}' if len(nhom) > 1 else ''), f' · lượt {q + 1}/{len(nhom)}' if len(nhom) > 1 else ''))
for ai, cau, ma, ghi_luot in viec:
    cfg = GIONG[ai]
    if 'nhan_vat' in cfg:
        nv = NV.get(cfg['nhan_vat']) or {}
        if not nv.get('chot'): print(f'!! {ai}: prototype/nhan-vat.json chưa chốt giọng, bỏ qua'); loi += 1; continue
        giong, dan = nv['giong'], nv['loi_dan']
    else:
        giong = cfg['giong']; dan = cfg['loi_dan']; dan = dan[bai['che_do']] if isinstance(dan, dict) else dan
    cx = '; '.join(f'đoạn {i + 1} {x["cam_xuc"]}' for i, x in enumerate(cau) if x.get('cam_xuc'))
    if cx: dan += ' Cảm xúc của từng đoạn, chỉ để diễn, tuyệt đối không đọc thành tiếng: ' + cx + '.'
    lam = GOC / f'audio-goc/hoc/b{so:02d}'; tho = lam / f'{ma}-cat'; lam.mkdir(parents=True, exist_ok=True)
    take = lam / f'{ma}-take.wav'; sach = lam / f'{ma}-take-sach.wav'
    print(f'== Bài {so} · {ai}{ghi_luot} · giọng {giong} · {len(cau)} câu', flush=True)
    if '--cat-lai' not in co:
        (lam / f'{ma}-loi.json').write_text(json.dumps([x['chu'] for x in cau], ensure_ascii=False, indent=1), encoding='utf-8')
        (lam / f'{ma}-loi-dan.txt').write_text(dan, encoding='utf-8')
        if take.exists(): take.unlink()
        r = subprocess.run([sys.executable, str(T / 'gemini_take.py'), giong, dan, str(lam / ma), str(lam / f'{ma}-loi.json')], capture_output=True, text=True)
        ra_take = (r.stdout + r.stderr).strip().splitlines()
        tu_choi = {}
        for l in ra_take:
            if l.startswith('fail'): k = ' '.join(l.split()[1:]); tu_choi[k] = tu_choi.get(k, 0) + 1
        print('  thu:', ('bị từ chối ' + ', '.join(f'{v} lần ({k})' for k, v in tu_choi.items()) + ';') if tu_choi else '', next((l for l in ra_take if l.startswith('take OK')), 'KHÔNG THU ĐƯỢC'), flush=True)
        for f in lam.glob(f'{ma}-[0-9]*.m4a'): f.unlink()            # bản cắt thử của gemini_take, không dùng
    if not take.exists(): print('!! không có lượt thu'); loi += 1; continue
    _r, _a = doc_wav(take); _giay = len(_a) / _r; _tieng = sum(len(x['chu'].split()) for x in cau)
    if _giay < 0.17 * _tieng:          # máy đôi khi trả về lượt bị đứt giữa chừng: ngắn hơn hẳn mức đọc nhanh nhất thì bỏ, thu lại
        print(f'!! lượt thu chỉ dài {_giay:.0f} giây cho {_tieng} tiếng: bị đứt giữa chừng, bỏ'); take.rename(take.with_suffix('.dut.wav')); loi += 1; continue
    print('  ' + cat_nhieu_duoi(take, sach) + f'; xóa {khu_dao(sach)} tiếng click giữa các câu')
    if thamso.get('--bo-dau'):         # lượt thu đọc lẫn lời dặn ở ĐẦU lượt (đã nghe và chép ra): bỏ đoạn đó, giữ phần lời phía sau (vẫn là một lượt)
        _r, _a = doc_wav(sach); _t = float(thamso['--bo-dau']); ghi_wav(sach, _r, _a[int(_t * _r):])
        print(f'  bỏ {_t:.2f} giây đầu lượt (lời dặn bị đọc lẫn); mốc --moc tính trên lượt đã bỏ đầu')
    chon, ghi_chu = cat(sach, cau, tho, [float(t) for t in thamso['--moc'].split(',')] if thamso.get('--moc') else None)
    print('  cắt:', ghi_chu, flush=True)
    if chon: print('  đầu các câu 2…n (giây, trên lượt đã lọc):', ' '.join(f'{g[1]:.2f}' for g in chon), flush=True)
    if chon is None: loi += 1; continue
    ra = GOC / 'prototype' / pathlib.Path(cau[0]['giong']).parent
    r = subprocess.run([sys.executable, str(T / 'loc-giong.py'), str(tho), str(ra)], capture_output=True, text=True)
    cat_them = [l for l in r.stdout.splitlines() if 'không cắt' not in l]
    print('  lọc rẹt:', len(r.stdout.splitlines()), 'tệp;', ('có cắt thêm: ' + ' / '.join(cat_them)) if cat_them else 'không tệp nào phải cắt thêm')
    if '--khong-nghe' in co: continue
    # --- Nghe lại. Bước 1: nghe CẢ LƯỢT một lần (đủ ngữ cảnh, bắt được lời dặn bị đọc lẫn, câu lặp, câu thiếu).
    # Bước 2: nghe riêng từng câu còn ngờ (thiếu chữ trong bản chép cả lượt, nhịp đọc lệch) hoặc mọi câu nếu có --nghe-cau.
    dai_tep = {x['giong']: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(GOC / 'prototype' / x['giong'])], capture_output=True, text=True).stdout or 0) for x in cau}
    nhip = sorted(max(0.05, dai_tep[x['giong']] - 0.3) / max(1, len(x['chu'].split())) for x in cau); nhip_giua = nhip[len(nhip) // 2]
    nk_luot, dong_luot = nghe([str(sach)]); l_luot = dong_luot.get(sach.name, '')
    ban_luot, kl_l = lam_sach(l_luot.split(' → ', 1)[-1])
    tu_luot = chuan(ban_luot).split(); tui = {}
    for t in tu_luot: tui[t] = tui.get(t, 0) + 1
    tong_mong = sum(len(chuan(x['chu']).split()) for x in cau)
    kl_luot = 'máy không chép được cả lượt' if not tu_luot else ('máy kết luận CÓ LỜI DẶN' if kl_l else ('máy kết luận không có lời dặn' if kl_l is False else 'bản chép bị cắt giữa chừng, không có dòng kết luận'))
    thua_luot = len(tu_luot) > tong_mong * 1.12 + 3
    print(f'  nghe cả lượt: chép được {len(tu_luot)} tiếng, lời gốc {tong_mong} tiếng; {kl_luot}' + ('; DÀI HƠN LỜI GỐC, có thể đọc thừa hoặc lặp' if thua_luot else ''), flush=True)
    ngo = []
    for x in cau:
        mong = chuan(x['chu']).split(); thieu = [t for t in mong if not tui.get(t)]
        nh = max(0.05, dai_tep[x['giong']] - 0.3) / max(1, len(mong))
        x['_lech'] = len(cau) >= 4 and len(mong) >= 4 and (nh > 1.75 * nhip_giua or nh < 0.5 * nhip_giua); x['_nh'] = nh
        x['_thieu_luot'] = thieu if len(thieu) > max(1, len(mong) * 0.25) else []
        if '--nghe-cau' in co or x['_lech'] or x['_thieu_luot'] or not tu_luot or thua_luot or kl_l: ngo.append(x)
    dong = {}; dong2 = {}; nk = nk2 = ''
    if ngo:
        nk, dong = nghe([str(GOC / 'prototype' / x['giong']) for x in ngo])
        ngo2 = [x for x in ngo if any(so_sanh(x, dong.get(pathlib.Path(x['giong']).name, ''))[:3])]
        if ngo2: nk2, dong2 = nghe([str(GOC / 'prototype' / x['giong']) for x in ngo2])
    (lam / f'{ma}-nghe-lai.txt').write_text('--- cả lượt ---\n' + nk_luot + ('\n--- từng câu còn ngờ ---\n' + nk if nk else '') + ('\n--- nghe lần hai ---\n' + nk2 if nk2 else ''), encoding='utf-8')
    dem = {'ok': 0, '??': 0, '!!': 0}
    for x in cau:
        ten = pathlib.Path(x['giong']).name; giay = dai_tep[x['giong']]; tu = len(chuan(x['chu']).split())
        lan = ([so_sanh(x, dong[ten])] if ten in dong else []) + ([so_sanh(x, dong2[ten])] if ten in dong2 else [])
        hong = bool(lan) and all((len(t[0]) > max(1, tu * 0.25) or len(t[1]) > max(2, tu * 0.3)) and t[2] != 'bản chép bị cắt giữa chừng' for t in lan)
        ngo_ = (x in ngo and any(t[0] or t[1] or t[2] for t in lan)) or x['_lech'] or giay < 1.0
        nhan = '!!' if hong else ('??' if ngo_ else 'ok'); dem[nhan] += 1
        if hong: loi += 1
        if nhan != 'ok': nguoi_nghe.append(x['giong'])
        ly = []
        if giay < 1.0: ly.append('dưới 1 giây, máy nghe không đáng tin')
        if x['_lech']: ly.append(f'nhịp đọc lệch ({x["_nh"]:.2f} giây mỗi tiếng, cả lượt {nhip_giua:.2f})')
        if x['_thieu_luot']: ly.append('bản chép cả lượt thiếu: ' + ' '.join(x['_thieu_luot']))
        for q, t in enumerate(lan):
            if t[0] or t[1] or t[2]: ly.append(f'nghe riêng lần {q + 1}: ' + ', '.join(z for z in [('thiếu ' + ' '.join(t[0])) if t[0] else '', ('thừa ' + ' '.join(t[1])) if t[1] else '', t[2] if t[2] else ''] if z))
        if nhan != 'ok':
            print(f'  {nhan} {ten} {giay:.1f}s · ' + ' · '.join(ly)); print('     mong:', x['chu'])
            for q, t in enumerate(lan): print(f'     nghe {q + 1}:', t[3][:260])
        for k in ('_lech', '_nh', '_thieu_luot'): x.pop(k, None)
    print(f'  kết quả: {dem["ok"]} câu khớp, {dem["??"]} câu cần người nghe, {dem["!!"]} câu hỏng; nghe riêng {len(ngo)} câu', flush=True)
if nguoi_nghe: print('Cần người nghe lại:', ' '.join(pathlib.Path(g).name for g in nguoi_nghe))
print('Có chỗ cần xem lại.' if loi else 'Xong, không thấy lỗi (vẫn nên đọc nhật ký nghe lại trong audio-goc/hoc/).')
sys.exit(1 if loi else 0)
