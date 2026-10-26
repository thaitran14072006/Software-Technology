> Cập nhật 25/10/2026: hệ thống chỉ sử dụng [15 POI theo bảng mới](ACTIVE_POIS.md). Các số liệu danh sách cũ bên dưới là lịch sử.

# POI theo tài liệu tọa độ ngày 25/10/2026

Đã đọc toàn bộ file docs/Khu vực trung tâm và các điểm gần trụ sở.docx, nhận diện 15 cặp vĩ độ/kinh độ và áp dụng đúng từng cặp vào database. Chín điểm đã có được cập nhật vị trí theo mã cũ; sáu điểm được tạo mới. Không đăng thay đổi lên cơ sở dữ liệu OpenStreetMap công cộng: đây là marker của ứng dụng trên nền bản đồ OSM.

## Kết quả

- 23 POI published, 115 bản dịch; 20 MP3 Google cũ được giữ nguyên, còn 95 bản chưa có Google (gồm 30 bản cho sáu POI mới).
- 15 marker lấy tọa độ từ tài liệu; thêm một marker di tích khảo cổ có nguồn trước đó: tổng cộng 16/23 marker OSM khi chọn Tất cả.
- Tám POI cũ không có trong tài liệu vẫn được giữ. Trong số này, bảy điểm chưa có nguồn GPS hợp lệ không được đưa tọa độ ước lượng lên OSM.
- Sáu điểm mới có đủ Việt, Anh, Nhật, Hàn, Trung và QR riêng. Không tạo công việc Google mới và không tiêu quota trong lần nhập này.
- Không tự chiếu tọa độ GPS sang sơ đồ hoặc bịa đường mòn. Sáu điểm mới có trên bản đồ địa lý và danh sách; chưa có vị trí/đường đi tương ứng trên sơ đồ.

## Danh sách tọa độ

| STT tài liệu | Mã POI | Tên trong tài liệu | Vĩ độ | Kinh độ | Xử lý |
|---:|---|---|---:|---:|---|
| 1 | coord-01 | Trụ sở Vườn Quốc gia Cát Tiên (Bến phà Nam Cát Tiên) | 11.423924 | 107.427845 | Tạo mới |
| 2 | coord-02 | Bảo tàng Thiên nhiên Cát Tiên (Trung tâm du khách) | 11.425102 | 107.428011 | Tạo mới |
| 3 | 2 | Cây Tung cổ thụ (hơn 400 năm tuổi) | 11.431055 | 107.426132 | Cập nhật vị trí |
| 4 | 13 | Cây Si trăm thân | 11.438510 | 107.421520 | Cập nhật vị trí |
| 5 | 9 | Khu dự trữ ngập nước Bàu Sấu (Crocodile Lake) | 11.464611 | 107.337145 | Cập nhật vị trí |
| 6 | 1 | Đảo Tiên (Trung tâm cứu hộ Gấu) | 11.417245 | 107.427010 | Cập nhật vị trí |
| 7 | doc-13 | Trung tâm Cứu hộ Linh trưởng Nguy cấp (Khu Đảo Tiên) | 11.419015 | 107.425088 | Cập nhật vị trí |
| 8 | coord-08 | Điểm ngắm thú đêm (Khu đồng cỏ Tà Lài / Trảng Cò) | 11.405102 | 107.401211 | Tạo mới |
| 9 | 7 | Cây Gõ Bác Đồng | 11.442250 | 107.387915 | Cập nhật vị trí |
| 10 | 8 | Cây Đa lộc giao | 11.451021 | 107.382104 | Cập nhật vị trí |
| 11 | 14 | Thác Trời | 11.385011 | 107.391201 | Cập nhật vị trí |
| 12 | coord-12 | Thác Dựng | 11.387532 | 107.382015 | Tạo mới |
| 13 | coord-13 | Thác Rễ | 11.391055 | 107.395521 | Tạo mới |
| 14 | 5 | Bến Cự (Suối Bến Cự) | 11.413210 | 107.410145 | Cập nhật vị trí |
| 15 | coord-15 | Làng du lịch cộng đồng Tà Lài (Nhà Dài Tà Lài) | 11.392740 | 107.343511 | Tạo mới |

Ghép mục cứu hộ Gấu vào mã 1 (Trung tâm cứu hộ động vật hoang dã, nội dung hiện có nói về gấu); mục linh trưởng Đảo Tiên vào doc-13. Giữ tên/nội dung các điểm cũ để không làm mất liên kết audio. Tài liệu mới tách Thác Trời và Thác Dựng thành hai điểm; lời thuyết minh cũ của Thác Trời vẫn có câu gọi hai tên tương đương, cần biên tập riêng nếu nhóm xác nhận chúng là hai địa điểm khác nhau.

## Nguồn và độ chính xác

SHA-256 của file Word: 39afdae96177b6463c6f9aa95b6432df372f7be4259a1f3ad960b554fed0d235. Mỗi điểm ghi geoSourceUrl dạng urn:sha256:<hash>#point-NN để truy lại đúng tài liệu/mục. Đây là nguồn do người dùng cung cấp, không phải kết quả đối chiếu độc lập hoặc khảo sát thực địa.

Tất cả 15 điểm giữ geoVerified=false; vẫn hiển thị trên OSM nhờ có dấu vết tài liệu, nhưng không tự bật phát GPS. Một số vị trí khác đáng kể với các nguồn bản đồ dùng trước đây, nhất là Gõ Bác Đồng, Bến Cự, Thác Trời và khu cứu hộ. Đã dùng đúng tọa độ người dùng yêu cầu; không coi chúng là tọa độ thực địa đã xác nhận.

## Cách xem

Mở http://127.0.0.1:4173/?source=api, tải lại trang (Ctrl+F5 nếu cần), bấm Bản đồ OpenStreetMap và chọn Tất cả. Nút Về toàn cảnh gom các marker đang lọc vào khung nhìn. Bấm điểm hoặc chọn trong danh sách để xem nội dung; chi tiết ghi Tọa độ theo tài liệu. Đã kiểm tra bộ lọc nước/thác cho kết quả 5/5 marker và chọn được Bảo tàng Thiên nhiên mới. Trong lần kiểm tra, một số ô nền OSM chưa tải được; dữ liệu marker vẫn hiển thị và bộ lọc vẫn hoạt động.

## Nhập lại và chia sẻ

Mã nguồn, tài liệu tọa độ, fixture và giao diện đã được cập nhật ở cả thư mục gốc và bản clone GitHub trên máy. Chưa commit/push thay đổi lần này.

Sau khi có mã/fixture mới:

- Máy mới: chạy bộ khởi động bình thường để seed 23 POI.
- Máy đã có database: npm run content:coordinates để xem trước; npm run content:coordinates -- --apply để cập nhật tọa độ theo tài liệu.
- Lệnh không ghi đè bản dịch/audio của điểm cũ; sao lưu trước khi áp dụng tại backend/.runtime/coordinate-import/.
- Lần chạy xem trước sau khi áp dụng trả update=0, create=0, nên không nhân bản POI.

Backup lần áp dụng đầu: C:\Users\Home\Desktop\smart-audio-guide\smart-audio-guide\backend\.runtime\coordinate-import\before-1792943375745.json. File Word gốc không bị chỉnh sửa.

## Kiểm tra

- Đúng toàn bộ 15 cặp tọa độ qua API và hàm hiển thị marker.
- Giữ nguyên bản dịch và metadata/trạng thái audio của chín POI cập nhật so với bản sao lưu.
- Sáu QR mới và 30 bản dịch mới đầy đủ.
- Web: 36 kiểm thử đạt ở thư mục gốc; 38 kiểm thử đạt ở bản clone (gồm các kiểm tra tìm kiếm đã có của nhóm). Backend: ba service build thành công, 18 kiểm thử đạt.
- Sửa mục ghim hash Leaflet có sẵn trong bản clone về hash của tệp 1.9.4 đang dùng; giữ nguyên byte vendor qua Git để tránh sai khác xuống dòng.
- Fixture: 23 POI, 115 bản dịch, 20 MP3 kiểm tra trên database tạm; nhập lặp, bảo toàn chỉnh sửa và kiểm tra hash audio đạt.
