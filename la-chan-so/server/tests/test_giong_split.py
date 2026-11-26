import array
import asyncio
import math
from unittest.mock import AsyncMock

import pytest

from lcs import giong


RATE = 16000
TEXT = "Đợi chị một chút"


def silence(milliseconds):
    return bytes(2 * RATE * milliseconds // 1000)


def syllables(*durations_ms):
    bursts = []
    for duration in durations_ms:
        size = RATE * duration // 1000
        samples = array.array("h")
        for index in range(size):
            envelope = 0.3 + 0.7 * math.sin(math.pi * index / size)
            tone = math.sin(2 * math.pi * 220 * index / RATE)
            samples.append(round(12000 * envelope * tone))
        bursts.append(samples.tobytes())
    return silence(80).join(bursts)


@pytest.fixture
def reading():
    return syllables(330, 410, 500, 340)


def test_recovers_first_reading_with_linear_fade(reading):
    result = giong.split_double_reading(reading + silence(500) + reading, RATE, TEXT)
    assert result is not None
    assert len(result) == pytest.approx(len(reading), rel=0.05)
    fade = RATE * 30 // 1000
    assert result[:-2 * fade] == reading[:-2 * fade]
    tail = memoryview(reading)[-2 * fade:].cast("h")
    assert list(memoryview(result)[-2 * fade:].cast("h")) == [
        round(value * ((fade - 1 - index) / (fade - 1))) for index, value in enumerate(tail)
    ]


def test_rejects_longer_directors_notes(reading):
    notes = syllables(800, 330, 860)
    assert 0.75 < len(reading) / len(notes) < 1  # Duration alone would accept the notes.
    assert giong.split_double_reading(reading + silence(500) + notes, RATE, TEXT) is None


def test_single_reading_with_short_internal_pause():
    clause = syllables(300, 480)
    clip = clause + silence(190) + clause
    assert not giong.too_long(clip, TEXT, RATE)
    assert giong.split_double_reading(clip, RATE, TEXT) is None


@pytest.mark.parametrize("text", ["Đợi", "Đợi chị một chút để chị gọi cho người nhà trước nhé"])
def test_rejects_first_reading_outside_text_duration(reading, text):
    assert giong.split_double_reading(reading + silence(500) + reading, RATE, text) is None


def test_voiced_recovers_without_second_request(monkeypatch, reading):
    synthesize = AsyncMock(return_value=(b"raw", RATE))
    monkeypatch.setattr(giong, "tts_pcm", synthesize)
    monkeypatch.setattr(giong, "clean", lambda pcm, rate: (reading + silence(500) + reading, rate))
    recovered, rate = asyncio.run(giong.voiced(TEXT, "voice", "notes"))
    assert rate == RATE
    assert len(recovered) == len(reading)
    synthesize.assert_awaited_once()


def test_voiced_retries_after_different_second_reading(monkeypatch, reading):
    clip = reading + silence(500) + syllables(800, 330, 860)
    synthesize = AsyncMock(side_effect=[(clip, RATE), (reading, RATE)])
    monkeypatch.setattr(giong, "tts_pcm", synthesize)
    monkeypatch.setattr(giong, "clean", lambda pcm, rate: (pcm, rate))
    assert asyncio.run(giong.voiced(TEXT, "voice", "notes")) == (reading, RATE)
    assert synthesize.await_count == 2
