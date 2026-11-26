#!/usr/bin/env bash
# Chạy TRÊN LAPTOP: đẩy bản chép kho, APK và công cụ quay lên scoai (R = ~/lcs-video/trailer).
#   bash video/trailer/cong-cu/day-len.sh [repo] [apk] [cong-cu]     (không đối số: cả ba)
# repo/: không có .env, .git, node_modules, android/, tệp tạm lớn; app/dist chép nguyên (dựng lại app thì chạy lại lệnh này).
# apk/: báo nếu có mã android mới hơn APK (không tự dựng).
set -euo pipefail
W=/home/rin/dongnaihackathonvivi/la-chan-so
T=$W/video/trailer
SS="ssh -F /dev/null -S $HOME/.ssh/scoai-eval.sock -o BatchMode=yes"
SRV=minhhoang@100.126.179.21
$SS -O check $SRV 2>/dev/null || { echo "socket ssh scoai không sống: dừng (không gõ mật khẩu)" >&2; exit 1; }

repo() {
  rsync -a --delete --info=stats1 -e "$SS" \
    --exclude=.git --exclude=node_modules --exclude=/android --exclude=.env --exclude='.env.*' \
    --exclude=/.aws --exclude=/.codex --exclude=/.agents --exclude=/.claude --exclude=.chung-chi \
    --exclude=__pycache__ --exclude=.pytest_cache --exclude='/server/*.db' --exclude=/export --exclude=/audio-goc \
    --exclude='/ban-giao/tam-*' --exclude=/video/trailer --exclude=/video/remotion --exclude=/video/giong \
    --exclude=/video/giong-loi-dan --exclude=/video/thao-tac/ban --exclude=/video/thao-tac/giong --exclude=/video/thao-tac/v1 \
    --exclude='*.keystore' --exclude='*.jks' --exclude=lcs-token \
    "$W/" $SRV:lcs-video/trailer/repo/
  echo "repo: app/dist dựng lúc $(date -r "$W/app/dist/index.html" '+%F %T')"
}

apk() {
  local a=$W/android/app/build/outputs/apk/debug/app-debug.apk
  local moi; moi=$(find "$W/android/app/src" -type f -newer "$a" | head -5)
  [ -n "$moi" ] && { echo "! Có mã android mới hơn APK, báo điều phối (không tự dựng):"; echo "$moi"; }
  rsync -a --info=stats1 -e "$SS" "$a" $SRV:lcs-video/trailer/apk/app-debug.apk
  echo "apk: $(date -r "$a" '+%F %T'), sha256 $(sha256sum "$a" | cut -c1-16)…"
}

cong_cu() {
  rsync -a --info=stats1 -e "$SS" --exclude='*.md' "$T/cong-cu/" $SRV:lcs-video/trailer/cong-cu/
}

for x in ${@:-repo apk cong-cu}; do
  case "$x" in repo) repo ;; apk) apk ;; cong-cu) cong_cu ;; *) echo "không rõ: $x" >&2; exit 2 ;; esac
done
