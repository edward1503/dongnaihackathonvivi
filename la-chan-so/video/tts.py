"""Gọi Gemini TTS (Interactions API) cho một đoạn chữ, lưu WAV. Không in khóa.

    python out/video/tts.py --voice Charon --text-file loi-thoai.txt --out giong/charon.wav [--style "..."] [--model gemini-3.8-flash-tts]
"""
import argparse
import base64
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gemini_env import base, keys  # noqa: E402


def synth(text, voice, style, model):
    body = {
        "model": model,
        "input": [{"type": "user_input", "content": [{"type": "text", "text": text,
                                                      **({"annotations": [{"type": "speech_metadata", "style": style}]} if style else {})}]}],
        "response_format": {"type": "audio"},
        "generation_config": {"speech_config": [{"voice": voice}]},
    }
    root = base()
    url = (root if root.endswith("/v1beta") else root + "/v1beta") + "/interactions"
    last = None
    for i, key in enumerate(keys()):
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            last = f"HTTP {e.code}: {detail}"
            if e.code in (429, 500, 503) or e.code == 403:
                time.sleep(2)
                continue        # thử khóa kế tiếp
            raise SystemExit(last)
        for step in d.get("steps", []):
            if step.get("type") != "model_output":
                continue
            for c in step.get("content", []):
                if c.get("type") == "audio" and c.get("data"):
                    return base64.b64decode(c["data"]), c.get("mime_type") or c.get("mimeType"), i
        raise SystemExit("Không thấy âm thanh trong trả lời: " + json.dumps(d)[:400])
    raise SystemExit("Mọi khóa đều lỗi. Lỗi cuối: " + str(last))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True)
    ap.add_argument("--text")
    ap.add_argument("--text-file", type=Path)
    ap.add_argument("--style", default="")
    ap.add_argument("--model", default="gemini-3.8-flash-tts")
    ap.add_argument("--out", required=True, type=Path)
    a = ap.parse_args()
    text = a.text if a.text is not None else a.text_file.read_text(encoding="utf-8")
    t0 = time.time()
    audio, mime, key_index = synth(text.strip(), a.voice, a.style, a.model)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_bytes(audio)
    print(json.dumps({"voice": a.voice, "out": str(a.out), "bytes": len(audio), "mime": mime, "seconds": round(time.time() - t0, 1), "key": f"#{key_index + 1}"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
