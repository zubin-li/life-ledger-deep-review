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
const port = 5287;
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

async function shotMoodToReview(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector(".tw-spend-mood-pill:not([hidden])", { timeout: 15000 });
  await page.locator(".tw-spend-mood-pill").click();
  await page.waitForSelector("#review-scatter-mood", { timeout: 12000 });
  await page.evaluate(() => {
    document.getElementById("review-scatter-mood")?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(320);
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(`${base.split("?")[0]}`);
    const chromiumBrowser = await chromium.launch({ headless: true });
    const webkitBrowser = await webkit.launch({ headless: true });
    await shotMoodToReview(chromiumBrowser, "b7r6-today-mood-to-review-zh-light-1440-chromium.png", { lang: "zh" });
    await shotMoodToReview(webkitBrowser, "b7r6-today-mood-to-review-de-dark-390-webkit.png", {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    await chromiumBrowser.close();
    await webkitBrowser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
