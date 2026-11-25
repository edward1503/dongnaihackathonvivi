"""Tương thích với trang Zalo và web đội tình nguyện của Mảng 5, 6 (la-chan-so/mvp/, hợp đồng mvp/HOP-DONG-DU-LIEU.md).

Hai trang đó được viết cho máy chủ Node tối thiểu (mvp/server.mjs). Mô-đun này cung cấp đúng các đường dẫn
và dạng dữ liệu đó, nhưng dùng chung kho báo cáo (S6), bộ che số (S4) và kênh đồng bộ (S5) của máy chủ này,
nên Minh trả lời trên trang Zalo thì máy bà Hoa (app React, màn A08c) nhận được ngay.

- Cảnh báo = câu hỏi người thân: id cảnh báo dùng luôn làm askId, để lời trả lời đi về đúng màn của bà Hoa.
- SSE: GET /api/events không kèm ?room trả luồng sự kiện alert, reply, call, report, broadcast, reset.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime

from fastapi import Request
from fastapi.responses import StreamingResponse

from . import config, rules
from .masking import mask
from .text import fmt_phone

FAMILY_ROOM = "gia-dinh-hoa"
VOLUNTEER_ROOM = "tnv-tran-bien"
CHOICE_TO_PRESET = {"dung-chuyen": "dung_chuyen", "nguoi-quen": "nguoi_quen"}
PRESET_TO_CHOICE = {v: k for k, v in CHOICE_TO_PRESET.items()}
REPLY_TEXT = {"dung_chuyen": "Mẹ đừng chuyển! Con gọi mẹ ngay.", "nguoi_quen": "Đây là người quen, mẹ yên tâm."}


def now_iso() -> str:
    return config.now().isoformat(timespec="seconds")


def hhmm() -> str:
    return config.now().strftime("%H:%M")


# ---------------- SSE ----------------

class Hub:
    def __init__(self) -> None:
        self.clients: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self.clients.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self.clients.discard(q)

    def emit(self, event: str, data) -> None:
        msg = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        for q in list(self.clients):
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                self.clients.discard(q)

    def response(self, request: Request) -> StreamingResponse:
        q = self.subscribe()

        async def gen():
            try:
                yield "retry: 1500\n\n"
                while True:
                    if await request.is_disconnected():
                        break
                    try:
                        yield await asyncio.wait_for(q.get(), timeout=15)
                    except asyncio.TimeoutError:
                        yield ": ping\n\n"
            finally:
                self.unsubscribe(q)

        return StreamingResponse(gen(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


hub = Hub()


# ---------------- Cảnh báo (Z01a, Z01b) ----------------

def _timeline_item(t: dict) -> dict:
    time = t.get("t") or t.get("time") or hhmm()
    return {"t": time, "time": time, "text": str(t.get("text", "")), "tone": t.get("tone", "")}


def make_alert(*, alert_id: str | None = None, level: str = "danger", who: str = "Mẹ Hoa", number: str | None = None,
               scenario: str | None = None, scam_type: str | None = None, asked_transfer: bool = False,
               call_seconds: int | None = None, summary: str | None = None, timeline: list[dict] | None = None,
               source: str = "alert", keep_phones: bool = False) -> dict:
    """Một cảnh báo mang cả tên trường của trang Zalo (who, number, scenario…) và của app (alertId, scamLabel…)."""
    aid = alert_id or "al_" + uuid.uuid4().hex[:8]
    lvl = "warn" if level in ("warn", "suspicious") else "danger"
    phone = fmt_phone(number) if number else None
    masked = mask(summary, phones=not keep_phones)[0] if summary else None
    return {
        "id": aid, "alertId": aid, "level": lvl, "at": now_iso(), "who": who,
        "number": phone, "phoneDisplay": phone,
        "scenario": scenario, "scamLabel": scenario, "scamType": scam_type,
        "askedTransfer": bool(asked_transfer), "asksMoney": bool(asked_transfer),
        "callSeconds": call_seconds,
        "summary": masked, "summaryMasked": masked,
        "timeline": [_timeline_item(t) for t in (timeline or [{"text": "Lá chắn phát hiện cuộc gọi nghi lừa đảo", "tone": "danger"}])],
        "reply": None, "status": "open", "source": source,
    }


def demo_alert() -> dict:
    """Cảnh báo mẫu của màn Z01a, Z01b để trang Zalo có sẵn nội dung khi mở."""
    return make_alert(
        alert_id="al_demo", number="0912345678", scenario="Giả danh công an", scam_type="gia_danh_cong_an",
        asked_transfer=True, call_seconds=252, source="demo",
        summary="Người gọi tự xưng cán bộ điều tra, yêu cầu chuyển tiền vào tài khoản tạm giữ và giữ bí mật.",
        timeline=[
            {"t": "10:38", "text": "Cuộc gọi đến từ 0912 345 678, dài 4 phút 12 giây", "tone": ""},
            {"t": "10:42", "text": "Lá chắn phân tích bản ghi âm: Nguy hiểm", "tone": "danger"},
            {"t": "10:43", "text": "Mẹ trả lời: có đòi chuyển tiền", "tone": "danger"},
            {"t": "10:43", "text": "Mẹ mở ứng dụng ngân hàng. Lá chắn đã nhắc dừng.", "tone": "warn"},
        ],
    )


class Alerts:
    def __init__(self) -> None:
        self.items: list[dict] = []
        self.broadcasts: list[dict] = []
        self.reset()

    def reset(self) -> None:
        self.items = [demo_alert()]
        self.broadcasts = []
        self.by_event: dict[str, str] = {}  # mã sự kiện của bên gửi -> mã cảnh báo, để gửi lại không báo trùng

    def add(self, alert: dict) -> dict:
        self.items.insert(0, alert)
        hub.emit("alert", alert)
        return alert

    def get(self, alert_id: str) -> dict | None:
        return next((a for a in self.items if a["id"] == alert_id), None)

    def apply_reply(self, alert_id: str, preset: str, text: str | None = None) -> dict | None:
        """Ghi lời Minh trả lời vào cảnh báo (nếu có) và báo trang Zalo. Trả về dữ liệu cho sự kiện ask.reply."""
        body = (text or REPLY_TEXT.get(preset, REPLY_TEXT["dung_chuyen"])).strip()
        if body.lower().startswith("minh:"):
            body = body[5:].strip()
        a = self.get(alert_id)
        if a:
            a["reply"] = {"by": "Minh", "text": "Minh: " + body, "choice": PRESET_TO_CHOICE.get(preset, "dung-chuyen"),
                          "at": now_iso(), "delivered": True}
            if preset == "nguoi_quen":
                a["status"] = "cleared"
            a["timeline"].append(_timeline_item({"text": "Minh trả lời: " + body, "tone": "safe"}))
            hub.emit("reply", {"alertId": alert_id, "reply": a["reply"]})
        return {"askId": alert_id, "preset": preset, "text": body}

    def add_timeline(self, alert_id: str, text: str, tone: str = "") -> dict | None:
        a = self.get(alert_id)
        if a:
            a["timeline"].append(_timeline_item({"text": text, "tone": tone}))
        return a


alerts = Alerts()


# ---------------- Báo cáo theo dạng của trang web Mảng 6 ----------------

LEGACY_KIND = {"call": "phone", "message": "other", "link": "link", "account": "account"}
KIND_FROM_LEGACY = {"phone": "call", "link": "link", "account": "account", "other": "message"}
LEGACY_STATUS = {
    "needs_review": "pending", "pending": "pending",
    "ai_confirmed": "confirmed", "confirmed": "confirmed",
    "ai_rejected": "rejected", "rejected": "rejected",
    "spam": "spam", "labeled": "labeled", "forwarded": "forwarded",
}
DECISION_TO_STATUS = {"confirmed": "confirmed", "spam": "spam", "rejected": "rejected", "label": "labeled", "police": "forwarded"}


def legacy_report(r: dict) -> dict:
    conf = round((r["ai"]["confidence"] or 0) * 100)
    label = r["ai"]["scamLabel"] or "Chưa rõ"
    status = LEGACY_STATUS.get(r["status"], "pending")
    hits = rules.find(r["story"] or "")
    by_key = {x.key: x for x in rules.RULES}
    signs = [by_key[k].text for k in hits][:3] or [f'Có dấu hiệu theo kiểu "{label}"']
    unsure = []
    if status == "pending":
        unsure.append(f"Mới có {r['reporterCount']} người báo")
        if conf < 75:
            unsure.append(f"AI mới chắc {conf}%")
    value = r["target"]
    if r["kind"] == "account" and not value.startswith("TK "):
        value = "TK " + value
    return {
        "id": r["id"], "value": value, "kind": LEGACY_KIND.get(r["kind"], "other"),
        "note": r["story"] or "", "aiGuess": label, "confidence": conf, "count": r["reporterCount"],
        "area": r["area"], "status": status, "at": r["createdAt"],
        "source": "seed" if r["id"].startswith("rp_seed") else ("zalo" if r.get("reporter") == "minh" else "app"),
        "consent": True, "auto": r["status"] == "ai_confirmed",
        "signs": signs, "whyUnsure": unsure, "history": [],
        "label": r.get("label"), "decidedAt": r.get("decidedAt"),
        "decidedBy": "Khoa" if r.get("decidedAt") else None,
    }


def legacy_kind(value: str, kind: str | None) -> str:
    if kind in KIND_FROM_LEGACY:
        return KIND_FROM_LEGACY[kind]
    v = value.strip()
    if any(c.isalpha() for c in v) and ("." in v or "/" in v):
        return "link"
    digits = "".join(c for c in v if c.isdigit())
    if v.upper().startswith("TK") or (len(digits) >= 11 and not digits.startswith("0")):
        return "account"
    return "call" if len(digits) >= 3 else "message"


def strip_tk(value: str) -> str:
    v = value.strip()
    return v[2:].strip() if v.upper().startswith("TK") else v


def is_legacy_request(body: dict) -> bool:
    return "value" in body and "target" not in body


def broadcast(title: str, body: str, to: list[str]) -> dict:
    x = {"id": "bc_" + uuid.uuid4().hex[:6], "title": title, "body": body, "to": to, "at": now_iso(), "by": "Khoa"}
    alerts.broadcasts.insert(0, x)
    if any(t.startswith("Người thân") for t in to):
        hub.emit("broadcast", x)  # hiện thành tin của tài khoản chính thức ở Zalo của Minh
    return x


def until_label(iso: str | None) -> str | None:
    return datetime.fromisoformat(iso).isoformat(timespec="seconds") if iso else None
