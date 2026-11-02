import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const base = "http://127.0.0.1:5295/index.html?mode=local";

async function setLanguage(page, lang) {
  await page.evaluate(l => {
    localStorage.setItem("life-ledger-language", l);
    localStorage.setItem("life-ledger-language-preference-set", "true");
  }, lang);
}

async function goReview(page) {
  const nav = page.locator('.nav-item[data-view="review"]');
  await nav.first().click({ timeout: 8000 });
  await page.waitForSelector(".review-ledger-panel", { timeout: 8000 });
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

async function shot(browserType, name, viewport, run, opts = {}) {
  const browser = await browserType.launch({ headless: true });
  const page = await (await browser.newContext({ viewport })).newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await run(page);
  await page.screenshot({
    path: join(outDir, `${name}.png`),
    fullPage: Boolean(opts.fullPage),
  });
  await browser.close();
  console.log("saved", name);
}

await mkdir(outDir, { recursive: true });

await shot(chromium, "review-jump-spy-zh-light-390", { width: 390, height: 844 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await setLanguage(page, "zh");
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await goReview(page);
  await page.locator(".review-scatter-jump").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.getElementById("review-scatter-habit")?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForTimeout(200);
});

await shot(chromium, "review-jump-spy-de-dark-390", { width: 390, height: 844 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "dark");
    document.documentElement.dataset.theme = "dark";
  });
  await setLanguage(page, "de");
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await goReview(page);
  await page.locator('[data-review-scatter-jump="review-scatter-focus"]').click();
  await page.waitForTimeout(300);
});

await shot(webkit, "review-jump-spy-webkit-zh-light-390", { width: 390, height: 844 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await setLanguage(page, "zh");
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await goReview(page);
  await page.locator(".review-scatter-jump-chip.is-active").first().waitFor({ timeout: 5000 }).catch(() => {});
});

await shot(chromium, "review-jump-spy-light-1440", { width: 1440, height: 900 }, async page => {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await setLanguage(page, "en");
  await seedDemoLedger(page);
  await page.reload({ waitUntil: "networkidle" });
  await goReview(page);
});
