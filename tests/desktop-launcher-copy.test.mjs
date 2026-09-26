import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveLauncherLanguage } from "../desktop/launcher-i18n.js";

const launcher = readFileSync(new URL("../desktop/launcher.js", import.meta.url), "utf8");
const launcherHtml = readFileSync(new URL("../desktop/launcher.html", import.meta.url), "utf8");

test("launcher resolves language from saved preference first", () => {
  assert.equal(resolveLauncherLanguage({ saved: "de", system: "zh-CN" }), "de");
  assert.equal(resolveLauncherLanguage({ saved: "zh-CN", system: "en-US" }), "zh");
});

test("launcher falls back to system locale then english", () => {
  assert.equal(resolveLauncherLanguage({ saved: "", system: "de-AT" }), "de");
  assert.equal(resolveLauncherLanguage({ saved: "", system: "fr-FR" }), "en");
});

test("launcher exposes an accessible three-language selector", () => {
  assert.match(launcherHtml, /id="languageSelect"/);
  assert.match(launcherHtml, /<option value="en">English<\/option>/);
  assert.match(launcherHtml, /<option value="zh">简体中文<\/option>/);
  assert.match(launcherHtml, /<option value="de">Deutsch<\/option>/);
  assert.match(launcher, /document\.documentElement\.lang = lang/);
  assert.match(launcher, /setCloudError\(activeCopy\.invalid\)/);
});
