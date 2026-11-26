import base64
import json
import re
import sys
from unittest.mock import AsyncMock

import pytest

import lcs

from lcs import ai, giong, hieu_y, live_call


URL = "/api/roleplay/live"
LINE = "Con sẽ cúp máy ngay."
PCM = b"\x00\x01" * 12000


def request_body(text="Mẹ bảo cúp máy ngay.", scored=()):
    return {"scene": "minh-1", "history": [{"ai": "nv", "chu": "Hỏi công an chưa?"},
                                           {"ai": "nh", "chu": text}], "scored": list(scored)}


def idea(label, quote):
    return {"nhan": label, "bang_chung": quote}


@pytest.fixture
def providers(monkeypatch, tmp_path):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.delenv("LCS_TOKEN", raising=False)
    monkeypatch.setattr(live_call, "CACHE", tmp_path)
    model = AsyncMock(return_value={"loi_nhan_vat": LINE, "y_dung": [], "ket_thuc": True, "khuyen_sai": False})
    monkeypatch.setattr(hieu_y, "ask_openai", model)
    monkeypatch.setattr(giong, "tts_pcm", AsyncMock(return_value=(PCM, 24000)))
    monkeypatch.setattr(giong, "clean", lambda pcm, rate: (pcm, rate))
    monkeypatch.delattr(lcs, "mouth", raising=False)
    monkeypatch.delitem(sys.modules, "lcs.mouth", raising=False)
    monkeypatch.setitem(sys.modules, "onnxruntime", None)
    return model


def test_scene_validation(client, providers, monkeypatch, tmp_path):
    (tmp_path / "canh").mkdir()
    (tmp_path / "canh/quiet.json").write_text("{}")
    monkeypatch.setattr(live_call, "PROTOTYPE", tmp_path)
    for scene in ("unknown", "quiet", "../nhan-vat"):
        assert client.post(URL, json={**request_body(), "scene": scene}).status_code == 422
    providers.assert_not_awaited()


@pytest.mark.parametrize("history", [[], [{"ai": "nv", "chu": "Hello"}], [{"ai": "nh", "chu": "Hello"}] * 15])
def test_history_validation(client, providers, history):
    assert client.post(URL, json={**request_body(), "history": history}).status_code == 422
    providers.assert_not_awaited()


def test_no_key(client, providers, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY")
    assert client.post(URL, json=request_body()).status_code == 503
    providers.assert_not_awaited()


def test_result_prompt_schema_and_cache(client, providers, monkeypatch):
    body = request_body("Mã là 1234")
    mouth = {"lip": {"fps": 30, "params": [[0]*32], "bg": [1], "mieng": {}}, "mp4": "test"}
    monkeypatch.setattr(live_call, "optional_mouth", lambda *args: mouth)
    response = client.post(URL, json=body)
    assert response.status_code == 200
    result = response.json()
    assert re.fullmatch("[a-f0-9]{16}", result["id"])
    assert set(result["timings"]) == {"llm_ms", "tts_ms", "mouth_ms", "total_ms"}
    assert all(value >= 0 for value in result["timings"].values())
    assert result == {"id": result["id"], "chu": LINE, "y": [], "sai": False, "het": True,
                      "pcm": base64.b64encode(PCM).decode(), "tanSo": 24000, "giay": 0.5,
                      "mouth": mouth, "timings": result["timings"]}
    system, prompt, timeout, schema = providers.await_args.args
    assert system == (live_call.PROTOTYPE / "canh/minh-1.song.txt").read_text().strip()
    assert prompt == "Các ý đã chấm: chưa có\nCuộc trò chuyện tới giờ:\nMINH: Hỏi công an chưa?\nMẸ: Mã là •••\n"
    assert schema["strict"] and schema["schema"]["additionalProperties"] is False
    assert schema["schema"]["required"] == ["y_dung", "khuyen_sai", "loi_nhan_vat", "ket_thuc"]
    assert schema["schema"]["properties"]["y_dung"]["items"]["properties"]["nhan"]["enum"] == ["cup", "hoilai"]
    giong.tts_pcm.assert_awaited_once_with(LINE, "Achird", live_call.load_scene("minh-1")["song"]["loi_dan"])
    assert json.loads((live_call.CACHE / (result["id"] + ".json")).read_text()) == result
    assert client.post(URL, json=body).json() == result
    providers.assert_awaited_once()
    giong.tts_pcm.assert_awaited_once()


@pytest.mark.parametrize("name,learner,field,character", [
    ("lan-2", "em", "loi_chi_lan", "lan"),
    ("minh-3", "nh", "loi_nhan_vat", "minh"),
    ("tu-9", "nh", "loi_nhan_vat", "tu"),
])
def test_other_scenes(client, providers, name, learner, field, character):
    providers.return_value[field] = LINE
    body = {"scene": name, "history": [{"ai": learner, "chu": "Cúp máy."}], "scored": []}
    assert client.post(URL, json=body).status_code == 200
    scene = live_call.load_scene(name)
    voice, notes = giong.character(character)
    giong.tts_pcm.assert_awaited_once_with(LINE, voice, scene["song"].get("loi_dan") or notes)
    assert field in providers.await_args.args[-1]["schema"]["required"]


@pytest.mark.parametrize("text,scored,claims,wrong,expected,end", [
    ("Mẹ bảo cúp máy.", [], [idea("cup", " 'CÚP MÁY!' "), idea("hoilai", "hỏi công an")], False, ["cup"], False),
    ("Mẹ bảo cúp máy.", [], [idea("cup", "mẹ")], False, [], False),
    ("Ừ!", [], [idea("cup", "ừ")], False, ["cup"], True),
    ("Cúp máy.", [], [idea("cup", "cúp máy")], True, [], True),
    ("Cúp máy.", ["hoilai"], [idea("hoilai", ""), idea("cup", "sai"), idea("cup", "cúp máy")], False, ["cup"], True),
    ("Cúp máy.", ["cup"], [idea("cup", ""), idea("ngoai", "")], False, [], True),
])
def test_evidence_and_end(client, providers, text, scored, claims, wrong, expected, end):
    providers.return_value.update(y_dung=claims, khuyen_sai=wrong)
    result = client.post(URL, json=request_body(text, scored)).json()
    assert (result["y"], result["sai"], result["het"]) == (expected, wrong, end)


@pytest.mark.parametrize("line", ["Một", "Một hai " * 23, "Có số 4", "Có (chữ)", "Có www", "Có; chữ"])
def test_invalid_line(client, providers, line):
    providers.return_value["loi_nhan_vat"] = line
    assert client.post(URL, json=request_body()).status_code == 503
    giong.tts_pcm.assert_not_awaited()


def test_provider_failures(client, providers):
    providers.side_effect = ai.AIUnavailable("offline")
    assert client.post(URL, json=request_body()).status_code == 503
    providers.side_effect = None
    giong.tts_pcm.return_value = None
    assert client.post(URL, json=request_body()).status_code == 503


@pytest.mark.parametrize("route,body", [("live", request_body()), ("speak", {"text": LINE}), ("intent", {"text": LINE})])
def test_roleplay_token(client, providers, monkeypatch, route, body):
    monkeypatch.setenv("LCS_TOKEN", "expected")
    url = "/api/roleplay/" + route
    for headers in ({}, {"X-LCS-Token": "other"}):
        assert client.post(url, json=body, headers=headers).status_code == 401
    if route == "intent":
        monkeypatch.setattr(hieu_y, "classify", AsyncMock(return_value={}))
    assert client.post(url, json=body, headers={"X-LCS-Token": "expected"}).status_code == 200


def test_missing_onnxruntime(client, providers):
    response = client.post(URL, json=request_body())
    assert response.status_code == 200
    assert response.json()["mouth"] is None
    assert base64.b64decode(response.json()["pcm"]) == PCM


def test_silent_lip_frames():
    pytest.importorskip("onnxruntime")
    from lcs import mouth
    lip = mouth.lip_from_samples(mouth.np.zeros(16000))
    assert len(lip["params"]) == 39 and all(len(row) == 32 for row in lip["params"])
    assert lip["bg"] == [1.0] * 39
