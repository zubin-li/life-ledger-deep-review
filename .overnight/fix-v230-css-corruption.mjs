/**
 * Repair corrupted merge at v229/v230/v231 (stray `}` + comment inside selectors).
 * Also drops dead #ledgerView inline budget list rules (popover-only).
 * Usage: node .overnight/fix-v230-css-corruption.mjs [--write]
 * Idempotent after r11 manual apply.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
const before = readFileSync(path, "utf8");
let css = before;

const bad =
  /\/\* ========== merged from v229-ledger-budget-bars\.css ========== \*\/\n\/\* Ledger budget progress[^]*?html\.motion-reduced\/\* ========== merged from v231-review-ledger-retarget\.css ========== \*\//;
const good = `/* ========== merged from v229-ledger-budget-bars.css ========== */
/* Ledger budget progress — month-change bar grow (v2.1.0); inline list removed, popover-only. */

/* ========== merged from v230-ledger-chart-retarget.css ========== */
/* Ledger category donut / daily heat — month-change stagger (v2.1.0) */

@keyframes ledger-heat-cell-in {
  to {
    transform: scale(1);
  }
}

@keyframes ledger-donut-seg-in {
  to {
    transform: scale(1);
    opacity: 1;
  }
}

html.motion-reduced .ledger-heat-grid.is-retargeting .ledger-heat,
html.motion-reduced .ledger-donut-segments.is-retargeting path {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}

/* ========== merged from v231-review-ledger-retarget.css ========== */`;

if (bad.test(css)) css = css.replace(bad, good);

const beforeLines = before.split("\n").length;
const afterLines = css.split("\n").length;
console.log(
  JSON.stringify(
    { beforeLines, afterLines, delta: afterLines - beforeLines, fixed: before !== css },
    null,
    2,
  ),
);
if (write && before !== css) writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
