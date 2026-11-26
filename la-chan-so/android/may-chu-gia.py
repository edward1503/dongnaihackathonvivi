#!/usr/bin/env python3
"""Máy chủ giả để thử phần Android khi không chạy máy chủ thật của đội (server/, FastAPI).

    python3 may-chu-gia.py [cổng, mặc định 8787]

Nói đúng hợp đồng chung của đội (xem server/README.md và android/HOP-DONG-DU-LIEU.md). Phần phân tích trả kết quả cố định,
không gọi AI, không lưu gì ngoài bộ nhớ. Hai đường /api/roleplay/intent và /api/roleplay/speak của cuộc gọi video gọi AI thật.
Trong app: nhập http://<IP máy tính>:8787 vào ô "Máy chủ của đội" rồi bấm Lưu.
"""
import json
import os
import pathlib
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import secrets
from urllib.parse import parse_qs, urlparse

# Khóa AI của đội nằm ở la-chan-so/.env (git bỏ qua). Nạp vào tiến trình này, không in ra, không gửi cho app.
_env = pathlib.Path(__file__).resolve().parent.parent / ".env"
if _env.exists():
    for _d in _env.read_text(encoding="utf-8").splitlines():
        if "=" in _d and not _d.lstrip().startswith("#"):
            _k, _v = _d.split("=", 1)
            if _v.strip() and not os.environ.get(_k.strip()):
                os.environ[_k.strip()] = _v.strip()
import hieu_y  # noqa: E402  (đọc khóa từ biến môi trường vừa nạp)
import doc_giong  # noqa: E402

def ket_qua(level, kind="phone", **them):
    """Một AnalysisResult tối thiểu, đủ các trường app đọc (Api.kt)."""
    kq = {"id": "ar_%d" % int(time.time() * 1000), "kind": kind, "display": "", "level": level, "reason": None, "scamType": None,
          "scamLabel": None, "headline": "", "note": None, "why": [], "todo": [], "signs": [], "maskedText": None,
          "reports": {"count": 0, "last7d": 0, "lastAt": None, "lastWhen": None, "verified": False}, "source": "community", "confidence": 0.0}
    kq.update(them)
    return kq


SO_BI_BAO = {
    "0912345678": ("gia_danh_cong_an", "Giả danh công an", 14, "hôm qua"),
    "02899991234": ("gia_dien_luc", "Giả nhân viên điện lực", 7, "hôm qua"),
}
TONG_DAI = {"1900555588", "113", "1900545454"}
CANH_BAO = []   # các cảnh báo đã gửi cho người thân, để máy Minh hoặc trình duyệt xem lại


class XuLy(BaseHTTPRequestHandler):
    def _tra(self, ma, than):
        du_lieu = json.dumps(than, ensure_ascii=False).encode()
        self.send_response(ma)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(du_lieu)))
        self.end_headers()
        self.wfile.write(du_lieu)

    def _than(self):
        if self.headers.get("Transfer-Encoding", "").lower() == "chunked":
            du = b""
            while True:
                dong = self.rfile.readline().strip()
                n = int(dong or b"0", 16)
                if n == 0:
                    self.rfile.readline()
                    return du
                du += self.rfile.read(n)
                self.rfile.readline()
        return self.rfile.read(int(self.headers.get("Content-Length", 0)))

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path.startswith("/api/lookup/phone/"):
            so = "".join(c for c in u.path.rsplit("/", 1)[1] if c.isdigit())
            if so in TONG_DAI:
                return self._tra(200, ket_qua("safe", source="directory", headline="Số này khớp danh bạ tổng đài."))
            if so in SO_BI_BAO:
                ma, ten, n, khi = SO_BI_BAO[so]
                return self._tra(200, ket_qua("danger", scamType=ma, scamLabel=ten, headline=f"Cuộc gọi hiển thị số này đã bị báo cáo từ {n} máy.",
                                              reports={"count": n, "last7d": n, "lastAt": None, "lastWhen": khi, "verified": True}))
            return self._tra(200, ket_qua("unknown", headline="Chưa ai báo cáo số này.", note="Điều đó không có nghĩa là an toàn."))
        if u.path == "/api/alerts":
            return self._tra(200, CANH_BAO)
        self._tra(404, {"detail": "không có đường dẫn này"})

    def do_POST(self):
        u = urlparse(self.path)
        than = self._than()
        if u.path == "/api/devices":
            return self._tra(201, {"deviceId": secrets.token_hex(8), "deviceSecret": secrets.token_hex(32)})
        if u.path == "/api/alerts":
            j = json.loads(than or b"{}")
            j["id"] = "al_%d" % int(time.time() * 1000)
            CANH_BAO.append(j)
            return self._tra(201, j)
        if u.path == "/api/analyze/message":
            return self._tra(200, ket_qua(
                "danger", "message", scamType="viec_nhe_luong_cao", scamLabel="Lừa đảo tuyển cộng tác viên", source="heuristic",
                headline="Đừng nạp tiền. Đừng mở đường dẫn trong tin.", todo=["Không trả lời, không chuyển tiền.", "Không bấm đường dẫn trong tin."],
                signs=[{"text": "Hứa thu nhập cao bất thường", "quotes": []}, {"text": "Đòi nạp tiền trước khi làm", "quotes": []},
                       {"text": "Giục đăng ký gấp, dùng đường dẫn rút gọn", "quotes": []}]))
        if u.path == "/api/analyze/call":
            # multipart: trường audio (tệp ghi âm) hoặc transcript (lời kể đã che số). Máy chủ giả chỉ nhìn xem có trường nào.
            co_tep = b'name="audio"' in than
            print(f"   nhận {'bản ghi âm' if co_tep else 'lời kể'} {len(than)} byte")
            chep = ["Người gọi: Tôi là cán bộ điều tra. Bà có liên quan đến một vụ án rửa tiền.",
                    "Người gọi: Bà phải chuyển tiền vào tài khoản tạm giữ trong 30 phút.",
                    "Người gọi: Việc này không được nói với ai, kể cả con cái."]
            return self._tra(200, ket_qua(
                "danger", "call", scamType="gia_danh_cong_an", scamLabel="Giả danh cơ quan chức năng", source="heuristic",
                headline="Người gọi đòi chuyển tiền và dặn giữ bí mật.", todo=["Không chuyển tiền, không đọc mã xác thực.", "Gọi cho người thân trước khi làm gì."],
                why=["Bản ghi có câu đòi chuyển tiền"] if co_tep else [],
                signs=[{"text": "Giả danh cơ quan chức năng", "quotes": []}, {"text": "Đòi chuyển tiền", "quotes": []}, {"text": "Bắt giữ bí mật", "quotes": []}],
                maskedText="\n".join(chep) if co_tep else None))
        if u.path == "/api/roleplay/intent":
            # Hiểu ý một lượt của người học trong cuộc gọi video (đây là đường THẬT, gọi mô hình của đội). Lời đã được app lọc số riêng tư.
            j = json.loads(than or b"{}")
            if j.get("scene", "lan-2") != "lan-2":   # chỉ cảnh của chị Lan có bộ ý định cho AI phân loại
                return self._tra(422, {"detail": "cảnh này chưa có bộ ý định"})
            t0 = time.time()
            kq = hieu_y.hieu(str(j.get("text", ""))[:600], str(j.get("lastLine", "mo-dau")), [str(x) for x in j.get("scored", [])][:4])
            print(f"   hiểu ý: {'không gọi được AI' if kq is None else str(kq['yDinh']) + ' ' + str(kq['y'])} ({time.time() - t0:.1f}s)")
            if kq is None:
                return self._tra(503, {"detail": "chưa có khóa AI hoặc AI không trả lời"})
            return self._tra(200, {"ideas": kq["y"], "intent": kq["yDinh"], "wantsStop": kq["xinDung"], "offScript": bool(kq.get("ngoai"))})
        if u.path == "/api/roleplay/speak":
            # Đọc một câu của nhân vật bằng giọng Gemini và lọc rẹt bằng ffmpeg (đường THẬT). Dùng cho cuộc gọi video trực tiếp.
            j = json.loads(than or b"{}")
            t0 = time.time()
            nv = doc_giong.nhan_vat(j.get("character", "lan"))   # mã nhân vật: lan, minh, tu; không có thì là chị Lan
            kq = doc_giong.doc(str(j.get("text", ""))[:400], giong=nv[0], dan=nv[1]) if nv else None   # mã nhân vật tra không ra: không đọc bằng giọng khác
            print(f"   đọc giọng: {'không đọc được' if kq is None else str(kq['giay']) + ' giây tiếng'} ({time.time() - t0:.1f}s)")
            if kq is None:
                return self._tra(503, {"detail": "chưa có khóa giọng đọc hoặc không đọc được"})
            return self._tra(200, {"text": kq["chu"], "audio": kq["pcm"], "sampleRate": kq["tanSo"], "seconds": kq["giay"]})
        if u.path == "/api/reports":
            return self._tra(501, {"detail": "Máy chủ giả chỉ dùng để thử màn hình. Bà chọn máy chủ của đội để gửi báo cáo nha."})
        self._tra(404, {"detail": "không có đường dẫn này"})

    def log_message(self, mau, *a):
        duong = urlparse(self.path).path
        if duong.startswith("/api/lookup/phone/"):
            duong = "/api/lookup/phone/•••"   # không in số điện thoại nằm trong đường dẫn
        print(time.strftime("%H:%M:%S"), self.command, duong)


if __name__ == "__main__":
    cong = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print(f"Máy chủ giả Lá chắn số: http://0.0.0.0:{cong}  (Ctrl+C để tắt)")
    ThreadingHTTPServer(("0.0.0.0", cong), XuLy).serve_forever()
