import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const pois = JSON.parse(await readFile(path.join(root,'backend/fixtures/content.json'),'utf8')).pois.filter(p=>Number(p.code)>=1&&Number(p.code)<=15);
const names={vi:'Tiếng Việt',en:'English',ja:'日本語',ko:'한국어',zh:'中文'};
const langs=['vi','en','ja','ko','zh'];
let out='# Thuyết minh 15 địa điểm · 5 ngôn ngữ\n\nVăn bản thuyết minh được dùng để tạo âm thanh trong bản demo.\n';
for(const p of pois){out+=`\n## ${p.code}. ${p.translations.find(t=>t.lang_code==='vi')?.name||'Địa điểm '+p.code}\n`;
for(const l of langs){const t=p.translations.find(x=>x.lang_code===l);if(!t?.script_text)throw Error(`Missing ${p.code}:${l}`);out+=`\n### ${names[l]}\n\n${t.script_text}\n`;}}
await mkdir(path.join(root,'docs'),{recursive:true});await writeFile(path.join(root,'docs/NARRATIONS_15_POI_5_LANGUAGES.md'),out);
console.log('Wrote 75 narration scripts.');
