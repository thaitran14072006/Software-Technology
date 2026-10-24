# Sửa cảnh báo i18next Intl.PluralRules

Ngày: 24-10-2026.

App đã mở được màn hình chào mừng nhưng i18next cảnh báo môi trường không có Intl.PluralRules. Hermes đang dùng thiếu API chọn dạng số ít/số nhiều, nên i18next phải dùng định dạng tương thích cũ.

## Thay đổi

- Bổ sung @formatjs/intl-pluralrules 6.3.16, khóa phiên bản trong package.json/package-lock.json.
- mobile/src/i18n/plural-rules.ts nạp polyfill-force và dữ liệu vi/en/ja/ko/zh trước khi i18next khởi tạo.
- Toàn bộ mã/dữ liệu quy tắc nằm trong bundle, không gọi API hay tải từ mạng lúc chọn ngôn ngữ.
- Không ẩn LogBox, không hạ định dạng bản dịch và không thay giọng Google.

## Kiểm tra

- npm run test:i18n mô phỏng môi trường không có Intl.PluralRules: kiểm tra đủ 5 locale, quy tắc one/other và i18next chọn chuỗi số ít/số nhiều đúng, không phát cảnh báo thiếu Intl.
- npx tsc --noEmit đạt.
- Expo export Android đạt: 1275 modules, bundle Hermes 3.41 MB.
- Metro cũ chưa nhận các package mới trong file map nên báo không resolve @formatjs/bigdecimal. Đã khởi động lại đúng Metro với cache sạch để nhận thư viện mới.
- Đã mở lại app trên emulator-5554: bundle debug 1392 modules tải thành công; log tiến trình mới ghi Running main và không còn pluralResolver/PluralRules error. Ảnh docs/android-i18n-preview.png xác nhận màn hình chào mừng không còn thanh cảnh báo.

## Áp dụng

Với bản debug đang dùng Metro, đây là thay đổi JavaScript nên không cần build lại native APK. Sau khi cài thư viện mới, nếu Metro vẫn dùng cache cũ, dừng terminal Metro rồi chạy lại trong thư mục mobile:

```powershell
npm start -- --clear
```

Chỉ chạy một Metro trên cổng 8081. Nếu Metro đã được khởi động lại và app đã kết nối thì không mở thêm một phiên khác. Bản release cần build APK lại để đóng gói các file JavaScript mới.

Nguồn: [FormatJS PluralRules cho React Native](https://formatjs.github.io/docs/polyfills/intl-pluralrules/), [i18next JSON format](https://www.i18next.com/misc/json-format).
