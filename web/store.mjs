import { localize, MAP_ID, LANGS, toDto, newId } from './core.mjs';
export const settings = JSON.parse(localStorage.getItem('sag:settings') || 'null') || { mode: 'demo' };
let seed;
export async function loadSeed() {
  if (!seed) { const res = await fetch('./data/pois.json'); if (!res.ok) throw new Error('Không tải được dữ liệu demo.'); seed = await res.json(); }
  return seed;
}
export function saveSettings(mode) { settings.mode = mode; localStorage.setItem('sag:settings', JSON.stringify(settings)); }
export function token() { return sessionStorage.getItem('sag:token') || ''; }
// Read JSON once, including Nest DELETE endpoints which can return an empty 200 response.
export async function api(path, options = {}, qr = false) {
  const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${qr ? '/qr-api' : '/content-api'}/${path}`, {
    ...options, headers: { ...(multipart ? {} : {'content-type': 'application/json'}), ...(options.method || path.startsWith('admin/') || path === 'auth/me' ? { Authorization: `Bearer ${token()}` } : {}) }, signal: AbortSignal.timeout(20000),
  });
  if (res.status === 401 && (!path.startsWith('auth/') || path==='auth/me') && !options._refreshed && sessionStorage.getItem('sag:refresh')) {
    try { const fresh = await api('auth/refresh', {method:'POST',body:JSON.stringify({refreshToken:sessionStorage.getItem('sag:refresh')})}); sessionStorage.setItem('sag:token',fresh.accessToken);sessionStorage.setItem('sag:refresh',fresh.refreshToken);return api(path,{...options,_refreshed:true},qr); } catch { sessionStorage.removeItem('sag:refresh'); }
  }
  const body = await res.text();
  let parsed;
  try { parsed = body ? JSON.parse(body) : null; } catch { throw new Error('API trả về dữ liệu không hợp lệ.'); }
  if (!res.ok) throw new Error(res.status === 401 ? 'JWT không hợp lệ hoặc hết hạn. Mở Kết nối để nhập token.' : String(parsed?.fields ? Object.entries(parsed.fields).map(([k, v]) => `${k}: ${v}`).join('; ') : Array.isArray(parsed?.message) ? parsed.message.join('; ') : parsed?.message || parsed?.code || `HTTP ${res.status}`));
  return parsed;
}
export async function demoPois() {
  const data = await loadSeed();
  return JSON.parse(localStorage.getItem('sag:demo-pois') || 'null') || structuredClone(data.pois);
}
export const packKey = (lang) => `sag:pack:${settings.mode}:${lang}`;
export async function getPois(lang) {
  if (settings.mode === 'demo') return { items: (await demoPois()).filter(p => p.status === 'PUBLISHED').map(p => localize(p, lang)), source: 'demo' };
  try {
    const data = await api(`pois?mapId=${MAP_ID}&lang=${lang}`);
    return { ...data, source: 'api' };
  } catch (error) {
    const saved = localStorage.getItem(packKey(lang));
    if (saved) return { ...JSON.parse(saved), source: 'offline', warning: error.message };
    throw error;
  }
}
export async function getAdminPois() {
  if (settings.mode === 'demo') return demoPois();
  let page = 1, items = [], data;
  do { data = await api(`admin/pois?limit=100&page=${page++}`); items.push(...data.items); } while (items.length < data.total);
  return items.map(p => ({ ...p, lat: p.latitude, lng: p.longitude, schematic: p.schematicX == null ? null : [p.schematicX, p.schematicY] }));
}
export async function savePoi(poi, isNew) {
  if (settings.mode === 'demo') {
    const pois = await demoPois();
    if (pois.some(p => p.code === poi.code && p.id !== poi.id)) throw new Error('Mã điểm đã tồn tại.');
    const i = pois.findIndex(p => p.id === poi.id);
    if (isNew) pois.push({ ...poi, id: newId(), version: 1 });
    else { if (i < 0) throw new Error('Điểm không tồn tại.'); pois[i] = { ...poi, version: (pois[i].version || 1) + 1 }; }
    localStorage.setItem('sag:demo-pois', JSON.stringify(pois));
    return;
  }
  return api(isNew ? 'admin/pois' : `admin/pois/${encodeURIComponent(poi.id)}`, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(toDto(poi)) });
}
export async function deletePoi(id) {
  if (settings.mode === 'demo') localStorage.setItem('sag:demo-pois', JSON.stringify((await demoPois()).filter(p => p.id !== id)));
  else await api(`admin/pois/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  localStorage.setItem(`sag:pack-date:${settings.mode}`, new Date().toISOString());
  localStorage.setItem(`sag:pack-meta:${settings.mode}`,JSON.stringify({provider:provider||null,audioCount,audioMissing}));
  return { audioCount, audioFailed, audioMissing };
}
