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

  if (opts.scene === "review") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector("#reviewView.active.is-entering, #reviewView.active", { timeout: 15000 });
    await page.waitForTimeout(550);
  }

  if (opts.scene === "ledger-keypad") {
    await page.click('.nav-item[data-view="ledger"]');
    await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
    await page.locator("#ledgerQuickInput").click();
    await page.waitForTimeout(400);
  }

  const target =
    opts.scene === "review"
      ? page.locator("#reviewView")
      : opts.scene === "ledger-keypad"
        ? page.locator("#ledgerView")
        : page.locator("#todayView");
  await target.screenshot({ path: join(outDir, name), fullPage: opts.fullPage !== false });
  await context.close();
}

await mkdir(outDir, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

try {
  const cases = [
    { lang: "zh", theme: "light", viewport: { width: 1440, height: 900 }, scene: "review", fullPage: false },
    { lang: "de", theme: "dark", viewport: { width: 390, height: 844 }, scene: "review", fullPage: true },
    { lang: "en", theme: "light", viewport: { width: 390, height: 460 }, scene: "ledger-keypad", mobile: true, fullPage: false },
  ];
  for (const [browserType, tag] of [
    [chromium, "chromium"],
    [webkit, "webkit"],
  ]) {
    const browser = await browserType.launch({ headless: true });
    for (const c of cases) {
      const scene = c.scene || "today";
      const slug = `b5r3-${scene}-${c.lang}-${c.theme}-${c.viewport.width}`;
      await shot(browser, `${slug}-${tag}.png`, c);
    }
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
