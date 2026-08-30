const MAX_PHOTO_BYTES = 1_200_000;
const MAX_LIBRARY_BYTES = 8_000_000_000;
const MAX_PHOTOS_PER_DAY = 3;
const MAX_MONTHLY_R2_WRITES = 10_000;
const MAX_MONTHLY_R2_READS = 1_000_000;
const BUCKET_USAGE_KEY = "__life_ledger_photo_bucket__";
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

class PhotoRequestError extends Error {
  constructor(message, status = 400, code = "PHOTO_REQUEST_INVALID") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function integerInRange(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : 0;
}

function hasExpectedSignature(bytes, contentType) {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (contentType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

function publicPhoto(row) {
  return {
    id: row.id,
    backupId: row.source_id || row.id,
    date: row.entry_date,
    contentType: row.content_type,
    size: Number(row.size_bytes),
    width: Number(row.width || 0),
    height: Number(row.height || 0),
    createdAt: Number(row.created_at),
    url: `/api/photos/${encodeURIComponent(row.id)}`,
  };
}

function usagePeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

async function reserveOperation(env, type) {
  const write = type === "write" ? 1 : 0;
  const read = type === "read" ? 1 : 0;
  const result = await env.DB.prepare(`
    INSERT INTO photo_operation_usage (period, write_operations, read_operations, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(period) DO UPDATE SET
      write_operations = photo_operation_usage.write_operations + excluded.write_operations,
      read_operations = photo_operation_usage.read_operations + excluded.read_operations,
      updated_at = excluded.updated_at
    WHERE photo_operation_usage.write_operations + excluded.write_operations <= ?
      AND photo_operation_usage.read_operations + excluded.read_operations <= ?
  `).bind(usagePeriod(), write, read, Date.now(), MAX_MONTHLY_R2_WRITES, MAX_MONTHLY_R2_READS).run();
  if (!result.success) throw new PhotoRequestError("Unable to reserve photo operation", 503, "PHOTO_STORAGE_UNAVAILABLE");
  if (!result.meta?.changes) throw new PhotoRequestError("Monthly private photo allowance reached", 429, "PHOTO_MONTHLY_LIMIT");
}

async function reserveStorage(env, bytes) {
  const result = await env.DB.prepare(`
    INSERT INTO photo_usage (key_hash, total_bytes, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      total_bytes = photo_usage.total_bytes + excluded.total_bytes,
      updated_at = excluded.updated_at
    WHERE photo_usage.total_bytes + excluded.total_bytes <= ?
  `).bind(BUCKET_USAGE_KEY, bytes, Date.now(), MAX_LIBRARY_BYTES).run();
  if (!result.success) throw new PhotoRequestError("Unable to reserve photo storage", 503, "PHOTO_STORAGE_UNAVAILABLE");
  if (!result.meta?.changes) throw new PhotoRequestError("Photo library storage limit reached", 413, "PHOTO_LIBRARY_FULL");
}

async function releaseStorage(env, bytes) {
  await env.DB.prepare(`
    UPDATE photo_usage
    SET total_bytes = MAX(0, total_bytes - ?), updated_at = ?
    WHERE key_hash = ?
  `).bind(bytes, Date.now(), BUCKET_USAGE_KEY).run();
}

async function uploadPhoto(request, env, keyHash) {
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new PhotoRequestError("Invalid multipart form", 400, "PHOTO_FORM_INVALID");
  }
  const file = form.get("photo");
  const date = String(form.get("date") || "");
  const requestedSourceId = String(form.get("sourceId") || "");
  if (!(file instanceof File)) throw new PhotoRequestError("Photo file is required");
  if (!validDate(date)) throw new PhotoRequestError("A valid entry date is required");
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) throw new PhotoRequestError("Unsupported photo format", 415, "PHOTO_FORMAT_UNSUPPORTED");
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new PhotoRequestError("Photo is too large", 413, "PHOTO_TOO_LARGE");
  if (requestedSourceId && !/^[0-9a-f-]{36}$/i.test(requestedSourceId)) throw new PhotoRequestError("Invalid backup photo identifier");

  if (requestedSourceId) {
    const existing = await env.DB.prepare(`
      SELECT id, source_id, entry_date, content_type, size_bytes, width, height, created_at
      FROM photo_attachments WHERE key_hash = ? AND source_id = ?
    `).bind(keyHash, requestedSourceId).first();
    if (existing) return json({ photo: publicPhoto(existing), restored: false });
  }

  const count = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM photo_attachments WHERE key_hash = ? AND entry_date = ?
  `).bind(keyHash, date).first();
  if (Number(count?.count || 0) >= MAX_PHOTOS_PER_DAY) {
    throw new PhotoRequestError("This day already has three photos", 409, "PHOTO_DAY_LIMIT");
  }

  const body = await file.arrayBuffer();
  if (!hasExpectedSignature(new Uint8Array(body.slice(0, 16)), file.type)) {
    throw new PhotoRequestError("Photo contents do not match its format", 415, "PHOTO_SIGNATURE_INVALID");
  }

  const id = crypto.randomUUID();
  const sourceId = requestedSourceId || id;
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectKey = `${keyHash.slice(0, 24)}/${date}/${id}.${extension}`;
  const width = integerInRange(form.get("width"), 1, 10000);
  const height = integerInRange(form.get("height"), 1, 10000);
  const createdAt = Date.now();

  await reserveOperation(env, "write");
  await reserveStorage(env, file.size);
  try {
    await env.PHOTOS.put(objectKey, body, {
      httpMetadata: { contentType: file.type, cacheControl: "private, no-store" },
    });
    const inserted = await env.DB.prepare(`
      INSERT INTO photo_attachments
        (id, source_id, key_hash, entry_date, object_key, content_type, size_bytes, width, height, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, sourceId, keyHash, date, objectKey, file.type, file.size, width, height, createdAt).run();
    if (!inserted.success) throw new Error("Photo metadata insert failed");
  } catch (error) {
    await env.PHOTOS.delete(objectKey).catch(() => {});
    await releaseStorage(env, file.size).catch(() => {});
    throw error;
  }

  return json({ photo: publicPhoto({
    id, source_id: sourceId, entry_date: date, content_type: file.type, size_bytes: file.size,
    width, height, created_at: createdAt,
  }) }, 201);
}

async function listPhotos(url, env, keyHash) {
  const date = url.searchParams.get("date");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  let statement;
  if (date) {
    if (!validDate(date)) throw new PhotoRequestError("Invalid date");
    statement = env.DB.prepare(`
      SELECT id, source_id, entry_date, content_type, size_bytes, width, height, created_at
      FROM photo_attachments WHERE key_hash = ? AND entry_date = ? ORDER BY created_at
    `).bind(keyHash, date);
  } else {
    if (!validDate(from) || !validDate(to) || from > to) throw new PhotoRequestError("A valid date range is required");
    statement = env.DB.prepare(`
      SELECT id, source_id, entry_date, content_type, size_bytes, width, height, created_at
      FROM photo_attachments
      WHERE key_hash = ? AND entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date DESC, created_at
      LIMIT 200
    `).bind(keyHash, from, to);
  }
  const result = await statement.all();
  const usage = await env.DB.prepare("SELECT total_bytes FROM photo_usage WHERE key_hash = ?").bind(BUCKET_USAGE_KEY).first();
  return json({
    photos: (result.results || []).map(publicPhoto),
    usage: { bytes: Number(usage?.total_bytes || 0), limit: MAX_LIBRARY_BYTES },
  });
}

async function getPhoto(id, env, keyHash) {
  const row = await env.DB.prepare(`
    SELECT object_key, content_type FROM photo_attachments WHERE id = ? AND key_hash = ?
  `).bind(id, keyHash).first();
  if (!row) throw new PhotoRequestError("Photo not found", 404, "PHOTO_NOT_FOUND");
  await reserveOperation(env, "read");
  const object = await env.PHOTOS.get(row.object_key);
  if (!object) throw new PhotoRequestError("Photo file is unavailable", 404, "PHOTO_OBJECT_MISSING");
  return new Response(object.body, {
    headers: {
      "content-type": row.content_type,
      "content-length": String(object.size),
      "cache-control": "private, no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
      etag: object.httpEtag,
    },
  });
}

async function deletePhoto(id, env, keyHash) {
  const row = await env.DB.prepare(`
    SELECT object_key, size_bytes FROM photo_attachments WHERE id = ? AND key_hash = ?
  `).bind(id, keyHash).first();
  if (!row) throw new PhotoRequestError("Photo not found", 404, "PHOTO_NOT_FOUND");
  await env.PHOTOS.delete(row.object_key);
  const removed = await env.DB.prepare("DELETE FROM photo_attachments WHERE id = ? AND key_hash = ?")
    .bind(id, keyHash).run();
  if (!removed.success) throw new PhotoRequestError("Photo could not be deleted", 500, "PHOTO_DELETE_FAILED");
  await releaseStorage(env, Number(row.size_bytes));
  return json({ ok: true });
}

async function handlePhotoRequest(request, env, keyHash) {
  if (!env.PHOTOS) throw new PhotoRequestError("Photo storage is not configured", 503, "PHOTO_STORAGE_UNAVAILABLE");
  const url = new URL(request.url);
  const suffix = decodeURIComponent(url.pathname.replace(/^\/api\/photos\/?/, ""));
  if (!suffix) {
    if (request.method === "GET") return listPhotos(url, env, keyHash);
    if (request.method === "POST") return uploadPhoto(request, env, keyHash);
    throw new PhotoRequestError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
  }
  if (!/^[0-9a-f-]{36}$/i.test(suffix)) throw new PhotoRequestError("Invalid photo identifier");
  if (request.method === "GET") return getPhoto(suffix, env, keyHash);
  if (request.method === "DELETE") return deletePhoto(suffix, env, keyHash);
  throw new PhotoRequestError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
}

export {
  ALLOWED_PHOTO_TYPES,
  MAX_LIBRARY_BYTES,
  MAX_MONTHLY_R2_READS,
  MAX_MONTHLY_R2_WRITES,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_DAY,
  PhotoRequestError,
  handlePhotoRequest,
  hasExpectedSignature,
  publicPhoto,
  usagePeriod,
  validDate,
};
