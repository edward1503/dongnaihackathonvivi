"""Máy chủ Lá chắn số: API cho app, Android, Zalo và web đội tình nguyện.

Chạy:  uvicorn lcs.main:app --host 0.0.0.0 --port 8000
"""
import json
import os
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import ai, config
from .analyze import NeedInput, analyze_call, analyze_text
from .checker import check_target
from .contract import (AlertIn, AnalysisResult, AppealIn, AskIn, AskReplyIn, CheckIn, EventIn, MessageIn,
                       ReportIn, ReportPatch)
from .data import REPLY_PRESETS, SCAM_TYPES
from .masking import has_otp, mask
from .relay import Relay, RelayError
from .reports import CONFIRMED, Store
from .text import detect_kind, digits, fmt_phone, nfc

MAX_AUDIO = 20 * 1024 * 1024

app = FastAPI(title="Lá chắn số", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in (config.env("LCS_CORS", "*") or "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)
store = Store()
relay = Relay()


def bad(msg: str, code: int = 400):
    raise HTTPException(status_code=code, detail=msg)


# ---------------- chung ----------------

@app.get("/api/health")
def health():
    return {"ok": True, "ai": ai.available(), "today": config.demo_today().isoformat()}


@app.post("/api/demo/reset")
async def demo_reset():
    store.reset()
    await relay.reset()
    return {"ok": True}


# ---------------- S1, S2: kiểm tra nhanh ----------------

@app.get("/api/lookup/phone/{phone}", response_model=AnalysisResult)
def lookup_phone(phone: str):
    """Bản nhanh cho N1 lúc đổ chuông: không gọi AI."""
    if len(digits(phone)) < 3:
        bad("Số này ngắn quá, bạn kiểm tra lại nhé")
    return check_target("phone", phone, store)


@app.post("/api/check", response_model=AnalysisResult)
async def check(body: CheckIn):
    value = nfc(body.value).strip()
    if not value:
        bad("Bạn nhập số, đường dẫn hoặc dán tin nhắn trước nhé")
    kind = detect_kind(value, body.kind)
    if kind == "message":
        return await analyze_text(value, "message")
    if kind in ("phone", "account") and len(digits(value)) < 3:
        bad("Số này ngắn quá, bạn kiểm tra lại nhé")
    return check_target(kind, value, store)


@app.post("/api/analyze/message", response_model=AnalysisResult)
async def analyze_message(body: MessageIn):
    if not nfc(body.text).strip():
        bad("Bạn dán tin nhắn trước nhé")
    return await analyze_text(body.text, "message")


@app.post("/api/analyze/call", response_model=AnalysisResult)
async def analyze_call_api(
    audio: UploadFile | None = File(None),
    transcript: str | None = Form(None),
    phone: str | None = Form(None),
    unknownNumber: bool = Form(False),
):
    """S3: nhận tệp ghi âm (không lưu) hoặc bản chép lời; trả kết quả cho màn A04b."""
    data = None
    if audio is not None:
        data = await audio.read(MAX_AUDIO + 1)
        if len(data) > MAX_AUDIO:
            bad("Tệp ghi âm lớn quá (tối đa 20 MB)", 413)
    try:
        return await analyze_call(store, audio=data, mime=audio.content_type if audio else None,
                                  transcript=transcript, phone=phone, unknown_number=unknownNumber)
    except NeedInput as e:
        bad(str(e))
    finally:
        data = None  # không giữ bản ghi trong bộ nhớ lâu hơn cần thiết


# ---------------- S5: đồng bộ ba máy ----------------

def _room(room: str) -> str:
    try:
        return relay.check_room(room)
    except RelayError as e:
        bad(str(e))


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, room: str = "gia-dinh-hoa", since: int = 0, who: str = "app"):
    try:
        relay.check_room(room)
    except RelayError:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    relay.join(room, websocket)
    try:
        for ev in relay.history(room, since):
            await websocket.send_json(ev)
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                await relay.publish(room, str(msg.get("type")), msg.get("data") or {}, str(msg.get("from") or who))
            except (ValueError, AttributeError, RelayError) as e:
                await websocket.send_json({"error": str(e) or "Sự kiện không hợp lệ"})
    except WebSocketDisconnect:
        pass
    finally:
        relay.leave(room, websocket)


@app.post("/api/events")
async def post_event(body: EventIn):
    try:
        return await relay.publish(body.room, body.type, body.data, body.sender)
    except RelayError as e:
        bad(str(e))


@app.get("/api/events")
def get_events(room: str, since: int = 0):
    return {"events": relay.history(_room(room), since)}


@app.post("/api/alerts")
async def create_alert(body: AlertIn):
    """N1, N2, N3 gọi khi Lá chắn quyết định báo người thân. Minh chỉ thấy mức cảnh báo và tóm tắt đã che."""
    _room(body.room)
    alert_id = "al_" + uuid.uuid4().hex[:8]
    data = {
        "alertId": alert_id,
        "level": body.level,
        "scamType": body.scamType,
        "scamLabel": body.scamLabel or (SCAM_TYPES.get(body.scamType or "") if body.scamType else None),
        "phoneDisplay": fmt_phone(body.phone) if body.phone else None,
        "summaryMasked": mask(body.summary)[0] if body.summary else None,
        "asksMoney": body.asksMoney,
        "timeline": [t.model_dump() for t in body.timeline],
    }
    await relay.publish(body.room, "alert.created", data, body.sender)
    return data


@app.post("/api/asks")
async def create_ask(body: AskIn):
    """U4 (A08a): bà Hoa gửi câu hỏi cho người thân."""
    _room(body.room)
    if not nfc(body.text).strip():
        bad("Lời nhắn đang trống")
    ask_id = "ask_" + uuid.uuid4().hex[:8]
    relay.asks[ask_id] = body.room
    data = {"askId": ask_id, "to": body.to, "text": mask(body.text, phones=False)[0], "alertId": body.alertId}
    await relay.publish(body.room, "ask.sent", data, body.sender)
    return data


def _ask_room(ask_id: str) -> str:
    room = relay.asks.get(ask_id)
    if not room:
        bad("Không tìm thấy câu hỏi này", 404)
    return room


@app.post("/api/asks/{ask_id}/seen")
async def ask_seen(ask_id: str, who: str = "minh"):
    room = _ask_room(ask_id)
    await relay.publish(room, "ask.seen", {"askId": ask_id}, who)
    return {"ok": True}


@app.post("/api/asks/{ask_id}/reply")
async def ask_reply(ask_id: str, body: AskReplyIn):
    """Z2 (Z01b): Minh trả lời một chạm; máy bà Hoa hiện to và đọc thành tiếng (A08c)."""
    room = _ask_room(ask_id)
    data = {"askId": ask_id, "preset": body.preset, "text": (body.text or REPLY_PRESETS[body.preset]).strip()}
    await relay.publish(room, "ask.reply", data, body.sender)
    return data


# ---------------- S6: báo cáo, kiểm duyệt, thống kê ----------------

@app.post("/api/reports")
async def create_report(body: ReportIn):
    """U5 (A09a, A09b), Z3. AI phân loại trước; ca chưa chắc mới tới người duyệt (W02)."""
    target = nfc(body.target).strip()
    if not target:
        bad("Bạn điền số, đường dẫn hoặc tài khoản cần báo nhé")
    story = nfc(body.story or "").strip()
    if story and has_otp(story):
        story = ""  # không lưu mã xác thực
    story_masked = mask(story)[0] if story else None
    # Tin nhắn thì đối tượng báo là số hoặc đường dẫn gửi tin
    key_kind = {"call": "phone", "link": "link", "account": "account"}.get(body.kind) or detect_kind(target, None)
    prior = check_target(key_kind, target, store) if key_kind in ("phone", "link", "account") else None

    analysis = await analyze_text(story_masked, "message") if story_masked else None
    label = (analysis.scamLabel if analysis and analysis.level != "unknown" else None)
    if prior and prior.level == "danger":
        status, scam_type, confidence = "ai_confirmed", prior.scamType, 0.94
        label = label or prior.scamLabel
    elif analysis and analysis.source == "ai" and analysis.level == "danger" and analysis.confidence >= 0.85:
        status, scam_type, confidence = "ai_confirmed", analysis.scamType, analysis.confidence
    elif analysis and analysis.source == "ai" and analysis.level == "unknown" and analysis.confidence <= 0.2:
        status, scam_type, confidence = "ai_rejected", None, analysis.confidence
    else:
        status = "needs_review"
        scam_type = analysis.scamType if analysis and analysis.level != "unknown" else ("duong_dan_gia" if body.kind == "link" else "khac")
        confidence = analysis.confidence if analysis else 0.5

    report = store.add(
        kind=body.kind, key_kind=key_kind, target=target, story=story_masked, has_audio=body.hasAudio, lost_money=body.lostMoney,
        area=body.area, group=body.group, status=status, ai_type=scam_type,
        ai_label=label or SCAM_TYPES.get(scam_type or "khac"), ai_confidence=round(confidence, 2), reporter=body.reporter,
    )
    total = store.add_points(body.reporter, 10)
    await relay.publish("tnv-tran-bien", "report.created",
                        {"reportId": report["id"], "status": status, "scamType": scam_type}, "server")
    return {
        "report": report,
        "reporterCount": report["reporterCount"],
        "points": 10,
        "totalPoints": total,
        "warningCommunity": status in CONFIRMED,
    }


@app.get("/api/reports")
def list_reports(status: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    return store.list(status, limit, offset)


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    r = store.get(report_id)
    if not r:
        bad("Không tìm thấy báo cáo", 404)
    return r


@app.patch("/api/reports/{report_id}")
async def review_report(report_id: str, body: ReportPatch):
    """W02: người duyệt xác nhận hoặc loại. Xác nhận thì nhãn có hiệu lực 90 ngày."""
    if not store.get(report_id):
        bad("Không tìm thấy báo cáo", 404)
    r = store.set_status(report_id, body.status)
    await relay.publish("tnv-tran-bien", "report.updated", {"reportId": report_id, "status": r["status"]}, "server")
    return r


@app.post("/api/reports/{report_id}/appeal")
async def appeal_report(report_id: str, body: AppealIn):
    """Kênh khiếu nại báo oan."""
    if not store.get(report_id):
        bad("Không tìm thấy báo cáo", 404)
    r = store.set_appeal(report_id, mask(nfc(body.text).strip())[0])
    await relay.publish("tnv-tran-bien", "report.updated", {"reportId": report_id, "status": r["status"], "appeal": True}, "server")
    return r


@app.get("/api/stats")
def stats(month: str | None = None):
    return store.stats(month)


# ---------------- phục vụ app React đã build (một địa chỉ cho cả demo) ----------------

_static = config.env("LCS_STATIC") or str(Path(__file__).resolve().parents[2] / "app" / "dist")
if os.path.isdir(_static):
    app.mount("/", StaticFiles(directory=_static, html=True), name="app")
