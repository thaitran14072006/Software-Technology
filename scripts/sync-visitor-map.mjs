// Explicit migration to the user's fifteen poster stops. No synthesis or job enqueue.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {REFERENCE_STOPS,referenceStopName} from '../web/reference-map.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../backend/package.json',import.meta.url));const {Client}=require('pg');
try{process.loadEnvFile(path.join(root,'backend/.env'));}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=b=>createHash('sha256').update(b).digest('hex');
const seed=JSON.parse(await readFile(path.join(root,'web/dist/data/pois.json'),'utf8'));
const old=JSON.parse(await readFile(path.join(root,'backend/fixtures/content.json'),'utf8'));
const sources=[...seed.pois,...(seed.schematicPois||[])];
const codes=REFERENCE_STOPS.map(([n])=>String(n)),langs=['vi','en','ja','ko','zh'];
const mapId='00000000-0000-0000-0000-000000000001';const fixture=[],points=[],assets=[];
for(const [number,x,y,,,type] of REFERENCE_STOPS){
 const code=String(number),s=sources.find(p=>p.code===code);if(!s)throw Error('Missing poster source '+code);
 if(s.translations.length!==5)throw Error('Five translations required: '+code);
 if(!Number.isFinite(s.lat)||!Number.isFinite(s.lng))throw Error('Missing explicitly sourced/estimated coordinates '+code);
 const names=Object.fromEntries(langs.map(l=>[l,referenceStopName(code,l)]));
 const p={code,map_id:mapId,category_id:s.categoryId,latitude:s.lat,longitude:s.lng,geo_verified:false,geo_source_url:s.geoSourceUrl,schematic_x:x,schematic_y:y,trigger_radius_m:s.triggerRadiusM||10,status:'PUBLISHED',sort_order:number,translations:[]};
 for(const lang of langs){
  const tr=s.translations.find(t=>t.langCode===lang),text=tr.scriptText.trim(),textHash=hash(text);
  const t={lang_code:lang,name:names[lang],summary:tr.summary||'',script_text:text,text_hash:textHash};
  const a=s.audios?.find(a=>a.langCode===lang&&a.status==='READY'&&a.textHash===textHash&&a.audioUrl?.startsWith('/audio/'));
  if(a){
   const audioPath=path.resolve(root,'web/dist','.'+a.audioUrl);if(!audioPath.startsWith(path.join(root,'web/dist')+path.sep))throw Error('Unsafe audio path');
   const bytes=await readFile(audioPath),sha=hash(bytes),file=`audio/${code}-${lang}-${sha.slice(0,12)}.mp3`;
   t.audio={file,sha256:sha,sizeBytes:bytes.length,durationSec:a.durationSec??null,voiceGender:'FEMALE',voiceName:a.voiceName,provider:a.provider||'GEMINI'};
   assets.push({file,sha,bytes});
  }
  p.translations.push(t);
 }
 fixture.push(p);points.push({order:number,code,name:names.vi,latitude:p.latitude,longitude:p.longitude,categoryId:p.category_id,geoSourceUrl:p.geo_source_url,names});
}
const catalog={version:2,source:'Fifteen numbered stops from the visitor schematic selected by the user; GPS estimates are not field verified.',sourceSha256:hash(JSON.stringify(points)),points};
console.log(JSON.stringify({apply:process.argv.includes('--apply'),pois:fixture.length,translations:fixture.reduce((n,p)=>n+p.translations.length,0),existingAudio:assets.length,codes,noSynthesis:true}));
if(!process.argv.includes('--apply'))process.exit(0);
const db=new Client({connectionString:process.env.DATABASE_URL||'postgres://sag:sag@127.0.0.1:5432/sag',connectionTimeoutMillis:5000});await db.connect();
const backup=path.join(root,'backend/.runtime/visitor-map-backups',String(Date.now()));await mkdir(backup,{recursive:true});
try{
 await db.query('BEGIN');await db.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const {rows:[running]}=await db.query("SELECT count(*)::int n FROM tts_jobs WHERE status='RUNNING'");if(running.n)throw Error('Stop synthesis workers before changing catalog');
 const before={};for(const table of ['pois','poi_translations','poi_audios','poi_qr_codes','tts_jobs'])before[table]=(await db.query('SELECT * FROM '+table)).rows;
 await writeFile(path.join(backup,'database.json'),JSON.stringify(before,null,2));
 await copyFile(path.join(root,'backend/fixtures/content.json'),path.join(backup,'content.json'));await copyFile(path.join(root,'scripts/data/active-pois.json'),path.join(backup,'active-pois.json'));
 for(const p of fixture){
  const {rows:[poi]}=await db.query(`INSERT INTO pois(code,map_id,category_id,latitude,longitude,geo_verified,geo_source_url,schematic_x,schematic_y,trigger_radius_m,status,sort_order) VALUES($1,$2,$3,$4,$5,false,$6,$7,$8,$9,'PUBLISHED',$10) ON CONFLICT(code) DO UPDATE SET deleted_at=NULL,status='PUBLISHED',sort_order=$10,category_id=$3,latitude=$4,longitude=$5,geo_verified=false,geo_source_url=$6,schematic_x=$7,schematic_y=$8,version=pois.version+1 RETURNING id`,[p.code,mapId,p.category_id,p.latitude,p.longitude,p.geo_source_url,p.schematic_x,p.schematic_y,p.trigger_radius_m,p.sort_order]);
  for(const t of p.translations){
   const {rows:[tr]}=await db.query(`INSERT INTO poi_translations(poi_id,lang_code,name,summary,script_text,text_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(poi_id,lang_code) DO UPDATE SET name=$3,summary=$4,script_text=$5,text_hash=$6 RETURNING id`,[poi.id,t.lang_code,t.name,t.summary,t.script_text,t.text_hash]);
   await db.query("UPDATE tts_jobs SET status='FAILED',finished_at=now(),lease_until=NULL,error_message='REPLACED_BY_VISITOR_MAP_CATALOG' WHERE audio_id IN (SELECT id FROM poi_audios WHERE translation_id=$1) AND status='QUEUED'",[tr.id]);
   await db.query("UPDATE poi_audios SET status='PENDING',audio_url=NULL,current_job_id=NULL WHERE translation_id=$1 AND text_hash IS DISTINCT FROM $2",[tr.id,t.text_hash]);
   if(t.audio){
    const a=t.audio,key=`audio/shared/${a.sha256}.mp3`,dest=path.join(root,'backend/storage',key);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,assets.find(b=>b.sha===a.sha256).bytes);
    await db.query(`INSERT INTO poi_audios(translation_id,poi_id,lang_code,voice_gender,source,status,provider,voice_name,audio_url,duration_sec,size_bytes,text_hash) VALUES($1,$2,$3,'FEMALE','TTS','READY',$4,$5,$6,$7,$8,$9) ON CONFLICT(translation_id,voice_gender) DO UPDATE SET status='READY',source='TTS',provider=$4,voice_name=$5,audio_url=$6,duration_sec=$7,size_bytes=$8,text_hash=$9,current_job_id=NULL`,[tr.id,poi.id,t.lang_code,a.provider,a.voiceName,'/audio-assets/'+key,a.durationSec,a.sizeBytes,t.text_hash]);
   }
  }
  await db.query("INSERT INTO poi_qr_codes(kind,poi_id,token) SELECT 'POI',$1,replace(gen_random_uuid()::text,'-','') WHERE NOT EXISTS(SELECT 1 FROM poi_qr_codes WHERE poi_id=$1 AND kind='POI')",[poi.id]);
 }
 await db.query("UPDATE pois SET status='ARCHIVED',deleted_at=now(),version=version+1 WHERE map_id=$1 AND NOT(code=ANY($2)) AND deleted_at IS NULL",[mapId,codes]);
 await db.query("UPDATE tts_jobs SET status='FAILED',finished_at=now(),lease_until=NULL,error_message='POI_ARCHIVED_BY_VISITOR_MAP_CATALOG' WHERE status='QUEUED' AND audio_id IN(SELECT a.id FROM poi_audios a JOIN pois p ON p.id=a.poi_id WHERE p.map_id=$1 AND p.deleted_at IS NOT NULL)",[mapId]);
 await db.query("INSERT INTO app_configs(key,value) VALUES('active_poi_catalog',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[JSON.stringify({version:catalog.sourceSha256,codes})]);
 const {rows:[clock]}=await db.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await db.query('UPDATE pois SET rev=$1,updated_at=now() WHERE map_id=$2',[clock.rev,mapId]);
 for(const a of assets)await writeFile(path.join(root,'backend/fixtures',a.file),a.bytes);
 await writeFile(path.join(root,'backend/fixtures/content.json'),JSON.stringify({formatVersion:1,exportedAt:new Date().toISOString(),pois:fixture},null,2)+'\n');
 await writeFile(path.join(root,'scripts/data/active-pois.json'),JSON.stringify(catalog,null,2)+'\n');
 await db.query('COMMIT');console.log(JSON.stringify({backup,updated:true,noJobsCreated:true}));
}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
