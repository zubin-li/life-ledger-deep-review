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

test(
  "ledger auto-posts monthly subscription after due day (idempotent)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
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
        const ledger = window.LifeLedgerLedger.normalize(null, { lang: "de" });
        const account = ledger.accounts[0].id;
        const cat = ledger.categories.find(c => c.kind === "expense");
        ledger.recurring = [{
          id: "sub-test",
          label: "Abonnement",
          accountId: account,
          categoryId: cat.id,
          amountMinor: -1299,
          currency: "EUR",
          cadence: "monthly",
          dayOfMonth: 1,
          note: "Sub",
        }];
        state.ledger = ledger;
        state.meta = state.meta || {};
        state.meta.demo = { active: false };
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      const before = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        return JSON.parse(localStorage.getItem(key)).ledger.transactions.length;
      });
      await page.locator('.nav-item[data-view="ledger"]').first().click({ timeout: 8000 });
      await page.waitForSelector(".ledger-sub-list .ledger-sub-row", { timeout: 8000 });
      const after = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return {
          total: state.ledger.transactions.length,
          tagged: state.ledger.transactions.filter(t => t.recurringId === "sub-test").length,
        };
      });
      assert.ok(after.total > before, "auto-post should add one row");
      assert.equal(after.tagged, 1, "posted row should carry recurringId");
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').first().click({ timeout: 8000 });
      const taggedAgain = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return state.ledger.transactions.filter(t => t.recurringId === "sub-test").length;
      });
      assert.equal(taggedAgain, 1, "auto-post should stay idempotent on reload");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
