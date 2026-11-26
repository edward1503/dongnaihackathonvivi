#!/usr/bin/env python3
"""Đo xem hình miệng dựng sẵn có ĐI THEO tiếng không, cho từng câu thu sẵn của một nhân vật gọi video.
    <python có numpy> tools/do-mieng.py <lan|minh|tu> [số câu dài nhất muốn đo, mặc định 12]
Cách đo: nửa phải của <câu>.mieng.mp4 là trọng số dán miệng (chỗ nào miệng khác dáng khép thì sáng). Lấy độ sáng trung bình từng khung làm "độ mở miệng",
so với độ to của tiếng ở cùng khung (30 khung/giây). In hệ số tương quan của từng câu và tỷ lệ độ mở lúc có tiếng so với lúc lặng.
Đây là bằng chứng miệng mở khi có tiếng, khép khi lặng; KHÔNG chứng minh từng âm khớp khẩu hình (việc đó phải người xem).
Avatar 117 và 125 dùng tạm bộ khớp miệng của avatar 21: so số của minh, tu với lan để biết dùng tạm có kém đi không."""
import json, os, subprocess, sys
import numpy as np
nv = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
goc = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'prototype')
ds = json.load(open(os.path.join(goc, {'lan': 'loi-chi-lan.json'}.get(nv, f'loi-{nv}.json')), encoding='utf-8'))['loi']
ds = sorted(ds, key=lambda x: -x.get('giay', 0))[:n]; kq = []
for x in ds:
    tep = os.path.join(goc, x['tep']); mv = tep.replace('.m4a', '.mieng.mp4')
    v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mv, '-vf', 'crop=iw/2:ih:iw/2:0,scale=48:48', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True).stdout, np.uint8)
    mo = v.reshape(-1, 48 * 48).mean(axis=1) / 255
    a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', tep, '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
    k = min(len(mo), len(a) // 800); to = np.sqrt((a[:k * 800].reshape(k, 800) ** 2).mean(axis=1)); mo = mo[:k]
    db = 20 * np.log10(to + 1e-6); co = db > -35; r = float(np.corrcoef(mo, np.clip(db, -60, 0))[0, 1])
    ti = float(mo[co].mean() / max(1e-6, mo[~co].mean())) if (~co).sum() >= 3 and co.sum() >= 3 else float('nan')
    kq.append((r, ti)); print(f"{x['id']:18s} {k / 30:5.1f} giây · tương quan mở miệng với độ to {r:5.2f} · mở lúc có tiếng gấp {ti:4.1f} lần lúc lặng")
r = np.array([x[0] for x in kq]); t = np.array([x[1] for x in kq]); t = t[~np.isnan(t)]
print(f"== {nv}: {len(kq)} câu · tương quan trung vị {np.median(r):.2f} (thấp nhất {r.min():.2f}) · tỷ lệ mở có tiếng/lặng trung vị {np.median(t):.1f}")
