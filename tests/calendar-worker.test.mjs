import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CALENDAR_SCOPES,
  CalendarRequestError,
  decryptToken,
  encryptToken,
  handleCalendarRequest,
  normalizeCalendarEvent,
  validatedRange,
} from "../src/calendar.js";

const tokenKey = Buffer.alloc(32, 7).toString("base64url");

function fakeDb({ account = null } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values });
          return {
            first: async () => account,
            run: async () => ({ success: true, meta: { changes: 1 } }),
            all: async () => ({ results: [] }),
          };
        },
      };
    },
    batch: async () => [],
  };
}

test("calendar refresh tokens round-trip through AES-GCM", async () => {
  const env = { CALENDAR_TOKEN_KEY: tokenKey };
  const encrypted = await encryptToken("private-refresh-token", env);
  assert.notEqual(encrypted.encryptedToken, "private-refresh-token");
  assert.equal(await decryptToken(encrypted.encryptedToken, encrypted.nonce, env), "private-refresh-token");
});

test("calendar event normalization preserves only review-safe fields", () => {
  const normalized = normalizeCalendarEvent({
    id: "event-1",
    summary: "Data analyst interview",
    start: { dateTime: "2026-08-27T09:00:00+02:00" },
    end: { dateTime: "2026-08-27T09:45:00+02:00" },
    recurringEventId: "series-1",
    originalStartTime: { dateTime: "2026-08-27T09:00:00+02:00" },
    attendees: [{ self: true, responseStatus: "accepted", email: "private@example.com" }],
    description: "Private interview notes",
    updated: "2026-08-26T12:00:00Z",
  }, { id: "primary", name: "Work", color: "#4285f4" });

  assert.equal(normalized.title, "Data analyst interview");
  assert.equal(normalized.recurring, true);
  assert.equal(normalized.date, "2026-08-27");
  assert.equal("attendees" in normalized, false);
  assert.equal("description" in normalized, false);
});

test("calendar range is bounded to prevent oversized reads", () => {
  const valid = new URL("https://ledger.example/api/calendar/events?timeMin=2026-08-01T00:00:00Z&timeMax=2026-09-01T00:00:00Z");
  assert.equal(validatedRange(valid).startDate, "2026-08-01");
  const invalid = new URL("https://ledger.example/api/calendar/events?timeMin=2026-01-01T00:00:00Z&timeMax=2026-12-31T00:00:00Z");
  assert.throws(() => validatedRange(invalid), error => error instanceof CalendarRequestError && error.code === "CALENDAR_RANGE_INVALID");
});

test("calendar connection uses offline read-only OAuth with PKCE", async () => {
  const DB = fakeDb();
  const env = {
    DB,
    GOOGLE_CALENDAR_CLIENT_ID: "client-id.apps.googleusercontent.com",
    GOOGLE_CALENDAR_CLIENT_SECRET: "client-secret",
    GOOGLE_CALENDAR_REDIRECT_URI: "https://ledger.example/api/calendar/callback",
    CALENDAR_TOKEN_KEY: tokenKey,
  };
  const response = await handleCalendarRequest(
    new Request("https://ledger.example/api/calendar/connect", { method: "POST" }),
    env,
    "identity-hash",
  );
  assert.equal(response.status, 200);
  const { authorizationUrl } = await response.json();
  const url = new URL(authorizationUrl);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.deepEqual(url.searchParams.get("scope").split(" "), CALENDAR_SCOPES);
  assert.ok(DB.calls.some(call => call.sql.includes("INSERT INTO calendar_oauth_states")));
});

test("calendar storage supports exactly two independent Google connections", () => {
  const source = readFileSync(new URL("../src/calendar.js", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../migrations/0004_google_calendar_multi_account.sql", import.meta.url), "utf8");
  assert.match(source, /connections\.length >= 2/);
  assert.match(source, /Only two Google accounts can be connected/);
  assert.match(source, /calendar_event_cache_v2/);
  assert.match(migration, /UNIQUE \(key_hash, provider, provider_account_id\)/);
  assert.match(migration, /PRIMARY KEY \(key_hash, connection_id, calendar_id, instance_key\)/);
});
