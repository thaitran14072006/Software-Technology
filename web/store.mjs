import { MAP_ID, LANGS, toDto } from './core.mjs';
import {currentCatalogItems} from './poi-catalog.mjs';
let seed;
export function useExactSeedAudio(items, catalog) {
  const byCode = new Map((catalog?.pois || []).map(p => [p.code, p]));
  return items.map(item => {
    if (item.audio?.url || item.translationMissing) return item;
    const source = byCode.get(item.code);
    const translation = source?.translations?.find(t => t.langCode === item.lang);
    const audio = source?.audios?.find(a => a.langCode === item.lang && a.status === 'READY' && a.audioUrl && a.textHash === translation?.textHash);
    if (!translation || !audio || item.scriptText !== translation.scriptText) return item;
    return { ...item, audio: { url: audio.audioUrl, provider: audio.provider, voiceName: audio.voiceName, durationSec: audio.durationSec ?? null, sizeBytes: audio.sizeBytes ?? null } };
  });
}
export async function loadSeed() {
  if (!seed) { const res = await fetch('./data/pois.json'); if (!res.ok) throw new Error('Không tải được dữ liệu sơ đồ.'); seed = await res.json(); }
  return seed;
}
export function token() { return sessionStorage.getItem('sag:token') || ''; }
// Read JSON once, including Nest DELETE endpoints which can return an empty 200 response.
export async function api(path, options = {}, qr = false) {
  const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const refreshToken = sessionStorage.getItem('sag:refresh');
  const res = await fetch(`${qr ? '/qr-api' : '/content-api'}/${path}`, {
    ...options, headers: { ...(multipart ? {} : {'content-type': 'application/json'}), ...(options.method || path.startsWith('admin/') || path === 'auth/me' ? { Authorization: `Bearer ${token()}` } : {}) }, signal: AbortSignal.timeout(20000),
  });
  if (res.status === 401 && (!path.startsWith('auth/') || path === 'auth/me') && !options._refreshed &&
      refreshToken && refreshToken === sessionStorage.getItem('sag:refresh')) {
    try {
      const fresh = await api('auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
      if (refreshToken === sessionStorage.getItem('sag:refresh')) {
        sessionStorage.setItem('sag:token', fresh.accessToken);
        sessionStorage.setItem('sag:refresh', fresh.refreshToken);
        return api(path, { ...options, _refreshed: true }, qr);
      }
    } catch {
      if (refreshToken === sessionStorage.getItem('sag:refresh')) sessionStorage.removeItem('sag:refresh');
    }
  }
  const body = await res.text();
  let parsed;
  try { parsed = body ? JSON.parse(body) : null; } catch { throw new Error('API trả về dữ liệu không hợp lệ.'); }
  if (!res.ok) {
    const serverMessage = String(parsed?.fields ? Object.entries(parsed.fields).map(([k, v]) => `${k}: ${v}`).join('; ') : Array.isArray(parsed?.message) ? parsed.message.join('; ') : parsed?.message || parsed?.code || `HTTP ${res.status}`);
    if (path === 'auth/login') {
      if (res.status === 401) throw new Error(serverMessage || 'Email hoặc mật khẩu không đúng.');
      if (res.status === 400) {
        const fields = parsed?.fields || {};
        if (fields.email) throw new Error('Vui lòng nhập địa chỉ email hợp lệ (tối đa 255 ký tự).');
        if (fields.password) throw new Error('Vui lòng nhập mật khẩu từ 1 đến 256 ký tự.');
        throw new Error('Vui lòng kiểm tra lại email và mật khẩu.');
      }
    }
    throw new Error(res.status === 401 ? 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.' : serverMessage);
  }
  return parsed;
}
export const packKey = (lang) => `sag:pack:api:${lang}`;
export async function getPois(lang) {
  const catalog=seed;
  try {
    const data = await api(`pois?mapId=${MAP_ID}&lang=${lang}`);
    const items=currentCatalogItems(data.items,catalog);
    return { ...data, items:useExactSeedAudio(items,catalog),source: 'api' };
  } catch (error) {
    const saved = localStorage.getItem(packKey(lang));
    if (saved) {const pack=JSON.parse(saved);return { ...pack,items:currentCatalogItems(pack.items,catalog,{cached:true}), source: 'offline', warning: error.message };}
    throw error;
  }
}
export async function getAdminPois() {
  let page = 1, items = [], data;
  do { data = await api(`admin/pois?limit=100&page=${page++}`); items.push(...data.items); } while (items.length < data.total);
  return items.map(p => ({ ...p, lat: p.latitude, lng: p.longitude, schematic: p.schematicX == null ? null : [p.schematicX, p.schematicY] }));
}
export async function savePoi(poi, isNew) {
  return api(isNew ? 'admin/pois' : `admin/pois/${encodeURIComponent(poi.id)}`, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(toDto(poi)) });
}
export async function deletePoi(id) {
  await api(`admin/pois/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function saveOffline(onProgress, {provider} = {}) {
  let audioCount = 0, audioFailed = 0, audioMissing = 0;
  const cache = 'caches' in window ? await caches.open('sag-audio-v1') : null;
  const packs = [];
  for (const lang of Object.keys(LANGS)) {
    const data = await getPois(lang);
    if (data.source === 'offline') throw new Error('Cần kết nối lại API để cập nhật gói. Gói cũ được giữ nguyên.');
    if(provider) for(const p of data.items) if(p.audio?.provider!==provider){p.audio=null;audioMissing++;}
    packs.push([lang, data]);
    for (const p of data.items) if (p.audio?.url) {
      try {
        if (!cache) throw new Error('Cache API unavailable');
        const url = new URL(p.audio.url, location.href);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid audio URL');
        const response = await fetch(url.href, { mode: 'cors', signal: AbortSignal.timeout(20000) });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) throw new Error('Invalid audio');
        const blob=await response.blob();if(!blob.size || (p.audio.sizeBytes && blob.size!==Number(p.audio.sizeBytes)))throw new Error('Incomplete audio download');
        await cache.put(url.href, new Response(blob,{headers:{'content-type':'audio/mpeg','content-length':String(blob.size)}})); audioCount++;
      } catch { audioFailed++; }
    }
    onProgress(lang);
  }
  if(audioFailed)throw new Error(`${audioFailed} audio chưa tải đủ. Gói cũ được giữ lại; hãy tải lại khi mạng ổn định.`);
  if(provider && !audioCount)throw new Error('Chưa có audio Google AI Studio để tải. Cần tạo audio trên máy chủ trước.');
  for (const [lang, data] of packs) localStorage.setItem(packKey(lang), JSON.stringify(data));
  localStorage.setItem('sag:pack-date:api', new Date().toISOString());
  localStorage.setItem('sag:pack-meta:api',JSON.stringify({provider:provider||null,audioCount,audioMissing,catalogVersion:seed?.catalogVersion}));
  return { audioCount, audioFailed, audioMissing };
}
