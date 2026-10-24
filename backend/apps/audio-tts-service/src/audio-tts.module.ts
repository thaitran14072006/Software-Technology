import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '@app/common/operational';
import { GoogleTtsProvider } from './providers/google-tts.provider';
import { TTS_PROVIDER } from './providers/tts-provider.interface';
import { LocalStorage } from './storage/local.storage';
import { S3Storage } from './storage/s3.storage';
import { STORAGE } from './storage/storage.interface';
import { JobWorker } from './tts/job-worker';
import {LocalTtsProvider} from './providers/local-tts.provider';
import {GeminiTtsProvider} from './providers/gemini-tts.provider';
@Module({
 imports:[TypeOrmModule.forRoot({type:'postgres',installExtensions:false,url:process.env.DATABASE_URL,entities:[],synchronize:false})],
 controllers:[HealthController],
 providers:[JobWorker,{provide:TTS_PROVIDER,useFactory:()=>{
  const p=(process.env.TTS_PROVIDER??'DEVICE').toUpperCase();
  if(p==='GOOGLE')return new GoogleTtsProvider();
  if(p==='GEMINI')return new GeminiTtsProvider();
  if(p==='LOCAL')return new LocalTtsProvider();
  if(p==='DEVICE')return {name:'DEVICE',synthesize:async()=>{throw new Error('DEVICE_MODE: đọc bằng thiết bị hoặc tải MP3 lên. Không gọi API trả phí.');}};
  throw new Error(`TTS_PROVIDER không hỗ trợ: ${p}`);
 }},{provide:STORAGE,useFactory:()=>process.env.STORAGE_DRIVER==='S3'?new S3Storage():new LocalStorage()}],
})
export class AudioTtsModule {}
