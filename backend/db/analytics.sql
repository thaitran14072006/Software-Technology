-- Idempotent migration: safe for existing demo databases.
CREATE TABLE IF NOT EXISTS web_presence (
  session_id UUID PRIMARY KEY,
  visitor_id UUID NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_web_presence_recent ON web_presence (last_seen_at) WHERE is_active;

CREATE TABLE IF NOT EXISTS audio_listen_events (
  id UUID PRIMARY KEY,
  visitor_id UUID NOT NULL,
  poi_id UUID NOT NULL REFERENCES pois(id),
  lang_code VARCHAR(5) NOT NULL REFERENCES languages(code),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audio_listens_poi_lang ON audio_listen_events (poi_id, lang_code);
CREATE INDEX IF NOT EXISTS idx_audio_listens_started ON audio_listen_events (started_at);
