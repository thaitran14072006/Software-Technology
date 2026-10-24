import { haversine } from './haversine';

export interface GeoPoi { id: string; lat: number; lng: number; radiusM: number; }
export interface Fix { lat: number; lng: number; accuracy?: number | null; }
export interface GeoEvent { poi: GeoPoi; distanceM: number; }

export interface GeofenceOptions {
  maxAccuracyM: number;   // bỏ fix kém hơn mức này
  confirmFixes: number;   // số fix liên tiếp trong bán kính mới kích hoạt (chống nhiễu)
  exitFactor: number;     // phải ra xa radius * exitFactor mới được kích hoạt lại (chống nhấp nháy)
}
export const DEFAULT_GEOFENCE: GeofenceOptions = { maxAccuracyM: 20, confirmFixes: 2, exitFactor: 1.6 };

export class GeofenceEngine {
  private streak = new Map<string, number>();
  private active = new Set<string>();
  constructor(private o: GeofenceOptions = DEFAULT_GEOFENCE) {}

  /** Trả danh sách POI vừa "bước vào", gần nhất trước. */
  update(fix: Fix, pois: GeoPoi[]): GeoEvent[] {
    if (fix.accuracy != null && fix.accuracy > this.o.maxAccuracyM) return [];
    const out: GeoEvent[] = [];
    for (const p of pois) {
      const d = haversine(fix, p);
      if (this.active.has(p.id)) {
        if (d > p.radiusM * this.o.exitFactor) { this.active.delete(p.id); this.streak.delete(p.id); }
        continue;
      }
      if (d <= p.radiusM) {
        const n = (this.streak.get(p.id) ?? 0) + 1;
        this.streak.set(p.id, n);
        if (n >= this.o.confirmFixes) { this.active.add(p.id); out.push({ poi: p, distanceM: d }); }
      } else this.streak.delete(p.id);
    }
    return out.sort((a, b) => a.distanceM - b.distanceM);
  }
  reset() { this.streak.clear(); this.active.clear(); }
}
