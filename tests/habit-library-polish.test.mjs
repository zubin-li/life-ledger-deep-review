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
  assert.match(css, /Batch 9 r6 — journal filter stale feed/i);
  assert.match(css, /Batch 9 r7 — journal stale shimmer veil/i);
  assert.match(css, /\.today-habit-spend-hint/);
});

test("review habit compare hydrates hairline empty state", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /hydrateHairlineMounts\(\$\("#reviewHabitCompare"\)\)/);
  assert.match(app, /\.insight-habit-panel \.hairline-empty"\)\?\.classList\.add\("ll-empty"\)/);
});

test("journal feed avoids clearing ready on sync re-render", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const block = app.slice(app.indexOf("async function renderJournalFeed"), app.indexOf("function journalTextMarkup"));
  assert.match(block, /keepStaleJournalFeed/);
  assert.match(block, /ll-paint-host--stale/);
  assert.match(block, /ll-stale-veil/);
  assert.match(block, /if \(feedNeedsAsync\)/);
  assert.doesNotMatch(block, /host\.classList\.remove\('ll-paint-host--ready'\);\s*\n\s*if \(feedNeedsAsync\)/);
});
