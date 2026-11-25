"""Các đường app Android (Mảng 1, 4) cần ở máy chủ chung: android/HOP-DONG-DU-LIEU.md mục "Còn thiếu"."""
import asyncio
import json
import logging
import math
import shutil
import struct
import subprocess

import pytest

from lcs import ai, audio, giong, hieu_y, main


# ---------- chống gửi trùng cảnh báo ----------

def test_canh_bao_cung_ma_su_kien_khong_bao_trung(client):
    body = {"room": "gia-dinh-hoa", "from": "android", "level": "danger", "phone": "0912345678",
            "callSeconds": 252, "summary": "Người gọi đòi chuyển tiền", "eventId": "call-1732430000"}
    a = client.post("/api/alerts", json=body).json()
    b = client.post("/api/alerts", json=body).json()
    assert a["id"] == b["id"]
    assert sum(1 for x in client.get("/api/alerts").json() if x["id"] == a["id"]) == 1
    evs = [e for e in client.get("/api/events?room=gia-dinh-hoa").json()["events"] if e["type"] == "alert.created"]
    assert len(evs) == 1
    c = client.post("/api/alerts", json={**body, "eventId": "call-khac"}).json()
    assert c["id"] != a["id"]


def test_canh_bao_khong_ma_su_kien_van_nhu_cu(client):
    body = {"level": "danger", "summary": "x"}
    assert client.post("/api/alerts", json=body).json()["id"] != client.post("/api/alerts", json=body).json()["id"]


# ---------- nhật ký truy cập không ghi số ----------

def test_nhat_ky_truy_cap_che_so():
    f = main._HideNumbers()
    rec = logging.LogRecord("uvicorn.access", logging.INFO, "", 0, '%s - "%s %s HTTP/%s" %d',
                            ("1.2.3.4:5", "GET", "/api/lookup/phone/0912345678?x=1", "1.1", 200), None)
    f.filter(rec)
    assert "0912345678" not in rec.getMessage() and "/api/lookup/phone/•••?x=1" in rec.getMessage()
    rec2 = logging.LogRecord("uvicorn.access", logging.INFO, "", 0, '%s - "%s %s HTTP/%s" %d',
                             ("1.2.3.4:5", "GET", "/api/lookup?v=0912345678", "1.1", 200), None)
    f.filter(rec2)
    assert "0912345678" not in rec2.getMessage()


# ---------- mã kiểu lừa đảo và bài học ----------

def test_bang_kieu_lua_dao_co_ma_bai_hoc(client):
    rows = {r["id"]: r for r in client.get("/api/scam-types").json()}
    assert rows["gia_danh_cong_an"]["lesson"] == "gia-danh-co-quan"
    assert rows["duong_dan_gia"]["lesson"] is None
    assert "dau_tu_lai_cao" in rows


def test_ket_qua_tra_so_co_ma_bai_hoc(client):
    r = client.get("/api/lookup/phone/0912345678").json()
    assert r["level"] == "danger" and r["lesson"] == "gia-danh-co-quan"


def test_luat_dau_tu_lai_cao(client):
    r = client.post("/api/analyze/message", json={
        "text": "Chú vào nhóm đầu tư lãi 5% mỗi ngày, cam kết hoàn vốn, nạp trước 2 triệu để kích hoạt."}).json()
    assert r["scamType"] == "dau_tu_lai_cao" and r["lesson"] == "dau-tu-lai-cao"
    assert any("lãi cao" in s["text"] for s in r["signs"])


# ---------- /api/roleplay/intent ----------

@pytest.fixture
def bo_loi(tmp_path, monkeypatch):
    (tmp_path / "prototype").mkdir()
    (tmp_path / "prototype" / "loi-chi-lan.json").write_text(json.dumps({
        "y_dinh": [{"id": "khuyen-dung-nap", "mo_ta": "khuyên đừng nạp", "cham": ["nap"]},
                   {"id": "bao-cu-nap", "mo_ta": "bảo cứ nạp"},
                   {"id": "im-lan-1", "mo_ta": "im lặng"}],
        "loi": [{"id": "mo-dau", "chu": "Em ơi chị nên nạp không?"}, {"id": "hoi-vi-sao", "chu": "Sao em biết?"}],
    }), encoding="utf-8")
    (tmp_path / "prototype" / "hieu-y-loi-nhac.txt").write_text("Phân loại lượt nói.", encoding="utf-8")
    monkeypatch.setattr(hieu_y, "LCS_ROOT", tmp_path)
    hieu_y._bundle.cache_clear()
    yield tmp_path
    hieu_y._bundle.cache_clear()


def test_intent_canh_khac_tra_422(client, bo_loi):
    assert client.post("/api/roleplay/intent", json={"scene": "minh-1", "text": "con cúp máy đi"}).status_code == 422


def test_intent_thieu_bo_loi_tra_503(client, tmp_path, monkeypatch):
    monkeypatch.setattr(hieu_y, "LCS_ROOT", tmp_path)
    hieu_y._bundle.cache_clear()
    try:
        assert client.post("/api/roleplay/intent", json={"text": "đừng nạp"}).status_code == 503
    finally:
        hieu_y._bundle.cache_clear()


def test_intent_khong_co_ai_tra_503(client, bo_loi, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEYS", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.post("/api/roleplay/intent", json={"text": "đừng nạp"}).status_code == 503


def test_intent_chi_nhan_y_co_bang_chung_va_che_so(client, bo_loi, monkeypatch):
    seen = {}

    async def fake(parts, schema, system=None, timeout=None):
        seen["user"], seen["system"] = parts[0]["text"], system
        return {"y_dinh": "khuyen-dung-nap", "can_hoi_lai": False, "xin_dung": False, "ngoai_kich_ban": False,
                "y_dung": [{"nhan": "dauhieu", "bang_chung": "đòi nạp trước"}, {"nhan": "baocao", "bang_chung": "báo công an"}]}

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(ai, "generate_json", fake)
    r = client.post("/api/roleplay/intent", json={
        "scene": "lan-2", "text": "Chị đừng nạp, nó đòi nạp trước là lừa. Số em 0912 345 678.",
        "lastLine": "hoi-vi-sao", "scored": ["nap", "la"]})
    assert r.status_code == 200
    assert r.json() == {"ideas": ["dauhieu", "nap"], "intent": "khuyen-dung-nap", "wantsStop": False, "offScript": False}
    assert "0912" not in seen["user"] and "•••" in seen["user"]
    assert "Sao em biết?" in seen["user"] and "Các ý đã chấm: nap" in seen["user"]
    assert seen["system"] == "Phân loại lượt nói."


def test_intent_khuyen_sai_khong_duoc_y(client, bo_loi, monkeypatch):
    async def fake(parts, schema, system=None, timeout=None):
        return {"y_dinh": "bao-cu-nap", "y_dung": [{"nhan": "nap", "bang_chung": "nạp"}],
                "can_hoi_lai": False, "xin_dung": True, "ngoai_kich_ban": False}

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(ai, "generate_json", fake)
    r = client.post("/api/roleplay/intent", json={"text": "cứ nạp đi chị"}).json()
    assert r["ideas"] == [] and r["intent"] == "bao-cu-nap" and r["wantsStop"] is True


# ---------- /api/roleplay/speak ----------

def _sine(seconds: float, rate: int = 24000) -> bytes:
    n = int(seconds * rate)
    return struct.pack(f"<{n}h", *(int(8000 * math.sin(2 * math.pi * 220 * i / rate)) for i in range(n)))


def test_speak_nhan_vat_la_tra_503(client):
    assert client.post("/api/roleplay/speak", json={"text": "Chào em", "character": "khong-co"}).status_code == 503


def test_speak_khong_khoa_tra_503(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEYS", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.post("/api/roleplay/speak", json={"text": "Chào em", "character": "lan"}).status_code == 503


def test_speak_tra_pcm_da_loc(client, monkeypatch):
    calls = {}

    async def fake(text, voice, notes, timeout=20):
        calls["voice"] = voice
        return _sine(1.2), 24000

    monkeypatch.setattr(giong, "tts_pcm", fake)
    r = client.post("/api/roleplay/speak", json={"text": "Ừ, để chị nghĩ coi em", "character": "lan"})
    assert r.status_code == 200
    j = r.json()
    assert calls["voice"] == "Aoede" and j["sampleRate"] == 24000 and 0.3 < j["seconds"] < 2
    assert j["text"] == "Ừ, để chị nghĩ coi em" and len(j["audio"]) > 1000


def test_speak_bo_tieng_dai_bat_thuong(client, monkeypatch):
    async def fake(text, voice, notes, timeout=20):
        return _sine(9), 24000   # 9 giây cho 2 chữ: máy đọc lẫn lời dặn

    monkeypatch.setattr(giong, "tts_pcm", fake)
    assert client.post("/api/roleplay/speak", json={"text": "Chào em", "character": "lan"}).status_code == 503


def test_cat_nhieu_duoi():
    rate = 24000
    speech, silence = _sine(1.0), b"\0\0" * int(0.3 * rate)
    burst = struct.pack("<480h", *([30000, -30000] * 240))   # 20 ms nhiễu rất to
    out = giong.cut_tail_noise(speech + silence + burst, rate)
    assert len(out) < len(speech + silence + burst) and len(out) >= len(speech)


# ---------- đổi định dạng ghi âm ----------

def test_audio_wav_giu_nguyen():
    data, mime = asyncio.run(audio.prepare(b"RIFF....", "audio/wav"))
    assert data == b"RIFF...." and mime == "audio/wav"


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="máy không có ffmpeg")
def test_audio_m4a_doi_sang_flac(tmp_path):
    src = tmp_path / "ghi-am.m4a"
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=f=440:d=0.5", "-c:a", "aac", str(src)], check=True)
    data, mime = asyncio.run(audio.prepare(src.read_bytes(), "audio/mp4", "ghi-am.m4a"))
    assert mime == "audio/flac" and data[:4] == b"fLaC"


# ---------- điều khiển từ xa (demo.go) ----------

def test_lenh_dieu_khien_khong_phat_lai_khi_da_cu(client, monkeypatch):
    from lcs import relay as relay_mod
    r = client.post("/api/events", json={"type": "demo.go", "room": "gia-dinh-hoa", "data": {"path": "/cuoc-goi"}})
    assert r.status_code == 200
    assert [e["type"] for e in client.get("/api/events?room=gia-dinh-hoa").json()["events"]] == ["demo.go"]
    t = relay_mod.time.monotonic() + 30
    monkeypatch.setattr(relay_mod.time, "monotonic", lambda: t)
    assert client.get("/api/events?room=gia-dinh-hoa").json()["events"] == []


def test_lien_ket_va_ma_qr(client):
    j = client.get("/api/demo/links").json()
    assert j["links"][0]["path"] == "/?mode=simple" and j["base"].startswith("http")
    r = client.get("/api/demo/qr.svg", params={"path": "/?mode=simple"})
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/svg+xml")
    assert client.get("/api/demo/qr.svg", params={"path": "https://lua-dao.top"}).status_code == 400
    assert client.get("/api/demo/qr.svg", params={"path": "//lua-dao.top"}).status_code == 400
