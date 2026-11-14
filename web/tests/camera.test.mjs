import {test} from 'node:test';
import assert from 'node:assert/strict';
import qrcode from '../vendor/qrcode.mjs';
import {createCameraScanner,createQrDecoder,cameraErrorKey,cameraText} from '../camera.mjs';

function setup(overrides={}){
 let stopped=0,scheduled;const statuses=[];
 const track={stop(){stopped++;},addEventListener(){}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const video={hidden:true,srcObject:null,pause(){},async play(){}};
 const scanner=createCameraScanner({video,mediaDevices:{getUserMedia:async()=>stream},decoder:async()=>async()=>null,
 schedule:fn=>{scheduled=fn;return 1;},cancel(){scheduled=null;},onCode:async()=>{},onStatus:(key,message)=>statuses.push(message||key),...overrides});
 return {scanner,video,stream,statuses,get stopped(){return stopped;},scan:()=>scheduled()};
}
test('Closing camera while permission is pending stops the stream when permission arrives',async()=>{
 let grant;const rig=setup({mediaDevices:{getUserMedia:()=>new Promise(r=>grant=r)}});
 const start=rig.scanner.start();await Promise.resolve();rig.scanner.stop();grant(rig.stream);await start;
 assert.equal(rig.stopped,1);assert.equal(rig.video.srcObject,null);assert.equal(rig.video.hidden,true);assert.equal(rig.scanner.state,'stopped');
});
test('Camera stop releases tracks; invalid codes allow scanning the next code',async()=>{
 let calls=0;const rig=setup({decoder:async()=>async()=>++calls===1?'bad':'valid',onCode:async code=>{if(code==='bad')throw new Error('invalid code');}});
 await rig.scanner.start();assert.equal(rig.scanner.state,'scanning');
 await rig.scan();assert.equal(rig.scanner.state,'scanning');assert.equal(rig.statuses.at(-1),'invalid code');
 await rig.scan();assert.equal(rig.scanner.state,'stopped');assert.equal(rig.stopped,1);assert.equal(rig.video.hidden,true);
});
test('A late decoder result cannot open a POI after the camera is closed',async()=>{
 let result,opened=0;const rig=setup({decoder:async()=>()=>new Promise(r=>result=r),onCode:async()=>{opened++;}});
 await rig.scanner.start();const scanning=rig.scan();rig.scanner.stop();result('old-code');await scanning;
 assert.equal(opened,0);assert.equal(rig.stopped,1);assert.equal(rig.scanner.state,'stopped');
});
test('Video playback failure releases the camera instead of leaving a live stream',async()=>{
 const video={hidden:true,srcObject:null,pause(){},async play(){throw new Error('play blocked');}};
 const rig=setup({video});await rig.scanner.start();
 assert.equal(rig.stopped,1);assert.equal(video.srcObject,null);assert.equal(video.hidden,true);assert.equal(rig.statuses.at(-1),'failed');
});
test('Camera failures restore controls and explain permission, HTTP and missing hardware',async()=>{
 for(const [error,key] of [[{name:'NotAllowedError'},'permission'],[{name:'NotFoundError'},'notFound'],[{name:'NotReadableError'},'busy']]){
  const rig=setup({mediaDevices:{getUserMedia:async()=>{throw error;}}});await rig.scanner.start();
  assert.equal(rig.scanner.state,'stopped');assert.equal(rig.statuses.at(-1),key);assert.equal(cameraErrorKey(error),key);
 }
 const insecure=setup({secure:false});await insecure.scanner.start();assert.equal(insecure.statuses.at(-1),'insecure');
 for(const lang of ['vi','en','ja','ko','zh'])assert.ok(cameraText('permission',lang).length>10);
});
test('Local decoder reads a real QR without BarcodeDetector, including a broken native API',async()=>{
 const value='sag://poi/camera-test-001',qr=qrcode(0,'M');qr.addData(value);qr.make();
 const count=qr.getModuleCount(),scale=6,size=(count+8)*scale,data=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=Math.floor(y/scale)-4,c=Math.floor(x/scale)-4;
  if(r>=0&&c>=0&&r<count&&c<count&&qr.isDark(r,c)){const o=(y*size+x)*4;data[o]=data[o+1]=data[o+2]=0;}
 }
 const canvasFactory=()=>({getContext:()=>({drawImage(){},getImageData:()=>({data,width:size,height:size})})});
 for(const Detector of [null,class{static async getSupportedFormats(){throw new Error('unsupported');}},class{static async getSupportedFormats(){return ['qr_code'];} async detect(){throw new Error('native failed');}}]){
  const decode=await createQrDecoder({Detector,canvasFactory});
  assert.equal(await decode({readyState:4,videoWidth:size,videoHeight:size}),value);
 }
});
