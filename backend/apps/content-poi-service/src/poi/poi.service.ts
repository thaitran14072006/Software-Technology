import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {sha256} from '@app/common/hash';
import { contentWrite } from '@app/database/content-write';
import { Poi } from '../entities/poi.entity';
import { PoiTranslation } from '../entities/poi-translation.entity';
import { PoiAudio } from '../entities/poi-audio.entity';
import { CreatePoiDto } from '../dto/v1/create-poi.dto';
import { UpdatePoiDto } from '../dto/v1/update-poi.dto';
import { PoiCacheService } from '../cache/poi-cache.service';
import { RevService } from '../sync/rev.service';
export {sha256} from '@app/common/hash';
const LOCALE:Record<string,string>={vi:'vi-VN',en:'en-US',ja:'ja-JP',zh:'cmn-CN',ko:'ko-KR'};
export function checkLang(lang:string) { if(!Object.prototype.hasOwnProperty.call(LOCALE,lang)) throw new BadRequestException('Ngôn ngữ không được hỗ trợ.'); }
@Injectable()
export class PoiService {
 constructor(private ds:DataSource,@InjectRepository(Poi) private pois:Repository<Poi>,@InjectRepository(PoiAudio) private audios:Repository<PoiAudio>,private cache:PoiCacheService,private rev:RevService) {}
 private validateTranslations(translations:any[] = []) {
   const seen=new Set(); for(const t of translations) { checkLang(t.langCode); if(seen.has(t.langCode)) throw new BadRequestException('Trùng ngôn ngữ.'); seen.add(t.langCode); }
 }
 private async refs(m:EntityManager,dto:any) {
   if(dto.mapId && !(await m.query('SELECT id FROM maps WHERE id=$1',[dto.mapId])).length) throw new BadRequestException('Bản đồ không tồn tại.');
   if(dto.categoryId!=null && !(await m.query('SELECT id FROM poi_categories WHERE id=$1',[dto.categoryId])).length) throw new BadRequestException('Nhóm không tồn tại.');
   if(dto.floorId && !(await m.query('SELECT id FROM map_floors WHERE id=$1 AND map_id=$2',[dto.floorId,dto.mapId])).length) throw new BadRequestException('Tầng không thuộc bản đồ.');
 }
 private async queue(m:EntityManager,poi:Poi,tr:PoiTranslation,a:PoiAudio) {
   if(a.source!=='TTS') return;
   const jobId=randomUUID();
   const payload={provider:process.env.TTS_PROVIDER??'DEVICE',audioId:a.id,translationId:tr.id,poiCode:poi.code,langCode:tr.langCode,ttsLocale:LOCALE[tr.langCode],gender:a.voiceGender,text:tr.scriptText,textHash:tr.textHash};
   await m.query('INSERT INTO tts_jobs(id,audio_id,payload) VALUES ($1,$2,$3)',[jobId,a.id,payload]);
   await m.query("UPDATE poi_audios SET current_job_id=$1,status='PENDING',audio_url=NULL WHERE id=$2",[jobId,a.id]);
 }
 async create(dto:CreatePoiDto,userId?:string) {
   this.validateTranslations(dto.translations);
   const id=await contentWrite(this.ds,async m=>{
     if(await m.exists(Poi,{where:{code:dto.code},withDeleted:true})) throw new ConflictException('Mã điểm đã tồn tại.');
     await this.refs(m,dto);
     const {translations,audioMode,voiceGender,...scalar}=dto;
     const poi=await m.save(Poi,m.create(Poi,{...scalar,createdBy:userId??null}));
     for(const t of translations) {
       const tr=await m.save(PoiTranslation,m.create(PoiTranslation,{...t,poiId:poi.id,textHash:sha256(t.scriptText)}));
       const a=await m.save(PoiAudio,m.create(PoiAudio,{poiId:poi.id,translationId:tr.id,langCode:tr.langCode,voiceGender:voiceGender??'FEMALE',source:audioMode??(['GOOGLE','LOCAL','GEMINI'].includes(process.env.TTS_PROVIDER??'DEVICE')?'TTS':'UPLOAD'),status:'PENDING'}));
       await this.queue(m,poi,tr,a);
     }
     await m.query("INSERT INTO poi_qr_codes(kind,poi_id,token) VALUES ('POI',$1,$2)",[poi.id,randomUUID().replace(/-/g,'')]);
     return {value:poi.id,ids:[poi.id]};
   });
   await this.cache.invalidate(); return this.findOneAdmin(id);
 }
 async update(id:string,dto:UpdatePoiDto) {
   this.validateTranslations(dto.translations);
   await contentWrite(this.ds,async m=>{
     const poi=await m.findOne(Poi,{where:{id}}); if(!poi) throw new NotFoundException('Không tìm thấy POI.');
     // Stable identity/map: otherwise old offline map needs an explicit tombstone.
     if((dto.mapId && dto.mapId!==poi.mapId)||(dto.code && dto.code!==poi.code)) throw new BadRequestException('Mã điểm và bản đồ không đổi sau khi tạo.');
     await this.refs(m,{...poi,...dto});
     const {translations,audioMode,voiceGender,...scalar}=dto;
     await m.update(Poi,id,{...scalar,version:()=> 'version + 1'});
     const all=translations ?? ((audioMode||voiceGender)?await m.find(PoiTranslation,{where:{poiId:id}}):[]);
     for(const t of all) {
       const prev=await m.findOne(PoiTranslation,{where:{poiId:id,langCode:t.langCode}}), hash=sha256(t.scriptText);
       const changed=!prev||prev.textHash!==hash;
       const tr=await m.save(PoiTranslation,m.create(PoiTranslation,{...(prev??{}),...t,poiId:id,textHash:hash}));
       const candidates=await m.find(PoiAudio,{where:{translationId:tr.id,...(voiceGender?{voiceGender}:{})},order:{createdAt:'DESC'}});
       const existing=candidates.find(a=>a.status==='READY')??candidates.find(a=>a.status==='PENDING')??candidates[0];
       const source=audioMode??existing?.source??(['GOOGLE','LOCAL','GEMINI'].includes(process.env.TTS_PROVIDER??'DEVICE')?'TTS':'UPLOAD');
       const refresh=changed||!existing||source!==existing.source||Boolean(voiceGender && existing.status!=='READY');
       let a=existing??m.create(PoiAudio,{poiId:id,translationId:tr.id,langCode:tr.langCode,voiceGender:voiceGender??'FEMALE'});
       if(refresh) {
         await m.query("UPDATE poi_audios SET current_job_id=NULL,status='FAILED',audio_url=NULL WHERE translation_id=$1",[tr.id]);
         Object.assign(a,{source,status:'PENDING',audioUrl:null,textHash:null,currentJobId:null}); a=await m.save(PoiAudio,a);
         await this.queue(m,poi,tr,a);
       }
     }
     return {value:null,ids:[id]};
   });
   await this.cache.invalidate(); return this.findOneAdmin(id);
 }
 async regenerateAudio(poiId:string) {
   const queued=await contentWrite(this.ds,async m=>{
     const poi=await m.findOne(Poi,{where:{id:poiId}}); if(!poi) throw new NotFoundException();
     const rows=await m.find(PoiAudio,{where:{poiId,source:'TTS'},relations:{translation:true}});
     let n=0; for(const a of rows) {
       if(a.status==='READY') continue;
       const [active]=await m.query("SELECT id FROM tts_jobs WHERE id=$1 AND (status='QUEUED' OR (status='RUNNING' AND lease_until>now()))",[(a as any).currentJobId??null]);
       if(active) continue;
       await this.queue(m,poi,a.translation,a); n++;
     }
     if(!n) throw new BadRequestException('Không có audio lỗi hoặc quá hạn cần tạo lại.');
     return {value:n,ids:[poiId]};
   }); return {queued};
 }
 async generateMissing(poiId:string,lang:string,gender:'MALE'|'FEMALE',force=false) {
  checkLang(lang);
  return contentWrite(this.ds,async m=>{
   const poi=await m.findOne(Poi,{where:{id:poiId}}),tr=await m.findOne(PoiTranslation,{where:{poiId,langCode:lang}});
   if(!poi||!tr)throw new NotFoundException();
   const audios=await m.find(PoiAudio,{where:{translationId:tr.id}});
   const desired=process.env.TTS_PROVIDER??'DEVICE';
   const ready=audios.find(a=>a.status==='READY'&&a.textHash===tr.textHash&&a.audioUrl&&(a.source==='UPLOAD'||a.provider===desired));
   if(ready&&(!force||ready.source==='UPLOAD'))return {value:{queued:0,reason:'ALREADY_READY'},ids:[]};
   const old=force&&ready?ready:audios.find(a=>a.voiceGender===gender);
   if(old?.currentJobId){const [job]=await m.query("SELECT id FROM tts_jobs WHERE id=$1 AND (status='QUEUED' OR (status='RUNNING' AND lease_until>now()))",[old.currentJobId]);if(job)return {value:{queued:0,reason:'ALREADY_QUEUED'},ids:[]};}
   const a=await m.save(PoiAudio,m.create(PoiAudio,{...(old??{}),poiId,translationId:tr.id,langCode:lang,voiceGender:gender,source:'TTS',status:'PENDING',audioUrl:null,textHash:null,currentJobId:null}));
   await this.queue(m,poi,tr,a);return {value:{queued:1,reason:'QUEUED'},ids:[poiId]};
  });
 }
 async remove(id:string) {
   await contentWrite(this.ds,async m=>{const p=await m.findOne(Poi,{where:{id}});if(!p)throw new NotFoundException();await m.softDelete(Poi,id);return {value:null,ids:[id]};});
   await this.cache.invalidate();
 }
 async listPublic(mapId:string,lang:string) { checkLang(lang);const v=await this.rev.current();return this.cache.getOrSet(this.cache.keyList(mapId,lang,v),60,async()=>({contentVersion:v,items:(await this.queryPublic(mapId)).map(p=>this.toPublic(p,lang))})); }
 async detailPublic(id:string,lang:string) {checkLang(lang);const v=await this.rev.current();return this.cache.getOrSet(this.cache.keyDetail(id,lang,v),60,async()=>{const p=await this.pois.findOne({where:{id,status:'PUBLISHED'},relations:{translations:true,audios:true}});if(!p)throw new NotFoundException();return this.toPublic(p,lang);});}
 async findOneAdmin(id:string) {const p=await this.pois.findOne({where:{id},relations:{translations:true,audios:true}});if(!p)throw new NotFoundException();return p;}
 adminList(page=1,limit=20) {if(!Number.isInteger(page)||page<1||!Number.isInteger(limit)||limit<1)throw new BadRequestException('page/limit phải nguyên dương.');limit=Math.min(limit,100);return this.pois.findAndCount({relations:{translations:true,audios:true},order:{sortOrder:'ASC',code:'ASC'},skip:(page-1)*limit,take:limit}).then(([items,total])=>({items,total,page,limit}));}
 queryPublic(mapId:string) {return this.pois.find({where:{mapId,status:'PUBLISHED'},relations:{translations:true,audios:true},order:{sortOrder:'ASC',code:'ASC'}});}
 toPublic(p:Poi,lang:string) {
   const tr=p.translations.find(t=>t.langCode===lang);
   if(!tr) return {id:p.id,code:p.code,lat:p.latitude,lng:p.longitude,geoVerified:p.geoVerified,geoSourceUrl:p.geoSourceUrl,schematic:p.schematicX!=null?[p.schematicX,p.schematicY]:null,floorId:p.floorId,categoryId:p.categoryId,imageUrl:p.imageUrl,triggerRadiusM:p.triggerRadiusM,version:p.version,lang,name:'',summary:null,scriptText:'',audio:null,translationMissing:true};
   const au=p.audios.find(a=>a.langCode===tr.langCode&&a.status==='READY'&&a.textHash===tr.textHash&&a.audioUrl);
   return {id:p.id,code:p.code,lat:p.latitude,lng:p.longitude,geoVerified:p.geoVerified,geoSourceUrl:p.geoSourceUrl,schematic:p.schematicX!=null?[p.schematicX,p.schematicY]:null,floorId:p.floorId,categoryId:p.categoryId,imageUrl:p.imageUrl,triggerRadiusM:p.triggerRadiusM,version:p.version,lang:tr.langCode,name:tr.name,summary:tr.summary,scriptText:tr.scriptText,audio:au?{url:au.audioUrl,provider:au.provider,voiceName:au.voiceName,durationSec:au.durationSec?+au.durationSec:null,sizeBytes:au.sizeBytes}:null,translationMissing:false};
 }
}
