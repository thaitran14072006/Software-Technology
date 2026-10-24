import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { appValidationPipe } from '@app/common';
import { ContentPoiModule } from './content-poi.module';
async function bootstrap(){
 const app=await NestFactory.create(ContentPoiModule);
 app.enableCors({origin:process.env.CORS_ORIGIN?.split(',')??false});
 app.setGlobalPrefix('api');app.enableVersioning({type:VersioningType.URI});app.useGlobalPipes(appValidationPipe);
 await app.listen(+(process.env.CONTENT_PORT??3001),process.env.API_HOST??'127.0.0.1');
}
bootstrap();
