import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR,APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController,AuditInterceptor,DatabaseExceptionFilter } from '@app/common/operational';
import { Poi } from './entities/poi.entity';
import { PoiTranslation } from './entities/poi-translation.entity';
import { PoiAudio } from './entities/poi-audio.entity';
import { PoiCacheService } from './cache/poi-cache.service';
import { PoiService } from './poi/poi.service';
import { AdminPoiController,PublicPoiController } from './poi/poi.controller';
import { SyncController } from './sync/sync.controller';
import { RevService } from './sync/rev.service';
import { AnalyticsController,AdminAnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AuthController } from './auth/auth.controller';
import { AdminController } from './admin/admin.controller';
import { TrackingController,HeatmapController,ConfigController } from './admin/tracking.controller';
@Module({
 imports:[TypeOrmModule.forRoot({type:'postgres',installExtensions:false,url:process.env.DATABASE_URL,autoLoadEntities:true,synchronize:false}),TypeOrmModule.forFeature([Poi,PoiTranslation,PoiAudio])],
 controllers:[HealthController,PublicPoiController,AdminPoiController,SyncController,AnalyticsController,AdminAnalyticsController,AuthController,AdminController,TrackingController,HeatmapController,ConfigController],
 providers:[PoiService,PoiCacheService,RevService,AnalyticsService,{provide:APP_INTERCEPTOR,useClass:AuditInterceptor},{provide:APP_FILTER,useClass:DatabaseExceptionFilter}],
})
export class ContentPoiModule {}
