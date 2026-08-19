import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

test("today, week and review expose stable whole-module reorder boundaries", () => {
  assert.match(index, /data-layout-container="today"/);
  assert.match(index, /data-layout-container="week"/);
  assert.match(index, /data-layout-container="review"/);
  assert.match(index, /data-layout-block="review-focus"/);
  assert.match(app, /function decorateLayoutBlocks\(/);
  assert.match(app, /state\.layoutOrder/);
  assert.match(styles, /\.layout-drag-handle/);
});

test("layout order travels with backup and restore", () => {
  assert.match(app, /layoutOrder: cloneData\(state\.layoutOrder \|\| \{\}\)/);
  assert.match(app, /invalid-layoutOrder/);
  assert.match(app, /layoutOrder: cloneData\(payload\.layoutOrder \|\| \{\}\)/);
});

test("habit versions support checklist tracking and optional notes", () => {
  assert.match(index, /name="trackingMode"[^>]+value="check"/);
  assert.match(index, /name="trackingMode"[^>]+value="measured"/);
  assert.match(index, /textarea name="note"/);
  assert.match(app, /function trackingModeFor\(/);
  assert.match(app, /trackingMode: measured \? "measured" : "check"/);
  assert.match(app, /note: String\(form\.get\("note"\)/);
});
