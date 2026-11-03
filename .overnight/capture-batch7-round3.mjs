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
const port = 5291;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

const sampleCsv = `Datum;Verwendungszweck;Betrag
01.11.2026;REWE;-12,50
02.11.2026;Kaffee;3,20`;

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

async function shotImportConfirm(browser, name, opts = {}) {
  const context = await prepContext(browser, opts);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    delete state.ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
  await page.locator("#ledgerCsvFile").setInputFiles({
    name: "import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(sampleCsv, "utf8"),
  });
  await page.waitForSelector(".ledger-import-popover", { timeout: 8000 });
  await page.waitForTimeout(280);
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
  [shotImportConfirm, "b7r3-ledger-import-confirm-zh-light-1440-chromium.png", chromium, { lang: "zh", theme: "light" }],
  [shotImportConfirm, "b7r3-ledger-import-confirm-de-dark-390-webkit.png", webkit, { lang: "de", theme: "dark", mobile: true, viewport: { width: 390, height: 844 } }],
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
