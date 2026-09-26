const INVALID_SCHEMES = new Set(["javascript:", "data:", "file:"]);

function isLocalDevHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function validateCloudUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return { ok: false, error: "empty" };

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "malformed" };
  }

  if (INVALID_SCHEMES.has(url.protocol)) return { ok: false, error: "forbidden_scheme" };
  if (url.username || url.password) return { ok: false, error: "credentials_not_allowed" };

  if (url.protocol === "https:") {
    return { ok: true, normalized: url.toString() };
  }

  if (url.protocol === "http:" && isLocalDevHost(url.hostname)) {
    return { ok: true, normalized: url.toString() };
  }

  return { ok: false, error: "https_required" };
}
