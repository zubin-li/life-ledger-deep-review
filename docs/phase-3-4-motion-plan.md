# Phase 3.4 — motion & asset plan (reference videos, macOS desktop only)

Baseline: `codex/macos-3-wip` @ `4ec2442` (Life Ledger 3.3: Today list + Scheduled, Week stack, Journal timeline/photos, Insights report, Habits table, ⌘K palette, sliding nav pill, Focus mini-player). `npm test` 164 / 163 pass / 0 fail / 1 skip.

This phase keeps the 3.3 information architecture and adds **continuity motion** and a **local hairline asset set**. It does not reopen layout decisions in `docs/phase-3-3-design-contract.md`. Scope is the macOS desktop app (Tauri, `html[data-desktop]`, ≥980px). Mobile/iOS is out of scope; narrow layouts must simply keep working.

## Sources (watched end to end; analysis in `.fleet`, summarised here)

| Video | What it is | Takeaway |
| --- | --- | --- |
| V1 (26s) "Hairline — a style as a skill" | Linear-like wireframe line art turned into 10 generation rules: how lines are drawn, how objects move, how the pointer responds; output is a standalone HTML | One consistent hairline illustration grammar for empty states, launcher, focus idle |
| V2 (72s) bencho.dev | React micro-interaction library (Framer Motion + Lucide), 7 categories; component code MIT, photos/fonts separately licensed | Button→menu morph, in-place "copied/saved" confirmation, tunable motion tokens |
| V3 (124s) "10 morph components" (西瓜同学) | Search expands in place, + expands into panel, submit-state chain, icon morph, elastic tab indicator, button→stepper, inline expand, list↔grid, collapsing top bar, full-screen circular menu | Continuity: every change happens where the user is looking |

## Decisions

| # | Idea (source) | Decision | Where in Life Ledger | Implementation rule | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Search expands in place (V3 0:14) | Adopt | Toolbar search | At rest a 28px magnifier button; click, `⌘F`, or typing `/` reveals the field leftwards inside a reserved 220px slot via `clip-path: inset()` + opacity (no width animation). Escape/blur with empty value collapses back. 200ms enter / 140ms exit. | done |
| 2 | Button morphs into menu (V2 0:33, V3 0:24) | Adopt | New "+" toolbar button: New habit, Journal entry, Add weekly goal, Start focus | Popover grows from the button's rect (`transform-origin` at trigger, `scale(.96)` + `clip-path` circle→inset, 180ms), items stagger 20ms max 4 items, closes along the same path 130ms. Keyboard: Enter/Space opens, arrows move, Escape returns focus. One shared helper with the existing context menu. | done |
| 3 | Submit state chain (V3 0:32) + copied check (V2 0:20) | Adopt | Journal composer Save, Backup export/import, Settings save, Copy summary | Button keeps its width (reserve with `min-width` of widest label). idle → busy (spinner glyph) → done (check + "Saved"/"Exported", 1.2s) → idle. Crossfade glyphs 120ms. `aria-live="polite"` announcement. Error state shakes 0px — no shake; shows red text below. | done |
| 4 | Icon morph (V3 0:42) | Adapt | Sidebar toggle, Focus play↔pause, disclosure chevrons, search↔close | Two stacked SVG glyphs crossfade with 90° rotate/scale(.8); **do not** rely on CSS `d` transitions (WebKit does not support them). 160ms. | done |
| 5 | Elastic indicator (V3 0:51) | Adopt | Existing nav pill; Journal mode switch (Timeline/Photos/Calendar); Insights 7/30/90 and Trend/Table switches | One shared `slideIndicator(el, target)` helper: leading edge travels first (translateX + scaleX stretch), trailing edge catches up; 240ms total, interruptible from the live transform. | done |
| 6 | Button → stepper (V3 1:00) | Adapt | Focus duration chip "25 min"; weekly target in Habits editor | Chip expands into − value + (5-minute steps, 5–120; target 1–7). Value rolls vertically (existing rolling-count helper). No schema change. Reject for habit amounts (no amount field in the schema). | done |
| 7 | Inline expand pushes siblings (V3 1:10) | Adopt | Today habit row detail (streak, last-7-days dots, note), Week day rows, Insights "Detailed metrics" | Height changes instantly; siblings FLIP from their old position (translateY → 0, 220ms); revealed content fades + 8px rise. No `grid-template-rows`/height animation. | done |
| 8 | List ↔ grid FLIP (V3 1:18) | Adopt | Journal Timeline ↔ Photos library | Shared thumbnails FLIP between list and grid rects (cap 24 animated nodes, the rest fade). Uses `getBoundingClientRect` + transform. | done |
| 9 | Top bar collapses on scroll (V3 1:28) | Adapt (macOS large title) | Journal, Insights, Habits | Large in-content title (26/700) scrolls away; when its sentinel leaves (IntersectionObserver) the toolbar title fades/rises in (140ms) and a hairline appears under the toolbar. No floating pill. | done |
| 10 | Completion focal moment (existing 3.3 + V3 morph) | Strengthen | Today habit check | Check fill 180ms + stroke draw, row FLIPs into Completed group 240ms, progress number rolls, Undo toast. Keep it the single most expressive motion. | done |
| 11 | Hairline illustrations (V1) | Adapt | Empty states (Today all done, Journal, Insights, Week, Habits), launcher Local/Cloud, Focus idle | Local SVG set in `public/assets/hairline/`, 1px `currentColor` + one accent, layered `data-layer` groups. On first appearance layers settle 4px→0 (320ms, once). **No pointer tracking, tilt or parallax** (rejected in the 3.0 brief). | done |
| 12 | Tunable motion tokens (V2 0:56, V1 intensity slider) | Adopt | `:root` motion tokens + Settings → Appearance "Motion: Full / Reduced / Off" | Map to existing `prefers-reduced-motion` + `html.motion-off`; add `html.motion-reduced` (opacity only, no travel). Persist in existing settings storage key (no new schema). | done |
| 13 | Spring easing | Adopt | Popover, stepper, indicator | `--ease-spring: linear(...)` approximation with `cubic-bezier(0.22,1,0.36,1)` fallback via `@supports`. No bounce overshoot >4%. | done |
| 14 | Circular full-screen reveal (V3 1:38) | Reject | — | Mobile takeover pattern; a Mac window keeps chrome. | skipped |
| 15 | 3D parallax / tilt / hover lift (V1 0:13, V2 0:00) | Reject | — | Mouse-following and card-lift were removed on purpose in 3.0. | skipped |
| 16 | Before/after drag compare (V2 0:48) | Reject | — | No matching data need in Journal. | skipped |
| 17 | Floating bottom FAB/sheet (V3 0:24) | Reject | — | Replaced by #2 anchored in the toolbar. | skipped |

## Resources

| Resource | License | Use |
| --- | --- | --- |
| Hairline set (generated for this project, `public/assets/hairline/*.svg`) | Project license | Empty states, launcher, focus idle |
| Lucide icons (lucide.dev) | ISC | Only for glyphs missing from the existing inline icon set (plus, search, x, play, pause, minus). Inline the paths; record in `THIRD_PARTY_NOTICES.md`. Do not swap the whole icon system. |
| bencho.dev, interior.dev | MIT code, React/Framer | Reference for timing and states only. No code copied (stack is vanilla JS). |

## Motion budget (unchanged rules)

Only transform, opacity, clip-path animate. Feedback 80–150ms, state 150–300ms, overlays ≤320ms, exits faster. Interruptible from live values. Reduced motion keeps the end state without travel. No looping animation except an active Focus session's progress. No new runtime dependency.

## Acceptance

- `npm test` ≥ 164 tests, 0 fail; new tests cover: motion setting persistence and class mapping, `slideIndicator` math, stepper clamping, submit-state machine, each hairline SVG is valid, local, `currentColor`, no `<script>`/external refs.
- `npm run desktop:check`, `cargo test`, `npm run check` green.
- Playwright at 980/1180/1440/1600, en/zh/de, light/dark, `prefers-reduced-motion: reduce`: 0 page errors, no horizontal scroll.
- Short screen recordings (or frame sequences) of #1, #2, #5, #8, #10 at 1440 in `docs/phase-3-4/`.
- CHANGELOG Unreleased, README ×3, SHOWCASE ×3 updated; fictional data only.
