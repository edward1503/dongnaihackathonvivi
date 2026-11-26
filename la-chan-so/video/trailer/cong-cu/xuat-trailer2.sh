#!/usr/bin/env bash
# Render LCSTrailer2 (trailer giới thiệu sản phẩm) trên scoai trong container riêng lcs-trailer-render (image node:22-bookworm-slim, không mở cổng).
#   ./xuat-trailer.sh anh 30 120 455      ảnh soát → T/soat/anh/<khung>.jpg
#   ./xuat-trailer.sh nhap                bản nháp nửa cỡ → T/ban/LCS-trailer-nhap.mp4
#   ./xuat-trailer.sh chinh               bản chính 1920×1080 CRF 18 → T/ban/LCS-trailer.mp4
# Thư mục render ~/lcs-video/render có node_modules liên kết cứng: không npm install/ci, không sửa package*.json.
set -euo pipefail
H=$(cd "$(dirname "$0")" && pwd)
T=$(cd "$H/.." && pwd)
REM=$(cd "$T/../remotion" && pwd)
SS="ssh -F /dev/null -S $HOME/.ssh/scoai-eval.sock -o BatchMode=yes"
SRV="${LCS_RENDER_HOST:-minhhoang@100.126.179.21}"
D=lcs-video/render
NAME=lcs-trailer-render
MODE="${1:-anh}"; shift || true

$SS -O check "$SRV" >/dev/null 2>&1 || { echo "Socket ssh tới scoai không sống: dừng (không gõ mật khẩu)."; exit 1; }
python3 "$H/dung-trailer2.py"

# Chỉ đẩy mã nguồn và tệp của trailer; không xóa thứ của quy trình LCS1 trên máy chủ.
rsync -a -e "$SS" "$REM/src/" "$SRV:$D/src/"
rsync -a --delete -e "$SS" "$REM/public/trailer2/" "$SRV:$D/public/trailer2/"
rsync -a -e "$SS" "$H/anh-trailer.mjs" "$SRV:$D/trailer-cong-cu/"

# Container chạy nền một lần (cài thư viện cho Chrome một lần), các lượt sau docker exec.
$SS "$SRV" "docker ps --format '{{.Names}}' | grep -qx $NAME || {
  docker rm -f $NAME >/dev/null 2>&1 || true
  docker run -d --name $NAME --cpus=\${CPUS:-12} --memory=12g --shm-size=2g -v ~/$D:/app -w /app node:22-bookworm-slim sleep infinity >/dev/null
  docker exec $NAME sh -c 'apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 >/dev/null'
}"
UIDGID=$($SS "$SRV" 'echo $(id -u):$(id -g)')

case "$MODE" in
  anh)
    $SS "$SRV" "rm -rf ~/$D/out/anh; docker exec -e COMP=LCSTrailer2 $NAME node trailer-cong-cu/anh-trailer.mjs $* 2>&1 | grep -E 'XONG|rror' ; docker exec $NAME chown -R $UIDGID /app/out"
    rm -rf "$T/soat2/anh"; mkdir -p "$T/soat2/anh"
    rsync -a -e "$SS" "$SRV:$D/out/anh/" "$T/soat2/anh/"
    ;;
  nhap|chinh)
    if [ "$MODE" = nhap ]; then OUTF=LCS-trailer2-nhap.mp4; EXTRA="--scale=0.5 --crf=23"; else OUTF=LCS-trailer2.mp4; EXTRA="--crf=18"; fi
    $SS "$SRV" "docker exec $NAME sh -c 'npx remotion render src/index.ts LCSTrailer2 out/$OUTF --concurrency=10 --offthreadvideo-cache-size-in-bytes=3000000000 $EXTRA --log=error > /tmp/render.log 2>&1; echo EXIT \$?; tail -3 /tmp/render.log'; docker exec $NAME chown -R $UIDGID /app/out"
    mkdir -p "$T/ban"
    rsync -a -e "$SS" "$SRV:$D/out/$OUTF" "$T/ban/"
    ls -la "$T/ban/$OUTF"
    ;;
esac
