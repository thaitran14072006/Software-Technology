# Yêu cầu sản phẩm Smart Audio Guide

Vườn quốc gia Nam Cát Tiên | PRD 1.0 | 26/10/2026

## 1 Tổng quan sản phẩm

Smart Audio Guide hỗ trợ khách tự khám phá Vườn quốc gia Nam Cát Tiên bằng bản đồ, mã QR và thuyết minh đa ngôn ngữ. Khách dùng trực tiếp không cần tài khoản; quản trị viên chuẩn bị nội dung và âm thanh trước chuyến tham quan.

| Thuộc tính | Nội dung |
| --- | --- |
| Tên sản phẩm | Smart Audio Guide cho Vườn quốc gia Nam Cát Tiên |
| Tài liệu | PRD phiên bản 1.0 ngày 26/10/2026 |
| Đối tượng đọc | Nhóm phát triển, kiểm thử và giảng viên đánh giá đồ án |
| Phạm vi nội dung | 15 POI được thống nhất; Việt, Anh, Nhật, Hàn và Trung |
| Nền tảng | Web/PWA cho tham quan và quản trị; ứng dụng Android cho khách |

### Vấn đề cần giải quyết

Khách cần tự tìm điểm tham quan và nghe nội dung theo ngôn ngữ của mình khi không có hướng dẫn viên. Kết nối trong rừng có thể yếu; giọng thuyết minh cần được giữ nguyên khi mất mạng. Nhóm quản trị cần cập nhật nội dung, tạo âm thanh và nhận biết các bài còn thiếu mà không phụ thuộc dịch vụ trả phí.

### Mục tiêu và kết quả mong đợi

- Khách mở được hệ thống bằng URL hoặc QR, chọn ngôn ngữ và phát bài tương ứng mà không đăng nhập.

- Web và Android dùng thống nhất danh sách 15 điểm; số hiển thị 1–15 độc lập với mã POI và token QR.

- Đích nội dung đầy đủ là 75 cặp POI và ngôn ngữ có MP3 Google hợp lệ; tải trước và phát lại đúng file khi ngoại tuyến.

- Nhóm có thể pull mã, khởi tạo database riêng và tiếp tục hoàn thiện bằng cấu hình bí mật riêng trên từng máy.

### Giới hạn phạm vi

Giữ 10 use case. Không bổ sung đăng ký hoặc đăng nhập khách, thanh toán, đặt vé, điều hành cứu hộ hay ứng dụng iOS trong phạm vi nghiệm thu. Không cam kết bản đồ nền OSM ngoại tuyến, dẫn đường từng chặng, BLE hoặc phát nền liên tục khi chưa có dữ liệu và kiểm thử tương ứng.

## 2 Người dùng và quy tắc nghiệp vụ

| Tác nhân | Nhu cầu và quyền |
| --- | --- |
| Khách tham quan | Xem công khai; chọn ngôn ngữ; tìm POI; nghe; quét QR; tải ngoại tuyến; chủ động cấp hoặc từ chối quyền thiết bị. |
| Quản trị viên | Có toàn bộ chức năng tham quan. Sau đăng nhập ADMIN, quản lý nội dung, audio, QR, cấu hình và xem dữ liệu quản trị. |
| Hệ thống ngoài | Google AI Studio tạo âm thanh khi có yêu cầu; nguồn tile OSM phục vụ bản đồ nền khi có mạng. Không là tài khoản nghiệp vụ. |

### Hành trình sử dụng chính

Tại cổng: khách quét URL truy cập được từ điện thoại, chọn ngôn ngữ, kiểm tra và tải những bài có sẵn. Trong chuyến đi: chọn POI từ danh sách hoặc bản đồ, nghe chủ động; dùng QR khi định vị không phù hợp. Khi mất mạng: mở nội dung đã lưu và nghe các MP3 đã tải. Sau chuyến đi: có thể tải lại để nhận nội dung mới.

### Quy tắc bắt buộc

| Mã | Quy tắc |
| --- | --- |
| BR01 | Khách không cần tài khoản. Mọi thao tác quản trị phải được backend kiểm tra quyền ADMIN. |
| BR02 | Danh sách nghiệm thu chỉ gồm 15 điểm ở mục 6. Điểm loại bỏ không xuất hiện trong danh sách công khai hoặc QR đang dùng. |
| BR03 | Bài phát phải khớp POI, ngôn ngữ và transcript hiện hành; không phát audio đã lỗi thời như bản hợp lệ. |
| BR04 | Trong chế độ Google, thiếu MP3 phải báo rõ. Không tự thay bằng giọng thiết bị hoặc eSpeak. |
| BR05 | Chỉ tạo Google TTS khi có quota miễn phí thực tế; khi gặp 429 phải giữ công việc và tôn trọng thời gian chờ. |
| BR06 | Hiển thị được trên bản đồ không đồng nghĩa đã khảo sát GPS. Tự phát GPS chỉ dùng POI đã xác thực tọa độ. |
| BR07 | Quyền vị trí để sử dụng và đồng ý chia sẻ vị trí thống kê là hai lựa chọn riêng. Không đồng ý chia sẻ thì không gửi mẫu vị trí thống kê. |
| BR08 | QR không chứa JWT hay khóa API. Mã POI, UUID và token được giữ ổn định khi sửa số hiển thị hoặc tọa độ. |

P0 là điều kiện bắt buộc trong phạm vi đồ án; P1 là mở rộng có điều kiện. Các mã FR và AC trong PRD này là mã truy vết mới, không tự thay thế các mã BR/FR chưa được định nghĩa trong tài liệu gốc.

## 3 Truy cập bản đồ và tự phát

### FR01 Truy cập và chọn ngôn ngữ

Liên kết UC1 | Ưu tiên P0. Cho phép mở web bằng URL hoặc QR tham gia, mở Android đã cài và lưu lựa chọn trong năm ngôn ngữ. Web không bắt buộc có màn hình chào giống mobile.

- AC01.1 Mở lần đầu khi có mạng phải đến được giao diện tham quan mà không có bước đăng nhập khách.

- AC01.2 Đổi ngôn ngữ phải cập nhật giao diện, tên và lời thuyết minh; số POI và điểm đang chọn được giữ. Nếu bài tương ứng chưa có, hiển thị trạng thái thiếu.

- AC01.3 QR tại cổng dùng địa chỉ thiết bị truy cập được. Không dùng localhost của máy chủ cho điện thoại khác.

### FR02 Xem bản đồ và tìm tuyến tham khảo

Liên kết UC2 | Ưu tiên P0. Cho tìm kiếm, lọc nhóm, chọn POI và xem vị trí. Web chuyển thủ công giữa sơ đồ và Leaflet/OpenStreetMap; Android dùng MapLibre. Tuyến chỉ được cung cấp trong giới hạn dữ liệu đang có.

- AC02.1 Chế độ Tất cả hiển thị đúng 15 điểm; số 1–15 khớp danh sách tại mục 6 và không tràn khỏi biểu tượng.

- AC02.2 Đổi bộ lọc hoặc chế độ bản đồ phải giữ cùng tập điểm và cùng lựa chọn. Sơ đồ không bỏ điểm chỉ vì thiếu tọa độ vẽ tay cũ.

- AC02.3 Không có dữ liệu tuyến phải báo chưa tìm được tuyến; không thay đường thẳng hoặc đường dẫn nhãn thành đường đi thực tế. Từ chối GPS vẫn xem được POI.

### FR03 Tự phát theo vị trí

Liên kết UC3 | Ưu tiên P0. Khi khách chủ động bật tự phát, xét quyền vị trí, độ tin cậy GPS, bán kính POI, tọa độ đã xác thực, cooldown và audio trước khi phát. Nghiệm thu cơ sở là ứng dụng đang mở.

- AC03.1 Không tự phát nếu thiếu quyền, tọa độ POI chưa xác thực hoặc audio đúng ngôn ngữ chưa sẵn sàng; vẫn cho nghe chủ động bằng UC6.

- AC03.2 Khi điều kiện hợp lệ, nhận diện đúng POI và chống phát lặp theo cấu hình; không tự chồng nhiều bài.

- AC03.3 GPS yếu hoặc trình duyệt chặn tự phát phải hướng dẫn bấm Phát hoặc dùng QR. BLE chỉ là P1 trên mobile và cần beacon thật.

## 4 QR nội dung âm thanh và ngoại tuyến

### FR04 Quét QR tại điểm tham quan

Liên kết UC4 | Ưu tiên P0. Phân biệt QR URL vào hệ thống và QR POI chứa token. Cho quét bằng camera được hỗ trợ hoặc nhập mã thay thế; QR có thể dùng độc lập với GPS.

- AC04.1 Token hợp lệ và đang hoạt động phải mở đúng POI cùng ngôn ngữ đang chọn; chỉ phát khi có audio và thiết bị cho phép.

- AC04.2 Token sai, bị tắt hoặc trỏ tới điểm không công bố phải báo lỗi. Ngoại tuyến chỉ tra mã đã có trong registry lưu trước đó.

### FR05 Quản lý POI và tạo âm thanh

Liên kết UC5 | Ưu tiên P0. Admin tạo hoặc sửa bản dịch, tọa độ, trạng thái công bố; gửi yêu cầu TTS sau khi nội dung hợp lệ. Tác vụ tạo MP3 là bất đồng bộ; cho upload MP3 có sẵn.

- AC05.1 Lưu thành công nghĩa là nội dung được lưu, không đồng nghĩa audio đã tạo xong. Giao diện phải phân biệt chờ, đang xử lý, sẵn sàng và lỗi.

- AC05.2 Google trả lỗi hoặc hết quota không làm mất transcript. Job không tạo trùng, chỉ gắn kết quả khi POI, ngôn ngữ và text hash còn khớp.

- AC05.3 Upload đúng bản dịch, kiểm tra định dạng và giới hạn 20 MB; chỉ phiên ADMIN được tạo job, upload hoặc sửa nội dung.

### FR06 Nghe thuyết minh chủ động

Liên kết UC6 | Ưu tiên P0. Khách chọn POI rồi bấm Phát hoặc Dừng. Chọn bài mới phải dừng bài cũ; đổi ngôn ngữ phải dùng bài của ngôn ngữ mới.

- AC06.1 Phát đúng MP3 Google sẵn sàng hoặc file đã lưu. Không yêu cầu GPS, BLE hay QR để nghe chủ động.

- AC06.2 Thiếu bài hoặc lỗi tải phải có thông báo dễ hiểu. Chỉ dùng nguồn giọng khác khi khách chủ động chọn; không tự thay thế.

### FR07 Tải và nghe ngoại tuyến

Liên kết UC7 | Ưu tiên P0. Khách tải nội dung và MP3 khi có mạng. Web/PWA, gói ZIP và gói mobile là các hình thức khác nhau và phải kiểm thử riêng.

- AC07.1 Hiển thị số bài đã có và còn thiếu trước hoặc sau tải; kiểm tra kích thước và SHA-256. Tải lỗi không được ghi đè gói cũ tốt.

- AC07.2 Sau tải, ngắt mạng và mở lại phải nghe đúng file cùng giọng. Bài chưa tải phải báo thiếu; không gọi TTS khi ngoại tuyến.

- AC07.3 Khi catalog thay đổi, gói tải lại loại điểm cũ và nhận điểm mới. Không hứa ZIP có bản đồ OSM ngoại tuyến.

## 5 Quản trị cấu hình và theo dõi

### FR08 Đăng nhập và đăng xuất quản trị

Liên kết UC8 | Ưu tiên P0. Admin đăng nhập bằng email và mật khẩu để nhận phiên quản trị. Khách tiếp tục sử dụng công khai; không yêu cầu dán JWT thủ công trong luồng đăng nhập chuẩn.

- AC08.1 Đăng nhập đúng mở quyền quản lý; sai thông tin hoặc tài khoản không hoạt động phải bị từ chối.

- AC08.2 API quản trị phải từ chối khi thiếu token, hết phiên hoặc không có ADMIN, kể cả gọi trực tiếp ngoài giao diện.

- AC08.3 Đăng xuất thu hồi phiên theo cơ chế hệ thống. Mật khẩu và token không xuất hiện trong log, QR, frontend cấu hình công khai hoặc Git.

### FR09 Quản lý QR và cấu hình tự phát

Liên kết UC9 | Ưu tiên P0. Admin xem, tạo và bật tắt QR, tải SVG; chỉnh bán kính và cooldown trong giới hạn cho phép. Quản lý beacon là P1 có điều kiện trên mobile.

- AC09.1 QR mới liên kết đúng POI; QR vô hiệu hóa bị từ chối khi tra trực tuyến. Bản offline cũ chỉ nhận việc thu hồi sau khi đồng bộ.

- AC09.2 Cấu hình phải được kiểm tra kiểu và giới hạn trước khi lưu; lỗi không làm thay đổi cấu hình tốt đang dùng.

- AC09.3 Đăng ký beacon chỉ lưu cấu hình, không phải bằng chứng beacon đã hoạt động. Web không được hiển thị khả năng quét BLE như chức năng đã nghiệm thu.

### FR10 Xem thống kê và nhật ký

Liên kết UC10 | Ưu tiên P0. Admin xem hiện diện, lượt bắt đầu nghe theo POI và ngôn ngữ, trạng thái job và nhật ký. Heatmap vị trí là P1 khi có dữ liệu khách đã đồng ý chia sẻ.

- AC10.1 Sự kiện nghe gửi lại không được đếm trùng; số liệu hiển thị đúng phạm vi thời gian và ngôn ngữ đang chọn.

- AC10.2 Danh sách rỗng hoặc lỗi tải phải được phân biệt với giá trị bằng không. Chỉ ADMIN đọc được dữ liệu quản trị.

- AC10.3 Không gửi vị trí thống kê khi chưa đồng ý. Dữ liệu vị trí được giữ tối đa 7 ngày theo chính sách hệ thống; khi rút đồng ý phải dừng gửi mẫu mới.

### Yêu cầu đối với giao diện quản trị

Nghiệm thu dashboard quản trị trên web. Admin vẫn sử dụng các chức năng tham quan như khách; PRD không bắt buộc lặp dashboard quản trị trong APK. Mọi thông báo lưu nội dung, tạo audio, thiếu quyền và quota cần phân biệt rõ nguyên nhân và hành động tiếp theo.

## 6 Dữ liệu và danh sách điểm tham quan

Danh sách sau là phạm vi nội dung hiện hành theo bảng tọa độ được thống nhất ngày 25/10/2026. Các tọa độ là dữ liệu đầu vào, chưa phải kết quả khảo sát thực địa. Số hiển thị có thể thay đổi mà không đổi mã liên kết dữ liệu.

| STT | Điểm tham quan | Vĩ độ | Kinh độ |
| --- | --- | --- | --- |
| 1 | Trung tâm Hành chính VQG | 11.4316 | 107.4323 |
| 2 | Bàu Sấu | 11.4594 | 107.3486 |
| 3 | Cây Tùng cổ thụ | 11.4428 | 107.4230 |
| 4 | Cây Gõ Bác Đồng | 11.4611 | 107.4140 |
| 5 | Cây Si trăm thân | 11.4725 | 107.3912 |
| 6 | Cây Đa Lộc Giao | 11.4502 | 107.4195 |
| 7 | Thác Trời | 11.4361 | 107.4525 |
| 8 | Thác Dựng | 11.4289 | 107.4610 |
| 9 | Ghềnh Bến Cự | 11.4431 | 107.4355 |
| 10 | Rừng Bằng lăng Đà Cộ | 11.4552 | 107.4045 |
| 11 | Đảo Tiên | 11.4242 | 107.4290 |
| 12 | Trạm cứu hộ gấu | 11.4325 | 107.4315 |
| 13 | Bảo tàng Thiên nhiên | 11.4310 | 107.4328 |
| 14 | Di chỉ khảo cổ Cát Tiên | 11.5235 | 107.3385 |
| 15 | Bản văn hóa Tà Lài | 11.3685 | 107.3820 |

### Yêu cầu chất lượng và lưu trữ

- Mỗi POI có mã ổn định, tên theo từng ngôn ngữ, nhóm, tọa độ và nguồn, trạng thái xác thực, trạng thái công bố và revision.

- Mỗi bản dịch có transcript và text hash. Mỗi audio có POI, ngôn ngữ, provider, trạng thái, phiên bản nội dung, đường dẫn và thông tin kiểm tra file.

- PostgreSQL lưu metadata, phiên quản trị, job, QR và thống kê; MP3 nằm trong kho file local, không nhúng toàn bộ file vào hàng POI.

- Đồng bộ trả revision và danh sách đã xóa; cache không được đưa lại tám điểm ngoài catalog. Xóa mềm và sao lưu cho phép khôi phục dữ liệu.

Mốc fixture đối chiếu ngày 26/10/2026: 15 POI và 75 bản dịch; 5 MP3 Google hợp lệ gồm Việt 2, Anh 2, Trung 1, Nhật 0, Hàn 0. Còn 70 bài để đạt đủ 75. Đây là mốc dữ liệu đi kèm dự án, không phải cam kết nội dung đã hoàn chỉnh.

## 7 Kiến trúc tích hợp và phương án chi phí

Web và Android dùng cùng backend nghiệp vụ. Web có proxy cùng origin; Android cấu hình URL backend truy cập được từ thiết bị. Backend xử lý phiên admin, nội dung, QR, đồng bộ và hàng đợi TTS; không đưa khóa Google xuống client.

| Thành phần | Lựa chọn và giới hạn |
| --- | --- |
| Web và Android | Web/PWA; React Native Expo cho Android. APK release đóng gói JavaScript để chạy không cần Metro; backend vẫn cần cho chức năng trực tuyến. |
| Bản đồ | Leaflet và nền OSM trên web; MapLibre trên mobile. Sơ đồ dùng dữ liệu hiện có, không cần mua Directions API. |
| Dữ liệu và job | PostgreSQL local và job worker dùng bảng tts_jobs. Không bắt buộc Redis, MongoDB hoặc RabbitMQ trong đường chạy local hiện hành. |
| Thuyết minh | Google AI Studio Gemini TTS phía server trong hạn mức miễn phí thực tế. Có thể upload MP3 đã chuẩn bị; không tự chuyển giọng khi quota hết. |
| Kho audio | Lưu file local và phục vụ qua audio service/proxy; sao lưu đồng bộ với metadata database. Không bắt buộc S3 hoặc CDN trả phí. |
| Triển khai đồ án | Docker Desktop và dịch vụ chạy trên máy nhóm; URL LAN cho điện thoại cùng mạng. Truy cập từ xa cần máy chủ hoặc tunnel được nhóm lựa chọn riêng. |

### Nhóm API bắt buộc

| Nhóm | Hợp đồng nghiệp vụ |
| --- | --- |
| Công khai | Đọc POI theo ngôn ngữ, cấu hình, tra QR và manifest đồng bộ. Chỉ trả nội dung đang công bố và audio hợp lệ. |
| Xác thực | Đăng nhập, refresh, đăng xuất và thông tin admin hiện hành; không có đăng ký khách. |
| Quản trị | CRUD POI, upload hoặc tạo audio, theo dõi job, QR, beacon, cấu hình, thống kê và audit. |
| Audio và sức khỏe | Phục vụ MP3 với MIME, độ dài và Range đúng; kiểm tra sống/sẵn sàng để hỗ trợ vận hành. |

Chi tiết endpoint nằm trong API.md. API chuẩn hóa lỗi dữ liệu, thiếu quyền, không tìm thấy và lỗi dịch vụ; không trả SQL, mật khẩu hoặc khóa ra giao diện. Việc tích hợp thư viện miễn phí không đồng nghĩa được tải hàng loạt tile để làm bản đồ ngoại tuyến.

## 8 Yêu cầu phi chức năng và nghiệm thu

Các mục tiêu đo dưới đây là tiêu chí nghiệm thu đề xuất cho đồ án, chưa phải số đo hiệu năng đã đạt. Nhóm cần ghi thiết bị, phiên bản Android/trình duyệt, cấu hình server và mạng khi kiểm tra.

| Mã | Yêu cầu và cách kiểm tra |
| --- | --- |
| NFR01 | Tiếng Việt có dấu và năm ngôn ngữ hiển thị đúng; không còn nhãn giao diện sót ngôn ngữ sau chuyển đổi trong các màn thuộc phạm vi. |
| NFR02 | Đề xuất trên LAN ổn định: tải danh sách 15 điểm trong 3 giây; phản hồi lọc/chọn trong 300 ms; bắt đầu phát MP3 đã lưu trong 2 giây. Tile nền đo riêng vì phụ thuộc mạng ngoài. |
| NFR03 | Không lộ khóa trong bundle, Git, QR hoặc log. API quản trị được kiểm tra quyền server. Keystore và ghi chú ký APK phải được bỏ qua khỏi Git. |
| NFR04 | Không có quyền vị trí hoặc camera vẫn xem danh sách và nghe chủ động; có cách nhập mã thay cho quét khi phù hợp. |
| NFR05 | Sau mất mạng hoặc đóng mở lại, gói đã tải đủ và hợp lệ vẫn phát được. Lỗi tải không phá gói tốt; đồng bộ nội dung và audio theo version/hash. |
| NFR06 | MP3 và metadata sao lưu cùng nhau. Nhóm phải thử phục hồi trên database riêng, không chỉ tạo được file sao lưu. |
| NFR07 | Máy thành viên cài từ clone và fixture không cần dùng database, mật khẩu hoặc khóa API của tác giả. Tài liệu mô tả rõ cập nhật catalog trên máy có dữ liệu cũ. |
| NFR08 | HTTP LAN phục vụ demo nghe; tính năng web cần ngữ cảnh an toàn phải dùng localhost/HTTPS. Không cam kết camera/PWA/GPS đầy đủ trên mọi trang HTTP LAN. |

### Bộ kiểm thử nghiệm thu

AT01–AT10 tương ứng FR01–FR10 và từng AC của chúng. Mỗi ca phải lưu kết quả mong đợi, thực tế, thiết bị và bằng chứng. Bắt buộc có các nhánh: thiếu quyền, sai QR, token admin hết hạn, thiếu audio, quota 429, transcript thay đổi, tải file lỗi, mất mạng và cache danh sách cũ.

Điều kiện hoàn tất phạm vi: toàn bộ AC mức P0 đạt, đủ 75 MP3 đã duyệt và kiểm tra hash, không còn lỗi chặn truy cập/phát/đăng nhập/đồng bộ, và có bằng chứng cài APK release cùng kiểm thử ngoại tuyến. Nếu giảm số ngôn ngữ hoặc số bài, nhóm phải ghi quyết định thay đổi phạm vi trước khi nghiệm thu.

- AT03 dùng POI thử có tọa độ được kiểm soát; thử thực địa riêng trước khi bật xác thực cho dữ liệu thật. Không bật geoVerified chỉ để vượt bài kiểm tra.

- AT07 thử riêng PWA, ZIP và APK; tắt mạng thật, mở lại và kiểm tra đúng POI/ngôn ngữ/giọng. Không suy diễn kết quả từ nền tảng này sang nền tảng khác.

- Nghiệm thu phát hành Android phải cài APK release đã ký lên thiết bị thật; xác minh backend, quyền, phát audio và ngoại tuyến. Build thành công chưa đủ để nghiệm thu.

## 9 Trạng thái lộ trình và tài liệu nguồn

### Đối chiếu mốc dự án hiện tại

| Phạm vi | Trạng thái đối chiếu |
| --- | --- |
| UC1 UC2 UC4 UC6 | Có mã web và luồng sử dụng; sơ đồ và OSM đã cập nhật 15 điểm. Tuyến tham khảo chưa đầy đủ cho mọi cặp điểm. |
| UC3 | Có xử lý tự phát có điều kiện; dữ liệu catalog hiện chưa được xác thực thực địa. Chưa nghiệm thu GPS/BLE trên địa điểm thật. |
| UC5 UC7 | Có tạo/upload và gói ngoại tuyến; fixture mới có 5/75 bài. Chưa đạt mục tiêu đầy đủ 75 bài và cần thử ngoại tuyến trên thiết bị thật. |
| UC8 UC9 UC10 | Có xác thực admin và công cụ quản trị web. Các nhánh phần cứng, heatmap và thu hồi mã trong bản offline cần kiểm tra theo điều kiện dữ liệu. |
| Android | Có mã mobile và các bản sửa build/runtime. PRD chưa có bằng chứng nghiệm thu APK release mới trên điện thoại thật. |

### Thứ tự hoàn thiện

- Mốc 1 chốt catalog, transcript và bản dịch; đồng bộ đúng 15 điểm trên máy nhóm, tránh tạo audio cho nội dung đã thay đổi.

- Mốc 2 tạo bổ sung 70 bài trong quota được phép, kiểm tra nghe và hash; xuất fixture/gói ngoại tuyến mới. Thời gian phụ thuộc quota thực tế, không đặt ngày hoàn tất cố định.

- Mốc 3 khảo sát tọa độ, bổ sung dữ liệu tuyến đã thống nhất; kiểm thử tự phát và QR. BLE hoặc định vị nền chỉ đưa vào nghiệm thu nếu có thiết bị và bằng chứng.

- Mốc 4 ký và kiểm thử APK release, thử restore dữ liệu, hoàn thiện bằng chứng AT01–AT10 rồi bàn giao. Không xem trạng thái test mã nguồn là nghiệm thu mọi chức năng.

### Rủi ro và quyết định cần chốt

Quota Google có thể kéo dài tiến độ: giữ hàng đợi, không bật billing và không đổi khóa để vượt quota project. LAN/IP thay đổi làm QR hoặc APK mất kết nối: thống nhất địa chỉ demo trước khi in mã/build. Đường đi và tọa độ cần xác minh: giới hạn rõ tuyến tham khảo. Nhóm và giảng viên cần chốt thiết bị Android thử nghiệm, yêu cầu đủ 75 bài và việc đưa BLE/heatmap vào phạm vi cuối cùng.

### Nguồn và thứ tự ưu tiên

[S1] Smart_Audio_Guide_Focused_UseCases (1).docx bản gốc v1.0; [S2] Smart_Audio_Guide_Focused_UseCases_v1_2.docx, USE_CASE_REVIEW.md và cases.json cho 10 UC; [S3] bảng 15 POI được người dùng chốt ngày 25/10/2026, active-pois.json và ACTIVE_POIS.md; [S4] API.md và ERD.md; [S5] GEMINI_AUDIO_PROGRESS.md và fixture; [S6] MAP_DISPLAY_FIX.md, TEAM_SETUP.md và các báo cáo kiểm tra mã nguồn.

Quyết định mới nhất của chủ dự án ưu tiên hơn mô tả cũ: 15 điểm thay danh sách trước; năm ngôn ngữ thay giới hạn hai tiếng; Google AI Studio thay mô tả Google/AWS chung; User không đăng nhập. Tài liệu gốc và bản use case được giữ nguyên. Các mục chưa có bằng chứng nghiệm thu được theo dõi riêng trong PRD này.
