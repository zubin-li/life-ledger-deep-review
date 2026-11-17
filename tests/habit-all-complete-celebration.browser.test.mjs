import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5291;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

function startStaticServer() {
  const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  return proc;
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

// Habit commits are deferred while the check animation runs. A fixed sleep
// clicks again before state is saved and drops earlier checks on a slow runner.
async function waitForHabitSettled(page, habitId) {
  await page.waitForFunction(id => {
    const card = document.querySelector(`#todayHabits .habit-card[data-id="${CSS.escape(id)}"]`);
    const inflight = document.querySelector("#todayHabits .habit-card.just-checked, #todayHabits .habit-card.just-unchecked");
    return Boolean(card?.classList.contains("completed")) && !inflight;
  }, habitId, { timeout: 20_000 });
}

test(
  "Completing all scored habits shows celebration and orbit pulse",
  { skip: !hasPlaywright },
  async () => {
    const server = startStaticServer();
    let browser;
    try {
      await waitForHttp(base);
      const { webkit } = await import(join(playwrightRoot, "index.mjs"));
      browser = await webkit.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector("#todayHabits .habit-card", { timeout: 30_000 });
      const openHabits = () => page.locator("#todayHabits .habit-card:not(.completed):not(.future-locked)");
      // A fully checked demo day would skip the loop and never fire the celebration.
      if ((await openHabits().count()) === 0) {
        await page.locator("#todayHabits .habit-card.completed:not(.future-locked)").first().click();
        await page.waitForFunction(() => {
          const open = document.querySelector("#todayHabits .habit-card:not(.completed):not(.future-locked)");
          const inflight = document.querySelector("#todayHabits .habit-card.just-checked, #todayHabits .habit-card.just-unchecked");
          return Boolean(open) && !inflight;
        }, null, { timeout: 20_000 });
      }
      for (let i = 0; i < 24; i += 1) {
        const remaining = openHabits();
        const left = await remaining.count();
        if (left === 0) break;
        const habitId = await remaining.first().getAttribute("data-id");
        await remaining.first().click();
        // The celebration class only stays up for a short pulse. Settle every
        // earlier check, then assert as soon as the last scored habit is clicked.
        if (left === 1) break;
        await waitForHabitSettled(page, habitId);
      }
      await page.waitForFunction(
        () =>
          document.querySelector("#celebration.show")
          && document.querySelector("#progressOrbit.is-all-complete-orbit")
          && document.querySelector('[data-card="habits"].is-all-complete'),
        null,
        { timeout: 20_000 },
      );
      const flags = await page.evaluate(() => ({
        celebration: document.querySelector("#celebration")?.classList.contains("show"),
        orbit: document.querySelector("#progressOrbit")?.classList.contains("is-all-complete-orbit"),
        card: document.querySelector('[data-card="habits"]')?.classList.contains("is-all-complete"),
      }));
      assert.equal(flags.celebration, true);
      assert.equal(flags.orbit, true);
      assert.equal(flags.card, true);
    } finally {
      await browser?.close();
      server.kill("SIGTERM");
    }
  },
);
