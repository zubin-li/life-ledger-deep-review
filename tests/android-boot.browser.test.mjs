// Android build must boot without a single uncaught error, show the real today, open the sample,
// and roll "today" forward when the app is resumed on a later day (phone left in background).
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
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

test("Android launch follows phone language, splash precedes welcome, screens are accessible, and today resumes", { skip: !hasPlaywright, timeout: 120000 }, async () => {
  const dist = await mkdtemp(join(tmpdir(), "ll-android-boot-"));
  await prepare(dist);
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: dist, stdio: "ignore" });
  const { chromium } = await import(join(playwrightRoot, "index.mjs"));
  let browser;
  try {
    browser = await chromium.launch();
    await waitForHttp(url);
    // A slow core must be covered by the same launch surface, before onboarding exists.
    const slowCtx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: "zh-CN" });
    let releaseCore;
    let coreRequested;
    const coreBlocked = new Promise(resolve => { releaseCore = resolve; });
    const coreRequest = new Promise(resolve => { coreRequested = resolve; });
    let slowNavigation;
    try {
      await slowCtx.clock.install({ time: new Date("2026-11-16T09:00:00+01:00") });
      await slowCtx.route("**/app.js?*", async route => {
        coreRequested();
        await coreBlocked;
        await route.continue();
      });
      const slowPage = await slowCtx.newPage();
      const slowErrors = [];
      slowPage.on("pageerror", error => slowErrors.push(error.message));
      slowNavigation = slowPage.goto(url);
      await coreRequest;
      await slowCtx.clock.runFor(500);
      // app.js is requested by the preload scanner before android-face.js has run, so wait for the paint.
      await slowPage.locator("#androidSplashOverlay").waitFor({ state: "visible", timeout: 10000 });
      assert.equal(await slowPage.evaluate(() => Boolean(window.LifeLedgerAndroidCore)), false);
      assert.equal(await slowPage.locator("#androidWelcome button").count(), 0);
      releaseCore();
      await slowNavigation;
      await slowCtx.clock.runFor(3200); // 2.5 s quote + exit fade, well under the 3 s+fade ceiling
      assert.equal(await slowPage.locator("#androidSplashOverlay").isVisible(), false);
      assert.equal(await slowPage.locator("#androidWelcome").isVisible(), true);
      assert.deepEqual(slowErrors, []);
    } finally {
      releaseCore();
      await slowNavigation?.catch(() => {});
      await slowCtx.close();
    }
    // Locale is supplied by the phone, not a URL or a preseeded language choice.
    for (const scenario of [
      { locale: "zh-CN", language: "zh", hint: "轻触任意处进入", next: "继续", start: "开始使用" },
      { locale: "de-DE", language: "de", hint: "Zum Öffnen tippen", next: "Weiter", start: "Jetzt starten", tap: true, reducedMotion: "reduce" },
      { locale: "zh-CN", language: "en", stored: "en", hint: "Tap anywhere to enter", next: "Continue", start: "Start using" },
    ]) {
      const localeCtx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true,
        locale: scenario.locale, reducedMotion: scenario.reducedMotion || "no-preference", timezoneId: "Europe/Berlin" });
      try {
        await localeCtx.clock.install({ time: new Date("2026-11-16T09:00:00+01:00") });
        if (scenario.stored) await localeCtx.addInitScript(() => {
          localStorage.setItem("life-ledger-language", "en");
          localStorage.setItem("life-ledger-language-preference-set", "true");
        });
        // A stalled optional media database must not postpone the built-in splash.
        await localeCtx.addInitScript(() => {
          const open = indexedDB.open.bind(indexedDB);
          indexedDB.open = (...args) => String(args[0]).includes("splash") ? {} : open(...args);
        });
        const localePage = await localeCtx.newPage();
        const localeErrors = [];
        localePage.on("pageerror", e => localeErrors.push(e.message));
        await localePage.goto(url);
        await localeCtx.clock.runFor(100);
        assert.equal(await localePage.evaluate(() => window.LifeLedgerAndroidCore.getLang()), scenario.language);
        assert.equal(await localePage.locator("#androidSplashOverlay").isVisible(), true);
        assert.equal(await localePage.locator(".a-sp-tap-hint").innerText(), scenario.hint);
        const quote = await localePage.locator(".a-sp-quote-main").innerText();
        if (scenario.language === "zh") assert.match(quote, /千里之行/);
        if (scenario.language === "de") assert.match(quote, /Es ist nicht genug/);
        if (scenario.language === "en") assert.match(quote, /Write it on your heart/);
        assert.equal(await localePage.locator("#androidWelcome").isVisible(), false);
        assert.equal(await localePage.locator("#androidWelcome button").count(), 0, "welcome must not render underneath the splash");
        assert.equal(await localePage.locator(".app-shell").evaluate(el => el.inert), true);
        if (scenario.tap) await localePage.locator("#androidSplashOverlay").dispatchEvent("click");
        else {
          await localeCtx.clock.runFor(2300);
          assert.equal(await localePage.locator("#androidSplashOverlay").isVisible(), true);
        }
        await localeCtx.clock.runFor(scenario.tap ? 100 : 600);
        assert.equal(await localePage.locator("#androidSplashOverlay").isVisible(), false, "launch splash must finish within 3 seconds");
        assert.equal(await localePage.locator("#androidWelcome").isVisible(), true);
        assert.match(await localePage.locator('#androidWelcome [data-w-action="next"]').innerText(), new RegExp(scenario.next));
        await assertAccessibleControls(localePage);
        await localePage.locator('#androidWelcome [data-w-action="next"]').dispatchEvent("click");
        assert.match(await localePage.locator('#androidWelcome [data-w-action="start"]').last().innerText(), new RegExp(scenario.start));
        await assertAccessibleControls(localePage);
        await localePage.locator('#androidWelcome [data-w-action="start"]').last().dispatchEvent("click");
        await localeCtx.clock.runFor(100);
        await assertAccessibleControls(localePage);
        if (scenario.language === "zh") {
          // The actual Settings picker must persist an override across a cold reload.
          await localePage.evaluate(() => window.LifeLedgerAndroidFace.openSettings());
          await localePage.locator("#androidSetLangBtn").dispatchEvent("click");
          await localePage.locator('[data-pick-lang="en"]').dispatchEvent("click");
          await localeCtx.clock.runFor(100);
          assert.equal(await localePage.evaluate(() => localStorage.getItem("life-ledger-language-preference-set")), "true");
          await localePage.reload();
          await localeCtx.clock.runFor(100);
          assert.equal(await localePage.evaluate(() => window.LifeLedgerAndroidCore.getLang()), "en");
          assert.match(await localePage.locator(".a-topbar").innerText(), /Today/);
        }
        assert.deepEqual(localeErrors, [], `${scenario.locale}: launch must have zero page errors`);
      } finally {
        await localeCtx.close();
      }
    }
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
    await page.locator('#androidWelcome [data-w-action="next"]').dispatchEvent("click");
    await page.locator('#androidWelcome [data-w-action="sample"]').dispatchEvent("click");
    await ctx.clock.runFor(3000);
    assert.deepEqual(errors, [], "entering the sample must not throw");
    assert.equal(await page.evaluate(() => window.LifeLedgerAndroidCore.isIsolatedDemoActive()), true);
    // Check every primary screen and each modal family using the real Android shell.
    for (const view of ["today", "ledger", "timeline", "week", "review", "longrange", "habits"]) {
      await page.evaluate(view => window.LifeLedgerAndroidCore.switchToView(view), view);
      await ctx.clock.runFor(150);
      await assertAccessibleControls(page);
    }
    await page.evaluate(() => window.LifeLedgerAndroidCore.switchToView("today"));
    await ctx.clock.runFor(100);
    for (const [open, close] of [["openFocus", "closeFocus"], ["openSettings", "closeSettings"], ["openSplashSettings", "closeSplashSettings"], ["openCardLibrary", "closeSheet"], ["openSheet", "closeSheet"]]) {
      await page.evaluate(open => window.LifeLedgerAndroidFace[open](), open);
      await ctx.clock.runFor(100);
      await assertAccessibleControls(page);
      await page.evaluate(close => window.LifeLedgerAndroidFace[close](), close);
      await ctx.clock.runFor(350);
      assert.equal(await page.locator("#androidSheetBackdrop").evaluate(el => el.inert), true);
    }
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
    await browser?.close();
    server.kill();
    await rm(dist, { recursive: true, force: true });
  }
});

async function assertAccessibleControls(page) {
  const failures = await page.evaluate(() => [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [tabindex="0"], [role="button"]')]
    .filter(el => !el.disabled && el.getClientRects().length && !el.closest('[hidden], [inert]'))
    .flatMap(el => {
      const rect = el.getBoundingClientRect();
      const label = el.id || el.className || el.tagName;
      return [
        ...(el.closest('[aria-hidden="true"]') ? [`${label}: focusable inside aria-hidden`] : []),
        ...(rect.width < 48 || rect.height < 48 ? [`${label}: ${rect.width} × ${rect.height} touch target`] : []),
      ];
    }));
  assert.deepEqual(failures, []);
}
