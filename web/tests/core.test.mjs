import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGS, localize, routeTo, haversine, qrValue, validatePoi, toDto, MAP_ID, matchesPoiQuery } from '../core.mjs';
const seed = JSON.parse(await readFile(new URL('../dist/data/pois.json', import.meta.url)));

test('all 15 stops have five complete translations and no fabricated GPS', () => {
  assert.equal(seed.pois.length, 15);
  for (const poi of seed.pois) {
    assert.equal(poi.translations.length, 5);
    for (const lang of Object.keys(LANGS)) { const item = localize(poi, lang); assert.equal(item.lang, lang); assert.ok(item.name); assert.ok(item.scriptText); }
    assert.ok(Number.isFinite(poi.lat)); assert.ok(Number.isFinite(poi.lng)); assert.equal(poi.geoVerified,false);
  }
});
test('routes preserve distance and symmetry without reintroducing retired POI nodes', () => {
  const graph=[['a','b',1],['b','c',2],['a','c',8]];
  const route=routeTo(graph,'a','c');assert.deepEqual(route.codes,['a','b','c']);assert.equal(route.km,3);assert.equal(routeTo(graph,'c','a').km,3);
  const allowed=new Set(['0',...seed.pois.map(p=>p.code)]);for(const [a,b] of seed.edges){assert.ok(allowed.has(String(a)));assert.ok(allowed.has(String(b)));}
  assert.equal(routeTo(seed.edges,'0','missing'),null);
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
test('POI search matches codes, all-language titles and narration without Vietnamese tone marks', () => {
  const poi = {
    code: '9', name: 'Bàu Sấu', summary: 'Vùng đất ngập nước giữa rừng.', scriptText: 'Lắng nghe câu chuyện về cá sấu.',
    translations: [
      { langCode: 'en', name: 'Crocodile Lake', summary: 'Wetlands in the forest.', scriptText: 'Listen to the forest at night.' },
      { langCode: 'zh', name: '鳄鱼湖', summary: '森林湿地。', scriptText: '听听森林的故事。' },
    ],
  };
  assert.equal(matchesPoiQuery(poi, 'bau sau'), true);
  assert.equal(matchesPoiQuery(poi, 'crocodile lake'), true);
  assert.equal(matchesPoiQuery(poi, 'wetlands forest'), true);
  assert.equal(matchesPoiQuery(poi, 'forest night'), true);
  assert.equal(matchesPoiQuery(poi, '鳄鱼湖'), true);
  assert.equal(matchesPoiQuery(poi, '9'), true);
  assert.equal(matchesPoiQuery(poi, ''), true);
  assert.equal(matchesPoiQuery(poi, 'crocodile volcano'), false);
  assert.equal(matchesPoiQuery({ ...poi, translations: [] }, 'crocodile', 'Crocodile Lake'), true);
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
  assert.doesNotThrow(() => toDto(poi)); assert.throws(() => toDto({...poi,lat:null}), /GPS/);
  const verified = structuredClone(seed.pois.find(p => p.code === '9'));
  const dto = toDto(verified); assert.equal(dto.latitude, verified.lat); assert.equal(dto.mapId, MAP_ID);
  for (const patch of [{ code: '<x>' }, { categoryId: 9 }, { translations: [] }, { triggerRadiusM: 201 }, { lat: 91 }, { schematic: [null, 10] }, { schematic: [1400, 10] }]) assert.throws(() => validatePoi({ ...poi, ...patch }));
  assert.throws(() => validatePoi({ ...poi, translations: [poi.translations[0], poi.translations[0]] }));
});
