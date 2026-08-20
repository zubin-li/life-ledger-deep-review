import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("mobile hero keeps its progress ring in the lower-right without overlay", () => {
  assert.match(html, /class="progress-orbit-ring" aria-hidden="true"/);
  assert.match(html, /class="progress-orbit-label"/);
  assert.match(app, /setText\("\.progress-orbit-label", tr\("hero\.progress"\)\)/);
  assert.doesNotMatch(app, /setText\("\.progress-orbit span"/);

  const marker = "Mobile hero layout contract";
  const contractStart = css.indexOf(marker);
  assert.notEqual(contractStart, -1, "responsive hero contract is missing");

  const mobileContract = css.slice(contractStart);
  assert.match(mobileContract, /\.hero-card\s*\{[\s\S]*?display:\s*grid;/);
  assert.match(mobileContract, /\.progress-orbit\s*\{[\s\S]*?width:\s*90px;[\s\S]*?position:\s*relative;[\s\S]*?justify-self:\s*end;/);
  assert.doesNotMatch(mobileContract, /\.progress-orbit\s*\{[^}]*position:\s*absolute;/);
});

test("mobile navigation uses a stable safe-area inset while the page scrolls", () => {
  assert.match(css, /--mobile-nav-safe-bottom:\s*env\(safe-area-max-inset-bottom,\s*env\(safe-area-inset-bottom,\s*0px\)\)/);
  assert.match(css, /\.sidebar\s*\{[\s\S]*?bottom:\s*max\(10px,\s*var\(--mobile-nav-safe-bottom\)\);[\s\S]*?backdrop-filter:\s*none;/);
  assert.match(css, /padding-bottom:\s*max\(110px,\s*calc\(92px \+ var\(--mobile-nav-safe-bottom\)\)\)/);
  assert.doesNotMatch(css, /\.sidebar\s*\{[^}]*bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\)/);
});
