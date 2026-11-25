#!/usr/bin/env bash
# Dựng khẩu hình cho cả bộ câu thu sẵn của một nhân vật gọi video (anh Minh, ông Tư): mỗi câu ra <tên>.lip.json và <tên>.mieng.mp4 cạnh tệp giọng.
#   tools/dung-bo-loi.sh <minh|tu>
# Chạy SAU các bước giọng (xem prototype/loi-<nhân vật>.json mục _ghi_chu):
#   1. thu MỘT lượt dài:   tools/gemini_take.py <giọng> "<lời dặn trong prototype/nhan-vat.json>" <tiền tố> <danh sách câu .json>
#   2. cắt theo khoảng lặng: tools/cat-theo-lang.py <lượt thu .wav> <[{"id","chu"}] .json> <thư mục>
#   3. lọc rẹt:             tools/loc-giong.py <thư mục vào> prototype/audio/<nhân vật>
#   4. nghe kiểm bằng máy:   tools/nghe-lai.py prototype/audio/<nhân vật>/*.m4a   (ghi kết quả vào trường "kiem" của từng câu; câu ngắn phải có người nghe)
# Bộ khớp miệng dùng tạm của avatar 21 (kịch bản bài học mục 3). Mỗi câu bắt đầu ở một khung video khác nhau (cách nhau 67 khung) như bộ của chị Lan.
set -e
nv="$1"; goc="$(cd "$(dirname "$0")/.." && pwd)"; cd "$goc"
ma=$(python3 -c "import json,sys;print(json.load(open('prototype/nhan-vat.json'))[sys.argv[1]]['avatar'])" "$nv")
py="${LCS_PYTHON:-$HOME/.cache/vlearn-lite/venv/bin/python}"; i=0
for id in $(python3 -c "import json,sys;print(' '.join(x['id'] for x in json.load(open('prototype/loi-'+sys.argv[1]+'.json'))['loi']))" "$nv"); do
  t="prototype/audio/$nv/$id"
  if [ ! -s "$t.mieng.mp4" ] || [ "$t.m4a" -nt "$t.mieng.mp4" ]; then
    node tools/mieng-thong-so.mjs "$t.m4a" vendor/vlearn-avatar/stage/d01-tech/lipfit-21.json "$t.lip.json" >/dev/null
    "$py" tools/dung-mieng.py "$ma" "$t.lip.json" $(( i * 67 % 600 ))
  fi
  i=$((i + 1))
done
echo "xong $nv: $i câu, avatar $ma"
