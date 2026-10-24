# Repository handoff — 2026-10-24

The source system is organized at repository root into `backend/`, `web/`, `mobile/`, `scripts/` and `docs/`. All commit messages for this handoff are in English.

## Commit order

1. Repository defaults and root project scripts.
2. PostgreSQL schema, migrations and NestJS backend services.
3. Multilingual web guide, Leaflet/OpenStreetMap, QR and offline playback.
4. Shared POI content, verified Google MP3s and collaborative narration tooling.
5. Expo mobile application and persistent Android compatibility fixes.
6. Team setup, use cases, diagrams and validation notes.

## Shared data and credentials

The fixture snapshot exported at 14:07 Vietnam time contains 17 POIs, 85 translations and 16 matching Google AI Studio MP3s. It still lacks 69 Google narrations. The original worker may continue generating additional recordings; those later files require another reviewed export and commit.

Each member initializes a local database from the same public fixture, uses their own local admin credentials and keeps their AI Studio key in `backend/.env`. No private database dump, user accounts, refresh tokens, visitor history, API keys, signing keys or runtime backups are included. Generated dependencies, build products and Android/iOS projects are excluded and recreated locally.

`TTS_LANGUAGES` restricts the worker to assigned languages. `audio:gemini` also accepts `--langs` and `--codes`. The exporter preserves previously shared matching recordings, and the importer adds matching new audio to existing content while preserving local text and valid Google/uploaded recordings. See [collaborative audio](COLLABORATIVE_AUDIO.md) before dividing work.

## Validation

- Web: 35 tests passed.
- Backend: all three services built; 17 tests passed across six suites.
- Mobile: 15 tests passed across three suites; TypeScript and five-language Intl.PluralRules checks passed.
- Isolated PostgreSQL installation test: fresh content/audio import, repeatability, preservation of edits, incremental audio import and rejection of a changed transcript passed. No cloud request is needed for this test.
- Public fixture MP3 sizes and SHA-256 hashes verified during import/export.
- Source text and document/archive contents checked for the private credentials currently configured on the author's machine before copying to the repository.

Initial sandbox runs could not access local test HTTP sockets or rename Jest cache files. The affected suites were rerun with normal local permissions and passed; no product-code workaround was introduced for the sandbox.

Android debug startup on an x86_64 emulator was verified before this handoff. A new release APK, physical-phone compatibility, field GPS/BLE behavior and all 85 Google recordings are not yet verified/complete. Git synchronization does not itself deploy a shared backend or live database.

Start with [team setup](TEAM_SETUP.md). Existing collaborators use `git pull --ff-only`, refresh dependencies when lockfiles change, stop the app and run `npm run content:seed` to import matching new audio, then restart the app. Rebuild/download offline packs after audio changes.
