-- Smart Audio Guide — PostgreSQL schema (Bước 1 + vá Bước 2/FR9: content_rev, pois.rev, pois.geo_verified)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== ENUMS ==========
CREATE TYPE user_role      AS ENUM ('ADMIN', 'EDITOR');
CREATE TYPE map_type       AS ENUM ('OUTDOOR', 'INDOOR');
CREATE TYPE audio_source   AS ENUM ('TTS', 'UPLOAD');
CREATE TYPE audio_status   AS ENUM ('PENDING', 'READY', 'FAILED');
CREATE TYPE voice_gender   AS ENUM ('MALE', 'FEMALE');
CREATE TYPE poi_status     AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE qr_kind        AS ENUM ('GATE', 'POI');
CREATE TYPE tts_job_status AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED');

-- Bộ đếm toàn cục cho đồng bộ delta (FR9). Mỗi thay đổi nội dung/audio của POI lấy một số mới.
CREATE SEQUENCE content_rev START 1;

-- ========== LANGUAGES ==========
CREATE TABLE languages (
  code        VARCHAR(5) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  tts_locale  VARCHAR(10) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

-- ========== USERS (chỉ Admin/Editor) ==========
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  role           user_role NOT NULL DEFAULT 'EDITOR',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ========== VISITOR (ẩn danh) ==========
CREATE TABLE visitor_sessions (
  id            UUID PRIMARY KEY,
  lang_code     VARCHAR(5) REFERENCES languages(code),
  platform      VARCHAR(20),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== MAPS ==========
CREATE TABLE maps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  type            map_type NOT NULL,
  center_lat      DOUBLE PRECISION,
  center_lng      DOUBLE PRECISION,
  default_zoom    SMALLINT DEFAULT 15,
  style_url       TEXT,
  meters_per_unit NUMERIC(8,3),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE map_floors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id      UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  level       SMALLINT NOT NULL,
  label       VARCHAR(50),
  image_url   TEXT,
  bounds      JSONB,
  UNIQUE (map_id, level)
);

-- ========== POI ==========
CREATE TABLE poi_categories (
  id    SMALLINT PRIMARY KEY,
  code  VARCHAR(30) UNIQUE NOT NULL,
  icon  VARCHAR(50)
);

CREATE TABLE pois (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(20) UNIQUE NOT NULL,     -- số thứ tự node trên sơ đồ ('1'..'15')
  map_id           UUID NOT NULL REFERENCES maps(id),
  floor_id         UUID REFERENCES map_floors(id),
  category_id      SMALLINT REFERENCES poi_categories(id),
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  geo_verified     BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE khi tọa độ đã khảo sát thực địa (chỉ khi đó mới auto-play bằng GPS)
  schematic_x      NUMERIC(10,2),                   -- tọa độ "raw" trên sơ đồ (world = raw*1.6 + (35,40))
  schematic_y      NUMERIC(10,2),
  trigger_radius_m SMALLINT,
  image_url        TEXT,
  status           poi_status NOT NULL DEFAULT 'DRAFT',
  sort_order       SMALLINT NOT NULL DEFAULT 0,
  version          INTEGER NOT NULL DEFAULT 1,
  rev              BIGINT NOT NULL DEFAULT 0,       -- giá trị content_rev tại lần đổi cuối (nội dung, audio, xóa)
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_pois_map_status ON pois(map_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pois_map_rev ON pois(map_id, rev);

CREATE TABLE poi_translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id      UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  lang_code   VARCHAR(5) NOT NULL REFERENCES languages(code),
  name        VARCHAR(200) NOT NULL,
  summary     VARCHAR(500),
  script_text TEXT NOT NULL,
  text_hash   CHAR(64) NOT NULL,
  UNIQUE (poi_id, lang_code)
);

CREATE TABLE poi_audios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id  UUID NOT NULL REFERENCES poi_translations(id) ON DELETE CASCADE,
  poi_id          UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  lang_code       VARCHAR(5) NOT NULL REFERENCES languages(code),
  voice_gender    voice_gender NOT NULL DEFAULT 'FEMALE',
  source          audio_source NOT NULL DEFAULT 'TTS',
  status          audio_status NOT NULL DEFAULT 'PENDING',
  provider        VARCHAR(20),
  voice_name      VARCHAR(60),
  audio_url       TEXT,
  duration_sec    NUMERIC(7,2),
  size_bytes      INTEGER,
  text_hash       CHAR(64),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (translation_id, voice_gender)
);

CREATE TABLE tts_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id      UUID NOT NULL REFERENCES poi_audios(id) ON DELETE CASCADE,
  status        tts_job_status NOT NULL DEFAULT 'QUEUED',
  attempts      SMALLINT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

-- ========== QR & BLE (FALLBACK) ==========
CREATE TABLE poi_qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        qr_kind NOT NULL,
  poi_id      UUID REFERENCES pois(id) ON DELETE CASCADE,
  token       VARCHAR(64) UNIQUE NOT NULL,
  target_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'POI' AND poi_id IS NOT NULL) OR kind = 'GATE')
);

CREATE TABLE ble_beacons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id      UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  uuid        UUID NOT NULL,
  major       INTEGER NOT NULL,
  minor       INTEGER NOT NULL,
  tx_power    SMALLINT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (uuid, major, minor)
);

-- ========== CONFIG & AUDIT ==========
CREATE TABLE app_configs (
  key         VARCHAR(80) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(40) NOT NULL,
  entity      VARCHAR(40) NOT NULL,
  entity_id   VARCHAR(64),
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== SEED ==========
INSERT INTO languages (code, name, tts_locale, sort_order) VALUES
  ('vi', 'Tiếng Việt', 'vi-VN', 1), ('en', 'English', 'en-US', 2),
  ('ja', '日本語', 'ja-JP', 3), ('zh', '中文', 'cmn-CN', 4), ('ko', '한국어', 'ko-KR', 5);

-- Hợp đồng với app: 1 = facility (p), 2 = tree (t), 3 = water (w)
INSERT INTO poi_categories (id, code) VALUES (1, 'facility'), (2, 'tree'), (3, 'water');

-- Bản đồ mặc định (MAP_ID cố định để app/seed dùng ngay)
INSERT INTO maps (id, name, type, center_lat, center_lng, default_zoom, meters_per_unit)
VALUES ('00000000-0000-0000-0000-000000000001', 'Vườn quốc gia Nam Cát Tiên', 'OUTDOOR', 11.423368, 107.422042, 15, 2.5);

INSERT INTO app_configs (key, value, description) VALUES
  ('default_trigger_radius_m', '10', 'Bán kính auto-play mặc định (PRD: 10m)'),
  ('replay_audio_cooldown_min', '30', 'Không tự phát lại cùng POI trong N phút'),
  ('tts_provider', '"GOOGLE"', NULL),
  ('default_lang', '"vi"', NULL),
  ('park_hours', '{"open":"08:00","close":"16:00"}', NULL);
