jest.mock('@nestjs/common',()=>({Inject:()=>()=>{},Injectable:()=>()=>{},Logger:class{}}));
jest.mock('typeorm',()=>({DataSource:class{}}));
import {JobWorker} from '../src/tts/job-worker';

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
});
