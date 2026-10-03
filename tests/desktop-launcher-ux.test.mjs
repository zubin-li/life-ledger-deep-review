import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const launcherHtml = readFileSync(new URL("../desktop/launcher.html", import.meta.url), "utf8");
const launcherJs = readFileSync(new URL("../desktop/launcher.js", import.meta.url), "utf8");
const launcherCss = readFileSync(new URL("../desktop/launcher.css", import.meta.url), "utf8");

test("cloud URL submits on Enter via a real form, with local staying an explicit separate button", () => {
  assert.match(launcherHtml, /<form class="choice" id="cloudForm" novalidate>/);
  assert.match(launcherHtml, /<button id="openCloud" class="choice-button primary" type="submit">/);
  assert.match(launcherHtml, /<button id="openLocal" class="choice-button primary" type="button">/);
  assert.match(launcherJs, /document\.getElementById\("cloudForm"\)\.addEventListener\("submit", async event => \{/);
  assert.match(launcherJs, /event\.preventDefault\(\);/);
});

test("never auto-opens or silently chooses a mode: both actions require an explicit click/submit", () => {
  assert.doesNotMatch(launcherJs, /DOMContentLoaded/);
  assert.doesNotMatch(launcherJs, /\.click\(\)/);
  assert.doesNotMatch(launcherJs, /setTimeout\(\s*\(\)\s*=>\s*(openLocalButton|openCloudButton|.*invoke)/);
  // The only two invoke() calls must live inside the click/submit handlers, not at module top level.
  const invokeCalls = launcherJs.match(/window\.__TAURI__\.core\.invoke\(/g) || [];
  assert.equal(invokeCalls.length, 2);
});

test("busy and disabled states are applied while a window is opening, and cleared afterward", () => {
  assert.match(launcherJs, /async function runBusy\(button, busyKey, idleKey, task\) \{/);
  assert.match(launcherJs, /button\.disabled = true;/);
  assert.match(launcherJs, /button\.setAttribute\("aria-busy", "true"\);/);
  assert.match(launcherJs, /button\.disabled = false;/);
  assert.match(launcherJs, /button\.removeAttribute\("aria-busy"\);/);
  assert.match(launcherCss, /\.choice-button:disabled \{ opacity: \.6; cursor: default; \}/);
});

test("a failed window-open shows a general launcher error distinct from URL-validation errors", () => {
  assert.match(launcherHtml, /<p class="launcher-error" id="launcherError" role="alert" hidden><\/p>/);
  assert.match(launcherJs, /function setLauncherError\(message = ""\) \{/);
  assert.match(launcherJs, /catch \(error\) \{\s*console\.warn\("Life Ledger desktop launcher action failed", error\);\s*setLauncherError\(activeCopy\.launchError\);/);
});

test("keyboard focus is visibly indicated on every interactive control", () => {
  assert.match(launcherCss, /:focus-visible \{\s*outline: 2px solid/);
});

test("privacy/data-location language is present and localized in all three languages", () => {
  assert.match(launcherHtml, /<p class="launcher-footnote" id="privacyNote"><\/p>/);
  assert.match(launcherJs, /privacyNote: "Local mode never leaves this Mac\./);
  assert.match(launcherJs, /privacyNote: "本机模式的数据不会离开这台 Mac。/);
  assert.match(launcherJs, /privacyNote: "Der lokale Modus verlässt diesen Mac nie\./);
});

test("the launcher uses crisp inline SVG icons, not emoji, for each choice", () => {
  assert.match(launcherHtml, /<span class="choice-icon" aria-hidden="true">\s*<svg viewBox="0 0 24 24"/g);
  assert.doesNotMatch(launcherHtml, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});
