"""S2, S3, S4: phân tích tin nhắn và cuộc gọi.

Luồng: bỏ qua tin có mã OTP -> che số (S4) -> luật dự phòng -> AI (nếu có khóa) -> chặn mức "safe".
Không ghi nội dung tin nhắn, bản chép lời ra nhật ký hay cơ sở dữ liệu.
"""
from . import ai, config
from .audio import prepare as prepare_audio
from .checker import check_target, new_id
from .contract import LEVEL_ORDER, AnalysisResult, ReportSummary, Sign
from .data import DEMO_TRANSCRIPT, SCAM_TYPES
from .masking import has_otp, mask
from .reports import Store
from . import rules
from .text import fmt_phone, nfc


def _max_level(a: str, b: str) -> str:
    return a if LEVEL_ORDER.get(a, 0) >= LEVEL_ORDER.get(b, 0) else b


def _clean_ai(raw: dict, masked: str) -> dict:
    """Kiểm lại JSON của AI: bỏ trích dẫn không có thật, không cho "safe", cắt độ dài."""
    level = raw.get("level") if raw.get("level") in ("danger", "suspicious", "unknown") else "unknown"
    signs = []
    for s in raw.get("signs") or []:
        if not isinstance(s, dict):
            continue
        text = str(s.get("text") or "").strip()[:80]
        quotes = [q for q in (s.get("quotes") or []) if isinstance(q, str) and q.strip() and q in masked][:4]
        if text:
            signs.append({"text": text, "quotes": quotes})
    scam_type = raw.get("scamType") if raw.get("scamType") in SCAM_TYPES else None
    try:
        confidence = max(0.0, min(1.0, float(raw.get("confidence", 0.5))))
    except (TypeError, ValueError):
        confidence = 0.5
    return {
        "enoughInfo": bool(raw.get("enoughInfo", True)),
        "transferRequested": raw.get("transferRequested") is True,
        "level": level,
        "scamType": scam_type,
        "scamLabel": (str(raw.get("scamLabel") or "").strip()[:60] or None),
        "headline": str(raw.get("headline") or "").strip()[:200],
        "signs": signs[:4],
        "todo": [str(t).strip()[:120] for t in (raw.get("todo") or []) if str(t).strip()][:2],
        "confidence": confidence,
    }


def otp_result(kind: str, display: str) -> AnalysisResult:
    return AnalysisResult(
        id=new_id(), kind=kind, display=display, level="unknown", reason="otp", source="heuristic",
        headline="Tin này có mã xác thực (OTP). Lá chắn không gửi đi phân tích.",
        note="Đừng đọc mã này cho bất kỳ ai, kể cả người tự xưng ngân hàng hay công an.",
    )


async def analyze_text(text: str, mode: str = "message") -> AnalysisResult:
    """mode: message (A05b) hoặc call (A04b)."""
    text = nfc(text).strip()
    kind = "call" if mode == "call" else "message"
    display = "Cuộc gọi" if mode == "call" else (text[:60] + ("…" if len(text) > 60 else ""))
    if has_otp(text):
        return otp_result(kind, "Tin có mã xác thực")

    masked, _ = mask(text)
    heur = rules.analyze(masked, mode)
    out, source = heur, "heuristic"
    ai_fields = {}

    if ai.available():
        try:
            got = _clean_ai(await ai.analyze_text(masked, mode), masked)
            level = _max_level(got["level"], heur["level"])
            if not got["enoughInfo"] and heur["level"] == "unknown":
                level = "unknown"
            out = {
                "level": level,
                "reason": "insufficient" if level == "unknown" else None,
                "scamType": got["scamType"] or heur["scamType"],
                "scamLabel": got["scamLabel"] or heur["scamLabel"],
                "headline": got["headline"] or heur["headline"],
                "signs": got["signs"] if any(s["quotes"] for s in got["signs"]) else heur["signs"],
                "todo": got["todo"] or heur["todo"],
                "confidence": got["confidence"],
            }
            source = "ai"
            if mode == "call":
                # Store the model's recording label before any heuristic or community merge.
                raw_level = got["level"] if got["enoughInfo"] else "unknown"
                labels = " ".join([got["headline"], *(s["text"] for s in got["signs"])])
                hits = rules.find(labels)
                transfer = got["transferRequested"] and raw_level != "unknown"
                scam = got["scamType"] if raw_level != "unknown" else None
                summary = ("Bản ghi có yêu cầu chuyển tiền." if transfer else
                           "Bản ghi có dấu hiệu yêu cầu cung cấp mã OTP." if "otp" in hits and raw_level != "unknown" else
                           "Bản ghi có dấu hiệu đáng ngờ." if raw_level != "unknown" else "Chưa thấy dấu hiệu rủi ro trong bản ghi.")
                if scam and scam != "khac":
                    summary += " Dấu hiệu được nhận diện: " + SCAM_TYPES[scam] + "."
                ai_fields = dict(aiLevel=raw_level, aiScamType=scam, aiConfidence=got["confidence"],
                                 transferRequested=transfer, summary=summary)
        except ai.AIUnavailable:
            source = "fallback"

    if out["level"] == "unknown":
        out["scamType"], out["scamLabel"] = None, None
        if mode == "message":
            out["headline"] = "Tin nhắn quá ngắn. AI không đoán bừa." if len(masked.split()) < 8 else \
                "Chưa thấy dấu hiệu lừa đảo rõ ràng. AI không đoán bừa."
        out["signs"], out["todo"] = [], []
    elif out["scamType"] is None:
        out["scamType"], out["scamLabel"] = "khac", out["scamLabel"] or SCAM_TYPES["khac"]

    return AnalysisResult(
        id=new_id(), kind=kind, display=display, level=out["level"], reason=out.get("reason"),
        scamType=out["scamType"], scamLabel=out["scamLabel"], headline=out["headline"],
        signs=[Sign(**s) for s in out["signs"]], todo=out["todo"], maskedText=masked,
        source=source, confidence=out["confidence"], **ai_fields,
    )


class NeedInput(Exception):
    pass


async def analyze_call(store: Store, *, audio: bytes | None = None, mime: str | None = None,
                       transcript: str | None = None, phone: str | None = None,
                       unknown_number: bool = False, filename: str | None = None) -> AnalysisResult:
    """S3: chép lời bản ghi (không lưu tệp), che số, phân tích; gộp với tra số nếu có số gọi đến."""
    used_demo = False
    if transcript and transcript.strip():
        lines = [line.strip() for line in nfc(transcript).splitlines() if line.strip()]
    elif audio:
        turns = None
        if ai.available():
            try:
                data, kind = await prepare_audio(audio, mime, filename)  # m4a, amr, webm -> flac
                turns = await ai.transcribe(data, kind)
            except ai.AIUnavailable:
                turns = None
        if not turns:
            if not config.demo_fallback():
                raise NeedInput("Chưa chép lời được bản ghi. Thử lại sau.")
            turns = [{"speaker": s, "text": t} for s, t in DEMO_TRANSCRIPT]
            used_demo = True
        lines = [f"{t['speaker']}: {t['text']}" for t in turns]
    else:
        raise NeedInput("Cần tệp ghi âm hoặc bản chép lời.")

    result = await analyze_text("\n".join(lines), mode="call")
    if used_demo:
        result.source = "fallback"

    evidence: list[str] = []
    level = result.level
    if phone:
        result.display = fmt_phone(phone)
        found = check_target("phone", phone, store)
        result.communityLevel = found.level
        result.canAppeal, result.appealOpen, result.count = found.canAppeal, found.appealOpen, found.count
        if found.level in ("danger", "suspicious"):
            evidence.append(found.headline)
            level = _max_level(level, found.level)
            result.reports = ReportSummary(**found.reports.model_dump())
            if result.scamType is None:
                result.scamType, result.scamLabel, result.headline = found.scamType, found.scamLabel, found.headline
                result.lesson = found.lesson
        elif found.level == "safe" and level == "unknown":
            level = "safe"
            if result.source != "ai":
                result.source = "directory"
            result.headline = found.headline
    if unknown_number:
        evidence.append("Số chưa từng liên lạc với bà")
    if any("chuyển tiền" in s.text.lower() for s in result.signs):
        evidence.append("Bản ghi có câu đòi chuyển tiền")
    result.level = level
    result.why = evidence
    if level != "unknown":
        result.reason = None
    return result
