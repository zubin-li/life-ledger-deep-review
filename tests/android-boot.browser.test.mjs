// Android build must boot without a single uncaught error, show the real today, open the sample,
// and roll "today" forward when the app is resumed on a later day (phone left in background).
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { prepare } from "../scripts/android-prepare.mjs";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const port = 5297;
const url = `http://127.0.0.1:${port}/index.html`;

async function waitForHttp(u) {
  for (let i = 0; i < 80; i += 1) {
    try { if ((await fetch(u)).status < 500) return; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("static server did not start");
}

test("Android build boots clean, shows real today, opens sample, rolls today on resume", { skip: !hasPlaywright, timeout: 120000 }, async () => {
  const dist = await mkdtemp(join(tmpdir(), "ll-android-boot-"));
  await prepare(dist);
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: dist, stdio: "ignore" });
  const { chromium } = await import(join(playwrightRoot, "index.mjs"));
  const browser = await chromium.launch();
  try {
    await waitForHttp(url);
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: "zh-CN", timezoneId: "Europe/Berlin" });
    await ctx.clock.install({ time: new Date("2026-11-16T09:00:00+01:00") });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => window.LifeLedgerAndroidFace?.isActive?.());
    await ctx.clock.runFor(5000);
    assert.deepEqual(errors, [], "boot must not throw");
    assert.equal(await page.evaluate(() => window.LifeLedgerAndroidCore.getTodayIso()), "2026-11-16");

    // Sample from the welcome screen renders real content (no empty "quiet day" card) and throws nothing.
    await page.evaluate(() => window.LifeLedgerAndroidFace.enterDemo());
    await ctx.clock.runFor(3000);
    assert.deepEqual(errors, [], "entering the sample must not throw");
    assert.equal(await page.evaluate(() => window.LifeLedgerAndroidCore.isIsolatedDemoActive()), true);
    await page.evaluate(() => window.LifeLedgerAndroidCore.exitIsolatedDemo());
    await ctx.clock.runFor(2000);

    // Phone left in background for 10 days, then brought back.
    await ctx.clock.fastForward(10 * 24 * 3600 * 1000);
    await page.evaluate(() => { document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new Event("focus")); });
    await ctx.clock.runFor(2000);
    assert.equal(await page.evaluate(() => window.LifeLedgerAndroidCore.getSelectedDate()), "2026-11-26", "resume on a later day must land on the new today");
    // Empty profile hides #androidTodayRoot; the top bar always shows the date.
    assert.match(await page.locator(".a-topbar").first().innerText(), /26/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.kill();
  }
});
