# Lá chắn số · phần chạy nền trên Android (mảng 1)

Ứng dụng Kotlin thuần, không Compose, một thư viện ngoài (`androidx.core`). Gồm sáu tính năng N1–N6 trong [`../PHAN-CONG-TINH-NANG.md`](../PHAN-CONG-TINH-NANG.md). Màn chính hiện tại chỉ là bảng điều khiển để thử; giao diện đầy đủ của app (mảng 3) sẽ thay nó.

## Build và cài

Cần JDK 17 và Android SDK (platform 35, build-tools 36.0.0). Tạo `local.properties` chứa `sdk.dir=<đường dẫn SDK>`.

```bash
./gradlew assembleDebug                       # ra app/build/outputs/apk/debug/app-debug.apk
./gradlew testDebugUnitTest                   # bài kiểm tra phần lọc tin nhắn, hiểu "có/không", chuẩn hóa số
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Cài bằng `adb install` thì Android không coi là app "cài từ nguồn lạ bị hạn chế". Nếu gửi tệp APK rồi bấm cài trên máy, Android 13 trở lên sẽ khóa mục "Đọc thông báo": vào Thông tin ứng dụng, bấm dấu ba chấm, chọn "Cho phép cài đặt bị hạn chế".

## Mã nằm ở đâu

| Tệp | Tính năng |
|---|---|
| `CuocGoi.kt` | N1 sàng lọc cuộc gọi; thẻ cảnh báo khi đổ chuông (đỏ, vàng) có nút "Chặn số này"; nhãn nhẹ cho số chỉ có nhãn cộng đồng; cảnh báo cả khi gọi đi tới số bị báo; theo dõi trạng thái cuộc gọi; quyết định sau cuộc gọi; N2 tìm bản ghi âm của máy |
| `HoiSauCuocGoiActivity.kt` | N3 Bé Nai hỏi một câu bằng giọng nói, hai nút Có và Không; kể lại cuộc gọi bằng giọng nói; kết quả và báo người thân; N2 gửi bản ghi đi chép lời |
| `TinNhan.kt` | N4 đọc thông báo, bỏ qua tin có mã xác thực, lọc sơ bộ trên máy, tra số gửi, che số, màn phân tích tô đỏ dấu hiệu; bộ luật riêng cho lời kể |
| `DungLai.kt` | N5 dịch vụ chạy nền canh ứng dụng ngân hàng, màn "Dừng lại" (sau cuộc gọi và đang gọi, có nút "Cúp máy ngay"); báo "Lá chắn đang ngủ" khi mất một lớp |
| `ThietLap.kt` | N6 kiểm tra và xin từng quyền, riêng phần cho máy Xiaomi |
| `TraCuu.kt` | Tra số (máy chủ trước, dữ liệu trên máy sau), quy tắc "số quen", lớp gọi máy chủ |
| `NenTang.kt` | Cài đặt, xưng hô, nhật ký, thông báo, giọng Bé Nai |
| `MainActivity.kt` | Trạng thái ba lớp, cài đặt, nút giả lập, nhật ký |

Quy tắc "khi nào lên tiếng" (màn D05) nằm ở hai chỗ: `SauCuocGoi.xuLy` và `DichVuLaChan.kiemTra`. Quy tắc "số quen" ở `SoQuen` trong `TraCuu.kt`, theo đúng D05: hai cuộc gọi đi từ 30 giây vào hai ngày khác nhau trong 60 ngày, hoặc có trong danh bạ, hoặc chủ máy bấm "Tôi biết số này". Số lạ nghe lâu thì mỗi ngày hỏi tối đa một câu. Ngưỡng 5 phút và khoảng canh 10 phút ở `CaiDat.nguongGiay`, `CaiDat.cuaSoGiay`; "Chế độ trình diễn" (mặc định tắt) rút xuống 15 giây và 2 phút, và bỏ giới hạn một câu mỗi ngày.

Mã đã qua ba vòng review của Astra (`gpt-6.2-astra`); các lỗi đã sửa và các điểm cố ý giữ nguyên ghi ở mục "Giới hạn đã biết".

## Nối với mảng 2

App gọi máy chủ theo [`HOP-DONG-DU-LIEU.md`](HOP-DONG-DU-LIEU.md) (bản đề xuất, mảng 2 chưa xác nhận). Chưa có máy chủ thật thì chạy máy chủ giả:

```bash
python3 may-chu-gia.py 8787      # rồi nhập http://<IP máy tính>:8787 vào ô "Máy chủ của đội" trong app
```

Không có máy chủ, app vẫn chạy bằng dữ liệu trên máy (trùng `prototype/mock-data.js`), và khi đó không báo được cho người thân: màn kết quả ghi rõ "Chưa báo được" và đưa nút gọi thẳng.

## Thử trên máy Xiaomi

Mở app, bấm "Thiết lập lá chắn", bật hết các dòng (kể cả ba dòng ở mục "Giữ Lá chắn không bị máy tắt"), nhập tên và số người thân, bật "Chế độ trình diễn".

| Tính năng | Cách thử | Kết quả mong đợi |
|---|---|---|
| N1 | Nhập số của một máy khác vào ô "Số máy gọi thử" rồi bấm Lưu, sau đó dùng máy ấy gọi tới. Hoặc bấm "Thẻ cảnh báo khi đổ chuông" | Thẻ đỏ "Nghi lừa đảo" nổi trên màn đổ chuông, kèm thông báo |
| N3 | Nghe cuộc gọi từ số đó rồi cúp; hoặc nghe một số chưa quen quá 15 giây; hoặc bấm "Bé Nai hỏi sau cuộc gọi lạ" | Màn Bé Nai hỏi, đọc thành tiếng, nhận "có" hoặc "không" bằng giọng hoặc nút |
| N2 | Bật ghi âm cuộc gọi của máy, chọn thư mục ghi âm trong Thiết lập, chạy máy chủ giả, rồi làm như N3 | Màn "AI đang chép lời" rồi kết quả kèm bản chép lời |
| N4 | Gửi tới máy tin SMS có nội dung như nút "Tin nhắn việc nhẹ lương cao"; hoặc bấm nút đó | Thông báo "Tin nhắn đáng ngờ", bấm vào thấy tin được tô đỏ từng dấu hiệu |
| N5 | Bấm "Mở 2 phút canh app ngân hàng" rồi mở app ngân hàng; hoặc làm sau N3 | Màn đỏ "DỪNG LẠI" đè lên, đọc thành tiếng |
| N6 | Tắt một quyền bất kỳ rồi mở lại app | Thẻ trạng thái đổi sang vàng hoặc đỏ "Lá chắn đang ngủ" |

**App ngân hàng và gỡ lỗi USB.** Nhiều app ngân hàng tự chặn khi máy bật gỡ lỗi USB. N5 chỉ cần biết app ngân hàng vừa được đưa lên màn hình, nên màn "Dừng lại" vẫn phải hiện dù app ngân hàng đang hiện thông báo chặn. Nếu cần thử trọn vẹn: nhập tên gói của một app bất kỳ (ví dụ máy tính bỏ túi) vào ô "Gói ứng dụng thử", hoặc tắt gỡ lỗi USB rồi xem mục Nhật ký ngay trong app.

## Đã thử tới đâu

Thử trên máy ảo Android 14 (Pixel 6, ảnh hệ thống Google APIs), quyền cấp bằng `adb`, cuộc gọi và SMS giả bằng `adb emu gsm call|accept|cancel` và `adb emu sms send`:

| Tình huống | Kết quả |
|---|---|
| Số bị báo gọi tới, máy mở khóa và máy đang khóa | Thẻ đỏ nổi khi đổ chuông, tự ẩn sau khi nghe máy |
| Bấm "Chặn số này" trên thẻ | Cuộc gọi đang đổ chuông bị ngắt; lần sau số đó gọi tới bị từ chối |
| Số chỉ có nhãn cộng đồng gọi tới | Nhãn nhẹ "23 người từng gắn nhãn giao hàng", không cảnh báo |
| Nghe rồi cúp | Bé Nai hỏi; "Có" ra màn Nguy hiểm, "Không" ra màn xanh và vẫn canh app ngân hàng vì số đang bị báo |
| Có máy chủ giả | Tra số qua máy chủ; báo người thân thành công mới hiện "Đã báo cho Minh"; không có máy chủ thì hiện "Chưa báo được" |
| Có bản ghi âm trong thư mục đã chọn (N2) | App tìm thấy tệp, gửi lên máy chủ giả, hiện kết quả kèm bản chép lời |
| Số lạ chưa ai báo, nghe 3 giây | Im lặng |
| Đang nghe số lạ 17 giây rồi mở app thử | Màn "Dừng lại" kiểu đang gọi; nút "Cúp máy ngay" ngắt được cuộc gọi |
| Mở app thử sau cuộc gọi đáng ngờ | Màn "Dừng lại"; bấm Home thì đóng hẳn, lần sau vẫn hiện lại |
| Gọi đi tới số bị báo | Thẻ cảnh báo hiện, cúp máy xong Bé Nai hỏi |
| SMS lừa đảo, SMS có OTP, SMS thường | Cảnh báo và màn tô đỏ dấu hiệu; bỏ qua; im lặng |
| Thu hồi một quyền rồi cấp lại | Trong 1 phút có thông báo "Lá chắn đang ngủ"; cấp lại thì thông báo tự gỡ |
| Màn "Kể lại bằng giọng nói" | Mở được; chưa nói gì mà bấm "Kể xong" thì quay lại câu hỏi |

Thử lại sau hai vòng sửa theo review:

| Tình huống | Kết quả |
|---|---|
| Máy chủ trả `{"loi": …}` thay cho `ok: true` khi báo người thân | Màn kết quả ghi "Chưa báo được cho Minh" |
| Có hai tệp ghi âm mới, một tệp mang số vừa gọi trong tên | App gửi đúng tệp mang số đó |
| App bị tắt giữa cuộc gọi (tắt tiến trình bằng tay), rồi cúp máy | App tự xem lại nhật ký cuộc gọi, Bé Nai vẫn hỏi |
| SMS "Mã dùng một lần 482913…" | Bỏ qua, không phân tích |
| SMS giao hàng thật có đường dẫn rút gọn; SMS ngân hàng dặn "không cung cấp mật khẩu" | Im lặng |
| SMS báo khóa tài khoản kèm tên miền lạ | Cảnh báo, 3 dấu hiệu |

Chưa thử được trên máy ảo: gọi đi rồi hủy trước khi bên kia nghe (máy ảo tự nối máy mọi cuộc gọi đi), nút giả lập "Bé Nai hỏi" sau khi sửa, cuộc gọi chờ, hai SIM.

Chưa thử: mọi thứ cần tiếng thật (máy ảo chạy không tiếng) gồm nghe "có/không", kể lại bằng giọng nói, giọng Bé Nai; bản ghi âm thật của trình gọi điện; và mọi thứ riêng của Xiaomi.

## Gọi video với nhân vật AI (mảng 4, H3)

`GoiVideo.kt` mở trang `prototype/video-call.html` ngay trong app (WebView; Gradle chép trang và nhân vật vào `assets/web` lúc build, không có bản thứ hai trong git). Nút thử ở màn chính: "Gọi video chị Lan", "Gọi video với anh Minh · cuộc gọi giả công an", "Gọi video với anh Minh · tin báo người thân gặp nạn", "Khuyên chú Tư · đầu tư lãi cao", và "Bài học" (mở `prototype/hoc.html` của mảng bài học trong cùng màn WebView).

### Các cảnh gọi video

Trang gọi video nhận `?canh=<mã>` (mặc định `lan-2`). Mỗi cảnh là một tệp `prototype/canh/<mã>.json`; nhân vật (avatar, nền, giọng Gemini, lời dặn giọng) nằm ở `prototype/nhan-vat.json`.

| Cảnh | Bài | Nhân vật, avatar, giọng | Người học đóng | Số ý chấm | Bộ câu thu sẵn |
|---|---|---|---|---|---|
| `lan-2` | 2 | Chị Lan, 21, Aoede | Vy | 4 | `loi-chi-lan.json`, 95 câu, `audio/lan/` |
| `minh-1` | 1 | Anh Minh, 125, Achird | bà Hoa (mẹ) | 2 | `loi-minh.json`, câu tiền tố `b1-` và câu dùng chung, `audio/minh/` |
| `minh-3` | 3 | Anh Minh, 125, Achird | bà Hoa (mẹ) | 2 | `loi-minh.json`, câu tiền tố `b3-` và câu dùng chung |
| `tu-9` | 9 | Chú Tư, 117, Algenib | Vy | 4 | `loi-tu.json`, câu tiền tố `b9-` và câu dùng chung, `audio/tu/` |

- **Tệp cảnh giữ:** tên và cách xưng hô trên màn hình (`chu`; hai cảnh của anh Minh gọi người học là "bà", chữ lớn, có hai nút trả lời sẵn `nut`), các ý được chấm (`y`: mã, nhãn thẻ, luật ngoại tuyến), bộ câu thu sẵn và tiền tố câu riêng (`bo_loi`, `tien_to`), ảnh tĩnh (`anh`), lời nhắc cho AI và tên vai trong đoạn trò chuyện gửi cho mô hình (`song`, `tra_loi`), mã nhân vật trong kho giọng (`ma_kho`).
- **Hai máy chọn câu thu sẵn.** Chị Lan giữ máy riêng (`prototype/hoi-thoai.js`). Các cảnh mới dùng máy chung `prototype/hoi-thoai-canh.js`, chạy theo luật từ khóa trong tệp cảnh: phủ định đứng sát cụm khớp thì không tính, lời nhắc lại của kẻ gian không tính, câu hỏi lại và câu gạt đi ("báo cáo làm gì cho mệt") không được ý nào. Chạy thử bằng chữ: `node tools/thu-hoi-thoai.mjs --canh tu-9 "không chú ơi" …`.
- **Avatar 117 và 125** chép từ `vlearn-lesson-lab/tools/stage-demo/avatars/`, khẩu hình dùng tạm bộ khớp miệng của avatar 21 (khớp trên giọng nữ). Dựng lại hình miệng cả bộ: `tools/dung-bo-loi.sh minh` (hoặc `tu`).
- **Giọng anh Minh và ông Tư** mỗi người thu một lượt dài (127 giây và 143 giây) rồi cắt, lọc rẹt, nghe kiểm bằng hai mô hình máy độc lập. **Chưa có người nghe.** Kết quả từng câu ghi ở trường `kiem` trong `loi-minh.json`, `loi-tu.json`: câu ghi `can-nghe` (5 câu của Minh, 8 câu của ông Tư) và `ngan` phải có người nghe trước buổi trình diễn; sửa câu nào thì thu lại cả lượt.
- **Hợp đồng với trang bài học.** Trang bài học mở cuộc gọi bằng đường dẫn thường `video-call.html?canh=<mã>&ve=<địa chỉ quay về>`. Gọi xong (kể cả kết thúc sớm) trang ghi `localStorage['lcs-goi-<mã>'] = {"diem","tong","luc"}` (lần gọi mới nhất ghi đè lần trước), và nút chính của màn kết quả đưa về `ve`. `ve` chỉ được là `hoc.html` cùng thư mục kèm `?…` hoặc `#…`; có giao thức, `//` hoặc gạch chéo ngược thì bị bỏ qua.
- **Trang tự biết đang chạy trong app** qua cầu nối `LaChan.thamSo()` (`goc`, `song`, `auto`), nên đường dẫn từ trang bài học không cần `?goc=1&song=1`. Trang mở đầu của màn WebView lấy từ extra `trang` của Intent, chỉ nhận `prototype/video-call.html` và `prototype/hoc.html` (`GoiVideoActivity.trangHopLe`). Nút Quay lại lùi về trang trước trong WebView, hết thì đóng màn.
- **Số bài là mã nội bộ.** Mã cảnh (`minh-1`, `tu-9`…) mang số bài của kịch bản, nhưng chữ trên màn hình, tên nút, lời thu sẵn và lời AI không nhắc số bài (trang bài học đánh số lại theo thứ tự phát hành); mọi lời nhắc cho mô hình đều dặn điều này.
- Kiểm trang trên máy tính, không cần mạng: `node tools/kiem-goi-video.mjs` (Chromium headless, màn dọc; ảnh ở `export/preview/goi-*.png`). Kiểm luật và tệp cảnh: `node tools/kiem-hoi-thoai.mjs`.

Đo trên Xiaomi M2012K10C (Dimensity 1200, Android 13) ngày 25/11/2026:

| Cách chạy | Khung hình của trang khi nhân vật nói | Hình miệng mỗi giây |
|---|---|---|
| Trang web trong Chrome, mô hình miệng chạy WASM một luồng (bản prototype cũ) | 8 | 4–7, cả trang giật |
| WASM 4 luồng + luồng riêng | 24 | khoảng 7 |
| WebGPU trong Chrome | 20 | khoảng 2 (467 ms mỗi hình) |
| Trong app, mô hình miệng chạy bằng mã gốc (`MayMieng`, onnxruntime + XNNPACK), có tính trước | 48–59 | khoảng 7 khi máy nóng, 12–13 khi máy nguội |
| Trong app, **câu soạn sẵn có hình miệng dựng trước** (`tools/dung-mieng.py`) | 28–59 tùy nhiệt độ máy | 30 |

Kết luận: mô hình miệng quá nặng để tính tại chỗ cho mượt (76 ms mỗi hình khi máy rảnh, 140–220 ms khi cuộc gọi đang chạy và máy nóng; NNAPI còn chậm hơn, 295 ms). Vì vậy:

- **Câu soạn sẵn** (lời chào, các câu đáp thường gặp, tiếng đệm): dựng hình miệng trên máy tính bằng `tools/mieng-thong-so.mjs` rồi `tools/dung-mieng.py`. Mỗi câu thêm hai tệp cạnh tệp giọng, `<tên>.lip.json` và `<tên>.mieng.mp4` (khoảng 60 KB mỗi giây). Điện thoại chỉ phát video miệng, GPU dán thẳng lên mặt.
- **Câu ngoài kịch bản** (AI trả lời tự do): tính tại chỗ bằng mã gốc, tiếng được lùi tối đa 0,9 giây để hình miệng luôn sẵn trước khi cần. Miệng khớp tiếng nhưng chỉ đổi 7–13 lần mỗi giây.
- Mỗi tệp giọng mới phải qua `tools/nghe-lai.py` trước khi dùng: máy đọc có lúc đọc luôn cả lời dặn về giọng (đã gặp ở `chi-lan-1.m4a`, 10 giây đầu).

**Bộ lời của chị Lan:** `prototype/loi-chi-lan.json`, do một phiên Astra soạn rồi tôi rà lại: 43 kiểu lượt nói của người học (`y_dinh`), 95 câu của chị Lan (`loi`), luật ý định → câu đáp (`luat`). Chị Lan là người được giúp nên không câu nào tự nói ra đáp án. Cả 95 câu thu **một lượt duy nhất** (Gemini TTS, giọng Aoede, 263 giây) rồi qua bốn bước: cắt (`tools/cat-theo-lang.py`), lọc rẹt (`tools/loc-giong.py`), nghe kiểm (`tools/nghe-lai.py`), dựng hình miệng (`tools/mieng-thong-so.mjs`, `tools/dung-mieng.py`). Tệp nằm ở `prototype/audio/lan/`. Thêm hay đổi câu thì thu lại cả lượt.

**Hội thoại thật.** Chị Lan nói xong thì dừng lại nghe; người học trả lời bằng giọng (micro do app mở) hoặc bấm "Gõ chữ". Im lặng thì chị hỏi lại, ba lần liền thì hẹn bữa khác; máy không nghe ra hai lần liền thì mời gõ. Logic nằm ở `prototype/hoi-thoai.js` (thuần logic), chạy thử bằng chữ: `node tools/thu-hoi-thoai.mjs "không chị ơi" "(im)" …`.

**Hiểu ý người học** có ba tầng:

1. **AI ở máy chủ của đội** (`may-chu-gia.py`, đường `/api/hieu-y`, mã ở `hieu_y.py`, mô hình `gpt-6-luna`, khóa đọc từ `la-chan-so/.env`, không nằm trong app). Mô hình chỉ phân loại: trả về ý định và các ý được chấm kèm bằng chứng nguyên văn; câu chị Lan nói vẫn là câu thu sẵn do app chọn. Đo 25 ca khó: 25/25 đúng, trung vị 1,8 giây, chậm nhất 4 giây; khoảng chờ được che bằng tiếng đệm ("Ừm.", "Để chị nghĩ coi.").
2. **App tự gọi AI bằng khóa chủ máy nhập** (ô "Khóa AI (OpenAI), chỉ lưu trên máy này" ở màn chính, mã ở `HieuY.kt`), dùng khi ô "Máy chủ của đội" để trống hoặc máy chủ không trả lời. Cùng lời nhắc với máy chủ (`prototype/hieu-y-loi-nhac.txt`, một tệp dùng chung). Khóa nằm trong tệp riêng của app trên máy đó, không nằm trong APK, không ghi vào nhật ký; ô nhập không bao giờ hiện lại khóa, chỉ hiện bốn ký tự cuối. Đây là cách cho buổi thử và trình diễn; bản phát hành thật thì khóa phải ở máy chủ.
3. **Luật trên máy** khi không có cả hai, mất mạng hoặc quá 6 giây. Lời có dãy số riêng tư không bao giờ được gửi đi.

Lần kiểm thử độc lập (một phiên Astra khác, 83 cuộc gọi, 165 lượt, cố ý dùng câu khó) cho thấy luật ban đầu hiểu sai 32% số lượt và cho 4/4 ý với bốn câu nghĩa ngược. Sau khi sửa, bộ ca khó `tools/ca-hoi-thoai.json` (27 ca, chạy bằng `node tools/kiem-hoi-thoai.mjs`) qua hết với luật, và các câu nghĩa ngược được 0 ý trên máy thật qua đường AI. Bản sửa chưa được kiểm thử độc lập lại.

**Để điện thoại gọi được máy chủ khi đang cắm USB:** chạy `python3 may-chu-gia.py 8787`, `adb reverse tcp:8787 tcp:8787`, rồi nhập `http://127.0.0.1:8787` vào ô "Máy chủ của đội". Dùng Wi-Fi thì nhập địa chỉ IP của máy tính.

**Ca ngoài kịch bản.** Khi AI hiểu ý báo rằng không câu thu sẵn nào hợp (người học kể chuyện riêng, đặt giả định mới, hỏi một câu cụ thể) và máy có đủ hai khóa (ô "Khóa AI (OpenAI)" và ô "Khóa giọng đọc (Gemini)" ở màn chính), `gpt-6-luna` viết một lượt đáp ngắn cho chị Lan theo `prototype/tra-loi-loi-nhac.txt`, Gemini đọc bằng đúng giọng đã thu (Aoede), khẩu hình tính tại chỗ. Thiếu khóa, mất mạng, câu vi phạm luật lời nói hoặc tiếng dài bất thường (dấu hiệu máy đọc lẫn lời dặn) thì dùng câu hỏi lại thu sẵn. Đo trên máy thử: khoảng 12 giây từ lúc gửi tới lúc chị nói (chị ậm ừ bằng tiếng đệm trong lúc chờ), miệng đổi 5 đến 7 lần mỗi giây khi máy nóng. Tiếng tạo tại chỗ không qua được bước lọc rẹt và bước nghe kiểm như câu thu sẵn.

**Chế độ "AI nói chuyện trực tiếp", kiểu kết hợp** (công tắc ở màn chính; cần khóa AI, và khóa giọng đọc hoặc máy chủ của đội; hàm `hoiThoaiSong` của trang). Câu cố định (mở đầu, tiếng chờ, hỏi lại khi im lặng hoặc nghe không rõ, hẹn lúc khác) lấy từ bộ thu sẵn, phát ngay với hình miệng dựng trước. Phần đối đáp theo điều người học vừa nói thì mỗi lượt `gpt-6-luna` vừa chấm lượt mới nhất vừa viết lời nhân vật trong một lần gọi (lời nhắc theo cảnh: `prototype/hoi-thoai-song-loi-nhac.txt` cho chị Lan, `prototype/canh/<mã>.song.txt` cho cảnh khác; mã ở `HieuY.luotSong`); app chỉ nhận ý có bằng chứng nguyên văn trong lượt đó. Lời được đọc bằng giọng Gemini của đúng nhân vật, trùng giọng bộ thu sẵn. Giọng OpenAI đã thử và bỏ: người dùng nghe thấy máy móc. Trong lúc chờ, nhân vật ậm ừ đúng một tiếng lấy từ bộ thu sẵn.

Khi một lượt AI không đáp được (hết lượt API, mất mạng, quá giờ): ở ba cảnh mới (`lui_khi_hong` trong tệp cảnh) lượt đó dùng luật trên máy và câu thu sẵn, điểm cộng dồn với các ý AI đã chấm, cuộc gọi không đứng lại. Cảnh `lan-2` giữ cách cũ: báo "Mạng chậm" và chờ người học nói lại; muốn chị Lan cũng lùi về câu thu sẵn thì thêm `"lui_khi_hong": true` vào `canh/lan-2.json`. Máy không có khóa nào thì cả cuộc gọi chạy bằng câu thu sẵn.

**Kho giọng đã lưu** (`KhoGiong.kt`, `files/kho-giong` trong vùng riêng của app). Mọi câu AI đã đọc (tiếng đã lọc rẹt) được lưu theo khóa giọng + lời, nên câu đã đọc rồi thì phát lại ngay, không gọi API. Mọi lượt AI đã đáp được lưu theo khóa chặt (mã nhân vật trong kho + cả đoạn trò chuyện + các ý đã chấm) và khóa lỏng (mã nhân vật + câu cuối của người học + các ý đã chấm): gõ lại đúng kịch bản cũ thì ra đúng lời cũ, không tốn lượt API; khóa lỏng chỉ dùng khi gọi AI hỏng. Mã nhân vật trong kho lấy từ `ma_kho` của cảnh: `chi-lan` (giữ nguyên, các lượt đã lưu trước đây vẫn dùng được), `minh-1`, `minh-3`, `tu-9`; giọng lấy từ `nhan-vat.json`. Kéo kho về máy tính hoặc đẩy lại vào máy: `tools/keo-giong.sh`.

**Lớp lọc cho tiếng Gemini tạo tại chỗ.** Mỗi lần gọi Gemini TTS riêng lẻ đều kết thúc bằng một cụm nhiễu rất to ở đuôi (đo trên 7 câu: sau khi lời dứt 0,2 đến 0,8 giây có 40 ms nhiễu, lặng 30 ms, rồi 90 ms nhiễu ở −2 đến −7 dB), nghe là "rẹt rẹt" cuối mỗi câu. Câu thu sẵn không dính vì được cắt từ một lượt dài. Mọi tiếng tạo tại chỗ phải qua lớp lọc trước khi phát:

- Có máy chủ của đội: máy chủ đọc và lọc (`/api/doc`, mã ở `doc_giong.py`): cắt cụm nhiễu đuôi (`cat_nhieu_duoi`), rồi đúng chuỗi ffmpeg của các câu thu sẵn. Máy chủ hỏng thì app thử lại một lần, không phát bản chưa lọc. Đặt `LCS_LUU_TIENG=<thư mục>` để máy chủ lưu lại tiếng đã phát (bản thô và bản đã lọc) cho việc kiểm lại.
- Không có máy chủ (mặc định, điện thoại chạy độc lập): app tự gọi Gemini và lọc ở luồng nền ngay trên máy (`HieuY.locRet`: cắt cụm nhiễu đuôi, khử click lớn, lọc ù dưới 70 Hz, tắt nhiễu quãng nghỉ, cắt lặng và làm mềm hai đầu). Bản debug giữ 12 câu vừa phát (thô và đã lọc) ở `files/tieng-da-phat/` để kiểm lại. Kiểm trên máy thử 25/11/2026: sáu câu điện thoại tự lọc đều kết thúc ở lời nói, không còn cụm nhiễu đuôi.
- Trang phát tiếng tạo tại chỗ qua `decodeAudioData` như câu thu sẵn (`hoc-avatar.js`, `speakLive`).

Người dùng nghe trên máy thử ngày 25/11/2026 và xác nhận hết rẹt với đường có máy chủ. Thời gian mỗi lượt khoảng 8 giây (AI viết và chấm khoảng 3 giây, đọc và lọc khoảng 4 giây). Khẩu hình ở chế độ này luôn tính tại chỗ (5 đến 13 hình miệng mỗi giây tùy nhiệt độ máy), không mượt bằng câu dựng sẵn.

**Sổ ca lạ.** Mỗi ca ngoài kịch bản được ghi vào `files/ca-ngoai-kich-ban.jsonl` trong vùng riêng của app (lời người học đã che mọi dãy từ 4 chữ số, câu chị vừa hỏi, lời AI đáp; tối đa 500 dòng). Kéo về máy tính: `tools/keo-ca-la.sh` (gộp vào `bai-hoc/ca-ngoai-kich-ban.jsonl`). Ca nào gặp nhiều hoặc quan trọng thì thêm vào bộ lời rồi thu lại cả lượt, để lần sau có câu dựng sẵn.

Còn thiếu: sáu câu thu mà người kiểm thử đề nghị thêm (hỏi lại khi phủ định kép, khi người học tin lời mời, khi định bấm thử đường dẫn, khi hỏi lại số tiền, mời gõ khi nghe lỗi nhiều lần, mời nói nốt) và sáu câu nên viết lại; phải thu lại cả lượt. Nhánh im lặng và nhánh micro lỗi mới chạy trong công cụ thử bằng chữ, chưa thử trên máy.

## Thử trên máy Xiaomi thật (25/11/2026)

- Cài bằng `adb install` chạy được; bật đủ quyền thì thẻ trạng thái báo 3/3.
- **Mỗi lần cài đè, MIUI thu hồi "Hiển thị trên ứng dụng khác" và hai quyền riêng "cửa sổ bật lên khi chạy nền", "hiện trên màn hình khóa".** Sau lần cài cuối trước buổi trình diễn phải bật lại ba quyền này.
- Chưa bật quyền "cửa sổ bật lên khi chạy nền": máy chặn mở màn "Dừng lại" từ nền, lớp phủ dự phòng tự hiện sau 2 giây. Đã bật: màn mở thẳng. Bấm Home thì đóng sạch.
- Thẻ cảnh báo khi đổ chuông và màn Bé Nai hỏi hiện đúng; máy có dịch vụ nhận giọng nói nên nút "Kể lại bằng giọng nói" có hiện.
- Máy chưa có bản ghi âm cuộc gọi nào nên N2 chưa thử được. Cuộc gọi và SMS thật cần một máy thứ hai gọi tới.
- Cả app khóa màn hình dọc.

## Giới hạn đã biết

- **Chưa thử trên máy Xiaomi thật.** Ba điểm dễ gãy nhất: máy tắt dịch vụ nền, máy không cho mở màn hình từ nền, và thẻ cảnh báo có nổi trên màn đổ chuông khi máy đang khóa hay không.
- **Một số app ngân hàng ẩn lớp phủ của app khác.** Vì vậy màn "Dừng lại" mở bằng Activity trước, lớp phủ chỉ là đường dự phòng.
- **Danh sách gói app ngân hàng** (`DichVuLaChan.NGAN_HANG`) viết theo trí nhớ, cần đối chiếu trên máy thật.
- **N2 phụ thuộc trình gọi điện của máy.** Chỉ đọc được khi máy lưu bản ghi vào thư mục người dùng chọn được (trình gọi của Xiaomi). Trình gọi của Google giữ bản ghi trong vùng riêng, khi đó chỉ còn N3.
- **Câu thu sẵn của Bé Nai nhắc tên "anh Minh" và gọi "bà".** Đổi tên người thân hoặc đổi xưng hô thì app tự chuyển sang giọng đọc của máy (chất giọng khác Bé Nai).
- **Tra số gửi nguyên số người gọi lên máy chủ của đội.** Giữ nguyên có chủ ý vì tra số cần số; đổi sang mã băm hay không là việc mảng 1 và mảng 2 cùng quyết (xem hợp đồng dữ liệu).
- **Tin có mã xác thực bị bỏ qua hoàn toàn**, kể cả khi nó là tin lừa đảo có kèm một con số trông giống mã. Đây là lựa chọn nghiêng về riêng tư.
- **Trả lời "Có" thì khoảng canh app ngân hàng được tính lại từ lúc trả lời**, không phải từ lúc cúp máy, vì lúc đó rủi ro cao nhất.
- **Màn "Dừng lại" chỉ hiện một lần** cho mỗi lần mở app ngân hàng, rồi nghỉ 90 giây, theo D05 ("Hiện một lần. Lá chắn không khóa giao dịch").
- **Chưa phân biệt hai SIM** khi đối chiếu nhật ký cuộc gọi.
- **N2 chỉ gửi bản ghi khi chắc là của đúng cuộc gọi:** tên tệp mang số vừa gọi, hoặc chỉ có một tệp mới và tên không mang số nào khác. Mơ hồ thì chuyển sang hỏi một câu.
- **Nút "Chặn số này" chỉ chặn trên máy này**, chưa gửi báo cáo cho cộng đồng.
- **Nhận dạng "có/không"** dùng dịch vụ giọng nói của máy, cần mạng trên phần lớn máy. Không nghe được thì vẫn còn hai nút.
- **Chưa có ghép đôi với người thân** và chưa nhận lời nhắn ngược lại từ máy Minh (cần mảng 2, 3, 5).
