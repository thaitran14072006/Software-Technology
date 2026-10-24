// Public demo content only. Never restore users, sessions, tokens, analytics or jobs.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
try { process.loadEnvFile(new URL('../backend/.env',import.meta.url)); } catch(e) { if(e.code!=='ENOENT')throw e; }
const fixture=JSON.parse(await readFile(new URL('../backend/fixtures/content.json',import.meta.url),'utf8'));
if(fixture.formatVersion!==1)throw new Error('Unsupported shared content format');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=new Map();
for(const p of fixture.pois)for(const t of p.translations){
 if(hash(t.script_text.trim())!==t.text_hash)throw new Error(`Invalid transcript hash for ${p.code}/${t.lang_code}`);
 if(!t.audio)continue;
 const a=t.audio;
 if(a.provider!=='GEMINI'||!/^audio\/[a-zA-Z0-9_-]+\.mp3$/.test(a.file))throw new Error('Invalid fixture audio metadata');
 const bytes=await readFile(new URL('../backend/fixtures/'+a.file,import.meta.url));
 if(bytes.length!==a.sizeBytes||hash(bytes)!==a.sha256)throw new Error(`Invalid audio checksum: ${a.file}`);
 files.set(a.file,bytes);
}
const backend=fileURLToPath(new URL('../backend/',import.meta.url));
const storage=path.resolve(backend,process.env.STORAGE_LOCAL_DIR||'./storage');
const db=new Client({connectionString:process.env.DATABASE_URL});
await db.connect();
let added=0,audioCount=0;
try{
 await db.query('BEGIN');
 await db.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const ids=[];
 for(const p of fixture.pois){
  const {rows:[created]}=await db.query(`INSERT INTO pois(code,map_id,category_id,latitude,longitude,geo_verified,geo_source_url,schematic_x,schematic_y,trigger_radius_m,image_url,status,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(code) DO NOTHING RETURNING id`,[p.code,p.map_id,p.category_id,p.latitude,p.longitude,p.geo_verified,p.geo_source_url,p.schematic_x,p.schematic_y,p.trigger_radius_m,p.image_url,p.status,p.sort_order]);
  // Re-running startup must never overwrite a collaborator's edits or deleted POIs.
  const poi=created||(await db.query('SELECT id FROM pois WHERE code=$1 AND map_id=$2 AND deleted_at IS NULL',[p.code,p.map_id])).rows[0];
  if(!poi)continue;
  if(created){added++;ids.push(poi.id);}
  for(const t of p.translations){
   const tr=created
    ? (await db.query(`INSERT INTO poi_translations(poi_id,lang_code,name,summary,script_text,text_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,text_hash`,[poi.id,t.lang_code,t.name,t.summary,t.script_text,t.text_hash])).rows[0]
    : (await db.query('SELECT id,text_hash FROM poi_translations WHERE poi_id=$1 AND lang_code=$2',[poi.id,t.lang_code])).rows[0];
   // A newly shared MP3 is usable only with exactly the same current transcript.
   if(!tr||tr.text_hash!==t.text_hash)continue;
   const a=t.audio;
   if(a){
    const {rows:[ready]}=await db.query("SELECT id FROM poi_audios WHERE translation_id=$1 AND status='READY' AND text_hash=$2 AND audio_url IS NOT NULL AND (provider='GEMINI' OR source='UPLOAD')",[tr.id,t.text_hash]);
    if(ready)continue;
    const key=`audio/shared/${a.sha256}.mp3`;
    const destination=path.join(storage,key);
    await mkdir(path.dirname(destination),{recursive:true});
    await writeFile(destination,files.get(a.file));
    await db.query(`UPDATE tts_jobs SET status='FAILED',lease_until=NULL,finished_at=now(),error_message='REPLACED_BY_SHARED_GOOGLE_AUDIO' WHERE id IN (SELECT current_job_id FROM poi_audios WHERE translation_id=$1 AND voice_gender=$2) AND status IN ('QUEUED','RUNNING')`,[tr.id,a.voiceGender]);
    await db.query(`INSERT INTO poi_audios(translation_id,poi_id,lang_code,voice_gender,source,status,provider,voice_name,audio_url,duration_sec,size_bytes,text_hash) VALUES($1,$2,$3,$4,'TTS','READY','GEMINI',$5,$6,$7,$8,$9) ON CONFLICT(translation_id,voice_gender) DO UPDATE SET source='TTS',status='READY',provider='GEMINI',voice_name=EXCLUDED.voice_name,audio_url=EXCLUDED.audio_url,duration_sec=EXCLUDED.duration_sec,size_bytes=EXCLUDED.size_bytes,text_hash=EXCLUDED.text_hash,current_job_id=NULL`,[tr.id,poi.id,t.lang_code,a.voiceGender,a.voiceName,'/audio-assets/'+key,a.durationSec,a.sizeBytes,t.text_hash]);
    audioCount++;
    ids.push(poi.id);
   }else if(created){
    // Missing narrations remain explicit; startup makes no external TTS requests.
    await db.query(`INSERT INTO poi_audios(translation_id,poi_id,lang_code,source,status) VALUES($1,$2,$3,'TTS','PENDING')`,[tr.id,poi.id,t.lang_code]);
   }
  }
 }
 if(ids.length){
  const {rows:[clock]}=await db.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');
  await db.query('UPDATE pois SET rev=$1 WHERE id=ANY($2::uuid[])',[clock.rev,ids]);
 }
 await db.query('COMMIT');
 console.log(`Shared content: added ${added} POIs and ${audioCount} Google recordings; existing POIs retained. No cloud requests made.`);
}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
