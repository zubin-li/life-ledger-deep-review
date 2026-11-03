import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5295;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
      cwd: join(repoRoot, "public"),
      stdio: "ignore",
    });
    proc.on("error", reject);
    setTimeout(() => resolve(proc), 400);
  });
}

async function seedScatterEmptyLedger(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    const L = window.LifeLedgerLedger;
    const today = new Date().toISOString().slice(0, 10);
    state.meta = { ...(state.meta || {}), demo: { active: false } };
    state.habits = [];
    state.focusSessions = [];
    state.logs = {};
    let ledger = L.normalize({}, { lang: localStorage.getItem("life-ledger-language") || "zh" });
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
    const account = ledger.accounts.find(a => !a.archived);
    if (!expenseCat || !account) return;
    ledger.transactions.push({
      id: "ledger-wellness-empty-seed-tx",
      accountId: account.id,
      categoryId: expenseCat.id,
      amountMinor: -1250,
      currency: ledger.settings.defaultCurrency || "EUR",
      date: today,
      note: "Ledger wellness empty QA",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

test(
  "Money wellness scatter empty checklist when month has spend but not enough scatter days",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    try {
      const browser = await webkit.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      try {
        await page.addInitScript(() => {
          localStorage.setItem("life-ledger-language", "de");
          localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
          localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
          document.documentElement.dataset.theme = "dark";
        });
        await page.goto(base, { waitUntil: "domcontentloaded" });
        await seedScatterEmptyLedger(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.click('.nav-item[data-view="ledger"]');
        await page.waitForSelector(".ledger-legacy-viz #ledgerWellnessEmptyHint", { timeout: 15000, state: "attached" });
        const stepCount = await page.locator("#ledgerWellnessEmptyHint .review-scatter-empty-step").count();
        assert.equal(stepCount, 3, "expected three wellness empty checklist chips");
        const mainGrid = await page.locator("#ledgerView:not(.ledger-legacy-viz) .ledger-wellness-grid").count();
        assert.equal(mainGrid, 0, "scatter grid should not appear on main ledger surface");
        await page.evaluate(() => {
          document.querySelector('#ledgerWellnessEmptyHint [data-scatter-empty-target="today"]')?.click();
        });
        await page.waitForFunction(() => document.getElementById("todayView")?.classList.contains("active"), null, {
          timeout: 5000,
        });
      } finally {
        await browser.close();
      }
    } finally {
      server.kill("SIGTERM");
    }
  },
);
