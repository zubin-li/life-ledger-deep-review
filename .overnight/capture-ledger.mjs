import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
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
    state.ledger = window.LifeLedgerLedger.buildDemoSample({ now: new Date("2026-11-02T12:00:00"), lang: localStorage.getItem("life-ledger-language") || "en", contentSeed: 42 });
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browserType, name, opts) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: opts.viewport });
  const url = opts.lang ? `${base}&lang=${opts.lang}` : base;
  await page.goto(url, { waitUntil: "networkidle" });
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
  } else if (opts.view === "today") {
    await page.click('.nav-item[data-view="today"]');
  } else {
    await page.click('.nav-item[data-view="ledger"]');
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: opts.fullPage !== false });
  await browser.close();
}

await mkdir(outDir, { recursive: true });
await shot(chromium, "ledger-chromium-light-1440", { viewport: { width: 1440, height: 900 }, theme: "light", demoLedger: true });
await shot(webkit, "ledger-webkit-dark-de-390", { viewport: { width: 390, height: 844 }, theme: "dark", lang: "de", demoLedger: true });
await shot(chromium, "today-spending-zh-390", { viewport: { width: 390, height: 844 }, lang: "zh", view: "today", demoLedger: true });
await shot(chromium, "review-ledger-light-1440", { viewport: { width: 1440, height: 900 }, theme: "light", view: "review", demoLedger: true });
console.log("screenshots saved");
