import { create } from 'zustand';
import type { Poi } from '../services/api/poi.api';

export interface RouteInfo {
  coords: [number, number][];          // [lng, lat] — lộ trình Mapbox (chế độ bản đồ ngoài trời)
  raw?: [number, number][];            // tọa độ "raw" — đường tự vẽ trên sơ đồ
  distanceM: number; durationS: number; approximate: boolean;
}
export type FilterKey = 'r' | 'q' | 't' | 'w' | 'p';

interface MapState {
  selected: Poi | null; route: RouteInfo | null; mode: 'outdoor' | 'schematic';
  off: Record<FilterKey, boolean>;
  select: (p: Poi | null) => void; setRoute: (r: RouteInfo | null) => void;
  setMode: (m: 'outdoor' | 'schematic') => void; toggle: (k: FilterKey) => void;
}
export const useMapStore = create<MapState>((set) => ({
  selected: null, route: null, mode: 'schematic',          // UI gốc: sơ đồ SVG là mặc định, bản đồ OSM/Mapbox chỉ là nút bật tắt
  off: { r: false, q: false, t: false, w: false, p: false },
  select: (selected) => set({ selected, route: null }),
  setRoute: (route) => set({ route }),
  setMode: (mode) => set({ mode }),
  toggle: (k) => set((s) => ({ off: { ...s.off, [k]: !s.off[k] } })),
}));
