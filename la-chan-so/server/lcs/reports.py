"""S6: lưu báo cáo, trạng thái kiểm duyệt, nhãn tự hết hạn sau 90 ngày, thống kê cho web đội tình nguyện.

Dữ liệu nạp sẵn là dữ liệu giả lập, khớp số trên màn W01, W02:
120 báo cáo trong tháng; 42 đường dẫn giả, 30 giả danh công an, 24 việc nhẹ lương cao,
12 người thân gặp tai nạn, 12 khác (7 trong đó là giả điện lực, kiểu mới nổi);
78 AI xác nhận, 18 AI loại, 24 chờ duyệt, 2 khiếu nại; 4 tuần 22, 27, 31, 40.
"""
from __future__ import annotations

import random
import sqlite3
import threading
import uuid
from collections import Counter
from datetime import date, datetime, time, timedelta

from . import config
from .data import EMERGING_TITLES, SCAM_TYPES
from .text import target_display, target_key

CONFIRMED = ("ai_confirmed", "confirmed")
TTL_DAYS = 90

SCHEMA = """
CREATE TABLE IF NOT EXISTS reports(
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  target TEXT NOT NULL,
  display TEXT NOT NULL,
  story TEXT,
  has_audio INTEGER NOT NULL DEFAULT 0,
  lost_money INTEGER NOT NULL DEFAULT 0,
  area TEXT,
  target_group TEXT,
  status TEXT NOT NULL,
  ai_type TEXT,
  ai_label TEXT,
  ai_confidence REAL,
  human_verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  expires_at TEXT,
  appeal TEXT,
  reporter TEXT,
  label TEXT,
  decided_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target);
"""

AREAS = {"Khu phố 1": 31, "Khu phố 4": 26, "Khu phố 2": 24, "Khu phố 5": 21, "Khu phố 3": 18}
GROUPS = {"Người cao tuổi": 55, "Học sinh": 37, "Khác": 28}
STORIES = {
    "duong_dan_gia": ["Tin nhắn gửi đường dẫn lạ, đòi đăng nhập để nhận quà.", "Đường dẫn giả trang ngân hàng, đòi nhập mật khẩu."],
    "gia_danh_cong_an": ["Tự xưng công an, đòi chuyển tiền để xác minh.", "Gọi báo liên quan vụ án, bắt giữ bí mật."],
    "viec_nhe_luong_cao": ["Mời làm cộng tác viên, đòi nạp tiền trước.", "Tuyển việc nhẹ lương cao, đòi đóng phí kích hoạt."],
    "nguoi_than_tai_nan": ["Báo người thân bị tai nạn, đòi chuyển tiền gấp."],
    "khac": ["Gọi quảng cáo liên tục."],
}
LINK_WORDS = ["nhan-qua", "hoan-tien", "uu-dai", "tra-thuong", "cap-nhat", "giao-hang", "vay-nhanh", "khuyen-mai"]
LINK_TLDS = ["top", "xyz", "click", "info", "icu"]
# Số và đường dẫn mẫu phải giữ "chưa có báo cáo" để demo đúng màn A07b, A07d
RESERVED = {"0987654321", "qua-tri-an-khach-hang.top", "1900555588", "1900545454", "113"}


def _iso(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


def _parse(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


class Store:
    def __init__(self, path: str | None = None):
        self.path = path or config.db_path()
        self.lock = threading.RLock()
        self.db = sqlite3.connect(self.path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.points: dict[str, int] = {}
        self.reset()

    # ---------- nạp dữ liệu ----------
    def reset(self) -> None:
        with self.lock:
            self.db.executescript("DROP TABLE IF EXISTS reports;" + SCHEMA)
            rows = seed_rows(config.demo_today())
            self.db.executemany(
                "INSERT INTO reports(id,created_at,kind,target,display,story,has_audio,lost_money,area,target_group,"
                "status,ai_type,ai_label,ai_confidence,human_verified,verified_at,expires_at,appeal,reporter) VALUES "
                "(:id,:created_at,:kind,:target,:display,:story,:has_audio,:lost_money,:area,:target_group,"
                ":status,:ai_type,:ai_label,:ai_confidence,:human_verified,:verified_at,:expires_at,:appeal,:reporter)",
                rows,
            )
            self.db.commit()
            self.points = {"vy": 120, "ba-hoa": 120, "minh": 40}

    # ---------- tra cứu cho S1 ----------
    def lookup(self, key: str) -> dict:
        """Chỉ tính báo cáo đã duyệt và chưa hết hạn."""
        now = config.now()
        with self.lock:
            rows = self.db.execute(
                "SELECT * FROM reports WHERE target=? AND status IN (?,?) AND expires_at > ? ORDER BY created_at DESC",
                (key, *CONFIRMED, _iso(now)),
            ).fetchall()
        if not rows:
            return {"count": 0, "last7d": 0, "lastAt": None, "verified": False}
        since = now.date() - timedelta(days=7)
        types = Counter(r["ai_type"] for r in rows if r["ai_type"])
        stories = Counter(r["story"] for r in rows if r["story"])
        return {
            "count": len(rows),
            "last7d": sum(1 for r in rows if _parse(r["created_at"]).date() >= since),
            "lastAt": rows[0]["created_at"],
            "verified": True,
            "humanVerified": any(r["human_verified"] for r in rows),
            "scamType": types.most_common(1)[0][0] if types else None,
            "story": stories.most_common(1)[0][0] if stories else None,
            "until": max(r["expires_at"] for r in rows),
        }

    def reporter_count(self, key: str) -> int:
        with self.lock:
            return self.db.execute(
                "SELECT COUNT(*) FROM reports WHERE target=? AND status NOT IN ('ai_rejected','rejected','spam')", (key,)
            ).fetchone()[0]

    # ---------- ghi ----------
    def add(self, *, kind: str, target: str, story: str | None, key_kind: str | None = None, has_audio: bool, lost_money: bool, area: str | None,
            group: str | None, status: str, ai_type: str | None, ai_label: str | None, ai_confidence: float,
            reporter: str) -> dict:
        now = config.now()
        confirmed = status in CONFIRMED
        row = {
            "id": "rp_" + uuid.uuid4().hex[:10],
            "created_at": _iso(now),
            "kind": kind,
            "target": target_key(key_kind or kind, target),
            "display": target_display(key_kind or kind, target),
            "story": story,
            "has_audio": int(has_audio),
            "lost_money": int(lost_money),
            "area": area or "Khu phố 4",
            "target_group": group or "Khác",
            "status": status,
            "ai_type": ai_type,
            "ai_label": ai_label,
            "ai_confidence": ai_confidence,
            "human_verified": 0,
            "verified_at": _iso(now) if confirmed else None,
            "expires_at": _iso(now + timedelta(days=TTL_DAYS)) if confirmed else None,
            "appeal": None,
            "reporter": reporter,
        }
        with self.lock:
            self.db.execute(
                "INSERT INTO reports VALUES (:id,:created_at,:kind,:target,:display,:story,:has_audio,:lost_money,:area,"
                ":target_group,:status,:ai_type,:ai_label,:ai_confidence,:human_verified,:verified_at,:expires_at,:appeal,:reporter,NULL,NULL)",
                row,
            )
            self.db.commit()
        return self.get(row["id"])

    def add_points(self, who: str, n: int) -> int:
        self.points[who] = self.points.get(who, 0) + n
        return self.points[who]

    def set_status(self, report_id: str, status: str, label: str | None = None) -> dict | None:
        """Người duyệt quyết định. confirmed và labeled có hạn 90 ngày; chỉ confirmed mới làm tra số ra Nguy hiểm."""
        now = config.now()
        with self.lock:
            if status in ("confirmed", "labeled"):
                self.db.execute(
                    "UPDATE reports SET status=?, label=?, human_verified=1, verified_at=?, expires_at=?, decided_at=? WHERE id=?",
                    (status, label, _iso(now), _iso(now + timedelta(days=TTL_DAYS)), _iso(now), report_id),
                )
            else:  # rejected, spam, forwarded
                self.db.execute(
                    "UPDATE reports SET status=?, human_verified=1, verified_at=NULL, expires_at=NULL, decided_at=? WHERE id=?",
                    (status, _iso(now), report_id),
                )
            self.db.commit()
        return self.get(report_id)

    def resolve_appeal(self, report_id: str, remove_label: bool) -> dict | None:
        """Xử lý khiếu nại báo oan. Gỡ nhãn: về trạng thái bị loại, không còn làm tra số ra Nguy hiểm. Giữ nhãn: chỉ đóng khiếu nại."""
        now = config.now()
        with self.lock:
            if remove_label:
                self.db.execute(
                    "UPDATE reports SET status='rejected', label=NULL, human_verified=1, verified_at=NULL, expires_at=NULL,"
                    " decided_at=?, appeal=NULL WHERE id=?", (_iso(now), report_id))
            else:
                self.db.execute("UPDATE reports SET appeal=NULL, decided_at=? WHERE id=?", (_iso(now), report_id))
            self.db.commit()
        return self.get(report_id)

    def set_appeal(self, report_id: str, text: str) -> dict | None:
        with self.lock:
            self.db.execute("UPDATE reports SET appeal=? WHERE id=?", (text, report_id))
            self.db.commit()
        return self.get(report_id)

    # ---------- đọc ----------
    def get(self, report_id: str) -> dict | None:
        with self.lock:
            r = self.db.execute("SELECT * FROM reports WHERE id=?", (report_id,)).fetchone()
        return self._out(r) if r else None

    def list(self, status: str | None = None, limit: int = 20, offset: int = 0) -> dict:
        where, args = "", []
        if status == "appealed":
            where = "WHERE appeal IS NOT NULL"
        elif status:
            where, args = "WHERE status=?", [status]
        with self.lock:
            total = self.db.execute(f"SELECT COUNT(*) FROM reports {where}", args).fetchone()[0]
            rows = self.db.execute(
                f"SELECT * FROM reports {where} ORDER BY created_at DESC LIMIT ? OFFSET ?", [*args, limit, offset]
            ).fetchall()
        return {"total": total, "items": [self._out(r) for r in rows]}

    def _out(self, r: sqlite3.Row) -> dict:
        return {
            "id": r["id"],
            "createdAt": r["created_at"],
            "kind": r["kind"],
            "target": r["display"],
            "story": r["story"],
            "hasAudio": bool(r["has_audio"]),
            "lostMoney": bool(r["lost_money"]),
            "area": r["area"],
            "group": r["target_group"],
            "status": r["status"],
            "ai": {"scamType": r["ai_type"], "scamLabel": r["ai_label"], "confidence": r["ai_confidence"]},
            "reporterCount": self.reporter_count(r["target"]),
            "humanVerified": bool(r["human_verified"]),
            "verifiedAt": r["verified_at"],
            "expiresAt": r["expires_at"],
            "appeal": r["appeal"],
            "label": r["label"],
            "decidedAt": r["decided_at"],
            "reporter": r["reporter"],
        }

    # ---------- thống kê cho W01 ----------
    def stats(self, month: str | None = None) -> dict:
        today = config.demo_today()
        month = month or today.strftime("%Y-%m")
        with self.lock:
            rows = self.db.execute("SELECT * FROM reports WHERE substr(created_at,1,7)=?", (month,)).fetchall()
        total = len(rows)
        types = Counter(r["ai_type"] or "khac" for r in rows)
        top = [t for t, _ in types.most_common() if t != "khac"][:4]
        by_type = [{"scamType": t, "label": SCAM_TYPES.get(t, t), "count": types[t]} for t in top]
        rest = total - sum(x["count"] for x in by_type)
        if rest:
            by_type.append({"scamType": "khac", "label": "Khác", "count": rest})

        weekly = [0, 0, 0, 0]
        for r in rows:
            day = _parse(r["created_at"]).day
            weekly[min((day - 1) // 7, 3)] += 1

        areas = Counter(r["area"] for r in rows)
        groups = Counter(r["target_group"] for r in rows)
        status = Counter(r["status"] for r in rows)
        links = sum(1 for r in rows if r["ai_type"] == "duong_dan_gia")
        pct = (lambda n: round(100 * n / total) if total else 0)

        change = round(100 * (total - 102) / 102) if total else 0
        confirmed = status["ai_confirmed"] + status["confirmed"]
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
            "aiRejected": status["ai_rejected"] + status["rejected"] + status["spam"],
            "needsReview": status["needs_review"],
            "pending": status["needs_review"],
            "appeals": sum(1 for r in rows if r["appeal"]),
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

    def _emerging(self, rows, today: date) -> list[dict]:
        recent = Counter()
        before = Counter()
        quotes: dict[str, list[str]] = {}
        for r in rows:
            d = _parse(r["created_at"]).date()
            t = r["ai_type"] or "khac"
            if today - timedelta(days=3) <= d <= today:
                recent[t] += 1
                if r["story"] and len(quotes.setdefault(t, [])) < 2 and r["story"] not in quotes[t]:
                    quotes[t].append(r["story"])
            elif today - timedelta(days=17) <= d < today - timedelta(days=3):
                before[t] += 1
        out = []
        for t, n in recent.most_common():
            if n >= 5 and before[t] < 2 and t != "khac":
                out.append({"scamType": t, "label": SCAM_TYPES.get(t, t), "title": EMERGING_TITLES.get(t, SCAM_TYPES.get(t, t)), "count": n, "days": 3, "quotes": quotes.get(t, [])})
        return out


# ---------- dữ liệu giả lập ----------

def seed_rows(today: date) -> list[dict]:
    rng = random.Random(18)
    area_pool = [a for a, n in AREAS.items() for _ in range(n)]
    group_pool = [g for g, n in GROUPS.items() for _ in range(n)]
    rng.shuffle(area_pool)
    rng.shuffle(group_pool)

    def take(pool: list[str], want: str | None = None) -> str:
        if want and want in pool:
            pool.remove(want)
            return want
        return pool.pop()

    def at(days_ago: int, hour: int | None = None, minute: int | None = None) -> datetime:
        h = hour if hour is not None else rng.choices(range(7, 22), weights=[2, 3, 9, 10, 9, 4, 3, 3, 3, 3, 3, 2, 2, 2, 1])[0]
        m = minute if minute is not None else rng.randrange(60)
        return datetime.combine(today - timedelta(days=days_ago), time(h, m), tzinfo=config.VN)

    rows: list[dict] = []

    def add(kind, target, scam_type, status, created, story=None, label=None, conf=None, area=None, group=None,
            human=False, appeal=None):
        confirmed = status in CONFIRMED
        rows.append({
            "id": f"rp_seed_{len(rows) + 1:03d}",
            "created_at": _iso(created),
            "kind": kind,
            "target": target_key(kind, target),
            "display": target_display(kind, target),
            "story": story or rng.choice(STORIES.get(scam_type, STORIES["khac"])),
            "has_audio": int(kind == "call" and rng.random() < 0.3),
            "lost_money": int(rng.random() < 0.08),
            "area": take(area_pool, area),
            "target_group": take(group_pool, group),
            "status": status,
            "ai_type": scam_type,
            "ai_label": label or SCAM_TYPES[scam_type],
            "ai_confidence": conf if conf is not None else round(rng.uniform(0.8, 0.98), 2) if confirmed
            else round(rng.uniform(0.05, 0.3), 2) if status == "ai_rejected" else round(rng.uniform(0.4, 0.74), 2),
            "human_verified": int(human),
            "verified_at": _iso(created) if confirmed else None,
            "expires_at": _iso(created + timedelta(days=TTL_DAYS)) if confirmed else None,
            "appeal": appeal,
            "reporter": "an-danh",
        })

    # Số demo chính (A03a, A07a): 14 báo cáo trong 7 ngày, gần nhất hôm qua, đội tình nguyện đã xác nhận
    for days_ago in [7, 6, 5, 4, 3] + [2] * 4 + [1] * 5:
        add("call", "0912345678", "gia_danh_cong_an", "ai_confirmed", at(days_ago),
            story="Tự xưng cán bộ điều tra, đòi chuyển tiền", label="Giả danh cơ quan chức năng",
            group="Người cao tuổi", human=True)
    # Kiểu mới nổi (W01): giả nhân viên điện lực, 7 báo cáo trong 3 ngày
    for i, days_ago in enumerate([3, 3, 2, 2, 1, 1, 1]):
        add("call", "02899991234", "gia_dien_luc", "ai_confirmed", at(days_ago),
            story=["Nhà chị nợ tiền điện, 2 tiếng nữa cắt…", "Bấm phím 9 để gặp nhân viên xử lý…"][i % 2],
            group="Người cao tuổi")
    # Các ca chờ duyệt hiện trên W02
    add("call", "0934567890", "gia_danh_cong_an", "needs_review", at(0, 10, 45), conf=0.71, area="Khu phố 4",
        story="Tự xưng cán bộ điều tra, đòi chuyển tiền vào tài khoản tạm giữ trong 30 phút.")
    for d in (1, 0):
        add("link", "ngan-hang-xacminh.top", "duong_dan_gia", "needs_review", at(d), conf=0.68)
    for d in (2, 1, 0):
        add("call", "02839991234", "khac", "needs_review", at(d), conf=0.55, label="Spam quảng cáo?")
    add("account", "190388885678", "viec_nhe_luong_cao", "needs_review", at(1), conf=0.62)
    add("call", "0987111222", "nguoi_than_tai_nan", "needs_review", at(0), conf=0.59)
    for d in (1, 0):
        add("link", "qua-tri-an.top", "duong_dan_gia", "needs_review", at(d), conf=0.74, label="Quà tri ân")
    add("call", "0909555666", "khac", "needs_review", at(0), conf=0.40, label="Giao hàng?")

    # Phần còn lại: 88 báo cáo rải theo tuần
    types = (["duong_dan_gia"] * 38 + ["gia_danh_cong_an"] * 15 + ["viec_nhe_luong_cao"] * 23
             + ["nguoi_than_tai_nan"] * 11 + ["khac"] * 1)
    statuses = ["ai_confirmed"] * 57 + ["ai_rejected"] * 18 + ["needs_review"] * 13
    rng.shuffle(types)
    rng.shuffle(statuses)
    # Tuần 4: 3 ngày gần nhất; tuần 3, 2, 1: mỗi tuần 7 ngày lùi dần (khớp ngày 1–7, 8–14, 15–21, 22–24/11)
    days = ([rng.randint(0, 2) for _ in range(15)] + [rng.randint(3, 9) for _ in range(24)]
            + [rng.randint(10, 16) for _ in range(27)] + [rng.randint(17, 23) for _ in range(22)])
    used: set[str] = set(RESERVED)
    for scam_type, status, days_ago in zip(types, statuses, days):
        kind, target = _fake_target(rng, scam_type, used)
        add(kind, target, scam_type, status, at(days_ago))

    # Hai khiếu nại báo oan trên các ca AI đã xác nhận
    random_confirmed = [r for r in rows[25:] if r["status"] == "ai_confirmed"]
    for r in random_confirmed[:2]:
        r["appeal"] = "Số của tôi là số giao hàng, bị báo nhầm."
    return rows


def _fake_target(rng: random.Random, scam_type: str, used: set[str]) -> tuple[str, str]:
    while True:
        if scam_type == "duong_dan_gia":
            kind = "link"
            target = f"{rng.choice(LINK_WORDS)}-{rng.choice(LINK_WORDS)}.{rng.choice(LINK_TLDS)}"
        elif scam_type == "viec_nhe_luong_cao" and rng.random() < 0.5:
            kind = "account"
            target = "".join(str(rng.randrange(10)) for _ in range(12))
        else:
            kind = "call"
            target = "0" + rng.choice("35789") + "".join(str(rng.randrange(10)) for _ in range(8))
        key = target_key(kind, target)
        if key not in used:
            used.add(key)
            return kind, target
