import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5296;
const base = `http://127.0.0.1:${port}/index.html?mode=cloudflare&local-preview=demo-showcase-v1`;

async function waitForHttp(url, attempts = 120) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not respond: ${url}`);
}

function startFakecloud() {
  return spawn("bash", [join(repoRoot, ".overnight/fakecloud.sh"), String(port)], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
  });
}

test(
  "fakecloud preview showcase seeds ledger and uploads on first sync",
  { skip: !hasPlaywright, timeout: 240_000 },
  async () => {
    const fakecloud = startFakecloud();
    try {
      await waitForHttp(base);
      const { webkit } = await import(join(playwrightRoot, "index.mjs"));
      const browser = await webkit.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      try {
        await page.addInitScript(() => {
          localStorage.clear();
          localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
          localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
          localStorage.setItem("life-ledger-language", "zh");
        });
        await page.goto(base, { waitUntil: "networkidle", timeout: 90_000 });
        await page.waitForSelector(".tc-grid", { timeout: 45_000 });
        await page.waitForFunction(() => document.querySelector("#saveMode")?.classList.contains("cloud"), {
          timeout: 90_000,
        });
        await page.waitForTimeout(2500);

        const cloudLedgerTx = await page.evaluate(async () => {
          const res = await fetch("/api/state", { credentials: "same-origin" });
          if (!res.ok) return -1;
          const body = await res.json();
          return body.payload?.ledger?.transactions?.length ?? 0;
        });
        assert.ok(cloudLedgerTx > 5, `expected demo ledger on cloud, got ${cloudLedgerTx}`);

        const todaySpend = await page.locator(".tw-card.tw-spending .tw-spend-today").textContent();
        assert.ok(todaySpend && todaySpend.trim().length > 0, "Today spending card should show an amount");

        await page.locator('.nav-item[data-view="week"]').click();
        await page.waitForSelector("#weekSpendingHint:not([hidden])", { timeout: 45_000 });
        const weekHint = await page.locator("#weekSpendingHint").textContent();
        assert.doesNotMatch(weekHint || "", /\+\d{4,}%/);
        assert.match(weekHint || "", /较上周同期|与上周同期相近/);

        await page.locator('.nav-item[data-view="review"]').click();
        await page.waitForSelector("#reviewLedgerSummary:not([hidden])", { timeout: 45_000 });
        await page.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
        await page.waitForSelector("#reviewLedgerSpendHint:not([hidden])", { timeout: 45_000 });
        const reviewHint = await page.locator("#reviewLedgerSpendHint").textContent();
        assert.doesNotMatch(reviewHint || "", /\+\d{4,}%/);
        assert.match(reviewHint || "", /较上月同期|与上月同期相近|较上月/);

        await page.locator('.nav-item[data-view="ledger"]').click();
        await page.waitForSelector("#ledgerView.view.active", { timeout: 45_000 });
        await page.waitForSelector("#ledgerQuickInput", { timeout: 45_000 });
        const ledgerTxRows = await page.locator(".ledger-tx").count();
        assert.ok(ledgerTxRows > 3, `expected demo ledger rows on cloud UI, got ${ledgerTxRows}`);
        const summaryExpense = await page.locator('[data-ledger-sum="expense"]').textContent();
        assert.ok(summaryExpense && summaryExpense.trim().length > 2, "ledger month expense summary should render");
        await page.waitForSelector(".ledger-category-viz, .ledger-donut", { timeout: 45_000 });
      } finally {
        await context.close();
        await browser.close();
      }
    } finally {
      try {
        process.kill(-fakecloud.pid, "SIGTERM");
      } catch {
        fakecloud.kill("SIGTERM");
      }
    }
  },
);
