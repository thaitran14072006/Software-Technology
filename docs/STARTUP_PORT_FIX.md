# Sửa lỗi web thoát khi chạy LAN

Log `backend/.runtime/web.log` ghi `EADDRINUSE`, địa chỉ `0.0.0.0`, cổng `4173`: có chương trình khác đang giữ cổng web. Lần khởi động in `web exited (1)` chưa thành công. Các dòng SQL `already exists, skipping` là thông báo bình thường khi chạy lại, không phải nguyên nhân lỗi.

## Đã sửa

- Kiểm tra cả bốn cổng web/content/audio/QR trước khi khởi động Docker, build hoặc áp dụng database; hỗ trợ các cổng tùy chỉnh trong cấu hình.
- Báo rõ dịch vụ đang bị chiếm cổng và hướng dẫn dừng phiên cũ bằng Ctrl+C; không tự tắt chương trình khác.
- Ngăn bước kiểm tra sẵn sàng báo thành công khi tiến trình đã dừng.
- In nguồn TTS khi khởi động để phân biệt eSpeak và Google AI Studio.
- Bổ sung kiểm thử cổng bị chiếm, giải phóng cổng sau kiểm tra, cấu hình LAN và cổng không hợp lệ/trùng nhau.

## Chạy lại

1. Tại terminal của phiên hệ thống cũ, nhấn Ctrl+C. Chỉ giữ một phiên chạy.
2. Mở Docker Desktop, đợi engine sẵn sàng.
3. Tại thư mục dự án chạy `npm run dev:gemini:lan` để dùng Google AI Studio. `npm run dev:lan` chọn eSpeak, nên không phù hợp khi muốn giọng Google.
4. Chờ thông báo Web và không có dòng `exited`. Mở `http://127.0.0.1:4173/?source=api` trên máy tính; điện thoại cùng Wi-Fi mở địa chỉ LAN do terminal in ra.
5. Giữ terminal mở trong lúc sử dụng. Nếu cổng vẫn bị chiếm, xác định đúng phiên/chương trình đang dùng cổng trước khi dừng; không tắt toàn bộ tiến trình Node.

## Trạng thái

Đã kiểm thử: 2 bài kiểm tra cổng đều đạt; khởi động thật bằng `dev:gemini:lan -- --skip-build` đã đến trạng thái Web sẵn sàng; chạy phiên thứ hai bị chặn sớm với thông báo cổng 4173. Đã dừng phiên thử sau kiểm tra để người dùng tự chạy tại terminal.

Lỗi khởi động do trùng cổng đã có kiểm tra và thông báo sớm; điều này không có nghĩa toàn hệ thống đã hoàn thiện. Google hiện có 11 MP3 đã tạo, các bản còn lại đang chờ quota miễn phí. Những bản đã có vẫn nghe được; khởi động lại không làm tăng quota. Chi tiết nội dung, tọa độ và phần chưa hoàn tất nằm trong [báo cáo Google và ngoại tuyến](GOOGLE_AI_STUDIO_AND_OFFLINE.md).
