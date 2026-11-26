"""Independent sample installations. Review the demo clusters with the same snapshots as live reports."""

from datetime import timedelta
from random import Random
from secrets import token_hex

from .evidence import key_hash
from .reports import base_state


def seed(store, now):
    db = store.db
    rng = Random(18)
    areas = [f"Khu phố {i}" for i, n in ((1, 31), (4, 26), (2, 24), (5, 21), (3, 18)) for _ in range(n)]
    groups = [g for g, n in (("Người cao tuổi", 55), ("Học sinh", 37), ("Khác", 28)) for _ in range(n)]
    rng.shuffle(areas)
    rng.shuffle(groups)
    # Reserve the two featured numbers for recent evidence, distribute the remainder across month to date.
    days = [
        min(now.day, start + i % max(1, min(7, now.day - start + 1)))
        for start, count in ((1, 22), (8, 27), (15, 31), (22, 40))
        for i in range(count)
    ]
    seq = 0

    def cluster(
        key,
        kind,
        category,
        count,
        *,
        confirms=0,
        rejects=False,
        recordings=0,
        conflict=False,
        burst=False,
        recent=False,
        appeal=False,
    ):
        nonlocal seq
        rows = []
        for i in range(count):
            seq += 1
            device, event, rid = (
                key_hash(f"sample-device-{seq}")[:16],
                f"sample-event-{seq}",
                f"rp_seed_{seq:03}",
            )
            db.execute("INSERT OR IGNORE INTO devices VALUES (?,?)", (device, token_hex(32)))
            if recent:
                day = max(1, now.day - 1 - i % 3)
            elif burst:
                day = now.day
            else:
                day = days[0]
            # Match weekly totals, including the dates reserved for the two featured cases.
            candidates = [d for d in days if now.day - 7 <= d < now.day] if recent else days
            chosen = min(candidates or days, key=lambda d: abs(d - day))
            days.remove(chosen)
            at = now.replace(day=chosen, hour=0, minute=0, second=0, microsecond=0)
            available = int((now - at).total_seconds()) if chosen == now.day else 86400
            at += timedelta(seconds=rng.randrange(max(1, min(86400, available))))
            if recent:
                at = min(now - timedelta(seconds=1), at.replace(hour=9, minute=i))
            if burst:
                at = now - timedelta(seconds=count - i)
            evidence_type = "call_log" if kind == "phone" else "sms_received"
            digest = key_hash(key)
            analysis = None
            own = None
            story = {
                "gia_dien_luc": "Người gọi báo sắp cắt điện, giục chuyển tiền.",
                "gia_danh_cong_an": "Người gọi tự xưng cán bộ điều tra, đòi chuyển tiền.",
                "duong_dan_gia": "Tin nhắn gửi đường dẫn lạ và yêu cầu nhập mã OTP.",
                "viec_nhe_luong_cao": "Mời làm cộng tác viên, đòi nạp tiền trước.",
                "nguoi_than_tai_nan": "Báo người thân gặp tai nạn, yêu cầu chuyển tiền gấp.",
                "khac": "Cửa hàng gọi xác nhận đơn giao hàng.",
            }[category]
            db.execute(
                "INSERT INTO events VALUES (?,?,?,?,?,?)",
                (event, device, evidence_type, digest, at.isoformat(), 60 if kind == "phone" else None),
            )
            if i < recordings:
                analysis = f"analysis_seed_{seq}"
                own = "no" if conflict else "yes"
                db.execute(
                    "INSERT INTO analyses VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (analysis, device, event, digest, "ai", at.isoformat(), "danger", category, 0.92, story, 1),
                )
            db.execute(
                """INSERT INTO evidence_reports(id,device,event,key,kind,created,at,evidence_type,analysis,story,
                lost,area,target_group,category,self_answer) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)""",
                (
                    rid,
                    device,
                    event,
                    key,
                    kind,
                    at.isoformat(),
                    at.isoformat(),
                    evidence_type,
                    analysis,
                    story,
                    areas.pop(),
                    groups.pop(),
                    category,
                    own,
                ),
            )
            rows.append(store.row(rid))
        if confirms or rejects:
            states = {r["id"]: base_state(r, now) for r in rows}
            review = store.open_round(key, rows, states, ["w3"])
            for member in ["khoa", "lan-anh"][: 2 if rejects else confirms]:
                db.execute(
                    "INSERT INTO votes VALUES (?,?,?,?)",
                    (review, member, "reject" if rejects else "confirm", "Đã đối chiếu bằng chứng."),
                )
            if rejects or confirms == 2:
                db.execute("UPDATE reviews SET status='decided' WHERE id=?", (review,))
            if rejects:
                db.execute("UPDATE evidence_reports SET terminal='rejected' WHERE key=?", (key,))
        if appeal:
            db.execute(
                "INSERT INTO appeals VALUES (?,?,?,?,?,'verified',NULL,NULL,NULL)",
                ("ap_seed_" + key, key, "seed-owner", key, "Số giao hàng của tôi có thể bị giả mạo."),
            )
        store.refresh(key, now, "appeal" if appeal else None)

    cluster("02899991234", "phone", "gia_dien_luc", 7, confirms=2, recordings=2, recent=True)
    cluster("0912345678", "phone", "gia_danh_cong_an", 14, confirms=2, recent=True)
    cluster("0934567890", "phone", "gia_danh_cong_an", 5, confirms=1)
    cluster("xac-minh-uu-dai.top", "link", "duong_dan_gia", 30, confirms=2)
    cluster("0976111222", "phone", "viec_nhe_luong_cao", 12, confirms=2, appeal=True)
    cluster("0987111222", "phone", "nguoi_than_tai_nan", 10, confirms=2, appeal=True)
    cluster("qua-tang-moi.info", "link", "duong_dan_gia", 6, rejects=True)
    cluster("0368111222", "phone", "viec_nhe_luong_cao", 6, rejects=True)
    cluster("0368222333", "phone", "gia_danh_cong_an", 6, rejects=True)
    cluster("0368333444", "phone", "gia_danh_cong_an", 5)
    cluster("qua-tri-an.top", "link", "duong_dan_gia", 6)
    cluster("0378111222", "phone", "viec_nhe_luong_cao", 6)
    cluster("0378222333", "phone", "nguoi_than_tai_nan", 1, recordings=1, conflict=True)
    cluster("0378333444", "phone", "nguoi_than_tai_nan", 1)
    cluster("0909555666", "phone", "khac", 5, burst=True)
