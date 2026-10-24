import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {UI_ROWS,translateUI,formatUI} from '../ui-i18n.mjs';

test('Shared UI catalog has five complete languages and preserves every dynamic parameter',()=>{
 const ids=s=>[...new Set([...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]))].sort();
 for(const row of UI_ROWS){assert.equal(row.length,5,row[0]);for(const value of row){assert.ok(value.trim(),row[0]);assert.deepEqual(ids(value),ids(row[0]),row[0]);}}
 assert.equal(translateUI('Nguồn giọng đọc','en'),'Audio source');
 assert.match(formatUI('Gói ngoại tuyến: {0} audio Google, {1} bản chưa sẵn sàng. Lưu lúc {2}.',[11,74,'10:00'],'en'),/11 Google recordings, 74 not ready/);
 assert.doesNotMatch(translateUI('Đã lưu gói backend lúc 10:00. Giọng TTS phụ thuộc giọng cài trên thiết bị.','ja'),/Đã lưu/);
});
test('All mobile locale catalogs cover the same keys without English fallback gaps',async()=>{
 const flatten=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flatten(v,p+k+'.'):[p+k]).sort();
 const en=JSON.parse(await readFile(new URL('../../mobile/src/i18n/locales/en.json',import.meta.url)));
 for(const lang of ['vi','ja','ko','zh']){const json=JSON.parse(await readFile(new URL(`../../mobile/src/i18n/locales/${lang}.json`,import.meta.url)));assert.deepEqual(flatten(json),flatten(en),lang);}
 const font=await readFile(new URL('../vendor/fonts/NotoSans.ttf',import.meta.url));assert.equal(font.readUInt32BE(0),0x00010000);
});

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
globalThis.localStorage=memory();globalThis.sessionStorage=memory();globalThis.window=globalThis;globalThis.location={href:'http://127.0.0.1:4173/'};
const store=await import('../store.mjs');
test('Google offline downloads reject truncated files and preserve the old saved pack',async()=>{
 const original=globalThis.fetch;store.saveSettings('api');const key=store.packKey('vi');localStorage.setItem(key,'{"old":true}');
 globalThis.caches={open:async()=>({put:async()=>{}})};
 globalThis.fetch=async url=>String(url).includes('/pois?')?new Response(JSON.stringify({items:[{id:'p',audio:{provider:'GEMINI',url:'/audio-assets/a.mp3',sizeBytes:9}}]})):new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'audio/mpeg'}});
 try{await assert.rejects(()=>store.saveOffline(()=>{},{provider:'GEMINI'}),/chưa tải đủ/);assert.equal(localStorage.getItem(key),'{"old":true}');}finally{globalThis.fetch=original;}
});
test('Google offline pack keeps provider metadata and the exact audio bytes across all five languages',async()=>{
 const original=globalThis.fetch;const cached=[];globalThis.caches={open:async()=>({put:async(url,res)=>cached.push([...new Uint8Array(await res.arrayBuffer())])})};
 globalThis.fetch=async url=>String(url).includes('/pois?')?new Response(JSON.stringify({items:[{id:'p',audio:{provider:'GEMINI',voiceName:'Kore',url:'/audio-assets/a.mp3',sizeBytes:3}}]})):new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'audio/mpeg'}});
 try{const out=await store.saveOffline(()=>{},{provider:'GEMINI'});assert.equal(out.audioCount,5);assert.equal(out.audioMissing,0);assert.ok(cached.every(bytes=>JSON.stringify(bytes)==='[1,2,3]'));assert.equal(JSON.parse(localStorage.getItem(store.packKey('vi'))).items[0].audio.provider,'GEMINI');}finally{globalThis.fetch=original;}
});
