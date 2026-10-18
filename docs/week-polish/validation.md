# Week and shared-shell design checkpoint

## Scope and provenance

- Actual Today/Week application routes, not another standalone prototype. Existing uncommitted work, widget geometry/schema, media storage, goal/review persistence and module visibility/order are retained. No delegate or second writer.
- Original web repository read-only: focused CSS history from `2caec5d` (before the later calm-panel rewrite). Reused its radial cool-blue/green canvas, inset highlights and pointer-aura technique, plus the existing `renderIcon/iconKey/habitStyle` and original hairline assets. Colors are adapted, not claimed pixel-identical. No new packages, fonts or framework.
- Official references: [Apple Color](https://developer.apple.com/design/human-interface-guidelines/color), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion). Content surfaces remain readable; navigation has restrained translucency, light/dark differentiation and reduced/off alternatives. CSS in a WebView is not native Liquid Glass. Actual native window corners/titlebar remain OS-owned.

## Functional and visual evidence

- `node scripts/evidence/week-polish.mjs`: real controls, fictional state, isolated headless Chromium. `results.json` contains 16 layout scenarios: en/zh/de light/dark at 1440px; 1180/900/650px German dark/reduced; 390px web en/zh/de; selected history, future week, collapsed and edit modes. Asserts no horizontal overflow, content inside card bounds, no card/card overlap and no nested vertical scroll trap.
- Real keyboard Home/Right/Enter selects a connected date control without unexpected Today navigation. Explicit Open this day is separate. Habit toggling retains focus and uses actual original SVG icons. Goal addition/completion and review editing are verified against saved application state. Historical/future streak values cannot inherit the current period's count. Reduced motion disables decorative transforms but preserves progress-meter data transforms.
- Fixed two inherited constraints exposed by actual images: Week was forced into shrinkable flex layout by an old `!important` rule; with grid enabled, intrinsic auto rows still shrank under fixed viewport height while natural-height cards overflowed. The final scoped normal-mode grid uses `grid-auto-rows: max-content`; edit remains the existing single-column module controller. Geometry assertions cover both failure modes, not just screenshots.
- `node --test --test-concurrency=1 tests/today-*.test.mjs tests/modules-layout.test.mjs`: 46 passed, 0 failed.
- `npm run check` and `npm run desktop:check`: passed (80 desktop tests).
- `EVIDENCE_DIR=docs/week-polish node scripts/evidence/today-geometry.mjs`: 311 passed, 0 failed.
- `git diff --check`, new JS/evidence `node --check`: passed. No tests were weakened or skipped.
- Viewed Chinese light/dark Week, lower goals/review, Today and mobile images. New evidence updates matching en/zh/de SHOWCASE entries. H.264/yuv420p MP4 includes recording-only captions/cursor markers; no user Chrome/native GUI was controlled.

## Pending / not claimed

- User visual acceptance and actual native macOS WebKit/installed-app checks remain pending. No commit, push, deployment, packaging, signing or installation.
- Week forecast slices are not implemented in this checkpoint. Existing weather remains optional; fresh-update time is a hover title rather than resident copy, while cached/offline/error notices remain visible. Mood/month-heatmap redesign is not included.
- No production-web edits. Web/mobile compatibility is checked locally; no online deployment claim.
