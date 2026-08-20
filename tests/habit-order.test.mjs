import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("stable page layout stays fixed while habits expose a dedicated drag handle", () => {
  assert.doesNotMatch(index, /data-layout-container|data-layout-block|layout-drag-handle/);
  assert.match(app, /class="habit-drag-handle"/);
  assert.match(app, /function moveHabitDrag\(/);
  assert.match(app, /function finishHabitSettingsDrag\(/);
  assert.match(app, /function moveHabit\(/);
  assert.match(app, /state\.habits\.splice\(nextIndex, 0, habit\)/);
  assert.doesNotMatch(app, /class="habit-order-button"/);
});

test("habit versions support checklist tracking and optional notes", () => {
  assert.match(index, /name="trackingMode"[^>]+value="check"/);
  assert.match(index, /name="trackingMode"[^>]+value="measured"/);
  assert.match(index, /textarea name="note"/);
  assert.match(app, /function trackingModeFor\(/);
  assert.match(app, /trackingMode: measured \? "measured" : "check"/);
});

test("new local workspaces start with eight multilingual wellbeing habits", () => {
  for (const id of ["exercise", "reading", "sleep2330", "hydration", "meditation", "deepwork", "language", "strength"]) {
    assert.match(app, new RegExp(`id: "${id}"`));
  }
  for (const label of ["Exercise", "Reading", "Sleep before 23:30", "Drink enough water", "Meditation", "Deep work", "Language learning", "Strength training"]) {
    assert.match(app, new RegExp(label));
  }
  assert.match(app, /sleep2330: "23:30 前睡"/);
  assert.match(app, /sleep2330: "Vor 23:30 Uhr schlafen"/);
  assert.match(app, /weeklyTarget: 3, countsTowardDaily: false/);
});
