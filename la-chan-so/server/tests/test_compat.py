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


def test_danh_sach_bao_cao_dang_mang(client):
    rows = client.get("/api/reports").json()
    assert isinstance(rows, list) and len(rows) == 120
    pending = [r for r in rows if r["status"] == "pending"]
    assert len(pending) == 24
    r = next(x for x in pending if x["value"] == "0934 567 890")
    assert r["confidence"] == 71 and r["area"] == "Khu phố 4" and r["source"] == "seed"
    assert "Giả danh cơ quan chức năng" in r["signs"]
    assert r["whyUnsure"][0] == "Mới có 1 người báo"
    assert any(x["value"].startswith("TK 1903") for x in rows)


def test_minh_bao_so_tu_zalo(client):
    q = main.hub.subscribe()
    r = client.post("/api/reports", json={"value": "0912 345 678", "note": "Gọi đòi chuyển tiền", "source": "zalo"}).json()
    assert r["status"] == "confirmed" and r["auto"] is True and r["count"] == 15 and r["kind"] == "phone"
    assert any(m.startswith("event: report") for m in drain(q))
    main.hub.unsubscribe(q)


def test_duyet_xac_nhan_thi_tra_so_ra_nguy_hiem(client):
    rows = client.get("/api/reports").json()
    r = next(x for x in rows if x["value"] == "0987 111 222")
    assert client.get("/api/lookup?v=0987 111 222").json() == {"level": "unknown"}
    done = client.post(f"/api/reports/{r['id']}/decision", json={"decision": "confirmed"}).json()
    assert done["status"] == "confirmed" and done["decidedBy"] == "Khoa"
    hit = client.get("/api/lookup?v=0987111222").json()
    assert hit["level"] == "danger" and hit["until"]
    assert client.post("/api/check", json={"value": "0987 111 222"}).json()["level"] == "danger"


def test_gan_nhan_giao_hang_khong_thanh_nguy_hiem(client):
    rows = client.get("/api/reports").json()
    r = next(x for x in rows if x["value"] == "0909 555 666")
    done = client.post(f"/api/reports/{r['id']}/decision", json={"decision": "label", "label": "Giao hàng"}).json()
    assert done["status"] == "labeled" and done["label"] == "Giao hàng"
    assert client.get("/api/lookup?v=0909555666").json()["level"] == "unknown"


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
    client.post("/api/broadcasts", json={"title": "Cảnh báo", "body": "Giả điện lực", "to": ["Người thân đã ghép"]})
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
