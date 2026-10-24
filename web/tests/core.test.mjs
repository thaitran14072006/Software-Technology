import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGS, localize, routeTo, haversine, qrValue, validatePoi, toDto, MAP_ID } from '../core.mjs';
const seed = JSON.parse(await readFile(new URL('../dist/data/pois.json', import.meta.url)));

test('all 15 stops have five complete translations and no fabricated GPS', () => {
  assert.equal(seed.pois.length, 15);
  for (const poi of seed.pois) {
    assert.equal(poi.translations.length, 5);
    for (const lang of Object.keys(LANGS)) { const item = localize(poi, lang); assert.equal(item.lang, lang); assert.ok(item.name); assert.ok(item.scriptText); }
    if (poi.code !== '9') { assert.equal(poi.lat, null); assert.equal(poi.geoVerified, false); }
  }
  const bausau = localize(seed.pois.find(p => p.code === '9'), 'vi');
  assert.equal(bausau.audio?.provider, 'GEMINI');
  assert.equal(bausau.audio?.url, '/audio/9-vi-04db39243e81.mp3');
});
test('localization never reuses another language transcript or audio', () => {
  const item = localize({
    id: 'x', lang: 'en', name: 'English', scriptText: 'English narration', audio: { url: '/english.mp3' },
    translations: [{ langCode: 'vi', name: 'Tiếng Việt', scriptText: 'Lời Việt' }],
    audios: [{ langCode: 'en', status: 'READY', audioUrl: '/english.mp3' }],
  }, 'ja');
  assert.equal(item.lang, 'ja');
  assert.equal(item.translationMissing, true);
  assert.equal(item.scriptText, '');
  assert.equal(item.audio, null);
});
test('shortest paths cover all pairs, preserve distances and reverse symmetrically', () => {
  const codes = ['0', ...seed.pois.map(p => p.code)];
  for (const from of codes) for (const to of codes) {
    const route = routeTo(seed.edges, from, to);
    assert.ok(route, `${from} -> ${to}`);
    assert.equal(route.codes[0], from); assert.equal(route.codes.at(-1), to);
    assert.ok(Math.abs(route.km - routeTo(seed.edges, to, from).km) < 1e-9);
  }
  assert.equal(routeTo(seed.edges, '8', '9').km, 5);
  assert.equal(routeTo(seed.edges, '11', '13').km, 2);
  assert.equal(routeTo(seed.edges, '0', 'missing'), null);
});
test('GPS distances use meters and identical positions yield zero', () => {
  assert.equal(haversine({ lat: 11, lng: 107 }, { lat: 11, lng: 107 }), 0);
  const meters = haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 });
  assert.ok(meters > 111 && meters < 112);
});
test('QR supports known formats and rejects executable or malformed URLs', () => {
  assert.deepEqual(qrValue(' 9 '), { code: '9' });
  assert.deepEqual(qrValue('sag://poi/demo-bausau-001'), { token: 'demo-bausau-001' });
  assert.deepEqual(qrValue('https://example.com/?poi=14'), { code: '14' });
  for (const input of ['javascript:alert(1)', '<script>', 'sag://poi/short', 'https://example.com/?poi=abc', '']) assert.throws(() => qrValue(input));
});
test('admin validation blocks malformed content and API requires real coordinates', () => {
  const poi = structuredClone(seed.pois[0]);
  assert.doesNotThrow(() => validatePoi(poi));
  assert.throws(() => toDto(poi), /GPS/);
  const verified = structuredClone(seed.pois.find(p => p.code === '9'));
  const dto = toDto(verified); assert.equal(dto.latitude, verified.lat); assert.equal(dto.mapId, MAP_ID);
  for (const patch of [{ code: '<x>' }, { categoryId: 9 }, { translations: [] }, { triggerRadiusM: 201 }, { lat: 91 }, { schematic: [null, 10] }, { schematic: [1400, 10] }]) assert.throws(() => validatePoi({ ...poi, ...patch }));
  assert.throws(() => validatePoi({ ...poi, translations: [poi.translations[0], poi.translations[0]] }));
});
