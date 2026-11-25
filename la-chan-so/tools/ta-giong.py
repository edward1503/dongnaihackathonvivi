#!/usr/bin/env python3
"""Nhờ máy nghe mô tả một giọng đọc thử (để chọn giọng cho nhân vật khi không có người ngồi nghe).
    set -a; . <tệp .env có GEMINI_API_KEYS>; set +a; python3 tools/ta-giong.py tệp1.m4a tệp2.wav …
Chỉ là ý kiến của máy: giọng cho nhân vật chính vẫn cần người nghe lại trước khi chốt."""
import os, sys, json, base64, subprocess, tempfile, urllib.request
keys = [k.strip() for k in os.environ.get('GEMINI_API_KEYS', '').split(',') if k.strip()]
base = (os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
HOI = ('Đây là một giọng đọc tiếng Việt do máy tạo. Hãy mô tả giọng trong đúng năm dòng ngắn: 1) nam hay nữ; 2) nghe khoảng bao nhiêu tuổi; '
       '3) giọng vùng nào (Bắc, Trung, Nam); 4) tốc độ và cao độ (nhanh/chậm, trầm/cao); 5) cảm giác (ví dụ ấm, lạnh, lễ phép, vội, đáng sợ, tự nhiên hay đọc đều đều). '
       'Dòng thứ sáu: chép lại nguyên văn lời nói.')
for f in sys.argv[1:]:
    tam = tempfile.mktemp(suffix='.mp3')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-ac', '1', '-b:a', '96k', tam], check=True)
    b = base64.b64encode(open(tam, 'rb').read()).decode(); os.unlink(tam); kq = None
    for m in ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite']:
        for k in keys:
            try:
                r = json.loads(urllib.request.urlopen(urllib.request.Request(f'{base}/models/{m}:generateContent',
                    data=json.dumps({'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/mp3', 'data': b}}, {'text': HOI}]}]}).encode(),
                    headers={'Content-Type': 'application/json', 'x-goog-api-key': k}), timeout=120).read())
                kq = r['candidates'][0]['content']['parts'][0]['text'].strip(); break
            except Exception:
                continue
        if kq: break
    print('== ' + os.path.basename(f) + '\n' + (kq or '(máy không nghe được)') + '\n')
