"""Gemini TTS cho video thao tác: mỗi đoạn của nhom.txt là MỘT lượt thu dài (cả video cùng giọng, cùng lời dặn).

    python tao-giong-gemini-mot.py --script thao-tac/giong/v1/nhom.txt --name TT-v1

Ra: giong/<name>-doan/doan-NN.wav (PCM 16-bit, một kênh); đoạn đã có thì bỏ qua. Khóa đọc từ GEMINI_API_KEYS, không in.
Nhật ký mỗi lượt: giong/<name>-doan/goi.jsonl (số ký tự, model, giây, số thứ tự khóa).
"""
import argparse
import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent  # video/trailer
VOICE = os.environ.get("TTS_VOICE", "Kore")
MODELS = ["gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview"]
STYLE = ("Người dẫn trailer 90 giây giới thiệu một ứng dụng chống lừa đảo cho ban giám khảo một cuộc thi. Giọng nữ miền Nam, ấm, rõ, chắc, "
         "nhịp vừa phải và gọn, không kéo dài chữ. Ba câu đầu chậm hơn, trầm, hơi căng thẳng. Từ câu 'Lá chắn số' giọng sáng và tự tin dần. "
         "Đoạn nói về cộng đồng dứt khoát, tự hào. Câu tục ngữ đọc chậm, tròn chữ. Nghỉ khoảng nửa giây sau mỗi câu. "
         "Đọc đúng từng chữ trong phần TRANSCRIPT, không thêm, không bỏ chữ nào.")


def prompt(text):
    lines = re.sub(r"(?<=[.?!])\s+", "\n", text.strip())
    return f"# DIRECTOR'S NOTES (không đọc phần này)\n{STYLE}\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n{lines}\n"


def synth(text):
    keys = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", "").split(",") if k.strip()]
    base = (os.environ.get("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
    if not base.endswith("/v1beta"):
        base += "/v1beta"
    last = None
    for m in MODELS:
        for i, k in enumerate(keys):
            body = {"contents": [{"parts": [{"text": prompt(text)}]}],
                    "generationConfig": {"responseModalities": ["AUDIO"],
                                         "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
            req = urllib.request.Request(f"{base}/models/{m}:generateContent", data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json", "x-goog-api-key": k})
            try:
                r = json.loads(urllib.request.urlopen(req, timeout=int(os.environ.get("TTS_TIMEOUT", "600"))).read())
                part = r["candidates"][0]["content"]["parts"][0]["inlineData"]
                mt = part.get("mimeType", "")
                rate = int(mt.split("rate=")[1].split(";")[0]) if "rate=" in mt else 24000
                return base64.b64decode(part["data"]), rate, m, i, r["candidates"][0].get("finishReason")
            except urllib.error.HTTPError as e:
                last = f"{m} khóa #{i + 1}: HTTP {e.code}"
                print("lỗi", last, flush=True)
                time.sleep(1)
            except Exception as e:  # noqa: BLE001
                last = f"{m} khóa #{i + 1}: {type(e).__name__}"
                print("lỗi", last, flush=True)
    raise SystemExit("Mọi khóa đều lỗi. Lỗi cuối: " + str(last))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", type=Path, required=True)
    ap.add_argument("--name", required=True)
    a = ap.parse_args()
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", a.script.read_text(encoding="utf-8").strip()) if p.strip()]
    folder = HERE / "giong" / f"{a.name}-doan"
    folder.mkdir(parents=True, exist_ok=True)
    for i, text in enumerate(paras):
        out = folder / f"doan-{i + 1:02d}.wav"
        if out.exists():
            continue
        t0 = time.time()
        pcm, rate, model, key, finish = synth(text)
        with wave.open(str(out), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
        row = {"doan": i + 1, "chars": len(text), "model": model, "voice": VOICE, "key": f"#{key + 1}", "finish": finish,
               "audio_s": round(len(pcm) / 2 / rate, 1), "call_s": round(time.time() - t0, 1)}
        with open(folder / "goi.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(json.dumps(row, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
