// Run after npm run build to export the redraw of the supplied tourist poster.
import {readFile, writeFile} from 'node:fs/promises';
import {renderReferenceMap,REFERENCE_MAP_CSS} from '../web/reference-map.mjs';
const root=new URL('../',import.meta.url);
const font=await readFile(new URL('web/vendor/fonts/NotoSans.ttf',root));
const svg=renderReferenceMap();
const face=`@font-face{font-family:"Poster Noto";src:url("data:font/ttf;base64,${font.toString('base64')}");font-weight:100 900}`;
const styled=svg.replace('<defs>',`<style>${face}${REFERENCE_MAP_CSS}</style><defs>`);
await writeFile(new URL('docs/cat-tien-schematic-preview.svg',root),styled);
await writeFile(new URL('web/dist/schematic-preview.css',root),`@font-face{font-family:"Poster Noto";src:url("./vendor/fonts/NotoSans.ttf");font-weight:100 900}${REFERENCE_MAP_CSS}body{margin:0;background:#edf5f2}`);
await writeFile(new URL('web/dist/schematic-preview.html',root),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sơ đồ tham quan Cát Tiên · Xem trước</title><link rel="stylesheet" href="./schematic-preview.css">${svg}</html>`);
console.log('Exported docs/cat-tien-schematic-preview.svg and web/dist/schematic-preview.html');
