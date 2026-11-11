import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
let upstream, server, origin;
before(async () => {
  upstream = http.createServer(async (req, res) => {
    if(req.url==='/api/v1/auth/login'){req.socket.destroy();return;}
    let body = ''; for await (const part of req) body += part;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ path: req.url, authorization: req.headers.authorization, method: req.method, body }));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  process.env.CONTENT_API_URL = `http://127.0.0.1:${upstream.address().port}`;
  process.env.QR_API_URL = process.env.CONTENT_API_URL;
  const { createServer } = await import('../server.mjs');
  server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await Promise.all([new Promise(r => server.close(r)), new Promise(r => upstream.close(r))]); });
test('serves built app and modules with correct types and security headers', async () => {
  const res = await fetch(origin);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Smart Audio Guide/);
  assert.doesNotMatch(html, /id="settings"|id="admin-token"|name="mode"/);
  assert.doesNotMatch(html, /id="connection"/);
  assert.match(html, /<header[\s\S]*<button id="logout-button"[^>]* hidden>Đăng xuất<\/button>[\s\S]*<\/header>/);
  assert.match(html, /<dialog id="login-dialog"[\s\S]*id="login-button"/);
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

test('An unavailable login backend explains how to start the full application',async()=>{
  const response=await fetch(`${origin}/content-api/auth/login`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'private-test-password'}),
  });
  assert.equal(response.status,502);
  const {message}=await response.json();
  assert.match(message,/Docker Desktop/);
  assert.match(message,/npm start/);
  assert.ok(!message.includes('private-test-password'));
});
test('analytics use the backend and the old demo endpoint is gone', async () => {
  assert.equal((await fetch(`${origin}/demo-api/analytics`)).status, 404);
  const presence = await fetch(`${origin}/content-api/analytics/presence`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"active":true}',
  });
  assert.equal((await presence.json()).path, '/api/v1/analytics/presence');
  assert.equal(presence.headers.get('cache-control'), 'no-store');
});
