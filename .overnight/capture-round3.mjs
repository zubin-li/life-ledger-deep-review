import { chromium } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const base = "http://127.0.0.1:5291/index.html?mode=local";

async function seedDemoLedger(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    const now = new Date("2026-11-18T12:00:00");
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now,
      lang: localStorage.getItem("life-ledger-language") || "en",
      contentSeed: 42,
    });
    const habitIds = (state.habits || []).map(h => h.id);
    window.LifeLedgerLedger.alignDemoMoodWithSpend?.(state.logs, state.ledger, now);
    window.LifeLedgerLedger.alignDemoHabitCompletionWithSpend?.(state.logs, state.ledger, habitIds, now);
    state.focusSessions = window.LifeLedgerLedger.alignDemoFocusWithSpend?.(
      state.focusSessions,
      state.ledger,
      now,
    ) ?? state.focusSessions;
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (let d = 1; d <= now.getDate(); d += 1) {
      const iso = `${ym}-${String(d).padStart(2, "0")}`;
      if (!state.logs[iso]) {
        state.logs[iso] = { completed: habitIds.slice(0, 3), mood: "平静", note: "", moodReason: "" };
      }
    }
    state.meta = state.meta || {};
    state.meta.demo = { ...(state.meta.demo || {}), active: true, version: 1, persona: 11, seededAt: now.toISOString() };
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function seedConflictLedgerPreview(page) {
  await page.evaluate(() => {
    const stateKey = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!stateKey || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(stateKey)); } catch { return; }
    const preserved = JSON.parse(JSON.stringify(state));
    let ledger = window.LifeLedgerLedger.normalize(preserved.ledger || null, { lang: "en" });
    const acct = ledger.accounts[0]?.id;
    const cat = ledger.categories.find(c => c.kind === "expense")?.id;
    if (acct && cat) {
      const added = window.LifeLedgerLedger.addTransaction(ledger, {
        accountId: acct,
        categoryId: cat,
        amountMinor: -9999,
        currency: "EUR",
        date: "2026-11-10",
        note: "Conflict preserved",
      });
      ledger = added.ledger || added;
    }
    preserved.ledger = ledger;
    localStorage.setItem("life-ledger-sync-conflict-v1", JSON.stringify({
      version: 1,
      detectedAt: Date.now(),
      provider: "cloudflare",
      baseRevision: 1,
      remoteRevision: 2,
      pendingRemoteResolution: true,
      backup: {
        format: "life-ledger-backup",
        schemaVersion: 3,
        scope: "all",
        data: preserved,
        preferences: { version: 1, values: {} },
      },
    }));
  });
}

async function shot(name, run) {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await run(page);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
  await browser.close();
  console.log("saved", name);
}

await mkdir(outDir, { recursive: true });

await shot("review-focus-spend-light-1440", async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector(".review-focus-scatter", { timeout: 8000 });
  await page.locator(".review-focus-scatter-wrap").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
});

await shot("import-conflict-ledger-preview-light-1440", async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await seedDemoLedger(page);
  await seedConflictLedgerPreview(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click("#settingsButton");
  await page.click("#settingsBackup");
  await page.click("#backupImportTab");
  await page.waitForSelector("#conflictLedgerPreview:not([hidden])", { timeout: 8000 });
  await page.waitForTimeout(300);
});

console.log("round 3 shots done");
