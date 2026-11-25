import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel

MEMBERS = {
    "246810": ("khoa", "Khoa", "volunteer"),
    "135790": ("lan-anh", "Lan Anh", "volunteer"),
    "999111": ("hung", "Hùng", "lead"),
}
sessions = {}


class Login(BaseModel):
    code: str


def login(code, device):
    data = MEMBERS.get(code)
    if not data:
        raise HTTPException(401, "Mã đội chưa đúng.")
    member = dict(zip(("id", "name", "role"), data), ward="Trấn Biên")
    token = secrets.token_urlsafe(32)
    sessions[token] = {**member, "device": device}
    return {"token": token, "member": member}


def require_team(x_lcs_team: Annotated[str | None, Header()] = None):
    member = sessions.get(x_lcs_team)
    if not member:
        raise HTTPException(401, "Bạn đăng nhập bằng mã đội nhé.")
    return member


def require_lead(member=Depends(require_team)):
    if member["role"] != "lead":
        raise HTTPException(403, "Chỉ trưởng đội thực hiện được việc này.")
    return member
