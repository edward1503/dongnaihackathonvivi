#!/usr/bin/env bash
# Chiếu màn hình điện thoại demo (Xiaomi) lên laptop bằng scrcpy, cắm cáp USB.
#   bash tools/chieu-dien-thoai.sh            # tiếng của điện thoại (Bé Nai, chuông) phát ra loa laptop / loa hội trường
#   bash tools/chieu-dien-thoai.sh im         # giữ tiếng trên loa điện thoại, laptop chỉ chiếu hình
# Phím trong cửa sổ (giữ Alt trái): Alt+F toàn màn hình · Alt+W vừa khung · Alt+O tắt màn hình máy (vẫn chiếu)
# Cáp lỏng, scrcpy thoát bất ngờ: script chờ máy cắm lại rồi tự chiếu tiếp. Đóng cửa sổ hoặc Ctrl+C để dừng hẳn.
set -u
MAY="${MAY:-t8u4rgq8qoh6pnbu}"
AM=(); [ "${1:-}" = "im" ] && AM=(--no-audio)

trang_thai() { adb devices | awk -v m="$MAY" '$1 == m { print $2 }'; }

adb start-server >/dev/null 2>&1
case "$(trang_thai)" in
  device) ;;
  unauthorized) echo "Điện thoại đang hỏi 'Cho phép gỡ lỗi USB?': mở khóa máy, bấm Cho phép (tích Luôn cho phép), rồi chạy lại."; exit 1 ;;
  *) echo "Chưa thấy điện thoại $MAY. Kiểm tra: cáp USB (cáp có truyền dữ liệu), Cài đặt → Tùy chọn nhà phát triển → Gỡ lỗi USB đang bật."
     echo "Đang chờ cắm máy... (Ctrl+C để thôi)"; adb -s "$MAY" wait-for-device ;;
esac

# Giữ màn hình máy sáng khi đang cắm sạc (tránh tắt màn giữa demo); trả về như cũ khi thoát.
adb -s "$MAY" shell svc power stayon usb >/dev/null 2>&1
trap 'adb -s "$MAY" shell svc power stayon false >/dev/null 2>&1' EXIT

while true; do
  scrcpy -s "$MAY" --window-title "Lá chắn số · Máy bà Hoa" --stay-awake --disable-screensaver \
    --shortcut-mod=lalt --max-fps 60 --video-bit-rate 12M "${AM[@]}"
  code=$?
  [ $code -eq 0 ] && break   # người dùng đóng cửa sổ
  echo "scrcpy dừng (mã $code). Chờ điện thoại kết nối lại để chiếu tiếp..."
  adb -s "$MAY" wait-for-device
  sleep 1
done
