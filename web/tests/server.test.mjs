import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { DemoAnalytics } from '../demo-analytics.mjs';
let upstream, server, origin;
before(async () => {
  upstream = http.createServer(async (req, res) => {
    let body = ''; for await (const part of req) body += part;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ path: req.url, authorization: req.headers.authorization, method: req.method, body }));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  process.env.CONTENT_API_URL = `http://127.0.0.1:${upstream.address().port}`;
  process.env.QR_API_URL = process.env.CONTENT_API_URL;
  const { createServer } = await import('../server.mjs');
  server = createServer({ analytics: new DemoAnalytics() }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await Promise.all([new Promise(r => server.close(r)), new Promise(r => upstream.close(r))]); });
test('serves built app and modules with correct types and security headers', async () => {
  const res = await fetch(origin);
  assert.equal(res.status, 200); assert.match(await res.text(), /Smart Audio Guide/);
  assert.match(res.headers.get('content-security-policy'), /object-src 'none'/);
  assert.match(res.headers.get('content-security-policy'), /img-src 'self' data: https:\/\/tile\.openstreetmap\.org;/);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self';/);
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  const script = await fetch(`${origin}/app.mjs`); assert.match(script.headers.get('content-type'), /javascript/);
  assert.equal((await fetch(`${origin}/data/pois.json`)).status, 200);
  const audio = await fetch(`${origin}/audio/9-vi-04db39243e81.mp3`);
  assert.equal(audio.status, 200); assert.equal(audio.headers.get('content-type'), 'audio/mpeg');
  assert.ok(Number(audio.headers.get('content-length')) > 0);
});
test('refuses traversal, missing files and non-GET static mutations', async () => {
  assert.equal((await fetch(`${origin}/%2e%2e%2fpackage.json`)).status, 403);
  assert.equal((await fetch(`${origin}/missing.html`)).status, 404);
  assert.equal((await fetch(origin, { method: 'POST', body: '{}' })).status, 405);
});
test('proxies admin bodies and JWT to configured backend without caching', async () => {
  const response = await fetch(`${origin}/content-api/admin/pois?limit=5`, { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' }, body: '{"code":"9"}' });
  const data = await response.json();
  assert.equal(data.path, '/api/v1/admin/pois?limit=5');
  assert.equal(data.authorization, 'Bearer test-token'); assert.equal(data.body, '{"code":"9"}');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('QR requests use the separate configured service', async () => {
  const res = await fetch(`${origin}/qr-api/qr/demo-bausau-001`);
  assert.equal((await res.json()).path, '/api/v1/qr/demo-bausau-001');
});
test('demo HTTP analytics aggregate users and listeners with no caching', async () => {
  const visitorId = randomUUID(), sessionId = randomUUID();
  const post = (route, body) => fetch(`${origin}/demo-api/analytics/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('presence', { visitorId, sessionId, active: true })).status, 200);
  const listen = { visitorId, eventId: randomUUID(), poiId: 'demo-9', code: '9', name: 'Bàu Sấu', lang: 'vi' };
  await post('listens', listen); await post('listens', listen);
  const response = await fetch(`${origin}/demo-api/analytics`), data = await response.json();
  assert.equal(data.activeUsers, 1); assert.equal(data.totalListens, 1); assert.equal(data.rows[0].count, 1);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await post('presence', { visitorId: 'invalid' })).status, 400);
});
