# API hiện tại

**Cập nhật Gemini:** public POI có `geoSourceUrl`, audio có `provider` và `voiceName`. `/configs` có `tts_provider` và `tts_paused_until`. Nguồn `GEMINI` là AI Studio, khác `GOOGLE` (Cloud TTS). Job ghi provider trong payload để không bị engine LOCAL xử lý nhầm. [Vận hành/quota/offline](GOOGLE_AI_STUDIO_AND_OFFLINE.md).

Khách dùng công khai, không tài khoản. Các đường dẫn admin yêu cầu `Authorization: Bearer <admin access token>` và role ADMIN. Không có API đăng ký/đăng nhập cho khách; auth chỉ dành cho admin. ENUM EDITOR cũ không được cấp quyền quản trị trong bản hiện tại.

## Content service — cổng 3001

| Method | Đường dẫn | Quyền | Nội dung |
| --- | --- | --- | --- |
| POST | /api/v1/auth/login | Công khai, tài khoản admin | email/password; accessToken, refreshToken, user, expiresIn |
| POST | /api/v1/auth/refresh | Refresh token | Rotate và thu hồi token cũ |
| POST | /api/v1/auth/logout | Refresh token | Thu hồi phiên; access có sid của phiên mất hiệu lực |
| GET | /api/v1/auth/me | Admin access token | User admin hiện hành, không password hash |
| GET | /api/v1/pois?mapId=UUID&lang=vi | Công khai | POI published, bản dịch và audio READY khớp text hash |
| GET | /api/v1/pois/:id?lang=vi | Công khai | Chi tiết POI published |
| GET | /api/v1/sync/manifest?mapId=UUID&lang=vi&since=0 | Công khai | rev, items, deletedIds, downloads; snapshot nhất quán |
| GET | /api/v1/configs | Công khai | Radius/cooldown/hours/lang và tts_provider đang dùng |
| GET | /api/v1/admin/pois?page=1&limit=20 | ADMIN | Danh sách quản trị, tối đa 100/trang |
| GET/POST | /api/v1/admin/pois[/:id] | ADMIN | Chi tiết hoặc tạo POI |
| PATCH/DELETE | /api/v1/admin/pois/:id | ADMIN | Sửa hoặc xóa mềm; map/code cố định sau tạo |
| POST | /api/v1/admin/pois/:id/audios/upload | ADMIN | Multipart file/langCode/voiceGender; MP3 <=20 MB, phải có bản dịch |
| POST | /api/v1/admin/pois/:id/audios/generate | ADMIN | JSON langCode/voiceGender; xếp job cho bản chưa READY, giữ bản thu âm đã có |
| POST | /api/v1/admin/pois/:id/audios/regenerate | ADMIN | Retry audio TTS FAILED/PENDING quá hạn; không tạo job trùng đang chạy |
| GET/POST | /api/v1/admin/qr | ADMIN | Danh sách hoặc tạo QR POI/GATE, token do server sinh |
| PATCH | /api/v1/admin/qr/:id | ADMIN | isActive bật/tắt |
| GET/POST | /api/v1/admin/beacons | ADMIN | Danh sách hoặc đăng ký poiId/uuid/major/minor/txPower |
| PATCH | /api/v1/admin/beacons/:id | ADMIN | isActive bật/tắt |
| DELETE | /api/v1/admin/beacons/:id | ADMIN | Vô hiệu hóa |
| GET | /api/v1/admin/configs | ADMIN | Cấu hình hiện có |
| PATCH | /api/v1/admin/configs | ADMIN | key/value; radius và cooldown có giới hạn |
| GET | /api/v1/admin/tts-jobs | ADMIN | 100 job mới nhất, trạng thái/lỗi |
| GET | /api/v1/admin/audit-logs | ADMIN | 100 nhật ký gần nhất |
| POST | /api/v1/analytics/presence | Công khai | visitorId/sessionId UUID v4, active boolean |
| POST | /api/v1/analytics/listens | Công khai | eventId/visitorId/poiId UUID v4, lang; chỉ bản đã published |
| GET | /api/v1/admin/analytics | ADMIN | Presence 90s, tổng lượt nghe/ngày, theo POI/ngôn ngữ |
| POST | /api/v1/tracking/locations | Công khai, phải consent=true | id/sessionId/mapId/latitude/longitude/accuracy/recordedAt; tối đa một mẫu/10 giây/session |
| GET | /api/v1/admin/analytics/heatmap | ADMIN | Vùng tọa độ làm tròn 0,001 độ, số mẫu trong 7 ngày |
| GET | /api/health/live, /api/health/ready | Công khai | Liveness; PG/migration readiness |

Refresh body: `{ "refreshToken": "..." }`. Refresh token lưu hash trong PG, access 15 phút và refresh 7 ngày. Logout/khóa user làm phiên admin mất hiệu lực. JWT dev không có sid vẫn dùng cho script local; không đưa secret dev lên public.

Tracking không được bật chỉ vì dùng GPS: khách phải chọn đồng ý chia sẻ. Backend không thể chứng minh người gửi HTTP đã consent thật; cần thông báo/giới hạn môi trường triển khai phù hợp. Worker dọn dữ liệu nhận quá 7 ngày theo giờ.

Job generation dùng provider đang chọn. Bản mặc định DEVICE không gọi cloud; dùng LOCAL để tự sinh MP3 miễn phí. Scripts/generate-audio.mjs chỉ cho phép LOCAL. Tạo MP3 không đồng nghĩa chất lượng phát âm đã được duyệt.

## QR/BLE service — cổng 3003

| Method | Đường dẫn | Quyền | Nội dung |
| --- | --- | --- | --- |
| GET | /api/v1/qr | Công khai | Token -> poiId của các POI published chưa xóa |
| GET | /api/v1/qr/:token | Công khai | POI hoặc URL GATE; sai/disabled/ẩn trả 404 QR_INVALID |
| GET | /api/v1/beacons | Công khai | Beacon active của POI published |
| GET | /api/health/live, /api/health/ready | Công khai | Trạng thái service/PG |

Token QR: 8–64 ký tự A–Z/a–z/0–9/_/-. QR không chứa JWT. QR registry offline chỉ phản ánh trạng thái lúc tải gói; thu hồi mới ở server chỉ tới client sau khi đồng bộ.

## Audio và engine local

- Audio service :3002: GET /assets/<key> phục vụ file local; GET /health/live và /health/ready.
- Job worker đọc tts_jobs từ PostgreSQL, claim/lease/retry; ghi audio và revision cùng transaction. Không có RabbitMQ ở đường chạy mặc định.
- Engine eSpeak/FFmpeg tùy chọn :3010 (chỉ publish loopback): GET /health; POST /synthesize nhận text/locale/gender và trả MP3. Đây là API nội bộ, không gửi nội dung ra cloud.
- Google vẫn là provider tùy chọn cần key/billing; LOCAL không cần key. S3 không thuộc luồng upload local đã kiểm thử.

## Proxy web — cổng 4173

- /content-api/<path> -> :3001/api/v1/<path>.
- /qr-api/<path> -> :3003/api/v1/<path>.
- /audio-assets/<key> -> :3002/assets/<key>; chuyển Range, MIME và byte length.
- /web-config trả URL tham gia hệ thống; demo analytics ở /demo-api/analytics/* không phải dữ liệu PostgreSQL.
- CONTENT_API_URL/QR_API_URL/AUDIO_API_URL chỉ là origin upstream, không thêm /api/v1 ở env.

Validation sai trả 400; không token/phiên hết hạn 401; không ADMIN 403; không có dữ liệu 404; trùng mã 409; file quá lớn 413. Một số lỗi validation có fields theo pipe chung. Dữ liệu lỗi DB không trả SQL/secret ra client.
