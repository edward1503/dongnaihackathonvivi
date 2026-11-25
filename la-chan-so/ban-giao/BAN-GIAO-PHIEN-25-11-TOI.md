# Bàn giao phiên tối 25/11/2026 (Hoàng, mảng 1 và 4) → phiên Claude CLI

Đọc trước: `VAI-VA-KIEM-DUYET.md` (luật vai, báo cáo, kiểm duyệt, giao kèo API, đã chốt với người dùng), `BAN-GIAO.md`, `android/README.md`, `app/README.md`.
Trả lời người dùng bằng tiếng Việt. Mã mới đặt tên tiếng Anh. Người dùng muốn giao việc viết mã cho Codex để tiết kiệm quota Claude (xem mục 6).

## 1. Trạng thái git
- Nhánh `android-and-lessons`, **đi trước origin 17 commit, CHƯA đẩy**. PR #2 (`edward1503/dongnaihackathonvivi`) vào nhánh `mang-5-6-zalo-web-tinh-nguyen`. Người dùng định đẩy sau khi thử trên điện thoại thật. Đẩy xong nên báo Tuấn (sửa `server/`, `app/`) và Đức (sửa `mvp/web.html`, `mvp/zalo.html`).
- Commit trong phiên (cũ → mới): `0d82aa9` gộp nhánh tuan, `4e77a2c` lượt AI qua máy chủ, `42e6263`, `0c797c0` chặn Gemini đọc lặp, `2c80b9d` APK mở vào app React V3 + cầu LCSNative + logo khiên gạc nai, `18ad6c5` đọc to bằng giọng Gemini Bé Nai + toàn màn hình trên máy tính bảng, `503cefa` và `40676c3` lời đọc to theo văn nói và giọng văn các màn Android cũ, `a9fbf9f` tài liệu luật, `c4dab6e` luật báo cáo/kiểm duyệt mới (máy chủ, React, Android, web, Zalo), `2ed35f3` tài liệu: Minh dùng vai Người thân, `b4d1386` vai Người thân có thông báo Android, `3283204` bỏ vai Đăng nhập đội khỏi app (đội duyệt trên web `/web`).
- Chưa commit, cố ý: `zalo-mini-app/` (khung Zalo Mini App, đã bỏ hướng này vì phát hành cần xác thực doanh nghiệp; hỏi người dùng xóa hay giữ), `bai-hoc/ca-ngoai-kich-ban.jsonl`, `bai-hoc/nghe-thu/*.wav` (có từ trước, để nguyên).

## 2. Những gì đã chốt với người dùng
- APK = khung React V3 của Tuấn + phần Android mảng 1 + bài học mảng 4. Màn cuộc gọi V3 (A03, A04, A10, A05) APK không dùng, chỉ để trình diễn trên trình duyệt; APK dùng màn Android gốc (thẻ đổ chuông, Bé Nai hỏi sau cuộc gọi, Dừng lại).
- Vai trong app: Người lớn tuổi (bà Hoa), Học sinh (Vy), Người thân (Minh, nhận thông báo, xác nhận "Đừng chuyển"/"Người quen", gọi mẹ). **Đội tình nguyện chỉ dùng trang web `/web`** (bảng thống kê, hàng chờ hồ sơ, phiếu, khiếu nại, phát cảnh báo), không có trong app.
- Luật báo cáo (chi tiết ở `VAI-VA-KIEM-DUYET.md`): chỉ máy đã nhận cuộc gọi/tin nhắn mới báo được (biên nhận HMAC do Android ký); có ghi âm thì AI gắn nhãn, bà (câu hỏi Bé Nai) hoặc Minh xác nhận khớp thì tính ngay W1 = 5; không ghi âm W3 = 1 cần đội duyệt; vàng S1 ≥ 5, đỏ S2 ≥ 10 (2 máy W1 là đỏ); AI không tự làm đỏ; đếm theo máy; khiếu nại báo nhầm tạm hạ đỏ xuống vàng.
- Lời đọc to: giọng Gemini Bé Nai (Leda, lời dặn "don-gian" trong `tools/giong-bai-hoc.json`) qua máy chủ `/api/roleplay/speak`, lưu đệm ở máy chủ và máy; câu viết theo văn nói, lễ phép với bà, giống thoại các màn Android cũ (người dùng rất để ý điểm này).
- Logo: phương án C (khiên gạc nai), gốc `tools/logo/logo-c.png`.

## 3. Môi trường đang chạy
- **Máy chủ thử trên scoai** (`minhhoang@100.126.179.21`, Tailscale): dùng socket có sẵn `ssh -S ~/.ssh/scoai-eval.sock -o ControlMaster=no minhhoang@100.126.179.21`. Mã ở `~/lcs-server/la-chan-so` (chỉ có `server/ mvp/ prototype/ tools/ vendor/`), venv `~/lcs-server/venv`, log `~/lcs-server/server.log`, pid `~/lcs-server/server.pid`. Khóa ở `~/lcs-server/la-chan-so/.env` (quyền 600; có OPENAI_API_KEY, GEMINI_API_KEYS, LCS_TOKEN, LCS_DEMO=1). Không bao giờ in giá trị khóa.
  - Chép mã: `rsync -a -e "ssh -S ~/.ssh/scoai-eval.sock -o ControlMaster=no" --exclude .cache --exclude __pycache__ --exclude 'lcs.db*' server/lcs server/tests minhhoang@100.126.179.21:lcs-server/la-chan-so/server/` (thêm `mvp` khi sửa web).
  - Khởi động lại (chạy trong `~/lcs-server/la-chan-so/server`): kill pid cũ, chờ cổng 8765 trống, `export PATH=$HOME/lcs-server/venv/bin:$PATH LCS_MOUTH_WORKERS=8 LCS_MOUTH_THREADS=2; setsid -f $HOME/lcs-server/venv/bin/uvicorn lcs.main:app --host 127.0.0.1 --port 8765 --no-access-log > $HOME/lcs-server/server.log 2>&1 < /dev/null`, rồi ghi pid lấy từ `ss -ltnp "sport = :8765"`.
  - Kiểm thử trên scoai: `../../venv/bin/python -m pytest -q -p no:cacheprovider` (113 đạt; 2 bài hỏng `test_tep_tinh_khong_doi_duoc_duong_dan`, `test_trang_goi_video_co_coop_coep` chỉ vì bản trên scoai thiếu tệp tĩnh).
  - Tuyệt đối không đụng container `sc2-tradeagent`, không gõ mật khẩu SSH. `minhhoang` không có sudo.
- **Địa chỉ public** (Tailscale Funnel do người dùng bật bằng tài khoản `supplychain`): `https://supplychain-system-product-name.tailb64d44.ts.net:10000` → 127.0.0.1:8765. Tắt: `ssh -t supplychain@100.126.179.21 'sudo tailscale funnel --https=10000 off'` (người dùng tự chạy). Cổng 8443 là của người khác, không đụng.
- **Khóa LCS_TOKEN** cho đường AI: lưu ở `~/.local/share/lcs/lcs-token` (600), không trong git. Build APK: `cd android && JAVA_HOME=$HOME/.local/jdk17 ./gradlew -q assembleDebug testDebugUnitTest -PskipReactBuild -PLCS_TOKEN="$(cat ~/.local/share/lcs/lcs-token)"` (build React trước: `cd app && npm run build`). Codex không chạy được Gradle trong sandbox, phải tự build.
- **Mã đội thử** (trang `/web`): `246810` Khoa, `135790` Lan Anh (tình nguyện viên), `999111` Hùng (trưởng đội). Mã khiếu nại thử `246810` khi `LCS_DEMO=1`. Mã gia đình `gia-dinh-hoa`. Đặt lại dữ liệu mẫu: `POST /api/demo/reset`.
- **Máy thử:** máy tính bảng Lenovo `HA23HL0V` (Android 14, không SIM) đang cắm, đã cài APK bản `b4d1386` (chưa có commit `3283204`), máy chủ trỏ địa chỉ public, công tắc "AI nói trực tiếp" bật. Màn hình tự tắt thì trang WebView ngừng vẽ và lệnh chụp CDP treo; máy có khóa màn hình, không tự mở khóa, nhờ người dùng. Điện thoại Xiaomi của người dùng `t8u4rgq8qoh6pnbu` (thử cuộc gọi, ghi âm, SMS thật) chưa cắm.
- **Công cụ thử** (trong `/tmp/claude-1000/`, có thể mất khi khởi động lại): `lcs-tab/cdp.mjs` (trang trong GoiVideoActivity), `lcs-tab/cdpa.mjs` (trang app React), `lcs-tab/dat-may-chu.py` (đặt ô máy chủ qua run-as), `lcs-tab/shot.sh`, `lcs-tab/di-man.mjs`, `lcs-tab/thao-tac.mjs`, `lcs-tab/canh-dien*.mjs`. Máy ảo `lcs-test` (`ANDROID_AVD_HOME=~/.config/.android/avd`) đã tắt vì thiếu RAM.

## 4. Việc còn lại (theo thứ tự)
1. Build lại APK (có `3283204`), cài lên máy tính bảng.
2. Thử trang web đội qua địa chỉ public `/web`: đăng nhập 3 mã; hồ sơ `0909 555 666` (5 máy W3): Khoa xác nhận → vàng; Lan Anh xác nhận → vẫn vàng (S2 = 5 < 10); không ai bỏ phiếu 2 lần; trưởng đội gỡ khiếu nại của `028 9999 1234` (bà Hoa tạo khiếu nại ở màn kết quả, mã `246810`) → về Chưa rõ; trưởng đội phát cảnh báo. Đặt lại dữ liệu mẫu sau khi thử.
3. Thử vai Người thân trên máy tính bảng: Cá nhân → Đổi vai → Người thân, mã `gia-dinh-hoa`; vai bà gửi "Hỏi người thân" → thông báo Android hiện, bấm vào đúng cảnh báo, trả lời, "Mẹ đã xem".
4. Câu `headline` mức đỏ đang là "Có 7 máy báo cuộc gọi hiển thị số này có dấu hiệu đáng ngờ" — nên mạnh hơn theo tài liệu ("…đã bị N người báo là đòi chuyển tiền. Đội tình nguyện đã kiểm tra.").
5. Lượt AI trực tiếp đôi khi hỏng (Gemini đọc lặp cả câu hai lần liền → 503 → trang dùng câu thu sẵn). Ý tưởng chưa làm: thay vì đọc lại, cắt đôi bản đọc lặp ở chỗ lặng giữa câu. Thời gian chờ hiện 40 s (máy) / 45 s (trang).
6. Thử trên điện thoại Xiaomi thật: cuộc gọi có ghi âm → AI → Bé Nai hỏi → "Báo cuộc vừa nhận" → Minh xác nhận → số lên vàng ngay ở mọi kênh; báo SMS; rút báo cáo. Sau đó đẩy nhánh, cập nhật PR #2 và `BAN-GIAO.md`.
7. Hỏi người dùng về `zalo-mini-app/` (xóa hay giữ). ID người dùng gửi `2402067536671046092` có thể là ID Zalo App chứ không phải Mini App.

## 5. Quy tắc an toàn đang áp dụng
Không in, ghi nhật ký hay gửi khóa đi đâu. Không gõ mật khẩu. Không thao tác app cá nhân trên máy người dùng, kiểm tra app đang ở trên cùng trước khi chạm. Không nạp khóa AI lên máy mượn. Commit và đẩy lên `android-and-lessons` đã được phép, nhưng người dùng muốn thử máy thật trước khi đẩy.

## 6. Cách dùng Codex
`codex exec --skip-git-repo-check -s workspace-write -C <thư mục> -m gpt-6.2-astra -c service_tier=fast -c model_reasoning_effort=high -o <báo cáo> < <đề bài>` (thêm `--add-dir $HOME/.gradle --add-dir $HOME/.android` khi đụng Android; `-i ảnh.png` để gửi ảnh thiết kế). Ảnh: `-m gpt-6.1-sol`. Chế độ nhanh đã bật mặc định trong `~/.codex/config.toml`. Đề bài mẫu của phiên này ở `/tmp/claude-1000/lcs-app/` (`job-*.md`, `brief-*.md`). Luôn đọc báo cáo và diff, tự build và thử trước khi commit.
