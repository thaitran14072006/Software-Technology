import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsUUID } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/common';
import { AnalyticsService } from './analytics.service';

export class PresenceDto {
  @IsUUID('4') visitorId: string;
  @IsUUID('4') sessionId: string;
  @IsBoolean() active: boolean;
}
export class ListenDto {
  @IsUUID('4') eventId: string;
  @IsUUID('4') visitorId: string;
  @IsUUID('4') poiId: string;
  @IsIn(['vi', 'en', 'ja', 'ko', 'zh']) lang: string;
}
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Post('presence') presence(@Body() dto: PresenceDto) { return this.analytics.presence(dto); }
  @Post('listens') listen(@Body() dto: ListenDto) { return this.analytics.listen(dto); }
}
@Controller({ path: 'admin/analytics', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Get() summary() { return this.analytics.summary(); }
}
