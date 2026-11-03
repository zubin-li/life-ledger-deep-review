import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
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
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

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

function macInitScript() {
  return ({ js, css }) => {
    window.__TAURI__ = {
      core: { invoke: async () => null },
      event: { listen: async () => () => {} },
      window: {
        getCurrentWindow: () => ({
          show: async () => {},
          isFullscreen: async () => false,
        }),
      },
      app: { getVersion: async () => "3.1.0" },
    };
    new Function(js)();
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.append(s);
    });
  };
}

async function prepContext(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.mac ? 2 : 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  if (opts.mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
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
  return context;
}

async function shotLedgerFilter(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.goto(demoBase, { waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
  await page.keyboard.press("/");
  await page.waitForSelector("#ledgerFilter:focus", { timeout: 5000 });
  await page.keyboard.type("REWE");
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
}

async function shotMonthNav(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.goto(demoBase, { waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
  await page.locator(".ledger-header h2").click();
  await page.keyboard.press("ArrowLeft");
  await page.waitForSelector(".ledger-summary.is-retargeting, .ledger-header h2.is-retargeting", {
    timeout: 5000,
  });
  await page.waitForTimeout(450);
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
  [shotLedgerFilter, "b7r2-ledger-filter-en-light-1440-chromium.png", chromium, { lang: "en", theme: "light" }],
  [shotMonthNav, "b7r2-ledger-month-de-dark-390-webkit.png", webkit, { lang: "de", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
];

try {
  for (const [fn, name, browserType, opts] of jobs) {
    const browser = await browserType.launch({ headless: true });
    try {
      await fn(browser, name, opts);
      console.log("wrote", name);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill("SIGTERM");
}
