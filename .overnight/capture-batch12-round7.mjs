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
const port = 5297;
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
  await page.waitForSelector(".ledger-heat-grid [data-ledger-day]", { timeout: 15000 });
  await page.evaluate(async () => {
    const cells = [...document.querySelectorAll("[data-ledger-day]")];
    for (const cell of cells) {
      cell.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await new Promise(r => requestAnimationFrame(r));
      if (document.querySelector(".ledger-list-filter-sum-in")) return;
      document.querySelector("[data-ledger-clear-day]")?.click();
    }
  });
  await page.waitForSelector(".ledger-list-filter-sum-in", { timeout: 8000 });
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
  await shot(chromiumBrowser, "b12r7-ledger-split-sum-zh-light-1440-chromium.png", { lang: "zh", theme: "light" });
  await shot(webkitBrowser, "b12r7-ledger-split-sum-de-dark-390-webkit.png", { lang: "de", theme: "dark", mobile: true });
  await chromiumBrowser.close();
  await webkitBrowser.close();
  console.log("saved batch 12 round 7 ledger split shots");
} finally {
  server.kill("SIGTERM");
}
