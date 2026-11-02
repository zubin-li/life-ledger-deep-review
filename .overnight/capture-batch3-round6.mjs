import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5297;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("life-ledger-local-edition", "2026-10-sample-v6");
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    localStorage.setItem("life-ledger-language", "zh");
    localStorage.setItem("life-ledger-language-preference-set", "true");
  });
  if (opts.lang) await context.addInitScript(l => localStorage.setItem("life-ledger-language", l), opts.lang);
  if (opts.theme) await context.addInitScript(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.view === "ledger") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector("#ledgerView.view.active, #ledgerView.active", { timeout: 15000 }).catch(() => {});
    await page.waitForSelector("#ledgerQuickForm, .ledger-page", { timeout: 20000 });
    await page.waitForTimeout(700);
  }
  if (opts.view === "today-spend") {
    await page.waitForSelector(".tw-card.tw-spending", { timeout: 15000 });
    await page.waitForTimeout(600);
    const card = page.locator(".tw-card.tw-spending");
    if (opts.elementCard) {
      await card.screenshot({ path: join(outDir, name) });
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
    await shot(browser, `b3r6-ledger-empty-zh-light-1440-${tag}.png`, { lang: "zh", view: "ledger" });
    await shot(browser, `b3r6-today-spend-empty-de-light-390-${tag}.png`, {
      lang: "de",
      view: "today-spend",
      elementCard: true,
      viewport: { width: 390, height: 844 },
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch3 round6 captures done");
