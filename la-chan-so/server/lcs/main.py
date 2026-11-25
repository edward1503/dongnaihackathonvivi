"""Máy chủ Lá chắn số: API cho app, Android, Zalo và web đội tình nguyện.

Chạy:  uvicorn lcs.main:app --host 0.0.0.0 --port 8000
Trang của Mảng 5, 6 (mvp/zalo.html, mvp/web.html) chạy thẳng trên máy chủ này qua lớp tương thích (compat.py).
"""
import hmac
import json
import logging
import os
import re
import shutil
import secrets
from typing import Literal
import uuid
from pathlib import Path

from fastapi import (Body, Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile, WebSocket,
                     WebSocketDisconnect)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from . import ai, compat, config, demo, giong, hieu_y, live_call, roleplay
from . import team
from .evidence import Evidence, Submission, fail, key_hash, timestamp, verify_signature, verify_receipt
from .audio import has_audio_stream, prepare as prepare_audio
from .analyze import NeedInput, analyze_call, analyze_text
from .checker import check_target
from .contract import (AlertIn, AnalysisResult, AppealIn, AppealResolveIn, AskIn, AskReplyIn, BroadcastIn, CheckIn, Code, LegacyAppeal, LegacyVote, Vote, Withdrawal,
                       EventIn, IntentIn, LiveTurnIn, LegacyReplyIn, MessageIn, SpeakIn)
from .data import LESSONS, OFFICIAL_NUMBERS, SCAM_TYPES
from .masking import mask
from .relay import Relay, RelayError
from .reports import REPORTS, Store
from .text import detect_kind, digits, nfc, target_key

MAX_AUDIO = 20 * 1024 * 1024
LCS_ROOT = Path(__file__).resolve().parents[2]  # thư mục la-chan-so/



class _HideNumbers(logging.Filter):
    """Nhật ký truy cập của uvicorn không được ghi số người gọi nằm trong đường dẫn tra số."""
    PATTERNS = [(re.compile(r"(/api/cases/)[^?\s]*(/vote)"), r"\1•••\2"), (re.compile(r"(/api/lookup/phone/)[^?\s]*"), r"\1•••"), (re.compile(r"([?&]v=)[^&\s]*"), r"\1•••")]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple) and len(record.args) >= 3 and isinstance(record.args[2], str):
            path = record.args[2]
            for pat, sub in self.PATTERNS:
                path = pat.sub(sub, path)
            record.args = record.args[:2] + (path,) + record.args[3:]
        return True


logging.getLogger("uvicorn.access").addFilter(_HideNumbers())

app = FastAPI(title="Lá chắn số", version="0.3.0")
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
for saved in store.db.execute("SELECT payload, device FROM linked_alerts ORDER BY rowid"):
    alert = json.loads(saved[0])
    alerts.owners[alert["id"]] = saved["device"]
    alerts.items.insert(0, alert)
    relay.asks[alert["id"]] = compat.FAMILY_ROOM


def bad(msg: str, code: int = 400):
    raise HTTPException(status_code=code, detail=msg)


# ---------------- chung ----------------

@app.get("/api/health")
def health():
    return {"ok": True, "ai": ai.available(), "intentAI": hieu_y.available(), "ffmpeg": bool(shutil.which("ffmpeg")),
            "today": config.demo_today().isoformat()}


@app.get("/api/scam-types")
def scam_types():
    """Danh sách kiểu lừa đảo chung của đội, kèm mã bài học của Mảng 4 (null: chưa có bài, mở thư viện)."""
    return [{"id": k, "label": v, "lesson": LESSONS.get(k)} for k, v in SCAM_TYPES.items()]


@app.post("/api/demo/reset")
@app.post("/api/reset")
async def demo_reset():
    """Đưa dữ liệu về đầu kịch bản và báo mọi máy đang mở (app: demo.reset, trang Zalo/web: reset)."""
    if config.env("LCS_DEMO") != "1":
        bad("Chỉ đặt lại được trong chế độ demo.", 403)
    store.reset()
    alerts.reset()
    await relay.reset()
    hub.emit("reset", {})
    return {"ok": True}


@app.get("/api/demo/links")
def demo_links(request: Request):
    """Địa chỉ cho điện thoại trong mạng LAN (HTTPS nếu chạy bằng chay-demo.py)."""
    return demo.links(str(request.base_url))


@app.get("/api/demo/qr.svg")
def demo_qr(request: Request, path: str = "/"):
    """Mã QR mở một trang của chính máy chủ này trên điện thoại. Chỉ nhận đường dẫn bắt đầu bằng "/"."""
    if not path.startswith("/") or path.startswith("//"):
        bad("Đường dẫn phải bắt đầu bằng /")
    svg = demo.qr_svg(demo.public_base(str(request.base_url)) + path)
    if svg is None:
        bad("Máy chủ chưa cài thư viện qrcode (pip install qrcode)", 501)
    return Response(svg, media_type="image/svg+xml", headers={"Cache-Control": "no-store"})


# ---------------- S1, S2: kiểm tra nhanh ----------------

@app.get("/api/lookup/phone/{phone}", response_model=AnalysisResult)
def lookup_phone(phone: str):
    """Bản nhanh cho N1 lúc đổ chuông: không gọi AI."""
    if len(digits(phone)) < 3:
        bad("Số này ngắn quá, bạn kiểm tra lại nhé")
    return check_target("phone", phone, store)


@app.get("/api/lookup")
def lookup_legacy(v: str = ""):
    value = compat.strip_tk(nfc(v).strip())
    kind = detect_kind(value, "account" if v.strip().upper().startswith("TK") else None)
    with store.transaction():
        found = store.target_level(target_key(kind, value), config.now(), kind)
        checked = check_target(kind, value, store, found) if kind in ("phone", "account", "link") else None
    return {**store.public_level(found), "kind": SCAM_TYPES.get(found["scamType"]),
            "why": checked.why if checked else [], "headline": checked.headline if checked else "Chưa rõ.",
            "until": found["until"]}


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
    eventId: str | None = Form(None), targetKey: str | None = Form(None), receipt: str | None = Form(None),
    at: str | None = Form(None), durationSec: int | None = Form(None, ge=0),
    evidence_type: Literal["call_log"] = Form("call_log", alias="type"),
    direction: Literal["incoming"] = Form("incoming"), x_lcs_device: str | None = Header(None),
):
    """S3: nhận tệp ghi âm (không lưu) hoặc bản chép lời; trả kết quả cho màn A04b."""
    proof = None
    lookup_number = phone
    try:
        if any(v is not None for v in (eventId, targetKey, receipt, at)):
            if not (eventId and receipt and targetKey and re.fullmatch("[0-9a-f]{64}", targetKey) and at):
                fail("Thiếu biên nhận hoặc khóa đối tượng dạng băm.")
            proof = Evidence(type=evidence_type, direction=direction, at=at, durationSec=durationSec)
            with store.transaction():
                verify_receipt(store.secret(x_lcs_device), x_lcs_device, eventId, targetKey, proof, receipt, config.now())
                store.bind_event(eventId, x_lcs_device, proof, targetKey)
                if phone and key_hash(target_key("phone", phone)) != targetKey:
                    fail("Số hiển thị không khớp biên nhận.")
                if not phone:
                    # Android sends only the digest during analysis. Resolve known community/directory keys locally.
                    known = store.db.execute("""SELECT r.key FROM evidence_reports r JOIN events e ON e.id=r.event
                        WHERE e.digest=? AND r.kind='phone' LIMIT 1""", (targetKey,)).fetchone()
                    lookup_number = known[0] if known else next((n for n in OFFICIAL_NUMBERS if key_hash(n) == targetKey), None)
        data = await audio.read(MAX_AUDIO + 1) if audio else None
        if data and len(data) > MAX_AUDIO:
            bad("Tệp ghi âm lớn quá (tối đa 20 MB)", 413)
        if proof and data and not transcript and not await has_audio_stream(data):
            fail("Tệp không có luồng âm thanh đọc được. Bà vẫn có thể báo bằng nhật ký cuộc gọi ạ.")
        result = await analyze_call(store, audio=data, mime=audio.content_type if audio else None,
                                    transcript=transcript, phone=lookup_number, unknown_number=unknownNumber,
                                    filename=audio.filename if audio else None)
        if proof and not phone:
            result.display = "Cuộc gọi"
            result.communityLevel = result.communityLevel or "unknown"
        if proof and data and not transcript and result.source == "ai" and result.aiLevel:
            store.save_analysis(x_lcs_device, eventId, proof, targetKey, result)
        return result
    except NeedInput as e:
        bad(str(e))
    finally:
        if audio:
            await audio.close()


# ---------------- S5: đồng bộ ba máy ----------------

def _room(room: str) -> str:
    try:
        return relay.check_room(room)
    except RelayError as e:
        bad(str(e))


async def publish_client_event(room, event_type, data, sender):
    if not isinstance(data, dict):
        raise RelayError("Nội dung sự kiện không hợp lệ.")
    related = alerts.get(data.get("askId") or data.get("alertId"))
    if event_type in ("report.created", "report.updated") or (event_type == "ask.reply" and related and related.get("reportId")):
        raise RelayError("Sự kiện này cần gửi qua đường xác nhận của máy chủ.")
    return await relay.publish(room, event_type, data, sender)


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, room: str = "gia-dinh-hoa", since: int = 0, who: str = "app"):
    try:
        relay.check_room(room)
    except RelayError:
        await websocket.close(code=1008)
        return
    if room == compat.VOLUNTEER_ROOM and websocket.headers.get("x-lcs-team") not in team.sessions:
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
                await publish_client_event(room, str(msg.get("type")), msg.get("data") or {}, str(msg.get("from") or who))
            except (ValueError, AttributeError, RelayError) as e:
                await websocket.send_json({"error": str(e) or "Sự kiện không hợp lệ"})
    except WebSocketDisconnect:
        pass
    finally:
        relay.leave(room, websocket)


@app.post("/api/events")
async def post_event(body: EventIn):
    try:
        return await publish_client_event(body.room, body.type, body.data, body.sender)
    except RelayError as e:
        bad(str(e))


@app.get("/api/events")
def get_events(request: Request, room: str | None = None, since: int = 0):
    """Có ?room: trả JSON (app hỏi định kỳ). Không có ?room hoặc EventSource: luồng SSE cho trang Zalo/web."""
    if room is None or "text/event-stream" in request.headers.get("accept", ""):
        require_family(request)
        return hub.response(request)
    if room == compat.VOLUNTEER_ROOM:
        team.require_team(request.headers.get("x-lcs-team"))
    return {"events": relay.history(_room(room), since)}


async def _publish_alert(alert: dict, room: str, sender: str) -> dict:
    relay.asks[alert["id"]] = room  # cảnh báo dùng được như câu hỏi: Minh trả lời thì về màn A08c
    alerts.add(alert)
    # The room relay is for Android. Only the paired Zalo session receives linked evidence.
    public = {"alertId": alert["id"]} if alert.get("reportId") else alert
    await relay.publish(room, "alert.created", public, sender)
    return alert


# /zalo is the pre-paired Minh demo entry point. An alert id or room name is not a reply credential.
family_token = secrets.token_urlsafe(32)


def require_family(request: Request):
    if not secrets.compare_digest(request.cookies.get("lcs_family", "").encode(), family_token.encode()):
        fail("Bạn mở trang Zalo của Minh để xem cảnh báo gia đình nhé.", 401)


def family_alert(alert_id):
    alert = alerts.get(alert_id)
    if not alert or alert.get("room", compat.FAMILY_ROOM) != compat.FAMILY_ROOM:
        fail("Không thấy cảnh báo của gia đình này.", 404)
    return alert


@app.get("/api/alerts", dependencies=[Depends(require_family)])
def list_alerts():
    with store.transaction():
        now = config.now()
        visible = [a.copy() for a in alerts.items if a.get("room", compat.FAMILY_ROOM) == compat.FAMILY_ROOM]
        for a in visible:
            if a.get("reportId"):
                a["selfAnswer"] = store.row(a["reportId"])["self_answer"]
                a["case"] = store.public_level(store.target_level(target_key("phone", a["number"]), now))
        return visible


@app.post("/api/alerts", status_code=201)
async def create_alert(body: AlertIn, x_lcs_device: str | None = Header(None)):
    _room(body.room)
    if body.reportId or body.analysisId:
        with store.transaction():
            store.secret(x_lcs_device)
            r = store.row(body.reportId)
            if r["device"] != x_lcs_device or body.room != compat.FAMILY_ROOM:
                fail("Cảnh báo không thuộc máy hoặc gia đình này.", 403)
            if not r["analysis"] or body.eventId != r["event"] or body.analysisId != r["analysis"]:
                fail("Liên kết báo cáo, cuộc gọi và bản ghi không khớp.")
            old = store.db.execute("SELECT payload FROM linked_alerts WHERE report=?", (r["id"],)).fetchone()
            if old:
                return {**json.loads(old[0]), "case":store.public_level(store.target_level(r["key"], config.now()))}
            alert = compat.make_alert(level=r["level"], number=r["key"], scenario=SCAM_TYPES.get(r["scam"]),
                                      scam_type=r["scam"], summary=r["summary"], asked_transfer=bool(r["transfer"]),
                                      timeline=[{"text":"Bà đã gửi báo cáo về cuộc gọi này."}])
            alert.update(reportId=r["id"], analysisId=r["analysis"], eventId=r["event"], aiLevel=r["level"],
                         room=compat.FAMILY_ROOM, callSeconds=store.db.execute(
                             "SELECT duration FROM events WHERE id=?", (r["event"],)).fetchone()[0])
            alert["case"] = store.public_level(store.target_level(r["key"], config.now()))
            store.db.execute("INSERT INTO linked_alerts VALUES (?,?,?,?,?,?)", (alert["id"],r["id"],r["analysis"],
                                                                               r["event"],x_lcs_device,json.dumps(alert)))
        alerts.owners[alert["id"]] = x_lcs_device
        return await _publish_alert(alert, compat.FAMILY_ROOM, body.sender)
    dedupe = (body.room, x_lcs_device, body.eventId) if body.eventId else None
    if dedupe in alerts.by_event:
        return alerts.get(alerts.by_event[dedupe])
    scenario = body.scenario or body.scamLabel or SCAM_TYPES.get(body.scamType)
    asked = body.askedTransfer if body.askedTransfer is not None else bool(body.asksMoney)
    alert = compat.make_alert(level=body.level, who=body.who, number=body.number or body.phone, scenario=scenario,
                              scam_type=body.scamType, asked_transfer=asked, call_seconds=body.callSeconds,
                              summary=body.summary, timeline=body.timeline or None)
    alert["room"] = body.room
    if body.kind in ("call", "message"):
        alert["kind"] = body.kind
    if x_lcs_device:
        alerts.owners[alert["id"]] = x_lcs_device
    if dedupe:
        alerts.by_event[dedupe] = alert["id"]
    return await _publish_alert(alert, body.room, body.sender)


@app.post("/api/alerts/{alert_id}/reply", dependencies=[Depends(require_family)])
async def alert_reply(alert_id: str, body: LegacyReplyIn):
    alert = family_alert(alert_id)
    preset = compat.CHOICE_TO_PRESET[body.choice]
    if alert.get("reportId"):
        with store.transaction():
            link = store.db.execute("SELECT * FROM linked_alerts WHERE id=?", (alert_id,)).fetchone()
            if not link:
                fail("Liên kết cảnh báo không còn hiệu lực.", 409)
            if body.text and body.text.strip() != compat.REPLY_TEXT[preset]:
                fail("Chọn một trong hai câu trả lời trên cảnh báo nhé.")
            if alert.get("reply") and alert["reply"]["choice"] == body.choice:
                return {**alert, "case":store.public_level(store.target_level(target_key("phone", alert["number"]), config.now()))}
            r = store.row(link["report"])
            now = config.now()
            store.db.execute("INSERT INTO relative_replies VALUES (?,?,?,?,?,?)",
                             (alert_id, r["id"], r["analysis"], "minh", body.choice, now.isoformat()))
            store.answer(r, "relative", body.choice, now)
            result = store.response(r["id"], now)
            # Build a copy. Emit only after the transaction has committed.
            updated = json.loads(link["payload"])
            data = compat.set_reply(updated, preset, None, now.isoformat())
            updated["case"] = result["case"]
            store.db.execute("UPDATE linked_alerts SET payload=? WHERE id=?", (json.dumps(updated), alert_id))
        alert.update(updated)
        hub.emit("reply", {"alertId": alert_id, "reply": alert["reply"], "case": alert["case"]})
    else:
        data = alerts.apply_reply(alert_id, preset, body.text)
    await relay.publish(compat.FAMILY_ROOM, "ask.reply", data, "minh")
    if alert.get("reportId"):
        await changed(r["key"])
    return alert


@app.get("/api/family/unread")
def unread_family_replies(x_lcs_device: str = Header()):
    with store.transaction():
        store.secret(x_lcs_device)
        return [{"askId": a["id"], "reply": a["reply"]} for a in alerts.items
                if alerts.owners.get(a["id"]) == x_lcs_device and a.get("reply")
                and not a["reply"].get("seenAt")]


@app.post("/api/alerts/{alert_id}/reply/{reply_id}/seen")
async def mark_reply_seen(alert_id: str, reply_id: str, x_lcs_device: str = Header()):
    with store.transaction():
        store.secret(x_lcs_device)
        a = alerts.get(alert_id)
        if not a or alerts.owners.get(alert_id) != x_lcs_device:
            fail("Không thấy lời nhắn trên máy này.", 404)
        reply = a.get("reply") or {}
        if (reply.get("id") or reply.get("at")) != reply_id:
            fail("Lời nhắn đã thay đổi.", 409)
        if reply.get("seenAt"):
            return {"seenAt": reply["seenAt"]}
        updated = {**a, "reply": {**reply, "seenAt": compat.now_iso()}}
        if a.get("reportId"):
            store.db.execute("UPDATE linked_alerts SET payload=? WHERE id=?", (json.dumps(updated), alert_id))
    a.update(updated)
    await relay.publish(a.get("room", compat.FAMILY_ROOM), "alert.timeline", {"alertId": alert_id}, "ba-hoa")
    return {"seenAt": updated["reply"]["seenAt"]}


@app.post("/api/alerts/{alert_id}/call", dependencies=[Depends(require_family)])
async def alert_call(alert_id: str):
    """Minh bấm "Gọi mẹ ngay": máy bà Hoa hiện thông báo."""
    family_alert(alert_id)
    a = alerts.add_timeline(alert_id, "Minh bấm gọi mẹ", "safe")
    if a and a.get("reportId"):
        with store.transaction():
            store.db.execute("UPDATE linked_alerts SET payload=? WHERE id=?", (json.dumps(a), alert_id))
    if not a:
        bad("Không thấy cảnh báo này", 404)
    hub.emit("call", {"alertId": alert_id, "at": compat.now_iso()})
    await relay.publish(relay.asks.get(alert_id, compat.FAMILY_ROOM), "alert.call", {"alertId": alert_id}, "minh")
    return a


@app.post("/api/asks")
async def create_ask(body: AskIn, x_lcs_device: str | None = Header(None)):
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
    alert["room"] = body.room
    if x_lcs_device:
        alerts.owners[ask_id] = x_lcs_device
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
    if (alerts.get(ask_id) or {}).get("reportId"):
        fail("Dùng phiên Zalo để trả lời cảnh báo này.", 403)
    data = alerts.apply_reply(ask_id, body.preset, body.text)
    await relay.publish(room, "ask.reply", data, body.sender)
    return data


# ---------------- S6: báo cáo, kiểm duyệt, thống kê ----------------

@app.post("/api/devices")
def register_device():
    return store.register()


@app.post("/api/team/login")
def team_login(body: team.Login, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        if x_lcs_device:
            store.secret(x_lcs_device)
        result = team.login(body.code, x_lcs_device)
        if x_lcs_device:
            store.db.execute("INSERT OR IGNORE INTO member_devices VALUES (?,?)", (result["member"]["id"], x_lcs_device))
        return result


async def changed(key, event="report.updated"):
    with store.transaction():
        level = store.public_level(store.target_level(key, config.now()))
        linked = store.db.execute("""SELECT 1 FROM linked_alerts a JOIN evidence_reports r ON r.id=a.report
                                     WHERE r.key=? LIMIT 1""", (key,)).fetchone()
    await relay.publish(compat.VOLUNTEER_ROOM, event, level, "server")
    await relay.publish(compat.FAMILY_ROOM, "report.updated", level if linked else {}, "server")
    if linked:
        hub.emit("community", level)


@app.post("/api/reports")
async def create_report(body: Submission, x_lcs_device: str | None = Header(None)):
    result = store.submit(body, x_lcs_device)
    await changed(result["case"]["key"], "report.created")
    return result


@app.post("/api/reports/{report_id}/withdraw")
async def withdraw(report_id: str, body: Withdrawal, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        secret = store.secret(x_lcs_device)
        r = store.row(report_id)
        if r["device"] != x_lcs_device:
            fail("Chỉ máy đã gửi mới rút được báo cáo.", 403)
        at = body.at
        if timestamp(at) > config.now():
            fail("Thời điểm rút báo cáo không hợp lệ.")
        verify_signature(secret, f"withdraw|{report_id}|{x_lcs_device}|{at}", body.signature)
        store.db.execute("UPDATE evidence_reports SET terminal='withdrawn' WHERE id=?", (report_id,))
        result = store.response(report_id, config.now())
    await changed(r["key"])
    return result


@app.get("/api/reports", dependencies=[Depends(team.require_team)])
def list_reports(status: str | None = None, limit: int = Query(20, ge=1, le=500), offset: int = Query(0, ge=0)):
    with store.transaction():
        now = config.now()
        rows = [store.public_report(r, now) for r in store.db.execute(REPORTS + " ORDER BY r.created DESC")]
        if status:
            rows = [r for r in rows if r["status"] == status]
        return {"total": len(rows), "items": rows[offset:offset+limit]}


@app.get("/api/reports/{report_id}", dependencies=[Depends(team.require_team)])
def get_report(report_id: str):
    with store.transaction():
        return store.public_report(store.row(report_id), config.now())


@app.get("/api/cases")
def cases(status: Literal["open", "decided"] = "open", limit: int = Query(100, ge=1, le=500), member=Depends(team.require_team)):
    rows = store.cases(status, limit, member)
    return {"items": rows}


@app.post("/api/cases/{key:path}/vote")
async def vote(key: str, body: Vote, member=Depends(team.require_team)):
    result = store.vote(key, body.reviewId, body.decision, body.note, member)
    await changed(key)
    return result


@app.patch("/api/reports/{report_id}")
@app.post("/api/reports/{report_id}/decision")
async def legacy_vote(report_id: str, body: LegacyVote, member=Depends(team.require_team)):
    with store.transaction():
        key = store.row(report_id)["key"]
        review = body.reviewId
        if not review:
            row = store.db.execute("""SELECT v.id FROM reviews v JOIN snapshot s ON s.review=v.id
                    WHERE s.report=? AND v.status='open' ORDER BY v.rowid DESC LIMIT 1""", (report_id,)).fetchone()
            if not row:
                fail("Báo cáo chưa có đợt xét đang mở.", 409)
            review = row[0]
        choice = body.decision or body.status
        decision = {"confirmed":"confirm","rejected":"reject"}.get(choice,choice)
        result = store.vote(key, review, decision, body.note, member, report_id)
    await changed(key)
    return result


@app.post("/api/appeals")
def create_appeal(body: AppealIn, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        return store.create_appeal(body, x_lcs_device)


@app.post("/api/appeals/{aid}/verify")
async def verify_appeal(aid: str, body: Code, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        store.secret(x_lcs_device)
        result = store.verify_appeal(aid, x_lcs_device, body.code)
    await changed(target_key("phone", result["target"]))
    return result


@app.get("/api/appeals", dependencies=[Depends(team.require_lead)])
def list_appeals():
    with store.transaction():
        return {"items": [store.appeal_out(a) for a in store.db.execute("SELECT * FROM appeals ORDER BY rowid DESC")]}


@app.post("/api/appeals/{aid}/resolve", dependencies=[Depends(team.require_lead)])
async def resolve_appeal(aid: str, body: AppealResolveIn):
    with store.transaction():
        result = store.resolve(aid, body)
    await changed(target_key("phone", result["target"]))
    return result


@app.post("/api/reports/{report_id}/appeal")
def legacy_appeal(report_id: str, body: LegacyAppeal, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        r = store.row(report_id)
        if r["kind"] != "phone":
            fail("Chỉ xác minh được số điện thoại.")
        return store.create_appeal(AppealIn(target=r["key"], kind="phone", contact=body.contact or r["key"],
                                            text=body.text), x_lcs_device)


def appeal_for_report(report_id, status, device=None):
    key = store.row(report_id)["key"]
    row = store.db.execute("""SELECT id FROM appeals WHERE key=? AND status=? AND (? IS NULL OR device=?)
                           ORDER BY rowid DESC LIMIT 1""", (key, status, device, device)).fetchone()
    if not row:
        fail("Không có khiếu nại đang chờ ở bước này.", 409)
    return row[0]


@app.post("/api/reports/{report_id}/appeal/verify")
async def legacy_verify(report_id: str, body: Code, x_lcs_device: str | None = Header(None)):
    with store.transaction():
        aid = appeal_for_report(report_id, "pending_verification", x_lcs_device)
    return await verify_appeal(aid, body, x_lcs_device)


@app.post("/api/reports/{report_id}/appeal/resolve", dependencies=[Depends(team.require_lead)])
async def legacy_resolve(report_id: str, body: AppealResolveIn):
    with store.transaction():
        aid = appeal_for_report(report_id, "verified")
    return await resolve_appeal(aid, body)


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
                clip, kind = await prepare_audio(data, audio.content_type or "audio/webm", audio.filename)
                text = await ai.transcribe_plain(clip, kind)
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


def require_roleplay_token(x_lcs_token: str = Header(default="")):
    expected = config.env("LCS_TOKEN")
    if expected and not hmac.compare_digest(expected.encode(), x_lcs_token.encode()):
        bad("Token không hợp lệ", 401)


@app.post("/api/roleplay/live", dependencies=[Depends(require_roleplay_token)])
async def roleplay_live(body: LiveTurnIn):
    try:
        return await live_call.live_turn(body)
    except live_call.InvalidTurn as e:
        bad(str(e), 422)
    except (ai.AIUnavailable, giong.CannotSpeak) as e:
        bad(str(e), 503)


@app.post("/api/roleplay/intent", dependencies=[Depends(require_roleplay_token)])
async def roleplay_intent(body: IntentIn):
    """Hiểu ý một lượt của người học: {ideas[], intent, wantsStop, offScript}. Không lưu lời người học."""
    try:
        return await hieu_y.classify(body.scene, body.text, body.lastLine, body.scored)
    except hieu_y.SceneUnsupported as e:
        bad(str(e), 422)
    except hieu_y.DataMissing as e:
        bad(str(e), 503)
    except ai.AIUnavailable:
        bad("Chưa có khóa AI hoặc AI không trả lời; app dùng luật trên máy", 503)


@app.post("/api/roleplay/speak", dependencies=[Depends(require_roleplay_token)])
async def roleplay_speak(body: SpeakIn):
    """Đọc một câu bằng giọng Gemini của nhân vật (kể cả Bé Nai), dùng lại tiếng đã lưu: {text, audio (PCM16 base64), sampleRate, seconds}."""
    try:
        return await giong.speak(body.text, body.character)
    except giong.CannotSpeak as e:
        bad(str(e), 503)


@app.get("/api/broadcasts")
def list_broadcasts():
    return alerts.broadcasts


@app.post("/api/broadcasts", status_code=201)
def create_broadcast(body: BroadcastIn, member=Depends(team.require_lead)):
    """W03: gửi cảnh báo, tới cả Zalo người thân đã ghép."""
    if not body.title.strip() or not body.body.strip():
        bad("thiếu tiêu đề hoặc nội dung")
    return compat.broadcast(body.title.strip(), body.body.strip(), body.to, member["name"])


# ---------------- Trang tĩnh: trang Mảng 5, 6 và app React đã build ----------------

def _serve(path: Path):
    """Trả đúng một tệp cố định. Hàm không nhận tham số nào để không ai đổi được đường dẫn tệp."""
    def endpoint():
        return FileResponse(path, headers={"Cache-Control": "no-cache"})   # sửa trang xong tải lại là thấy
    return endpoint


@app.get("/zalo", include_in_schema=False)
def zalo_page():
    response = FileResponse(LCS_ROOT / "mvp/zalo.html", headers={"Cache-Control": "no-store"})
    response.set_cookie("lcs_family", family_token, httponly=True, samesite="strict")
    return response


for _route, _file in (("/web", "mvp/web.html"),
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


def mvp_portal():
    """Preserve the two-page launcher's landing page while sharing the complete FastAPI backend."""
    portal = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    portal.add_api_route("/", _serve(LCS_ROOT / "mvp/index.html"), methods=["GET"])
    portal.mount("/", app)
    return portal
