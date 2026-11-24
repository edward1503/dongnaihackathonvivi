"""Bộ dựng kịch bản quay thao tác thật: mỗi bước là một đoạn quay, mỗi câu thoại là một mốc (beat) trong đoạn.

Câu thứ k của bước bắt đầu đọc thì Remotion phát đoạn quay từ mốc k, nên cú bấm rơi đúng lúc giọng nhắc tới.
Ra: <tên>.plan.json (cho capture/ghi.mjs) và <tên>.buoc.json (chương, bước, câu thoại).
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
READY = "typeof cur !== 'undefined' && !!cur && !pending"


def q(x, **kw):
    if isinstance(x, dict):
        return {**x, **kw}
    return {"text": x, **kw}


def css(sel, **kw):
    return {"css": sel, **kw}


# Thao tác (mỗi hàm trả một bước của ghi.mjs)
def click(x, settle=900, **kw):
    zoom = kw.pop("zoom", None)
    d = {"click": q(x, **kw), "settle": settle}
    if zoom is not None:
        d["zoom"] = zoom
    return d


def move(x, settle=300, **kw):
    return {"move": q(x, **kw), "settle": settle}


def typ(x, text, clear=False, settle=500, **kw):
    return {"type": q(x, **kw), "text": text, "clear": clear, "settle": settle}


def select(x, value, settle=700, **kw):
    return {"select": q(x, **kw), "value": value, "settle": settle}


def scroll(x=None, by=None, dur=900, block=None, **kw):
    t = {"by": by} if by is not None else q(x, **kw)
    if block:
        t["block"] = block
    return {"scroll": t, "dur": dur}


def look(x, hold=2.5, zoom=None, **kw):
    """Camera nhìn vào một vùng. Không chỉ định up thì lấy khối bao đủ lớn (box). Có nhịp dừng để mắt kịp nhìn."""
    target = q(x, **kw)
    if "up" not in target:
        target["box"] = True
    d = {"focus": target, "hold": hold}
    if zoom is not None:
        d["zoom"] = zoom
    return [d, {"wait": 900}]


def wait(ms):
    return {"wait": ms}


def key(k, settle=500):
    return {"key": k, "settle": settle}


def back(settle=1400):
    return {"back": True, "settle": settle}


def goto(path, settle=600):
    return [{"goto": path, "settle": 400}, {"waitFor": READY, "settle": settle}]


def js(expr, settle=300):
    return {"eval": expr, "settle": settle}


def nav(label, settle=1300):
    """Bấm mục ở thanh bên trái."""
    return [{"closeDialog": True}, click({"text": label, "within": "li"}, settle=settle)]


class Video:
    def __init__(self, name, title, base="http://127.0.0.1:8137"):
        self.name, self.title, self.base = name, title, base
        self.plan = [*goto("/prototype/index.html", settle=1200)]
        self.chapters, self.steps = [], []

    def setup(self, *actions):
        """Thao tác chuẩn bị, chạy ngoài đoạn quay (không lên hình)."""
        for a in actions:
            self.plan.extend(a if isinstance(a, list) else [a])

    def chapter(self, title, learn):
        self.chapters.append({"title": title, "learn": learn})
        self.steps.append({"id": f"chuong-{len(self.chapters)}", "kind": "chapter", "chapter": len(self.chapters), "title": title})

    def card(self, id, kind, say):
        self.steps.append({"id": id, "kind": kind, "say": say, "chapter": len(self.chapters), "title": self.title})

    def step(self, id, title, beats, setup=()):
        """beats: [(câu thoại, [thao tác...]), ...]. Thao tác của câu k chạy từ mốc k."""
        for a in setup:
            self.plan.extend(a if isinstance(a, list) else [a])
        self.plan.append({"seg": id})
        for n, (say, acts) in enumerate(beats):
            if n:
                self.plan.append({"beat": n})
            for a in acts:
                self.plan.extend(a if isinstance(a, list) else [a])
        self.plan.append({"wait": 700})
        self.plan.append({"end": True})
        self.steps.append({"id": id, "kind": "app", "chapter": len(self.chapters), "title": title,
                           "say": [say for say, _ in beats]})

    def write(self):
        out = HERE / self.name
        out.mkdir(exist_ok=True)
        plan = {"base": self.base, "viewport": [1440, 810], "scale": 2, "steps": self.plan}
        (out / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        data = {"name": self.name, "title": self.title, "chapters": self.chapters, "steps": self.steps}
        (out / "buoc.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        n = sum(1 for s in self.steps if s["kind"] == "app")
        chars = sum(len(" ".join(s["say"])) if isinstance(s.get("say"), list) else len(s.get("say") or "") for s in self.steps)
        print(f"{self.name}: {len(self.chapters)} chương, {n} đoạn quay, {chars} ký tự lời")


def tag(name, js_find, settle=100):
    """Gắn data-quay=<name> cho phần tử do biểu thức JS tìm (khi chữ hiển thị không đủ để chỉ đúng chỗ)."""
    return {"eval": f"(() => {{ const el = ({js_find}); if (!el) throw Error('Không thấy phần tử cho {name}'); el.setAttribute('data-quay', '{name}'); return true }})()", "settle": settle}


def at(name, **kw):
    return {"css": f"[data-quay='{name}']", **kw}


# ---------- Lá chắn số: màn nằm trong iframe của trang vỏ ----------
def at_screen(name):
    return f"typeof cur !== 'undefined' && !!cur && !pending && cur.name === '{name}'"


def hs(t, **kw):
    """Nút bấm thật trong màn (phần tử .hs trong iframe, _rule.t là chữ trên nút)."""
    return {"hs": t, **kw}


def inframe(sel, **kw):
    return {"css": sel, "frame": True, **kw}


def top(sel, text=None, **kw):
    d = {"css": sel, "top": True, **kw}
    if text:
        d["text_has"] = text
    return d


def arrive(name, settle=900, timeout=12000):
    return {"waitFor": at_screen(name), "settle": settle, "timeout": timeout}


def tap(t, to=None, settle=900, zoom=None, **kw):
    """Bấm nút trong màn rồi chờ màn đích hiện xong."""
    out = [click(hs(t, **kw), settle=250 if to else settle, zoom=zoom)]
    if to:
        out.append(arrive(to, settle))
    return out


def sim(t, to, settle=900):
    """Bấm nút 'Mô phỏng sự kiện' ở cột phải của trang vỏ."""
    return [click(top("#sims button", t), settle=250), arrive(to, settle)]


def persona(t, to, settle=900):
    return [click(top("#personas button", t), settle=250), arrive(to, settle)]


def phone(hold=2.5, zoom=None):
    """Camera nhìn cả chiếc máy (hoặc khung web) đang hiện."""
    d = {"focus": {"css": ".device:last-of-type .phone-shell, .device:last-of-type .web-shell", "top": True}, "hold": hold}
    if zoom is not None:
        d["zoom"] = zoom
    return [d, {"wait": 900}]
