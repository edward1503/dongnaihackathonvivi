"""Chuẩn hóa, nhận loại và định dạng số điện thoại, tài khoản, đường dẫn."""
import re
import unicodedata

from .data import OFFICIAL_NUMBERS, SHORTENERS

PHONE_RE = re.compile(r"0\d{9,10}|1[89]00\d{4,6}|11[3-5]")


def nfc(s: str | None) -> str:
    return unicodedata.normalize("NFC", s or "")


def digits(s: str | None) -> str:
    return re.sub(r"\D", "", s or "")


def norm_phone(d: str) -> str:
    if d.startswith("84") and len(d) == 11:
        return "0" + d[2:]
    return d


def is_phone(d: str) -> bool:
    return bool(PHONE_RE.fullmatch(norm_phone(d)))


def fmt_phone(d: str) -> str:
    d = norm_phone(digits(d))
    if re.fullmatch(r"1[89]00\d{4,6}", d):
        return f"{d[:4]} {d[4:8]} {d[8:]}".strip()
    if len(d) == 11 and d.startswith("02"):
        return f"{d[:3]} {d[3:7]} {d[7:]}"
    if len(d) == 10 and d.startswith("0"):
        return f"{d[:4]} {d[4:7]} {d[7:]}"
    return d


def fmt_account(d: str) -> str:
    d = digits(d)
    return f"{d[:4]} xxxx {d[-4:]}" if len(d) >= 8 else d


def norm_link(v: str) -> str:
    v = nfc(v).strip().lower()
    v = re.sub(r"^[a-z][a-z0-9+.-]*://", "", v)
    v = re.sub(r"^www\.", "", v)
    return v.rstrip("/")


def link_host(v: str) -> str:
    return re.split(r"[/?#]", norm_link(v), maxsplit=1)[0]


def link_key(v: str) -> str:
    """Khóa để gom báo cáo: tên miền; riêng liên kết rút gọn thì giữ cả đường dẫn."""
    host = link_host(v)
    if host in SHORTENERS:
        return re.split(r"[?#]", norm_link(v), maxsplit=1)[0]
    return host


def looks_like_link(v: str) -> bool:
    v = v.strip()
    return bool(re.search(r"[a-zA-Z]", v)) and "." in v and not re.search(r"\s", v)


def detect_kind(value: str, hint: str | None) -> str:
    v = nfc(value).strip()
    if hint == "message" or len(v.split()) > 4:
        return "message"
    if looks_like_link(v):
        return "link"
    d = digits(v)
    if not d:
        return "message"
    if hint == "account":
        return "account"
    if is_phone(d) or d in OFFICIAL_NUMBERS:
        return "phone"
    return "account"


def target_key(kind: str, value: str) -> str:
    if kind in ("phone", "call"):
        return norm_phone(digits(value))
    if kind == "account":
        return digits(value)
    if kind == "link":
        return link_key(value)
    return nfc(value).strip()


def target_display(kind: str, value: str) -> str:
    if kind in ("phone", "call"):
        return fmt_phone(value)
    if kind == "account":
        return fmt_account(value)
    if kind == "link":
        return norm_link(value)
    return nfc(value).strip()
