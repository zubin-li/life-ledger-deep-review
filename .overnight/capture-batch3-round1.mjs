import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5295;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function seedDemoLedger(page) {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now: new Date("2026-11-02T12:00:00"),
      lang: localStorage.getItem("life-ledger-language") || "de",
      contentSeed: 7,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  if (opts.lang) await context.addInitScript(l => localStorage.setItem("life-ledger-language", l), opts.lang);
  if (opts.theme) await context.addInitScript(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.demo) {
    await seedDemoLedger(page);
    await page.reload({ waitUntil: "networkidle" });
  }
  if (opts.view === "ledger") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector(".ledger-page");
  } else {
    await page.waitForSelector(".tw-card.tw-spending");
    await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await new Promise(r => setTimeout(r, 400));

try {
  for (const [browserType, tag] of [[chromium, "chromium"], [webkit, "webkit"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b3r1-spending-zero-de-390-${tag}.png`, {
      viewport: { width: 390, height: 844 },
      lang: "de",
      demo: true,
      view: "today",
    });
    await shot(browser, `b3r1-ledger-overview-zh-light-1440-${tag}.png`, {
      viewport: { width: 1440, height: 900 },
      lang: "zh",
      demo: true,
      view: "ledger",
      dpr: 2,
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch3 round1 captures done");
