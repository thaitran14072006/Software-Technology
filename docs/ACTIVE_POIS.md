# Danh sách 15 POI đang sử dụng — 25/10/2026

Đã áp dụng danh sách mới do người dùng cung cấp vào database và cả hai thư mục dự án. Đây là danh sách hiện hành, thay thế danh sách 23 điểm từ tài liệu Word trước đó.

| STT | Điểm tham quan | Vĩ độ, kinh độ |
|---:|---|---|
| 1 | Trung tâm Hành chính VQG | 11.4316, 107.4323 |
| 2 | Bàu Sấu | 11.4594, 107.3486 |
| 3 | Cây Tùng cổ thụ | 11.4428, 107.4230 |
| 4 | Cây Gõ Bác Đồng | 11.4611, 107.4140 |
| 5 | Cây Si trăm thân | 11.4725, 107.3912 |
| 6 | Cây Đa Lộc Giao | 11.4502, 107.4195 |
| 7 | Thác Trời | 11.4361, 107.4525 |
| 8 | Thác Dựng | 11.4289, 107.4610 |
| 9 | Ghềnh Bến Cự | 11.4431, 107.4355 |
| 10 | Rừng Bằng lăng Đà Cộ | 11.4552, 107.4045 |
| 11 | Đảo Tiên | 11.4242, 107.4290 |
| 12 | Trạm cứu hộ gấu | 11.4325, 107.4315 |
| 13 | Bảo tàng Thiên nhiên | 11.4310, 107.4328 |
| 14 | Di chỉ khảo cổ Cát Tiên | 11.5235, 107.3385 |
| 15 | Bản văn hóa Tà Lài | 11.3685, 107.3820 |

## Phạm vi cập nhật

- Web ở chế độ API và demo, bản đồ OpenStreetMap, bộ lọc, GPS và dữ liệu ngoại tuyến sử dụng cùng 15 điểm, theo thứ tự bảng trên.
- API công khai, trang quản trị và danh sách QR không còn trả về tám điểm ngoài danh sách. Đồng bộ mobile trả về tám mã đã xóa để cập nhật bộ nhớ cũ.
- Tám điểm đã gỡ: Bằng lăng 5 ngọn, Thiên tuế, Vườn thực vật, Cây 6 múi, Bằng lăng lộc bình, Rừng Đại Phong Tử, điểm xem thú đêm, Thác Rễ.
- Giữ mã POI/UUID và liên kết của các điểm tương ứng, bản dịch, transcript và âm thanh Google còn hợp lệ. Tọa độ lấy đúng bảng người dùng; chưa được xác minh thực địa.
- Điểm loại bỏ được lưu trữ mềm để có thể khôi phục; không còn được sử dụng trong hệ thống. Bản sao trước thay đổi nằm riêng tại backend/.runtime/catalog-backups, không đưa lên Git.
- Lệnh `npm run content:catalog -- --apply` chỉ áp dụng khi gọi rõ ràng, có sao lưu. Khởi động thường không thực hiện xóa điểm hoặc thay đổi QR/job. Các công cụ nhập danh sách cũ đã được chặn để không thêm lại điểm đã bỏ.

## Kiểm chứng

- API đủ 15 điểm, đúng tọa độ và thứ tự ở cả năm ngôn ngữ; quản trị chỉ có 15 điểm; QR loại trừ tám điểm cũ.
- Bản đồ hiển thị 15/15 điểm có tọa độ. Các điểm gần nhau có thể chồng biểu tượng khi thu nhỏ; phóng to để phân biệt.
- Kiểm thử web: 38/38 ở thư mục gốc và 40/40 ở thư mục GitHub. Mobile: 16/16 và TypeScript đạt.
- Kiểm thử fixture trên database tạm đạt, không reset database chính.
- ZIP ngoại tuyến hiện có 5 MP3 Google, 3.169.777 byte; CRC, kích thước và SHA-256 của từng MP3 đều đạt ở cả hai thư mục.

## Âm thanh còn thiếu

Danh sách mới có 75 bài (15 điểm × 5 ngôn ngữ): đã có 5 bản Google hợp lệ, còn thiếu 70. Việt 2, Anh 2, Trung 1, Nhật 0, Hàn 0. 15 MP3 của các điểm bị loại đã được tách khỏi fixture/gói chia sẻ và giữ bản sao riêng. Chưa tạo thêm bài trong lần cập nhật này. Hệ thống chưa đủ toàn bộ thuyết minh ngoại tuyến.

## Chạy và cập nhật thiết bị

Trong thư mục GitHub, chạy:

```powershell
cd "C:\Users\Home\Desktop\git_CNPM\Software-Technology"
npm run dev:gemini:lan
```

Mở web, tải lại bằng Ctrl+F5; chọn OpenStreetMap → Tất cả → Về toàn cảnh. Tải lại gói ngoại tuyến để thay danh sách đã lưu. Phiên kiểm tra tạm đã được dừng để không chiếm cổng của terminal người dùng; Docker và dữ liệu được giữ nguyên.

Mobile cần đồng bộ dữ liệu; build lại APK để nhận logic lọc cache mới. APK cũ chưa đồng bộ có thể vẫn giữ dữ liệu cũ. Thay đổi được chia theo module cho lần cập nhật GitHub ngày 26/10/2026; xem MODULE_DELIVERY.md.
