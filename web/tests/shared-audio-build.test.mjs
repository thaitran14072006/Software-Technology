import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('Built audio uses the exact shared manifest file and voice, including hyphenated POI codes',async()=>{
 const fixture=JSON.parse(await readFile(new URL('../../backend/fixtures/content.json',import.meta.url),'utf8'));
 const built=JSON.parse(await readFile(new URL('../dist/data/pois.json',import.meta.url),'utf8'));
 let checked=0;
 for(const poi of fixture.pois)for(const t of poi.translations){
  if(!t.audio)continue;
  const actual=built.pois.find(p=>p.code===poi.code)?.audios.find(a=>a.langCode===t.lang_code);
  assert.ok(actual,`${poi.code}/${t.lang_code}`);
  assert.equal(actual.voiceName,t.audio.voiceName);
  assert.equal(actual.audioUrl,'/'+t.audio.file);
  const bytes=await readFile(new URL('../dist/'+t.audio.file,import.meta.url));
  assert.equal(bytes.length,t.audio.sizeBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),t.audio.sha256);checked++;
 }
 assert.ok(checked>0);
});
