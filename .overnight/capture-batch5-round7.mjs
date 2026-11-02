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
const port = 5295;
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

  if (opts.scene === "review-month") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.active", { timeout: 15000 });
    await page.waitForSelector("#reviewInsights .rv-metrics", { timeout: 15000 });
    await page.click('#reviewTitle [data-rv-month="-1"]');
    await page.waitForTimeout(480);
    await page.locator("#reviewInsights").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  if (opts.scene === "today-edit") {
    await page.click('.nav-item[data-view="today"]');
    await page.waitForSelector("#todayView.active", { timeout: 15000 });
    await page.click(".tc-edit-toggle");
    await page.waitForSelector("#todayView.tc-editing", { timeout: 10000 });
    const handle = page.locator("#todayView.tc-editing > .tc-card:not([hidden])").first();
    const box = await handle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 24);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 120, { steps: 8 });
      await page.mouse.up();
    }
    await page.waitForTimeout(320);
    await page.locator(".tc-bar").screenshot({ path: join(outDir, name) });
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
  ["b5r7-review-metrics-zh-light-1440-webkit.png", webkit, { scene: "review-month", lang: "zh", theme: "light" }],
  ["b5r7-review-metrics-de-dark-390-chromium.png", chromium, { scene: "review-month", lang: "de", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
  ["b5r7-today-edit-en-light-390-webkit.png", webkit, { scene: "today-edit", lang: "en", theme: "light", mobile: true, viewport: { width: 390, height: 844 } }],
  ["b5r7-today-edit-en-light-390-chromium.png", chromium, { scene: "today-edit", lang: "en", theme: "light", mobile: true, viewport: { width: 390, height: 844 } }],
];

try {
  for (const [name, browserType, opts] of jobs) {
    const browser = await browserType.launch({ headless: true });
    try {
      await shot(browser, name, opts);
      console.log("ok", name);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill("SIGTERM");
}
