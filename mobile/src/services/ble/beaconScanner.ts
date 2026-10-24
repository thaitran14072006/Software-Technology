import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { estimateDistance, parseIBeacon } from '../../utils/ibeacon';

export interface BeaconRef { uuid: string; major: number; minor: number; poiId: string; }
let manager: BleManager | null = null;
const mgr = () => (manager ??= new BleManager());

export async function ensureBlePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;                      // iOS: chưa hỗ trợ iBeacon thô (cần CoreLocation ranging)
  const r = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);
  return Object.values(r).every((v) => v === 'granted') && (await mgr().state()) === State.PoweredOn;
}

/** Quét; gọi onNear(poiId) khi beacon đã đăng ký ở gần ≤ nearM trong ≥ confirm lần liên tiếp. Trả hàm dừng. */
export function startBeaconScan(registry: BeaconRef[], onNear: (poiId: string, distM: number) => void, nearM = 4, confirm = 3) {
  const key = (u: string, a: number, b: number) => `${u.toLowerCase()}|${a}|${b}`;
  const map = new Map(registry.map((r) => [key(r.uuid, r.major, r.minor), r.poiId]));
  const ema = new Map<string, number>(), streak = new Map<string, number>();

  mgr().startDeviceScan(null, { allowDuplicates: true }, (err, dev) => {
    if (err || !dev) return;
    const ib = parseIBeacon(dev.manufacturerData);
    if (!ib || dev.rssi == null) return;
    const k = key(ib.uuid, ib.major, ib.minor), poiId = map.get(k);
    if (!poiId) return;
    const rssi = (ema.get(k) ?? dev.rssi) * 0.7 + dev.rssi * 0.3;     // làm mượt RSSI
    ema.set(k, rssi);
    const d = estimateDistance(rssi, ib.txPower);
    if (d <= nearM) {
      const n = (streak.get(k) ?? 0) + 1;
      streak.set(k, n);
      if (n >= confirm) { streak.set(k, 0); onNear(poiId, d); }
    } else streak.set(k, 0);
  });
  return () => mgr().stopDeviceScan();
}
