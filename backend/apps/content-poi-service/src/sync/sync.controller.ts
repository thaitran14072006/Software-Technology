import { BadRequestException, Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Poi } from '../entities/poi.entity';
import { checkLang, PoiService } from '../poi/poi.service';
import {CanonicalUuidPipe} from '@app/common/pipes/canonical-uuid.pipe';
@Controller({path:'sync',version:'1'})
export class SyncController {
 constructor(private ds:DataSource,private svc:PoiService) {}
 @Get('manifest') async manifest(@Query('mapId',CanonicalUuidPipe) mapId:string,@Query('lang') lang='vi',@Query('since') since='0') {
   checkLang(lang);if(!/^\d+$/.test(since)||!Number.isSafeInteger(+since))throw new BadRequestException('since phải nguyên không âm.');
   return this.ds.transaction('REPEATABLE READ',async m=>{
     const [{rev}]=await m.query('SELECT rev FROM content_clock WHERE id=1');
     if(+since>+rev) throw new BadRequestException('Revision máy chủ đã đổi; tải lại gói từ since=0.');
     const rows=await m.createQueryBuilder(Poi,'p').withDeleted().leftJoinAndSelect('p.translations','t').leftJoinAndSelect('p.audios','a').where('p.mapId=:mapId AND p.rev>:since AND p.rev<=:rev',{mapId,since:+since,rev}).getMany();
     const items=rows.filter(p=>!p.deletedAt&&p.status==='PUBLISHED').map(p=>this.svc.toPublic(p,lang));
     return {rev:+rev,items,deletedIds:rows.filter(p=>p.deletedAt||p.status!=='PUBLISHED').map(p=>p.id),downloads:items.filter(p=>p.audio).map(p=>({poiId:p.id,url:p.audio!.url,sizeBytes:p.audio!.sizeBytes}))};
   });
 }
}
