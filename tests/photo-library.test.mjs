import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import vm from "node:vm";

const photos = readFileSync(new URL("../public/photo-memories.js", import.meta.url), "utf8");

function loadLibrary() {
  let n = 0;
  const sandbox = {
    window: {},
    Blob,
    File,
    URL: { createObjectURL: () => `blob:test-${++n}`, revokeObjectURL() {} },
    crypto: webcrypto,
    document: { createElement() { return {}; }, head: { append() {} } },
  };
  vm.runInNewContext(photos, sandbox);
  const store = sandbox.window.LifeLedgerPhotoMemories.memoryStore();
  return { api: sandbox.window.LifeLedgerPhotoMemories, library: sandbox.window.LifeLedgerPhotoMemories.createLocalLibrary(store) };
}

test("local photo library stores, captions, reorders, and restores a day", async () => {
  const { library } = loadLibrary();
  const blob = new Blob([Uint8Array.from([1, 2, 3, 4])], { type: "image/jpeg" });
  const first = await library.addPrepared({ date: "2026-10-02", blob, width: 20, height: 10, caption: "River" });
  const second = await library.addPrepared({ date: "2026-10-02", blob, width: 20, height: 10 });
  assert.equal(first.caption, "River");
  assert.equal(first.url.startsWith("blob:"), true);
  const captioned = await library.updateCaption(first.id, "Morning walk");
  assert.equal(captioned.caption, "Morning walk");
  const reordered = await library.reorder("2026-10-02", [second.id, first.id]);
  assert.equal(reordered.map(photo => String(photo.id)).join(","), [second.id, first.id].map(String).join(","));
  const removed = await library.remove(first.id);
  assert.equal(removed.caption, "Morning walk");
  const restored = await library.restoreRecord(removed);
  assert.equal(restored.caption, "Morning walk");
  const ranged = await library.listRange("2026-10-01", "2026-10-03");
  assert.equal(ranged.length, 2);
});

test("local photo library rejects a fourth photo and an unsupported file", async () => {
  const { library } = loadLibrary();
  const blob = new Blob([Uint8Array.from([9])], { type: "image/png" });
  for (let index = 0; index < 3; index += 1) {
    await library.addPrepared({ date: "2026-10-03", blob, width: 8, height: 8 });
  }
  await assert.rejects(library.addPrepared({ date: "2026-10-03", blob, width: 8, height: 8 }), error => error.code === "PHOTO_DAY_LIMIT");
  const text = new File([new Uint8Array(8)], "notes.txt", { type: "text/plain" });
  await assert.rejects(library.addFile(text, "2026-10-04"), error => error.code === "PHOTO_FORMAT_UNSUPPORTED");
});
