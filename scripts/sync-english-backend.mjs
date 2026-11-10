import {withSchematicNarration} from '../web/schematic-content.mjs';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../backend/package.json',import.meta.url));
process.loadEnvFile(path.join(root,'backend/.env'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const fixture=JSON.parse(await readFile(path.join(root,'backend/fixtures/content.json'),'utf8'));
const manifest=JSON.parse(await readFile(path.join(root,'web/narration-audio/manifest.json'),'utf8'));
const candidates=[];
for(const p of fixture.pois){const t=p.translations.find(t=>t.lang_code==='en');if(t?.audio)candidates.push({code:p.code,textHash:t.text_hash,...t.audio,file:'backend/fixtures/'+t.audio.file});}
for(const [key,a] of Object.entries(manifest)){const [code,lang]=key.split(':');if(lang==='en')candidates.push({code,...a,file:'web/narration-audio/'+a.file,sizeBytes:a.bytes});}
const db=new (require('pg').Client)({connectionString:process.env.DATABASE_URL});await db.connect();
try{await db.query('BEGIN');await db.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');const ids=[];
if(process.argv.includes('--use-demo')){
 for(const p of withSchematicNarration([],'en').filter(p=>['3','4','6','12'].includes(p.code))){
  await db.query("UPDATE poi_translations t SET script_text=$1,text_hash=$2 FROM pois p WHERE t.poi_id=p.id AND p.code=$3 AND t.lang_code='en' AND p.deleted_at IS NULL",[p.scriptText,hash(p.scriptText),p.code]);
 }
}
const rows=(await db.query("SELECT p.id AS poi_id,p.code,t.id AS translation_id,t.text_hash FROM pois p JOIN poi_translations t ON t.poi_id=p.id WHERE p.deleted_at IS NULL AND t.lang_code='en' AND p.code IN ('1','3','4','5','6','7','12')")).rows;
const only=process.argv.find(a=>a.startsWith('--codes='))?.slice(8).split(',');
for(const r of rows){if(only&&!only.includes(r.code))continue;const a=candidates.find(a=>a.code===r.code&&a.textHash===r.text_hash);if(!a)throw Error('No matching English MP3 '+r.code);const bytes=await readFile(path.join(root,a.file));if(a.sha256&&hash(bytes)!==a.sha256)throw Error('Checksum mismatch '+r.code);const key='audio/shared/'+hash(bytes)+'.mp3';const dest=path.resolve(root,'backend',process.env.STORAGE_LOCAL_DIR||'storage',key);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);
await db.query("UPDATE tts_jobs SET status='FAILED',lease_until=NULL,finished_at=now(),error_message='REPLACED_BY_SHARED_GOOGLE_AUDIO' WHERE id IN (SELECT current_job_id FROM poi_audios WHERE translation_id=$1 AND voice_gender='FEMALE') AND status IN ('QUEUED','RUNNING')",[r.translation_id]);
await db.query(`INSERT INTO poi_audios(translation_id,poi_id,lang_code,voice_gender,source,status,provider,voice_name,audio_url,size_bytes,text_hash) VALUES($1,$2,'en','FEMALE','TTS','READY','GEMINI',$3,$4,$5,$6) ON CONFLICT(translation_id,voice_gender) DO UPDATE SET status='READY',source='TTS',provider='GEMINI',voice_name=EXCLUDED.voice_name,audio_url=EXCLUDED.audio_url,size_bytes=EXCLUDED.size_bytes,text_hash=EXCLUDED.text_hash,current_job_id=NULL`,[r.translation_id,r.poi_id,a.voiceName,'/audio-assets/'+key,bytes.length,r.text_hash]);ids.push(r.poi_id);console.log('Synced English',r.code);}
if(ids.length){const {rows:[v]}=await db.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await db.query('UPDATE pois SET rev=$1 WHERE id=ANY($2::uuid[])',[v.rev,ids]);}await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
