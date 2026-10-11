# Hairline illustration system

Life Ledger drawings are local SVG. They are not a second visual language and they are not copied from another project.

## Grid and stroke

- View box `0 0 160 120`.
- Stroke width `1`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `vector-effect="non-scaling-stroke"`.
- Ink is `currentColor`. One accent only, on layer 3: `stroke="var(--accent, #4f7a64)"`.
- No fill, no second accent, no shadow, no embedded image, no script, no remote URL.

## Three layers

1. Ground or container. The thing the subject sits on or inside.
2. The subject.
3. One accent that tells the state (a mark, a sun, a check, a growing leaf).

The subject stays inside x 36–124 and y 28–96. Nothing floats in a distant corner. Two drawings that mean different things must not share the same silhouette.

## Size tokens

| Token | Width | Use |
| --- | --- | --- |
| `is-inline` | 72px | Settings and status lines |
| `is-mark` | 128px | Today header, beside the weekday |
| `is-empty` | 160px | Empty and all-done states |
| `is-hero` | 200px | Launcher choice, and nowhere else |

## State

- Today-done plant: `[data-streak="short"|"mid"|"long"]` hides or shows `[data-growth]` leaves. Short is the sprout. Long adds the upper leaves. Counts are not padded.
- Week goals drawing: `[data-filled="0"…"7"]` raises opacity on that many `[data-bar]` strokes. Zero stays faint. The number is the count of days in the open week that already have a completion.

## Where a drawing is allowed

First run, all done, empty journal, empty photos, insights with no completions in the chart, focus idle, focus just completed, backup success, search with no matches, offline. A working list does not get a decoration.
