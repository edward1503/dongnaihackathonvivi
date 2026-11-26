#!/usr/bin/env python3
"""Gắn cờ cộng đồng cho số thử trên máy chủ demo, bằng đúng luồng thật: nhiều máy đăng ký, ký biên nhận cuộc gọi đến, gửi báo cáo,
rồi đội tình nguyện bỏ phiếu. Dùng để xem một số quen (vd. số của bạn trong danh bạ) hiện ra thế nào ở từng mức.

    python3 tools/flag_test_number.py <case> <tệp số>      # tệp: mỗi dòng một số điện thoại
    LCS_BASE=https://... python3 tools/flag_test_number.py danger so.txt

case:
  danger      10 máy báo, Khoa và Lan Anh xác nhận  -> Nguy hiểm
  suspicious  5 máy báo, Khoa xác nhận              -> Nghi ngờ
  pending     5 máy báo, chưa ai duyệt              -> Chưa rõ (có hồ sơ chờ đội xét)
  appeal      như danger, rồi chủ số khiếu nại đã xác minh -> tạm hạ xuống Nghi ngờ, "Đang xét báo nhầm"
  reset       đặt lại toàn bộ dữ liệu mẫu (xóa mọi cờ đã gắn)

Không in số điện thoại (chỉ dạng che), không in khóa máy hay mã phiên. Trong app, đặt các số này vào ô "Số thử" và bật
chế độ trình diễn: số thử không bị coi là số quen, nên thẻ cảnh báo vẫn hiện dù số có trong danh bạ.
"""
import hashlib
import hmac
import json
import os
import random
import secrets
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("LCS_BASE", "https://supplychain-system-product-name.tailb64d44.ts.net:10000").rstrip("/")
VN = timezone(timedelta(hours=7))
STORY = "Người gọi xưng cán bộ công an, nói tài khoản liên quan vụ án, giục chuyển tiền vào tài khoản an toàn."
TEAM = {"Khoa": "246810", "Lan Anh": "135790"}
PLAN = {"danger": (10, ["Khoa", "Lan Anh"]), "suspicious": (5, ["Khoa"]), "pending": (5, []), "appeal": (10, ["Khoa", "Lan Anh"])}


def call(method, path, body=None, headers=None):
    req = urllib.request.Request(BASE + path, json.dumps(body).encode() if body is not None else None,
                                 {"Content-Type": "application/json", **(headers or {})}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None


def norm(number):
    d = "".join(ch for ch in number if ch.isdigit())
    return "0" + d[2:] if d.startswith("84") and len(d) >= 11 else d


def masked(number):
    return f"{number[:3]}xxxx{number[-3:]}"


def report(number, index):
    """One device that received a call from `number`, signs the receipt and reports it (W3)."""
    s, dev = call("POST", "/api/devices")
    device, secret = dev["deviceId"], dev["deviceSecret"]
    event = secrets.token_hex(8)
    at = (datetime.now(VN) - timedelta(hours=6 + index * 9, minutes=random.randint(0, 50))).replace(microsecond=0).isoformat()
    duration = random.randint(45, 240)
    message = "|".join((event, device, "call_log", "incoming", number, at, str(duration)))
    signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    body = {"kind": "phone", "target": number, "eventId": event, "relation": "self", "receipt": signature,
            "evidence": {"type": "call_log", "at": at, "durationSec": duration}, "source": "android", "story": STORY}
    s, j = call("POST", "/api/reports", body, {"X-LCS-Device": device})
    if s != 200:
        sys.exit(f"báo cáo lỗi {s}: {j}")


def team_session(name):
    s, dev = call("POST", "/api/devices")
    head = {"X-LCS-Device": dev["deviceId"]}
    s, j = call("POST", "/api/team/login", {"code": TEAM[name]}, head)
    if s != 200:
        sys.exit(f"{name} đăng nhập lỗi {s}")
    return {**head, "X-LCS-Team": j["token"]}


def vote(number, name, head):
    s, j = call("GET", "/api/cases?status=open&limit=500", headers=head)
    case = next((c for c in j.get("items", []) if c.get("key") == number), None)
    if not case:
        return print(f"   {name}: không thấy hồ sơ đang mở")
    s, j = call("POST", f"/api/cases/{case['key']}/vote", {"reviewId": case["reviewId"], "decision": "confirm",
                                                           "note": "Cùng thủ đoạn giục chuyển tiền"}, head)
    print(f"   {name} xác nhận: {s}")


def appeal(number):
    s, dev = call("POST", "/api/devices")
    head = {"X-LCS-Device": dev["deviceId"]}
    s, a = call("POST", "/api/appeals", {"target": number, "kind": "phone", "contact": number, "text": "Số của tôi bị báo nhầm"}, head)
    if s not in (200, 201) or not a.get("demoCode"):
        return print(f"   khiếu nại lỗi {s}: {a}")
    s, v = call("POST", f"/api/appeals/{a['id']}/verify", {"code": a["demoCode"]}, head)
    print(f"   khiếu nại đã xác minh: {s}")


def level(number):
    s, j = call("GET", f"/api/lookup/phone/{number}")
    return f"{j.get('level')} · {j.get('count')} máy · appealOpen={j.get('appealOpen')} · {j.get('headline')}"


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in (*PLAN, "reset"):
        sys.exit(__doc__)
    case = sys.argv[1]
    if case == "reset":
        s, _ = call("POST", "/api/demo/reset")
        return print(f"đặt lại dữ liệu mẫu: {s}")
    numbers = [norm(x) for x in open(sys.argv[2], encoding="utf-8").read().split() if norm(x)]
    devices, voters = PLAN[case]
    sessions = {name: team_session(name) for name in voters}
    for number in numbers:
        print(f"{masked(number)}: {devices} máy báo")
        for i in range(devices):
            report(number, i)
        for name in voters:
            vote(number, name, sessions[name])
        if case == "appeal":
            appeal(number)
        print(f"   -> {level(number)}")


if __name__ == "__main__":
    main()
