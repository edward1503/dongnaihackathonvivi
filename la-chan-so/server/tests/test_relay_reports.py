"""S5 (đồng bộ ba máy) và S6 (báo cáo, kiểm duyệt, thống kê)."""


def test_hoi_nguoi_than_hai_chieu_qua_websocket(client):
    with client.websocket_connect("/ws?room=gia-dinh-hoa&who=minh") as minh:
        ask = client.post("/api/asks", json={
            "text": "Mẹ vừa nhận cuộc gọi từ số 0912 345 678. Lá chắn báo NGUY HIỂM. Con xem giúp mẹ.",
        }).json()
        ev = minh.receive_json()
        assert ev["type"] == "ask.sent" and ev["data"]["askId"] == ask["askId"]
        assert "0912 345 678" in ev["data"]["text"]

        with client.websocket_connect(f"/ws?room=gia-dinh-hoa&who=ba-hoa&since={ev['id']}") as ba:
            client.post(f"/api/asks/{ask['askId']}/seen")
            assert ba.receive_json()["type"] == "ask.seen"
            client.post(f"/api/asks/{ask['askId']}/reply", json={"preset": "dung_chuyen"})
            reply = ba.receive_json()
            assert reply["type"] == "ask.reply"
            assert reply["data"]["text"] == "Mẹ đừng chuyển! Con gọi mẹ ngay."


def test_hoi_dinh_ky_khi_websocket_hong(client):
    client.post("/api/events", json={"type": "alert.timeline", "room": "gia-dinh-hoa",
                                     "data": {"time": "10:43", "text": "Mẹ trả lời: có đòi chuyển tiền"}})
    evs = client.get("/api/events?room=gia-dinh-hoa&since=0").json()["events"]
    assert evs[-1]["type"] == "alert.timeline"
    last = evs[-1]["id"]
    assert client.get(f"/api/events?room=gia-dinh-hoa&since={last}").json()["events"] == []


def test_su_kien_la_bi_tu_choi(client):
    r = client.post("/api/events", json={"type": "chuyen.tien", "room": "gia-dinh-hoa", "data": {}})
    assert r.status_code == 400
    assert client.get("/api/events?room=PHONG XAU").status_code == 400


def test_canh_bao_che_tom_tat(client):
    r = client.post("/api/alerts", json={
        "level": "danger", "scamType": "gia_danh_cong_an", "phone": "0912345678", "asksMoney": True,
        "summary": "Người gọi tự xưng cán bộ điều tra, yêu cầu chuyển vào tài khoản 190388885678 và giữ bí mật.",
    }).json()
    assert r["phoneDisplay"] == "0912 345 678"
    assert "190388885678" not in r["summaryMasked"] and "[TK]" in r["summaryMasked"]
    assert r["scamLabel"] == "Giả danh công an"
    evs = client.get("/api/events?room=gia-dinh-hoa").json()["events"]
    assert evs[-1]["type"] == "alert.created"


def test_bao_cao_so_da_bi_bao_thanh_nguoi_thu_15(client):
    r = client.post("/api/reports", json={
        "kind": "call", "target": "0912 345 678",
        "story": "Tự xưng cán bộ điều tra, yêu cầu chuyển tiền vào tài khoản tạm giữ.",
    }).json()
    assert r["reporterCount"] == 15
    assert r["report"]["status"] == "ai_confirmed"
    assert r["report"]["ai"]["scamLabel"] == "Giả danh cơ quan chức năng"
    assert r["report"]["ai"]["confidence"] == 0.94
    assert r["points"] == 10 and r["totalPoints"] == 130
    assert r["warningCommunity"] is True
    assert r["report"]["expiresAt"]


def test_bao_cao_moi_cho_nguoi_duyet_roi_xac_nhan(client):
    r = client.post("/api/reports", json={"kind": "call", "target": "0977 000 111", "story": "Gọi bảo trúng thưởng, đòi đóng phí nhận quà."}).json()
    rid = r["report"]["id"]
    assert r["report"]["status"] == "needs_review"
    assert client.post("/api/check", json={"value": "0977 000 111"}).json()["level"] == "unknown"

    done = client.patch(f"/api/reports/{rid}", json={"status": "confirmed"}).json()
    assert done["status"] == "confirmed" and done["humanVerified"]
    after = client.post("/api/check", json={"value": "0977 000 111"}).json()
    assert after["level"] == "danger" and "Đội tình nguyện đã xác nhận" in after["why"]


def test_bao_cao_tin_nhan_gom_theo_so_gui(client):
    r = client.post("/api/reports", json={"kind": "message", "target": "0912 345 678", "story": "Nhắn đòi chuyển tiền"}).json()
    assert r["reporterCount"] == 15


def test_khieu_nai(client):
    rid = client.get("/api/reports?status=ai_confirmed&limit=1").json()["items"][0]["id"]
    r = client.post(f"/api/reports/{rid}/appeal", json={"text": "Số giao hàng 0912 345 678 của tôi bị báo nhầm"}).json()
    assert r["appeal"] and "0912" not in r["appeal"]


def test_danh_sach_cho_duyet(client):
    r = client.get("/api/reports?status=needs_review&limit=7").json()
    assert r["total"] == 24 and len(r["items"]) == 7


def test_thong_ke_khop_man_W01_W02(client):
    s = client.get("/api/stats").json()
    assert s["month"] == "2026-11"
    assert s["total"] == 120
    assert s["links"] == {"count": 42, "pct": 35}
    assert (s["aiConfirmed"], s["aiRejected"], s["needsReview"], s["appeals"]) == (78, 18, 24, 2)
    assert [(t["label"], t["count"]) for t in s["byType"]] == [
        ("Đường dẫn giả mạo", 42), ("Giả danh công an", 30), ("Việc nhẹ lương cao", 24),
        ("Người thân gặp tai nạn", 12), ("Khác", 12),
    ]
    assert s["weekly"] == [22, 27, 31, 40]
    assert [(a["area"], a["count"]) for a in s["byArea"]] == [
        ("Khu phố 1", 31), ("Khu phố 4", 26), ("Khu phố 2", 24), ("Khu phố 5", 21), ("Khu phố 3", 18),
    ]
    assert [(g["group"], g["pct"]) for g in s["targetGroups"]] == [("Người cao tuổi", 46), ("Học sinh", 31), ("Khác", 23)]
    assert [e["label"] for e in s["emerging"]] == ["Giả nhân viên điện lực"]
    assert s["emerging"][0]["count"] == 7
    assert s["changePct"] == 18


def test_reset_demo(client):
    client.post("/api/reports", json={"kind": "call", "target": "0977 000 222"})
    client.post("/api/demo/reset")
    assert client.get("/api/stats").json()["total"] == 120
    evs = client.get("/api/events?room=gia-dinh-hoa").json()["events"]
    assert [e["type"] for e in evs] == ["demo.reset"]
