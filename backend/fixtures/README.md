# Shared demo content

`content.json` contains 17 published POIs and 85 translations exported from the development system on 2026-10-24. The `audio/` directory contains 12 matching Google AI Studio MP3s. Each file is checked against its size and SHA-256 before import. The remaining 69 recordings are unavailable; no device voice is substituted in Gemini mode.

Startup imports missing POI codes and copies their audio to local storage. For existing POIs, it also adds missing Google audio only when the current transcript hash matches. Repeated startup preserves existing text, valid Google/uploaded audio, collaborator edits and soft-deleted POIs. It does not import users, passwords, keys, tokens, visitor data, analytics or the original job queue. QR tokens and the admin account are generated locally. The import does not contact Google.

With local infrastructure running, `npm run test:shared-content` verifies installation and repeatability in a separate temporary database. It does not reset the main application database.

To share newly generated recordings later, stop content edits temporarily, run `npm run content:export`, review the fixture changes, then commit the JSON and referenced MP3s. Export assumes the standard local storage layout and preserves previously shared matching audio. After pulling, run `npm run content:seed` while app services are stopped to import matching new audio. Text changes require deliberate review through the admin interface. Do not delete database volumes to update content. See [collaborative audio generation](../../docs/COLLABORATIVE_AUDIO.md).
