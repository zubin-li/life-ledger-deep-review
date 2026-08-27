const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
];
const OAUTH_STATE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_CALENDARS = 50;
const MAX_EVENT_RANGE_DAYS = 93;

class CalendarRequestError extends Error {
  constructor(message, status = 400, code = "CALENDAR_REQUEST_INVALID") {
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

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function configured(env) {
  return Boolean(
    String(env.GOOGLE_CALENDAR_CLIENT_ID || "").trim()
    && String(env.GOOGLE_CALENDAR_CLIENT_SECRET || "").trim()
    && String(env.CALENDAR_TOKEN_KEY || "").trim(),
  );
}

function redirectUri(request, env) {
  const explicit = String(env.GOOGLE_CALENDAR_REDIRECT_URI || "").trim();
  return explicit || `${new URL(request.url).origin}/api/calendar/callback`;
}

async function encryptionKey(env, usage) {
  let raw;
  try {
    raw = base64UrlToBytes(String(env.CALENDAR_TOKEN_KEY || ""));
  } catch {
    throw new CalendarRequestError("Calendar token encryption is not configured", 503, "CALENDAR_NOT_CONFIGURED");
  }
  if (raw.byteLength !== 32) {
    throw new CalendarRequestError("Calendar token encryption is not configured", 503, "CALENDAR_NOT_CONFIGURED");
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [usage]);
}

async function encryptToken(token, env) {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const key = await encryptionKey(env, "encrypt");
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    new TextEncoder().encode(token),
  );
  return {
    encryptedToken: bytesToBase64Url(new Uint8Array(encrypted)),
    nonce: bytesToBase64Url(nonce),
  };
}

async function decryptToken(encryptedToken, nonce, env) {
  try {
    const key = await encryptionKey(env, "decrypt");
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(nonce) },
      key,
      base64UrlToBytes(encryptedToken),
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof CalendarRequestError) throw error;
    throw new CalendarRequestError("Stored calendar authorization cannot be decrypted", 503, "CALENDAR_TOKEN_INVALID");
  }
}

async function accountFor(env, keyHash) {
  return env.DB.prepare(`
    SELECT encrypted_refresh_token, token_nonce, scopes, selected_calendar_ids,
           hide_recurring, connected_at, updated_at
    FROM calendar_accounts WHERE key_hash = ?
  `).bind(keyHash).first();
}

function parsedCalendarIds(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === "string").slice(0, MAX_CALENDARS) : [];
  } catch {
    return [];
  }
}

async function tokenRequest(parameters, env) {
  const body = new URLSearchParams(parameters);
  body.set("client_id", String(env.GOOGLE_CALENDAR_CLIENT_ID));
  body.set("client_secret", String(env.GOOGLE_CALENDAR_CLIENT_SECRET));
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    const invalidGrant = payload.error === "invalid_grant";
    throw new CalendarRequestError(
      invalidGrant ? "Google Calendar authorization has expired" : "Google Calendar authorization failed",
      invalidGrant ? 401 : 502,
      invalidGrant ? "CALENDAR_RECONNECT_REQUIRED" : "CALENDAR_GOOGLE_ERROR",
    );
  }
  return payload;
}

async function accessTokenFor(env, account) {
  const refreshToken = await decryptToken(account.encrypted_refresh_token, account.token_nonce, env);
  const tokens = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken }, env);
  return { accessToken: tokens.access_token, refreshToken };
}

async function googleJson(url, accessToken) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CalendarRequestError(
      response.status === 401 ? "Google Calendar authorization has expired" : "Google Calendar could not be reached",
      response.status === 401 ? 401 : 502,
      response.status === 401 ? "CALENDAR_RECONNECT_REQUIRED" : "CALENDAR_GOOGLE_ERROR",
    );
  }
  return payload;
}

async function listCalendars(accessToken) {
  const calendars = [];
  let pageToken = "";
  do {
    const url = new URL(`${GOOGLE_CALENDAR_API}/users/me/calendarList`);
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("showHidden", "false");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const payload = await googleJson(url, accessToken);
    for (const item of payload.items || []) {
      if (!item?.id || item.deleted) continue;
      calendars.push({
        id: item.id,
        name: item.summaryOverride || item.summary || "Calendar",
        primary: Boolean(item.primary),
        selected: item.selected !== false,
        color: item.backgroundColor || "#6f95c8",
        accessRole: item.accessRole || "reader",
      });
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken && calendars.length < 500);
  return calendars.slice(0, MAX_CALENDARS);
}

function dateOnlyFromEvent(event) {
  return String(event.start?.date || event.start?.dateTime || "").slice(0, 10);
}

function normalizeCalendarEvent(event, calendar) {
  if (!event?.id || event.status === "cancelled") return null;
  const selfAttendance = (event.attendees || []).find(attendee => attendee.self);
  if (selfAttendance?.responseStatus === "declined") return null;
  const allDay = Boolean(event.start?.date);
  const startValue = event.start?.date || event.start?.dateTime || "";
  const endValue = event.end?.date || event.end?.dateTime || startValue;
  if (!startValue) return null;
  const originalStart = event.originalStartTime?.dateTime || event.originalStartTime?.date || startValue;
  return {
    id: `${calendar.id}:${event.id}:${originalStart}`,
    providerEventId: event.id,
    calendarId: calendar.id,
    calendarName: calendar.name,
    calendarColor: calendar.color,
    title: event.summary || "Busy",
    start: startValue,
    end: endValue,
    date: dateOnlyFromEvent(event),
    allDay,
    recurring: Boolean(event.recurringEventId || event.recurrence?.length),
    updatedAt: event.updated || "",
  };
}

async function listEventsForCalendar(accessToken, calendar, range) {
  const events = [];
  let pageToken = "";
  do {
    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendar.id)}/events`);
    url.searchParams.set("timeMin", range.timeMin);
    url.searchParams.set("timeMax", range.timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "2500");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const payload = await googleJson(url, accessToken);
    for (const item of payload.items || []) {
      const normalized = normalizeCalendarEvent(item, calendar);
      if (normalized) events.push(normalized);
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken && events.length < 10_000);
  return events;
}

function validatedRange(url) {
  const timeMin = url.searchParams.get("timeMin") || "";
  const timeMax = url.searchParams.get("timeMax") || "";
  const start = new Date(timeMin);
  const end = new Date(timeMax);
  const days = (end - start) / 86400000;
  if (!timeMin || !timeMax || !Number.isFinite(days) || days <= 0 || days > MAX_EVENT_RANGE_DAYS) {
    throw new CalendarRequestError("Calendar range must be between 1 and 93 days", 400, "CALENDAR_RANGE_INVALID");
  }
  return { timeMin: start.toISOString(), timeMax: end.toISOString(), startDate: timeMin.slice(0, 10), endDate: timeMax.slice(0, 10) };
}

async function writeEventCache(env, keyHash, calendar, range, events, syncedAt) {
  await env.DB.prepare(`
    DELETE FROM calendar_event_cache
    WHERE key_hash = ? AND calendar_id = ? AND start_date >= ? AND start_date < ?
  `).bind(keyHash, calendar.id, range.startDate, range.endDate).run();

  const statements = events.map(event => env.DB.prepare(`
    INSERT INTO calendar_event_cache (
      key_hash, calendar_id, instance_key, provider_event_id, title,
      start_value, end_value, start_date, all_day, recurring,
      calendar_name, calendar_color, provider_updated_at, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(key_hash, calendar_id, instance_key) DO UPDATE SET
      title = excluded.title, start_value = excluded.start_value,
      end_value = excluded.end_value, start_date = excluded.start_date,
      all_day = excluded.all_day, recurring = excluded.recurring,
      calendar_name = excluded.calendar_name, calendar_color = excluded.calendar_color,
      provider_updated_at = excluded.provider_updated_at, synced_at = excluded.synced_at
  `).bind(
    keyHash, calendar.id, event.id, event.providerEventId, event.title,
    event.start, event.end, event.date, event.allDay ? 1 : 0, event.recurring ? 1 : 0,
    event.calendarName, event.calendarColor, event.updatedAt, syncedAt,
  ));

  for (let index = 0; index < statements.length; index += 100) {
    const batch = statements.slice(index, index + 100);
    if (batch.length) await env.DB.batch(batch);
  }
}

async function cachedEvents(env, keyHash, range) {
  const result = await env.DB.prepare(`
    SELECT calendar_id, instance_key, provider_event_id, title, start_value,
           end_value, start_date, all_day, recurring, calendar_name,
           calendar_color, provider_updated_at, synced_at
    FROM calendar_event_cache
    WHERE key_hash = ? AND start_date >= ? AND start_date < ?
    ORDER BY start_value ASC
  `).bind(keyHash, range.startDate, range.endDate).all();
  return (result.results || []).map(row => ({
    id: row.instance_key,
    providerEventId: row.provider_event_id,
    calendarId: row.calendar_id,
    calendarName: row.calendar_name,
    calendarColor: row.calendar_color,
    title: row.title,
    start: row.start_value,
    end: row.end_value,
    date: row.start_date,
    allDay: Boolean(row.all_day),
    recurring: Boolean(row.recurring),
    updatedAt: row.provider_updated_at,
    syncedAt: Number(row.synced_at || 0),
  }));
}

async function connect(request, env, keyHash) {
  if (!configured(env)) throw new CalendarRequestError("Google Calendar is not configured", 503, "CALENDAR_NOT_CONFIGURED");
  const state = randomToken(32);
  const verifier = randomToken(48);
  const stateHash = await sha256Base64Url(state);
  const challenge = await sha256Base64Url(verifier);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM calendar_oauth_states WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare(`
    INSERT INTO calendar_oauth_states (state_hash, key_hash, code_verifier, return_to, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(stateHash, keyHash, verifier, "/?calendar=connected&view=today", now + OAUTH_STATE_LIFETIME_MS, now).run();

  const authorizationUrl = new URL(GOOGLE_AUTH_URL);
  authorizationUrl.searchParams.set("client_id", String(env.GOOGLE_CALENDAR_CLIENT_ID));
  authorizationUrl.searchParams.set("redirect_uri", redirectUri(request, env));
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", CALENDAR_SCOPES.join(" "));
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");
  authorizationUrl.searchParams.set("prompt", "consent select_account");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  return json({ authorizationUrl: authorizationUrl.toString() });
}

async function callback(request, env, keyHash) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (url.searchParams.get("error")) {
    return Response.redirect(`${url.origin}/?calendar=denied&view=today`, 302);
  }
  if (!state || !code) throw new CalendarRequestError("Google Calendar callback is incomplete", 400, "CALENDAR_CALLBACK_INVALID");
  const stateHash = await sha256Base64Url(state);
  const record = await env.DB.prepare(`
    SELECT key_hash, code_verifier, return_to, expires_at
    FROM calendar_oauth_states WHERE state_hash = ?
  `).bind(stateHash).first();
  await env.DB.prepare("DELETE FROM calendar_oauth_states WHERE state_hash = ?").bind(stateHash).run();
  if (!record || record.key_hash !== keyHash || Number(record.expires_at) < Date.now()) {
    throw new CalendarRequestError("Google Calendar connection expired. Try again.", 400, "CALENDAR_STATE_INVALID");
  }

  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    code_verifier: record.code_verifier,
    redirect_uri: redirectUri(request, env),
  }, env);
  let refreshToken = tokens.refresh_token || "";
  if (!refreshToken) {
    const existing = await accountFor(env, keyHash);
    if (existing) refreshToken = await decryptToken(existing.encrypted_refresh_token, existing.token_nonce, env);
  }
  if (!refreshToken) throw new CalendarRequestError("Google did not return a refresh token", 502, "CALENDAR_REFRESH_TOKEN_MISSING");
  const encrypted = await encryptToken(refreshToken, env);
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO calendar_accounts (
      key_hash, encrypted_refresh_token, token_nonce, scopes,
      selected_calendar_ids, hide_recurring, connected_at, updated_at
    ) VALUES (?, ?, ?, ?, '[]', 1, ?, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      encrypted_refresh_token = excluded.encrypted_refresh_token,
      token_nonce = excluded.token_nonce,
      scopes = excluded.scopes,
      updated_at = excluded.updated_at
  `).bind(keyHash, encrypted.encryptedToken, encrypted.nonce, CALENDAR_SCOPES.join(" "), now, now).run();
  return Response.redirect(`${url.origin}${record.return_to || "/?calendar=connected&view=today"}`, 302);
}

async function status(env, keyHash) {
  if (!configured(env)) return json({ configured: false, connected: false });
  const account = await accountFor(env, keyHash);
  return json({
    configured: true,
    connected: Boolean(account),
    selectedCalendarIds: account ? parsedCalendarIds(account.selected_calendar_ids) : [],
    hideRecurring: account ? Boolean(account.hide_recurring) : true,
    connectedAt: Number(account?.connected_at || 0),
    updatedAt: Number(account?.updated_at || 0),
  });
}

async function calendars(env, keyHash) {
  const account = await accountFor(env, keyHash);
  if (!account) throw new CalendarRequestError("Connect Google Calendar first", 401, "CALENDAR_NOT_CONNECTED");
  const { accessToken } = await accessTokenFor(env, account);
  const items = await listCalendars(accessToken);
  let selectedCalendarIds = parsedCalendarIds(account.selected_calendar_ids);
  if (!selectedCalendarIds.length) {
    selectedCalendarIds = items.filter(item => item.primary || item.selected).map(item => item.id);
    await env.DB.prepare(`
      UPDATE calendar_accounts SET selected_calendar_ids = ?, updated_at = ? WHERE key_hash = ?
    `).bind(JSON.stringify(selectedCalendarIds), Date.now(), keyHash).run();
  }
  return json({ calendars: items, selectedCalendarIds, hideRecurring: Boolean(account.hide_recurring) });
}

async function updatePreferences(request, env, keyHash) {
  const account = await accountFor(env, keyHash);
  if (!account) throw new CalendarRequestError("Connect Google Calendar first", 401, "CALENDAR_NOT_CONNECTED");
  const body = await request.json().catch(() => null);
  const selectedCalendarIds = Array.isArray(body?.selectedCalendarIds)
    ? [...new Set(body.selectedCalendarIds.filter(id => typeof id === "string" && id.length <= 512))].slice(0, MAX_CALENDARS)
    : null;
  if (!selectedCalendarIds?.length) {
    throw new CalendarRequestError("Select at least one calendar", 400, "CALENDAR_SELECTION_REQUIRED");
  }
  const hideRecurring = body.hideRecurring !== false;
  await env.DB.prepare(`
    UPDATE calendar_accounts
    SET selected_calendar_ids = ?, hide_recurring = ?, updated_at = ?
    WHERE key_hash = ?
  `).bind(JSON.stringify(selectedCalendarIds), hideRecurring ? 1 : 0, Date.now(), keyHash).run();
  return json({ ok: true, selectedCalendarIds, hideRecurring });
}

async function events(request, env, keyHash) {
  const range = validatedRange(new URL(request.url));
  const account = await accountFor(env, keyHash);
  if (!account) throw new CalendarRequestError("Connect Google Calendar first", 401, "CALENDAR_NOT_CONNECTED");
  const selectedIds = parsedCalendarIds(account.selected_calendar_ids);
  const syncedAt = Date.now();
  try {
    const { accessToken } = await accessTokenFor(env, account);
    const available = await listCalendars(accessToken);
    const selected = available.filter(item => selectedIds.length ? selectedIds.includes(item.id) : item.primary);
    const eventGroups = await Promise.all(selected.map(calendar => listEventsForCalendar(accessToken, calendar, range)));
    for (let index = 0; index < selected.length; index += 1) {
      await writeEventCache(env, keyHash, selected[index], range, eventGroups[index], syncedAt);
    }
    const items = eventGroups.flat().sort((a, b) => a.start.localeCompare(b.start));
    return json({ events: items, stale: false, syncedAt, hideRecurring: Boolean(account.hide_recurring) });
  } catch (error) {
    if (error instanceof CalendarRequestError && error.code === "CALENDAR_RECONNECT_REQUIRED") throw error;
    const cached = await cachedEvents(env, keyHash, range);
    if (!cached.length) throw error;
    return json({ events: cached, stale: true, syncedAt: Math.max(...cached.map(item => item.syncedAt || 0)), hideRecurring: Boolean(account.hide_recurring) });
  }
}

async function disconnect(env, keyHash) {
  const account = await accountFor(env, keyHash);
  if (account) {
    try {
      const refreshToken = await decryptToken(account.encrypted_refresh_token, account.token_nonce, env);
      await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
    } catch {
      // Local deletion is authoritative even when Google revocation is temporarily unavailable.
    }
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM calendar_event_cache WHERE key_hash = ?").bind(keyHash),
    env.DB.prepare("DELETE FROM calendar_oauth_states WHERE key_hash = ?").bind(keyHash),
    env.DB.prepare("DELETE FROM calendar_accounts WHERE key_hash = ?").bind(keyHash),
  ]);
  return json({ ok: true });
}

async function handleCalendarRequest(request, env, keyHash) {
  if (!env.DB) throw new CalendarRequestError("D1 binding is not configured", 503, "CALENDAR_DB_UNAVAILABLE");
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/calendar\/?/, "");
  if (route === "status" && request.method === "GET") return status(env, keyHash);
  if (route === "connect" && request.method === "POST") return connect(request, env, keyHash);
  if (route === "callback" && request.method === "GET") return callback(request, env, keyHash);
  if (route === "calendars" && request.method === "GET") return calendars(env, keyHash);
  if (route === "preferences" && request.method === "PUT") return updatePreferences(request, env, keyHash);
  if (route === "events" && request.method === "GET") return events(request, env, keyHash);
  if (route === "disconnect" && request.method === "DELETE") return disconnect(env, keyHash);
  throw new CalendarRequestError("Calendar endpoint not found", 404, "CALENDAR_NOT_FOUND");
}

export {
  CALENDAR_SCOPES,
  CalendarRequestError,
  decryptToken,
  encryptToken,
  handleCalendarRequest,
  normalizeCalendarEvent,
  parsedCalendarIds,
  validatedRange,
};
