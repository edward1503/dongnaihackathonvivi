"""Máy chủ Lá chắn số: API cho app, Android, Zalo và web đội tình nguyện.

Chạy:  uvicorn lcs.main:app --host 0.0.0.0 --port 8000
Trang của Mảng 5, 6 (mvp/zalo.html, mvp/web.html) chạy thẳng trên máy chủ này qua lớp tương thích (compat.py).
"""
import json
import os
import uuid
from pathlib import Path

from fastapi import (Body, FastAPI, File, Form, HTTPException, Query, Request, UploadFile, WebSocket,
                     WebSocketDisconnect)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from . import ai, compat, config, roleplay
from .analyze import NeedInput, analyze_call, analyze_text
from .checker import check_target
from .contract import (AlertIn, AnalysisResult, AppealIn, AskIn, AskReplyIn, BroadcastIn, CheckIn, DecisionIn,
                       EventIn, LegacyReplyIn, MessageIn, ReportIn, ReportPatch)
from .data import SCAM_TYPES
from .masking import has_otp, mask
from .relay import Relay, RelayError
from .reports import CONFIRMED, Store
from .text import detect_kind, digits, nfc, target_key

MAX_AUDIO = 20 * 1024 * 1024
LCS_ROOT = Path(__file__).resolve().parents[2]  # thư mục la-chan-so/

app = FastAPI(title="Lá chắn số", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in (config.env("LCS_CORS", "*") or "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)
store = Store()
relay = Relay()
alerts = compat.alerts
hub = compat.hub


def bad(msg: str, code: int = 400):
    raise HTTPException(status_code=code, detail=msg)


# ---------------- chung ----------------

@app.get("/api/health")
def health():
    return {"ok": True, "ai": ai.available(), "today": config.demo_today().isoformat()}


@app.post("/api/demo/reset")
@app.post("/api/reset")
async def demo_reset():
    """Đưa dữ liệu về đầu kịch bản và báo mọi máy đang mở (app: demo.reset, trang Zalo/web: reset)."""
    store.reset()
    alerts.reset()
    await relay.reset()
    hub.emit("reset", {})
    return {"ok": True}


# ---------------- S1, S2: kiểm tra nhanh ----------------

@app.get("/api/lookup/phone/{phone}", response_model=AnalysisResult)
def lookup_phone(phone: str):
    """Bản nhanh cho N1 lúc đổ chuông: không gọi AI."""
    if len(digits(phone)) < 3:
        bad("Số này ngắn quá, bạn kiểm tra lại nhé")
    return check_target("phone", phone, store)


@app.get("/api/lookup")
def lookup_legacy(v: str = ""):
    """Dạng của trang Zalo: chỉ danger hoặc unknown."""
    value = compat.strip_tk(nfc(v).strip())
    kind = detect_kind(value, None) if value else "message"
    if kind == "message":
        return {"level": "unknown"}
    found = store.lookup(target_key(kind, value))
    if found["count"]:
        return {"level": "danger", "kind": SCAM_TYPES.get(found.get("scamType") or "", "Lừa đảo"),
                "until": found.get("until")}
    return {"level": "unknown"}


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
def get_events(request: Request, room: str | None = None, since: int = 0):
    """Có ?room: trả JSON (app hỏi định kỳ). Không có ?room hoặc EventSource: luồng SSE cho trang Zalo/web."""
    if room is None or "text/event-stream" in request.headers.get("accept", ""):
        return hub.response(request)
    return {"events": relay.history(_room(room), since)}


async def _publish_alert(alert: dict, room: str, sender: str) -> dict:
    relay.asks[alert["id"]] = room  # cảnh báo dùng được như câu hỏi: Minh trả lời thì về màn A08c
    alerts.add(alert)
    await relay.publish(room, "alert.created", alert, sender)
    return alert


@app.get("/api/alerts")
def list_alerts():
    return alerts.items


@app.post("/api/alerts", status_code=201)
async def create_alert(body: AlertIn):
    """N1, N2, N3 (Android) hoặc màn A04b gọi khi Lá chắn quyết định báo người thân.
    Minh chỉ thấy mức cảnh báo và tóm tắt đã che."""
    _room(body.room)
    scenario = body.scenario or body.scamLabel or (SCAM_TYPES.get(body.scamType) if body.scamType else None)
    asked = body.askedTransfer if body.askedTransfer is not None else bool(body.asksMoney)
    alert = compat.make_alert(
        level=body.level, who=body.who, number=body.number or body.phone, scenario=scenario,
        scam_type=body.scamType, asked_transfer=asked, call_seconds=body.callSeconds,
        summary=body.summary, timeline=body.timeline or None,
    )
    return await _publish_alert(alert, body.room, body.sender)


@app.post("/api/alerts/{alert_id}/reply")
async def alert_reply(alert_id: str, body: LegacyReplyIn):
    """Trang Zalo (Z2): Minh trả lời một chạm trên cảnh báo."""
    if not alerts.get(alert_id):
        bad("Không thấy cảnh báo này", 404)
    preset = compat.CHOICE_TO_PRESET[body.choice]
    data = alerts.apply_reply(alert_id, preset, body.text)
    await relay.publish(relay.asks.get(alert_id, compat.FAMILY_ROOM), "ask.reply", data, "minh")
    return alerts.get(alert_id)


@app.post("/api/alerts/{alert_id}/call")
async def alert_call(alert_id: str):
    """Minh bấm "Gọi mẹ ngay": máy bà Hoa hiện thông báo."""
    a = alerts.add_timeline(alert_id, "Minh bấm gọi mẹ", "safe")
    if not a:
        bad("Không thấy cảnh báo này", 404)
    hub.emit("call", {"alertId": alert_id, "at": compat.now_iso()})
    await relay.publish(relay.asks.get(alert_id, compat.FAMILY_ROOM), "alert.call", {"alertId": alert_id}, "minh")
    return a


@app.post("/api/asks")
async def create_ask(body: AskIn):
    """U4 (A08a): bà Hoa gửi câu hỏi cho người thân. Trang Zalo của Minh nhận như một cảnh báo."""
    _room(body.room)
    if not nfc(body.text).strip():
        bad("Lời nhắn đang trống")
    ask_id = "ask_" + uuid.uuid4().hex[:8]
    text = mask(body.text, phones=False)[0]
    alert = compat.make_alert(
        alert_id=ask_id, level=body.level or "danger", number=body.phone, scenario=body.scamLabel,
        scam_type=body.scamType, asked_transfer=body.asksMoney, summary=text, keep_phones=True, source="ask",
        timeline=[{"text": "Mẹ bấm Hỏi người thân", "tone": "warn"}],
    )
    relay.asks[ask_id] = body.room
    alerts.add(alert)
    data = {"askId": ask_id, "to": body.to, "text": text, "alertId": body.alertId}
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
    """Minh trả lời một chạm; máy bà Hoa hiện to và đọc thành tiếng (A08c)."""
    room = _ask_room(ask_id)
    data = alerts.apply_reply(ask_id, body.preset, body.text)
    await relay.publish(room, "ask.reply", data, body.sender)
    return data


# ---------------- S6: báo cáo, kiểm duyệt, thống kê ----------------

async def _create_report(body: ReportIn) -> dict:
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
        kind=body.kind, key_kind=key_kind, target=target, story=story_masked, has_audio=body.hasAudio,
        lost_money=body.lostMoney, area=body.area, group=body.group, status=status, ai_type=scam_type,
        ai_label=label or SCAM_TYPES.get(scam_type or "khac"), ai_confidence=round(confidence, 2), reporter=body.reporter,
    )
    total = store.add_points(body.reporter, 10)
    await relay.publish(compat.VOLUNTEER_ROOM, "report.created",
                        {"reportId": report["id"], "status": status, "scamType": scam_type}, "server")
    hub.emit("report", compat.legacy_report(report))
    return {
        "report": report,
        "reporterCount": report["reporterCount"],
        "points": 10,
        "totalPoints": total,
        "warningCommunity": status in CONFIRMED,
    }


@app.post("/api/reports", status_code=200)
async def create_report(body: dict = Body(...)):
    """U5 (A09a, A09b), Z3. AI phân loại trước; ca chưa chắc mới tới người duyệt (W02).
    Nhận cả dạng của trang Zalo/web: {value, note, source, kind?}."""
    if compat.is_legacy_request(body):
        value = nfc(str(body.get("value") or "")).strip()
        if not value:
            bad("thiếu đối tượng cần báo")
        req = ReportIn(kind=compat.legacy_kind(value, body.get("kind")), target=compat.strip_tk(value),
                       story=body.get("note") or None, area=body.get("area"),
                       reporter="minh" if body.get("source", "zalo") == "zalo" else "khoa")
        return compat.legacy_report((await _create_report(req))["report"])
    try:
        req = ReportIn.model_validate(body)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json()))
    return await _create_report(req)


@app.get("/api/reports")
def list_reports(request: Request, status: str | None = None, limit: int = Query(20, ge=1, le=500),
                 offset: int = Query(0, ge=0)):
    """Có tham số: dạng {total, items}. Không tham số: mảng theo dạng trang web đội tình nguyện."""
    if not request.query_params:
        return [compat.legacy_report(r) for r in store.list(None, 500, 0)["items"]]
    return store.list(status, limit, offset)


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    r = store.get(report_id)
    if not r:
        bad("Không tìm thấy báo cáo", 404)
    return r


async def _decided(report_id: str, r: dict) -> None:
    await relay.publish(compat.VOLUNTEER_ROOM, "report.updated", {"reportId": report_id, "status": r["status"]}, "server")
    hub.emit("report", compat.legacy_report(r))


@app.patch("/api/reports/{report_id}")
async def review_report(report_id: str, body: ReportPatch):
    """W02: người duyệt xác nhận hoặc loại. Xác nhận thì nhãn có hiệu lực 90 ngày."""
    if not store.get(report_id):
        bad("Không tìm thấy báo cáo", 404)
    r = store.set_status(report_id, body.status)
    await _decided(report_id, r)
    return r


@app.post("/api/reports/{report_id}/decision")
async def decide_report(report_id: str, body: DecisionIn):
    """Dạng của trang web: confirmed, spam, rejected, label (gắn nhãn nhẹ), police (chuyển Công an phường)."""
    if not store.get(report_id):
        bad("Không tìm thấy báo cáo", 404)
    status = compat.DECISION_TO_STATUS[body.decision]
    label = (body.label or "Giao hàng") if body.decision == "label" else None
    r = store.set_status(report_id, status, label)
    await _decided(report_id, r)
    return compat.legacy_report(r)


@app.post("/api/reports/{report_id}/appeal")
async def appeal_report(report_id: str, body: AppealIn):
    """Kênh khiếu nại báo oan."""
    if not store.get(report_id):
        bad("Không tìm thấy báo cáo", 404)
    r = store.set_appeal(report_id, mask(nfc(body.text).strip())[0])
    await relay.publish(compat.VOLUNTEER_ROOM, "report.updated", {"reportId": report_id, "status": r["status"], "appeal": True}, "server")
    return r


@app.get("/api/stats")
def stats(month: str | None = None):
    return store.stats(month)


# ---------------- Gọi video khuyên chị Lan (A11h): AI đóng vai và chấm ----------------

@app.post("/api/roleplay/start")
def roleplay_start():
    return roleplay.start()


@app.post("/api/roleplay/turn")
async def roleplay_turn(request: Request):
    """Nhận {sessionId, text}, hoặc multipart {sessionId, audio} để AI chép lời người học trước."""
    if request.headers.get("content-type", "").startswith("multipart/"):
        form = await request.form()
        sid, text, audio = form.get("sessionId"), form.get("text"), form.get("audio")
        if audio is not None and not text:
            data = await audio.read(MAX_AUDIO + 1)
            if len(data) > MAX_AUDIO:
                bad("Đoạn ghi âm dài quá", 413)
            if not ai.available():
                bad("Máy chủ chưa có AI để nghe giọng nói. Bạn bấm Gõ chữ nhé")
            try:
                text = await ai.transcribe_plain(data, audio.content_type or "audio/webm")
            except ai.AIUnavailable:
                bad("Mình chưa nghe rõ. Bạn nói lại hoặc bấm Gõ chữ nhé")
    else:
        body = await request.json()
        sid, text = body.get("sessionId"), body.get("text")
    if not sid:
        bad("Thiếu sessionId")
    if not text or not str(text).strip():
        bad("Mình chưa nghe rõ. Bạn nói lại hoặc bấm Gõ chữ nhé")
    try:
        return await roleplay.turn(str(sid), str(text))
    except KeyError:
        bad("Cuộc gọi đã hết hạn, bạn gọi lại từ đầu nhé", 404)


@app.post("/api/roleplay/finish")
async def roleplay_finish(body: dict = Body(...)):
    try:
        return roleplay.finish(str(body.get("sessionId")))
    except KeyError:
        bad("Không thấy cuộc gọi này", 404)


@app.get("/api/broadcasts")
def list_broadcasts():
    return alerts.broadcasts


@app.post("/api/broadcasts", status_code=201)
def create_broadcast(body: BroadcastIn):
    """W03: gửi cảnh báo, tới cả Zalo người thân đã ghép."""
    if not body.title.strip() or not body.body.strip():
        bad("thiếu tiêu đề hoặc nội dung")
    return compat.broadcast(body.title.strip(), body.body.strip(), body.to)


# ---------------- Trang tĩnh: trang Mảng 5, 6 và app React đã build ----------------

def _serve(path: Path):
    """Trả đúng một tệp cố định. Hàm không nhận tham số nào để không ai đổi được đường dẫn tệp."""
    def endpoint():
        return FileResponse(path)
    return endpoint


for _route, _file in (("/zalo", "mvp/zalo.html"), ("/web", "mvp/web.html"),
                      ("/ds.css", "ds.css"), ("/icons.js", "icons.js"), ("/motion.css", "motion.css"), ("/motion.js", "motion.js")):
    if (LCS_ROOT / _file).is_file():
        app.add_api_route(_route, _serve(LCS_ROOT / _file), methods=["GET"], include_in_schema=False)

if (LCS_ROOT / "assets" / "fonts").is_dir():
    app.mount("/assets/fonts", StaticFiles(directory=LCS_ROOT / "assets" / "fonts"), name="fonts")

# Trang gọi video chị Lan và bộ avatar khớp miệng: cần COOP/COEP như may-chu.py để chạy đa luồng
ISOLATED = ("/prototype/", "/vendor/", "/screens/")
for _dir in ("prototype", "vendor", "screens"):
    if (LCS_ROOT / _dir).is_dir():
        app.mount(f"/{_dir}", StaticFiles(directory=LCS_ROOT / _dir), name=_dir)


@app.middleware("http")
async def cross_origin_isolation(request: Request, call_next):
    resp = await call_next(request)
    if request.url.path.startswith(ISOLATED):
        resp.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        resp.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        resp.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    return resp

_static = config.env("LCS_STATIC") or str(LCS_ROOT / "app" / "dist")
if os.path.isdir(_static):
    app.mount("/", StaticFiles(directory=_static, html=True), name="app")
