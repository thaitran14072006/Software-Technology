import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GeofenceEngine } from '../utils/geofence';
import { useLocationStore } from '../store/locationStore';
import { usePlayback } from '../store/playbackStore';
import { useMapStore } from '../store/mapStore';
import { useToast } from '../store/toastStore';
import { BeaconRef, ensureBlePermission, startBeaconScan } from '../services/ble/beaconScanner';
import { loadExtras } from '../services/offline/offlineStore';
import { env } from '../config/env';
import {runtimeConfig} from '../services/api/runtimeConfig';
import {AppState} from 'react-native';
import type { Poi } from '../services/api/poi.api';
import type { AudioApi } from './useAudioPlayer';

const DEFAULT_RADIUS = 10;                     // PRD: 10 m (app_configs.default_trigger_radius_m)
const GPS_STALE_MS = 10_000, GPS_WEAK_ACC = 30, QR_HINT_AFTER_MS = 20_000;

let beaconCache: BeaconRef[] | null = null;
async function fetchBeacons(): Promise<BeaconRef[]> {
  if (beaconCache) return beaconCache;
  try {
    const r = await fetch(`${env.QR_API_BASE}/beacons`, { signal: AbortSignal.timeout(8000) });
    beaconCache = await r.json();
  } catch { return loadExtras()?.beacons ?? []; }   // mất mạng: dùng bảng đã tải (không cache lỗi)
  return beaconCache!;
}

/** UC3: GPS (geofence) -> BLE khi GPS yếu -> gợi ý quét QR (UC4). */
export function useAutoPlay(pois: Poi[], audio: AudioApi, user: { active: boolean }) {
  const { t } = useTranslation();
  const toast = useToast((s) => s.show);
  const select = useMapStore((s) => s.select);
  const { auto, canAutoPlay } = usePlayback();
  const coords = useLocationStore((s) => s.coords);
  const lastFixAt = useLocationStore((s) => s.lastFixAt);
  const engine = useRef(new GeofenceEngine()).current;

  // ref để các vòng lặp/interval luôn thấy giá trị mới nhất (tránh closure cũ)
  const live = useRef({ pois, canAutoPlay, select, toast, t, audio });
  live.current = { pois, canAutoPlay, select, toast, t, audio };
  const lastFixAtRef = useRef(lastFixAt);
  lastFixAtRef.current = lastFixAt;

  // Chỉ POI đã xác thực tọa độ mới được auto-play bằng GPS
  const geoPois = useMemo(
    () => pois.filter((p) => p.geoVerified).map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, radiusM: p.triggerRadiusM ?? runtimeConfig().default_trigger_radius_m })),
    [pois],
  );

  const trigger = (poiId: string) => {
    const { pois, canAutoPlay, select, toast, t, audio } = live.current;
    const poi = pois.find((p) => p.id === poiId);
    if (!poi) return;
    if (!canAutoPlay(poi.id,runtimeConfig().replay_audio_cooldown_min) || (audio.isPlaying && audio.playingId !== poi.id)) {
      select(poi); toast(`${t('map.near')} ${poi.code}. ${poi.name}`, 4000);
      return;
    }
    select(poi); audio.play(poi);
  };

  // GPS
  useEffect(() => {
    if (!auto || !coords || !user.active || AppState.currentState!=='active') return;
    const ev = engine.update(coords, geoPois);
    if (ev[0]) trigger(ev[0].poi.id);
  }, [coords, auto, user.active, geoPois]);

  // GPS yếu -> BLE (UC3-E1); không có BLE -> gợi ý quét QR (UC4)
  const weakSince = useRef<number | null>(null), hinted = useRef(0);
  useEffect(() => {
    if (!auto || !user.active) return;
    let stopScan: (() => void) | null = null, cancelled = false;
    const tick = setInterval(async () => {
      const acc = useLocationStore.getState().coords?.accuracy ?? 0;
      const weak = Date.now() - lastFixAtRef.current > GPS_STALE_MS || acc > GPS_WEAK_ACC;
      if (weak && !stopScan) {
        weakSince.current ??= Date.now();
        const reg = await fetchBeacons();
        if (reg.length && (await ensureBlePermission()) && !cancelled && !stopScan) stopScan = startBeaconScan(reg, (id) => trigger(id));
      } else if (!weak && stopScan) { stopScan(); stopScan = null; weakSince.current = null; }
      if (weak && !stopScan && weakSince.current && Date.now() - weakSince.current > QR_HINT_AFTER_MS && Date.now() - hinted.current > 120_000) {
        hinted.current = Date.now();
        live.current.toast(live.current.t('map.scanQr'), 5000);       // gợi ý dùng nút ▦
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(tick); stopScan?.(); };
  }, [auto, user.active]);   // eslint-disable-line react-hooks/exhaustive-deps
}
