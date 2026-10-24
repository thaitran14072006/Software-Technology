import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {zipFiles} from './zip.mjs';
let saved;
export async function buildOfflineArchive(base='http://127.0.0.1:4173'){
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw new Error('Archive uses the local public API only');
 const read=async lang=>{const r=await fetch(base+'/content-api/pois?mapId=00000000-0000-0000-0000-000000000001&lang='+lang,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Public content API unavailable');return r.json();};
 const first=await read('vi');if(saved?.base===base&&saved.rev===first.contentVersion)return saved;
 const content={},files=[],hashes={},counts={};let total=0;
 for(const lang of ['vi','en','ja','ko','zh']){
  const data=lang==='vi'?first:await read(lang);content[lang]=[];
  for(const poi of data.items){if(poi.audio?.provider!=='GEMINI')continue;
   if(!poi.audio.url.startsWith('/audio-assets/'))throw new Error('Unexpected audio path');
   const response=await fetch(base+poi.audio.url,{signal:AbortSignal.timeout(20000)});if(!response.ok||!response.headers.get('content-type')?.startsWith('audio/'))throw new Error('Audio download failed');
   const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length||bytes.length!==Number(poi.audio.sizeBytes))throw new Error('Incomplete audio file');
   total+=bytes.length;if(total>150*1024*1024)throw new Error('Offline archive exceeds 150 MB');
   const file=`audio/${lang}/${poi.id}.mp3`;files.push(['CatTienGuide/'+file,bytes]);hashes[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};content[lang].push({name:poi.name,text:poi.scriptText,file,voice:poi.audio.voiceName});
  }
  counts[lang]=content[lang].length;
 }
 const audioCount=Object.keys(hashes).length;if(!audioCount)throw new Error('No Google audio is ready');
 const labels={vi:['Thuyết minh Cát Tiên ngoại tuyến','Ngôn ngữ','Chọn bài thuyết minh','Phát','Dừng','Giọng Google AI Studio đã lưu. Không cần mạng.'],en:['Cat Tien offline guide','Language','Choose a narration','Play','Stop','Saved Google AI Studio voice. No network required.'],ja:['カットティエン オフラインガイド','言語','解説を選択','再生','停止','保存済みGoogle AI Studio音声。ネット接続不要です。'],ko:['깟띠엔 오프라인 가이드','언어','해설 선택','재생','정지','저장된 Google AI Studio 음성입니다. 인터넷이 필요 없습니다.'],zh:['吉仙离线导览','语言','选择讲解','播放','停止','已保存Google AI Studio语音，无需网络。']};
 const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
 const template=await readFile(new URL('./offline-template.html',import.meta.url),'utf8');
 files.push(['CatTienGuide/index.html',Buffer.from(template.replace('__GUIDE_DATA__',()=>json(content)).replace('__GUIDE_LABELS__',()=>json(labels)))]);
 files.push(['CatTienGuide/NotoSans.ttf',await readFile(new URL('../web/vendor/fonts/NotoSans.ttf',import.meta.url))]);
 files.push(['CatTienGuide/manifest.json',Buffer.from(JSON.stringify({provider:'GEMINI',partial:audioCount<first.items.length*5,audioCount,languages:counts,files:hashes},null,2))]);
 files.push(['CatTienGuide/README.txt',Buffer.from('Extract the whole folder and open index.html. MP3 files also play in a regular audio player. No network or API key is required.\n')]);
 saved={base,rev:first.contentVersion,buffer:zipFiles(files),audioCount,counts};return saved;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=await buildOfflineArchive();await writeFile(new URL('../web/dist/offline-guide.zip',import.meta.url),result.buffer);console.log(JSON.stringify({audioCount:result.audioCount,languages:result.counts,bytes:result.buffer.length}));}
