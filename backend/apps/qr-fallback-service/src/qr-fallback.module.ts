import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BleBeacon, PoiQrCode } from './qr.entities';
import { BeaconController, QrController } from './qr.controller';
import { HealthController } from '@app/common/operational';

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'postgres', installExtensions:false, url: process.env.DATABASE_URL, autoLoadEntities: true, synchronize: false }),
    TypeOrmModule.forFeature([PoiQrCode, BleBeacon]),
  ],
  controllers: [QrController, BeaconController, HealthController],
})
export class QrFallbackModule {}
