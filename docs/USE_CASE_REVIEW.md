# Đối chiếu use case với hệ thống hiện tại

Ngày đối chiếu: 23-10-2026. Phạm vi: tài liệu gốc, mã web/PWA, backend NestJS và mobile Expo trong dự án. Đây là đối chiếu đặc tả với mã nguồn; không thay thế kiểm thử điện thoại, GPS ngoài thực địa, beacon thật hoặc nghiệm thu toàn hệ thống.

## Kết luận

Tài liệu gốc còn đúng về các mục tiêu truy cập bằng QR, chọn ngôn ngữ, xem POI, tự phát theo vị trí, QR dự phòng và quản lý nội dung. Tuy nhiên chưa phản ánh đầy đủ hệ thống hiện tại và đang mô tả một số khả năng mạnh hơn phần đã triển khai. Nên dùng bản đề xuất v1.1 kèm theo để thảo luận và hoàn thiện báo cáo môn học. Bản này không thay đổi chương trình.

Hai tác nhân nghiệp vụ chính là **User** và **Admin**. User là khách ẩn danh, không đăng ký/đăng nhập. Admin xác thực để quản lý và vẫn dùng toàn bộ chức năng tham quan. Không thêm nghiệp vụ đăng nhập khách hay vai trò EDITOR. Dòng gợi ý EDITOR và một số chú thích mã cũ không phải căn cứ xác định quyền thực tế; API quản trị kiểm tra ADMIN.

## Đánh giá từng use case gốc

| Use case | Mức phù hợp | Cần chỉnh |
|---|---|---|
| UC1 Truy cập và chọn ngôn ngữ | Đúng mục tiêu, cần sửa luồng | Có 5 ngôn ngữ vi/en/ja/ko/zh. Web không bắt buộc splash/chọn ngôn ngữ trước khi vào. Mobile có màn hình bắt đầu nhưng chưa có APK phát hành để cam kết link tải tại cổng. QR phải chứa địa chỉ thiết bị truy cập được; localhost không dùng cho điện thoại khác. |
| UC2 Bản đồ và chỉ đường | Cần sửa đáng kể | Web dùng Leaflet/OpenStreetMap; mobile dùng MapLibre. Trên web đổi sơ đồ/bản đồ thủ công, bộ lọc đồng bộ marker. Chỉ đường web chạy trên đồ thị sơ đồ từ điểm xuất phát được chọn, không phải routing Google/Mapbox từ GPS. Mobile ngoài sơ đồ chỉ có đường thẳng ước lượng; không khẳng định đường đi ngắn nhất thực tế. |
| UC3 Tự động phát | Đúng mục tiêu, phải giới hạn nền tảng | GPS chỉ tự phát ở POI đã xác thực tọa độ; có kiểm tra độ chính xác, mẫu liên tiếp và cooldown. Web không có BLE. Mobile có mã quét beacon dự phòng nhưng chưa kiểm thử phần cứng. Không cam kết Background Geolocation liên tục khi ứng dụng đóng/chạy nền. Audio và chính sách phát của thiết bị là điều kiện bổ sung. |
| UC4 Quét QR POI | Đúng, thiếu các tình huống quan trọng | Phân biệt QR tham gia URL với QR POI sag://poi/token. Mã POI được xử lý trong app/chức năng QR; không mặc định camera hệ thống sẽ mở giao thức sag. Có nhập mã dự phòng. Camera trong web cần trình duyệt hỗ trợ và ngữ cảnh an toàn; HTTP LAN hạn chế. Ngoại tuyến cần lưu cả POI và bảng token. |
| UC5 Quản lý POI và TTS | Đúng mục tiêu, sai về thời điểm/kết quả | Admin lưu POI và bản dịch trước; job TTS chạy bất đồng bộ. Gemini AI Studio không phải Google Cloud TTS hay AWS Polly trong cấu hình đang sử dụng. WAV được chuyển thành MP3; file lưu ở kho file, database lưu metadata/đường dẫn. Quota có thể làm job chờ/lỗi; không khẳng định hai ngôn ngữ đều có audio ngay sau Lưu. Upload MP3 là luồng thay thế đã có. |

## Các use case bổ sung

| Mã | Tên | Lý do cần có |
|---|---|---|
| UC6 | Nghe thuyết minh chủ động | Đây là chức năng cốt lõi hoạt động độc lập với GPS/QR; cần mô tả chọn bài, ngôn ngữ, phát/dừng và thiếu audio. |
| UC7 | Tải gói và nghe ngoại tuyến | Ghi đúng yêu cầu tải khi còn mạng và giữ nguyên file/giọng Google. Phân biệt gói PWA với ZIP HTTP LAN; không cam kết audio chưa được tạo hoặc nền OSM đầy đủ. |
| UC8 | Đăng nhập và đăng xuất quản trị | Làm rõ xác thực chỉ dành cho Admin, điều kiện sử dụng UC5/UC9/UC10 và xử lý sai mật khẩu/thiếu quyền. |
| UC9 | Quản lý QR beacon và cấu hình tự phát | Hệ thống đã có công cụ bật/tắt mã, tải SVG, đăng ký beacon, chỉnh bán kính/cooldown. Phải phân biệt đăng ký beacon với xác nhận thiết bị hoạt động. |
| UC10 | Xem thống kê và nhật ký quản trị | Bao quát thống kê hiện diện/nghe, heatmap vị trí có đồng ý chia sẻ, job và nhật ký đang có trên trang quản trị. |

UC5 đang gộp quản lý POI và TTS để giữ cấu trúc gốc. Nếu giảng viên yêu cầu mỗi use case chỉ có một mục tiêu riêng, có thể tách quản lý POI và tạo/quản lý audio thành hai use case trong lần chỉnh tiếp theo. Chức năng tạo audio chỉ được yêu cầu sau khi nội dung bản dịch hợp lệ; không vẽ quan hệ include bắt buộc giữa mọi lần lưu POI và gọi Gemini, vì có thể lưu nháp hoặc upload audio.

## Quan hệ tác nhân và sơ đồ

- Admin có thể được biểu diễn là tác nhân chuyên biệt của User trong sơ đồ tổng thể: Admin kế thừa các chức năng tham quan. User vẫn không có tài khoản.
- Liên kết User với UC1/UC2/UC3/UC4/UC6/UC7; Admin với UC5/UC8/UC9/UC10 và các chức năng tham quan kế thừa.
- OpenStreetMap là hệ thống ngoài cung cấp nền bản đồ, không phải dịch vụ tìm tuyến đi bộ hiện tại. Gemini TTS là dịch vụ ngoài khi xử lý job tạo audio; việc chuyển đổi/lưu MP3 do backend đảm nhiệm.
- UC8 là điều kiện xác thực của các thao tác quản trị; không buộc mỗi thao tác đều gọi lại luồng đăng nhập.
- UC4 là phương án chủ động hoặc thay thế cho UC3. Nếu dùng extend, phải ghi điều kiện cụ thể; không mô tả QR luôn bắt buộc xảy ra sau GPS.
- Các sơ đồ nhúng của bản v1.1 thay thế hình cũ, thể hiện luồng tập trung và nhánh thất bại chính. Các ngoại lệ chi tiết vẫn nằm trong bảng đặc tả.

## Cách hiểu trạng thái triển khai

1. **Có mã và đã chạy trên web/backend:** truy cập ẩn danh, 5 ngôn ngữ, quản trị ADMIN, Leaflet/sơ đồ, QR, tạo MP3 qua job, tải gói và thống kê. Điều này không khẳng định mọi POI/audio hoàn tất.
2. **Có điều kiện:** tự phát cần quyền/GPS/POI geoVerified/audio; QR cần URL/token hợp lệ; Google cần khóa và quota; PWA cần localhost/HTTPS; HTTP LAN dùng gói ZIP cho ngoại tuyến.
3. **Chưa nghiệm thu thực tế:** mobile trên thiết bị, beacon thật, GPS ngoài thực địa và phát nền. Có mã mobile không đồng nghĩa có APK đã phát hành.
4. **Nội dung chưa đủ:** các bài Google còn chờ tạo và các điểm chưa đủ nguồn tọa độ vẫn là phần việc riêng. Không dùng use case để khẳng định dữ liệu đã đầy đủ.

## Định dạng và truy vết

Bản v1.1 dùng bản sao của file gốc: giữ khổ giấy, lề, font, kiểu chữ, trang bìa, header/footer, bảng ba cột, ô gộp và các nhãn trường tiếng Anh. Các use case bổ sung dùng lại bảng mẫu. Hình use case/activity được vẽ lại theo nội dung đã chỉnh; mục lục, phiên bản và lịch sử sửa đổi được cập nhật. Số trang có thể thay đổi theo lượng nội dung.

Tài liệu gốc dẫn BR1–BR4, FR1–FR8 nhưng chưa cung cấp tài liệu định nghĩa các mã này. Bản đề xuất không tự gán lại những mã chưa xác minh; trường Reference dùng use case/mã nguồn liên quan. Khi hoàn thiện bộ SRS, cần lập bảng truy vết BR/FR và điền lại mã chính thức. Maturity = Focused chỉ là mức đặc tả, không phải chứng nhận đã kiểm thử xong.

## Căn cứ trong mã nguồn

| Nội dung | File/chức năng |
|---|---|
| Truy cập, ngôn ngữ, sơ đồ, GPS, QR, phát và tải gói | web/app.mjs; web/core.mjs; web/ui-i18n.mjs |
| Cache nội dung/audio và shell ngoại tuyến | web/store.mjs; web/sw.js |
| Gói ZIP giữ file Google | scripts/build-offline-archive.mjs; scripts/offline-template.html |
| Đăng nhập, upload, xếp job, QR/beacon/config/heatmap | web/admin-tools.mjs |
| Quyền ADMIN và quản lý POI | backend/apps/content-poi-service/src/poi/poi.controller.ts |
| Đăng nhập và phiên | backend/apps/content-poi-service/src/auth/auth.controller.ts |
| Gemini, chuyển MP3 và xử lý job | backend/apps/audio-tts-service/src/providers/gemini-tts.provider.ts; backend/apps/audio-tts-service/src |
| QR công khai và token hoạt động | backend/apps/qr-fallback-service/src/qr.controller.ts |
| Hiện diện/nghe và vị trí có đồng ý | backend/apps/content-poi-service/src/analytics/analytics.controller.ts; backend/apps/content-poi-service/src/admin/tracking.controller.ts |
| GPS/BLE mobile và hạn chế vị trí | mobile/src/hooks/useAutoPlay.ts; mobile/src/hooks/useUserLocation.ts |
| Chỉ đường mobile ước lượng | mobile/src/services/api/directions.ts; mobile/src/hooks/useRouteTo.ts |

Tài liệu nguồn được giữ nguyên. Bản v1.1 là đề xuất chỉnh sửa theo phiên bản mã tại thời điểm đối chiếu.

## Mười use case có đủ để hoàn thiện đồ án và build APK không

Mười use case đủ bao quát phạm vi chức năng chính của đồ án hiện tại. Không cần thêm use case chỉ để đạt một số lượng nhất định. Tuy nhiên use case là đặc tả hành vi, không phải bằng chứng đã triển khai hoặc điều kiện đủ để tạo APK.

Build APK là công việc đóng gói và phát hành, không cần tạo thành use case nghiệp vụ riêng. Để gọi hệ thống hoàn thiện trong phạm vi đã thống nhất, cần đạt các điều kiện sau:

| Điều kiện nghiệm thu | Kết quả cần chứng minh |
|---|---|
| Đóng gói Android | Build bản release có ký, cài được và mở ổn định trên điện thoại thật; xác định thiết bị/phiên bản Android hỗ trợ. |
| Kết nối backend | APK dùng URL backend điện thoại truy cập được; không dùng localhost máy tính. Kiểm tra cấu hình mạng, quyền và chính sách HTTP/HTTPS. APK không tự chứa PostgreSQL/backend. |
| Phạm vi nền tảng | Quy định chức năng nào có trên web, mobile và cả hai. Có thể giữ quản trị trên web nếu tài liệu ghi rõ; không mặc định APK phải có dashboard admin. |
| Nội dung POI | Tên, kịch bản, bản dịch và tọa độ của các điểm thuộc phạm vi nghiệm thu đầy đủ; chỉ bật GPS tự phát khi tọa độ đã xác thực. |
| Audio Google | Tạo đủ các bài/ngôn ngữ đã cam kết; kiểm tra phát đúng bản và trạng thái khi thiếu audio. Tích hợp API thành công chưa đồng nghĩa đã tạo đủ audio. |
| Ngoại tuyến | Tải trước rồi ngắt mạng thật; mở lại ứng dụng và nghe đúng MP3. Kiểm tra riêng gói mobile, PWA và ZIP, không suy diễn kết quả giữa các nền tảng. |
| GPS và QR | Thử quyền được cấp/từ chối, GPS yếu, POI trong/ngoài bán kính, chống phát lại, token sai/tắt và QR mở trên thiết bị thật. |
| BLE | Nếu giữ là chức năng nghiệm thu, cần beacon thật và kiểm thử trên thiết bị. Nếu không có phần cứng, ghi là mở rộng/chưa nghiệm thu, không đánh dấu hoàn thành. |
| Chỉ đường | Chấp nhận rõ tuyến sơ đồ/ước lượng là phạm vi đồ án; nếu yêu cầu tuyến đi bộ thực tế thì phải bổ sung dữ liệu tuyến và kiểm thử riêng. |
| Phân quyền và dữ liệu | User dùng ẩn danh; chỉ ADMIN quản lý; kiểm thử đăng nhập sai, token hết hạn, lưu POI, upload, job lỗi và dữ liệu giữ nguyên sau khởi động lại. |
| Vận hành và bàn giao | Có hướng dẫn khởi động, cấu hình riêng tư, sao lưu/phục hồi và cách xử lý lỗi phổ biến. Máy chủ phải hoạt động khi khách cần tải/cập nhật dữ liệu. |

Đối với đồ án môn học, phạm vi hợp lý là web quản trị và tham quan, APK cho khách, nội dung/bản đồ/QR/GPS tự phát khi ứng dụng đang mở, cùng các MP3 đã tải để nghe ngoại tuyến. BLE và định vị nền chỉ được cam kết nếu có điều kiện triển khai và kiểm thử. Phạm vi này cần được giảng viên chấp nhận; không tự xem việc thu hẹp là đã đạt mọi yêu cầu ban đầu.
