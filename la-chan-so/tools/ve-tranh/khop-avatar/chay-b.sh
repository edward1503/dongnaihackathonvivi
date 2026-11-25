#!/bin/bash
# Vẽ lại 5 khung comic9 song song, mỗi khung một phiên Codex
cd "$(dirname "$0")"
for n in "$@"; do
  codex exec --skip-git-repo-check -s workspace-write -C . \
    -i in/cu-comic9-$n.png -i in/moi-ong-tu-bang-nhan-vat.png -i in/ref-tu-trang-phuc.jpg -i in/spot-mascot.png \
    -o ket-qua-b$n.md < prompt-b$n.txt > log-b$n.txt 2>&1 &
done
wait
echo "xong cac khung: $*"; ls -la out
