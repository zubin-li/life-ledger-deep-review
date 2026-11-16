import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5272;
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
  "ledger edit popover rejects invalid amount without mutating the transaction",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
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
        state.ledger = window.LifeLedgerLedger.buildDemoSample({
          now: new Date("2026-11-18T12:00:00"),
          lang: "en",
          contentSeed: 7,
        });
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector(".money-tx");

      const before = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        const id = document.querySelector(".money-tx")?.dataset?.id;
        const tx = state.ledger.transactions.find(t => t.id === id);
        return { id, amountMinor: tx?.amountMinor, note: tx?.note ?? "" };
      });

      await page.locator(".money-tx").first().click();
      await page.waitForSelector("[data-edit-form]");
      const amount = page.locator('#moneySheetRoot input[name="amount"]');
      await amount.fill("not-a-number");
      await page.locator("[data-edit-form] button[type=submit]").click();
      await page.waitForTimeout(120);

      const err = await page.locator("#moneySheetRoot [data-error]").textContent();
      assert.match(err || "", /amount|Betrag|金额/i);
      assert.equal(await page.locator("[data-edit-form]").count(), 1);

      const after = await page.evaluate(({ id }) => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        const tx = state.ledger.transactions.find(t => t.id === id);
        return { amountMinor: tx?.amountMinor, note: tx?.note ?? "" };
      }, before);

      assert.equal(after.amountMinor, before.amountMinor);
      assert.equal(after.note, before.note);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
