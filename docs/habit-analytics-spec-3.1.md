# Life Ledger 3.1 — habit analytics

All figures come from local logs already on the device. Nothing is inferred, ranked by a model, or fetched.

## Eligible denominator

A slot is one habit that counts toward the daily score on one date that is today or earlier. The numerator is how many of those slots are completed. The rate is `round(completed / eligible * 100)` when `eligible > 0`, otherwise there is no rate.

The previous window is the same number of days immediately before the current window. Both windows stop at today. Future dates are never eligible.

## Windows

The review control offers 7, 30, and 90 days, default 30. The window ends on the cursor day when that day is not in the future, otherwise on today.

## Streaks

For one habit, walk eligible days from oldest to newest. The best streak is the longest run of completed days. The current streak walks backward from today. If today is eligible and not completed, it does not add to the streak and does not break the run that ended yesterday. A missed earlier day ends the current streak.

## Charts

- Four or more points: one sage line, with a dot on the last point. Fewer than four: a compact list of values. No pie, no second line, no animation.
- Weekday pattern: seven horizontal bars, Monday first. A missing weekday is a dash, not a zero painted as failure.
- Per-habit comparison: one horizontal bar per habit, name wraps, rate and `completed/eligible` sit beside it. Color is sage for every bar. The name is the label, so color is not the only encoding.
- Focus minutes appear as one sentence only when the total in the window is greater than zero.

## Empty

If the window has zero eligible slots, the review shows one sentence and no chart. Axis labels stay at least 12px. The inspector uses stacked rows so a long habit name does not share a row with Done and Rate.
