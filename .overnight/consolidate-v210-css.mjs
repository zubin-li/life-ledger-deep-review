/**
 * Structural v210.css slimming: shared pageCardIn tokens + trim blank runs.
 * Preserves all Batch comment lines (tests grep them).
 * Usage: node .overnight/consolidate-v210-css.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, "..", "public", "v210.css");
const write = process.argv.includes("--write");
const before = readFileSync(path, "utf8");
let css = before;
const beforeLines = before.split("\n").length;

const TOKEN_BLOCK = `/* Owner pass — shared enter tokens (r7) */
:root {
  --ll-anim-enter-38: pageCardIn 0.38s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
  --ll-anim-enter-40: pageCardIn 0.4s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
  --ll-anim-enter-42: pageCardIn 0.42s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
  --ll-anim-enter-44: pageCardIn 0.44s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
  --ll-anim-enter-46: pageCardIn 0.46s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
  --ll-anim-enter-50: pageCardIn 0.5s var(--ease-enter, cubic-bezier(0.2, 0.8, 0.2, 1)) both;
}

`;

if (!css.includes("--ll-anim-enter-46")) {
  css = css.replace(/^\/\* Bookkeeping page/, `${TOKEN_BLOCK}/* Bookkeeping page`);
}

const replacers = [
  [/animation:\s*pageCardIn 0\.5s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-50);"],
  [/animation:\s*pageCardIn 0\.46s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-46);"],
  [/animation:\s*pageCardIn 0\.44s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-44);"],
  [/animation:\s*pageCardIn 0\.42s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-42);"],
  [/animation:\s*pageCardIn 0\.4s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-40);"],
  [/animation:\s*pageCardIn 0\.38s var\(--ease-enter, cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)\) both;/g, "animation: var(--ll-anim-enter-38);"],
];
for (const [re, to] of replacers) css = css.replace(re, to);

css = css.replace(/\n{4,}/g, "\n\n\n");

const afterLines = css.split("\n").length;
console.log(JSON.stringify({ beforeLines, afterLines, delta: afterLines - beforeLines, bytesSaved: before.length - css.length }, null, 2));
if (write) writeFileSync(path, css.endsWith("\n") ? css : `${css}\n`, "utf8");
