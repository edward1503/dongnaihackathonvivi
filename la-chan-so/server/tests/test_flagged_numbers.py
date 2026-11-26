from datetime import datetime

from lcs import config
from lcs.data import OFFICIAL_NUMBERS
from lcs.evidence import key_hash


def test_flagged_phone_list(client):
    result = client.get("/api/lookup/flagged").json()
    assert datetime.fromisoformat(result["generatedAt"]).date() == config.demo_today()
    items = {item["hash"]: item for item in result["items"]}
    assert len(items) == len(result["items"])
    for number, count in (("0912345678", 14), ("02899991234", 7)):
        live = client.get("/api/lookup/phone/" + number).json()
        digest = key_hash(number)
        assert items[digest] == {
            "hash": digest, "level": "danger", "count": count, "lastWhen": live["reports"]["lastWhen"],
            "scamType": live["scamType"], "appealOpen": False,
        }
    for excluded in ("0987654321", "1900555588", "xac-minh-uu-dai.top", "0368111222"):
        assert key_hash(excluded) not in items


def test_verified_appeal_caps_offline_level(client):
    items = client.get("/api/lookup/flagged").json()["items"]
    appealed = next(item for item in items if item["hash"] == key_hash("0976111222"))
    assert appealed["level"] == "suspicious"
    assert appealed["appealOpen"] is True


def test_official_number_with_reports_is_excluded(client, monkeypatch):
    monkeypatch.setitem(OFFICIAL_NUMBERS, "0912345678", "Tổng đài")
    items = client.get("/api/lookup/flagged").json()["items"]
    assert key_hash("0912345678") not in {item["hash"] for item in items}


def test_expired_reports_drop_out_of_list(client, monkeypatch):
    monkeypatch.setenv("LCS_TODAY", "2027-03-01")
    assert client.get("/api/lookup/flagged").json()["items"] == []
