# Thu MỘT lượt dài cho một giọng (đỡ lệch tông giữa các câu), rồi cắt theo khoảng lặng thành từng câu.
# Dùng: python3 tools/gemini_take.py <voice> <style> <prefix> lines.json   (lines = ["câu 1", "câu 2", ...])
import os, sys, json, base64, subprocess, urllib.request, urllib.error, tempfile, re, pathlib
voice, style, prefix, lines_file = sys.argv[1:5]
lines=json.load(open(lines_file, encoding='utf-8'))
keys=[k.strip() for k in os.environ.get('GEMINI_API_KEYS','').split(',') if k.strip()]
base=(os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
notes=style+' Mỗi đoạn dưới đây là một câu riêng. Đọc hết từng đoạn theo đúng thứ tự, ngắt hẳn khoảng hai giây giữa các đoạn, không đọc số thứ tự, không thêm lời nào.'
prompt="# DIRECTOR'S NOTES (không đọc phần này)\n"+notes+"\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n"+"\n\n".join(lines)
pcm=None
for m in ['gemini-3.8-flash-tts','gemini-3.1-flash-tts-preview']:
    for k in keys:
        body={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':voice}}}}}
        req=urllib.request.Request(f"{base}/models/{m}:generateContent",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':k})
        try:
            r=json.loads(urllib.request.urlopen(req,timeout=180).read()); d=r['candidates'][0]['content']['parts'][0]['inlineData']
            pcm=base64.b64decode(d['data']); mt=d.get('mimeType',''); rate=int(mt.split('rate=')[1].split(';')[0]) if 'rate=' in mt else 24000
            print('take OK', m, '%.1fs'%(len(pcm)/2/rate)); break
        except Exception as e: print('fail', m, type(e).__name__, getattr(e,'code','')); continue
    if pcm: break
if not pcm: sys.exit('không thu được')
out=pathlib.Path(prefix).parent; out.mkdir(parents=True, exist_ok=True)
wav=str(prefix)+'-take.wav'
with tempfile.NamedTemporaryFile(suffix='.pcm',delete=False) as t: t.write(pcm); tp=t.name
subprocess.run(['ffmpeg','-loglevel','error','-y','-f','s16le','-ar',str(rate),'-ac','1','-i',tp,wav],check=True); os.unlink(tp)
total=len(pcm)/2/rate
def cuts(th, d):
    o=subprocess.run(['ffmpeg','-hide_banner','-i',wav,'-af',f'silencedetect=noise={th}dB:d={d}','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([0-9.]+)',o)]; en=[float(x) for x in re.findall(r'silence_end: ([0-9.]+)',o)]
    gaps=[(s,e) for s,e in zip(st,en) if s>0.2 and e<total-0.2]
    return gaps
best=None
for d in [1.3,1.2,1.1,1.0,0.9,0.8,0.7,1.5,1.7]:
    for th in [-40,-35,-45]:
        g=cuts(th,d)
        if len(g)==len(lines)-1: best=g; break
    if best is not None: break
if best is None: sys.exit(f'cắt không khớp số câu ({len(lines)}); xem {wav}')
bounds=[0.0]+[ (s+e)/2 for s,e in best ]+[total]
for i in range(len(lines)):
    a,b=bounds[i],bounds[i+1]; f=f"{prefix}-{i+1}.m4a"
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',wav,'-ss',f'{max(0,a-0.05):.2f}','-to',f'{b:.2f}','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.25','-c:a','aac','-b:a','96k',f],check=True)
    print(f, '%.1fs'%(b-a))
