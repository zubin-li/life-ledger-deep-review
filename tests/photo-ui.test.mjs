import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const photos = readFileSync(new URL("../public/photo-memories.js", import.meta.url), "utf8");

test("deployed photo memories live inside the mood note", () => {
  const moodDialog = html.match(/id="moodReasonDialog"([\s\S]*?)<\/dialog>/);
  assert.ok(moodDialog);
  assert.match(moodDialog[1], /id="moodPhotoSection"/);
  assert.match(moodDialog[1], /id="moodPhotoInput"/);
  assert.match(app, /enabled: hostedCloudMode/);
  assert.match(photos, /MAX_PER_DAY = 3/);
  assert.match(photos, /MAX_OUTPUT_BYTES = 1_200_000/);
  assert.match(html, /accept="image\/\*,\.heic,\.heif"/);
  assert.match(photos, /heic2any\.min\.js/);
  assert.match(photos, /PHOTO_HEIC_UNSUPPORTED/);
  assert.match(photos, /PHOTO_PROCESSING_FAILED/);
  assert.match(photos, /webp\?\.type === "image\/webp"/);
  assert.match(photos, /const scale = 0\.78/);
  assert.match(css, /\.mood-photo-list/);
  assert.match(css, /\.memory-entry-photos\[data-count="1"\]/);
  assert.match(css, /\.memory-entry-photo img \{ width: 100%; height: 100%/);
  assert.match(app, /memory-entry-photos" data-count=/);
});

test("timeline and long-term sidebar reuse existing private records", () => {
  assert.match(html, /data-view="timeline"/);
  assert.match(html, /id="timelineView"/);
  assert.match(html, /id="sidebarLongTermList"/);
  assert.match(app, /function renderTimeline\(\)/);
  assert.match(app, /state\.longTermGoals/);
  assert.match(css, /\.main-nav \{ grid-template-columns: repeat\(5, 1fr\); \}/);
});

test("photo compression falls back from false WebP support and reduces dimensions", async () => {
  class FakeCanvas {
    width = 0;
    height = 0;
    getContext() {
      return { drawImage() {}, fillRect() {}, set fillStyle(value) {}, set imageSmoothingEnabled(value) {}, set imageSmoothingQuality(value) {} };
    }
    toBlob(callback, type) {
      if (type === "image/webp") {
        callback(new Blob([new Uint8Array(16)], { type: "image/png" }));
        return;
      }
      const size = this.width > 1000 ? 1_300_000 : 400_000;
      callback(new Blob([new Uint8Array(size)], { type: "image/jpeg" }));
    }
  }
  const window = { createImageBitmap: async () => ({ width: 4000, height: 3000, close() {} }) };
  const context = {
    window,
    document: { createElement: tag => tag === "canvas" ? new FakeCanvas() : {}, head: { append() {} } },
    Blob,
    File,
    URL,
    Image: class {},
  };
  vm.runInNewContext(photos, context);
  const file = new File([new Uint8Array(32)], "apple-photo.jpg", { type: "image/jpeg" });
  const result = await window.LifeLedgerPhotoMemories.compressPhoto(file);
  assert.equal(result.blob.type, "image/jpeg");
  assert.ok(result.blob.size <= 1_200_000);
  assert.ok(Math.max(result.width, result.height) < 1600);
});
