"""Editable draw.io activity diagrams using the supplied UC1 visual vocabulary."""
from pathlib import Path
from copy import deepcopy
from lxml import etree as E
from PIL import ImageFont
from zipfile import ZipFile,ZIP_DEFLATED
import json,re,html,math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'activity-diagrams'
OUT.mkdir(parents=True,exist_ok=True)
TEMPLATE=ROOT/'docs/templates/UC1_Act.drawio'
CASES=json.loads((ROOT/'docs/usecase-work/cases.json').read_text(encoding='utf8'))
source=E.parse(str(TEMPLATE));styles={n.get('id'):n.get('style') for n in source.findall('.//mxCell')}
FONT=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
W=390; GAP=75
def A(s,ref=None,key=None):return {'kind':'action','text':(ref+'. ' if ref and ref not in s else '')+s,'ref':ref,'key':key}
def B(n):return {'kind':'basic','n':n}
def M(key):return {'kind':'junction','text':'','key':key}
def End(s='Kết thúc'):return {'kind':'end','text':s}
def Jump(key,s):return {'kind':'jump','key':key,'text':s}
def C(s,*branches):return {'kind':'choice','text':s,'branches':[(label,flow) for label,flow in branches]}
def Fail(s):return [A(s),End('Kết thúc nhánh lỗi')]

S=[]
# UC1: QR URL and direct access share network/cache validation.
S.append([
C('Cách truy cập?',('QR tại cổng',[A('User quét QR tham gia bằng camera điện thoại.','B1')]),('URL trực tiếp',[A('A1. User mở trực tiếp URL web.','A1')])),
C('URL đúng máy chủ và cổng của hệ thống?',('Có',[A('Hệ thống dùng địa chỉ web hợp lệ.')]),('Không',Fail('E2. QR chứa localhost/IP cũ: thông báo kiểm tra và thay bằng URL LAN đang hoạt động.'))),
C('Có kết nối để tải trang và dữ liệu?',('Có',[A('Hệ thống tải web và nội dung từ máy chủ.')]),('Không',[C('Đã có gói ngoại tuyến?',('Có',[A('Mở trang/gói đã tải theo UC7.')]),('Không',Fail('E1. Chưa có mạng và chưa tải gói: không mở được lần đầu.')))])),
C('Nền tảng sử dụng?',('Web',[B(2)]),('Mobile',[A('A2. Mở màn hình bắt đầu của mobile; chưa có APK phát hành.','A2')])),
B(3),B(4),A('Hiển thị trang tham quan đúng ngôn ngữ; khách không cần tài khoản.'),End()])

S.append([B(1),B(2),
C('Chọn kiểu bản đồ?',('Sơ đồ',[A('A1. Hiển thị sơ đồ; đồng bộ tìm kiếm, bộ lọc và POI.','A1')]),('Địa lý',[C('Nền OSM tải được?',('Có',[A('Web: Leaflet/OpenStreetMap. Mobile: MapLibre. Chỉ hiển thị marker có tọa độ hợp lệ hoặc có nguồn.','A2')]),('Không',[A('E3. Mất mạng: thông báo nền OSM chưa tải được; vẫn cho dùng sơ đồ/dữ liệu đã có.','E3')]))])),
B(3),C('User muốn bật GPS?',('Có',[C('Có quyền và lấy được vị trí?',('Có',[A('Cập nhật marker vị trí; web cần localhost/HTTPS.')]),('Không',[A('E2. Không lấy được GPS hoặc bị từ chối quyền: thông báo; vẫn xem và chọn POI.','E2')]))]),('Không',[A('Tiếp tục xem POI mà không định vị.')])),B(4),B(5),
C('Tìm tuyến theo nền tảng?',('Web / sơ đồ',[C('Có đường nối trong đồ thị?',('Có',[B(6)]),('Không',[A('E1. Báo không tìm được tuyến; vẫn hiển thị POI.','E1')]))]),('Mobile ngoài sơ đồ',[A('A2. Chỉ vẽ đường thẳng ước lượng khi dữ liệu cho phép; không phải tuyến đi bộ thực tế.','A2')])),End()])

S.append([B(1),B(2),
C('Có quyền định vị và ứng dụng hoạt động?',('Có',[A('Định vị đã sẵn sàng.')]),('Không',[A('E1. GPS thiếu quyền/không khả dụng: thông báo; dùng QR UC4 hoặc chọn bài UC6.','E1'),End('Kết thúc; có thể thử lại sau')])),
M('gps_check'),A('Theo dõi các lần cập nhật vị trí.'),
C('GPS đủ chính xác và còn mới?',('Có',[B(3),A('Chỉ xét POI geoVerified; kiểm tra mẫu vị trí liên tiếp và bán kính cấu hình.'),C('Đã vào vùng POI hợp lệ?',('Có',[A('Tiếp tục kiểm tra chống phát lại.')]),('Không',[Jump('gps_check','Chờ lần cập nhật vị trí tiếp theo.')]))]),('Không',[A('E1. GPS yếu/mất tín hiệu.','E1'),C('Đang dùng mobile có beacon đăng ký và quyền BLE?',('Có',[A('A1. Quét BLE; chỉ là mã mobile, chưa kiểm thử phần cứng.','A1'),C('Nhận diện được beacon của POI?',('Có',[A('Chọn POI tương ứng beacon.')]),('Không',[A('Gợi ý QR UC4 hoặc nghe chủ động UC6.','A2'),Jump('gps_check','Chờ tín hiệu hoặc thao tác tiếp theo.')]))]),('Không',[A('A2. Web không quét BLE. Gợi ý QR UC4 hoặc nghe chủ động UC6.','A2'),Jump('gps_check','Chờ vị trí hoặc thao tác tiếp theo.')]))])),
A('B4. System: Với GPS kiểm tra mẫu vị trí/bán kính; cả GPS và BLE kiểm tra thời gian không phát lại.','B4'),C('Còn trong thời gian không phát lại?',('Có',[A('E2. Không tự phát lại; có thể hiển thị thông tin POI.','E2'),Jump('gps_check','Tiếp tục theo dõi vị trí.')]),('Không',[A('Cho phép yêu cầu phát bài mới.')])),
C('Audio đúng ngôn ngữ sẵn sàng?',('Có',[B(5)]),('Không',[A('E3. Báo Google chưa sẵn sàng; không tự chuyển sang giọng máy.','E3'),Jump('gps_check','Tiếp tục theo dõi; User có thể dùng UC6.')])),
C('Thiết bị cho phép phát tự động?',('Có',[A('Phát audio; ghi nhận thời điểm chống phát lại.')]),('Không',[A('E4. Trình duyệt chặn tự phát: User bấm Phát theo UC6.','E4')])),
C('User tiếp tục bật tự phát?',('Có',[Jump('gps_check','Theo dõi lần di chuyển tiếp theo.')]),('Không',[End('Kết thúc chế độ tự phát')]))])

S.append([B(1),C('Cách nhập mã?',('Camera trong web/app',[B(2),C('Camera được hỗ trợ và được cấp quyền?',('Có',[B(3)]),('Không',[A('E2. Từ chối quyền/HTTP LAN/trình duyệt thiếu hỗ trợ: thông báo và cho nhập mã.','E2'),A('A1. User nhập hoặc dán nội dung QR.','A1')]))]),('Nhập / dán',[A('A1. User nhập token hoặc toàn bộ nội dung mã.','A1')])),
C('Loại nội dung QR?',('URL tham gia',[A('A2. Mở URL web bằng UC1; camera hệ thống có thể mở QR URL.','A2'),End('Chuyển UC1')]),('Mã POI sag://poi/token',[A('A2. Ứng dụng đọc token; không mặc định camera hệ thống mở được sag://.','A2')])),
C('Tra cứu trực tuyến được?',('Có',[B(4)]),('Không',[C('Đã lưu bảng QR và dữ liệu POI?',('Có',[A('Tra token trong bảng QR đã tải theo UC7.')]),('Không',Fail('E4. Ngoại tuyến chưa lưu bảng QR hoặc POI: báo thiếu dữ liệu.')))])),
C('Token hoạt động và POI đã công bố?',('Có',[A('Chọn POI ứng với mã và ngôn ngữ hiện tại.')]),('Không',Fail('E1. Mã lạ/bị tắt/POI không công bố: báo mã không hợp lệ.'))),
C('Audio sẵn sàng và thiết bị cho phép phát?',('Có',[B(5)]),('Không',[A('E3. Báo audio chưa sẵn sàng; nếu bị chặn phát, cho bấm Phát theo UC6.','E3')])),End()])

S.append([B(1),B(2),B(3),C('Quyền và dữ liệu bắt buộc hợp lệ?',('Có',[A('Lưu POI/bản dịch vào PostgreSQL; giữ DRAFT hoặc PUBLISHED theo lựa chọn.','A3',key='poi_saved')]),('Không',Fail('E1. Từ chối lưu; giữ form và báo trường cần sửa.'))),
C('Nguồn audio được chọn?',('Chỉ lưu nội dung',[A('A3. Giữ POI đã lưu; không bắt buộc phải tạo audio ngay.','A3'),End()]),('Upload MP3',[A('A1. Admin chọn bản dịch đã lưu và MP3 có sẵn, tối đa 20 MB.','A1'),C('File upload hợp lệ?',('Có',[A('Lưu file MP3 và metadata; gắn với bản dịch.')]),('Không',Fail('Báo file không hợp lệ; giữ nội dung POI.'))),End()]),('Tạo TTS',[C('Chế độ TTS?',('GEMINI',[C('Có khóa, mạng và cấu hình hợp lệ?',('Có',[C('Quota đang cho phép?',('Có',[A('Sẵn sàng nhận job Gemini.')]),('Không',[A('E2. Giữ nội dung; ghi thời điểm chờ quota, không cam kết có MP3 ngay.','E2'),End('Kết thúc yêu cầu hiện tại; chờ quota')]))]),('Không',Fail('E3. Thiếu khóa/cấu hình hoặc không gọi được Gemini: báo lỗi, giữ nội dung.')))]),('LOCAL',[A('A2. Chỉ dùng eSpeak khi chủ động chạy chế độ LOCAL.','A2')])),B(4),A('Job chạy bất đồng bộ; Admin theo dõi trạng thái.'),
C('Kết quả job TTS?',('Thành công',[B(5),B(6)]),('Quota / timeout / lỗi',[A('E2. Giữ nội dung; ghi trạng thái lỗi hoặc chờ; cho kiểm tra và thử lại khi phù hợp.','E2')])),End()]))])

S.append([B(1),B(2),B(3),C('Nguồn giọng được chọn?',('Tự động / Google',[C('Có MP3 Google đúng bài và ngôn ngữ?',('Có',[B(4)]),('Không',Fail('E1. Google chưa có file: thông báo, không tự đổi giọng máy.'))),C('Đọc được file trực tuyến hoặc file đã tải?',('Có',[A('Phát đúng file MP3.')]),('Không',Fail('E1/E2. File lỗi hoặc ngoại tuyến chưa tải bài/ngôn ngữ: báo không thể phát; không tự thay nguồn.')))]),('Nguồn khác do User chọn',[A('A1. User chủ động chọn MP3 khác hoặc giọng trình duyệt trên web.','A1'),A('Phát theo lựa chọn; chất lượng và ngoại tuyến tùy nguồn.')])),
B(5),C('User chọn bài khác?',('Có',[A('Dừng bài hiện tại; chọn bài/ngôn ngữ mới theo UC6.','B5'),End('Kết thúc bài hiện tại')]),('Không',[End('Đã dừng hoặc nghe xong')]))])

S.append([B(1),C('Đang có mạng để tải gói?',('Có',[B(2)]),('Không',Fail('E1. Không tải được gói lần đầu khi chưa có mạng.'))),
C('Có MP3 sẵn sàng để tải?',('Có',[A('A1. Đếm audio đã có và còn thiếu; gói có thể chưa đủ mọi bài/ngôn ngữ.','A1')]),('Không',Fail('Báo chưa có audio Google để tải; không giả báo gói đầy đủ.'))),
C('Cách lưu trên web?',('localhost / HTTPS PWA',[A('Tải và kiểm tra MIME/kích thước từng file.'),C('Tải audio thành công?',('Có',[A('Lưu dữ liệu và MP3 vào cache PWA.')]),('Không',Fail('E2. Báo lỗi tải; không thay gói cũ bằng gói lỗi.')))]),('HTTP LAN / ZIP',[A('Tải gói ZIP chứa nội dung và MP3 đã có.'),A('User lưu ZIP; giải nén trước khi sử dụng.')])),B(3),B(4),
C('Bài/ngôn ngữ đã có trong gói?',('Có',[B(5)]),('Không',[A('E3. Báo thiếu bài/ngôn ngữ; không tạo Google TTS khi ngoại tuyến.','E3')])),
C('Muốn nhận nội dung/audio mới?',('Có',[A('A2. Kết nối mạng trở lại và tải lại gói; quay về đầu UC7.','A2'),End('Chờ tải bản mới')]),('Không',[End('Tiếp tục dùng dữ liệu và MP3 đã tải')]))])

S.append([C('Cách xác thực admin?',('Email và mật khẩu',[B(1),C('Backend kết nối được?',('Có',[B(2)]),('Không',Fail('E3. Backend không chạy hoặc lỗi kết nối: thông báo không đăng nhập được.'))),C('Tài khoản/mật khẩu hợp lệ và đang hoạt động?',('Có',[A('Kiểm tra quyền ADMIN.')]),('Không',Fail('E1. Từ chối đăng nhập; không cấp phiên quản trị.')))]),('JWT có sẵn',[A('A1. Admin dán JWT ADMIN hợp lệ; không cần nhập token khi dùng email/mật khẩu.','A1')])),
C('Token còn hạn và có quyền ADMIN?',('Có',[A('B3. System: Lưu token có được trong phiên tab; chuyển sang dữ liệu API và mở quản trị.','B3'),A('Luồng email/mật khẩu có access + refresh token. JWT nhập thủ công chỉ lưu token được cung cấp.','A1')]),('Không',Fail('E2. Token hết hạn/thiếu quyền: yêu cầu xác thực lại hoặc từ chối.'))),
B(4),C('Admin chọn thao tác?',('Quản lý',[A('Gọi UC5/UC9/UC10; các API tiếp tục kiểm tra quyền.'),C('Phiên vẫn hợp lệ?',('Có',[A('Thực hiện chức năng quản trị.')]),('Không',[A('E2. Yêu cầu đăng nhập lại; không thực hiện thao tác thiếu quyền.','E2')])),End('Kết thúc thao tác quản trị')]),('Trang tham quan',[A('A2. Admin dùng các chức năng tham quan như User; khách không cần đăng nhập.','A2'),End()]),('Đăng xuất',[B(5),A('Chuyển về tham quan; không còn phiên quản trị trong tab.'),End()]))])

S.append([B(1),C('Có phiên ADMIN?',('Có',[B(2)]),('Không',Fail('E1. Thiếu quyền: từ chối truy cập/lưu.'))),
B(3),C('Loại thao tác?',('QR',[A('Chọn mã POI hoặc QR tham gia.','A1'),C('Thao tác QR?',('Tải SVG',[A('B5. Tải SVG QR; mã tham gia phải dùng URL LAN/HTTPS truy cập được.','B5'),End('Đã tải SVG')]),('Bật / tắt',[A('Chuẩn bị trạng thái mới cho QR.')]))]),('Beacon',[A('A2. Đăng ký UUID/major/minor gắn POI hoặc bật/tắt beacon.','A2'),A('Lưu ý: mobile cần beacon thật; web không quét BLE; chưa nghiệm thu phần cứng.')]),('Cấu hình tự phát',[A('Nhập bán kính và thời gian không phát lại.')])),
C('Quyền và dữ liệu hợp lệ?',('Có',[B(4)]),('Không',Fail('E1. Từ chối lưu; không thay đổi cấu hình.'))),
C('QR vừa được tắt?',('Có',[A('E2. QR tắt bị từ chối qua API trực tuyến; bảng offline cũ chỉ thay đổi khi tải lại.','E2')]),('Không',[A('Giữ trạng thái QR hiện tại.')])),B(5),A('Kiểm tra lại danh sách; cấu hình được client nhận khi tải dữ liệu.'),End()])

S.append([B(1),C('Có quyền ADMIN?',('Có',[B(2)]),('Không',Fail('E1. Từ chối truy cập thống kê/nhật ký.'))),
C('Tải API thành công?',('Có',[B(3)]),('Không',Fail('E2. Lỗi mạng/backend: thông báo không tải được dữ liệu.'))),
C('Loại thông tin cần xem?',('Thống kê / job / nhật ký',[A('Tổng hợp sự kiện hiện diện/nghe, trạng thái TTS và nhật ký đã ghi nhận.')]),('Heatmap vị trí',[C('Có mẫu vị trí được đồng ý chia sẻ?',('Có',[A('Tổng hợp các mẫu vị trí được phép sử dụng.')]),('Không',[A('E3. Khách không đồng ý chia sẻ: không có mẫu của khách đó để hiển thị.','E3')]))])),
C('Có dữ liệu tương ứng?',('Có',[B(4)]),('Không',[A('A1. Hiển thị danh sách rỗng hoặc thông báo chưa có mẫu.','A1')])),
A('Chỉ phản ánh dữ liệu đã ghi nhận; không đại diện mọi khách ngoài thực tế.'),End()])

def wrap(s,width=360):
 lines=[]
 for paragraph in s.split('\n'):
  line=''
  for word in paragraph.split():
   trial=(line+' '+word).strip()
   if FONT.getlength(trial)>width and line:lines.append(line);line=word
   else:line=trial
  lines.append(line)
 return lines
def dimensions(flow):
 width=W;height=0
 for n in flow:
  k=n['kind']
  if k=='basic':n['text']=f'B{n["n"]}. '+(('Admin: ' if case['actor'].startswith('Quản trị') else 'User: ') if case['steps'][n['n']-1][0]==0 else 'System: ')+case['steps'][n['n']-1][1];n['ref']=f'B{n["n"]}'
  if k=='choice':
   ds=[dimensions(f) for _,f in n['branches']];n['sizes']=ds;n['width']=max(740,sum(w for w,h in ds)+GAP*(len(ds)-1));n['height']=180+max(h for w,h in ds)+75
  else:
   n['width']=W;n['height']=(18 if k=='junction' else 48 if k=='end' else max(70,22+len(wrap(n['text']))*17))+65
  width=max(width,n['width']);height+=n['height']
 return width,height

class Diagram:
 def __init__(self,i,c,flow):
  self.i=i;self.case=c;self.flow=deepcopy(flow);self.nodes=[];self.edges=[];self.jumps=[];self.keys={};self.count=0;self.refs={};self.escape_stack=[]
  self.width,self.height=dimensions(self.flow);self.width=max(self.width,1300)+220;self.height+=430
 def node(self,kind,s,x,y,w,h,ref=None,key=None):
  self.count+=1;id=f'n{self.count}';self.nodes.append(dict(id=id,kind=kind,text=s,x=x,y=y,w=w,h=h))
  if ref:self.refs.setdefault(ref,[]).append(id)
  if key:self.keys[key]=id
  return id
 def edge(self,a,b,label='',pts=None):
  if a and b:self.edges.append(dict(a=a,b=b,label=label,pts=pts or []))
 def get(self,id):return next(n for n in self.nodes if n['id']==id)
 def flow_at(self,flow,cx,y):
  entry=None;previous=None
  for n in flow:
   k=n['kind'];h=n['height']-65
   if k=='choice':
    start=self.node('decision','',cx-65,y,130,68);self.node('guard',n['text'],cx+78,y-5,270,60)
    self.edge(previous,start)
    if entry is None:entry=start
    joinY=y+n['height']-45;join=self.node('merge','',cx-9,joinY,18,18)
    left=cx-n['width']/2;tails=[]
    for (label,branch),(bw,bh) in zip(n['branches'],n['sizes']):
     childx=left+bw/2;self.escape_stack.append(joinY-40);head,tail=self.flow_at(branch,childx,y+180);self.escape_stack.pop()
     self.edge(start,head,label,[(cx,y+105),(childx,y+105)])
     if tail:
      t=self.get(tail);tailY=t['y']+t['h'];self.edge(tail,join,'',[(childx,joinY-25),(cx,joinY-25)]);tails.append(tail)
     left+=bw+GAP
    if not tails:self.nodes=[t for t in self.nodes if t['id']!=join];previous=None
    else:previous=join
   elif k=='junction':
    id=self.node('merge','',cx-9,y,18,18,key=n['key']);self.edge(previous,id)
    if entry is None:entry=id
    previous=id
   elif k=='end':
    id=self.node('end',n['text'],cx-14,y,28,28);self.edge(previous,id)
    if entry is None:entry=id
    previous=None
   else:
    id=self.node('action',n['text'],cx-W/2,y,W,h,n.get('ref'),n.get('key') if k!='jump' else None);self.edge(previous,id)
    if entry is None:entry=id
    if k=='jump':self.jumps.append((id,n['key'],self.escape_stack[0] if self.escape_stack else y+h+25));previous=None
    else:previous=id
   y+=n['height']
  return entry,previous
 def build(self):
  cx=self.width/2;start=self.node('start','',cx-10,50,20,20)
  self.node('note',f'UC{self.i} — {self.case["name"]}\nActivity Diagram',20,20,310,100)
  self.node('note','Tác nhân: '+self.case['actor']+'\nTiền điều kiện: '+self.case['pre'],20,140,420,145)
  self.node('note','Kích hoạt: '+self.case['trigger']+'\nHậu điều kiện: '+self.case['post'],self.width-455,140,420,145)
  first,last=self.flow_at(self.flow,cx,340);self.edge(start,first,'',[(cx,310)])
  if last:
   n=self.get(last);end=self.node('end','Kết thúc',cx-14,n['y']+n['h']+55,28,28);self.edge(last,end)
  for lane,(a,key,safeY) in enumerate(self.jumps):
   b=self.keys[key];src=self.get(a);dst=self.get(b);x=self.width-25-lane*16
   self.edges.append(dict(a=a,b=b,label='',pts=[(src['x']+src['w']/2,safeY),(x,safeY),(x,dst['y']+dst['h']/2)],loop=True))
  self.height=max(n['y']+n['h'] for n in self.nodes)+100
  return self
 def model(self):
  m=E.Element('mxGraphModel',dx='1200',dy='900',grid='1',gridSize='10',guides='1',tooltips='1',connect='1',arrows='1',fold='1',page='1',pageScale='1',pageWidth=str(int(self.width)),pageHeight=str(int(self.height)),math='0',shadow='0')
  root=E.SubElement(m,'root');E.SubElement(root,'mxCell',id='0');E.SubElement(root,'mxCell',id='1',parent='0')
  for n in self.nodes:
   kind=n['kind'];style=styles['qr']
   if kind=='note':style=styles['note']
   if kind in ('decision','merge'):style=styles['d1']
   if kind=='guard':style=styles['d1_guard']
   if kind=='start':style=styles['start']
   if kind=='end':style=styles['end']
   style+='fontFamily=Arial;'
   if kind in ('action','note'):style+='fontSize=12;'
   cell=E.SubElement(root,'mxCell',id=n['id'],value=n['text'] if kind!='end' else '',style=style,vertex='1',parent='1')
   cell.set('tooltip',n['text']);E.SubElement(cell,'mxGeometry',x=str(round(n['x'],2)),y=str(round(n['y'],2)),width=str(n['w']),height=str(n['h']),attrib={'as':'geometry'})
   if kind=='end':
    dot=E.SubElement(root,'mxCell',id=n['id']+'_dot',style=styles['end_dot'],vertex='1',parent='1');E.SubElement(dot,'mxGeometry',x=str(n['x']+6),y=str(n['y']+6),width='16',height='16',attrib={'as':'geometry'})
  for j,e in enumerate(self.edges):
   style=styles['e0']
   if e.get('loop'):style=styles['e0'].replace('entryX=0.5;entryY=0','entryX=1;entryY=0.5')
   cell=E.SubElement(root,'mxCell',id=f'e{j}',style=style+'fontFamily=Arial;fontSize=11;labelBackgroundColor=#FFFFFF;',value=e['label'],edge='1',parent='1',source=e['a'],target=e['b'])
   geo=E.SubElement(cell,'mxGeometry',relative='1',attrib={'as':'geometry'})
   if e['pts']:
    arr=E.SubElement(geo,'Array',attrib={'as':'points'})
    for x,y in e['pts']:E.SubElement(arr,'mxPoint',x=str(round(x,2)),y=str(round(y,2)))
  return m
 def svg(self):
  ns='http://www.w3.org/2000/svg';s=E.Element('{'+ns+'}svg',nsmap={None:ns},width=str(int(self.width)),height=str(int(self.height)),viewBox=f'0 0 {self.width} {self.height}')
  def el(tag,**attrs):return E.SubElement(s,'{'+ns+'}'+tag,{k.replace('_','-'):str(v) for k,v in attrs.items()})
  el('rect',width='100%',height='100%',fill='white')
  for e in self.edges:
   a,b=self.get(e['a']),self.get(e['b'])
   if e.get('loop'):p=[(a['x']+a['w']/2,a['y']+a['h'])]+e['pts']+[(b['x']+b['w'],b['y']+b['h']/2)]
   else:
    p=[(a['x']+a['w']/2,a['y']+a['h'])]+e['pts']+[(b['x']+b['w']/2,b['y'])]
   el('polyline',points=' '.join(f'{x},{y}' for x,y in p),fill='none',stroke='#990033',stroke_width=1.2)
   x,y=p[-1];u,v=p[-2];angle=math.atan2(y-v,x-u);ends=[(x-8*math.cos(angle-.5),y-8*math.sin(angle-.5)),(x,y),(x-8*math.cos(angle+.5),y-8*math.sin(angle+.5))]
   el('polyline',points=' '.join(f'{a},{b}' for a,b in ends),fill='none',stroke='#990033',stroke_width=1.2)
   if e['label']:
    x,y=(p[2] if len(p)>3 else ((p[0][0]+p[-1][0])/2,(p[0][1]+p[-1][1])/2));t=el('text',x=x+7,y=y+18,font_family='Arial',font_size=11,fill='#222');t.text=e['label']
  for n in self.nodes:
   x,y,w,h=n['x'],n['y'],n['w'],n['h'];kind=n['kind'];fill='#FFFFC0'
   if kind in ('start','end'):
    el('ellipse',cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2,fill='black' if kind=='start' else 'white',stroke='#990033')
    if kind=='end':el('ellipse',cx=x+w/2,cy=y+h/2,rx=8,ry=8,fill='black')
   elif kind in ('decision','merge'):el('polygon',points=f'{x+w/2},{y} {x+w},{y+h/2} {x+w/2},{y+h} {x},{y+h/2}',fill=fill,stroke='#990033')
   elif kind=='note':el('path',d=f'M{x},{y} H{x+w-14} L{x+w},{y+14} V{y+h} H{x} Z M{x+w-14},{y} V{y+14} H{x+w}',fill=fill,stroke='#990033')
   elif kind=='action':el('rect',x=x,y=y,width=w,height=h,rx=12,fill=fill,stroke='#990033')
   if kind in ('action','guard','note'):
    lines=wrap(n['text'],w-20);lineh=17;sy=y+8+(0 if kind in ('guard','note') else max(0,(h-lenh(lines)*lineh)/2))
    for j,line in enumerate(lines):
     t=el('text',x=x+10 if kind in ('guard','note') else x+w/2,y=sy+13+j*lineh,font_family='Arial',font_size=12,text_anchor='start' if kind in ('guard','note') else 'middle',fill='black')
     if kind=='guard':t.set('font-style','italic')
     t.text=line
  return E.tostring(s,xml_declaration=True,encoding='UTF-8')

def lenh(a):return len(a)
combined=E.Element('mxfile',host='app.diagrams.net',type='device')
report=['# Đối chiếu Activity Diagram với đặc tả use case v1.1','',
'Mẫu hình: UC1_Act.drawio do người dùng cung cấp. Nội dung: bản đặc tả 10 UC v1.1, không sao chép các mô tả cũ về APK phát hành, Google/Mapbox routing hay BLE trên web.',
'','Mỗi trang có nút bắt đầu/kết thúc, hành động, quyết định với nhãn điều kiện, nhánh thay thế và ngoại lệ. Giữ nền vàng #FFFFC0, viền/mũi tên #990033, hình thoi trống và điều kiện chữ nghiêng bên cạnh theo mẫu. Canvas được mở rộng để chứa đầy đủ luồng. B1…Bn tương ứng Basic Course; A/E tương ứng Alternative/Exception Paths trong đặc tả.','',
'File tổng hợp có 10 trang; từng file UC riêng và SVG được cung cấp trong gói ZIP. Mở bằng diagrams.net và có thể chỉnh mọi ô/mũi tên. SVG là bản xem trước tĩnh; dữ liệu gốc chỉnh sửa nằm trong .drawio.','',
'Các giới hạn triển khai được ghi ngay trong các nhánh tương ứng. Một diagram đầy đủ không chứng minh APK, BLE, GPS hoặc mọi audio đã nghiệm thu.','',
'Đặc tả đối chiếu: docs/Smart_Audio_Guide_Focused_UseCases_v1.1.docx. Các diagram này thay thế sơ đồ activity tóm tắt trước đó; không sửa file mẫu gốc và không sửa chương trình.','',
'Cách mở: giải nén ZIP, mở diagrams.net, chọn File → Open From → Device và chọn Smart_Audio_Guide_Activities_UC1-UC10.drawio. Chọn UC ở dải trang phía dưới; dùng zoom để đọc. Muốn xuất ảnh: File → Export as → SVG hoặc PNG.','']
for i,(case,flow) in enumerate(zip(CASES,S),1):
 d=Diagram(i,case,flow).build();m=d.model();page=E.SubElement(combined,'diagram',id=f'UC{i}_Act',name=f'UC{i}_Act');page.append(m)
 single=E.Element('mxfile',host='app.diagrams.net',type='device');p=E.SubElement(single,'diagram',id=f'UC{i}_Act',name=f'UC{i}_Act');p.append(deepcopy(m));(OUT/f'UC{i}_Act.drawio').write_bytes(E.tostring(single,pretty_print=True,xml_declaration=True,encoding='UTF-8'))
 (OUT/f'UC{i}_Act.svg').write_bytes(d.svg())
 # Structural integrity: every path node reachable; ends reachable; all decision branches labelled.
 ids={n['id'] for n in d.nodes};assert all(e['a'] in ids and e['b'] in ids for e in d.edges)
 seen={n['id'] for n in d.nodes if n['kind']=='start'}
 while True:
  more=seen|{e['b'] for e in d.edges if e['a'] in seen}
  if more==seen:break
  seen=more
 assert all(n['id'] in seen for n in d.nodes if n['kind'] not in ('note','guard'))
 joined=' '.join(n['text'] for n in d.nodes)
 for kind in ('alt','exc'):
  for code in re.findall(r'\b[AE]\d+\.',case[kind]):assert code[:-1] in joined,(i,code)
 for k in range(1,len(case['steps'])+1):assert f'B{k}' in joined,(i,k)
 report+= [f'## UC{i} {case["name"]}','',f'- Luồng chính: B1–B{len(case["steps"])}.',f'- Thay thế: {case["alt"]}',f'- Ngoại lệ: {case["exc"]}',f'- Hậu điều kiện: {case["post"]}',f'- Kiểm tra cấu trúc: {len(d.nodes)} nút; {len(d.edges)} đường nối; mọi nút hoạt động tới được từ Start; các nhánh có điểm kết thúc hoặc quay lại luồng.','']
 report+=['### Đối chiếu bước chính','']+[f'- B{k}: {text}' for k,(_,text) in enumerate(case['steps'],1)]+['']
(OUT/'Smart_Audio_Guide_Activities_UC1-UC10.drawio').write_bytes(E.tostring(combined,pretty_print=True,xml_declaration=True,encoding='UTF-8'))
(OUT/'README_ACTIVITY.md').write_text('\n'.join(report),encoding='utf8')
with ZipFile(OUT.parent/'Smart_Audio_Guide_Activity_Diagrams.zip','w',ZIP_DEFLATED) as z:
 for p in OUT.iterdir():
  if p.suffix in ('.drawio','.svg','.md'):z.write(p,p.name)
print('Generated 10 editable diagrams + combined drawio + SVG + traceability README.')
