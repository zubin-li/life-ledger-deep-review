/**
 * Fictional Money page screenshots for docs/SHOWCASE* (en/zh/de, desktop + mobile).
 * Output: docs/images/demo-preview/{lang}-{desktop|mobile}/{lang}-08-ledger-v21.png
 */
import { webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const port = 5299;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

const locales = [
  { lang: "en", folder: "en" },
  { lang: "zh", folder: "zh" },
  { lang: "de", folder: "de" },
];

async function waitForServer(url, attempts = 50) {
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

async function captureLedger(browser, outPath, opts) {
  const context = await browser.newContext({
    viewport: opts.viewport,
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      localStorage.setItem("life-ledger-language", lang);
      document.documentElement.dataset.theme = "light";
    },
    { lang: opts.lang },
  );
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(demoBase, { waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.active", { timeout: 20000 });
  await page.waitForSelector(".ledger-summary", { timeout: 15000 });
  await page.waitForTimeout(350);

  if (opts.mobile) {
    await page.screenshot({ path: outPath, fullPage: false });
  } else {
    await page.screenshot({ path: outPath, fullPage: false });
  }
  await context.close();
}

await mkdir(join(repoRoot, "docs/images/demo-preview/en-desktop"), { recursive: true });
await mkdir(join(repoRoot, "docs/images/demo-preview/en-mobile"), { recursive: true });
await mkdir(join(repoRoot, "docs/images/demo-preview/zh-desktop"), { recursive: true });
await mkdir(join(repoRoot, "docs/images/demo-preview/zh-mobile"), { recursive: true });
await mkdir(join(repoRoot, "docs/images/demo-preview/de-desktop"), { recursive: true });
await mkdir(join(repoRoot, "docs/images/demo-preview/de-mobile"), { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

try {
  for (const { lang, folder } of locales) {
    const browser = await webkit.launch({ headless: true });
    try {
      const desktopPath = join(
        repoRoot,
        `docs/images/demo-preview/${folder}-desktop/${folder}-08-ledger-v21.png`,
      );
      await captureLedger(browser, desktopPath, {
        lang,
        viewport: { width: 1600, height: 1050 },
      });
      console.log("saved", desktopPath);

      const mobilePath = join(
        repoRoot,
        `docs/images/demo-preview/${folder}-mobile/${folder}-08-ledger-v21.png`,
      );
      await captureLedger(browser, mobilePath, {
        lang,
        mobile: true,
        dpr: 2,
        viewport: { width: 430, height: 932 },
      });
      console.log("saved", mobilePath);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill("SIGTERM");
}

console.log("showcase ledger v21 captures done");
