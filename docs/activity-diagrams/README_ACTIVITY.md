# Đối chiếu Activity Diagram với đặc tả use case v1.1

Mẫu hình: UC1_Act.drawio do người dùng cung cấp. Nội dung: bản đặc tả 10 UC v1.1, không sao chép các mô tả cũ về APK phát hành, Google/Mapbox routing hay BLE trên web.

Mỗi trang có nút bắt đầu/kết thúc, hành động, quyết định với nhãn điều kiện, nhánh thay thế và ngoại lệ. Giữ nền vàng #FFFFC0, viền/mũi tên #990033, hình thoi trống và điều kiện chữ nghiêng bên cạnh theo mẫu. Canvas được mở rộng để chứa đầy đủ luồng. B1…Bn tương ứng Basic Course; A/E tương ứng Alternative/Exception Paths trong đặc tả.

File tổng hợp có 10 trang; từng file UC riêng và SVG được cung cấp trong gói ZIP. Mở bằng diagrams.net và có thể chỉnh mọi ô/mũi tên. SVG là bản xem trước tĩnh; dữ liệu gốc chỉnh sửa nằm trong .drawio.

Các giới hạn triển khai được ghi ngay trong các nhánh tương ứng. Một diagram đầy đủ không chứng minh APK, BLE, GPS hoặc mọi audio đã nghiệm thu.

Đặc tả đối chiếu: docs/Smart_Audio_Guide_Focused_UseCases_v1.1.docx. Các diagram này thay thế sơ đồ activity tóm tắt trước đó; không sửa file mẫu gốc và không sửa chương trình.

Cách mở: giải nén ZIP, mở diagrams.net, chọn File → Open From → Device và chọn Smart_Audio_Guide_Activities_UC1-UC10.drawio. Chọn UC ở dải trang phía dưới; dùng zoom để đọc. Muốn xuất ảnh: File → Export as → SVG hoặc PNG.

## UC1 Truy cập hệ thống và chọn ngôn ngữ

- Luồng chính: B1–B4.
- Thay thế: A1. Truy cập bằng URL trực tiếp cho kết quả tương tự. A2. Mobile có màn hình bắt đầu riêng; chưa có APK phát hành.
- Ngoại lệ: E1. Chưa có mạng và chưa tải gói: không mở được lần đầu. E2. QR chứa localhost hoặc IP cũ: dùng URL LAN đang hoạt động.
- Hậu điều kiện: Trang tham quan dùng ngôn ngữ đã chọn; User không có phiên đăng nhập.
- Kiểm tra cấu trúc: 34 nút; 28 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Mở URL web hoặc quét QR tham gia.
- B2: Hiển thị trang tham quan và bộ chọn ngôn ngữ.
- B3: Chọn Việt, Anh, Nhật, Hàn hoặc Trung.
- B4: Lưu lựa chọn; tải nội dung và đổi giao diện theo ngôn ngữ đã chọn.

## UC2 Xem bản đồ và tìm tuyến trên sơ đồ

- Luồng chính: B1–B6.
- Thay thế: A1. User đổi bản đồ/sơ đồ thủ công. A2. Mobile dùng MapLibre; ngoài đồ thị chỉ có đường thẳng ước lượng, không phải tuyến đi bộ thực tế.
- Ngoại lệ: E1. Không có đường nối: báo không tìm được tuyến. E2. Từ chối GPS vẫn xem được POI. E3. Mất mạng có thể không tải được nền OSM.
- Hậu điều kiện: POI được chọn; tuyến tham khảo hiển thị khi dữ liệu đồ thị hỗ trợ.
- Kiểm tra cấu trúc: 37 nút; 33 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Mở trang Khám phá; chọn bộ lọc hoặc tìm POI.
- B2: Đồng bộ danh sách và marker; chỉ đưa POI có tọa độ đã xác thực hoặc có nguồn lên bản đồ địa lý.
- B3: Chọn POI; bật GPS nếu muốn xem vị trí.
- B4: Hiển thị chi tiết; cập nhật vị trí khi được cấp quyền.
- B5: Chọn điểm xuất phát và bấm Chỉ đường.
- B6: Chuyển về sơ đồ và hiển thị tuyến, khoảng cách/thời gian ước tính nếu có đường nối.

## UC3 Tự động phát thuyết minh theo vị trí

- Luồng chính: B1–B5.
- Thay thế: A1. Mobile có mã BLE khi GPS yếu và có beacon đã đăng ký; chưa kiểm thử phần cứng. Web không quét BLE. A2. Dùng UC4 hoặc UC6 khi định vị không phù hợp.
- Ngoại lệ: E1. GPS yếu/thiếu quyền: không bảo đảm tự phát. E2. Trong thời gian chống phát lại: không tự phát lại. E3. Google chưa sẵn sàng: thử voice thiết bị đúng ngôn ngữ; nếu thiếu thì báo lỗi, không đọc sai ngôn ngữ. E4. Trình duyệt chặn phát tự động: User bấm Phát.
- Hậu điều kiện: POI được chọn; audio phát khi sẵn sàng và được thiết bị cho phép.
- Kiểm tra cấu trúc: 59 nút; 54 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Bật GPS và Tự động phát; giữ ứng dụng hoạt động.
- B2: Xin quyền và cập nhật vị trí; kiểm tra độ chính xác.
- B3: Di chuyển vào vùng của POI đã xác thực.
- B4: Kiểm tra mẫu vị trí liên tiếp, bán kính và thời gian không phát lại.
- B5: Chọn POI và yêu cầu phát audio đúng ngôn ngữ nếu đáp ứng điều kiện.

## UC4 Quét QR tại điểm tham quan

- Luồng chính: B1–B5.
- Thay thế: A1. Nhập token hoặc nội dung mã khi camera không hỗ trợ. A2. QR tham gia dạng URL mở web; QR POI dạng sag://poi/token được xử lý trong ứng dụng, không bảo đảm camera hệ thống mở được.
- Ngoại lệ: E1. Token lạ, bị tắt hoặc POI không công bố: báo lỗi. E2. HTTP LAN không hỗ trợ camera trong web: nhập mã hoặc dùng camera hệ thống với QR URL. E3. Chưa có audio: báo chờ. E4. Ngoại tuyến chưa lưu bảng QR: không tra được token.
- Hậu điều kiện: POI đúng mã được mở; chỉ phát khi audio sẵn sàng và thiết bị cho phép.
- Kiểm tra cấu trúc: 44 nút; 37 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Mở chức năng QR; chọn quét camera hoặc nhập mã.
- B2: Xin quyền camera nếu quét trong web và thiết bị hỗ trợ.
- B3: Quét hoặc dán nội dung QR của POI.
- B4: Tra token đang hoạt động qua QR API hoặc bảng mã đã lưu.
- B5: Chọn POI đúng ngôn ngữ và yêu cầu phát audio sẵn sàng.

## UC5 Quản lý POI và tạo âm thanh TTS

- Luồng chính: B1–B6.
- Thay thế: A1. Tải MP3 có sẵn cho bản dịch đã lưu (tối đa 20 MB). A2. Chạy chế độ LOCAL để dùng eSpeak khi chủ động lựa chọn. A3. Lưu DRAFT hoặc PUBLISHED theo quyền admin.
- Ngoại lệ: E1. Thiếu dữ liệu: từ chối lưu. E2. Quota/timeout: giữ nội dung, ghi lỗi hoặc thời điểm chờ. E3. Thiếu khóa/cấu hình Gemini: không tạo được Google audio.
- Hậu điều kiện: POI đã lưu; MP3 nằm trong kho file, metadata ở database. Audio có thể đang chờ, sẵn sàng hoặc lỗi.
- Kiểm tra cấu trúc: 49 nút; 40 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Đăng nhập UC8; chọn thêm/sửa POI.
- B2: Hiển thị POI, tọa độ, trạng thái và bản dịch.
- B3: Nhập dữ liệu; lưu và yêu cầu tạo audio.
- B4: Kiểm tra; lưu PostgreSQL và xếp job TTS.
- B5: Worker tạo MP3; lưu file và metadata trạng thái.
- B6: Theo dõi job; kiểm tra bản thu trước khi dùng.

## UC6 Nghe thuyết minh chủ động

- Luồng chính: B1–B5.
- Thay thế: A1. User chủ động chọn nguồn giọng trình duyệt hoặc MP3 khác trên web; chất lượng và khả năng ngoại tuyến tùy nguồn.
- Ngoại lệ: E1. Google chưa có file hoặc tải file lỗi: báo rõ, không tự thay bằng giọng máy. E2. Ngoại tuyến chưa tải file đúng bài/ngôn ngữ: không nghe được bản Google.
- Hậu điều kiện: Audio đúng bài/ngôn ngữ được phát hoặc dừng; lỗi được thông báo khi chưa thể phát.
- Kiểm tra cấu trúc: 30 nút; 23 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Chọn POI từ danh sách, sơ đồ hoặc bản đồ.
- B2: Hiển thị nội dung và trạng thái audio theo ngôn ngữ.
- B3: Bấm Phát thuyết minh.
- B4: Ưu tiên MP3 Google sẵn sàng khi chạy Gemini; dùng file đã tải nếu ngoại tuyến.
- B5: Bấm Dừng hoặc chọn bài khác khi cần.

## UC7 Tải gói và nghe thuyết minh ngoại tuyến

- Luồng chính: B1–B5.
- Thay thế: A1. Gói thiếu một số audio vẫn ghi rõ số đã có và số thiếu. A2. Tải lại sau khi nội dung/audio thay đổi để nhận bản mới.
- Ngoại lệ: E1. Lần đầu không có mạng: không tải được gói. E2. PWA tải audio lỗi: không thay gói cũ bằng gói lỗi. E3. Bài/ngôn ngữ chưa có trong gói: báo thiếu, không tạo Google TTS ngoại tuyến.
- Hậu điều kiện: Nội dung và MP3 đã tải dùng được ngoại tuyến; không cam kết có mọi bài hoặc mọi ngôn ngữ.
- Kiểm tra cấu trúc: 41 nút; 33 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Chọn tải gói ngoại tuyến khi còn kết nối.
- B2: Đọc nội dung 5 ngôn ngữ; lấy MP3 sẵn sàng và kiểm tra file.
- B3: Lưu gói PWA trên localhost/HTTPS; HTTP LAN cung cấp ZIP tải về.
- B4: Nếu tải ZIP: giải nén và mở index.html; nếu PWA: mở lại trang đã lưu.
- B5: Hiển thị nội dung đã tải và phát đúng MP3 có trong gói.

## UC8 Đăng nhập và đăng xuất quản trị

- Luồng chính: B1–B5.
- Thay thế: A1. Nhập JWT ADMIN thủ công khi đã có token hợp lệ; không cần làm bước này khi dùng email/mật khẩu. A2. Admin quay về trang tham quan và dùng như User.
- Ngoại lệ: E1. Sai mật khẩu/tài khoản không hoạt động: từ chối. E2. Token hết hạn hoặc thiếu quyền: yêu cầu xác thực lại hoặc từ chối thao tác quản trị. E3. Backend không chạy: báo lỗi kết nối.
- Hậu điều kiện: Đăng nhập tạo phiên ADMIN hợp lệ; đăng xuất kết thúc phiên, vẫn cho phép tham quan.
- Kiểm tra cấu trúc: 43 nút; 35 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Mở Kết nối và nhập email, mật khẩu admin.
- B2: Xác thực qua backend và kiểm tra quyền ADMIN.
- B3: Lưu access/refresh token trong phiên tab, chuyển sang dữ liệu API và mở quản trị.
- B4: Thực hiện chức năng quản lý hoặc bấm Đăng xuất.
- B5: Khi đăng xuất: thu hồi refresh token và xóa thông tin phiên trên trình duyệt.

## UC9 Quản lý QR beacon và cấu hình tự phát

- Luồng chính: B1–B5.
- Thay thế: A1. QR tham gia dùng URL web truy cập được qua LAN/HTTPS. A2. Beacon cần thiết bị thật và mobile hỗ trợ; đăng ký không chứng minh đã hoạt động ngoài thực tế.
- Ngoại lệ: E1. Thiếu quyền hoặc dữ liệu không hợp lệ: từ chối lưu. E2. QR bị tắt không tra được qua API khi trực tuyến; bản offline cũ chỉ cập nhật sau khi tải lại.
- Hậu điều kiện: QR/beacon/cấu hình được lưu; không khẳng định web hỗ trợ BLE.
- Kiểm tra cấu trúc: 39 nút; 33 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Đăng nhập; mở công cụ cấu hình và mã tại điểm.
- B2: Tải danh sách QR, beacon, cấu hình và trạng thái job.
- B3: Chọn bật/tắt QR hoặc beacon, đăng ký beacon, hoặc sửa cấu hình.
- B4: Kiểm tra quyền/dữ liệu và lưu thay đổi.
- B5: Tải SVG QR hoặc kiểm tra lại danh sách đã lưu.

## UC10 Xem thống kê và nhật ký quản trị

- Luồng chính: B1–B4.
- Thay thế: A1. Khi chưa có dữ liệu, hiển thị danh sách rỗng hoặc thông báo chưa có mẫu.
- Ngoại lệ: E1. Không có quyền ADMIN: từ chối truy cập. E2. Lỗi mạng/backend: báo lỗi tải. E3. Khách không đồng ý chia sẻ vị trí: không có mẫu vị trí của khách đó để hiển thị.
- Hậu điều kiện: Admin xem dữ liệu hiện có; số liệu không đại diện đầy đủ cho mọi khách ngoài thực tế.
- Kiểm tra cấu trúc: 33 nút; 27 đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.

### Đối chiếu bước chính

- B1: Đăng nhập và mở thống kê/công cụ quản trị.
- B2: Tải thống kê, job và nhật ký theo API tương ứng.
- B3: Chọn xem vùng có lượt ghé hoặc các bản ghi gần đây.
- B4: Hiển thị số liệu và heatmap tổng hợp khi có mẫu vị trí đã được chia sẻ.
