# Thay đổi và trạng thái hệ thống — 23/10/2026

**Trạng thái mới nhất:** xem [Google AI Studio, ngoại tuyến và ngôn ngữ](GOOGLE_AI_STUDIO_AND_OFFLINE.md). Đã có 11 MP3 Google thật, còn 74 bản chờ quota; 17 POI công khai. Đã thay font và bổ sung bộ dịch dùng chung. Các mô tả giọng mặc định bên dưới là lịch sử của các lần sửa trước.

**Bản sửa giọng mới nhất:** web mặc định chọn Web Speech theo thứ tự giọng của cat-tien-app; MP3 là tùy chọn riêng để tránh mặc định phát giọng eSpeak cơ học. Đã qua 29/29 kiểm thử web. Xem [VOICE_FIX.md](VOICE_FIX.md) để biết nguyên nhân, thay đổi và giới hạn kiểm chứng chất lượng.

Cập nhật tiếp theo: đã tích hợp bản đồ web Leaflet/OpenStreetMap và cải thiện TTS trình duyệt từ `cat-tien-app`; xem [báo cáo tích hợp](CAT_TIEN_INTEGRATION.md). Đã bổ sung chế độ `npm run dev:lan` sau khi người dùng đồng ý cho thiết bị cùng Wi-Fi truy cập. Web hiện đạt 28/28 tests; kiểm thử API tổng thể gần nhất đạt 15 nhóm. Kiểm tra máy chủ qua IP LAN đã nhận 15 POI và MP3 HTTP 206; chưa kiểm chứng bằng điện thoại thật. Xem [hướng dẫn QR/Wi-Fi trong README](../README.md).

## Kết luận

**Web và backend có thể chạy local với PostgreSQL thật, không cần mua API. Chưa thể xác nhận toàn hệ thống hoàn thiện 100%.** Phần lõi đã được sửa và kiểm thử; phần native/thực địa, audio đầy đủ và một số dependency vẫn cần xử lý/kiểm chứng tiếp.

Phân quyền theo yêu cầu mới nhất: **khách không đăng nhập**, không đăng ký tài khoản; admin đăng nhập quản lý và dùng được mọi chức năng tham quan như khách. Login/refresh/logout chỉ phục vụ admin. Không xây user-login cho khách.

Đây là báo cáo trạng thái mới, thay thế nhận định “chưa có login/upload” trong báo cáo rà soát cũ SYSTEM_AUDIT.md. Không suy ra tính năng đã chạy trên thiết bị chỉ từ việc build hoặc unit test đạt.

## 1. Những gì đã thay đổi

| Nhóm | Đã sửa/triển khai | Cách kiểm tra |
| --- | --- | --- |
| Quyền khách/admin | API khách công khai; giao diện quản trị yêu cầu admin; quyền quản trị chỉ ADMIN | Mở Khám phá không token, admin API không token 401, quyền khác 403 |
| Đăng nhập admin | Email/password, scrypt có salt, access token 15 phút, refresh token hash/rotate 7 ngày | Login sai 401, refresh dùng lại bị từ chối |
| Thu hồi quyền | Guard tra user active/role và phiên hiện hành; logout thu hồi refresh và access của phiên | Khóa admin hoặc logout thì token không sửa dữ liệu tiếp |
| Tài khoản local | Tạo mật khẩu ngẫu nhiên một lần, lưu riêng .runtime/admin-login.txt | Không xuất mật khẩu vào log/README, restart giữ tài khoản |
| MP3 upload | Endpoint multipart và nút tải MP3 trên web, giới hạn 20 MB, kiểm tra khung MP3 và file cụt | Từ chối text đổi đuôi .mp3; file hợp lệ READY và tải qua proxy |
| Audio cũ | Khi sửa script/đổi giọng/source thì bỏ URL cũ, kiểm tra text hash | Không phát MP3 không còn khớp script |
| Tổng hợp MP3 miễn phí | Thêm provider LOCAL, container eSpeak NG/FFmpeg; pykakasi xử lý chữ Nhật | Đã tổng hợp đủ 5 tiếng và tạo 75 MP3 READY, 0 pending/failed |
| Queue và hạ tầng | Chuyển job bền vững sang PostgreSQL; mặc định chỉ cần PG | Hệ thống chạy không cần RabbitMQ/Redis/MongoDB |
| Job TTS | Ghi job cùng transaction nội dung, claim SKIP LOCKED, lease/heartbeat/retry tối đa, phục hồi lease quá hạn | Job không bị ack/bỏ vì khóa translation như trước |
| Kết quả audio | current_job_id + text_hash + source quyết định kết quả còn hiện hành | Job cũ không ghi đè MP3 upload hoặc phiên nội dung mới |
| Đồng bộ | Clock khóa hàng trước khi ghi; nội dung/revision commit cùng transaction; manifest dùng REPEATABLE READ | Hai chỉnh sửa đồng thời vẫn xuất hiện trong delta tiếp theo |
| Cache | Cache nhỏ có giới hạn theo revision PG, không giữ Redis version cũ | Upload/sửa/xóa được thấy ở API và manifest |
| Validation | Ngôn ngữ cố định, tên/script không rỗng, chặn duplicate lang, kiểm tra FK, lỗi DB rõ ràng | 400/404/409; mã điểm/map cố định sau tạo |
| QR | Tự tạo token cho POI mới, bổ sung registry cho các điểm chưa có | Có QR từng điểm; tải SVG tại quản trị |
| QR/BLE công khai | Lọc điểm đã xóa/không published và token/beacon disabled | Draft/disabled trả 404 hoặc không xuất hiện registry |
| Quản lý beacon | Đăng ký, xem, bật/tắt, vô hiệu hóa | API đã thử với beacon fixture; chưa thử sóng BLE thật |
| Cấu hình | GET public configs, admin sửa radius/cooldown; web/mobile đọc runtime config | Thay cấu hình được phản ánh qua API |
| Thống kê | Giữ presence/listens; cập nhật visitor_sessions | Người dùng ẩn danh, không yêu cầu tài khoản |
| Vị trí | Khách tự chọn đồng ý chia sẻ, API giới hạn tần suất, tổng hợp theo ô và heatmap màu cho admin | Không consent bị từ chối; heatmap API bảo vệ admin |
| Lưu giữ | Dọn vị trí quá 7 ngày theo giờ khi audio worker hoạt động; dọn refresh hết hạn | Có lịch dọn trong worker, không cần dịch vụ scheduler trả phí |
| Audit | Các mutation admin ghi user/action/path/entity/time vào PG | Nhật ký còn sau restart; không ghi mật khẩu/token/body upload |
| Health | Liveness/readiness ở cả ba service; readiness kiểm tra PG/migration | Endpoint health phản hồi khi dịch vụ sẵn sàng |
| Proxy | Sửa lỗi Node fetch khi body dạng stream gặp 401; request có giới hạn dung lượng | Login sai trả 401 thay vì 502 |
| URL audio | /audio-assets cùng origin, chuyển Range và MIME; native chuẩn hóa URL | Điện thoại không phải truy cập localhost của chính nó để nghe file web |
| Native maps | Thay Mapbox bằng MapLibre 10.4.2, bỏ secret/token Mapbox | TypeScript, bundle Android và prebuild thành công |
| Native routing | Giữ graph miễn phí; ngoài graph là đường thẳng ghi xấp xỉ | Không gọi Directions API trả phí |
| Offline mobile | Chặn sync cùng ngôn ngữ chạy chồng, cleanup download active, kiểm tra response QR/BLE | Test pack logic và kiểm tra TypeScript |
| Native nền | Khởi tạo player ở foreground; background task tự chọn POI từ gói và phát MP3 đã tải, dùng cooldown bền vững | Đã đóng gói; cần thử màn hình khóa trên thiết bị |
| Camera/config | Bật code scanner Android, cấu hình background audio/location iOS, cài Babel preset/system UI thiếu | Expo config/prebuild và bundle Android |
| Dependencies | Mobile có lockfile, RN 0.81.5/NetInfo 11.4.1/Babel preset đúng Expo 54; nâng runtime NestJS 12.2 với TypeORM integration tương thích | Backend runtime audit 0; build, 13 unit tests và 15 nhóm tích hợp đạt; còn tooling xem mục 5 |
| Backup | Lệnh npm run backup sao lưu PG và storage | Đã restore thử vào DB riêng, đọc được 15 POI rồi xóa DB thử |

Các module RabbitMQ consumer/listener cũ đã ngừng dùng; bản local mới không phải kiến trúc RabbitMQ được mô tả trong tài liệu cũ. Redis/Mongo/Rabbit còn profile legacy trong Compose để tránh xóa dữ liệu/cấu hình cũ, không nằm trong đường chạy mặc định.

## 2. Các nhóm file chính

| File/thư mục | Vai trò thay đổi |
| --- | --- |
| backend/db/complete.sql | Migration bổ sung idempotent, clock/job/tracking |
| backend/libs/database/src/content-write.ts | Giao dịch ghi nội dung/revision nhất quán |
| backend/libs/common/src/guards/roles.ts | Kiểm tra admin active, quyền và phiên |
| backend/libs/common/src/operational.ts | Health, audit và mapping lỗi DB |
| backend/apps/content-poi-service/src/auth/ | Login/refresh/logout/me và password hash |
| backend/apps/content-poi-service/src/admin/ | Upload, QR/BLE, cấu hình, job/audit, tracking/grid |
| backend/apps/content-poi-service/src/poi/ và sync/ | POI, audio validity, job, delta |
| backend/apps/audio-tts-service/src/tts/job-worker.ts | Worker PostgreSQL thay RabbitMQ |
| backend/apps/qr-fallback-service/src/ | Registry công khai chỉ trả POI hợp lệ |
| scripts/setup-admin.mjs, complete-seed.mjs, dev-full.mjs | Chuẩn bị admin, QR, migration và khởi động |
| scripts/smoke-complete.mjs | Nghiệm thu các chức năng vừa sửa bằng fixture riêng |
| scripts/backup.mjs | Backup local |
| web/admin-tools.mjs, visitor-config.mjs | Giao diện admin/upload và cấu hình/tracking khách |
| web/app.mjs, store.mjs, server.mjs, sw.js | Quyền giao diện, auth, proxy, cache module mới |
| mobile/package.json, package-lock.json, app.json | MapLibre, dependency và native plugins |
| mobile/src/services/audio/, location/, offline/, api/ | Playback nền, config, URL audio và sync |
| README.md, docs/API.md, docs/ERD.md | Hướng dẫn trạng thái hiện tại |

Dự án hiện không có Git metadata trong thư mục làm việc nên báo cáo không cung cấp commit/PR hoặc số dòng diff đã xác nhận.

## 3. Kết quả đã kiểm chứng

| Kiểm tra | Kết quả và giới hạn |
| --- | --- |
| Build web | Đạt, 15 POI × 5 ngôn ngữ |
| Web tests | 27/27 đạt sau tích hợp cat-tien-app |
| Build backend | Cả 3 service đạt |
| Backend unit tests | 13/13, 5 suites: hash/chunk/MP3/password/upload validation |
| CRUD integration | Đạt JWT 401/403, validation, nháp/xuất bản, fallback tiếng, QR, xóa mềm, manifest |
| Analytics integration | Đạt chống trùng lượt nghe, nhiều tab, leave/expiry, phân ngôn ngữ và PG thật |
| Nghiệm thu mở rộng | 15 nhóm tình huống đạt: login/session, upload/proxy, phiên bản audio, ghi đồng thời, QR, beacon, config, consent, audit và quyền admin |
| Mobile TypeScript | Đạt sau khi cài và chỉnh dependency |
| Mobile unit tests | 14/14, 3 suites: geofence, graph, pack |
| Expo dependency check | Đạt |
| Android JavaScript bundle | Đạt, 1.262 modules, Hermes bundle khoảng 3,3 MB tại mobile/dist |
| TTS miễn phí thực tế | 5/5 locale tạo MP3; database có 75 READY, 15 mỗi ngôn ngữ, 0 pending/failed |
| Offline trình duyệt | Lưu đủ 75 audio, dừng toàn bộ app server, reload vẫn đọc gói; thử đổi Việt/Nhật và phát MP3 từ cache |
| Android prebuild | Đạt, camera code scanner được bật trong cấu hình Gradle |
| Trình duyệt | Đã mở trang backend không login; admin prompt chỉ khi quản trị; login thử, dashboard, QR/job/audit, form MP3, logout về Khám phá |
| Backup/restore | Backup cuối có database và audio; restore DB thử riêng xác nhận 15 POI published, 75 MP3 READY |

MP3 fixture của test là dữ liệu khung MPEG dùng kiểm tra cấu trúc/truyền file, không phải bản thuyết minh được nghe duyệt. Test dữ liệu riêng được dọn; script CRUD cũ dùng soft delete nên có thể còn POI đã xóa và audit của chúng. Thông tin tài khoản UI thử đã được xóa sau kiểm tra.

Để tái hiện:

```powershell
npm run dev:full
# Terminal khác, sau khi hệ thống báo sẵn sàng:
npm test
npm --prefix backend test -- --runInBand
npm --prefix mobile test -- --runInBand
npm run test:integration
npm run test:analytics
npm run test:complete
npm run backup
```

## 4. Phương án miễn phí đang dùng

- PostgreSQL local giữ nội dung, job, tài khoản admin và thống kê; không cần managed DB hoặc broker cloud.
- Sơ đồ/Dijkstra miễn phí; native dùng MapLibre, không cần token Mapbox.
- DEVICE đọc bằng giọng thiết bị/MP3 có sẵn. LOCAL tạo MP3 miễn phí bằng eSpeak NG + FFmpeg trên máy; đã tạo 75 bản từ nội dung mẫu hiện có. Có thể thay bằng bản thu âm chất lượng tốt hơn.
- dev:full không gọi Google trừ khi chủ động dùng --cloud-tts. Google vẫn cần billing/key và chưa được kiểm chứng thật.
- Offline nghe chắc chắn bằng MP3 đã tải thành công. Giọng trình duyệt/thiết bị có thể cần mạng và không bảo đảm đủ 5 tiếng.
- Bản đồ MapLibre mặc định là demo basemap cho phát triển, không bảo đảm đường mòn Cát Tiên. Sơ đồ vẫn là bản đồ chi tiết offline có sẵn. Offline tiles chỉ bật khi có nguồn hợp lệ được cho phép tải trước.

LOCAL là giải pháp text→MP3 ở server đã hoạt động cho đủ 5 ngôn ngữ, không dùng API cloud không chính thức. Chất lượng là giọng tổng hợp cơ bản; việc phát âm đúng thuật ngữ/tên riêng vẫn cần được nghe duyệt.

## 5. Còn gì để hoàn thiện thật sự?

| Phần còn lại | Vì sao chưa thể xác nhận hoàn tất | Việc cần làm |
| --- | --- | --- |
| APK và thiết bị | Đã thử expo run:android, bị chặn vì không tìm thấy Android SDK và adb trong môi trường | Cài SDK/JDK phù hợp, expo run:android, thử app thật |
| GPS đủ 15 điểm | Seed chỉ đánh dấu điểm 9 verified; các điểm khác ước lượng | Cung cấp/khảo sát tọa độ rồi PATCH qua quản trị; không bịa GPS để test |
| Nội dung/audio | Có 75 nội dung mẫu và 75 MP3 local; chưa được duyệt chuyên môn/giọng đọc | Duyệt nội dung/bản dịch/phát âm, thay bằng MP3 thu âm khi cần |
| Offline trên thiết bị bảo vệ | Web đã lưu đủ 75 MP3 và thử server dừng; native chưa thử thiết bị | Tải gói và kiểm tra airplane mode trên điện thoại/máy bảo vệ cụ thể |
| Native GPS/BLE/camera/nền | Bundle/prebuild không kiểm chứng phần cứng hoặc lifecycle OS | Thử quyền từ chối/cấp lại, GPS yếu, beacon thật, QR camera, khóa màn hình, resume |
| iOS BLE | Chưa triển khai iBeacon ranging qua CoreLocation | Làm riêng nếu môn bắt buộc iOS; không suy ra từ Android |
| Bản đồ/tuyến thực địa | Phép chiếu và một số cạnh/khoảng cách sơ đồ còn giả định | Hiệu chỉnh với dữ liệu khảo sát; MapLibre không tự tạo dữ liệu đường mòn |
| Heatmap trên nền bản đồ thật | Đã có lưới heatmap màu/ô tọa độ; chưa overlay trên basemap | Chỉ thêm overlay nếu rubric yêu cầu bản đồ địa lý |
| Chất lượng TTS local | Engine đã sinh MP3 đủ 5 tiếng, giọng còn máy móc | Nghe duyệt tên riêng, nhịp đọc; thu âm/upload nếu tiêu chí yêu cầu giọng tự nhiên |
| Dependency security | Backend runtime đã audit 0; còn cảnh báo tooling/Expo/Jest | Nâng tooling/SDK theo lộ trình có test trước khi phát hành public |
| Triển khai public | Đang dùng secret/tài khoản DB local, cấu hình loopback | Secret riêng, HTTPS, giới hạn mạng/CORS/rate limit, rà soát bảo mật trước public |

Đã nâng có kiểm soát runtime NestJS lên **12.2.0**, TypeORM integration 12.0.2 và mapped-types 12.0.0; giữ lại sau khi build/test/integration đạt. Đã xử lý tương thích UUID map cũ và tách hash thuần để test không phụ thuộc ESM của framework. Yêu cầu chạy full backend được nâng lên **Node.js 24+**, đã kiểm tra 24.14.0. **npm audit --omit=dev hiện báo 0 cảnh báo backend runtime.** Cây gồm công cụ phát triển backend còn 43 mục (36 high, 4 moderate, 3 low); mobile còn 43 high, nhiều mục trong Expo/Jest/build tooling. Không dùng audit fix --force để hạ/nâng SDK mù quáng. Đây không phải bảo đảm hệ thống đã hết mọi lỗ hổng hoặc đạt chuẩn production; số liệu là snapshot registry lúc kiểm tra.

Có thể dùng bản web/backend local để trình diễn các luồng đã nghiệm thu. Phạm vi bắt buộc về iOS, độ chính xác thực địa và chất lượng giọng phải đối chiếu rubric; chưa nhận được rubric trong cuộc hội thoại.

## 6. Hướng dẫn vận hành thực tế

### Admin và khách

Khách mở URL là dùng; chỉ bấm Quản trị mới cần đăng nhập. Admin đăng nhập ở Kết nối, chuyển giữa Quản trị và Khám phá. Đăng xuất về chế độ khách, không chặn chức năng tham quan. Không có endpoint đăng ký khách.

Tài khoản local đầu tiên nằm ở backend/.runtime/admin-login.txt. Launcher cũng thay JWT secret mẫu bằng secret ngẫu nhiên riêng trong backend/.env khi cần; không in secret ra log. File này chứa mật khẩu, không gửi kèm đồ án công khai. Khi đổi/reset local admin: dừng ứng dụng, đặt ADMIN_EMAIL/ADMIN_PASSWORD (ít nhất 12 ký tự) trong terminal rồi chạy dev:full; sau đó bỏ các biến khỏi phiên terminal. Không đặt mật khẩu vào mã nguồn.

### Audio

Khởi chạy npm run dev:local-tts rồi npm run audio:generate để sinh những bản còn thiếu bằng engine trên máy. Có nút Tạo MP3 miễn phí ở từng điểm. Engine và dữ liệu nằm local; chỉ lần build đầu cần mạng tải thư viện. Không ghi đè bản MP3 READY đã có.

Quản trị → Tải MP3 → chọn đúng tiếng/giọng/file. Phải có bản dịch trước. Nghe lại ở Khám phá. Sau khi sửa script, tải MP3 mới. Lưu gói offline rồi thử không mạng. Nếu chưa có MP3 thì giao diện dùng giọng máy khi có thể và không báo giả rằng đã có offline audio.

### Mạng

Mặc định web/backend bind loopback. Chia sẻ web qua LAN chỉ cần HOST=0.0.0.0 và PUBLIC_WEB_URL; backend vẫn ở máy local qua proxy. Native trực tiếp cần API_HOST=0.0.0.0 và IP LAN trong mobile .env. Chỉ mở firewall cho mạng cần dùng. GPS/camera/PWA trên điện thoại cần HTTPS phù hợp.

### Dữ liệu và khôi phục

Không xóa volume để xử lý lỗi. Backup bằng npm run backup; kiểm tra cả database.dump và storage/. Restore vào DB thử riêng trước. Đổi URL asset cũ hoặc khôi phục database thấp revision hơn có thể cần tải lại gói offline từ đầu.

## 7. Tài liệu chính thức đã tra cứu

Đã tìm bằng trình duyệt và đối chiếu nguồn chính thức; triển khai theo API tương thích thư viện đang cài, không sao chép các chức năng chỉ có ở Nest phiên bản mới hơn.

- [NestJS upload và FileInterceptor](https://docs.nestjs.com/techniques/file-upload).
- [eSpeak NG: ngôn ngữ hỗ trợ và kiểm tra voices](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md).
- [pykakasi: chuyển Kanji sang cách đọc](https://pykakasi.readthedocs.io/en/latest/api.html).
- [Node.js crypto/scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html).
- [MapLibre React Native — migration v10](https://maplibre.org/maplibre-react-native/docs/setup/migrations/v10/).
- [MapLibre setup và yêu cầu nguồn tiles](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/).
- [MDN: giọng Web Speech local/remote](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).
- [OSM: không bulk-download tile công cộng để offline](https://operations.osmfoundation.org/policies/tiles/).
- [Google TTS: billing và setup](https://docs.cloud.google.com/text-to-speech/docs/get-started).

Các nội dung đối chiếu trên không thay kết quả kiểm thử tại máy; phần chưa kiểm chứng được nêu riêng ở mục 5.
