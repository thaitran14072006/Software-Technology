import { chunkText } from '../src/util/chunk-text';

test('mỗi chunk không vượt giới hạn byte và không mất nội dung', () => {
  const text = Array.from({ length: 400 }, (_, i) => `Đây là câu số ${i}.`).join(' ');
  const chunks = chunkText(text, 500);
  expect(chunks.length).toBeGreaterThan(1);
  for (const c of chunks) expect(Buffer.byteLength(c)).toBeLessThanOrEqual(500);
  expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text.replace(/\s+/g, ' '));
});

test('văn bản ngắn giữ nguyên một chunk', () => {
  expect(chunkText('Xin chào. Đây là Cát Tiên.')).toEqual(['Xin chào. Đây là Cát Tiên.']);
});

test('câu dài không có dấu chấm vẫn được cắt cứng trong giới hạn', () => {
  const long = 'a'.repeat(3000);
  for (const c of chunkText(long, 1000)) expect(Buffer.byteLength(c)).toBeLessThanOrEqual(1000);
});

test('tiếng Nhật (3 byte/ký tự) không vượt giới hạn', () => {
  const jp = 'あ'.repeat(2000);
  for (const c of chunkText(jp, 1000)) expect(Buffer.byteLength(c)).toBeLessThanOrEqual(1000);
});
