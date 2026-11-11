# Today: restore the existing web product inside the Mac app

## Task and checkpoint

Implement ONE reviewable Today screen in the existing application. User approved restoring the web version's visual identity and actual assets, adapting it to Mac using the existing widget platform. They lost trust after several superficial redesigns. A working screenshot of the ACTUAL application is required; another standalone mockup is not a successful result. Keep this bounded to Today and stop after this checkpoint; user will personally approve before other pages or release.

Workspace: `/Users/ashan/Documents/Codex/ll-361-blank-fix`; branch `codex/today-direction-prototype`; initial HEAD `fc1aa6434d2911d6c86e4e69d53566cbc79979f0`. Only existing dirty state is five untracked life-ledger-today-direction prototype files. Preserve them unchanged; they are discussion history, not the implementation source. No other writer is authorized.

## Canonical source, read only

- Original web repository: `/Users/ashan/Desktop/Website/Life-Ledger-Deep-Review` (READ ONLY). Its current public files may already contain later desktop edits; do not blindly copy them over the target. Inspect focused source/history only where necessary.
- Canonical visual reference: `/Users/ashan/Desktop/Website/Life-Ledger-Deep-Review/docs/images/demo-preview/en-desktop/en-01-today-planning-v2.png`. Inspect this image using your image/vision capability before deciding the layout. If you cannot inspect it, report that explicit limitation and do not claim visual fidelity.
- It shows a cool luminous white/light-blue canvas, dark graphite sidebar, a dark hero with subtle blue-green arcs and progress ring, airy white mood surface, four prominent habit tiles using real icons and semantic colors, and a mint/blue Focus Time surface with a floating timer island. Recover actual available CSS/assets/source for those visual motifs; do not invent a cream/olive dashboard. Reuse existing SF/system font stack (Mac requirement overrides generic font advice).
- Target source already has `public/app.js` moodCalendarIcons/iconCatalog/defaultHabitIcons, multilingual labels and seed colors, `public/assets/hairline/` illustrations, `public/layout-engine.js`, `public/widget-registry.js`, existing focus/calendar/photos/reflection integration. Use these real sources. Do not duplicate icon paths or invent nutrition/other user habits.
- Use `/Users/ashan/.codex/skills/frontend-design/SKILL.md` and `/Users/ashan/.codex/skills/ponytail/SKILL.md` only for this bounded task. Canonical web design takes precedence over advice to invent a new style. Read repository AGENTS.md and follow its relevant docs/screenshot rules.

## Allowed implementation

- Primarily focused Today CSS, necessary Today markup/rendering, existing widget registry/engine integration. Reuse real IDs, listeners, selected date, habit data, mood state and semantic colors. No replacement app or parallel component platform.
- Restore original habit SVGs visibly in Today tiles (not blank colored circles); show completion separately. Pointer completion gently moves the item to the end, keeps focus and scroll; keyboard and reduced/off motion preserve state without decorative movement.
- Today must have visual hierarchy and generous controlled spacing: overview/mood, primary habits, then calendar/reflection/photos/focus. Focus is an optional widget; when shown it must receive a coherent designed size, not dominate the whole page or become a generic cramped card. Avoid duplicating every feature in permanent equal-sized cards.
- Preserve actual S/M/L, persistence, drag/drop/collision/undo/keyboard and existing module visibility. Every size adapts content, not a scaled-down duplicate: habits M supports four visible icons/tiles and L up to eight or a horizontal rail; compact summary/long text must not overflow or squeeze headings. Normal mode has no edit clutter; edit controls remain accessible. No nested vertical scrolling in text cards; outer canvas scrolls. Habit overflow is horizontal only.
- Scope new visual rules to Today (and its visible desktop shell when Today is active); avoid restyling Week/Review/Settings or changing mobile behavior unnecessarily. Light and dark must both feel like the same original product; no beige fallback. Preserve en/zh/de.
- No weather implementation this checkpoint, no fake live data, no calendar OAuth/backend changes, no data migration redesign, no dependencies/fonts, no native widget/Xcode work, no version edits.

## Safety and gates

Do not commit/stage/push/publish/package/install, alter credentials, change source web repository, control UI/apps, use a logged-in browser, kill unrelated processes, or do destructive Git. Headless isolated Playwright on a task-owned local server with fictional fixture data is allowed; keep it off the user's Chrome. Preserve existing tests; do not weaken assertions, skip failures, or rewrite fixtures to make layout pass. State genuine incompatibilities.

Use only necessary gates: `git diff --check`, `npm run check`, `npm run desktop:check`, targeted `node --test tests/today-*.test.mjs`. Run `EVIDENCE_DIR=docs/today-web-parity node scripts/evidence/today-geometry.mjs` once to establish real pointer/size/keyboard/reduced-motion integrity without overwriting previous phase evidence. Add/adjust only a small targeted evidence capture if necessary to show the new Today actual desktop route (desktop=tauri-local/tauri-cloud) with fictional fixtures, real icons and representative M/L content. Capture en/zh/de light and dark plus required fictional mobile Today screenshots under `docs/today-web-parity/`, update relevant showcase/docs/changelog narrowly per AGENTS.md; do not refresh unrelated tour images. Do not delete old artifacts. No full backend/cargo/Xcode testing for a frontend checkpoint.

## Report

1. Actual source/assets reused (paths) and concrete visual changes.
2. Touched files, gates and counts, exact evidence screenshots.
3. Explicit limitations, actual blockers, missing fidelity or functionality. Never equate green tests with user acceptance.
4. Compact output; no verbose logs. If no material implementation within the 20-minute bound, report rather than starting a new redesign/research loop.
