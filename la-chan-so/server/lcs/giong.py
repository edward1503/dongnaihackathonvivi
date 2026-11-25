"""Đọc một câu của nhân vật gọi video bằng giọng Gemini, rồi lọc rẹt (đường POST /api/roleplay/speak).

Chuyển từ android/doc_giong.py của Mảng 4 sang máy chủ chung, giữ nguyên cách làm:
- giọng và lời dặn giọng lấy từ prototype/nhan-vat.json; app chỉ gửi MÃ nhân vật;
- cắt cụm nhiễu ở đuôi tiếng Gemini, rồi đúng chuỗi ffmpeg đã dùng cho các câu thu sẵn;
- tiếng dài bất thường so với số chữ (dấu hiệu máy đọc lẫn lời dặn) thì bỏ, để app dùng câu thu sẵn.
"""
import array
import asyncio
import base64
import json
import math
import shutil
import subprocess
from pathlib import Path

import httpx

from . import config

LCS_ROOT = Path(__file__).resolve().parents[2]
LOC = ("volume=-3dB,highpass=f=70,adeclick,afftdn=nr=10:nf=-55:tn=1,silenceremove=start_periods=1:start_threshold=-45dB,"
       "areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.04,areverse,afade=t=in:d=0.02,alimiter=limit=0.9")
LAN_DAN = "Giọng nữ trẻ miền Nam, nhẹ nhàng, tự nhiên như đang gọi video hỏi ý kiến em họ, hơi lo lắng nhưng thân thiện, tốc độ vừa phải."
RATE = 24000


class CannotSpeak(Exception):
    pass


def tts_models() -> list[str]:
    raw = config.env("GEMINI_TTS_MODELS", "gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts")
    return [m.strip() for m in (raw or "").split(",") if m.strip()]


def character(code: str | None) -> tuple[str, str] | None:
    """(giọng, lời dặn) của nhân vật. Mã lạ thì None: không đọc bằng giọng người khác."""
    try:
        nv = json.loads((LCS_ROOT / "prototype" / "nhan-vat.json").read_text(encoding="utf-8")).get(str(code or "lan"))
        if isinstance(nv, dict) and nv.get("giong") and nv.get("loi_dan"):
            return nv["giong"], nv["loi_dan"]
    except (OSError, ValueError):
        pass
    return ("Aoede", LAN_DAN) if code in (None, "", "lan") else None


async def tts_pcm(text: str, voice: str, notes: str, timeout: float = 20) -> tuple[bytes, int] | None:
    """PCM16 một kênh từ Gemini TTS, hoặc None."""
    keys = config.gemini_keys()
    if not keys or not text.strip():
        return None
    body = {
        "contents": [{"parts": [{"text": "# DIRECTOR'S NOTES (không đọc phần này)\n" + notes
                                 + "\n\n# TRANSCRIPT (chỉ đọc phần dưới đây)\n" + text.strip()}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}},
    }
    async with httpx.AsyncClient() as client:
        for m in tts_models():
            for k in keys:
                try:
                    r = await client.post(f"{config.gemini_base()}/models/{m}:generateContent", json=body,
                                          headers={"x-goog-api-key": k}, timeout=timeout)
                    if r.status_code != 200:
                        continue
                    part = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
                    mt = part.get("mimeType", "")
                    rate = int(mt.split("rate=")[1].split(";")[0]) if "rate=" in mt else RATE
                    return base64.b64decode(part["data"]), rate
                except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
                    continue
    return None


def cut_tail_noise(pcm: bytes, rate: int) -> bytes:
    """Cắt cụm nhiễu "rẹt rẹt" ở đuôi tiếng Gemini (đo của Mảng 4, 25/11/2026): đi lùi từ cuối, gặp quãng lặng
    từ 100 ms (dưới −50 dB) mà phần sau nó ngắn (≤ 250 ms có tiếng) và có khung to hơn −9 dB thì cắt tại đầu quãng lặng."""
    a = array.array("h")
    a.frombytes(pcm[:len(pcm) // 2 * 2])
    w = rate // 100
    n = len(a) // w
    if n < 30:
        return pcm
    db = []
    for k in range(n):
        s = a[k * w:(k + 1) * w]
        db.append(20 * math.log10(max(1.0, math.sqrt(sum(x * x for x in s) / w)) / 32768))
    k = n - 1
    while k > max(20, n - 150):
        if db[k] < -50:
            start = k
            while start > 0 and db[start - 1] < -50:
                start -= 1
            loud = [j for j in range(k + 1, n) if db[j] > -40]
            if k - start + 1 >= 10 and loud and len(loud) <= 25 and max(db[j] for j in loud) > -9:
                return a[:min(len(a), (start + 6) * w)].tobytes()
            k = start - 1
        else:
            k -= 1
    return pcm


def clean(pcm: bytes, rate: int) -> tuple[bytes, int]:
    """Cắt nhiễu đuôi rồi lọc bằng ffmpeg, ra PCM16 24 kHz. Không có ffmpeg thì chỉ cắt nhiễu đuôi, giữ tần số gốc."""
    pcm = cut_tail_noise(pcm, rate)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return pcm, rate
    r = subprocess.run([ffmpeg, "-v", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-", "-af", LOC,
                        "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-"], input=pcm, capture_output=True, timeout=30)
    return (r.stdout, RATE) if r.returncode == 0 and r.stdout else (pcm, rate)


def too_long(pcm: bytes, text: str, rate: int = RATE) -> bool:
    """Ngắn dưới 0,1 giây (hỏng) hoặc dài bất thường so với số chữ."""
    seconds = len(pcm) / 2 / rate
    return seconds < 0.1 or seconds > len(text.split()) * 0.45 + 1.5


async def speak(text: str, code: str | None) -> dict:
    """{text, audio (PCM16 base64), sampleRate, seconds}. Ném CannotSpeak khi mã nhân vật lạ, thiếu khóa, hoặc tiếng hỏng."""
    text = " ".join(text.split())[:400]
    if not text:
        raise CannotSpeak("Câu trống")
    nv = character(code)
    if not nv:
        raise CannotSpeak("Không có nhân vật này")
    got = await tts_pcm(text, nv[0], nv[1])
    if not got:
        raise CannotSpeak("Chưa có khóa giọng đọc hoặc Gemini không trả tiếng")
    pcm, rate = await asyncio.to_thread(clean, *got)
    if too_long(pcm, text, rate):
        raise CannotSpeak("Tiếng dài bất thường, có thể máy đã đọc lẫn lời dặn")
    return {"text": text, "audio": base64.b64encode(pcm).decode(), "sampleRate": rate, "seconds": round(len(pcm) / 2 / rate, 2)}
