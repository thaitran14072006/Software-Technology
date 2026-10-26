import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { selectVoice, loadVoices, playbackSource } from '../browser-tts.mjs';
import { verifiedCoordinates, OSM_TILE_URL } from '../outdoor-map.mjs';

test('Only verified, valid GPS may appear on the geographic map', () => {
  const p = { geoVerified: true, lat: 11.457891, lng: 107.34348 };
  assert.deepEqual(verifiedCoordinates(p), [p.lat, p.lng]);
  for (const patch of [{geoVerified:false}, {lat:null}, {lat:NaN}, {lng:181}, {lat:'11.4'}]) {
    assert.equal(verifiedCoordinates({...p, ...patch}), null);
  }
  assert.equal(OSM_TILE_URL, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
});
test('TTS matches cat-tien-app: exact locale first, preserving browser ordering including online voices', () => {
  const voices = [
    {lang:'en-GB',localService:true}, {lang:'en-US',localService:false},
    {lang:'en_US',localService:true}, {lang:'vi-VN',localService:true},
  ];
  assert.equal(selectVoice(voices, 'en-US'), voices[1]);
  assert.equal(selectVoice(voices, 'ja-JP'), undefined);
  assert.equal(selectVoice(voices, 'en-AU'), voices[0]);
});
test('Automatic playback prefers the matching MP3 and uses the browser voice only as fallback', () => {
  assert.equal(playbackSource('auto', true, true), 'mp3');
  assert.equal(playbackSource('auto', false, true), 'browser');
  assert.equal(playbackSource('browser', true, true), 'browser');
  assert.equal(playbackSource('mp3', true, true), 'mp3');
  assert.equal(playbackSource('mp3', false, true), 'browser');
  assert.equal(playbackSource('browser', true, false), 'mp3');
  assert.equal(playbackSource('browser', false, false), null);
});
test('TTS waits for asynchronously installed voices and cleans its listener', async () => {
  const synth = new EventTarget(); let voices = [];
  synth.getVoices = () => voices;
  const result = loadVoices(synth, 100);
  voices = [{lang:'vi-VN'}]; synth.dispatchEvent(new Event('voiceschanged'));
  assert.equal(await result, voices);
});
test('A browser with no voices times out without hanging playback', async () => {
  const synth = new EventTarget(); synth.getVoices = () => [];
  assert.deepEqual(await loadVoices(synth, 5), []);
});
test('Vendored Leaflet 1.9.4 files match their pinned SHA-256 hashes', async () => {
  for (const [file, hash] of [
    ['leaflet.js', '20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='],
    ['leaflet.css', 'p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='],
  ]) {
    const data = await readFile(new URL(`../vendor/leaflet/${file}`, import.meta.url));
    if (file === 'leaflet.js') assert.match(data.toString(), /Leaflet 1\.9\.4/);
    assert.equal(createHash('sha256').update(data).digest('base64'), hash);
  }
});

test('Document coordinates appear on OSM without opting into GPS autoplay', () => {
  const p={geoVerified:false,geoSourceUrl:`urn:sha256:${'a'.repeat(64)}#point-01`,lat:11.423924,lng:107.427845};
  assert.deepEqual(verifiedCoordinates(p),[11.423924,107.427845]);
  assert.equal(p.geoVerified,false);
  for(const patch of [{geoSourceUrl:'urn:sha256:bad#point-01'},{geoSourceUrl:'file:///C:/file.docx'},{lat:NaN},{lng:181}])assert.equal(verifiedCoordinates({...p,...patch}),null);
});
