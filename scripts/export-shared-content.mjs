import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
process.loadEnvFile(new URL('../backend/.env',import.meta.url));
const previous=JSON.parse(await readFile(new URL('../backend/fixtures/content.json',import.meta.url),'utf8'));
const db=new Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try {
 const {rows:pois}=await db.query(`SELECT code,map_id,category_id,latitude,longitude,geo_verified,geo_source_url,schematic_x,schematic_y,trigger_radius_m,image_url,status,sort_order FROM pois WHERE deleted_at IS NULL AND status='PUBLISHED' ORDER BY sort_order,code`);
 let count=0;
 for(const p of pois){
  const {rows:translations}=await db.query(`SELECT t.lang_code,t.name,t.summary,t.script_text,t.text_hash FROM poi_translations t JOIN pois p ON p.id=t.poi_id WHERE p.code=$1 ORDER BY t.lang_code`,[p.code]);
  p.translations=translations;
  for(const t of translations){
   if(createHash('sha256').update(t.script_text.trim()).digest('hex')!==t.text_hash)throw new Error('Transcript hash mismatch');
   const {rows:[a]}=await db.query(`SELECT a.voice_gender,a.voice_name,a.audio_url,a.duration_sec,a.size_bytes FROM poi_audios a JOIN poi_translations t ON t.id=a.translation_id JOIN pois p ON p.id=t.poi_id WHERE p.code=$1 AND t.lang_code=$2 AND a.provider='GEMINI' AND a.status='READY' AND a.text_hash=t.text_hash ORDER BY a.created_at DESC LIMIT 1`,[p.code,t.lang_code]);
   const shared=previous.pois.find(row=>row.code===p.code)?.translations.find(row=>row.lang_code===t.lang_code&&row.text_hash===t.text_hash)?.audio;
   // Preserve the team's already accepted matching audio when exporting a local DB.
   if(shared){
    if(!/^audio\/[a-zA-Z0-9_-]+\.mp3$/.test(shared.file))throw new Error('Invalid shared audio path');
    const bytes=await readFile(new URL('../backend/fixtures/'+shared.file,import.meta.url));
    if(bytes.length!==shared.sizeBytes||createHash('sha256').update(bytes).digest('hex')!==shared.sha256)throw new Error('Shared audio checksum mismatch');
    t.audio=shared;count++;continue;
   }
   if(!a)continue;
   if(!a.audio_url.startsWith('/audio-assets/audio/'))throw new Error('Unexpected asset URL');
   const bytes=await readFile(new URL('../backend/storage/'+a.audio_url.slice('/audio-assets/'.length),import.meta.url));
   if(bytes.length!==a.size_bytes)throw new Error('Audio size mismatch');
   const sha256=createHash('sha256').update(bytes).digest('hex');
   const file=`audio/${p.code}-${t.lang_code}-${sha256.slice(0,12)}.mp3`;
   await writeFile(new URL('../backend/fixtures/'+file,import.meta.url),bytes);
   t.audio={file,sha256,sizeBytes:bytes.length,durationSec:a.duration_sec,voiceGender:a.voice_gender,voiceName:a.voice_name,provider:'GEMINI'};count++;
  }
 }
 await writeFile(new URL('../backend/fixtures/content.json',import.meta.url),JSON.stringify({formatVersion:1,exportedAt:new Date().toISOString(),pois},null,2)+'\n');
 console.log(JSON.stringify({pois:pois.length,translations:pois.reduce((n,p)=>n+p.translations.length,0),googleAudio:count}));
}finally{await db.end();}
