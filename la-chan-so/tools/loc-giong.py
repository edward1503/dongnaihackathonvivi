# Lọc file giọng: cắt tiếng nổ ở đuôi/đầu file, hạ 3 dB chống vỡ, khử click + nhiễu nền, fade hai đầu.
import subprocess,array,math,sys,os
def db(seg): return 20*math.log10(max(1,math.sqrt(sum(x*x for x in seg)/max(1,len(seg))))/32768)
def process(src,dst):
    raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','24000','-f','s16le','-'],capture_output=True).stdout
    a=array.array('h'); a.frombytes(raw[:len(raw)//2*2]); n=len(a); w=240
    start=0.0; end=n/24000; note=[]
    # đuôi: trong 350ms cuối, khung im (<-45dB) rồi bật lên >-20dB => tiếng nổ, cắt từ đó
    k0=max(w,n-w*35)
    for k in range(k0,n-w,w):
        if db(a[k:k+w])>-30 and db(a[k-w:k])<-45:
            end=(k-120)/24000; note.append(f'cắt đuôi {n/24000-end:.2f}s'); break
    # đầu: 10ms đầu to (>-30dB) nhưng 40-50ms sau lại im => click đầu file
    if n>w*6 and db(a[0:w])>-30 and db(a[w*4:w*5])<-45:
        start=0.03; note.append('cắt click đầu')
    chain=f"atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS,volume=-3dB,highpass=f=70,adeclick,afftdn=nr=10:nf=-55:tn=1,afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse,alimiter=limit=0.89:level=false"
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-af',chain,'-ar','48000','-c:a','aac','-b:a','160k',dst],check=True)
    return ', '.join(note) or 'không cắt'
src,dst=sys.argv[1:3]; os.makedirs(dst,exist_ok=True)
for f in sorted(os.listdir(src)):
    if f.endswith('.m4a'): print(f'{f:14s}',process(os.path.join(src,f),os.path.join(dst,f)))
