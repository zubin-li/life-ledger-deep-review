import assert from "node:assert/strict";
import { createWriteStream } from "node:fs";
import fs from "node:fs";
import { open, rm, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/media-backup.js", import.meta.url), "utf8");
const root = {};
vm.runInNewContext(code, {
  window: root, TextEncoder, TextDecoder, Blob, Uint8Array, DataView, JSON, Error, Date,
  fetch: () => { throw new Error("unexpected fetch"); },
});

function photoList(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `11111111-1111-4111-8111-1111111111${String(index).padStart(2, "0")}`,
    backupId: `22222222-2222-4222-8222-222222222222${String(index).padStart(2, "0")}`,
    date: "2026-08-12",
    url: `photo-${index}`,
    contentType: "application/octet-stream",
    width: 800,
    height: 600,
    createdAt: 1755000000000 + index,
  }));
}

function createFetcher(chunkSize) {
  return async (url) => {
    const match = url.match(/photo-(\d+)/);
    const index = match ? Number(match[1]) : 0;
    const byte = (index % 251) + 1;
    const data = new Uint8Array(chunkSize);
    data.fill(byte);
    return new Response(data);
  };
}

function fileWriteSink(path, onChunk) {
  const stream = createWriteStream(path);
  return {
    async write(chunk) {
      if (onChunk) onChunk(chunk);
      if (!stream.write(chunk)) {
        await new Promise(resolve => stream.once("drain", resolve));
      }
    },
    async close() {
      await new Promise((resolve, reject) => stream.end(err => (err ? reject(err) : resolve())));
    },
  };
}

async function fileReadSource(path) {
  const info = await stat(path);
  const fd = await open(path, "r");
  let position = 0;
  return {
    length: info.size,
    async read(maxLength) {
      const buffer = Buffer.alloc(maxLength);
      const { bytesRead } = await fd.read(buffer, 0, maxLength, position);
      if (!bytesRead) return new Uint8Array(0);
      position += bytesRead;
      return new Uint8Array(buffer.subarray(0, bytesRead));
    },
    async close() {
      await fd.close();
    },
  };
}

test("media backup no longer hard-caps bundle size at 160 MiB", () => {
  assert.equal("MAX_BUNDLE_BYTES" in (root.LifeLedgerMediaBackup || {}), false);
  assert.ok(root.LifeLedgerMediaBackup.writeBundle);
  assert.ok(root.LifeLedgerMediaBackup.parseBundleStream);
});

test("streaming write stays bounded while exporting more than 160 MiB", async () => {
  const api = root.LifeLedgerMediaBackup;
  const chunkSize = 800 * 1024;
  const photoCount = 210;
  const photos = photoList(photoCount);
  const backup = { format: "life-ledger-backup", schemaVersion: 3, scope: "month", data: { habits: [], logs: {} } };
  const fetcher = createFetcher(chunkSize);
  let retained = 0;
  let peak = 0;
  let totalWritten = 0;
  let maxChunk = 0;
  const sink = {
    async write(chunk) {
      maxChunk = Math.max(maxChunk, chunk.byteLength);
      retained += chunk.byteLength;
      peak = Math.max(peak, retained);
      totalWritten += chunk.byteLength;
      retained -= chunk.byteLength;
    },
  };
  await api.writeBundle(sink, backup, photos, fetcher);
  assert.ok(photoCount * chunkSize > 160 * 1024 * 1024);
  assert.ok(peak <= api.STREAM_CHUNK_BYTES, `peak retained ${peak} bytes`);
  assert.ok(maxChunk <= api.STREAM_CHUNK_BYTES, `max chunk ${maxChunk} exceeded ${api.STREAM_CHUNK_BYTES}`);
  assert.ok(totalWritten > 160 * 1024 * 1024);
});

test("streaming round-trip exceeds 160 MiB without building one full bundle blob", async () => {
  const api = root.LifeLedgerMediaBackup;
  const chunkSize = 800 * 1024;
  const photoCount = 210;
  const photos = photoList(photoCount);
  const backup = { format: "life-ledger-backup", schemaVersion: 3, scope: "month", data: { habits: [], logs: {} } };
  const fetcher = createFetcher(chunkSize);
  const fixture = join(tmpdir(), `ll-media-backup-${Date.now()}.llmedia`);
  let maxWriteChunk = 0;
  let totalWritten = 0;

  await api.writeBundle(
    fileWriteSink(fixture, chunk => {
      maxWriteChunk = Math.max(maxWriteChunk, chunk.byteLength);
      totalWritten += chunk.byteLength;
    }),
    backup,
    photos,
    fetcher,
  );

  const size = (await stat(fixture)).size;
  assert.ok(size > 160 * 1024 * 1024);
  assert.equal(totalWritten, size);
  assert.ok(maxWriteChunk <= api.STREAM_CHUNK_BYTES, `max write chunk ${maxWriteChunk} exceeded ${api.STREAM_CHUNK_BYTES}`);

  const source = await fileReadSource(fixture);
  const parsed = await api.parseBundleStream(source, source.length);
  assert.equal(parsed.entries.length, photoCount);

  let held = 0;
  let peak = 0;
  let recovered = 0;
  for (let index = 0; index < parsed.entries.length; index += 1) {
    const entry = parsed.entries[index];
    held += chunkSize;
    peak = Math.max(peak, held);
    const blob = await entry.readBlob();
    assert.equal(blob.size, chunkSize);
    const sampleBuffer = await blob.slice(0, 16).arrayBuffer();
    const sample = new Uint8Array(sampleBuffer);
    const expectedByte = (index % 251) + 1;
    assert.equal(sample[0], expectedByte, `byte integrity mismatch at photo ${index}`);
    recovered += chunkSize;
    held -= chunkSize;
  }
  await source.close();
  await unlink(fixture);
  assert.equal(recovered, photoCount * chunkSize);
  assert.equal(peak, chunkSize);
});