import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
try { process.loadEnvFile(fileURLToPath(new URL('../backend/.env', import.meta.url))); } catch {}
const base = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
if (!process.env.JWT_SECRET) throw new Error('Set JWT_SECRET or configure backend/.env.');
function jwt(role) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '00000000-0000-0000-0000-0000000000aa', role, exp: Math.floor(Date.now() / 1000) + 300 })}`;
  return `${payload}.${createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('base64url')}`;
}
const admin = jwt('ADMIN');
const pathList = '/content-api/pois?mapId=00000000-0000-0000-0000-000000000001&lang=vi';
async function call(path, method = 'GET', body, auth = admin) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
let created;
try {
  assert.equal((await call('/content-api/admin/pois', 'GET', null, '')).status, 401);
  assert.equal((await call('/content-api/admin/pois', 'GET', null, jwt('VISITOR'))).status, 403);
  assert.equal((await call('/content-api/admin/pois?page=-1')).status, 400);
  const list = await call(pathList); assert.equal(list.status, 200); assert.ok(list.data.items.length >= 15);
  const fixture = { code: `qa-${randomUUID().slice(0, 12)}`, mapId: '00000000-0000-0000-0000-000000000001', categoryId: 2, latitude: 11.4, longitude: 107.4, geoVerified: false, status: 'DRAFT', translations: [{ langCode: 'vi', name: 'Điểm kiểm thử tạm thời', scriptText: 'Nội dung kiểm thử API.' }] };
  assert.equal((await call('/content-api/admin/pois', 'POST', { ...fixture, latitude: 100 })).status, 400);
  const result = await call('/content-api/admin/pois', 'POST', fixture);
  assert.equal(result.status, 201, JSON.stringify(result.data)); created = result.data.id;
  assert.equal((await call(`/content-api/pois/${created}`)).status, 404);
  const updated = await call(`/content-api/admin/pois/${created}`, 'PATCH', { status: 'PUBLISHED', translations: [{ ...fixture.translations[0], scriptText: 'Nội dung đã cập nhật.' }] });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  const publicPoi = await call(`/content-api/pois/${created}?lang=en`); assert.equal(publicPoi.status, 200); assert.equal(publicPoi.data.lang, 'vi'); assert.equal(publicPoi.data.scriptText, 'Nội dung đã cập nhật.');
  const qr = await call('/qr-api/qr/demo-bausau-001'); assert.equal(qr.status, 200); assert.equal(qr.data.kind, 'POI');
  assert.equal(list.data.items.find(p => p.code === '9').id, qr.data.poiId);
  assert.equal((await call(`/content-api/admin/pois/${created}`, 'DELETE')).status, 200);
  assert.equal((await call(`/content-api/pois/${created}`)).status, 404);
  const manifest = await call('/content-api/sync/manifest?mapId=00000000-0000-0000-0000-000000000001&lang=vi&since=0');
  assert.equal(manifest.status, 200); assert.ok(manifest.data.deletedIds.includes(created));
  created = null;
  console.log('PASS integration: JWT 401/403, pagination, validation, create draft, publish/update, language fallback, QR, soft delete, offline manifest.');
} finally {
  // Only soft-delete the temporary fixture created by this run.
  if (created) await call(`/content-api/admin/pois/${created}`, 'DELETE');
}
