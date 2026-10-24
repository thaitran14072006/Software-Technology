# Sửa giọng đọc khác cat-tien-app — 23/10/2026

**Lịch sử:** bản sửa mới hơn ưu tiên MP3 Google AI Studio. Xem [trạng thái mới nhất](GOOGLE_AI_STUDIO_AND_OFFLINE.md); mô tả mặc định dùng trình duyệt bên dưới thuộc lần sửa trước.

## Nguyên nhân

Đã đọc lại `js/core/audio.js`, `js/media/ai-voice.js` và cấu hình ngôn ngữ trong bản tham chiếu. Thư mục đó hiện không có bộ `audio/` MP3, nên dùng Web Speech API của trình duyệt. Mã nguồn chọn giọng đầu tiên khớp toàn bộ locale, nếu không có mới chọn giọng cùng ngôn ngữ.

Smart Audio Guide có 75 MP3 sinh bằng eSpeak cục bộ. Trước bản sửa này, web ưu tiên MP3 nên giọng cơ học lấn át giọng trình duyệt. Ngoài ra, hàm chọn giọng đã ưu tiên `localService`, có thể đưa giọng hệ thống cũ lên trước giọng trực tuyến mà cat-tien-app chọn. Đây là hai lựa chọn triển khai chưa phù hợp với mong muốn giữ giọng như bản tham chiếu.

## Đã sửa

- Mặc định web dùng **Giọng trình duyệt · như cat-tien-app**, áp dụng cả chế độ demo và backend, cho cả vi/en/ja/ko/zh.
- Chọn giọng giống bản tham chiếu: khớp locale trước, giữ thứ tự danh sách trình duyệt; không ưu tiên riêng giọng local và không loại giọng online.
- Giữ bước chờ `voiceschanged` có thời hạn và chặn phát sau khi đã dừng/đổi điểm.
- Thêm **Nguồn giọng đọc** để chọn **MP3 đã lưu · dùng ngoại tuyến** khi cần. Lựa chọn được nhớ trên trình duyệt; MP3/database không bị xóa hoặc ghi đè.
- Nếu trình duyệt không có Speech API thì có thể dùng MP3 có sẵn. Không tự chuyển từ giọng trình duyệt đang lỗi sang MP3 eSpeak vì sẽ lại gây bất ngờ về chất lượng.
- Shell PWA nâng lên v5 để cập nhật module mới. Không gọi thêm API TTS trả phí hoặc cài engine mới.

## Cách nghe sau cập nhật

1. Hệ thống đang chạy có thể tiếp tục dùng; web/dist đã được build lại. Tải lại trang bằng **Ctrl+F5**. Nếu PWA vẫn giữ bản cũ, đóng các tab ứng dụng rồi mở lại.
2. Ở khung thuyết minh, chọn **Nguồn giọng đọc → Giọng trình duyệt · như cat-tien-app**.
3. Chọn ngôn ngữ và bấm Nghe thuyết minh. Dùng cùng trình duyệt/profile và cùng thiết bị mà bạn nghe cat-tien-app tự nhiên. Giữ mạng nếu giọng đó là giọng online.
4. Chọn MP3 khi cần nghe bản đã lưu ngoại tuyến; các file eSpeak hiện tại vẫn có giọng cơ học.

## Kiểm chứng và giới hạn

`npm test`: **29/29 đạt**, gồm hồi quy không để MP3 eSpeak lấn át nguồn browser mặc định và không ưu tiên giọng local trước giọng khớp locale xuất hiện đầu tiên. Giao diện đã hiện nguồn browser mặc định và đi vào luồng Web Speech khi bấm phát.

Trình duyệt tích hợp dùng để kiểm tra không cung cấp giọng vi-VN trong danh sách ở lần kiểm tra này, nên chưa thể xác nhận chất lượng nghe bằng tai cho cả năm ngôn ngữ. Bản sửa khôi phục cách chọn nguồn và giọng của cat-tien-app; không thể bảo đảm giọng giống nhau trên trình duyệt/thiết bị có danh sách giọng khác nhau. Không thay đổi ứng dụng React Native trong bản sửa web này.
