import catalog from './poi-catalog.json';
type Point={code:string;lat:number;lng:number;geoVerified:boolean;geoSourceUrl?:string|null;lang:string;name:string};
/** Keep retired points out of old caches when the updated APK starts offline. */
export function applyPoiCatalog<T extends Point>(items:T[]):T[]{
 const byCode=new Map(catalog.points.map(p=>[p.code,p]));
 return items.filter(p=>byCode.has(p.code)).map(item=>{
  const p=byCode.get(item.code)!;
  return {...item,lat:p.latitude,lng:p.longitude,geoVerified:false,geoSourceUrl:p.geoSourceUrl,name:(p.names as Record<string,string>)[item.lang]||item.name};
 }).sort((a,b)=>byCode.get(a.code)!.order-byCode.get(b.code)!.order);
}
