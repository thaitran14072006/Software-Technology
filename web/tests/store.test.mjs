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
test('visitor data always comes from the backend with a legacy demo setting', async () => {
  localStorage.setItem('sag:settings', JSON.stringify({ mode: 'demo' }));
  const item = { id: 'live-9', code: '9', lang: 'vi' };
  globalThis.fetch = async url => {
    assert.match(url, /^\/content-api\/pois\?mapId=.+&lang=vi$/);
    return Response.json({ items: [item] });
  };
  try {
    assert.deepEqual(await store.getPois('vi'), { items: [item], source: 'api' });
  } finally {
    localStorage.removeItem('sag:settings');
    globalThis.fetch = originalFetch;
  }
});
test('API offline fallback uses saved public packs and never silently changes to demo', async () => {
  globalThis.fetch = async () => { throw new Error('Offline'); };
  try {
    localStorage.setItem('sag:pack:demo:vi', JSON.stringify({ items: [{ id: 'demo-9' }] }));
    await assert.rejects(() => store.getPois('vi'), /Offline/);
    localStorage.setItem('sag:pack:api:vi', JSON.stringify({ items: [{ id: 'cached' }] }));
    const result = await store.getPois('vi'); assert.equal(result.source, 'offline'); assert.equal(result.items[0].id, 'cached');
    await assert.rejects(() => store.getAdminPois(), /Offline/);
  } finally {
    globalThis.fetch = originalFetch;
    localStorage.removeItem('sag:pack:demo:vi');
    localStorage.removeItem('sag:pack:api:vi');
  }
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
test('a pending refresh cannot restore a signed-out session', async () => {
  sessionStorage.setItem('sag:token', 'old-token');
  sessionStorage.setItem('sag:refresh', 'old-refresh');
  const refresh = Promise.withResolvers();
  const started = Promise.withResolvers();
  globalThis.fetch = async url => {
    if (url === '/content-api/auth/refresh') {
      started.resolve();
      return refresh.promise;
    }
    return Response.json({}, { status: 401 });
  };
  try {
    const request = store.api('auth/me');
    await started.promise;
    sessionStorage.removeItem('sag:token');
    sessionStorage.removeItem('sag:refresh');
    refresh.resolve(Response.json({ accessToken: 'new-token', refreshToken: 'new-refresh' }));
    await assert.rejects(request, /Vui lòng đăng nhập lại/);
    assert.equal(store.token(), '');
    assert.equal(sessionStorage.getItem('sag:refresh'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
