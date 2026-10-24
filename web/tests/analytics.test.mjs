import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DemoAnalytics } from '../demo-analytics.mjs';

const visitor = () => ({ visitorId: randomUUID(), sessionId: randomUUID(), active: true });
const event = (extra = {}) => ({ eventId: randomUUID(), visitorId: randomUUID(), poiId: 'demo-9', code: '9', name: 'Bàu Sấu', lang: 'vi', ...extra });
test('active visitors deduplicate tabs, respect leave and expire after 90 seconds', async () => {
  let now = 0; const stats = new DemoAnalytics(null, () => now);
  const a = visitor(), tab2 = { ...a, sessionId: randomUUID() }, b = visitor();
  stats.presence(a); stats.presence(tab2); stats.presence(b);
  assert.equal((await stats.summary()).activeUsers, 2);
  stats.presence({ ...a, active: false }); assert.equal((await stats.summary()).activeUsers, 2);
  stats.presence({ ...tab2, active: false }); assert.equal((await stats.summary()).activeUsers, 1);
  now = 90001; assert.equal((await stats.summary()).activeUsers, 0);
});
test('listen retries are idempotent, language counts are separate and day uses Vietnam time', async () => {
  let now = Date.parse('2026-10-22T16:59:00Z');
  const stats = new DemoAnalytics(null, () => now), a = event();
  const replies = await Promise.all([stats.listen(a), stats.listen(a)]);
  assert.deepEqual(replies.map(r => r.recorded), [true, false]);
  now = Date.parse('2026-10-22T17:01:00Z');
  await stats.listen(event({ lang: 'en' }));
  const result = await stats.summary();
  assert.equal(result.totalListens, 2); assert.equal(result.todayListens, 1);
  assert.deepEqual(result.rows.map(r => [r.lang, r.count]).sort(), [['en', 1], ['vi', 1]]);
});
test('demo listens survive restart while online presence resets', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sag-analytics-')), file = path.join(dir, 'events.json');
  try {
    const stats = new DemoAnalytics(file); stats.presence(visitor()); await stats.listen(event());
    const reloaded = await new DemoAnalytics(file).summary();
    assert.equal(reloaded.totalListens, 1); assert.equal(reloaded.activeUsers, 0);
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
});
test('malformed telemetry is rejected before storage', async () => {
  const stats = new DemoAnalytics();
  assert.throws(() => stats.presence({ ...visitor(), visitorId: 'invalid' }), /không hợp lệ/);
  assert.throws(() => stats.listen(event({ lang: 'xx' })), /không hợp lệ/);
  assert.equal((await stats.summary()).totalListens, 0);
});
