import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {currentCatalogItems} from '../poi-catalog.mjs';
import {verifiedCoordinates} from '../outdoor-map.mjs';
const seed=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url)));
const expected=JSON.parse(await readFile(new URL('../../scripts/data/active-pois.json',import.meta.url)));
test('API and demo catalog have precisely the fifteen supplied points, in order',()=>{
 assert.equal(seed.pois.length,15);
 assert.deepEqual(seed.pois.map(p=>p.code),expected.points.map(p=>p.code));
 for(const p of expected.points){const row=seed.pois.find(x=>x.code===p.code);assert.deepEqual(verifiedCoordinates(row),[p.latitude,p.longitude]);assert.equal(row.geoVerified,false);assert.equal(row.translations.find(t=>t.langCode==='vi').name,p.name);}
 const allowed=new Set(['0',...expected.points.map(p=>p.code)]);for(const [a,b] of seed.edges){assert.ok(allowed.has(String(a)));assert.ok(allowed.has(String(b)));}
});
test('Old offline content excludes retired POIs and refreshes coordinates, preserving IDs and audio',()=>{
 const keep=seed.pois[0];const audio={url:'/audio-assets/retained.mp3',provider:'GEMINI'};
 const old=[{id:'old-id',code:keep.code,lang:'vi',lat:0,lng:0,geoVerified:true,audio},{id:'removed-id',code:'coord-13',lat:11,lng:107}];
 const result=currentCatalogItems(old,seed,{cached:true});
 assert.equal(result.length,1);assert.equal(result[0].id,'old-id');assert.equal(result[0].audio,audio);assert.equal(result[0].lat,keep.lat);assert.equal(result[0].geoVerified,false);
});
