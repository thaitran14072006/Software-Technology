import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { QrFallbackModule } from './qr-fallback.module';

async function bootstrap() {
  const app = await NestFactory.create(QrFallbackModule);
  app.enableCors({origin:process.env.CORS_ORIGIN?.split(',')??false});
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.listen(+(process.env.QR_PORT ?? 3003),process.env.API_HOST??'127.0.0.1');
}
bootstrap();
