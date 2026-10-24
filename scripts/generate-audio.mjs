import {readFile} from 'node:fs/promises';
try{process.loadEnvFile(new URL('../backend/.env',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
const base=process.env.SMOKE_URL??'http://127.0.0.1:4173';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw new Error('This helper only sends local admin credentials to the local application.');
const file=await readFile(new URL('../backend/.runtime/admin-login.txt',import.meta.url),'utf8');
const email=file.match(/^Email: (.+)$/m)?.[1],password=file.match(/^Password: (.+)$/m)?.[1];
let token,refreshToken;
async function call(path,method='GET',body){const res=await fetch(base+'/content-api/'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw new Error(JSON.stringify(data));return data;}
try{
 const login=await call('auth/login','POST',{email,password});token=login.accessToken;refreshToken=login.refreshToken;
 const config=await call('configs');const expected=process.argv.includes('--gemini')?'GEMINI':'LOCAL';if(config.tts_provider!==expected)throw new Error(`Expected ${expected} runtime. Start the corresponding local-tts or gemini command first.`);
 if(config.tts_paused_until && Date.parse(config.tts_paused_until)>Date.now())throw new Error(`Google quota exhausted; paused until ${config.tts_paused_until}. Existing MP3s are retained.`);
 const items=[];let page=1,data;
 do{data=await call(`admin/pois?limit=100&page=${page++}`);items.push(...data.items);}while(items.length<data.total);
 let queued=0;const ids=[];
 const codeFilter=process.argv.find(a=>a.startsWith('--codes='))?.slice(8).split(',');
 const assigned=process.env.TTS_LANGUAGES?.split(',').map(s=>s.trim()).filter(Boolean);
 const langFilter=process.argv.find(a=>a.startsWith('--langs='))?.slice(8).split(',')||(assigned?.length?assigned:undefined);
 if(langFilter?.some(l=>!['vi','en','ja','ko','zh'].includes(l)))throw new Error('Use --langs=vi,en,ja,ko,zh with the languages assigned to you.');
 if(assigned?.length&&langFilter?.some(l=>!assigned.includes(l)))throw new Error('Requested language is outside TTS_LANGUAGES; update your assignment and restart the backend first.');
 for(const poi of items.filter(p=>p.status==='PUBLISHED'&&(!codeFilter||codeFilter.includes(p.code)))){ids.push(poi.id);for(const tr of poi.translations.filter(t=>!langFilter||langFilter.includes(t.langCode))){const out=await call(`admin/pois/${poi.id}/audios/generate`,'POST',{langCode:tr.langCode,voiceGender:'FEMALE'});queued+=out.queued;}}
 console.log(`Queued ${queued} missing narrations. Existing READY recordings are preserved.`);
 for(let n=0;n<1800;n++){
  const rows=[];for(const id of ids){const p=await call(`admin/pois/${id}`);rows.push(...p.audios.filter(a=>a.source==='TTS'&&(!langFilter||langFilter.includes(a.langCode))));}
  const pending=rows.filter(a=>a.status==='PENDING').length,ready=rows.filter(a=>a.status==='READY').length,failed=rows.filter(a=>a.status==='FAILED').length;
  if(n%10===0||!pending)console.log(`TTS ready=${ready}, pending=${pending}, failed=${failed}`);
  if(!pending){if(failed)process.exitCode=1;break;}
  if(n%10===0){const live=await call('configs');if(live.tts_paused_until&&Date.parse(live.tts_paused_until)>Date.now()){console.log(`Quota paused until ${live.tts_paused_until}. Existing audio and pending jobs are retained.`);process.exitCode=2;break;}}
  await new Promise(r=>setTimeout(r,2000));
  if(n===1799)throw new Error('Jobs not finished yet; inspect admin job logs.');
 }
}finally{if(refreshToken)await call('auth/logout','POST',{refreshToken}).catch(()=>{});}
