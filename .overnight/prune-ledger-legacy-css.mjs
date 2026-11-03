/**
 * Remove CSS for ledger hidden legacy viz (wellness block, chips, budget list).
 * Preserves Batch comment lines referenced by tests.
 * Usage: node .overnight/prune-ledger-legacy-css.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
const before = readFileSync(path, "utf8");
let css = before;

const stripBetween = (startNeedle, endNeedle) => {
  const a = css.indexOf(startNeedle);
  const b = css.indexOf(endNeedle, a + 1);
  if (a < 0 || b < 0) return false;
  css = `${css.slice(0, a)}${css.slice(b)}`;
  return true;
};

stripBetween("/* Batch 12 r1 — Money page mood/habit mini scatter correlations */", "/* Batch 12 round 2 — heatmap day filter + ledger scatter tips */");
css = css.replace(
  "/* Batch 12 round 2 — heatmap day filter + ledger scatter tips */",
  "/* Batch 12 r1 — Money page mood/habit mini scatter correlations (Review-only since 2.1.0 owner pass) */\n\n/* Batch 12 round 2 — heatmap day filter + ledger scatter tips */",
);

css = css.replace(/\n\.ledger-chips \{[^}]+\}\n\n\.ledger-chip \{[^}]+\}\n\n\.ledger-chip:active \{[^}]+\}\n/, "\n");

css = css.replace(
  /\n\.ledger-budget-list \{[^}]+\}\n\n\.ledger-budget \{[^}]+\}\n\n\.ledger-budget-bar \{[^}]+\}\n\n\.ledger-budget-bar::after \{[^}]+\}\n\n\.ledger-budget\.is-over \.ledger-budget-bar::after \{[^}]+\}\n/,
  "\n",
);

css = css.replace(
  /#ledgerView \.ledger-list-empty\.ll-polished,\n#ledgerView \.ledger-budget-empty-wrap\.ll-polished,\n#ledgerView \.ledger-recurring-empty-wrap\.ll-polished/,
  "#ledgerView .ledger-list-empty.ll-polished,\n#ledgerView .ledger-recurring-empty-wrap.ll-polished",
);
css = css.replace(
  /#ledgerView \.ledger-list-empty\.ll-polished \.hairline-empty,\n#ledgerView \.ledger-budget-empty-wrap\.ll-polished \.hairline-empty,\n#ledgerView \.ledger-recurring-empty-wrap\.ll-polished \.hairline-empty/,
  "#ledgerView .ledger-list-empty.ll-polished .hairline-empty,\n#ledgerView .ledger-recurring-empty-wrap.ll-polished .hairline-empty",
);
css = css.replace(
  /#ledgerView \.ledger-list-empty\.ll-polished \.hairline-empty > strong,\n#ledgerView \.ledger-budget-empty-wrap\.ll-polished \.hairline-empty > strong,\n#ledgerView \.ledger-recurring-empty-wrap\.ll-polished \.hairline-empty > strong/,
  "#ledgerView .ledger-list-empty.ll-polished .hairline-empty > strong,\n#ledgerView .ledger-recurring-empty-wrap.ll-polished .hairline-empty > strong",
);

css = css.replace(/\n  \.ledger-wellness-grid \.review-scatter-tip \{[^}]+\}\n/, "\n");

css = css.replace(
  /\.ledger-budget-list\.is-retargeting \.ledger-budget-bar::after \{[^}]+\}\s*/gs,
  "",
);
css = css.replace(
  /html\.motion-reduced \.ledger-budget-list\.is-retargeting \.ledger-budget-bar::after \{[^}]+\}\s*/gs,
  "",
);

css = css.replace(/button\.ledger-chip:is\(\.ll-press-bump, \.is-chip-press\),\s*\n/g, "");
css = css.replace(/html\[data-theme="dark"\] button\.ledger-chip:is\(\.ll-press-bump, \.is-chip-press\),\s*\n/g, "");

css = css.replace(/\n{3,}/g, "\n\n");

const beforeLines = before.split("\n").length;
const afterLines = css.split("\n").length;
console.log(JSON.stringify({ beforeLines, afterLines, delta: afterLines - beforeLines, bytesSaved: before.length - css.length }, null, 2));
if (write) writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
