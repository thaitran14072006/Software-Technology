> **Tài liệu phiên bản trước.** Chạy bản hiện tại theo [README.md](README.md) và xem [báo cáo thay đổi](docs/CHANGES_AND_STATUS.md). Hạ tầng local, đăng nhập admin, MP3 miễn phí và API đã thay đổi; các ghi nhận kiểm thử bên dưới là lịch sử.

# Web demo — Cát Tiên

## 1. Chạy ngay

Yêu cầu Node.js ≥ 20.12. Mở terminal tại thư mục dự án:

```powershell
npm run dev
```

Mở **http://127.0.0.1:4173**. Web không cần cài thư viện. Chế độ mặc định **Demo cục bộ** lưu thay đổi trong trình duyệt đang dùng, không ghi vào backend.

Kịch bản:

1. Chọn điểm 9 trên sơ đồ hoặc danh sách → Nghe thuyết minh.
2. Đổi ngôn ngữ Việt/Anh/Nhật/Hàn/Trung để xem nội dung và nghe bằng giọng có sẵn trên thiết bị.
3. Tìm `Bau Sau` để thử tìm kiếm không dấu hoặc lọc theo nhóm.
4. Chọn điểm xuất phát → Tìm đường. Đường vàng và khoảng cách chỉ dùng trên sơ đồ, không phải chỉ đường GPS thực địa.
5. **QR Code** → mã **Tham gia hệ thống** dẫn vào trang tham quan; có nút tải SVG và sao chép liên kết. Phần Mở điểm tham quan phía dưới vẫn nhận `9` hoặc `sag://poi/demo-bausau-001`. Camera dùng khi trình duyệt có `BarcodeDetector`; ô nhập mã luôn có sẵn.
6. Lưu để dùng ngoại tuyến → đợi lưu thành công → dừng server, tải lại trang và thử đổi ngôn ngữ. MP3 chỉ có khi backend đã tạo và tải được. TTS trình duyệt có thể vẫn cần mạng.
7. Tab Quản trị → sửa điểm hoặc thêm bản nháp. Chọn Đã xuất bản để điểm xuất hiện trên trang tham quan. Thay đổi demo chỉ lưu tại trình duyệt này.

## 2. Backend thật và quản trị

Bật Docker Desktop. Dừng server demo nếu đang chiếm cổng 4173, rồi chạy từ thư mục gốc:

```powershell
npm run dev:full
```

Lần đầu cần mạng để tải thư viện và Docker images. Script tạo `backend/.env` từ mẫu nếu chưa có, giữ cấu hình hiện có, khởi động hạ tầng, build ba service, tạo danh tính quản trị demo và nạp những điểm chưa tồn tại. Nội dung đã chỉnh sửa không bị seed ghi đè.

Script chỉ tự seed vào `postgres://sag:sag@localhost:5432/sag`. Với cơ sở dữ liệu khác, chạy thủ công theo [DEMO.md](DEMO.md) để kiểm soát việc nạp dữ liệu.

Mở web → **Kết nối → Backend NestJS → Áp dụng kết nối**. Dòng trạng thái phải hiển thị **BACKEND TRỰC TIẾP**. Trang tham quan không cần token.

Để dùng Quản trị, mở terminal khác tại thư mục gốc:

```powershell
npm run token
```

Dán token vào ô JWT quản trị trong Kết nối. Token HS256 có hạn 24 giờ, lấy `JWT_SECRET` từ `backend/.env` hoặc biến môi trường và chỉ lưu trong phiên tab. Hệ thống chưa có đăng nhập tài khoản/mật khẩu.

| Thành phần | Cổng mặc định |
| --- | --- |
| Web | 4173 |
| Content/POI | 3001 |
| Audio/TTS | 3002 |
| QR/BLE | 3003 |
| PostgreSQL / Redis | 5432 / 6379 |
| RabbitMQ / MongoDB | 5672 / 27017 |

`Ctrl+C` dừng các tiến trình ứng dụng. Nhật ký nằm ở `backend/.runtime/`. Để dừng container và giữ dữ liệu:

```powershell
npm run infra:stop
```

Chưa điền `GOOGLE_TTS_KEY` thì audio có trạng thái FAILED, nhưng nội dung vẫn lưu và web dùng giọng đọc của trình duyệt. Sau khi thêm key và khởi động lại service, bấm **Tạo lại audio lỗi** trong Quản trị.

## 3. Cấu hình web riêng

```powershell
$env:PORT = '4180'
$env:CONTENT_API_URL = 'http://127.0.0.1:3001'
$env:QR_API_URL = 'http://127.0.0.1:3003'
npm run dev
```

URL upstream không chứa `/api/v1`; máy chủ web tự thêm tiền tố. Mặc định chỉ lắng nghe loopback. Trên LAN có thể đặt `HOST=0.0.0.0`; GPS, camera và PWA trên thiết bị khác cần HTTPS.

`npm run build` tạo `web/dist/`. Có thể phục vụ thư mục này bằng static hosting để dùng demo. Chế độ backend cần máy chủ proxy của dự án hoặc reverse proxy tương đương cho `/content-api/` và `/qr-api/`.

## 4. Kiểm chứng

```powershell
npm test
npm --prefix backend test -- --runInBand
# Cần dev:full đang chạy. Tạo rồi xóa mềm một điểm kiểm thử riêng.
npm run test:integration
npm run test:analytics
```

Đã chạy đạt 22 test web, 9 test backend và các kịch bản tích hợp web–API–PostgreSQL: JWT 401/403, CRUD, QR, manifest, người dùng hoạt động, chống đếm trùng và lượt nghe theo ngôn ngữ. Cả ba service đã build và chạy với hạ tầng Docker. Mã QR đã được kiểm tra bằng bộ giải mã jsQR độc lập với ba URL (loopback, LAN và HTTPS).

Đã thử trên trình duyệt: tìm kiếm không dấu, tính tuyến, chuyển ngôn ngữ, lưu gói, sửa nội dung demo và mở QR từ API. Sau khi dừng máy chủ, đã tải lại trang và đổi sang tiếng Nhật từ gói backend đã lưu. Kiểm tra ở chiều rộng 390 px và 1366 px không có tràn ngang. Ảnh desktop được lưu tại `web/test-results/web-desktop.jpg` (không đưa vào Git).

Không có Google TTS key để kiểm chứng MP3 thật; camera/GPS/BLE trên thiết bị và bản Android chưa được kiểm thử trong lần bổ sung web này.

## 5. Giới hạn và xử lý lỗi

- Cổng bận: dừng lần chạy trước hoặc đổi `PORT`. `dev:full` ghi rõ service thoát và đường dẫn log nếu có lỗi.
- Docker không kết nối: mở Docker Desktop và kiểm tra quyền terminal. Không cần Docker khi chỉ chạy `npm run dev`.
- Quản trị báo JWT lỗi: tạo lại token và kiểm tra `JWT_SECRET` trùng backend.
- Backend không có dữ liệu: kiểm tra đã seed và upstream đúng. Web không tự đổi sang demo khi API lỗi; chỉ dùng gói API đã lưu nếu có.
- Không nghe được tiếng Việt: kiểm tra giọng đã cài trên thiết bị hoặc thử English. Giọng Web Speech phụ thuộc hệ điều hành/trình duyệt.
- Ngoại tuyến cần mở trang online một lần và đợi lưu thành công. Nếu audio không tải được, giao diện báo số file lỗi. Giọng TTS không được đóng gói thành MP3.
- GPS chỉ tự phát tại điểm đã xác thực, khi người dùng bật GPS và Tự phát; web phải đang mở. Camera/GPS cần người dùng cho phép. BLE và định vị nền thuộc ứng dụng native.
- Sơ đồ không theo tỉ lệ. Tuyến dựa trên các quan hệ khoảng cách gốc; khoảng cách điểm 1 đến trung tâm là giả định **0,12 km**. Chỉ điểm 9 có GPS đánh dấu xác thực; các tọa độ còn lại của backend là ước lượng.
- Quản trị hỗ trợ CRUD, bản dịch, xuất bản và tạo lại TTS lỗi. Đăng nhập hoàn chỉnh, upload audio, heatmap và triển khai production còn nằm ngoài bản demo này.

## 6. QR tham gia và dashboard thống kê

Trong **QR Code → Tham gia hệ thống**, điền địa chỉ mà điện thoại truy cập được, bấm Cập nhật mã QR rồi tải ảnh hoặc sao chép liên kết. Mã chỉ giữ địa chỉ trang tham quan và chế độ dữ liệu (`source=demo`/`source=api`), không chứa JWT quản trị. Không dùng `127.0.0.1`/`localhost` để chia sẻ sang điện thoại khác.

Ví dụ chia sẻ trên cùng mạng Wi-Fi (thay IP ví dụ bằng IP LAN của máy chạy ứng dụng):

```powershell
$env:HOST = '0.0.0.0'
$env:PUBLIC_WEB_URL = 'http://192.168.1.12:4173/'
npm run dev
# Hoặc npm run dev:full để dùng backend
```

Cho phép cổng web qua tường lửa nếu cần. Máy chủ phải đang chạy; GPS, camera và PWA trên điện thoại cần HTTPS. `PUBLIC_WEB_URL` là URL công khai được dùng làm mặc định cho QR; cũng có thể nhập URL trực tiếp trong hộp thoại. Nếu dùng MP3 local từ backend trên LAN, đặt `PUBLIC_ASSET_BASE` trong `backend/.env` theo IP LAN/cổng 3002 tương ứng.

Dashboard hiển thị:

- **Người đang sử dụng**: số mã trình duyệt ẩn danh khác nhau có trang tham quan đang hiển thị và gửi heartbeat trong 90 giây gần nhất. Gửi heartbeat mỗi 25 giây. Nhiều tab cùng trình duyệt tính một người; trang quản trị không tính vào số này.
- **Tổng lượt nghe / hôm nay**: mỗi lần bắt đầu phát MP3 hoặc giọng máy tính một lượt, kể cả dừng giữa chừng. Các callback phát lại hoặc chuyển MP3 sang TTS không nhân đôi lượt nghe. “Hôm nay” theo giờ Việt Nam; lượt nghe ngoại tuyến được tính vào ngày máy chủ nhận lại sự kiện.
- **Từng bản thuyết minh**: đếm theo điểm và ngôn ngữ; có bộ lọc ngôn ngữ, cả các bản đã xuất bản chưa có lượt nghe. Tự làm mới mỗi 25 giây hoặc bấm Làm mới.

Chế độ demo tổng hợp lượt nghe từ các trình duyệt kết nối cùng máy chủ web, lưu tại `web/.runtime/listens.json`. Nội dung CRUD demo vẫn riêng từng trình duyệt. Số người đang dùng được tính lại sau khi máy chủ khởi động; lượt nghe được giữ lại. Chế độ backend lưu sự kiện trong PostgreSQL và chỉ cho ADMIN/EDITOR đọc thống kê. Web lưu hàng đợi lượt nghe ngoại tuyến để gửi lại khi kết nối được; ảnh QR vẫn tạo được ngoại tuyến sau khi đã lưu giao diện.

`npm run dev:full` tự áp dụng migration `backend/db/analytics.sql` cho cả database cũ. Nếu chạy service thủ công, chạy migration trước khi khởi động content service:

```powershell
Get-Content backend/db/analytics.sql -Raw | docker compose -f backend/docker/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U sag -d sag
```

`npm run test:analytics` tạo dữ liệu kiểm thử riêng rồi xóa các sự kiện/phiên do chính lần chạy đó tạo ra, để không làm tăng số liệu dashboard.
