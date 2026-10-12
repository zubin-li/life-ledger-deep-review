# Phase 3.3 open-source study

This note is the required study artifact for the open-source addendum. It was written after reading the pinned source files and the screenshots listed below, and before the structural follow-up to the 3.3 desk. Life Ledger stays vanilla JavaScript, CSS, and Tauri. No React or Angular dependency is added.

## License boundary

Code adaptation is limited to three permissive patterns, named at the end of this note. AppFlowy (AGPL-3.0) and Loop Habit Tracker (GPL-3.0) were inspected as pictures and interaction only. None of their source, icons, or copy is reproduced in Life Ledger. `THIRD_PARTY_NOTICES.md` records the three adapted patterns with repository, commit, path, and license.

## Repositories actually inspected

| Product | Repository | Pinned commit | License | Role |
| --- | --- | --- | --- | --- |
| Actual Budget | https://github.com/actualbudget/actual | `8e165c0eb6871f05177e0aa8589894c783ef122e` | MIT | Insights / reports |
| Super Productivity | https://github.com/super-productivity/super-productivity | `0bb6d44d0e581c077972ef50c0f5bb2b3284b2a2` | MIT | Today / Week / Focus |
| Memos | https://github.com/usememos/memos | `0d989707f82c33f74bb852edd8965ec88fcf041b` | MIT | Journal / photos / timeline |
| Kairos Pomodoro | https://github.com/shakibdshy/Kairos-Pomodoro | `fb1f18d2237a4da03ff9189ef44174d05bc15beb` | MIT | Tauri timer pattern only |
| AppFlowy | https://github.com/AppFlowy-IO/AppFlowy | `5cf3a365dec0d59f64bad1ee4bb1050471a39b93` | AGPL-3.0 | Visual reference only |
| Loop Habit Tracker | https://github.com/iSoron/uhabits | `7e993e17b2b674d4b5b1291ebd18677b74810df2` | GPL-3.0 | Visual reference only |

## What was opened

### Actual Budget — Insights

Source at `8e165c0`:

- `packages/desktop-client/src/components/reports/DashboardHeader.tsx`
- `packages/desktop-client/src/components/reports/ReportSidebar.tsx`
- `packages/desktop-client/src/components/reports/ReportSummary.tsx`
- `packages/desktop-client/src/components/reports/graphs/LineGraph.tsx`
- `packages/desktop-client/src/components/reports/graphs/BarGraph.tsx`
- `packages/desktop-client/src/components/reports/graphs/CalendarGraph.tsx`
- `packages/desktop-client/src/components/reports/graphs/tableGraph/ReportTable.tsx`
- `packages/desktop-client/src/components/reports/graphs/tableGraph/ReportTableHeader.tsx`
- `packages/component-library/src/themes/sidebar-redesign-light.css`

Screenshot: `README.md` `demo.png` at that commit. It is the Budget surface, not a custom report: a dark sidebar (Budget, Reports, Schedules, accounts with balances), a month switcher, two month summary cards, and a category table whose columns repeat Budgeted / Spent / Balance. The report structure below comes from the source, because that README image does not show the report editor.

What the source does:

- `DashboardHeader` is one line: a fixed “Reports:” label plus the report name, which truncates. It is not a stack of equal cards.
- `ReportSummary` states the formatted start date, adds “to” and the end date only when the two labels differ, then one period total and one per-interval average.
- `ReportSidebar` is a control column, not a second score rail. Display chooses Mode (Total or Time), Split, Type, Interval, and Sort. `graphType` is a single selection (`LineGraph`, `BarGraph`, `StackedBarGraph`, `TableGraph`, and the separate calendar graph). Trend lines are disabled unless the graph is a line. Empty rows and empty intervals are explicit options.
- `ReportTable` is a peer of the charts: sticky interval header, scrolling rows, totals row. `CalendarGraph` is a 7-column month the user can click.
- `sidebar-redesign-light.css` only recolors Actual’s navy sidebar. That palette is finance chrome.

### Super Productivity — Today, Week, Focus

Source at `0bb6d44`:

- `src/app/core-ui/main-header/focus-button/focus-button.component.html`
- `src/app/core-ui/main-header/focus-button/focus-button.component.ts`
- `src/app/features/focus-mode/focus-mode-overlay/focus-mode-overlay.component.html`
- `src/app/features/focus-mode/focus-mode-main/focus-mode-main.component.html`
- `src/app/features/focus-mode/focus-mode.service.ts`
- `src/app/features/planner/planner-day/planner-day.component.html`
- `src/app/features/planner/planner-plan-view/planner-plan-view.component.html`
- `src/app/features/planner/planner-calendar-nav/planner-calendar-nav.component.html`
- `src/app/features/schedule/schedule-day-panel/schedule-day-panel.component.html`
- `src/app/features/metric/activity-heatmap/activity-heatmap.component.html`
- `src/app/features/metric/reflection-note/reflection-note.component.html`

Screenshot: `docs/screens/banner.png` at that commit is a wordmark, not the planner. `docs/screens/reel.gif` is the product motion reel; the structure below is taken from the templates, which are the precise UI.

What the templates do:

- `planner-plan-view` is a vertical sequence of `planner-day` blocks, plus an overdue block. It is not a 7-column card grid and not a list-plus-side-detail.
- `planner-day` has a header (day name, short date, planned load, progress) and then two stacks: tasks with no start time, then a scheduled stack whose rows lead with a time. Deadlines are a third stack. An empty day says so. An inline add row sits under the open tasks.
- `planner-calendar-nav` is a month grid of day buttons with a task dot. Past days other than today are disabled. The selected day is `aria-pressed`.
- `schedule-day-panel` is a time grid with an empty state, used when the user is placing work on a clock. It is denser than Life Ledger should be.
- `focus-button` is an icon in the header. The running clock (`focus-running-label`) is rendered only when `runningTimeMs()` is set. A break swaps the icon. Click enters focus mode; a long-press opens session settings.
- `focus-mode-overlay` is a dialog with one page at a time: main, break, or session done. It is not a permanent column.
- The heatmap is a titled block with a year select and a plain empty sentence. The reflection note is a short textarea plus a history button, not a dashboard tile.

### Memos — Journal

Source at `0d989707`:

- `web/src/components/MemoPanel/MemoPanel.tsx`
- `web/src/components/MemoPanel/MemoPanelList.tsx`
- `web/src/components/MemoDetailSidebar/MemoDetailSidebar.tsx`
- `web/src/components/AttachmentLibrary/AttachmentMediaGrid.tsx`
- `web/src/components/AttachmentLibrary/AttachmentLibraryEmptyState.tsx`
- `web/src/components/AttachmentLibrary/AttachmentLibraryToolbar.tsx`
- `web/src/components/CalendarView/CalendarView.tsx`
- `web/src/components/CalendarView/CalendarGrid.tsx`
- `web/src/components/ActivityCalendar/MonthCalendar.tsx`
- `web/src/components/MemoMetadata/Attachment/AttachmentListView.tsx`
- `web/src/components/MemoMetadata/Attachment/visualGalleryLayout.ts`
- `web/src/components/MemoEditor/hooks/useAutoSave.ts`
- `web/src/components/AppSidebar/ViewsSection.tsx`

Screenshot: https://raw.githubusercontent.com/usememos/.github/refs/heads/main/assets/demo.png (linked from the README at that commit). The window is a sidebar (search, August 2025 month grid with the 20th marked, shortcuts, tags) and a main column that starts with a composer (“Any thoughts…”) and then a timeline of memos. Photos are not in that particular frame; the attachment source is.

What the source does:

- `CalendarView` keeps month and selected day in the URL. On a wide window the day’s memos open in `MemoPanel`, a non-modal card on the end edge that slides in and stays mounted through the exit so the content does not flash empty. Below the desktop breakpoint the day’s list sits under the grid.
- `MemoPanel` width is persisted. A save in flight refuses to close (`busy`).
- `AttachmentMediaGrid` groups media by month, with a label and a rule, then a 2–4 column card grid. The empty state is a dashed well with one title and one sentence, per tab (media, audio, documents).
- `resolveVisualGalleryLayout` maps a count to one layout: 1 full image, 2 side by side, 3 with the first cell spanning two rows, 4 as a 2×2, and 5 or more as a 2×3 whose last cell shows `+N`. `AttachmentListView` renders that layout inside a memo.
- `useAutoSave` writes the draft locally on each real change and flushes again on `pagehide`, when the tab becomes hidden, and on unmount. The editor does not re-render on every keystroke just to persist.

### Kairos — timer mechanics only

Source at `fb1f18d`:

- `src/components/layout/timer-mini-player.tsx`
- `src/components/base/focus-summary-bar.tsx`
- `src/components/timer/focus-mode-stage.tsx`
- `src/components/base/weekly-chart.tsx`
- `src/components/base/calendar-grid.tsx`
- `src/components/containers/analytics.tsx`
- `src/pages/journal-page.tsx`
- `src/lib/db/analytics.ts`

Screenshot: `kairos-banner.png` at that commit is a logo, not the timer. The mini-player behavior is the source.

`TimerMiniPlayer` returns null unless a session is running, paused, or complete, and it also returns null on the timer page itself. The bar is one row: progress, phase, task name, clock, pause or resume, and skip or finish. `FocusModeStage` moves with a spring and, when reduced motion is set, jumps to the target. `analytics.tsx` is a dashboard of many stat cards, a score ring, and achievements. That density is not a model for Insights. `journal-page.tsx` is a second journal, and Life Ledger already has one.

### AppFlowy — reference only, AGPL-3.0

No source was copied. The README marketing images on appflowy.com returned 404 at study time. The in-repo frame `doc/imgs/welcome.png` at `5cf3a365` shows a narrow page tree (Me, nested pages, the selected page, Trash, New page) and one document column with a floating format bar. The lesson used here is only that a desktop detail surface stays one column beside the sidebar. Life Ledger already has that sidebar and does not gain an AppFlowy page tree.

### Loop Habit Tracker — reference only, GPL-3.0

No source was copied. Screenshots at `7e993e17`:

- `screenshots/1.png`: habits are rows; the last few days are columns of checks or measured values. One grid, not a card per habit.
- `screenshots/3.png`: one habit’s history is a labeled bar chart over a month calendar of day numbers. The chart and the calendar explain the same history.
- `screenshots/5.png`: best streaks are horizontal bars labeled with a start date, an end date, and the length. Frequency is a separate section.

The lesson is that a score should be readable as a value and a span of days. Life Ledger already computes streaks in its own analytics. Those GPL screens are not an asset source.

## Keep, adapt, reject

| Pattern | Decision | Why |
| --- | --- | --- |
| Actual report header plus one period total and one per-interval average | Adapt | Insights currently stacks every chart. A range sentence and a single active view match `DashboardHeader` and `ReportSummary` without Actual’s currency formatting. |
| Actual `graphType` as one view: line, calendar, bars, or table | Adapt | The habit score table stops being a closed disclosure and becomes the table graph of the same report. |
| Actual navy sidebar and purple totals | Reject | Finance identity. Life Ledger keeps the warm paper sidebar. |
| Actual category ledger and account balances | Reject | Not a habit product. |
| Super Productivity vertical `planner-day` sequence | Adapt | Week stops being a summary list beside a detail card. Each day is a section. The selected day opens its tasks. |
| Super Productivity open tasks, then a scheduled stack led by the time | Adapt | Today splits habits that have `scheduleTime` from habits that do not. Sleep before 23:30 is the seeded example. |
| Super Productivity header focus control whose clock exists only while a session runs | Adapt | The idle toolbar no longer reserves a `25:00` label. |
| Super Productivity focus overlay as the session surface | Keep, already close | The existing focus panel stays the place to choose 25 or 50 and to start. It is not a rail. |
| Super Productivity hour-grid schedule and drag-to-plan | Reject | Too dense, and Life Ledger habits are not freely timed tasks. |
| Memos composer above the timeline | Adapt | Journal timeline gains a quick entry for the selected day, with a visible saved state. |
| Memos month-grouped attachment grid and dashed empty state | Adapt | Photos mode becomes a library grouped by month, not a filtered note list. |
| Memos `resolveVisualGalleryLayout` | Adapt in code | Entry rows and the day panel use the 1 / 2 / 3 / 4 / 2×3+N collage. |
| Memos end-edge day panel | Adapt | Calendar mode keeps the month visible and opens the selected day beside it. |
| Memos `useAutoSave` local draft cache | Reject as code | Notes already persist in `life-ledger-v1`. Copying the protobuf draft cache would be a second store. The visible “Saved” line is enough. |
| Memos tags, comments, and visibility | Reject | Not part of this journal. |
| Kairos mini-player gate: mount only when the session is not idle, and hide it on the timer surface | Adapt in code | A bottom bar appears for pause, resume, finish, and skip while the user is on another view. |
| Kairos summary cards, score ring, Sahara orange, framer-motion | Reject | Decorative analytics and a new motion library. |
| AppFlowy page tree and format bar | Reject | AGPL, and it would add a second navigation model. |
| Loop habit grid, streak bars, and frequency dots | Reject as assets | GPL. The existing heatmap and habit bars already carry the same idea in Life Ledger’s own drawing. |

## Where each adopted pattern lands

| Surface | Change | Source of the idea |
| --- | --- | --- |
| Today | Open list, then a scheduled list with a time gutter. Completed stays a disclosure. | `planner-day.component.html` |
| Focus | Idle control is an icon. A running clock appears in the toolbar only during a session. A mini-player mounts only while the session is running, paused, or finished, and hides while the focus panel is open. | `focus-button.component.html`, `timer-mini-player.tsx` |
| Week | One vertical stack of day sections. Selecting a day expands that day in place. | `planner-plan-view.component.html` |
| Journal | Composer, photo collage on entries, Photos as a month library, Calendar as a month plus a day panel. | `demo.png`, `AttachmentMediaGrid.tsx`, `CalendarView.tsx`, `visualGalleryLayout.ts` |
| Insights | Range line, period total, per-day average, and one of Trend, Calendar, Habits, or Table. | `DashboardHeader.tsx`, `ReportSummary.tsx`, `ReportSidebar.tsx` `graphType` |

## Three implementation patterns

These are the only patterns whose logic is adapted into Life Ledger code. Everything else above is a reimplementation of layout, not a port.

1. **Memos gallery layout.** `resolveVisualGalleryLayout` in `web/src/components/MemoMetadata/Attachment/visualGalleryLayout.ts` at `0d989707f82c33f74bb852edd8965ec88fcf041b`. The count-to-grid rules move into `public/app.js` as a plain function. Tailwind class strings and React components are not copied.
2. **Kairos mini-player gate.** The visibility predicate and the pause / resume / skip / finish grouping in `src/components/layout/timer-mini-player.tsx` at `fb1f18d2237a4da03ff9189ef44174d05bc15beb`. Styling, icons, and the Zustand store are not copied.
3. **Actual report summary range.** The “print start, and print end only when it differs” rule plus the period-total / per-interval-average pair in `packages/desktop-client/src/components/reports/ReportSummary.tsx` at `8e165c0eb6871f05177e0aa8589894c783ef122e`. Financial formatting, privacy blur, and Recharts are not copied.

## Confirmation

No GPL or AGPL code, icons, screenshots, or wording from AppFlowy or Loop Habit Tracker is included in the product. No framework was added to reuse a component.
