import uuid
from datetime import datetime

from . import config
from .contract import AnalysisResult, ReportSummary
from .data import (DOMAIN_AGE_DAYS, LOOKALIKE_WORDS, NOUN, OFFICIAL_DOMAINS, OFFICIAL_NUMBERS, SCAM_TYPES,
                   SHORTENERS, SUSPECT_TLDS, TODO)
from .reports import Store
from .text import link_host, target_display, target_key


def new_id(prefix: str = "chk") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def when(iso: str | None) -> str:
    if not iso:
        return ""
    d = datetime.fromisoformat(iso).date()
    days = (config.demo_today() - d).days
    return "hôm nay" if days <= 0 else "hôm qua" if days == 1 else f"{days} ngày trước"


def official(kind: str, key: str) -> str | None:
    if kind == "phone":
        return OFFICIAL_NUMBERS.get(key)
    if kind == "link":
        host = key.split("/")[0]
        for domain, name in OFFICIAL_DOMAINS.items():
            if host == domain or host.endswith("." + domain):
                return name
    return None


def link_signs(value: str) -> list[str]:
    host = link_host(value)
    out = []
    age = DOMAIN_AGE_DAYS.get(host)
    if age is not None and age < 30:
        out.append(f"Tên miền mới đăng ký {age} ngày")
    if any(w in host for w in LOOKALIKE_WORDS):
        out.append("Tên gần giống trang chính thức")
    tld = next((t for t in SUSPECT_TLDS if host.endswith(t)), None)
    if tld:
        out.append(f"Đuôi {tld} ít dùng cho trang chính thống")
    if host in SHORTENERS:
        out.append("Đường dẫn rút gọn, không thấy trang đích")
    return out


def check_target(kind: str, value: str, store: Store, found: dict | None = None) -> AnalysisResult:
    key = target_key(kind, value)
    display = target_display(kind, value)
    noun = NOUN[kind]
    base = {"id": new_id(), "kind": kind, "display": display}

    if found is None:
        with store.transaction():
            found = store.target_level(key, config.now(), kind)
    base.update(appealOpen=found["appealOpen"], canAppeal=found["canAppeal"], count=found["count"])
    name = found["official"]
    if name:
        return AnalysisResult(
            **base, level="safe", source="directory", confidence=1.0,
            headline="Số này khớp danh bạ tổng đài." if kind == "phone" else "Trang này khớp danh bạ trang chính thức.",
            note="Lá chắn chưa xác minh người đang gọi." if kind == "phone" else None,
            why=[f"{name} đã xác thực"], todo=TODO[("safe", kind)])
    count = found["count"]
    if count:
        label = SCAM_TYPES.get(found["scamType"])
        # Every counted device was confirmed as a money or OTP lure (W1 by the recipient, W2/W3 by team votes), so say exactly that.
        lure = "dụ chuyển tiền hoặc lấy mã OTP"
        headline = (f"Có {count} máy báo cuộc gọi hiển thị số này {lure}." if kind == "phone"
                    else f"Có {count} máy báo {noun} được dùng để {lure}.")
        if found["level"] == "danger":
            headline += (" Đội tình nguyện đã kiểm tra." if found.get("teamChecked")
                         else " Người nhận đã xác nhận nội dung cuộc gọi.")
        why = [f"Gần nhất {when(found['lastAt'])}."]
        if found["appealOpen"]:
            why.append("Đang xét báo nhầm.")
        return AnalysisResult(
            **base, level=found["level"], source="community", confidence=0.94,
            scamType=found["scamType"], scamLabel=label, headline=headline, why=why,
            todo=TODO.get((found["level"], kind), TODO[("danger", kind)]),
            reports=ReportSummary(count=count, last7d=found["last7d"], lastAt=found["lastAt"],
                                  lastWhen=when(found["lastAt"]), verified=True))
    signs = found["signs"]
    if signs:
        return AnalysisResult(**base, level="suspicious", source="heuristic", confidence=min(.5+.1*len(signs),.85),
                              scamType="duong_dan_gia", scamLabel=SCAM_TYPES["duong_dan_gia"],
                              headline=f"Trang này có {len(signs)} dấu hiệu của trang giả mạo.",
                              why=signs, todo=TODO[("suspicious","link")])
    return AnalysisResult(**base, level="unknown", source="community", confidence=0,
                          headline="Chưa đủ bằng chứng để cảnh báo.", note="Điều đó không có nghĩa là an toàn.")
