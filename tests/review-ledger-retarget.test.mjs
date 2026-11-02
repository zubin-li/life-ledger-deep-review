import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(join(repo, "public/app.js"), "utf8");
const css = fs.readFileSync(join(repo, "public/v231-review-ledger-retarget.css"), "utf8");

test("review ledger summary uses is-retargeting scopes and retarget hook", () => {
  assert.match(app, /review-ledger-stats is-retargeting/);
  assert.match(app, /review-scatter-grid is-retargeting/);
  assert.match(app, /review-ledger-insights is-retargeting/);
  assert.match(app, /--stat-i:0/);
  assert.match(app, /retarget\?\.\(host\.querySelector\("\.review-ledger-stats\.is-retargeting"\)\)/);
});

test("v231 review ledger retarget stylesheet covers stats, scatter, insights", () => {
  assert.match(css, /\.review-ledger-stats\.is-retargeting/);
  assert.match(css, /\.review-scatter-grid\.is-retargeting/);
  assert.match(css, /\.review-ledger-insights\.is-retargeting/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
