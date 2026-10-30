import { mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'web', 'dist');
const sharedContent = JSON.parse(await readFile(path.join(root, 'backend', 'fixtures', 'content.json'), 'utf8'));
const fixtureByCode = new Map(sharedContent.pois.map(p => [p.code, p]));
const generatedAudioDir = path.join(root, 'web', 'narration-audio');
let generatedAudio = {};
try { generatedAudio = JSON.parse(await readFile(path.join(generatedAudioDir, 'manifest.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const ctx = { CT: {} };
ctx.window = ctx;
vm.createContext(ctx);
for (const name of ['data.js', 'i18n.js']) {
  vm.runInContext(await readFile(path.join(root, 'scripts', 'legacy', name), 'utf8'), ctx, { filename: name, timeout: 1000 });
}
const catalog=JSON.parse(await readFile(path.join(root,'scripts','data','active-pois.json'),'utf8'));
const fixture=sharedContent;
const pois=catalog.points.map(point=>{
  const p=fixture.pois.find(row=>row.code===point.code);
  if(!p)throw new Error(`Missing canonical fixture POI ${point.code}`);
  return {id:`demo-${p.code}`,code:p.code,categoryId:point.categoryId,sortOrder:point.order,
    schematic:p.schematic_x==null?null:[+p.schematic_x,+p.schematic_y],lat:point.latitude,lng:point.longitude,
    geoVerified:false,geoSourceUrl:point.geoSourceUrl,status:'PUBLISHED',version:1,triggerRadiusM:p.trigger_radius_m||10,audio:null,
    translations:p.translations.map(t=>({langCode:t.lang_code,name:point.names[t.lang_code]||t.name,summary:t.summary||'',scriptText:t.script_text}))};
});
// Keep the legacy trail distances as hidden transit nodes when a stop was
// retired. Contract those nodes into edges between active numbered POIs so
// routes stay connected without putting retired stops back on the visitor map.
const routeEdges=[[1,0,.12],...ctx.P.filter(p=>p[0]!==1).map(p=>[p[0],p[6],p[5]])];
const routeAdj=new Map();
for(const [a,b,km] of routeEdges){
  for(const [u,v] of [[String(a),String(b)],[String(b),String(a)]]){
    if(!routeAdj.has(u))routeAdj.set(u,[]);
    routeAdj.get(u).push([v,km]);
  }
}
const activeRouteNodes=new Set(['0',...catalog.points.map(p=>String(p.code)).filter(code=>Number.isInteger(Number(code))&&Number(code)>0)]);
const edges=[];
for(const source of activeRouteNodes){
  const walk=(node,previous,distance,seen)=>{
    for(const [next,km] of routeAdj.get(node)||[]){
      if(next===previous||seen.has(next))continue;
      const total=distance+km;
      if(activeRouteNodes.has(next)){
        if(Number(source)<Number(next))edges.push([source,next,Number(total.toFixed(3))]);
        continue;
      }
      const branch=new Set(seen);branch.add(next);walk(next,node,total,branch);
    }
  };
  walk(source,null,0,new Set([source]));
}
// The visitor demo runs without a backend. Use shared translations for all 15
// stops and attach only audio generated from the exact matching transcript.
for (const poi of pois) {
  const fixture = fixtureByCode.get(poi.code);
  if (fixture) {
    poi.translations = fixture.translations.map(t => ({
      langCode: t.lang_code, name: t.name, summary: t.summary || '', scriptText: t.script_text, textHash: t.text_hash,
      audioNeedsRefresh: Boolean(t.audio_needs_refresh),
    }));
  }
  poi.audios = [];
}
await mkdir(out, { recursive: true });
// Only replace generated output inside the fixed web/dist directory.
for (const name of ['index.html', 'styles.css', 'app.mjs', 'core.mjs', 'store.mjs', 'analytics.mjs', 'join-qr.mjs', 'admin-tools.mjs', 'visitor-config.mjs', 'outdoor-map.mjs', 'poi-catalog.mjs', 'schematic-map.mjs', 'browser-tts.mjs', 'ui-i18n.mjs', 'ui-extra.mjs', 'sw.js', 'manifest.webmanifest', 'icon.svg']) {
  await cp(path.join(root, 'web', name), path.join(out, name));
}
await cp(path.join(root, 'web', 'vendor'), path.join(out, 'vendor'), { recursive: true });
await mkdir(path.join(out, 'data'), { recursive: true });
const audioOut = path.join(out, 'audio');
await mkdir(audioOut, { recursive: true });
// Prefer a generated clip only when it was synthesized from the current exact
// transcript. This also lets fresh Gemini audio replace older source recordings.
for (const [key, record] of Object.entries(generatedAudio)) {
  const [code, lang] = key.split(':');
  const poi = pois.find(p => p.code === code);
  const translation = poi?.translations.find(t => t.langCode === lang);
  if (!translation || record.textHash !== translation.textHash || poi.audios.some(a => a.langCode === lang)) continue;
  const file = `${code}-${lang}.mp3`;
  await cp(path.join(generatedAudioDir, file), path.join(audioOut, file));
  poi.audios.push({ langCode: lang, status: 'READY', audioUrl: `/audio/${file}`, provider: record.provider || 'LOCAL', voiceName: record.voiceName, textHash: record.textHash });
}
for (const file of await readdir(path.join(root, 'backend', 'fixtures', 'audio'))) {
  const [code, lang] = file.split('-');
  const poi = pois.find(p => p.code === code);
  const translation = poi?.translations.find(t => t.langCode === lang);
  const sourceTranslation = fixtureByCode.get(code)?.translations.find(t => t.lang_code === lang);
  if (!translation || translation.audioNeedsRefresh || translation.scriptText !== sourceTranslation?.script_text || poi.audios.some(a => a.langCode === lang)) continue;
  const audioUrl = `/audio/${file}`;
  await cp(path.join(root, 'backend', 'fixtures', 'audio', file), path.join(audioOut, file));
  poi.audios.push({ langCode: lang, status: 'READY', audioUrl, provider: 'GEMINI', voiceName: 'Google AI Studio', textHash: translation.textHash });
}
await writeFile(path.join(out, 'data', 'pois.json'), JSON.stringify({
  mapId: '00000000-0000-0000-0000-000000000001',catalogVersion:catalog.sourceSha256,
  pois, edges,
}, null, 2));
console.log(`Built web/dist: ${pois.length} stops, 5 languages. No external dependencies.`);
