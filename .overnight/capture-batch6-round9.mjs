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

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
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
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector("#reviewView.active", { timeout: 15000 });
  await page.waitForSelector("#reviewLedgerSummary .review-scatter-dot-hit", { timeout: 15000 });
  await page.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
  if (opts.scene === "scatter-focus") {
    const dot = page.locator("#reviewLedgerSummary .review-scatter-dot-hit[tabindex='0']").first();
    await dot.focus();
    await page.waitForSelector("#reviewLedgerSummary .review-scatter-tip:not([hidden])", { timeout: 5000 });
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

await mkdir(outDir, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

const jobs = [
  ["b6r9-scatter-focus-en-light-1440-chromium.png", chromium, { scene: "scatter-focus", lang: "en", theme: "light" }],
  ["b6r9-scatter-focus-zh-dark-390-webkit.png", webkit, { scene: "scatter-focus", lang: "zh", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
];

for (const [name, browserType, opts] of jobs) {
  const browser = await browserType.launch({ headless: true });
  try {
    await shot(browser, name, opts);
    console.log("wrote", name);
  } finally {
    await browser.close();
  }
}

server.kill("SIGTERM");
