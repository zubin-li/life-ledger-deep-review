import { chromium } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
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

async function seedExtremeSurge(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    const L = globalThis.LifeLedgerLedger;
    if (!L) return;
    let ledger = L.normalize(state.ledger || null, { lang: "zh" });
    const account = ledger.accounts[0]?.id;
    const cat = ledger.categories.find(c => c.kind === "expense")?.id;
    if (!account || !cat) return;
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    ledger = { ...ledger, transactions: [] };
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: cat,
      amountMinor: -2000,
      currency: "EUR",
      date: yesterday,
      note: "y",
    }));
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: cat,
      amountMinor: -50000,
      currency: "EUR",
      date: today,
      note: "spike",
    }));
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(`${base.split("?")[0]}`);
    const browser = await chromium.launch({ headless: true });
    for (const theme of ["light", "dark"]) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: theme === "dark" ? "dark" : "light",
      });
      await ctx.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      if (theme === "dark") {
        await ctx.addInitScript(() => {
          document.documentElement.dataset.theme = "dark";
        });
      }
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await seedExtremeSurge(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
      await page.locator(".tw-spending").scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.locator(".tw-spending").screenshot({
        path: join(outDir, `b10r1-today-spend-amount-delta-zh-${theme}-1440-chromium.png`),
      });
      await ctx.close();
    }
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
