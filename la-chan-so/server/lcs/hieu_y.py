"""Hiểu ý một lượt của người học trong cuộc gọi video với chị Lan (đường POST /api/roleplay/intent).

Chuyển từ android/hieu_y.py của Mảng 4 sang máy chủ chung, giữ nguyên luật và lời nhắc:
- lời nhắc dùng chung với app Android: prototype/hieu-y-loi-nhac.txt;
- ý định và câu của chị Lan: prototype/loi-chi-lan.json;
- mô hình chỉ PHÂN LOẠI (ý định + ý được chấm kèm bằng chứng nguyên văn), không viết lời cho chị Lan.

Mô hình: OpenAI nếu đặt OPENAI_API_KEY (như máy chủ giả của Mảng 4), không thì Gemini.
Máy chủ thay mọi dãy từ 4 chữ số bằng ••• trước khi gửi, và không lưu lời người học.
"""
import json
import re
from functools import lru_cache
from pathlib import Path

import httpx

from . import ai, config

LCS_ROOT = Path(__file__).resolve().parents[2]
NHAN = ["nap", "dauhieu", "xacminh", "baocao"]
SAI = {"bao-cu-nap", "bao-thu-it", "bao-rut-lien", "khuyen-lieu-khac", "loi-trai-nhau", "tuy-chi", "khong-biet"}
DIGITS = re.compile(r"(?:\d[\s.\-]?){3,}\d")

GEMINI_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "y_dinh": {"type": "STRING"},
        "y_dung": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "nhan": {"type": "STRING", "enum": NHAN}, "bang_chung": {"type": "STRING"}}, "required": ["nhan", "bang_chung"]}},
        "can_hoi_lai": {"type": "BOOLEAN"},
        "xin_dung": {"type": "BOOLEAN"},
        "ngoai_kich_ban": {"type": "BOOLEAN"},
    },
    "required": ["y_dinh", "y_dung", "can_hoi_lai", "xin_dung", "ngoai_kich_ban"],
}
OPENAI_SCHEMA = {"name": "hieu_y", "strict": True, "schema": {
    "type": "object", "additionalProperties": False, "required": GEMINI_SCHEMA["required"],
    "properties": {
        "y_dinh": {"type": "string"},
        "y_dung": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["nhan", "bang_chung"],
                                               "properties": {"nhan": {"type": "string", "enum": NHAN}, "bang_chung": {"type": "string"}}}},
        "can_hoi_lai": {"type": "boolean"}, "xin_dung": {"type": "boolean"}, "ngoai_kich_ban": {"type": "boolean"}}}}


class SceneUnsupported(Exception):
    pass


class DataMissing(Exception):
    pass


@lru_cache(maxsize=1)
def _bundle() -> dict:
    try:
        bo = json.loads((LCS_ROOT / "prototype" / "loi-chi-lan.json").read_text(encoding="utf-8"))
        system = (LCS_ROOT / "prototype" / "hieu-y-loi-nhac.txt").read_text(encoding="utf-8").strip()
    except (OSError, ValueError) as e:
        raise DataMissing("Máy chủ thiếu bộ lời của chị Lan (prototype/loi-chi-lan.json, hieu-y-loi-nhac.txt)") from e
    intents = [(y["id"], y["mo_ta"]) for y in bo["y_dinh"] if not y["id"].startswith(("im-lan", "nghe-lo"))]
    return {
        "system": system,
        "intents": intents,
        "scores": {y["id"]: y.get("cham") or [] for y in bo["y_dinh"]},
        "lines": {x["id"]: x["chu"] for x in bo["loi"]},
    }


def hide_digits(text: str) -> str:
    return DIGITS.sub("•••", text)


def user_prompt(text: str, last_line: str, scored: list[str]) -> str:
    b = _bundle()
    asked = b["lines"].get(last_line) or b["lines"].get("mo-dau", "")
    listing = "\n".join(f"- {i}: {m}" for i, m in b["intents"])
    return (f"Câu chị Lan vừa hỏi: \"{asked}\"\nCác ý đã chấm: {', '.join(scored) or 'chưa có'}\n"
            f"Danh sách ý định hợp lệ:\n{listing}\n\nLời học sinh: \"{text}\"")


async def ask_openai(system: str, user: str, timeout: float, schema: dict = OPENAI_SCHEMA) -> dict:
    key = config.env("OPENAI_API_KEY")
    base = (config.env("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
    body = {"model": config.env("OPENAI_MODEL") or "gpt-6-luna",
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {"type": "json_schema", "json_schema": schema}}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(base + "/chat/completions", json=body, timeout=timeout,
                                  headers={"Authorization": "Bearer " + str(key)})
        r.raise_for_status()
        return json.loads(r.json()["choices"][0]["message"]["content"])
    except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError) as e:
        raise ai.AIUnavailable("OpenAI không trả lời") from e


def available() -> bool:
    return bool(config.env("OPENAI_API_KEY")) or ai.available()


def interpret(j: dict, text: str) -> dict:
    """Lọc kết quả của mô hình như android/hieu_y.py: chỉ nhận ý có bằng chứng nguyên văn trong lời học sinh."""
    b = _bundle()
    valid = {i for i, _ in b["intents"]}
    intent = j.get("y_dinh") if j.get("y_dinh") in valid else None
    stop = bool(j.get("xin_dung"))
    if j.get("can_hoi_lai"):
        return {"ideas": [], "intent": "loi-trai-nhau", "wantsStop": stop, "offScript": False}
    if intent in SAI:   # khuyên sai hoặc nửa vời: lượt này không được ý nào
        return {"ideas": [], "intent": intent, "wantsStop": stop, "offScript": False}
    low = text.lower()
    ideas = [x["nhan"] for x in j.get("y_dung") or []
             if isinstance(x, dict) and x.get("nhan") in NHAN and str(x.get("bang_chung", "")).strip()
             and str(x["bang_chung"]).strip().lower().strip(" .,!?\"'") in low]
    ideas += b["scores"].get(intent, [])
    ideas = list(dict.fromkeys(ideas))
    return {"ideas": ideas, "intent": intent, "wantsStop": stop, "offScript": bool(j.get("ngoai_kich_ban")) and not ideas}


async def classify(scene: str, text: str, last_line: str = "mo-dau", scored: list[str] | None = None,
                   timeout: float = 6.0) -> dict:
    if (scene or "lan-2") != "lan-2":
        raise SceneUnsupported("Cảnh này chưa có bộ ý định")
    text = hide_digits(" ".join(str(text).split()))[:600]
    scored = [s for s in (scored or []) if s in NHAN][:4]
    system = _bundle()["system"]
    user = user_prompt(text, last_line or "mo-dau", scored)
    if config.env("OPENAI_API_KEY"):
        j = await ask_openai(system, user, timeout)
    else:
        j = await ai.generate_json([{"text": user}], GEMINI_SCHEMA, system, timeout=timeout)
    return interpret(j, text)
