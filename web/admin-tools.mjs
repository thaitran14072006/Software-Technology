import {api,settings,saveSettings} from './store.mjs';
import {qrSVG} from './join-qr.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function heatmapSVG(rows){
 const points=rows.map(p=>({lat:+p.lat,lng:+p.lng,count:+p.count})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.count>0);
 if(!points.length)return '<p>Chưa có vị trí được khách đồng ý chia sẻ.</p>';
 const south=Math.min(...points.map(p=>p.lat))-.0005,north=Math.max(...points.map(p=>p.lat))+.0005,west=Math.min(...points.map(p=>p.lng))-.0005,east=Math.max(...points.map(p=>p.lng))+.0005;
 const max=Math.max(...points.map(p=>p.count)),dx=east-west,dy=north-south;
 const cells=points.map(p=>`<rect x="${50+(p.lng-west-.0005)/dx*600}" y="${30+(north-p.lat-.0005)/dy*300}" width="${600*.001/dx}" height="${300*.001/dy}" fill="hsl(${120-120*p.count/max},75%,45%)" stroke="white"><title>${p.lat}, ${p.lng}: ${p.count} mẫu</title></rect>`).join('');
 return `<svg viewBox="0 0 720 390" role="img" aria-label="Heatmap vị trí khách đồng ý chia sẻ, ô 0,001 độ"><rect x="50" y="30" width="600" height="300" fill="#edf2ec"/>${cells}<text x="50" y="20" fill="currentColor">Bắc ${north.toFixed(4)}°</text><text x="50" y="355" fill="currentColor">Nam ${south.toFixed(4)}° · Tây ${west.toFixed(4)}° · Đông ${east.toFixed(4)}°</text><text x="50" y="380" fill="currentColor">Xanh → đỏ: mật độ thấp → cao; tối đa ${max} mẫu/ô</text></svg>`;
}
export function setupAdminTools({refresh,showAdmin,toast}) {
 const login=document.createElement('section');
 login.innerHTML=`<h3>Đăng nhập quản trị</h3><label class="field">Email<input id="login-email" type="email" autocomplete="username"></label><label class="field">Mật khẩu<input id="login-password" type="password" autocomplete="current-password"></label><div class="dialog-actions"><button id="login-button" class="button primary" type="button">Đăng nhập</button><button id="logout-button" class="button" type="button">Đăng xuất</button></div><p id="login-status" role="status"></p>`;
 document.querySelector('#settings-form').append(login);
 document.querySelector('#login-button').onclick=async()=>{
  try{const out=await api('auth/login',{method:'POST',body:JSON.stringify({email:document.querySelector('#login-email').value,password:document.querySelector('#login-password').value})});
   sessionStorage.setItem('sag:token',out.accessToken);sessionStorage.setItem('sag:refresh',out.refreshToken);document.querySelector('#admin-token').value=out.accessToken;document.querySelector('#login-password').value='';
   saveSettings('api');const pageUrl=new URL(location.href);pageUrl.searchParams.set('source','api');history.replaceState(null,'',pageUrl);document.querySelector('#settings-form input[value="api"]').checked=true;document.querySelector('#login-status').textContent=`Đã đăng nhập: ${out.user.email}`;await refresh();await showAdmin();document.querySelector('#settings-dialog').close();document.querySelector('#admin-tab').click();
  }catch(e){document.querySelector('#login-status').textContent=e.message;}
 };
 document.querySelector('#logout-button').onclick=async()=>{
  const r=sessionStorage.getItem('sag:refresh');if(r)try{await api('auth/logout',{method:'POST',body:JSON.stringify({refreshToken:r})});}catch{}
  sessionStorage.removeItem('sag:token');sessionStorage.removeItem('sag:refresh');document.querySelector('#admin-token').value='';document.querySelector('#login-status').textContent='Đã đăng xuất phiên quản trị. Bạn vẫn dùng được các chức năng tham quan.';document.querySelector('#visitor-tab').click();
 };
 const dialog=document.createElement('dialog');dialog.id='upload-dialog';
 dialog.innerHTML=`<form id="upload-form"><h2>Tải MP3 thuyết minh</h2><p>MP3 tự thu âm, tối đa 20 MB. Chọn đúng bản dịch đã lưu.</p><label class="field">Ngôn ngữ<select name="langCode"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="zh">中文</option></select></label><label class="field">Giọng<select name="voiceGender"><option value="FEMALE">Nữ</option><option value="MALE">Nam</option></select></label><label class="field">File MP3<input name="file" type="file" accept="audio/mpeg,.mp3" required></label><p id="upload-status" role="alert"></p><div class="dialog-actions"><button class="button primary">Tải lên</button><button class="button" id="upload-close" type="button">Đóng</button></div></form>`;
 document.body.append(dialog);let poiId;
 document.querySelector('#upload-close').onclick=()=>dialog.close();
 document.querySelector('#admin-list').addEventListener('click',e=>{const b=e.target.closest('[data-upload]');if(!b)return;poiId=b.dataset.upload;document.querySelector('#upload-status').textContent='';dialog.showModal();});
 document.querySelector('#admin-list').addEventListener('click',async e=>{
  const b=e.target.closest('[data-generate]');if(!b)return;b.disabled=true;
  try{
   const config=await api('configs');if(!['LOCAL','GEMINI'].includes(config.tts_provider))throw new Error('Khởi chạy dev:gemini để tạo giọng AI Studio hoặc dev:local-tts để dùng engine cục bộ.');
   if(config.tts_paused_until && Date.parse(config.tts_paused_until)>Date.now())throw new Error('Google quota exhausted. '+config.tts_paused_until);
   const p=await api(`admin/pois/${b.dataset.generate}`);let queued=0;
   for(const t of p.translations)queued+=(await api(`admin/pois/${p.id}/audios/generate`,{method:'POST',body:JSON.stringify({langCode:t.langCode,voiceGender:'FEMALE'})})).queued;
   toast(`Đã xếp ${queued} bản vào hàng đợi ${config.tts_provider}. Bản thu âm đã sẵn sàng được giữ lại.`);
  }catch(err){toast(err.message,true);}finally{b.disabled=false;}
 });
 document.querySelector('#upload-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await api(`admin/pois/${poiId}/audios/upload`,{method:'POST',body:new FormData(e.target)});dialog.close();toast('Đã lưu MP3. Hãy tải lại gói ngoại tuyến để nhận file mới.');await refresh();await showAdmin();}catch(err){document.querySelector('#upload-status').textContent=err.message;}finally{button.disabled=false;}};
 const tools=document.createElement('section');tools.className='field-kit';
 tools.innerHTML=`<h2>Cấu hình và mã tại điểm tham quan</h2><p>Chức năng dùng backend và tài khoản quản trị.</p><button id="tools-load" class="button">Tải QR, beacon, job và nhật ký</button><p id="tools-status" role="status"></p><div id="tools-data"></div><form id="config-form"><h3>Cấu hình tự phát</h3><label class="field">Bán kính mặc định (m)<input name="radius" type="number" min="3" max="200" value="10" required></label><label class="field">Thời gian không phát lại (phút)<input name="cooldown" type="number" min="1" max="200" value="30" required></label><button class="button">Lưu cấu hình (ADMIN)</button></form><form id="beacon-form"><h3>Đăng ký beacon</h3><label class="field">POI ID<input name="poiId" required></label><label class="field">Beacon UUID<input name="uuid" required></label><label class="field">Major<input name="major" type="number" min="0" max="65535" required></label><label class="field">Minor<input name="minor" type="number" min="0" max="65535" required></label><button class="button">Đăng ký beacon</button></form><details><summary>Thống kê vị trí đã được khách đồng ý chia sẻ</summary><button class="button" id="heatmap-load">Xem các vùng có lượt ghé</button><div id="heatmap-data"></div></details>`;
 document.querySelector('#admin').append(tools);
 async function load(){
  if(settings.mode!=='api')throw new Error('Chọn Backend NestJS và đăng nhập trước.');
  const [qr,beacons,jobs,audit,configs]=await Promise.all(['qr','beacons','tts-jobs','audit-logs','configs'].map(p=>api('admin/'+p)));
  document.querySelector('#tools-data').innerHTML=`<h3>Mã QR từng điểm</h3><div class="table-wrap"><table><thead><tr><th>Điểm</th><th>POI ID</th><th>Mã</th><th>Thao tác</th></tr></thead><tbody>${qr.map(q=>`<tr><td>${esc(q.code||'Cổng')}</td><td>${esc(q.poi_id)}</td><td>${esc(q.token)}</td><td><button class="button" data-qr-svg="${esc(q.token)}">Tải SVG</button><button class="button" data-toggle-qr="${esc(q.id)}" data-active="${!q.is_active}">${q.is_active?'Tắt':'Bật'}</button></td></tr>`).join('')}</tbody></table></div><h3>Beacon</h3><ul>${beacons.map(b=>`<li>${esc(b.uuid)} / ${b.major} / ${b.minor} <button class="button" data-toggle-beacon="${esc(b.id)}" data-active="${!b.is_active}">${b.is_active?'Tắt':'Bật'}</button></li>`).join('')||'<li>Chưa đăng ký beacon.</li>'}</ul><h3>100 job mới nhất</h3><ul>${jobs.map(j=>`<li>${esc(j.status)} · ${esc(j.error_message||j.id)}</li>`).join('')||'<li>Chưa có job; chế độ miễn phí dùng MP3 upload/giọng thiết bị.</li>'}</ul><h3>Nhật ký thay đổi gần đây</h3><ul>${audit.slice(0,20).map(a=>`<li>${esc(a.action)} · ${esc(a.diff?.path)} · ${esc(a.created_at)}</li>`).join('')}</ul>`;
  const cfg=Object.fromEntries(configs.map(c=>[c.key,c.value]));document.querySelector('#config-form [name=radius]').value=cfg.default_trigger_radius_m;document.querySelector('#config-form [name=cooldown]').value=cfg.replay_audio_cooldown_min;
 }
 document.querySelector('#tools-load').onclick=()=>load().catch(e=>document.querySelector('#tools-status').textContent=e.message);
 tools.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
  try{if(b.dataset.qrSvg){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([qrSVG(`sag://poi/${b.dataset.qrSvg}`)],{type:'image/svg+xml'}));a.href=url;a.download=`poi-${b.dataset.qrSvg}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
   if(b.dataset.toggleQr||b.dataset.toggleBeacon){await api(`admin/${b.dataset.toggleQr?'qr':'beacons'}/${b.dataset.toggleQr||b.dataset.toggleBeacon}`,{method:'PATCH',body:JSON.stringify({isActive:b.dataset.active==='true'})});await load();}
  }catch(err){document.querySelector('#tools-status').textContent=err.message;}
 });
 document.querySelector('#config-form').onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target);for(const [key,value]of [['default_trigger_radius_m',+f.get('radius')],['replay_audio_cooldown_min',+f.get('cooldown')]])await api('admin/configs',{method:'PATCH',body:JSON.stringify({key,value})});toast('Đã lưu cấu hình.');await refresh();}catch(err){toast(err.message,true);}};
 document.querySelector('#beacon-form').onsubmit=async e=>{e.preventDefault();try{const b=Object.fromEntries(new FormData(e.target));b.major=+b.major;b.minor=+b.minor;await api('admin/beacons',{method:'POST',body:JSON.stringify(b)});await load();toast('Đã đăng ký beacon.');}catch(err){toast(err.message,true);}};
 document.querySelector('#heatmap-load').onclick=async()=>{try{const rows=await api('admin/analytics/heatmap');document.querySelector('#heatmap-data').innerHTML=`<p>Ô tọa độ làm tròn 0,001 độ; lưu tối đa 7 ngày. Đây là heatmap trên lưới tọa độ, không phải bản đồ đường đi.</p>${heatmapSVG(rows)}<ul>${rows.map(r=>`<li>${r.lat}, ${r.lng}: ${r.count} mẫu vị trí</li>`).join('')}</ul>`;}catch(e){toast(e.message,true);}};
}
