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
const port = 5293;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
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

  if (opts.scene === "nav-ledger") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
    await page.waitForTimeout(420);
    await page.locator(".ledger-header").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  if (opts.scene === "ledger-month") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
    await page.click('[data-ledger-prev]');
    await page.waitForTimeout(480);
    await page.locator(".ledger-summary").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  if (opts.scene === "week-nav") {
    await page.click('.nav-item[data-view="week"]');
    await page.waitForSelector("#weekView.active", { timeout: 15000 });
    await page.click("#previousWorkspaceWeek");
    await page.waitForTimeout(480);
    await page.locator(".week-page-header").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  await context.close();
}

await mkdir(outDir, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

const jobs = [
  ["b5r8-nav-ledger-de-light-1440-webkit.png", webkit, { scene: "nav-ledger", lang: "de", theme: "light" }],
  ["b5r8-ledger-month-zh-light-1440-chromium.png", chromium, { scene: "ledger-month", lang: "zh", theme: "light" }],
  ["b5r8-week-nav-en-dark-390-webkit.png", webkit, { scene: "week-nav", lang: "en", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
  ["b5r8-week-nav-en-dark-390-chromium.png", chromium, { scene: "week-nav", lang: "en", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
];

try {
  for (const [name, browserType, opts] of jobs) {
    const browser = await browserType.launch({ headless: true });
    try {
      await shot(browser, name, opts);
      console.log("saved", name);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill("SIGTERM");
}
