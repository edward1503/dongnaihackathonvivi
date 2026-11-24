#!/usr/bin/env bash
# Gom bài nộp vào thư mục Doi18_De4.
# Dùng: tools/dong-goi.sh [thư mục đích, mặc định ~/Doi18_De4] ; EXPORT=0 để bỏ qua bước xuất lại khung.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-$HOME/Doi18_De4}"

if [ "${EXPORT:-1}" = 1 ]; then
  echo "== Xuất lại toàn bộ khung (SVG, PNG)"
  AUDIT=1 node tools/export.mjs
  echo "== Dựng PDF thiết kế từ các khung"
  python3 tools/pdf-co-ten.py export/La-chan-so-thiet-ke-du-phong.pdf
fi

D1="$OUT/1-Thiet-ke-giao-dien"; D2="$OUT/2-Prototype"; D3="$OUT/3-Thuyet-minh"
mkdir -p "$D1" "$D2" "$D3"

echo "== 1. Thiết kế giao diện"
cp export/La-chan-so-thiet-ke-du-phong.pdf "$D1/Doi18_De4_thiet-ke-giao-dien.pdf"
rsync -a --delete export/svg/ "$D1/khung-svg-de-nhap-Figma/"
rsync -a --delete export/png/ "$D1/khung-png/"
cp HUONG-DAN-FIGMA.md "$D1/"

echo "== 2. Prototype"
rsync -a --delete --exclude 'old/' assets/ "$D2/assets/"
rsync -a --delete screens/ "$D2/screens/"
rsync -a --delete --exclude '*.wav' prototype/ "$D2/prototype/"
rsync -a --delete vendor/ "$D2/vendor/"
cp ds.css icons.js motion.css motion.js "$D2/"
mkdir -p "$D2/export" && rsync -a --delete export/png/ "$D2/export/png/"   # ảnh tĩnh dự phòng khi một màn tải chậm
cp may-chu.py "$D2/"
cat > "$D2/mo-prototype.sh" <<'EOS'
#!/usr/bin/env bash
# Mở prototype Lá chắn số (cần python3). Prototype phải chạy qua http, không mở thẳng tệp html được.
cd "$(dirname "$0")"
PORT=8018
python3 may-chu.py "$PORT" . >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
URL="http://127.0.0.1:$PORT/prototype/index.html"
echo "Prototype: $URL   (Ctrl+C để tắt)"
(xdg-open "$URL" || open "$URL") >/dev/null 2>&1 &
wait $SRV
EOS
chmod +x "$D2/mo-prototype.sh"
printf '@echo off\r\ncd /d "%%~dp0"\r\nstart "" http://127.0.0.1:8018/prototype/index.html\r\npython may-chu.py 8018 .\r\n' > "$D2/mo-prototype.bat"

VID=""
for f in video/thao-tac/ban/LCS1.mp4 video/thao-tac/ban/LCS1-nhe.mp4 export/video/demo.mp4; do
  [ -f "$f" ] && { VID="$f"; break; }
done
if [ -n "$VID" ]; then cp "$VID" "$D2/Doi18_De4_video-demo.mp4"; echo "   video: $VID"; else echo "   CHƯA CÓ VIDEO"; fi

echo "== 3. Thuyết minh"
cp thuyet-minh.docx "$D3/Doi18_De4_thuyet-minh.docx"
[ -f thuyet-minh.pdf ] && cp thuyet-minh.pdf "$D3/Doi18_De4_thuyet-minh.pdf"
rm -f "$D3"/.~lock.*

cat > "$OUT/DOC-TRUOC.txt" <<'EOS'
ĐỘI 18 · ĐỀ 4 · LÁ CHẮN SỐ

1-Thiet-ke-giao-dien/
   Tệp thiết kế trên Figma: https://www.figma.com/design/KqUeRMoL69j6OfeDTwWp2v
   Doi18_De4_thiet-ke-giao-dien.pdf   Toàn bộ màn hình, mỗi trang một màn, tên màn ghi trên từng trang
   khung-svg-de-nhap-Figma/           Từng màn dạng SVG có lớp chỉnh sửa được
   khung-png/                         Từng màn dạng ảnh 2x

2-Prototype/
   Bản chạy trên mạng: https://la-chan-so-doi18.vercel.app
   mo-prototype.sh (Linux, macOS) hoặc mo-prototype.bat (Windows): mở bản mẫu bấm được
   Doi18_De4_video-demo.mp4           Video quay thao tác trên prototype
   Luồng chính (khoảng 1 phút): chọn vai "Bà Hoa" > bấm "Có cuộc gọi lạ (số bị báo)" > Nghe > Có >
      Gọi Minh ngay > (máy Minh, trong Zalo) "Mẹ đừng chuyển, con gọi ngay" > Gọi mẹ ngay.
      Điểm kết thúc cần thấy: lời Minh trả lời hiện thật to trên máy bà Hoa.
   Luồng học sinh: chọn vai "Vy" > Kiểm tra trước khi chuyển tiền > gõ 0912 345 678 > Kiểm tra;
      rồi bấm "Vào học" > Chơi tiếp > chọn lối rẽ > gọi video chị Lan > bảng điểm > bài kiểm tra.
   Web quản trị của đội tình nguyện: nút "Web quản trị" trên thanh trên (hoặc /web trên bản mạng).
   Nếu không mở được bản trên mạng: chạy mo-prototype, hoặc xem video demo trong thư mục này.

3-Thuyet-minh/
   Doi18_De4_thuyet-minh.docx / .pdf  Bản thuyết minh 3 trang

Dữ liệu trong prototype là dữ liệu giả lập.
EOS

echo "== Xong: $OUT"
du -sh "$OUT" "$D1" "$D2" "$D3"
