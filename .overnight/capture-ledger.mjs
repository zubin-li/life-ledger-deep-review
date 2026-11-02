import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const SHELL_JS = readFileSync("/Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.js", "utf8");
const SHELL_CSS = readFileSync("/Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.css", "utf8");

const base = "http://127.0.0.1:5291/index.html?mode=local";

async function seedYesterdaySpendOnly(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    const lang = localStorage.getItem("life-ledger-language") || "en";
    state.ledger = window.LifeLedgerLedger.normalize(null, { lang });
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cat = state.ledger.categories.find(c => c.type === "expense");
    const acct = state.ledger.accounts[0];
    if (cat && acct) {
      window.LifeLedgerLedger.addTransaction(state.ledger, {
        accountId: acct.id,
        categoryId: cat.id,
        amountMinor: -450,
        date: iso,
        note: "Coffee",
      });
    }
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function clearLedgerForOnboarding(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    state.ledger = window.LifeLedgerLedger.emptyLedger();
    localStorage.removeItem("life-ledger-ledger-onboarding-dismissed");
    localStorage.setItem(key, JSON.stringify(state));
  });
}
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
    const record = {
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
    };
    localStorage.setItem("life-ledger-sync-conflict-v1", JSON.stringify(record));
  });
}

async function shot(browserType, name, opts) {
  const browser = await browserType.launch({ headless: true });
  const contextOpts = { viewport: opts.viewport };
  if (opts.macShell) {
    contextOpts.serviceWorkers = "block";
    contextOpts.deviceScaleFactor = 2;
  }
  const context = await browser.newContext(contextOpts);
  if (opts.macShell) {
    await context.addInitScript(({ js, css }) => {
      window.__TAURI__ = {
        core: { invoke: async () => null },
        event: { listen: async () => () => {} },
        window: { getCurrentWindow: () => ({ show: async () => {}, isFullscreen: async () => false }) },
        app: { getVersion: async () => "3.1.0" },
      };
      new Function(js)();
      document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent = css;
        document.head.append(s);
      });
    }, { js: SHELL_JS, css: SHELL_CSS });
  }
  const page = await context.newPage();
  const loadUrl = opts.macShell
    ? `${base}&desktop=tauri-local${opts.lang ? `&lang=${opts.lang}` : ""}${opts.theme ? "" : ""}`
    : (opts.lang ? `${base}&lang=${opts.lang}` : base);
  await page.goto(loadUrl, { waitUntil: "networkidle" });
  if (opts.theme) {
    await page.evaluate(t => {
      localStorage.setItem("life-ledger-theme", t);
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  if (opts.demoLedger) {
    await seedDemoLedger(page);
    await page.reload({ waitUntil: "networkidle" });
  }
  if (opts.emptyLedger) {
    await clearLedgerForOnboarding(page);
    await page.reload({ waitUntil: "networkidle" });
  }
  if (opts.yesterdaySpendOnly) {
    await seedYesterdaySpendOnly(page);
    await page.reload({ waitUntil: "networkidle" });
  }
  if (opts.conflictPreview) {
    await seedConflictLedgerPreview(page);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#settingsButton");
    await page.click("#settingsBackup");
    await page.click("#backupImportTab");
    await page.waitForSelector("#conflictLedgerPreview:not([hidden])", { timeout: 8000 });
    await page.waitForTimeout(300);
  }
  if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
    await page.locator(".review-focus-scatter-wrap").scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(350);
  } else if (opts.view === "today") {
    await page.click('.nav-item[data-view="today"]');
  } else if (!opts.conflictPreview) {
    await page.click('.nav-item[data-view="ledger"]');
  }
  if (opts.treemap) {
    await page.click('.ledger-chart-mode[data-chart-mode="treemap"]');
    await page.waitForTimeout(300);
  }
  if (opts.focusKeypad) {
    await page.click("#ledgerQuickInput");
    await page.waitForTimeout(350);
  }
  if (opts.recurringPopover) {
    await page.click(".ledger-recurring-add");
    await page.waitForTimeout(350);
  }
  if (opts.recurringIncome) {
    await page.click(".ledger-recurring-add");
    await page.waitForTimeout(200);
    await page.selectOption('select[name="cadence"]', "weekly");
    await page.selectOption('select[name="category"]', { label: /Salary|Einkommen|工资/i }).catch(() => {});
    await page.waitForTimeout(200);
  }
  if (opts.view === "timeline") {
    await page.click('.nav-item[data-view="timeline"]');
    await page.waitForTimeout(400);
  }
  if (opts.view === "calendar") {
    await page.click('.nav-item[data-view="timeline"]');
    await page.click('[data-journal-mode="calendar"]');
    await page.waitForTimeout(500);
  }
  if (opts.view === "week") {
    await page.click('.nav-item[data-view="week"]');
    await page.waitForTimeout(400);
  }
  if (opts.emptyWeekGoals) {
    await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
      if (!key) return;
      let state;
      try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
      state.weeklyGoals = {};
      state.longTermGoals = [];
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="week"]');
    await page.waitForTimeout(600);
  }
  if (opts.emptyJournalMonth) {
    await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
      if (!key) return;
      let state;
      try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
      state.logs = {};
      state.meta = state.meta || {};
      state.meta.demo = { active: false };
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="timeline"]');
    await page.click('[data-journal-mode="timeline"]');
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: opts.fullPage !== false });
  await browser.close();
}

await mkdir(outDir, { recursive: true });
await shot(chromium, "ledger-chromium-light-1440", { viewport: { width: 1440, height: 900 }, theme: "light", demoLedger: true });
await shot(webkit, "ledger-webkit-dark-de-390", { viewport: { width: 390, height: 844 }, theme: "dark", lang: "de", demoLedger: true });
await shot(chromium, "today-spending-zh-390", { viewport: { width: 390, height: 844 }, lang: "zh", view: "today", demoLedger: true });
await shot(chromium, "review-ledger-light-1440", { viewport: { width: 1440, height: 900 }, theme: "light", view: "review", demoLedger: true });
await shot(webkit, "ledger-mac-shell-light-1440", {
  viewport: { width: 1440, height: 950 },
  theme: "light",
  demoLedger: true,
  macShell: true,
  fullPage: false,
});
await shot(chromium, "ledger-treemap-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  treemap: true,
});
await shot(chromium, "ledger-recurring-popover-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  recurringPopover: true,
});
await shot(chromium, "ledger-recurring-weekly-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  recurringIncome: true,
});
await shot(chromium, "ledger-mobile-keypad-light-390", {
  viewport: { width: 390, height: 844 },
  theme: "light",
  demoLedger: true,
  focusKeypad: true,
});
await shot(webkit, "ledger-mobile-keypad-webkit-dark-390", {
  viewport: { width: 390, height: 844 },
  theme: "dark",
  lang: "de",
  demoLedger: true,
  focusKeypad: true,
});
await shot(chromium, "review-habit-scatter-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
  demoLedger: true,
});
await shot(chromium, "review-focus-spend-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
  demoLedger: true,
});
await shot(chromium, "import-conflict-ledger-preview-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  conflictPreview: true,
});
await shot(chromium, "ledger-treemap-de-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  lang: "de",
  demoLedger: true,
  treemap: true,
});
await shot(chromium, "week-insights-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  view: "week",
});
await shot(chromium, "timeline-calendar-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  demoLedger: true,
  view: "calendar",
});
await shot(chromium, "ledger-onboarding-zh-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  lang: "zh",
  emptyLedger: true,
});
await shot(chromium, "review-sparks-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
  demoLedger: true,
});
await shot(chromium, "week-goals-empty-zh-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  lang: "zh",
  demoLedger: true,
  view: "week",
  emptyWeekGoals: true,
});
await shot(webkit, "week-goals-empty-mac-shell-1440", {
  viewport: { width: 1440, height: 950 },
  theme: "light",
  lang: "zh",
  macShell: true,
  fullPage: false,
  view: "week",
  emptyWeekGoals: true,
});
await shot(chromium, "journal-empty-zh-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  lang: "zh",
  emptyJournalMonth: true,
});
await shot(chromium, "today-spending-quiet-zh-390", {
  viewport: { width: 390, height: 844 },
  theme: "light",
  lang: "zh",
  view: "today",
  yesterdaySpendOnly: true,
});
console.log("screenshots saved");
