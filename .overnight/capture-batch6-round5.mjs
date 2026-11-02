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

const demoStorageKey = "life-ledger-preview-demo-showcase-v1";

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

  if (opts.scene === "review-ledger-budget") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.active", { timeout: 15000 });
    await page.waitForSelector("#reviewLedgerSummary .review-ledger-budget", { timeout: 25000 });
    await page.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }

  if (opts.scene === "review-trend-empty") {
    await page.evaluate(key => {
      let state;
      try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
      if (!state) return;
      state.logs = {};
      (state.habits || []).forEach(h => { h.archived = true; });
      localStorage.setItem(key, JSON.stringify(state));
    }, demoStorageKey);
    await page.reload({ waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.active", { timeout: 15000 });
    await page.waitForSelector("#reviewTrendChart .hairline-empty", { timeout: 20000 });
    await page.locator("#reviewTrendChart").scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }

  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

await mkdir(outDir, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await waitForServer(`http://127.0.0.1:${port}/index.html`);
  for (const [browserType, tag] of [[webkit, "webkit"], [chromium, "chromium"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b6r5-review-budget-1440-light-zh-${tag}.png`, { scene: "review-ledger-budget", lang: "zh-CN" });
    await shot(browser, `b6r5-review-trend-empty-1440-light-zh-${tag}.png`, { scene: "review-trend-empty", lang: "zh-CN" });
    await shot(browser, `b6r5-review-trend-empty-390-light-de-${tag}.png`, {
      scene: "review-trend-empty",
      lang: "de",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
