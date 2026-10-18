# Today layout correction · local web checkpoint

## Scope and result

Current correction supersedes the earlier oversized composition: restore the confirmed mood/focus vertical stack and habit/compact-reflection pair. Welcome supports S/M/L; mood supports S/M (not an unhelpful empty Large). The editor overlays direct 44px size controls and never adds 80px per row. Resize keeps the edited card anchored and moves colliding neighbours; undo restores geometry together. Existing records/layouts remain preserved; the former mandatory Small-square mood normalizes to a compact landscape footprint in memory. The canvas remains capped at 1236px, and original colors/SVGs are reused. No other page was redesigned.

Today uses the same measured 12-track grid at desktop-web widths; Small occupies one lane, Medium two lanes, and Large adds height. Meaningful large-square presets for media/other widgets remain in card settings. Welcome and mood are no longer locked against resizing. Phones keep their reading layout. Geometry uses actual canvas width, padding and scroll position, not a viewport-only desktop identity.

Existing custom layouts and records are not reset. A `laneColumns` hint in schema v2 identifies the saved width grouping; reflow into a different grouping is in-memory only until an explicit user edit. Returning to the original grouping reloads its saved coordinates. Edit cards → Reset layout is the opt-in path to the confirmed default arrangement; undo/cancel remain available.

Sizes are directly visible in the edit overlay, alongside the 44px drag/settings controls. The settings sheet retains visibility and advanced shape options. Normal mode has no editor overlay. Real drops and resizes reserve the chosen slot before displacing neighbours; pointer tracking, resize handles, keyboard sizing, focus and undo remain supported. Original habit/mood icons and semantic colors remain.

## Verification

- `node --test tests/today-*.test.mjs`: **43 passed, 0 failures**. Includes the new anchored-resize/undo regression. Full application tests were not rerun for this Today-only change.
- `npm run check`: passed.
- `npm run desktop:check`: **82 passed** (source/component checks, not native-window acceptance).
- `node scripts/evidence/today-web-repair.mjs`: [17 completed cases](results.json). Checks actual dimensions, unchanged normal/edit geometry, direct welcome S/M and mood M controls, exact undo, all habit presets, real pointer drops, rendered-versus-stored slots, content bounds, reload and width round trips. EN/ZH/DE, light/dark, 761/800/980/1000/1180/1440/1920px plus three phone layouts. No screenshot-only layout injection. The current source is also replayed in [recording-results.json](recording-results.json).
- `--mobile-only`: [Chinese/English/German phone checks](mobile-results.json).
- `--screens-only`: [geometry/screenshot refresh](screen-results.json), including internal title/control bounds.
- Previous six-route navigation checks are historical, not repeated in this Today-only scope. Installed WebKit executable was unavailable; no browser installation was performed.
- The optional weather/media/heatmap tests retain their strict overflow and square-shape assertions. Test updates route user actions through the new settings sheet; pointer simulation was replaced with actual mouse input. Existing keyboard-list tests now target phone widths because compact desktop web intentionally keeps the horizontal habit rail.
- `git diff --check` passed. Chinese wide light/dark and compact light screenshots were visually inspected. The recording is fictional isolated browser interaction, not a static gallery animation.

## Boundaries

No commit, push, deployment, release, package/version change, Mac installation, native GUI control or user-browser data access. This is the local website, not a newly installed Mac app. Pixel-perfect native WKWebView/Retina validation remains a later desktop acceptance step. Cloud calendar/weather accounts and all product workflows are not implied by these checks. User visual confirmation remains required.
