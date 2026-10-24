import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { startBackground, stopBackground } from '../services/location/backgroundTask';
import { Coords, useLocationStore } from '../store/locationStore';
import { useToast } from '../store/toastStore';

export type LocStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

export function useUserLocation() {
  const { t } = useTranslation();
  const toast = useToast((s) => s.show);
  const coords = useLocationStore((s) => s.coords);
  const [status, setStatus] = useState<LocStatus>('idle');
  const sub = useRef<Location.LocationSubscription | null>(null);

  const stop = useCallback(async () => {
    sub.current?.remove(); sub.current = null;
    await stopBackground().catch(() => undefined);
    useLocationStore.getState().clear(); useLocationStore.getState().setBackground(false);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setStatus('locating');
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') { setStatus('denied'); toast(t('errors.denied'), 5000); return false; }
    if (!(await Location.hasServicesEnabledAsync())) { setStatus('unavailable'); toast(t('errors.noLocation'), 5000); return false; }
    try {
      const bgOk = await startBackground().catch(() => false);
      useLocationStore.getState().setBackground(bgOk);
      if (!bgOk) {   // không có quyền nền: vẫn chạy khi app đang mở
        sub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
          (p) => useLocationStore.getState().setFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        );
      }
      setStatus('granted');
      return true;
    } catch { setStatus('unavailable'); toast(t('errors.noLocation'), 5000); return false; }
  }, [t, toast]);

  const waitFirstFix = useCallback((ms: number) => new Promise<Coords | null>((resolve) => {
    const now = useLocationStore.getState().coords;
    if (now) return resolve(now);
    let tm: ReturnType<typeof setTimeout>;
    const off = useLocationStore.subscribe((s) => { if (s.coords) { off(); clearTimeout(tm); resolve(s.coords); } });
    tm = setTimeout(() => { off(); resolve(null); }, ms);
  }), []);

  useEffect(() => () => { sub.current?.remove(); }, []);
  return { coords, status, start, stop, waitFirstFix, active: status === 'granted' || status === 'locating' };
}
