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
      await page.waitForSelector(".tw-card.tw-spending");
      const hint = page.locator(".tw-spend-hint");
      await assert.doesNotReject(hint.waitFor({ state: "visible", timeout: 8000 }));
      const text = await hint.textContent();
      assert.match(text || "", /12,50|咖啡/);
      const note = await page.locator(".tw-spend-note").textContent();
      assert.match(note || "", /还没有支出/);
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
      await page.goto(baseDemo, { waitUntil: "networkidle" });
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
      await page.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
      const compare = await page.locator(".tw-spend-compare").textContent();
      assert.match(compare || "", /480|947|€|多/);
      assert.doesNotMatch(compare || "", /999%/);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
