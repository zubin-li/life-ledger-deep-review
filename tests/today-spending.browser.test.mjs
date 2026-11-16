import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5291;
const baseLocal = `http://127.0.0.1:${port}/index.html?mode=local`;
const baseDemo = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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
  "Today spending card shows syntax hint on empty ledger",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.removeItem("life-ledger-ledger-onboarding-dismissed");
      });
      await page.goto(baseLocal, { waitUntil: "networkidle" });
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
      await page.evaluate(() => { localStorage.setItem("life-ledger-today-cards-onboarding-dismissed" + (window.LifeLedgerStorageSuffix || ""), "1"); document.getElementById("tcOnboardHint")?.remove(); document.documentElement.classList.remove("tc-onboard-open"); window.LifeLedgerTodayCards?.show?.("spending"); });
      await page.waitForSelector(".tw-card.tw-spending");
      const note = await page.locator(".tw-spend-empty").textContent();
      assert.match(note || "", /还没有支出/);
      await page.locator(".tw-card.tw-spending .tc-card-hit").click();
      await page.waitForSelector("#todayLedgerSheet.is-open");
      const placeholder = await page.locator("#todayLedgerQuickForm input[name=quick]").getAttribute("placeholder");
      assert.match(placeholder || "", /12,50|咖啡/);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today spending compare shows money delta on extreme surge not +999%",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(baseLocal, { waitUntil: "networkidle" });
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
          note: "small",
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
      await page.reload({ waitUntil: "networkidle" });
      await page.evaluate(() => { localStorage.setItem("life-ledger-today-cards-onboarding-dismissed" + (window.LifeLedgerStorageSuffix || ""), "1"); document.getElementById("tcOnboardHint")?.remove(); document.documentElement.classList.remove("tc-onboard-open"); window.LifeLedgerTodayCards?.show?.("spending"); });
      await page.waitForSelector(".tw-spend-amount", { timeout: 15000 });
      const amount = await page.locator(".tw-spend-amount").textContent();
      assert.match(amount || "", /500|500,00|500.00/);
      assert.doesNotMatch(amount || "", /999%/);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
