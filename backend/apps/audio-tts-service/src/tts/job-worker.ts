import { Inject,Injectable,Logger,OnModuleInit,OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { TTS_PROVIDER,TtsProvider,TtsTransientError,TtsQuotaError } from '../providers/tts-provider.interface';
import { STORAGE,StorageDriver } from '../storage/storage.interface';
import { contentWrite } from '@app/database/content-write';
import { mp3DurationSec } from '../util/mp3';
@Injectable()
export class JobWorker implements OnModuleInit,OnModuleDestroy {
 private timer:any; private busy=false;private maintenanceAt=0;private log=new Logger('AudioJobs');
 constructor(private ds:DataSource,@Inject(TTS_PROVIDER) private tts:TtsProvider,@Inject(STORAGE) private storage:StorageDriver){}
 onModuleInit(){
  const langs=process.env.TTS_LANGUAGES?.split(',').map(s=>s.trim()).filter(Boolean);
  if(langs?.some(l=>!['vi','en','ja','ko','zh'].includes(l)))throw new Error('TTS_LANGUAGES must contain only vi,en,ja,ko,zh');
  this.timer=setInterval(()=>this.tick().catch(e=>this.log.error(e.message)),1000);
 }
 onModuleDestroy(){clearInterval(this.timer);}
 async tick(){
  if(this.busy)return;this.busy=true;
  try{
   if(Date.now()-this.maintenanceAt>3600000){
    await this.ds.query("DELETE FROM location_pings WHERE received_at<now()-interval '7 days'");
    await this.ds.query("DELETE FROM refresh_tokens WHERE expires_at<now()-interval '1 day'");this.maintenanceAt=Date.now();
   }
   const [pause]=await this.ds.query('SELECT value FROM app_configs WHERE key=$1',[`tts_pause_${this.tts.name}`]);
   if(pause?.value?.until && Date.parse(pause.value.until)>Date.now())return;
   await contentWrite(this.ds,async m=>{
    const rows=await m.query("SELECT a.poi_id,a.id AS audio_id,j.id AS job_id FROM tts_jobs j JOIN poi_audios a ON a.current_job_id=j.id WHERE j.status='RUNNING' AND j.lease_until<now() AND j.attempts>=3");
    for(const r of rows){await m.query("UPDATE poi_audios SET status='FAILED',audio_url=NULL WHERE id=$1 AND current_job_id=$2",[r.audio_id,r.job_id]);await m.query("UPDATE tts_jobs SET status='FAILED',error_message='WORKER_LEASE_EXPIRED',finished_at=now() WHERE id=$1",[r.job_id]);}
    return {value:null,ids:rows.map((r:any)=>r.poi_id)};
   });
   const job=await this.ds.transaction(async m=>{
    await m.query("UPDATE tts_jobs SET status=CASE WHEN attempts>=3 THEN 'FAILED'::tts_job_status ELSE 'QUEUED'::tts_job_status END,available_at=now(),error_message='WORKER_LEASE_EXPIRED' WHERE status='RUNNING' AND lease_until<now()");
    const langs=process.env.TTS_LANGUAGES?.split(',').map(s=>s.trim()).filter(Boolean);
    const [j]=await m.query("SELECT * FROM tts_jobs WHERE status='QUEUED' AND available_at<=now() AND payload->>'provider'=$1 AND ($2::text[] IS NULL OR payload->>'langCode'=ANY($2::text[])) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[this.tts.name,langs?.length?langs:null]);
    if(!j)return null;
    await m.query("UPDATE tts_jobs SET status='RUNNING',attempts=attempts+1,lease_until=now()+interval '60 seconds' WHERE id=$1",[j.id]);return j;
   });
   if(!job)return;
   const ev=job.payload;
   const active=await this.ds.query("SELECT a.id FROM poi_audios a JOIN poi_translations t ON t.id=a.translation_id JOIN pois p ON p.id=a.poi_id WHERE a.id=$1 AND a.current_job_id=$2 AND a.source='TTS' AND t.text_hash=$3 AND p.deleted_at IS NULL",[ev.audioId,job.id,ev.textHash]);
   if(!active.length){await this.ds.query("UPDATE tts_jobs SET status='FAILED',error_message='SUPERSEDED',finished_at=now() WHERE id=$1",[job.id]);return;}
   const heartbeat=setInterval(()=>this.ds.query("UPDATE tts_jobs SET lease_until=now()+interval '60 seconds' WHERE id=$1 AND status='RUNNING'",[job.id]).catch(()=>{}),15000);
   try{
    const out=await this.tts.synthesize({text:ev.text,locale:ev.ttsLocale,gender:ev.gender});
    const digest=createHash('sha256').update(out.audio).digest('hex');
    const url=await this.storage.save(`audio/${ev.langCode}/${ev.audioId}-${digest}.mp3`,out.audio,out.mime);
    await contentWrite(this.ds,async m=>{
     const rows=await m.query("WITH changed AS (UPDATE poi_audios a SET status='READY',provider=$1,voice_name=$2,audio_url=$3,size_bytes=$4,duration_sec=$5,text_hash=$6 FROM poi_translations t WHERE a.id=$7 AND a.current_job_id=$8 AND a.source='TTS' AND t.id=a.translation_id AND t.text_hash=$6 RETURNING a.poi_id) SELECT * FROM changed",[this.tts.name,out.voiceName,url,out.audio.length,(mp3DurationSec(out.audio)??out.audio.length/16000).toFixed(2),ev.textHash,ev.audioId,job.id]);
     await m.query("UPDATE tts_jobs SET status='SUCCESS',finished_at=now(),lease_until=NULL,error_message=NULL WHERE id=$1",[job.id]);return {value:null,ids:rows.map((r:any)=>r.poi_id)};
    });
   }catch(e){
    if(e instanceof TtsQuotaError)await this.ds.query("INSERT INTO app_configs(key,value) VALUES ($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[`tts_pause_${this.tts.name}`,JSON.stringify({until:new Date(Date.now()+86400000).toISOString(),reason:'QUOTA_EXHAUSTED'})]);
    const retry=e instanceof TtsTransientError && Number(job.attempts)+1<3;
    await contentWrite(this.ds,async m=>{
     await m.query("UPDATE tts_jobs SET status=$1::text::tts_job_status,error_message=$2,lease_until=NULL,available_at=now()+interval '5 seconds',finished_at=CASE WHEN $1::text='FAILED' THEN now() ELSE NULL END WHERE id=$3",[retry?'QUEUED':'FAILED',String(e.message).slice(0,1000),job.id]);
     const rows=retry?[]:await m.query("WITH changed AS (UPDATE poi_audios a SET status='FAILED',audio_url=NULL FROM poi_translations t WHERE a.id=$1 AND a.current_job_id=$2 AND t.id=a.translation_id AND t.text_hash=$3 RETURNING a.poi_id) SELECT * FROM changed",[ev.audioId,job.id,ev.textHash]);return {value:null,ids:rows.map((r:any)=>r.poi_id)};
    });
   }finally{clearInterval(heartbeat);}
  }finally{this.busy=false;}
 }
}
