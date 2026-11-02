import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("v210 view enter stagger targets the active view element (not a phantom ancestor)", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.view\.is-entering #todayView/);
  assert.doesNotMatch(css, /\.view\.is-entering #timelineView/);
  assert.doesNotMatch(css, /\.view\.is-entering #longrangeView/);
  assert.match(css, /#todayView\.view\.is-entering/);
  assert.match(css, /#timelineView\.view\.is-entering/);
  assert.match(css, /#longrangeView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 2 — Today hero \+ daily tool enter stagger/);
  assert.match(css, /#reviewView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 3 — review enter stagger/);
  assert.match(css, /#habitsView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 4 — habits \+ week enter stagger/);
  assert.match(css, /#weekView\.view\.is-entering #weekCalendar \.week-calendar-day/);
});

test("short viewport ledger keypad docks fixed while quick field focused", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 5 round 3 — dock keypad/);
  assert.match(css, /#ledgerView \.ledger-quick:focus-within ~ \.ledger-keypad/);
  assert.match(css, /position:\s*fixed/);
});

test("focus inline timer exposes running state for CSS micro-interaction", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /inlineTimer\?\.classList\.toggle\("is-running"/);
  assert.match(app, /inlineTimer\?\.classList\.toggle\("is-break"/);
});
