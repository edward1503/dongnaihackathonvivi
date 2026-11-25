"""Ngưỡng chặn đọc lặp của giọng Gemini: đủ rộng cho Bé Nai đọc chậm, ngắt ở dấu câu; vẫn bắt được bản đọc hai lần."""
from lcs import giong

RATE = 24000


def pcm(seconds: float) -> bytes:
    return b"\0\0" * int(seconds * RATE)


def test_slow_elder_reading_with_many_stops_passes():
    text = "Bình tĩnh. Đừng chuyển tiền. Một: dừng lại. Hai: cúp máy. Ba: gọi người thân."
    assert not giong.too_long(pcm(11.6), text)      # đo thật: Bé Nai đọc 11,6 giây
    assert giong.too_long(pcm(23.2), text)          # đọc hai lần


def test_doubled_live_line_still_rejected():
    text = "Dạ con cũng không biết nữa mẹ... Họ hối con chuyển hết tiền hôm nay, còn cấm con nói với ai, giờ con phải làm sao đây mẹ?"
    assert not giong.too_long(pcm(8.8), text)
    assert giong.too_long(pcm(17.9), text)          # đo thật: Gemini đọc cả câu hai lần


def test_empty_audio_rejected():
    assert giong.too_long(pcm(0.05), "Dạ.")
