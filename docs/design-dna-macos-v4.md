# Life Ledger 4.0 — applied design DNA

This file is the contract for the desktop window (`html[data-desktop]`). Every token below is a custom property or a rule in `public/styles.css`, `desktop/launcher.css`, or the Tauri window chrome. If a token is not in CSS, it is not part of the product.

## 1. Palette, surfaces, contrast

Light (`:root` and `html[data-desktop]`):

| Token | Value | Use |
| --- | --- | --- |
| `--ink` / `--label` | `#1c1914` | Primary text. Body copy on `--paper` is about 12:1. |
| `--muted` / `--secondaryLabel` | `#6d675e` | Secondary text, captions. About 5:1 on `--paper`. |
| `--tertiaryLabel` | `#8a8174` | Empty notes, autosave. |
| `--paper` / `--surface-0` | `#f3eee4` | Window canvas. |
| `--surface-1` / `--card` | `#fbf7f0` | Week columns, habit rows, inspector. |
| `--surface-2` | `#e7e0d2` | Inset wells. |
| `--surface-3` | `#ddd4c4` | Pressed / track. |
| `--sheet` | `#fffdf8` | Today’s writing sheet and the Timeline page. |
| `--sidebar-ink` | `#241f1a` | Source sidebar. |
| `--sidebar-ink-text` | `#f4efe6` | Sidebar titles. On ink, about 13:1. |
| `--sidebar-ink-muted` | `#cfc6b8` | Sidebar nav. On ink, about 9:1. |
| `--accent` / `--controlAccent` | `#8c3d2f` | Selection, today mark, primary chrome. White label on this fill is about 7:1. |
| `--sage` | `#3f6b56` | Habit “done” when a habit has no own color. |
| `--separator` | `rgba(28, 25, 20, 0.14)` | Hairlines. |
| `--selectedContentBackground` | `#f0e2d4` | Selected week column and habit row. |

Dark (`html[data-theme="dark"][data-desktop]`): canvas `#141210`, sheet `#1c1916`, ink sidebar `#100e0c`, text `#f3eee4`, accent `#e0a090`, selection `#3a2b26`. The sidebar stays darker than the canvas in both themes.

No gradients, grain, or backdrop blur on chrome. Elevation is only `--shadow-popover` and `--shadow-dialog`.

## 2. Type

System UI stack: `--font-display` and `--font-body` (SF Pro / PingFang / Segoe). No web font.

| Token | Size / leading | Weight | Where |
| --- | --- | --- | --- |
| `--text-caption` | 11 / 1.35 | 600 | Sidebar group, kicker |
| `--text-secondary` | 12 / 1.4 | 400–500 | Meta, week notes |
| `--text-body` | 13 / 1.45 | 400–600 | Controls, habit names |
| `--text-section` | 15 / 1.3 | 600 | Inspector headings that are not the page title |
| `--text-title` | 32 / 1.05 | 560 | Habits summary |
| `--text-mast` | 44 / 0.96 | 560 | Today’s date |
| Review month | 46 / 1.02 | 560 | `#reviewTitle` |
| Timeline empty / detail | 34–36 / 1.05 | 560 | `.timeline-detail-empty`, `.timeline-detail-date` |
| Week column date | 20 / 1.1 | 560 | `.week-agenda-date` |
| Week lede | 22 / 1.15 | 560 | `#weekPlanLede` |

Tracking: mast `-0.045em`, kickers `0.14em` uppercase. Tabular figures stay on for counts.

## 3. Space, density, split

4px grid: `--space-1` 4 through `--space-8` 32. Desktop content padding is 0 on Today, Week, and Timeline so the sheet and columns reach the pane edge; the rail and sheet pad themselves by 22px.

| Region | Size |
| --- | --- |
| Sidebar | `--sidebar-width: 196px` |
| Inspector | `--inspector-width: 272px` |
| Toolbar | 52px, drag region, traffic-light inset `--desktop-inset: 38px` plus 78px leading padding |
| Today split | `minmax(0, 1.15fr) minmax(280px, 360px)` |
| Timeline split | `minmax(0, 1fr) 292px`, journal first |
| Review measure | max-width 680px, centered |
| Week | `repeat(7, minmax(0, 1fr))`, goals capped at 132px |

At 980–1179 the Today sheet narrows to 240–300px and the Timeline rail to 240px. Below 980 the desktop window is not the target; the web layout stacks.

## 4. Controls

- Sidebar nav: 28px row, transparent, active state is `rgba(255,255,255,.08)` plus a 2px cream inset bar. Not a filled white pill.
- Buttons: 28px min height, radius `--radius-control` 6px. Primary fill is `--ink` in light and `--accent` in dark. Press is a background change within `--motion-button` (140ms).
- Habit check: 24px circle. Fill uses the habit color in `--duration-habit-check` (140ms). No layout animation.
- Lists: habit library rows are 56px, 10px radius, hairline border, 8px gap. The column header is `display: none` on desktop.
- Sheets: Today’s right column and the Timeline page use `--sheet`. Textareas on the sheet are borderless until focus, then a hairline.
- Popovers and menus: `--radius-popover` 12px, `--shadow-popover`, enter `--duration-popover` 160ms, `var(--ease-enter)`.
- Toolbar search: 200×28, hairline, no pill.
- Focus ring: 2px accent, offset 2px, on `:focus-visible` only.
- Disabled: opacity .4 on the inspector toggle; launcher buttons use `.choice-button:disabled { opacity: .6 }`.
- Loading / empty / error: Timeline empty is the 34px prompt on the sheet. Photo empty is a sentence inside `.photo-drop`. Photo errors use `.mood-photo-status`. There is no decorative empty illustration.

## 5. Icons, selection, motion

Icons are the existing 16–18px stroke set, `currentColor`, 1.6–1.8px. The sidebar mark is a 28px cream tile with the letter L.

Motion tokens:

- `--motion-button` 140ms, `--duration-habit-check` 140ms — button and check feedback.
- `--motion-popover` / `--duration-popover` 160ms — menus.
- `--motion-panel` / `--duration-inspector` 240ms — inspector and split.
- `--duration-date-shift` 160ms — date change, opacity + translate only.
- `--ease-enter: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-move: cubic-bezier(0.25, 1, 0.5, 1)`.
- Keyboard navigation adds `html.motion-off` and skips the view animation.
- `prefers-reduced-motion` collapses animation and transition duration to .01ms.
- Drag follows the pointer; only the release settles. No `transition: all`. No width/height/top/left transitions on the desktop shell rules.

## 6. Mood and voice

Calm, precise, editorial, dense. The window should read as a desk: dark source list, paper canvas, one writing sheet. Not a dashboard, not a marketing page. Brand voice in the UI is short and specific (“0 of 7 done”, “No photo for this day yet”). No slogans in the work area.

The launcher uses the same ink column and paper field (`desktop/launcher.css`), with the version set in 28px type.

## 7. Effects

Advanced effects are off. No WebGL, particles, grain, glass, or decorative gradients. The only motion is opacity, transform, and color/background on the tokens above.

## 8. What 4.0 removed from the first viewport

- The light gray sidebar and the small inline date header.
- Today as one scrolling stack (habits, then mood, then writing).
- Week as a vertical agenda of rows.
- Timeline with the calendar on the left and a one-line prompt on the right.
- Review’s 15px month label.
- The Habits table header (Name / Target / Active).
