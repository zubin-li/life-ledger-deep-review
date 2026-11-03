import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5291;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error(`HTTP server did not respond at ${url}`);
}

async function shot(browser, name, opts) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(({ lang, theme }) => {
    localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    if (lang) localStorage.setItem("life-ledger-language", lang);
    if (theme) document.documentElement.dataset.theme = theme;
  }, { lang: opts.lang, theme: opts.theme });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator('.nav-item[data-view="ledger"]').click();
  await page.waitForSelector(".ledger-donut-segments .ledger-cat-seg", { timeout: 15000 });
  await page.locator(".ledger-donut-segments .ledger-cat-seg").first().evaluate(el => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.waitForSelector(".ledger-category-filter-chip", { timeout: 5000 });
  const list = page.locator(".ledger-list-wrap");
  await list.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await list.screenshot({ path: join(outDir, name) });
  await context.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(base);
  const chromiumBrowser = await chromium.launch({ headless: true });
  const webkitBrowser = await webkit.launch({ headless: true });
  await shot(chromiumBrowser, "b12r5-ledger-category-filter-zh-light-1440-chromium.png", { lang: "zh", theme: "light" });
  await shot(chromiumBrowser, "b12r5-ledger-category-filter-de-dark-1440-chromium.png", { lang: "de", theme: "dark" });
  await shot(webkitBrowser, "b12r5-ledger-category-filter-zh-light-390-webkit.png", { lang: "zh", theme: "light", mobile: true, viewport: { width: 390, height: 844 } });
  await chromiumBrowser.close();
  await webkitBrowser.close();
} finally {
  server.kill("SIGTERM");
}
