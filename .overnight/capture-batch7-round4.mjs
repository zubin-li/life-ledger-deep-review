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
const port = 5289;
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

async function prepContext(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
    },
    { lang: opts.lang },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  return context;
}

async function shotReviewScores(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector("#reviewView.active", { timeout: 15000 });
  if (opts.mobile) {
    await page.locator("#reviewScoreSummary").click();
    await page.waitForSelector("#inspectorReviewTable .inspector-stat-list--live article", { timeout: 8000 });
  } else {
    await page.waitForSelector(".review-score-table[open]", { timeout: 8000 });
  }
  await page.evaluate(() => {
    document.querySelector(".review-score-table")?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(320);
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

async function shotLedgerN(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
  await page.keyboard.press("n");
  await page.waitForFunction(() => document.activeElement?.id === "ledgerQuickInput");
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(`${base.split("?")[0]}`);
  const chromiumBrowser = await chromium.launch({ headless: true });
  const webkitBrowser = await webkit.launch({ headless: true });
  await shotReviewScores(chromiumBrowser, "b7r4-review-habit-scores-en-light-1440-chromium.png", { lang: "en" });
  await shotReviewScores(webkitBrowser, "b7r4-review-habit-scores-zh-dark-390-webkit.png", {
    lang: "zh-CN",
    theme: "dark",
    mobile: true,
    viewport: { width: 390, height: 844 },
  });
  await shotLedgerN(chromiumBrowser, "b7r4-ledger-quick-focus-de-light-1440-chromium.png", { lang: "de" });
  await chromiumBrowser.close();
  await webkitBrowser.close();
  console.log("saved b7r4-* shots");
} finally {
  server.kill("SIGTERM");
}
