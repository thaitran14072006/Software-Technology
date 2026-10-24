> **Bản rà soát lịch sử trước khi sửa.** Trạng thái hiện tại nằm ở [CHANGES_AND_STATUS.md](CHANGES_AND_STATUS.md), [API.md](API.md) và README. Nhiều mục login/upload/job/QR trong tài liệu bên dưới đã được triển khai; không dùng các hướng dẫn cũ để kết luận chúng còn thiếu.

# Rà soát hệ thống và hướng dẫn hoàn thiện đồ án

Ngày **23/10/2026**. Căn cứ: mã nguồn, SQL, cấu hình, build và test trong phiên rà soát. Chưa có rubric môn học, nên phạm vi đề xuất dựa trên các luồng đang có: nội dung đa ngôn ngữ, nghe, GPS/QR, offline và quản trị. Nếu đề bài bắt buộc Android/BLE/TTS phía server, web demo hoặc giọng trình duyệt không thay thế đầy đủ những yêu cầu đó.

Đây là **báo cáo và hướng dẫn thực hiện**. Các endpoint ghi “đề xuất” chưa tồn tại. Lần này cập nhật tài liệu; không triển khai module đăng nhập/upload/provider mới và không chỉnh dữ liệu thật.

## 1. Kết luận và danh sách phần còn thiếu

Web có nền tảng đủ để trình diễn nhiều chức năng; schema PostgreSQL và ba backend service đã có. Không cần mua Google TTS, Mapbox, S3 hoặc hosting để làm bản local với sơ đồ, CRUD, QR, thống kê và giọng thiết bị. Chưa thể xác nhận toàn hệ thống end-to-end: Docker engine đang tắt, mobile chưa build.

Thứ tự nên làm: **backend/database thật → đăng nhập → MP3 tự thu âm/upload → QR đủ điểm → xử lý job/offline → kiểm thử thiết bị**. P0 là cản chạy cấu hình đang chọn; P1 là thiếu chức năng hoặc có nguy cơ sai kết quả; P2 tùy rubric. Rủi ro xử lý đồng thời dưới đây được suy ra từ code, chưa có test tái hiện trong phiên này.

| Mức | Bằng chứng | Thiếu hoặc vướng | Cách xử lý |
| --- | --- | --- | --- |
| P0 | Docker trên máy | Client có nhưng Linux engine không kết nối được | Bật Docker Desktop, làm mục 4 |
| P0 nếu cần MP3 server | `audio-tts.module.ts`, Google provider | Chỉ Google được cài; thiếu key thì job lỗi | Giọng thiết bị cho demo; upload MP3 hoặc provider local theo mục 3/5 |
| P1 | `roles.ts`, users/refresh_tokens | Chỉ JWT dev, chưa login/refresh/logout; guard chưa tra user active | Mục 5.1 |
| P1 | `create-poi.dto.ts`, PoiService | Có audioMode UPLOAD nhưng không có endpoint nhận file, audio PENDING | Mục 5.2 |
| P1 | `tts.consumer.ts` | Lock theo translation; gặp lock thì ack/bỏ message mới; TTL 60 giây có thể hết trước job | Mục 5.3 |
| P1 | `poi.service.ts` | Lỗi emit bị bỏ qua; có thể PENDING mãi; regenerate chỉ chọn FAILED | Outbox, job và retry theo mục 5.3 |
| P1 | `tts-result.listener.ts` | Completed kiểm tra hash, failed không kiểm tra; lỗi cũ có thể ghi đè trạng thái mới | Kiểm tra hash/job hiện hành ở cả hai nhánh |
| P1 | PoiService update | Đổi gender/audioMode chưa cập nhật đầy đủ audio cũ; tìm audio chưa tách gender | Quy định một giọng hoặc dùng khóa translation+gender, test đổi source/giọng |
| P1 | DTO/update | Update chưa chặn duplicate lang; FK/lang lạ có thể thành lỗi DB; chưa chặn chuỗi rỗng đầy đủ | Validate và trả 400/404/409 theo mục 5.4 |
| P1 | `rev.service.ts`, sync controller | Sequence cấp trước UPDATE/commit; ghi đồng thời có thể làm client bỏ sót delta | Revision theo thứ tự commit, snapshot nhất quán, mục 5.4 |
| P1 | `seed-from-legacy.js` | Chỉ điểm 9 đánh dấu GPS verified; 14 điểm còn lại ước lượng | Khảo sát và PATCH POI đã seed, mục 5.5 |
| P1 | dev-seed, QR controller | QR mẫu chỉ điểm 9; chưa CRUD QR/beacon; chưa lọc POI ẩn/xóa khi trả token | Seed đủ điểm, API quản trị và join POI published |
| P1 nếu cần native | app.json, App, OutdoorMap, mapPack | Token Mapbox placeholder; chưa native build/dependencies/lockfile | Bỏ Mapbox theo mục 5.6 hoặc migrate MapLibre |
| P1 nếu cần offline | web store, mobile audio hook | Giọng thiết bị chưa bảo đảm offline/5 tiếng | MP3 thật, tải thành công và thử airplane mode |
| P1 với điện thoại | PUBLIC_ASSET_BASE, web proxy | localhost trỏ về điện thoại; HTTP audio có thể bị chặn trên HTTPS | URL LAN/HTTPS hoặc reverse proxy audio cùng origin |
| P1 nếu bắt buộc nền | backgroundTask, useAutoPlay | Task cập nhật store; quyết định autoplay ở React hook; chưa chứng minh khi bị suspend/kill | Task/service phù hợp nền tảng, thử thiết bị thật |
| P2 | SQL và code | tts_jobs, audit_logs, refresh_tokens, visitor_sessions có bảng nhưng chưa luồng đầy đủ | Nối nghiệp vụ; không báo cáo là tính năng đã hoàn tất |
| P2 | app_configs/languages/maps | Chưa API cấu hình; radius/cooldown/locale còn phần hardcode | Đọc server/cache hoặc ghi rõ cấu hình tĩnh |
| P2 | Analytics | Có presence/lượt bắt đầu nghe; chưa heatmap/lịch sử vị trí | Chỉ thêm nếu rubric yêu cầu, mục 5.8 |
| P2 | Compose | Chỉ PG có named volume; chưa health endpoint/backup quy trình | Mục 5.7 |
| P2 | Nội dung và sơ đồ | Nội dung seed ngắn, khoảng cách/đoạn nối có giả định; ảnh mobile cần đối chiếu nguồn | Duyệt 75 bản nội dung, khảo sát tuyến và kiểm tra quyền sử dụng nguồn |

## 2. Database và API hiện có

### 2.1 Database

**PostgreSQL là nguồn chính.** `schema.sql` tạo 15 bảng, `analytics.sql` thêm 2, tổng cộng **17 bảng** khi áp dụng đủ. Đây là kết luận từ file SQL, chưa phải xác nhận DB đang chạy trên máy.

| Nhóm | Bảng | Tình trạng |
| --- | --- | --- |
| Danh mục/bản đồ | languages, poi_categories, maps, map_floors | Schema/seed cơ bản; chưa API quản trị riêng |
| Nội dung/audio | pois, poi_translations, poi_audios | Có CRUD, hash, soft delete, trạng thái audio, revision |
| Tài khoản | users, refresh_tokens | Có schema; user demo, chưa API xác thực |
| QR/BLE | poi_qr_codes, ble_beacons | Có API đọc; mẫu QR một điểm; chưa dữ liệu beacon thật |
| TTS job | tts_jobs | Có schema nhưng worker chưa ghi/cập nhật |
| Cấu hình/audit | app_configs, audit_logs | Seed config; runtime chưa đọc hết; chưa ghi audit |
| Khách | visitor_sessions | Có schema; chưa luồng đầy đủ, web analytics dùng bảng khác |
| Analytics | web_presence, audio_listen_events | Có API ghi/đọc, chống trùng event, migration riêng |

`content_rev` là sequence hỗ trợ sync. FK/index cơ bản đã có. Cần bổ sung migration có phiên bản, validation, seed và luồng sử dụng bảng còn bỏ trống; không phải làm lại toàn bộ database.

**Redis:** cache và lock TTS. Cache có fallback PG nhưng worker vẫn dùng Redis lấy khóa; không xóa Redis rồi coi toàn hệ thống vẫn hoạt động.

**RabbitMQ:** hai queue `tts_queue`, `content_queue`, là broker chứ không lưu POI. Content service kết nối broker lúc khởi động; muốn bỏ cần sửa module/bootstrap/publisher, không chỉ xóa URL.

**MongoDB:** chỉ `tts_call_logs` được ghi khi có MONGO_URL. Có thể bỏ URL và dùng log terminal. Các collection visit_events/location_pings/presence_snapshots/api_access_logs chưa có code ghi, không phải phần bắt buộc đang thiếu. Muốn bỏ Mongo container cũng sửa Compose vì dev:full hiện khởi chạy mọi service trong Compose.

### 2.2 API hiện hữu

Chi tiết đường dẫn và quyền: [API.md](API.md).

- Content: public list/detail POI; admin CRUD; regenerate audio FAILED; sync manifest; POST presence/listens; GET analytics quản trị.
- QR: GET danh sách, GET tra token, GET danh sách beacon.
- Audio: nhận sự kiện qua RabbitMQ và phục vụ file `/assets/...`; chưa có REST upload/tạo giọng.
- Web: proxy content/QR, web-config, analytics demo. Ảnh QR SVG tạo tại client, không cần dịch vụ QR trả phí.

### 2.3 API đề xuất — chưa được triển khai

| Ưu tiên | Endpoint đề xuất | Quyền và dữ liệu |
| --- | --- | --- |
| P1 | POST `/api/v1/auth/login` | email/password, kiểm tra user active; access token và cơ chế refresh phù hợp |
| P1 nếu phiên dài | POST `/api/v1/auth/refresh`, POST `/api/v1/auth/logout` | Hash/rotate/revoke refresh token |
| P1 | GET `/api/v1/auth/me` | JWT; thông tin user, không password hash |
| P1 | POST `/api/v1/admin/pois/:id/audios/upload` | ADMIN/EDITOR; multipart file, langCode, voiceGender; audio READY |
| P1 | POST `/api/v1/admin/qr`, PATCH `/api/v1/admin/qr/:id` | ADMIN/EDITOR; tạo token, gắn POI, bật/tắt |
| P2 | POST/PATCH/DELETE `/api/v1/admin/beacons[/:id]` | ADMIN/EDITOR; uuid/major/minor/poiId |
| P2 | GET/PATCH `/api/v1/admin/configs` | Đọc ADMIN/EDITOR; sửa ADMIN; radius/cooldown/hours |
| P2 | GET `/api/v1/admin/tts-jobs`, GET `/api/v1/admin/audit-logs` | Phân trang/filter, guard quản trị |
| P2 | GET `/health/live`, GET `/health/ready` | Mỗi service; readiness kiểm tra phụ thuộc cần thiết |
| Theo rubric | POST `/api/v1/tracking/locations`, GET `/api/v1/admin/analytics/heatmap` | Consent, giới hạn tần suất/thời gian lưu/quyền đọc |

Ký hiệu `[/:id]` biểu thị endpoint collection khi POST và endpoint có id khi sửa/xóa, không phải chuỗi URL literal. Không cần API dịch tự động nếu quản trị nhập bản dịch; không cần Directions API cho tuyến dùng graph trong khu.

## 3. Phương án miễn phí

| Dịch vụ | Nên dùng cho đồ án | Điều kiện/phần phải viết |
| --- | --- | --- |
| Google Cloud TTS | Giọng trình duyệt/expo-speech cho demo; MP3 tự thu âm cho offline | Giọng thiết bị đã có; upload MP3 chưa có. Nếu bắt buộc text→MP3 server, thêm engine/model local phù hợp license và ngôn ngữ |
| AWS Polly | Không cần tích hợp | Chưa có provider; đổi env không làm nó hoạt động |
| Mapbox map/directions/offline | Sơ đồ + Dijkstra | Web dùng ngay; native phải gỡ import/plugin/dependency nếu bỏ token |
| Bản đồ địa lý nếu bắt buộc | MapLibre + dữ liệu/tiles hợp lệ tự cung cấp | Render miễn phí không đồng nghĩa tile hosting/offline miễn phí; phải sửa component/style/pack |
| S3/CDN | File local + static server có sẵn | Backend cần bật, backup file, HTTPS khi web HTTPS |
| Managed DB/cache/queue | PG/Redis/Rabbit local theo cấu hình hiện có | Không mua cloud; vẫn dùng tài nguyên máy/mạng |
| Mongo log cloud | Terminal/file log hoặc bảng PG | Bỏ MONGO_URL để ngừng ghi Mongo; giữ log cần cho báo cáo |
| Hosting/build cloud | Laptop + LAN; Android SDK local | Không cần thuê VPS/đăng store để bảo vệ local |
| BLE beacon | QR fallback nếu rubric cho phép | BLE bắt buộc thì cần beacon/điện thoại phát thử tương thích; mô phỏng không thay kiểm chứng thực địa |
| Kubernetes/CI phức tạp | Build/test + Compose | Không bắt buộc với phạm vi hiện tại nếu đề bài không yêu cầu |

Google TTS yêu cầu bật billing; có quota miễn phí không đồng nghĩa không thể bị tính phí: [setup](https://docs.cloud.google.com/text-to-speech/docs/get-started), [pricing](https://cloud.google.com/text-to-speech/pricing/). Không đề xuất API không chính thức để né billing.

Giọng Web Speech có local và remote, phải thử offline trên chính máy bảo vệ: [MDN localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService). MapLibre vẫn cần style/tiles: [MapLibre React Native](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/). Không tải hàng loạt từ tile.openstreetmap.org làm offline: [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).

Khuyến nghị: **web/PWA + NestJS + PostgreSQL + QR + sơ đồ + MP3 tự thu âm** nếu rubric cho phép. Không tuyên bố đạt native/BLE/TTS server khi chưa thực hiện.

## 4. Khởi chạy và kiểm tra database/API

### Bước 1 — Web độc lập

Tại gốc chạy `npm run dev`, mở http://127.0.0.1:4173. Thử nghe cả 5 tiếng. Nếu thiếu giọng, cài giọng hệ điều hành hoặc chuẩn bị MP3. Không mặc định trình duyệt nào cũng có đủ.

### Bước 2 — Backend

Dừng web đang chạy, mở Docker Desktop, đợi Linux engine sẵn sàng:

```powershell
docker version
npm run dev:full
```

Terminal khác:

```powershell
docker compose -f backend/docker/docker-compose.yml ps
npm run token
Invoke-RestMethod 'http://127.0.0.1:3001/api/v1/pois?mapId=00000000-0000-0000-0000-000000000001&lang=vi'
Invoke-RestMethod 'http://127.0.0.1:3003/api/v1/qr/demo-bausau-001'
```

Chọn backend trên web, nhập token. Seed mới dự kiến 15 POI; tạo nháp không xuất hiện public, publish mới xuất hiện. Log ở backend/.runtime/.

### Bước 3 — Kiểm tra bảng/dữ liệu

```powershell
docker compose -f backend/docker/docker-compose.yml exec -T postgres psql -U sag -d sag -c '\dt'
docker compose -f backend/docker/docker-compose.yml exec -T postgres psql -U sag -d sag -c 'SELECT status, count(*) FROM poi_audios GROUP BY status;'
docker compose -f backend/docker/docker-compose.yml exec -T postgres psql -U sag -d sag -c 'SELECT code, geo_verified FROM pois WHERE deleted_at IS NULL ORDER BY sort_order, code;'
```

Kiểm tra thêm trong psql hoặc pgAdmin:

```sql
SELECT count(*) AS published FROM pois
WHERE deleted_at IS NULL AND status = 'PUBLISHED';
SELECT lang_code, count(*) FROM poi_translations GROUP BY lang_code;
-- Bản dịch còn thiếu, trả POI và ngôn ngữ cần bổ sung:
SELECT p.code, l.code AS missing_lang FROM pois p CROSS JOIN languages l
LEFT JOIN poi_translations t ON t.poi_id=p.id AND t.lang_code=l.code
WHERE p.deleted_at IS NULL AND t.id IS NULL;
SELECT kind, count(*) FROM poi_qr_codes WHERE is_active GROUP BY kind;
SELECT count(*) FROM ble_beacons WHERE is_active;
SELECT count(*) FROM tts_jobs;
SELECT count(*) FROM audit_logs;
```

DB seed mới dự kiến 15 POI, mỗi ngôn ngữ 15 bản dịch. Sau CRUD/test, số bản ghi có thể khác; phân biệt soft delete. Audio FAILED vì key không có là lỗi provider, không phải PG hỏng. Job count bằng 0 không có nghĩa chưa gọi TTS vì worker chưa ghi bảng này.

**DB cũ:** Docker init SQL chỉ chạy khi volume trống. schema.sql không idempotent; không chạy lại toàn bộ lên DB đang có dữ liệu. Thiếu analytics thì chạy:

```powershell
Get-Content backend/db/analytics.sql -Raw | docker compose -f backend/docker/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U sag -d sag
```

Thay đổi schema tiếp theo cần migration riêng và backup, không xóa volume để “chạy lại seed”.

### Bước 4 — Kiểm tra tích hợp

Khi dev:full còn chạy:

```powershell
npm run test:integration
npm run test:analytics
```

Script tạo dữ liệu thử; integration xóa mềm POI nên còn bản ghi đã xóa. Các script này không chứng minh MP3 TTS thật hoặc GPS/BLE hoạt động.

## 5. Khắc phục các phần còn thiếu

### 5.1 Đăng nhập/phân quyền

1. Dùng users hiện có; tạo admin bằng password hash bcrypt/Argon2 hoặc scrypt đúng chuẩn. Hash `DISABLED_DEV_TOKEN_ONLY` trong seed không dùng cho login.
2. Có thể đặt auth module ngay trong content service. Login kiểm tra mật khẩu/is_active, cấp JWT ngắn hạn; secret chỉ ở backend.
3. Nếu cần refresh, lưu hash refresh token, kiểm tra expires/revoked, rotate và revoke khi logout. Web có thể dùng cookie HttpOnly cùng origin với cấu hình CSRF phù hợp; mobile dùng nơi lưu an toàn.
4. Guard kiểm tra user tồn tại/active và role hiện hành, không chỉ tin role cũ trong JWT. Giới hạn thử login.
5. Thêm form login/logout thay ô token; giữ script token chỉ local dev.
6. Nghiệm thu sai mật khẩu/thiếu token → 401, sai role → 403, user khóa không sửa tiếp được; kiểm tra refresh/logout theo chính sách.

### 5.2 MP3 miễn phí và upload

Phương án ít phụ thuộc: tự thu âm nội dung đã duyệt. Cần tối đa 75 file cho 15 điểm × 5 tiếng nếu phải đầy đủ; demo ít hơn thì công bố rõ phạm vi.

1. Viết endpoint multipart ở mục 2, có guard. Kiểm tra POI/bản dịch/lang/gender, giới hạn dung lượng, kiểm tra file MP3 thực tế thay vì chỉ tin đuôi/MIME client.
2. Storage dùng tên server tạo có hash nội dung file để thay MP3 tạo URL mới; không nhận đường dẫn tùy ý từ client.
3. Upsert poi_audios theo `(translation_id, voice_gender)`; đặt source UPLOAD, status READY, URL, size, duration, text_hash của script liên quan. Xử lý transaction và xóa file rác nếu DB lỗi.
4. Bump revision và invalidate cache. Khi sửa script của audio upload phải báo cần thu âm lại, không coi audio cũ đã khớp chữ mới.
5. Thêm nút tải file quản trị. Hiện chọn UPLOAD chỉ tạo bản ghi PENDING, không có chức năng tải file.
6. Nghiệm thu file đúng điểm/tiếng, tải offline và ngắt mạng vẫn nghe; thay file được sync; file sai bị từ chối.

Nếu môn bắt buộc **server tự sinh giọng từ chữ**, thêm provider local: chọn engine/model có license và ngôn ngữ phù hợp, tổng hợp rồi chuyển MP3. Mở rộng union name trong `tts-provider.interface.ts`, đăng ký factory trong `audio-tts.module.ts`, thêm đường dẫn executable/model, timeout, retry và lỗi. Interface hiện yêu cầu audio/mpeg; không trả WAV rồi đặt đuôi mp3. Đo tốc độ/tài nguyên/chất lượng trên máy bảo vệ. Không có sẵn lựa chọn này chỉ bằng đổi env.

### 5.3 Hàng đợi/job TTS

1. Tạo tts_jobs và outbox cùng transaction nội dung/audio; bổ sung hash, provider, trạng thái, retry, job id/idempotency key khi cần.
2. Publisher gửi outbox với xác nhận broker rồi đánh dấu sent. Consumer phải idempotent vì message có thể giao lại.
3. Không ack/bỏ phiên bản mới khi translation đang khóa. Tuần tự theo translation hoặc requeue/backoff có giới hạn; dùng lock token riêng, renew TTL và chỉ xóa khóa mình sở hữu.
4. Kiểm tra hash/job hiện hành cho cả completed và failed. Thêm gender/source vào định danh nếu nhiều giọng.
5. Ack sau khi lưu trạng thái/kết quả đáng tin cậy. Retry lỗi tạm thời; config/quota đưa FAILED có lý do; giới hạn retry/dead letter.
6. Phục hồi job PENDING/RUNNING quá hạn và FAILED; hiển thị lỗi quản trị.
7. Test sửa A→B khi A đang chạy phải ra B; broker/worker dừng rồi bật không mất job; lỗi cũ không phá audio mới; retry không tạo trùng.

### 5.4 Sync, cache và validation

- Sequence không bảo đảm thứ tự commit. Với đồ án có thể dùng một hàng counter được khóa trong cùng transaction cập nhật POI/audio. Mọi writer dùng chung cơ chế; manifest đọc counter/dữ liệu trong snapshot nhất quán. Hoặc dùng change log có cơ chế ordering đúng.
- Không bump revision ở transaction rời sau commit nội dung. Cập nhật Redis sau commit và có cách khôi phục version khi lần ghi Redis thất bại, tránh version cache cũ vô hạn.
- Validate since nguyên không âm, lang được hỗ trợ, map/category/floor tồn tại, tên/script không rỗng, update không trùng lang. Map lỗi FK/unique/ORM not found sang 400/409/404 phù hợp.
- Test hai writer hoàn thành đảo thứ tự với client sync xen giữa: sync tiếp theo phải nhận đủ thay đổi. Test publish→draft, xóa, thay audio, download lỗi/tải tiếp.
- Mobile có logic tự tải lại file thiếu; vẫn cần thử progress khi retry, cleanup download active, sync cùng gói không chồng nhau và giữ file đang sử dụng theo chính sách rõ ràng.

### 5.5 QR/BLE, GPS và tuyến

**QR:** seed idempotent token riêng cho mỗi POI published hoặc tạo qua API quản trị. Token ngẫu nhiên duy nhất, 8–64 ký tự `[A-Za-z0-9_-]`. QR tham gia web không thay token tra POI. API danh sách/resolve QR và beacon phải JOIN POI, loại bản ẩn/xóa. Test mã sai 404, disabled không hoạt động, quét đủ điểm và offline sau khi lưu bảng QR.

**GPS:** khảo sát tọa độ thật rồi PATCH latitude/longitude/geoVerified. Seed bỏ qua code đã tồn tại nên chỉ sửa REAL rồi seed lại không cập nhật POI cũ. Để thử ở trường, tạo POI test riêng có tọa độ thật quanh trường, không thay GPS Cát Tiên bằng GPS giả. Chỉnh bán kính sau thử nghiệm/rubric, không coi 10 m luôn đáng tin.

**Tuyến:** graph hiện dùng cho sơ đồ, cần kiểm chứng cạnh/chiều dài, đoạn nối điểm 13 và phép chiếu chấm người dùng. Fallback đường thẳng phải ghi xấp xỉ, không trình bày như tuyến đi bộ thực địa.

**BLE:** đăng ký uuid/major/minor/poiId thật, thử Android với quyền phù hợp OS và Bluetooth bật. iBeacon theo code này chưa hỗ trợ iOS. Nếu không có thiết bị, chỉ dùng QR khi rubric cho phép và ghi giới hạn, không coi mô phỏng là nghiệm thu BLE thực tế.

### 5.6 Native không Mapbox và chạy nền

Nếu chọn chỉ sơ đồ cho native, sửa đồng bộ:

1. Gỡ Mapbox dependency/plugin/secret placeholder khỏi package.json và app.json.
2. Bỏ import và setAccessToken trong src/app/App.tsx.
3. Bỏ nhánh OutdoorMap và nút chuyển tương ứng ở MapScreen/MapControls, giữ SchematicMap.
4. Bỏ tải Mapbox pack và import mapPack ở màn Offline; sửa useRouteTo/directions dùng graph hoặc báo không có tuyến ngoài graph.
5. Dọn env/tài liệu token. Nếu rubric bắt buộc bản đồ địa lý, migrate MapLibre + nguồn tiles hợp lệ thay vì xóa chức năng.
6. Cài dependencies, chạy Expo check/doctor, TypeScript check; xử lý tương thích Expo 54/RN 0.81 với audio/MMKV/BLE/camera. Lưu lockfile sau khi ổn định, build bằng Android SDK local.

Đối chiếu map-bg.jpg với sơ đồ nguồn; file tồn tại không chứng minh đúng ảnh. Test camera thật, GPS, quyền từ chối/cấp lại và audio khi khóa màn hình.

Thu thập GPS nền không chứng minh autoplay nền: quyết định hiện nằm ở React hook có thể bị suspend. Nếu bắt buộc nền, chuyển logic cần thiết vào task/service phù hợp nền tảng, lưu cooldown bền vững, xử lý audio lifecycle. Thử foreground → background → khóa màn hình → mở lại; tách force stop khỏi background bình thường. Bản foreground phải ghi điều kiện app đang mở.

### 5.7 Migration, log, backup và triển khai

- Migration đánh phiên bản; seed không ghi đè nội dung/config đã chỉnh.
- Ghi audit_logs khi CRUD/upload/cấu hình: user/action/entity/diff/time; không ghi secret/token/mật khẩu.
- Muốn giữ job/log qua recreate container, thêm named volume cho Rabbit `/var/lib/rabbitmq` và Mongo `/data/db`. Redis cache có thể dựng lại nhưng kiểm tra content_version sau restart; lock không thay job bền vững.
- Backup PostgreSQL cùng backend/storage; cần cả hai để khôi phục MP3. Ví dụ xuất DB tránh pipeline nhị phân qua PowerShell:

```powershell
docker compose -f backend/docker/docker-compose.yml exec -T postgres pg_dump -U sag -d sag -Fc -f /tmp/sag-backup.dump
docker compose -f backend/docker/docker-compose.yml cp postgres:/tmp/sag-backup.dump ./sag-backup.dump
```

- Restore thử vào DB/container riêng, kiểm tra POI/audio/file, không đè DB chính. Không đưa env/backup chứa dữ liệu riêng lên repo công khai.
- Chia sẻ ngoài máy: reverse proxy cùng origin cho web/content/QR/audio, HTTPS; giới hạn cổng DB/broker, CORS theo origin dùng, secret riêng. URL MP3 cũ cần cập nhật trong DB rồi bump revision/cache hoặc tạo lại; đổi env không sửa URL cũ.
- Thêm health/readiness, log có nguyên nhân, rate limit login/upload/analytics và giới hạn payload nếu public. Không cần Kubernetes/API gateway riêng chỉ để bảo vệ local.

### 5.8 Heatmap/tracking nếu rubric yêu cầu

Presence đếm trình duyệt hoạt động; listens đếm bắt đầu nghe, không phải nghe hết/vị trí tham quan. visitor_sessions không phải nguồn web analytics hiện tại.

Nếu cần, thêm location_pings trong PG với session ẩn danh, lat/lng, accuracy, recorded_at, map_id; API batch có validation/tần suất tối đa. Chỉ gửi khi đồng ý, nêu mục đích và giới hạn thời gian lưu/quyền đọc. API admin tổng hợp theo ô lưới. Dataset nhỏ không bắt buộc Mongo/PostGIS. Test không consent không gửi, offline gửi lại không trùng, dữ liệu cũ được dọn theo chính sách.

## 6. Checklist nghiệm thu

| Bước | Cần chứng minh | Bằng chứng |
| --- | --- | --- |
| 1 | Web khởi động, 15 điểm/5 tiếng | Video và ảnh thao tác |
| 2 | CRUD ghi PG, restart còn, nháp không public | API + query DB |
| 3 | Login/phân quyền nếu yêu cầu | 401/403, khóa user, logout/refresh |
| 4 | Audio đúng điểm/tiếng, MP3 thật nếu offline | READY + file phát được |
| 5 | QR từng điểm; sai/disabled/ẩn không dùng được | Token và video quét |
| 6 | Lưu gói, airplane mode, reload/đổi tiếng/nghe | Video ngắt mạng, ít nhất một MP3 đã tải |
| 7 | Sửa/xóa/thay file rồi sync không sót | Manifest + dữ liệu client |
| 8 | Presence nhiều tab không tăng giả, listens retry không trùng | Analytics test + dashboard |
| 9 | GPS/cooldown; BLE/background nếu bắt buộc | Log và video thiết bị |
| 10 | Backup/restore và chạy trên máy khác | Dump/storage + hướng dẫn cài |

Tách unit, API integration và test thiết bị. Unit tests hiện có chưa phủ auth/upload/provider local/job vì các phần đó chưa tồn tại.

## 7. Kết quả kiểm chứng

- Node thực tế: v24.14.0.
- Web build thành công; **22/22 tests đạt** khi chạy ngoài sandbox. Lần đầu bị chặn quyền loopback/temp trong sandbox, không phải lỗi chức năng đã tái hiện ngoài sandbox.
- Backend build: **3/3 service thành công**. Backend test: **9/9 tests đạt, 3/3 suites**, chạy ngoài sandbox sau khi lần đầu bị chặn ghi cache Jest.
- Docker client có, Linux engine chưa chạy: không chạy lại API/PostgreSQL/Redis/Rabbit/Mongo integration trong phiên này.
- Mobile chưa node_modules/native build, chưa test GPS/BLE/camera/giọng thiết bị/offline native.
- Google TTS thật, S3, Mapbox và provider thay thế chưa kiểm chứng. Mục 5 là hướng dẫn phần còn phải triển khai.

Ghi nhận “đã chạy” trong DEMO/WEB_DEMO cũ là lịch sử tài liệu trước đó, không phải kết quả chạy lại của phiên này.
