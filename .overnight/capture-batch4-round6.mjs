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
const port = 5294;
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
  });
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      localStorage.removeItem("life-ledger-review-metrics-opened");
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
  await page.waitForSelector(".tc-grid", { timeout: 20000 });
  if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewDetailedMetrics .review-detailed-habit-chip", { timeout: 15000 });
    await page.locator("#reviewDetailedMetrics").screenshot({ path: join(outDir, name) });
  } else if (opts.view === "week") {
    await page.click('.nav-item[data-view="week"]');
    await page.waitForSelector("#weekView .module-card", { timeout: 15000 });
    await page.waitForTimeout(600);
    await page.locator("#weekView").screenshot({ path: join(outDir, name) });
  }
  await context.close();
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

try {
  for (const [browserType, tag] of [[chromium, "chromium"], [webkit, "webkit"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b4r6-review-habit-chips-zh-light-1440-${tag}.png`, { lang: "zh", view: "review" });
    await shot(browser, `b4r6-week-full-de-dark-390-${tag}.png`, {
      lang: "de",
      theme: "dark",
      viewport: { width: 390, height: 844 },
      view: "week",
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch4 round6 captures done");
