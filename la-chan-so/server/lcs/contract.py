"""Hợp đồng dữ liệu dùng chung cho app, Android, Zalo và web. Xem KE-HOACH-MANG-2-3.md mục 2."""
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

Kind = Literal["phone", "link", "account", "message", "call"]
Level = Literal["danger", "suspicious", "safe", "unknown"]
Reason = Optional[Literal["insufficient", "offline", "otp"]]
Source = Literal["directory", "community", "heuristic", "ai", "fallback"]

LEVEL_ORDER = {"unknown": 0, "suspicious": 1, "danger": 2}


class Sign(BaseModel):
    text: str
    quotes: list[str] = []


class ReportSummary(BaseModel):
    count: int = 0
    last7d: int = 0
    lastAt: Optional[str] = None
    lastWhen: Optional[str] = None  # "hôm nay", "hôm qua", "3 ngày trước" (theo ngày của kịch bản demo)
    verified: bool = False


class AnalysisResult(BaseModel):
    id: str
    kind: Kind
    display: str
    level: Level
    reason: Reason = None
    scamType: Optional[str] = None
    scamLabel: Optional[str] = None
    headline: str
    note: Optional[str] = None
    why: list[str] = []
    todo: list[str] = []
    signs: list[Sign] = []
    maskedText: Optional[str] = None
    reports: ReportSummary = Field(default_factory=ReportSummary)
    source: Source
    confidence: float = 0.0


# ---- Đầu vào ----

class CheckIn(BaseModel):
    value: str
    kind: Optional[Kind] = None


class MessageIn(BaseModel):
    text: str


class AlertIn(BaseModel):
    """Nhận cả dạng của app/Android (phone, scamLabel, asksMoney) lẫn dạng của trang Zalo (number, scenario, askedTransfer)."""
    room: str = "gia-dinh-hoa"
    level: str = "danger"
    scamType: Optional[str] = None
    scamLabel: Optional[str] = None
    scenario: Optional[str] = None
    phone: Optional[str] = None
    number: Optional[str] = None
    who: str = "Mẹ Hoa"
    summary: Optional[str] = None
    asksMoney: Optional[bool] = None
    askedTransfer: Optional[bool] = None
    callSeconds: Optional[int] = None
    timeline: list[dict[str, Any]] = []
    sender: str = Field("ba-hoa", alias="from")

    model_config = {"populate_by_name": True}


class AskIn(BaseModel):
    room: str = "gia-dinh-hoa"
    to: str = "minh"
    text: str
    alertId: Optional[str] = None
    phone: Optional[str] = None
    level: Optional[str] = None
    scamType: Optional[str] = None
    scamLabel: Optional[str] = None
    asksMoney: bool = False
    sender: str = Field("ba-hoa", alias="from")

    model_config = {"populate_by_name": True}


class AskReplyIn(BaseModel):
    preset: Literal["dung_chuyen", "nguoi_quen"] = "dung_chuyen"
    text: Optional[str] = None
    sender: str = Field("minh", alias="from")

    model_config = {"populate_by_name": True}


class EventIn(BaseModel):
    type: str
    room: str
    data: dict[str, Any] = {}
    sender: str = Field("app", alias="from")

    model_config = {"populate_by_name": True}


class ReportIn(BaseModel):
    kind: Literal["call", "message", "link", "account"]
    target: str
    story: Optional[str] = None
    hasAudio: bool = False
    lostMoney: bool = False
    area: Optional[str] = None
    group: Optional[str] = None
    reporter: str = "vy"


class ReportPatch(BaseModel):
    status: Literal["confirmed", "rejected"]


class DecisionIn(BaseModel):
    decision: Literal["confirmed", "spam", "rejected", "label", "police"]
    label: Optional[str] = None


class LegacyReplyIn(BaseModel):
    choice: Literal["dung-chuyen", "nguoi-quen"] = "dung-chuyen"
    text: Optional[str] = None


class BroadcastIn(BaseModel):
    title: str
    body: str
    to: list[str] = []


class AppealIn(BaseModel):
    text: str


class AppealResolveIn(BaseModel):
    """Người duyệt xử lý khiếu nại: gỡ nhãn (remove) hoặc giữ nhãn (keep)."""
    outcome: Literal["remove", "keep"]
