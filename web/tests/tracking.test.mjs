import { test } from 'node:test';
import assert from 'node:assert/strict';
const storage = () => {
  const data = Object.create(null);
  Object.defineProperties(data, { getItem: { value: k => data[k] ?? null }, setItem: { value: (k, v) => { data[k] = String(v); } }, removeItem: { value: k => { delete data[k]; } } });
  return data;
};
globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
const { VisitorAnalytics, playbackCounter } = await import('../analytics.mjs');
const { newId } = await import('../core.mjs');
const originalFetch = globalThis.fetch;
test('counts actual starts once across repeated onplaying and MP3-to-TTS fallback', () => {
  const records = [], counter = playbackCounter((p, mode) => records.push([p, mode]));
  const started = counter.begin('poi-1', 'api');
  assert.equal(records.length, 0); started(); started(); assert.equal(records.length, 1);
  const canceled = counter.begin('poi-2', 'api'); counter.cancel(); canceled(); assert.equal(records.length, 1);
  const old = counter.begin('old', 'api'), latest = counter.begin('new', 'demo'); old(); latest();
  assert.deepEqual(records, [['poi-1', 'api'], ['new', 'demo']]);
});
test('same browser keeps visitor identity while each tab gets its own session', () => {
  const a = new VisitorAnalytics(), b = new VisitorAnalytics();
  assert.equal(a.id, b.id); assert.notEqual(a.sessionId, b.sessionId);
  assert.match(newId(), /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
test('offline starts persist and retry the same event ID without leaking API-only fields', async () => {
  const usage = new VisitorAnalytics();
  globalThis.fetch = async () => { throw new Error('offline'); };
  try {
    usage.record({ id: newId(), code: '9', name: 'Bàu Sấu', lang: 'vi' }, 'api'); await usage.flush();
    const key = Object.keys(localStorage).find(k => k.startsWith('sag:listen-event:'));
    const event = JSON.parse(localStorage.getItem(key));
    let payload;
    globalThis.fetch = async (_url, options) => { payload = JSON.parse(options.body); return new Response('{}'); };
    await usage.flush();
    assert.equal(payload.eventId, event.eventId); assert.equal(payload.poiId, event.poiId);
    assert.equal('mode' in payload, false); assert.equal('name' in payload, false); assert.equal('code' in payload, false);
    assert.equal(localStorage.getItem(key), null);
  } finally { globalThis.fetch = originalFetch; }
});
