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
const port = 5292;
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

async function openSettings(page) {
  const toggle = page.locator("#mobileToolbarToggle");
  if (await toggle.isVisible()) {
    const expanded = await toggle.getAttribute("aria-expanded");
    if (expanded !== "true") await toggle.click();
  }
  await page.click("#settingsButton");
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

  if (opts.scene === "settings") {
    await openSettings(page);
    await page.waitForSelector("#settingsDialog[open]", { timeout: 15000 });
    await page.waitForTimeout(460);
    await page.locator("#settingsDialog").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  if (opts.scene === "backup-tab") {
    await openSettings(page);
    await page.waitForSelector("#settingsDialog[open]", { timeout: 15000 });
    await page.click("#settingsBackup");
    await page.waitForSelector("#exportDialog[open]", { timeout: 15000 });
    await page.waitForTimeout(420);
    await page.click("#backupImportTab");
    await page.waitForTimeout(460);
    await page.locator(".export-dialog form > header").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }

  if (opts.scene === "today-hero") {
    await page.waitForSelector("#todayView.active", { timeout: 15000 });
    await page.waitForTimeout(380);
    await page.locator("#todayView .tc-top").screenshot({ path: join(outDir, name) });
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
try {
  await waitForServer(`http://127.0.0.1:${port}/index.html`);
  for (const [browserType, tag] of [
    [webkit, "webkit"],
    [chromium, "chromium"],
  ]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b5r9-settings-zh-light-1440-${tag}.png`, { scene: "settings", lang: "zh" });
    await shot(browser, `b5r9-backup-import-de-dark-390-${tag}.png`, {
      scene: "backup-tab",
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    await shot(browser, `b5r9-today-hero-en-light-1440-${tag}.png`, { scene: "today-hero", lang: "en" });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
