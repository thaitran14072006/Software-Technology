import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schematicLayout,stopNumber,renderSchematic} from '../schematic-map.mjs';
const seed=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url)));
const pois=seed.pois.map(p=>({...p,name:p.translations.find(t=>t.langCode==='vi').name}));

test('All fifteen GPS stops appear even when old schematic coordinates are absent',()=>{
  const input=pois.map(p=>({...p,schematic:null}));
  const layout=schematicLayout(input);
  assert.equal(layout.length,15);
  assert.deepEqual(input.map(stopNumber),Array.from({length:15},(_,i)=>String(i+1)));
  assert.ok(layout.find(p=>p.sortOrder===14).y<layout.find(p=>p.sortOrder===15).y);
  for(const p of layout){
    assert.ok(p.x>=420 && p.x<=960 && p.y>=90 && p.y<=850);
    for(const q of layout.filter(q=>q.id!==p.id && q.left===p.left))assert.ok(Math.abs(p.labelY-q.labelY)>=p.labelHeight);
  }
  const svg=renderSchematic({pois:input,visibleIds:input.map(p=>p.id),selectedId:input[0].id,title:'Sơ đồ tham quan',note:'Không theo tỉ lệ'});
  assert.equal((svg.match(/class="map-stop"/g)||[]).length,15);
  assert.ok(!svg.includes('coord-01</text>'));
  assert.ok(!svg.includes('map-river'));
  assert.equal(input[0].code,'coord-01');
});

test('Filtering keeps geographic placement and visitor numbering; names are escaped',()=>{
  const selected={...pois[0],name:'<img onerror=alert(1)>'};
  const svg=renderSchematic({pois:[selected,...pois.slice(1)],visibleIds:[selected.id],selectedId:selected.id,title:'Sơ đồ',note:''});
  assert.equal((svg.match(/class="map-stop"/g)||[]).length,1);
  assert.ok(svg.includes('&lt;img'));
  assert.ok(!svg.includes('<img'));
  assert.equal(stopNumber(pois[12]),'13');
});
