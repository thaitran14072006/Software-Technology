import {validMp3} from '../src/util/mp3';
describe('Uploaded MP3 structure',()=>{
 const frame=Buffer.alloc(417);frame.set([255,251,144,0]);
 it('accepts complete consecutive frames',()=>expect(validMp3(Buffer.concat([frame,frame,frame]))).toBe(true));
 it('rejects a renamed text file and a truncated frame',()=>{expect(validMp3(Buffer.from('not audio.mp3'))).toBe(false);expect(validMp3(Buffer.concat([frame,frame.subarray(0,100)]))).toBe(false);});
});
