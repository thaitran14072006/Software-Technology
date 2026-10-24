import {env} from '../../config/env';
export function assetUrl(url:string){return url.startsWith('/audio-assets/')?`${env.ASSET_BASE.replace(/\/$/,'')}/${url.slice('/audio-assets/'.length)}`:url;}
export function normalizePoi<T extends {audio:{url:string}|null}>(poi:T):T {return poi.audio?{...poi,audio:{...poi.audio,url:assetUrl(poi.audio.url)}}:poi;}
