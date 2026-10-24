# Build APK bằng Android Studio trên Windows

Hướng dẫn cho dự án hiện tại: Expo SDK 54, React Native 0.81.5, mã Android đã sinh trong `mobile/android`. Tên app là Cát Tiên Audio Guide, applicationId `vn.namcattien.audioguide`. Chưa có APK mới được build hoặc kiểm thử trên thiết bị trong lần viết hướng dẫn này.

## 1. Chuẩn bị Android Studio và SDK

Cài Android Studio từ https://developer.android.com/studio nếu chưa có. Build trên máy và cài APK trực tiếp không cần mua gói EAS hoặc tài khoản Google Play.

Trong Android Studio mở **Tools → SDK Manager** (hoặc **More Actions → SDK Manager** ở màn hình chào):

- SDK Platforms: Android SDK Platform 36.
- SDK Tools: Android SDK Build-Tools 36.0.0, Android SDK Platform-Tools, Android SDK Command-line Tools.
- SDK Tools → Show Package Details: NDK (Side by side) 27.1.12297006; cài CMake theo phiên bản Gradle yêu cầu.
- Android Emulator và system image chỉ cần nếu thử bằng máy ảo.

Các phiên bản trên lấy từ bộ thư viện đang khóa của dự án. Không chủ động nâng Gradle/Android Gradle Plugin khi IDE gợi ý trong lúc chuẩn bị demo. Gradle Wrapper hiện là 8.14.3.

Trong **Settings → Build, Execution, Deployment → Build Tools → Gradle**, chọn Gradle JDK là Embedded JDK/JBR tương thích Android Studio, tối thiểu Java 17. Giữ dùng Gradle Wrapper của dự án. Cần Node.js 24+ trong PATH; nếu vừa cài Node, khởi động lại Android Studio.

## 2. Chuẩn bị thư viện mobile

Mở terminal:

```powershell
cd "C:\Users\Home\Desktop\smart-audio-guide\smart-audio-guide\mobile"
npm ci
```

Không mở `web` hay toàn bộ thư mục gốc làm dự án Android. Không dùng Expo Go: app có các module native như MapLibre, BLE, camera và MMKV.

Thư mục `android` đã có, không cần chạy prebuild lại chỉ để mở IDE. Nếu sau này thay đổi plugin hoặc cấu hình native trong app.json, đồng bộ bằng:

```powershell
npx expo prebuild --platform android --no-install
```

Không dùng `--clean` tùy tiện vì sẽ tạo lại thư mục native, có thể mất chỉnh sửa thủ công.

## 3. Cấu hình địa chỉ backend cho điện thoại

Tại thư mục gốc mở terminal khác, chạy một phiên hệ thống:

```powershell
cd "C:\Users\Home\Desktop\smart-audio-guide\smart-audio-guide"
npm run dev:gemini:lan
```

Giữ terminal này mở. Xem IP và cổng tại dòng **Điện thoại cùng Wi-Fi**. Ví dụ `http://192.168.1.60:4173/?source=api`.

Trong thư mục `mobile`, tạo file `.env` từ `.env.example`, rồi sửa các dòng sau:

```env
EXPO_PUBLIC_API_BASE=http://192.168.1.60:4173/content-api
EXPO_PUBLIC_QR_API_BASE=http://192.168.1.60:4173/qr-api
EXPO_PUBLIC_ASSET_BASE=http://192.168.1.60:4173/audio-assets
EXPO_PUBLIC_MAP_ID=00000000-0000-0000-0000-000000000001
EXPO_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json
EXPO_PUBLIC_OFFLINE_MAP_STYLE=
```

Thay IP/cổng bằng giá trị thực tế. Nếu web đang dùng 4180 thì thay cả ba dòng sang 4180. Các đường dẫn `/content-api`, `/qr-api`, `/audio-assets` là proxy đã có trong web/server.mjs; không thêm `/api/v1` sau các đường dẫn proxy này. Cách này không yêu cầu mở thêm các cổng backend 3001/3002/3003 ra LAN.

Trước khi build, dùng trình duyệt điện thoại kiểm tra:

```text
http://192.168.1.60:4173/?source=api
http://192.168.1.60:4173/content-api/configs
```

Trang thứ hai phải trả JSON. Nếu không truy cập được, kiểm tra máy tính/điện thoại cùng Wi-Fi, terminal server còn chạy, URL đúng và quyền mạng Private cho Node khi Windows hỏi. Không tắt toàn bộ firewall.

Nếu dùng máy ảo Android Studio trên cùng máy tính, thay `192.168.1.60` bằng `10.0.2.2` trong cả ba dòng, giữ đúng cổng và proxy. Không dùng `127.0.0.1` cho điện thoại thật vì địa chỉ đó trỏ vào chính điện thoại.

Các biến EXPO_PUBLIC được đưa vào bundle khi build. Sau khi thay IP/cổng phải build lại APK để áp dụng. Khóa Gemini chỉ ở backend/.env; không đưa khóa, JWT secret hoặc mật khẩu admin vào mobile/.env hay APK.

## 4. Mở dự án Android

Android Studio → **Open**, chọn đúng thư mục:

```text
C:\Users\Home\Desktop\smart-audio-guide\smart-audio-guide\mobile\android
```

Đợi Gradle Sync hoàn tất. Chấp nhận các SDK license hoặc yêu cầu cài SDK/NDK đúng phiên bản. Nếu IDE báo thiếu SDK location, chọn SDK trong Project Structure/SDK Manager hoặc tạo file `mobile/android/local.properties` với đường dẫn SDK thực tế, ví dụ:

```properties
sdk.dir=C:/Users/Home/AppData/Local/Android/Sdk
```

Đường dẫn này chỉ là ví dụ; kiểm tra ô Android SDK Location trong SDK Manager. Không chép local.properties của máy khác nếu vị trí khác nhau.

## 5. Xuất APK độc lập để demo

Dùng **Build → Generate Signed App Bundle or APK** (tên menu có thể khác nhẹ theo phiên bản IDE):

1. Chọn **APK**, không chọn Android App Bundle nếu muốn cài file trực tiếp.
2. Module: `app`.
3. Chọn **Create new** để tạo keystore riêng, hoặc chọn keystore đã dùng trước đó.
4. Nhập mật khẩu và alias, giữ bản sao keystore và thông tin này ở nơi riêng tư để ký các bản cập nhật sau.
5. Chọn build variant **release** và bắt đầu build.
6. Khi thành công, bấm **Locate** để lấy đúng file APK do IDE xuất.

Bản release được bundle JavaScript để chạy không cần Metro. Backend vẫn cần hoạt động để tải/cập nhật dữ liệu; các MP3 chưa được tạo không tự xuất hiện sau khi build APK.

Không chia sẻ debug.keystore hoặc dùng khóa debug để phát hành chính thức. Cấu hình Gradle mẫu hiện có release dùng debug signing khi build qua lệnh; wizard ký riêng ở trên là lựa chọn cho bản bàn giao ký bằng keystore của bạn.

Nếu chỉ cần một APK release ký debug để thử nội bộ, Android Studio Terminal ở `mobile/android` có thể chạy:

```powershell
.\gradlew.bat assembleRelease
```

Theo cấu hình hiện tại, file thường ở `mobile/android/app/build/outputs/apk/release/app-release.apk`. Đây là khóa debug của dự án, không phải bản ký phát hành riêng. Chưa có kết quả build thực tế để cam kết tất cả native module đã tương thích.

## 6. Cài và kiểm thử APK

Chép APK sang điện thoại, cho phép cài từ nguồn vừa dùng khi Android hỏi và cài ứng dụng. Hoặc bật Developer options → USB debugging, kết nối USB và cài bằng adb/Android Studio.

Kiểm tra: mở app, chọn ngôn ngữ, tải POI, xem sơ đồ/bản đồ, nghe một bài Google đã sẵn sàng, QR, quyền GPS và tự phát ở POI có tọa độ xác thực. Sau đó tải gói ngoại tuyến, ngắt mạng thật, mở lại và nghe đúng MP3 đã tải. BLE cần beacon thật; máy ảo không thay thế kiểm thử GPS/BLE ngoài thực tế.

APK chứa ứng dụng mobile; không tự chứa backend NestJS/PostgreSQL và không tự mang theo toàn bộ audio trên máy tính. Nếu backend chỉ chạy trên laptop thì laptop phải mở và server phải chạy khi điện thoại tải/cập nhật dữ liệu.

## 7. Chạy debug để sửa lỗi bằng Android Studio

Trong terminal ở `mobile`, chạy:

```powershell
npm start
```

Sau đó trong Android Studio chọn thiết bị và bấm Run. Bản debug dùng development client và thường cần Metro còn chạy; không dùng bản này để đánh giá rằng APK release có thể hoạt động độc lập. Nếu điện thoại USB không kết nối Metro, có thể dùng `adb reverse tcp:8081 tcp:8081` khi adb đã sẵn sàng và Metro dùng cổng 8081.

## Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| SDK location not found | Cấu hình SDK Location/local.properties đúng máy. |
| Node không được tìm thấy khi sync | Cài Node 24+, thêm PATH, mở lại Android Studio. |
| Ninja: Filename longer than 260 characters | Dự án đã có plugin rút ngắn đường dẫn CMake trên Windows; Sync rồi build lại. Xem WINDOWS_CMAKE_PATH_FIX.md. |
| JDK/Java không phù hợp | Kiểm tra Gradle JDK; dùng JDK/JBR tương thích, tối thiểu 17. |
| Không tìm thấy SDK/NDK/CMake | Cài đúng phiên bản Gradle yêu cầu trong SDK Manager. |
| Could not resolve dependency | Kiểm tra mạng tải Gradle/Maven, tắt Gradle Offline Mode nếu đang bật; đọc lỗi đầu tiên. |
| Cài được nhưng không tải POI/MP3 | Kiểm tra mobile/.env, IP/cổng/proxy, web server còn chạy; sửa xong build lại. |
| App yêu cầu Metro | Đang chạy bản debug/dev client; dùng release để demo độc lập với Metro. |
| Google narration not ready | Chưa có MP3 đúng bài/ngôn ngữ; đây không phải lỗi build APK. |
| App not installed khi cập nhật | Có thể khác khóa ký; kiểm tra chữ ký. Gỡ bản cũ sẽ mất dữ liệu offline, chỉ làm khi đã chấp nhận mất dữ liệu đó. |

Nếu build thất bại ở module native, lấy lỗi đầu tiên trong Build Output/Logcat để xử lý; không sửa bằng cách xóa database, nâng toàn bộ thư viện hoặc tắt New Architecture tùy tiện.

## Tài liệu chính thức

- Expo phát triển local: https://docs.expo.dev/guides/local-app-development/
- Expo release local: https://docs.expo.dev/guides/local-app-production/
- Android Studio build APK và ký: https://developer.android.com/build/build-for-release
- Expo thiết lập Android SDK: https://docs.expo.dev/workflow/android-studio-emulator/
