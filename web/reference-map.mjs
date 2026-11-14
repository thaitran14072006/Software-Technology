// Fixed visitor schematic with editable vector artwork and stable poster numbers.
import {mapViewport,MAP_LEFT,MAP_TOP,MAP_WIDTH,MAP_HEIGHT} from './map-viewport.mjs';
export const REFERENCE_STOPS = [
  [1,320,742,'Khu Cứu hộ động vật hoang dã','Wildlife Rescue Station','facility',290,748,'end'],
  [2,329,619,'Tung đại thụ','Tung Giant Tree','tree',298,625,'end'],
  [3,354,585,'Bằng lăng 5 ngọn','5-topped Lagerstroemia Tree','tree',323,591,'end'],
  [4,390,665,'Thiên tuế','Thousand-year Tree','tree',359,671,'end'],
  [5,517,527,'Ghềnh Bến Cự','Ben Cu Rapids','water',557,533,'start'],
  [6,557,461,'Vườn thực vật','Botanical Garden','facility',596,467,'start'],
  [7,437,428,'Cây Gõ Bác Đồng','Uncle Dong Tree','tree',406,434,'end'],
  [8,361,389,'Đa Lộc Giao','6-rooted Intersecting Ficus','tree',330,395,'end'],
  [9,218,318,'Bàu Sấu','Crocodile Lake','water',218,361,'middle'],
  [10,216,245,'Cây 6 múi','6-pack Tree','tree',216,286,'middle'],
  [11,219,146,'Bằng lăng lộc bình','Deformed Lagerstroemia Tree','tree',260,152,'start'],
  [12,149,213,'Rừng Đại Phong Tử','Dai Phong Tu Forest','tree',90,254,'middle'],
  [13,96,182,'Cây Si Trăm Thân','Hundred-trunked Ficus','tree',94,151,'middle'],
  [14,946,334,'Thác Trời','Heaven Rapids','water',946,376,'middle'],
  [15,1123,339,'Rừng bằng lăng Đà Cộ','Da Co Lagerstroemia Forest','tree',1123,381,'middle'],
];

const names = {
  en:['Wildlife Rescue Station','Tung Giant Tree','Five-topped Lagerstroemia','Cycad','Ben Cu Rapids','Botanical Garden','Bac Dong Go Tree','Loc Giao Banyan','Crocodile Lake','Six-lobed Tree','Vase-shaped Lagerstroemia','Dai Phong Tu Forest','Hundred-trunked Ficus','Troi Waterfall','Da Co Lagerstroemia Forest'],
  ja:['野生動物救護所','トゥンの巨木','五つ又のサルスベリ','ソテツ','ベンクーの急流','植物園','バックドンのゴーの木','ロックザオのガジュマル','クロコダイル湖','六稜の木','花瓶形のサルスベリ','大風子の森','百幹のガジュマル','チョイ滝','ダコーのサルスベリ林'],
  ko:['야생동물 구조소','퉁 거목','다섯 갈래 배롱나무','소철','벤꾸 급류','식물원','박동 고 나무','록자오 반얀나무','악어 호수','여섯 골 나무','화병 모양 배롱나무','대풍자 숲','백 줄기 반얀나무','쯔어이 폭포','다꼬 배롱나무 숲'],
  zh:['野生动物救护站','Tung 巨树','五冠紫薇树','苏铁','Ben Cu 急流','植物园','胡伯同纪念红木树','鹿交榕树','鳄鱼湖','六棱树','花瓶形紫薇树','大风子林','百干榕树','Troi 瀑布','Da Co 紫薇林'],
};

const copy = {
  vi:{park:'VƯỜN QUỐC GIA',place:'CÁT TIÊN',map:'SƠ ĐỒ THAM QUAN',title:'VƯỜN QUỐC GIA CÁT TIÊN — Sơ đồ tham quan',description:'Sơ đồ cố định gồm 15 điểm dừng, đường lớn màu xanh ngọc và đường mòn nét đứt.',road:'Đường lớn',trail:'Đường mòn đi bộ',water:'Tiếp nước',ferry:'Bến phà',center:'Trung tâm Du Khách',stop:'DỪNG'},
  en:{park:'NATIONAL PARK',place:'CAT TIEN',map:'VISITOR MAP',title:'CAT TIEN NATIONAL PARK — Visitor map',description:'Fixed schematic with 15 stops, a teal main road and dashed walking trails.',road:'Main road',trail:'Walking trail',water:'Water refill',ferry:'Ferry pier',center:'Visitor Center',stop:'STOP'},
  ja:{park:'国立公園',place:'カッティエン',map:'観光案内図',title:'カッティエン国立公園 — 観光案内図',description:'15のスポット、青緑の主要道路、破線の遊歩道を示す固定概略図です。',road:'主要道路',trail:'遊歩道',water:'給水所',ferry:'渡し船乗り場',center:'ビジターセンター',stop:'停止'},
  ko:{park:'국립공원',place:'깟띠엔',map:'관광 안내도',title:'깟띠엔 국립공원 — 관광 안내도',description:'15개 방문지, 청록색 주도로와 점선 탐방로를 표시한 고정 안내도입니다.',road:'주도로',trail:'도보 탐방로',water:'급수 지점',ferry:'선착장',center:'방문자 센터',stop:'정지'},
  zh:{park:'国家公园',place:'吉仙',map:'游览示意图',title:'吉仙国家公园 — 游览示意图',description:'固定示意图，标有15个景点、青绿色主路与虚线步道。',road:'主干道',trail:'步行小径',water:'补水点',ferry:'渡口',center:'游客中心',stop:'停止'},
};

export function referenceStopName(number,lang='vi',poi) {
  if(poi?.name && (!poi.lang || poi.lang===lang))return poi.name;
  const stop=REFERENCE_STOPS.find(([n])=>String(n)===String(number));
  if(!stop)return poi?.name || '';
  if(!copy[lang] || lang==='vi')return stop[3];
  // Keep poster identity consistent across map, cards, details and route picker.
  return names[lang]?.[stop[0]-1] || stop[4];
}

// Estimate mixed Latin/CJK labels so a longer translation fits its map slot.
const textWidth=(text,size)=>Array.from(text).reduce((width,char)=>width+size*(/[\u2e80-\u9fff\uac00-\ud7af\u3040-\u30ff]/u.test(char)?1:.56),0);

export const REFERENCE_MAP_CSS = `
.reference-map{display:block;width:100%;height:auto;background:#edf5f2;font-family:"Poster Noto","Segoe UI",Arial,sans-serif}
.reference-map text{font-family:inherit}
.reference-map .poster-name{font-size:18px;font-weight:650;fill:#164c40;paint-order:stroke;stroke:#f1f7f4;stroke-width:4px;stroke-linejoin:round}
.reference-map .poster-name-small{font-size:15.5px}
.reference-map .poster-number{font-size:19px;font-weight:750;fill:#164c40;dominant-baseline:central;text-anchor:middle}
.reference-map .poster-distance{font-size:14px;font-weight:650;fill:#59726b;paint-order:stroke;stroke:#f1f7f4;stroke-width:5px;stroke-linejoin:round}
.reference-map .poster-water-label{font-size:11.5px;font-weight:550;fill:#3c898a;paint-order:stroke;stroke:#f1f7f4;stroke-width:4px}
.reference-map .poster-label-box{fill:#ffffff;fill-opacity:0;stroke:none;transition:fill-opacity .15s}
.reference-map .poster-selected{fill:#b9e3c9;fill-opacity:.55;stroke:#6cb997;stroke-width:1.5}
.reference-map .poster-legend text{font-size:15px;font-weight:550;fill:#607d70}
.reference-map .map-stop:focus-visible{outline:none}
.reference-map .map-stop:hover .poster-label-box,.reference-map .map-stop:focus-visible .poster-label-box{fill:#ffffff;fill-opacity:.95;stroke:#a4cabb;stroke-width:1.2}
.reference-map .map-stop[aria-pressed="true"] .poster-label-box{fill:#12674f;fill-opacity:1;stroke:#12674f;stroke-width:1}
.reference-map .map-stop[aria-pressed="true"] .poster-name{fill:#ffffff;stroke:none}
.reference-map .map-stop[aria-pressed="true"] .poster-number{fill:#ffffff}
.reference-map .map-route{stroke:#174d40;stroke-width:7;stroke-dasharray:4 8;opacity:.85}
.reference-map .poster-botanical{pointer-events:none}
`;

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color={tree:'#41866b',water:'#338f96',facility:'#b39a57'};
const number=(n,x,y,type,r=18,active=false)=>`<circle cx="${x}" cy="${y}" r="${r+4}" fill="${color[type]}" opacity=".09"/><circle cx="${x}" cy="${y}" r="${r}" fill="${active?'#12674f':'#fafffc'}" stroke="${active?'#12674f':color[type]}" stroke-width="2.4"/><text class="poster-number" x="${x}" y="${y+1}">${n}</text>`;
const stopSign=(x,y,label)=>`<g transform="translate(${x} ${y})"><rect x="-17" y="-13" width="34" height="26" rx="7" fill="#f4f8f5" stroke="#94ada3" stroke-width="1.5"/><text x="0" y="3.5" text-anchor="middle" fill="#5c7970" font-size="9" font-weight="700" letter-spacing=".5">${escape(label)}</text></g>`;
const water=(x,y,labelY,label)=>`<g><path d="M${x} ${y-12}C${x-3} ${y-3} ${x-8} ${y+2} ${x-7} ${y+8}C${x-5} ${y+16} ${x+6} ${y+16} ${x+7} ${y+8}C${x+9} ${y+2} ${x+3} ${y-3} ${x} ${y-12}Z" fill="#95d1cc" stroke="#469d99" stroke-width="1.3"/><path d="M${x-3} ${y+3}Q${x-5} ${y+8} ${x-1} ${y+9}" fill="none" stroke="#f5fffc" stroke-width="1.8"/><text class="poster-water-label" x="${x}" y="${labelY}" text-anchor="middle">${escape(label)}</text></g>`;

function botanicalArtwork(){
  const tree=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-30-15C-63-21-67-55-44-71C-59-99-32-119-11-111C-4-144 37-144 47-111C80-116 94-86 74-64C95-44 74-15 43-16C25 0-10 0-30-15Z" fill="#deeee5" stroke="#97bea9" stroke-width="1.7"/><path d="M13 55V-76M13-15-15-44M13-42 37-67M13 6 43-22" fill="none" stroke="#86af98" stroke-width="2.5" stroke-linecap="round"/><path d="M-3 55H29" stroke="#86af98" stroke-width="2" stroke-linecap="round"/></g>`;
  return `<g class="poster-botanical" aria-hidden="true" opacity=".67">${tree(943,731,.62)}${tree(1041,712,.96)}${tree(1152,746,.59)}<path d="M873 788Q1008 776 1233 790M906 797H976M1086 801H1178M911 783l-4-11m13 10 5-10m227 12-3-12m10 13 6-9" fill="none" stroke="#adcab8" stroke-width="1.4" stroke-linecap="round"/><g transform="translate(1218 114) rotate(-20)" fill="none" stroke="#89b59f" stroke-width="1.6"><path d="M-36 34Q12-4 19-52"/><path d="M-17 18Q-51 7-41-13Q-16-15-12 11M1-4Q-23-26-4-39Q17-32 6-12M13-27Q6-51 24-59Q39-44 19-29M-23 22Q1 35 14 15Q-2 1-19 17M0-2Q29 7 34-15Q16-25 5-7"/></g></g>`;
}

export function renderReferenceMap({pois,visibleIds=pois?.map(p=>p.id),selectedId,routeCodes=[],zoom=1,center,lang='vi'}={}){
  lang=copy[lang]?lang:'vi';
  const labels=copy[lang];
  const viewport=mapViewport(zoom,center);
  const byCode=new Map((pois||[]).map(p=>[p.code,p]));
  const visible=new Set(visibleIds),filtered=pois && visible.size<pois.length;
  const attributes=(p,name)=>p && visible.has(p.id)?`class="map-stop" role="button" tabindex="0" data-id="${escape(p.id)}" aria-label="${escape(name)}" aria-pressed="${p.id===selectedId}"`:'';
  const positions=new Map(REFERENCE_STOPS.map(([n,x,y])=>[String(n),{x,y}]));
  positions.set('0',{x:385,y:817});positions.set('coord-01',positions.get('0'));
  const route=routeCodes.slice(1).map((code,i)=>{
    const a=positions.get(String(routeCodes[i])),b=positions.get(String(code));
    return a&&b?`<path class="map-route" d="M${a.x},${a.y}L${b.x},${b.y}"/>`:'';
  }).join('');
  const road='M385 770C397 724 404 682 426 625S470 547 482 505 490 438 505 415C540 391 595 378 649 358S743 324 820 316 897 308 934 299 1049 302 1111 301L1263 296';
  const trail='M124 88L148 133 198 170 238 207 283 246 331 285 374 317 421 345 466 376 505 415';
  const branches='M320 742L396 737M329 619L383 575 416 661M354 585L390 665 418 669M437 428L466 376M361 389L377 323M218 318L279 282M216 245L246 214M149 213L182 173M96 182L134 141';
  const stops=REFERENCE_STOPS.map(([n,x,y,,,type,tx,ty,anchor])=>{
    const p=byCode.get(String(n)),active=!!p && p.id===selectedId,small=n===1 || n===12;
    const name=referenceStopName(n,lang,p),fontSize=small?15.5:18;
    const measured=textWidth(name,fontSize);
    const slot=anchor==='end'?tx-20:anchor==='middle'?2*Math.min(tx-18,MAP_WIDTH-tx-18):MAP_WIDTH-tx-20;
    const available=Math.min(slot,n===14?140:n===15?200:Infinity);
    const labelWidth=Math.min(measured,available),width=labelWidth+24,height=32;
    const fit=` style="font-size:${Math.min(fontSize,fontSize*available/Math.max(measured,1))}px" textLength="${labelWidth}" lengthAdjust="spacingAndGlyphs"`;
    const bx=anchor==='end'?tx-width+10:anchor==='middle'?tx-width/2:tx-10;
    return `<g data-reference-stop="${n}" ${attributes(p,name)}${filtered && !visible.has(p?.id)?' opacity=".2"':''}><title>${p?.visitorNumber || n}. ${escape(name)}</title><rect class="poster-label-box" x="${bx}" y="${ty-23}" width="${width}" height="${height}" rx="9"/>${active?`<circle class="poster-selected" cx="${x}" cy="${y}" r="27"/>`:''}${number(p?.visitorNumber || n,x,y,type,18,active)}<text class="poster-name${small?' poster-name-small':''}" x="${tx}" y="${ty}" text-anchor="${anchor}"${fit}>${escape(name)}</text></g>`;
  }).join('');
  const distances=[[158,130,'2km'],[254,179,'1km'],[205,196,'0,5km'],[300,238,'3km'],[368,287,'4,5km'],[430,328,'2km'],[529,378,'0,5km'],[287,300,'5km'],[707,319,'3,6km'],[1028,277,'0,7km'],[480,492,'0,1km'],[474,596,'0,6km'],[350,644,'0,2km'],[440,716,'0,7km']].map(([x,y,label])=>`<text class="poster-distance" x="${x}" y="${y}">${escape(lang==='vi'?label:label.replace(',','.'))}</text>`).join('');
  const centerPoi=byCode.get('coord-01'),centerSelected=!!centerPoi && centerPoi.id===selectedId;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewport.viewBox}" class="reference-map" lang="${lang}" role="${pois?'group':'img'}" aria-labelledby="poster-title poster-description">
  <title id="poster-title">${escape(labels.title)}</title><desc id="poster-description">${escape(labels.description)}</desc>
  <defs><linearGradient id="poster-ground" x2=".15" y2="1"><stop stop-color="#f6faf8"/><stop offset="1" stop-color="#e4f0eb"/></linearGradient><radialGradient id="poster-canopy"><stop stop-color="#b4dccc" stop-opacity=".52"/><stop offset="1" stop-color="#b4dccc" stop-opacity="0"/></radialGradient><pattern id="poster-paper" width="39" height="39" patternUnits="userSpaceOnUse"><circle cx="11" cy="8" r=".7" fill="#8db2a1" opacity=".15"/><circle cx="31" cy="29" r=".6" fill="#8db2a1" opacity=".12"/></pattern></defs>
  <rect x="${MAP_LEFT}" y="${MAP_TOP}" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" fill="url(#poster-ground)"/>
  <rect width="1400" height="990" fill="url(#poster-paper)"/>
  <circle cx="30" cy="865" r="400" fill="url(#poster-canopy)"/>
  <circle cx="1370" cy="150" r="340" fill="url(#poster-canopy)" opacity=".55"/>
  ${botanicalArtwork()}
  <g fill="#174f40"><text x="635" y="67" font-size="14" font-weight="600" letter-spacing="3.5">${escape(labels.park)}</text><text x="630" y="135" font-size="64" font-weight="650" letter-spacing="1">${escape(labels.place)}</text><text x="635" y="174" font-size="15" font-weight="450" letter-spacing="2.5" fill="#6c8c7c">${escape(labels.map)}</text></g>
  <path d="${trail}" fill="none" stroke="#8ca786" stroke-width="3.6" stroke-dasharray="10 9" stroke-linecap="round"/>
  <path d="${branches}" fill="none" stroke="#a5bca0" stroke-width="2" stroke-dasharray="4 6" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="#9bbfb0" stroke-opacity=".32" stroke-width="18" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="#fbfffd" stroke-width="12" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="#25826b" stroke-width="7" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="#8ad3b3" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M394 742L423 762" stroke="#25826b" stroke-width="4" stroke-linecap="round"/>
  ${distances}${stopSign(124,88,labels.stop)}${stopSign(1263,296,labels.stop)}
  ${water(124,348,375,labels.water)}${water(544,287,252,labels.water)}${water(273,775,823,labels.water)}${water(1026,343,414,labels.water)}
  ${route}${stops}
  <g transform="translate(459 762)"><circle r="23" fill="#f5fcf9" stroke="#9ccbbd" stroke-width="1.7"/><path d="M-13 2H13L8 10H-9Z" fill="#508e84"/><path d="M-4-9H4V3H-4Z" fill="#508e84"/><path d="M-12 13Q-8 10-4 13T4 13T12 13" fill="none" stroke="#508e84" stroke-width="1.6"/></g><text class="poster-name" x="500" y="768">${escape(labels.ferry)}</text>
  <g ${attributes(centerPoi,labels.center)}><g transform="translate(385 817)">${centerSelected?'<circle class="poster-selected" r="37"/>':''}<circle r="28" fill="#f6fcf8" stroke="#69a387" stroke-width="2.5"/><path d="M-15 0L0-15 15 0H10V15H-9V0Z" fill="#377f60"/><path d="M-3 15V4H4V15" fill="#f6fcf8"/></g><rect class="poster-label-box" x="422" y="800" width="${textWidth(labels.center,18)+24}" height="32" rx="9"/><text class="poster-name" x="433" y="823">${escape(labels.center)}</text></g>
  <g class="poster-legend"><path d="M68 927H108" stroke="#25826b" stroke-width="5" stroke-linecap="round"/><text x="122" y="932">${escape(labels.road)}</text><path d="M252 927H296" stroke="#8ca786" stroke-width="3.4" stroke-dasharray="9 7" stroke-linecap="round"/><text x="312" y="932">${escape(labels.trail)}</text></g>
  </svg>`;
}
