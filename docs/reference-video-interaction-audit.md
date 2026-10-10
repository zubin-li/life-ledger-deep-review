# Reference-video interaction audit — Life Ledger 3.2

Source: the 188.7-second dashboard reference (reviewed end to end), the seven contact sheets, `docs/design-dna-dashboard-motion.json`, and `cursor-implementation-brief.md`.

This audit was written before the 3.2 interaction rebuild. It decides what Life Ledger keeps. The reference is a catalogue of six menu systems, not a brand or a layout to paste in.

## Decisions

| # | Reference mechanism | Decision | Life Ledger use |
| --- | --- | --- | --- |
| 1 | Sliding active highlight | **Adopt** | One shared pill in the sidebar moves between Today, Week, Timeline, Review, and Habits. Width follows the icon plus label. Height follows the row. Motion is transform-only (FLIP), 220ms, interruptible. `prefers-reduced-motion` and `.motion-off` place it with no travel. |
| 2 | Inline submenu | **Adapt** | Chevron, staggered children, and a continuity rail are not added to the primary nav. There is no fake nested menu. The same one-open rule applies to real sibling disclosures: Today’s “completed” and “not scheduled” groups. Opening one closes the other. |
| 3 | Hover mega panel | **Adapt the principle, reject the chrome** | No top mega menu. Stable containers stay mounted while their contents change: the 7/30/90 review chart plot, the week selection glide, and the timeline detail surface. |
| 4 | Floating dock | **Reject** | Magnifying dock, neighbor scaling, and a second navigation row would compete with the sidebar. Current state stays on the sliding sidebar pill. Proximity magnification is not used. |
| 5 | Command palette | **Adopt** | `⌘K` / `Ctrl+K` opens a centered palette over a dimmed, blurred scrim. Live filter, match highlighting, arrow keys, Enter, Escape, empty state, focus restore, and reduced motion are required. It reaches views, dates, habits, focus, theme, language, and backup. |
| 6 | Status dots and rolling counts | **Adapt** | A review badge appears only when a recent day has habit completions and no reflection. Entering Review acknowledges it with a shrink. Counts that actually change (today’s progress, the review rate) roll vertically. No decorative breathing loop and no invented alerts. |

## Explicit rejects

- Neon yellow/orange surfaces, demo copy, and the reference’s six simultaneous navigation systems.
- A bottom dock in addition to the sidebar.
- A top mega menu in addition to the sidebar.
- Ambient looping motion. The only repeating signal is the review badge while it is unread; it stops once Review is opened.
- Animating layout properties (`width`, `height`, `top`, `left`, `transition: all`).

## Composition mapping

The 3.1 Today page was two near-equal columns inside an already narrow content pane. That split is retired.

Desktop from 1180px upward, inside the content pane:

- Date and progress span all 12 columns.
- Habits span 7. Mood spans 5.
- Reflection spans 7. Photos span 5.
- The inspector remains the session rail (focus timer, quick check, day detail) at about one third of the workspace, and stacks before text is clipped.

Review reading order:

1. Period control (shared segment indicator, not a rebuilt page).
2. Summary strip.
3. Trend (7) and consistency heatmap (5).
4. Habit comparison across the full width.
5. Monthly reflection editor.
6. One expandable details group for focus history and secondary metrics.

Week and Timeline keep their jobs. The selected day retargets one highlight or one detail surface instead of rebuilding the screen.

## Motion numbers used

- Selection geometry: 220ms, `cubic-bezier(0.25, 1, 0.5, 1)`, with a small overshoot only on the sidebar pill (`cubic-bezier(0.22, 1.12, 0.36, 1)`).
- View enter: 220ms, `cubic-bezier(0.22, 1, 0.36, 1)`, 8px along the navigation direction, opacity only plus transform.
- Palette: 200ms. Exit is the scrim; reduced motion removes travel.
- Press and row feedback stay under 140ms and do not move primary labels.

## Prototype

Static proportion frames, before implementation was locked:

- `docs/prototypes/phase-3-2-proportions.html`
- `docs/prototypes/today-1180.png`
- `docs/prototypes/today-1440.png`
- `docs/prototypes/review-1180.png`
- `docs/prototypes/review-1440.png`
