#!/bin/sh
# Đo 23/11: 300 khung TT1 mất 48 s với 12 luồng/14 nhân, 16 s với 18 luồng/20 nhân + bộ đệm video 4 GB. GPU (angle-egl, vulkan) không nhanh hơn: nghẽn ở CPU. Chạy thật dùng 18 nhân, 16 luồng để chừa nhân cho dịch vụ khác.
# Xuất video demo 1080p trong container node:22-bookworm-slim. Gọi từ máy chủ, không gọi mạng ngoài npm và Chrome của Remotion.
set -e
apt-get update -qq
apt-get install -y -qq --no-install-recommends ca-certificates libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 \
  libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 >/dev/null
cd /app
# Chỉ cài lại khi chưa có node_modules hoặc package-lock mới hơn.
[ -d node_modules ] && [ node_modules -nt package-lock.json ] || npm ci --no-audit --no-fund
npx remotion browser ensure
mkdir -p out
for c in ${COMPS:-LCS1}; do
  start=$(date +%s)
  npx remotion render src/index.ts $c out/$c.mp4 --concurrency=16 --crf=18 --offthreadvideo-cache-size-in-bytes=4000000000 --offthreadvideo-threads=8 --log=info $EXTRA
  echo "XONG $c $(( $(date +%s) - start ))s"
done
chown -R "$HOST_UID:$HOST_GID" /app
