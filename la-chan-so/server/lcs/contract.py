"""Hợp đồng dữ liệu dùng chung cho app, Android, Zalo và web. Xem KE-HOACH-MANG-2-3.md mục 2."""
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from .data import LESSONS

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
    analysisId: str | None = None
    transferRequested: bool = False
    aiLevel: Level | None = None
    aiScamType: str | None = None
    aiConfidence: float | None = None
    summary: str | None = None
    communityLevel: Level | None = None
    appealOpen: bool = False
    canAppeal: bool = False
    count: int = 0
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
    lesson: Optional[str] = None  # mã bài học của Mảng 4 (hoc.html?kieu=…); None: kiểu này chưa có bài

    @model_validator(mode="after")
    def _fill_lesson(self):
        if self.lesson is None and self.scamType:
            self.lesson = LESSONS.get(self.scamType)
        return self


# ---- Đầu vào ----

class CheckIn(BaseModel):
    value: str
    kind: Optional[Kind] = None


class MessageIn(BaseModel):
    text: str


class AlertIn(BaseModel):
    """Nhận cả dạng của app/Android (phone, scamLabel, asksMoney) lẫn dạng của trang Zalo (number, scenario, askedTransfer)."""
    reportId: str | None = None
    analysisId: str | None = None
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
    eventId: Optional[str] = Field(None, max_length=80)  # mã sự kiện của bên gửi: gửi lại cùng mã thì không báo trùng

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


class LegacyReplyIn(BaseModel):
    choice: Literal["dung-chuyen", "nguoi-quen"]
    text: Optional[str] = None


class BroadcastIn(BaseModel):
    title: str
    body: str
    to: list[str] = []


class AppealIn(BaseModel):
    target: str
    kind: Literal["phone", "call"]
    contact: str
    text: str = ""


class AppealResolveIn(BaseModel):
    """Người duyệt xử lý khiếu nại: gỡ nhãn (remove) hoặc giữ nhãn (keep)."""
    outcome: Literal["remove", "keep"]
    note: str = ""


class IntentIn(BaseModel):
    """POST /api/roleplay/intent (app Android, Mảng 4). Lời người học đã được app thay dãy số riêng tư."""
    scene: str = "lan-2"
    text: str = Field(..., max_length=2000)
    lastLine: str = "mo-dau"
    scored: list[str] = []


class SpeakIn(BaseModel):
    """POST /api/roleplay/speak: đọc một câu bằng giọng của nhân vật (mã trong prototype/nhan-vat.json)."""
    text: str = Field(..., max_length=1000)
    character: Optional[str] = "lan"


class LiveHistoryItem(BaseModel):
    ai: str
    chu: str


class LiveTurnIn(BaseModel):
    scene: str = Field(pattern=r"^[a-z0-9-]{1,24}$")
    history: list[LiveHistoryItem] = Field(min_length=1, max_length=14)
    scored: list[str] = Field(default_factory=list)


class Vote(BaseModel):
    reviewId: str
    decision: Literal["confirm", "reject", "spam"]
    note: str = ""


class Code(BaseModel):
    code: str


class LegacyVote(BaseModel):
    reviewId: str | None = None
    decision: str | None = None
    status: str | None = None
    note: str = ""


class LegacyAppeal(BaseModel):
    text: str = ""
    contact: str | None = None


class Withdrawal(BaseModel):
    at: str
    signature: str
