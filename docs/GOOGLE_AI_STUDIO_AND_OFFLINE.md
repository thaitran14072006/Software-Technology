# Google AI Studio, ngoại tuyến và ngôn ngữ

**Cập nhật 24/10/2026:** hiện có 12 MP3 Google thật, còn 73 bản chờ. Hàng đợi được đặt thử tiếp lúc 14:02 cùng ngày theo thời gian thử lại Google trả. Các số 11/74 và lịch 17:27 bên dưới là kết quả lần kiểm tra 23/10. Xem [tiến độ mới nhất](GEMINI_AUDIO_PROGRESS.md).

Cập nhật ngày 23/10/2026. Báo cáo này thay thế các mô tả cũ về nguồn giọng mặc định trong VOICE_FIX.md và CAT_TIEN_INTEGRATION.md.

## Kết quả hiện tại

Đã tích hợp Gemini TTS của Google AI Studio ở máy chủ, tạo và lưu **11 MP3 Google thật**, gồm Việt 3, Anh 3, Nhật 2, Hàn 1 và Trung 2. Bài Bàu Sấu tiếng Việt dùng đúng kịch bản trong file Word, giọng Kore, dài khoảng 28,68 giây. Mẫu WAV do Google trả về đã được chuyển thành MP3 bằng FFmpeg; file MP3 này được phát và tải ngoại tuyến nguyên byte.

Trong 11 file hiện có, 5 file dùng kịch bản Word mới và 6 file dùng nội dung POI cũ được giữ lại. Đây là số file theo ngôn ngữ, không phải 11 địa điểm đã có đủ giọng. Các file sẵn sàng: Việt — mã 9, 13, 10; Anh — mã 2, 13, 10; Nhật — mã 10, 11; Hàn — mã 10; Trung — mã 8, 10.

**Chưa hoàn tất toàn bộ audio:** còn 74/85 bản của 17 POI đang chờ. Google trả HTTP 429 với thông báo hạn mức miễn phí của model `gemini-3.8-flash-lite-tts` là 10 yêu cầu/ngày và thời gian thử lại khoảng 20 giờ. Đây là hạn mức thực tế của khóa đã thử, không phải cam kết chung cho mọi tài khoản. Không bật billing, không chuyển sang eSpeak để giả là đã tạo đủ.

Hàng đợi được tạm dừng bền vững đến **17:27:38 ngày 24/10/2026, giờ Việt Nam**, lâu hơn thời gian Google yêu cầu để tránh lặp lỗi. Thời điểm này được trả trong `/content-api/configs` và hiển thị trên giao diện với bài chưa có audio. Nếu máy chủ tiếp tục chạy sau thời gian này, worker có thể tiếp tục job; nếu lại hết quota, nó tạm dừng tiếp. Muốn tạo đủ nhanh hơn cần hạn mức phù hợp từ tài khoản Google; chưa thực hiện thay đổi gói dịch vụ.

## Kịch bản Word và dữ liệu

Đã đọc file `Kịch bản TTS - Vườn quốc gia Nam Cát Tiên.docx` và trích đủ 15 đoạn đọc; phần ghi chú không được đưa vào lời đọc. File gốc được giữ nguyên. Đã chuẩn bị bản dịch Anh/Nhật/Hàn/Trung cho cả 15 bài trong `scripts/data/document-*.json`, cùng nguồn Việt ở `scripts/data/tts-document.json`. Các bản dịch do Gemini tạo, cần rà soát tên riêng và nội dung chuyên môn trước khi phát hành chính thức.

Số thứ tự tài liệu khác số POI, vì vậy ghép theo tên:

| Thứ tự tài liệu | POI hệ thống | Tên |
| --- | --- | --- |
| 1 | 9 | Bàu Sấu |
| 2 | 2 | Cây Tung |
| 3 | 7 | Cây Gõ Bác Đồng |
| 4 | 8 | Đa Lộc Giao |
| 5 | 13 | Si Trăm Thân |
| 6 | 15 | Bằng Lăng Đà Cộ |
| 7 | 14 | Thác Trời |
| 8 | 5 | Bến Cự |
| 12 | 1 | Trung tâm cứu hộ |
| 13 | doc-13 | Đảo Tiên — mới, có nguồn tọa độ |
| 14 | doc-14 | Di tích khảo cổ — mới, có nguồn tọa độ |

Đã nhập 11 bài này với đủ 5 ngôn ngữ. Giữ 6 POI cũ không nằm trong tài liệu, nên backend hiện có 17 POI công khai. Bốn bài **Thác Mỏ Vẹt, khu vực xem thú đêm, Bảo tàng Thiên nhiên, làng văn hóa Tà Lài** chưa được tạo thành POI mới vì chưa có tọa độ đủ tin cậy. Nội dung và bản dịch vẫn được giữ trong dữ liệu chuẩn bị, chưa có audio Google cho bốn bài này trong gói hiện tại.

Database và storage đã được sao lưu trước nhập tại `backend/.runtime/backups/2026-10-23T10-14-25-097Z`; bản chụp nội dung trước nhập được lưu riêng trong `.runtime/document-import-*.json`.

## Tọa độ có nguồn

Đã bổ sung `pois.geo_source_url`, trả `geoSourceUrl` qua API. Có 5 điểm được gắn nguồn tọa độ: Bàu Sấu, Gõ Bác Đồng, Bến Cự, Đảo Tiên, di tích khảo cổ. Web Leaflet và mobile MapLibre có thể hiển thị điểm có nguồn này.

**Đối chiếu nguồn bản đồ khác với khảo sát thực địa:** không bật `geoVerified` chỉ vì tìm thấy trên mạng. Tự phát GPS vẫn cần `geoVerified=true`. Các tọa độ ước lượng cũ không được tự đưa lên bản đồ địa lý. Đặc biệt, các ghi chép về cây Tung cách khá xa vị trí sơ đồ cũ, nên chưa thay tọa độ khi chưa khẳng định cùng địa điểm.

Nguồn cụ thể, tọa độ và ghi chú đối chiếu nằm ở `scripts/data/poi-coordinates.json`. Hai nguồn tiêu biểu: [điểm Gõ Bác Đồng trên OpenStreetMap](https://www.openstreetmap.org/node/4746491491) và [tọa độ di tích do Bảo tàng Lâm Đồng công bố](https://tmso.baotanglamdong.com.vn/bo-suu-tap/khao-co-cat-tien/di-tich-quoc-gia-dac-biet-khao-co-cat-tien/).

Bộ xét duyệt tự động đã từ chối phương án nới schema để tạo POI công khai không có tọa độ. Phương án đó không được áp dụng; ràng buộc kinh độ/vĩ độ vẫn giữ nguyên. Các nội dung chưa định vị không bị gán vị trí giả.

## Cách chạy và nghe

Docker Desktop cần đang hoạt động. Từ thư mục dự án:

```powershell
npm run dev:gemini:lan
```

Nếu đã có phiên đang chạy, dừng bằng Ctrl+C trước khi chạy thêm để tránh trùng cổng. Trong lần làm việc này, hệ thống đã được khởi động lại bằng chế độ Gemini; không cần mở phiên thứ hai.

Mở `http://127.0.0.1:4173/?source=api&poi=9` để nghe Bàu Sấu tiếng Việt. Trên điện thoại cùng Wi-Fi, dùng địa chỉ LAN do terminal in ra, hiện là `http://192.168.1.60:4173/?source=api`. **Không dùng `source=demo` để kiểm tra nội dung Google**, vì demo là bộ mẫu riêng.

Nguồn giọng mặc định là **Google AI Studio · MP3 có sẵn**. Nếu bài chưa có audio, giao diện báo chưa sẵn sàng/quota; không tự thay giọng robot. Người dùng vẫn có thể tự chọn nguồn trình duyệt hoặc MP3 khác nếu muốn. Với file Google đã có nhưng tải lỗi, ứng dụng báo lỗi thay vì đọc lại bằng giọng máy.

Khóa chỉ lưu trong `backend/.env`, không đưa vào HTML, ZIP, app mobile, API công khai hoặc README. Khóa người dùng đã gửi trong chat nên cần thay sau thử nghiệm. Cấu hình:

```dotenv
GEMINI_API_KEY=<tự nhập khóa tại máy>
GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts
GEMINI_VOICE_FEMALE=Kore
GEMINI_VOICE_MALE=Charon
```

Không đưa file `.env` lên Git. Provider này khác Google Cloud Text-to-Speech dùng `GOOGLE_TTS_KEY`. Chỉ các model Gemini 3.8 TTS có schema hiện tại được chấp nhận; không tự đổi model khi lỗi quota.

## Tải trước khi vào cổng và nghe ngoại tuyến

Khi mở trang backend lần đầu có audio Google, ứng dụng hiện lời mời **Tải gói thuyết minh**. Có thể tải lại bằng nút **Lưu để dùng ngoại tuyến**.

- **Localhost hoặc HTTPS:** lưu nội dung 5 ngôn ngữ và các MP3 Google đang sẵn sàng vào Cache API. Có kiểm tra kích thước file, giữ nguyên byte audio, lưu metadata provider/voice. Nếu file tải lỗi, giữ gói cũ; không báo hoàn tất giả. Số bài chưa có Google được hiển thị riêng.
- **Điện thoại qua HTTP Wi-Fi:** trình duyệt thường không cho PWA/Service Worker. Nút tải dùng file `offline-guide.zip` thay thế. Giải nén toàn bộ, mở `CatTienGuide/index.html` bằng trình duyệt hỗ trợ file cục bộ. Hoặc nghe từng MP3 bằng trình phát âm thanh. Giữ thư mục audio cạnh index.html. Cách mở HTML tải xuống tùy hệ điều hành; các MP3 không cần mạng để phát.

Gói hiện tại là **gói một phần, 11 MP3**, khoảng 3,8 MB. Có font Noto Sans, trang nghe với 5 ngôn ngữ, và manifest chứa SHA-256 của mỗi MP3. Không có API key hay chức năng gọi Google trong trang ngoại tuyến. Gói ZIP không chứa đủ các bài đang chờ quota và không bao gồm nền OSM để tải hàng loạt.

Sau khi tạo thêm audio, tải lại gói. Để xếp các bản còn thiếu vào hàng đợi khi quota đã mở, dùng `npm run audio:gemini`. Script kiểm tra đúng provider, không ghi đè bản thu âm và dừng nếu API báo đang tạm dừng. Khi tải qua web, endpoint ZIP tự đóng gói lại theo revision nội dung để nhận audio mới. Để xuất file ZIP riêng, chạy `npm run offline:archive` khi backend đang chạy; chỉ cần Node của dự án, không cần Python. Công cụ Python vẫn giữ để đối chiếu độc lập định dạng ZIP.

## Sửa font và đổi ngôn ngữ

- Tự lưu font Noto Sans đầy đủ dấu tại `web/vendor/fonts`, kèm giấy phép; đưa font vào shell ngoại tuyến.
- Thay font hiển thị có vấn đề, bỏ letter-spacing âm ở tiêu đề, dùng Unicode NFC. Đã xem trực tiếp tiêu đề và đoạn Bàu Sấu có dấu.
- Bộ dịch dùng chung gồm 280 bản ghi UI, 5 ngôn ngữ, gồm nhãn tĩnh, hộp kết nối/đăng nhập/quản trị, trạng thái tải, thông báo có số lượng/thời gian, placeholder và tên truy cập.
- Thêm bộ chọn ngôn ngữ ở header, đồng bộ với bộ chọn trong trang Khám phá. Bản dịch POI và script cũng tải theo ngôn ngữ đã chọn.
- Mobile có thêm đầy đủ các danh mục Nhật/Hàn/Trung ngoài nhóm legacy, kiểm tra cùng bộ key với Việt/Anh. Đổi các nhãn Mapbox cũ sang MapLibre.
- Service Worker v7 cập nhật nguyên bộ shell và chỉ dùng cache đúng phiên bản; sửa tình trạng giao diện cũ lẫn module mới khi mất kết nối.

Mobile cũng đã bỏ cơ chế tự chuyển về gói tiếng Việt khi thiếu ngôn ngữ đã chọn, không dùng MP3 hash cũ thay cho bản Google mới, và không đổi sang giọng thiết bị khi audio Google lỗi.

## Kiểm chứng

| Hạng mục | Kết quả |
| --- | --- |
| Google thật | Xác thực key, tạo WAV, chuyển MP3; 11 MP3 đã lưu, không phải fixture |
| Web tests | 33/33 đạt |
| Backend tests | 17/17 đạt, 6 suites |
| API/database | 15 nhóm tích hợp đạt |
| Backend build | 3 dịch vụ build đạt |
| Mobile | TypeScript đạt; 15/15 tests đạt, gồm chặn file giọng cũ thay thế audio Google |
| ZIP | 11 hash/size MP3 khớp manifest; ZIP do Node tạo đã được kiểm tra CRC/giải nén bằng Python độc lập; không có key hoặc URL sinh audio Google |
| Giao diện | Đã kiểm tra đổi ngôn ngữ, hộp kết nối và phát Bàu Sấu; font tiếng Việt rõ dấu |
| Ngoại tuyến thật trên web | Đã dừng máy chủ (ECONNREFUSED), tải lại được 17 POI và phát Bàu Sấu từ MP3 Google trong cache; sau đó khôi phục máy chủ |

Chất lượng bản dịch và phát âm tên riêng cần được nghe, đọc soát thủ công trước khi dùng thực địa. Chưa có APK/device test; tọa độ có nguồn vẫn cần khảo sát nếu muốn tự phát theo GPS. Toàn bộ audio chưa hoàn tất vì hạn mức Google.

## Tài liệu API đã đối chiếu

[Gemini TTS REST](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation) mô tả đầu vào transcript, metadata phong cách và audio trả về. [Bảng giá Gemini](https://ai.google.dev/gemini-api/docs/pricing) có tầng miễn phí và trả phí; hạn mức thực tế vẫn phụ thuộc model/tài khoản. Cấu hình hiện tại không bật thanh toán.
