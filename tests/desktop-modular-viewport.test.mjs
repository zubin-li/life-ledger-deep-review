import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");
const html = readFileSync(path.join(publicDir, "index.html"), "utf8");

test("content split stays inside workspace pane so main column layout is not collapsed", () => {
  assert.match(
    html,
    /<div class="workspace-pane">[\s\S]*<header class="app-toolbar"[\s\S]*<\/header>\s*<div class="content-split">/,
    "content-split must be a descendant of workspace-pane, not a sibling under app-shell"
  );
  assert.match(html, /<div class="toolbar-trailing">[\s\S]*id="openCommandPalette"/);
});

const hasPlaywright = await import("playwright")
  .then(() => true)
  .catch(() => false);

async function assertControlReceivesPointer(page, selector) {
  const hit = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return { ok: false, reason: "element missing" };
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) {
      return { ok: false, reason: `zero geometry ${r.width}x${r.height}` };
    }
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    const ok = top === el || (top && el.contains(top));
    return {
      ok,
      reason: ok ? "" : `intercepted by ${top?.tagName || "?"}#${top?.id || ""}`,
    };
  }, selector);
  assert.ok(hit.ok, `${selector} must receive pointer at its center: ${hit.reason}`);
}

test(
  "desktop Today and Week module cards are in-viewport and primary controls receive clicks",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
      await page.goto(`${server.url}/index.html?desktop=tauri-local`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(400);

      const todayMetrics = await page.evaluate(() => {
        const main = document.querySelector(".main-content");
        const board = document.querySelector("#todayView.active");
        if (!main || !board) return { error: "missing main or today board" };
        const mr = main.getBoundingClientRect();
        if (mr.width <= 400 || mr.height <= 200) {
          return { error: `main content too small: ${mr.width}x${mr.height}` };
        }

        const cards = [...board.querySelectorAll(":scope > .module-card")].filter(el => !el.hidden);
        const inViewport = cards.filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 120 && r.height > 48 && r.top >= 0 && r.top < window.innerHeight && r.left >= mr.left;
        });
        return { cardCount: cards.length, inViewport: inViewport.length };
      });
      assert.equal(todayMetrics.error, undefined, todayMetrics.error || "Today layout metrics failed");

      assert.ok(todayMetrics.cardCount >= 5, "Today board should render module cards");
      assert.ok(todayMetrics.inViewport >= 2, "At least two Today module cards should be visible in the viewport");

      await assertControlReceivesPointer(page, "#openDayDetail");
      await page.locator("#openDayDetail").click({ timeout: 8000 });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(80);

      await page.locator("#todayCalendarPrev").scrollIntoViewIfNeeded();
      await assertControlReceivesPointer(page, "#todayCalendarPrev");
      await page.locator("#todayCalendarPrev").click({ timeout: 8000 });

      await page.locator(".sidebar .nav-item[data-view='week']").click({ timeout: 8000 });
      await page.waitForTimeout(150);

      const weekMetrics = await page.evaluate(() => {
        const board = document.querySelector("#weekView.active");
        if (!board) return { error: "week board not active" };
        const cards = [...board.querySelectorAll(":scope > .module-card")].filter(el => !el.hidden);
        const inViewport = cards.filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 120 && r.height > 48 && r.top >= 0 && r.top < window.innerHeight;
        });
        return { cardCount: cards.length, inViewport: inViewport.length };
      });
      assert.equal(weekMetrics.error, undefined, weekMetrics.error || "Week layout metrics failed");

      assert.ok(weekMetrics.cardCount >= 3, "Week board should render module cards");
      assert.ok(weekMetrics.inViewport >= 1, "Week view should show at least one module card in the viewport");

      await page.locator(".sidebar .nav-item[data-view='today']").click({ timeout: 8000 });
      await page.waitForTimeout(150);

      const todayAgain = await page.evaluate(() => {
        const board = document.querySelector("#todayView.active");
        if (!board) return { error: "today view not active after navigation" };
        const cards = [...board.querySelectorAll(":scope > .module-card")].filter(el => !el.hidden);
        const inViewport = cards.filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 120 && r.height > 48 && r.top >= 0 && r.top < window.innerHeight;
        });
        return { inViewport: inViewport.length };
      });
      assert.equal(todayAgain.error, undefined, todayAgain.error || "Today re-navigation metrics failed");
      assert.ok(todayAgain.inViewport >= 2, "Today view should show module cards after Week → Today navigation");
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) {
        await server.close().catch(() => {});
      }
    }
  }
);
