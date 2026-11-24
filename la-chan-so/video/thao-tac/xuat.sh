#!/usr/bin/env bash
# Căn câu (Whisper GPU máy chủ), tách giọng, dựng dòng thời gian, render LCS1 trên máy chủ rồi tải về ban/.
#   ./xuat.sh            (CAN=0 ./xuat.sh để bỏ qua căn câu khi giọng không đổi)
set -euo pipefail
H=$(cd "$(dirname "$0")" && pwd)
REM="$H/../remotion"
SS="ssh -F /dev/null -S $HOME/.ssh/scoai-eval.sock -o BatchMode=yes"
SRV="${LCS_RENDER_HOST:?đặt LCS_RENDER_HOST=user@máy-chủ-render}"
D=lcs-video/render          # thư mục render riêng trên máy chủ (node_modules là bản hard-link của sc2-tradeagent/video-render)
NAME=lcs-video-render
COMPS=LCS1
cd "$H"
if [ "${CAN:-1}" != 0 ]; then
  python3 giong.py can v1
  python3 giong.py tach v1
fi
python3 dung.py v1
$SS $SRV "while docker ps --filter name=$NAME --format x | grep -q x; do sleep 15; done"
rsync -a --delete -e "$SS" "$REM/src/" $SRV:$D/src/
rsync -a -e "$SS" "$REM/package.json" "$REM/package-lock.json" $SRV:$D/
rsync -a --delete -e "$SS" "$REM/public/" $SRV:$D/public/
$SS $SRV "cd ~/$D && rm -f out/$COMPS.mp4; docker rm -f $NAME >/dev/null 2>&1; docker run -d --name $NAME --cpus=${CPUS:-18} -e COMPS='$COMPS' -e EXTRA='${EXTRA:-}' -e HOST_UID=\$(id -u) -e HOST_GID=\$(id -g) -v ~/$D:/app node:22-bookworm-slim sh /app/render.sh >/dev/null && docker wait $NAME && docker logs $NAME 2>&1 | grep -E 'XONG|rror' | tail -6"
mkdir -p "$H/ban"
rsync -a -e "$SS" "$SRV:$D/out/$COMPS.mp4" "$H/ban/"
ls -la "$H/ban"
