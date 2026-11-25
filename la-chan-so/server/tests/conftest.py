import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.pop("GEMINI_API_KEYS", None)
os.environ.pop("GEMINI_API_KEY", None)
os.environ["LCS_TODAY"] = "2026-11-24"
os.environ["LCS_DB"] = ":memory:"
os.environ["LCS_STATIC"] = "/khong-co-thu-muc-nay"

from fastapi.testclient import TestClient  # noqa: E402

from lcs import main  # noqa: E402


@pytest.fixture()
def client():
    main.store.reset()
    main.relay.rooms.clear()
    main.relay.asks.clear()
    main.alerts.reset()
    with TestClient(main.app) as c:
        yield c


SAMPLE_MESSAGE = (
    "Chào em, bên chị tuyển cộng tác viên đặt đơn online, việc nhẹ lương cao 500k/ngày. "
    "Chỉ cần nạp trước 200k để kích hoạt, hoàn tiền kèm hoa hồng 20%. "
    "Đăng ký trong hôm nay tại bit.ly/viec-nhe-xyz"
)
