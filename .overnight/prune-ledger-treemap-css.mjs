/**
 * Remove dead treemap / chart-toggle CSS only (comments preserved).
 * Usage: node .overnight/prune-ledger-treemap-css.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
let css = readFileSync(path, "utf8");
const before = css.length;

const chunks = [
  /\.ledger-chart-toggle\s*\{[^}]*\}\s*/gs,
  /\.ledger-chart-mode(?:\.is-active)?\s*\{[^}]*\}\s*/gs,
  /html\[data-theme="dark"\]\s+\.ledger-chart-mode\.is-active\s*\{[^}]*\}\s*/gs,
  /\.ledger-treemap\s*\{[^}]*\}\s*/gs,
  /\.ledger-treemap-label(?:--dim)?\s*\{[^}]*\}\s*/gs,
  /html\[data-theme="dark"\]\s+\.ledger-treemap-label\s*\{[^}]*\}\s*/gs,
  /\s*\.ledger-treemap\.is-retargeting rect\s*\{[^}]*\}\s*/gs,
  /@keyframes ledger-treemap-cell-in\s*\{[^}]*\}\s*/gs,
  /\.ledger-treemap\s+\.ledger-cat-seg\.is-selected\s*\{[^}]*\}\s*/gs,
  /html\[data-theme="dark"\]\s+\.ledger-treemap\s+\.ledger-cat-seg\.is-selected\s*\{[^}]*\}\s*/gs,
  /button\.ledger-chart-mode:is\(\.ll-press-bump,\s*\.is-mode-press\)\s*\{[^}]*\}\s*/gs,
];
for (const re of chunks) css = css.replace(re, "");

css = css.replace(
  /html\.motion-reduced \.ledger-heat-grid\.is-retargeting \.ledger-heat,\s*\nhtml\.motion-reduced \.ledger-donut-segments\.is-retargeting path,\s*\nhtml\.motion-reduced \.ledger-treemap\.is-retargeting rect/,
  "html.motion-reduced .ledger-heat-grid.is-retargeting .ledger-heat,\nhtml.motion-reduced .ledger-donut-segments.is-retargeting path",
);

css = css.replace(
  /button\.tw-spend-open:is\(\.ll-press-bump, \.is-spend-press\),\s*\nbutton\.ledger-chart-mode:is\(\.ll-press-bump, \.is-mode-press\),\s*\nbutton\.ledger-heat/is,
  "button.tw-spend-open:is(.ll-press-bump, .is-spend-press),\nbutton.ledger-heat",
);

css = css.replace(/\n  \.is-mode-press,\n/, "\n");

css = css.replace(/\n{3,}/g, "\n\n");

console.log(JSON.stringify({ beforeLines: readFileSync(path, "utf8").split("\n").length, afterLines: css.split("\n").length, bytes: before - css.length }, null, 2));
if (write) writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
