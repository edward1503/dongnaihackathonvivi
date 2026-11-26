#!/usr/bin/env python3
"""Nghe lại tệp giọng để bắt lượt đọc hỏng: đọc lẫn lời dặn về giọng, đọc lặp một câu, đọc thiếu.
    set -a; . <tệp .env có GEMINI_API_KEYS>; set +a; python3 tools/nghe-lai.py tệp1.m4a tệp2.m4a …
Phải hỏi đích danh về lời dặn và đòi mốc thời gian: bảo máy "chép lại lời nói" thì nó tự lược phần thừa, còn cắt đoạn ngắn thì nó đoán bừa
(cả hai cách đều đã bỏ sót 10 giây lời dặn ở đầu chi-lan-1.m4a, 25/11/2026). Tệp nào ra "CÓ LỜI DẶN" hoặc có câu lặp thì cắt hoặc thu lại."""
import os, sys, json, base64, subprocess, tempfile, urllib.request
keys = [k.strip() for k in os.environ.get('GEMINI_API_KEYS', '').split(',') if k.strip()]
base = (os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
YEU_CAU = ('Đây là một tệp giọng đọc tiếng Việt do máy tạo. Hãy chép lại TOÀN BỘ lời nói theo thứ tự, mỗi câu một dòng kèm thời điểm bắt đầu (giây). '
           'Đặc biệt chú ý: người đọc có thể đã đọc nhầm cả lời dặn về giọng (ví dụ "hơi lo lắng nhưng thân thiện", "tốc độ vừa phải", "nói tự nhiên", '
           '"giọng nữ trẻ", tên cảm xúc trong ngoặc) hoặc đọc lặp một câu hai lần. Chép cả những phần đó, không lược bỏ. '
           'Dòng cuối ghi đúng một trong hai: CÓ LỜI DẶN hoặc KHÔNG CÓ LỜI DẶN.')
loi = 0
for f in sys.argv[1:]:
    tam = tempfile.mktemp(suffix='.mp3')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-ac', '1', '-b:a', '96k', tam], check=True)
    b = base64.b64encode(open(tam, 'rb').read()).decode(); os.unlink(tam); kq = None
    # NGHE_LAI_MO_HINH=<mô hình, …>: chọn mô hình nghe. Mỗi mô hình có hạn mức NGÀY riêng (gói miễn phí, theo project); bản lite nghe kém, chép sai, kết luận bừa: để sau cùng
    for m in [x for x in os.environ.get('NGHE_LAI_MO_HINH', '').split(',') if x] or ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite']:
        for k in keys:
            try:
                r = json.loads(urllib.request.urlopen(urllib.request.Request(f'{base}/models/{m}:generateContent',
                    data=json.dumps({'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/mp3', 'data': b}}, {'text': YEU_CAU}]}]}).encode(),
                    headers={'Content-Type': 'application/json', 'x-goog-api-key': k}), timeout=120).read())
                kq = r['candidates'][0]['content']['parts'][0]['text'].strip(); break
            except Exception:
                continue
        if kq:
            # NGHE_LAI_GHI_MO_HINH=1: ghi tên mô hình đã nghe ở cuối dòng (mô hình dự phòng hay chép sai, kết luận bừa)
            if os.environ.get('NGHE_LAI_GHI_MO_HINH') == '1': kq += f'\n[mô hình: {m}]'
            break
    xau = kq is None or 'KHÔNG CÓ LỜI DẶN' not in kq
    loi += xau
    print(('!! ' if xau else 'ok ') + os.path.basename(f) + ' → ' + (kq or '(không chép được)').replace('\n', ' | '))
sys.exit(1 if loi else 0)
