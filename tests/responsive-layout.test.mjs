import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("Today uses compact header and vertical habit rows instead of the old hero ring", () => {
  assert.match(html, /class="today-date-heading" id="todayDateHeading"/);
  assert.match(html, /class="today-summary" id="todaySummary"/);
  assert.match(html, /<ul class="today-habit-list" id="todayHabitList" role="list"/);
  assert.match(app, /function renderToday\(\)/);
  assert.match(app, /todayHabitRowMarkup\(/);
  assert.doesNotMatch(html, /progressOrbit|todayHabitCarousel|heroProgressText/);

  assert.match(css, /\.today-habit-check \{[^}]*transition:[^}]*200ms cubic-bezier\(\.2,\.8,\.2,1\)/);
  assert.match(css, /\.today-date-heading \{[^}]*transition:[^}]*160ms cubic-bezier\(\.2,\.8,\.2,1\)/);
});

test("mobile navigation uses a stable safe-area inset while the page scrolls", () => {
  assert.match(css, /--mobile-nav-safe-bottom:\s*env\(safe-area-max-inset-bottom,\s*env\(safe-area-inset-bottom,\s*0px\)\)/);
  assert.match(css, /\.sidebar\s*\{[\s\S]*?bottom:\s*max\(10px,\s*var\(--mobile-nav-safe-bottom\)\);[\s\S]*?backdrop-filter:\s*none;/);
  assert.match(css, /padding-bottom:\s*max\(110px,\s*calc\(92px \+ var\(--mobile-nav-safe-bottom\)\)\)/);
  assert.doesNotMatch(css, /\.sidebar\s*\{[^}]*bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\)/);
});

test("desktop review reads as a document and the five panes stay list-density", () => {
  const review = html.slice(html.indexOf('id="reviewView"'), html.indexOf('id="habitsView"'));
  assert.ok(review.indexOf('id="reviewText"') < review.indexOf('id="reviewTrendChart"'));
  assert.ok(review.indexOf('id="reviewTrendChart"') < review.indexOf('id="reviewDetailedMetrics"'));
  assert.match(css, /html\[data-desktop\] \.review-insights \{ display: grid;/);
  assert.match(css, /html\[data-desktop\] \.review-insight-value \{ font: 600 1\.375rem\/1\.2/);
  assert.match(css, /html\[data-desktop\] \.today-date-heading \{[^}]*font: 600 1\.75rem\/1\.2 var\(--font-display\)/);
  assert.match(css, /html\[data-desktop\] body\[data-active-view="today"\] \.main-content,[\s\S]*?max-width: none;/);
  assert.match(css, /html\[data-desktop\] \.habit-settings-list \{ gap: 0; \}/);
  assert.match(css, /html\[data-desktop\] \.timeline-habit-list \{ display: grid;/);
  assert.match(app, /class="timeline-habit-list"/);
  assert.match(css, /@media \(max-width: 979px\) \{\s*#reviewView\.active \{ display: flex;/);
});

test("inspector collapses before sidebar on narrow desktop widths", () => {
  assert.match(css, /@media \(max-width: 1179px\)/);
  assert.match(css, /body\.inspector-collapsed \.inspector/);
  assert.match(html, /<aside class="inspector" id="inspectorPane"/);
});
