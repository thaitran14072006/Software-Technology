import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/common';
import { PoiService } from './poi.service';
import { CreatePoiDto } from '../dto/v1/create-poi.dto';
import { UpdatePoiDto } from '../dto/v1/update-poi.dto';
import {CanonicalUuidPipe} from '@app/common/pipes/canonical-uuid.pipe';

@Controller({ path: 'pois', version: '1' })            // /api/v1/pois (công khai)
export class PublicPoiController {
  constructor(private readonly svc: PoiService) {}

  @Get() list(@Query('mapId', CanonicalUuidPipe) mapId: string, @Query('lang') lang = 'vi') {
    return this.svc.listPublic(mapId, lang);
  }
  @Get(':id') detail(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang = 'vi') {
    return this.svc.detailPublic(id, lang);
  }
}

@Controller({ path: 'admin/pois', version: '1' })      // /api/v1/admin/pois (cần JWT ADMIN/EDITOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPoiController {
  constructor(private readonly svc: PoiService) {}

  @Get() list(@Query('page') page = '1', @Query('limit') limit = '20') { return this.svc.adminList(Number(page), Number(limit)); }
  @Get(':id') one(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOneAdmin(id); }
  @Post() create(@Body() dto: CreatePoiDto, @Req() req: any) { return this.svc.create(dto, req.user?.sub); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePoiDto) { return this.svc.update(id, dto); }
  @Post(':id/audios/regenerate') regen(@Param('id', ParseUUIDPipe) id: string) { return this.svc.regenerateAudio(id); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
