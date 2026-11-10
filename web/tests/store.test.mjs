import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const seed = JSON.parse(await readFile(new URL('../dist/data/pois.json', import.meta.url)));
function memoryStorage() { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) }; }
globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage();
const store = await import('../store.mjs');
const originalFetch = globalThis.fetch;
test('API can use a packaged Gemini clip only when its language and exact transcript match', () => {
  const source=seed.pois.find(p=>p.code==='9'), translation=source.translations.find(t=>t.langCode==='vi');
  const apiPoi={id:'live-9',code:'9',lang:'vi',scriptText:translation.scriptText,audio:null};
  const [matched]=store.useExactSeedAudio([apiPoi],seed);
  assert.equal(matched.audio.provider,'GEMINI'); assert.equal(matched.audio.url,source.audios.find(a=>a.langCode==='vi').audioUrl);
  assert.equal(store.useExactSeedAudio([{...apiPoi,scriptText:'Nội dung đã thay đổi.'}],seed)[0].audio,null);
  const apiAudio={url:'/content/audio.mp3',provider:'GEMINI'};
  assert.equal(store.useExactSeedAudio([{...apiPoi,audio:apiAudio}],seed)[0].audio,apiAudio);
  assert.equal(store.useExactSeedAudio([{...apiPoi,translationMissing:true}],seed)[0].audio,null);
});
test('demo CRUD persists edits, keeps drafts private and does not mutate source data', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({...seed,catalogVersion:undefined}));
  try {
    const poi = { ...structuredClone(seed.pois[0]), id: null, code: 'qa', status: 'DRAFT' };
    await store.savePoi(poi, true);
    let rows = await store.getAdminPois(); assert.equal(rows.length, 16);
    assert.equal((await store.getPois('vi')).items.some(p => p.code === 'qa'), false);
    const added = rows.find(p => p.code === 'qa');
    await store.savePoi({ ...added, status: 'PUBLISHED' }, false);
    assert.equal((await store.getPois('en')).items.find(p => p.code === 'qa').name, seed.pois[0].translations.find(t => t.langCode === 'en').name);
    await assert.rejects(() => store.savePoi({ ...poi, code: '1' }, true), /tồn tại/);
    await store.deletePoi(added.id); assert.equal((await store.getAdminPois()).length, 15);
    assert.equal(seed.pois.length, 15);
  } finally { globalThis.fetch = originalFetch; }
});
test('saved demo content picks up newly packaged audio without replacing edited scripts', async () => {
  const saved=structuredClone(seed.pois);
  for(const p of saved) p.audios=[];
  const edited=saved.find(p=>p.code==='2');
  edited.translations.find(t=>t.langCode==='en').scriptText='My edited narration.';
  localStorage.setItem('sag:demo-pois',JSON.stringify(saved));
  try {
    const {items}=await store.getPois('en');
    assert.ok(items.find(p=>p.code==='coord-01').audio?.url);
    assert.equal(items.find(p=>p.code==='2').audio,null);
    assert.equal(items.find(p=>p.code==='2').scriptText,'My edited narration.');
  } finally { localStorage.removeItem('sag:demo-pois'); }
});
test('API offline fallback uses saved public packs and never silently changes to demo', async () => {
  store.saveSettings('api');
  globalThis.fetch = async () => { throw new Error('Offline'); };
  try {
    await assert.rejects(() => store.getPois('vi'), /Offline/);
    localStorage.setItem(store.packKey('vi'), JSON.stringify({ items: [{ id: 'cached' }] }));
    const result = await store.getPois('vi'); assert.equal(result.source, 'offline'); assert.equal(result.items[0].id, 'cached');
    await assert.rejects(() => store.getAdminPois(), /Offline/);
  } finally { globalThis.fetch = originalFetch; store.saveSettings('demo'); }
});
test('admin API includes session JWT and exposes backend field validation errors', async () => {
  sessionStorage.setItem('sag:token', 'test-only-token');
  globalThis.fetch = async (_url, options) => { assert.equal(options.headers.Authorization, 'Bearer test-only-token'); return new Response(JSON.stringify({ code: 'VALIDATION_FAILED', fields: { latitude: 'Invalid GPS' } }), { status: 400 }); };
  try { await assert.rejects(() => store.api('admin/pois', { method: 'POST' }), /latitude: Invalid GPS/); }
  finally { globalThis.fetch = originalFetch; }
});
test('login API exposes credential errors instead of mislabeling them as expired JWTs', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Email hoặc mật khẩu không đúng.' }), { status: 401 });
  try { await assert.rejects(() => store.api('auth/login', { method: 'POST', body: '{}' }), /Email hoặc mật khẩu không đúng/); }
  finally { globalThis.fetch = originalFetch; }
});
