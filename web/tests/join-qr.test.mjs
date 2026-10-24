import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinURL, isLoopback, qrSVG } from '../join-qr.mjs';
test('join URLs retain only the data source, never a JWT or selected stop', () => {
  assert.equal(joinURL('https://example.com/?poi=9&token=secret&source=api#admin'), 'https://example.com/?source=api');
  assert.equal(joinURL('http://192.168.1.12:4173/?source=demo'), 'http://192.168.1.12:4173/?source=demo');
  for (const input of ['javascript:alert(1)', 'https://user:password@example.com/', 'not a url']) assert.throws(() => joinURL(input));
  assert.equal(isLoopback('http://127.0.0.1:4173'), true); assert.equal(isLoopback('http://192.168.1.12:4173'), false);
});
test('generates SVG locally with quiet margin and no scripts or remote assets', () => {
  const svg = qrSVG('https://example.com/?source=api');
  assert.match(svg, /<svg/); assert.match(svg, /viewBox=/); assert.match(svg, /<path/);
  assert.doesNotMatch(svg, /<script|<image|(?:href|src)=/);
  assert.match(svg, /M20,20/);
});
