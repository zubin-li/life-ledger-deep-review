import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

// Measured regression in PR #13: a browser that already had a custom Today layout/city or a profile never uploaded
// them, because the seed save ran during the first pull (gate closed) and was not marked dirty.
test("first-device seeds are uploaded once the first pull has opened the gate", () => {
  assert.match(app, /state\.prefs = seed; saveState\(options\); cloudSeedPending = true;/);
  assert.match(app, /state\.profile = cloneData\(local\); saveState\(options\); cloudSeedPending = true;/);
  assert.match(app, /result\.outcome === "loaded" && cloudSeedPending && !cloudSyncConflictBlocksAutoPush\(\)\) \{[\s\S]{0,260}?saveState\(\{ bumpUpdatedAt: true \}\);/);
});

test("a full restore and its Undo keep the cloud photo wall list", () => {
  const keep = app.match(/function keepCloudWallMedia\(wallMedia\) \{\n([^\n]+)\n\}/);
  assert.ok(keep, "helper exists");
  const run = (cloudMode, current, restored) => {
    const ctx = { cloudMode, state: restored, isRecord: v => v && typeof v === "object" && !Array.isArray(v), cloneData: v => JSON.parse(JSON.stringify(v)) };
    new Function("ctx", `with (ctx) { (function keepCloudWallMedia(wallMedia) { ${keep[1]} })(ctx.current); }`)({ ...ctx, current });
    return ctx.state;
  };
  const wall = { wall2: [{ id: "11111111-1111-4111-8111-111111111111", x: 30, y: 60 }] };
  assert.deepEqual(run(true, wall, { habits: [], logs: {} }).wallMedia, wall);
  assert.equal(run(false, wall, { habits: [], logs: {} }).wallMedia, undefined, "local edition unchanged");
  assert.equal(app.match(/keepCloudWallMedia\(wallMedia\);/g)?.length, 2, "restore and undo both keep it");
});
