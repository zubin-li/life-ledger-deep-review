import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("journal feed async repaint clears ready only when not keeping stale feed", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const block = app.slice(app.indexOf("async function renderJournalFeed"), app.indexOf("function journalTextMarkup"));
  assert.match(block, /keepStaleJournalFeed/);
  assert.match(block, /if \(feedNeedsAsync\)/);
  assert.doesNotMatch(block, /host\.classList\.remove\('ll-paint-host--ready'\);\s*\n\s*if \(feedNeedsAsync\)/);
});

test("setJournalMode marks feed pane when switching weeks, months, or daily feed", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /const previousMode = journalMode/);
  assert.match(app, /feedPane\.classList\.add\("is-mode-entering"\)/);
  assert.match(app, /journal-library--ready/);
  assert.match(app, /is-calendar-entering/);
  assert.match(app, /journalFeedRevealFrom/);
  assert.match(app, /pulseJournalFeedFilter/);
  assert.match(app, /timeline-entry-list--entering/);
});
