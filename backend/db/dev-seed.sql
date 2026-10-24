-- Local demo identity used by scripts/dev-token.js. No password login is enabled.
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('00000000-0000-0000-0000-0000000000aa', 'demo-admin@localhost.invalid', 'DISABLED_DEV_TOKEN_ONLY', 'Local demo administrator', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO poi_qr_codes (kind, poi_id, token)
SELECT 'POI', id, 'demo-bausau-001' FROM pois WHERE code = '9' AND deleted_at IS NULL
ON CONFLICT (token) DO NOTHING;
