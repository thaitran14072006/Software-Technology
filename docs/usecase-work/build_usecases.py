from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from hashlib import sha256
from lxml import etree as E
from PIL import Image, ImageDraw, ImageFont
import json, math

BASE=Path(__file__).parent
SOURCE=BASE.parent/'templates/UseCases_original.docx'
OUT=BASE.parent/'Smart_Audio_Guide_Focused_UseCases_v1.1.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS={'w':W,'r':R,'a':'http://schemas.openxmlformats.org/drawingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
def q(s):return '{'+W+'}'+s
def case(name,actor,summary,steps,alt,exc,trigger,pre,post,ref,decision,yes,no):
 return dict(name=name,actor=actor,summary=summary,steps=steps,alt=alt,exc=exc,trigger=trigger,pre=pre,post=post,ref=ref,decision=decision,yes=yes,no=no)
U='Khách tham quan (User); Admin có thể dùng như User'
A='Quản trị viên (Admin)'
CASES=[
case('Truy cập hệ thống và chọn ngôn ngữ',U,
'User mở web bằng QR tại cổng hoặc URL, chọn một trong 5 ngôn ngữ; không cần tài khoản.',
[(0,'Mở URL web hoặc quét QR tham gia.'),(1,'Hiển thị trang tham quan và bộ chọn ngôn ngữ.'),(0,'Chọn Việt, Anh, Nhật, Hàn hoặc Trung.'),(1,'Lưu lựa chọn; tải nội dung và đổi giao diện theo ngôn ngữ đã chọn.')],
'A1. Truy cập bằng URL trực tiếp cho kết quả tương tự. A2. Mobile có màn hình bắt đầu riêng; chưa có APK phát hành.',
'E1. Chưa có mạng và chưa tải gói: không mở được lần đầu. E2. QR chứa localhost hoặc IP cũ: dùng URL LAN đang hoạt động.',
'User bắt đầu sử dụng hướng dẫn tham quan.',
'Web/backend đang chạy; QR dùng URL truy cập được từ thiết bị, hoặc đã có gói ngoại tuyến.',
'Trang tham quan dùng ngôn ngữ đã chọn; User không có phiên đăng nhập.',
'UC7; web/app.mjs; web/ui-i18n.mjs; mobile/src/screens/Splash',
'Trang hoặc gói có sẵn?','Chọn ngôn ngữ và xem nội dung','Báo lỗi truy cập; kiểm tra URL hoặc mạng'),
case('Xem bản đồ và tìm tuyến trên sơ đồ',U+'; OpenStreetMap',
'User tìm/lọc POI, đổi giữa sơ đồ và Leaflet/OpenStreetMap trên web. Tuyến tham khảo được tính trên đồ thị sơ đồ.',
[(0,'Mở trang Khám phá; chọn bộ lọc hoặc tìm POI.'),(1,'Đồng bộ danh sách và marker; chỉ đưa POI có tọa độ đã xác thực hoặc có nguồn lên bản đồ địa lý.'),(0,'Chọn POI; bật GPS nếu muốn xem vị trí.'),(1,'Hiển thị chi tiết; cập nhật vị trí khi được cấp quyền.'),(0,'Chọn điểm xuất phát và bấm Chỉ đường.'),(1,'Chuyển về sơ đồ và hiển thị tuyến, khoảng cách/thời gian ước tính nếu có đường nối.')],
'A1. User đổi bản đồ/sơ đồ thủ công. A2. Mobile dùng MapLibre; ngoài đồ thị chỉ có đường thẳng ước lượng, không phải tuyến đi bộ thực tế.',
'E1. Không có đường nối: báo không tìm được tuyến. E2. Từ chối GPS vẫn xem được POI. E3. Mất mạng có thể không tải được nền OSM.',
'User muốn tìm POI hoặc xem tuyến tham khảo.',
'Có dữ liệu POI và sơ đồ; GPS trên web cần localhost hoặc HTTPS và quyền vị trí.',
'POI được chọn; tuyến tham khảo hiển thị khi dữ liệu đồ thị hỗ trợ.',
'web/app.mjs; web/core.mjs; mobile/src/services/api/directions.ts',
'Có tuyến trong đồ thị?','Vẽ tuyến sơ đồ và số liệu ước tính','Báo không có tuyến; vẫn cho xem POI'),
case('Tự động phát thuyết minh theo vị trí',U+'; dịch vụ định vị; BLE trên mobile',
'Khi User bật tự phát và định vị, hệ thống xét vùng POI đã xác thực tọa độ; chỉ phát audio sẵn sàng theo ngôn ngữ hiện tại.',
[(0,'Bật GPS và Tự động phát; giữ ứng dụng hoạt động.'),(1,'Xin quyền và cập nhật vị trí; kiểm tra độ chính xác.'),(0,'Di chuyển vào vùng của POI đã xác thực.'),(1,'Kiểm tra mẫu vị trí liên tiếp, bán kính và thời gian không phát lại.'),(1,'Chọn POI và yêu cầu phát audio đúng ngôn ngữ nếu đáp ứng điều kiện.')],
'A1. Mobile có mã BLE khi GPS yếu và có beacon đã đăng ký; chưa kiểm thử phần cứng. Web không quét BLE. A2. Dùng UC4 hoặc UC6 khi định vị không phù hợp.',
'E1. GPS yếu/thiếu quyền: không bảo đảm tự phát. E2. Trong thời gian chống phát lại: không tự phát lại. E3. Google chưa sẵn sàng: báo chờ, không tự đổi giọng thiết bị. E4. Trình duyệt chặn phát tự động: User bấm Phát.',
'Vị trí thay đổi khi chế độ tự phát đang bật.',
'Có POI geoVerified, quyền vị trí, nội dung ngôn ngữ hiện tại; phát âm thanh chịu chính sách thiết bị.',
'POI được chọn; audio phát khi sẵn sàng và được thiết bị cho phép.',
'UC4; UC6; web/app.mjs; mobile/src/hooks/useAutoPlay.ts',
'Đủ điều kiện và có audio?','Chọn POI và yêu cầu phát thuyết minh','Chờ vị trí hoặc báo thiếu audio; cho nghe thủ công'),
case('Quét QR tại điểm tham quan',U,
'User quét hoặc nhập mã QR POI để mở đúng bài thuyết minh; sử dụng được độc lập hoặc khi GPS không phù hợp.',
[(0,'Mở chức năng QR; chọn quét camera hoặc nhập mã.'),(1,'Xin quyền camera nếu quét trong web và thiết bị hỗ trợ.'),(0,'Quét hoặc dán nội dung QR của POI.'),(1,'Tra token đang hoạt động qua QR API hoặc bảng mã đã lưu.'),(1,'Chọn POI đúng ngôn ngữ và yêu cầu phát audio sẵn sàng.')],
'A1. Nhập token hoặc nội dung mã khi camera không hỗ trợ. A2. QR tham gia dạng URL mở web; QR POI dạng sag://poi/token được xử lý trong ứng dụng, không bảo đảm camera hệ thống mở được.',
'E1. Token lạ, bị tắt hoặc POI không công bố: báo lỗi. E2. HTTP LAN không hỗ trợ camera trong web: nhập mã hoặc dùng camera hệ thống với QR URL. E3. Chưa có audio: báo chờ. E4. Ngoại tuyến chưa lưu bảng QR: không tra được token.',
'User muốn mở nhanh thuyết minh của một POI.',
'Có QR hợp lệ; kết nối backend hoặc đã lưu dữ liệu POI và bảng QR phù hợp.',
'POI đúng mã được mở; chỉ phát khi audio sẵn sàng và thiết bị cho phép.',
'UC6; UC7; web/app.mjs resolveQR; qr.controller.ts',
'Tra được POI hợp lệ?','Mở chi tiết và yêu cầu phát audio','Báo mã không hợp lệ hoặc thiếu dữ liệu'),
case('Quản lý POI và tạo âm thanh TTS',A+'; Google AI Studio Gemini TTS',
'Admin thêm/sửa/xóa mềm POI, quản lý bản dịch và yêu cầu tạo MP3 qua hàng đợi. Nội dung được lưu độc lập với kết quả tạo audio.',
[(0,'Đăng nhập theo UC8; chọn thêm hoặc sửa POI.'),(1,'Hiển thị thông tin POI, tọa độ, trạng thái và bản dịch.'),(0,'Nhập dữ liệu; lưu nội dung và yêu cầu tạo audio.'),(1,'Kiểm tra dữ liệu, lưu PostgreSQL; xếp job TTS khi cấu hình cho phép.'),(1,'Worker gọi Gemini, chuyển kết quả thành MP3 và lưu file; ghi trạng thái, đường dẫn và metadata trong database.'),(0,'Theo dõi job và kiểm tra audio trước khi sử dụng.')],
'A1. Tải MP3 có sẵn cho bản dịch đã lưu (tối đa 20 MB). A2. Chạy chế độ LOCAL để dùng eSpeak khi chủ động lựa chọn. A3. Lưu DRAFT hoặc PUBLISHED theo quyền admin.',
'E1. Thiếu dữ liệu bắt buộc: từ chối lưu và báo lỗi. E2. Quota/timeout: giữ nội dung, ghi lỗi hoặc thời điểm chờ; không cam kết có MP3 ngay. E3. Chưa có khóa/cấu hình Gemini hợp lệ: không tạo được Google audio.',
'Admin cần thay đổi POI hoặc tạo/cập nhật thuyết minh.',
'Phiên ADMIN hợp lệ; database hoạt động. Tạo Google cần khóa phía máy chủ, mạng và quota.',
'POI được lưu; audio có thể đang chờ, sẵn sàng hoặc lỗi; file MP3 nằm trong kho file, metadata ở database.',
'UC8; poi.controller.ts; poi.service.ts; audio-tts-service',
'Dữ liệu nhập hợp lệ?','Lưu POI và xếp job; theo dõi kết quả','Báo dữ liệu sai; giữ form để sửa'),
case('Nghe thuyết minh chủ động',U,
'User chọn POI và bấm Phát theo ngôn ngữ hiện tại, không phụ thuộc GPS hoặc QR.',
[(0,'Chọn POI từ danh sách, sơ đồ hoặc bản đồ.'),(1,'Hiển thị nội dung và trạng thái audio theo ngôn ngữ.'),(0,'Bấm Phát thuyết minh.'),(1,'Ưu tiên MP3 Google sẵn sàng khi chạy Gemini; dùng file đã tải nếu ngoại tuyến.'),(0,'Bấm Dừng hoặc chọn bài khác khi cần.')],
'A1. User chủ động chọn nguồn giọng trình duyệt hoặc MP3 khác trên web; chất lượng và khả năng ngoại tuyến tùy nguồn.',
'E1. Google chưa có file hoặc tải file lỗi: báo rõ, không tự thay bằng giọng máy. E2. Ngoại tuyến chưa tải file đúng bài/ngôn ngữ: không nghe được bản Google.',
'User muốn nghe hoặc dừng một bài thuyết minh.',
'Có nội dung POI; audio tương ứng sẵn sàng trực tuyến hoặc đã tải về.',
'Audio đúng bài/ngôn ngữ được phát hoặc dừng; lỗi được thông báo khi chưa thể phát.',
'UC1; web/app.mjs playAudio; mobile/src/hooks/useAudioPlayer.ts',
'Audio đúng ngôn ngữ sẵn sàng?','Phát MP3; cho phép dừng','Báo chưa sẵn sàng; không tự đổi giọng'),
case('Tải gói và nghe thuyết minh ngoại tuyến',U,
'User tải nội dung và các MP3 Google đã có khi còn mạng; ngoại tuyến phát lại đúng file, giữ nguyên giọng đã tải.',
[(0,'Chọn tải gói ngoại tuyến khi còn kết nối.'),(1,'Đọc nội dung 5 ngôn ngữ; lấy MP3 sẵn sàng và kiểm tra file.'),(1,'Lưu gói PWA trên localhost/HTTPS; HTTP LAN cung cấp ZIP tải về.'),(0,'Nếu tải ZIP: giải nén và mở index.html; nếu PWA: mở lại trang đã lưu.'),(1,'Hiển thị nội dung đã tải và phát đúng MP3 có trong gói.')],
'A1. Gói thiếu một số audio vẫn ghi rõ số đã có và số thiếu. A2. Tải lại sau khi nội dung/audio thay đổi để nhận bản mới.',
'E1. Lần đầu không có mạng: không tải được gói. E2. PWA tải audio lỗi: không thay gói cũ bằng gói lỗi. E3. Bài/ngôn ngữ chưa có trong gói: báo thiếu, không tạo Google TTS ngoại tuyến.',
'User chuẩn bị vào khu vực kết nối yếu hoặc muốn giữ giọng Google khi mất mạng.',
'Đang có mạng để tải; có dung lượng lưu và MP3 đã tạo. ZIP không phải bản đồ OSM ngoại tuyến đầy đủ.',
'Nội dung và MP3 đã tải dùng được ngoại tuyến; không cam kết có mọi bài hoặc mọi ngôn ngữ.',
'UC6; web/store.mjs; web/sw.js; scripts/build-offline-archive.mjs',
'Có file Google tải được?','Lưu gói và phát lại file ngoại tuyến','Báo chưa có gói/audio để tải'),
case('Đăng nhập và đăng xuất quản trị',A,
'Admin đăng nhập bằng email/mật khẩu để mở chức năng quản lý; User tham quan không đăng ký hoặc đăng nhập.',
[(0,'Mở Kết nối và nhập email, mật khẩu admin.'),(1,'Xác thực qua backend và kiểm tra quyền ADMIN.'),(1,'Lưu access/refresh token trong phiên tab, chuyển sang dữ liệu API và mở quản trị.'),(0,'Thực hiện chức năng quản lý hoặc bấm Đăng xuất.'),(1,'Khi đăng xuất: thu hồi refresh token và xóa thông tin phiên trên trình duyệt.')],
'A1. Nhập JWT ADMIN thủ công khi đã có token hợp lệ; không cần làm bước này khi dùng email/mật khẩu. A2. Admin quay về trang tham quan và dùng như User.',
'E1. Sai mật khẩu/tài khoản không hoạt động: từ chối. E2. Token hết hạn hoặc thiếu quyền: yêu cầu xác thực lại hoặc từ chối thao tác quản trị. E3. Backend không chạy: báo lỗi kết nối.',
'Admin cần vào hoặc thoát khu vực quản lý.',
'Có tài khoản ADMIN đã được tạo; backend và database hoạt động.',
'Đăng nhập tạo phiên ADMIN hợp lệ; đăng xuất kết thúc phiên, vẫn cho phép tham quan.',
'UC5; web/admin-tools.mjs; auth.controller.ts; RolesGuard',
'Thông tin và quyền hợp lệ?','Lưu phiên và mở quản trị','Báo lỗi; không cấp quyền quản trị'),
case('Quản lý QR beacon và cấu hình tự phát',A,
'Admin xem QR, bật/tắt mã, tải SVG; đăng ký beacon và cấu hình bán kính cùng thời gian không phát lại.',
[(0,'Đăng nhập; mở công cụ cấu hình và mã tại điểm.'),(1,'Tải danh sách QR, beacon, cấu hình và trạng thái job.'),(0,'Chọn bật/tắt QR hoặc beacon, đăng ký beacon, hoặc sửa cấu hình.'),(1,'Kiểm tra quyền/dữ liệu và lưu thay đổi.'),(0,'Tải SVG QR hoặc kiểm tra lại danh sách đã lưu.')],
'A1. QR tham gia dùng URL web truy cập được qua LAN/HTTPS. A2. Beacon cần thiết bị thật và mobile hỗ trợ; đăng ký không chứng minh đã hoạt động ngoài thực tế.',
'E1. Thiếu quyền hoặc dữ liệu không hợp lệ: từ chối lưu. E2. QR bị tắt không tra được qua API khi trực tuyến; bản offline cũ chỉ cập nhật sau khi tải lại.',
'Admin chuẩn bị hoặc điều chỉnh cách nhận diện POI.',
'UC8 thành công; POI và backend tồn tại; cấu hình áp dụng theo lần tải dữ liệu của client.',
'QR/beacon/cấu hình được lưu; không khẳng định web hỗ trợ BLE.',
'UC3; UC4; web/admin-tools.mjs; admin.controller.ts',
'Có quyền và dữ liệu hợp lệ?','Lưu cấu hình hoặc cập nhật trạng thái mã','Báo lỗi; không thay cấu hình'),
case('Xem thống kê và nhật ký quản trị',A,
'Admin xem lượt hiện diện/nghe, dữ liệu vị trí đã được khách đồng ý chia sẻ, trạng thái TTS và nhật ký để theo dõi hệ thống.',
[(0,'Đăng nhập và mở thống kê/công cụ quản trị.'),(1,'Tải thống kê, job và nhật ký theo API tương ứng.'),(0,'Chọn xem vùng có lượt ghé hoặc các bản ghi gần đây.'),(1,'Hiển thị số liệu và heatmap tổng hợp khi có mẫu vị trí đã được chia sẻ.')],
'A1. Khi chưa có dữ liệu, hiển thị danh sách rỗng hoặc thông báo chưa có mẫu.',
'E1. Không có quyền ADMIN: từ chối truy cập. E2. Lỗi mạng/backend: báo lỗi tải. E3. Khách không đồng ý chia sẻ vị trí: không có mẫu vị trí của khách đó để hiển thị.',
'Admin muốn theo dõi sử dụng và kiểm tra lỗi vận hành.',
'UC8 thành công; chỉ có thể thống kê các sự kiện đã được hệ thống ghi nhận.',
'Admin xem dữ liệu hiện có; số liệu không đại diện đầy đủ cho mọi khách ngoài thực tế.',
'analytics.controller.ts; tracking.controller.ts; web/admin-tools.mjs',
'Tải dữ liệu thành công?','Hiển thị số liệu hoặc trạng thái rỗng','Báo lỗi kết nối hoặc quyền truy cập'),
]

# Compact references keep the source's short Reference row; detailed code evidence is in the review.
REFS=['UC7; app.mjs; ui-i18n.mjs','core.mjs; directions.ts','UC4; UC6; useAutoPlay.ts','UC6; UC7; resolveQR','UC8; poi.service.ts; JobWorker','UC1; useAudioPlayer.ts','UC6; store.mjs; sw.js','UC5; auth.controller.ts','UC3; UC4; admin-tools.mjs','analytics.controller.ts; admin-tools.mjs']
for c,r in zip(CASES,REFS):c['ref']=r
CASES[4]['steps']=[(0,'Đăng nhập UC8; chọn thêm/sửa POI.'),(1,'Hiển thị POI, tọa độ, trạng thái và bản dịch.'),(0,'Nhập dữ liệu; lưu và yêu cầu tạo audio.'),(1,'Kiểm tra; lưu PostgreSQL và xếp job TTS.'),(1,'Worker tạo MP3; lưu file và metadata trạng thái.'),(0,'Theo dõi job; kiểm tra bản thu trước khi dùng.')]
CASES[4]['summary']='Admin quản lý POI, bản dịch và yêu cầu tạo MP3 qua hàng đợi. Nội dung được lưu trước khi có kết quả audio.'
CASES[4]['post']='POI đã lưu; MP3 nằm trong kho file, metadata ở database. Audio có thể đang chờ, sẵn sàng hoặc lỗi.'
CASES[4]['exc']='E1. Thiếu dữ liệu: từ chối lưu. E2. Quota/timeout: giữ nội dung, ghi lỗi hoặc thời điểm chờ. E3. Thiếu khóa/cấu hình Gemini: không tạo được Google audio.'
FLOWS=[
 ['Actor: Mở URL hoặc quét QR tham gia.','System: Kiểm tra truy cập web hoặc gói đã tải.'],
 ['Actor: Tìm, lọc và chọn POI.','System: Đồng bộ danh sách và marker.','Actor: Chọn điểm xuất phát; bấm Chỉ đường.','System: Tra đồ thị tuyến sơ đồ.'],
 ['Actor: Bật GPS và Tự động phát.','System: Xin quyền; kiểm tra độ chính xác.','Actor: Di chuyển gần POI.','System: Xét tọa độ xác thực, bán kính và thời gian không phát lại.'],
 ['Actor: Mở QR; quét hoặc nhập mã.','System: Tra token qua API hoặc bảng mã đã lưu.'],
 ['Actor: Đăng nhập UC8; mở form POI.','System: Hiển thị dữ liệu và các bản dịch.','Actor: Nhập dữ liệu; yêu cầu lưu và tạo audio.','System: Kiểm tra thông tin bắt buộc.'],
 ['Actor: Chọn POI và ngôn ngữ.','System: Hiển thị nội dung bài thuyết minh.','Actor: Bấm Phát.','System: Kiểm tra MP3 đúng bài và ngôn ngữ.'],
 ['Actor: Chọn tải ngoại tuyến khi có mạng.','System: Kiểm tra nội dung và các MP3 sẵn sàng.'],
 ['Actor: Mở Kết nối; nhập email và mật khẩu.','System: Xác thực tài khoản và quyền ADMIN.'],
 ['Actor: Đăng nhập; mở công cụ cấu hình.','System: Tải QR, beacon và cấu hình.','Actor: Chọn chỉnh sửa và gửi yêu cầu.','System: Kiểm tra quyền và dữ liệu.'],
 ['Actor: Đăng nhập; mở thống kê.','System: Tải sự kiện, job, nhật ký hoặc vùng có lượt ghé.'],
]

def font(n):return ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def wrap(draw,text,f,width):
 lines=[]
 for part in text.split('\n'):
  line=''
  for word in part.split():
   test=(line+' '+word).strip()
   if draw.textlength(test,font=f)>width and line:lines.append(line);line=word
   else:line=test
  lines.append(line)
 return lines
def text(draw,box,s,size=27):
 f=font(size); lines=wrap(draw,s,f,box[2]-box[0]-20); h=size*1.25
 y=(box[1]+box[3]-len(lines)*h)/2
 for l in lines:
  draw.text(((box[0]+box[2]-draw.textlength(l,font=f))/2,y),l,font=f,fill='black');y+=h
def arrow(d,a,b):
 d.line([a,b],fill='black',width=3); ang=math.atan2(b[1]-a[1],b[0]-a[0]);d.polygon([b,(b[0]-13*math.cos(ang-.45),b[1]-13*math.sin(ang-.45)),(b[0]-13*math.cos(ang+.45),b[1]-13*math.sin(ang+.45))],fill='black')
def diagram(c,i,activity=False):
 if not activity:
  im=Image.new('RGB',(1400,370),'white');d=ImageDraw.Draw(im)
  d.rectangle((300,10,1130,355),outline='black',width=3);text(d,(310,15,1120,70),'Smart Audio Guide System',29)
  d.ellipse((350,105,1090,270),outline='black',width=3);text(d,(375,120,1065,255),f'UC{i}  '+c['name'],30)
  d.ellipse((135,100,175,140),outline='black',width=3);d.line([(155,140),(155,250),(100,200),(210,200)],fill='black',width=3);d.line([(155,250),(110,310)],fill='black',width=3);d.line([(155,250),(200,310)],fill='black',width=3)
  d.line([(210,200),(350,200)],fill='black',width=3);text(d,(10,315,290,365),'Admin' if i in (5,8,9,10) else 'User / Admin',27)
  service={2:'OpenStreetMap',3:'Định vị / BLE\nBLE chỉ mobile',5:'Gemini TTS'}.get(i)
  if service:
   d.rectangle((1170,135,1390,245),outline='black',width=2);text(d,(1175,140,1385,240),service,24);d.line([(1090,190),(1170,190)],fill='black',width=2)
 else:
  im=Image.new('RGB',(1050,1450),'white');d=ImageDraw.Draw(im)
  d.rectangle((10,10,1040,1440),outline='black',width=2);d.line([(10,90),(1040,90)],fill='black',width=2);text(d,(10,10,1040,90),f'UC{i}  Activity Diagram',32)
  d.ellipse((500,110,530,140),fill='black');last=(515,140)
  # Main actions followed by explicit decision and two terminal paths.
  for k,s in enumerate(FLOWS[i-1]):
   y=175+k*155;box=(105,y,925,y+120);arrow(d,last,(515,y));d.rounded_rectangle(box,18,fill='#fffbd5',outline='black',width=2);text(d,box,s,25);last=(515,y+120)
  y=850;arrow(d,last,(515,y));d.polygon([(515,y),(750,y+100),(515,y+200),(280,y+100)],fill='#fffbd5',outline='black',width=2);text(d,(330,y+40,700,y+160),c['decision'],25)
  arrow(d,(280,y+100),(195,1100));arrow(d,(750,y+100),(845,1100));text(d,(45,1010,230,1070),'Không',25);text(d,(790,1010,1000,1070),'Có',25)
  for box,s,x in [((30,1100,490,1320),c['no'],260),((560,1100,1020,1320),c['yes'],790)]:
   d.rounded_rectangle(box,18,fill='#fffbd5',outline='black',width=2);text(d,box,s,26);arrow(d,(x,1320),(x,1370));d.ellipse((x-16,1370,x+16,1402),outline='black',width=3);d.ellipse((x-9,1377,x+9,1395),fill='black')
 b=BASE/f'uc{i}-{"activity" if activity else "usecase"}.jpg'
 im.save(b,quality=95);return b.read_bytes()

with ZipFile(SOURCE) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml']);body=doc.find('w:body',NS);tables=body.findall('w:tbl',NS);template=deepcopy(tables[1]); rows=template.findall('w:tr',NS)
def setcell(cell,value):
 p=deepcopy(cell.find('w:p',NS));props=deepcopy(p.find('w:pPr',NS));rp=p.find('w:r/w:rPr',NS);rp=deepcopy(rp) if rp is not None else None
 for ch in list(cell):
  if ch.tag!=q('tcPr'):cell.remove(ch)
 p=E.SubElement(cell,q('p'))
 if props is not None:p.append(props)
 for j,line in enumerate(str(value).split('\n')):
  r=E.SubElement(p,q('r'))
  if rp is not None:r.append(deepcopy(rp))
  if j:E.SubElement(r,q('br'))
  E.SubElement(r,q('t')).text=line
def newrow(template_row,values):
 tr=deepcopy(template_row)
 for c,v in zip(tr.findall('w:tc',NS),values):setcell(c,v)
 return tr
rels=E.fromstring(parts['word/_rels/document.xml.rels']);relNS='http://schemas.openxmlformats.org/package/2006/relationships'
def pic(row,data,name,w,h,i):
 r=deepcopy(row);cells=r.findall('w:tc',NS);c=cells[-1]
 # Source activity image is an empty inline placeholder; clone complete use-case drawing.
 drawing=deepcopy(rows[0].find('.//w:drawing',NS));
 for p in list(c.findall('w:p',NS)):c.remove(p)
 p=E.SubElement(c,q('p'));pp=E.SubElement(p,q('pPr'));E.SubElement(pp,q('jc')).set(q('val'),'center');rr=E.SubElement(p,q('r'));rr.append(drawing)
 rid=f'rIdUC{i}{"A" if h>w else "U"}';E.SubElement(rels,'{'+relNS+'}Relationship',Id=rid,Type=R+'/image',Target='media/'+name)
 drawing.find('.//a:blip',NS).set('{'+R+'}embed',rid)
 for ext in drawing.findall('.//wp:extent',NS)+drawing.findall('.//a:ext',NS):ext.set('cx',str(w));ext.set('cy',str(h))
 pr=drawing.find('.//wp:docPr',NS);pr.set('id',str(500+i*2+(1 if h>w else 0)));pr.set('name',name);pr.set('descr',f'UC{i} diagram')
 parts['word/media/'+name]=data
 return r

# Keep source sections, styles, table grid, merged cells, header/footer and package parts.
start=list(body).index(tables[1]);sect=deepcopy(body.find('w:sectPr',NS))
for el in list(body)[start:]:body.remove(el)
for i,c in enumerate(CASES,1):
 t=deepcopy(template)
 for r in t.findall('w:tr',NS):t.remove(r)
 t.append(pic(rows[0],diagram(c,i),f'uc{i}-usecase.jpg',5300000,1400714,i))
 for row,val in zip(rows[1:6],[f'UC{i}',c['name'],c['actor'],'Focused',c['summary']]):t.append(newrow(row,[ ''.join(row.findall('w:tc',NS)[0].xpath('.//w:t/text()',namespaces=NS)),val]))
 t.append(deepcopy(rows[6]))
 for j,(actor,s) in enumerate(c['steps']):
  tr=deepcopy(rows[7 if actor==0 else 8]); cells=tr.findall('w:tc',NS)
  if j>0:
   for old in cells[0].findall('w:p',NS):cells[0].remove(old)
   E.SubElement(cells[0],q('p'))
   merge=cells[0].find('w:tcPr/w:vMerge',NS)
   if merge is not None:merge.attrib.clear()
  setcell(cells[1],f'{j+1}. {s}' if actor==0 else '');setcell(cells[2],f'{j+1}. {s}' if actor==1 else '')
  t.append(tr)
 values=[c['alt'],c['exc'],'None',c['trigger'],'Có thiết bị hỗ trợ chức năng và dữ liệu tương ứng.',c['pre'],c['post'],c['ref'],'Hệ thống BA','23-10-2026']
 for row,val in zip(rows[13:23],values):
  label=''.join(row.findall('w:tc',NS)[0].xpath('.//w:t/text()',namespaces=NS));t.append(newrow(row,[label,val]))
 t.append(pic(rows[23],diagram(c,i,True),f'uc{i}-activity.jpg',3900000,5385714,i))
 # IDs are unique in cloned headings; source TOC bookmark names must not repeat.
 for bm in t.findall('.//w:bookmarkStart',NS)+t.findall('.//w:bookmarkEnd',NS):bm.getparent().remove(bm)
 body.append(t)
 sep=E.SubElement(body,q('p'))
 if i<len(CASES):E.SubElement(E.SubElement(sep,q('r')),q('br')).set(q('type'),'page')
body.append(sect)
for textnode in doc.findall('.//w:t',NS):
 if textnode.text=='Version 1.0':textnode.text='Version 1.1'
# Revision history uses a pre-existing blank row.
hist=tables[0]; blank=hist.findall('w:tr',NS)[2]
for cell,value in zip(blank.findall('w:tc',NS),['23-10-2026','1.1','Cập nhật UC1–UC5; bổ sung UC6–UC10 theo hệ thống hiện tại.','Hệ thống BA']):setcell(cell,value)
# Replace cached TOC entries while keeping its content control and field.
sdt=body.find('w:sdt',NS);content=sdt.find('w:sdtContent',NS)
tocp=deepcopy(content.find('w:p',NS))
for p in list(content):content.remove(p)
for i,c in enumerate(CASES,1):
 p=deepcopy(tocp)
 for ch in list(p):
  if ch.tag!=q('pPr'):p.remove(ch)
 pp=p.find('w:pPr',NS)
 if pp is None:pp=E.SubElement(p,q('pPr'))
 tabs=pp.find('w:tabs',NS)
 if tabs is None:tabs=E.SubElement(pp,q('tabs'))
 for old in list(tabs):tabs.remove(old)
 E.SubElement(tabs,q('tab'),{q('val'):'right',q('pos'):'9360'})
 r=E.SubElement(p,q('r'));E.SubElement(r,q('t')).text=f'UC{i}   {c["name"]}'
 E.SubElement(r,q('tab'));E.SubElement(r,q('t')).text=str(2*i+2)
 content.append(p)
for name in list(parts):
 if name.startswith('word/header') and name.endswith('.xml'):
  r=E.fromstring(parts[name])
  for txt in r.findall('.//w:t',NS):
   if txt.text and '1.0' in txt.text:txt.text=txt.text.replace('1.0','1.1')
   elif txt.text and '21-10-2026' in txt.text:txt.text=txt.text.replace('21-10-2026','23-10-2026')
  parts[name]=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
parts['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
parts['word/_rels/document.xml.rels']=E.tostring(rels,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(OUT,'w',ZIP_DEFLATED) as z:
 for name,data in parts.items():z.writestr(name,data)
print(OUT)
(BASE/'cases.json').write_text(json.dumps(CASES,ensure_ascii=False,indent=2),encoding='utf8')
