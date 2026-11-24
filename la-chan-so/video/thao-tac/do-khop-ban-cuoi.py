import subprocess, sys, numpy as np
mp4, old = sys.argv[1], sys.argv[2]=="old"
# (bắt đầu, dài) của ba câu chị Lan trong video cuối; ROI miệng trong khung 1920x1080
segs = {"new": [(238.47,20.25),(266.78,3.73),(278.39,4.68)], "old": [(230.83,20.25),(259.29,3.73),(271.05,4.68)]}["old" if old else "new"]
x,y,w,h = 714,462,90,56
for t0,dur in segs:
    a, b = t0-1.0, dur+2.0
    raw = subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-t",str(b),"-i",mp4,"-vf",f"crop={w}:{h}:{x}:{y},format=gray","-f","rawvideo","-"],capture_output=True).stdout
    F = np.frombuffer(raw,np.uint8).reshape(-1,h,w).astype(np.float32)
    d = np.abs(np.diff(F,axis=0)).mean(axis=(1,2))
    pcm = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-t",str(b),"-i",mp4,"-vn","-ac","1","-ar","48000","-f","s16le","-"],capture_output=True).stdout,np.int16).astype(np.float32)/32768
    n = len(pcm)//1600; env = np.sqrt((pcm[:n*1600].reshape(n,1600)**2).mean(axis=1))
    m = min(len(d), n); best=None
    for lag in range(-18,19):   # lag>0: miệng chạy sau tiếng
        if lag>=0: u, v = d[lag:m], env[:m-lag]
        else: u, v = d[:m+lag], env[-lag:m]
        c = np.corrcoef(u,v)[0,1]
        if best is None or c>best[0]: best=(c,lag)
    voiced = env[:m] > 0.02
    print(f"t={t0}: miệng trễ so với tiếng {best[1]/30:+.3f} s (tương quan {best[0]:.2f}); cặp khung đổi hình lúc có tiếng {int(((d[:m]>0.35)&voiced).sum())}/{int(voiced.sum())}")
