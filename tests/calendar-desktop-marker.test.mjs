import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CALENDAR_DESKTOP_HEADER,
  CALENDAR_DESKTOP_MARKER,
  CALENDAR_RETURN_DESKTOP,
  CALENDAR_RETURN_WEB,
  calendarConnectReturnPath,
  safeCalendarRedirectPath,
} from "../src/calendar.js";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("calendar connect stores desktop return path only for the whitelisted marker", () => {
  const webRequest = new Request("https://ledger.example/api/calendar/connect", { method: "POST" });
  const desktopRequest = new Request("https://ledger.example/api/calendar/connect", {
    method: "POST",
    headers: { [CALENDAR_DESKTOP_HEADER]: CALENDAR_DESKTOP_MARKER },
  });
  const invalidRequest = new Request("https://ledger.example/api/calendar/connect", {
    method: "POST",
    headers: { [CALENDAR_DESKTOP_HEADER]: "desktop-shell" },
  });
  assert.equal(calendarConnectReturnPath(webRequest), CALENDAR_RETURN_WEB);
  assert.equal(calendarConnectReturnPath(desktopRequest), CALENDAR_RETURN_DESKTOP);
  assert.equal(calendarConnectReturnPath(invalidRequest), CALENDAR_RETURN_WEB);
});

test("calendar callback redirect stays on validated in-app paths", () => {
  assert.equal(safeCalendarRedirectPath(CALENDAR_RETURN_WEB), CALENDAR_RETURN_WEB);
  assert.equal(safeCalendarRedirectPath(CALENDAR_RETURN_DESKTOP), CALENDAR_RETURN_DESKTOP);
  assert.equal(safeCalendarRedirectPath("https://evil.example/phish"), CALENDAR_RETURN_WEB);
  assert.equal(safeCalendarRedirectPath("//evil.example"), CALENDAR_RETURN_WEB);
});

test("connected mac calendar connect sends the desktop marker header", () => {
  assert.match(app, /desktopMode === "tauri-cloud"\s*\?\s*\{\s*"X-Life-Ledger-Desktop": "tauri-cloud"\s*\}/);
});
