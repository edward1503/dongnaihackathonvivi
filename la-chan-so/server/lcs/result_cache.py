import json
import os
import tempfile
from pathlib import Path

CACHE_ROOT = Path(__file__).resolve().parents[1] / ".cache"


def store_result(path, result):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Mark generated files as ignored even when the cache directory is first created.
    (path.parent / ".gitignore").write_text("*\n")
    with tempfile.NamedTemporaryFile(dir=path.parent, mode="w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, separators=(",", ":"))
        file.flush()
        try:
            os.link(file.name, path)  # First completed response wins across server workers.
        except FileExistsError:
            return json.loads(path.read_bytes())
    return result
