import { findRoute, NODE_RAW, REAL_KM, VISITOR_CENTER } from '../src/services/routing/trailGraph';

test('Trung tâm Du khách đến mọi node đều tìm được đường', () => {
  for (const id of Object.keys(NODE_RAW)) expect(findRoute(VISITOR_CENTER, NODE_RAW[+id])).not.toBeNull();
});

test('đối xứng', () => {
  const a = findRoute(NODE_RAW[1], NODE_RAW[14])!, b = findRoute(NODE_RAW[14], NODE_RAW[1])!;
  expect(Math.abs(a.lengthM - b.lengthM)).toBeLessThan(1e-6);
});

test('xa khu sơ đồ trả null', () => { expect(findRoute([5000, 5000], NODE_RAW[1])).toBeNull(); });

test('khoảng cách theo tuyến khớp số km của sơ đồ du lịch (±20%) cho các chặng ≥ 1 km', () => {
  for (const [id, from, km] of REAL_KM.filter((r) => r[2] >= 1)) {
    const r = findRoute(from === 0 ? VISITOR_CENTER : NODE_RAW[from], NODE_RAW[id])!;
    const got = r.lengthM / 1000;
    if (!(got > km * 0.8 && got < km * 1.2)) throw new Error(`chặng ${from}->${id}: kỳ vọng ~${km} km, ra ${got.toFixed(2)} km`);
  }
});
