"""Tài khoản quản trị: một phiếu là quyết định, và gắn hoặc gỡ cờ một số bất kỳ ngay trên web."""

from lcs import main
from lcs.evidence import key_hash
from test_community import PHONE, device, member, payload, submit

ADMIN = "868686"
OTHER = "0388123456"


def lookup(c, phone):
    r = c.get(f"/api/lookup/phone/{phone}")
    assert r.status_code == 200, r.text
    return r.json()


def five_reports(c, target=PHONE):
    for _ in range(5):
        d = device(c)
        assert submit(c, d, payload(d, target)).status_code == 200


def open_case(c, head, target=PHONE):
    items = c.get("/api/cases?status=open", headers=head).json()["items"]
    return next(x for x in items if x["key"] == target)


def test_admin_login_has_admin_role(client):
    j = client.post("/api/team/login", json={"code": ADMIN}).json()
    assert j["member"]["role"] == "admin"


def test_quick_flag_warns_at_once_and_can_be_removed(client):
    head = member(client, ADMIN)
    assert lookup(client, OTHER)["level"] == "unknown"
    r = client.post("/api/admin/flags", headers=head, json={"target": "038 812 3456", "scamType": "gia_danh_cong_an"})
    assert r.status_code == 200, r.text
    assert r.json()["level"] == "danger" and r.json()["verified"] is True
    j = lookup(client, OTHER)
    assert j["level"] == "danger" and j["adminVerified"] is True and j["count"] == 0
    assert j["headline"].startswith("Lá chắn số đã xác minh") and j["scamLabel"] == "Giả danh công an"
    assert key_hash(OTHER) in {i["hash"] for i in client.get("/api/lookup/flagged").json()["items"]}
    items = client.get("/api/admin/flags", headers=head).json()["items"]
    assert [(i["key"], i["level"]) for i in items] == [(OTHER, "danger")]
    assert client.post("/api/admin/flags/remove", headers=head, json={"key": OTHER}).json()["level"] == "unknown"
    assert lookup(client, OTHER)["level"] == "unknown"
    assert client.post("/api/admin/flags/remove", headers=head, json={"key": OTHER}).status_code == 404


def test_only_admin_can_quick_flag(client):
    for code in ("246810", "999111"):
        head = member(client, code)
        assert client.post("/api/admin/flags", headers=head, json={"target": OTHER}).status_code == 403
        assert client.get("/api/admin/flags", headers=head).status_code == 403
    assert client.post("/api/admin/flags", json={"target": OTHER}).status_code == 401
    assert lookup(client, OTHER)["level"] == "unknown"


def test_quick_flag_rejects_non_phone(client):
    head = member(client, ADMIN)
    for bad in ("12", "bit.ly/abc", ""):
        assert client.post("/api/admin/flags", headers=head, json={"target": bad}).status_code == 422
    assert client.post("/api/admin/flags", headers=head, json={"target": OTHER, "scamType": "la"}).status_code == 422


def test_one_admin_confirm_decides_case(client):
    five_reports(client)
    assert lookup(client, PHONE)["level"] == "unknown"
    head = member(client, ADMIN)
    case = open_case(client, head)
    r = client.post(f"/api/cases/{PHONE}/vote", headers=head, json={"reviewId": case["reviewId"], "decision": "confirm"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "decided"
    j = lookup(client, PHONE)
    assert j["level"] == "danger" and j["adminVerified"] is True and j["count"] == 5
    assert all(x["key"] != PHONE for x in client.get("/api/cases?status=open", headers=head).json()["items"])


def test_volunteer_confirm_still_needs_two(client):
    five_reports(client)
    head = member(client, "246810")
    case = open_case(client, head)
    r = client.post(f"/api/cases/{PHONE}/vote", headers=head, json={"reviewId": case["reviewId"], "decision": "confirm"})
    assert r.json()["status"] == "open"
    j = lookup(client, PHONE)
    assert j["level"] == "suspicious" and j["adminVerified"] is False


def test_admin_reject_clears_case_and_flag(client):
    five_reports(client)
    head = member(client, ADMIN)
    client.post("/api/admin/flags", headers=head, json={"target": PHONE})
    assert lookup(client, PHONE)["level"] == "danger"
    case = open_case(client, head)
    r = client.post(f"/api/cases/{PHONE}/vote", headers=head, json={"reviewId": case["reviewId"], "decision": "reject"})
    assert r.json()["status"] == "decided"
    assert lookup(client, PHONE)["level"] == "unknown"
    assert client.get("/api/admin/flags", headers=head).json()["items"] == []


def test_demo_reset_clears_admin_flags(client):
    head = member(client, ADMIN)
    client.post("/api/admin/flags", headers=head, json={"target": OTHER})
    assert client.post("/api/demo/reset").status_code == 200
    assert lookup(client, OTHER)["level"] == "unknown"
    assert main.store.admin_flags() == []
