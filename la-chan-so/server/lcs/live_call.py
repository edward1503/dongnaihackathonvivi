"""One live roleplay turn, scored and voiced using the scene's phone contract."""
import asyncio
import base64
import hashlib
import json
import logging
import re
import subprocess
from functools import lru_cache
from time import perf_counter
from weakref import WeakValueDictionary

from . import ai, config, giong, hieu_y
from .contract import LiveTurnIn
from .result_cache import CACHE_ROOT, store_result

PROTOTYPE = giong.LCS_ROOT / "prototype"
CACHE = CACHE_ROOT / "live"
_turn_locks = WeakValueDictionary()


class InvalidTurn(ValueError):
    pass


@lru_cache(maxsize=32)
def load_scene(name):
    path = PROTOTYPE / "canh" / (name + ".json")
    if not path.is_file():
        raise InvalidTurn("Không có cảnh này")
    scene = json.loads(path.read_text())
    if not scene.get("song"):
        raise InvalidTurn("Cảnh này không có lượt trực tiếp")
    return scene


def schema_for(labels, field):
    evidence = {"type": "object", "additionalProperties": False, "required": ["nhan", "bang_chung"],
                "properties": {"nhan": {"type": "string", "enum": labels}, "bang_chung": {"type": "string"}}}
    properties = {"y_dung": {"type": "array", "items": evidence}, "khuyen_sai": {"type": "boolean"},
                  field: {"type": "string"}, "ket_thuc": {"type": "boolean"}}
    return {"name": "luot_song", "strict": True, "schema": {"type": "object", "additionalProperties": False,
            "required": list(properties), "properties": properties}}


def interpret(reply, field, labels, scored, last):
    line = reply[field].strip().strip('"“”')
    if not 2 <= len(line.split()) <= 45 or re.search(r"[0-9;()\[\]/@]|https?|www", line):
        raise ai.AIUnavailable("Lời nhân vật không hợp lệ")
    wrong, end, evidence = reply["khuyen_sai"], reply["ket_thuc"], reply["y_dung"]
    if not isinstance(wrong, bool) or not isinstance(end, bool) or not isinstance(evidence, list):
        raise ai.AIUnavailable("Kết quả chấm không hợp lệ")
    accepted = []
    rejected = False
    punctuation = " .,!?\"'"
    last = last.lower()
    if not wrong:
        for item in evidence:
            label = item["nhan"]
            if label not in labels or label in scored:
                continue
            quote = item["bang_chung"].strip().lower().strip(punctuation)
            if quote and quote in last and (len(quote) >= 4 or quote == last.strip().strip(punctuation)):
                if label not in accepted:
                    accepted.append(label)
            else:
                rejected = True
    complete = set(labels).issubset(set(scored).union(accepted))
    return {"chu": line, "y": accepted, "sai": wrong, "het": end and (not rejected or complete)}


def optional_mouth(pcm, rate, character, turn_id):
    try:
        from . import mouth
        avatar = json.loads((PROTOTYPE / "nhan-vat.json").read_text())[character]["avatar"]
        return mouth.build(pcm, rate, avatar, turn_id)
    except ImportError:
        return None
    except Exception:
        # A missing model or an encoder/runtime error must not discard playable speech.
        logging.getLogger(__name__).exception("Mouth build failed for %s", character)
        return None


async def generate(body, scene, turn_id):
    started = perf_counter()
    if not config.env("OPENAI_API_KEY"):
        raise ai.AIUnavailable("Chưa có khóa OpenAI")
    song = scene["song"]
    system = (PROTOTYPE / song["loi_nhac"]).read_text().strip()
    prompt = f"Các ý đã chấm: {', '.join(body.scored) or 'chưa có'}\nCuộc trò chuyện tới giờ:\n"
    for item in body.history:
        speaker = song["ten_nh"] if item.ai == song["ai_nh"] else song["ten_nv"]
        prompt += f"{speaker}: {hieu_y.hide_digits(item.chu)[:500]}\n"
    labels = [idea["id"] for idea in scene["y"]]
    field = song["truong_loi"]
    reply = await hieu_y.ask_openai(system, prompt, 9, schema_for(labels, field))
    result = interpret(reply, field, labels, body.scored, body.history[-1].chu)
    voiced_at = perf_counter()
    character = scene["nhan_vat"]
    voice = giong.character(character)
    if not voice:
        raise giong.CannotSpeak("Không có giọng cho nhân vật")
    audio = await giong.voiced(result["chu"], voice[0], song.get("loi_dan") or voice[1])   # đọc lặp thì đọc lại một lần
    if not audio or audio[1] < 100 or not audio[0] or len(audio[0]) % 2:
        raise giong.CannotSpeak("Tiếng không hợp lệ hoặc dài bất thường hai lần liền")
    pcm, rate = audio
    mouth_at = perf_counter()
    mouth = await asyncio.to_thread(optional_mouth, pcm, rate, character, turn_id)
    finished = perf_counter()
    return {**result, "id": turn_id, "pcm": base64.b64encode(pcm).decode(), "tanSo": rate,
            "giay": len(pcm) / (2 * rate), "mouth": mouth,
            "timings": {"llm_ms": round((voiced_at - started) * 1000), "tts_ms": round((mouth_at - voiced_at) * 1000),
                        "mouth_ms": round((finished - mouth_at) * 1000), "total_ms": round((finished - started) * 1000)}}


async def live_turn(body: LiveTurnIn):
    try:
        scene = load_scene(body.scene)
        song = scene["song"]
        if (body.history[-1].ai != song["ai_nh"] or
                any(item.ai not in (song["ai_nh"], song["ai_nv"]) for item in body.history)):
            raise InvalidTurn("Lịch sử cuộc gọi không hợp lệ")
        digest = body.model_dump_json().encode()
        turn_id = hashlib.sha256(digest).hexdigest()[:16]
        path = CACHE / (turn_id + ".json")
        lock = _turn_locks.setdefault(turn_id, asyncio.Lock())
        async with lock:
            if path.is_file():
                return json.loads(await asyncio.to_thread(path.read_bytes))
            result = await generate(body, scene, turn_id)
            return await asyncio.to_thread(store_result, path, result)
    except InvalidTurn:
        raise
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.SubprocessError) as error:
        raise ai.AIUnavailable("Không tạo được lượt trực tiếp") from error
