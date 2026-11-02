import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesArt = fs.readFileSync(join(root, "public/pages-art.js"), "utf8");
const v210 = fs.readFileSync(join(root, "public/v210.css"), "utf8");

test("week all-done banner uses shared empty enter motion", () => {
  const index = fs.readFileSync(join(root, "public/index.html"), "utf8");
  assert.match(index, /pages-art\.js\?v=2\.1\.0/);
  assert.match(pagesArt, /ll-week-all-done ll-empty ll-empty-enter/);
  assert.match(v210, /#weeklyGoalList \.ll-week-all-done\.ll-empty-enter/);
  assert.match(v210, /@media \(max-width: 520px\)[\s\S]*review-detailed-summary-chips/);
});
