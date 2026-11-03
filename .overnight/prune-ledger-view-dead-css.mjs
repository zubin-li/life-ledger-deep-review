/**
 * Remove CSS for DOM removed in owner pass r9 (#ledgerView wellness scatter, budget empty wrap).
 * Preserves Batch comment lines referenced by tests.
 * Usage: node .overnight/prune-ledger-view-dead-css.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
const before = readFileSync(path, "utf8");
let css = before;

css = css.replace(/\n\.ledger-wellness-grid \.review-scatter-tip \{[^}]+\}\n/, "\n");

const wellnessStart = "/* Batch 12 r3 — Money wellness scatter empty (Review-aligned checklist) */";
const wellnessEnd = "/* ========== Batch 12 r4 — Money polished section empties ========== */";
const a = css.indexOf(wellnessStart);
const b = css.indexOf(wellnessEnd);
if (a >= 0 && b > a) {
  css = `${css.slice(0, a)}${wellnessStart} — ledger #ledgerView rules removed 2.1 owner pass; styles live under #reviewView only.\n\n${css.slice(b)}`;
}

css = css.replace(
  /#ledgerView \.ledger-list-empty\.ll-polished \.primary-button,\n#ledgerView \.ledger-budget-empty-wrap\.ll-polished \.primary-button,\n#ledgerView \.ledger-recurring-empty-wrap\.ll-polished \.primary-button/,
  "#ledgerView .ledger-list-empty.ll-polished .primary-button,\n#ledgerView .ledger-recurring-empty-wrap.ll-polished .primary-button",
);
css = css.replace(
  /html\[data-theme="dark"\] #ledgerView :is\(\.ledger-list-empty, \.ledger-budget-empty-wrap, \.ledger-recurring-empty-wrap\)\.ll-polished/,
  'html[data-theme="dark"] #ledgerView :is(.ledger-list-empty, .ledger-recurring-empty-wrap).ll-polished',
);
css = css.replace(
  /html\.motion-reduced #ledgerView :is\(\.ledger-list-empty, \.ledger-budget-empty-wrap, \.ledger-recurring-empty-wrap\)\.ll-polished/,
  "html.motion-reduced #ledgerView :is(.ledger-list-empty, .ledger-recurring-empty-wrap).ll-polished",
);

css = css.replace(/\n{3,}/g, "\n\n");

const beforeLines = before.split("\n").length;
const afterLines = css.split("\n").length;
console.log(
  JSON.stringify(
    { beforeLines, afterLines, delta: afterLines - beforeLines, bytesSaved: before.length - css.length },
    null,
    2,
  ),
);
if (write) writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
