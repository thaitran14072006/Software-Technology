// Publish existing matching Gemini files; never enqueue or modify TTS jobs.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
try{process.loadEnvFile(path.join(root,'backend/.env'));}catch(e){if(e.code!=='ENOENT')throw e;}
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
const codes=['coord-01','9','2','7','13','8','14','coord-12','5','15','doc-13','1','coord-02','doc-14','coord-15'];
const voices={vi:'Achird',en:'Charon',ja:'Aoede',ko:'Iapetus',zh:'Sulafat'};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixturePath=path.join(root,'backend/fixtures/content.json');
const fixture=JSON.parse(await readFile(fixturePath,'utf8'));
const storage=path.resolve(root,'backend',process.env.STORAGE_LOCAL_DIR||'./storage');
const db=new Client({connectionString:process.env.DATABASE_URL||'postgres://sag:sag@127.0.0.1:5432/sag',connectionTimeoutMillis:5000});
await db.connect();
try{
 const {rows}=await db.query("SELECT p.code,a.lang_code,a.voice_gender,a.voice_name,a.audio_url,a.duration_sec,a.size_bytes,a.text_hash FROM poi_audios a JOIN pois p ON p.id=a.poi_id JOIN poi_translations t ON t.id=a.translation_id WHERE p.code=ANY($1) AND a.lang_code=ANY($2) AND a.provider='GEMINI' AND a.status='READY' AND a.text_hash=t.text_hash AND p.deleted_at IS NULL ORDER BY a.created_at DESC",[codes,Object.keys(voices)]);
 const exports=[],skipped=[],seen=new Set();
 for(const row of rows){
  const key=row.code+':'+row.lang_code;if(seen.has(key))continue;
  if(!row.voice_name?.endsWith('/'+voices[row.lang_code])){skipped.push({key,reason:'old voice'});continue;}
  const t=fixture.pois.find(p=>p.code===row.code)?.translations.find(t=>t.lang_code===row.lang_code);
  if(!t||t.text_hash!==row.text_hash||sha(t.script_text.trim())!==row.text_hash){skipped.push({key,reason:'transcript differs'});continue;}
  const relative=row.audio_url?.split('/audio-assets/')[1];
  if(!relative||!relative.startsWith('audio/'))throw Error('Unexpected asset URL');
  const source=path.resolve(storage,relative);if(!source.startsWith(storage+path.sep))throw Error('Asset outside storage');
  const bytes=await readFile(source);if(bytes.length!==Number(row.size_bytes)||!Number(row.duration_sec))throw Error('Invalid audio file: '+key);
  const digest=sha(bytes),file=`audio/${row.code}-${row.lang_code}-${digest.slice(0,12)}.mp3`;
  exports.push({key,file,bytes,t,meta:{file,sha256:digest,sizeBytes:bytes.length,durationSec:Number(row.duration_sec),voiceGender:row.voice_gender,voiceName:row.voice_name,provider:'GEMINI'}});seen.add(key);
 }
 if(process.argv.includes('--write')){
  await mkdir(path.join(root,'backend/fixtures/audio'),{recursive:true});
  for(const item of exports){await writeFile(path.join(root,'backend/fixtures',item.file),item.bytes);item.t.audio=item.meta;}
  fixture.exportedAt=new Date().toISOString();
  const temporary=fixturePath+'.tmp';await writeFile(temporary,JSON.stringify(fixture,null,2)+'\n');await rename(temporary,fixturePath);
 }
 console.log(JSON.stringify({mode:process.argv.includes('--write')?'written':'dry-run',matchingAudio:exports.length,skipped,items:exports.map(e=>e.key)},null,2));
}finally{await db.end();}
