import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { ANDROID_TODAY_CLOCK_SOURCE } from "../scripts/android-prepare.mjs";

process.env.TZ = "Europe/Berlin";

function clockHarness(start = "2026-11-16T09:00:00+01:00") {
  let now = new Date(start).getTime();
  let nextId = 0;
  const timers = new Map();
  const listeners = {};
  const selections = [];
  let renders = 0;
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const addListener = (type, callback) => { listeners[type] = callback; };
  const context = {
    Date: ClockDate,
    isoDate,
    selectedPlanningDate: isoDate(new Date(now)),
    androidDemoActive: false,
    document: { visibilityState: "visible", addEventListener: addListener },
    window: {
      addEventListener: addListener,
      setTimeout(callback, delay) {
        const id = ++nextId;
        timers.set(id, { callback, at: now + delay });
        return id;
      },
    },
    clearTimeout: id => timers.delete(id),
    selectPlanningDate(date) { context.selectedPlanningDate = date; selections.push(date); renders += 1; },
    renderAll() { renders += 1; },
  };
  vm.runInNewContext(`${ANDROID_TODAY_CLOCK_SOURCE}\narmAndroidTodayClock();`, context);
  return {
    context, selections, timers,
    get renders() { return renders; },
    setTime(date) { now = new Date(date).getTime(); },
    fire(type) { listeners[type](); },
    midnight() {
      const [id, timer] = [...timers][0];
      timers.delete(id);
      now = timer.at;
      timer.callback();
    },
  };
}

test("Android today follows each resume event after ten background days without duplicate renders", () => {
  for (const event of ["visibilitychange", "pageshow", "focus"]) {
    const clock = clockHarness();
    clock.setTime("2026-11-26T09:00:00+01:00");
    clock.fire(event);
    clock.fire("focus");
    assert.deepEqual(clock.selections, ["2026-11-26"], event);
    assert.equal(clock.renders, 1);
    assert.equal(clock.timers.size, 1);
  }
});

test("Android today rolls over at local midnight and keeps only one timer", () => {
  const clock = clockHarness("2026-11-30T23:59:59+01:00");
  clock.midnight();
  assert.deepEqual(clock.selections, ["2026-12-01"]);
  clock.midnight();
  assert.deepEqual(clock.selections, ["2026-12-01", "2026-12-02"]);
  assert.equal(clock.timers.size, 1);
});

test("Android resume preserves a deliberately selected historical date but refreshes date-dependent UI", () => {
  const clock = clockHarness();
  clock.context.selectedPlanningDate = "2026-11-10";
  clock.setTime("2026-11-26T09:00:00+01:00");
  clock.fire("focus");
  assert.equal(clock.context.selectedPlanningDate, "2026-11-10");
  assert.deepEqual(clock.selections, []);
  assert.equal(clock.renders, 1);
});

test("Android ignores hidden transitions and leaves the isolated sample untouched", () => {
  const clock = clockHarness();
  clock.context.document.visibilityState = "hidden";
  clock.setTime("2026-11-26T09:00:00+01:00");
  clock.fire("visibilitychange");
  assert.equal(clock.renders, 0);
  clock.context.document.visibilityState = "visible";
  clock.context.androidDemoActive = true;
  clock.fire("visibilitychange");
  assert.equal(clock.renders, 0);
  assert.deepEqual(clock.selections, []);
  assert.equal(clock.timers.size, 1);
});

test("Android midnight timer uses calendar days across daylight saving changes", () => {
  for (const [start, hours, next] of [
    ["2026-03-29T00:00:00+01:00", 23, "2026-03-30"],
    ["2026-10-25T00:00:00+02:00", 25, "2026-10-26"],
  ]) {
    const clock = clockHarness(start);
    assert.equal([...clock.timers.values()][0].at - new Date(start).getTime(), hours * 3600000);
    clock.midnight();
    assert.deepEqual(clock.selections, [next]);
  }
});
