import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GPS_OPTIONS, gpsErrorKey, gpsText, hasVerifiedGps, startGpsWatch } from '../gps.mjs';

test('GPS watch reports a fix, uses high accuracy, and clears its watcher on stop', () => {
  let success, watchedOptions, cleared;
  const geolocation = {
    watchPosition(onSuccess, _onError, options) { success = onSuccess; watchedOptions = options; return 7; },
    clearWatch(id) { cleared = id; },
  };
  const positions = [];
  const watch = startGpsWatch(geolocation, { onPosition: p => positions.push(p), onError: error => { throw error; } });
  const fix = { coords: { latitude: 11.4, longitude: 107.4, accuracy: 8 } };
  success(fix);
  assert.equal(watch.active, true);
  assert.deepEqual(positions, [fix]);
  assert.deepEqual(watchedOptions, GPS_OPTIONS);
  assert.equal(watch.stop(), true);
  assert.equal(watch.active, false);
  assert.equal(cleared, 7);
  success({ coords: {} });
  assert.deepEqual(positions, [fix]);
  assert.equal(watch.stop(), false);
});

test('GPS errors stop the watcher exactly once and deliver the failure', () => {
  let fail, cleared, errorCount = 0;
  const watch = startGpsWatch({
    watchPosition(_success, onError) { fail = onError; return 11; },
    clearWatch(id) { cleared = id; },
  }, { onPosition() { throw new Error('unexpected position'); }, onError: error => { errorCount++; assert.equal(error.code, 3); } });
  fail({ code: 3 });
  fail({ code: 3 });
  assert.equal(watch.active, false);
  assert.equal(cleared, 11);
  assert.equal(errorCount, 1);
});

test('Synchronous GPS errors still clear the watch id returned afterward', () => {
  let cleared = null, reported = 0;
  const watch = startGpsWatch({
    watchPosition(_success, onError) { onError({ code: 2 }); return 12; },
    clearWatch(id) { cleared = id; },
  }, { onPosition() {}, onError() { reported++; } });
  assert.equal(watch.active, false);
  assert.equal(cleared, 12);
  assert.equal(reported, 1);
});

test('GPS unsupported and error states have useful localized messages', () => {
  assert.throws(() => startGpsWatch(null, { onPosition() {}, onError() {} }), /GPS_NOT_SUPPORTED/);
  assert.equal(gpsErrorKey({ code: 1 }), 'permission');
  assert.equal(gpsErrorKey({ code: 2 }), 'unavailable');
  assert.equal(gpsErrorKey({ code: 3 }), 'timeout');
  assert.equal(gpsErrorKey({ code: 99 }), 'failed');
  for (const lang of ['vi', 'en', 'ja', 'ko', 'zh']) {
    assert.ok(gpsText('permission', lang).length > 10, `${lang} permission text`);
    assert.ok(gpsText('autoUnavailable', lang).length > 10, `${lang} autoplay hint`);
  }
});

test('Autoplay accepts only finite coordinates that were explicitly verified', () => {
  assert.equal(hasVerifiedGps({ geoVerified: true, lat: 11.4, lng: 107.4 }), true);
  assert.equal(hasVerifiedGps({ geoVerified: false, lat: 11.4, lng: 107.4 }), false);
  assert.equal(hasVerifiedGps({ geoVerified: true, lat: null, lng: 107.4 }), false);
  assert.equal(hasVerifiedGps({ geoVerified: true, lat: 91, lng: 107.4 }), false);
  assert.equal(hasVerifiedGps({ geoVerified: true, lat: 11.4, lng: Infinity }), false);
});
