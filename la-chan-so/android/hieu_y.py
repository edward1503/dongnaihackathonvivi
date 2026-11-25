"""Hiểu ý một lượt của người học trong cuộc gọi video với chị Lan, bằng mô hình ngôn ngữ (OpenAI).
Dùng bởi may-chu-gia.py (đường /api/roleplay/intent). Khóa lấy từ biến môi trường OPENAI_API_KEY (tệp la-chan-so/.env), không bao giờ nằm trong app.
Mô hình chỉ PHÂN LOẠI: trả về ý định (một trong các mã của prototype/loi-chi-lan.json) và các ý được chấm kèm bằng chứng nguyên văn.
Câu chị Lan nói vẫn là câu thu sẵn do app chọn; mô hình không viết lời cho chị."""
import json, os, pathlib, urllib.request

GOC = pathlib.Path(__file__).resolve().parent.parent
BO = json.loads((GOC / "prototype" / "loi-chi-lan.json").read_text(encoding="utf-8"))
Y_DINH = [(y["id"], y["mo_ta"]) for y in BO["y_dinh"] if not y["id"].startswith(("im-lan", "nghe-lo"))]
CHAM = {y["id"]: y.get("cham") or [] for y in BO["y_dinh"]}          # ý định "khuyên đúng" nào thì tương ứng ý được chấm nào
SAI = {"bao-cu-nap", "bao-thu-it", "bao-rut-lien", "khuyen-lieu-khac", "loi-trai-nhau", "tuy-chi", "khong-biet"}
LOI = {x["id"]: x["chu"] for x in BO["loi"]}
NHAN = ["nap", "dauhieu", "xacminh", "baocao"]

# Lời nhắc dùng chung với app Android (GoiVideo.kt đọc cùng tệp này từ assets), để hai bên luôn chấm theo một luật.
HE_THONG = (GOC / "prototype" / "hieu-y-loi-nhac.txt").read_text(encoding="utf-8").strip()

LUOC_DO = {"name": "hieu_y", "strict": True, "schema": {"type": "object", "additionalProperties": False,
    "required": ["y_dinh", "y_dung", "can_hoi_lai", "xin_dung", "ngoai_kich_ban"],
    "properties": {"y_dinh": {"type": "string"},
        "y_dung": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["nhan", "bang_chung"],
            "properties": {"nhan": {"type": "string", "enum": NHAN}, "bang_chung": {"type": "string"}}}},
        "can_hoi_lai": {"type": "boolean"}, "xin_dung": {"type": "boolean"}, "ngoai_kich_ban": {"type": "boolean"}}}}


def co_khoa():
    return bool(os.environ.get("OPENAI_API_KEY"))


def hieu(loi, cau_hoi="mo-dau", da_cham=(), cho=6.0):
    """Trả về {"y": [...], "yDinh": str|None, "xinDung": bool} cùng dạng hàm hieu() trong prototype/hoi-thoai.js, hoặc None nếu không gọi được."""
    if not co_khoa():
        return None
    ds = "\n".join(f"- {i}: {m}" for i, m in Y_DINH)
    nguoi = f"Câu chị Lan vừa hỏi: \"{LOI.get(cau_hoi, LOI['mo-dau'])}\"\nCác ý đã chấm: {', '.join(da_cham) or 'chưa có'}\nDanh sách ý định hợp lệ:\n{ds}\n\nLời học sinh: \"{loi}\""
    than = {"model": os.environ.get("OPENAI_MODEL") or "gpt-6-luna", "messages": [{"role": "system", "content": HE_THONG}, {"role": "user", "content": nguoi}],
            "response_format": {"type": "json_schema", "json_schema": LUOC_DO}}
    base = (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
    try:
        r = json.loads(urllib.request.urlopen(urllib.request.Request(base + "/chat/completions", data=json.dumps(than).encode(),
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]}), timeout=cho).read())
        j = json.loads(r["choices"][0]["message"]["content"])
    except Exception as e:   # mất mạng, quá giờ, mô hình trả sai dạng: app tự dùng luật trên máy
        print("   hiểu ý bằng AI lỗi:", type(e).__name__)
        return None
    hop_le = {i for i, _ in Y_DINH}
    y_dinh = j["y_dinh"] if j["y_dinh"] in hop_le else None
    if j["can_hoi_lai"]:
        return {"y": [], "yDinh": "loi-trai-nhau", "xinDung": bool(j["xin_dung"])}
    if y_dinh in SAI:   # khuyên sai hoặc nửa vời: lượt này không được ý nào, dù mô hình có ghi nhãn
        return {"y": [], "yDinh": y_dinh, "xinDung": bool(j["xin_dung"])}
    # nhận ý có bằng chứng thật sự nằm trong lời học sinh, và ý đi kèm ý định "khuyên đúng" mà mô hình đã chọn
    thuong = loi.lower()
    y = [x["nhan"] for x in j["y_dung"] if x["bang_chung"].strip() and x["bang_chung"].strip().lower().strip(" .,!?\"'") in thuong]
    y += CHAM.get(y_dinh, [])
    y = list(dict.fromkeys(y))
    # ngoai: không câu thu sẵn nào hợp và lượt này không được ý nào; app sẽ để AI viết một lượt đáp riêng
    return {"y": y, "yDinh": y_dinh, "xinDung": bool(j["xin_dung"]), "ngoai": bool(j.get("ngoai_kich_ban")) and not y}
