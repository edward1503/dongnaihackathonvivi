"""Đổi tệp ghi âm sang dạng Gemini nhận được trước khi chép lời.

Gemini nhận WAV, MP3, AIFF, AAC, OGG, FLAC. Điện thoại lại hay ghi ra m4a, amr, 3gp; trình duyệt ghi ra webm.
Có ffmpeg thì đổi sang FLAC 16 kHz một kênh. Tệp tạm nằm trong thư mục tạm và bị xóa ngay sau khi đổi xong
(m4a cần đọc tới cuối tệp nên không đổi qua ống được). Không có ffmpeg thì gửi nguyên tệp.
"""
import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

GEMINI_OK = {"audio/wav", "audio/x-wav", "audio/wave", "audio/mp3", "audio/mpeg", "audio/aiff", "audio/x-aiff",
             "audio/aac", "audio/ogg", "audio/flac", "audio/x-flac"}

EXT = {"audio/mp4": "m4a", "audio/m4a": "m4a", "audio/x-m4a": "m4a", "audio/amr": "amr", "audio/3gpp": "3gp",
       "video/3gpp": "3gp", "audio/webm": "webm", "video/webm": "webm", "audio/opus": "opus"}


def base_mime(mime: str | None) -> str:
    return (mime or "").split(";")[0].strip().lower()


def _convert(audio: bytes, ext: str) -> bytes | None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return None
    with tempfile.TemporaryDirectory(prefix="lcs-") as d:
        src, dst = Path(d) / f"vao.{ext}", Path(d) / "ra.flac"
        src.write_bytes(audio)
        r = subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "16000", str(dst)],
                           capture_output=True, timeout=60)
        if r.returncode != 0 or not dst.is_file():
            return None
        return dst.read_bytes()


async def prepare(audio: bytes, mime: str | None, filename: str | None = None) -> tuple[bytes, str]:
    """Trả (dữ liệu, mime) để gửi Gemini. Dạng Gemini đã nhận thì giữ nguyên."""
    m = base_mime(mime)
    if m in GEMINI_OK:
        return audio, m
    ext = EXT.get(m) or (Path(filename).suffix.lstrip(".").lower() if filename and "." in filename else "") or "bin"
    try:
        flac = await asyncio.to_thread(_convert, audio, ext)
    except (OSError, subprocess.SubprocessError):
        flac = None
    if flac:
        return flac, "audio/flac"
    return audio, m or "audio/mpeg"


async def has_audio_stream(data: bytes) -> bool:
    """Verify that a signed upload contains audio before creating recording evidence."""
    probe = shutil.which("ffprobe")
    if probe:
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                [probe, "-v", "error", "-protocol_whitelist", "pipe", "-select_streams", "a:0",
                 "-show_entries", "stream=codec_type", "-of", "csv=p=0", "-i", "pipe:0"],
                input=data, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=10,
            )
            return result.returncode == 0 and result.stdout.strip() == b"audio"
        except (OSError, subprocess.TimeoutExpired):
            return False
    # Minimal installations can still submit common Android audio containers.
    # A successful server transcription is independently required before issuing an analysis id.
    return (data.startswith((b"fLaC", b"OggS", b"#!AMR", b"ID3", b"\x1a\x45\xdf\xa3"))
            or data[:4] in (b"RIFF", b"FORM") and data[8:12] in (b"WAVE", b"AIFF", b"AIFC")
            or data[4:8] == b"ftyp"
            or len(data) >= 4 and data[0] == 255 and data[1] & 224 == 224)
