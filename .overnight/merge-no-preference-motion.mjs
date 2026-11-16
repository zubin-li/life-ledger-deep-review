/**
 * Merge scattered `@media (prefers-reduced-motion: no-preference)` blocks in v210.css
 * into one trailing section (same rule order). Preserves Batch comment lines.
 * Usage: node .overnight/merge-no-preference-motion.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
const MEDIA_NEEDLE = "prefers-reduced-motion: no-preference";

function extractMediaBlocks(css) {
  const hits = [];
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@media", i);
    if (at === -1) break;
    const p0 = css.indexOf("(", at);
    const p1 = css.indexOf(")", p0);
    if (p0 < 0 || p1 < 0) break;
    const condition = css.slice(p0 + 1, p1);
    const brace = css.indexOf("{", p1);
    if (brace < 0) break;
    let depth = 1;
    let j = brace + 1;
    while (j < css.length && depth) {
      if (css[j] === "{") depth += 1;
      else if (css[j] === "}") depth -= 1;
      j += 1;
    }
    const full = css.slice(at, j);
    if (condition.includes(MEDIA_NEEDLE)) {
      hits.push({ start: at, end: j, inner: css.slice(brace + 1, j - 1).trim() });
    }
    i = j;
  }
  return hits;
}

const before = readFileSync(path, "utf8");
const blocks = extractMediaBlocks(before);
if (!blocks.length) {
  console.log("No no-preference blocks found");
  process.exit(0);
}

let css = before;
for (let k = blocks.length - 1; k >= 0; k -= 1) {
  const { start, end } = blocks[k];
  let sliceStart = start;
  while (sliceStart > 0 && before[sliceStart - 1] === " ") sliceStart -= 1;
  if (sliceStart > 0 && before[sliceStart - 1] === "\n") {
    let lineStart = sliceStart - 1;
    while (lineStart > 0 && before[lineStart - 1] !== "\n") lineStart -= 1;
    const line = before.slice(lineStart, sliceStart - 1);
    if (/^\/\*[^*]*\*\/\s*$/.test(line.trim()) || line.trim().startsWith("/*")) {
      sliceStart = lineStart;
    }
  }
  css = css.slice(0, sliceStart) + css.slice(end);
}

const combinedInner = blocks.map(b => b.inner).join("\n\n");
const footer = `\n/* Owner pass r8 — consolidated prefers-reduced-motion: no-preference */\n@media (prefers-reduced-motion: no-preference) {\n${combinedInner}\n}\n`;

css = css.replace(/\n{3,}/g, "\n\n").trimEnd() + footer;

const beforeLines = before.split("\n").length;
const afterLines = css.split("\n").length;
console.log(
  JSON.stringify(
    {
      blocksMerged: blocks.length,
      beforeLines,
      afterLines,
      deltaLines: afterLines - beforeLines,
      bytesBefore: before.length,
      bytesAfter: css.length,
      bytesSaved: before.length - css.length,
    },
    null,
    2,
  ),
);

if (write) {
  writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
}
