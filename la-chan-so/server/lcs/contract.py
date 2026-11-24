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


class TimelineItem(BaseModel):
    time: str
    text: str


class AlertIn(BaseModel):
    room: str = "gia-dinh-hoa"
    level: Level = "danger"
    scamType: Optional[str] = None
    scamLabel: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    asksMoney: bool = False
    timeline: list[TimelineItem] = []
    sender: str = Field("ba-hoa", alias="from")

    model_config = {"populate_by_name": True}


class AskIn(BaseModel):
    room: str = "gia-dinh-hoa"
    to: str = "minh"
    text: str
    alertId: Optional[str] = None
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


class AppealIn(BaseModel):
    text: str
