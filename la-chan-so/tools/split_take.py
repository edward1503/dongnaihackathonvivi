# Cắt một lượt thu dài thành từng câu: chọn các khoảng lặng vừa dài vừa gần vị trí dự kiến (theo độ dài chữ của từng câu).
import sys, json, re, subprocess
wav, lines_file, prefix = sys.argv[1:4]
lines=json.load(open(lines_file,encoding='utf-8')); n=len(lines)
dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',wav],capture_output=True,text=True).stdout)
o=subprocess.run(['ffmpeg','-hide_banner','-i',wav,'-af','silencedetect=noise=-38dB:d=0.3','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([0-9.]+)',o)]; en=[float(x) for x in re.findall(r'silence_end: ([0-9.]+)',o)]
gaps=[(s,e) for s,e in zip(st,en) if s>0.3 and e<dur-0.3]
speech_start=en[0] if st and st[0]<0.05 else 0.0
w=[len(l) for l in lines]; tot=sum(w); exp=[]; acc=0
for x in w[:-1]: acc+=x; exp.append(speech_start+(dur-speech_start)*acc/tot)
# DP: chọn n-1 khoảng lặng theo thứ tự, điểm = độ dài lặng*3 - |lệch so với dự kiến|
G=len(gaps); NEG=-1e9
best=[[NEG]*(G+1) for _ in range(n)]; prev=[[None]*(G+1) for _ in range(n)]
for j in range(G):
    s,e=gaps[j]; mid=(s+e)/2
    best[1][j]=(e-s)*3-abs(mid-exp[0])
for k in range(2,n):
    for j in range(G):
        s,e=gaps[j]; mid=(s+e)/2; sc=(e-s)*3-abs(mid-exp[k-1])
        for i in range(j):
            if best[k-1][i]>NEG and best[k-1][i]+sc>best[k][j]: best[k][j]=best[k-1][i]+sc; prev[k][j]=i
j=max(range(G),key=lambda j:best[n-1][j]); chosen=[]
k=n-1
while k>=1: chosen.append(j); j=prev[k][j]; k-=1
chosen=chosen[::-1]
bounds=[0.0]+[(gaps[c][0]+gaps[c][1])/2 for c in chosen]+[dur]
for i in range(n):
    a,b=bounds[i],bounds[i+1]; f=f"{prefix}-{i+1}.m4a"
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',wav,'-ss',f'{max(0,a):.2f}','-to',f'{b:.2f}','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.25','-c:a','aac','-b:a','96k',f],check=True)
    print(f"{f} {b-a:.1f}s (dự kiến {(dur-speech_start)*w[i]/tot:.1f}s)")
