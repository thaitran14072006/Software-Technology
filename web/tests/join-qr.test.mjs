import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinURL, isLoopback, qrSVG, preferredJoinURL, poiQrURL, poiQrSVG } from '../join-qr.mjs';
import {qrValue} from '../core.mjs';
test('join URLs strip source parameters, credentials in queries and selected stops', () => {
  assert.equal(joinURL('https://example.com/?poi=9&token=secret&source=api#admin'), 'https://example.com/');
  assert.equal(joinURL('http://192.168.1.12:4173/?source=demo'), 'http://192.168.1.12:4173/');
  for (const input of ['javascript:alert(1)', 'https://user:password@example.com/', 'not a url']) assert.throws(() => joinURL(input));
  assert.equal(isLoopback('http://127.0.0.1:4173'), true); assert.equal(isLoopback('http://192.168.1.12:4173'), false);
});
test('generates SVG locally with quiet margin and no scripts or remote assets', () => {
  const svg = qrSVG('https://example.com/?source=api');
  assert.match(svg, /<svg/); assert.match(svg, /viewBox=/); assert.match(svg, /<path/);
  assert.doesNotMatch(svg, /<script|<image|(?:href|src)=/);
  assert.match(svg, /M20,20/);
});


test('saved private or invalid QR addresses refresh to the current LAN URL', () => {
  const current = 'http://192.168.1.36:4173/';
  for (const saved of ['http://172.16.0.2:4173/', 'http://192.168.1.60:4173/', 'http://127.0.0.1:4173/', 'invalid', null]) {
    assert.equal(preferredJoinURL(current, saved), current);
  }
  assert.equal(preferredJoinURL(current, 'https://guide.example.com/?poi=9'), 'https://guide.example.com/');
  assert.equal(preferredJoinURL('http://127.0.0.1:4173/', current), current);
});

test('point QR exports a browser URL and keeps the token for backend validation', () => {
  const url = poiQrURL('https://guide.example.com/?poi=9&source=api#admin', 'demo-bausau-001');
  assert.equal(url, 'https://guide.example.com/?qr=demo-bausau-001');
  assert.deepEqual(qrValue(url), { token: 'demo-bausau-001' });
  assert.match(poiQrSVG('https://guide.example.com/', 'demo-bausau-001'), /<svg/);
  assert.throws(() => poiQrURL('javascript:alert(1)', 'demo-bausau-001'));
  assert.throws(() => poiQrURL('https://guide.example.com/', 'short'));
  assert.throws(() => qrValue('https://guide.example.com/?qr=short&poi=9'));
  assert.deepEqual(qrValue('https://guide.example.com/?qr=demo-bausau-001&poi=15'), { token: 'demo-bausau-001' });
});
