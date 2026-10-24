import { applyManifest, emptyPack, Manifest, currentAudioUri } from '../src/services/offline/packLogic';
const poi = (id: string, url: string | null) => ({ id, code: id, lang: 'vi', name: id, audio: url ? { url, durationSec: null, sizeBytes: 1000 } : null } as any);
const man = (over: Partial<Manifest>): Manifest => ({ rev: 1, items: [], deletedIds: [], downloads: [], ...over });
test('An old robot recording cannot shadow a new Google file or a removed audio',()=>{
 const pack={...emptyPack('vi'),files:{a:'/offline/local-oldhash.mp3'}};
 expect(currentAudioUri(pack,'a','https://guide/audio/google-newhash.mp3')).toBe('https://guide/audio/google-newhash.mp3');
 expect(currentAudioUri(pack,'a',null)).toBeNull();
 expect(currentAudioUri({...pack,files:{a:'/offline/google-newhash.mp3'}},'a','https://guide/audio/google-newhash.mp3')).toBe('/offline/google-newhash.mp3');
});

test('POI mới có audio -> 1 job tải', () => {
  const r = applyManifest(emptyPack('vi'), man({ items: [poi('a', 'https://cdn/audio/vi/1-female-abcd1234.mp3')] }));
  expect(r.jobs).toHaveLength(1);
  expect(r.jobs[0].fileName).toBe('1-female-abcd1234.mp3');
});
test('text đổi -> URL (hash) đổi -> tải bản mới, đánh dấu file cũ để xóa', () => {
  const prev = { ...emptyPack('vi'), files: { a: '/docs/audio/vi/1-female-aaaa0000.mp3' }, items: { a: poi('a', 'x/1-female-aaaa0000.mp3') } };
  const r = applyManifest(prev, man({ items: [poi('a', 'https://cdn/1-female-bbbb1111.mp3')] }));
  expect(r.jobs).toHaveLength(1);
  expect(r.obsolete).toEqual(['/docs/audio/vi/1-female-aaaa0000.mp3']);
});
test('không đổi -> không tải lại', () => {
  const prev = { ...emptyPack('vi'), files: { a: '/d/1-female-aaaa0000.mp3' }, items: { a: poi('a', 'x/1-female-aaaa0000.mp3') } };
  expect(applyManifest(prev, man({ items: [poi('a', 'https://cdn/1-female-aaaa0000.mp3')] })).jobs).toHaveLength(0);
});
test('POI bị xóa -> bỏ khỏi gói và xóa file', () => {
  const prev = { ...emptyPack('vi'), files: { a: '/d/a.mp3' }, items: { a: poi('a', 'u/a.mp3') } };
  const r = applyManifest(prev, man({ deletedIds: ['a'] }));
  expect(r.pack.items.a).toBeUndefined();
  expect(r.obsolete).toEqual(['/d/a.mp3']);
});
test('tự chữa file thiếu dù manifest rỗng', () => {
  const prev = { ...emptyPack('vi'), items: { a: poi('a', 'u/a-1.mp3') } };
  expect(applyManifest(prev, man({})).jobs).toHaveLength(1);
});
test('audio bị gỡ -> xóa file cũ', () => {
  const prev = { ...emptyPack('vi'), files: { a: '/d/a.mp3' }, items: { a: poi('a', 'u/a.mp3') } };
  const r = applyManifest(prev, man({ items: [poi('a', null)] }));
  expect(r.obsolete).toEqual(['/d/a.mp3']);
  expect(r.jobs).toHaveLength(0);
});
