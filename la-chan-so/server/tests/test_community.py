"""Exercise the public wire format independently of the server's signature builder."""

import hashlib
import hmac
import io
import uuid
import wave
from datetime import timedelta
from unittest.mock import AsyncMock

import pytest

from lcs import ai, config, main
from lcs.reports import Store

PHONE = "0977000111"


def device(client):
    d = client.post("/api/devices").json()
    assert len(bytes.fromhex(d["deviceId"])) == 8
    return d


def sign(d, value):
    return hmac.new(d["deviceSecret"].encode(), value.encode(), hashlib.sha256).hexdigest()


def headers(d):
    return {"X-LCS-Device": d["deviceId"]}


def member(client, code="246810", d=None):
    return {
        "X-LCS-Team": client.post(
            "/api/team/login", json={"code": code}, headers=headers(d) if d else {}
        ).json()["token"]
    }


def payload(d, target=PHONE, evidence_type="call_log"):
    event = uuid.uuid4().hex
    at = (config.now() - timedelta(seconds=10)).isoformat()
    duration = 12 if evidence_type == "call_log" else None
    evidence = {"type": evidence_type, "at": at}
    if duration is not None:
        evidence["durationSec"] = duration
    receipt = sign(
        d, "|".join((event, d["deviceId"], evidence_type, "incoming", target, at, str(duration or "")))
    )
    return dict(
        eventId=event,
        receipt=receipt,
        relation="self",
        target=target,
        kind="call" if duration else "message",
        evidence=evidence,
    )


def submit(c, d, b, answer=None):
    body = dict(b)
    if answer:
        body.update(selfAnswer=answer, selfAnswerSignature=sign(d, b["eventId"] + "|" + answer))
    return c.post("/api/reports", headers=headers(d), json=body)


def attach_audio(c, d, b, monkeypatch, level="danger", transfer=True):
    text = "Người gọi đòi chuyển tiền." if transfer else "Người gọi đòi mã OTP."
    speech = "Chi tiết riêng cần bỏ khỏi kho. " + text
    monkeypatch.setattr(ai, "available", lambda: True)
    monkeypatch.setattr(ai, "transcribe", AsyncMock(return_value=[{"speaker": "Bà", "text": speech}]))
    monkeypatch.setattr(
        ai,
        "analyze_text",
        AsyncMock(
            return_value=dict(
                level=level,
                scamType="khac",
                confidence=0.88,
                enoughInfo=True,
                headline=text,
                signs=[],
                transferRequested=transfer,
            )
        ),
    )
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setparams((1, 2, 8000, 0, "NONE", "NONE"))
        wav.writeframes(b"\x00\x00" * 800)
    key = hashlib.sha256(b["target"].encode()).hexdigest()
    event, at = b["eventId"], b["evidence"]["at"]
    fields = dict(
        eventId=event,
        targetKey=key,
        at=at,
        durationSec="12",
        type="call_log",
        direction="incoming",
        receipt=sign(d, "|".join((event, d["deviceId"], "call_log", "incoming", key, at, "12"))),
    )
    r = c.post(
        "/api/analyze/call",
        headers=headers(d),
        data=fields,
        files={"audio": ("record.wav", buf.getvalue(), "audio/wav")},
    )
    invalid = c.post("/api/analyze/call", headers=headers(d), data=fields,
                     files={"audio": ("record.wav", b"only text", "audio/wav")})
    assert invalid.status_code == 422
    assert r.status_code == 200, r.text
    result = r.json()
    assert result["analysisId"] == result["id"] and result["aiLevel"] == level
    assert speech not in result["summary"] and "Chi tiết riêng" not in str(list(main.store.db.iterdump()))
    b["evidence"]["recording"] = {k: result[k] for k in ("analysisId", "aiLevel", "aiScamType", "aiConfidence")}
    return result


def link(c, d, b, r):
    body = dict(
        eventId=b["eventId"],
        reportId=r["report"]["id"],
        analysisId=b["evidence"]["recording"]["analysisId"],
        summary="Ghi đè tóm tắt để thử",
    )
    a = c.post("/api/alerts", json=body, headers=headers(d))
    assert a.status_code == 201, a.text
    assert a.json()["summary"] != body["summary"]
    assert c.post("/api/alerts", json=body, headers=headers(d)).json()["id"] == a.json()["id"]
    return a.json()["id"]


def lookup(c, target=PHONE):
    return c.get("/api/lookup", params={"v": target}).json()


def case(c, key, team):
    return next(x for x in c.get("/api/cases", headers=team).json()["items"] if x["key"] == key)


def vote(c, item, team, decision="confirm", note=""):
    return c.post(
        "/api/cases/" + item["key"] + "/vote",
        headers=team,
        json=dict(reviewId=item["reviewId"], decision=decision, note=note),
    )


def test_receipt_binding_and_android_normalisation(client):
    d = device(client)
    b = payload(d)
    assert submit(client, d, {**b, "target": "0977 000 111"}).status_code == 200
    for invalid in (
        {"relation": "on_behalf"},
        {"relation": "none"},
        {"source": "zalo-minh"},
        {"receipt": "a" * 64},
        {"target": "0977000112"},
        {"direction": "outgoing"},
        {"evidence": {**b["evidence"], "type": "screenshot"}},
    ):
        assert submit(client, d, {**b, **invalid}).status_code == 422
    assert submit(client, d, {k: v for k, v in b.items() if k != "receipt"}).status_code == 422
    assert client.post("/api/reports", json={"value": PHONE, "source": "zalo"}).status_code == 422
    second = device(client)
    foreign = {
        **b,
        "receipt": sign(
            second,
            "|".join(
                (b["eventId"], second["deviceId"], "call_log", "incoming", PHONE, b["evidence"]["at"], "12")
            ),
        ),
    }
    assert submit(client, second, foreign).status_code == 422
    sms = payload(d, evidence_type="sms_received")
    first = submit(client, d, sms).json()
    assert first["report"]["id"] == submit(client, d, sms).json()["report"]["id"]
    assert first["case"]["count"] == first["totalPoints"] == 0


def test_rolling_rate_including_withdrawals(client, monkeypatch):
    d = device(client)
    targets = [payload(d, "097700000" + str(i)) for i in range(6)]
    for b in targets[:5]:
        assert submit(client, d, b).status_code == 200
    assert submit(client, d, targets[5]).status_code == 429
    assert submit(client, d, targets[0]).status_code == 200
    later = config.now() + timedelta(days=1, seconds=1)
    monkeypatch.setattr(config, "now", lambda: later)
    assert submit(client, d, targets[5]).status_code == 200


@pytest.mark.parametrize(
    "level,transfer,answer,status",
    [
        ("danger", True, "yes", "validated"),
        ("suspicious", True, "no", "conflict"),
        ("danger", True, "known", "closed"),
        ("unknown", True, "no", "closed"),
        ("unknown", True, "yes", "conflict"),
        ("danger", False, "yes", "pending_validation"),
    ],
)
def test_recording_validation(client, monkeypatch, level, transfer, answer, status):
    d = device(client)
    b = payload(d)
    attach_audio(client, d, b, monkeypatch, level, transfer)
    assert submit(client, d, b).json()["report"]["status"] == "pending_validation"
    assert submit(client, d, {**b, "selfAnswer": answer}).status_code == 422
    result = submit(client, d, b, answer).json()
    assert result["report"]["status"] == status
    assert result["case"]["S1"] == (5 if status == "validated" else 0)


def test_analysis_mismatch_transcript_fallback_and_no_auto_confirmation(client, monkeypatch):
    d = device(client)
    b = payload(d)
    analysis = attach_audio(client, d, b, monkeypatch)
    b["evidence"]["recording"]["aiConfidence"] = 0.99
    assert submit(client, d, b).status_code == 422
    other = payload(d)
    other["evidence"]["recording"] = {"analysisId": analysis["id"]}
    assert submit(client, d, other).status_code == 422
    for kind in ("call_log", "sms_received"):
        plain = payload(d, "0912345678", kind)
        assert submit(client, d, {**plain, "hasAudio": True}).json()["report"]["status"] == "needs_review"
    r = client.post("/api/analyze/call", data={"transcript": "Lời tự kể", "phone": "0912345678"}).json()
    assert r["analysisId"] is None
    monkeypatch.setattr(ai, "available", lambda: False)
    r = client.post("/api/analyze/call", files={"audio": ("sample.wav", b"abc", "audio/wav")}).json()
    assert r["source"] == "fallback" and r["analysisId"] is None


def test_relative_reply_validation_in_both_orders_and_scope(client, monkeypatch):
    d = device(client)
    b = payload(d)
    attach_audio(client, d, b, monkeypatch)
    r = submit(client, d, b).json()
    aid = link(client, d, b, r)
    url = "/api/alerts/" + aid + "/reply"
    assert client.post("/api/events", json={"room":"gia-dinh-hoa","type":"ask.reply",
                                            "data":{"askId":aid,"preset":"dung_chuyen"}}).status_code == 400
    client.cookies.clear()
    assert client.post(url, json={"choice": "dung-chuyen"}).status_code == 401
    assert client.post("/api/asks/" + aid + "/reply", json={"preset": "dung_chuyen"}).status_code == 403
    client.get("/zalo")
    reply = client.post(url, json={"choice": "dung-chuyen"}).json()
    assert lookup(client)["level"] == "suspicious" and lookup(client)["count"] == 1
    assert (
        submit(
            client,
            d,
            {**b, "alertId": aid, "validation": dict(by="relative", result="agree", at=reply["reply"]["at"])},
        ).status_code
        == 200
    )
    assert (
        submit(
            client, d, {**b, "validation": dict(by="relative", result="agree", at=reply["reply"]["at"])}
        ).status_code
        == 422
    )
    assert submit(client, d, b, "no").json()["report"]["status"] == "conflict"
    assert lookup(client)["count"] == 0
    client.post(url, json={"choice": "nguoi-quen"})
    assert submit(client, d, b).json()["report"]["status"] == "closed"
    assert submit(client, d, b, "yes").json()["report"]["status"] == "conflict"
    client.post(url, json={"choice": "dung-chuyen"})
    assert submit(client, d, b).json()["totalPoints"] == 10
    client.post("/api/alerts", json={"room": "another-family", "summary": "private"})
    assert all(a.get("summary") != "private" for a in client.get("/api/alerts").json())


def test_w1_per_device_withdraw_and_appeal(client, monkeypatch):
    ds = [device(client), device(client)]
    for i, d in enumerate([ds[0], *ds]):
        b = payload(d)
        attach_audio(client, d, b, monkeypatch)
        r = submit(client, d, b, "yes").json()
        level = r["case"]
        assert (level["level"], level["count"]) == (("suspicious", 1) if i < 2 else ("danger", 2))
        assert r["totalPoints"] == 10
    rid = r["report"]["id"]
    owner = device(client)
    req = {"target": PHONE, "kind": "phone", "contact": PHONE}
    a = client.post("/api/appeals", headers=headers(owner), json=req).json()
    assert a["status"] == "pending_verification" and lookup(client)["level"] == "danger"
    verify = "/api/appeals/" + a["id"] + "/verify"
    assert client.post(verify, headers=headers(owner), json={"code": "wrong"}).status_code == 422
    assert (
        client.post(verify, headers=headers(owner), json={"code": a["demoCode"]}).json()["status"] == "verified"
    )
    for url in ("/api/lookup/phone/" + PHONE, "/api/lookup?v=" + PHONE):
        out = client.get(url).json()
        assert out["level"] == "suspicious" and out["appealOpen"] and out["count"] == 2
    assert (
        client.post("/api/analyze/call", data={"transcript": "Alo", "phone": PHONE}).json()["communityLevel"]
        == "suspicious"
    )
    assert client.post("/api/check", json={"value": PHONE}).json()["appealOpen"]
    resolve = "/api/reports/" + rid + "/appeal/resolve"
    assert client.post(resolve, headers=member(client), json={"outcome": "keep"}).status_code == 403
    assert (
        client.post(resolve, headers=member(client, "999111"), json={"outcome": "keep"}).json()["status"]
        == "resolved"
    )
    assert lookup(client)["level"] == "danger"
    at = b["evidence"]["at"]
    withdrawal = {"at": at, "signature": sign(d, "withdraw|" + rid + "|" + d["deviceId"] + "|" + at)}
    assert (
        client.post("/api/reports/" + rid + "/withdraw", headers=headers(owner), json=withdrawal).status_code
        == 403
    )
    result = client.post("/api/reports/" + rid + "/withdraw", headers=headers(d), json=withdrawal).json()
    assert result["case"]["count"] == 1 and result["report"]["status"] == "withdrawn"
    a = client.post("/api/reports/" + rid + "/appeal", headers=headers(owner), json=req).json()
    client.post(
        "/api/appeals/" + a["id"] + "/verify", headers=headers(owner), json={"code": "246810"}
    ).raise_for_status()
    client.post(
        "/api/appeals/" + a["id"] + "/resolve", headers=member(client, "999111"), json={"outcome": "remove"}
    ).raise_for_status()
    assert lookup(client)["level"] == "unknown" and lookup(client)["count"] == 0


def test_w3_snapshots_and_own_vote(client):
    devices = [device(client) for _ in range(10)]
    for d in devices[:5]:
        submit(client, d, payload(d)).raise_for_status()
    own = member(client, "999111", devices[0])
    khoa = member(client)
    lan = member(client, "135790")
    snap = case(client, PHONE, own)
    assert "burst" in snap["flags"] and len(snap["reportIds"]) == 5 and not snap["canVote"]
    assert vote(client, snap, own).status_code == 403
    assert lookup(client)["level"] == "unknown"
    vote(client, snap, khoa).raise_for_status()
    assert lookup(client)["count"] == 5 and lookup(client)["level"] == "suspicious"
    for d in devices[5:]:
        submit(client, d, payload(d)).raise_for_status()
    assert vote(client, snap, khoa, "spam").status_code == 409
    vote(client, snap, lan).raise_for_status()
    assert lookup(client)["count"] == 5
    next_round = case(client, PHONE, lan)
    assert not set(snap["reportIds"]) & set(next_round["reportIds"])
    vote(client, next_round, khoa).raise_for_status()
    assert lookup(client)["S1"] == 10 and lookup(client)["level"] == "suspicious"
    vote(client, next_round, lan).raise_for_status()
    assert lookup(client)["count"] == 10 and lookup(client)["level"] == "danger"


def test_expiry_conflict_review_and_late_notes(client, monkeypatch):
    d = device(client)
    b = payload(d)
    attach_audio(client, d, b, monkeypatch)
    r = submit(client, d, b, "no").json()
    team = member(client)
    snap = case(client, PHONE, team)
    assert vote(client, snap, team).status_code == 422
    url = "/api/reports/" + r["report"]["id"]
    assert (
        client.patch(
            url, json={"status": "confirmed", "note": "Đã nghe thấy yêu cầu chuyển tiền."}, headers=team
        ).status_code
        == 200
    )
    assert lookup(client)["S1"] == 2 and lookup(client)["level"] == "unknown"
    b2 = payload(d, "0977000112")
    attach_audio(client, d, b2, monkeypatch)
    submit(client, d, b2).raise_for_status()
    later = config.now() + timedelta(days=1)
    monkeypatch.setattr(config, "now", lambda: later)
    report = submit(client, d, b2, "yes").json()["report"]
    assert report["status"] == "unvalidated" and report["lateAnswers"][0]["choice"] == "yes"
    snap = case(client, b2["target"], team)
    assert "w2" in snap["flags"]
    vote(client, snap, team).raise_for_status()
    assert lookup(client, b2["target"])["S1"] == 2
    later += timedelta(days=89)
    assert lookup(client, b2["target"])["S1"] == 0


def test_roles_and_persistence(client, tmp_path):
    for url in ("/api/cases", "/api/reports", "/api/reports/r", "/api/appeals"):
        assert client.get(url).status_code == 401
    assert client.get("/api/appeals", headers=member(client)).status_code == 403
    assert (
        client.post("/api/broadcasts", headers=member(client), json={"title": "a", "body": "b"}).status_code
        == 403
    )
    assert client.post("/api/team/login", json={"code": "wrong"}).status_code == 401
    path = str(tmp_path / "reviews.db")
    s = Store(path)
    d = s.register()
    from lcs.evidence import Submission

    b = Submission(**payload(d))
    original = s.submit(b, d["deviceId"])
    s.db.close()
    s = Store(path)
    assert s.secret(d["deviceId"]) == d["deviceSecret"]
    assert s.submit(b, d["deviceId"])["report"]["id"] == original["report"]["id"]
    s.reset()
    assert s.secret(d["deviceId"]) == d["deviceSecret"]
    s.db.close()


def test_edited_evidence_loses_old_votes_and_points_are_once_per_device(client):
    devices = [device(client) for _ in range(5)]
    reports = [payload(d) for d in devices]
    for d, b in zip(devices, reports):
        submit(client, d, b).raise_for_status()
    reviewer = member(client)
    first = case(client, PHONE, reviewer)
    vote(client, first, reviewer).raise_for_status()
    assert submit(client, devices[0], reports[0]).json()["totalPoints"] == 10
    amended = {**reports[0], "story": "Bổ sung thời điểm người gọi yêu cầu chuyển tiền."}
    result = submit(client, devices[0], amended).json()
    assert result["case"]["S1"] == 4 and result["case"]["level"] == "unknown"
    current = case(client, PHONE, reviewer)
    assert current["reviewId"] != first["reviewId"]
    assert vote(client, first, member(client, "135790")).status_code == 409
    vote(client, current, reviewer).raise_for_status()
    assert submit(client, devices[0], amended).json()["totalPoints"] == 10


def test_burst_mixed_reject_and_spam_can_remove_w1(client, monkeypatch):
    team = member(client)
    first = None
    for i in range(5):
        d = device(client)
        b = payload(d)
        attach_audio(client, d, b, monkeypatch)
        result = submit(client, d, b, "yes").json()
        first = first or result["report"]["id"]
    snap = case(client, PHONE, team)
    assert snap["level"] == "danger" and snap["flags"] == ["burst"]
    vote(client, snap, team, "reject").raise_for_status()
    assert lookup(client)["count"] == 5
    vote(client, snap, member(client, "135790"), "spam").raise_for_status()
    assert lookup(client)["level"] == "unknown"
    assert client.get("/api/reports/" + first, headers=team).json()["status"] == "rejected"


def test_technical_only_and_official_directory_do_not_award_points(client, monkeypatch):
    d = device(client)
    b = payload(d, "qua-tri-an-khach-hang.top", "sms_received")
    b["kind"] = "link"
    result = submit(client, d, b).json()
    assert result["case"]["level"] == "suspicious" and result["case"]["count"] == result["totalPoints"] == 0
    b = payload(d, "1900555588")
    analysis = attach_audio(client, d, b, monkeypatch)
    result = submit(client, d, b, "yes").json()
    assert (
        analysis["communityLevel"] == "safe"
        and analysis["aiLevel"] == "danger"
        and result["case"]["level"] == "safe"
        and result["totalPoints"] == 0
    )


def test_wrong_self_validation_and_other_device_alert(client, monkeypatch):
    d = device(client)
    b = payload(d)
    a = attach_audio(client, d, b, monkeypatch)
    assert (
        submit(client, d, {**b, "validation": {"by": "self", "result": "disagree"}}, "yes").status_code == 422
    )
    report = submit(client, d, b, "yes").json()["report"]
    req = dict(eventId=b["eventId"], analysisId=a["id"], reportId=report["id"])
    assert client.post("/api/alerts", headers=headers(device(client)), json=req).status_code == 403
    assert client.post("/api/alerts", headers=headers(d), json={**req, "eventId": "other"}).status_code == 422


def test_non_demo_appeal_cannot_be_verified_with_demo_code(client, monkeypatch):
    monkeypatch.delenv("LCS_DEMO")
    d = device(client)
    a = client.post(
        "/api/appeals", headers=headers(d), json={"kind": "phone", "target": "0912345678", "contact": "Minh"}
    ).json()
    assert a["status"] == "pending_verification" and "demoCode" not in a
    assert (
        client.post(
            "/api/appeals/" + a["id"] + "/verify", headers=headers(d), json={"code": "246810"}
        ).status_code
        == 422
    )
    assert lookup(client, "0912345678")["level"] == "danger"


def test_legacy_ai_status_is_readable_but_never_scores(tmp_path):
    import sqlite3

    path = str(tmp_path / "old.db")
    with sqlite3.connect(path) as db:
        db.execute(
            """CREATE TABLE reports(id,kind,target,created_at,story,lost_money,area,target_group,ai_type,status)"""
        )
        db.execute(
            "INSERT INTO reports VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                "rp_old",
                "call",
                PHONE,
                config.now().isoformat(),
                "Liên lạc 0987654321",
                0,
                "Khu phố 1",
                "Khác",
                "khac",
                "ai_confirmed",
            ),
        )
    store = Store(path)
    report = store.public_report(store.row("rp_old"), config.now())
    assert report["status"] == "legacy_unverified" and report["evidence"] is None
    assert "0987654321" not in report["story"]
    assert store.target_level(PHONE, config.now())["level"] == "unknown"
    store.db.close()


def test_family_read_receipt_tracks_current_reply_on_originating_device(client, monkeypatch):
    mother = device(client)
    other = device(client)
    body = payload(mother)
    attach_audio(client, mother, body, monkeypatch)
    report = submit(client, mother, body, "yes").json()
    alert_id = link(client, mother, body, report)
    assert next(a for a in client.get("/api/alerts").json() if a["id"] == alert_id)["selfAnswer"] == "yes"
    url = f"/api/alerts/{alert_id}/reply"
    reply = client.post(url, json={"choice": "dung-chuyen"}).json()["reply"]
    assert not reply.get("seenAt")
    seen_url = f"{url}/{reply['id']}/seen"
    assert client.get("/api/family/unread", headers=headers(mother)).json()[0]["askId"] == alert_id
    assert client.get("/api/family/unread", headers=headers(other)).json() == []
    assert client.post(seen_url, headers=headers(other)).status_code == 404
    seen = client.post(seen_url, headers=headers(mother)).json()
    assert seen["seenAt"] and client.post(seen_url, headers=headers(mother)).json() == seen
    assert client.get("/api/family/unread", headers=headers(mother)).json() == []
    assert next(a for a in client.get("/api/alerts").json() if a["id"] == alert_id)["reply"]["seenAt"] == seen["seenAt"]
    latest = client.post(url, json={"choice": "nguoi-quen"}).json()["reply"]
    assert latest["id"] != reply["id"] and not latest.get("seenAt")
    assert client.post(seen_url, headers=headers(mother)).status_code == 409
