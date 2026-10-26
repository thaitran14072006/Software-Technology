# Cài đặt và cùng phát triển Smart Audio Guide

## 1. Nhận mã và chạy web/backend

Repository: https://github.com/thaitran14072006/Software-Technology. Các lệnh dưới chạy tại thư mục gốc repository, nơi chứa `package.json`.

Cài Git, Node.js 24 trở lên và Docker Desktop; bật Linux containers. Lần đầu cần Internet để cài thư viện và tải image PostgreSQL.

```powershell
git clone https://github.com/thaitran14072006/Software-Technology.git
cd Software-Technology
npm run dev:full
```

Nếu đã clone, mở thư mục đã có và chạy `git pull --ff-only`, không clone chồng vào thư mục đó. `dev:full` tự tạo `backend/.env` từ mẫu, tạo JWT secret riêng, cài backend khi chưa có thư viện, build ba service, khởi tạo PostgreSQL, nhập dữ liệu mẫu và tạo tài khoản admin riêng.

Mở http://127.0.0.1:4173/?source=api. Khách không đăng nhập. Admin vào **Kết nối → Đăng nhập quản trị**, dùng tài khoản trong `backend/.runtime/admin-login.txt` trên máy của mình. Không gửi file này lên Git.

Dữ liệu đi kèm: 15 POI, 75 bản dịch và 5 MP3 Google AI Studio khớp nội dung. Không cần API key để phát MP3 đã có. Còn 70 bài thiếu Google; nhập mẫu không tự gọi API, không chia sẻ hàng đợi riêng của tác giả. Mỗi máy có database, tài khoản và token QR độc lập. Nhập mẫu chỉ thêm mã POI chưa có, không ghi đè thay đổi cũ.

Chỉ chạy một phiên hệ thống. Ctrl+C dừng ứng dụng; `npm run infra:stop` dừng container và giữ dữ liệu. Nếu cổng 4173/3001/3002/3003 bị chiếm, xem [STARTUP_PORT_FIX.md](STARTUP_PORT_FIX.md). Không dùng `docker compose down -v` để cập nhật mã.

## 2. Google AI Studio, LAN và ngoại tuyến

Để dùng điện thoại cùng Wi-Fi với Google, tự thêm `GEMINI_API_KEY` của nhóm vào **backend/.env**, dừng phiên cũ rồi chạy:

```powershell
npm run dev:gemini:lan
```

Dùng URL LAN chương trình in ra để tạo/quét QR. Không đưa khóa vào `mobile/.env` hoặc Git. Việc tạo bài mới dùng `npm run audio:gemini` ở terminal khác, cần backend đang chạy ở chế độ GEMINI; chỉ tạo trong quota thực tế của Google. Khi hết quota, chờ thời điểm được phép thử lại, không bật billing để vượt hạn mức miễn phí.

Không có khóa: `npm run dev:full` vẫn phát các MP3 Google đã có. Muốn LAN ở chế độ này, dùng `npm run dev:full -- --lan`. `npm run dev:lan` là lựa chọn eSpeak cục bộ, giọng khác Google. Tính năng GPS/camera/PWA trên điện thoại qua web cần HTTPS; HTTP LAN vẫn dùng để mở trang và nghe MP3.

Tạo gói tải ngoại tuyến từ backend đang chạy tại cổng mặc định:

```powershell
npm run offline:archive
```

Gói tạo ở `web/dist/offline-guide.zip`, chỉ chứa audio Google đã sẵn sàng. Thành viên tạo lại gói trên máy mình; thư mục build không đưa lên Git. Người dùng đã tải gói cũ cần tải lại để có bài mới. Basemap OSM không được đảm bảo hoạt động ngoại tuyến.

## 3. Chạy Android

Giữ web/backend đang chạy, mở terminal khác tại repository:

```powershell
cd mobile
Copy-Item .env.example .env
npm ci
npx expo prebuild --platform android --no-install
```

Mẫu mobile dùng `10.0.2.2:4173` cho máy ảo Android qua proxy web. Nếu dùng điện thoại, thay `10.0.2.2` bằng IP LAN của máy chạy backend. Không thêm `/api/v1` sau `/content-api` hoặc `/qr-api`. Nếu đổi cổng web, sửa cả ba URL tương ứng.

Mở thư mục `mobile/android` trong Android Studio, cài SDK/NDK theo [BUILD_ANDROID_STUDIO.md](BUILD_ANDROID_STUDIO.md), chờ Gradle sync. Bật máy ảo rồi chạy `npm run android` trong `mobile`; hoặc giữ `npm start` và bấm Run trong Android Studio sau khi build debug. Không dùng Expo Go vì ứng dụng có native modules.

`npm ci` tự áp dụng bản sửa TrackPlayer; Expo config plugin giữ bản sửa đường dẫn CMake khi tạo native project mới. Không sửa trực tiếp `node_modules` rồi mong Git giữ thay đổi. `mobile/android`, SDK paths, build cache và khóa ký không được commit. Debug cần Metro đang chạy; APK release cần build và ký riêng. Bản đã kiểm chứng hiện tại là debug x86_64 trên máy ảo, chưa phải APK ARM đã thử trên điện thoại.

## 4. Kiểm tra trước khi gửi thay đổi

```powershell
npm test
npm --prefix backend run build
npm --prefix backend test -- --runInBand
npm --prefix mobile test -- --runInBand
npm --prefix mobile run test:i18n
```

Kiểm tra TypeScript: tại `mobile`, chạy `npx tsc --noEmit`. Khi PostgreSQL local đang chạy, `npm run test:shared-content` kiểm tra nhập dữ liệu vào database tạm riêng, tự xóa database tạm sau kiểm tra. Không dùng test tích hợp API trên database đang biên tập nội dung quan trọng nếu chưa đọc tác động của test.

## 5. Quy trình làm việc nhóm

```powershell
git switch main
git pull --ff-only
git switch -c feature/your-feature
# Sửa mã, kiểm tra rồi chọn file cần đưa lên.
git add <files>
git commit -m "feat: describe the completed change"
git push -u origin feature/your-feature
```

Tạo pull request để thành viên khác review trước khi merge main. Viết toàn bộ thông điệp commit bằng tiếng Anh. Sau khi pull thay đổi lockfile, chạy lại `npm ci` ở backend/mobile tương ứng; nếu đổi native dependency hoặc Expo plugins, chạy lại prebuild và build APK. Dừng và khởi động lại ứng dụng sau khi cập nhật backend.

Git đồng bộ mã và fixture đã commit; không đồng bộ database đang chạy. Muốn chia sẻ nội dung/audio mới: chạy `npm run content:export` trên máy có nội dung chuẩn, review `backend/fixtures/content.json` và MP3 liên quan, rồi commit. Export chỉ lấy POI published và audio Google khớp transcript, giữ audio đã chia sẻ khớp nội dung; không xuất người dùng, mật khẩu, lịch sử khách hay token. Sau khi pull, dừng app và chạy `npm run content:seed` để nhận MP3 mới vào các POI có transcript khớp. Xem [cách chia bài và dùng AI Studio của từng thành viên](COLLABORATIVE_AUDIO.md).

Máy đã có POI không tự bị ghi đè khi fixture thay đổi. Nhóm cần thống nhất nội dung chuẩn, dùng chức năng quản trị để cập nhật có chọn lọc và tải MP3 tương ứng; không xóa volume để ép đồng bộ. Việc lập lịch tạo audio trong Codex là cấu hình riêng trên máy tác giả, không tự cài vào máy của collaborator.

## 6. Phạm vi và việc còn lại

Web/backend và khởi động mobile debug đã được kiểm chứng. Cần tiếp tục tạo 70 bài Google, thử luồng offline và tải lại gói trên thiết bị thật, kiểm chứng GPS/BLE thực địa và build/kiểm tra APK release cho kiến trúc điện thoại. Tọa độ có nguồn chưa đồng nghĩa đã khảo sát; chỉ bật `geoVerified` khi đã xác minh.

Các báo cáo cũ trong `docs/` ghi lại thời điểm kiểm tra trước đây; dùng README, hướng dẫn này và trạng thái thực tế khi đánh giá bản mới.


## 7. Cập nhật danh sách 15 POI trên máy đã có database cũ

Không xóa database hoặc volume. Sau khi lưu thay đổi của mình và pull mã mới, chạy `npm run dev:full`, đợi khởi động xong để nhập các POI còn thiếu từ fixture mới, rồi dừng ứng dụng bằng Ctrl+C (Docker giữ chạy).

```powershell
npm run content:catalog
npm run content:catalog -- --apply
```

Lệnh đầu chỉ xem trước. Lệnh `--apply` là thao tác một lần có sao lưu tại `backend/.runtime/catalog-backups`: giữ đúng 15 mã chuẩn, cập nhật tên/tọa độ/thứ tự, lưu trữ mềm tám điểm ngoài danh sách. Không tự thực hiện ở mọi lần khởi động. Nếu máy có điểm bổ sung không thuộc nhóm tám điểm đã biết, công cụ dừng để nhóm xem xét thay vì tự xóa. Giữ transcript và các MP3 khớp nội dung.

Chạy lại `npm run dev:gemini:lan` nếu đã cấu hình khóa riêng, hoặc `npm run dev:full -- --lan` để dùng MP3 sẵn có. Nhấn Ctrl+F5 trên web và lưu lại gói ngoại tuyến. Xem [danh sách hiện hành](ACTIVE_POIS.md) và [bản sửa sơ đồ](MAP_DISPLAY_FIX.md).

Keystore và ghi chú trong `mobile/AndroidKeys/` được bỏ qua toàn bộ. Thành viên tự tạo khóa ký và giữ riêng; không chia sẻ `.env`, mật khẩu quản trị hay khóa AI Studio qua Git. Native project `mobile/android` được tạo trên từng máy bằng Expo prebuild.
