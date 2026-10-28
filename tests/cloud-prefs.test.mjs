import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const cards = readFileSync(new URL("../public/today-cards.js", import.meta.url), "utf8");
const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");

// User 10/28: in the cloud edition the Today layout and weather city must be the same on every device.
test("cloud edition syncs the Today layout and weather city with the records", () => {
  for (const key of ["life-ledger-web-today-cards-v4", "life-ledger-weather-city"]) assert.ok(app.includes(`"${key}"`), key);
  assert.equal(app.match(/adoptCloudProfile\(remote\?\.payload\); renderDeviceProfile\(\); applyCloudPrefs\(\);/g)?.length, 2, "both cloud providers apply synced prefs after a pull");
  assert.match(cards, /localStorage\.setItem\(KEY, JSON\.stringify\(layout\)\); \} catch \{\} window\.LifeLedgerPrefs\?\.changed\(\);/);
  assert.match(widgets, /window\.LifeLedgerPrefs\?\.keys\(\)\.includes\(k\)/);
  assert.match(app, /function notePrefChange\(\) \{\n  if \(!cloudMode/, "local edition never writes prefs into records");
});
