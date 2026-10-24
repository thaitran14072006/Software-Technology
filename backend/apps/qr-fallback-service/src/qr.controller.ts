import { Controller,Get,NotFoundException,Param } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Controller({path:'qr',version:'1'})
export class QrController {
 constructor(private ds:DataSource){}
 @Get() async list(){const rows=await this.ds.query("SELECT q.token,q.poi_id FROM poi_qr_codes q JOIN pois p ON p.id=q.poi_id WHERE q.kind='POI' AND q.is_active AND p.deleted_at IS NULL AND p.status='PUBLISHED'");return rows.map((r:any)=>({token:r.token,poiId:r.poi_id}));}
 @Get(':token') async resolve(@Param('token') token:string){
  if(!/^[A-Za-z0-9_-]{8,64}$/.test(token))throw new NotFoundException({code:'QR_INVALID'});
  const [r]=await this.ds.query("SELECT q.* FROM poi_qr_codes q LEFT JOIN pois p ON p.id=q.poi_id WHERE q.token=$1 AND q.is_active AND (q.kind='GATE' OR (p.deleted_at IS NULL AND p.status='PUBLISHED'))",[token]);
  if(!r)throw new NotFoundException({code:'QR_INVALID'});return r.kind==='GATE'?{kind:'GATE',url:r.target_url}:{kind:'POI',poiId:r.poi_id};
 }
}
@Controller({path:'beacons',version:'1'})
export class BeaconController {constructor(private ds:DataSource){} @Get()async list(){const rows=await this.ds.query("SELECT b.* FROM ble_beacons b JOIN pois p ON p.id=b.poi_id WHERE b.is_active AND p.deleted_at IS NULL AND p.status='PUBLISHED'");return rows.map((b:any)=>({uuid:b.uuid.toLowerCase(),major:b.major,minor:b.minor,txPower:b.tx_power,poiId:b.poi_id}));}}
