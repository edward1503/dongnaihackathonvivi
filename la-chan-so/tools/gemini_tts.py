# Tạo giọng chị Lan bằng Gemini TTS (giọng Aoede như avatar 21). Đọc khóa từ biến môi trường GEMINI_API_KEYS, không in khóa.
import os, sys, json, base64, subprocess, urllib.request, urllib.error, pathlib, tempfile
keys=[k.strip() for k in os.environ.get('GEMINI_API_KEYS','').split(',') if k.strip()]
base=(os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
if not base.endswith('v1beta') and 'generativelanguage' in base: base=base+'/v1beta' if not base.endswith('/v1') else base
models=['gemini-3.8-flash-tts','gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts']
STYLE='Lan, một cô gái Việt khoảng 28 tuổi, giọng miền Nam nhẹ nhàng, nói tự nhiên như đang gọi video hỏi ý kiến em họ, hơi lo lắng nhưng thân thiện, tốc độ vừa phải.'
jobs=json.loads(sys.argv[1])
for j in jobs:
    out=pathlib.Path(j['out']); ok=False; last=''
    for m in models:
        for k in keys:
            body={'contents':[{'parts':[{'text':"# DIRECTOR'S NOTES (không đọc phần này)\n"+STYLE+"\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n"+j['text']}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':'Aoede'}}}}}
            req=urllib.request.Request(f"{base}/models/{m}:generateContent",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':k})
            try:
                r=json.loads(urllib.request.urlopen(req,timeout=90).read())
                part=r['candidates'][0]['content']['parts'][0]['inlineData']
                pcm=base64.b64decode(part['data']); rate=24000
                mt=part.get('mimeType','')
                if 'rate=' in mt: rate=int(mt.split('rate=')[1].split(';')[0])
                with tempfile.NamedTemporaryFile(suffix='.pcm',delete=False) as t: t.write(pcm); tp=t.name
                subprocess.run(['ffmpeg','-loglevel','error','-y','-f','s16le','-ar',str(rate),'-ac','1','-i',tp,'-c:a','aac','-b:a','96k',str(out)],check=True)
                os.unlink(tp); ok=True; print('OK',out.name,'model='+m,'%.1fs'%(len(pcm)/2/rate)); break
            except urllib.error.HTTPError as e:
                last=f'{m} HTTP {e.code}'; continue
            except Exception as e:
                last=f'{m} {type(e).__name__}'; continue
        if ok: break
    if not ok: print('FAIL',out.name,last)
