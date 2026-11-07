import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schematicLayout,stopNumber,renderSchematic} from '../schematic-map.mjs';
import {REFERENCE_STOPS,renderReferenceMap} from '../reference-map.mjs';
const seed=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url)));
const pois=seed.pois.map(p=>({...p,name:p.translations.find(t=>t.langCode==='vi').name}));
const input={pois,visibleIds:pois.map(p=>p.id)};

test('The main visitor schematic uses the same poster as the reference preview',()=>{
  const svg=renderSchematic(input);
  assert.equal(svg,renderReferenceMap(input));
  assert.equal(renderSchematic({...input,zoom:3,center:{x:200,y:200}}),svg);
  assert.match(svg,/viewBox="0 0 1400 990"/);
  assert.equal((svg.match(/data-reference-stop=/g)||[]).length,15);
  assert.match(svg,/VƯỜN QUỐC GIA CÁT TIÊN/);
  assert.ok(!svg.includes('15 ĐIỂM THAM QUAN'));
  assert.ok(!svg.includes('Độc lạ – Chỉ có tại Cát Tiên'));
  assert.ok(!svg.includes('schematic-inset'));
  assert.ok(!svg.includes('M520 115'));
  assert.ok(!svg.includes('poster-boundary'));
  assert.ok(!svg.includes('poster-region-clip'));
});

test('Poster links use stable POI codes rather than unrelated current list numbers',()=>{
  const bauSau=pois.find(p=>p.code==='9'),tung=pois.find(p=>p.code==='2');
  const svg=renderSchematic({...input,selectedId:bauSau.id});
  assert.match(svg,new RegExp('data-reference-stop="9"[^>]*data-id="'+bauSau.id+'"[^>]*aria-pressed="true"'));
  assert.match(svg,new RegExp('data-reference-stop="2"[^>]*data-id="'+tung.id+'"'));
  assert.equal(stopNumber(bauSau),'9');
  assert.equal(stopNumber(tung),'2');
  const museum=pois.find(p=>p.code==='coord-02');
  assert.ok(!schematicLayout(pois).some(p=>p.id===museum.id));
});

test('Visitor numbers match schematic stops regardless of catalog order or language',()=>{
  for (const [number] of REFERENCE_STOPS) {
    const poi={code:String(number),sortOrder:99,name:'Localized place name'};
    assert.equal(stopNumber(poi),String(number));
  }
  const forest=pois.find(p=>p.code==='15');
  assert.equal(forest.sortOrder,10);
  assert.equal(stopNumber(forest),'15');
  for (const poi of pois.filter(p=>!REFERENCE_STOPS.some(([number])=>String(number)===p.code))) {
    assert.equal(stopNumber(poi),'•');
  }
});

test('Filtering leaves poster geometry fixed and makes only matching current places interactive',()=>{
  const tree=pois.find(p=>p.code==='2');
  const svg=renderSchematic({...input,visibleIds:[tree.id]});
  assert.equal((svg.match(/class="map-stop"/g)||[]).length,1);
  assert.match(svg,new RegExp('data-id="'+tree.id+'"'));
  assert.match(svg,/cx="329" cy="619"/);
  const malicious={...tree,id:'<bad" id>',lang:'en',translations:[],name:'<img onerror=alert(1)>'};
  const safe=renderSchematic({lang:'en',pois:[malicious],visibleIds:[malicious.id]});
  assert.ok(safe.includes('&lt;img'));
  assert.ok(!safe.includes('<img'));
  assert.ok(!safe.includes('data-id="<bad'));
});

test('Existing route codes and center links use positions in the poster',()=>{
  const svg=renderSchematic({...input,routeCodes:['0','2']});
  assert.ok(svg.includes('class="map-route" d="M385,817L329,619"'));
  assert.ok(!renderSchematic({...input,routeCodes:['0','doc-14']}).includes('class="map-route"'));
  assert.equal(schematicLayout(pois).find(p=>p.code==='coord-01').x,385);
});

test('Build and offline shell include the poster renderer and stylesheet',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const css=await readFile(new URL('../dist/reference-map.css',import.meta.url),'utf8');
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  assert.ok(html.includes('href="./reference-map.css"'));
  assert.ok(css.includes('.reference-map .poster-name'));
  assert.ok(sw.includes("'./reference-map.mjs'"));
  assert.ok(sw.includes("'./reference-map.css'"));
  assert.ok(sw.includes("'./map-viewport.mjs'"));
  assert.ok(!html.includes('id="map-zoom-in"'));
  assert.ok(!html.includes('id="map-zoom-out"'));
});
