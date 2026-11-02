import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const base = "http://127.0.0.1:5291/index.html?mode=local";

async function seedDemoLedger(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    const now = new Date("2026-11-18T12:00:00");
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now,
      lang: localStorage.getItem("life-ledger-language") || "en",
      contentSeed: 42,
    });
    const habitIds = (state.habits || []).map(h => h.id);
    window.LifeLedgerLedger.alignDemoMoodWithSpend?.(state.logs, state.ledger, now);
    window.LifeLedgerLedger.alignDemoHabitCompletionWithSpend?.(state.logs, state.ledger, habitIds, now);
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browserType, name, opts) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport: opts.viewport });
  const page = await context.newPage();
  const loadUrl = opts.lang ? `${base}&lang=${opts.lang}` : base;
  await page.goto(loadUrl, { waitUntil: "networkidle" });
  if (opts.theme) {
    await page.evaluate(t => {
      localStorage.setItem("life-ledger-theme", t);
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  if (opts.demoLedger) {
    await seedDemoLedger(page);
    await page.reload({ waitUntil: "networkidle" });
  }
  if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
  } else {
    await page.click('.nav-item[data-view="ledger"]');
  }
  if (opts.focusKeypad) {
    await page.click("#ledgerQuickInput");
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: opts.fullPage !== false });
  await browser.close();
}

await mkdir(outDir, { recursive: true });
await shot(chromium, "review-habit-scatter-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
  demoLedger: true,
  fullPage: false,
});
await shot(webkit, "ledger-mobile-keypad-webkit-dark-de-390", {
  viewport: { width: 390, height: 844 },
  theme: "dark",
  lang: "de",
  demoLedger: true,
  focusKeypad: true,
  fullPage: false,
});
console.log("round2 batch2 shots ok");
