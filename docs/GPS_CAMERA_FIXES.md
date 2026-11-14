# Kiểm tra GPS và camera

## Những lỗi đã sửa

- GPS timeout hoặc tạm mất tín hiệu tiếp tục theo dõi để nhận vị trí mới; từ chối quyền thì dừng watcher. Tắt GPS cũng tắt chế độ tự phát.
- Tự phát bỏ vị trí cũ hơn 10 giây, dữ liệu sai, mẫu trùng và độ chính xác thấp. Cần hai mẫu liên tiếp, chỉ xét tọa độ đã xác thực; chọn điểm gần nhất khi vùng chồng nhau.
- Cooldown chỉ bắt đầu khi âm thanh thật sự phát. Lần phát lỗi có thể thử lại, có khoảng chờ 10 giây giữa các lần tự yêu cầu để tránh lặp liên tục.
- Camera có decoder jsQR local khi BarcodeDetector không tồn tại hoặc bị lỗi. Không phụ thuộc CDN và không gửi hình ảnh camera lên máy chủ.
- Đóng hộp QR, tắt camera, chuyển tab hoặc rời trang đều dừng stream. Nếu đóng trong lúc chờ quyền, stream trả về sau đó cũng phải được giải phóng.
- Có nút tắt camera, thông báo riêng cho thiếu quyền, không có camera, camera bận và HTTP không bảo mật. Quét mã không hợp lệ vẫn cho quét mã tiếp theo.

## Kiểm thử và giới hạn

Kiểm thử tự động dùng vị trí giả lập và MediaStream mock, bao gồm hủy trong lúc chờ quyền. Decoder được kiểm tra bằng ảnh QR thật sinh từ dữ liệu đã biết, cả khi thiếu/lỗi native BarcodeDetector. Đây không phải kiểm thử phần cứng GPS/camera ngoài thực địa.

Kiểm tra giao diện local: mở đủ 15 điểm từ API, yêu cầu camera bị từ chối có thông báo rõ và trả nút quét về trạng thái dùng được; bật GPS hiển thị đang định vị, bấm tắt trả về trạng thái ban đầu và tắt tự phát. Bộ kiểm thử web đạt 87/87 ngày 14/11/2026.

Điện thoại truy cập bằng IP LAN qua HTTP thường không được dùng GPS/camera. Cần địa chỉ HTTPS truy cập được và người dùng cho phép vị trí/camera. Không tắt bảo vệ trình duyệt để vượt điều kiện này.

Không thay đổi cờ geoVerified cho tọa độ chưa khảo sát. Cần kiểm tra tại điểm thật trên Android/iPhone: cho phép và từ chối quyền, mất/nhận lại GPS, quét QR in trên giấy, đóng hộp khi camera bật và xác nhận camera đã tắt. Không cần bật tổng hợp TTS cho các kiểm tra này.
