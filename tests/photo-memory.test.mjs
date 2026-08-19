import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, worker, wrangler] = await Promise.all([
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  readFile(new URL("../src/index.js", import.meta.url), "utf8"),
  readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
]);

test("public local edition gates photos while the full edition uses R2", () => {
  assert.match(html, /id="moodPhotoGate"/);
  assert.match(app, /\/api\/media\/capabilities/);
  assert.doesNotMatch(app, /indexedDB\.open/);
  assert.match(worker, /env\.MEDIA\.put/);
  assert.match(wrangler, /"binding": "MEDIA"/);
});

test("daily memory poster keeps a share-friendly four-by-five canvas", () => {
  assert.match(html, /id="moodPosterCanvas" width="1080" height="1350"/);
  assert.match(app, /navigator\.canShare/);
  assert.match(app, /image\/png/);
});
