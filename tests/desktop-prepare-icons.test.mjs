import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const prepareScript = readFileSync(new URL("../scripts/desktop-prepare.mjs", import.meta.url), "utf8");
const iconsScript = readFileSync(new URL("../scripts/desktop-icons.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("desktop:prepare copies launcher assets only and never regenerates icons", () => {
  assert.match(prepareScript, /desktop-dist/);
  assert.doesNotMatch(prepareScript, /tauri["']\s*,\s*["']icon/);
  assert.doesNotMatch(prepareScript, /execFile/);
});

test("desktop:icons command regenerates Tauri icons from the tracked SVG", () => {
  assert.equal(typeof packageJson.scripts["desktop:icons"], "string");
  assert.match(packageJson.scripts["desktop:icons"], /desktop-icons\.mjs/);
  assert.match(iconsScript, /public\/assets\/app-icon\.svg/);
  assert.match(iconsScript, /tauri["']\s*,\s*["']icon/);
});
