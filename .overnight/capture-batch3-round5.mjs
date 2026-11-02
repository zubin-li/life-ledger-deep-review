import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5299;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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
  if (opts.view === "review-bars") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.view.active, #reviewView.active", { timeout: 15000 }).catch(() => {});
    if (opts.elementWeekday) {
      await page.waitForSelector("#reviewHabitCompare .analytics-bars", { timeout: 20000 });
      await page.waitForTimeout(800);
      await page.locator("#reviewHabitCompare .analytics-bars").last().screenshot({ path: join(outDir, name) });
      await context.close();
      return;
    }
    await page.evaluate(() => {
      const det = document.querySelector("#reviewDetailedMetrics");
      if (det) det.open = true;
    });
    await page.waitForSelector("#barChart .bar", { timeout: 15000 });
    await page.locator("#barChart").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    if (opts.elementBars) {
      await page.locator("#barChart").screenshot({ path: join(outDir, name) });
      await context.close();
      return;
    }
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
    await shot(browser, `b3r5-review-barchart-zh-light-1440-${tag}.png`, {
      lang: "zh",
      view: "review-bars",
      elementBars: true,
    });
    await shot(browser, `b3r5-review-weekday-de-light-1440-${tag}.png`, {
      lang: "de",
      view: "review-bars",
      elementWeekday: true,
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch3 round5 captures done");
