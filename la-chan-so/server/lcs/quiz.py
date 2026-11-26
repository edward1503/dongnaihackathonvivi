"""Thi đua bài kiểm tra theo lớp, trường, phường.

Học sinh chọn trường và lớp một lần (không tài khoản, không tên). Mỗi máy mỗi bài chỉ tính điểm cao nhất.
Điểm thi đua của một lớp (trường, phường) = cộng điểm tốt nhất của từng bạn (mỗi bạn tối đa 100). Xếp theo tổng chứ không theo
trung bình: rủ thêm bạn nào làm bài cũng chỉ cộng thêm cho lớp, không bao giờ kéo lớp tụt; làm lại chỉ tính lần tốt nhất nên không cày được.
Bảng chỉ có số gộp (điểm thi đua, số bạn, điểm trung bình), theo ba phạm vi:
  group   các lớp trong một trường
  school  các trường toàn Đồng Nai (một phường chỉ có 1–4 trường THPT, xếp trong phường không có nghĩa)
  ward    các phường toàn Đồng Nai, gộp theo phường của trường
Dòng của mình kèm "next": cần thêm bao nhiêu điểm để vượt hạng ngay trên (mỗi câu đúng 20 điểm).

Tên trường và phường là thật, lấy từ Kế hoạch tuyển sinh THPT năm học 2026-2027 của Sở GD&ĐT Đồng Nai
(số 1213/KH-SGDĐT ngày 20/02/2026, mục VI): các trường thi tuyển ở khu Biên Hòa và Long Khánh.
Tên lớp và điểm nạp sẵn là dữ liệu minh họa (cờ "demo"); điểm thật của người làm bài cộng thẳng vào.
"""
from pydantic import BaseModel, Field

from . import config

QUIZ_IDS = {"nhan-dien"}
AREA = "Đồng Nai"
STEP = 20      # điểm cho mỗi câu đúng trên bài 5 câu

# Mỗi lớp: (tên lớp, số bạn đã làm, tổng số câu đúng của cả lớp trên bài 5 câu). Điểm thi đua = tổng đúng * 20.
SCHOOLS = [
    {"id": "ngo-quyen", "name": "THPT Ngô Quyền", "ward": "Trấn Biên",
     "groups": [("10A2", 8, 30), ("11A1", 12, 47), ("11A3", 12, 51), ("11A7", 11, 43)]},
    {"id": "luong-the-vinh", "name": "THPT chuyên Lương Thế Vinh", "ward": "Tam Hiệp",
     "groups": [("10A1", 15, 65), ("11A2", 15, 66), ("12A1", 14, 62)]},
    {"id": "tam-hiep", "name": "THPT Tam Hiệp", "ward": "Tam Hiệp",
     "groups": [("10A3", 12, 47), ("11A4", 13, 50), ("12A2", 12, 48)]},
    {"id": "tran-bien", "name": "THPT Trấn Biên", "ward": "Tam Hiệp",
     "groups": [("10A5", 14, 58), ("11A6", 14, 60), ("12A3", 13, 55)]},
    {"id": "thuc-hanh-su-pham", "name": "THPT Thực hành Sư phạm", "ward": "Tam Hiệp",
     "groups": [("10A1", 10, 41), ("11A1", 9, 36)]},
    {"id": "nam-ha", "name": "THPT Nam Hà", "ward": "Biên Hòa",
     "groups": [("10A2", 10, 39), ("11A3", 11, 42), ("12A1", 10, 39)]},
    {"id": "chu-van-an", "name": "THPT Chu Văn An", "ward": "Biên Hòa",
     "groups": [("10A4", 11, 43), ("11A2", 11, 44), ("12A5", 10, 41)]},
    {"id": "nguyen-trai", "name": "THPT Nguyễn Trãi", "ward": "Long Bình",
     "groups": [("10A1", 14, 57), ("11A5", 13, 54), ("12A2", 13, 54)]},
    {"id": "le-hong-phong", "name": "THPT Lê Hồng Phong", "ward": "Long Bình",
     "groups": [("10A3", 11, 44), ("11A2", 12, 47), ("12A4", 11, 44)]},
    {"id": "nguyen-huu-canh", "name": "THPT Nguyễn Hữu Cảnh", "ward": "Long Hưng",
     "groups": [("10A2", 10, 38), ("11A1", 10, 39), ("12A3", 9, 35)]},
    {"id": "tam-phuoc", "name": "THPT Tam Phước", "ward": "Long Hưng",
     "groups": [("10A1", 9, 33), ("11A3", 10, 36), ("12A2", 8, 30)]},
    {"id": "long-khanh", "name": "THPT Long Khánh", "ward": "Long Khánh",
     "groups": [("10A2", 13, 52), ("11A4", 13, 53), ("12A1", 12, 50)]},
]
BY_ID = {s["id"]: s for s in SCHOOLS}

SCHEMA = """CREATE TABLE IF NOT EXISTS quiz_results(
    device TEXT NOT NULL, quiz TEXT NOT NULL, school TEXT NOT NULL, grp TEXT NOT NULL,
    points INTEGER NOT NULL, at TEXT NOT NULL, PRIMARY KEY(device, quiz))"""


class ResultIn(BaseModel):
    quiz: str = Field("nhan-dien", max_length=40)
    school: str = Field(..., max_length=40)
    group: str = Field(..., max_length=12)
    correct: int = Field(..., ge=0, le=50)
    total: int = Field(..., ge=1, le=50)


def schools():
    return {"demo": config.env("LCS_DEMO") == "1", "area": AREA, "step": STEP,
            "schools": [{"id": s["id"], "name": s["name"], "ward": s["ward"], "groups": [g[0] for g in s["groups"]]} for s in SCHOOLS]}


def _seed(store):
    at = config.now().isoformat()
    for s in SCHOOLS:
        for name, players, correct in s["groups"]:
            base, extra = divmod(correct, players)
            for i in range(players):
                points = min(5, base + (1 if i < extra else 0)) * 20
                store.db.execute("INSERT INTO quiz_results VALUES (?,?,?,?,?,?)",
                                 (f"seed-{s['id']}-{name}-{i}", "nhan-dien", s["id"], name, points, at))


def ensure(store):
    with store.transaction():
        store.db.execute(SCHEMA)
        if not store.db.execute("SELECT 1 FROM quiz_results LIMIT 1").fetchone():
            _seed(store)


def reset(store):
    with store.transaction():
        store.db.execute(SCHEMA)
        store.db.execute("DELETE FROM quiz_results")
        _seed(store)


class QuizError(ValueError):
    pass


def submit(store, device, body: ResultIn):
    """Ghi điểm của một máy; chỉ giữ điểm cao nhất của mỗi bài. Đổi trường, lớp thì điểm chuyển theo."""
    if body.quiz not in QUIZ_IDS:
        raise QuizError("Bài kiểm tra này chưa có bảng thi đua.")
    school = BY_ID.get(body.school)
    if not school or body.group not in [g[0] for g in school["groups"]]:
        raise QuizError("Trường hoặc lớp không có trong danh sách.")
    if body.correct > body.total:
        raise QuizError("Số câu đúng lớn hơn số câu của bài.")
    points = round(100 * body.correct / body.total)
    with store.transaction():
        store.secret(device)   # chỉ máy đã đăng ký mới gửi được điểm
        old = store.db.execute("SELECT points FROM quiz_results WHERE device=? AND quiz=?", (device, body.quiz)).fetchone()
        best = max(points, old["points"] if old else 0)
        store.db.execute("""INSERT INTO quiz_results VALUES (?,?,?,?,?,?)
                            ON CONFLICT(device, quiz) DO UPDATE SET school=excluded.school, grp=excluded.grp,
                            points=?, at=excluded.at""",
                         (device, body.quiz, body.school, body.group, best, config.now().isoformat(), best))
    return {"points": points, "best": best, "improved": old is None or points > old["points"]}


def board(store, scope: str, school_id: str, group: str | None = None, quiz: str = "nhan-dien"):
    school = BY_ID.get(school_id)
    if not school:
        raise QuizError("Trường không có trong danh sách.")
    if quiz not in QUIZ_IDS:
        raise QuizError("Bài kiểm tra này chưa có bảng thi đua.")
    rows = store.db.execute("SELECT school, grp, points FROM quiz_results WHERE quiz=?", (quiz,)).fetchall()
    if scope == "group":
        title, names = school["name"], [g[0] for g in school["groups"]]
        key = lambda r: r["grp"] if r["school"] == school_id else None
        mine = group
        label = lambda n: f"Lớp {n}"
    elif scope == "school":
        title, names = f"Các trường ở {AREA}", [s["id"] for s in SCHOOLS]
        key = lambda r: r["school"] if r["school"] in BY_ID else None
        mine = school_id
        label = lambda n: BY_ID[n]["name"]
    elif scope == "ward":
        wards = list(dict.fromkeys(s["ward"] for s in SCHOOLS))
        title, names = f"Các phường ở {AREA}", wards
        key = lambda r: BY_ID[r["school"]]["ward"] if r["school"] in BY_ID else None
        mine = school["ward"]
        label = lambda n: f"Phường {n}"
    else:
        raise QuizError("Phạm vi phải là group, school hoặc ward.")
    sums = {n: [0, 0] for n in names}
    for r in rows:
        k = key(r)
        if k in sums:
            sums[k][0] += r["points"]
            sums[k][1] += 1
    items = [{"id": n, "name": label(n), "points": total, "players": c, "avg": round(total / c, 1), "mine": n == mine}
             for n, (total, c) in sums.items() if c]
    items.sort(key=lambda x: (-x["points"], -x["avg"], x["name"]))
    for rank, it in enumerate(items, 1):
        it["rank"] = rank
        if it["mine"] and rank > 1:
            above = items[rank - 2]
            need = (above["points"] - it["points"]) // STEP * STEP + STEP   # số điểm (bội của 20) để vượt hẳn
            it["next"] = {"name": above["name"], "need": need}
    return {"scope": scope, "title": title, "demo": config.env("LCS_DEMO") == "1", "items": items}
