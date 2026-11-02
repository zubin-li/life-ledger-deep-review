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

  await page.click('.nav-item[data-view="timeline"]');
  await page.waitForSelector("#timelineView.active", { timeout: 15000 });

  if (opts.scene === "photos") {
    await page.click('[data-journal-mode="photos"]');
    await page.waitForSelector('#timelineView[data-journal-layout="photos"]', { timeout: 10000 });
    await page.waitForSelector("#journalPhotoLibrary.journal-library--ready", { timeout: 10000 });
    await page.waitForTimeout(480);
  }

  if (opts.scene === "feed-switch") {
    await page.click('[data-journal-mode="weeks"]');
    await page.waitForSelector('#timelineView[data-journal-layout="weeks"]', { timeout: 10000 });
    await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 10000 });
    await page.waitForTimeout(420);
  }

  if (opts.scene === "today-wall") {
    await page.click('.nav-item[data-view="today"]');
    await page.waitForSelector("#todayView.active", { timeout: 15000 });
    await page.waitForSelector(".tw-wall:not(.is-empty)", { timeout: 15000 });
    await page.waitForTimeout(400);
  }

  const target =
    opts.scene === "today-wall"
      ? page.locator(".tw-wall:not(.is-empty)").first()
      : opts.scene === "photos"
        ? page.locator("#journalPhotoLibrary")
        : page.locator("#journalFeedPane");
  await target.screenshot({ path: join(outDir, name), fullPage: opts.fullPage !== false });
  await context.close();
}

await mkdir(outDir, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

const jobs = [
  ["b5r5-photos-zh-light-1440-webkit.png", webkit, { scene: "photos", lang: "zh", theme: "light" }],
  ["b5r5-photos-de-dark-390-chromium.png", chromium, { scene: "photos", lang: "de", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
  ["b5r5-feed-weeks-en-light-1440-webkit.png", webkit, { scene: "feed-switch", lang: "en", theme: "light" }],
  ["b5r5-today-wall-zh-light-1440-chromium.png", chromium, { scene: "today-wall", lang: "zh", theme: "light" }],
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
