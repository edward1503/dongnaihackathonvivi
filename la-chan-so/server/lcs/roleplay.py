"""Gọi video khuyên chị Lan (A11h): AI đóng vai chị Lan, chấm lời khuyên theo 4 ý (KICH-BAN-THOAI.md mục 5).

Mỗi lượt: người học nói (chữ, hoặc tệp tiếng để AI chép lời) -> chấm 4 ý -> chị Lan đáp 1–2 câu đúng vai,
gợi về ý còn thiếu mà không nói thẳng đáp án -> đọc bằng giọng Gemini (Aoede).
Không có AI thì dùng bộ luật chấm và kịch bản dự phòng; 3 câu đã thu sẵn của chị Lan được dùng lại.

An toàn (KICH-BAN-THOAI.md mục 1): người học đọc ra một dãy số dài (giống mã, số tài khoản) thì dừng vai ngay.
"""
from __future__ import annotations

import base64
import re
import struct
import uuid

from . import ai, config
from .text import nfc

KEYS = [
    ("nap", "Đừng nạp tiền"),
    ("dauhieu", "Chỉ ra dấu hiệu"),
    ("xacminh", "Cách xác minh"),
    ("baocao", "Rủ báo cáo"),
]
LABEL = dict(KEYS)
TIP = {
    "nap": "khuyên chị đừng nạp tiền",
    "dauhieu": "chỉ ra dấu hiệu lừa",
    "xacminh": "chỉ chị cách xác minh",
    "baocao": "rủ chị báo cáo",
}
NUM = ["không", "một", "hai", "ba", "bốn"]
MAX_TURNS = 4

# Ba câu đã thu bằng Gemini TTS (giọng Aoede), đường dẫn tính từ thư mục prototype/
OPENING = {"text": "Em ơi, chị thấy trên mạng có chỗ tuyển cộng tác viên đặt đơn, lương năm trăm nghìn một ngày. "
                   "Họ bảo nạp trước hai trăm nghìn là làm được liền. Chị có nên làm không em?",
           "audio": "audio/chi-lan-1.m4a"}
WHY_LINE = {"text": "Ừ, chị chưa nạp. Mà sao em biết là lừa vậy?", "audio": "audio/chi-lan-2.m4a"}
THANKS_LINE = {"text": "Nhờ em mà chị không bị lừa. Chị báo cáo luôn, để người khác cũng biết nha.", "audio": "audio/chi-lan-3.m4a"}
# Câu dự phòng khi chưa có AI: mỗi câu gợi về một ý còn thiếu, không nói thẳng đáp án
NUDGE = {
    "nap": "Nhưng họ hứa hoàn tiền kèm hoa hồng mà em. Chị nạp thử hai trăm nghìn được không?",
    "dauhieu": WHY_LINE["text"],
    "xacminh": "Vậy muốn biết chỗ đó thật hay giả, chị nên làm sao hả em?",
    "baocao": "Ừ, chị không nạp nữa. Mà làm sao để người khác khỏi bị giống chị?",
}
STOP_LINE = "Bạn ơi, đây là trò chơi thôi. Đừng bao giờ đọc số thật cho ai nhé."

PATTERNS = {
    "nap": re.compile(r"(đừng|không|ko|chớ|khoan|thôi)\s*(có\s*|nên\s*|được\s*|vội\s*)*(nạp|chuyển|gửi|đóng|đưa)", re.I),
    "dauhieu": re.compile(r"lương cao|thu nhập cao|cao bất thường|bất thường|nạp (tiền )?trước|bắt nạp|đòi nạp|đòi tiền trước|"
                          r"giục|gấp|làm liền|ngay lập tức|việc nhẹ|mồi|chiêu|dấu hiệu|hoàn tiền", re.I),
    "xacminh": re.compile(r"\btra\b|tra cứu|kiểm tra|xác minh|tìm hiểu|hỏi (ý kiến |thử )?(bố|mẹ|ba|má|người lớn|người nhà|cô|thầy|anh|chị|công an)|"
                          r"tên công ty|giấy phép|địa chỉ|đường dẫn lạ|không bấm|đừng bấm|lá chắn kiểm tra", re.I),
    "baocao": re.compile(r"báo cáo|báo (cho )?lá chắn|báo (cho )?công an|tố cáo|báo (cho )?mọi người|báo số|báo cho cộng đồng|cảnh báo (cho )?(mọi|người)", re.I),
}
DIGITS_RE = re.compile(r"(?:\d[\s.\-]?){6,}")

ROLE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "keys": {
            "type": "OBJECT",
            "properties": {k: {"type": "BOOLEAN"} for k, _ in KEYS},
            "required": [k for k, _ in KEYS],
        },
        "reply": {"type": "STRING"},
        "end": {"type": "BOOLEAN"},
    },
    "required": ["keys", "reply", "end"],
}

ROLE_SYSTEM = """Bạn đóng vai chị Lan, khoảng 28 tuổi, chị họ của người học (một học sinh). Đây là trò chơi luyện tập
chống lừa đảo trong ứng dụng Lá chắn số, có nhãn "AI đóng vai".

Tình huống: chị Lan thấy trên mạng tuyển cộng tác viên đặt đơn, lương năm trăm nghìn một ngày, họ bảo nạp trước
hai trăm nghìn là làm được liền. Chị gọi video hỏi ý kiến em. Chị hơi muốn làm, nhưng biết nghe lời.

Mỗi lượt bạn nhận lời em vừa nói và danh sách ý em ĐÃ đạt. Bạn làm hai việc:
1. Chấm lời em vừa nói theo 4 ý (true nếu lời này thể hiện ý đó, kể cả nói khác chữ):
   - nap: khuyên chị đừng nạp tiền, đừng chuyển tiền
   - dauhieu: chỉ ra dấu hiệu lừa (lương cao bất thường, đòi nạp tiền trước, giục làm ngay, trả tiền nhỏ để làm mồi)
   - xacminh: chỉ cách xác minh (tra tên công ty, hỏi người lớn hoặc người nhà, không bấm đường dẫn lạ)
   - baocao: rủ chị báo cáo cho Lá chắn hoặc báo cho mọi người
2. Trả lời đúng vai chị Lan:
   - Xưng "chị", gọi "em". Nói như người thật trò chuyện, tối đa 2 câu, khoảng 30 chữ.
   - Nếu còn ý chưa đạt: hỏi lại hoặc tỏ ra còn phân vân để gợi về MỘT ý còn thiếu, KHÔNG nói thẳng đáp án.
   - Nếu đã đạt từ 3 ý trở lên, hoặc đây là lượt cuối: cảm ơn em, nói chị sẽ không nạp và sẽ báo cáo; đặt end = true.
   - Không dùng dấu hai chấm, chấm phẩy, gạch dài. Viết số bằng chữ. Không dùng tiếng Anh, không viết tắt.
   - Không bao giờ nói số tài khoản, số điện thoại, đường dẫn thật. Không hỏi thông tin thật của em.
   - Không bày chiêu lừa mới, không hướng dẫn cách lừa.
"""


class Session:
    def __init__(self) -> None:
        self.id = "rp_" + uuid.uuid4().hex[:10]
        self.keys: set[str] = set()
        self.turns: list[dict] = []
        self.used: set[str] = set()
        self.ended = False


SESSIONS: dict[str, Session] = {}


def keys_view(s: Session) -> list[dict]:
    return [{"key": k, "label": label, "ok": k in s.keys} for k, label in KEYS]


def grade_rules(text: str) -> set[str]:
    t = nfc(text).lower()
    return {k for k, p in PATTERNS.items() if p.search(t)}


def summary(s: Session) -> str:
    n = len(s.keys)
    missing = [k for k, _ in KEYS if k not in s.keys]
    if not missing:
        return "Bạn khuyên chị Lan đủ cả bốn ý. Giỏi lắm, chị Lan không bị lừa rồi nha."
    return f"Bạn khuyên chị Lan được {NUM[n]} trên bốn ý. Lần sau nhớ {TIP[missing[0]]} nha."


def start() -> dict:
    s = Session()
    SESSIONS[s.id] = s
    s.turns.append({"who": "chi-lan", "text": OPENING["text"]})
    return {"sessionId": s.id, "line": {"speaker": "chi-lan", **OPENING, "end": False}, "keys": keys_view(s), "score": 0}


def _script_reply(s: Session, learner_turns: int) -> dict:
    missing = [k for k, _ in KEYS if k not in s.keys]
    if len(s.keys) >= 3 or learner_turns >= MAX_TURNS:
        if "baocao" in s.keys or not missing:
            return {**THANKS_LINE, "end": True}
        return {"text": "Cảm ơn em nha, chị không nạp nữa đâu. Để chị hỏi thêm người nhà cho chắc.", "audio": None, "end": True}
    for k in missing:
        line = NUDGE[k]
        if line not in s.used:
            return {"text": line, "audio": WHY_LINE["audio"] if line == WHY_LINE["text"] else None, "end": False}
    return {"text": "Vậy em nói thêm cho chị nghe với.", "audio": None, "end": False}


async def _ai_turn(s: Session, text: str, learner_turns: int) -> dict | None:
    history = "\n".join(f"{'Chị Lan' if t['who'] == 'chi-lan' else 'Em'}: {t['text']}" for t in s.turns[-8:])
    prompt = (f"Hội thoại tới giờ:\n{history}\n\nLời em vừa nói: {text}\n"
              f"Ý em đã đạt từ trước: {', '.join(sorted(s.keys)) or 'chưa có'}\n"
              f"Đây là lượt thứ {learner_turns} trên tối đa {MAX_TURNS}.")
    try:
        out = await ai.generate_json([{"text": prompt}], ROLE_SCHEMA, ROLE_SYSTEM)
    except ai.AIUnavailable:
        return None
    reply = str(out.get("reply") or "").strip()
    if not reply or DIGITS_RE.search(reply):
        return None
    got = {k for k, v in (out.get("keys") or {}).items() if v and k in LABEL}
    return {"keys": got, "text": reply[:240], "end": bool(out.get("end"))}


async def turn(session_id: str, text: str) -> dict:
    s = SESSIONS.get(session_id)
    if not s:
        raise KeyError(session_id)
    text = nfc(text).strip()
    if s.ended:
        return {"heard": text, "line": None, "keys": keys_view(s), "score": len(s.keys), "gained": [], "end": True, "source": "script"}

    if DIGITS_RE.search(text):
        s.ended = True
        return {"heard": "(đã ẩn dãy số)", "line": {"speaker": "benai", "text": STOP_LINE, "audio": None, "end": True},
                "keys": keys_view(s), "score": len(s.keys), "gained": [], "end": True, "source": "safety"}

    s.turns.append({"who": "em", "text": text})
    learner_turns = sum(1 for t in s.turns if t["who"] == "em")
    before = set(s.keys)
    s.keys |= grade_rules(text)

    source = "script"
    ai_out = await _ai_turn(s, text, learner_turns) if ai.available() else None
    if ai_out:
        s.keys |= ai_out["keys"]
        line = {"text": ai_out["text"], "audio": None, "end": ai_out["end"] or learner_turns >= MAX_TURNS}
        source = "ai"
    else:
        line = _script_reply(s, learner_turns)
    s.used.add(line["text"])
    s.turns.append({"who": "chi-lan", "text": line["text"]})
    if line["end"]:
        s.ended = True

    # Giọng: câu đã thu sẵn thì dùng tệp có sẵn; câu mới thì đọc bằng Gemini (nếu có khóa)
    if not line.get("audio") and ai.available():
        wav = await tts(line["text"])
        if wav:
            line["audio"] = "data:audio/wav;base64," + base64.b64encode(wav).decode()

    return {"heard": text, "line": {"speaker": "chi-lan", **line}, "keys": keys_view(s), "score": len(s.keys),
            "gained": [k for k, _ in KEYS if k in s.keys and k not in before], "end": s.ended, "source": source}


def finish(session_id: str) -> dict:
    s = SESSIONS.get(session_id)
    if not s:
        raise KeyError(session_id)
    s.ended = True
    return {"score": len(s.keys), "total": len(KEYS), "keys": keys_view(s), "summary": summary(s)}


# ---------------- Giọng chị Lan (Gemini TTS, giọng Aoede) ----------------

TTS_STYLE = ("Lan, một cô gái Việt khoảng 28 tuổi, giọng miền Nam nhẹ nhàng, nói tự nhiên như đang gọi video "
             "hỏi ý kiến em họ, hơi lo lắng nhưng thân thiện, tốc độ vừa phải.")


def pcm_to_wav(pcm: bytes, rate: int = 24000) -> bytes:
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
    return header + b"data" + struct.pack("<I", len(pcm)) + pcm


async def tts(text: str) -> bytes | None:
    """Giọng chị Lan (Aoede) cho câu AI viết, đã cắt nhiễu đuôi và lọc như câu thu sẵn (giong.py)."""
    import asyncio

    from . import giong

    got = await giong.tts_pcm(text, "Aoede", TTS_STYLE)
    if not got:
        return None
    pcm, rate = await asyncio.to_thread(giong.clean, *got)
    return pcm_to_wav(pcm, rate)
