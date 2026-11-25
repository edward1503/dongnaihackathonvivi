#!/usr/bin/env bash
# Kho giọng đã lưu của cuộc gọi video (mọi câu AI đã đọc, tiếng đã lọc rẹt, và mọi lượt AI đã đáp), xem android/.../KhoGiong.kt.
#   tools/keo-giong.sh        kéo kho từ điện thoại (cắm USB, bản debug) về bai-hoc/kho-giong/, đổi thêm ra .wav và in danh sách câu
#   tools/keo-giong.sh day    đẩy kho ở bai-hoc/kho-giong/ vào điện thoại (máy mới hoặc sau khi gỡ app), để phát lại không cần API
# Dùng khi hết lượt API mà vẫn cần quay video giới thiệu: gõ lại đúng các câu ở cột "BẠN" theo đúng thứ tự là ra đúng lời cũ.
set -e
goi=vn.doi18.lachanso; kho="$(cd "$(dirname "$0")/.." && pwd)/bai-hoc/kho-giong"; mkdir -p "$kho/pcm" "$kho/wav"
if [ "${1:-}" = "day" ]; then
  tar -C "$kho/pcm" -cf - . | adb shell "run-as $goi sh -c 'mkdir -p files/kho-giong && tar -C files/kho-giong -xf -'"
  echo "Đã đẩy $(ls "$kho/pcm" | wc -l) tệp vào điện thoại."; exit 0
fi
adb exec-out "run-as $goi tar -C files/kho-giong -cf - ." 2>/dev/null | tar -C "$kho/pcm" -xf - 2>/dev/null || { echo "Chưa có kho, hoặc không đọc được điện thoại."; exit 0; }
python3 - "$kho" <<'PY'
import json, sys, time, wave, pathlib
kho = pathlib.Path(sys.argv[1]); pcm = kho / "pcm"; tieng = []; luot = {}
for m in sorted(pcm.glob("tieng-*.json")):
    j = json.loads(m.read_text(encoding="utf-8")); p = m.with_suffix(".pcm")
    if not p.exists(): continue
    w = kho / "wav" / (m.stem + ".wav")
    if not w.exists():
        with wave.open(str(w), "wb") as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(j.get("tanSo", 24000)); f.writeframes(p.read_bytes())
    tieng.append((j["luc"], j["giong"], j["giay"], j["chu"], w.name))
for m in pcm.glob("luot-*.json"):
    j = json.loads(m.read_text(encoding="utf-8")); luot[m.stem] = j
print(len(tieng), "câu đã lưu tiếng ·", len(luot), "lượt đã lưu ·", kho)
for luc, giong, giay, chu, ten in sorted(tieng)[-40:]:
    print(time.strftime("%d/%m %H:%M", time.localtime(luc / 1000)), f"· {giong} · {giay:.1f}s · {ten}\n   {chu}")
print("\nCác lượt (gõ lại đúng câu BẠN theo thứ tự để phát lại không cần API):")
for j in sorted(luot.values(), key=lambda x: x["luc"])[-40:]:
    print(time.strftime("%d/%m %H:%M", time.localtime(j["luc"] / 1000)), "·", j.get("nhan_vat"), "· lượt thứ", j.get("luot_thu"), "· đã chấm:", ",".join(j.get("da_cham", [])) or "chưa")
    print("   BẠN:", j.get("nguoi_hoc", "(bản phát hành không lưu lời người học)")); print("   ĐÁP:", j["chu"], "· ý mới:", ",".join(j.get("y", [])) or "không")
PY
