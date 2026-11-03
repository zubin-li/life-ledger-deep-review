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
    if (lang) localStorage.setItem("life-ledger-language", lang);
    if (theme) document.documentElement.dataset.theme = theme;
  }, { lang: opts.lang, theme: opts.theme });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator('.nav-item[data-view="ledger"]').click();
  await page.waitForSelector(".ledger-wellness-insights", { timeout: 12000 });
  await page.waitForTimeout(280);
  const el = page.locator(".ledger-wellness-insights");
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});
await mkdir(outDir, { recursive: true });
try {
  await waitForServer(base);
  const chromiumBrowser = await chromium.launch({ headless: true });
  await shot(chromiumBrowser, "b12r1-ledger-wellness-zh-light-1440-chromium.png", { lang: "zh", theme: "light" });
  await chromiumBrowser.close();
  const webkitBrowser = await webkit.launch({ headless: true });
  await shot(webkitBrowser, "b12r1-ledger-wellness-de-dark-390-webkit.png", {
    lang: "de",
    theme: "dark",
    mobile: true,
    viewport: { width: 390, height: 844 },
  });
  await webkitBrowser.close();
  console.log("saved b12r1 wellness shots");
} finally {
  server.kill("SIGTERM");
}
