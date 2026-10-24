import { env } from '../config/env';

export type Pt = [number, number];
const { ORIGIN: o, METERS_PER_UNIT: mpu } = env;
const mLat = 110540, mLng = 111320 * Math.cos((o.lat * Math.PI) / 180);

// raw = tọa độ trong nhóm <g transform="translate(35 40) scale(1.6)"> của index.html; world = tọa độ viewBox 2400x1700
export const rawToWorld = ([x, y]: Pt): Pt => [x * 1.6 + 35, y * 1.6 + 40];
export const worldToRaw = ([x, y]: Pt): Pt => [(x - 35) / 1.6, (y - 40) / 1.6];
// CẢNH BÁO: phép chiếu GPS -> sơ đồ chỉ là ƯỚC LƯỢNG (sơ đồ du lịch không theo tỉ lệ địa lý)
export const gpsToWorld = (lat: number, lng: number): Pt => [o.svg[0] + ((lng - o.lng) * mLng) / mpu, o.svg[1] - ((lat - o.lat) * mLat) / mpu];
export const gpsToRaw = (lat: number, lng: number): Pt => worldToRaw(gpsToWorld(lat, lng));
export const RAW_UNIT_M = 1.6 * mpu;           // 1 đơn vị "raw" ≈ 4 m trên sơ đồ
