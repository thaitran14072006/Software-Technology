import {api,settings} from './store.mjs';
import {MAP_ID} from './core.mjs';
export const runtimeConfig={default_trigger_radius_m:10,replay_audio_cooldown_min:30};
export async function loadRuntimeConfig(){if(settings.mode==='api')try{Object.assign(runtimeConfig,await api('configs'));}catch{} }
let last=0,sessionId;
const consent=document.createElement('label');consent.className='check';
consent.innerHTML='<input id="location-consent" type="checkbox"> Đồng ý chia sẻ vị trí để thống kê vùng tham quan (tối đa 7 ngày). Có thể bỏ chọn bất cứ lúc nào.';
document.querySelector('.field-kit').append(consent);
export async function sharePosition(pos){
 if(settings.mode!=='api'||!document.querySelector('#location-consent').checked||Date.now()-last<15000)return;
 last=Date.now();sessionId??=crypto.randomUUID();
 try{await api('tracking/locations',{method:'POST',body:JSON.stringify({id:crypto.randomUUID(),sessionId,mapId:MAP_ID,consent:true,latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,recordedAt:new Date().toISOString()})});}catch{}
}
