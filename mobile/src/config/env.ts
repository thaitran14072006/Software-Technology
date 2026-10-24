export const env = {
  API_BASE: process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3001/api/v1',
  QR_API_BASE: process.env.EXPO_PUBLIC_QR_API_BASE ?? 'http://10.0.2.2:3003/api/v1',   // qr-fallback-service (QR + beacon)
  MAP_STYLE: process.env.EXPO_PUBLIC_MAP_STYLE ?? 'https://demotiles.maplibre.org/style.json',
  OFFLINE_MAP_STYLE: process.env.EXPO_PUBLIC_OFFLINE_MAP_STYLE ?? '',
  ASSET_BASE: process.env.EXPO_PUBLIC_ASSET_BASE ?? 'http://10.0.2.2:3002/assets',
  MAP_ID: process.env.EXPO_PUBLIC_MAP_ID ?? '00000000-0000-0000-0000-000000000001',
  // Trung tâm Du khách (config.js). Điểm neo giữa sơ đồ và GPS.
  ORIGIN: { lat: 11.423368, lng: 107.422042, svg: [659, 1400] as [number, number] },
  METERS_PER_UNIT: 2.5,          // ƯỚC LƯỢNG (config.js): mét thực / 1 đơn vị sơ đồ "world"
  PARK_HOURS: { open: '8h00', close: '16h00' },
};
