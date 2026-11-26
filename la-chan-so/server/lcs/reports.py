"""SQLite evidence, immutable review snapshots and community scoring."""

import json
import secrets
import sqlite3
import threading
from collections import Counter
from contextlib import contextmanager
from datetime import timedelta

from . import config
from .data import EMERGING_TITLES, SCAM_TYPES
from .evidence import fail, key_hash, safe_text, timestamp, verify_receipt, verify_signature
from .text import detect_kind, digits, is_phone, looks_like_link, target_display, target_key

DAY = timedelta(days=1)
WINDOW = timedelta(days=90)
RISK = {"danger", "suspicious"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, secret TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS member_devices(member TEXT, device TEXT, PRIMARY KEY(member,device));
CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, device TEXT, type TEXT, digest TEXT, at TEXT, duration INTEGER);
CREATE TABLE IF NOT EXISTS analyses(id TEXT PRIMARY KEY, device TEXT, event TEXT, digest TEXT,
 source TEXT, created TEXT, level TEXT, scam TEXT, confidence REAL, summary TEXT, transfer INTEGER);
CREATE TABLE IF NOT EXISTS evidence_reports(id TEXT PRIMARY KEY, device TEXT, event TEXT UNIQUE, key TEXT,
 kind TEXT, created TEXT, at TEXT, evidence_type TEXT, analysis TEXT, story TEXT, lost INTEGER, area TEXT,
 target_group TEXT, category TEXT, self_answer TEXT, relative_choice TEXT, terminal TEXT, revision INTEGER DEFAULT 1);
CREATE INDEX IF NOT EXISTS evidence_target ON evidence_reports(key,at);
CREATE INDEX IF NOT EXISTS evidence_rate ON evidence_reports(device,created);
CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, key TEXT, flags TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS snapshot(review TEXT, report TEXT, revision INTEGER, state TEXT, PRIMARY KEY(review,report));
CREATE INDEX IF NOT EXISTS snapshot_report ON snapshot(report, revision, state);
CREATE TABLE IF NOT EXISTS votes(review TEXT, member TEXT, decision TEXT, note TEXT, PRIMARY KEY(review,member));
CREATE TABLE IF NOT EXISTS answers(report TEXT, actor TEXT, choice TEXT, at TEXT, late INTEGER);
CREATE TABLE IF NOT EXISTS linked_alerts(id TEXT PRIMARY KEY, report TEXT UNIQUE, analysis TEXT, event TEXT, device TEXT, payload TEXT);
CREATE TABLE IF NOT EXISTS relative_replies(alert TEXT, report TEXT, analysis TEXT, relative TEXT, choice TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS appeals(id TEXT PRIMARY KEY, key TEXT, device TEXT, contact TEXT, text TEXT,
 status TEXT, code TEXT, outcome TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS awards(device TEXT, key TEXT, PRIMARY KEY(device,key));
CREATE TABLE IF NOT EXISTS admin_flags(key TEXT PRIMARY KEY, kind TEXT, scam TEXT, note TEXT, member TEXT, at TEXT);
"""
REPORTS = """SELECT r.*, a.level, a.scam, a.confidence, a.summary, a.transfer
 FROM evidence_reports r LEFT JOIN analyses a ON a.id=r.analysis"""


def uid(prefix):
    return prefix + "_" + secrets.token_hex(8)


def agreement(r, actor, choice):
    risk = r["level"] in RISK
    if choice in ("known", "nguoi-quen"):
        return "disagree" if risk else "agree"
    if actor == "self" and risk and not r["transfer"]:
        return None
    return "agree" if (choice in ("yes", "dung-chuyen")) == risk else "disagree"


def base_state(r, now):
    if r["terminal"]:
        return r["terminal"]
    own, relative = r["self_answer"], r["relative_choice"]
    if (own in ("no", "known") and relative == "dung-chuyen") or (own == "yes" and relative == "nguoi-quen"):
        return "conflict"
    if own == "known" or relative == "nguoi-quen":
        return "closed"
    if not r["analysis"]:
        return "needs_review"
    answers = {
        agreement(r, actor, choice) for actor, choice in (("self", own), ("relative", relative)) if choice
    }
    if "disagree" in answers:
        return "conflict"
    if "agree" in answers:
        return "validated" if r["level"] in RISK else "closed"
    if now >= timestamp(r["created"]) + DAY:
        return "unvalidated" if r["level"] in RISK else "closed"
    return "pending_validation"


class Store:
    def __init__(self, path=None):
        self.lock = threading.RLock()
        self.db = sqlite3.connect(path or config.db_path(), check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        with self.transaction():
            if not self.db.execute("SELECT 1 FROM evidence_reports LIMIT 1").fetchone():
                self._seed()
                self._import_legacy_reports()

    def _import_legacy_reports(self):
        """Preserve genuine submissions from the v1 database for team inspection, without fabricating receipts."""
        if not self.db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='reports'").fetchone():
            return
        for row in self.db.execute("SELECT * FROM reports"):
            if row["id"].startswith("rp_seed_"):
                continue
            kind = "phone" if row["kind"] == "call" else row["kind"]
            self.db.execute(
                """INSERT INTO evidence_reports(id,key,kind,created,story,lost,area,target_group,
                                category,terminal) VALUES (?,?,?,?,?,?,?,?,?,'legacy_unverified')""",
                (
                    row["id"],
                    row["target"],
                    kind,
                    row["created_at"],
                    safe_text(row["story"]),
                    row["lost_money"],
                    safe_text(row["area"]),
                    safe_text(row["target_group"]),
                    row["ai_type"],
                ),
            )

    @contextmanager
    def transaction(self):
        with self.lock:
            if self.db.in_transaction:
                yield
                return
            self.db.execute("BEGIN IMMEDIATE")
            try:
                yield
            except BaseException:
                self.db.rollback()
                raise
            else:
                self.db.commit()

    def _seed(self):
        from .community_seed import seed

        seed(self, config.now())

    def reset(self):
        with self.transaction():
            for name in (
                "events",
                "analyses",
                "evidence_reports",
                "reviews",
                "snapshot",
                "votes",
                "answers",
                "relative_replies",
                "linked_alerts",
                "appeals",
                "awards",
                "admin_flags",
            ):
                self.db.execute(f"DELETE FROM {name}")
            self._seed()

    def register(self):
        device, secret = secrets.token_hex(8), secrets.token_hex(32)
        with self.transaction():
            self.db.execute("INSERT INTO devices VALUES (?,?)", (device, secret))
        return {"deviceId": device, "deviceSecret": secret}

    def secret(self, device):
        row = self.db.execute("SELECT secret FROM devices WHERE id=?", (device,)).fetchone()
        if not row:
            fail("Máy này chưa đăng ký.", 401)
        return row[0]

    def bind_event(self, event, device, evidence, digest):
        fields = (event, device, evidence.type, digest, evidence.at, evidence.durationSec)
        self.db.execute("INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?)", fields)
        if tuple(self.db.execute("SELECT * FROM events WHERE id=?", (event,)).fetchone()) != fields:
            fail("Sự kiện đã gắn với biên nhận khác.")

    def save_analysis(self, device, event, evidence, digest, result):
        with self.transaction():
            self.bind_event(event, device, evidence, digest)
            self.db.execute(
                "INSERT INTO analyses VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (
                    result.id,
                    device,
                    event,
                    digest,
                    "ai",
                    config.now().isoformat(),
                    result.aiLevel,
                    result.aiScamType,
                    result.aiConfidence,
                    result.summary,
                    result.transferRequested,
                ),
            )
        result.analysisId = result.id

    def row(self, rid):
        row = self.db.execute(REPORTS + " WHERE r.id=?", (rid,)).fetchone()
        if not row:
            fail("Không tìm thấy báo cáo.", 404)
        return row

    def answer(self, r, actor, choice, now):
        column = "self_answer" if actor == "self" else "relative_choice"
        late = now >= timestamp(r["created"]) + DAY
        previous = self.db.execute(
            "SELECT choice FROM answers WHERE report=? AND actor=? ORDER BY rowid DESC LIMIT 1",
            (r["id"], actor),
        ).fetchone()
        if previous and previous[0] == choice:
            return
        self.db.execute(
            "INSERT INTO answers VALUES (?,?,?,?,?)", (r["id"], actor, choice, now.isoformat(), late)
        )
        if not late and choice != r[column]:
            self.db.execute(
                f"UPDATE evidence_reports SET {column}=?, revision=revision+1 WHERE id=?", (choice, r["id"])
            )

    def submit(self, body, device):
        with self.transaction():
            now = config.now()
            secret = self.secret(device)
            evidence = body.evidence
            kind = {"phone": "phone", "call": "phone"}.get(body.kind, body.kind)
            if kind == "message":
                kind = detect_kind(body.target, None)
            key = target_key(kind, body.target)
            if kind in ("phone", "account") and len(key) < 3 or kind == "link" and not looks_like_link(key):
                fail("Không xác định được đối tượng báo cáo.")
            if evidence.type == "call_log" and kind != "phone":
                fail("Nhật ký cuộc gọi phải gắn với số hiển thị.")
            verify_receipt(secret, device, body.eventId, key, evidence, body.receipt, now)
            digest = key_hash(key)
            self.bind_event(body.eventId, device, evidence, digest)
            recording = evidence.recording
            analysis_id = None
            category = "duong_dan_gia" if kind == "link" else "khac"
            if recording:
                a = self.db.execute(
                    "SELECT * FROM analyses WHERE id=? AND device=? AND event=? AND digest=? AND source='ai'",
                    (recording.analysisId, device, body.eventId, digest),
                ).fetchone()
                if evidence.type != "call_log" or not a:
                    fail("Bản phân tích không thuộc cuộc gọi này.")
                for field, col in (
                    ("aiLevel", "level"),
                    ("aiScamType", "scam"),
                    ("aiConfidence", "confidence"),
                ):
                    if field in recording.model_fields_set and getattr(recording, field) != a[col]:
                        fail("Nhãn bản ghi không khớp kết quả máy chủ.")
                analysis_id, category = a["id"], a["scam"] or "khac"
            old = self.db.execute("SELECT * FROM evidence_reports WHERE event=?", (body.eventId,)).fetchone()
            story = safe_text(body.story)
            if old:
                rid = old["id"]
                if analysis_id and old["analysis"] and analysis_id != old["analysis"]:
                    fail("Báo cáo đã gắn với bản phân tích khác.")
                if (analysis_id and not old["analysis"]) or (story and story != old["story"]):
                    self.db.execute(
                        """UPDATE evidence_reports SET analysis=coalesce(?,analysis), category=?,
                                  story=?,revision=revision+1 WHERE id=?""",
                        (analysis_id, category if analysis_id else old["category"], story or old["story"], rid),
                    )
            else:
                recent = {
                    r[0]
                    for r in self.db.execute(
                        "SELECT DISTINCT key FROM evidence_reports WHERE device=? AND created>?",
                        (device, (now - DAY).isoformat()),
                    )
                }
                if len(recent) >= 5 and key not in recent:
                    fail("Máy đã báo 5 đối tượng trong 24 giờ qua.", 429)
                rid = uid("rp")
                self.db.execute(
                    """INSERT INTO evidence_reports(id,device,event,key,kind,created,at,evidence_type,
                    analysis,story,lost,area,target_group,category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (
                        rid,
                        device,
                        body.eventId,
                        key,
                        kind,
                        now.isoformat(),
                        timestamp(evidence.at).isoformat(),
                        evidence.type,
                        analysis_id,
                        story,
                        body.lostMoney,
                        safe_text(body.area) or "Khu phố 4",
                        safe_text(body.group) or "Khác",
                        category,
                    ),
                )
            r = self.row(rid)
            v = body.validation
            if v and v.by == "self" and not body.selfAnswer:
                fail("Thiếu lựa chọn của người nhận.")
            if body.selfAnswer:
                signature = body.selfAnswerSignature or (v.signature if v and v.by == "self" else None)
                verify_signature(secret, body.eventId + "|" + body.selfAnswer, signature)
                if (
                    v
                    and v.by == "self"
                    and (not r["analysis"] or v.result != agreement(r, "self", body.selfAnswer))
                ):
                    fail("Xác nhận không khớp câu trả lời và bản ghi.")
                self.answer(r, "self", body.selfAnswer, now)
            if v and v.by == "relative":
                reply = self.db.execute(
                    """SELECT * FROM relative_replies WHERE alert=? AND report=? AND analysis=?
                       ORDER BY rowid DESC LIMIT 1""",
                    (body.alertId, rid, r["analysis"]),
                ).fetchone()
                if not reply or v.at != reply["at"] or v.result != agreement(r, "relative", reply["choice"]):
                    fail("Không khớp lời trả lời của Minh.")
            return self.response(rid, now)

    def snapshot_votes(self, r, state):
        # Two confirms must belong to the SAME snapshot. A later review never erases valid earlier votes.
        counts = self.db.execute(
            """SELECT count(*) FROM snapshot s JOIN votes v ON v.review=s.review
            WHERE s.report=? AND s.revision=? AND s.state=? AND v.decision='confirm' GROUP BY s.review""",
            (r["id"], r["revision"], state),
        )
        return max((x[0] for x in counts), default=0)

    def rows_for(self, key, now):
        return self.db.execute(
            REPORTS + " WHERE r.key=? AND r.at>? AND r.at<=? ORDER BY r.at DESC",
            (key, (now - WINDOW).isoformat(), now.isoformat()),
        ).fetchall()

    def target_level(self, key, now, kind=None):
        from .checker import official, link_signs

        rows = self.rows_for(key, now)
        kind = kind or (rows[0]["kind"] if rows else detect_kind(key, None))
        totals = [{}, {}]
        for r in rows:
            state = base_state(r, now)
            confirms = self.snapshot_votes(r, state)
            weight = {"validated": 5, "unvalidated": 2, "conflict": 2, "needs_review": 1}.get(state, 0)
            for needed, devices in enumerate(totals, 1):
                if weight and (weight == 5 or confirms >= needed):
                    prev = devices.get(r["device"])
                    if not prev or prev[0] < weight:
                        devices[r["device"]] = (weight, r)
        s1, s2 = (sum(v[0] for v in d.values()) for d in totals)
        appeal = bool(
            self.db.execute("SELECT 1 FROM appeals WHERE key=? AND status='verified'", (key,)).fetchone()
        )
        name = official(kind, key)
        signs = link_signs(key) if kind == "link" else []
        admin = self.db.execute("SELECT * FROM admin_flags WHERE key=?", (key,)).fetchone()
        counted = {}
        if name:
            level = "safe"
        elif admin:
            # Quản trị viên đã xác minh: cảnh báo ngay, không chờ đủ số máy báo.
            level = "suspicious" if appeal else "danger"
            counted = totals[1] or totals[0] or {
                r["device"]: (1, r) for r in rows
                if base_state(r, now) not in ("withdrawn", "removed", "rejected", "closed")
            }
        elif s2 >= 10:
            level, counted = ("suspicious" if appeal else "danger"), totals[1]
        elif s1 >= 5:
            level, counted = "suspicious", totals[0]
        else:
            level = "suspicious" if signs else "unknown"
        records = [r for _, r in counted.values()]
        latest = max(records, key=lambda r: r["at"]) if records else None
        return dict(
            key=key,
            level=level,
            count=len(counted),
            S1=s1,
            S2=s2,
            appealOpen=appeal,
            canAppeal=kind == "phone" and level in RISK and not appeal,
            official=name,
            signs=signs,
            last7d=sum(timestamp(r["at"]).date() >= now.date() - timedelta(days=7) for r in records),
            lastAt=latest["at"] if latest else None,
            until=(timestamp(latest["at"]) + WINDOW).isoformat() if latest else None,
            scamType=latest["category"] if latest else (admin["scam"] if admin else None),
            verified=bool(admin) and not name,
            contributors=list(counted),
            teamChecked=any(weight < 5 for weight, _ in counted.values()),
            contributionIds=[r["id"] for r in records],
            reportedCount=len({r["device"] for r in rows}),
        )

    def refresh(self, key, now, force=None):
        rows = self.rows_for(key, now)
        active = [r for r in rows if base_state(r, now) not in ("withdrawn", "removed", "rejected", "closed")]
        states = {r["id"]: base_state(r, now) for r in active}
        flags = []
        if len({r["device"] for r in active if states[r["id"]] == "needs_review"}) >= 5:
            flags.append("w3")
        for status, flag in (("unvalidated", "w2"), ("conflict", "conflict")):
            if status in states.values():
                flags.append(flag)
        first = self.db.execute("SELECT min(created) FROM evidence_reports WHERE key=? GROUP BY device", (key,))
        if sum(timestamp(r[0]) >= now - timedelta(minutes=10) for r in first) >= 5:
            flags.append("burst")
        if (
            force == "appeal"
            or self.db.execute("SELECT 1 FROM appeals WHERE key=? AND status='verified'", (key,)).fetchone()
        ):
            flags.append("appeal")
        valid = {r["id"]: (r["revision"], states[r["id"]]) for r in active}
        covered = set()
        carry = set()
        open_voted = False
        for review in self.db.execute("SELECT * FROM reviews WHERE key=? AND status!='superseded'", (key,)):
            members = self.db.execute("SELECT * FROM snapshot WHERE review=?", (review["id"],)).fetchall()
            matching = {s["report"] for s in members if valid.get(s["report"]) == (s["revision"], s["state"])}
            if review["status"] == "decided":
                covered.update(matching)
                continue
            voted = self.db.execute("SELECT 1 FROM votes WHERE review=?", (review["id"],)).fetchone()
            # A revision, expiry or withdrawal makes the ballot displayed in an old tab stale.
            if len(matching) != len(members) or force:
                self.db.execute("UPDATE reviews SET status='superseded' WHERE id=?", (review["id"],))
                carry.update(matching)
            elif voted:
                open_voted = True
                covered.update(matching)
            else:
                covered.update(matching)
        fresh = set(valid) - covered
        fresh_devices = {r["device"] for r in active if r["id"] in fresh}
        urgent = len(fresh_devices) >= 5 or any(states[rid] in ("conflict", "unvalidated") for rid in fresh)
        if active and (force or (flags and fresh and (not open_voted or urgent))):
            selection = fresh | carry
            # Unvoted drafts can be replaced, but never change the membership of an existing id.
            drafts = self.db.execute(
                """SELECT id FROM reviews WHERE key=? AND status='open' AND NOT EXISTS
                                        (SELECT 1 FROM votes WHERE review=reviews.id)""",
                (key,),
            ).fetchall()
            for draft in drafts:
                selection.update(
                    s[0] for s in self.db.execute("SELECT report FROM snapshot WHERE review=?", (draft["id"],))
                )
                self.db.execute("UPDATE reviews SET status='superseded' WHERE id=?", (draft["id"],))
            selected = active if force else [r for r in active if r["id"] in selection]
            self.open_round(key, selected, states, flags)
        level = self.target_level(key, now)
        self.db.executemany(
            "INSERT OR IGNORE INTO awards VALUES (?,?)", [(d, key) for d in level["contributors"]]
        )
        return level

    def open_round(self, key, rows, states, flags):
        review = uid("rv")
        self.db.execute("INSERT INTO reviews VALUES (?,?,?,'open')", (review, key, json.dumps(flags)))
        self.db.executemany(
            "INSERT INTO snapshot VALUES (?,?,?,?)",
            [(review, r["id"], r["revision"], states[r["id"]]) for r in rows],
        )
        return review

    def public_report(self, r, now):
        state = base_state(r, now)
        confirms = self.snapshot_votes(r, state)
        if confirms and state in ("unvalidated", "needs_review", "conflict"):
            state = "confirmed"
        return dict(
            id=r["id"],
            eventId=r["event"],
            target=target_display(r["kind"], r["key"]),
            kind=r["kind"],
            status=state,
            createdAt=r["created"],
            evidence={"type": r["evidence_type"], "at": r["at"]} if r["evidence_type"] else None,
            story=r["story"],
            area=r["area"],
            group=r["target_group"],
            lostMoney=bool(r["lost"]),
            analysisId=r["analysis"],
            aiLevel=r["level"],
            aiScamType=r["scam"],
            aiConfidence=r["confidence"],
            summary=r["summary"],
            selfAnswer=r["self_answer"],
            relativeChoice=r["relative_choice"],
            lateAnswers=[
                dict(a)
                for a in self.db.execute(
                    "SELECT actor, choice, at FROM answers WHERE report=? AND late=1 ORDER BY at", (r["id"],)
                )
            ],
        )

    def response(self, rid, now):
        r = self.row(rid)
        already_awarded = self.db.execute(
            "SELECT 1 FROM awards WHERE device=? AND key=?", (r["device"], r["key"])
        ).fetchone()
        level = self.refresh(r["key"], now)
        earned = 10 if not already_awarded and r["device"] in level["contributors"] else 0
        review = self.db.execute(
            "SELECT id FROM reviews WHERE key=? ORDER BY rowid DESC LIMIT 1", (r["key"],)
        ).fetchone()
        report = self.public_report(r, now)
        msg = {
            "pending_validation": "Đã nhận báo cáo. Đang chờ Minh xác nhận nội dung cuộc gọi.",
            "withdrawn": "Bà đã rút báo cáo này rồi ạ.",
        }.get(report["status"], "Đã ghi nhận báo cáo của bà ạ.")
        points = self.db.execute("SELECT count(*)*10 FROM awards WHERE device=?", (r["device"],)).fetchone()[0]
        return {
            "report": report,
            "case": {**self.public_level(level), "votes": self.tally(review[0] if review else None)},
            "points": earned,
            "totalPoints": points,
            "message": msg,
        }

    @staticmethod
    def public_level(level):
        return {
            k: level[k]
            for k in ("key", "level", "count", "S1", "S2", "appealOpen", "canAppeal", "reportedCount", "verified")
        }

    def tally(self, review):
        counts = Counter(v[0] for v in self.db.execute("SELECT decision FROM votes WHERE review=?", (review,)))
        return {k: counts[k] for k in ("confirm", "reject", "spam")}

    def case(self, review, member, now):
        rows = self.db.execute(
            REPORTS + " JOIN snapshot s ON s.report=r.id WHERE s.review=?", (review["id"],)
        ).fetchall()
        ids = [r["id"] for r in rows]
        votes = self.tally(review["id"])
        my = self.db.execute(
            "SELECT decision FROM votes WHERE review=? AND member=?", (review["id"], member["id"])
        ).fetchone()
        own = self.db.execute(
            """SELECT 1 FROM evidence_reports WHERE key=? AND
                (device=? OR device IN (SELECT device FROM member_devices WHERE member=?)) LIMIT 1""",
            (review["key"], member["device"], member["id"]),
        ).fetchone()
        reason = (
            "Máy đăng nhập đã báo trong hồ sơ này."
            if own
            else "Bạn đã bỏ phiếu trong đợt này."
            if my
            else "Đợt xét đã đóng."
            if review["status"] != "open"
            else ""
        )
        level = self.target_level(review["key"], now)
        return {
            **self.public_level(level),
            "reviewId": review["id"],
            "status": review["status"],
            "reportIds": ids,
            "reports": [self.public_report(r, now) for r in rows],
            "flags": json.loads(review["flags"]),
            "votes": votes,
            "myVote": my[0] if my else None,
            "canVote": not reason,
            "reasonCannotVote": reason,
            "notes": [
                dict(v)
                for v in self.db.execute(
                    "SELECT member,decision,note FROM votes WHERE review=?", (review["id"],)
                )
            ],
        }

    def vote(self, key, review_id, decision, note, member, report_id=None):
        if decision not in ("confirm", "reject", "spam"):
            fail("Phiếu chỉ nhận xác nhận, bác hoặc báo rác.")
        with self.transaction():
            now = config.now()
            self.refresh(key, now)
            review = self.db.execute("SELECT * FROM reviews WHERE id=? AND key=?", (review_id, key)).fetchone()
            if not review:
                fail("Không tìm thấy đợt xét.", 404)
            case = self.case(review, member, now)
            if report_id and report_id not in case["reportIds"]:
                fail("Báo cáo không thuộc đợt xét.", 409)
            if not case["canVote"]:
                if case["myVote"] == decision:
                    return case
                fail(case["reasonCannotVote"], 403 if "Máy" in case["reasonCannotVote"] else 409)
            note = safe_text(note)
            if "conflict" in case["flags"] and not note:
                fail("Bạn ghi lý do khi xét hai ý kiến trái nhau nhé.")
            self.db.execute("INSERT INTO votes VALUES (?,?,?,?)", (review_id, member["id"], decision, note))
            votes = self.tally(review_id)
            admin = member.get("role") == "admin"
            rejected = votes["reject"] + votes["spam"] >= 2 or (admin and decision != "confirm")
            if admin and decision == "confirm":
                latest = self.db.execute(
                    "SELECT kind, category FROM evidence_reports WHERE key=? ORDER BY at DESC LIMIT 1", (key,)
                ).fetchone()
                self.db.execute(
                    "INSERT OR REPLACE INTO admin_flags VALUES (?,?,?,?,?,?)",
                    (key, latest["kind"] if latest else "phone", latest["category"] if latest else None,
                     note, member["id"], now.isoformat()),
                )
            elif admin:
                self.db.execute("DELETE FROM admin_flags WHERE key=?", (key,))
            if rejected:
                self.db.execute(
                    """UPDATE evidence_reports SET terminal='rejected' WHERE terminal IS NULL AND EXISTS
                      (SELECT 1 FROM snapshot s WHERE s.report=evidence_reports.id AND s.revision=evidence_reports.revision
                       AND s.review=?)""",
                    (review_id,),
                )
            if rejected or votes["confirm"] >= 2 or admin:
                self.db.execute("UPDATE reviews SET status='decided' WHERE id=?", (review_id,))
            self.refresh(key, now)
            return self.case(
                self.db.execute("SELECT * FROM reviews WHERE id=?", (review_id,)).fetchone(), member, now
            )

    def admin_flag(self, target, scam, note, member):
        """Quản trị viên gắn cờ lừa đảo cho một số điện thoại ngay, không cần chờ báo cáo."""
        if not is_phone(digits(target or "")):
            fail("Số điện thoại chưa đúng. Bạn kiểm tra lại nhé.")
        kind = "phone"
        key = target_key(kind, target)
        if scam and scam not in SCAM_TYPES:
            fail("Kiểu lừa đảo chưa đúng.")
        with self.transaction():
            now = config.now()
            self.db.execute(
                "INSERT OR REPLACE INTO admin_flags VALUES (?,?,?,?,?,?)",
                (key, kind, scam or None, safe_text(note), member["id"], now.isoformat()),
            )
            return self.public_level(self.target_level(key, now, kind))

    def admin_unflag(self, key):
        with self.transaction():
            gone = self.db.execute("DELETE FROM admin_flags WHERE key=?", (key,)).rowcount
            if not gone:
                fail("Số này chưa được gắn cờ.", 404)
            return self.public_level(self.target_level(key, config.now()))

    def admin_flags(self):
        with self.transaction():
            now = config.now()
            out = []
            for a in self.db.execute("SELECT * FROM admin_flags ORDER BY at DESC").fetchall():
                found = self.target_level(a["key"], now, a["kind"])
                out.append({
                    "key": a["key"], "target": target_display(a["kind"], a["key"]), "kind": a["kind"],
                    "scamType": a["scam"], "scamLabel": SCAM_TYPES.get(a["scam"]) if a["scam"] else None,
                    "note": a["note"], "at": a["at"], "level": found["level"], "count": found["count"],
                })
            return out

    def cases(self, status, limit, member):
        with self.transaction():
            now = config.now()
            for (key,) in self.db.execute("SELECT DISTINCT key FROM evidence_reports"):
                self.refresh(key, now)
            rows = self.db.execute(
                "SELECT * FROM reviews WHERE status=? ORDER BY rowid DESC LIMIT ?", (status, limit)
            )
            return [self.case(r, member, now) for r in rows]

    def stats(self, month: str | None = None) -> dict:
        today = config.demo_today()
        month = month or today.strftime("%Y-%m")
        with self.transaction():
            now = config.now()
            rows = self.db.execute(REPORTS + " WHERE substr(r.created,1,7)=?", (month,)).fetchall()
            levels = {key: self.target_level(key, now) for key in {r["key"] for r in rows}}
            counted_ids = {rid for value in levels.values() for rid in value["contributionIds"]}
            appeals = self.db.execute("SELECT count(*) FROM appeals WHERE status='verified'").fetchone()[0]
        total = len(rows)
        types = Counter(r["category"] or "khac" for r in rows)
        top = [t for t, _ in types.most_common() if t != "khac"][:4]
        by_type = [{"scamType": t, "label": SCAM_TYPES.get(t, t), "count": types[t]} for t in top]
        rest = total - sum(x["count"] for x in by_type)
        if rest:
            by_type.append({"scamType": "khac", "label": "Khác", "count": rest})

        weekly = [0, 0, 0, 0]
        for r in rows:
            day = timestamp(r["created"]).day
            weekly[min((day - 1) // 7, 3)] += 1

        areas = Counter(r["area"] for r in rows)
        groups = Counter(r["target_group"] for r in rows)
        rejected = sum(r["terminal"] == "rejected" for r in rows)
        pending = sum(
            r["id"] not in counted_ids
            and base_state(r, now) in ("needs_review", "conflict", "unvalidated", "pending_validation")
            for r in rows
        )
        links = sum(1 for r in rows if r["category"] == "duong_dan_gia")

        def pct(n):
            return round(100 * n / total) if total else 0

        change = round(100 * (total - 102) / 102) if total else 0
        confirmed = sum(r["id"] in counted_ids for r in rows)
        emerging = self._emerging(rows, today)
        e = emerging[0] if emerging else None
        by_area = areas.most_common()
        by_group = [(g, pct(n)) for g, n in groups.most_common()]
        return {
            "monthKey": month,
            "month": f"{month[5:7]}/{month[:4]}",
            "area": "Phường Trấn Biên",
            "sample": True,
            "total": total,
            "prevMonthTotal": 102,
            "changePct": change,
            "totalDelta": f"{change:+d}% so với tháng trước",
            "links": links,
            "linkPct": pct(links),
            "aiConfirmed": confirmed,
            "aiPct": pct(confirmed),
            "aiRejected": rejected,
            "needsReview": pending,
            "pending": pending,
            "appeals": appeals,
            "byType": by_type,
            "scam": [[t["label"], t["count"]] for t in by_type],
            "weekly": weekly,
            "byArea": [{"area": a, "count": n} for a, n in by_area],
            "areas": [[a, n] for a, n in by_area],
            "targetGroups": [{"group": g, "pct": p} for g, p in by_group],
            "targets": [[g, p] for g, p in by_group],
            "peakHours": "9–11 giờ sáng",
            "peak": "9–11 giờ sáng",
            # Kiểu mới nổi nhất (W01, A01b); dạng đối tượng như trang web của Mảng 6 dùng
            "emerging": {**e, "reports": e["count"]} if e else None,
            # Phễu bảo vệ lấy từ thiết bị; bản demo dùng số mẫu của màn W01
            "funnel": {"alertsShown": 310, "stopped": 268, "askedFamily": 97, "reported": 64},
        }

    def _emerging(self, rows, today) -> list[dict]:
        recent = Counter()
        before = Counter()
        quotes: dict[str, list[str]] = {}
        for r in rows:
            d = timestamp(r["created"]).date()
            t = r["category"] or "khac"
            if today - timedelta(days=3) <= d <= today:
                recent[t] += 1
                if r["story"] and len(quotes.setdefault(t, [])) < 2 and r["story"] not in quotes[t]:
                    quotes[t].append(r["story"])
            elif today - timedelta(days=17) <= d < today - timedelta(days=3):
                before[t] += 1
        out = []
        for t, n in recent.most_common():
            if n >= 5 and before[t] < 2 and t != "khac":
                out.append(
                    {
                        "scamType": t,
                        "label": SCAM_TYPES.get(t, t),
                        "title": EMERGING_TITLES.get(t, SCAM_TYPES.get(t, t)),
                        "count": n,
                        "days": 3,
                        "quotes": quotes.get(t, []),
                    }
                )
        return out

    def create_appeal(self, body, device):
        now = config.now()
        self.secret(device)
        key = target_key("phone", body.target)
        if not key or not body.contact.strip():
            fail("Bạn nhập số bị báo và thông tin liên hệ nhé.")
        previous = self.db.execute(
            "SELECT * FROM appeals WHERE key=? AND device=? AND status='pending_verification'", (key, device)
        ).fetchone()
        if previous:
            return self.appeal_out(previous, demo_code=True)
        if not self.target_level(key, now, "phone")["canAppeal"]:
            fail("Số này chưa có nhãn để khiếu nại hoặc đang được xem lại.", 409)
        aid = uid("ap")
        code = "246810" if config.env("LCS_DEMO") == "1" else None
        self.db.execute(
            "INSERT INTO appeals VALUES (?,?,?,?,?,'pending_verification',?,NULL,NULL)",
            (aid, key, device, safe_text(body.contact), safe_text(body.text), code),
        )
        return self.appeal_out(self.appeal(aid), demo_code=True)

    def appeal(self, aid):
        row = self.db.execute("SELECT * FROM appeals WHERE id=?", (aid,)).fetchone()
        if not row:
            fail("Không tìm thấy khiếu nại.", 404)
        return row

    @staticmethod
    def appeal_out(row, demo_code=False):
        result = {k: row[k] for k in ("id", "status", "text", "contact", "outcome", "note")}
        result["target"] = target_display("phone", row["key"])
        if demo_code and config.env("LCS_DEMO") == "1" and row["code"] == "246810":
            result["demoCode"] = row["code"]
        return result

    def verify_appeal(self, aid, device, code):
        row = self.appeal(aid)
        if row["device"] != device:
            fail("Khiếu nại thuộc máy khác.", 403)
        if (
            config.env("LCS_DEMO") != "1"
            or not code
            or not row["code"]
            or not secrets.compare_digest(row["code"].encode(), code.encode())
        ):
            fail("Mã xác minh chưa đúng.")
        if row["status"] == "pending_verification":
            if self.db.execute(
                "SELECT 1 FROM appeals WHERE key=? AND status='verified'", (row["key"],)
            ).fetchone():
                fail("Số này đã có khiếu nại đang xét.", 409)
            self.db.execute("UPDATE appeals SET status='verified' WHERE id=?", (aid,))
            self.refresh(row["key"], config.now(), "appeal")
        return self.appeal_out(self.appeal(aid))

    def resolve(self, aid, body):
        row = self.appeal(aid)
        if row["status"] == "resolved" and row["outcome"] == body.outcome:
            return self.appeal_out(row)
        if row["status"] != "verified":
            fail("Khiếu nại chưa xác minh hoặc đã được xử lý.", 409)
        if body.outcome == "remove":
            self.db.execute(
                "UPDATE evidence_reports SET terminal='removed' WHERE key=? AND terminal IS NULL", (row["key"],)
            )
        self.db.execute(
            "UPDATE appeals SET status='resolved',outcome=?,note=?,code=NULL WHERE id=?",
            (body.outcome, safe_text(body.note), aid),
        )
        for review in self.db.execute(
            "SELECT * FROM reviews WHERE key=? AND status='open'", (row["key"],)
        ).fetchall():
            flags = json.loads(review["flags"])
            if "appeal" in flags:
                flags.remove("appeal")
                remaining = "open" if flags and body.outcome == "keep" else "decided"
                self.db.execute(
                    "UPDATE reviews SET flags=?, status=? WHERE id=?",
                    (json.dumps(flags), remaining, review["id"]),
                )
        self.refresh(row["key"], config.now())
        return self.appeal_out(self.appeal(aid))
