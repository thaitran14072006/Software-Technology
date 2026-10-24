import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
process.loadEnvFile(new URL('backend/.env',root));
const require=createRequire(new URL('backend/package.json',root));
const {Client}=require('pg');const db=new Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try {
 const {rows:[job]}=await db.query("SELECT j.id,j.payload,p.code FROM tts_jobs j JOIN poi_audios a ON a.current_job_id=j.id JOIN poi_translations t ON t.id=a.translation_id JOIN pois p ON p.id=a.poi_id WHERE j.status IN ('QUEUED','FAILED') AND j.payload->>'provider'='GEMINI' AND a.status IN ('PENDING','FAILED') AND t.text_hash=j.payload->>'textHash' AND p.status='PUBLISHED' AND p.deleted_at IS NULL ORDER BY CASE WHEN j.status='FAILED' THEN 0 ELSE 1 END,CASE WHEN a.lang_code='vi' THEN 0 ELSE 1 END,length(j.payload->>'text') LIMIT 1");
 if(!job)throw Error('No matching missing narration');
 const e=job.payload,model=process.env.GEMINI_TTS_MODEL||'gemini-3.8-flash-lite-tts';
 const voice=(e.gender==='MALE'?process.env.GEMINI_VOICE_MALE:process.env.GEMINI_VOICE_FEMALE)||(e.gender==='MALE'?'Charon':'Kore');
 const locale=e.ttsLocale==='cmn-CN'?'zh-CN':e.ttsLocale;
 const body={contents:[{role:'user',parts:[{text:e.text.normalize('NFC'),speech_metadata:{style:`Warm, clear national park audio guide in ${locale}. Natural pacing, faithful pronunciation, no extra words, no music.`}}]}],generationConfig:{responseModalities:['AUDIO'],responseFormat:{audio:{mimeType:'AUDIO_WAV',sampleRate:24000}},speechConfig:{voiceConfig:{voice}}}};
 const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(150000)});
 const data=await res.json();
 if(!res.ok){console.log(JSON.stringify({status:res.status,code:job.code,language:e.langCode,errorStatus:data.error?.status,details:data.error?.details},null,2));process.exitCode=2;}
 else {
  const audio=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
  if(!audio||data.candidates?.[0]?.finishReason!=='STOP')throw Error('Incomplete Google audio');
  const wav=Buffer.from(audio.data,'base64');if(wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE')throw Error('Expected WAV');
  const dir=new URL('backend/.runtime/gemini/',root);await mkdir(dir,{recursive:true});
  await writeFile(new URL('resume-probe.wav',dir),wav);await writeFile(new URL('resume-probe.json',dir),JSON.stringify({jobId:job.id,payload:e,model,voice,code:job.code}));
  console.log(JSON.stringify({status:res.status,code:job.code,language:e.langCode,wavBytes:wav.length,saved:true}));
 }
}finally{await db.end();}
