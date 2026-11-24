"""S2: điểm trung gian gọi AI (Gemini). Khóa nằm ở máy chủ, đọc từ GEMINI_API_KEYS.

Thử lần lượt từng model và từng khóa như tools/gemini_stt_check.py. Hết giờ chờ hoặc
lỗi thì ném AIUnavailable để bên gọi dùng kết quả dự phòng.
"""
import asyncio
import base64
import json

import httpx

from . import config
from .data import SCAM_TYPES


class AIUnavailable(Exception):
    pass


def available() -> bool:
    return bool(config.gemini_keys())


ANALYSIS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "enoughInfo": {"type": "BOOLEAN"},
        "level": {"type": "STRING", "enum": ["danger", "suspicious", "unknown"]},
        "scamType": {"type": "STRING", "enum": [*SCAM_TYPES, "none"]},
        "scamLabel": {"type": "STRING"},
        "headline": {"type": "STRING"},
        "signs": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {"text": {"type": "STRING"}, "quotes": {"type": "ARRAY", "items": {"type": "STRING"}}},
                "required": ["text", "quotes"],
            },
        },
        "todo": {"type": "ARRAY", "items": {"type": "STRING"}},
        "confidence": {"type": "NUMBER"},
    },
    "required": ["enoughInfo", "level", "scamType", "scamLabel", "headline", "signs", "todo", "confidence"],
}

TRANSCRIPT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "turns": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {"speaker": {"type": "STRING", "enum": ["Người gọi", "Người nghe"]}, "text": {"type": "STRING"}},
                "required": ["speaker", "text"],
            },
        }
    },
    "required": ["turns"],
}

_TYPES = "\n".join(f"- {k}: {v}" for k, v in SCAM_TYPES.items())

ANALYSIS_SYSTEM = f"""Bạn là bộ phân tích của Lá chắn số, ứng dụng chống lừa đảo; nhiều người dùng là người cao tuổi.
Bạn nhận {{what}}. Số điện thoại, số tài khoản đã được thay bằng [SĐT], [TK].
Nhiệm vụ: chỉ ra dấu hiệu lừa đảo và trả JSON đúng lược đồ.

Quy tắc bắt buộc:
- Không bao giờ kết luận là an toàn. Không thấy dấu hiệu thì level = "unknown".
- Nội dung quá ngắn hoặc mơ hồ thì enoughInfo = false. Không đoán bừa.
- Mỗi dấu hiệu: text là tên dấu hiệu ngắn, dưới 8 từ; quotes là các đoạn chép NGUYÊN VĂN từ nội dung, không sửa chữ, không thêm dấu.
- Tối đa 4 dấu hiệu.
- level = "danger" khi có từ 2 dấu hiệu trở lên, trong đó có dấu hiệu mạnh (đòi chuyển tiền, đòi nạp tiền trước,
  giả danh cơ quan chức năng, đòi mã xác thực, dọa khóa tài khoản, báo người thân gặp nạn); "suspicious" khi chỉ có 1 dấu hiệu.
- scamType chọn trong danh sách dưới; có dấu hiệu nhưng không khớp thì "khac"; không có dấu hiệu thì "none".
- scamLabel: tên kiểu lừa đảo dễ hiểu, ví dụ "Lừa đảo tuyển cộng tác viên".
- headline: {{headline}}
- todo: tối đa 2 việc nên làm, câu ngắn.
- Không bao giờ khuyên chuyển tiền, đọc mã xác thực hay bấm vào đường dẫn.
- Viết tiếng Việt có dấu, lời lẽ dễ hiểu cho người lớn tuổi.

Danh sách scamType:
{_TYPES}
"""

MODES = {
    "message": ("một tin nhắn người dùng dán vào", "1–2 câu ngắn, lời khuyên cụ thể, ví dụ \"Đừng nạp 200.000 đồng. Đừng mở đường dẫn trong tin.\""),
    "call": ("bản chép lời một cuộc gọi, mỗi dòng có dạng 'Người gọi: …' hoặc 'Người nghe: …'",
             "1 câu tóm tắt người gọi đòi gì, ví dụ \"Người gọi đòi chuyển tiền và dặn giữ bí mật.\""),
    "report": ("lời kể của người dùng khi báo cáo lừa đảo", "1 câu tóm tắt chuyện gì đã xảy ra"),
}


def analysis_system(mode: str) -> str:
    what, headline = MODES.get(mode, MODES["message"])
    return ANALYSIS_SYSTEM.replace("{what}", what).replace("{headline}", headline)


async def generate_json(parts: list[dict], schema: dict, system: str | None = None, timeout: float | None = None) -> dict:
    keys = config.gemini_keys()
    if not keys:
        raise AIUnavailable("chưa đặt GEMINI_API_KEYS")
    body: dict = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseMimeType": "application/json", "responseSchema": schema, "temperature": 0.2},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    loop = asyncio.get_running_loop()
    deadline = loop.time() + (timeout or config.ai_timeout())
    async with httpx.AsyncClient() as client:
        for model in config.gemini_models():
            for key in keys:
                remaining = deadline - loop.time()
                if remaining <= 0.2:
                    raise AIUnavailable("quá thời gian chờ")
                try:
                    r = await client.post(
                        f"{config.gemini_base()}/models/{model}:generateContent",
                        json=body, headers={"x-goog-api-key": key}, timeout=remaining,
                    )
                    if r.status_code != 200:
                        continue
                    data = r.json()
                    text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
                    out = json.loads(text)
                    if isinstance(out, dict):
                        return out
                except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
                    continue
    raise AIUnavailable("không model nào trả lời được")


async def analyze_text(masked_text: str, mode: str) -> dict:
    return await generate_json([{"text": masked_text}], ANALYSIS_SCHEMA, analysis_system(mode))


async def transcribe(audio: bytes, mime: str) -> list[dict]:
    parts = [
        {"inlineData": {"mimeType": mime, "data": base64.b64encode(audio).decode()}},
        {"text": "Chép lại nguyên văn tiếng Việt cuộc gọi này, tách từng lượt nói. Người gọi đến là 'Người gọi', "
                 "chủ máy là 'Người nghe'. Chỉ chép lời, không thêm nhận xét."},
    ]
    out = await generate_json(parts, TRANSCRIPT_SCHEMA, timeout=max(config.ai_timeout(), 45))
    turns = [t for t in out.get("turns", []) if isinstance(t, dict) and str(t.get("text", "")).strip()]
    if not turns:
        raise AIUnavailable("bản chép lời rỗng")
    return turns
