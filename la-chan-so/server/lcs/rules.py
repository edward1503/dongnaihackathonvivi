"""Bộ luật nhận dấu hiệu lừa đảo chạy không cần AI.

Dùng làm kết quả dự phòng khi không gọi được AI, và làm mức sàn khi có AI
(AI không được hạ mức thấp hơn những gì luật đã thấy).
"""
import re
from dataclasses import dataclass

from .data import SCAM_TYPES

I = re.IGNORECASE


@dataclass(frozen=True)
class Rule:
    key: str
    pattern: re.Pattern
    text: str
    scam_type: str | None = None
    label: str | None = None


RULES = [
    Rule("police", re.compile(r"cán bộ điều tra|công an|viện kiểm sát|tòa án|vụ án rửa tiền|vụ án|rửa tiền", I),
         "Giả danh cơ quan chức năng", "gia_danh_cong_an", "Giả danh cơ quan chức năng"),
    Rule("accident", re.compile(r"tai nạn|cấp cứu|nhập viện|đang mổ", I),
         "Báo tin người thân gặp nạn", "nguoi_than_tai_nan", "Giả người thân gặp tai nạn"),
    Rule("electric", re.compile(r"tiền điện|cắt điện|điện lực", I),
         "Dọa cắt điện", "gia_dien_luc", "Giả nhân viên điện lực"),
    Rule("prize", re.compile(r"trúng thưởng|quà tri ân|nhận quà|tri ân khách hàng", I),
         "Hứa tặng quà, trúng thưởng", "qua_tri_an", "Giả chương trình tặng quà"),
    Rule("invest", re.compile(r"đầu tư[^.!?\n]{0,30}(?:lãi|lời|lợi nhuận)|lãi (?:suất )?\d+(?:[.,]\d+)?\s*%\s*(?:một |mỗi |/\s*)?(?:ngày|tuần|tháng)"
                              r"|lợi nhuận \d+\s*%|cam kết (?:lãi|lời|hoàn vốn)|bao lời|sàn (?:ngoại hối|forex|coin|tiền ảo)", I),
         "Hứa lãi cao bất thường", "dau_tu_lai_cao", "Lừa đảo đầu tư lãi cao"),
    Rule("income", re.compile(r"việc nhẹ lương cao(?:\s*\d+\s*k\s*/\s*ngày)?|lương cao|\d+\s*k\s*/\s*ngày|hoa hồng\s*\d+\s*%|thu nhập (?:cao|khủng)", I),
         "Hứa thu nhập cao bất thường", "viec_nhe_luong_cao", "Lừa đảo tuyển cộng tác viên"),
    Rule("prepay", re.compile(r"nạp (?:trước|tiền)(?:\s*\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|đồng|đ)\b)?|đóng phí|phí kích hoạt", I),
         "Đòi nạp tiền trước khi làm", "viec_nhe_luong_cao", "Lừa đảo tuyển cộng tác viên"),
    Rule("lock", re.compile(r"(?:sẽ )?bị khóa|tạm khóa|khóa tài khoản", I),
         "Dọa khóa tài khoản", "duong_dan_gia", "Giả ngân hàng, dẫn tới trang giả"),
    Rule("transfer", re.compile(r"chuyển (?:tiền|khoản)(?: vào tài khoản (?:tạm giữ|an toàn))?|tài khoản tạm giữ", I),
         "Đòi chuyển tiền"),
    Rule("otp", re.compile(r"(?:đọc|gửi|cung cấp|nhập)[^.!?\n]{0,20}(?:mã otp|otp|mã xác thực)", I),
         "Đòi mã xác thực (OTP)"),
    Rule("urgent", re.compile(r"(?:đăng ký )?trong hôm nay|trong 24 ?h|xác minh ngay|trong \d+ phút|số lượng có hạn|ngay lập tức", I),
         "Giục làm gấp"),
    Rule("secret", re.compile(r"không (?:được )?nói với ai|giữ bí mật|kể cả con cái", I),
         "Bắt giữ bí mật"),
    Rule("link", re.compile(r"\b(?:bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|s\.id|rb\.gy)/\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:top|xyz|click|info|icu|cyou)\b(?:/\S*)?", I),
         "Dùng đường dẫn rút gọn hoặc đường dẫn lạ", "duong_dan_gia", "Đường dẫn giả mạo"),
]

# Thứ tự chọn kiểu lừa đảo chính khi có nhiều dấu hiệu
TYPE_PRIORITY = ["police", "accident", "electric", "prize", "invest", "income", "prepay", "lock", "link"]

# Gộp hai dấu hiệu hay đi cùng nhau thành một dòng (khớp màn A04b, A05b)
MERGES = [
    (("urgent", "secret"), "Giục gấp, bắt giữ bí mật"),
    (("urgent", "link"), "Giục làm gấp, kèm đường dẫn lạ"),
]

STRONG = {"police", "prepay", "transfer", "otp", "lock", "accident", "electric"}


def _clean_quote(q: str) -> str:
    return q.strip().rstrip(".,;:!?")


def find(text: str) -> dict[str, list[str]]:
    hits: dict[str, list[str]] = {}
    for rule in RULES:
        quotes = []
        for m in rule.pattern.finditer(text):
            q = _clean_quote(m.group(0))
            if q and q not in quotes:
                quotes.append(q)
        if quotes:
            hits[rule.key] = quotes
    return hits


def _amount(quotes: list[str]) -> str | None:
    for q in quotes:
        m = re.search(r"(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|triệu)", q, I)
        if m:
            n = float(m.group(1).replace(",", "."))
            mult = 1_000_000 if m.group(2).lower() == "triệu" else 1_000
            return f"{int(n * mult):,}".replace(",", ".") + " đồng"
    return None


def analyze(text: str, mode: str = "message") -> dict:
    """Trả về dict gồm level, reason, scamType, scamLabel, headline, signs, todo, confidence."""
    hits = find(text)
    by_key = {r.key: r for r in RULES}

    signs: list[dict] = []
    used: set[str] = set()
    for keys, merged_text in MERGES:
        if all(k in hits for k in keys) and not (used & set(keys)):
            signs.append({"text": merged_text, "quotes": [q for k in keys for q in hits[k]], "_keys": keys})
            used |= set(keys)
    for rule in RULES:
        if rule.key in hits and rule.key not in used:
            signs.append({"text": rule.text, "quotes": hits[rule.key], "_keys": (rule.key,)})
            used.add(rule.key)
    # Sắp theo thứ tự luật để dòng dấu hiệu ổn định giữa các lần gọi
    order = {r.key: i for i, r in enumerate(RULES)}
    signs.sort(key=lambda s: min(order[k] for k in s["_keys"]))

    primary = next((k for k in TYPE_PRIORITY if k in hits), None)
    scam_type = by_key[primary].scam_type if primary else None
    scam_label = by_key[primary].label if primary else None

    strong = len(STRONG & set(hits))
    if len(signs) >= 2 and (strong >= 1 or len(signs) >= 3):
        level, confidence = "danger", 0.7
    elif signs:
        level, confidence = "suspicious", 0.55
    else:
        level, confidence = "unknown", 0.4

    reason = "insufficient" if not signs else None
    if level != "unknown" and scam_type is None:
        scam_type, scam_label = "khac", SCAM_TYPES["khac"]

    headline = _headline(hits, mode, level)
    todo = _todo(hits, mode, level)
    for s in signs:
        s.pop("_keys", None)
        s["quotes"] = s["quotes"][:4]
    return {
        "level": level, "reason": reason, "scamType": scam_type, "scamLabel": scam_label,
        "headline": headline, "signs": signs[:4], "todo": todo, "confidence": confidence,
    }


def _headline(hits: dict, mode: str, level: str) -> str:
    if not hits:
        if mode == "call":
            return "Chưa đủ thông tin để kết luận."
        return "Tin nhắn quá ngắn. AI không đoán bừa."
    if mode == "call":
        if "transfer" in hits and "secret" in hits:
            return "Người gọi đòi chuyển tiền và dặn giữ bí mật."
        if "transfer" in hits:
            return "Người gọi đòi chuyển tiền."
        if "otp" in hits:
            return "Người gọi đòi mã xác thực (OTP)."
        if "police" in hits:
            return "Người gọi tự xưng cơ quan chức năng."
        return "Cuộc gọi có dấu hiệu lừa đảo."
    parts = []
    if "prepay" in hits:
        amt = _amount(hits["prepay"])
        parts.append(f"Đừng nạp {amt}." if amt else "Đừng nạp tiền.")
    elif "transfer" in hits or "police" in hits or "accident" in hits:
        parts.append("Đừng chuyển tiền.")
    if "otp" in hits:
        parts.append("Đừng đọc mã xác thực (OTP).")
    if "link" in hits or "lock" in hits:
        parts.append("Đừng mở đường dẫn trong tin.")
    if not parts:
        parts.append("Đừng làm theo tin này khi chưa hỏi người thân.")
    return " ".join(parts[:2])


def _todo(hits: dict, mode: str, level: str) -> list[str]:
    if level == "unknown":
        return []
    if mode == "call":
        return ["Không chuyển tiền, không đọc mã xác thực (OTP).", "Gọi cho người thân trước khi làm gì."]
    out = ["Không trả lời, không chuyển tiền."]
    if "link" in hits or "lock" in hits:
        out.append("Không bấm đường dẫn trong tin.")
    return out
