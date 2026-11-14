# Đồng bộ 15 điểm theo sơ đồ tham quan

Danh mục chuẩn là 15 số trên sơ đồ, do người dùng chọn ngày 14/11/2026. Các điểm này dùng UUID PostgreSQL thật trên web, QR, thống kê và offline. Điểm ngoài sơ đồ được giữ dữ liệu nhưng lưu trữ. Không dùng số thứ tự để thay UUID và không tạo POI tổng hợp trong trình duyệt.

## Cập nhật database local của thành viên trong nhóm

Sau khi cập nhật mã và mở PostgreSQL, chạy lần lượt ở thư mục gốc:

```powershell
npm run build
npm run content:visitor-map
npm run content:visitor-map -- --apply
npm run build
```

Lệnh thứ hai chỉ xem phạm vi. `--apply` là di chuyển danh mục có chủ đích: sao lưu database liên quan và hai file nội dung vào `backend/.runtime/visitor-map-backups/`, giữ UUID của điểm đã có, khôi phục 15 mã `1` đến `15`, lưu trữ các điểm ngoài danh sách và chặn job cũ đã bị nội dung/danh mục thay thế. Không xóa file thu âm và không gọi Google, không enqueue job mới. Dừng synthesis worker trước khi chạy; script từ chối nếu có job RUNNING. Lệnh này không phải tác vụ startup tự động.

63 bản MP3 được lấy từ những file nhóm đã có và đã khớp hash nội dung; đây không phải 63 bản vừa được tạo. Bộ fixture lưu bản sao theo checksum để thành viên khác dùng được. Không coi file hợp lệ là bằng chứng đã nghe duyệt chất lượng.

## Hành vi đã sửa

- Danh sách khách đọc POI công bố từ API, không lọc mất POI mới vì seed cũ và không tự tạo ID `schematic-*`.
- Giữ nguyên artwork, vị trí và số trên sơ đồ. Tên điểm lấy theo bản dịch backend để sửa trong quản trị có hiệu lực. POI mới ngoài sơ đồ vẫn có thể hiện trong danh sách; sơ đồ không tự bịa vị trí.
- QR bị API từ chối 4xx không được mở lại bằng cache. Mất mạng/lỗi máy chủ có thể dùng bảng đã lưu và phải thông báo dữ liệu cũ.
- MP3 thiếu/lỗi không tự chuyển nguồn sang giọng thiết bị. Giọng thiết bị là lựa chọn chủ động.
- Gói PWA báo số file thực tải/tổng số bài và số thiếu, không quy mọi thiếu file về quota. Gói dùng danh mục cũ phải tải lại.
- ZIP giữ văn bản của cả bài thiếu MP3, hiển thị trạng thái thiếu và thống kê theo ngôn ngữ.
- Dashboard có bảng trạng thái MP3 từng điểm/ngôn ngữ. Form beacon chọn tên điểm thay vì yêu cầu nhập UUID POI.
- Về toàn cảnh dừng audio; thoát trang dừng GPS watcher đúng biến.
- Bộ nhớ đệm có đủ module GPS để trang khởi động khi mất mạng; kiểm thử đối chiếu toàn bộ dependency của app với danh sách cache.

## Kết quả kiểm tra local ngày 14/11/2026

75/75 kiểm thử web và 15 nhóm kiểm tra API đạt. 63 URL audio API và 63 file chia sẻ trả về hợp lệ. ZIP có 63/75 MP3, đủ văn bản của 75 bài. Đã tạm tắt máy chủ web, tải lại trang từ cache, thấy đủ 15 điểm và khởi động phát MP3 đã lưu; sau đó bật lại máy chủ và xác nhận nguồn API hoạt động. Đây là kiểm tra phát kỹ thuật, chưa xác nhận chất lượng giọng bằng nghe duyệt hay thử trên điện thoại ngoài thực địa.

## Điều kiện cần hoàn thành riêng

Nhật và Hàn còn thiếu MP3 cho các số 3, 4, 6, 10, 11, 12. Không tạo tự động; chỉ tạo khi được yêu cầu. Các file còn dùng nhiều narrator nên vẫn cần nghe duyệt và xử lý giọng riêng.

Các tọa độ chưa đối chiếu thực địa giữ `geoVerified=false`; không bật cờ để giả lập nghiệm thu GPS. GPS vẫn lấy được vị trí trên thiết bị hỗ trợ/quyền phù hợp, còn tự phát cần POI đã xác thực. Cần thử ngoài thực địa/camera/điện thoại thật và mạng công khai trước khi nghiệm thu.
