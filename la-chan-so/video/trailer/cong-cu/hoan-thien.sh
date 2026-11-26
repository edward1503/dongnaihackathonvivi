#!/usr/bin/env bash
# Hoàn thiện bản chính trên laptop: loudnorm hai lượt (−16 LUFS, đỉnh thật −1,5 dBTP), AAC 192 kb/s 48 kHz, +faststart;
# rồi bản nhẹ. Đầu vào: T/ban/<TEN>.mp4 vừa render (mặc định TEN=LCS-trailer; trailer 2: TEN=LCS-trailer2 RA=LCS-trailer-2).
set -euo pipefail
B=$(cd "$(dirname "$0")/../ban" && pwd)
cd "$B"
TEN=${TEN:-LCS-trailer}; RA=${RA:-$TEN}
if [ "$TEN" = "$RA" ]; then
  [ -f $TEN-tho.mp4 ] && [ $TEN-tho.mp4 -nt $TEN.mp4 ] || mv -f $TEN.mp4 $TEN-tho.mp4
else
  mv -f $TEN.mp4 $TEN-tho.mp4
fi
M=$(ffmpeg -hide_banner -nostats -i $TEN-tho.mp4 -vn -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
AF="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000"
ffmpeg -hide_banner -v error -y -i $TEN-tho.mp4 -map 0:v -map 0:a -c:v copy -af "$AF" -c:a aac -b:a 192k -ar 48000 -movflags +faststart $RA.mp4
# Bản nhẹ cho máy chiếu, máy tính yếu: H.264 High@4.0, hai lượt 4 Mb/s (trần 6 Mb/s), khung khóa mỗi 2 s, tiếng chép từ bản chính.
ffmpeg -hide_banner -v error -y -i $RA.mp4 -c:v libx264 -preset medium -profile:v high -level 4.0 -g 60 -b:v 4M -pass 1 -passlogfile /tmp/claude-1000/lcs-nhe -an -f null /dev/null
ffmpeg -hide_banner -v error -y -i $RA.mp4 -c:v libx264 -preset medium -profile:v high -level 4.0 -g 60 -b:v 4M -maxrate 6M -bufsize 8M -pass 2 -passlogfile /tmp/claude-1000/lcs-nhe \
  -pix_fmt yuv420p -c:a copy -movflags +faststart $RA-nhe.mp4
rm -f /tmp/claude-1000/lcs-nhe*
for f in $RA.mp4 $RA-nhe.mp4; do
  echo "== $f"
  ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,sample_rate:format=duration,size -of compact "$f"
  ffmpeg -hide_banner -nostats -i "$f" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
done
