import { BadRequestException,Body,Controller,Get,Post,Query,UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IsBoolean,IsUUID,IsLatitude,IsLongitude,IsNumber,IsOptional,Min,Max,IsISO8601,Matches } from 'class-validator';
import { JwtAuthGuard,Roles,RolesGuard } from '@app/common';
class PingDto {
 @IsUUID() id:string; @IsUUID() sessionId:string;
 @Matches(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i) mapId:string; @IsBoolean() consent:boolean;
 @IsLatitude() latitude:number; @IsLongitude() longitude:number;
 @IsOptional() @IsNumber() @Min(0) @Max(10000) accuracy?:number;
 @IsISO8601() recordedAt:string;
}
@Controller({path:'tracking',version:'1'})
export class TrackingController {
 constructor(private ds:DataSource){}
 @Post('locations') async ping(@Body() b:PingDto){
   if(!b.consent)throw new BadRequestException('Cần đồng ý chia sẻ vị trí.');
   const age=Date.now()-Date.parse(b.recordedAt);if(age< -60000||age>7*86400000)throw new BadRequestException('Thời gian vị trí không hợp lệ.');
   const result=await this.ds.transaction(async m=>{
     await m.query('SELECT pg_advisory_xact_lock(hashtext($1))',[b.sessionId]);
     if((await m.query("SELECT id FROM location_pings WHERE session_id=$1 AND received_at>now()-interval '10 seconds' LIMIT 1",[b.sessionId])).length)return {recorded:false,reason:'RATE_LIMIT'};
     const rows=await m.query('INSERT INTO location_pings(id,session_id,map_id,latitude,longitude,accuracy,recorded_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING RETURNING id',[b.id,b.sessionId,b.mapId,b.latitude,b.longitude,b.accuracy??null,b.recordedAt]);return {recorded:rows.length>0};
   });
   return result;
 }
}
@Controller({path:'admin/analytics',version:'1'}) @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
export class HeatmapController {
 constructor(private ds:DataSource){}
 @Get('heatmap') heatmap(){return this.ds.query("SELECT round(latitude::numeric,3)::float8 AS lat,round(longitude::numeric,3)::float8 AS lng,count(*)::int AS count FROM location_pings WHERE received_at>now()-interval '7 days' GROUP BY 1,2 ORDER BY 3 DESC LIMIT 1000");}
}
@Controller({path:'configs',version:'1'})
export class ConfigController {constructor(private ds:DataSource){} @Get() async config(){const rows=await this.ds.query("SELECT key,value FROM app_configs WHERE key IN ('default_trigger_radius_m','replay_audio_cooldown_min','park_hours','default_lang')");const provider=process.env.TTS_PROVIDER??'DEVICE';const [pause]=await this.ds.query('SELECT value FROM app_configs WHERE key=$1',[`tts_pause_${provider}`]);return {...Object.fromEntries(rows.map((r:any)=>[r.key,r.value])),tts_provider:provider,tts_paused_until:pause?.value?.until??null};}}
