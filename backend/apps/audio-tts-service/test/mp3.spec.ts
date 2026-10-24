import { mp3DurationSec } from '../src/util/mp3';

// Khung MPEG1 Layer III, 128 kbps (header FF FB 90 00), 16000 byte => 1 giây
test('128 kbps: 16000 byte = 1 giây', () => {
  const buf = Buffer.alloc(16000); buf[0] = 0xff; buf[1] = 0xfb; buf[2] = 0x90; buf[3] = 0x00;
  expect(mp3DurationSec(buf)).toBeCloseTo(1, 5);
});

// MPEG2 Layer III, 32 kbps (FF F3 40 00 -> idx 4 => 32 kbps), 4000 byte = 1 giây
test('MPEG2 32 kbps: 4000 byte = 1 giây', () => {
  const buf = Buffer.alloc(4000); buf[0] = 0xff; buf[1] = 0xf3; buf[2] = 0x40; buf[3] = 0x00;
  expect(mp3DurationSec(buf)).toBeCloseTo(1, 5);
});

test('bỏ qua thẻ ID3v2 ở đầu', () => {
  const id3 = Buffer.alloc(10 + 20); id3.write('ID3', 0, 'latin1'); id3[9] = 20;  // kích thước thẻ = 20
  const frame = Buffer.alloc(16000); frame[0] = 0xff; frame[1] = 0xfb; frame[2] = 0x90;
  const d = mp3DurationSec(Buffer.concat([id3, frame]))!;
  expect(d).toBeGreaterThan(1.0); expect(d).toBeLessThan(1.01);
});

test('dữ liệu không phải MP3 trả null', () => { expect(mp3DurationSec(Buffer.alloc(100))).toBeNull(); });
