#!/usr/bin/env bash
# Hạ tầng quay trailer trên scoai: dựng image lcs-trailer:1, chạy/tắt hai container lcs-trailer-emu, lcs-trailer-web.
# Chạy TRÊN scoai. Từ laptop:
#   SS="ssh -F /dev/null -S $HOME/.ssh/scoai-eval.sock -o BatchMode=yes"; SRV=minhhoang@100.126.179.21
#   $SS $SRV bash lcs-video/trailer/cong-cu/sv.sh <lệnh>
# Lệnh:
#   image           dựng image (chạy nền, nhật ký R/tam/image.log; xong thì có dòng "IMAGE XONG" hoặc "IMAGE HONG")
#   len [emu|web]   chạy container (mặc định cả hai). Không -p: không mở cổng nào ra ngoài.
#   tat [emu|web]   docker rm -f container (máy ảo, máy chủ riêng và khóa trong môi trường tiến trình mất theo)
#   xem             trạng thái container, máy chủ riêng, máy ảo
# Cả hai container chạy bằng uid:gid của minhhoang (người dùng "quay" trong image), nên tệp ghi ra R thuộc về minhhoang.
# Container emu thêm nhóm của /dev/kvm (--group-add) để máy ảo dùng KVM; cần root trong container thì `docker exec -u 0`.
set -euo pipefail
R=$HOME/lcs-video/trailer
IMG=lcs-trailer:1
U="$(id -u):$(id -g)"

ten() { case "$1" in emu|web) echo "lcs-trailer-$1" ;; *) echo "chỉ nhận emu hoặc web" >&2; exit 2 ;; esac; }

image() {
  local ctx=$R/tam/ctx
  rm -rf "$ctx"; mkdir -p "$ctx"
  cp "$R/cong-cu/Dockerfile" "$ctx/"
  cp "$R/repo/server/requirements.txt" "$ctx/"
  setsid nohup bash -c "docker build --build-arg QUAY_UID=$(id -u) --build-arg QUAY_GID=$(id -g) -t $IMG '$ctx' \
      && echo IMAGE XONG || echo IMAGE HONG" > "$R/tam/image.log" 2>&1 < /dev/null &
  echo "đang dựng $IMG nền, xem: tail -f $R/tam/image.log"
}

len_mot() {
  local n; n=$(ten "$1")
  if docker ps -a --format '{{.Names}}' | grep -qx "$n"; then echo "$n đã có (sv.sh tat $1 để xóa)"; return 0; fi
  mkdir -p "$R/tam/home-$1" "$R/quay"
  case "$1" in
    emu)
      [ -c /dev/kvm ] || { echo "không có /dev/kvm trên máy chủ" >&2; exit 1; }
      docker run -d --init --name "$n" --hostname "$n" --label lcs-trailer=emu \
        --device /dev/kvm --group-add "$(stat -c %g /dev/kvm)" \
        --user "$U" --cpus=12 --memory=16g --shm-size=2g \
        -v "$R":/t -e HOME=/t/tam/home-emu \
        "$IMG" sleep infinity ;;
    web)
      docker run -d --init --name "$n" --hostname "$n" --label lcs-trailer=web \
        --user "$U" --cpus=6 --memory=8g --shm-size=2g \
        -v "$R":/t -e HOME=/t/tam/home-web -e LCS_CHROME_FLAGS=--no-sandbox \
        "$IMG" sleep infinity ;;
  esac
}

tat_mot() { local n; n=$(ten "$1"); docker rm -f "$n" 2>/dev/null || true; }

xem() {
  docker ps -a --filter name=lcs-trailer- --format '{{.Names}}\t{{.Status}}'
  for c in emu web; do
    local n=lcs-trailer-$c
    docker ps --format '{{.Names}}' | grep -qx "$n" || continue
    echo "== $n"
    docker exec "$n" sh -c 'curl -s -m 3 http://127.0.0.1:8765/api/health || echo "máy chủ riêng: chưa chạy"; echo'
    [ "$c" = emu ] && docker exec "$n" sh -c 'adb devices 2>/dev/null | tail -n +2' || true
  done
}

cmd=${1:-xem}; shift || true
case "$cmd" in
  image) image ;;
  len) for c in ${@:-emu web}; do len_mot "$c"; done ;;
  tat) for c in ${@:-emu web}; do tat_mot "$c"; done ;;
  xem) xem ;;
  *) sed -n '2,13p' "$0"; exit 2 ;;
esac
