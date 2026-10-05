import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");
const sw = read("public/sw.js");

function loadAnalytics() {
  const context = { globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read("public/habit-analytics.js"), context);
  return context.LifeLedgerAnalytics;
}

test("3.3 cache key is unique while the displayed version stays 3.3.0", () => {
  assert.match(sw, /life-ledger-pwa-3\.3\.0-r1/);
  assert.match(html, /habit-analytics\.js\?v=3\.3\.0-r1/);
  assert.doesNotMatch(html, /id="appVersionLabel"/);
  assert.match(html, /option value="system"/);
  assert.match(app, /Math\.max\(156, Math\.min\(240/);
  assert.match(app, /Math\.max\(280, Math\.min\(440/);
  assert.match(app, /lifeLedgerSidebarWidth31/);
  assert.match(app, /lifeLedgerInspectorWidth31/);
  assert.match(css, /--sage: #5d7d68/);
  assert.match(css, /html\[data-desktop\] #sidebarHabitsHeading/);
  assert.doesNotMatch(css, /font:\s*500\s+9px/);
  assert.match(css, /preserveAspectRatio|review-trend-axis/);
  assert.match(app, /preserveAspectRatio="xMidYMid meet"/);
  assert.doesNotMatch(app, /\$\{best\.count\} times/);
});

test("analytics math uses eligible denominators, streaks, and chart mode", () => {
  const analytics = loadAnalytics();
  const dates = JSON.parse(JSON.stringify(analytics.windowDates("2026-10-03", 7)));
  assert.deepEqual(dates, [
    "2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30",
    "2026-10-01", "2026-10-02", "2026-10-03",
  ]);
  const previous = JSON.parse(JSON.stringify(analytics.previousWindow(dates)));
  assert.equal(previous.at(-1), "2026-09-26");
  assert.equal(previous.length, 7);
  assert.deepEqual(JSON.parse(JSON.stringify(analytics.rate(1, 2))), { completed: 1, eligible: 2, percent: 50 });
  assert.equal(analytics.rate(0, 0).percent, null);
  assert.deepEqual(JSON.parse(JSON.stringify(analytics.streaks([true, true, false, true], { ignoreTrailingMiss: false }))), { current: 1, best: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(analytics.streaks([true, true, false], { ignoreTrailingMiss: true }))), { current: 2, best: 2 });
  assert.equal(analytics.chartMode(3), "compact");
  assert.equal(analytics.chartMode(4), "line");
  assert.equal(analytics.pluralEn(1, "time", "times"), "1 time");
  assert.equal(analytics.pluralEn(2, "time", "times"), "2 times");
  const weekdays = JSON.parse(JSON.stringify(analytics.weekdayAverages([
    { date: "2026-09-28", value: 100 },
    { date: "2026-09-29", value: 50 },
  ])));
  assert.equal(weekdays[0], 100);
  assert.equal(weekdays[1], 50);
  assert.equal(weekdays[2], null);
});

test("language choice resolves system without writing system as the active locale", () => {
  assert.match(app, /function languageFromChoice\(choice\)/);
  assert.match(app, /languageSelect\.value = languageChoice/);
  assert.match(app, /currentLang = languageFromChoice\(languageChoice\)/);
  assert.match(app, /countLabel\(count\)/);
  assert.match(css, /\.toast\.show \{[^}]*pointer-events:\s*auto/);
});
