import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GPS_OPTIONS, gpsErrorKey, gpsText, hasVerifiedGps, startGpsWatch,validGpsPosition,createGpsTrigger } from '../gps.mjs';

test('GPS watch reports a fix, uses high accuracy, and clears its watcher on stop', () => {
  let success, watchedOptions, cleared;
  const geolocation = {
    watchPosition(onSuccess, _onError, options) { success = onSuccess; watchedOptions = options; return 7; },
    clearWatch(id) { cleared = id; },
  };
  const positions = [];
  const watch = startGpsWatch(geolocation, { onPosition: p => positions.push(p), onError: error => { throw error; } });
  const fix = { timestamp:Date.now(),coords: { latitude: 11.4, longitude: 107.4, accuracy: 8 } };
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
  }, { onPosition() { throw new Error('unexpected position'); }, onError: error => { errorCount++; assert.equal(error.code, 1); } });
  fail({ code: 1 });
  fail({ code: 1 });
  assert.equal(watch.active, false);
  assert.equal(cleared, 11);
  assert.equal(errorCount, 1);
});

test('Synchronous GPS errors still clear the watch id returned afterward', () => {
  let cleared = null, reported = 0;
  const watch = startGpsWatch({
    watchPosition(_success, onError) { onError({ code: 1 }); return 12; },
    clearWatch(id) { cleared = id; },
  }, { onPosition() {}, onError() { reported++; } });
  assert.equal(watch.active, false);
  assert.equal(cleared, 12);
  assert.equal(reported, 1);
});

test('Temporary GPS timeouts keep watching and recover on the next fix',()=>{
 let success,fail,cleared=0,received=0;
 const watch=startGpsWatch({watchPosition(s,e){success=s;fail=e;return 5;},clearWatch(){cleared++;}},
 {onPosition(){received++;},onError(e,{recoverable}){assert.equal(e.code,3);assert.equal(recoverable,true);}});
 fail({code:3});assert.equal(watch.active,true);assert.equal(cleared,0);
 success({coords:{}});assert.equal(received,1);watch.stop();assert.equal(cleared,1);
});

test('GPS triggering rejects old, repeated, invalid and inaccurate fixes, and only cools down after playback',()=>{
 let now=100000;const trigger=createGpsTrigger({now:()=>now});
 const p={id:'p',geoVerified:true,lat:11.4,lng:107.4,triggerRadiusM:10};
 const fix=(delta=0,accuracy=5)=>({timestamp:now+delta,coords:{latitude:p.lat,longitude:p.lng,accuracy}});
 assert.equal(validGpsPosition(fix(-11000),now),false);
 assert.equal(validGpsPosition(fix(6000),now),false);
 assert.equal(validGpsPosition({...fix(),coords:{...fix().coords,accuracy:-1}},now),false);
 assert.equal(trigger.next([p],fix(-11000)),null);
 assert.equal(trigger.next([p],fix()),null);
 assert.equal(trigger.next([p],fix()),null);
 now+=1000;assert.equal(trigger.next([p],fix(0,80)),null);
 now+=1000;assert.equal(trigger.next([p],fix()),null);
 now+=1000;assert.equal(trigger.next([p],fix()).id,'p');
 // A failed play can be attempted again; it must not incur a 30 minute cooldown.
 now+=11000;assert.equal(trigger.next([p],fix()),null);
 now+=1000;assert.equal(trigger.next([p],fix()).id,'p');trigger.played('p');
 now+=11000;trigger.next([p],fix());now+=1000;assert.equal(trigger.next([p],fix()),null);
 now+=1800000;trigger.reset();assert.equal(trigger.next([p],fix()),null);
 now+=1000;assert.equal(trigger.next([p],fix()).id,'p');
});

test('GPS does not trigger unverified points and selects the nearest verified point',()=>{
 let now=100000;const trigger=createGpsTrigger({now:()=>now});
 const p={id:'nearest',geoVerified:true,lat:11.4,lng:107.4,triggerRadiusM:20};
 const fix=()=>({timestamp:now,coords:{latitude:p.lat,longitude:p.lng,accuracy:4}});
 const list=[{...p,id:'estimate',geoVerified:false},{...p,id:'further',lat:11.4001},p];
 assert.equal(trigger.next(list,fix()),null);now+=1000;assert.equal(trigger.next(list,fix()).id,'nearest');
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
