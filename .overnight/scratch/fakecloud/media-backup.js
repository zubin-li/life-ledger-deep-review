(function attachMediaBackup(root) {
  "use strict";

  const MAGIC_TEXT = "LIFELEDGERMEDIA1\n";
  const MAGIC = new TextEncoder().encode(MAGIC_TEXT);
  const FORMAT = "life-ledger-media-backup";
  const VERSION = 1;
  const MAX_BUNDLE_BYTES = 160 * 1024 * 1024;

  function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return bytes;
  }

  async function createBundle(backup, photos, fetcher = fetch) {
    const records = [];
    for (const photo of photos) {
      const response = await fetcher(photo.url, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Unable to read photo ${photo.id}`);
      const blob = await response.blob();
      records.push({
        photo: {
          id: photo.id,
          backupId: photo.backupId || photo.id,
          date: photo.date,
          contentType: photo.contentType || blob.type,
          size: blob.size,
          width: photo.width || 0,
          height: photo.height || 0,
          createdAt: photo.createdAt || 0,
        },
        blob,
      });
    }
    const manifest = {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      backup,
      photos: records.map(record => record.photo),
    };
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
    const chunks = [MAGIC, uint32(manifestBytes.length), manifestBytes];
    records.forEach(record => chunks.push(record.blob));
    const bundle = new Blob(chunks, { type: "application/x-life-ledger-media" });
    if (bundle.size > MAX_BUNDLE_BYTES) throw new Error("Media backup is too large");
    return bundle;
  }

  async function isBundle(file) {
    if (!(file instanceof Blob) || file.size < MAGIC.length + 4) return false;
    const bytes = new Uint8Array(await file.slice(0, MAGIC.length).arrayBuffer());
    return bytes.every((byte, index) => byte === MAGIC[index]);
  }

  async function parseBundle(file) {
    if (file.size > MAX_BUNDLE_BYTES) throw new Error("Media backup is too large");
    if (!await isBundle(file)) throw new Error("Invalid Life Ledger media backup");
    const lengthBytes = await file.slice(MAGIC.length, MAGIC.length + 4).arrayBuffer();
    const manifestLength = new DataView(lengthBytes).getUint32(0, true);
    if (!manifestLength || manifestLength > 10 * 1024 * 1024) throw new Error("Invalid media manifest");
    const manifestStart = MAGIC.length + 4;
    const manifestEnd = manifestStart + manifestLength;
    const manifest = JSON.parse(await file.slice(manifestStart, manifestEnd).text());
    if (manifest?.format !== FORMAT || manifest?.version !== VERSION || !Array.isArray(manifest.photos) || !manifest.backup) {
      throw new Error("Unsupported media backup");
    }
    let offset = manifestEnd;
    const entries = manifest.photos.map(photo => {
      const size = Number(photo.size);
      if (!Number.isInteger(size) || size < 1 || size > 1_200_000 || offset + size > file.size) throw new Error("Invalid media record");
      const blob = file.slice(offset, offset + size, photo.contentType);
      offset += size;
      return { photo, blob };
    });
    if (offset !== file.size) throw new Error("Unexpected media backup content");
    return { manifest, entries };
  }

  root.LifeLedgerMediaBackup = { FORMAT, MAGIC_TEXT, MAX_BUNDLE_BYTES, VERSION, createBundle, isBundle, parseBundle };
})(window);
