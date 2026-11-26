#!/usr/bin/env python3
"""Cắt một lượt thu dài thành từng câu khi máy đọc không ngắt đều giữa các câu.
    python3 tools/cat-theo-lang.py <lượt thu .wav> <danh sách .json: [{"id":…, "chu":…}, …]> <thư mục ra>
Dò mọi khoảng lặng, rồi chọn ra (số câu − 1) ranh giới sao cho độ dài từng đoạn khớp nhất với số tiếng của câu tương ứng
(quy hoạch động), ưu tiên khoảng lặng dài. Sau khi cắt PHẢI lọc rẹt (tools/loc-giong.py) và nghe kiểm (tools/nghe-lai.py)."""
import json, os, re, subprocess, sys
W, ds_f, ra = sys.argv[1:4]
L = json.load(open(ds_f)); os.makedirs(ra, exist_ok=True)
o = subprocess.run(['ffmpeg', '-hide_banner', '-i', W, '-af', 'silencedetect=noise=-42dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', o)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', o)]
g = [(s, e, e - s) for s, e in zip(st, en) if s > 0.15]
tot = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', W], capture_output=True, text=True).stdout)
syl = [len(x['chu'].split()) for x in L]; N, M = len(L), len(g)
noi = tot - sum(x[2] for x in g); a = 0.22; b = (noi - N * a) / sum(syl); exp = [a + b * s for s in syl]
S = [0.0] + [x[0] for x in g] + [tot]; E = [0.0] + [x[1] for x in g] + [tot]; G = [0] + [x[2] for x in g] + [0]
tich = [0.0]
for q in G: tich.append(tich[-1] + q)          # tổng khoảng lặng tới trước mỗi điểm
INF = 1e18; dp = [[INF] * (M + 2) for _ in range(N + 1)]; bk = [[-1] * (M + 2) for _ in range(N + 1)]; dp[0][0] = 0
for i in range(1, N + 1):
    for j in range(1, M + 2):
        if (i < N) == (j == M + 1): continue
        for p in range(max(0, j - 12), j):       # một câu không chứa quá 11 khoảng lặng bên trong
            if dp[i - 1][p] >= INF: continue
            d = S[j] - E[p] - (tich[j] - tich[p + 1])
            c = dp[i - 1][p] + ((d - exp[i - 1]) / (0.3 + 0.2 * exp[i - 1])) ** 2 - 1.2 * min(G[j], 1.2)
            if c < dp[i][j]: dp[i][j] = c; bk[i][j] = p
cuts = []; j = M + 1
for i in range(N, 0, -1): p = bk[i][j]; cuts.append((p, j)); j = p
cuts.reverse()
for i, (p, j) in enumerate(cuts):
    s = max(0, E[p] - 0.06); e = min(tot, S[j] + 0.10)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.3f' % s, '-to', '%.3f' % e, '-i', W, '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse,apad=pad_dur=0.2',
                    '-c:a', 'aac', '-b:a', '128k', os.path.join(ra, L[i]['id'] + '.m4a')], check=True)
print(f'{N} câu, {M} khoảng lặng, {b:.2f} giây mỗi tiếng, ranh giới ngắn nhất {min(G[j] for p, j in cuts[:-1]):.2f} giây')
