import type { Poi } from '../api/poi.api';

export interface PackIndex { lang: string; rev: number; items: Record<string, Poi>; files: Record<string, string>; updatedAt: number; }
export interface Manifest { rev: number; items: Poi[]; deletedIds: string[]; downloads: { poiId: string; url: string; sizeBytes: number | null }[]; }
export interface Job { poiId: string; url: string; fileName: string; sizeBytes: number | null; }

export const emptyPack = (lang: string): PackIndex => ({ lang, rev: 0, items: {}, files: {}, updatedAt: 0 });
// URL audio có hash nội dung ở tên file (backend) -> tên file quyết định "đã có bản mới nhất chưa"
export const fileNameOf = (url: string) => url.split('?')[0].split('/').pop()!;
export function currentAudioUri(pack:PackIndex|null,poiId:string,remote?:string|null){
  if(!remote)return null;
  const saved=pack?.files[poiId];
  return saved && fileNameOf(saved)===fileNameOf(remote)?saved:remote;
}

export function applyManifest(prev: PackIndex, m: Manifest) {
  const items = { ...prev.items }, files = { ...prev.files };
  const jobs: Job[] = [], obsolete: string[] = [], queued = new Set<string>();

  for (const id of m.deletedIds) { delete items[id]; if (files[id]) { obsolete.push(files[id]); delete files[id]; } }

  for (const p of m.items) {
    items[p.id] = p;
    const old = files[p.id];
    if (!p.audio?.url) { if (old) { obsolete.push(old); delete files[p.id]; } continue; }
    const fn = fileNameOf(p.audio.url);
    if (old && fileNameOf(old) === fn) continue;                       // đã có đúng phiên bản
    if (old) { obsolete.push(old); delete files[p.id]; }
    jobs.push({ poiId: p.id, url: p.audio.url, fileName: fn, sizeBytes: p.audio.sizeBytes });
    queued.add(p.id);
  }
  // Tự chữa: POI có audio nhưng thiếu file (lần tải trước hỏng giữa chừng, hoặc bị hệ điều hành xóa)
  for (const p of Object.values(items)) {
    if (p.audio?.url && !files[p.id] && !queued.has(p.id))
      jobs.push({ poiId: p.id, url: p.audio.url, fileName: fileNameOf(p.audio.url), sizeBytes: p.audio.sizeBytes });
  }
  return { pack: { ...prev, rev: m.rev, items, files, updatedAt: Date.now() } as PackIndex, jobs, obsolete };
}

export const jobsBytes = (jobs: Job[]) => jobs.reduce((s, j) => s + (j.sizeBytes ?? 200_000), 0);   // thiếu size: ước 200 KB
