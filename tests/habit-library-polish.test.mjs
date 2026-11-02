import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("habit library overview rolls stats on re-render", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function rollHabitLibraryOverview\(/);
  assert.match(app, /rollHabitLibraryOverview\(\)/);
  assert.match(app, /habit-overview-stat/);
});

test("v210 styles habit library entrance and filters", () => {
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /batch 4 round 4 — habit library polish/);
  assert.match(css, /\.view\.is-entering #habitLibraryOverview article/);
  assert.match(css, /\.habit-filter-empty\.ll-hint-card/);
});
