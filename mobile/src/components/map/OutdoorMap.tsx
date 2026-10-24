import * as MapLibre from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { env } from '../../config/env';
import { colors } from '../../theme/colors';
import type { Poi } from '../../services/api/poi.api';
import type { Coords } from '../../store/locationStore';
import type { RouteInfo } from '../../store/mapStore';

export interface OutdoorMapHandle { zoom: (d: number) => void; flyTo: (lat: number, lng: number, z?: number) => void; home: () => void; fit: (r: RouteInfo) => void; }
interface Props { pois: Poi[]; selectedId: string | null; user: Coords | null; route: RouteInfo | null; onSelect: (id: string) => void; onClearSelect: () => void; }

/** Bản đồ ngoài trời (Mapbox). Chỉ hiển thị POI đã xác thực tọa độ GPS (geoVerified). */
const OutdoorMap = forwardRef<OutdoorMapHandle, Props>(({ pois, selectedId, user, route, onSelect, onClearSelect }, ref) => {
  const cam = useRef<MapLibre.CameraRef>(null);
  const zoomRef = useRef(15);
  const center: [number, number] = [env.ORIGIN.lng, env.ORIGIN.lat];

  useImperativeHandle(ref, () => ({
    zoom: (d) => { zoomRef.current = Math.min(20, Math.max(8, zoomRef.current + d)); cam.current?.setCamera({ zoomLevel: zoomRef.current, animationDuration: 250 }); },
    flyTo: (lat, lng, z = 17) => { zoomRef.current = z; cam.current?.setCamera({ centerCoordinate: [lng, lat], zoomLevel: z, animationDuration: 600 }); },
    home: () => { zoomRef.current = 15; cam.current?.setCamera({ centerCoordinate: center, zoomLevel: 15, heading: 0, animationDuration: 600 }); },
    fit: (r) => {
      if (!r.coords.length) return;
      const lngs = r.coords.map((c) => c[0]), lats = r.coords.map((c) => c[1]);
      cam.current?.fitBounds([Math.max(...lngs), Math.max(...lats)], [Math.min(...lngs), Math.min(...lats)], [60, 60, 60, 60], 700);
    },
  }));

  const poiShape = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: pois.map((p) => ({ type: 'Feature' as const, id: p.id, properties: { id: p.id, code: p.code }, geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] } })),
  }), [pois]);
  const userShape = useMemo(() => (user ? ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: [user.lng, user.lat] } }) : null), [user]);
  const routeShape = useMemo(() => (route?.coords.length ? ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: route.coords } }) : null), [route]);
  const sel = selectedId ?? '';

  return (
    <MapLibre.MapView style={StyleSheet.absoluteFill} mapStyle={env.MAP_STYLE}
      onPress={onClearSelect} logoEnabled={false} attributionPosition={{ bottom: 8, left: 8 }} compassEnabled={false}>
      <MapLibre.Camera ref={cam} defaultSettings={{ centerCoordinate: center, zoomLevel: 15 }} />

      {routeShape && (
        <MapLibre.ShapeSource id="route" shape={routeShape}>
          <MapLibre.LineLayer id="route-line" style={{ lineColor: colors.accent, lineWidth: 5, lineCap: 'round', lineJoin: 'round', ...(route?.approximate ? { lineDasharray: [2, 2] } : {}) }} />
        </MapLibre.ShapeSource>
      )}

      <MapLibre.ShapeSource id="pois" shape={poiShape} onPress={(e: any) => { const id = e.features?.[0]?.properties?.id; if (id) onSelect(id); }}>
        <MapLibre.CircleLayer id="poi-circle" style={{
          circleRadius: ['case', ['==', ['get', 'id'], sel], 16, 13],
          circleColor: ['case', ['==', ['get', 'id'], sel], colors.accent, colors.nodeText],
          circleStrokeColor: colors.accent, circleStrokeWidth: 2,
        }} />
        <MapLibre.SymbolLayer id="poi-label" style={{
          textField: ['get', 'code'], textSize: 12, textAllowOverlap: true, textIgnorePlacement: true,
          textColor: ['case', ['==', ['get', 'id'], sel], '#fff', colors.node],
        }} />
      </MapLibre.ShapeSource>

      {userShape && (
        <MapLibre.ShapeSource id="me" shape={userShape}>
          <MapLibre.CircleLayer id="me-halo" style={{ circleRadius: 18, circleColor: colors.me, circleOpacity: 0.25 }} />
          <MapLibre.CircleLayer id="me-dot" style={{ circleRadius: 8, circleColor: colors.me, circleStrokeColor: '#fff', circleStrokeWidth: 3 }} />
        </MapLibre.ShapeSource>
      )}
    </MapLibre.MapView>
  );
});
export default OutdoorMap;
