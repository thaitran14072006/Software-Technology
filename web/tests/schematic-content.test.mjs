import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {withSchematicNarration} from '../schematic-content.mjs';
import {localize,LANGS} from '../core.mjs';
import {renderSchematic,stopNumber,schematicStops} from '../schematic-map.mjs';
import {REFERENCE_STOPS} from '../reference-map.mjs';
import {estimatedCoordinates,verifiedCoordinates} from '../outdoor-map.mjs';
import {hasVerifiedGps} from '../gps.mjs';

const seed=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url)));
const missing=['3','4','6','10','11','12'];

test('All six poster-only stops have readable localized narration and clickable map pins',()=>{
  for(const lang of Object.keys(LANGS)) {
    const original=seed.pois.map(p=>localize(p,lang));
    const items=withSchematicNarration(original,lang);
    assert.equal(items.length,original.length+6);
    for(const code of missing) {
      const poi=items.find(p=>p.code===code);
      assert.equal(poi.translationMissing,false);
      assert.equal(poi.lang,lang);
      assert.ok(poi.name);
      assert.ok(poi.scriptText.length>70);
      assert.equal(stopNumber(poi),code);
      assert.ok(verifiedCoordinates(poi),`Missing map coordinates for ${code}`);
      assert.equal(estimatedCoordinates(poi),code!=='6');
      assert.equal(hasVerifiedGps(poi),false);
      assert.equal(poi.audio,null);
      const svg=renderSchematic({pois:items,selectedId:poi.id,visibleIds:[poi.id]});
      assert.match(svg,new RegExp(`data-reference-stop="${code}"[^>]*data-id="${poi.id}"[^>]*aria-pressed="true"`));
    }
    assert.deepEqual(items.slice(0,original.length),original);
    assert.deepEqual(withSchematicNarration(items,lang),items);
  }
});

test('Published content with the same code keeps its ID and narration',()=>{
  const existing={id:'custom-3',code:'3',name:'Custom name',scriptText:'Edited narration',audio:{url:'/custom.mp3'}};
  const result=withSchematicNarration([existing],'vi');
  assert.equal(result.filter(p=>p.code==='3').length,1);
  assert.equal(result.find(p=>p.code==='3'),existing);
});

test('Visitor cards match all fifteen poster numbers, names and order',()=>{
  const original=seed.pois.map(p=>localize(p,'vi'));
  const all=withSchematicNarration(original,'vi');
  const cards=schematicStops([...all].reverse());
  assert.equal(cards.length,15);
  assert.deepEqual(cards.map(p=>[stopNumber(p),p.name]),REFERENCE_STOPS.map(([n,,,name])=>[String(n),name]));
  for(const card of cards) {
    const source=all.find(p=>p.id===card.id);
    assert.equal(card.scriptText,source.scriptText);
    assert.equal(card.audio,source.audio);
  }
  const filtered=schematicStops(all.filter(p=>['14','15','coord-12'].includes(p.code)));
  assert.deepEqual(filtered.map(p=>p.code),['14','15']);
  assert.deepEqual(schematicStops([]),[]);
});

test('Poster-only stops attach MP3s only for the exact current transcript and language',()=>{
  const poi=withSchematicNarration([], 'vi').find(p=>p.code==='3');
  const vi=poi.translations.find(t=>t.langCode==='vi');
  const record={code:'3',translations:[{...vi,textHash:'exact-hash'}],audios:[{
    langCode:'vi',status:'READY',audioUrl:'/audio/3-vi.mp3',provider:'GEMINI',voiceName:'Sulafat',textHash:'exact-hash',
  }]};
  const get=(lang,recording)=>withSchematicNarration([],lang,[recording]).find(p=>p.code==='3');
  assert.equal(get('vi',record).audio.url,'/audio/3-vi.mp3');
  assert.equal(get('vi',record).audio.voiceName,'Sulafat');
  assert.equal(get('en',record).audio,null);
  assert.equal(get('vi',{...record,translations:[{...vi,scriptText:'Old transcript',textHash:'exact-hash'}]}).audio,null);
  assert.equal(get('vi',{...record,audios:[{...record.audios[0],textHash:'wrong-hash'}]}).audio,null);
});
