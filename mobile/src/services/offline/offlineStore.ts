import { kv } from '../storage/kv';
import type { PackIndex } from './packLogic';
import type { BeaconRef } from '../ble/beaconScanner';

export interface Extras { qr: Record<string, string>; beacons: BeaconRef[]; updatedAt: number; }
const pk = (l: string) => `pack:${l}`;

export const loadPack = (lang: string): PackIndex | null => { const s = kv.getString(pk(lang)); return s ? JSON.parse(s) : null; };
export const savePack = (p: PackIndex) => kv.set(pk(p.lang), JSON.stringify(p));
export const removePackIndex = (lang: string) => kv.delete(pk(lang));
export const listPackLangs = () => kv.getAllKeys().filter((k) => k.startsWith('pack:')).map((k) => k.slice(5));
export const loadExtras = (): Extras | null => { const s = kv.getString('extras'); return s ? JSON.parse(s) : null; };
export const saveExtras = (e: Extras) => kv.set('extras', JSON.stringify(e));
export const packBytes = (p: PackIndex) => Object.values(p.items).reduce((s, i) => s + (p.files[i.id] ? i.audio?.sizeBytes ?? 0 : 0), 0);
