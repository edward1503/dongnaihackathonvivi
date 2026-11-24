"""S4: che số điện thoại, số tài khoản trước khi gửi AI; nhận tin có mã OTP để bỏ qua."""
import re

PHONE_RE = re.compile(r"(?<![\d])(?:\+?84|0)(?:[\s.\-]?\d){8,10}(?![\d])")
LONG_NUMBER_RE = re.compile(r"(?<![\d])\d(?:[\s.\-]?\d){7,18}(?![\d])")
MONEY_RE = re.compile(r"\d{1,3}(?:[.,]\d{3})+")
OTP_RE = re.compile(
    r"(?:otp|mã xác thực|mã xác nhận|mã bảo mật|ma xac thuc|ma otp|verification code)\D{0,25}(?<!\d)\d{4,8}(?!\d)"
    r"|(?<!\d)\d{4,8}(?!\d)\D{0,12}(?:là mã otp|là mã xác thực|la ma otp|is your)",
    re.IGNORECASE,
)


def has_otp(text: str) -> bool:
    return bool(OTP_RE.search(text or ""))


def mask(text: str, phones: bool = True) -> tuple[str, int]:
    """Trả về (chữ đã che, số chỗ đã che). Số tiền kiểu 500.000 không bị che."""
    count = 0

    def _phone(m: re.Match) -> str:
        nonlocal count
        count += 1
        return "[SĐT]"

    def _long(m: re.Match) -> str:
        nonlocal count
        if MONEY_RE.fullmatch(m.group(0)) or (not phones and PHONE_RE.fullmatch(m.group(0))):
            return m.group(0)
        count += 1
        return "[TK]"

    out = text or ""
    if phones:
        out = PHONE_RE.sub(_phone, out)
    out = LONG_NUMBER_RE.sub(_long, out)
    return out, count
