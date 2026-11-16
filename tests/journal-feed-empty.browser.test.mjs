import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5289;
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
  "Journal daily feed empty shows CTA and opens today reflection",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(
          k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1") || k.startsWith("life-ledger-preview-"),
        );
        if (!key) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        state.logs = {};
        state.weeklyOutputs = {};
        state.reviews = {};
        if (state.meta?.demo) state.meta.demo.active = false;
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="timeline"]');
      await page.locator('[data-journal-mode="timeline"]').click();
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 15000 });
      await page.waitForSelector("#journalEmptyWriteToday", { timeout: 15000 });
      await page.locator("#journalFeed .feed-empty.ll-polished .hairline-mount svg").waitFor({
        state: "attached",
        timeout: 10000,
      });
      await page.locator("#journalEmptyWriteToday").click();
      await page.waitForSelector("#todayView.view.active", { timeout: 8000 });
      await page.waitForSelector("#dayNote", { timeout: 8000 });
      assert.equal(await page.locator("#journalToolPanel:not([hidden])").count(), 1);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Journal month filter empty shows quiet search art",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
      });
      await page.goto(`${base}&local-preview=demo-showcase-v1`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => {
          const key = Object.keys(localStorage).find(
            k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1") || k.startsWith("life-ledger-preview-"),
          );
          return Boolean(key);
        },
        null,
        { timeout: 15000 },
      );
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(
          k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1") || k.startsWith("life-ledger-preview-"),
        );
        if (!key) return;
        const state = JSON.parse(localStorage.getItem(key));
        state.weeklyOutputs = {};
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="timeline"]');
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 15000 });
      const monthValue = await page.evaluate(() => {
        const select = document.getElementById("journalMonthFilter");
        const opt = [...select.options].find(o => o.value);
        return opt?.value || "";
      });
      assert.ok(monthValue, "expected at least one month in journal filter");
      await page.selectOption("#journalMonthFilter", monthValue);
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 10000 });
      await page.waitForSelector("#journalFeed .journal-feed-filter-quiet .hairline-mount svg", { timeout: 12000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
