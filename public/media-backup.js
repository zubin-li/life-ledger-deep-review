(function attachMediaBackup(root) {
  "use strict";

  const MAGIC_TEXT = "LIFELEDGERMEDIA1\n";
  const MAGIC = new TextEncoder().encode(MAGIC_TEXT);
  const FORMAT = "life-ledger-media-backup";
  const VERSION = 1;
  const STREAM_CHUNK_BYTES = 64 * 1024;
  const MAX_MANIFEST_BYTES = 10 * 1024 * 1024;
  const MAX_PHOTO_BYTES = 1_200_000;

  function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return bytes;
  }

  async function readExact(source, length) {
    const out = new Uint8Array(length);
    let offset = 0;
    while (offset < length) {
      const part = await source.read(length - offset);
      if (!part || part.byteLength === 0) throw new Error("Unexpected media backup content");
      out.set(part.subarray(0, Math.min(part.byteLength, length - offset)), offset);
      offset += part.byteLength;
      if (offset < length && part.byteLength === 0) throw new Error("Unexpected media backup content");
    }
    return out;
  }

  function validatePhotoMeta(photo, fileSize, offset) {
    const size = Number(photo.size);
    if (!Number.isInteger(size) || size < 1 || size > MAX_PHOTO_BYTES || offset + size > fileSize) {
      throw new Error("Invalid media record");
    }
    return size;
  }

  function validateManifest(manifest) {
    if (manifest?.format !== FORMAT || manifest?.version !== VERSION || !Array.isArray(manifest.photos) || !manifest.backup) {
      throw new Error("Unsupported media backup");
    }
  }

  function photoManifestEntry(photo, blob) {
    if (blob.size > MAX_PHOTO_BYTES) throw new Error("Invalid media record");
    return {
      id: photo.id,
      backupId: photo.backupId || photo.id,
      date: photo.date,
      contentType: photo.contentType || blob.type || "application/octet-stream",
      size: blob.size,
      width: photo.width || 0,
      height: photo.height || 0,
      createdAt: photo.createdAt || 0,
    };
  }

  async function inspectPhoto(photo, fetcher = fetch) {
    const response = await fetcher(photo.url, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Unable to read photo ${photo.id}`);
    const blob = await response.blob();
    return photoManifestEntry(photo, blob);
  }

  async function writeBundle(sink, backup, photos, fetcher = fetch) {
    const photoMeta = [];
    for (const photo of photos) {
      photoMeta.push(await inspectPhoto(photo, fetcher));
    }
    const manifest = {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      backup,
      photos: photoMeta,
    };
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
    if (!manifestBytes.length || manifestBytes.length > MAX_MANIFEST_BYTES) throw new Error("Invalid media manifest");
    await sink.write(MAGIC);
    await sink.write(uint32(manifestBytes.length));
    await sink.write(manifestBytes);
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index];
      const response = await fetcher(photo.url, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Unable to read photo ${photo.id}`);
      const blob = await response.blob();
      try {
        if (blob.size !== photoMeta[index].size) throw new Error(`Invalid media record for photo ${photo.id}`);
        await copyBlobInChunks(blob, sink);
      } finally {
        // Each photo blob is scoped to one loop iteration so export stays bounded.
      }
    }
  }

  async function copyBlobInChunks(blob, sink) {
    let offset = 0;
    while (offset < blob.size) {
      const slice = blob.slice(offset, offset + STREAM_CHUNK_BYTES);
      const bytes = new Uint8Array(await slice.arrayBuffer());
      await sink.write(bytes);
      offset += bytes.byteLength;
    }
  }

  async function createBundle(backup, photos, fetcher = fetch) {
    const chunks = [];
    await writeBundle({ write: async chunk => chunks.push(chunk) }, backup, photos, fetcher);
    return new Blob(chunks, { type: "application/x-life-ledger-media" });
  }

  async function isBundle(file) {
    if (!(file instanceof Blob) || file.size < MAGIC.length + 4) return false;
    const bytes = new Uint8Array(await file.slice(0, MAGIC.length).arrayBuffer());
    return bytes.every((byte, index) => byte === MAGIC[index]);
  }

  async function parseBundleHeader(source, fileSize) {
    const magic = await readExact(source, MAGIC.length);
    if (!magic.every((byte, index) => byte === MAGIC[index])) throw new Error("Invalid Life Ledger media backup");
    const lengthBytes = await readExact(source, 4);
    const manifestLength = new DataView(lengthBytes.buffer).getUint32(0, true);
    if (!manifestLength || manifestLength > MAX_MANIFEST_BYTES) throw new Error("Invalid media manifest");
    const manifestBytes = await readExact(source, manifestLength);
    const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
    validateManifest(manifest);
    const headerEnd = MAGIC.length + 4 + manifestLength;
    if (headerEnd > fileSize) throw new Error("Invalid media manifest");
    return { manifest, headerEnd };
  }

  async function parseBundle(file) {
    if (!await isBundle(file)) throw new Error("Invalid Life Ledger media backup");
    const source = {
      offset: 0,
      async read(length) {
        const end = Math.min(file.size, this.offset + length);
        const chunk = new Uint8Array(await file.slice(this.offset, end).arrayBuffer());
        this.offset = end;
        return chunk;
      },
    };
    const { manifest, headerEnd } = await parseBundleHeader(source, file.size);
    let offset = headerEnd;
    const entries = [];
    for (const photo of manifest.photos) {
      const size = validatePhotoMeta(photo, file.size, offset);
      entries.push({ photo, blob: file.slice(offset, offset + size, photo.contentType) });
      offset += size;
    }
    if (offset !== file.size) throw new Error("Unexpected media backup content");
    return { manifest, entries };
  }

  async function parseBundleStream(source, fileSize) {
    const { manifest, headerEnd } = await parseBundleHeader({ read: length => source.read(length) }, fileSize);
    let offset = headerEnd;
    const entries = [];
    for (const photo of manifest.photos) {
      const size = validatePhotoMeta(photo, fileSize, offset);
      offset += size;
      entries.push({
        photo,
        async readBlob() {
          const bytes = await readExact(source, size);
          return new Blob([bytes], { type: photo.contentType || "application/octet-stream" });
        },
      });
    }
    if (offset !== fileSize) throw new Error("Unexpected media backup content");
    return { manifest, entries };
  }

  async function parseBundlePreview(source, fileSize) {
    const { manifest } = await parseBundleHeader(source, fileSize);
    return manifest;
  }

  root.LifeLedgerMediaBackup = {
    FORMAT,
    MAGIC_TEXT,
    STREAM_CHUNK_BYTES,
    VERSION,
    createBundle,
    writeBundle,
    parseBundle,
    parseBundleStream,
    parseBundlePreview,
    isBundle,
  };
})(window);