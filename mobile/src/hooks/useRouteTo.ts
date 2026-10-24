import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findRoute } from '../services/routing/trailGraph';
import { getWalkingRoute } from '../services/api/directions';
import { gpsToRaw, Pt } from '../utils/projection';
import { useMapStore } from '../store/mapStore';
import { useToast } from '../store/toastStore';
import type { Poi } from '../services/api/poi.api';
import type { useUserLocation } from './useUserLocation';

/** UC2 bước 5-7: ưu tiên đường tự vẽ (chạy offline, khoảng cách đã hiệu chỉnh), dự phòng Mapbox cho điểm đã có tọa độ thật. */
export function useRouteTo(user: ReturnType<typeof useUserLocation>) {
  const { t } = useTranslation();
  const setRoute = useMapStore((s) => s.setRoute);
  const toast = useToast((s) => s.show);
  const [routing, setRouting] = useState(false);

  const navigate = useCallback(async (poi: Poi) => {
    if (!poi.schematic && !poi.geoVerified) return;
    setRouting(true);
    try {
      let here = user.coords;
      if (!here) {                                   // chưa có vị trí: bật GPS; nếu không được -> UC2-E1, không vẽ đường
        const ok = await user.start();
        if (!ok) return;
        here = await user.waitFirstFix(8000);
        if (!here) { toast(t('errors.noLocation'), 5000); return; }
      }
      if (poi.schematic) {
        const r = findRoute(gpsToRaw(here.lat, here.lng), poi.schematic as Pt);
        if (r) { setRoute({ coords: [], raw: r.points, distanceM: r.lengthM, durationS: r.durationS, approximate: true }); return; }
      }
      if (poi.geoVerified) setRoute(await getWalkingRoute(here, poi));
      else toast(t('errors.noLocation'), 5000);
    } finally { setRouting(false); }
  }, [user, setRoute, toast, t]);

  return { navigate, routing };
}
