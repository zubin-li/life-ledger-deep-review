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
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (let d = 1; d <= now.getDate(); d += 1) {
      const iso = `${ym}-${String(d).padStart(2, "0")}`;
      if (!state.logs[iso]) {
        state.logs[iso] = { completed: habitIds.slice(0, 3), mood: "平静", note: "", moodReason: "" };
      }
    }
    state.meta = state.meta || {};
    state.meta.demo = { ...(state.meta.demo || {}), active: true, version: 1, persona: 11, seededAt: now.toISOString() };
    state.focusSessions = state.focusSessions || [];
    const focusDays = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];
    focusDays.forEach((date, i) => {
      state.focusSessions.push({
        id: `demo-focus-${i}`,
        date,
        label: "Demo",
        outcome: "completed",
        startedAt: Date.parse(`${date}T09:00:00`),
        endedAt: Date.parse(`${date}T09:00:00`) + (i % 2 === 0 ? 90 : 15) * 60000,
        durationMs: (i % 2 === 0 ? 90 : 15) * 60000,
      });
    });
    localStorage.setItem(key, JSON.stringify(state));
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
  if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
  } else if (opts.view === "today") {
    await page.click('.nav-item[data-view="today"]');
  } else {
    await page.click('.nav-item[data-view="ledger"]');
  }
  if (opts.treemap) {
    await page.click('.ledger-chart-mode[data-chart-mode="treemap"]');
    await page.waitForTimeout(300);
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
});
await shot(chromium, "review-focus-spend-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
  demoLedger: true,
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
console.log("screenshots saved");
