"""Wire format shared with the Android installation."""

import hashlib
import hmac
import re
from datetime import datetime
from typing import Literal

from fastapi import HTTPException
from pydantic import BaseModel, Field

from . import config
from .masking import has_otp, mask


def fail(message, code=422):
    raise HTTPException(code, message)


def safe_text(value):
    return "" if has_otp(value or "") else mask(value or "")[0].strip()


def receipt_string(event_id, device_id, evidence_type, direction, target_key, at, duration_sec=None):
    """UTF-8 eventId|deviceId|type|direction|targetKey|at|durationSec, without spaces or newline.
    Sign the exact timestamp string. Absent duration is empty (keep the trailing |), zero is '0'.
    The UTF-8 deviceSecret as returned is the HMAC-SHA256 key. Encode the digest as lowercase hex.
    At analysis time a caller may sign the lowercase SHA-256 of the normalized key instead.
    """
    return "|".join(
        (
            event_id,
            device_id,
            evidence_type,
            direction,
            target_key,
            at,
            "" if duration_sec is None else str(duration_sec),
        )
    )


def verify_signature(secret, message, signature):
    expected = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    if (
        not isinstance(signature, str)
        or not re.fullmatch("[0-9a-f]{64}", signature)
        or not hmac.compare_digest(expected, signature)
    ):
        fail("Chữ ký của máy không khớp.")


def timestamp(value):
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            raise ValueError
        return dt.astimezone(config.VN)
    except (ValueError, OverflowError):
        fail("Thời điểm nhận cần có múi giờ.")


class Receipt(BaseModel):
    signature: str
    direction: Literal["incoming"] = "incoming"
    eventId: str | None = None
    deviceId: str | None = None
    type: str | None = None
    targetKey: str | None = None
    at: str | None = None
    durationSec: int | None = None


class Recording(BaseModel):
    analysisId: str
    aiLevel: str | None = None
    aiScamType: str | None = None
    aiConfidence: float | None = None


class Evidence(BaseModel):
    simulated: Literal[False] = False
    type: Literal["call_log", "sms_received"]
    at: str
    durationSec: int | None = Field(None, ge=0)
    direction: Literal["incoming"] = "incoming"
    recording: Recording | None = None


class Validation(BaseModel):
    by: Literal["self", "relative"]
    result: Literal["agree", "disagree"]
    at: str | None = None
    signature: str | None = None


class Submission(BaseModel):
    simulated: Literal[False] = False
    kind: Literal["phone", "call", "account", "link", "message"]
    target: str = Field(min_length=1, max_length=2048)
    eventId: str = Field(pattern=r"^[^|\s]{1,100}$")
    relation: Literal["self"]
    receipt: Receipt | str
    evidence: Evidence
    direction: Literal["incoming"] = "incoming"
    source: Literal["android", "app"] = "android"
    selfAnswer: Literal["yes", "no", "known"] | None = None
    selfAnswerSignature: str | None = None
    validation: Validation | None = None
    alertId: str | None = None
    story: str = Field("", max_length=2000)
    lostMoney: bool = False
    area: str | None = None
    group: str | None = None


def verify_receipt(secret, device, event, key, evidence, receipt, now):
    if not key or "|" in key or "|" in event or not event.strip():
        fail("Thiếu đối tượng hoặc mã sự kiện hợp lệ.")
    if timestamp(evidence.at) > now:
        fail("Thời điểm nhận ở tương lai.")
    fields = dict(
        eventId=event,
        deviceId=device,
        type=evidence.type,
        direction=evidence.direction,
        targetKey=key,
        at=evidence.at,
        durationSec=evidence.durationSec,
    )
    if isinstance(receipt, Receipt):
        if any(
            fields[k] != v for k, v in receipt.model_dump(exclude_unset=True, exclude={"signature"}).items()
        ):
            fail("Biên nhận không khớp sự kiện.")
        receipt = receipt.signature
    message = receipt_string(event, device, evidence.type, evidence.direction, key, evidence.at, evidence.durationSec)
    verify_signature(secret, message, receipt)


def key_hash(key):
    return hashlib.sha256(key.encode()).hexdigest()
