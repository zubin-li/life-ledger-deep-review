# Phase 3.3 verification

Evidence comes from the desktop frontend the Tauri webview loads: `public/index.html?desktop=tauri-local`. This Linux cloud environment cannot launch the macOS `.app`. The screenshots and demo are not the HTML prototype in `docs/prototypes/`.

The open-source follow-up is recorded in `docs/phase-3-3-open-source-study.md`. These frames replace the earlier 3.3 stills.

## Window sizes

- 1180×760: `docs/phase-3-3/today-1180.png`, `journal-1180.png`, `insights-1180.png`, `today-1180-zh.png`
- 1440×900: `docs/phase-3-3/today-1440.png`, `week-1440.png`, `journal-1440.png`, `journal-photos-1440.png`, `insights-1440.png`, `insights-table-1440.png`, `today-1440-de.png`, `today-1440-dark.png`

## What the frames show

- Today is one column with an Open list and a Scheduled list. Sleep before 23:30 sits on a 23:30 time gutter. The idle Focus control is an icon, not a running clock and not a right rail.
- Week is a vertical stack of seven days. The selected day opens its habits in place, including the scheduled time. The side detail card is gone.
- Journal timeline has a composer, a saved state, and a list/detail split. Photos is a month-grouped library. The photo in `journal-photos-1440.png` was added through the day detail in the same desktop frontend.
- Insights is one report: a range line (`29 Sept to 5 Oct`), a per-day average, three summary numbers, and one active view. Trend shows the line. Table shows habit rows instead of the chart.

`docs/phase-3-3/structure-contact-sheet.png` places Today, Week, Journal, and Insights together.

## Languages, theme, motion, keyboard

- English, Simplified Chinese, and German were loaded with the saved language preference. Chinese uses 今日 / 待完成 / 已排程 / 回顾今天. German uses Heute / Offen / Geplant / Heute reflektieren.
- Dark theme: `today-1440-dark.png`.
- `prefers-reduced-motion: reduce` and `html.motion-off` keep the new sheets and the mini-player from traveling.
- Enter and Space still complete a focused habit. Escape closes the day detail and the Focus panel. The mini-player is hidden while that panel is open.

## Interaction demo

`docs/phase-3-3/interaction-demo.mp4` is 21.8 seconds at 1440×900. It shows a habit completion, the scheduled row, a week day opening in place, the journal composer, Photos and Calendar, the Insights Habits and Table views, and Focus starting from the toolbar then collapsing to the mini-player.

## Known limit

The macOS bundle is produced by GitHub’s macOS Desktop Verification workflow. This environment records the same frontend that bundle embeds. `npm run desktop:build` on this host produced the Linux release binary at `src-tauri/target/release/life-ledger-deep-review-desktop` and did not produce a `.dmg`.
