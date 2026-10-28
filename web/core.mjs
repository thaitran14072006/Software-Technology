export const LANGS = { vi: 'Tiếng Việt', en: 'English', ja: '日本語', ko: '한국어', zh: '中文' };
export const LOCALES = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' };
export const MAP_ID = '00000000-0000-0000-0000-000000000001';
export const CENTER = [390, 850];
export function normalizeSearch(value) {
  return String(value ?? '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').trim();
}
export function matchesPoiQuery(poi, query, extraText = '') {
  const normalizedQuery = normalizeSearch(query);
  if (/^\d+$/.test(normalizedQuery) && Number.isInteger(Number(poi.sortOrder)) && Number(poi.sortOrder) > 0) {
    return Number(poi.sortOrder) === Number(normalizedQuery);
  }
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const translations = Array.isArray(poi.translations) ? poi.translations : [];
  const extraFields = Array.isArray(extraText) ? extraText : [extraText];
  const searchableFields = [
    poi.code, poi.sortOrder, poi.name, poi.summary, poi.scriptText,
    ...translations.flatMap(item => [item.name, item.summary, item.scriptText]), ...extraFields,
  ].filter(Boolean).map(normalizeSearch);
  return searchableFields.some(field => tokens.every(token => field.includes(token)));
}
export function newId() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  // getRandomValues also works on HTTP LAN pages, where randomUUID may be unavailable.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function localize(poi, lang) {
  const tr = poi.translations?.find(t => t.langCode === lang);
  if (!tr) return { ...poi, lang, name: '', summary: '', scriptText: '', audio: null, translationMissing: true };
  const audio = poi.audios?.find(a => a.langCode === lang && a.status === 'READY' && (!tr.textHash || a.textHash === tr.textHash));
  return { ...poi, lang, name: tr.name, summary: tr.summary || '', scriptText: tr.scriptText, audio: audio ? { url: audio.audioUrl, provider: audio.provider, voiceName: audio.voiceName } : null, translationMissing: false };
}
export function routeTo(edges, from, to) {
  from = String(from); to = String(to);
  const adj = new Map();
  for (const [a, b, km] of edges) {
    for (const [u, v] of [[String(a), String(b)], [String(b), String(a)]]) {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u).push([v, km]);
    }
  }
  if (!adj.has(from) || !adj.has(to)) return null;
  const dist = new Map([[from, 0]]), prev = new Map(), done = new Set();
  while (true) {
    const next = [...dist].filter(([id]) => !done.has(id)).sort((a, b) => a[1] - b[1])[0];
    if (!next) return null;
    const [id, km] = next;
    if (id === to) {
      const codes = [id];
      while (prev.has(codes[0])) codes.unshift(prev.get(codes[0]));
      return { codes, km, minutes: Math.ceil(km / 4.3 * 60) };
    }
    done.add(id);
    for (const [v, weight] of adj.get(id)) if (km + weight < (dist.get(v) ?? Infinity)) { dist.set(v, km + weight); prev.set(v, id); }
  }
}
export function haversine(a, b) {
  const rad = n => n * Math.PI / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function qrValue(input) {
  const text = input.trim();
  if (/^\d{1,3}$/.test(text)) return { code: text };
  const sag = text.match(/^sag:\/\/poi\/([A-Za-z0-9_-]{8,64})$/);
  if (sag) return { token: sag[1] };
  if (/^[A-Za-z0-9_-]{8,64}$/.test(text)) return { token: text };
  try {
    const u = new URL(text);
    if (['http:', 'https:'].includes(u.protocol) && /^\d{1,3}$/.test(u.searchParams.get('poi') || '')) return { code: u.searchParams.get('poi') };
  } catch {}
  throw new Error('Mã không hợp lệ. Nhập số điểm, token hoặc sag://poi/<token>.');
}
export function validatePoi(poi, api = false) {
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(poi.code)) throw new Error('Mã điểm chỉ gồm chữ, số, dấu - hoặc _.');
  if (![1, 2, 3].includes(poi.categoryId)) throw new Error('Chọn nhóm điểm hợp lệ.');
  if (!['DRAFT', 'PUBLISHED'].includes(poi.status)) throw new Error('Trạng thái không hợp lệ.');
  if (!Array.isArray(poi.translations) || !poi.translations.length || poi.translations.some(t => !t.name.trim() || !t.scriptText.trim() || t.name.length > 200 || !LANGS[t.langCode])) throw new Error('Mỗi bản dịch cần tên (tối đa 200 ký tự) và lời thuyết minh.');
  if (new Set(poi.translations.map(t => t.langCode)).size !== poi.translations.length) throw new Error('Ngôn ngữ bị trùng.');
  if (!Number.isInteger(poi.triggerRadiusM) || poi.triggerRadiusM < 3 || poi.triggerRadiusM > 200) throw new Error('Bán kính phải là số nguyên từ 3 đến 200 m.');
  for (const [key, max] of [['lat', 90], ['lng', 180]]) {
    if ((api || poi.geoVerified || poi[key] != null) && (poi[key] == null || !Number.isFinite(poi[key]) || Math.abs(poi[key]) > max)) throw new Error('Tọa độ GPS chưa hợp lệ; chế độ API yêu cầu kinh độ và vĩ độ.');
  }
  if (poi.schematic && (poi.schematic.length !== 2 || poi.schematic.some((n, i) => !Number.isFinite(n) || n < 0 || n > [1380, 900][i]))) throw new Error('Tọa độ sơ đồ phải nằm trong khung 1380 × 900.');
  return poi;
}
export function toDto(poi) {
  validatePoi(poi, true);
  return { code: poi.code, mapId: MAP_ID, categoryId: poi.categoryId, latitude: poi.lat, longitude: poi.lng, geoVerified: poi.geoVerified, schematicX: poi.schematic?.[0] ?? null, schematicY: poi.schematic?.[1] ?? null, triggerRadiusM: poi.triggerRadiusM, status: poi.status, translations: poi.translations };
}
