// Pure, DOM-free logic shared between the Life Ledger web app and its macOS desktop widget
// bridge. Kept dependency-free and side-effect-free (besides `Date.now()`/`window` self-attach)
// so it can be exercised directly by `node:test` (see tests/widget-contract.test.mjs) as real
// executed logic, not source-string assertions — and so the exact same functions run in the
// browser via the `window.LifeLedgerWidgetContract` global this module attaches itself to.
//
// This file intentionally knows nothing about `localStorage`, Tauri, or the DOM: every input it
// needs (today's habits, which ids are completed, the pending mutation list) is passed in by the
// caller (public/app.js), which owns all of that state.

export const WIDGET_SCHEMA_VERSION = 1;
export const WIDGET_MAX_HABITS = 8;

/**
 * Deterministic mutation id: re-submitting the same (habit, date, desired state) triple always
 * produces the same id, so a duplicate widget tap or an intent retry can never be mistaken for a
 * second, distinct mutation.
 */
export function widgetMutationId(habitId, date, desiredDone) {
  return `${habitId}#${date}#${desiredDone}`;
}

/**
 * Builds the safe "today" snapshot payload the app publishes for the widget to read.
 *
 * @param {Array<{id:string,name:string,icon:string,color:string,countsTowardDaily:boolean}>} habitsForDate
 *   Already-resolved active habits for `date`, in display order. Caller must exclude any
 *   free-text fields (notes, mood reasons) — this function only reads the fields listed above.
 * @param {string[]} completedIds Habit ids currently marked complete for `date`.
 * @param {{date:string,timezone:string,revision:number,scoredTotal:number,scoredCompleted:number,maxHabits?:number,now?:number}} meta
 */
export function buildWidgetSnapshotFromHabits(habitsForDate, completedIds, meta) {
  const { date, timezone, revision, scoredTotal, scoredCompleted, maxHabits = WIDGET_MAX_HABITS, now = Date.now() } = meta || {};
  const completedSet = new Set(completedIds || []);
  const habits = (habitsForDate || []).slice(0, maxHabits).map(habit => ({
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    done: completedSet.has(habit.id),
    countsTowardDaily: Boolean(habit.countsTowardDaily),
  }));
  return {
    schemaVersion: WIDGET_SCHEMA_VERSION,
    date,
    timezone,
    revision,
    updatedAt: now,
    completedCount: scoredCompleted,
    totalCount: scoredTotal,
    habits,
  };
}

/**
 * Decides which pending widget mutations actually need to be applied to app state, and which
 * mutation ids are safe to acknowledge (removed from the pending queue) afterward.
 *
 * Idempotency lives here: a mutation whose desired state already matches the current log is
 * *not* re-applied (so it can never double-toggle), but it is still acknowledged, so a stale or
 * already-satisfied entry doesn't sit in the queue forever. A structurally invalid entry is
 * skipped and left un-acknowledged, so a future corrected republish can still supersede it
 * instead of it being silently discarded.
 *
 * @param {Array<{habitId?:string,date?:string,desiredDone?:boolean,mutationId?:string}>} pendingMutations
 * @param {(habitId: string, date: string) => boolean} isHabitDoneOnDate
 */
export function planMutationApplication(pendingMutations, isHabitDoneOnDate) {
  const toApply = [];
  const ackIds = [];
  for (const mutation of pendingMutations || []) {
    const habitId = mutation?.habitId;
    const date = mutation?.date;
    const desiredDone = mutation?.desiredDone;
    if (typeof habitId !== "string" || !habitId || typeof date !== "string" || !date || typeof desiredDone !== "boolean") {
      continue;
    }
    const mutationId = typeof mutation.mutationId === "string" && mutation.mutationId
      ? mutation.mutationId
      : widgetMutationId(habitId, date, desiredDone);
    const currentlyDone = Boolean(isHabitDoneOnDate(habitId, date));
    if (currentlyDone !== desiredDone) {
      toApply.push({ habitId, date, desiredDone, mutationId });
    }
    ackIds.push(mutationId);
  }
  return { toApply, ackIds };
}

if (typeof window !== "undefined") {
  window.LifeLedgerWidgetContract = {
    WIDGET_SCHEMA_VERSION,
    WIDGET_MAX_HABITS,
    widgetMutationId,
    buildWidgetSnapshotFromHabits,
    planMutationApplication,
  };
}
