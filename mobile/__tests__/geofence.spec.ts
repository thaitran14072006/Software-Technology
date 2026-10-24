import { GeofenceEngine } from '../src/utils/geofence';
const poi = { id: 'a', lat: 11.4579, lng: 107.34348, radiusM: 10 };
const at = (dLat: number) => ({ lat: poi.lat + dLat, lng: poi.lng, accuracy: 5 });   // 0.00001° ≈ 1.1 m

test('cần 2 fix liên tiếp trong 10 m mới kích hoạt', () => {
  const g = new GeofenceEngine();
  expect(g.update(at(0.00003), [poi])).toHaveLength(0);
  expect(g.update(at(0.00003), [poi])).toHaveLength(1);
});
test('không kích hoạt lại khi còn trong vùng, chỉ lại sau khi ra xa', () => {
  const g = new GeofenceEngine(); g.update(at(0.00002), [poi]); g.update(at(0.00002), [poi]);
  expect(g.update(at(0.00002), [poi])).toHaveLength(0);
  g.update(at(0.0004), [poi]);                                 // ra xa ~44 m
  g.update(at(0.00002), [poi]);
  expect(g.update(at(0.00002), [poi])).toHaveLength(1);
});
test('bỏ fix độ chính xác kém', () => {
  const g = new GeofenceEngine(); const bad = { ...at(0), accuracy: 60 };
  g.update(bad, [poi]);
  expect(g.update(bad, [poi])).toHaveLength(0);
});
test('fix ngoài bán kính reset chuỗi xác nhận', () => {
  const g = new GeofenceEngine();
  g.update(at(0.00003), [poi]); g.update(at(0.0002), [poi]);   // vào rồi ra
  expect(g.update(at(0.00003), [poi])).toHaveLength(0);          // phải đếm lại từ đầu
});
