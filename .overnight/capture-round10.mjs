import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5294;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function clearLedger(page) {
  await page.evaluate(() => {
    localStorage.removeItem("life-ledger-ledger-onboarding-dismissed");
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    delete state.ledger;
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
  await clearLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  if (opts.view === "ledger") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector("[data-ledger-onboarding], .ledger-page");
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
    await shot(browser, `round10-spending-hint-zh-390-${tag}.png`, {
      viewport: { width: 390, height: 844 },
      lang: "zh",
      view: "today",
    });
    await shot(browser, `round10-ledger-onboarding-de-light-390-${tag}.png`, {
      viewport: { width: 390, height: 520 },
      lang: "de",
      view: "ledger",
    });
    await shot(browser, `round10-ledger-onboarding-zh-dark-1440-${tag}.png`, {
      viewport: { width: 1440, height: 900 },
      lang: "zh",
      theme: "dark",
      view: "ledger",
      dpr: 2,
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("round10 captures done");
