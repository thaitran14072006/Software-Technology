# Tiến độ tạo audio Google ngày 24-10-2026

**Mốc chia sẻ Git mới lúc 14:07:** quota đã được làm mới và worker tiếp tục tạo audio. Fixture xuất để chia sẻ có **16 MP3 Google / 85 bài**, còn **69 bài thiếu** (vi 5, en 4, ja 2, ko 2, zh 3). Các số 12/73 và thời gian chờ bên dưới là kết quả kiểm tra trước thời điểm quota được làm mới, không phải trạng thái mới nhất. Xem [hướng dẫn cùng tạo audio](COLLABORATIVE_AUDIO.md) và [bàn giao Git](GIT_HANDOFF.md).

Đã tạo thêm 1 bản Google AI Studio tiếng Việt cho POI mã 3, chuyển WAV thành MP3 và gắn đúng bản dịch/text hash trong database. Giữ nguyên 11 bản Google đã có và không thay bằng giọng eSpeak/thiết bị.

| Ngôn ngữ | MP3 Google đã sẵn sàng |
|---|---:|
| Việt | 4 |
| Anh | 3 |
| Nhật | 2 |
| Hàn | 1 |
| Trung | 2 |
| Tổng | 12 |

Đây là số file theo ngôn ngữ, không phải số POI đã có đủ mọi ngôn ngữ. Còn 73/85 bản của 17 POI chưa có Google audio.

## Lý do chưa tạo hết

Một yêu cầu thử đã thành công HTTP 200. Yêu cầu kế tiếp bị Google trả HTTP 429 RESOURCE_EXHAUSTED. Kiểm tra chi tiết xác nhận:

```text
quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier
model: gemini-3.8-flash-lite-tts
quotaValue: 10
retryDelay: 6698s
```

Đây là hạn mức thực tế Google trả cho project/model hiện tại, không phải cam kết cho mọi tài khoản. Không bật billing, không mua gói và không đổi khóa để né hạn mức. Google quy định quota theo project và hạn mức ngày reset lúc nửa đêm Pacific: https://ai.google.dev/gemini-api/docs/rate-limits.

## Trạng thái hàng đợi

- 12 audio GEMINI READY; 73 audio PENDING; không để lỗi quota vừa phát sinh làm mất một bản khỏi hàng đợi.
- Đã chuyển job bị quota về QUEUED, giữ đúng nội dung và current_job_id; file READY không bị ghi đè.
- Thời điểm thử tiếp: **14:02 ngày 24/10/2026, giờ Việt Nam**, tương ứng 2026-10-24T07:02:00Z, chừa khoảng đệm sau thời điểm thử lại của Google.
- Nếu giữ backend ở chế độ GEMINI, worker sẽ tiếp tục khi hết thời gian tạm dừng. Nếu máy/server dừng, chạy lại `npm run dev:gemini:lan` để worker đọc hàng đợi đã lưu.
- Một ngày quota mới không đủ tạo hết 73 bản khi giới hạn vẫn là 10 yêu cầu/ngày. Nếu chạm quota tiếp, hệ thống sẽ dừng tiếp; không bảo đảm mọi yêu cầu tạo được một file thành công.
- Script audio:gemini được bổ sung phát hiện thời gian tạm dừng trong lúc theo dõi để không chờ vô ích đến hết một giờ.

## File tải về

Đã tạo lại web/dist/offline-guide.zip: 12 MP3 Google, 3.911.763 byte, có metadata/giọng và mã SHA-256 của từng file. Giải nén toàn bộ rồi mở CatTienGuide/index.html để nghe những bản đã có khi ngoại tuyến. Gói này chưa chứa 73 bản chưa tạo được.

Các bản PWA/mobile đã tải trước đó cần tải lại gói để nhận bản tiếng Việt mới. Việc tạo thêm audio nằm ở backend, không yêu cầu build lại APK.
