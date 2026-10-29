import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { createHash,randomUUID } from 'crypto';
import { mkdir,writeFile,rename,unlink } from 'fs/promises';
import path from 'path';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min, IsUrl } from 'class-validator';
import { JwtAuthGuard,Roles,RolesGuard } from '@app/common';
import { contentWrite } from '@app/database/content-write';
import { checkLang,PoiService } from '../poi/poi.service';
import { mp3DurationSec,validMp3 } from '../../../audio-tts-service/src/util/mp3';

class UploadDto { @IsIn(['vi','en','ja','zh','ko']) langCode:string; @IsOptional() @IsIn(['MALE','FEMALE']) voiceGender:'MALE'|'FEMALE'='FEMALE'; @IsOptional() @IsBoolean() force?:boolean; }
class QrDto { @IsIn(['POI','GATE']) kind:'POI'|'GATE'; @IsOptional() @IsUUID() poiId?:string; @IsOptional() @IsUrl({require_tld:false,protocols:['http','https'],require_protocol:true}) targetUrl?:string; }
class ActiveDto { @IsBoolean() isActive:boolean; }
class BeaconDto { @IsUUID() poiId:string; @IsUUID() uuid:string; @IsInt() @Min(0) @Max(65535) major:number; @IsInt() @Min(0) @Max(65535) minor:number; @IsOptional() @IsInt() @Min(-127) @Max(20) txPower?:number; }
class ConfigDto { @IsIn(['default_trigger_radius_m','replay_audio_cooldown_min']) key:string; @IsInt() @Min(1) @Max(200) value:number; }
@Controller({path:'admin',version:'1'})
@UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
export class AdminController {
 constructor(private ds:DataSource,private pois:PoiService) {}
 @Post('pois/:id/audios/generate') generate(@Param('id',ParseUUIDPipe) id:string,@Body() body:UploadDto){return this.pois.generateMissing(id,body.langCode,body.voiceGender,body.force===true);}
 @Post('pois/:id/audios/upload')
 @UseInterceptors(FileInterceptor('file',{limits:{fileSize:20*1024*1024,files:1,fields:2,parts:4}}))
 async upload(@Param('id',ParseUUIDPipe) id:string,@Body() body:UploadDto,@UploadedFile() file:any){
   if(!file?.buffer?.length)throw new BadRequestException('Cần file MP3.');
   // Require at least a valid MPEG Layer III header; client MIME/extension is never trusted.
   const duration=mp3DurationSec(file.buffer);if(!validMp3(file.buffer)||!duration||duration>7200)throw new BadRequestException('MP3 không hợp lệ, bị cắt cụt hoặc quá dài.');
   const digest=createHash('sha256').update(file.buffer).digest('hex');
   const key=`audio/${body.langCode}/${id}-${body.voiceGender.toLowerCase()}-${digest}.mp3`;
   const dir=path.resolve(process.env.STORAGE_LOCAL_DIR??'./storage'),dest=path.join(dir,key),temp=dest+'.'+randomUUID()+'.tmp';
   await mkdir(path.dirname(dest),{recursive:true});await writeFile(temp,file.buffer);await rename(temp,dest);
   // Same-origin web proxy also works on LAN/HTTPS. Native can supply an absolute asset base.
   const url=`${(process.env.PUBLIC_ASSET_BASE??'/audio-assets').replace(/\/$/,'')}/${key}`;
   try{return await contentWrite(this.ds,async m=>{
     const [tr]=await m.query('SELECT t.* FROM poi_translations t JOIN pois p ON p.id=t.poi_id WHERE t.poi_id=$1 AND t.lang_code=$2 AND p.deleted_at IS NULL',[id,body.langCode]);
     if(!tr)throw new NotFoundException('Chưa có POI hoặc bản dịch này.');
     await m.query("UPDATE poi_audios SET status='FAILED',current_job_id=NULL,audio_url=NULL WHERE translation_id=$1",[tr.id]);
     const [a]=await m.query(`INSERT INTO poi_audios(translation_id,poi_id,lang_code,voice_gender,source,status,provider,audio_url,size_bytes,duration_sec,text_hash)
       VALUES($1,$2,$3,$4,'UPLOAD','READY','UPLOAD',$5,$6,$7,$8)
       ON CONFLICT(translation_id,voice_gender) DO UPDATE SET source='UPLOAD',status='READY',provider='UPLOAD',audio_url=$5,size_bytes=$6,duration_sec=$7,text_hash=$8,current_job_id=NULL RETURNING *`,[tr.id,id,body.langCode,body.voiceGender,url,file.buffer.length,duration.toFixed(2),tr.text_hash]);
     return {value:a,ids:[id]};
   });}catch(e){/* Content-hash files may already be referenced; keep safe orphan for later GC. */throw e;}
 }
 @Get('qr') qr(){return this.ds.query("SELECT q.*,p.code FROM poi_qr_codes q LEFT JOIN pois p ON p.id=q.poi_id WHERE q.kind='GATE' OR p.deleted_at IS NULL ORDER BY q.created_at DESC");}
 @Post('qr') async createQr(@Body() body:QrDto){
   if(body.kind==='POI'&&!body.poiId)throw new BadRequestException('Thiếu POI.');if(body.kind==='GATE'&&!body.targetUrl)throw new BadRequestException('Thiếu URL.');
   if(body.poiId&&!(await this.ds.query('SELECT id FROM pois WHERE id=$1 AND deleted_at IS NULL',[body.poiId])).length)throw new NotFoundException();
   const [row]=await this.ds.query('INSERT INTO poi_qr_codes(kind,poi_id,token,target_url) VALUES($1,$2,$3,$4) RETURNING *',[body.kind,body.kind==='POI'?body.poiId:null,randomUUID().replace(/-/g,''),body.targetUrl??null]);return row;
 }
 @Patch('qr/:id') async toggleQr(@Param('id',ParseUUIDPipe) id:string,@Body() body:ActiveDto){const [r]=await this.ds.query('WITH changed AS (UPDATE poi_qr_codes SET is_active=$1 WHERE id=$2 RETURNING *) SELECT * FROM changed',[body.isActive,id]);if(!r)throw new NotFoundException();return r;}
 @Get('beacons') beacons(){return this.ds.query('SELECT * FROM ble_beacons ORDER BY poi_id');}
 @Post('beacons') async beacon(@Body() b:BeaconDto){if(!(await this.ds.query('SELECT id FROM pois WHERE id=$1 AND deleted_at IS NULL',[b.poiId])).length)throw new NotFoundException();const[r]=await this.ds.query('INSERT INTO ble_beacons(poi_id,uuid,major,minor,tx_power) VALUES($1,$2,$3,$4,$5) RETURNING *',[b.poiId,b.uuid,b.major,b.minor,b.txPower??null]);return r;}
 @Patch('beacons/:id') async toggleBeacon(@Param('id',ParseUUIDPipe) id:string,@Body() b:ActiveDto){const[r]=await this.ds.query('WITH changed AS (UPDATE ble_beacons SET is_active=$1 WHERE id=$2 RETURNING *) SELECT * FROM changed',[b.isActive,id]);if(!r)throw new NotFoundException();return r;}
 @Delete('beacons/:id') async disableBeacon(@Param('id',ParseUUIDPipe) id:string){return this.toggleBeacon(id,{isActive:false});}
 @Get('configs') configs(){return this.ds.query('SELECT key,value,description FROM app_configs ORDER BY key');}
 @Patch('configs') @Roles('ADMIN') async config(@Body() b:ConfigDto){const[r]=await this.ds.query('WITH changed AS (UPDATE app_configs SET value=$1::jsonb,updated_at=now() WHERE key=$2 RETURNING key,value) SELECT * FROM changed',[JSON.stringify(b.value),b.key]);if(!r)throw new NotFoundException();return r;}
 @Get('tts-jobs') jobs(){return this.ds.query('SELECT id,audio_id,status,attempts,error_message,created_at,finished_at FROM tts_jobs ORDER BY created_at DESC LIMIT 100');}
 @Get('audit-logs') audit(){return this.ds.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');}
}
