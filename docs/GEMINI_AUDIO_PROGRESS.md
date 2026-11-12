# Tiến độ hiện hành — 13/11/2026

Repo hiện dùng 10 POI theo danh sách nhóm cập nhật ngày 12/11; năm điểm đã lưu trữ không được khôi phục trong lần đồng bộ audio này.

**47/50 bài Google hợp lệ, còn thiếu 3:** Việt 10/10, Anh 10/10, Nhật 9/10, Hàn 9/10, Trung 9/10. Bổ sung coord-01:vi (Trung tâm Du Khách) và 1:en (Trạm cứu hộ gấu) từ MP3 đã có, khớp text hash. Kiểm tra kích thước và SHA-256 đạt. Giữ nguyên kịch bản, tọa độ, tên và các bản thu hiện có. Không gọi Google thêm.

Các mốc 15 POI/75 bài bên dưới là lịch sử trước khi nhóm thu gọn danh sách; không dùng làm tổng số hiện tại. Thành viên pull rồi chạy npm run content:seed để nhập audio phù hợp nội dung database của mình. Tạo/tải lại gói offline sau khi nhập.

## Lịch sử

# Tiến độ đã kiểm chứng — 10/11/2026

45/75 bài Google hợp lệ, còn thiếu 30: Việt 9, Anh 8, Nhật 10, Hàn 9, Trung 9. Ghép audio khớp transcript giữa hai thư mục (Git từ 29 lên 40), sau đó tạo thêm 5 bản. Giữ nguyên 15 POI, bản dịch và tọa độ.

Quota tạm dừng đến 2026-11-11T15:34:07.484Z (22:34:07 ngày 11/11 Việt Nam), theo worker. Đã giữ một job quota khớp nội dung về QUEUED/PENDING; database có 45 READY và 30 PENDING.

Docker đã phục hồi sau restart Desktop. Phục hồi 30 file storage từ thư mục cũ theo hash để URL audio/ZIP của repo Git hoạt động. Các bản thu hợp lệ đã có được giữ nguyên; gói cuối được dựng từ fixture tương ứng, vì database có thể chọn bản thu hợp lệ khác cùng nội dung.

ZIP: 19,279,970 byte; SHA-256 ae283b8e2d4e847a850e657b662a556ee15c967a5a93ae6bb6feaf7d5926cff9. Kiểm tra CRC, kích thước và SHA-256 đủ 45 MP3 khớp fixture; MP3 repo Git đã giải mã bằng FFmpeg. Gói còn partial=true.

Phiên dịch vụ tạm đã dừng. Chưa commit/push. Tải lại gói ngoại tuyến để nhận audio bổ sung.

## Lịch sử

# Tiến độ hiện tại — danh sách 15 POI, 25/10/2026

**75 bài cần thiết: 5 Google READY, còn thiếu 70.** Việt 2/15, Anh 2/15, Nhật 0/15, Hàn 0/15, Trung 1/15. Chỉ tạo bài cho các điểm trong `scripts/data/active-pois.json`; không khôi phục điểm đã gỡ.

ZIP hiện có 5 MP3, 3.169.777 byte; CRC, kích thước và SHA-256 đã kiểm tra. Fixture có 15 POI, 75 bản dịch, 5 MP3 hợp lệ. 15 bản thuộc điểm đã loại được giữ riêng trong bản sao lưu. Xem [danh sách hiện hành](ACTIVE_POIS.md).

Giữ nguyên thời gian tạm dừng Gemini: **2026-10-26T09:15:12.509Z (16:15:12 ngày 26/10 Việt Nam)**. Chưa gọi Google thêm trong lần chỉnh danh sách. Phiên chạy kiểm tra đã được dừng; lịch sau cần kiểm tra dịch vụ thực tế và chỉ tạo bài thuộc danh sách mới.

## Lịch sử trước khi đổi danh sách (không dùng làm số liệu hiện tại)

# Tiến độ Google AI Studio — 16:17:24 25/10/26 (giờ Việt Nam)

**Cập nhật POI sau lần tạo audio:** đã nhập tài liệu tọa độ mới, tăng lên 23 POI / 115 bản dịch. Vẫn có 20 MP3 Google; hiện thiếu 95 bản (30 bản của sáu POI mới chưa xếp job). Các số 17 POI / 85 bài / thiếu 65 bên dưới là mốc trước lần nhập này. Xem [báo cáo POI](POI_DOCUMENT_IMPORT.md).

Lần chạy theo lịch ngày 25/10 đã khởi động lại các service đang dừng, dùng hàng đợi có sẵn và tạo thêm **4 bản Google**. Hiện có **20/85 MP3 Google hợp lệ**, còn **65 bài**. Không thay giọng thiết bị/eSpeak, không đổi bản dịch hoặc tọa độ.

| Ngôn ngữ | Google READY | Còn thiếu |
|---|---:|---:|
| Việt | 5 | 12 |
| Anh | 5 | 12 |
| Nhật | 3 | 14 |
| Hàn | 3 | 14 |
| Trung | 4 | 13 |
| Tổng | 20 | 65 |

## Quota và hàng đợi

Sau 4 bản mới, worker gặp GEMINI_QUOTA và tự dừng. Thời điểm thử tiếp đang lưu là **16:15:12 26/10/26 giờ Việt Nam**, tương ứng 2026-10-26T09:15:12.509Z. Đây là thời gian tạm dừng do worker ghi, không phải xác nhận thời điểm Google reset. Không gửi yêu cầu thăm dò thêm sau khi gặp quota và không rút ngắn thời gian chờ.

Đã chuyển đúng một job vừa lỗi quota trở lại QUEUED/PENDING, đặt available_at bằng thời điểm trên, giữ liên kết current_job_id và nội dung khớp text hash. Hiện có 65 job chưa hoàn thành: 64 QUEUED và 1 QUEUED với QUOTA_PAUSED; không còn job current FAILED do quota mới. Các bản READY được giữ nguyên.

TTS_LANGUAGES hiện chưa giới hạn (all); chưa có phân công ngôn ngữ cụ thể theo tên. Khi nhóm bắt đầu chia việc, đặt phần việc đã thống nhất rồi khởi động lại backend. Xem [hướng dẫn cùng tạo audio](COLLABORATIVE_AUDIO.md). Không đưa khóa của thành viên lên Git hoặc vào frontend.

## Gói nghe ngoại tuyến và fixture

- web/dist/offline-guide.zip: **20 MP3 Google**, **4.863.545 byte**, partial=true vì thiếu 65 bài.
- Đã kiểm tra CRC ZIP, kích thước và SHA-256 của toàn bộ 20 MP3; các hash trùng đúng những bản trong fixture.
- backend/fixtures/content.json và các MP3 tham chiếu đã cập nhật local lên 20 bản, giữ các bản nhóm đã chia sẻ.
- Kiểm tra trên database tạm: nhập 17 POI, 85 bản dịch, 20 MP3; nhập lặp giữ chỉnh sửa; nhận audio bổ sung khớp transcript; từ chối audio của transcript đã đổi. Tất cả đạt. Database chính không bị reset.

Các gói tải trước đó cần tải lại để có 4 bản mới (Anh, Nhật, Hàn, Trung: mỗi tiếng thêm một bản). Giải nén toàn bộ ZIP rồi mở CatTienGuide/index.html. Không cần build lại APK chỉ để nhận audio từ backend.

## Trạng thái chạy và Git

PostgreSQL và local-tts/FFmpeg đã chạy; web/content/audio/QR được khởi động qua launcher GEMINI, web tại http://127.0.0.1:4173. Phiên launcher được giữ chạy để worker tiếp tục khi hết thời gian chờ. Không khởi động trùng service.

Git main đã push trước đó ở b1dd6e4 có snapshot 16 MP3. **4 MP3 mới và báo cáo lần này chỉ cập nhật local, chưa commit/push**; không tự publish trong lịch. Khi muốn chia sẻ, review fixture và commit theo [hướng dẫn nhóm](TEAM_SETUP.md).

Lịch vẫn kiểm tra mỗi ngày lúc 14:10. Nếu thời điểm kiểm tra sớm hơn thời gian tạm dừng, sẽ giữ chờ và không gọi Google. Các mốc 12/73 và 16/69 trong tài liệu lịch sử là số liệu cũ.
