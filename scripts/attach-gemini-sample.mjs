import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../backend/package.json',import.meta.url));const {Client}=require('pg');
process.loadEnvFile(new URL('../backend/.env',import.meta.url));
const source=JSON.parse(await readFile(new URL('./data/tts-document.json',import.meta.url),'utf8')).items[0];
const mp3=await readFile(new URL('../backend/.runtime/gemini/sample-vi.mp3',import.meta.url));
const wav=await readFile(new URL('../backend/.runtime/gemini/sample-vi.wav',import.meta.url));
let dataSize;for(let offset=12;offset+8<wav.length;){const size=wav.readUInt32LE(offset+4);if(wav.toString('ascii',offset,offset+4)==='data'){dataSize=size;break;}offset+=8+size+(size%2);}
if(!dataSize)throw new Error('Missing WAV data');
const textHash=createHash('sha256').update(source.scriptText.trim()).digest('hex');
const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();
try{
 await client.query('BEGIN');await client.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const {rows:[a]}=await client.query("SELECT a.id,a.poi_id,a.current_job_id,t.text_hash FROM poi_audios a JOIN poi_translations t ON t.id=a.translation_id JOIN pois p ON p.id=a.poi_id WHERE p.code='9' AND a.lang_code='vi' AND a.voice_gender='FEMALE' FOR UPDATE OF a");
 if(!a||a.text_hash!==textHash)throw new Error('Sample transcript does not match the current translation');
 const key=`audio/vi/${a.id}-${createHash('sha256').update(mp3).digest('hex')}.mp3`;
 await mkdir(new URL('../backend/storage/audio/vi/',import.meta.url),{recursive:true});await writeFile(new URL('../backend/storage/'+key,import.meta.url),mp3);
 await client.query("UPDATE poi_audios SET source='TTS',status='READY',provider='GEMINI',voice_name='gemini-3.8-flash-lite-tts/Kore',audio_url=$1,size_bytes=$2,duration_sec=$3,text_hash=$4,current_job_id=NULL WHERE id=$5",['/audio-assets/'+key,mp3.length,(dataSize/48000).toFixed(2),textHash,a.id]);
 if(a.current_job_id)await client.query("UPDATE tts_jobs SET status='FAILED',lease_until=NULL,error_message='REPLACED_BY_MATCHING_GEMINI_SAMPLE',finished_at=now() WHERE id=$1",[a.current_job_id]);
 const {rows:[rev]}=await client.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await client.query('UPDATE pois SET rev=$1 WHERE id=$2',[rev.rev,a.poi_id]);
 await client.query('COMMIT');console.log('Attached real Google Bàu Sấu narration:',mp3.length,'bytes,',(dataSize/48000).toFixed(2),'seconds.');
}catch(e){await client.query('ROLLBACK');throw e;}finally{await client.end();}
