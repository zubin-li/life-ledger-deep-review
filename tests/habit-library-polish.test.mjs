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
  assert.match(css, /\.today-insight-hint/);
  assert.match(css, /\.today-habit-spend-hint/);
  assert.match(css, /\.today-mood-spend-hint/);
  assert.match(css, /Batch 11 r8 — journal timeline streak/i);
  assert.match(css, /\.journal-feed-spend-insight/);
});

test("review habit compare hydrates hairline empty state", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /hydrateHairlineMounts\(\$\("#reviewHabitCompare"\)\)/);
  assert.match(app, /\.insight-habit-panel \.hairline-empty"\)\?\.classList\.add\("ll-empty"\)/);
});

test("v210 journal feed empty polish styles", () => {
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 10 r4 — journal feed empty polish/i);
  assert.match(css, /\.journal-feed-filter-quiet\.ll-polished/);
});

test("journal feed empty markup wires CTAs", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function journalFeedEmptyMarkup\(/);
  assert.match(app, /function wireJournalFeedEmptyActions\(/);
  assert.match(app, /function wireJournalFeedSpendInsight\(/);
  assert.match(app, /journal-feed-spend-insight/);
  assert.match(app, /journal-feed-filter-quiet ll-polished/);
  assert.match(app, /id="journalEmptyWriteToday"/);
  assert.match(app, /timelineCalendarEmptyWriteToday/);
  assert.match(app, /journal-feed-pane--empty/);
});

test("week and review empty states wire polished CTAs", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function wirePolishedEmptyCtas\(/);
  assert.match(app, /#weekEmptyAddFirstGoal/);
  assert.match(app, /#reviewReflectionEmptyWrite/);
  assert.match(app, /weekly-goals-empty ll-polished/);
  assert.match(app, /review-reflection-empty ll-polished/);
});

test("v210 week and review empty polish styles", () => {
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 10 r5 — week goals \/ review reflection empty CTAs/i);
  assert.match(css, /\.weekly-goals-empty\.ll-polished/);
  assert.match(css, /\.review-reflection-empty\.ll-polished/);
});

test("today cards onboarding and review scatter empty polish", () => {
  const cards = readFileSync(new URL("../public/today-cards.js", import.meta.url), "utf8");
  assert.match(cards, /life-ledger-today-cards-onboarding-dismissed/);
  assert.match(cards, /function syncOnboard\(/);
  assert.match(cards, /data-tc-onboard-library/);
  assert.match(cards, /bar\.classList\.add\("is-saved"\)/);
  assert.match(cards, /tc-edit-saved-flash/);
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /reviewScatterEmptyHint/);
  assert.match(app, /summary\.expenseMinor < 0/);
  assert.match(app, /#reviewScatterEmptyToday/);
  assert.match(app, /timelineEmptyWriteToday/);
  assert.match(app, /timelineCalendarEmptyWriteToday/);
  assert.match(app, /journal-calendar-empty ll-polished/);
  assert.match(app, /timeline-filter-quiet ll-polished/);
  assert.match(app, /function timelineMonthEntryBasis\(/);
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 10 r6 — Today widget library onboarding/i);
  assert.match(css, /Batch 10 r7 — Today edit done success/i);
  assert.match(css, /Batch 10 r8 — timeline calendar/i);
  assert.match(css, /\.tc-onboard-hint/);
  assert.match(css, /\.review-scatter-empty\.ll-polished/);
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
