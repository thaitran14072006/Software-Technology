import { Buffer } from 'buffer';

export interface IBeacon { uuid: string; major: number; minor: number; txPower: number; }

/** manufacturerData (base64) của ble-plx trên Android: [companyId LE 2 byte][0x02 0x15][uuid 16][major 2][minor 2][tx 1] */
export function parseIBeacon(b64?: string | null): IBeacon | null {
  if (!b64) return null;
  const b = Buffer.from(b64, 'base64');
  if (b.length < 25 || b[0] !== 0x4c || b[1] !== 0x00 || b[2] !== 0x02 || b[3] !== 0x15) return null;
  const hex = b.subarray(4, 20).toString('hex');
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return { uuid, major: b.readUInt16BE(20), minor: b.readUInt16BE(22), txPower: b.readInt8(24) };
}
/** Ước lượng khoảng cách (m) từ RSSI. n≈2.5 ngoài trời có cây; sai số lớn, chỉ dùng để so ngưỡng. */
export const estimateDistance = (rssi: number, txPower: number, n = 2.5) => Math.pow(10, (txPower - rssi) / (10 * n));
