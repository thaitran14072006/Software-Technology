import { env } from '../../config/env';
import { loadExtras } from '../offline/offlineStore';

export type QrResult = { kind: 'POI'; poiId: string } | { kind: 'GATE'; url: string };

/** null = mã không hợp lệ (UC4-E1). Mất mạng thì tra bảng token đã tải trong gói offline (FR9). */
export async function resolveQr(token: string): Promise<QrResult | null> {
  try {
    const res = await fetch(`${env.QR_API_BASE}/qr/${token}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`QR API ${res.status}`);
    return res.json();
  } catch (e) {
    const poiId = loadExtras()?.qr[token];
    if (poiId) return { kind: 'POI', poiId };
    if (e instanceof TypeError || (e as Error).name === 'TimeoutError') return null;   // không có mạng và token lạ
    throw e;
  }
}
