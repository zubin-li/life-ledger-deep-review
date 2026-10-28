import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAX_WALL_BYTES, WALL_TYPES, wallKey, wallSignature } from "../src/wall.js";

const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const bytes = (...b) => Uint8Array.from(b);
const text = s => Uint8Array.from(s, c => c.charCodeAt(0));

test("wall uploads accept only real images and videos up to 50 MB", () => {
  assert.equal(MAX_WALL_BYTES, 50 * 1024 * 1024);
  assert.ok(!WALL_TYPES.has("text/html") && !WALL_TYPES.has("image/svg+xml"));
  assert.ok(wallSignature(bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg"));
  assert.ok(wallSignature(text("GIF89a"), "image/gif"));
  assert.ok(wallSignature(text("\0\0\0 ftypisom"), "video/mp4"));
  assert.ok(!wallSignature(text("<html>"), "image/jpeg"));
  assert.ok(!wallSignature(text("GIF89a"), "image/png"));
});

test("wall files live under the signed-in user's own prefix", () => {
  assert.equal(wallKey("a".repeat(64), "11111111-1111-4111-8111-111111111111"), `${"a".repeat(24)}/wall/11111111-1111-4111-8111-111111111111`);
  assert.match(index, /\/api\/wall\/"\)\) return handlePhotoApi\(request, env, handleWallRequest\)/, "same Access identity check as photos");
});

test("cloud edition keeps the wall list in the synced record and never seeds before the first pull", () => {
  assert.match(widgets, /state\.wallMedia = \{ \.\.\.\(state\.wallMedia \|\| \{\}\), \[id\]: rows\.map\(\(\{ blob, \.\.\.row \}\) => row\) \}/);
  assert.match(widgets, /if \(!window\.LifeLedgerCloudPulled\) \{ waiting = true; return \[\]; \}/);
  assert.ok(!/if \(!shown\("weather"\)\) return;/.test(widgets), "hero chip needs the forecast even with the card hidden");
});
