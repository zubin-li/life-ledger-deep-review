import test from "node:test";
import assert from "node:assert/strict";
import "../public/focus-timer.js";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const inertScheduler = {
  setInterval: () => 1,
  clearInterval: () => {},
};

test("focus timer survives reload and reconciles elapsed background time", () => {
  const storage = new MemoryStorage();
  let now = Date.UTC(2026, 7, 19, 8, 0, 0);
  const completed = [];
  const create = callbacks => globalThis.LifeLedgerFocusTimer.createTimer({
    storage,
    storageKey: "focus-test",
    now: () => now,
    ...inertScheduler,
    ...callbacks,
  });

  const first = create({});
  first.start({ date: "2026-08-19", durationMinutes: 25, breakMinutes: 5, label: "Write analysis" });
  now += 5 * 60_000;
  first.pause();
  assert.equal(first.snapshot().remainingMs, 20 * 60_000);

  const restored = create({ onFocusComplete: session => completed.push(session) });
  restored.initialize();
  assert.equal(restored.snapshot().status, "paused");
  restored.resume();
  now += 20 * 60_000;
  restored.reconcile();

  assert.equal(completed.length, 1);
  assert.equal(completed[0].actualMinutes, 25);
  assert.equal(restored.snapshot().phase, "break");
  assert.equal(restored.snapshot().status, "ready");
});

test("break completion clears active timer and an early finish records invested time", () => {
  const storage = new MemoryStorage();
  let now = Date.UTC(2026, 7, 19, 9, 0, 0);
  const phases = [];
  const completed = [];
  const timer = globalThis.LifeLedgerFocusTimer.createTimer({
    storage,
    now: () => now,
    ...inertScheduler,
    onFocusComplete: session => completed.push(session),
    onPhaseComplete: phase => phases.push(phase),
  });

  timer.start({ date: "2026-08-19", durationMinutes: 50, breakMinutes: 10 });
  now += 12 * 60_000;
  timer.endFocus("finishedEarly");
  assert.equal(completed[0].actualMinutes, 12);
  assert.equal(completed[0].outcome, "finishedEarly");
  assert.equal(timer.snapshot(), null);

  timer.start({ date: "2026-08-19", durationMinutes: 1, breakMinutes: 1 });
  now += 60_000;
  timer.reconcile();
  timer.startBreak();
  now += 60_000;
  timer.reconcile();
  assert.equal(timer.snapshot(), null);
  assert.deepEqual(phases.slice(-2), ["focus", "break"]);
});

test("focus transition table follows explicit state model", () => {
  const { focusTransition, FOCUS_TRANSITIONS } = globalThis.LifeLedgerFocusTimer;
  assert.ok(focusTransition, "focusTransition must be exported");
  assert.ok(FOCUS_TRANSITIONS, "FOCUS_TRANSITIONS table must be exported");

  // Idle state transitions
  assert.equal(focusTransition("idle", "start"), "running");
  assert.equal(focusTransition("idle", "toggle"), "running");
  assert.equal(focusTransition("idle", "pause"), "idle");
  assert.equal(focusTransition("idle", "finish"), "idle");

  // Running state transitions
  assert.equal(focusTransition("running", "pause"), "paused");
  assert.equal(focusTransition("running", "toggle"), "paused");
  assert.equal(focusTransition("running", "finish"), "completed");
  assert.equal(focusTransition("running", "complete"), "completed");
  assert.equal(focusTransition("running", "cancel"), "cancelled");
  assert.equal(focusTransition("running", "skip"), "cancelled");
  assert.equal(focusTransition("running", "start"), "running");

  // Paused state transitions
  assert.equal(focusTransition("paused", "resume"), "running");
  assert.equal(focusTransition("paused", "toggle"), "running");
  assert.equal(focusTransition("paused", "finish"), "completed");
  assert.equal(focusTransition("paused", "complete"), "completed");
  assert.equal(focusTransition("paused", "cancel"), "cancelled");
  assert.equal(focusTransition("paused", "skip"), "cancelled");
  assert.equal(focusTransition("paused", "pause"), "paused");

  // Completed state transitions
  assert.equal(focusTransition("completed", "undo"), "idle");
  assert.equal(focusTransition("completed", "reset"), "idle");
  assert.equal(focusTransition("completed", "start"), "running");
  assert.equal(focusTransition("completed", "toggle"), "running");
  assert.equal(focusTransition("completed", "pause"), "completed");

  // Cancelled state transitions
  assert.equal(focusTransition("cancelled", "reset"), "idle");
  assert.equal(focusTransition("cancelled", "start"), "running");
  assert.equal(focusTransition("cancelled", "toggle"), "running");

  // Default / invalid arguments
  assert.equal(focusTransition(undefined, "start"), "running");
  assert.equal(focusTransition(null, "start"), "running");
  assert.equal(focusTransition("running", "invalid_event"), "running");
});
