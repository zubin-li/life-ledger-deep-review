import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5276;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;
const demoBase = `${base}&local-preview=demo-showcase-v1`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

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

function macShellInitScript() {
  return ({ js, css }) => {
    window.__TAURI__ = {
      core: { invoke: async () => null },
      event: { listen: async () => () => {} },
      window: {
        getCurrentWindow: () => ({
          show: async () => {},
          isFullscreen: async () => false,
        }),
      },
      app: { getVersion: async () => "3.1.0" },
    };
    new Function(js)();
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.append(s);
    });
  };
}

async function seedSmallBaselineIncrease(page) {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const L = window.LifeLedgerLedger;
    if (!L) return;
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    let ledger = L.normalize(null, { lang: "zh" });
    const account = ledger.accounts[0].id;
    const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
    const today = new Date();
    const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const pad = n => String(n).padStart(2, "0");
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const yesterday = iso(y);
    const todayIso = iso(today);
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -300,
      currency: "EUR",
      date: yesterday,
      note: "prev small",
    }));
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -5000,
      currency: "EUR",
      date: todayIso,
      note: "today",
    }));
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

test(
  "Today spending card prefers amount caption when yesterday baseline is under €15",
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
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await seedSmallBaselineIncrease(page);
      await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
      await page.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
      const compareText = await page.locator(".tw-spend-compare").textContent();
      assert.match(compareText || "", /较昨日多/);
      assert.doesNotMatch(compareText || "", /\+\d{3,}%/);
      assert.match(compareText || "", /47/);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Mac shell demo week and review spending hints stay readable (no four-digit +%)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    await context.addInitScript(macShellInitScript(), { js: SHELL_JS, css: SHELL_CSS });
    await context.addInitScript(() => {
      localStorage.setItem("life-ledger-language", "zh");
      localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    });
    const page = await context.newPage();
    try {
      await page.goto(demoBase, { waitUntil: "domcontentloaded" });
      await page.locator('.nav-item[data-view="week"]').click();
      await page.waitForTimeout(350);
      await page.locator("#weekInsightsGrid").scrollIntoViewIfNeeded();
      await page.waitForSelector("#weekSpendingHint:not([hidden])", { timeout: 15000 });
      const weekHint = await page.locator("#weekSpendingHint").textContent();
      assert.doesNotMatch(weekHint || "", /\+\d{4,}%/);
      assert.ok(documentHasMacClass(await page.evaluate(() => document.documentElement.className)), "expected ll-mac on html");

      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForTimeout(350);
      await page.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
      await page.waitForSelector("#reviewLedgerSpendHint:not([hidden])", { timeout: 15000 });
      const reviewHint = await page.locator("#reviewLedgerSpendHint").textContent();
      assert.doesNotMatch(reviewHint || "", /\+\d{4,}%/);

      await page.locator('.nav-item[data-view="today"]').click();
      await page.waitForTimeout(350);
      await page.waitForSelector("#todayHabitSpendHint:not([hidden])", { timeout: 15000 });
      await page.waitForSelector("#todayMoodSpendHint:not([hidden])", { timeout: 15000 });
      const habitText = await page.locator("#todayHabitSpendHint").textContent();
      const moodText = await page.locator("#todayMoodSpendHint").textContent();
      assert.match(habitText || "", /近 30 天/);
      assert.match(moodText || "", /心情较好日/);
    } finally {
      await context.close();
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

function documentHasMacClass(className) {
  return String(className).includes("ll-mac");
}

test(
  "Week insights roll metric values when navigating to another week",
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
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(demoBase, { waitUntil: "domcontentloaded" });
      await page.locator('.nav-item[data-view="week"]').click();
      await page.waitForSelector("#weekCompletionRate", { timeout: 15000 });
      await page.locator("#previousWorkspaceWeek").click();
      await page.waitForTimeout(120);
      await page.locator("#previousWorkspaceWeek").click();
      const sawRoll = await page.waitForFunction(
        () => {
          const el = document.getElementById("weekCompletionRate");
          return Boolean(el?.classList.contains("roll-host") || el?.querySelector(".roll-new"));
        },
        { timeout: 3000 },
      ).then(() => true).catch(() => false);
      assert.equal(sawRoll, true, "expected roll animation on week completion rate");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
