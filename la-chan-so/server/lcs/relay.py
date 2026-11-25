"""S5: chuyển tiếp sự kiện giữa ba máy (bà Hoa, Minh, Khoa).

Phòng giữ trong bộ nhớ; mỗi phòng nhớ 50 sự kiện gần nhất để máy vào lại không mất tin.
Hai đường nhận: WebSocket /ws, hoặc hỏi định kỳ GET /api/events. Hai đường trả cùng một dạng.
"""
import itertools
import re
from collections import deque

from fastapi import WebSocket

from . import config

ALLOWED_TYPES = {
    "alert.created", "alert.timeline", "alert.call",
    "ask.sent", "ask.seen", "ask.reply",
    "report.created", "report.updated",
    "demo.reset",
}
ROOM_RE = re.compile(r"[a-z0-9][a-z0-9-]{0,39}")
DEFAULT_ROOMS = ("gia-dinh-hoa", "tnv-tran-bien")


class RelayError(ValueError):
    pass


class Relay:
    def __init__(self, keep: int = 50):
        self.keep = keep
        self.seq = itertools.count(1)  # không đặt lại khi reset, để máy đang mở không bỏ sót sự kiện mới
        self.rooms: dict[str, deque] = {}
        self.sockets: dict[str, set[WebSocket]] = {}
        self.asks: dict[str, str] = {}  # askId -> phòng

    @staticmethod
    def check_room(room: str) -> str:
        if not ROOM_RE.fullmatch(room or ""):
            raise RelayError("Tên phòng không hợp lệ")
        return room

    def history(self, room: str, since: int = 0) -> list[dict]:
        return [e for e in self.rooms.get(room, ()) if e["id"] > since]

    async def publish(self, room: str, type_: str, data: dict | None = None, sender: str = "server") -> dict:
        self.check_room(room)
        if type_ not in ALLOWED_TYPES:
            raise RelayError(f"Loại sự kiện không hợp lệ: {type_}")
        ev = {
            "id": next(self.seq),
            "type": type_,
            "room": room,
            "at": config.now().isoformat(timespec="seconds"),
            "from": sender,
            "data": data or {},
        }
        self.rooms.setdefault(room, deque(maxlen=self.keep)).append(ev)
        await self._send(room, ev)
        return ev

    async def _send(self, room: str, ev: dict) -> None:
        dead = []
        for ws in list(self.sockets.get(room, ())):
            try:
                await ws.send_json(ev)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.sockets.get(room, set()).discard(ws)

    def join(self, room: str, ws: WebSocket) -> None:
        self.sockets.setdefault(room, set()).add(ws)

    def leave(self, room: str, ws: WebSocket) -> None:
        self.sockets.get(room, set()).discard(ws)

    async def reset(self) -> None:
        """Báo mọi máy đang mở rằng demo bắt đầu lại, rồi xóa lịch sử."""
        rooms = set(self.rooms) | set(self.sockets) | set(DEFAULT_ROOMS)
        self.rooms.clear()
        self.asks.clear()
        for room in rooms:
            # Lưu lại sự kiện reset để máy đang hỏi định kỳ cũng nhận được
            await self.publish(room, "demo.reset", {}, "server")
