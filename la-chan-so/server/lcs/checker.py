"""S1: kiểm tra nhanh số điện thoại, đường dẫn, số tài khoản. Không gọi AI.

Thứ tự quyết định (KE-HOACH-MANG-2-3.md mục 3.2):
1. khớp danh bạ trắng -> safe
2. có báo cáo đã duyệt còn hạn -> danger
3. đường dẫn có dấu hiệu giả -> suspicious
4. còn lại -> unknown
"""
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


def check_target(kind: str, value: str, store: Store) -> AnalysisResult:
    key = target_key(kind, value)
    display = target_display(kind, value)
    noun = NOUN[kind]
    base = {"id": new_id(), "kind": kind, "display": display}

    name = official(kind, key)
    if name:
        return AnalysisResult(
            **base, level="safe", source="directory", confidence=1.0,
            headline="Số này khớp danh bạ tổng đài." if kind == "phone" else "Trang này khớp danh bạ trang chính thức.",
            note="Lá chắn chưa xác minh người đang gọi." if kind == "phone" else None,
            why=[f"{name} đã xác thực", "Chưa có báo cáo lừa đảo nào"],
            todo=TODO[("safe", kind)],
        )

    found = store.lookup(key)
    if found["count"]:
        scam_type = found.get("scamType")
        label = SCAM_TYPES.get(scam_type or "", "lừa đảo")
        why = [f"{found['last7d'] or found['count']} báo cáo trong 7 ngày, gần nhất {when(found['lastAt'])}"
               if found["last7d"] else f"{found['count']} báo cáo, gần nhất {when(found['lastAt'])}"]
        if found.get("story"):
            why.append(found["story"])
        why.append("Đội tình nguyện đã xác nhận" if found.get("humanVerified") else "AI đã xác nhận từ báo cáo cộng đồng")
        return AnalysisResult(
            **base, level="danger", source="community", confidence=0.94,
            scamType=scam_type, scamLabel=label,
            headline=f"{found['count']} người đã báo {noun} {label[:1].lower() + label[1:]}.",
            why=why, todo=TODO[("danger", kind)],
            reports=ReportSummary(count=found["count"], last7d=found["last7d"], lastAt=found["lastAt"], verified=True),
        )

    if kind == "link":
        signs = link_signs(value)
        if signs:
            return AnalysisResult(
                **base, level="suspicious", source="heuristic", confidence=min(0.5 + 0.1 * len(signs), 0.85),
                scamType="duong_dan_gia", scamLabel=SCAM_TYPES["duong_dan_gia"],
                headline=f"Trang này có {len(signs)} dấu hiệu của trang giả mạo.",
                why=signs, todo=TODO[("suspicious", "link")],
            )

    return AnalysisResult(
        **base, level="unknown", source="community", confidence=0.0,
        headline=f"Chưa ai báo cáo {noun}.",
        note="Điều đó không có nghĩa là an toàn.",
    )
