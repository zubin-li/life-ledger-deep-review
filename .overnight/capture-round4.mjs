import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
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

async function openConflictImport(page) {
  const toggle = page.locator("#mobileToolbarToggle");
  if (await toggle.isVisible()) {
    const expanded = await toggle.getAttribute("aria-expanded");
    if (expanded !== "true") await toggle.click();
  }
  await page.click("#settingsButton");
  await page.click("#settingsBackup");
  await page.click("#backupImportTab");
  await page.waitForSelector("#conflictLedgerPreview:not([hidden])", { timeout: 8000 });
}

async function shot(browserType, name, viewport, run) {
  const browser = await browserType.launch({ headless: true });
  const page = await (await browser.newContext({ viewport })).newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await run(page);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
  await browser.close();
  console.log("saved", name);
}

await mkdir(outDir, { recursive: true });

await shot(chromium, "review-scatter-grid-light-1440", { width: 1440, height: 900 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector(".review-scatter-grid", { timeout: 8000 });
  await page.locator(".review-scatter-grid").scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
});

await shot(chromium, "import-conflict-ledger-preview-dark-390", { width: 390, height: 844 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "dark");
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("life-ledger-language", "de");
  });
  await seedDemoLedger(page);
  await seedConflictLedgerPreview(page);
  await page.reload({ waitUntil: "networkidle" });
  await openConflictImport(page);
  await page.waitForTimeout(300);
});

await shot(webkit, "import-conflict-ledger-preview-webkit-dark-de-390", { width: 390, height: 844 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "dark");
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("life-ledger-language", "de");
  });
  await seedDemoLedger(page);
  await seedConflictLedgerPreview(page);
  await page.reload({ waitUntil: "networkidle" });
  await openConflictImport(page);
  await page.waitForTimeout(300);
});
