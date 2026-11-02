import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ui = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../public/v230-ledger-chart-retarget.css", import.meta.url), "utf8");

test("ledger month charts use is-retargeting hooks for stagger CSS", () => {
  assert.match(ui, /ledger-heat-grid is-retargeting/);
  assert.match(ui, /ledger-donut-segments is-retargeting/);
  assert.match(ui, /--heat-i:/);
  assert.match(ui, /--seg-i:/);
  assert.match(ui, /retarget\?\.\(host\.querySelector\("\.ledger-heat-grid\.is-retargeting"\)\)/);
});

test("v230 ledger chart retarget stylesheet covers heat, donut, treemap", () => {
  assert.match(css, /\.ledger-heat-grid\.is-retargeting/);
  assert.match(css, /\.ledger-donut-segments\.is-retargeting/);
  assert.match(css, /\.ledger-treemap\.is-retargeting/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
