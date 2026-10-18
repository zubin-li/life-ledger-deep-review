# Widget checkpoint validation — 2026-10-15

No commit, push, package, install or user-GUI automation was performed.

## Current checkpoint: weather chart and independent widget library

- `git diff --check` and `npm run check`: passed. New weather/catalog scripts also pass `node --check`.
- `node --test --test-concurrency=1 tests/today-*.test.mjs`: 40 passed, 0 failed.
- `npm run desktop:check`: 80 passed, 0 failed.
- `EVIDENCE_DIR=docs/today-widgets/weather-gallery node scripts/evidence/today-geometry.mjs`: 311 passed, 0 failed, no failure directory in that evidence output.
- Loaded weather charts fit S/M/L/square at 1180px. Tests cover city-local midnight/day extrema, current-weather isolation from forecast exploration, repeated keyboard exploration/focus, city/cache persistence and offline reload.
- Catalog contains all 11 existing widgets. Adding preserves other slots, removal persists without hidden edit placeholders, and Escape after adding closes only the catalog. Fixed focus falling to the document after the clicked Add button became disabled.
- 19 new screenshots cover English/Chinese/German light/dark, real pointer exploration and the catalog. Inspected Chinese light/dark weather and dark catalog; increased reused line-art contrast in dark mode. The recording asserts real pointer changes the selected hour without changing the welcome weather, and actually adds a photo wall. H.264/yuv420p MP4 is about 16 seconds; captions/cursor markers are explicitly recording-only.
- Offline runtime code is reused from MIT uPlot 1.6.32 and Motion 14.2.0 mini, with license notices retained. Motion only handles pointer-triggered addition opacity; keyboard/reduced/off skip decorative animation. No new framework, global skill or CDN was introduced.
- Fictional data and mocked forecasts, isolated headless Chromium, actual Today desktop route. Not a native macOS WebKit/installed-app acceptance test. No commit, publication, packaging, installation or production-web changes. Await user visual confirmation; mood and monthly-heatmap visual redesign remain pending.

## Follow-up: monthly heatmap and edit-only settings

- `npm run check`: passed.
- `node --test --test-concurrency=1 tests/today-*.test.mjs`: 38 passed, 0 failed (includes 6 optional-widget tests).
- `npm run desktop:check`: 80 passed, 0 failed.
- `EVIDENCE_DIR=docs/today-widgets/edit-cards node scripts/evidence/today-geometry.mjs`: 311 passed, 0 failed; no current failure-artifact folder.
- Verified complete October (31 dates with three Monday-first leading spacers), all-size month retention, small 10/12px cells, original real completion levels, edit-only configuration/movement/add control, per-card blue palette persistence, and keyboard focus restoration. Escape from the native settings dialog leaves edit mode active.
- Fixed a release-click regression: a drag/resize gesture must not accidentally become a card-settings click. Existing real-pointer resize/cancel and drag tests pass. Video recording independently asserts the actual persisted heatmap slot changes after a real pointer drag.
- Updated English/Chinese/German normal and settings screenshots in light/dark, existing size comparison screenshots and mobile evidence. Chinese recording has clearly identified video-only caption/pointer annotations, fictional data and mocked weather. MP4 uses H.264/yuv420p for preview compatibility.
- Visually inspected the normal Chinese page, dark German settings, blue Chinese settings and final relocated heatmap. Native macOS WebKit and installation remain outside this checkpoint; user visual confirmation is still required.

## Previous widget checkpoint

- `git diff --check`: passed.
- `npm run check`: passed; includes the new `today-extras.js` syntax and required-file checks.
- Today/photo regression suite: 42 tests passed before the final compact media-stage adjustment; its four new-feature tests were subsequently rerun and expanded to five, all passing.
- `npm run desktop:check`: 80 passed, 0 failed.
- `EVIDENCE_DIR=docs/today-widgets node scripts/evidence/today-geometry.mjs`: 311 passed, 0 failed. No failure screenshot directory remains in this evidence folder. Historical evidence elsewhere was preserved.
- `node --test tests/today-extras.test.mjs`: 5 passed, covering equal outer frames, square persistence, original mood-control reuse, eight-level live completion colors, media storage/reload/reduced-motion, hourly weather/city/cache, and optional-card content bounds across four presets at 1180/1440px.
- `node scripts/evidence/today-widgets.mjs`: 16 actual-route screenshots. Equal welcome/mood measurements recorded in `measurements.json`: S 387×180; M 793×180; landscape L 793×380; square L 793×793 at 1440px viewport.
- `node scripts/evidence/today-web-parity-screens.mjs`: refreshed fictional desktop light/dark in English/Chinese/German, compact sizes, mobile captures and interaction recording. The default seven visible cards remain; optional cards are initially hidden.
- Public Open-Meteo geocoding and forecast smoke checks: HTTP 200; one matching example city and 48 hourly entries returned. Screenshots/tests intentionally use repeatable mocked forecasts, not personal location data.

Visual review: inspected Chinese light/dark actual-route screenshots, Medium welcome, and square photo wall. This is not user visual approval. Native macOS WebKit/media-codec behavior has not been verified, and no installed app has been replaced. Photo-wall blobs are local and not yet in daily-photo backup or cloud sync. Rain/snow hints are forecasts inside the card, not OS notifications.
