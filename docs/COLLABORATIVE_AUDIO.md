# Cùng tạo thuyết minh bằng Google AI Studio

## Database riêng vẫn có dữ liệu giống nhau

Mỗi thành viên chạy cùng schema/migration và nhập `backend/fixtures/content.json`. Bộ mẫu hiện có 17 POI, 85 bản dịch, 16 MP3 Google thật. Không cần dùng database chứa tài khoản, lịch sử khách và mật khẩu trên máy tác giả. ID nội bộ có thể khác; dữ liệu/audio được ghép bằng mã POI, ngôn ngữ và SHA-256 của nội dung, không phụ thuộc UUID của máy tạo.

Git chỉ đồng bộ các file đã commit. Sau khi pull bản ghi mới, `npm run content:seed` nhập MP3 phù hợp vào database local. Nhập audio không thay văn bản; transcript đã sửa trên máy sẽ được giữ, audio không khớp bị bỏ qua. Bản Google hoặc bản thu âm READY đang hợp lệ được giữ nguyên. Gói ngoại tuyến cần tạo/tải lại sau khi nhập.

## Dùng AI Studio của từng thành viên

Mỗi người tự lưu khóa của mình trong `backend/.env`, không chia sẻ hay commit khóa. Dùng cùng model và cấu hình giọng để phong cách thống nhất:

```dotenv
GEMINI_API_KEY=your_own_private_key
GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts
GEMINI_VOICE_FEMALE=Kore
GEMINI_VOICE_MALE=Charon
TTS_LANGUAGES=en
```

Ví dụ này giao tiếng Anh. Worker chỉ xử lý job có ngôn ngữ được giao, kể cả database có hàng đợi các tiếng khác. Cần dừng và khởi động lại server sau khi sửa env. Lệnh sinh audio mặc định đọc phần việc từ `TTS_LANGUAGES`; có thể thu hẹp thêm bằng `--langs` hoặc `--codes`.

Hạn mức Google tính theo project, không theo API key: nhiều khóa thuộc cùng project vẫn chia sẻ hạn mức. Mỗi thành viên kiểm tra quyền truy cập model và quota thực tế của project mình trong AI Studio. Tài khoản/project riêng vẫn có giới hạn; không có cam kết mọi người đều được 10 yêu cầu/ngày, không tự bật billing. Nguồn: https://ai.google.dev/gemini-api/docs/rate-limits.

Tạo TTS là sinh ngẫu nhiên: cùng model, giọng và văn bản không bảo đảm hai lần tạo ra sóng âm giống từng byte. Để mọi máy nghe cùng một bản, nhóm chia sẻ chính MP3 đã chọn và kiểm chứng SHA-256; không tạo lại bản đã có.

## Chia phần việc trước khi chạy

Nhóm thống nhất mỗi ngôn ngữ chỉ có một người phụ trách tại một thời điểm. Ví dụ chia năm phần dưới đây; thay bằng tên thật trong bảng trước khi bắt đầu. Không có thông tin tên/số thành viên nên bảng chưa tự giao cho tài khoản GitHub nào.

| Phần | TTS_LANGUAGES | Google đã có | Còn thiếu |
|---|---|---:|---:|
| Người phụ trách Việt | vi | 5 | 12 |
| Người phụ trách Anh | en | 4 | 13 |
| Người phụ trách Nhật | ja | 2 | 15 |
| Người phụ trách Hàn | ko | 2 | 15 |
| Người phụ trách Trung | zh | 3 | 14 |

Nếu ít hơn năm người, một người nhận nhiều tiếng, ví dụ `TTS_LANGUAGES=vi,ja`. Nếu muốn chia nhỏ một tiếng, dùng `--codes=1,2,3` và thống nhất mã POI không trùng. Giới hạn worker hiện theo ngôn ngữ; bộ lọc mã chỉ giới hạn job mới do lệnh tạo, không giới hạn job mã khác đã tồn tại trong hàng đợi. Không dùng chung database đang chạy nhiều worker với các khóa khác nhau: trạng thái dừng quota hiện lưu theo provider trên database đó.

Lịch Codex của tác giả hiện nhằm bổ sung mọi bài thiếu. Trước khi nhóm bắt đầu chia bài, cần giới hạn `TTS_LANGUAGES` của máy tác giả vào phần đã thống nhất và khởi động lại backend để tránh tạo trùng với thành viên khác. Không cần gửi khóa của các thành viên cho tác giả.

## Quy trình cho người tạo audio

1. Pull mã/fixture mới trước khi tạo bài; chạy `npm run dev:full` lần đầu để có database và admin riêng, rồi Ctrl+C.
2. Nhập khóa của mình, đặt `TTS_LANGUAGES` đúng phần việc trong `backend/.env`.
3. Chạy `npm run dev:gemini` hoặc `npm run dev:gemini:lan`, giữ terminal này mở.
4. Ở terminal khác tại repository, chạy lệnh cho phần đã giao, ví dụ:

```powershell
npm run audio:gemini -- --langs=en
# Nếu chỉ nhận một số POI:
npm run audio:gemini -- --langs=en --codes=1,2,3
```

Khi hết quota, dừng và chờ quota của project mình, giữ kết quả đã tạo. Không tự đổi giọng sang eSpeak. Lệnh khởi động không tự tạo toàn bộ audio của fixture; chỉ lệnh tạo sẽ thêm job còn thiếu. Trên database cũ có hàng đợi sẵn, worker chỉ nhận ngôn ngữ trong `TTS_LANGUAGES`.

5. Xuất kết quả rồi xem thay đổi:

```powershell
npm run content:export
git diff -- backend/fixtures/content.json
git add backend/fixtures/content.json backend/fixtures/audio
git commit -m "feat: add English Google AI Studio narrations"
git push -u origin feature/english-narration
```

Tạo feature branch trước khi làm và pull request để nhóm review. Export giữ audio đã chia sẻ có cùng transcript, bổ sung audio mới; không xóa bản nhóm đã có chỉ vì local chưa có. Chỉ commit MP3 cùng metadata, không commit `.env`, storage runtime hoặc database dump.

Các pull request có thể cùng sửa `content.json`. Người merge giữ mọi mục audio mới ở các POI/ngôn ngữ khác nhau, chọn một thời điểm `exportedAt`, không chọn toàn bộ một phía làm mất phần của người khác. Có xung đột cùng transcript thì nhóm chọn một bản nghe tốt làm chuẩn. Nếu văn bản thay đổi, phải tạo audio mới khớp hash.

## Nhận kết quả của thành viên khác

Sau khi pull request được merge:

```powershell
git pull --ff-only
# Dừng ứng dụng bằng Ctrl+C, giữ Docker đang chạy.
npm run content:seed
npm run dev:gemini
```

Nếu chỉ nghe audio đã có, dùng `npm run dev:full` thay dòng cuối và không cần khóa Google. Kiểm tra đúng POI/ngôn ngữ, sau đó chạy `npm run offline:archive` khi web/backend đang chạy để cập nhật gói tải. `npm run test:shared-content` kiểm tra trên database tạm việc nhập mới, nhập lặp, bổ sung audio và từ chối audio sai transcript.

Muốn mọi người nhìn thấy thay đổi ngay, không cần pull/import, phải triển khai backend, database và kho MP3 dùng chung. Đây là lựa chọn triển khai khác; không thể chỉ commit chuỗi kết nối PostgreSQL localhost của tác giả để các máy truy cập được.
