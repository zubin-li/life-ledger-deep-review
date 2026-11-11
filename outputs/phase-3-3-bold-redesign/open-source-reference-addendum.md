# Life Ledger 3.3 — Open-Source Reference and Reuse Addendum

This document extends the existing Phase 3.3 redesign brief. It is mandatory, not optional. Before continuing implementation, study the referenced products at the level of real screenshots, interaction flows, and source files. The goal is to borrow proven product structure and implementation patterns while preserving Life Ledger's own warm, restrained macOS identity.

## License boundary

Life Ledger is MIT-licensed.

- Code may only be copied or adapted from permissive sources compatible with MIT, such as MIT, Apache-2.0, or BSD.
- GPL/AGPL projects are visual and interaction references only. Do not copy their code, assets, icons, or text.
- Do not import an entire framework or dependency merely to reuse one pattern. Translate useful patterns into the existing vanilla JavaScript/CSS/Tauri architecture.
- For every copied or meaningfully adapted permissive implementation, record the source repository, pinned commit SHA, original file path, license, and the adapted Life Ledger file in `THIRD_PARTY_NOTICES.md`. Preserve any required copyright/license notice.
- Prefer learning and reimplementation over wholesale copying. Reuse at most three tightly scoped implementation patterns.

## Priority reference matrix

### P1 — Insights and reporting: Actual Budget

- Repository: https://github.com/actualbudget/actual
- License: MIT
- Product maturity: high
- Inspect:
  - `packages/desktop-client/src/components/reports/DashboardHeader.tsx`
  - `packages/desktop-client/src/components/reports/ReportSidebar.tsx`
  - `packages/desktop-client/src/components/reports/ReportSummary.tsx`
  - `packages/desktop-client/src/components/reports/graphs/LineGraph.tsx`
  - `packages/desktop-client/src/components/reports/graphs/BarGraph.tsx`
  - `packages/desktop-client/src/components/reports/graphs/CalendarGraph.tsx`
  - `packages/desktop-client/src/components/reports/graphs/tableGraph/`
  - `packages/component-library/src/themes/sidebar-redesign-light.css`
- Learn/reuse: report range/header hierarchy, concise summary metrics, chart labeling, empty states, chart/table fallback, desktop sidebar behavior.
- Do not copy Actual's finance-specific visual identity.

### P1 — Today, Week, Focus, and completion flows: Super Productivity

- Repository: https://github.com/super-productivity/super-productivity
- License: MIT
- Product maturity: high
- Inspect:
  - `src/app/core-ui/main-header/focus-button/`
  - `src/app/features/focus-mode/`
  - `src/app/features/metric/activity-heatmap/`
  - `src/app/features/metric/reflection-note/`
  - `src/app/features/planner/planner-day/`
  - `src/app/features/planner/planner-calendar-nav/`
  - `src/app/features/planner/planner-plan-view/`
  - `src/app/features/schedule/schedule-day-panel/`
- Learn/reuse: task-first Today structure, compact focus entry/mini-player, clear running-state transitions, completion feedback and undo, week/day planning, useful heatmap and reflection placement.
- Do not reproduce its dense power-user appearance.

### P1 — Journal, photos, timeline, and calendar: Memos

- Repository: https://github.com/usememos/memos
- License: MIT
- Product maturity: high
- Inspect:
  - `web/src/components/AppSidebar/`
  - `web/src/components/ActivityCalendar/`
  - `web/src/components/CalendarView/`
  - `web/src/components/AttachmentLibrary/`
  - `web/src/components/MemoPanel/`
  - `web/src/components/MemoDetailSidebar/`
  - `web/src/components/MemoMetadata/Attachment/`
  - `web/src/components/MemoEditor/hooks/useAutoSave.ts`
- Learn/reuse: journal timeline/list-detail model, calendar navigation, photo/attachment affordances, progressive detail panels, autosave visibility, useful empty states.
- The Journal must make photo memories a real, visible workflow rather than a decorative button.

### P2 — Stack-adjacent timer and analytics patterns: Kairos Pomodoro

- Repository: https://github.com/shakibdshy/Kairos-Pomodoro
- License: MIT
- Product maturity: low; use as a technical pattern reference, not a design authority
- Inspect:
  - `src/components/layout/timer-mini-player.tsx`
  - `src/components/base/focus-summary-bar.tsx`
  - `src/components/timer/focus-mode-stage.tsx`
  - `src/components/base/weekly-chart.tsx`
  - `src/components/base/calendar-grid.tsx`
  - `src/components/containers/analytics.tsx`
  - `src/pages/journal-page.tsx`
  - `src/lib/db/analytics.ts`
- Learn/reuse selectively: Tauri-friendly timer state, mini-player structure, local analytics query boundaries, calendar grid logic.

## Reference-only products

These may inform information architecture and interaction but are not code sources:

- AppFlowy: https://github.com/AppFlowy-IO/AppFlowy — AGPL-3.0; study desktop navigation, detail panes, and panel behavior only.
- Loop Habit Tracker: https://github.com/iSoron/uhabits — GPL-3.0; study habit scoring, streak semantics, and progress explanation only.

## Required design mapping

The redesign must combine lessons by product surface rather than imitate one generic dashboard:

1. **Today:** habit-first scanning and completion, inspired by Super Productivity's task clarity. Focus becomes a compact contextual control or mini-player; it must not occupy a permanent right rail.
2. **Week:** planning and review should use a strong time axis and clear day grouping, not a grid of interchangeable cards.
3. **Journal:** use a Memos-like timeline/list-detail flow with visible photo memories, quick entry, calendar access, autosave, and meaningful empty states.
4. **Insights:** use Actual Budget's report discipline: range control, summary strip, legible time-series/heatmap/bar views, and drill-down details without compressed labels.
5. **Motion:** transitions must communicate state change—completion, undo, focus start/pause/finish, panel expansion, time-range change, and navigation hierarchy. Avoid ornamental motion that does not explain an action.
6. **macOS fit:** retain native-feeling density, typography, keyboard behavior, toolbar/sidebar hierarchy, reduced-motion support, and graceful resizing.

## Required study artifact

Before major implementation continues, add `docs/phase-3-3-open-source-study.md` to the branch containing:

- The pinned commit SHA and license for every repository actually inspected.
- Links to the exact source files and screenshots/demos studied.
- A concise keep/adapt/reject decision for each pattern.
- A mapping from each adopted pattern to the Life Ledger screen/component it changes.
- The maximum three implementation patterns selected for actual code adaptation.
- Explicit confirmation that no GPL/AGPL code or assets were copied.

## Acceptance contract

- A reviewer can point to a visible structural change in Today, Week, Journal, and Insights—not merely new colors, shadows, labels, or micro-animations.
- Every adopted open-source pattern is traceable to a repository, pinned commit, exact path, and license.
- Today no longer uses the four-zone card grid or permanent Focus right rail.
- Journal has a complete photo-memory workflow and useful list/detail/calendar behavior.
- Insights remain readable at supported window sizes and include meaningful automatic habit statistics.
- Focus controls occupy space only when relevant and have coherent start, running, pause, completion, cancellation, and undo feedback.
- Motion is consistent, interruptible, reduced-motion aware, and tied to user intent.
- The existing data remains migratable; the old web layout is not treated as a visual constraint.
- The result is verified in the cloud with build/tests and fresh screenshots/video before publishing to the branch.
