import {existsSync} from 'node:fs';
if(existsSync(new URL('./data/active-pois.json',import.meta.url)))throw Error('Legacy content import is disabled for the revised fifteen-POI catalog. Update the current fixture instead.');
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:4173';
const doc=JSON.parse(await readFile(new URL('./data/tts-document.json',import.meta.url),'utf8'));
const geo=JSON.parse(await readFile(new URL('./data/poi-coordinates.json',import.meta.url),'utf8'));
const translations={};
for(const lang of ['en','ja','ko','zh'])translations[lang]=JSON.parse(await readFile(new URL(`./data/document-${lang}.json`,import.meta.url),'utf8'));
const credentials=await readFile(new URL('../backend/.runtime/admin-login.txt',import.meta.url),'utf8');
let access,refresh;
async function call(route,method='GET',body){const res=await fetch(base+'/content-api/'+route,{method,headers:{'content-type':'application/json',...(access?{authorization:`Bearer ${access}`}:{})},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw new Error(`Import ${route} HTTP ${res.status}: ${JSON.stringify(data).slice(0,200)}`);return data;}
try{
 const login=await call('auth/login','POST',{email:credentials.match(/^Email: (.+)$/m)[1],password:credentials.match(/^Password: (.+)$/m)[1]});access=login.accessToken;refresh=login.refreshToken;
 const before=await call('admin/pois?limit=100');
 const backup=new URL(`../backend/.runtime/document-import-${Date.now()}.json`,import.meta.url);await writeFile(backup,JSON.stringify(before.items,null,2));
 for(const item of doc.items){
  const coordinate=geo.points.find(p=>p.documentOrder===item.documentOrder);
  const old=before.items.find(p=>p.code===item.existingCode || p.code===coordinate?.code);
  if(!old && !coordinate){console.log(`Document ${item.documentOrder}: held for a reliable coordinate; source text preserved.`);continue;}
  const trs=[{langCode:'vi',name:item.name,scriptText:item.scriptText},...Object.entries(translations).map(([lang,rows])=>{const tr=rows.find(t=>t.documentOrder===item.documentOrder);return {langCode:lang,name:tr.name.normalize('NFC'),scriptText:tr.scriptText.normalize('NFC')};})];
  const body={code:old?.code||coordinate.code,mapId:'00000000-0000-0000-0000-000000000001',categoryId:old?.categoryId||1,status:'PUBLISHED',audioMode:'TTS',translations:trs,...(coordinate?{latitude:coordinate.latitude,longitude:coordinate.longitude,geoSourceUrl:coordinate.source,geoVerified:false}:{})};
  await call(old?`admin/pois/${old.id}`:'admin/pois',old?'PATCH':'POST',body);
  console.log(`Document ${item.documentOrder}: saved as ${body.code}; five matching language scripts${coordinate?' with sourced coordinates':''}.`);
 }
}finally{if(refresh)await call('auth/logout','POST',{refreshToken:refresh}).catch(()=>{});}
