const BR_MPEG1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BR_MPEG2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

/** Check complete consecutive MPEG Layer III frames; reject renamed text and truncated files. */
export function validMp3(buf:Buffer):boolean {
 let offset=0,frames=0;
 if(buf.length>10&&buf.toString('latin1',0,3)==='ID3') offset=10+(((buf[6]&127)<<21)|((buf[7]&127)<<14)|((buf[8]&127)<<7)|(buf[9]&127))+((buf[5]&16)?10:0);
 while(offset+4<=buf.length){
  if(buf.length-offset===128&&buf.toString('latin1',offset,offset+3)==='TAG')break;
  if(buf[offset]!==255||(buf[offset+1]&224)!==224)return false;
  const ver=(buf[offset+1]>>3)&3,layer=(buf[offset+1]>>1)&3,idx=(buf[offset+2]>>4)&15,sr=(buf[offset+2]>>2)&3;
  if(ver===1||layer!==1||idx===0||idx===15||sr===3)return false;
  const rate=[44100,48000,32000][sr]/(ver===3?1:ver===2?2:4),kbps=(ver===3?BR_MPEG1_L3:BR_MPEG2_L3)[idx];
  const size=Math.floor((ver===3?144000:72000)*kbps/rate)+((buf[offset+2]>>1)&1);
  if(offset+size>buf.length)return false;offset+=size;frames++;
 }
 return frames>=2&&(offset===buf.length||(buf.length-offset===128&&buf.toString('latin1',offset,offset+3)==='TAG'));
}

/**
 * Ước lượng thời lượng MP3 (giây) từ bitrate của khung đầu tiên (giả định CBR, Layer III).
 * Chính xác với CBR; với VBR chỉ là xấp xỉ. Không tìm được khung hợp lệ thì trả về null.
 */
export function mp3DurationSec(buf: Buffer): number | null {
  let i = 0;
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {          // bỏ thẻ ID3v2
    i = 10 + (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f));
  }
  for (; i + 4 <= buf.length; i++) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) continue;
    const version = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3, idx = (buf[i + 2] >> 4) & 0xf;
    if (version === 1 || layer !== 1 || idx === 0 || idx === 15) continue;  // chỉ Layer III hợp lệ
    const kbps = (version === 3 ? BR_MPEG1_L3 : BR_MPEG2_L3)[idx];
    return (buf.length * 8) / (kbps * 1000);
  }
  return null;
}
