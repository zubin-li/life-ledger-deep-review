import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("month calendar switches between mood and completion heatmap", () => {
  assert.match(html, /id="calendarViewSwitch"/);
  assert.match(html, /data-calendar-view="mood"/);
  assert.match(html, /data-calendar-view="heatmap"/);
  assert.match(app, /CALENDAR_VIEW_KEY = "life-ledger-calendar-view"/);
  assert.match(app, /function setCalendarViewMode\(mode\)/);
  assert.match(app, /function calendarHeatLevel\(progress\)/);
  assert.match(app, /calendarGrid"\)\.dataset\.mode = calendarViewMode/);
});

test("calendar removes per-habit dots and uses icon-backed mood colors", () => {
  const calendarRenderer = app.match(/function renderCalendar\(\) \{([\s\S]*?)\n\}\n\nfunction renderReview/);
  assert.ok(calendarRenderer, "calendar renderer is missing");
  assert.doesNotMatch(calendarRenderer[1], /class="day-status"/);
  assert.match(app, /平静: '<path d="M20 4C10\.4 4\.5/);
  assert.match(app, /moodCalendarIcons/);
  assert.match(css, /\.calendar-grid\[data-mode="mood"\] \.calendar-day\.mood-low/);
  assert.match(css, /\.calendar-grid\[data-mode="mood"\] \.calendar-day\.mood-calm/);
  assert.match(css, /\.calendar-grid\[data-mode="mood"\] \.calendar-day\.mood-good/);
  assert.match(css, /\.calendar-grid\[data-mode="heatmap"\] \.calendar-day\.heat-4/);
});

test("calendar visualization controls remain touch friendly on mobile", () => {
  assert.match(css, /\.calendar-view-switch button\s*\{[^}]*min-height:\s*44px;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.calendar-controls\s*\{[^}]*width:\s*100%;[^}]*justify-content:\s*space-between;/);
});
