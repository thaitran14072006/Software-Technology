import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const langs = ['vi', 'en', 'ja', 'ko', 'zh'];
const day = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
function requireValue(ok) { if (!ok) throw Object.assign(new Error('Dữ liệu thống kê không hợp lệ.'), { status: 400 }); }
export class DemoAnalytics {
  constructor(file = null, clock = () => Date.now()) {
    this.file = file; this.clock = clock; this.events = []; this.sessions = new Map(); this.queue = Promise.resolve();
    this.ready = file ? readFile(file, 'utf8').then(text => { this.events = JSON.parse(text); if (!Array.isArray(this.events)) throw new Error('Invalid analytics file'); }).catch(error => { if (error.code !== 'ENOENT') this.loadError = Object.assign(new Error('Không đọc được thống kê demo đã lưu.'), { status: 503 }); }) : Promise.resolve();
  }
  presence(dto) {
    requireValue(UUID.test(dto.visitorId) && UUID.test(dto.sessionId) && typeof dto.active === 'boolean');
    const now = this.clock();
    for (const [id, session] of this.sessions) if (now - session.lastSeen > 90000) this.sessions.delete(id);
    this.sessions.set(dto.sessionId, { visitorId: dto.visitorId, active: dto.active, lastSeen: now });
    return { ok: true };
  }
  listen(dto) {
    requireValue(UUID.test(dto.visitorId) && UUID.test(dto.eventId) && typeof dto.poiId === 'string' && /^(demo-\d{1,3}|[0-9a-f-]{36})$/i.test(dto.poiId) && typeof dto.code === 'string' && /^[A-Za-z0-9_-]{1,20}$/.test(dto.code) && typeof dto.name === 'string' && dto.name.length > 0 && dto.name.length <= 200 && langs.includes(dto.lang));
    const operation = this.queue.catch(() => {}).then(async () => {
      await this.ready;
      if (this.loadError) throw this.loadError;
      if (this.events.some(e => e.eventId === dto.eventId)) return { recorded: false };
      const next = [...this.events, { eventId: dto.eventId, poiId: dto.poiId, code: dto.code, name: dto.name, lang: dto.lang, startedAt: this.clock() }];
      if (this.file) {
        await mkdir(path.dirname(this.file), { recursive: true });
        await writeFile(`${this.file}.tmp`, JSON.stringify(next));
        await rename(`${this.file}.tmp`, this.file);
      }
      this.events = next;
      return { recorded: true };
    });
    this.queue = operation;
    return operation;
  }
  async summary() {
    await this.ready; await this.queue.catch(() => {});
    if (this.loadError) throw this.loadError;
    const now = this.clock(), rows = new Map();
    for (const event of this.events) {
      const key = `${event.poiId}:${event.lang}`;
      if (!rows.has(key)) rows.set(key, { poiId: event.poiId, code: event.code, name: event.name, lang: event.lang, count: 0 });
      rows.get(key).count++;
    }
    return {
      activeUsers: new Set([...this.sessions.values()].filter(s => s.active && now - s.lastSeen <= 90000).map(s => s.visitorId)).size,
      activeWindowSeconds: 90, totalListens: this.events.length, todayListens: this.events.filter(e => day(new Date(e.startedAt)) === day(new Date(now))).length,
      rows: [...rows.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code, undefined, { numeric: true })), updatedAt: new Date(now).toISOString(),
    };
  }
}
