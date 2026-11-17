import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5287;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

function startStaticServer() {
  return spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
}

async function waitForHttp(url) {
  let lastError = null;
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not respond: ${url} (${lastError?.message || "timeout"})`);
}

async function waitForAppReady(page) {
  await page.waitForFunction(() => {
    const ledgerReady = Boolean(window.LifeLedgerLedger?.buildDemoSample);
    const stored = Object.keys(localStorage).some(key => key === "life-ledger-v1" || key.startsWith("life-ledger-v1"));
    const habits = document.querySelector("#todayHabits .habit-card");
    return ledgerReady && stored && Boolean(habits);
  }, null, { timeout: 30_000 });
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
    const server = startStaticServer();
    let browser;
    try {
      await waitForHttp(base);
      const { chromium } = await import(join(playwrightRoot, "index.mjs"));
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitForAppReady(page);
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-language-preference-set", "true");
        localStorage.setItem("life-ledger-theme", "light");
        document.documentElement.dataset.theme = "light";
      });
      await seedDemoLedger(page);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitForAppReady(page);
      await page.locator('.nav-item[data-view="review"]').first().click({ timeout: 20_000 });
      await page.waitForSelector(".review-scatter-jump", { timeout: 20_000 });
      await page.waitForFunction(() => {
        const el = document.getElementById("review-scatter-focus");
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, null, { timeout: 30_000 });
      await page.evaluate(() => {
        const el = document.getElementById("review-scatter-focus");
        if (!el) return;
        const anchor = window.innerHeight * 0.36;
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, (rect.top + rect.bottom) / 2 - anchor);
        window.dispatchEvent(new Event("scroll"));
      });
      // Jump spy binds only after scatter charts finish hydrating.
      await page.waitForFunction(
        () => document.querySelector('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-focus"]'),
        null,
        { timeout: 20_000 },
      );
      const activeFromScroll = await page.locator('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-focus"]').count();
      assert.equal(activeFromScroll, 1, "scrolling to focus scatter should highlight focus chip");
      await page.locator('[data-review-scatter-jump="review-scatter-habit"]').click();
      await page.waitForFunction(
        () => document.querySelector('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-habit"]'),
        null,
        { timeout: 15_000 },
      );
      const activeFromClick = await page.locator('.review-scatter-jump-chip.is-active[data-review-scatter-jump="review-scatter-habit"]').count();
      assert.equal(activeFromClick, 1, "clicking habit chip should mark it active");
      const spendBefore = (await page.locator(".review-ledger-stat-btn").first().textContent())?.trim();
      await page.locator('.rv-month-step[data-rv-month="-1"]').click();
      await page.waitForFunction(
        before => {
          const strong = document.querySelector(".review-ledger-stat-btn");
          if (!strong) return false;
          const layers = strong.querySelectorAll(".roll-old, .roll-new").length;
          if (strong.classList.contains("roll-host") && layers >= 2) return true;
          const next = strong.textContent?.trim();
          return !strong.classList.contains("roll-host") && Boolean(strong.dataset.rollValue) && Boolean(next && next !== before);
        },
        spendBefore,
        { timeout: 20_000 },
      );
      const rolling = await page.locator(".review-ledger-stat-btn.roll-host").count();
      const rollLayers = await page.locator(".review-ledger-stat-btn.roll-host .roll-old, .review-ledger-stat-btn.roll-host .roll-new").count();
      if (rolling >= 1) {
        assert.ok(rollLayers >= 2, "roll animation should expose outgoing and incoming layers");
      }
      await page.waitForFunction(
        before => {
          const strong = document.querySelector(".review-ledger-stat-btn");
          if (!strong || strong.classList.contains("roll-host")) return false;
          const text = strong.textContent?.trim();
          return Boolean(text && text !== before && strong.dataset.rollValue === text);
        },
        spendBefore,
        { timeout: 15_000 },
      );
      const spendAfter = (await page.locator(".review-ledger-stat-btn").first().textContent())?.trim();
      assert.notEqual(spendBefore, spendAfter, "previous month should show different spending total");
      const rollValue = await page.locator(".review-ledger-stat-btn").first().getAttribute("data-roll-value");
      assert.equal(rollValue, spendAfter, "rolled stat should persist data-roll-value after animation");

      const firstDot = page.locator("#reviewLedgerSummary .review-scatter-dot-hit[tabindex='0']").first();
      await firstDot.focus();
      await page.waitForSelector("#reviewLedgerSummary .review-scatter-tip:not([hidden])", { timeout: 15_000 });
      const tipVisible = await page.locator("#reviewLedgerSummary .review-scatter-tip strong").textContent();
      assert.ok(tipVisible && tipVisible.length > 4, "keyboard focus on scatter dot should show tip readout");
      await firstDot.press("ArrowRight");
      await page.waitForFunction(() => {
        const live = document.querySelector(".review-scatter-live")?.textContent?.trim() || "";
        return live.includes("—");
      }, null, { timeout: 15_000 });
      const live = (await page.locator(".review-scatter-live").textContent())?.trim();
      assert.ok(live && live.includes("—"), "arrow key between dots should update live region");
    } finally {
      await browser?.close();
      server.kill("SIGTERM");
    }
  },
);
