#!/usr/bin/env python3
"""Đưa khóa AI (OpenAI) và các khóa giọng đọc (Gemini) vào vùng riêng của app trên một máy Android đang cắm USB, và bật "AI nói chuyện trực tiếp".

    python3 tools/nap-khoa.py <serial>         # serial lấy từ `adb devices`
    python3 tools/nap-khoa.py <serial> xoa     # gỡ khóa khỏi app

Chỉ đọc hai biến OPENAI_API_KEY và GEMINI_API_KEYS trong la-chan-so/.env. Không in giá trị nào; khóa đi qua stdin của adb,
không nằm trên dòng lệnh. Cần bản debug (run-as). Cài đè APK thì khóa vẫn còn; gỡ app thì mất, phải nạp lại.
"""
import pathlib
import re
import subprocess
import sys
from xml.sax.saxutils import escape

if len(sys.argv) < 2:
    sys.exit(__doc__)
SERIAL, GOI = sys.argv[1], "vn.doi18.lachanso"
ADB = ["adb", "-s", SERIAL]
ENV = pathlib.Path(__file__).resolve().parent.parent / ".env"


def doc_env(ten):
    for d in ENV.read_text(encoding="utf-8").splitlines():
        if d.strip().startswith(ten + "="):
            return d.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def ghi(ten, xml):
    subprocess.run(ADB + ["shell", f"run-as {GOI} sh -c 'mkdir -p shared_prefs && cat > shared_prefs/{ten}'"],
                   input=xml.encode(), check=True, stdout=subprocess.DEVNULL)


subprocess.run(ADB + ["shell", "am", "force-stop", GOI], check=True)
if "xoa" in sys.argv[2:]:
    subprocess.run(ADB + ["shell", f"run-as {GOI} rm -f shared_prefs/khoa-ai.xml"], check=True)
    sys.exit("đã gỡ khóa khỏi app")

oa = doc_env("OPENAI_API_KEY")
gm = [k.strip() for k in doc_env("GEMINI_API_KEYS").split(",") if k.strip()]
if not oa or not gm:
    sys.exit(f"thiếu khóa trong {ENV}: OpenAI {'có' if oa else 'KHÔNG'}, Gemini {len(gm)} khóa")
ghi("khoa-ai.xml", "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n"
    f"    <string name=\"openai\">{escape(oa)}</string>\n    <string name=\"gemini\">{escape(','.join(gm))}</string>\n</map>\n")

cu = subprocess.run(ADB + ["shell", f"run-as {GOI} cat shared_prefs/cai-dat.xml"], capture_output=True, text=True).stdout
if "<map" not in cu:
    cu = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n</map>\n"
if 'name="goi-song"' in cu:
    moi = re.sub(r'<boolean name="goi-song" value="\w+" />', '<boolean name="goi-song" value="true" />', cu)
else:
    moi = cu.replace("</map>", '    <boolean name="goi-song" value="true" />\n</map>')
ghi("cai-dat.xml", moi)
print(f"đã nạp khóa OpenAI và {len(gm)} khóa Gemini (không in), bật gọi video trực tiếp trên {SERIAL}")
