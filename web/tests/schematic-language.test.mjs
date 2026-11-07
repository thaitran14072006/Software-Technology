import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LANGS,localize} from '../core.mjs';
import {withSchematicNarration} from '../schematic-content.mjs';
import {REFERENCE_STOPS,referenceStopName} from '../reference-map.mjs';
import {renderSchematic,schematicStops} from '../schematic-map.mjs';

const seed=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url)));
const labels={
  vi:['VƯỜN QUỐC GIA','SƠ ĐỒ THAM QUAN','Đường lớn','Đường mòn đi bộ','Tiếp nước','Bến phà','Trung tâm Du khách'],
  en:['NATIONAL PARK','VISITOR MAP','Main road','Walking trail','Water refill','Ferry pier','Visitor Center'],
  ja:['国立公園','観光案内図','主要道路','遊歩道','給水所','渡し船乗り場','ビジターセンター'],
  ko:['국립공원','관광 안내도','주도로','도보 탐방로','급수 지점','선착장','방문자 센터'],
  zh:['国家公园','游览示意图','主干道','步行小径','补水点','渡口','游客中心'],
};

test('Each selected language translates all map labels and matches visitor cards',()=>{
  for(const lang of Object.keys(LANGS)) {
    const pois=withSchematicNarration(seed.pois.map(p=>localize(p,lang)),lang);
    const selected=pois.find(p=>p.code==='9');
    const svg=renderSchematic({lang,pois,selectedId:selected.id,visibleIds:[selected.id],routeCodes:['0','9']});
    assert.ok(svg.includes(`lang="${lang}"`));
    for(const text of labels[lang])assert.ok(svg.includes(text),`${lang}: ${text}`);
    if(lang!=='vi')for(const text of labels.vi)assert.ok(!svg.includes(text),`${lang} still contains ${text}`);
    for(const poi of schematicStops(pois)) {
      assert.ok(svg.includes(`<title>${poi.code}. ${poi.name}</title>`),`${lang}/${poi.code}`);
    }
    assert.match(svg,new RegExp(`data-id="${selected.id}"[^>]*aria-label="${referenceStopName(9,lang,selected)}"[^>]*aria-pressed="true"`));
    assert.equal((svg.match(/class="map-stop"/g)||[]).length,1);
    assert.ok(svg.includes('class="map-route" d="M385,817L218,318"'));
    for(const [number,x,y] of REFERENCE_STOPS) {
      assert.ok(svg.includes(`data-reference-stop="${number}"`));
      assert.ok(svg.includes(`cx="${x}" cy="${y}"`));
    }
  }
});

test('Standalone maps and missing translations have names for every stop in all languages',()=>{
  for(const lang of Object.keys(LANGS)) {
    const svg=renderSchematic({lang});
    for(const [number] of REFERENCE_STOPS) {
      const name=referenceStopName(number,lang,{lang,name:'',translations:[]});
      assert.ok(name);
      assert.ok(svg.includes(`<title>${number}. ${name}</title>`));
    }
  }
  assert.equal(renderSchematic({lang:'unknown'}),renderSchematic({lang:'vi'}));
});

test('Long translated names fit the map and remain escaped',()=>{
  const malicious={code:'13',id:'long-name',lang:'en',name:'<script>'+('Very long name '.repeat(30)),translations:[]};
  const svg=renderSchematic({lang:'en',pois:[malicious]});
  assert.ok(svg.includes('textLength="152" lengthAdjust="spacingAndGlyphs"'));
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(!svg.includes('<script>'));
});

test('The app passes its selected language into the map renderer',async()=>{
  const source=await readFile(new URL('../app.mjs',import.meta.url),'utf8');
  assert.match(source,/renderSchematic\(\{lang:state\.lang,/);
});
