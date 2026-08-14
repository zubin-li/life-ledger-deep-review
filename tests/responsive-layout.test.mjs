import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

test("mobile hero keeps its progress summary in normal flow", () => {
  assert.match(html, /class="progress-orbit-ring" aria-hidden="true"/);

  const marker = "Mobile hero layout contract";
  const contractStart = css.indexOf(marker);
  assert.notEqual(contractStart, -1, "responsive hero contract is missing");

  const mobileContract = css.slice(contractStart);
  assert.match(mobileContract, /\.hero-card\s*\{[\s\S]*?display:\s*grid;/);
  assert.match(mobileContract, /\.progress-orbit\s*\{[\s\S]*?width:\s*100%;[\s\S]*?position:\s*relative;/);
  assert.doesNotMatch(mobileContract, /\.progress-orbit\s*\{[^}]*position:\s*absolute;/);
});
