import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5299;
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
  "ledger month-empty hairline CTA focuses quick entry",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
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
        state.ledger = window.LifeLedgerLedger.emptyLedger();
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector(".money-empty", { timeout: 12000 });
      const empty = await page.locator("#ledgerView .money-empty").first().textContent();
      assert.match(empty || "", /还没有|记下第一笔/);
      await page.click("[data-money-add]");
      await page.waitForFunction(() => document.activeElement?.name === "amount");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "ledger budget empty CTA opens budget popover",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
        state.ledger = window.LifeLedgerLedger.emptyLedger();
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.click("[data-money-settings]");
      await page.waitForSelector("[data-setting=monthlyBudgetMinor]", { timeout: 8000 });
      const title = await page.locator("#moneySettings").textContent();
      assert.match(title || "", /Monthly variable budget|Budget/i);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
