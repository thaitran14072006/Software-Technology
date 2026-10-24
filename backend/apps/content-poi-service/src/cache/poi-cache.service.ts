import { Injectable } from '@nestjs/common';
import { RevService } from '../sync/rev.service';
/** Small bounded process cache; PostgreSQL clock is always authoritative. */
@Injectable()
export class PoiCacheService {
  static readonly TTL = { list:60, detail:60, audio:60 };
  private entries = new Map<string,{ expires:number; value:any }>();
  constructor(private rev: RevService) {}
  getContentVersion() { return this.rev.current(); }
  keyList(mapId:string,lang:string,v:number) { return `list:${mapId}:${lang}:${v}`; }
  keyDetail(id:string,lang:string,v:number) { return `detail:${id}:${lang}:${v}`; }
  async getOrSet<T>(key:string,ttl:number,loader:()=>Promise<T>):Promise<T> {
    const old=this.entries.get(key); if(old && old.expires>Date.now()) return old.value;
    const value=await loader();
    if(this.entries.size>500) this.entries.clear();
    this.entries.set(key,{expires:Date.now()+ttl*1000,value}); return value;
  }
  async invalidate() { this.entries.clear(); }
}
