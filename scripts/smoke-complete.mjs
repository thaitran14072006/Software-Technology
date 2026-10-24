import assert from 'node:assert/strict';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
try{process.loadEnvFile(new URL('../backend/.env',import.meta.url));}catch{}
const require=createRequire(new URL('../backend/package.json',import.meta.url));const {Client}=require('pg');
const base=process.env.SMOKE_URL||'http://127.0.0.1:4173';
assert.equal(process.env.DATABASE_URL,'postgres://sag:sag@localhost:5432/sag','This test only changes isolated fixtures in the local demo database.');
const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
const uid=randomUUID(),email=`qa-${uid}@example.test`,password=randomBytes(18).toString('hex'),salt=randomBytes(16).toString('hex'),mapId='00000000-0000-0000-0000-000000000001';
const results=[];let token='',refresh='',poi,qr,ping=randomUUID(),originalConfig;
const pass=name=>{results.push(name);console.log('PASS '+name);};
async function call(p,method='GET',body,auth=token){
 const form=body instanceof FormData;
 const res=await fetch(base+p,{method,headers:{...(form?{}:{'content-type':'application/json'}),...(auth?{authorization:`Bearer ${auth}`}:{})},body:body===undefined?undefined:form?body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}return {status:res.status,data};
}
function formMp3(data){const form=new FormData();form.set('langCode','vi');form.set('voiceGender','FEMALE');form.set('file',new Blob([data],{type:'audio/mpeg'}),'guide.mp3');return form;}
try{
 await db.query("INSERT INTO users(id,email,password_hash,full_name,role) VALUES($1,$2,$3,'QA fixture','ADMIN')",[uid,email,`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`]);
 assert.equal((await call(`/content-api/pois?mapId=${mapId}&lang=vi`,'GET',undefined,'')).status,200);
 assert.equal((await call('/content-api/admin/pois','GET',undefined,'')).status,401);pass('Visitors browse without login; administration requires authentication');
 assert.equal((await call('/content-api/auth/login','POST',{email,password:'wrong'},'')).status,401);
 const login=await call('/content-api/auth/login','POST',{email,password},'');assert.equal(login.status,201,JSON.stringify(login.data));token=login.data.accessToken;refresh=login.data.refreshToken;
 assert.equal((await call('/content-api/auth/me')).data.sub,uid);pass('Admin login, wrong-password rejection and current account');
 const rotate=await call('/content-api/auth/refresh','POST',{refreshToken:refresh},'');assert.equal(rotate.status,201);assert.equal((await call('/content-api/auth/refresh','POST',{refreshToken:refresh},'')).status,401);token=rotate.data.accessToken;refresh=rotate.data.refreshToken;pass('Refresh rotation rejects reused tokens');
 const fixture={code:`qa-${uid.slice(0,12)}`,mapId,latitude:11.4,longitude:107.4,geoVerified:false,status:'PUBLISHED',audioMode:'TTS',translations:[{langCode:'vi',name:'QA isolated POI',scriptText:'Nội dung kiểm thử thứ nhất.'}]};
 const created=await call('/content-api/admin/pois','POST',fixture);assert.equal(created.status,201,JSON.stringify(created.data));poi=created.data.id;
 assert.equal((await call(`/content-api/admin/pois/${poi}`,'PATCH',{translations:[fixture.translations[0],fixture.translations[0]]})).status,400);
 assert.equal((await call(`/content-api/admin/pois/${poi}`,'PATCH',{translations:[{...fixture.translations[0],scriptText:' '}]})).status,400);pass('POI creation, duplicate-language and empty-content validation');
 const frame=Buffer.alloc(417);frame.set([255,251,144,0]);const mp3=Buffer.concat([frame,frame,frame]);
 assert.equal((await call(`/content-api/admin/pois/${poi}/audios/upload`,'POST',formMp3(Buffer.from('not an mp3')))).status,400);
 const uploaded=await call(`/content-api/admin/pois/${poi}/audios/upload`,'POST',formMp3(mp3));assert.equal(uploaded.status,201,JSON.stringify(uploaded.data));
 const published=await call(`/content-api/pois/${poi}?lang=vi`,'GET',undefined,'');assert.ok(published.data.audio.url.startsWith('/audio-assets/'));
 const file=await fetch(base+published.data.audio.url);assert.equal(file.status,200);assert.equal((await file.arrayBuffer()).byteLength,mp3.length);pass('MP3 upload validation, publication and same-origin asset proxy');
 await new Promise(r=>setTimeout(r,2500));const stable=await call(`/content-api/pois/${poi}`);assert.equal(stable.data.audio.url,published.data.audio.url);pass('Superseded TTS job cannot overwrite uploaded audio');
 const before=(await call(`/content-api/sync/manifest?mapId=${mapId}&lang=vi&since=0`,'GET',undefined,'')).data.rev;
 const writes=await Promise.all(['B','C'].map(label=>call(`/content-api/admin/pois/${poi}`,'PATCH',{translations:[{...fixture.translations[0],scriptText:`Phiên bản ${label}.`}]})));assert.ok(writes.every(w=>w.status===200));
 const delta=await call(`/content-api/sync/manifest?mapId=${mapId}&lang=vi&since=${before}`,'GET',undefined,'');assert.equal(delta.status,200);assert.ok(delta.data.rev>before);assert.ok(delta.data.items.some(p=>p.id===poi&&p.audio===null));pass('Serialized concurrent edits produce a complete offline delta and invalidate stale MP3');
 const newQr=await call('/content-api/admin/qr','POST',{kind:'POI',poiId:poi});assert.equal(newQr.status,201);qr=newQr.data;
 assert.equal((await call(`/qr-api/qr/${qr.token}`,'GET',undefined,'')).status,200);
 await call(`/content-api/admin/qr/${qr.id}`,'PATCH',{isActive:false});assert.equal((await call(`/qr-api/qr/${qr.token}`,'GET',undefined,'')).status,404);
 await call(`/content-api/admin/qr/${qr.id}`,'PATCH',{isActive:true});await call(`/content-api/admin/pois/${poi}`,'PATCH',{status:'DRAFT'});assert.equal((await call(`/qr-api/qr/${qr.token}`,'GET',undefined,'')).status,404);pass('QR disable and unpublished-POI protection');
 const beacon=await call('/content-api/admin/beacons','POST',{poiId:poi,uuid:randomUUID(),major:1,minor:2});assert.equal(beacon.status,201,JSON.stringify(beacon.data));
 assert.ok(!(await call('/qr-api/beacons','GET',undefined,'')).data.some(b=>b.poiId===poi));
 await call(`/content-api/admin/pois/${poi}`,'PATCH',{status:'PUBLISHED'});assert.ok((await call('/qr-api/beacons','GET',undefined,'')).data.some(b=>b.poiId===poi));
 await call(`/content-api/admin/beacons/${beacon.data.id}`,'PATCH',{isActive:false});assert.ok(!(await call('/qr-api/beacons','GET',undefined,'')).data.some(b=>b.poiId===poi));pass('Beacon registry filters unpublished POIs and disabled beacons');
 originalConfig=(await call('/content-api/configs','GET',undefined,'')).data.default_trigger_radius_m;
 assert.equal((await call('/content-api/admin/configs','PATCH',{key:'default_trigger_radius_m',value:25})).status,200);assert.equal((await call('/content-api/configs','GET',undefined,'')).data.default_trigger_radius_m,25);
 await call('/content-api/admin/configs','PATCH',{key:'default_trigger_radius_m',value:originalConfig});pass('Admin config is consumed by the public config API');
 const location={id:ping,sessionId:randomUUID(),mapId,latitude:11.4,longitude:107.4,accuracy:5,recordedAt:new Date().toISOString(),consent:false};
 assert.equal((await call('/content-api/tracking/locations','POST',location,'')).status,400);
 const accepted=await call('/content-api/tracking/locations','POST',{...location,consent:true},'');assert.equal(accepted.status,201,JSON.stringify(accepted.data));assert.equal(accepted.data.recorded,true);
 assert.equal((await call('/content-api/admin/analytics/heatmap','GET',undefined,'')).status,401);assert.equal((await call('/content-api/admin/analytics/heatmap')).status,200);pass('Anonymous opt-in tracking and protected heatmap');
 const logs=await call('/content-api/admin/audit-logs');assert.ok(logs.data.some(l=>l.user_id===uid));pass('Admin changes write persistent audit logs');
 await db.query('UPDATE users SET is_active=false WHERE id=$1',[uid]);assert.equal((await call('/content-api/admin/pois')).status,401);await db.query('UPDATE users SET is_active=true WHERE id=$1',[uid]);pass('Disabled admin cannot continue using a previously issued access token');
 await db.query("UPDATE users SET role='EDITOR' WHERE id=$1",[uid]);assert.equal((await call('/content-api/admin/pois')).status,403);assert.equal((await call('/content-api/auth/login','POST',{email,password},'')).status,401);await db.query("UPDATE users SET role='ADMIN' WHERE id=$1",[uid]);pass('Only ADMIN can manage; visitors have no account or login requirement');
 await call('/content-api/auth/logout','POST',{refreshToken:refresh},'');assert.equal((await call('/content-api/auth/refresh','POST',{refreshToken:refresh},'')).status,401);assert.equal((await call('/content-api/admin/pois')).status,401);pass('Logout immediately revokes the admin session and its access token');
 await mkdir(new URL('../backend/.runtime/',import.meta.url),{recursive:true});await writeFile(new URL('../backend/.runtime/verification.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),passed:results},null,2));
 console.log(`PASS ${results.length} end-to-end groups; fixture MP3 tests transport/structure, not narration quality.`);
}finally{
 if(originalConfig!==undefined)await db.query('UPDATE app_configs SET value=$1::jsonb WHERE key=$2',[JSON.stringify(originalConfig),'default_trigger_radius_m']);
 await db.query('DELETE FROM location_pings WHERE id=$1',[ping]);
 if(poi){await db.query('DELETE FROM audio_listen_events WHERE poi_id=$1',[poi]);await db.query('DELETE FROM pois WHERE id=$1',[poi]);}
 await db.query('DELETE FROM audit_logs WHERE user_id=$1',[uid]);await db.query('DELETE FROM users WHERE id=$1',[uid]);await db.end();
}
