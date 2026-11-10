jest.mock('@nestjs/common',()=>({Inject:()=>()=>{},Injectable:()=>()=>{},Logger:class{}}));
jest.mock('typeorm',()=>({DataSource:class{}}));
jest.mock('@app/database/content-write',()=>({contentWrite:async(ds:any,work:any)=>(await work(ds)).value}));
import {JobWorker} from '../src/tts/job-worker';
import {TtsQuotaError} from '../src/providers/tts-provider.interface';
import {geminiQuotaPause} from '../src/providers/gemini-quota';

describe('Audio playback without synthesis',()=>{
 const original=process.env.TTS_WORKER_ENABLED;
 afterEach(()=>{if(original===undefined)delete process.env.TTS_WORKER_ENABLED;else process.env.TTS_WORKER_ENABLED=original;jest.restoreAllMocks();});
 it('does not schedule jobs or access the database when synthesis is disabled',()=>{
  process.env.TTS_WORKER_ENABLED='false';
  const interval=jest.spyOn(global,'setInterval');
  const query=jest.fn();
  const worker=new JobWorker({query} as any,{name:'GEMINI'} as any,{} as any);
  worker.onModuleInit();worker.onModuleDestroy();
  expect(interval).not.toHaveBeenCalled();expect(query).not.toHaveBeenCalled();
 });
 it('persists minute backoff without retrying the failed job',async()=>{
  const pause=geminiQuotaPause({error:{message:'Requests per minute exceeded'}},'90');
  const query=jest.fn(async(sql:string)=>{
   if(sql.startsWith('SELECT * FROM tts_jobs'))return [{id:'job',attempts:0,payload:{audioId:'audio',textHash:'hash',text:'Story',ttsLocale:'vi-VN',gender:'FEMALE'}}];
   if(sql.startsWith('SELECT a.id FROM poi_audios'))return [{id:'audio'}];
   return [];
  });
  const ds:any={query};ds.transaction=(work:any)=>work(ds);
  const storage={save:jest.fn()};
  const provider={name:'GEMINI',synthesize:jest.fn().mockRejectedValue(new TtsQuotaError('GEMINI_QUOTA: minute',pause))};
  const worker=new JobWorker(ds,provider as any,storage as any);
  await worker.tick();
  const calls=query.mock.calls as any[];
  const stored=calls.find(([sql])=>sql.startsWith('INSERT INTO app_configs'));
  expect(JSON.parse(stored[1][1])).toEqual(pause);
  const failed=calls.find(([sql])=>sql.startsWith('UPDATE tts_jobs SET status=$1'));
  expect(failed[1][0]).toBe('FAILED');expect(provider.synthesize).toHaveBeenCalledTimes(1);expect(storage.save).not.toHaveBeenCalled();
 });
 it('does not take another queued job when an unknown quota requires review',async()=>{
  const query=jest.fn(async(sql:string)=>sql.startsWith('SELECT value FROM app_configs')?[{value:{requiresReview:true,until:null}}]:[]);
  const transaction=jest.fn();
  await new JobWorker({query,transaction} as any,{name:'GEMINI'} as any,{} as any).tick();
  expect(transaction).not.toHaveBeenCalled();
 });
});
