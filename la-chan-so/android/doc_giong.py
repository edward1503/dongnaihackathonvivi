"""Đọc một câu bằng giọng Gemini rồi lọc rẹt bằng đúng chuỗi ffmpeg đã dùng cho các câu thu sẵn (tools/loc-giong.py).
Dùng bởi may-chu-gia.py (đường /api/roleplay/speak). Điện thoại không có ffmpeg nên việc lọc kỹ làm ở máy chủ; app chỉ nhận tiếng đã sạch.
Đo 25/11/2026: trong chuỗi lọc, bước khử click (adeclick) làm gần hết việc, nó gỡ khoảng 6% năng lượng dải 4–12 kHz, đúng chỗ nghe ra tiếng rẹt.
Khóa lấy từ biến môi trường GEMINI_API_KEYS (nhiều khóa cách nhau bằng dấu phẩy), không in ra, không gửi cho app."""
import base64, json, os, subprocess, urllib.request

LOC = "volume=-3dB,highpass=f=70,adeclick,afftdn=nr=10:nf=-55:tn=1,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.04,areverse,afade=t=in:d=0.02,alimiter=limit=0.9"
DAN = "Giọng nữ trẻ miền Nam, nhẹ nhàng, tự nhiên như đang gọi video hỏi ý kiến em họ, hơi lo lắng nhưng thân thiện, tốc độ vừa phải."


def cat_nhieu_duoi(pcm, rate):
    """Cắt cụm nhiễu ở đuôi tiếng Gemini. Đo 25/11/2026 trên 7 câu: câu NÀO cũng kết thúc bằng cùng một kiểu, sau khi lời đã dứt
    0,2 đến 0,8 giây thì có 40 ms nhiễu rất to, lặng 30 ms, rồi 90 ms nhiễu rất to (−2 đến −7 dB). Nghe là "rẹt rẹt" cuối mỗi câu.
    Câu thu sẵn không dính vì được cắt từ một lượt dài. Cách nhận: đi lùi từ cuối, gặp một quãng lặng từ 100 ms (dưới −50 dB) mà phần
    phía sau nó ngắn (không quá 250 ms có tiếng) và có khung to hơn −9 dB thì phần đó là nhiễu: cắt tại đầu quãng lặng, chừa 60 ms."""
    import array, math
    a = array.array("h"); a.frombytes(pcm[:len(pcm) // 2 * 2]); w = rate // 100; n = len(a) // w
    if n < 30:
        return pcm
    db = []
    for k in range(n):
        s = a[k * w:(k + 1) * w]; db.append(20 * math.log10(max(1.0, math.sqrt(sum(x * x for x in s) / w)) / 32768))
    k = n - 1
    while k > max(20, n - 150):
        if db[k] < -50:
            dau = k
            while dau > 0 and db[dau - 1] < -50:
                dau -= 1
            sau = [j for j in range(k + 1, n) if db[j] > -40]
            if k - dau + 1 >= 10 and sau and len(sau) <= 25 and max(db[j] for j in sau) > -9:
                return a[:min(len(a), (dau + 6) * w)].tobytes()
            k = dau - 1
        else:
            k -= 1
    return pcm


def co_khoa():
    return bool(os.environ.get("GEMINI_API_KEYS", "").strip())


def nhan_vat(ma):
    """Giọng và lời dặn của một nhân vật gọi video, lấy từ prototype/nhan-vat.json của chính máy chủ (app chỉ gửi MÃ nhân vật, không gửi lời dặn).
    Không có mã, hoặc mã là "lan": dùng chị Lan như trước khi có nhiều nhân vật. Mã khác mà tra không ra (máy chủ thiếu tệp, mã lạ) thì trả None:
    đọc bằng giọng khác rồi để app lưu nhầm dưới tên giọng của nhân vật thì kho giọng trên máy sẽ sai lâu dài."""
    try:
        nv = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "prototype", "nhan-vat.json"), encoding="utf-8")).get(str(ma))
        if isinstance(nv, dict) and nv.get("giong") and nv.get("loi_dan"):
            return nv["giong"], nv["loi_dan"]
    except Exception:
        pass
    return ("Aoede", DAN) if ma in (None, "", "lan") else None


def doc(chu, giong="Aoede", cho=20, dan=DAN):
    """Trả về {"chu", "pcm" (PCM16 24 kHz, base64), "tanSo", "giay"} hoặc None (thiếu khóa, lỗi mạng, tiếng dài bất thường)."""
    keys = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", "").split(",") if k.strip()]
    chu = chu.strip()
    if not keys or not chu:
        return None
    base = (os.environ.get("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
    than = {"contents": [{"parts": [{"text": "# DIRECTOR'S NOTES (không đọc phần này)\n" + dan + "\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n" + chu}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": giong}}}}}
    pcm = None; loi = ""
    for m in ["gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview", "gemini-3.8-flash-tts"]:   # thử lại model chính một lần nữa nếu cả hai cùng hỏng
        for k in keys:
            try:
                r = json.loads(urllib.request.urlopen(urllib.request.Request(f"{base}/models/{m}:generateContent", data=json.dumps(than).encode(),
                    headers={"Content-Type": "application/json", "x-goog-api-key": k}), timeout=cho).read())
                d = r["candidates"][0]["content"]["parts"][0]["inlineData"]
                pcm = base64.b64decode(d["data"]); mt = d.get("mimeType", ""); rate = int(mt.split("rate=")[1].split(";")[0]) if "rate=" in mt else 24000
                break
            except Exception as e:
                loi = type(e).__name__ + " " + str(getattr(e, "code", ""))
                continue
        if pcm:
            break
    if not pcm:
        print("   Gemini không trả tiếng:", loi)
        return None
    tho = pcm
    pcm = cat_nhieu_duoi(pcm, rate)
    sach = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-", "-af", LOC, "-f", "s16le", "-ar", "24000", "-ac", "1", "-"],
                          input=pcm, capture_output=True).stdout
    # Đo SAU khi đã cắt lặng hai đầu: dài bất thường so với số tiếng thì nhiều khả năng máy đã đọc luôn lời dặn (câu ngắn được nới rộng).
    if len(sach) < 4800 or len(sach) / 2 / 24000 > len(chu.split()) * 0.45 + 1.5:
        print(f"   bỏ tiếng dài bất thường: {len(sach) / 2 / 24000:.1f} giây cho {len(chu.split())} tiếng")
        return None
    # Lưu lại tiếng đã phát (bản thô và bản đã lọc) khi đặt LCS_LUU_TIENG=<thư mục>, để kiểm lại đúng những câu người dùng đã nghe
    # thay vì phải gọi Gemini tạo câu mới.
    luu = os.environ.get("LCS_LUU_TIENG")
    if luu:
        try:
            import time
            os.makedirs(luu, exist_ok=True); ten = time.strftime("%H%M%S") + "-" + "-".join(chu.split()[:4]).replace("/", "")
            open(os.path.join(luu, ten + ".tho.pcm"), "wb").write(tho); open(os.path.join(luu, ten + ".loc.pcm"), "wb").write(sach)
        except Exception:
            pass
    return {"chu": chu, "pcm": base64.b64encode(sach).decode(), "tanSo": 24000, "giay": round(len(sach) / 2 / 24000, 2)}
