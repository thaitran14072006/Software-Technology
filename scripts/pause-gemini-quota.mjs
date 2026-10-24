import {createRequire} from 'node:module';
const require=createRequire(new URL('../backend/package.json',import.meta.url));const {Client}=require('pg');
process.loadEnvFile(new URL('../backend/.env',import.meta.url));
const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();
try{
 await client.query('BEGIN');
 await client.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const until=new Date(Date.now()+86400000).toISOString();
 await client.query("INSERT INTO app_configs(key,value) VALUES ('tts_pause_GEMINI',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[JSON.stringify({until,reason:'GOOGLE_FREE_DAILY_QUOTA_10'})]);
 await client.query("UPDATE tts_jobs SET status='QUEUED',lease_until=NULL,attempts=0,available_at=$1,error_message='QUOTA_PAUSED' WHERE (status IN ('RUNNING','QUEUED') OR (status='FAILED' AND error_message='WORKER_LEASE_EXPIRED')) AND id IN (SELECT current_job_id FROM poi_audios WHERE current_job_id IS NOT NULL)",[until]);
 await client.query("UPDATE poi_audios a SET status='PENDING',audio_url=NULL WHERE a.current_job_id IN (SELECT id FROM tts_jobs WHERE status='QUEUED' AND error_message='QUOTA_PAUSED')");
 await client.query("UPDATE tts_jobs SET payload=jsonb_set(payload,'{provider}','\"GEMINI\"'::jsonb) WHERE status='QUEUED' AND error_message='QUOTA_PAUSED'");
 const ids=await client.query("SELECT distinct poi_id FROM poi_audios WHERE current_job_id IN (SELECT id FROM tts_jobs WHERE error_message='QUOTA_PAUSED')");
 if(ids.rowCount){const rev=await client.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await client.query('UPDATE pois SET rev=$1 WHERE id=ANY($2::uuid[])',[rev.rows[0].rev,ids.rows.map(r=>r.poi_id)]);}
 await client.query('COMMIT');console.log('Gemini queue paused until',until,'without losing ready recordings.');
}catch(e){await client.query('ROLLBACK');throw e;}finally{await client.end();}
