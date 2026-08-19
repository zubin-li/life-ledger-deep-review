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
