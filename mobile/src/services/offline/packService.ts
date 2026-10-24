import * as FS from 'expo-file-system/legacy';       // SDK ≤ 53: import từ 'expo-file-system'
import { env } from '../../config/env';
import { applyManifest, emptyPack, jobsBytes, Job, Manifest, PackIndex, currentAudioUri } from './packLogic';
import { loadPack, removePackIndex, saveExtras, savePack } from './offlineStore';
import {assetUrl,normalizePoi} from '../api/assets';

const dirOf = (lang: string) => `${FS.documentDirectory}audio/${lang}/`;

export interface Progress { doneBytes: number; totalBytes: number; filesDone: number; files: number; }
export interface Cancel { cancelled: boolean; active: Set<FS.DownloadResumable>; }
export const newCancel = (): Cancel => ({ cancelled: false, active: new Set() });
export const cancel = (c: Cancel) => { c.cancelled = true; c.active.forEach((d) => d.cancelAsync().catch(() => undefined)); };

async function fetchManifest(lang: string, since: number): Promise<Manifest> {
  const r = await fetch(`${env.API_BASE}/sync/manifest?mapId=${env.MAP_ID}&lang=${lang}&since=${since}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`manifest ${r.status}`);
  const m:Manifest=await r.json();return {...m,items:m.items.map(normalizePoi),downloads:m.downloads.map(d=>({...d,url:assetUrl(d.url)}))};
}

/** Bỏ các mục chỉ mục trỏ tới file không còn tồn tại */
async function verified(p: PackIndex): Promise<PackIndex> {
  const files = { ...p.files };
  for (const [id, uri] of Object.entries(files)) if (!(await FS.getInfoAsync(uri)).exists) delete files[id];
  return { ...p, files };
}

/** Xem trước: cần tải bao nhiêu (không ghi gì) */
export async function previewPack(lang: string) {
  const prev = await verified(loadPack(lang) ?? emptyPack(lang));
  const { jobs } = applyManifest(prev, await fetchManifest(lang, prev.rev));
  return { files: jobs.length, bytes: jobsBytes(jobs) };
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}

const running=new Set<string>();
export async function syncPack(lang:string,c:Cancel,onProgress?:(p:Progress)=>void){
 if(running.has(lang))throw new Error('Gói ngôn ngữ này đang được tải.');running.add(lang);
 try{return await syncPackImpl(lang,c,onProgress);}finally{running.delete(lang);}
}
async function syncPackImpl(lang: string, c: Cancel, onProgress?: (p: Progress) => void) {
  const prev = await verified(loadPack(lang) ?? emptyPack(lang));
  const { pack, jobs, obsolete } = applyManifest(prev, await fetchManifest(lang, prev.rev));

  const need = jobsBytes(jobs), free = await FS.getFreeDiskStorageAsync();
  if (free < need * 1.2 + 20_000_000) throw new Error('NO_SPACE');

  await FS.makeDirectoryAsync(dirOf(lang), { intermediates: true }).catch(() => undefined);
  for (const u of obsolete) await FS.deleteAsync(u, { idempotent: true });
  savePack(pack);                                                    // nội dung văn bản dùng được ngay, audio về sau

  const prog: Progress = { doneBytes: 0, totalBytes: need, filesDone: 0, files: jobs.length };
  let failed = 0;
  const one = async (j: Job) => {
    const dest = dirOf(lang) + j.fileName, part = dest + '.part';
    for (let attempt = 0; attempt < 3 && !c.cancelled; attempt++) {
      try {
        let last = 0;
        const dl = FS.createDownloadResumable(j.url, part, {}, (e) => {
          prog.doneBytes += e.totalBytesWritten - last; last = e.totalBytesWritten; onProgress?.({ ...prog });
        });
        c.active.add(dl);
        let res;
        try{res=await dl.downloadAsync();}finally{c.active.delete(dl);}
        if (!res || res.status !== 200) throw new Error(`HTTP ${res?.status}`);
        const info = await FS.getInfoAsync(part);
        if (!info.exists || (j.sizeBytes && (info as any).size !== j.sizeBytes)) throw new Error('size mismatch');   // file hỏng/cụt
        await FS.moveAsync({ from: part, to: dest });
        pack.files[j.poiId] = dest; savePack(pack);                  // ghi chỉ mục từng file: bị tắt app giữa chừng vẫn giữ phần đã tải
        prog.filesDone++; onProgress?.({ ...prog });
        return;
      } catch {
        await FS.deleteAsync(part, { idempotent: true });
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
    if (!c.cancelled) failed++;
  };
  await pool(jobs, 3, one);

  await syncExtras().catch(() => undefined);                         // QR + beacon để dùng offline, không bắt buộc
  return { ok: failed === 0 && !c.cancelled, failed, cancelled: c.cancelled };
}

async function syncExtras() {
  const [q, b] = await Promise.all([fetch(`${env.QR_API_BASE}/qr`), fetch(`${env.QR_API_BASE}/beacons`)]);
  if(!q.ok||!b.ok)throw new Error('Không tải được QR/beacon.');
  const qr: Record<string, string> = {};
  (await q.json()).forEach((r: any) => (qr[r.token] = r.poiId));
  saveExtras({ qr, beacons: await b.json(), updatedAt: Date.now() });
}

export async function removePack(lang: string) { await FS.deleteAsync(dirOf(lang), { idempotent: true }); removePackIndex(lang); }

/** Đường dẫn audio để phát: file offline nếu có, không thì URL mạng */
export function resolveAudioUri(lang: string, poiId: string, remote?: string | null) { return currentAudioUri(loadPack(lang),poiId,remote); }
