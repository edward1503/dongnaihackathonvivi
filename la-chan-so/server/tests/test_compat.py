"""Lớp tương thích với trang Zalo và web đội tình nguyện của Mảng 5, 6 (mvp/HOP-DONG-DU-LIEU.md)."""
from lcs import main


def drain(q):
    out = []
    while not q.empty():
        out.append(q.get_nowait())
    return out


def test_thong_ke_co_ca_ten_truong_cua_trang_web(client):
    s = client.get("/api/stats").json()
    assert s["scam"][0] == ["Đường dẫn giả mạo", 42]
    assert s["areas"][0] == ["Khu phố 1", 31]
    assert s["targets"][0] == ["Người cao tuổi", 46]
    assert s["pending"] == 24 and s["aiPct"] == 65 and s["peak"] == "9–11 giờ sáng"
    assert s["totalDelta"].startswith("+18%")


def test_canh_bao_dang_cua_trang_zalo(client):
    assert client.get("/api/alerts").json()[0]["id"] == "al_demo"
    q = main.hub.subscribe()
    a = client.post("/api/alerts", json={
        "level": "danger", "who": "Mẹ Hoa", "number": "0912345678", "scenario": "Giả danh công an",
        "askedTransfer": True, "summary": "Bảo chuyển vào tài khoản 190388885678 ngay",
        "timeline": [{"t": "10:38", "text": "Cuộc gọi đến", "tone": ""}],
    }).json()
    assert a["number"] == "0912 345 678" and a["scenario"] == "Giả danh công an" and a["askedTransfer"] is True
    assert "190388885678" not in a["summary"]
    assert a["timeline"][0]["t"] == "10:38"
    assert any(m.startswith("event: alert") for m in drain(q))
    evs = client.get("/api/events?room=gia-dinh-hoa").json()["events"]
    assert evs[-1]["type"] == "alert.created" and evs[-1]["data"]["alertId"] == a["id"]
    main.hub.unsubscribe(q)


def test_minh_tra_loi_tren_zalo_thi_may_ba_hoa_nhan(client):
    with client.websocket_connect("/ws?room=gia-dinh-hoa&who=ba-hoa") as ba:
        ask = client.post("/api/asks", json={"text": "Con xem giúp mẹ số 0912 345 678", "phone": "0912345678",
                                             "scamLabel": "Giả danh công an", "asksMoney": True}).json()
        assert ba.receive_json()["type"] == "ask.sent"
        # Trang Zalo thấy câu hỏi như một cảnh báo
        alert = next(x for x in client.get("/api/alerts").json() if x["id"] == ask["askId"])
        assert alert["number"] == "0912 345 678" and "0912 345 678" in alert["summary"]
        out = client.post(f"/api/alerts/{ask['askId']}/reply", json={"choice": "dung-chuyen"}).json()
        assert out["reply"]["text"] == "Minh: Mẹ đừng chuyển! Con gọi mẹ ngay."
        ev = ba.receive_json()
        assert ev["type"] == "ask.reply" and ev["data"]["askId"] == ask["askId"]
        assert ev["data"]["text"] == "Mẹ đừng chuyển! Con gọi mẹ ngay."
        client.post(f"/api/alerts/{ask['askId']}/call")
        assert ba.receive_json()["type"] == "alert.call"


def test_tra_loi_tu_app_cung_hien_tren_zalo(client):
    ask = client.post("/api/asks", json={"text": "Con xem giúp mẹ"}).json()
    client.post(f"/api/asks/{ask['askId']}/reply", json={"preset": "nguoi_quen"})
    alert = next(x for x in client.get("/api/alerts").json() if x["id"] == ask["askId"])
    assert alert["reply"]["choice"] == "nguoi-quen" and alert["status"] == "cleared"


def test_tuyen_truyen_va_reset(client):
    q = main.hub.subscribe()
    lead = client.post("/api/team/login", json={"code":"999111"}).json()["token"]
    client.post("/api/broadcasts", headers={"X-LCS-Team":lead}, json={"title": "Cảnh báo", "body": "Giả điện lực", "to": ["Người thân đã ghép"]})
    assert len(client.get("/api/broadcasts").json()) == 1
    assert any(m.startswith("event: broadcast") for m in drain(q))
    client.post("/api/reset")
    assert client.get("/api/broadcasts").json() == []
    assert [a["id"] for a in client.get("/api/alerts").json()] == ["al_demo"]
    assert any(m.startswith("event: reset") for m in drain(q))
    main.hub.unsubscribe(q)


def test_tep_tinh_khong_doi_duoc_duong_dan(client):
    r = client.get("/ds.css?f=../../../../etc/passwd&n=../../etc/passwd")
    assert r.status_code == 200 and ":root" in r.text and "root:x:" not in r.text


def test_mvp_launcher_serves_its_landing_page_and_shared_backend():
    from fastapi.testclient import TestClient

    with TestClient(main.mvp_portal()) as portal:
        assert 'href="/web"' in portal.get("/").text
        assert portal.get("/api/cases").status_code == 401
        assert portal.get("/api/lookup/phone/02899991234").json()["count"] == 7
