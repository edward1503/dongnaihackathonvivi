import os, sys, json, base64, subprocess, urllib.request, tempfile
keys=[k.strip() for k in os.environ.get('GEMINI_API_KEYS','').split(',') if k.strip()]
base=(os.environ.get('GEMINI_BASE_URL') or 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
for f in sys.argv[1:]:
    t=tempfile.mktemp(suffix='.mp3'); subprocess.run(['ffmpeg','-loglevel','error','-y','-i',f,'-ac','1','-b:a','64k',t],check=True)
    b=base64.b64encode(open(t,'rb').read()).decode(); os.unlink(t); done=False
    for m in ['gemini-3.5-flash','gemini-3.5-flash-lite','gemini-2.5-flash']:
        for k in keys:
            body={'contents':[{'parts':[{'inlineData':{'mimeType':'audio/mp3','data':b}},{'text':'Chép lại nguyên văn tiếng Việt lời nói trong đoạn âm thanh này. Chỉ trả về lời nói.'}]}]}
            req=urllib.request.Request(f"{base}/models/{m}:generateContent",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':k})
            try:
                r=json.loads(urllib.request.urlopen(req,timeout=90).read()); print(os.path.basename(f),'→',r['candidates'][0]['content']['parts'][0]['text'].strip()); done=True; break
            except Exception as e: continue
        if done: break
    if not done: print(os.path.basename(f),'→ (không chép được)')
