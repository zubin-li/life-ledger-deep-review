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
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

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
  await context.addInitScript(({ lang, theme, emptyLedger }) => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    localStorage.removeItem("life-ledger-ledger-onboarding-dismissed");
    if (lang) localStorage.setItem("life-ledger-language", lang);
    if (theme) document.documentElement.dataset.theme = theme;
    if (emptyLedger) {
      window.__llEmptyLedgerOnBoot = true;
    }
  }, { lang: opts.lang, theme: opts.theme, emptyLedger: opts.emptyLedger });
  return context;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  await waitForServer(`http://127.0.0.1:${port}/`);

  const shots = [
    { name: "b13r1-ledger-onboarding-zh-light-1440-chromium", browser: chromium, lang: "zh", theme: "light", viewport: { width: 1440, height: 900 } },
    { name: "b13r1-ledger-sample-de-dark-390-webkit", browser: webkit, lang: "de", theme: "dark", viewport: { width: 390, height: 844 }, mobile: true, afterSample: true },
  ];

  try {
    for (const spec of shots) {
      const browser = await spec.browser.launch({ headless: true });
      const context = await prepContext(browser, spec);
      const page = await context.newPage();
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key || !window.LifeLedgerLedger) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        state.ledger = window.LifeLedgerLedger.emptyLedger();
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector("[data-ledger-onboarding]", { timeout: 15000 });
      if (spec.afterSample) {
        await page.click("[data-ledger-sample-entry]");
        await page.waitForSelector(".ledger-tx.is-enter", { timeout: 12000 });
      }
      await page.waitForTimeout(400);
      const engine = spec.browser === webkit ? "webkit" : "chromium";
      await page.screenshot({ path: join(outDir, `${spec.name}.png`), fullPage: true });
      await context.close();
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
