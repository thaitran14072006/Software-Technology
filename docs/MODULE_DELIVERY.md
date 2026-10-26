# Cập nhật repository theo module — 26/10/2026

Repository: https://github.com/thaitran14072006/Software-Technology — nhánh main.

Bộ thay đổi được tách thành sáu commit với thông điệp tiếng Anh:

| Module | Nội dung |
|---|---|
| Repository | Bỏ qua toàn bộ AndroidKeys và giữ nguyên byte thư viện Leaflet trên Windows. |
| Backend & fixture | Chấp nhận nguồn tọa độ tài liệu có SHA-256; fixture 15 POI, 75 bản dịch, 5 MP3 Google; bỏ MP3 của điểm đã loại khỏi dữ liệu chia sẻ. |
| Tools | Catalog 15 điểm, cập nhật một lần có sao lưu, chặn nhập danh sách cũ; khởi động không thêm lại seed cũ. |
| Web | Số thứ tự 1–15, sơ đồ đủ điểm từ GPS, hai chế độ bản đồ, bộ lọc và xử lý cache cũ; shell cache mới. |
| Mobile | Lọc catalog mới khi tải API/đọc cache/offline; bổ sung mã MMKV cần thiết để clone đủ mã nguồn. |
| Documentation | Danh sách và tọa độ hiện hành, ảnh kiểm chứng, báo cáo sửa và hướng dẫn thành viên cập nhật database. |

## Kiểm tra trước khi phát hành

- Web: 42/42 bài kiểm thử đạt.
- Backend: 18/18 bài kiểm thử đạt; ba dịch vụ NestJS build thành công.
- Mobile: 16/16 bài kiểm thử đạt và TypeScript không lỗi. Không build hoặc cài APK mới trong lần này.
- Database kiểm thử tạm: nhập mới 15 POI, 75 bản dịch, 5 MP3 kiểm tra hash; nhập lặp giữ chỉnh sửa; chỉ nhận audio khi transcript khớp. Không reset database chính hoặc gọi dịch vụ TTS.
- Kiểm tra tệp chuẩn bị commit không phát hiện mẫu khóa API/khóa riêng; `.env`, dữ liệu runtime, keystore và ghi chú AndroidKeys bị loại khỏi Git.

## Nhận bản cập nhật

Lưu/commit công việc riêng của thành viên trước khi pull, rồi chạy:

```powershell
git switch main
git pull --ff-only
```

Máy đã có database cũ cần làm phần 7 trong [TEAM_SETUP.md](TEAM_SETUP.md) để áp dụng danh sách 15 POI. Database và tài khoản admin trên từng máy độc lập; khóa AI Studio do thành viên tự cấu hình. Không chia sẻ khóa qua repository.

## Phần còn thiếu

Còn 70/75 bản Google của danh sách hiện hành; gói âm thanh chưa đầy đủ. Một số tuyến chưa có dữ liệu đường đi và cần khảo sát GPS/BLE, kiểm thử APK release trên thiết bị thật. Commit mã nguồn không đồng nghĩa các phần này đã hoàn tất.
