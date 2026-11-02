import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function seedDemoLedger(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
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

test(
  "review jump spy highlights section and month stats roll on change",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-language-preference-set", "true");
        localStorage.setItem("life-ledger-theme", "light");
        document.documentElement.dataset.theme = "light";
      });
      await seedDemoLedger(page);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="review"]').first().click({ timeout: 8000 });
      await page.waitForSelector(".review-scatter-jump", { timeout: 8000 });
      await page.evaluate(() => {
        const el = document.getElementById("review-scatter-focus");
        if (!el) return;
        const anchor = window.innerHeight * 0.36;
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, (rect.top + rect.bottom) / 2 - anchor);
        window.dispatchEvent(new Event("scroll"));
      });
      await sleep(250);
      const activeFromScroll = await page.locator('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-focus"]').count();
      assert.equal(activeFromScroll, 1, "scrolling to focus scatter should highlight focus chip");
      await page.locator('[data-review-scatter-jump="review-scatter-habit"]').click();
      const activeFromClick = await page.locator('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-habit"]').count();
      assert.equal(activeFromClick, 1, "clicking habit chip should mark it active");
      const spendBefore = (await page.locator(".review-ledger-stats strong").first().textContent())?.trim();
      await page.locator('.rv-month-step[data-rv-month="-1"]').click();
      await sleep(120);
      const rolling = await page.locator(".review-ledger-stats strong.roll-host").count();
      assert.ok(rolling >= 1, "month change should trigger roll animation on stat values");
      const rollLayers = await page.locator(".review-ledger-stats strong.roll-host .roll-old, .review-ledger-stats strong.roll-host .roll-new").count();
      assert.ok(rollLayers >= 2, "roll animation should expose outgoing and incoming layers");
      await sleep(220);
      const spendAfter = (await page.locator(".review-ledger-stats strong").first().textContent())?.trim();
      assert.notEqual(spendBefore, spendAfter, "previous month should show different spending total");
      const rollValue = await page.locator(".review-ledger-stats strong").first().getAttribute("data-roll-value");
      assert.equal(rollValue, spendAfter, "rolled stat should persist data-roll-value after animation");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
