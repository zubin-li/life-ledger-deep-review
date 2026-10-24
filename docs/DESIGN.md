# Life Ledger · card design language

Every new card or panel uses these rules. If it does not fit, change the rule here first.

## Card
- Surface: `.daily-goals-card` (Today) / `--desk-card` (other pages). Radius 22–26 px, 1 px soft border, soft shadow.
- Padding 18–20 px. No inner boxes unless they are tappable.
- **Header = one row**: 26 px tinted icon chip + title (16 px / 600) + optional right-side value or action.
  No kicker line, no divider under the header. The content starts 10 px below.
- **Content fills the card.** Charts stretch to the remaining height; never a small chart in a big empty card.
  If content is short, the card gets shorter; it does not get padding.

## Type
- Page title 22 px / 600. Card title 15–16 px / 600. Body 13–14 px. Caption 11–12 px muted.
- Numbers: 22–30 px / 600, tabular, unit in 13 px muted next to them.
- Every number shown needs a label that says what it counts ("完成 98 次 · 应做 154 次"). No unexplained figures.

## Color
- One tone per module (`--w-solid` / `--w-soft`): weather blue, habits sage, focus violet, photos amber, frequency coral.
- Mood: good #f4a900, calm #1fb76a, low #2f80ed — same everywhere (buttons, calendar, strip, review).
- Change badges: up green, down red-orange, none grey. Always state the unit (百分点 / 小时).

## Motion
- Every card and row: pointer glow + 1 px lift on hover (`decorateMotionSurfaces`), 160–220 ms ease.
- Toggle/check: only the touched element animates. Respect `prefers-reduced-motion`.

## Charts
- Time axes show the whole period with even ticks (weather: 00 / 06 / 12 / 18 / 24).
- "Now" = one dashed vertical line + dot in the module tone. Hover shows a faint guide and the value.
- Empty days are gaps, not zeros.

## Placement
- Appearance (color mode, font) and data (backup, clear device, sample data) live in **Settings**, not the top bar.
- One home per concept: monthly review = 复盘 page only; long-term goals = 长期 page only.
