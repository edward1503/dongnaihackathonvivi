import subprocess, re, sys, time
def dump():
    subprocess.run("adb shell uiautomator dump /sdcard/u.xml", shell=True, capture_output=True)
    s = subprocess.run("adb shell cat /sdcard/u.xml", shell=True, capture_output=True, text=True).stdout
    out = []
    for m in re.finditer(r'<node [^>]*?text="([^"]*)"[^>]*?content-desc="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', s):
        t = m.group(1) or m.group(2)
        if t.strip():
            a = list(map(int, m.groups()[2:]))
            out.append((t, (a[0]+a[2])//2, (a[1]+a[3])//2))
    return out
def tap(x, y): subprocess.run(f"adb shell input tap {x} {y}", shell=True)
def find(sub, nodes=None):
    nodes = nodes or dump()
    for t, x, y in nodes:
        if sub.lower() == t.lower(): return (t, x, y)
    for t, x, y in nodes:
        if sub.lower() in t.lower(): return (t, x, y)
if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "dump":
        for n in dump(): print(n)
    elif cmd == "tap":
        r = find(sys.argv[2]); print("tap", r)
        if r: tap(r[1], r[2])
        else: sys.exit(1)
    elif cmd == "taprow":   # bấm nút "Bật" cùng hàng với dòng có chữ
        nodes = dump(); r = find(sys.argv[2], nodes)
        if not r: print("khong thay"); sys.exit(1)
        bs = [n for n in nodes if n[0] == "Bật" and abs(n[2]-r[2]) < 160]
        print("row", r, bs)
        if bs: tap(bs[0][1], bs[0][2])
        else: sys.exit(2)
