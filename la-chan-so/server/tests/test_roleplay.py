"""Gọi video khuyên chị Lan: chấm 4 ý, chị Lan đáp đúng vai, an toàn với dãy số."""
from lcs import ai, roleplay


def test_bat_dau_bang_cau_da_thu(client):
    r = client.post("/api/roleplay/start").json()
    assert r["line"]["audio"] == "audio/chi-lan-1.m4a" and r["score"] == 0
    assert [k["key"] for k in r["keys"]] == ["nap", "dauhieu", "xacminh", "baocao"]


def test_kich_ban_du_phong_cham_va_goi_y(client):
    sid = client.post("/api/roleplay/start").json()["sessionId"]
    r = client.post("/api/roleplay/turn", json={"sessionId": sid, "text": "Chị ơi đừng nạp tiền nha, việc thật không bắt nạp trước đâu"}).json()
    assert r["source"] == "script" and set(r["gained"]) == {"nap", "dauhieu"} and r["score"] == 2
    assert r["end"] is False and r["line"]["text"] != ""
    r = client.post("/api/roleplay/turn", json={"sessionId": sid, "text": "Chị tra tên công ty rồi hỏi người nhà trước đã"}).json()
    assert "xacminh" in r["gained"] and r["score"] == 3
    assert r["end"] is True  # đủ 3 ý thì chị Lan cảm ơn và kết thúc
    f = client.post("/api/roleplay/finish", json={"sessionId": sid}).json()
    assert f["score"] == 3 and f["summary"] == "Bạn khuyên chị Lan được ba trên bốn ý. Lần sau nhớ rủ chị báo cáo nha."


def test_doc_day_so_thi_dung_vai(client):
    sid = client.post("/api/roleplay/start").json()["sessionId"]
    r = client.post("/api/roleplay/turn", json={"sessionId": sid, "text": "mã của em là 482 913 nè chị"}).json()
    assert r["end"] is True and r["line"]["speaker"] == "benai" and "trò chơi" in r["line"]["text"]
    assert "482" not in r["heard"]


def test_ai_dong_vai_va_cham(client, monkeypatch):
    async def fake(parts, schema, system=None, timeout=None):
        assert "chị Lan" in system and "Lời em vừa nói" in parts[0]["text"]
        return {"keys": {"nap": False, "dauhieu": False, "xacminh": False, "baocao": True}, "reply": "Ừ, chị báo cáo liền nha em.", "end": False}

    async def no_tts(text):
        return b"RIFF....WAVE"

    monkeypatch.setattr(ai, "available", lambda: True)
    monkeypatch.setattr(ai, "generate_json", fake)
    monkeypatch.setattr(roleplay, "tts", no_tts)
    sid = client.post("/api/roleplay/start").json()["sessionId"]
    r = client.post("/api/roleplay/turn", json={"sessionId": sid, "text": "Chị nhớ cảnh giác nha"}).json()
    assert r["source"] == "ai" and r["gained"] == ["baocao"]
    assert r["line"]["text"] == "Ừ, chị báo cáo liền nha em."
    assert r["line"]["audio"].startswith("data:audio/wav;base64,")


def test_chua_co_ai_thi_khong_nghe_tep_tieng(client):
    sid = client.post("/api/roleplay/start").json()["sessionId"]
    r = client.post("/api/roleplay/turn", data={"sessionId": sid}, files={"audio": ("noi.webm", b"xx", "audio/webm")})
    assert r.status_code == 400 and "Gõ chữ" in r.json()["detail"]


def test_wav_hop_le():
    wav = roleplay.pcm_to_wav(b"\x00\x00" * 240, 24000)
    assert wav[:4] == b"RIFF" and wav[8:12] == b"WAVE" and len(wav) == 44 + 480


def test_trang_goi_video_co_coop_coep(client):
    r = client.get("/prototype/video-call.html")
    assert r.status_code == 200
    assert r.headers["cross-origin-opener-policy"] == "same-origin"
    assert r.headers["cross-origin-embedder-policy"] == "require-corp"
