import test from "node:test";
import assert from "node:assert/strict";
import {
  WIDGET_SCHEMA_VERSION,
  WIDGET_MAX_HABITS,
  widgetMutationId,
  buildWidgetSnapshotFromHabits,
  planMutationApplication,
} from "../public/widget-contract.js";

// These tests import and execute the real widget-bridge logic (not source-string assertions).

test("widgetMutationId is deterministic and distinguishes desired state", () => {
  const on = widgetMutationId("exercise", "2026-09-29", true);
  const off = widgetMutationId("exercise", "2026-09-29", false);
  assert.equal(on, widgetMutationId("exercise", "2026-09-29", true));
  assert.notEqual(on, off);
});

test("buildWidgetSnapshotFromHabits marks completed habits done and bounds the habit list", () => {
  const habits = Array.from({ length: WIDGET_MAX_HABITS + 3 }, (_, i) => ({
    id: `habit-${i}`,
    name: `Habit ${i}`,
    icon: "target",
    color: "sage",
    countsTowardDaily: true,
  }));
  const completedIds = ["habit-0", "habit-2"];
  const snapshot = buildWidgetSnapshotFromHabits(habits, completedIds, {
    date: "2026-09-29",
    timezone: "UTC",
    revision: 5,
    scoredTotal: habits.length,
    scoredCompleted: completedIds.length,
    now: 1_700_000_000_000,
  });
  assert.equal(snapshot.schemaVersion, WIDGET_SCHEMA_VERSION);
  assert.equal(snapshot.date, "2026-09-29");
  assert.equal(snapshot.revision, 5);
  assert.equal(snapshot.updatedAt, 1_700_000_000_000);
  assert.equal(snapshot.completedCount, 2);
  assert.equal(snapshot.totalCount, habits.length);
  assert.equal(snapshot.habits.length, WIDGET_MAX_HABITS, "habit list must be bounded to WIDGET_MAX_HABITS");
  assert.equal(snapshot.habits[0].done, true);
  assert.equal(snapshot.habits[1].done, false);
  assert.equal(snapshot.habits[2].done, true);
});

test("buildWidgetSnapshotFromHabits never leaks fields beyond the fixed contract shape", () => {
  const habits = [{ id: "exercise", name: "Exercise", icon: "running", color: "coral", countsTowardDaily: true }];
  const snapshot = buildWidgetSnapshotFromHabits(habits, ["exercise"], {
    date: "2026-09-29", timezone: "UTC", revision: 1, scoredTotal: 1, scoredCompleted: 1,
  });
  const habitKeys = Object.keys(snapshot.habits[0]).sort();
  assert.deepEqual(habitKeys, ["color", "countsTowardDaily", "done", "icon", "id", "name"]);
  // Explicitly guard against notes/mood-reason style fields ever slipping into the widget payload.
  for (const forbidden of ["note", "notes", "moodReason", "journal", "text"]) {
    assert.ok(!(forbidden in snapshot.habits[0]), `must not contain ${forbidden}`);
    assert.ok(!(forbidden in snapshot), `must not contain ${forbidden}`);
  }
});

test("planMutationApplication only applies mutations whose desired state differs from current (idempotent)", () => {
  const currentlyDone = new Set(["exercise"]);
  const isHabitDoneOnDate = habitId => currentlyDone.has(habitId);
  const pending = [
    { habitId: "exercise", date: "2026-09-29", desiredDone: true }, // already true: no-op, still acked
    { habitId: "reading", date: "2026-09-29", desiredDone: true }, // needs applying
  ];
  const { toApply, ackIds } = planMutationApplication(pending, isHabitDoneOnDate);
  assert.equal(toApply.length, 1);
  assert.equal(toApply[0].habitId, "reading");
  assert.equal(ackIds.length, 2, "both a no-op and a real change must be acknowledged");
});

test("planMutationApplication is safe to run twice in a row without double-applying (replay safety)", () => {
  const log = new Set();
  const isHabitDoneOnDate = habitId => log.has(habitId);
  const pending = [{ habitId: "exercise", date: "2026-09-29", desiredDone: true, mutationId: "exercise#2026-09-29#true" }];

  const first = planMutationApplication(pending, isHabitDoneOnDate);
  assert.equal(first.toApply.length, 1);
  // Simulate applying it exactly once.
  log.add("exercise");

  // A retried/duplicate delivery of the SAME pending list must now be a pure no-op.
  const second = planMutationApplication(pending, isHabitDoneOnDate);
  assert.equal(second.toApply.length, 0);
  assert.equal(second.ackIds.length, 1);
});

test("planMutationApplication skips structurally invalid entries and does not acknowledge them", () => {
  const pending = [
    { habitId: "", date: "2026-09-29", desiredDone: true },
    { habitId: "exercise", date: "", desiredDone: true },
    { habitId: "exercise", date: "2026-09-29", desiredDone: "yes" },
    { habitId: "exercise", date: "2026-09-29" },
    null,
    undefined,
  ];
  const { toApply, ackIds } = planMutationApplication(pending, () => false);
  assert.equal(toApply.length, 0);
  assert.equal(ackIds.length, 0);
});

test("planMutationApplication falls back to the deterministic mutationId when the queue entry omits one", () => {
  const pending = [{ habitId: "exercise", date: "2026-09-29", desiredDone: true }];
  const { toApply } = planMutationApplication(pending, () => false);
  assert.equal(toApply[0].mutationId, widgetMutationId("exercise", "2026-09-29", true));
});

test("planMutationApplication trusts an explicit mutationId when present, even if unusual", () => {
  const pending = [{ habitId: "exercise", date: "2026-09-29", desiredDone: true, mutationId: "custom-id-123" }];
  const { toApply, ackIds } = planMutationApplication(pending, () => false);
  assert.equal(toApply[0].mutationId, "custom-id-123");
  assert.deepEqual(ackIds, ["custom-id-123"]);
});

test("planMutationApplication handles an empty or missing pending list without throwing", () => {
  assert.deepEqual(planMutationApplication([], () => false), { toApply: [], ackIds: [] });
  assert.deepEqual(planMutationApplication(undefined, () => false), { toApply: [], ackIds: [] });
});
