import { env } from '../../config/env';
import {normalizePoi} from './assets';
import {loadRuntimeConfig} from './runtimeConfig';

export interface Poi {
  id: string; code: string; lat: number; lng: number; geoVerified: boolean; geoSourceUrl?: string | null;
  schematic: [number, number] | null;                   // tọa độ "raw" trên sơ đồ
  floorId: string | null; categoryId: number | null; imageUrl: string | null;
  triggerRadiusM: number | null; version: number;
  lang: string; name: string; summary: string | null; scriptText: string; translationMissing?: boolean;
  audio: { url: string; durationSec: number | null; sizeBytes: number | null; provider?: string; voiceName?: string } | null;
}
export interface PoiList { contentVersion: number; items: Poi[]; }

export async function fetchPois(lang: string): Promise<PoiList> {
  const res = await fetch(`${env.API_BASE}/pois?mapId=${env.MAP_ID}&lang=${lang}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`POI API ${res.status}`);
  const data:PoiList=await res.json();await loadRuntimeConfig();return {...data,items:data.items.map(normalizePoi)};
}
