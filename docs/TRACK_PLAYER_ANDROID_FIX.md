# Sửa lỗi Kotlin của thư viện phát audio Android

Lỗi quan sát được trong log build:

```text
:react-native-track-player:compileDebugKotlin
MusicModule.kt:548:51 Argument type mismatch: actual type is 'Bundle?', but 'Bundle' was expected.
MusicModule.kt:588:17 Argument type mismatch: actual type is 'Bundle?', but 'Bundle' was expected.
```

React Native 0.81.5 yêu cầu Bundle không null ở Arguments.fromBundle, trong khi react-native-track-player 4.1.2 có originalItem kiểu Bundle?. Đây là lỗi tương thích native, khác với cảnh báo deprecated của NetInfo/BLE. Vấn đề tương ứng được ghi tại https://github.com/doublesymmetry/react-native-track-player/issues/2480 và https://github.com/doublesymmetry/react-native-track-player/issues/2514.

## Thay đổi

- Hai phương thức getTrack/getActiveTrack chỉ gọi Arguments.fromBundle khi metadata không null; nếu null thì trả null, không dùng !! gây crash hoặc tạo metadata giả.
- Script mobile/scripts/patch-track-player.mjs áp dụng bản sửa có kiểm tra phiên bản và cấu trúc; chạy lại không sửa lặp.
- mobile/package.json chạy script bằng postinstall; package-lock đánh dấu install script. npm ci/npm install áp dụng lại bản sửa sau khi tạo node_modules.
- Không đổi phiên bản React Native/Expo, không tắt New Architecture, không thay đổi nội dung/giọng Google hoặc dữ liệu backend.

## Build lại trong Android Studio

Đợi hoặc dừng lần build cũ đang báo lỗi, bấm Sync Now nếu IDE yêu cầu rồi build lại. Không cần xóa toàn bộ cache hoặc tải lại SDK. Lỗi cũ có thể còn trong Build Output cho đến khi có lần build mới.

Nếu cài thư viện với --ignore-scripts, phải chạy thủ công trong thư mục mobile:

```powershell
node scripts/patch-track-player.mjs
```

Kiểm tra riêng module từ mobile/android (máy đã cấu hình JDK/SDK):

```powershell
.\gradlew.bat :react-native-track-player:compileDebugKotlin --offline --console=plain
```

Việc compile module thành công chỉ xác nhận lỗi Kotlin này được giải quyết; chưa xác nhận toàn bộ APK đã đóng gói/cài/chạy, hoặc audio nền đã kiểm thử trên điện thoại.

## Kết quả kiểm tra

Đã chạy tác vụ compileDebugKotlin riêng của react-native-track-player trên JBR 21/Gradle 8.14.3: **BUILD SUCCESSFUL in 51s**, 35 tác vụ (1 thực thi, 34 đã cập nhật). Hai lỗi Bundle? ở dòng 548/588 đã hết; các cảnh báo deprecated vẫn còn. Chạy lại script patch không sửa lặp; cả hai file package JSON hợp lệ.

## Bổ sung lỗi khởi động TurboModule ngày 24-10-2026

Sau khi cài app, màn hình đỏ báo TrackPlayerModule và `TurboModule system assumes returnType == void iff the method is synchronous`. Mã React Native kiểm tra các @ReactMethod bất đồng bộ phải có kiểu trả về JVM void. Trong RNTP v4, 37 hàm viết bằng expression `= scope.launch { ... }` suy luận kiểu trả về kotlinx.coroutines.Job nên bị từ chối khi khởi tạo module.

Script patch hiện bọc coroutine trong hàm Kotlin trả Unit/void, giữ nguyên scope.launch, callback Promise và return@launch. Bản sửa nullable metadata trước đó vẫn giữ. Không tắt New Architecture và không thay engine đọc Google. Vấn đề tương ứng của upstream: https://github.com/doublesymmetry/react-native-track-player/issues/2424.

Đã kiểm tra bytecode bằng javap: 39 public final void (37 hàm coroutine và 2 hàm vốn đã đúng), không còn kiểu trả về Job trong MusicModule. Đã build APK debug x86_64: **BUILD SUCCESSFUL in 1m 32s**, 473 tác vụ (23 thực thi, 450 đã cập nhật).

APK này dành cho máy ảo x86_64; không dùng làm APK cho điện thoại ARM. Khi chạy điện thoại thật, chọn thiết bị trong Android Studio và build cho kiến trúc phù hợp.

Đây là thay đổi native: cần build và cài lại app. Chỉ Reload Metro hoặc nút RELOAD trên màn hình đỏ không cập nhật được mã Kotlin trong APK.

Đã cài đè thành công bằng adb install -r lên emulator-5554 (giữ dữ liệu), nối Metro cổng 8081 và mở lại app. Log tiến trình mới ghi `Running "main" ... "fabric":true`, không có ParsingException/TrackPlayerModule; ảnh máy ảo xác nhận màn hình chào mừng đã hiển thị sau bảng hướng dẫn development client. Đây là xác nhận khởi động trên máy ảo, chưa phải nghiệm thu mọi chức năng audio/định vị. Log vẫn có cảnh báo i18next Intl.PluralRules; không phải lỗi khởi tạo TrackPlayer đã xử lý ở đây.
