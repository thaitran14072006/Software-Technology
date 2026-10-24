import {mkdir,writeFile} from 'node:fs/promises';
const examples={'vi-VN':'Xin chào. Đây là hệ thống thuyết minh Cát Tiên.','en-US':'Welcome to Cat Tien National Park.','ja-JP':'こんにちは。カッティエン国立公園へようこそ。','cmn-CN':'欢迎来到吉仙国家公园。','ko-KR':'안녕하세요. 깟띠엔 국립공원에 오신 것을 환영합니다.'};
const folder=new URL('../backend/.runtime/tts-samples/',import.meta.url);await mkdir(folder,{recursive:true});
for(const[locale,text]of Object.entries(examples)){
 const response=await fetch('http://127.0.0.1:3010/synthesize',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({locale,text,gender:'FEMALE'}),signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw new Error(`${locale}: ${response.status} ${await response.text()}`);
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<1000||!response.headers.get('content-type')?.includes('audio/mpeg'))throw new Error('Invalid audio');
 await writeFile(new URL(locale+'.mp3',folder),bytes);console.log(`PASS local ${locale}: ${bytes.length} bytes, voice=${response.headers.get('x-voice')}`);
}
