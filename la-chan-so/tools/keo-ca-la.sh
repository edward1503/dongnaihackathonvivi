#!/usr/bin/env bash
# Kéo sổ "ca ngoài kịch bản" của cuộc gọi video từ điện thoại (đang cắm USB, bản debug) về máy tính và in ra cho dễ đọc.
#   tools/keo-ca-la.sh [tệp ra, mặc định bai-hoc/ca-ngoai-kich-ban.jsonl]
# Mỗi dòng là một lượt mà bộ câu thu sẵn của chị Lan không có câu đáp hợp: người học nói gì, AI đã đáp gì.
# Ca nào gặp nhiều hoặc quan trọng thì thêm vào prototype/loi-chi-lan.json (ý định, câu đáp) rồi thu lại cả lượt.
set -e
ra="${1:-$(dirname "$0")/../bai-hoc/ca-ngoai-kich-ban.jsonl}"
adb shell "run-as vn.doi18.lachanso cat files/ca-ngoai-kich-ban.jsonl" > "$ra.tam" 2>/dev/null || { rm -f "$ra.tam"; echo "Chưa có ca nào, hoặc không đọc được điện thoại."; exit 0; }
touch "$ra"; cat "$ra" "$ra.tam" | sort -u > "$ra.moi"; mv "$ra.moi" "$ra"; rm -f "$ra.tam"
python3 - "$ra" <<'PY'
import json, sys, time
ds = [json.loads(d) for d in open(sys.argv[1], encoding="utf-8") if d.strip()]
print(len(ds), "ca ngoài kịch bản trong", sys.argv[1])
for x in sorted(ds, key=lambda x: x["luc"])[-30:]:
    print(time.strftime("%d/%m %H:%M", time.localtime(x["luc"] / 1000)), "· sau câu", x["cau_hoi"])
    print("   BẠN:", x["nguoi_hoc"]); print("   CHỊ LAN (AI):", x["chi_lan"] or "(không tạo được, đã dùng câu hỏi lại thu sẵn)")
PY
