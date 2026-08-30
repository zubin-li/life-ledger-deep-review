import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/media-backup.js", import.meta.url), "utf8");
const root = {};
vm.runInNewContext(code, {
  window: root, TextEncoder, TextDecoder, Blob, Uint8Array, DataView, JSON, Error, Date,
  fetch: () => { throw new Error("unexpected fetch"); },
});

test("media backup round-trips manifest and compressed photo bytes", async () => {
  const api = root.LifeLedgerMediaBackup;
  const photoBytes = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4, 87, 69, 66, 80]);
  const photoBlob = new Blob([photoBytes], { type: "image/webp" });
  const backup = { format: "life-ledger-backup", schemaVersion: 2, scope: "month", data: { habits: [], logs: {} } };
  const photos = [{ id: "11111111-1111-4111-8111-111111111111", backupId: "11111111-1111-4111-8111-111111111111", date: "2026-08-12", contentType: "image/webp", size: photoBlob.size, width: 800, height: 600 }];
  const bundle = await api.createBundle(backup, photos, async () => new Response(photoBlob));

  assert.equal(await api.isBundle(bundle), true);
  const parsed = await api.parseBundle(bundle);
  assert.equal(parsed.manifest.backup.scope, "month");
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].photo.date, "2026-08-12");
  assert.deepEqual(new Uint8Array(await parsed.entries[0].blob.arrayBuffer()), photoBytes);
});

test("media backup rejects ordinary JSON", async () => {
  const api = root.LifeLedgerMediaBackup;
  const file = new Blob(["{}"], { type: "application/json" });
  assert.equal(await api.isBundle(file), false);
  await assert.rejects(api.parseBundle(file), /Invalid/);
});
