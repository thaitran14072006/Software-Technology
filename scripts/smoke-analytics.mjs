import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
try { process.loadEnvFile(fileURLToPath(new URL('../backend/.env', import.meta.url))); } catch {}
if (process.env.DATABASE_URL !== 'postgres://sag:sag@localhost:5432/sag') throw new Error('This test only uses the local demo database.');
const { Client } = createRequire(new URL('../backend/package.json', import.meta.url))('pg');
const db = new Client({ connectionString: process.env.DATABASE_URL });
const base = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');
const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '00000000-0000-0000-0000-0000000000aa', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 300 })}`;
const token = `${unsigned}.${createHmac('sha256', process.env.JWT_SECRET).update(unsigned).digest('base64url')}`;
const visitorId = randomUUID(), sessions = [randomUUID(), randomUUID()], events = [randomUUID(), randomUUID()];
let poiId;
async function request(route, method = 'GET', body, auth = true) {
  const response = await fetch(`${base}/content-api/${route}`, { method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const text = await response.text(); return { status: response.status, data: text ? JSON.parse(text) : null };
}
const summary = async () => { const result = await request('admin/analytics'); assert.equal(result.status, 200, JSON.stringify(result.data)); return result.data; };
try {
  await db.connect();
  assert.equal((await request('admin/analytics', 'GET', null, false)).status, 401);
  assert.equal((await request('analytics/presence', 'POST', { visitorId: 'invalid', sessionId: sessions[0], active: true }, false)).status, 400);
  const before = await summary();
  for (const sessionId of sessions) assert.equal((await request('analytics/presence', 'POST', { visitorId, sessionId, active: true }, false)).status, 201);
  assert.equal((await summary()).activeUsers, before.activeUsers + 1);
  await request('analytics/presence', 'POST', { visitorId, sessionId: sessions[0], active: false }, false);
  assert.equal((await summary()).activeUsers, before.activeUsers + 1);
  await db.query("UPDATE web_presence SET last_seen_at = now() - interval '91 seconds' WHERE session_id = $1", [sessions[1]]);
  assert.equal((await summary()).activeUsers, before.activeUsers);
  const poi = await request('admin/pois', 'POST', { code: `qa-${randomUUID().slice(0, 12)}`, mapId: '00000000-0000-0000-0000-000000000001', categoryId: 2, latitude: 11.4, longitude: 107.4, status: 'PUBLISHED', translations: [{ langCode: 'vi', name: 'Thống kê kiểm thử', scriptText: 'Nội dung kiểm thử.' }, { langCode: 'en', name: 'Analytics test', scriptText: 'Test narration.' }] });
  assert.equal(poi.status, 201, JSON.stringify(poi.data)); poiId = poi.data.id;
  const payload = { eventId: events[0], visitorId, poiId, lang: 'vi' };
  const first = await request('analytics/listens', 'POST', payload, false);
  assert.equal(first.status, 201, JSON.stringify(first.data)); assert.equal(first.data.recorded, true);
  assert.equal((await request('analytics/listens', 'POST', payload, false)).data.recorded, false);
  await request('analytics/listens', 'POST', { ...payload, eventId: events[1], lang: 'en' }, false);
  assert.equal((await request('analytics/listens', 'POST', { ...payload, eventId: randomUUID(), lang: 'xx' }, false)).status, 400);
  const after = await summary();
  assert.equal(after.totalListens, before.totalListens + 2); assert.equal(after.todayListens, before.todayListens + 2);
  assert.deepEqual(after.rows.filter(row => row.poiId === poiId).map(row => [row.lang, row.count]).sort(), [['en', 1], ['vi', 1]]);
  console.log('PASS analytics integration: protected summary, valid telemetry, distinct browsers, leave/expiry, real persisted counts, retry deduplication and language breakdown.');
} finally {
  // Remove only this run's telemetry; keep dashboard totals free of test data.
  await db.query('DELETE FROM audio_listen_events WHERE id = ANY($1::uuid[])', [events]);
  await db.query('DELETE FROM web_presence WHERE session_id = ANY($1::uuid[])', [sessions]);
  if (poiId) await request(`admin/pois/${poiId}`, 'DELETE');
  await db.end();
}
