"""Build the neutral-pose overlay consumed by the prebuilt-mouth player."""
import base64
import io
import json
import math
import os
import subprocess
import tempfile
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path
from queue import SimpleQueue
from threading import Lock

import numpy as np
import onnxruntime as ort
from PIL import Image

STAGE = Path(__file__).resolve().parents[2] / "vendor/vlearn-avatar/stage"
SIZE = 384
HALF = SIZE // 2
WORKERS = 2


@lru_cache(maxsize=1)
def fit_model():
    return json.loads((STAGE / "d01-tech/lipfit-21.json").read_text())


def lip_from_samples(samples):
    model = fit_model()
    rate, window, fft = model["sr"], model["win"], model["nfft"]
    count = math.ceil(len(samples) / rate * 30) + model["tail"]
    centers = np.floor(np.arange(count) / 30 * rate + 0.5).astype(int)
    padded = np.pad(samples, (window // 2, centers[-1] + window - len(samples)))
    frames = padded[centers[:, None] + np.arange(window)].astype(np.float64)
    power = abs(np.fft.rfft(frames * np.hanning(window + 1)[:-1], n=fft)) ** 2
    freq = np.fft.rfftfreq(fft, 1 / rate)
    edges = model["edges"]
    bands = [np.log10(power[:, (freq >= lo) & (freq < hi)].sum(axis=1) + 1e-9)
             for lo, hi in zip(edges, edges[1:])]
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    features = np.column_stack([*bands, db])
    neighbors = np.arange(count)[:, None] + model["ctx"]
    context = features[neighbors.clip(0, count - 1)].reshape(count, -1)
    params = ((context - model["mean"]) / model["std"]) @ np.array(model["W"]).T + model["b"]
    bg = smoothstep(*model["bg"], -db)
    return {"fps": 30, "params": params.round(4).tolist(), "bg": bg.round(3).tolist()}


def smoothstep(low, high, values):
    t = np.clip((values - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


def half_image(image):
    return (image.reshape(3, HALF, 2, HALF, 2).mean(axis=(2, 4)) * 0.5 + 0.5) * 255


def spread(mask, axis, operation):
    padding = [(0, 0), (0, 0)]
    padding[axis] = (2, 2)
    padded = np.pad(mask, padding, constant_values=np.nan)
    windows = np.lib.stride_tricks.sliding_window_view(padded, 5, axis=axis)
    return operation(windows, axis=-1)


def upscale(mask):
    return mask.repeat(2, axis=0).repeat(2, axis=1)


class Avatar:
    def __init__(self, avatar_id):
        path = STAGE / "_shared/voice/models/lite" / str(avatar_id)
        meta = json.loads((path / "meta.json").read_text())
        self.frame = meta["khung_noi"]
        refs = meta["refs"]
        index = self.frame % meta["frames"] % (2 * refs)
        index = min(index, 2 * refs - 1 - index)
        start, end = meta["ref_offsets"][index:index + 2]
        with (path / "refs.bin").open("rb") as file:
            file.seek(start)
            ref = Image.open(io.BytesIO(file.read(end - start))).convert("RGB")
        ref = np.asarray(ref.resize((SIZE, SIZE), Image.Resampling.BILINEAR), np.float32)
        self.reference = np.ascontiguousarray((ref / 127.5 - 1).transpose(2, 0, 1)[None])

        self.sessions = SimpleQueue()
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        for _ in range(WORKERS):
            self.sessions.put(ort.InferenceSession(str(path / "lite.onnx"), options,
                                                   providers=["CPUExecutionProvider"]))
        self.closed = np.floor(np.clip(half_image(self.infer(meta["rest"])), 0, 255))

        y, x = np.mgrid[:SIZE, :SIZE].astype(np.float32)
        x1, y1, x2, y2 = meta["box"]
        edge = np.minimum.reduce([x * (x2 - x1), (SIZE - 1 - x) * (x2 - x1),
                                  y * (y2 - y1), (SIZE - 1 - y) * (y2 - y1)]) / SIZE
        top, bottom, left, right = meta["zone"]
        radius = np.hypot((x - (left + right) / 2) / ((right - left) * 0.62),
                          (y - (top + bottom) / 2) / ((bottom - top) * 0.62))
        self.zone = 1 - smoothstep(0.85, 1.15, radius)
        self.window = 1 - smoothstep(1, 1.3, radius)
        cols, cell = meta["protect"]["cols"], meta["protect"]["cell"]
        x0, y0 = index % cols * cell, index // cols * cell
        with Image.open(path / "protect.png") as atlas:
            tile = atlas.convert("RGB").crop((x0, y0, x0 + HALF, y0 + HALF))
        protect = np.asarray(tile, np.float32)[:, :, 0] / 255
        self.weight = smoothstep(2, 20, edge) * (1 - upscale(protect))
        self.pool = ThreadPoolExecutor(max_workers=WORKERS)

    def infer(self, params):
        session = self.sessions.get()
        try:
            inputs = {"ref": self.reference, "params": np.asarray(params, np.float32)[None]}
            return session.run(None, inputs)[0][0]
        finally:
            self.sessions.put(session)

    def render(self, params, bg):
        frame = np.zeros((SIZE, SIZE * 2, 3), np.uint8)
        if bg >= 0.999:
            return frame
        image = self.infer(params)
        movement = smoothstep(4, 14, np.abs(half_image(image) - self.closed).max(axis=0))
        for operation in (np.nanmax, np.nanmean):
            for axis in (1, 0):
                movement = spread(movement, axis, operation)
        alpha = self.weight * (1 - bg) * np.maximum(upscale(movement) * self.window, self.zone)
        frame[:, :SIZE] = np.clip(image.transpose(1, 2, 0) * 127.5 + 127.5, 0, 255)
        frame[:, SIZE:] = (alpha * 255)[:, :, None]
        return frame

    def frames(self, lip):
        # Keep inference parallel, output ordered and the raw frame buffer bounded.
        pending = deque()
        for params, bg in zip(lip["params"], lip["bg"]):
            pending.append(self.pool.submit(self.render, params, bg))
            if len(pending) >= WORKERS + 1:
                yield pending.popleft().result()
        while pending:
            yield pending.popleft().result()


_avatar_lock = Lock()


@lru_cache(maxsize=None)
def _avatar(avatar_id):
    return Avatar(avatar_id)


@lru_cache(maxsize=1)
def rawvideo_available():
    formats = subprocess.check_output(["ffmpeg", "-v", "error", "-demuxers"], text=True)
    return any(row.split()[:2] == ["D", "rawvideo"] for row in formats.splitlines())


def build(pcm, rate, avatar_id, turn_id):
    decoded = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1",
                              "-i", "-", "-ar", "16000", "-f", "f32le", "-"],
                             input=pcm, capture_output=True, check=True)
    lip = lip_from_samples(np.frombuffer(decoded.stdout, "<f4"))
    with _avatar_lock:
        avatar = _avatar(avatar_id)
    png = os.getenv("LCS_FF_PNG") == "1" or not rawvideo_available()
    source = ["-f", "image2pipe", "-c:v", "png"] if png else [
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "768x384"]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / (turn_id + ".mieng.mp4")
        cmd = ["ffmpeg", "-v", "error", *source, "-framerate", "30", "-i", "-", "-c:v", "libx264",
               "-preset", "veryfast", "-crf", "18", "-g", "30", "-pix_fmt", "yuv420p",
               "-color_range", "tv", "-movflags", "+faststart", "-an", str(path)]
        with subprocess.Popen(cmd, stdin=subprocess.PIPE) as encoder:
            with encoder.stdin as stream:
                for frame in avatar.frames(lip):
                    if png:
                        Image.fromarray(frame).save(stream, format="PNG", compress_level=1)
                    else:
                        stream.write(frame.tobytes())
            if encoder.wait():
                raise OSError("Mouth encoder failed")
        lip["mieng"] = {"tep": path.name, "F": avatar.frame, "dung": True}
        return {"lip": lip, "mp4": base64.b64encode(path.read_bytes()).decode()}
