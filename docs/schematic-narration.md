# Thuyết minh các điểm trên sơ đồ

Bổ sung theo yêu cầu ngày 06/11/2026 cho các số 3, 4, 6, 10, 11 và 12.
Nội dung nằm trong `web/schematic-content.mjs`, gồm tiếng Việt và các bản dịch
Anh, Nhật, Hàn, Trung. Các điểm dùng vị trí trên sơ đồ, không có tọa độ GPS.
Trang khám phá ghép nội dung này vào danh sách khi tải; nội dung có sẵn cùng mã
được ưu tiên giữ nguyên. Danh mục GPS và dữ liệu quản trị không bị thay đổi.
MP3 của các điểm này được build vào trường `schematicPois` của gói dữ liệu.
Trang khám phá chỉ gắn audio khi nội dung và mã băm khớp với bản thuyết minh
hiện tại. Nút nghe sử dụng giọng trình duyệt khi chưa có MP3.

Trình tạo `scripts/generate-demo-gemini-audio.mjs` nhận `--schematic` để đọc
đúng bài của sáu điểm này, kết hợp `--only=3:vi,4:vi,6:vi,10:vi,11:vi,12:vi`.
Đặt `GEMINI_VOICE_VI=Sulafat` trong môi trường của tiến trình khi tạo các bài
tiếng Việt này; không cần đổi giọng của các MP3 đã có ở địa điểm khác.

Nội dung được biên soạn mới, không sao chép lời giới thiệu từ nguồn tham khảo.
Tên và vị trí điểm giữ theo sơ đồ người dùng cung cấp. Không bổ sung tuổi cây,
kích thước, tên khoa học hoặc câu chuyện lịch sử chưa được xác nhận.

Nguồn đối chiếu:

- [Tài liệu giới thiệu hoạt động trải nghiệm của VQG Cát Tiên](https://cattiennationalpark.com.vn/wp-content/uploads/2023/04/230416_bai_trinh_bay_tai_hoi_nghi_Gioi_thieu_hoat_dong_trai_nghiem_cho_hoc_sinh_tai_UBND_Tan_Phu_final.pdf): tên Bằng lăng 5 ngọn.
- [Cẩm nang VQG Cát Tiên](https://cattiennationalpark.com.vn/wp-content/uploads/2023/03/cattien_booklet_vn_compressed.pdf): Bằng lăng lộc bình và các điểm tham quan thực vật.
- [Liên kết vùng để phát triển du lịch — VQG Cát Tiên](https://cattiennationalpark.com.vn/lien-ket-vung-de-phat-trien-du-lich/): Bằng lăng lộc bình và Bằng lăng 6 múi.
- [Hệ sinh thái rừng — VQG Cát Tiên](https://cattiennationalpark.com.vn/he-sinh-thai-rung/): sự hiện diện của đại phong tử trong hệ sinh thái rừng.
