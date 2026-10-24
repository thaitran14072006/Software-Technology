import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'web', 'dist');
const ctx = { CT: {} };
ctx.window = ctx;
vm.createContext(ctx);
for (const name of ['data.js', 'i18n.js']) {
  vm.runInContext(await readFile(path.join(root, 'scripts', 'legacy', name), 'utf8'), ctx, { filename: name, timeout: 1000 });
}
const pois = ctx.P.map(p => ({
  id: `demo-${p[0]}`, code: String(p[0]), categoryId: { p: 1, t: 2, w: 3 }[p[7]],
  schematic: [p[1], p[2]], lat: p[0] === 9 ? 11.457891 : null,
  lng: p[0] === 9 ? 107.34348 : null, geoVerified: p[0] === 9,
  status: 'PUBLISHED', version: 1, triggerRadiusM: 10, audio: null,
  translations: ['vi', 'en', 'ja', 'ko', 'zh'].map(lang => {
    ctx.lang = lang;
    return { langCode: lang, name: ctx.nm(p), summary: ctx.sb(p), scriptText: ctx.txt(p) };
  }),
}));
await mkdir(out, { recursive: true });
// Only replace generated output inside the fixed web/dist directory.
for (const name of ['index.html', 'styles.css', 'app.mjs', 'core.mjs', 'store.mjs', 'analytics.mjs', 'join-qr.mjs', 'admin-tools.mjs', 'visitor-config.mjs', 'outdoor-map.mjs', 'browser-tts.mjs', 'ui-i18n.mjs', 'ui-extra.mjs', 'sw.js', 'manifest.webmanifest', 'icon.svg']) {
  await cp(path.join(root, 'web', name), path.join(out, name));
}
await cp(path.join(root, 'web', 'vendor'), path.join(out, 'vendor'), { recursive: true });
await mkdir(path.join(out, 'data'), { recursive: true });
await writeFile(path.join(out, 'data', 'pois.json'), JSON.stringify({
  mapId: '00000000-0000-0000-0000-000000000001',
  pois, edges: [[1, 0, 0.12], ...ctx.P.filter(p => p[0] !== 1).map(p => [p[0], p[6], p[5]])],
}, null, 2));
console.log(`Built web/dist: ${pois.length} stops, 5 languages. No external dependencies.`);
