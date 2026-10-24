# Sửa lỗi CMake đường dẫn dài trên Windows

Lỗi nhận được:

```text
Execution failed for task ':app:buildCMakeDebug[x86_64]'
ninja: error: Stat(...safeareacontextJSI-generated.cpp.o): Filename longer than 260 characters
```

Nguyên nhân: đường dẫn dự án lồng nhiều thư mục, cộng với đường dẫn file C++ tự sinh của React Native New Architecture vượt giới hạn công cụ Ninja đang dùng. Không phải lỗi máy ảo x86_64 hoặc lỗi kết nối backend.

## Thay đổi

- Trên Windows, chuyển thư mục staging CMake của module app từ mobile/android/app/.cxx sang .cxx ở thư mục gốc dự án.
- Truyền CMAKE_OBJECT_PATH_MAX=240 để CMake dùng hash rút ngắn đường dẫn file object.
- Thêm plugin mobile/plugins/with-short-cmake-paths.cjs và đăng ký trong mobile/app.json để giữ cấu hình khi Expo prebuild lại.
- Đã áp dụng cấu hình vào mobile/android/app/build.gradle hiện có; thêm .cxx/ vào .gitignore gốc.
- Không tắt New Architecture, không đổi ABI máy ảo, không nâng Gradle và không cần di chuyển dự án hoặc sửa Registry Windows.

Cơ chế hash và giới hạn được mô tả trong [tài liệu CMake 3.22](https://cmake.org/cmake/help/v3.22/variable/CMAKE_OBJECT_PATH_MAX.html).

## Chạy lại trong Android Studio

1. Kết thúc lần build cũ đang báo lỗi; không mở nhiều lần build cùng lúc.
2. Bấm Sync Now hoặc File → Sync Project with Gradle Files.
3. Chọn máy ảo, module app rồi bấm Run lại.
4. Giữ Metro và backend đang chạy nếu thử bản debug.

Không cần xóa toàn bộ cache Gradle hoặc SDK. Cấu hình mới tự tạo thư mục staging và cache CMake riêng.

## Kiểm tra

Đã cấu hình lại CMake cho x86_64 tại .cxx/Debug/i6e2f3t6/x86_64. Kiểm tra 90 đường dẫn object trong build.ninja: dài nhất 238 ký tự, thấp hơn giới hạn 260. Tác vụ :app:buildCMakeDebug[x86_64] đã trả **BUILD SUCCESSFUL in 3m 18s**, 59 tác vụ (14 thực thi, 45 đã cập nhật). File safeareacontextJSI-generated.cpp.o từng gây lỗi đã biên dịch được.

Tác vụ kiểm tra từ mobile/android:

```powershell
.\gradlew.bat ':app:buildCMakeDebug[x86_64]' --offline --console=plain
```

Kiểm tra native CMake thành công không đồng nghĩa đã đóng gói/cài/chạy toàn bộ APK. Nếu gặp lỗi khác ở bước sau, xử lý theo lỗi mới.
