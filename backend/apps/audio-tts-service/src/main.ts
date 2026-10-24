import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AudioTtsModule } from './audio-tts.module';
async function bootstrap(){
 const app=await NestFactory.create<NestExpressApplication>(AudioTtsModule);
 app.enableCors({origin:process.env.CORS_ORIGIN?.split(',')??false});
 if(process.env.STORAGE_DRIVER!=='S3')app.useStaticAssets(process.env.STORAGE_LOCAL_DIR??'./storage',{prefix:'/assets',maxAge:'365d'});
 await app.listen(+(process.env.AUDIO_PORT??3002),process.env.API_HOST??'127.0.0.1');
}
bootstrap();
