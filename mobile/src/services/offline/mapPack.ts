import * as MapLibre from '@maplibre/maplibre-react-native';
import { env } from '../../config/env';
export const MAP_PACK='cattien-outdoors';
const BBOX={s:11.39,w:107.30,n:11.49,e:107.45};
export const canDownloadMap=Boolean(env.OFFLINE_MAP_STYLE);
export const estimateTiles=()=>0; // provider-specific tile counts cannot be guessed from a style URL
export const hasMapPack=async()=>Boolean(await MapLibre.OfflineManager.getPack(MAP_PACK).catch(()=>null));
export function downloadMapPack(onProgress:(p:number)=>void):Promise<void>{
 if(!env.OFFLINE_MAP_STYLE)return Promise.reject(new Error('Sơ đồ có sẵn ngoại tuyến. Tải bản đồ địa lý cần nguồn tiles cho phép tải trước.'));
 return new Promise((resolve,reject)=>{
  MapLibre.OfflineManager.createPack({name:MAP_PACK,styleURL:env.OFFLINE_MAP_STYLE,bounds:[[BBOX.e,BBOX.n],[BBOX.w,BBOX.s]],minZoom:11,maxZoom:15},(_p:any,s:any)=>{onProgress(s.percentage);if(s.percentage>=100)resolve();},(_p:any,e:any)=>reject(e)).catch(reject);
 });
}
export const removeMapPack=()=>MapLibre.OfflineManager.deletePack(MAP_PACK);
