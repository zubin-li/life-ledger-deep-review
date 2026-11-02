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
const port = 5299;
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

  if (opts.scene === "review-period") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.active", { timeout: 15000 });
    await page.waitForSelector("#reviewPeriodHabits .review-period-habits-list--live article", { timeout: 15000 }).catch(() => {});
    await page.locator("#reviewPeriodHabits").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  if (opts.scene === "today-day-roll") {
    await page.click("#dayRoll .day-roll-item:nth-child(2)");
    await page.waitForSelector(".hero-card.is-day-retarget, .hero-card[data-plan-date]", { timeout: 5000 }).catch(() => {});
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

await waitForServer(`http://127.0.0.1:${port}/index.html`);

const jobs = [
  ["b6r7-review-period-zh-light-1440-webkit.png", webkit, { scene: "review-period", lang: "zh", theme: "light" }],
  ["b6r7-today-hero-roll-en-light-1440-chromium.png", chromium, { scene: "today-day-roll", lang: "en", theme: "light" }],
  ["b6r7-ledger-de-dark-390-webkit.png", webkit, { scene: "ledger", lang: "de", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
];

try {
  for (const [name, browserType, opts] of jobs) {
    if (opts.scene === "ledger") {
      const browser = await browserType.launch({ headless: true });
      const context = await browser.newContext({
        viewport: opts.viewport,
        colorScheme: "dark",
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-language", "de");
        document.documentElement.dataset.theme = "dark";
      });
      const page = await context.newPage();
      await page.goto(demoBase, { waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(outDir, name) });
      await browser.close();
    } else {
      const browser = await browserType.launch({ headless: true });
      await shot(browser, name, opts);
      await browser.close();
    }
  }
} finally {
  server.kill();
}
