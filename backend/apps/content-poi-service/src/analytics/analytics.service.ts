import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ListenDto, PresenceDto } from './analytics.controller';

@Injectable()
export class AnalyticsService {
  constructor(private readonly ds: DataSource) {}
  async presence(dto: PresenceDto) {
    await this.ds.query("INSERT INTO visitor_sessions(id,platform) VALUES($1,'web') ON CONFLICT(id) DO UPDATE SET last_seen_at=now()",[dto.sessionId]);
    await this.ds.query(`INSERT INTO web_presence(session_id, visitor_id, is_active, last_seen_at)
      VALUES ($1, $2, $3, now()) ON CONFLICT (session_id)
      DO UPDATE SET visitor_id = EXCLUDED.visitor_id, is_active = EXCLUDED.is_active, last_seen_at = now()`, [dto.sessionId, dto.visitorId, dto.active]);
    await this.ds.query(`DELETE FROM web_presence WHERE last_seen_at < now() - interval '1 day'`);
    return { ok: true };
  }
  async listen(dto: ListenDto) {
    // Check publication and language server-side; failed playback is never posted by the client.
    const rows = await this.ds.query(`INSERT INTO audio_listen_events(id, visitor_id, poi_id, lang_code)
      SELECT $1, $2, p.id, t.lang_code FROM pois p
      JOIN poi_translations t ON t.poi_id = p.id AND t.lang_code = $4
      WHERE p.id = $3 AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
      ON CONFLICT (id) DO NOTHING RETURNING id`, [dto.eventId, dto.visitorId, dto.poiId, dto.lang]);
    if (!rows.length) {
      const prior = await this.ds.query('SELECT id FROM audio_listen_events WHERE id = $1', [dto.eventId]);
      if (!prior.length) throw new NotFoundException('Không tìm thấy bản thuyết minh đã xuất bản.');
    }
    return { recorded: rows.length > 0 };
  }
  async summary() {
    // One database snapshot keeps totals and per-narration counts consistent during concurrent playback.
    return this.ds.transaction('REPEATABLE READ', async manager => {
      const [presence] = await manager.query(`SELECT count(DISTINCT visitor_id)::int AS count FROM web_presence
        WHERE is_active AND last_seen_at >= now() - interval '90 seconds'`);
      const [totals] = await manager.query(`SELECT count(*)::int AS total,
        count(*) FILTER (WHERE started_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS today
        FROM audio_listen_events`);
      const rows = await manager.query(`SELECT p.id AS "poiId", p.code, e.lang_code AS lang, count(*)::int AS count,
        COALESCE((SELECT name FROM poi_translations WHERE poi_id = p.id AND lang_code = e.lang_code), p.code) AS name
        FROM audio_listen_events e JOIN pois p ON p.id = e.poi_id
        GROUP BY p.id, p.code, e.lang_code ORDER BY count(*) DESC, p.code, e.lang_code`);
      return { activeUsers: presence.count, activeWindowSeconds: 90, totalListens: totals.total, todayListens: totals.today, rows, updatedAt: new Date().toISOString() };
    });
  }
}
