import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const dist=new URL('../dist/',import.meta.url);

test('The production app includes every transitive browser module it imports',async()=>{
  const visited=new Set();
  async function visit(url){
    if(visited.has(url.href))return;
    visited.add(url.href);
    let source;
    try{source=await readFile(url,'utf8');}
    catch(error){assert.fail(`Missing built browser module: ${url.href} (${error.code})`);}
    const staticImports=/^\s*(?:import|export)\s+.*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;
    const dynamicImports=/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
    for(const pattern of [staticImports,dynamicImports])for(const match of source.matchAll(pattern)){
      const specifier=match[1]||match[2];
      if(specifier.startsWith('.'))await visit(new URL(specifier,url));
    }
  }
  const html=await readFile(new URL('index.html',dist),'utf8');
  for(const [,src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.mjs)"/g))await visit(new URL(src,dist));
  assert.ok(visited.has(new URL('app.mjs',dist).href));
  assert.ok(visited.has(new URL('map-viewport.mjs',dist).href));
  assert.ok(visited.size>10);
});

test('Every app-shell resource is present for service-worker installation',async()=>{
  const sw=await readFile(new URL('sw.js',dist),'utf8');
  const assets=sw.match(/const ASSETS\s*=\s*\[([^\]]+)\]/)?.[1];
  assert.ok(assets,'Missing service-worker asset list');
  for(const [,name] of assets.matchAll(/'([^']+)'/g)){
    const url=new URL(name==='./'?'index.html':name,dist);
    try{await readFile(url);}
    catch(error){assert.fail(`Missing offline app-shell resource: ${name} (${error.code})`);}
  }
});
