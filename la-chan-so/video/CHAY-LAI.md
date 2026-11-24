# Chạy lại video demo Lá chắn số (LCS1)

Quy trình gốc: `/run/media/rin/Rin/Competition/Nestle-Document-Processing/out/video/QUY-TRINH-QUAY-VIDEO.md`.
Đặt `W` = thư mục `la-chan-so`. Máy chủ: socket `~/.ssh/scoai-eval.sock` phải còn sống.

## 1. Máy chủ web tĩnh (giữ chạy khi quay)
```bash
cd $W && python3 -m http.server 8137 --bind 127.0.0.1
```

## 2. Giao diện đổi → quay lại, render lại (giọng giữ nguyên)
```bash
cd $W/video/thao-tac
python3 v1.py && node ../capture/ghi.mjs v1/plan.json v1/quay > v1/quay.log 2>&1; tail -2 v1/quay.log
python3 cat.py v1 && python3 soat.py v1/quay v1/soat        # xem v1/soat/*.jpg
CAN=0 ./xuat.sh > ban/xuat.log 2>&1                          # dung.py + render máy chủ → ban/LCS1.mp4
```

## 3. Đổi lời đọc → thu lại giọng (1 lượt Gemini cho cả video) rồi render
```bash
cd $W/video
set -a; . /run/media/rin/Rin/AI-Thuc-Chien/vlearn-lesson-lab/.env >/dev/null 2>&1; set +a
uv run --no-project --with numpy python thao-tac/giong.py doc v1 --thu     # in số lượt sẽ gọi
TTS_VOICE=Kore uv run --no-project --with numpy python thao-tac/giong.py doc v1
cd thao-tac && ./xuat.sh > ban/xuat.log 2>&1                                 # có căn câu Whisper (GPU máy chủ)
```
- `ONE=0` trước `giong.py` để tách nhóm theo chương (khi một lượt bị cắt cụt).
- Nhật ký lượt gọi: `video/giong/TT-v1-doan/goi.jsonl`.

## 4. Bản nhẹ (<30 MiB)
```bash
cd $W/video/thao-tac/ban && P=$(mktemp -d) && \
ffmpeg -y -i LCS1.mp4 -c:v libx264 -b:v 1000k -preset medium -threads 4 -pass 1 -passlogfile "$P/p" -an -f mp4 /dev/null && \
ffmpeg -y -i LCS1.mp4 -c:v libx264 -b:v 1000k -preset medium -threads 4 -pass 2 -passlogfile "$P/p" -c:a aac -b:a 96k -movflags +faststart LCS1-nhe.mp4; rm -rf "$P"
```

## Ghi chú
- Máy chủ: render ở `~/lcs-video/render` (container `lcs-video-render`, không đụng `sc2-tradeagent`), Whisper ở `~/lcs-video/asr`.
- Ảnh tĩnh soát: `cd $W/video/remotion && node anh-tinh.mjs LCS1 <khung>…`.

## Bổ sung 14:25 (bản chốt có tiếng gốc, khẩu hình mượt hơn, nhãn Zalo)
- Máy chủ web khi quay: `cd $W && python3 may-chu.py 8138 .` (COOP/COEP → `crossOriginIsolated`, wasm đa luồng). `v1.py` trỏ `base` vào cổng 8138.
- Tiếng gốc của prototype: `ghi.mjs` móc `HTMLMediaElement.play/pause` và `AudioBufferSourceNode.start/stop` ở mọi frame, ghi mốc vào `log.json` (sự kiện `type: "audio"`).
  Bước có `V.steps[-1]["goc"] = True` trong `v1.py` thì `dung.py` giữ đoạn quay 1x, hình đứng chờ lời ở mốc câu, và đặt file `prototype/audio/*.m4a`
  (đã nâng/hạ cho ngang lời dẫn, limiter −3 dBFS, fade 20 ms → `remotion/public/thao-tac/v1/goc/*.wav`) đúng mốc. `dung.py` in `CHỒNG TIẾNG` nếu lời đè tiếng gốc.
- Đoạn gọi video quay riêng cho mượt (GPU thật thay SwiftShader + 6 luồng wasm), rồi thay vào `v1/doan`:
  ```bash
  cd $W/video/thao-tac
  LCS_THREADS=6 LCS_CHROME_FLAGS="--enable-gpu --ignore-gpu-blocklist --use-gl=angle --use-angle=gl-egl" node ../capture/ghi.mjs v1/goi-plan.json v1/quay-goiB
  mkdir -p gB && ln -sfn ../v1/quay-goiB gB/quay && python3 cat.py gB     # → gB/doan/vy-goi.mp4 + doan.json; chép sang v1/doan và thay mục "vy-goi" trong v1/doan/doan.json
  ```
  Chạy `python3 cat.py v1` lại sẽ ghi đè đoạn gọi bằng bản SwiftShader (kém mượt hơn): phải thay lại. Có thể quay cả video với hai biến môi trường trên (chưa thử).
- Nhãn "Minh nhận cảnh báo ngay trong Zalo" (màn Z01*) và phụ đề có chữ Zalo: `NOTE_ZALO`, `SUB` trong `dung.py`; component `Note` trong `remotion/src/thao-tac.tsx`.

## Bổ sung 15:3x (bản 6: màn A11j, Zalo trong lời dẫn, khớp tiếng–miệng)
- `v1.py`: mảng `N` là thời gian chờ (ms) theo độ dài từng câu dẫn ở các bước có tiếng gốc; thu giọng xong (`giong.py can/tach`) thì sửa `N` theo `giong/v1/*.cau.json`
  rồi quay lại. `v1.py` cũng tự ghi `v1/goi-plan.json` (quay riêng đoạn gọi video; `GOI_SCALE=1 GOI_Q=80` nếu muốn quay nhẹ).
- Quay CẢ video bằng GPU thật + 6 luồng (đã chạy được, không cần thay đoạn gọi riêng nữa):
  `LCS_THREADS=6 LCS_CHROME_FLAGS="--enable-gpu --ignore-gpu-blocklist --use-gl=angle --use-angle=gl-egl" node ../capture/ghi.mjs v1/plan.json v1/quay`
- Sau `giong.py tach`: `rm -rf thao-tac/giong/v1/goc && python3 loc-giong-buoc.py thao-tac/giong/v1` (hạ đỉnh −3,6 dBFS, fade 20/30 ms; phải xoá `goc/` cũ kẻo lọc lại từ lượt thu cũ).
- Đo khẩu hình và độ lệch tiếng: `uv run --no-project --with numpy python thao-tac/do-mieng.py v1/doan/vy-goi.mp4 v1/doan/doan.json`.
  `dung.py` đặt tiếng chị Lan tại mốc start THẬT (sự kiện start sau cùng; cái đầu là OfflineAudioContext của to16k) + `LIP_DELAY` (mặc định 0,30 s, đổi bằng biến môi trường),
  giọng Vy + 0,22 s (outputLatency của AudioContext 'playback').
- Khẩu hình mượt hay không phụ thuộc máy quay: máy chạy PIN (governor powersave) thì miệng chỉ đổi ~30–40% cặp khung; cắm sạc rồi quay lại riêng đoạn gọi (mục 14:25) sẽ tốt hơn.
  Số luồng 3/6/10 không khác nhau (đo 15:17).
- Tên màn trên thanh địa chỉ giả: bảng `TITLES` trong `dung.py` (theo màn đang hiện, không theo tên bước). `tao-giong-gemini-mot.py` nhận `TTS_TIMEOUT` (giây) vì có lượt gọi treo >10 phút.
