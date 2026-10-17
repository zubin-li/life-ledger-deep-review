# Local interactive web checkpoint

## Open the local website preview (not an installed Mac app)

Run `npm run preview:local` from the repository, then open:

<http://127.0.0.1:43117/?mode=local&lang=zh&preview=local>

This runs the application source in a browser, not a screenshot gallery and not a newly installed Mac app. The server binds only to loopback and serves only `public/`. Its origin/port is stable so browser-local records survive server restarts. No fixtures are injected into the user's browser. A busy port fails visibly rather than stopping another process. Restarting the computer/app may require running the command again; no LaunchAgent is installed.

## What changed

- `data-workspace` now selects shared wide-screen presentation in ordinary web/PWA and Tauri routes. `data-desktop` remains exclusive to the two native runtime routes. The normal web URL has no native identity, Mac status badge, traffic-light placeholders or privileged bridge.
- Six pages, original SVG icons, colors, light/dark themes, card sizing/settings, catalog and existing motion use the same source. Native titlebar/Settings handoff remain native-only; the web opens its actual Settings dialog and retains browser installation affordances.
- The shared presentation responds at 761px; narrow layouts retain mobile navigation. A 44px mobile Settings entry reuses the original gear SVG. Narrow Today cards use the available width; long module headings wrap instead of overflowing. Crossing the breakpoint preserves unsaved habit editor fields.
- Habit check/undo no longer calls `renderAll`: Today and relevant visible views update, while inactive Insights and the habit editor are not rebuilt. Completion order follows the stored completion sequence, placing the latest completed icon at the end. Focus and horizontal-rail behavior are retained. This reduces redundant work; it is not a measured native frame-rate claim.
- No database/file-system migration. Records still use browser-local storage and media uses existing local stores. This separate localhost origin does not automatically share the original website/app's data. Existing import/export remains available; regular backup is recommended.
- The dedicated `preview=local` flag disables old service-worker caching only on loopback hosts, so this review does not silently show cached UI. Normal deployed PWA service-worker behavior is unchanged.

## Evidence

**Subsequent Today correction:** [Actual default screenshots, recording and stricter rendered-slot checks](today-repair/index.html) · [verification details](today-repair/README.md). The original reports below are historical checkpoints; passing navigation/outer-frame checks alone did not establish that card sizing/dragging worked. The new Today check verifies actual dimensions and screen coordinates, not just stored layout changes.

### Responsive correction after the user report

The original checks missed the 761–979px interval: a legacy single-column rule stacked the workspace below its sidebar. A second real hit-test found localized week dates could be intercepted by toolbar actions. The correction retains two shell columns at 761–979px and uses two toolbar rows at 761–1179px. The earlier 92 passing cases do not establish this range was correct.

`node scripts/evidence/local-web-breakpoints.mjs` checks 760/761/800/900/979/980px, all six routes, EN/ZH/DE, and both themes (216 route cases). Assertions include side-by-side shell geometry, actual pointer hit targets, route clicks, sidebar collapse/expand, edit-mode entry/exit, Settings opening/closing and runtime errors. [Fresh results](breakpoints/results.json). Fictional data is isolated from the user's browser. The main evidence script now includes the previously omitted widths and checks pane alignment; its earlier 92-case report is historical, not a rerun of that expanded script.

Correction results: **216 route cases passed, zero runtime errors**. Fresh non-fixture German Week toolbar hit-tests also passed at 1100/1179/1180/1440px. `npm run check`, `npm run desktop:check` (82 passed), the focused workspace/responsive/integrated-shell tests (8 passed), and `git diff --check` passed. Chinese light/dark 800px screenshots were visually inspected. These checks address the reproduced layout/toolbar defects; they do not establish every product workflow or the user's actual browser state is correct.

- Full `npm test`: **239 tests, 238 passed, 1 pre-existing skip, 0 failures**.
- `npm run desktop:check`: **82 passed**.
- `node scripts/evidence/local-web.mjs`: **92 layouts passed**, including six pages, EN/ZH/DE, light/dark and 1440/980/390/320px. Screenshots use **2× device scale**, fictional records, and isolated headless contexts. No user browser or real personal data was accessed. [Results](results.json).
- Real web interactions: pointer habit completion/reordering and focus, retained inactive content, no inactive review/editor render, note/completion persistence after reload, M-size original SVG icons, real pointer card drag, persisted layout, Settings/profile/theme, native/web card computed-style equality, mobile Settings targets, breakpoint transition preserving an editor draft, and no stale preview service worker passed. Runtime errors: **0**.
- Native-route geometry regression: **329 passed, 0 failed**. [Results](geometry/today-geometry-results.json). CSS source tests were updated for the shared presentation attribute, not removed or weakened; a new VM boot test verifies that the web does not obtain a native identity.
- Fresh, non-fixture browser context: Today opens, eight visible cards, no blocking dialog, native flag absent. Local server: HTTP 200/no-store; traversal outside `public` returns 404; POST returns 405. No HTTP data-write API exists.
- `git diff --check` passed.

## Not established by this checkpoint

No commit/push, remote deployment, package/version change, installer, installed-app replacement, native Retina/NSWindow acceptance or live cloud/calendar/account verification. SQLite and user-chosen persistent library folders remain later desktop work. Weather requires internet; calendar connection/AI voice still require their connected editions. Existing optional photo-wall media backup/sync limitations remain as documented in `docs/today-widgets/README.md`.

User visual/interaction approval remains separate from automated checks.
