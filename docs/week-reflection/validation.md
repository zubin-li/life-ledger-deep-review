# Week / Timeline review checkpoint

Date: 2026-10-15. This is a user-review checkpoint, not a release or installation.

## Verified

- `npm run check`: passed.
- `npm run desktop:check`: 80 passed, 0 failed.
- Today geometry evidence: 329 passed, 0 failed; current results in `today-geometry-results.json`.
- Week / Timeline evidence: 18 scenarios passed, no page runtime errors; see `results.json` and `scripts/evidence/week-reflection.mjs`.
- Relevant test run: 45 passed and one outdated default-position assertion failed. After updating that assertion to the new content-specific default, the affected Today layout test passed in a focused rerun. The entire suite was not rerun after that final assertion correction.
- The earlier full `npm test` run had 229 tests: 226 passed, 2 failed, 1 skipped. One failure was that corrected default-position assertion. The other remains the existing Day Plan static CSS check (`tests/day-plan.test.mjs:75`): it scans from a Day Plan comment through the rest of `public/styles.css`, including existing Habit horizontal-rail overflow rules. This round did not edit that stylesheet or suppress the check. **The full test suite is not claimed green.**

Actual screenshots cover Chinese, English and German; light/dark; desktop and narrow windows. The checks exercise weekly saving, changing archive weeks, matching same-week photos, returning to Week, existing daily/photo modes, calendar read-only requests, fixed widget controls, and the ISO week-year boundary. Geometry checks include the wide-window square-mood overlap fix.

## Reuse and data boundaries

- Existing weeklyOutputs / weeklyReviews data, photo library, Google Calendar loader, widget registry and layout engine are reused. No new dependency was added for this checkpoint.
- Existing custom module order, visibility, stored layout positions and records are preserved. New defaults do not forcibly reset saved preferences.
- Quote is fixed wide; mood is fixed square. Variable-content widgets retain their supported sizes. Tests were updated for this requested contract, not by weakening overflow or overlap assertions.
- Screenshots and recording use fictional text, simulated calendar responses and clearly fictional SVG landscape photo fixtures. They are not evidence of access to the user's private calendar or photo library.

## Limitations / awaiting approval

- Google Calendar uses the existing connected-edition read-only integration. Pure local mode explains that connection is unavailable; native Apple Calendar and ICS import are not implemented here. Real-account authorization was not tested or changed. Existing event-date normalization remains in use.
- The existing quick weekly note and rich weekly review stores remain separate; the archive reads both without migration.
- Weekly weather slices are not implemented in this checkpoint.
- Testing used isolated headless browser routes, not an installed macOS WebView. No package, installation, publication, commit or push was performed.
- Passing functional checks does not establish visual approval. User confirmation is required before extending this direction to other pages.
