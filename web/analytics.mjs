import { api } from './store.mjs';
import { newId } from './core.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function visitorId() {
  let id = localStorage.getItem('sag:visitor-id');
  if (!UUID.test(id || '')) { id = newId(); localStorage.setItem('sag:visitor-id', id); }
  return id;
}
async function post(route, payload, keepalive = false) {
  const response = await fetch(`/content-api/analytics/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive, ...(keepalive ? {} : { signal: AbortSignal.timeout(8000) }) });
  if (!response.ok) throw Object.assign(new Error(`Không đồng bộ được thống kê: HTTP ${response.status}`), { status: response.status });
}
export class VisitorAnalytics {
  constructor() { this.id = visitorId(); this.sessionId = newId(); this.flushing = null; }
  async presence(active, keepalive = false) {
    try { await post('presence', { visitorId: this.id, sessionId: this.sessionId, active }, keepalive); } catch {}
  }
  record(poi) {
    const event = { eventId: newId(), visitorId: this.id, poiId: poi.id, lang: poi.lang };
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
    const keys = Object.keys(localStorage).filter(key => key.startsWith('sag:listen-event:'));
    for (const key of keys) {
      const event = JSON.parse(localStorage.getItem(key) || 'null');
      if (!event) continue;
      const { mode, eventId, visitorId, poiId, lang } = event;
      if (mode && mode !== 'api') {
        localStorage.removeItem(key);
        continue;
      }
      try {
        await post('listens', { eventId, visitorId, poiId, lang });
        localStorage.removeItem(key);
      } catch (error) {
        if (![400, 404, 410, 422].includes(error.status)) break;
        localStorage.removeItem(key);
      }
    }
  }
}
export function playbackCounter(record) {
  let current;
  return {
    begin(poi) { const session = current = { counted: false }; return () => { if (current !== session || session.counted) return; session.counted = true; record(poi); }; },
    cancel() { current = null; },
  };
}
export const getAnalytics = () => api('admin/analytics');
