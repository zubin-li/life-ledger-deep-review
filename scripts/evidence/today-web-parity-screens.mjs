import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";
import assert from "node:assert/strict";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "docs/today-web-parity/screens");
fs.mkdirSync(outputDir, { recursive: true });

const DESKTOP = [
  { lang: "en", theme: "light" },
  { lang: "en", theme: "dark" },
  { lang: "zh", theme: "light" },
  { lang: "zh", theme: "dark" },
  { lang: "de", theme: "light" },
  { lang: "de", theme: "dark" },
];

async function waitTodayReady(page) {
  await page.waitForFunction(() => {
    const board = document.querySelector("#todayView");
    const summary = document.querySelector('[data-module="summary"]');
    const habits = document.querySelector('[data-module="habits"] #todayHabitList .today-habit-row');
    return Boolean(board?.querySelector(":scope > .module-card") && summary && habits);
  }, null, { timeout: 8000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation =>
      animation.effect?.getComputedTiming().iterations !== Infinity,
    ).map(animation => animation.finished.catch(() => {})));
  });
}

async function capture(page, file) {
  const overflow = await page.evaluate(() => {
    const issues = [];
    for (const module of ["summary", "habits"]) {
      const card = document.querySelector(`[data-module="${module}"]`);
      const box = card.getBoundingClientRect();
      for (const node of card.querySelectorAll(".today-stage-copy > *, .today-stage-meta > *, .today-habit-row, .today-habit-check")) {
        if (node.closest("[hidden]") || !node.getClientRects().length) continue;
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.top < box.top - 2 || r.bottom > box.bottom + 2) issues.push(`${module}: ${node.id || node.className} crosses card vertically`);
      }
    }
    return issues;
  });
  assert.deepEqual(overflow, [], `${file}: content must fit its widget`);
  await page.screenshot({ path: path.join(outputDir, file) });
  console.log(file);
}

async function setWidgetSize(page, module, sizeKey) {
  await page.locator("#editLayoutToggle").click();
  await page.locator('#todayView.is-editing-layout').waitFor();
  const handle = page.locator(`[data-module="${module}"] .widget-drag-handle`);
  await handle.focus();
  await page.keyboard.press(sizeKey);
  const size = { s: "small", m: "medium", l: "large" }[sizeKey];
  await page.waitForFunction(({ module, size }) =>
    document.querySelector(`[data-module="${module}"]`)?.dataset.widgetSize === size,
  { module, size });
  await page.locator("#editLayoutToggle").click();
  await waitTodayReady(page);
}

async function main() {
  const server = await startStaticServer(publicDir);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const { lang, theme } of DESKTOP) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await applyFixture(page, { date: FIXTURE_DATE, theme, language: lang });
      await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${lang}`);
      await page.waitForLoadState("domcontentloaded");
      await waitTodayReady(page);
      await capture(page, `today-desktop-1440-${lang}-${theme}.png`);
      await context.close();
    }

    const contextSm = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } },
    });
    const pageSm = await contextSm.newPage();
    await applyFixture(pageSm, { date: FIXTURE_DATE, theme: "light", language: "en" });
    await pageSm.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
    await pageSm.waitForLoadState("domcontentloaded");
    await waitTodayReady(pageSm);
    await setWidgetSize(pageSm, "summary", "m");
    await waitTodayReady(pageSm);
    await capture(pageSm, "today-desktop-1440-en-light-summary-medium.png");
    await setWidgetSize(pageSm, "habits", "m");
    await waitTodayReady(pageSm);
    const tiles = await pageSm.locator('[data-module="habits"] .today-habit-row').evaluateAll(rows => rows
      .filter(row => !row.closest('[hidden]') && row.getClientRects().length)
      .map(row => { const r = row.getBoundingClientRect(); return { top: r.top, width: r.width }; }));
    assert.equal(tiles.length, 4, "Medium includes all four fictional habits across open/scheduled/completed groups");
    assert.ok(tiles.every(tile => Math.abs(tile.width - tiles[0].width) < 1 && Math.abs(tile.top - tiles[0].top) < 1), "Completed and open tiles share the same row and width");
    await capture(pageSm, "today-desktop-1440-en-light-habits-medium.png");
    await setWidgetSize(pageSm, "summary", "s");
    await setWidgetSize(pageSm, "habits", "s");
    await capture(pageSm, "today-desktop-1440-en-light-small.png");
    await setWidgetSize(pageSm, "summary", "l");
    await setWidgetSize(pageSm, "habits", "l");
    const reading = pageSm.locator('[data-module="habits"] .today-habit-row[data-id="habit-read"]');
    await reading.hover();
    await pageSm.waitForTimeout(180);
    await reading.locator('.today-habit-copy').click();
    await pageSm.waitForFunction(() => document.querySelector('.today-habit-row[data-id="habit-read"] .today-habit-check')?.getAttribute('aria-pressed') === 'true');
    await pageSm.waitForTimeout(300);
    await reading.locator('.today-habit-copy').click();
    await pageSm.waitForFunction(() => document.querySelector('.today-habit-row[data-id="habit-read"] .today-habit-check')?.getAttribute('aria-pressed') === 'false');
    await pageSm.waitForTimeout(300);
    const video = pageSm.video();
    await contextSm.close();
    fs.renameSync(await video.path(), path.join(outputDir, "today-interactions.webm"));

    for (const { lang, theme } of [{ lang: "en", theme: "light" }, { lang: "en", theme: "dark" }, { lang: "zh", theme: "light" }, { lang: "de", theme: "light" }]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await applyFixture(page, { date: FIXTURE_DATE, theme, language: lang });
      await page.goto(`${server.url}/index.html?lang=${lang}`);
      await page.waitForLoadState("domcontentloaded");
      await waitTodayReady(page);
      await capture(page, `today-mobile-390-${lang}-${theme}.png`);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
