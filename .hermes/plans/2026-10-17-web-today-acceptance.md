# Web Today — P0/P1 findings (2026-10-17, planning only)

Target: Web Today only. Not macOS/Tauri. Not execution authority.

## P0 done
Local snapshot branch `snapshot/today-dirty-2026-10-17` = 8cb22c8 (all 83 dirty paths, 447 files incl. evidence). Worktree and `codex/today-direction-prototype` untouched. Not pushed.

## Approved reference (Codex checkpoint, user-confirmed)
`docs/today-widgets/weather-gallery/today-*-{light,dark}.png`, 1440×1000, fixture `scripts/evidence/today-weather-gallery.mjs`.
Grid 2 columns, 780 + 380 px at 1440 (8 + 4 of 12 cols), row unit 180, gap 20:
- Hero/welcome 780×380 · Mood 380×180 · Focus 380×180
- Weather 780×380 · Habit rhythm (heatmap) 380×180 · 7-day rhythm 380×180
- Foundations/habits and Reflection start at row 5 — **below the fold; never shown in the approved image.**

## Why it was "never built"
The current code renders the approved first viewport (1440, rows 1–4) essentially identically. What failed is everything the reference did not show:
1. Lower half had no designed reference. Habits was forced to `medium` 780×180; four tiles need ~380 height → tiles overflow right into Reflection (measured `!OVF` at 1440/1180/800). Photos medium 780×180 is mostly empty.
2. Below 1180 the 12-col absolute layout persists: 800px leaves a blank left column, habits overflow; 390px has a giant empty Foundations area, nav overlapping content, stacked words.
3. Small defects in the approved part: heatmap legend swatches garbled; 7-day rhythm card has large empty space.

Probe evidence: `.hermes/plans/assets-2026-10-17/` (`ref-tall-1440` = approved layout full page; `fp-tall-1440` = footprint variant; `web-1180/800/390`). Probe script `probe.mjs` there (read-only, scratch output).

## Footprint variant tested with current code, no source edits
Habits fixed wide 780×380, Reflection 380×180, Photos compact 380×180, Calendar 780×380 → no overlap at 1440 (vision check). Habits shown in all-done state; needs re-check with open habits.

## Acceptance board proposal (P1)
- Rows 1–4 at 1440: the approved reference exactly (+ fix heatmap legend, tighten 7-day card).
- Rows 5+: footprint table — Habits 780×380 | Reflection 380×180 + Photos 380×180 stacked | Calendar 780×380.
- 1180: same 8/4 proportion. 800: two equal columns, wide cards span both. 390: one column, content order = hero, mood, habits, focus, weather, reflection, heatmap, 7-day, photos, calendar.
Requires user sign-off before P2.

## Checkpoint v5 (2026-10-17, implemented by Hermes directly)
- Web-only (`html:not([data-desktop])`); Tauri untouched.
- Fixed footprints at 1440: summary/weather/habits/calendar 780×380; mood/focus/context/reflection 380×180; heatmap/photos 380×380. No S/M/L in web edit mode ("Fixed size" label).
- Fixes: heatmap legend swatches + square grid; photos square shows full empty state; edit strip carries widget name instead of covering titles; mobile habit row 4-column; `--controlAccent` defined on narrow web (Oct 24 selected cell was invisible); mobile tab bar 6 columns (DE "Gewohnheiten" no longer truncated).
- Checks: `npm run check` ok; tests 241 pass / 1 fail (pre-existing on snapshot 8cb22c8, Tauri S/M/L weather test); new `tests/today-web-footprints.test.mjs` passes; 48 runtime shots (en/zh/de × light/dark × 1440/1180/800/390 × normal/edit): 0 runtime errors, 0 overflow/overlap (only sr-only labels flagged).
- Open design questions (below the approved reference, not yet decided): 7-day rhythm and reflection cards are sparse at 380×180; habit tiles have a large icon→label gap.

## Round 3 — classic 3.5 Today restored as widgets (2026-10-17)
- Default web layout = original rhythm: hero+mood / full-width foundations carousel / daily calendar + reflection (Reflection·Focus tabs) / month in view. Weather, heatmap, photos, wall, 7-day rhythm, focus start hidden in the library.
- `public/today-classic.css` is generated from main's styles.css by `scripts/build-today-classic-css.py`, scoped to `html:not([data-desktop]) #todayView`.
- Layout engine: per-type WEB_DIMS (12 cols × 132px rows), footprint version 5 (old saved layouts reseat, hidden choices kept); narrower canvases stack full width in original order.
- Gates: npm run check ✓, tests 242 pass / 0 fail / 1 skip, real-data probes at 1440/1180/800/390 zh/de/dark: no overlap, no x-overflow, no runtime errors. Interactions verified: carousel paging + check-in, day roll, back to today, tabs, month mood/heatmap + prev/next, mood dialog, remove + re-add widgets.
- Pending: user's own visual acceptance in their browser; then commit. Tauri untouched.
