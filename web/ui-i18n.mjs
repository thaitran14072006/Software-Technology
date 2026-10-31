// A single catalog for static markup, dialogs, admin tools and dynamically inserted labels.
// Rows: Vietnamese | English | Japanese | Korean | Chinese.
import {EXTRA_ROWS} from './ui-extra.mjs';
const rows = [
['VƯỜN QUỐC GIA','NATIONAL PARK','国立公園','국립공원','国家公园'],
['SƠ ĐỒ · KHÔNG THEO TỈ LỆ','SCHEMATIC · NOT TO SCALE','概略図・縮尺なし','개략도 · 실제 축척 아님','示意图 · 非实际比例'],
['QR Code','QR Code','QRコード','QR 코드','二维码'],
['Tọa độ đối chiếu nguồn bản đồ','Coordinates checked against a map source','地図資料と照合した座標','지도 출처와 대조한 좌표','已与地图来源核对的坐标'],
['Hạn mức Google đã hết. Có thể tiếp tục từ {0}.','Google quota is exhausted. Generation can resume from {0}.','Googleの利用上限に達しました。{0}以降に生成を再開できます。','Google 할당량을 모두 사용했습니다. {0}부터 생성을 재개할 수 있습니다.','Google配额已用完，可从{0}起继续生成。'],
['Gói ngoại tuyến: {0} audio Google, {1} bản chưa sẵn sàng. Lưu lúc {2}.','Offline pack: {0} Google recordings, {1} not ready. Saved at {2}.','オフラインパック：Google音声{0}件、未準備{1}件。保存日時：{2}。','오프라인 패키지: Google 음성 {0}개, 미완료 {1}개. 저장: {2}.','离线包：{0}个Google音频，{1}个尚未就绪。保存时间：{2}。'],
['Đã tải {0} audio Google. Còn {1} bản chưa được tạo do hạn mức.','Downloaded {0} Google recordings. {1} are not generated due to quota limits.','Google音声{0}件を保存しました。制限により未生成は{1}件です。','Google 음성 {0}개를 다운로드했습니다. 할당량 제한으로 {1}개가 아직 생성되지 않았습니다.','已下载{0}个Google音频，仍有{1}个因配额限制尚未生成。'],
['Giọng Google cho bài này chưa sẵn sàng. Không tự đổi sang giọng máy.','Google narration is not ready for this stop. Device speech will not be substituted.','このスポットのGoogle音声は未準備です。端末音声には切り替えません。','이 방문지의 Google 해설이 아직 준비되지 않았습니다. 기계 음성으로 바꾸지 않습니다.','此景点的Google讲解尚未就绪，不会自动切换机器语音。'],
['Không tải được giọng Google. Kết nối mạng và tải lại gói thuyết minh.','Google audio could not be loaded. Connect and download the narration pack again.','Google音声を読み込めません。接続して解説パックを再保存してください。','Google 음성을 불러올 수 없습니다. 연결 후 해설 패키지를 다시 다운로드하세요.','无法加载Google音频，请联网重新下载讲解包。'],
['Giải nén gói tải về, mở index.html để nghe ngoại tuyến.','Extract the downloaded pack and open index.html for offline playback.','保存したパックを展開し、index.htmlを開くとオフライン再生できます。','다운로드한 압축 파일을 풀고 index.html을 열면 오프라인으로 들을 수 있습니다.','解压下载的文件包，打开index.html即可离线收听。'],
['Đến nội dung chính','Skip to content','本文へ','본문으로','跳到正文'],
['Khám phá','Explore','探索','탐방','探索'],['Quản trị','Administration','管理','관리','管理'],
['Demo cục bộ','Local demo','ローカルデモ','로컬 데모','本地演示'],['Backend trực tiếp','Live content','ライブデータ','실시간 콘텐츠','实时内容'],['Gói ngoại tuyến','Offline pack','オフラインパック','오프라인 패키지','离线包'],
['Kết nối','Connection','接続','연결','连接'],['VƯỜN QUỐC GIA NAM CÁT TIÊN','NAM CAT TIEN NATIONAL PARK','ナムカットティエン国立公園','남깟띠엔 국립공원','南吉仙国家公园'],
['Chạm vào thiên nhiên.','Connect with nature.','自然に触れる。','자연을 만나다.','亲近自然。'],['Lắng nghe câu chuyện.','Listen to its stories.','物語に耳を澄ます。','이야기에 귀 기울이다.','聆听故事。'],
['Một hành trình giữa rừng xanh, theo nhịp bước của bạn.','A journey through the forest, at your own pace.','自分のペースで森を巡る旅。','나만의 속도로 숲을 여행하세요.','按自己的节奏，漫步森林。'],
['điểm dừng chân','stops','スポット','방문지','个景点'],['ngôn ngữ','languages','言語','언어','种语言'],['giờ tham quan','visiting hours','開園時間','관람 시간','开放时间'],
['Tất cả','All','すべて','전체','全部'],['Cây & rừng','Trees & forest','樹木・森','나무와 숲','树木与森林'],['Nước & thác','Water & rapids','水辺・急流','물과 폭포','水域与瀑布'],['Khu chức năng','Facilities','施設','시설','设施'],
['Đi theo tiếng gọi của rừng','Follow the call of the forest','森の声に導かれて','숲의 부름을 따라','追随森林的呼唤'],
['Sơ đồ tham quan · không theo tỉ lệ địa lý','Visitor schematic · not to scale','観光概略図・縮尺は実際と異なります','관광 안내도 · 실제 축척 아님','游览示意图 · 非实际比例'],
['Bản đồ OpenStreetMap','OpenStreetMap','OpenStreetMap地図','OpenStreetMap 지도','OpenStreetMap地图'],['Sơ đồ tham quan','Visitor schematic','観光概略図','관광 안내도','游览示意图'],
['Tuyến tham quan','Visitor route','観光ルート','관광 경로','游览路线'],['Đường mòn','Trail','遊歩道','탐방로','步道'],['Bật GPS','Enable GPS','GPSを有効にする','GPS 켜기','开启GPS'],
['CHỌN ĐIỂM ĐẾN TIẾP THEO','CHOOSE YOUR NEXT STOP','次のスポットを選ぶ','다음 방문지 선택','选择下一个景点'],['Mỗi điểm dừng, một câu chuyện','Every stop has a story','スポットごとの物語','방문지마다 하나의 이야기','每个景点都有故事'],
['Sẵn sàng cho chuyến đi','Ready for your visit','旅の準備','탐방 준비','准备出发'],['Mang theo nước, giữ yên tĩnh và chỉ để lại những dấu chân.','Bring water, stay quiet and leave only footprints.','水を携帯し、静かに歩き、足跡だけを残しましょう。','물을 준비하고 조용히 걸으며 발자국만 남기세요.','带好饮水，保持安静，只留下足迹。'],
['Lưu để dùng ngoại tuyến','Download for offline use','オフライン用に保存','오프라인용 다운로드','下载离线包'],['QUẢN LÝ NỘI DUNG','CONTENT MANAGEMENT','コンテンツ管理','콘텐츠 관리','内容管理'],
['Dashboard quản trị','Admin dashboard','管理ダッシュボード','관리 대시보드','管理面板'],['Thêm điểm tham quan','Add a stop','スポットを追加','방문지 추가','添加景点'],['Hoạt động hệ thống','System activity','システムの利用状況','시스템 사용 현황','系统活动'],
['Đang tải thống kê…','Loading statistics…','統計を読み込み中…','통계 불러오는 중…','正在加载统计…'],['Làm mới','Refresh','更新','새로고침','刷新'],['Lượt nghe từng bản thuyết minh','Plays by narration','解説ごとの再生回数','해설별 재생 횟수','各讲解播放次数'],
['Ngôn ngữ','Language','言語','언어','语言'],['Mã','Code','コード','코드','编号'],['Bản thuyết minh','Narration','音声解説','음성 해설','讲解'],['Lượt nghe','Plays','再生回数','재생 횟수','播放次数'],['Nội dung tham quan','Visitor content','観光コンテンツ','탐방 콘텐츠','游览内容'],
['Điểm tham quan','Point of interest','観光スポット','방문지','景点'],['Nhóm','Category','分類','분류','类别'],['Trạng thái','Status','状態','상태','状态'],['Bản dịch','Translations','翻訳','번역','翻译'],['Thao tác','Actions','操作','작업','操作'],
['Thiên nhiên kể chuyện. Bạn lắng nghe.','Nature tells stories. Listen.','自然の物語に耳を澄ます。','자연의 이야기에 귀 기울이세요.','聆听大自然的故事。'],
['Kết nối hệ thống','System connection','システム接続','시스템 연결','系统连接'],['Chọn nguồn dữ liệu cho trang tham quan và quản trị.','Choose the data source for visitors and administration.','観光・管理画面のデータソースを選択します。','탐방 및 관리 화면의 데이터 소스를 선택하세요.','选择游览和管理页面的数据源。'],
['Dữ liệu mẫu 15 điểm dành cho khách trải nghiệm. Quản trị dùng backend và tài khoản admin.','Sample content for 15 stops. Administration requires the backend and an admin account.','15スポットのサンプルです。管理にはバックエンドと管理者アカウントが必要です。','15개 방문지의 예시입니다. 관리에는 백엔드와 관리자 계정이 필요합니다.','15个景点的示例内容。管理需要后端及管理员账号。'],
['Kết nối API thật qua máy chủ web. Cần backend và cơ sở dữ liệu đang chạy.','Connect to the live API through the web server. Backend and database must be running.','Webサーバー経由でAPIに接続します。バックエンドとデータベースの起動が必要です。','웹 서버를 통해 API에 연결합니다. 백엔드와 데이터베이스가 실행 중이어야 합니다.','通过网页服务器连接API，需要运行后端和数据库。'],
['JWT quản trị','Admin JWT','管理者JWT','관리자 JWT','管理员JWT'],['Chỉ lưu trong phiên tab hiện tại. Trang tham quan không cần token.','Stored only in this tab session. Visitors do not need a token.','このタブのセッションだけに保存します。観光にはトークン不要です。','현재 탭 세션에만 저장됩니다. 방문객은 토큰이 필요 없습니다.','仅保存在当前标签页会话中，游客无需令牌。'],
['Áp dụng kết nối','Apply connection','接続を適用','연결 적용','应用连接'],['Tham gia hệ thống','Open the guide','ガイドを開く','가이드 열기','打开导览'],
['Quét mã bằng camera điện thoại để mở trang tham quan Cát Tiên.','Scan with your phone camera to open the Cat Tien guide.','スマートフォンのカメラで読み取り、ガイドを開きます。','휴대전화 카메라로 스캔하여 깟띠엔 가이드를 여세요.','使用手机相机扫码打开吉仙导览。'],
['Địa chỉ web tham gia','Guide web address','ガイドのURL','가이드 웹 주소','导览网址'],['Cập nhật mã QR','Update QR code','QRコードを更新','QR 코드 업데이트','更新二维码'],['Sao chép liên kết','Copy link','リンクをコピー','링크 복사','复制链接'],['Tải mã QR','Download QR code','QRコードを保存','QR 코드 다운로드','下载二维码'],
['Mở điểm tham quan','Open a stop','スポットを開く','방문지 열기','打开景点'],['Nhập số điểm, token hoặc đường dẫn trên mã QR của điểm tham quan.','Enter the stop number, token or URL from the stop QR code.','スポットの番号、トークン、またはQRコード内のURLを入力します。','방문지 QR 코드의 번호, 토큰 또는 URL을 입력하세요.','输入景点编号、令牌或二维码中的链接。'],
['Nội dung mã QR','QR code content','QRコードの内容','QR 코드 내용','二维码内容'],['Mở điểm','Open stop','スポットを開く','방문지 열기','打开景点'],['Quét bằng camera','Scan with camera','カメラで読み取る','카메라로 스캔','使用相机扫码'],
['Mã điểm','Stop code','スポットコード','방문지 코드','景点编号'],['Đã xuất bản','Published','公開済み','게시됨','已发布'],['Bản nháp','Draft','下書き','초안','草稿'],
['Bán kính tự phát (m)','Autoplay radius (m)','自動再生半径（m）','자동 재생 반경(m)','自动播放半径（米）'],['Vĩ độ GPS','GPS latitude','GPS緯度','GPS 위도','GPS纬度'],['Kinh độ GPS','GPS longitude','GPS経度','GPS 경도','GPS经度'],
['Sơ đồ X (0–1380)','Schematic X (0–1380)','概略図X（0–1380）','안내도 X(0–1380)','示意图X（0–1380）'],['Sơ đồ Y (0–900)','Schematic Y (0–900)','概略図Y（0–900）','안내도 Y(0–900)','示意图Y（0–900）'],
['Tọa độ GPS đã được xác thực ngoài thực địa','GPS coordinates verified on site','現地で確認済みのGPS座標','현장에서 확인한 GPS 좌표','GPS坐标已实地核实'],
['Chỉ điểm đã xác thực mới được dùng để tự phát theo GPS. Bản API yêu cầu đủ kinh độ và vĩ độ.','GPS autoplay uses verified stops only. The API requires latitude and longitude.','GPS自動再生は確認済みスポットのみ対象です。APIには緯度と経度が必要です。','GPS 자동 재생은 확인된 방문지에서만 작동합니다. API에는 위도와 경도가 필요합니다.','GPS自动播放仅用于已核实景点。API需要经纬度。'],
['Bản dịch & thuyết minh','Translations & narration','翻訳・音声解説','번역 및 해설','翻译与讲解'],['Lưu nội dung','Save content','内容を保存','콘텐츠 저장','保存内容'],['Xóa điểm tham quan?','Delete this stop?','スポットを削除しますか？','방문지를 삭제할까요?','删除该景点？'],
['Hủy','Cancel','キャンセル','취소','取消'],['Xóa điểm','Delete stop','スポットを削除','방문지 삭제','删除景点'],['Đăng nhập quản trị','Admin sign in','管理者ログイン','관리자 로그인','管理员登录'],['Mật khẩu','Password','パスワード','비밀번호','密码'],['Đăng nhập','Sign in','ログイン','로그인','登录'],['Đăng xuất','Sign out','ログアウト','로그아웃','退出'],
['Tải MP3 thuyết minh','Upload narration MP3','解説MP3をアップロード','해설 MP3 업로드','上传讲解MP3'],['MP3 tự thu âm, tối đa 20 MB. Chọn đúng bản dịch đã lưu.','Recorded MP3, up to 20 MB. Select its saved translation.','録音MP3は20MBまでです。対応する翻訳を選択してください。','녹음 MP3는 최대 20MB입니다. 해당 번역을 선택하세요.','MP3最大20MB，请选择对应的已保存译文。'],
['Giọng','Voice','音声','음성','声音'],['Nữ','Female','女性','여성','女声'],['Nam','Male','男性','남성','男声'],['File MP3','MP3 file','MP3ファイル','MP3 파일','MP3文件'],['Tải lên','Upload','アップロード','업로드','上传'],['Đóng','Close','閉じる','닫기','关闭'],
['Sửa','Edit','編集','수정','编辑'],['Tải MP3','Upload MP3','MP3をアップロード','MP3 업로드','上传MP3'],['Tạo MP3 miễn phí','Generate narration','解説を生成','해설 생성','生成讲解'],['Tạo lại audio lỗi','Retry failed audio','失敗した音声を再生成','실패한 음성 재생성','重新生成失败音频'],['Xóa','Delete','削除','삭제','删除'],['Chưa xác thực','Not verified','未確認','미확인','未核实'],['Đã xác thực','Verified','確認済み','확인됨','已核实'],
['Nguồn giọng đọc','Audio source','音声ソース','음성 소스','音频来源'],['Giọng trình duyệt · như cat-tien-app','Browser voice · as in cat-tien-app','ブラウザー音声・cat-tien-appと同じ','브라우저 음성 · cat-tien-app 방식','浏览器声音 · 与cat-tien-app一致'],['MP3 đã lưu · dùng ngoại tuyến','Saved MP3 · offline playback','保存済みMP3・オフライン再生','저장된 MP3 · 오프라인 재생','已保存MP3 · 离线播放'],
['Tự động · MP3 đúng ngôn ngữ, thiếu thì dùng giọng thiết bị','Automatic · use the matching-language MP3, or the device voice if unavailable','自動・言語に合ったMP3を使用し、なければ端末の音声を使用','자동 · 선택한 언어의 MP3를 사용하고, 없으면 기기 음성을 사용','自动 · 优先播放对应语言的 MP3；没有时使用设备语音'],
['Google AI Studio · MP3 có sẵn','Google AI Studio · saved MP3','Google AI Studio・保存済みMP3','Google AI Studio · 저장된 MP3','Google AI Studio · 已保存MP3'],
['Đồng ý chia sẻ vị trí để thống kê vùng tham quan (tối đa 7 ngày). Có thể bỏ chọn bất cứ lúc nào.','Share location for visitor-area statistics (up to 7 days). You can withdraw at any time.','訪問地域の統計のため位置情報を共有します（最大7日）。いつでも解除できます。','방문 구역 통계를 위해 위치를 공유합니다(최대 7일). 언제든 취소할 수 있습니다.','同意共享位置用于游览区域统计（最多7天），可随时取消。'],
['Tên điểm','Stop name','スポット名','방문지 이름','景点名称'],['Mô tả ngắn','Short description','概要','간단한 설명','简介'],['Lời thuyết minh','Narration text','解説文','해설 내용','讲解文本'],
['Ngoại tuyến','Offline','オフライン','오프라인','离线'],['Mất kết nối API','API disconnected','API未接続','API 연결 끊김','API连接断开'],['Đang tải dữ liệu…','Loading content…','コンテンツを読み込み中…','콘텐츠 불러오는 중…','正在加载内容…'],['Đang tải…','Loading…','読み込み中…','불러오는 중…','正在加载…'],
['BACKEND TRỰC TIẾP · Nội dung được tải từ API NestJS.','LIVE CONTENT · Loaded from the NestJS API.','ライブコンテンツ・NestJS APIから取得。','실시간 콘텐츠 · NestJS API에서 불러왔습니다.','实时内容 · 从NestJS API加载。'],
['DEMO CỤC BỘ · Dữ liệu mẫu; thay đổi quản trị được lưu trong trình duyệt này.','LOCAL DEMO · Sample content stored in this browser.','ローカルデモ・このブラウザーのサンプルデータです。','로컬 데모 · 이 브라우저의 예시 데이터입니다.','本地演示 · 示例数据保存在此浏览器。'],
['NGOẠI TUYẾN · Đang dùng gói đã lưu. API hiện không truy cập được.','OFFLINE · Using saved content. The API is unavailable.','オフライン・保存済みパックを使用しています。APIに接続できません。','오프라인 · 저장된 콘텐츠를 사용합니다. API에 연결할 수 없습니다.','离线 · 正在使用已保存内容，API暂不可用。'],
['Trung tâm Du khách','Visitor Center','ビジターセンター','방문자 센터','游客中心'],['Lưu giọng Google trước khi vào rừng','Download Google narration before entering the park','入園前にGoogle音声を保存','입장 전 Google 해설 다운로드','入园前下载Google讲解'],
['Tải gói thuyết minh','Download narration pack','解説パックを保存','해설 패키지 다운로드','下载讲解包'],['Để sau','Later','後で','나중에','稍后'],
['Giữ nguyên file audio khi ngoại tuyến; không tự đổi sang giọng máy.','Keep the same audio offline; do not switch to a device voice.','オフラインでも同じ音声を再生し、端末音声に切り替えません。','오프라인에서도 같은 음성을 재생하며 기계음으로 전환하지 않습니다.','离线仍播放同一音频，不自动切换机器语音。'],
];

rows.push(...EXTRA_ROWS);
const index = new Map(rows.map(r => [r[0].normalize('NFC'), r]));
const langIndex = {vi:0,en:1,ja:2,ko:3,zh:4};
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns = rows.filter(r=>/\{\d+\}/.test(r[0])).map(row=>{
  const ids=[];let source='',position=0;
  for(const m of row[0].matchAll(/\{(\d+)\}/g)){source+=escapeRegex(row[0].slice(position,m.index))+'(.*?)';ids.push(m[1]);position=m.index+m[0].length;}
  source+=escapeRegex(row[0].slice(position));return {row,ids,regex:new RegExp('^'+source+'$','s')};
});
let language = 'vi';
export function translateUI(text, lang = language) {
  const normalized = text.normalize('NFC');
  if (lang === 'vi') return normalized;
  const trimmed = normalized.trim();
  const prefix = trimmed.match(/^([＋↻↓▦⌖✓♧≈⌂]\s*)?(.*)$/s);
  const key = index.has(trimmed) ? trimmed : prefix[2];
  const row = index.get(key);
  if (!row) {
    for(const pattern of patterns){const match=trimmed.match(pattern.regex);if(match){const values=Object.fromEntries(pattern.ids.map((id,i)=>[id,match[i+1]]));return normalized.replace(trimmed,pattern.row[langIndex[lang]||0].replace(/\{(\d+)\}/g,(_,id)=>values[id]??''));}}
    return normalized;
  }
  return normalized.replace(trimmed, (key === trimmed ? '' : prefix[1] || '') + row[langIndex[lang] || 0]);
}
export function formatUI(key,values,lang=language){const row=index.get(key);const template=row?row[langIndex[lang]||0]:key;return template.replace(/\{(\d+)\}/g,(_,id)=>String(values[+id]??''));}

export function installUITranslations(getLanguage) {
  const remembered = new WeakMap();
  const attrs = new WeakMap();
  let queued = false;
  const excluded = '.script-text,.stop-name,.map-label,[data-language-name],#translation-fields input,#translation-fields textarea,script,style,textarea';
  function apply() {
    language = getLanguage();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest(excluded)) continue;
      const prev = remembered.get(node);
      const original = prev && node.data === prev.output ? prev.original : node.data;
      const output = translateUI(original);
      remembered.set(node, {original, output});
      if (node.data !== output) node.data = output;
    }
    for (const el of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
      const stored = attrs.get(el) || {};
      for (const name of ['placeholder','aria-label','title']) if (el.hasAttribute(name)) {
        const current = el.getAttribute(name), prev = stored[name];
        const original = prev && current === prev.output ? prev.original : current;
        const output = translateUI(original); stored[name] = {original,output};
        if (current !== output) el.setAttribute(name, output);
      }
      attrs.set(el, stored);
    }
  }
  const observer = new MutationObserver(() => { if (!queued) { queued = true; queueMicrotask(() => { queued = false; observer.disconnect(); apply(); observer.observe(document.body, {subtree:true,childList:true,characterData:true}); }); } });
  observer.observe(document.body, {subtree:true,childList:true,characterData:true});
  apply();
  return () => { observer.disconnect(); apply(); observer.observe(document.body, {subtree:true,childList:true,characterData:true}); };
}
export const UI_ROWS = rows;
