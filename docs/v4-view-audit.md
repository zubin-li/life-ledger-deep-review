# Per-view audit against `3c9c7a8`

Baseline frames are the 1180×760 English light screenshots of that commit. The 4.0 frames use the same seed data, viewport, language, and `desktop=tauri-local`. “Added a control below the old list” is not counted as a structural change.

## Shell

`3c9c7a8` used a light 220px sidebar, a 15px view title in the toolbar, and sage selection. 4.0 uses a 196px ink sidebar (`--sidebar-ink`) with a version plate (`#appVersionLabel`), cream active bar, and terracotta accent. The toolbar still carries date, search, and the inspector, but it is no longer the place the page title lives. Native window titles are `Life Ledger 4`, and each macOS window sets `traffic_light_position`.

## Today

Before: one column. “Saturday” sat on one line with the date and the count. Habits filled the width. Mood and the reflection followed underneath. Photos were not in the first screen unless the list was short enough.

After: `.today-desk-grid` is two columns. The left rail leads with a 44px date. The right sheet (`#todayJournal`) leads with the photo well, then mood, then the reflection. Both are on screen at 1180×760 without scrolling. Focus stays in the inspector.

## Week

Before: a vertical list, one row per day, then goals.

After: `#weekAgenda` is `repeat(7, minmax(0, 1fr))`. Each day is a column (weekday, date, fraction, note). Goals sit in a 132px strip under the board. Enter still opens the day in Today.

## Timeline

Before: calendar column on the left, “Select a day to view details” as a small line on the right.

After: `.timeline-layout` is `minmax(0, 1fr) 292px`. The journal page is first and the empty state is 34px type. The month, filters, and entry list are the right rail. Adding a photo still happens on the selected day.

## Review

Before: “October 2026” was a 15px section label above a status line, with the chart in the same left stack.

After: `#reviewView.active` is a centered 680px manuscript. The month is 46px. Status, reflection, then the trend. Scores stay in the inspector. Detailed metrics stay collapsed.

## Habits

Before: a table with Name / Target / Active headers and hairline rows.

After: the header is hidden. The summary is 32px. Each habit is a 56px bordered row. The inspector still edits the selection, including the 28-day streak.

## Launcher

Before: a single centered card column. After: the same controls in a two-pane desk, ink source on the left with `4.0.0`, choices on the paper field. Local and cloud still require an explicit click.
