import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5294;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
    },
    { lang: opts.lang },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  const page = await context.newPage();
  await page.goto(demoBase, { waitUntil: "networkidle" });
  if (opts.view === "today") {
    await page.click('.nav-item[data-view="today"]');
    await page.waitForSelector(".tw-card.tw-spending .tw-spend-today", { timeout: 20000 });
    await page.locator(".tw-card.tw-spending").screenshot({ path: join(outDir, name) });
  } else if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewLedgerSummary", { timeout: 20000 });
    await page.locator("#reviewLedgerSummary").screenshot({ path: join(outDir, name) });
  } else {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector(".ledger-donut-segments path", { timeout: 20000 });
    await page.locator(".ledger-panel--categories").screenshot({ path: join(outDir, name) });
  }
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
    await shot(browser, `b4r1-ledger-donut-de-light-1440-${tag}.png`, { lang: "de" });
    await shot(browser, `b4r1-review-ledger-zh-dark-1440-${tag}.png`, {
      lang: "zh",
      theme: "dark",
      view: "review",
    });
    await shot(browser, `b4r1-today-spending-en-light-390-${tag}.png`, {
      lang: "en",
      view: "today",
      viewport: { width: 390, height: 844 },
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch4 round1 captures done");
