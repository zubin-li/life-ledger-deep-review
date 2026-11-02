import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5295;
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
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector(".ledger-donut-segments path", { timeout: 20000 });
  if (opts.view === "heat") {
    await page.locator(".ledger-panel--heat").scrollIntoViewIfNeeded();
    await page.click("[data-ledger-prev]");
    await page.waitForTimeout(650);
    await page.locator(".ledger-panel--heat").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }
  if (opts.view === "donut") {
    await page.click("[data-ledger-prev]");
    await page.waitForTimeout(650);
    await page.locator(".ledger-panel--categories").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
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
    await shot(browser, `b3r8-ledger-donut-zh-light-1440-${tag}.png`, { lang: "zh", view: "donut" });
    await shot(browser, `b3r8-ledger-heat-de-dark-390-${tag}.png`, {
      lang: "de",
      theme: "dark",
      view: "heat",
      viewport: { width: 390, height: 844 },
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch3 round8 captures done");
