import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const photos = readFileSync(new URL("../public/photo-memories.js", import.meta.url), "utf8");

test("deployed photo memories live inside the mood note", () => {
  const moodDialog = html.match(/id="moodReasonDialog"([\s\S]*?)<\/dialog>/);
  assert.ok(moodDialog);
  assert.match(moodDialog[1], /id="moodPhotoSection"/);
  assert.match(moodDialog[1], /id="moodPhotoInput"/);
  assert.match(app, /enabled: hostedCloudMode/);
  assert.match(photos, /MAX_PER_DAY = 3/);
  assert.match(photos, /MAX_OUTPUT_BYTES = 1_200_000/);
  assert.match(css, /\.mood-photo-list/);
});

test("timeline and long-term sidebar reuse existing private records", () => {
  assert.match(html, /data-view="timeline"/);
  assert.match(html, /id="timelineView"/);
  assert.match(html, /id="sidebarLongTermList"/);
  assert.match(app, /function renderTimeline\(\)/);
  assert.match(app, /state\.longTermGoals/);
  assert.match(css, /\.main-nav \{ grid-template-columns: repeat\(5, 1fr\); \}/);
});
