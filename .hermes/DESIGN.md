# Life Ledger Web — Design language (round 8)

Source of truth for every card and page. Derived from what the user already approved:
the 780b6a1 web shell (habit cards with icon chip + soft corner bubble, mood tiles, dark hero),
the 3.6/858ede8 hairline illustrations (`public/assets/hairline/*.svg`, 1px line art, currentColor + accent),
and the 858ede8 weather card (uPlot hourly curve, scrub to read any hour).

User words this answers: "没有统一的设计语言", "素得要死，跟白板一样", "泡泡感一定要回来",
"每个运动都会有自己的设计稿", "以前配图…都不见了".

## 1. Card anatomy (every card, every page)
```
┌──────────────────────────────────────┐
│ (chip) KICKER                 meta → │  header row: 34px icon chip · kicker 10.5px/650/.06em muted
│        Title (serif)                 │              title Noto Serif SC 600 17–20px · meta right 12px muted
│                                      │
│   content (chart / art / list)       │  content fills the rest; never a lone line of text
│                                ◔     │  bubble: soft identity-colour circle bleeding off bottom-right
└──────────────────────────────────────┘
```
- Surface: `var(--card)`, 1px `var(--line)`, radius 24px (S 22px), shadow `0 12px 38px rgba(29,29,31,.055), inset 0 1px 0 rgba(255,255,255,.85)`; padding 20px (S 16px). Dark theme: existing `--surface-1` / `--edge-soft`.
- **Icon chip**: 34×34 circle, `background: var(--w-soft)`, `color: var(--w-solid)`, 1.8-stroke line icon (same as `.habit-icon`).
- **Bubble** ("泡泡感"): `::after` circle 120px at `right:-34px; bottom:-58px`, `var(--w-soft)` at .55 opacity — exactly the habit-card treatment. L/X cards get a second, smaller bubble.
- Hover: lift 2px + pointer aura (existing `.apple-interactive`).
- Identity colours (reuse app `colors`): weather `blue`, rhythm `sage`, heatmap palette colour, focus `violet`, photos `amber`, wall none (photo is the card), freq = the habit's own colour, progress `sage`, week goals `coral`, streak `amber`.

## 2. Illustrations
- Every empty / idle / done state shows a hairline illustration (from `assets/hairline/`), 96–140px wide, `color: var(--muted)` with `--accent` = identity colour, plus one serif line + one muted line. Never a bare sentence on white.
- Mapping: focus idle→`focus-idle`, paused→`focus-paused`, done→`focus-complete`; photos empty→`photos-day-empty`; wall empty→`empty-photos`; heatmap/rhythm/insights no data→`insights-first-week`; freq none→`empty-habits`; weather no city→`offline-local`; week goals empty→`empty-week-goals`; week all done→`week-all-done`; week review empty→`week-review-empty`; timeline empty→`empty-journal`; calendar empty month→`calendar-empty-month`; perfect day→`calendar-perfect-day`; today all done→`empty-today-done`; habits page empty→`empty-habits`; search empty→`search-empty`.
- Lines draw in once on first show (stroke-dashoffset 320ms), never on re-render; off under reduced motion.

## 3. Data visuals
- **Heatmap** = calendar month of rounded squares (gap 4px, radius 5px), 5 levels of the palette, legend 少→多, today ringed, click a day → day drawer, hover → tooltip "10月12日 · 5/7". S: month grid only (cells square, centred, no legend). M: grid + month label + legend in the header row. L: grid + legend + "最佳 x 天 / 连续 n 天" stats row. It is never a horizontal strip.
- **Rhythm** = 7 rounded bars with value labels, today highlighted, tomorrow hint. S: bars + percentage only.
- **Weather**: S = symbol + big temp + condition + high/low + rain hint. M/L = the same header + the hourly uPlot curve you can scrub (pointer/keys); L also shows hourly chips. Empty only when no city.
- **Frequency**: month grid where a recorded day is a filled circle in the habit colour; header shows "本周 2/3" as a small progress ring.
- Numbers: serif display, tabular.

## 4. Sizes (grid unchanged: S 1×1, M 2×1, L 2×2, W 4×1, X 4×2)
Each card defines what each size shows (above). No size may show only a title and empty space.

## 5. Interaction rules
- Cards are draggable in edit mode from anywhere on the card, including charts (no inner element may swallow the drag).
- Charts react on hover (tooltip) and click (open day); controls never sit permanently on photo cards.
- One accent per card; no new colours.

## 6. Pages beyond Today
Same anatomy for Week, Timeline, Insights, Habits panels: icon chip + kicker + serif title header, bubble, hairline empty states, same radius/shadow. Keep every existing control and behaviour.
