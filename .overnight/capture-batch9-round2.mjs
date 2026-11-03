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
  return context;
}

async function gotoView(page, view) {
  await page.locator(`.nav-item[data-view="${view}"]`).first().click();
  await page.waitForTimeout(320);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(demoBase.split("?")[0]);

    const chromiumBrowser = await chromium.launch({ headless: true });
    const zhCtx = await prepContext(chromiumBrowser, { lang: "zh" });
    const weekPage = await zhCtx.newPage();
    await weekPage.goto(demoBase, { waitUntil: "domcontentloaded" });
    await gotoView(weekPage, "week");
    await weekPage.locator("#weekInsightsGrid").scrollIntoViewIfNeeded();
    await weekPage.waitForSelector("#weekSpendingHint:not([hidden])", { timeout: 15000 });
    const weekHint = await weekPage.locator("#weekSpendingHint").textContent();
    if (/\+\d{4,}%/.test(weekHint || "")) {
      throw new Error(`week spending hint still shows huge +%: ${weekHint}`);
    }
    await weekPage.locator("#weekSpendingCard").screenshot({
      path: join(outDir, "b9r2-week-spend-hint-zh-light-1440-chromium.png"),
    });

    const habitsPage = await zhCtx.newPage();
    await habitsPage.goto(demoBase, { waitUntil: "domcontentloaded" });
    await gotoView(habitsPage, "habits");
    await habitsPage.waitForSelector(".habit-settings-main strong", { timeout: 12000 });
    const habitText = await habitsPage.locator(".habit-settings-main strong").first().textContent();
    if (/^Exercise$/i.test(habitText || "")) {
      throw new Error(`demo habits still English in zh UI: ${habitText}`);
    }
    await habitsPage.screenshot({ path: join(outDir, "b9r2-habits-zh-light-1440-chromium.png") });

    await zhCtx.close();
    await chromiumBrowser.close();

    const wk = await webkit.launch({ headless: true });
    const reviewCtx = await prepContext(wk, {
      lang: "zh",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const reviewPage = await reviewCtx.newPage();
    await reviewPage.goto(demoBase, { waitUntil: "domcontentloaded" });
    await gotoView(reviewPage, "review");
    await reviewPage.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
    await reviewPage.waitForSelector("#reviewLedgerSpendHint:not([hidden])", { timeout: 15000 });
    const reviewHint = await reviewPage.locator("#reviewLedgerSpendHint").textContent();
    if (/\+\d{4,}%/.test(reviewHint || "")) {
      throw new Error(`review spending hint still shows huge +%: ${reviewHint}`);
    }
    await reviewPage.screenshot({ path: join(outDir, "b9r2-review-spend-hint-zh-dark-390-webkit.png") });
    await reviewCtx.close();
    await wk.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
