const MAX_BYTES = 4500; // Google giới hạn ~5000 byte/request

/** Tách theo câu để không cắt giữa chừng; mỗi chunk <= max byte. */
export function chunkText(text: string, max = MAX_BYTES): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?。！？]+[.!?。！？]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (Buffer.byteLength(cur + s) > max && cur) { out.push(cur.trim()); cur = ''; }
    if (Buffer.byteLength(s) > max) {                 // câu quá dài: cắt cứng theo ký tự
      if (cur.trim()) { out.push(cur.trim()); cur = ''; }
      const step = Math.max(1, Math.floor(max / 4)); // an toàn cho ký tự nhiều byte (CJK ~3 byte)
      for (let i = 0; i < s.length; i += step) out.push(s.slice(i, i + step).trim());
      continue;
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}
