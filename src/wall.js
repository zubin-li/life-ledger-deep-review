import { PhotoRequestError, releaseStorage, reserveOperation, reserveStorage } from "./photos.js";

// Today photo wall in the cloud edition (user 10/28: the wall must look the same on every device).
// Files live in the same private R2 bucket as day photos, under the signed-in user's prefix; the list
// (order, focus point) travels in the synced record as state.wallMedia. Same storage and monthly budgets.
const MAX_WALL_BYTES = 50 * 1024 * 1024;
const WALL_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"]);
const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
const ascii = (bytes, from, to) => String.fromCharCode(...bytes.slice(from, to));

function wallSignature(bytes, type) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG";
  if (type === "image/webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  if (type === "image/gif") return ascii(bytes, 0, 4) === "GIF8";
  if (type === "video/mp4" || type === "video/quicktime") return ascii(bytes, 4, 8) === "ftyp";
  if (type === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  return false;
}

const wallKey = (keyHash, id) => `${keyHash.slice(0, 24)}/wall/${id.toLowerCase()}`;

async function handleWallRequest(request, env, keyHash) {
  if (!env.PHOTOS) throw new PhotoRequestError("Photo storage is not configured", 503, "PHOTO_STORAGE_UNAVAILABLE");
  const id = decodeURIComponent(new URL(request.url).pathname.replace(/^\/api\/wall\/?/, ""));
  if (!MEDIA_ID.test(id)) throw new PhotoRequestError("Invalid media identifier");
  const key = wallKey(keyHash, id);

  if (request.method === "PUT") {
    const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!WALL_TYPES.has(type)) throw new PhotoRequestError("Unsupported media type", 415, "WALL_TYPE_UNSUPPORTED");
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_WALL_BYTES) throw new PhotoRequestError("Media is too large", 413, "WALL_TOO_LARGE");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_WALL_BYTES) throw new PhotoRequestError("Media is too large", 413, "WALL_TOO_LARGE");
    if (!wallSignature(bytes, type)) throw new PhotoRequestError("File content does not match its type", 415, "WALL_TYPE_MISMATCH");
    if (await env.PHOTOS.head(key)) return json({ ok: true, id, existing: true });
    await reserveOperation(env, "write");
    await reserveStorage(env, bytes.length);
    try {
      await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: type } });
    } catch (error) {
      await releaseStorage(env, bytes.length);
      throw error;
    }
    return json({ ok: true, id, size: bytes.length }, 201);
  }
  if (request.method === "GET") {
    await reserveOperation(env, "read");
    const object = await env.PHOTOS.get(key);
    if (!object) throw new PhotoRequestError("Media not found", 404, "WALL_NOT_FOUND");
    return new Response(object.body, {
      headers: {
        "content-type": object.httpMetadata?.contentType || "application/octet-stream",
        "content-length": String(object.size),
        "cache-control": "private, max-age=604800",
        "content-security-policy": "default-src 'none'",
        "x-content-type-options": "nosniff",
        etag: object.httpEtag,
      },
    });
  }
  if (request.method === "DELETE") {
    const head = await env.PHOTOS.head(key);
    if (!head) return json({ ok: true });
    await env.PHOTOS.delete(key);
    await releaseStorage(env, head.size);
    return json({ ok: true });
  }
  throw new PhotoRequestError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
}

export { MAX_WALL_BYTES, WALL_TYPES, handleWallRequest, wallKey, wallSignature };
