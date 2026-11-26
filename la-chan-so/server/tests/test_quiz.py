import pytest

from lcs import main, quiz


@pytest.fixture()
def board_client(client):
    quiz.reset(main.store)
    return client


def device(c):
    return c.post("/api/devices").json()["deviceId"]


def board(c, scope, school="ngo-quyen", group="11A1"):
    r = c.get("/api/quiz/leaderboard", params={"scope": scope, "school": school, "group": group})
    assert r.status_code == 200, r.text
    return r.json()


def test_schools_are_listed_with_groups(board_client):
    j = board_client.get("/api/quiz/schools").json()
    assert j["demo"] is True
    ngo_quyen = next(s for s in j["schools"] if s["id"] == "ngo-quyen")
    assert ngo_quyen["name"] == "THPT Ngô Quyền" and ngo_quyen["ward"] == "Trấn Biên" and "11A1" in ngo_quyen["groups"]


def test_seed_board_matches_design(board_client):
    j = board(board_client, "group")
    assert j["title"] == "THPT Ngô Quyền"
    assert [(i["name"], i["points"], i["players"]) for i in j["items"][:3]] == [("Lớp 11A3", 1020, 12), ("Lớp 11A1", 940, 12), ("Lớp 11A7", 860, 11)]
    assert j["items"][1]["next"] == {"name": "Lớp 11A3", "need": 100}
    assert "next" not in j["items"][0]
    assert [i["mine"] for i in j["items"]] == [False, True, False, False]
    assert all("device" not in i for i in j["items"])


def test_full_score_lifts_class_to_first(board_client):
    d = device(board_client)
    r = board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5},
                          headers={"X-LCS-Device": d})
    assert r.json() == {"points": 100, "best": 100, "improved": True}
    top = board(board_client, "group")["items"][0]
    assert (top["name"], top["points"], top["players"], top["mine"], top["rank"]) == ("Lớp 11A1", 1040, 13, True, 1)
    assert "next" not in top


def test_only_best_score_counts_per_device(board_client):
    d = device(board_client)
    h = {"X-LCS-Device": d}
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5}, headers=h)
    r = board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 2, "total": 5}, headers=h)
    assert r.json() == {"points": 40, "best": 100, "improved": False}
    row = next(i for i in board(board_client, "group")["items"] if i["name"] == "Lớp 11A1")
    assert (row["players"], row["points"]) == (13, 1040)


def test_changing_class_moves_the_score(board_client):
    h = {"X-LCS-Device": device(board_client)}
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5}, headers=h)
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A7", "correct": 3, "total": 5}, headers=h)
    items = {i["name"]: i["players"] for i in board(board_client, "group")["items"]}
    assert items["Lớp 11A1"] == 12 and items["Lớp 11A7"] == 12


def test_school_and_ward_scopes_cover_whole_area(board_client):
    s = board(board_client, "school")
    assert s["title"] == "Các trường ở Đồng Nai" and len(s["items"]) == 12
    assert s["items"][0]["name"] == "THPT chuyên Lương Thế Vinh"
    me = next(i for i in s["items"] if i["mine"])
    assert (me["name"], me["rank"], me["points"], me["next"]) == ("THPT Ngô Quyền", 3, 3420, {"name": "THPT Trấn Biên", "need": 60})
    w = board(board_client, "ward")
    assert w["title"] == "Các phường ở Đồng Nai"
    assert w["items"][0]["name"] == "Phường Tam Hiệp"
    assert next(i for i in w["items"] if i["mine"])["name"] == "Phường Trấn Biên"


def test_full_score_lifts_school_one_place(board_client):
    h = {"X-LCS-Device": device(board_client)}
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5}, headers=h)
    me = next(i for i in board(board_client, "school")["items"] if i["mine"])
    assert me["rank"] == 2


def test_inviting_a_weaker_friend_never_lowers_the_class(board_client):
    before = next(i for i in board(board_client, "group")["items"] if i["name"] == "Lớp 11A1")["points"]
    h = {"X-LCS-Device": device(board_client)}
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 1, "total": 5}, headers=h)
    after = next(i for i in board(board_client, "group")["items"] if i["name"] == "Lớp 11A1")["points"]
    assert after == before + 20


@pytest.mark.parametrize("body,code", [
    ({"school": "khong-co", "group": "11A1", "correct": 5, "total": 5}, 400),
    ({"school": "ngo-quyen", "group": "12Z9", "correct": 5, "total": 5}, 400),
    ({"school": "ngo-quyen", "group": "11A1", "correct": 6, "total": 5}, 400),
    ({"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5, "quiz": "bai-khac"}, 400),
])
def test_rejects_bad_results(board_client, body, code):
    r = board_client.post("/api/quiz/results", json=body, headers={"X-LCS-Device": device(board_client)})
    assert r.status_code == code


def test_requires_registered_device(board_client):
    body = {"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5}
    assert board_client.post("/api/quiz/results", json=body).status_code == 401
    assert board_client.post("/api/quiz/results", json=body, headers={"X-LCS-Device": "chua-dang-ky"}).status_code == 401


def test_demo_reset_restores_seed(board_client):
    h = {"X-LCS-Device": device(board_client)}
    board_client.post("/api/quiz/results", json={"school": "ngo-quyen", "group": "11A1", "correct": 5, "total": 5}, headers=h)
    assert board_client.post("/api/demo/reset").status_code == 200
    assert board(board_client, "group")["items"][0]["name"] == "Lớp 11A3"


def test_bad_scope_is_rejected(board_client):
    r = board_client.get("/api/quiz/leaderboard", params={"scope": "city", "school": "ngo-quyen"})
    assert r.status_code == 422
