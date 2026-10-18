# Life Ledger product showcase

[English](SHOWCASE.md) · [简体中文](SHOWCASE.zh-CN.md) · [Deutsch](SHOWCASE.de-DE.md) · [Back to README](../README.md)

Life Ledger brings daily habits, practical planning, and long-form reflection into one local-first workspace. The screenshots below use fictional data created only for demonstration. The 3.6 desk introduces a modular native dashboard: reorderable and collapsible bubble cards across Today and Week, an interactive month habit grid, full week insights, and refined line-art illustrations.

## Desktop experience

16 October, Today only: restored original website colors, a bounded 1236px canvas, square presets and a compact four-habit default. New 1920px/1000px evidence is in the gallery below. These are isolated ordinary-web screenshots, not installed Mac-app acceptance; visual confirmation is still pending.

**Today correction:** [Actual default layout, size/drag recording and checks](local-web/today-repair/index.html). No screenshot-only position overrides. <img src="local-web/today-repair/today-1440-en-light.png" alt="Actual English Today default"><img src="local-web/today-repair/today-390-en-light.png" width="300" alt="Phone reading layout with fictional records">

**Narrow-window correction:** the 800px workspace retains a side-by-side sidebar and a two-row toolbar. [Desktop](local-web/breakpoints/today-800-en-light.png) · [Mobile boundary](local-web/breakpoints/today-760-en-light.png) · [Regression results](local-web/breakpoints/results.json). These are isolated browser checks, not installed macOS acceptance.

**Interactive local web:** [Open the actual local app](http://127.0.0.1:43117/?mode=local&lang=en&preview=local) after `npm run preview:local`. Same card/page source as Tauri; no simulated native titlebar. [Recording and checks](local-web/index.html). Fictional screenshots only; the live local app uses separate browser records.

<img src="local-web/today-en-light.png" alt="English local web sharing the approved desktop workspace" />
<img src="local-web/habits-390-en.png" width="300" alt="English mobile web with accessible Settings" />

**Integrated workspace shell:** [Recording and verification](integrated-shell/index.html). Unified native-overlay row, rounded frame and collapsible sidebar with local profile settings. OS traffic lights are intentionally not imitated in Chromium evidence. Not packaged or installed.

<img src="integrated-shell/today-en-light.png" alt="English integrated desktop frame" />
<img src="integrated-shell/habits-390-en.png" width="300" alt="English mobile layout preserved without desktop titlebar" />

**Horizon / Habits:** [Recording and comparisons](horizon-habits/index.html). A persistent phase focus, dated plan steps, archive snapshots, monthly writing and a consistent habit library. Existing records/icons are reused; fictional examples, not installed.

<img src="horizon-habits/horizon-en-light.png" alt="English Horizon with pinned current phase and area-based plan cards" />
<img src="horizon-habits/habits-en-light.png" alt="English searchable habit library with original icons and effective-date editor" />

**Timeline / Insights review:** [Recording and comparisons](timeline-insights/index.html). One vertical day/week/month axis, text-first reviews and optional weekly photos. Insights shows coverage, explorable trends, original habit icons and separate periodic targets. Fictional data; user approval pending, not installed.

<img src="timeline-insights/insights-en-light.png" alt="English insights with completion, entry coverage and grounded observations" />

**Latest Week / Timeline checkpoint:** [Recording and multilingual comparisons](week-reflection/index.html). Weekly reflection first, read-only connected week calendar, insights/goals; Timeline shows weekly writing and matching photos. Fixed wide greeting and small-square mood replace arbitrary size choices. Calendar/photos below are fictional fixtures, not an installed or user-approved release.

<img src="week-reflection/timeline-en-light.png" alt="Weekly Timeline using existing review data and same-week photo fixtures" />

**Latest Week/shared-shell review:** [Recording and multilingual light/dark screenshots](week-polish/index.html). Seven-day selection, original habit icons, goals and reflection without nested scrolling; Today shares the revised outer surfaces and pointer light. Fictional data, not an installed or user-approved release.

<img src="week-polish/week-en-light.png" alt="Actual Week route with seven-day selection, day details and restored original habit icons" />

**Current review checkpoint — weather and widget library:** [Watch the real interaction recording and compare light/dark screenshots](today-widgets/weather-gallery/index.html). The weather curve has temperature/time axes, pointer and keyboard exploration, and a separate current-weather chip. All 11 existing components appear in an independent catalog; unadded cards no longer occupy the edit grid. This is not an installed release; mood and monthly-heatmap visual revisions remain pending.

<img src="today-widgets/weather-gallery/today-en-light.png" alt="Current Today checkpoint: temperature chart, current-weather chip and independent widget library" />

**Optional widget checkpoint:** Independent mood, eight-level habit heatmap, local photo/GIF/video wall and hourly weather; matching S/M/landscape-L frames plus square L. New widgets start hidden, preserving existing layouts. [Size comparison and limitations](today-widgets/README.md). Weather below is mocked, not live; not packaged or visually approved by the user.

[Watch the actual edit-card recording](today-widgets/edit-cards/index.html): normal cards stay fixed; edit-only per-card settings, full-month heatmap and smaller cells.

<img src="today-widgets/edit-cards/normal-en-light.png" alt="English Today with a monthly heatmap and no resident settings" />

### Today: plan and reflect

<img src="today-web-parity/screens/today-desktop-1440-en-light.png" alt="Today review checkpoint using original habit icons, a cool canvas, and discrete widget sizes" />

Today 2.0 features the modular widget platform: a 12-column responsive grid with summary, habits, calendar, focus, photos, reflection, and context widgets supporting discrete Small, Medium, and Large sizing with zero-easing direct drag, keyboard navigation, and transaction undo.

**Today review checkpoint:** the actual desktop route restores the web palette and catalog icons. Small shows a priority habit; Medium shows four habits across groups; Large keeps the full horizontal rail. Tile clicks check habits and preserve keyboard focus through reordering. The images use fictional data in an isolated headless browser; this checkpoint has not been packaged or visually approved by the user.

### Daily review

<img src="images/demo-preview/en-desktop/en-02-daily-review-v5.png" alt="Daily habit check-ins, mood, and journal drawer" />

Open any past or current calendar day to review habit check-ins, mood, and journal notes without leaving the month.

### Week: commitments and output

<img src="images/demo-preview/en-desktop/en-03-weekly-plan-v5.png" alt="Weekly goals and written output on desktop" />

Weekly goals behave like a reminder list: completed work stays visible as evidence. The output area provides room for a narrative review.

### Review: a written month

<img src="images/demo-preview/en-desktop/en-04-monthly-review-v5.png" alt="Monthly review written as a document, with a short completion trend" />

The month opens with a 7/30/90-day completion rate, streaks, and a trend, then the reflection. Habit scores stay in the inspector. Today is a two-column desk and Timeline keeps the journal page beside the month. Up to three private photos for a day stay on this device.

### Focus: see where the time went

<img src="images/demo-preview/en-desktop/en-05-focus-month-v5.png" alt="Monthly focus-time analytics on desktop" />

Compare focus minutes by topic and see the month as a heatmap, without reducing progress to session counts.

### Timeline: revisit lived days

<img src="images/demo-preview/en-desktop/en-07-timeline-v5.png" alt="Mood, reflection, and private photo memories on the Life Ledger Timeline" />

Move through a private chronological record of moods, reasons, journal context, and compressed photo memories. The example data and image are fictional.

### Habits: rules that can evolve

<img src="images/demo-preview/en-desktop/en-06-habit-settings-v5.png" alt="Habit settings on desktop" />

Habits can use daily, weekly, or monthly rules, include or exclude themselves from the daily score, and change from an effective date without rewriting history.

## Mobile experience

<img src="horizon-habits/longrange-390-en.png" width="390" alt="English mobile Horizon with a compact pinned phase" />

<img src="timeline-insights/timeline-390-en.png" width="390" alt="English mobile vertical weekly timeline" />

The mobile layout uses persistent bottom navigation and turns the daily drawer into a focused, full-height review.

<table>
  <tr>
    <td width="33%"><img src="today-web-parity/screens/today-mobile-390-en-light.png" alt="Daily planning on mobile" /></td>
    <td width="33%"><img src="images/demo-preview/en-mobile/en-02-daily-review-v5.png" alt="Daily review on mobile" /></td>
    <td width="33%"><img src="images/demo-preview/en-mobile/en-03-weekly-plan-v5.png" alt="Weekly plan on mobile" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Today</strong></td>
    <td align="center"><strong>Daily review</strong></td>
    <td align="center"><strong>Week</strong></td>
  </tr>
  <tr>
    <td width="33%"><img src="images/demo-preview/en-mobile/en-04-monthly-review-v5.png" alt="Monthly review on mobile" /></td>
    <td width="33%"><img src="images/demo-preview/en-mobile/en-05-focus-month-v5.png" alt="Focus review on mobile" /></td>
    <td width="33%"><img src="images/demo-preview/en-mobile/en-06-habit-settings-v5.png" alt="Habit settings on mobile" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Review</strong></td>
    <td align="center"><strong>Focus</strong></td>
    <td align="center"><strong>Habits</strong></td>
  </tr>
</table>

<p align="center">
  <img src="images/demo-preview/en-mobile/en-07-timeline-v5.png" width="33%" alt="Life Ledger Timeline on mobile" />
</p>
<p align="center"><strong>Timeline</strong> · Mood, context, and photo memories remain readable on a small screen.</p>

## Continue

- [Use Life Ledger now](https://zubin-li.github.io/life-ledger-deep-review/?mode=local&lang=en)
- [Self-host on Cloudflare](self-hosting.md)
- [Configure Cloudflare Access](cloudflare-access.md)
