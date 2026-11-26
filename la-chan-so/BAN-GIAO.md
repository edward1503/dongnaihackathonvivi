# Bàn giao · mảng 1 (Android chạy nền) và mảng 4 (học như chơi game)

Viết ngày 25/11/2026 để một phiên Claude khác làm tiếp. Người phụ trách hai mảng là Hoàng (đội Doi18, Đề 4 "Lá chắn số", Hackathon thành phố Đồng Nai 2026). **Trả lời người dùng bằng tiếng Việt.** Mục 9 cuối tệp là trạng thái của hai subagent lúc dừng.

## 1. Đọc gì trước

| Tệp | Để làm gì |
|---|---|
| `BAN-GIAO.md` (tệp này) | Trạng thái chung, luật phải giữ, việc còn lại |
| `ban-giao/avatar-goi-video.md` | Ghi chú chi tiết phần gọi video với anh Minh và chú Tư |
| `ban-giao/bai-hoc.md` | Ghi chú chi tiết phần bốn bài học |
| `android/README.md` | Kiến trúc app Android, số đo, ghi chú thiết bị, cuộc gọi video |
| `android/HOP-DONG-DU-LIEU.md` | Hợp đồng dữ liệu với máy chủ chung của đội (tên tiếng Anh) |
| `bai-hoc/KICH-BAN-BAI-HOC.md` | Kịch bản 10 bài, các dạng bài tập, phân vai avatar, giọng |
| `KICH-BAN-THOAI.md` | Luật viết lời nói |
| `~/.claude/projects/-home-rin/memory/*.md` | Các bài học người dùng đã dặn (giọng Gemini, kiểm cái đã có trước) |

## 2. Kho và nhánh

- Kho: `/home/rin/dongnaihackathonvivi` (remote `origin` = GitHub `edward1503/dongnaihackathonvivi`), thư mục làm việc `la-chan-so/`, nhánh hiện tại `android-and-lessons` (trùng `main` ở `91dfbfc`).
- **CHƯA COMMIT GÌ.** Toàn bộ `android/`, `bai-hoc/`, `prototype/hoc*`, `prototype/canh/`, các bộ giọng, tranh mới đều chỉ nằm trên máy này. `git status`: 7 tệp sửa, 53 mục chưa theo dõi. **Người dùng chưa cho phép commit**; đã hỏi hai lần, chưa trả lời. Chỉ commit hay đẩy lên khi người dùng bảo.
- Nhánh của đồng đội (đã `git fetch`, chưa gộp):
  - `origin/tuan` (Tuấn, mảng 2 và 3): máy chủ FastAPI `server/`, app React 19 + Vite `app/` (18 màn), sửa `prototype/video-call.html`.
  - `origin/mang-5-6-zalo-web-tinh-nguyen` (Đức, mảng 5 và 6): đã gộp `tuan`, thêm `mvp/` (trang Zalo và web tình nguyện). **Tích hợp nhắm vào nhánh này.**
  - Tệp đụng nhau duy nhất: `prototype/video-call.html`. Bản của Tuấn (giữ nút để nói, máy chủ chấm) và bản của mình (kết hợp thu sẵn với trực tiếp, nhiều cảnh, khẩu hình gốc) đã rẽ xa; kế hoạch là giữ bản của mình làm gốc và thêm đường gọi `/api/roleplay/start|turn|finish` khi chạy trên trình duyệt.
  - Hai điểm cần báo Tuấn: câu mở đầu của họ còn dùng `chi-lan-1.m4a` bản cũ (dính lời dặn giọng 10 giây đầu, bản mình đã cắt); giọng trực tiếp của họ phát thẳng từ Gemini, chưa cắt cụm nhiễu đuôi (chưa nghe thử, chỉ đọc mã).

## 3. Đã đồng bộ với máy chủ chung (xong, chưa thử trên điện thoại)

- Mọi lời gọi máy chủ của app Android đã theo bộ tên tiếng Anh của đội. Chỗ duy nhất biết tên trên đường truyền: `android/app/src/main/java/vn/doi18/lachanso/Api.kt` (+ `ApiTest.kt`, 7 bài kiểm). Bảng đầy đủ ở `android/HOP-DONG-DU-LIEU.md`.
- Cuộc gọi video dùng `POST /api/roleplay/intent` và `POST /api/roleplay/speak` (chỉ có trên `android/may-chu-gia.py`; máy chủ chung chưa có, app không cần khi đã nhập khóa trong app).
- Đã thử: dựng máy chủ của Tuấn trong thư mục tạm (venv riêng, không khóa AI; 51/53 bài kiểm của họ đạt, 2 bài hỏng vì tệp tĩnh không có trong bản tách) rồi gửi đúng dạng yêu cầu của `Api.kt`: cả 6 lời gọi trả đúng trường. `may-chu-gia.py` nói cùng hợp đồng, đã thử.
- Luật quan trọng trong `Api.kt`: máy chủ không được làm nhẹ đi cảnh báo app đã tự thấy; kết quả `source: "fallback"` của bản ghi âm (bản chép lời MẪU của chế độ trình diễn) bị bỏ.
- Người dùng muốn **đồng bộ tiếng Anh cho chuyên nghiệp** và **không nhắc lại thứ đã bỏ** trong tài liệu. Tên biến, tên hàm bên trong Kotlin và JS vẫn tiếng Việt (không đi qua mạng); đổi cả phần đó là việc lớn, chưa ai yêu cầu rõ.
- Việc còn lại với đồng đội: cầu nối `window.LCSNative` cho app React (10 hàm: `speak`, `listen`, `call`, `blockNumber`, `recentCalls`, `weekStats`, `openStory`, `openSettings`, `analyzeRecording`, `dismissStop`), nhúng `app/dist` vào APK. Các màn đổ chuông, sau cuộc gọi, Dừng lại trên máy thật phải dùng bản gốc Android (WebView không phủ lên cuộc gọi được). Những thứ cần chốt với Tuấn liệt kê ở cuối `HOP-DONG-DU-LIEU.md`.

## 4. Cuộc gọi video với avatar (mảng 4)

- Chế độ **kết hợp** người dùng đã duyệt: câu cố định (mở đầu, tiếng chờ "ờ… để chị coi", hỏi lại khi im lặng hay nghe không rõ) lấy từ bộ **thu sẵn**, phát ngay với video miệng dựng sẵn; câu đáp theo lời người học do `gpt-6-luna` viết và **Gemini đọc trực tiếp**, lọc rẹt ngay trên máy (`HieuY.locRet`). Đo trên điện thoại: bấm gọi tới lúc nói câu mở đầu 0,8 giây; một lượt gõ tới lúc chị Lan đáp khoảng 12 giây (gồm một tiếng chờ). Người dùng thấy nhanh, chấp nhận.
- **Kho giọng đã lưu** (`KhoGiong.kt`): mọi câu AI đã đọc (tiếng đã lọc) và mọi lượt AI đã đáp được giữ trong máy; hết lượt API vẫn phát lại được để quay video giới thiệu. `tools/keo-giong.sh` kéo về `bai-hoc/kho-giong/` (kèm `.wav`), `tools/keo-giong.sh day` đẩy ngược vào máy.
- **Nhiều khóa Gemini trong app** (mới, đã dựng, chưa cài): ô "Khóa giọng đọc" nhận nhiều khóa cách nhau dấu phẩy, tự chuyển sang khóa kế khi một khóa bị từ chối (`HieuY.goiGiong`).
- Bốn cảnh: `lan-2` (chị Lan, avatar 21, giọng Aoede), `minh-1`, `minh-3` (anh Minh, avatar 125, giọng Achird), `tu-9` (chú Tư, avatar 117, giọng Algenib). Mở bằng `prototype/video-call.html?canh=<mã>`. Chi tiết, kết quả kiểm và việc dở: `ban-giao/avatar-goi-video.md`.
- Hai câu thu sẵn **dạy sai**, phải gỡ hoặc thu lại: anh Minh hỏi "mẹ gọi con bằng số nào" (dễ khiến bà đọc số thật; đúng là "mẹ tìm số của con ở đâu"), chú Tư nói "rời nhóm rồi báo cáo" (đúng: lưu tin nhắn, báo cáo, rồi mới rời nhóm). Câu đồng tình của Minh, chú Tư chỉ phát khi người học trả lời an toàn.

## 5. Bốn bài học (mảng 4)

- Trang `prototype/hoc.html` + `prototype/hoc/` (HTML, CSS, JS thuần, không React; nội dung từ JSON). Năm dạng bài tập: chạm bắt bài, thật hay lừa, nối lời với chiêu, việc nào trước, nghe và bấm Dừng; mỗi dạng có bản chữ lớn cho người cao tuổi.
- Bốn bài, **số hiển thị 1–4** theo `prototype/hoc/danh-sach.json`: 1 cơ quan chức năng (`bai-01`), 2 việc nhẹ lương cao (`bai-02`), 3 người thân gặp nạn (`bai-03`), 4 đầu tư lãi cao (`bai-09`). Người học không bao giờ được thấy hay nghe số nội bộ ("Bài 9").
- `?kieu=` nhận cả mã của bài (`gia-danh-co-quan`) lẫn mã của máy chủ (`gia_danh_cong_an`) qua bảng bí danh; mã không có bài thì mở thư viện.
- Hợp đồng với cuộc gọi: đi `video-call.html?canh=<mã>&ve=hoc.html%3Fbai%3D<n>%26sau%3Dgoi`; cuộc gọi ghi `localStorage['lcs-goi-<mã>'] = {diem, tong, luc}` rồi quay về `ve` (chỉ nhận đường tương đối bắt đầu bằng `hoc.html`).
- Kiểm tự động: `node tools/kiem-bai-hoc.mjs` (hai cỡ màn). Chi tiết giọng, tranh, nhận xét của Astra, việc dở: `ban-giao/bai-hoc.md`.
- **Lệch quy trình đã báo người dùng:** lời Bé Nai trong bài học từng phải tách 2–4 lượt mỗi bài vì hạn mức. Hạn mức đã có lại; subagent cuối được dặn thu lại một lượt mỗi bài.

## 6. Điện thoại và máy ảo

- Điện thoại thật: Xiaomi M2012K10C (MIUI), serial `t8u4rgq8qoh6pnbu`, cắm USB khi người dùng báo; **người dùng hay rút ra**, hỏi trước khi cần.
- Trên máy đang cài bản có chế độ kết hợp, **chưa có**: kho giọng, đồng bộ API tiếng Anh, nhiều khóa Gemini, hai avatar mới, bài học. App trong máy đang lưu khóa OpenAI và một khóa Gemini cũ.
- Dựng và cài:
  ```bash
  export JAVA_HOME=$HOME/.local/jdk17 PATH=$HOME/.local/jdk17/bin:$HOME/Android/Sdk/platform-tools:$PATH
  cd la-chan-so/android && ./gradlew --no-daemon -q assembleDebug testDebugUnitTest   # xem kết quả dựng TRƯỚC khi cài
  adb -s t8u4rgq8qoh6pnbu install -r app/build/outputs/apk/debug/app-debug.apk
  P=vn.doi18.lachanso; for q in SYSTEM_ALERT_WINDOW 10021 10020; do adb -s t8u4rgq8qoh6pnbu shell appops set $P $q allow; done
  adb -s t8u4rgq8qoh6pnbu shell pm grant $P android.permission.RECORD_AUDIO          # MIUI xóa quyền sau MỖI lần cài đè
  python3 ../tools/nap-khoa.py t8u4rgq8qoh6pnbu                                       # nạp khóa từ la-chan-so/.env, không in
  ```
- Lái trang trong app: `adb forward tcp:9222 localabstract:webview_devtools_remote_$(adb shell pidof vn.doi18.lachanso)` rồi dùng các công cụ ở `ban-giao/cong-cu/` (`cdp-eval.mjs '<biểu thức JS>'`; trang lộ `window.__call` để đọc trạng thái).
- APK debug khoảng 219,5 MB. Còn lớn mà đang dùng: tiếng và hình miệng 74 MB, avatar 52 MB, onnxruntime hai kiến trúc 40 MB (bản phát hành chỉ cần arm64, bớt khoảng 22 MB), tranh PNG khoảng 45 MB (đổi WebP sẽ nhỏ nhiều).
- Máy ảo: AVD `lcs34` (`ANDROID_AVD_HOME=$HOME/.config/.android/avd`), luôn gọi `-s emulator-5554`. Không có micro, không tiếng.

## 7. Khóa API

- `la-chan-so/.env` (git bỏ qua, quyền 600): `OPENAI_API_KEY` (người dùng dán, dùng được) và `GEMINI_API_KEYS` (6 khóa đọc được giọng lúc 25/11 chiều, đã bỏ một khóa hết hạn mức). **Dùng tệp này.**
- `/run/media/rin/Rin/AI-Thuc-Chien/vlearn-lesson-lab/.env`: 7 khóa Gemini gốc (một khóa hết hạn mức). Nếu phải dùng thì **chỉ lấy `GEMINI_API_KEYS`**: một subagent từng lấy nhầm biến khác trong tệp này (đã báo người dùng).
- Không bao giờ in, ghi nhật ký, lưu hay gửi giá trị khóa đi đâu ngoài nhà cung cấp; nạp vào môi trường của tiến trình. Hạn mức Gemini TTS tính theo phút và theo project: gọi giãn ra.

## 8. Luật phải giữ

- **Giọng:** chỉ Gemini TTS (giọng OpenAI người dùng đã chê, đã bỏ). Mỗi giọng thu **một lượt dài** rồi cắt; sửa một chữ là thu lại cả lượt. Mọi tiếng Gemini phải lọc rẹt (`tools/loc-giong.py`), cắt cụm nhiễu đuôi (mỗi lần gọi lẻ đều có, xem bộ nhớ), nghe lại bằng `tools/nghe-lai.py` hỏi đích danh về lời dặn bị đọc lẫn; đọc bản chép, đừng tin dòng kết luận. Clip dưới 1 giây cần người nghe.
- **Gỡ lỗi:** soi tệp, tiếng, nhật ký đã có trước, đừng gọi API tạo mới (người dùng đã nhắc).
- **Thiết kế:** app chỉ màn dọc, không thanh trạng thái giả; avatar chỉ đóng người được giúp, kẻ gian luôn là hình vẽ có nhãn "Mô phỏng · AI đóng vai"; không quốc huy, bản đồ, logo thật, mặt người thật; viết "thành phố Đồng Nai"; giao diện theo `ds.css`; linh vật Bé Nai.
- **Review:** người dùng muốn review kỹ, nhiều vòng tới khi ổn. Lệnh Astra: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.2-astra -c service_tier=fast -c model_reasoning_effort=high -o <ra.md> - < loi-nho.txt` (chạy nền bằng nohup, vài phút).
- **Subagent:** người dùng muốn tận dụng subagent, dùng model Opus. Chia việc theo tệp để khỏi đụng nhau.
- **Không được:** sửa kho vlearn-lesson-lab hay kho Nestle (chỉ đọc, chép); đụng máy chủ dựng hình `minhhoang@100.126.179.21` (tuyệt đối không đụng container `sc2-tradeagent`, không gõ mật khẩu SSH); sửa thư mục nộp `~/Doi18_De4`; triển khai video đi đâu; tải và chạy tệp nhị phân của bên thứ ba (một lần tải ffmpeg tĩnh để chạy trên điện thoại đã bị chặn, đừng thử lại khi người dùng chưa đồng ý); commit hay đẩy khi chưa được bảo.
- **Giấy phép** ba avatar LiteAvatar chưa ai kiểm cho cuộc thi.

## 9. Trạng thái hai subagent lúc dừng

Cả hai đã dừng lúc khoảng 15:20, tệp nhất quán, không còn tiến trình nền, máy ảo đã gỡ khóa và tắt. Thư mục tạm của chúng đã chép vào `ban-giao/tam-nv/` và `ban-giao/tam-hoc/` (git bỏ qua, 134 MB); trong `ban-giao/bai-hoc.md`, `$S` nghĩa là `ban-giao/tam-hoc`. Đọc mục "Phiên Opus" ở cuối mỗi ghi chú: nó mới hơn các mục phía trên.

**Gọi video với anh Minh, chú Tư** (`ban-giao/avatar-goi-video.md`)
- Xong: hai avatar, bốn tệp cảnh, 71 câu thu sẵn kèm hình miệng, `video-call.html?canh=…`, hợp đồng với bài học, nút trong app không hiện số bài, review Astra đã sửa. Kiểm luật và tệp cảnh 375/375. APK 219,5 MB (đổi bước chép web từ `Copy` sang `Sync`, bỏ tệp cũ bị chở theo).
- Hai câu dạy sai đã **gỡ tạm** khỏi bộ lời và lời nhắc AI. Đã thu lại mỗi giọng một lượt với lời mới (`tam-nv/take2/`): Minh đã cắt và lọc, chưa nghe lại; chú Tư chưa cắt. Chưa thay vào `prototype/audio/`.
- Dở: kiểm trang trên máy tính cho `minh-3`, `tu-9` (phải chạy lại, chưa xem ảnh); trên máy ảo mới thử `minh-3`; chưa thử nhánh lùi khi AI hỏng, nút "Bài học", đi từ bài học sang cuộc gọi và quay về, nút Quay lại; chưa cập nhật `android/README.md`; `bai-hoc/nghe-thu/CAN-NGHE.md` viết cho bộ giọng cũ, phải viết lại.
- Đề xuất sửa kịch bản: câu mở của chú Tư thành "A lô, Vy đó hả con? …" (tên không đứng đầu câu).

**Bốn bài học** (`ban-giao/bai-hoc.md`)
- Xong: kịch bản đã rà và sửa, ba lượt Astra, trình phát và 5 dạng bài tập, 4 tệp bài, 5 tranh + bảng nhân vật ông Tư, số hiển thị 1–4, bảng bí danh `?kieu=`. Kiểm tự động 1254 đạt, 0 lỗi (trước khi thay giọng Bài 2). Nguồn sự thật là 4 tệp JSON trong kho (tệp sinh đã nghỉ).
- Giọng: Bé Nai Bài 2 đã thu lại đúng **một lượt** bằng 3.8 (22 câu), đã cắt và lọc, chưa nghe. Bé Nai Bài 9, 3, 1 chờ thu (`tam-hoc/thu-bn.sh 9 3 1`). Bà Hoa, ông Tư, Vy, người gọi nữ chưa nghe lại. Cảnh báo "đọc lặp" của công cụ là báo nhầm do mốc giờ `00:23` bị đếm thành chữ.
- Dở: tờ nghe `CAN-NGHE-BAI-HOC.md`, xem 8/11 tờ ảnh ghép còn lại, chạy `tam-hoc/khu-hoi.mjs` (đi thật từ bài học sang cuộc gọi), Astra lượt cuối.
- APK bản dựng gần nhất có thể chưa gồm thay đổi nhiều khóa Gemini của phiên chính: **dựng lại trước khi cài**, xóa `app-debug.apk` trước để số đo dung lượng đúng.

## 10. Việc còn lại, theo thứ tự đề xuất

1. Đọc mục 9, hoàn tất phần dở của hai subagent (ghi chú chi tiết ở `ban-giao/`).
2. Khi người dùng cắm USB: dựng, cài, cấp lại quyền MIUI, `tools/nap-khoa.py`, rồi thử trên máy thật: bốn cảnh gọi video (nghe tiếng thật, micro, chế độ gõ), đi từ bài học sang cuộc gọi và quay về, nút Quay lại, lời gọi máy chủ nếu có máy chủ chạy.
3. Người dùng nghe các tờ `bai-hoc/nghe-thu/CAN-NGHE*.md` (giọng cần tai người).
4. Hỏi lại người dùng: cho commit lên `android-and-lessons` chưa. Có commit thì gộp `origin/mang-5-6-zalo-web-tinh-nguyen`, xử lý `video-call.html`, làm cầu nối `LCSNative`, nhúng `app/dist`.
5. Cập nhật `android/README.md` nếu subagent chưa làm; chạy một vòng Astra trên toàn bộ phần Android đã đổi từ vòng review thứ tư.
6. Còn treo từ trước: 6 câu thiếu và 6 câu cần viết lại trong bộ của chị Lan (phải thu lại cả lượt); thử nhánh im lặng và lỗi micro trên máy thật; cuộc gọi đến và tin nhắn thật cần máy thứ hai; phân tích bản ghi âm cần một bản ghi cuộc gọi thật; đối chiếu 10 kiểu lừa đảo với đề.
