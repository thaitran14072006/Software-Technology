-- Additive, repeatable migration; never resets existing POIs or passwords.
BEGIN;
SELECT pg_advisory_xact_lock(783210);
CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS content_clock (id integer PRIMARY KEY CHECK(id=1), rev bigint NOT NULL);
INSERT INTO content_clock VALUES (1, GREATEST((SELECT COALESCE(max(rev),0) FROM pois), (SELECT CASE WHEN is_called THEN last_value ELSE 0 END FROM content_rev))) ON CONFLICT DO NOTHING;
ALTER TABLE poi_audios ADD COLUMN IF NOT EXISTS current_job_id uuid;
ALTER TABLE tts_jobs ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE tts_jobs ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE tts_jobs ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_tts_jobs_poll ON tts_jobs(status, available_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE TABLE IF NOT EXISTS location_pings (
 id uuid PRIMARY KEY, session_id uuid NOT NULL, map_id uuid NOT NULL REFERENCES maps(id),
 latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 accuracy double precision CHECK(accuracy BETWEEN 0 AND 10000), recorded_at timestamptz NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_location_map_time ON location_pings(map_id, recorded_at);
INSERT INTO schema_migrations(name) VALUES ('20261023-complete') ON CONFLICT DO NOTHING;
COMMIT;

ALTER TABLE pois ADD COLUMN IF NOT EXISTS geo_source_url TEXT;
