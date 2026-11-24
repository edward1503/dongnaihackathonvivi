"""Cấu hình đọc từ biến môi trường. Khóa API không bao giờ nằm trong mã."""
import os
from datetime import date, datetime, timedelta, timezone

VN = timezone(timedelta(hours=7))


def env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    return v if v not in (None, "") else default


def demo_today() -> date:
    """Ngày của kịch bản demo. Mặc định 24/11/2026 để khớp thiết kế; đặt LCS_TODAY=real để dùng ngày thật."""
    v = env("LCS_TODAY", "2026-11-24")
    if v == "real":
        return datetime.now(VN).date()
    return date.fromisoformat(v)


def now() -> datetime:
    """Giờ thật trong ngày, gắn vào ngày demo."""
    real = datetime.now(VN)
    return datetime.combine(demo_today(), real.timetz())


def gemini_keys() -> list[str]:
    raw = env("GEMINI_API_KEYS") or env("GEMINI_API_KEY") or ""
    return [k.strip() for k in raw.split(",") if k.strip()]


def gemini_models() -> list[str]:
    raw = env("GEMINI_MODELS", "gemini-3.5-flash,gemini-2.5-flash")
    return [m.strip() for m in raw.split(",") if m.strip()]


def gemini_base() -> str:
    return (env("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")


def ai_timeout() -> float:
    return float(env("LCS_AI_TIMEOUT", "6"))


def demo_fallback() -> bool:
    """Cho phép trả bản chép lời mẫu khi không gọi được AI (chỉ dùng khi trình diễn)."""
    return env("LCS_DEMO_FALLBACK", "1") == "1"


def db_path() -> str:
    return env("LCS_DB", ":memory:")
