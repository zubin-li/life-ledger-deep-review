import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/review-metrics-preview.js", import.meta.url), "utf8");
const root = {};
vm.runInNewContext(code, { window: root, globalThis: root });
const RMP = root.LifeLedgerReviewMetricsPreview;

test("averageRate ignores empty list", () => {
  assert.equal(RMP.averageRate([]), null);
  assert.equal(RMP.averageRate([80, 90]), 85);
});

test("formatPreview combines avg and focus in three languages", () => {
  assert.equal(RMP.formatPreview({ avgRate: 78, focusMinutes: 120, lang: "zh" }), "平均 78% · 专注 120 分钟");
  assert.equal(RMP.formatPreview({ avgRate: 78, focusMinutes: 120, lang: "en" }), "78% avg · 120 min focus");
  assert.match(RMP.formatPreview({ avgRate: 78, focusMinutes: 120, lang: "de" }), /Ø 78 %/);
  assert.match(RMP.formatPreview({ lang: "en" }), /Habit scores/);
});

test("app wires review detailed summary preview", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function updateReviewDetailedMetricsSummary\(/);
  assert.match(app, /updateReviewDetailedMetricsSummary\(avgRate, focusMinutes\)/);
  assert.match(app, /REVIEW_METRICS_OPENED_KEY/);
});

test("v210 round 5 styles review summary and week modules", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /batch 4 round 5 — review metrics discoverability/);
  assert.match(css, /\.review-detailed-summary-preview/);
  assert.match(css, /#ledgerView\.view\.is-entering \.ledger-summary article/);
  assert.match(css, /#weekView\.view\.is-entering \.module-card/);
});
