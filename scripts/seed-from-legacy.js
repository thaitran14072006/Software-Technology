if(require('node:fs').existsSync(require('node:path').join(__dirname,'data','active-pois.json'))){console.log('Legacy seed disabled: use the current fifteen-POI fixture.');process.exit(0);}
// Nạp 15 điểm × 5 ngôn ngữ từ data.js/i18n.js gốc qua API Admin (TTS tự chạy).
// Dùng:  node scripts/seed-from-legacy.js http://localhost:3001/api/v1 <mapId> [--dry]
//   JWT:  JWT_SECRET=... node scripts/dev-token.js  ->  đặt vào biến ADMIN_TOKEN
const c = require('./load-legacy')();
const [base, mapId, flag] = process.argv.slice(2);
const dry = flag === '--dry';
if (!base || !mapId) { console.error('Dùng: node scripts/seed-from-legacy.js <apiBase> <mapId> [--dry]'); process.exit(1); }

const O = { lat: 11.423368, lng: 107.422042, svg: [659, 1400] }, MPU = 2.5;
const mLat = 110540, mLng = 111320 * Math.cos((O.lat * Math.PI) / 180);
const REAL = { 9: [11.457891, 107.34348] };                    // nguồn: config.js (Bàu Sấu). Thêm tọa độ khảo sát vào đây.
const world = (p) => [p[1] * 1.6 + 35, p[2] * 1.6 + 40];
const est = (p) => { const [x, y] = world(p); return [O.lat - ((y - O.svg[1]) * MPU) / mLat, O.lng + ((x - O.svg[0]) * MPU) / mLng]; };
const CAT = { p: 1, t: 2, w: 3 };                               // khớp poi_categories trong schema.sql

(async () => {
  const existing = new Set();
  if (!dry) {
    if (!process.env.ADMIN_TOKEN) throw new Error('Thiếu ADMIN_TOKEN');
    let page = 1, count = 0, data;
    do {
      const response = await fetch(`${base}/admin/pois?page=${page++}&limit=100`, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } });
      if (!response.ok) throw new Error(`Không đọc được dữ liệu hiện có: HTTP ${response.status}`);
      data = await response.json();
      data.items.forEach(p => existing.add(p.code)); count += data.items.length;
    } while (count < data.total);
  }
  for (const p of c.P) {
    if (existing.has(String(p[0]))) { console.log(p[0], 'đã có, bỏ qua'); continue; }
    const [lat, lng] = REAL[p[0]] ?? est(p);
    const body = {
      code: String(p[0]), mapId, categoryId: CAT[p[7]], latitude: lat, longitude: lng,
      schematicX: p[1], schematicY: p[2], status: 'PUBLISHED', geoVerified: !!REAL[p[0]],
      translations: ['vi', 'en', 'ja', 'zh', 'ko'].map((l) => {
        c.lang = l;
        return { langCode: l, name: c.nm(p), summary: c.sb(p) || undefined, scriptText: c.txt(p) };
      }),
    };
    if (dry) { console.log(p[0], body.latitude.toFixed(5), body.longitude.toFixed(5), 'verified=' + body.geoVerified, '|', body.translations[0].name); continue; }
    const r = await fetch(`${base}/admin/pois`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ADMIN_TOKEN ?? ''}` }, body: JSON.stringify(body),
    });
    console.log(p[0], r.status, r.ok ? '' : await r.text());
    if (!r.ok) throw new Error(`Nạp điểm ${p[0]} thất bại`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
