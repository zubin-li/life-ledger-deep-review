import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_LIBRARY_BYTES,
  MAX_MONTHLY_R2_READS,
  MAX_MONTHLY_R2_WRITES,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_DAY,
  hasExpectedSignature,
  publicPhoto,
  usagePeriod,
  validDate,
} from "../src/photos.js";

test("photo limits keep the deployment inside a private free-tier budget", () => {
  assert.equal(MAX_PHOTOS_PER_DAY, 3);
  assert.equal(MAX_PHOTO_BYTES, 1_200_000);
  assert.equal(MAX_LIBRARY_BYTES, 8_000_000_000);
  assert.equal(MAX_MONTHLY_R2_WRITES, 10_000);
  assert.equal(MAX_MONTHLY_R2_READS, 1_000_000);
  assert.equal(usagePeriod(new Date("2026-08-30T23:59:59Z")), "2026-08");
});

test("photo validation accepts only real supported signatures", () => {
  assert.equal(hasExpectedSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0]), "image/jpeg"), true);
  assert.equal(hasExpectedSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]), "image/png"), true);
  assert.equal(hasExpectedSignature(Uint8Array.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]), "image/webp"), true);
  assert.equal(hasExpectedSignature(Uint8Array.from([60, 115, 118, 103]), "image/jpeg"), false);
  assert.equal(validDate("2026-08-30"), true);
  assert.equal(validDate("30-08-2026"), false);
});

test("public photo metadata never exposes an R2 object key", () => {
  const photo = publicPhoto({
    id: "33f37f4e-0c52-4cf0-bde8-76932e283a7a",
    source_id: "4f72318a-9478-4dfa-8c93-07f4980f1f4d",
    entry_date: "2026-08-30",
    content_type: "image/webp",
    size_bytes: 12345,
    width: 1200,
    height: 900,
    created_at: 123456,
    object_key: "private/secret.webp",
  });
  assert.equal(photo.objectKey, undefined);
  assert.equal(photo.backupId, "4f72318a-9478-4dfa-8c93-07f4980f1f4d");
  assert.equal(photo.url, "/api/photos/33f37f4e-0c52-4cf0-bde8-76932e283a7a");
});
