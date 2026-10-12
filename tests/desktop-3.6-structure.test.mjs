import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

const pkg = JSON.parse(read("package.json"));
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");
const sw = read("public/sw.js");
const launcher = read("desktop/launcher.html");
const tauriConf = JSON.parse(read("src-tauri/tauri.conf.json"));
const cargoToml = read("src-tauri/Cargo.toml");

test("3.6.0 version is consistently pinned across the codebase", () => {
  assert.equal(pkg.version, "3.6.0");
  assert.equal(tauriConf.version, "3.6.0");
  assert.match(cargoToml, /version = "3\.6\.0"/);
  assert.match(html, /styles\.css\?v=3\.6\.0/);
  assert.match(html, /app\.js\?v=3\.6\.0/);
  assert.match(html, /modules\.js\?v=3\.6\.0/);
  assert.match(html, /id="aboutBuild">Life Ledger 3\.6\.0</);
  assert.match(sw, /life-ledger-pwa-3\.6\.0/);
  assert.match(launcher, /3\.6\.0/);
});

test("today and week views are modular boards with required modules", () => {
  assert.match(html, /id="todayView"[^>]*data-module-board="today"/);
  assert.match(html, /id="weekView"[^>]*data-module-board="week"/);

  const expectedTodayModules = ["summary", "habits", "calendar", "focus", "photos", "reflection", "context"];
  for (const mod of expectedTodayModules) {
    assert.match(html, new RegExp(`data-module="${mod}"`), `today module ${mod} missing in HTML`);
  }

  const expectedWeekModules = ["completed", "insights", "goals", "review"];
  for (const mod of expectedWeekModules) {
    assert.match(html, new RegExp(`data-module="${mod}"`), `week module ${mod} missing in HTML`);
  }

  assert.match(html, /id="editLayoutToggle"/);
  assert.match(html, /id="resetLayoutButton"/);
  assert.match(html, /id="todayCalendarGrid"/);
  assert.match(html, /id="weekInsightsGrid"/);
});

test("theme tokens reconnect to neutral palette with deep black dark mode and no legacy beige/olive values", () => {
  assert.doesNotMatch(css, /#f4f2ed/, "legacy beige #f4f2ed should be replaced by theme-aware tokens");
  assert.doesNotMatch(css, /#1b1c19/, "legacy dark olive #1b1c19 should be replaced by deep dark tokens");
  assert.match(css, /--paper:\s*#f5f5f7/);
  assert.match(css, /--paper:\s*#0a0a0b/);
  assert.match(css, /--surface-base:\s*#0a0a0b/);
  assert.match(css, /--surface-1:\s*#141416/);
  assert.match(css, /--surface-2:\s*#1c1c1f/);
  assert.match(css, /--surface-3:\s*#26262a/);
});

test("responsive 2-column modular canvas at >=1180px and single column below", () => {
  assert.match(css, /@media\s*\(min-width:\s*1180px\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /grid-column:\s*1\s*\/\s*-1/);
});

test("all 16 hairline line-art SVGs exist and are clean vector illustrations", () => {
  const assets = [
    "calendar-empty-month.svg",
    "calendar-perfect-day.svg",
    "week-review-empty.svg",
    "week-review-done.svg",
    "week-insights-empty.svg",
    "week-all-done.svg",
    "today-all-scheduled-later.svg",
    "today-not-today.svg",
    "focus-break.svg",
    "focus-streak.svg",
    "photos-day-empty.svg",
    "journal-calendar-empty.svg",
    "insights-first-week.svg",
    "layout-edit-hint.svg",
    "backup-restore.svg",
    "offline-local.svg",
  ];

  for (const file of assets) {
    const url = new URL(`../public/assets/hairline/${file}`, import.meta.url);
    assert.ok(existsSync(url), `hairline asset ${file} must exist`);
    const content = readFileSync(url, "utf8");
    assert.match(content, /<svg[^>]*viewBox/, `${file} must be viewBox-based`);
    assert.doesNotMatch(content, /<image/i, `${file} must not contain raster images`);
    assert.doesNotMatch(content, /<text/i, `${file} must not contain text inside SVG`);
    assert.match(content, /stroke-linecap="round"/, `${file} must match line-art stroke style`);
  }
});
