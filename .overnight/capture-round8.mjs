import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const port = 5296;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function seedDemo(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    const now = new Date("2026-11-18T12:00:00");
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now,
      lang: localStorage.getItem("life-ledger-language") || "zh",
      contentSeed: 42,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browser, name, opts = {}) {
  const page = await browser.newPage({ viewport: opts.viewport || { width: 390, height: 844 } });
  if (opts.lang) await page.addInitScript(l => localStorage.setItem("life-ledger-language", l), opts.lang);
  if (opts.theme) await page.addInitScript(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.demo) await seedDemo(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector(".ledger-page");
  if (opts.openBudget) {
    await page.click(".ledger-budget-add");
    await page.waitForSelector(".ledger-budget-form");
  }
  if (opts.scrollBudget) {
    await page.locator(".ledger-budget-wrap").scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: join(outDir, name), fullPage: opts.fullPage });
  await page.close();
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(here, "..", "public"),
  stdio: "ignore",
});

await new Promise(r => setTimeout(r, 400));

try {
  for (const [browserType, tag] of [[chromium, "chromium"], [webkit, "webkit"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `ledger-budget-popover-zh-light-390-${tag}.png`, { lang: "zh", demo: true, openBudget: true });
    await shot(browser, `ledger-budget-progress-de-dark-390-${tag}.png`, { lang: "de", theme: "dark", demo: true, scrollBudget: true });
    await shot(browser, `ledger-budget-progress-light-1440-${tag}.png`, {
      viewport: { width: 1440, height: 900 },
      lang: "en",
      demo: true,
      scrollBudget: true,
      fullPage: false,
    });
    await browser.close();
  }
} finally {
  server.kill();
}

console.log("round8 ledger budget shots done");
