import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5273;
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

const sampleCsv = `Datum;Verwendungszweck;Betrag
01.11.2026;REWE;-12,50
02.11.2026;Gehalt;2500,00`;

async function openCsvPreview(page) {
  await page.locator("[data-money-import]").first().click();
  await page.locator("[data-import-file]").setInputFiles({
    name: "sparkasse.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(sampleCsv, "utf8"),
  });
  await page.waitForSelector(".money-import-files li");
  await page.click("[data-import-next]");
  const dateMap = page.locator("[data-map-field=date]");
  if (await dateMap.count()) {
    await dateMap.selectOption("0");
    await page.locator("[data-map-field=amount]").selectOption("2");
    await page.click("[data-import-next]");
  }
  await page.waitForSelector("[data-import-commit]");
}

test(
  "ledger CSV import uses in-app confirm; cancel keeps empty ledger",
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
      await page.waitForSelector("#ledgerView.active");
      await openCsvPreview(page);
      const title = await page.locator("#moneyImportTitle").textContent();
      assert.match(title || "", /Kontoauszug|importieren/i);
      await page.waitForSelector(".money-import-row");
      const previewRows = await page.locator(".money-import-row").count();
      assert.equal(previewRows, 2);
      await page.locator("#moneyImportSheetRoot").press("Escape");
      await page.waitForSelector("#moneyImportTitle", { state: "detached" });

      const countAfterCancel = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return state.ledger?.transactions?.length ?? 0;
      });
      assert.equal(countAfterCancel, 0);

      await openCsvPreview(page);
      await page.click("[data-import-commit]");
      await page.waitForSelector("#moneyImportTitle", { state: "detached" });
      await page.waitForFunction(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return (state.ledger?.transactions?.length ?? 0) === 2;
      }, { timeout: 8000 });

      const countAfterImport = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return state.ledger?.transactions?.length ?? 0;
      });
      assert.equal(countAfterImport, 2);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
