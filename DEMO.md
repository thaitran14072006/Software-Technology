> **Tài liệu phiên bản trước.** Chạy bản hiện tại theo [README.md](README.md) và xem [báo cáo thay đổi](docs/CHANGES_AND_STATUS.md). Hạ tầng local, đăng nhập admin, MP3 miễn phí và API đã thay đổi; các ghi nhận kiểm thử bên dưới là lịch sử.

# Chạy demo — Smart Audio Guide

## Web: chạy nhanh

Từ thư mục gốc, chạy `npm run dev`, mở **http://127.0.0.1:4173**. Không cần Docker cho chế độ demo cục bộ. Để dùng backend thật, bật Docker Desktop rồi chạy `npm run dev:full`, chọn Kết nối → Backend NestJS trên giao diện. Xem **[WEB_DEMO.md](WEB_DEMO.md)** để chạy quản trị, ngoại tuyến và kiểm thử. Các bước dưới đây dành cho backend thủ công và ứng dụng Android.

Yêu cầu: Docker Desktop, Node.js ≥ 20.12 (khuyên dùng 22), JDK 17 + Android Studio (SDK + emulator) hoặc điện thoại Android bật USB debugging, tài khoản Mapbox miễn phí (2 token). Google TTS key là tùy chọn.

## A. Backend
```powershell
cd backend
copy .env.example .env                      # (bash: cp)
docker compose -f docker/docker-compose.yml up -d     # lần đầu tự chạy db/schema.sql
Get-Content db/dev-seed.sql -Raw | docker compose -f docker/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U sag -d sag
npm install
# 3 cửa sổ terminal riêng:
npm run start:content    # :3001
npm run start:audio      # :3002   (không có GOOGLE_TTS_KEY vẫn chạy: audio FAILED, app tự đọc bằng giọng máy)
npm run start:qr         # :3003
```
Nạp dữ liệu (terminal khác, thư mục `backend`):
```powershell
$env:JWT_SECRET="change-me-in-dev"          # trùng JWT_SECRET trong .env     (bash: export ...)
$env:ADMIN_TOKEN = node ..\scripts\dev-token.js
node ..\scripts\seed-from-legacy.js http://localhost:3001/api/v1 00000000-0000-0000-0000-000000000001
Get-Content db/dev-seed.sql -Raw | docker compose -f docker/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U sag -d sag
curl "http://localhost:3001/api/v1/pois?mapId=00000000-0000-0000-0000-000000000001&lang=vi"   # phải thấy 15 điểm
```

## B. Mobile
```powershell
cd mobile
copy .env.example .env      # điền EXPO_PUBLIC_MAPBOX_TOKEN (pk....)
# app.json: thay RNMapboxMapsDownloadToken bằng token bí mật sk.... (scope DOWNLOADS:READ)
npm install
npx expo install --fix
# thay src\assets\map-bg.jpg bằng assets\map-bg.jpg của app web
npx expo prebuild
npx expo run:android        # emulator hoặc điện thoại; dùng IP LAN thay 10.0.2.2 trong .env nếu là điện thoại thật
```

## C. Kịch bản demo
1. Mở app → Splash → chọn ngôn ngữ → Bắt đầu → sơ đồ + 15 điểm.
2. Chạm số 9 (hoặc danh sách) → ▶ Nghe (file MP3 nếu có TTS, không thì giọng máy).
3. Chọn điểm → bấm ⌖ (GPS) → "Chỉ đường" → đường chấm vàng + km/phút theo sơ đồ.
4. Auto-play bằng GPS (chỉ node 9 đã xác thực): bật ⌖, rồi đặt vị trí giả lập hai lần liên tiếp
   `adb emu geo fix 107.34348 11.457891`   (kinh độ trước, vĩ độ sau). Chấm xanh trên sơ đồ sẽ lệch vì phép chiếu chỉ ước lượng.
5. QR: tạo token rồi in mã `sag://poi/demo-bausau-001` (bất kỳ trình tạo QR nào), bấm ▦ và quét:
   `docker exec -it $(docker ps -qf name=postgres) psql -U sag -d sag -c "INSERT INTO poi_qr_codes(kind,poi_id,token) SELECT 'POI',id,'demo-bausau-001' FROM pois WHERE code='9';"`
6. Offline: cuối trang bấm "Tải gói ngoại tuyến" → tải → bật chế độ máy bay → mở lại app: danh sách, thuyết minh, QR vẫn dùng được.

## D. Lỗi thường gặp
- App không tải được danh sách: kiểm tra `EXPO_PUBLIC_API_BASE` (emulator 10.0.2.2; điện thoại thật dùng IP LAN, mở cổng 3001/3003 trên tường lửa) và đã `prebuild` lại sau khi đổi `app.json`.
- `DATABASE_URL`/`RABBITMQ_URL` undefined: chạy lệnh trong thư mục `backend` có file `.env`.
- Build lỗi Mapbox 401: sai token tải `sk.` trong `app.json`.
- Schema đã khởi tạo rồi muốn nạp lại: `docker compose -f docker/docker-compose.yml down -v`.
