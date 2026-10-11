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

First run, all done, empty journal, empty photos, insights with no completions in the chart, focus idle, focus just completed, focus paused, focus cancelled, empty week goals, journal day with no reflection yet, backup success, search with no matches, offline. A working list does not get a decoration.

## 3.5.1 changes

- `focus-paused.svg`: Quiet paused clock dial with balanced hour ticks and parallel accent pause strokes (`M76 52v16M84 52v16`) on layer 3. Mounted in `#focusIdleHairline` when a running focus session is paused.
- `focus-cancelled.svg`: Quiet resting clock dial with a calm horizontal baseline (`M68 60h24`) and an accent neutral indicator. Mounted when a focus session is cancelled.
- `empty-week-goals.svg`: Quiet checklist clipboard with an accent top clip (`M72 32V26h16v6`). Mounted in `#weeklyGoalList` when the week has no planned goals.
- `journal-no-reflection.svg`: Quiet dual-page ledger with faint ruled lines and an accent quill/pen stroke (`M96 76l14-14`). Mounted in the day detail sheet when no reflection note has been written for that date.
- `focus-complete.svg`: Enhanced clock face with dial tick marks and an accent minute echo tick (`circle cx="72" cy="40" r="1.5"` with `[data-minute-echo]`) echoing the recorded focus duration.

