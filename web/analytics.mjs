import { settings, api } from './store.mjs';
import { newId } from './core.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function visitorId() {
  let id = localStorage.getItem('sag:visitor-id');
  if (!UUID.test(id || '')) { id = newId(); localStorage.setItem('sag:visitor-id', id); }
  return id;
}
const endpoint = mode => mode === 'api' ? '/content-api/analytics' : '/demo-api/analytics';
async function post(mode, route, payload, keepalive = false) {
  const response = await fetch(`${endpoint(mode)}/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive, ...(keepalive ? {} : { signal: AbortSignal.timeout(8000) }) });
  if (!response.ok) throw Object.assign(new Error(`Không đồng bộ được thống kê: HTTP ${response.status}`), { status: response.status });
}
export class VisitorAnalytics {
  constructor() { this.id = visitorId(); this.sessionId = newId(); this.mode = settings.mode; this.flushing = null; }
  async presence(active, keepalive = false) {
    try { await post(this.mode, 'presence', { visitorId: this.id, sessionId: this.sessionId, active }, keepalive); } catch {}
  }
  changeMode() { this.presence(false, true); this.mode = settings.mode; }
  record(poi, mode) {
    const event = { mode, eventId: newId(), visitorId: this.id, poiId: poi.id, code: poi.code, name: poi.name, lang: poi.lang };
    // A key per event avoids overwriting another tab's outbox during concurrent playback.
    localStorage.setItem(`sag:listen-event:${event.eventId}`, JSON.stringify(event));
    this.flush();
  }
  flush() {
    if (this.flushing) return this.flushing;
    this.flushing = this.flushPending().finally(() => { this.flushing = null; });
    return this.flushing;
  }
  async flushPending() {
      // Pending events are keyed by eventId. Retries and audio fallback cannot duplicate counts.
      const failedModes = new Set();
      const keys = Object.keys(localStorage).filter(key => key.startsWith('sag:listen-event:'));
      for (const key of keys) {
        const event = JSON.parse(localStorage.getItem(key) || 'null');
        if (!event || failedModes.has(event.mode)) continue;
        const { mode, code, name, ...payload } = event;
        try {
          await post(mode, 'listens', mode === 'api' ? payload : { ...payload, code, name });
          localStorage.removeItem(key);
        } catch (error) {
          if ([400, 404, 410, 422].includes(error.status)) localStorage.removeItem(key);
          else failedModes.add(mode);
        }
      }
  }
}
export function playbackCounter(record) {
  let current;
  return {
    begin(poi, mode) { const session = current = { counted: false }; return () => { if (current !== session || session.counted) return; session.counted = true; record(poi, mode); }; },
    cancel() { current = null; },
  };
}
export async function getAnalytics() {
  if (settings.mode === 'api') return api('admin/analytics');
  const response = await fetch('/demo-api/analytics', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) throw new Error('Không tải được thống kê demo. Cần máy chủ web đang chạy.');
  return response.json();
}
