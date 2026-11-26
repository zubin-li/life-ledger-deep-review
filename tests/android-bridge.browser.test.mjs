// Every Android face -> shared core call is an executable contract, not just an export check.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { prepare } from "../scripts/android-prepare.mjs";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

// Tokens are replaced with real sample entities in the browser. Add a case whenever the face
// starts using a method; do not silently exempt mutators, dialogs or backup operations.
const calls = {
  getState: [], getLang: [], getTodayIso: [], getSelectedDate: [], getThemeChoice: [],
  getLedger: [], getBackupStats: [], getQuoteSettings: [], getReminderSettings: [],
  getFocusTopics: [], getFocusState: [], getHorizonData: [], getHabitsListData: ["$date"],
  hasUserData: [], isIsolatedDemoActive: [], activeHabitsForDate: ["$date"],
  getLog: ["$date"], displayHabitName: ["$habit"], getHabitIconKey: ["$habit"],
  getHabitIconPath: ["$habit"], getFocusDaySummary: ["$date"], getSpendDaySummary: ["$date"],
  getRhythm7Summary: ["$date"], getWeekData: ["$week"], getMonthReviewData: ["$month"],
  getMonthTimelineData: ["$month"], parseCustomQuotes: ["Contract quote — Fixture"],
  selectDate: ["$date"], setDayNote: ["$date", "Bridge fixture"], setMood: ["$date", "平静"],
  toggleHabitImmediate: ["$date", "$habitId"], setHabitActive: ["$habitId", true],
  setQuoteSettings: [{ mode: "auto", items: [] }], setReminderSettings: [{ enabled: false, time: "20:45" }],
  setThemeChoice: ["light"], setLanguage: ["zh"], setFocusTopics: [["Fixture"]],
  addWeeklyGoal: ["$week", "Bridge goal"], toggleWeeklyGoal: ["$week", "$goalId"],
  removeWeeklyGoal: ["$week", "$goalId"], restoreWeeklyGoal: ["$week", "$removedGoal", 0],
  setWeeklyOutput: ["$week", "Fixture output"], setMonthlyReview: ["$month", "Fixture review"],
  toggleHorizonStep: ["$horizonId", "$stepId"],
  addLedgerTransaction: [{ date: "$date", amountMinor: -321, currency: "EUR", note: "Bridge fixture", accountId: "$accountId", categoryId: "$categoryId", type: "expense" }],
  removeLedgerTransaction: ["$transactionId"], restoreLedgerTransaction: ["$removedTransaction", 0],
  startFocus: [{ label: "Fixture", durationMinutes: 25, breakMinutes: 5 }],
  pauseFocus: [], resumeFocus: [], extendFocus: [5], endFocus: [], startFocusBreak: [], skipFocusBreak: [],
  openAddHabit: [], openEditHabit: ["$habitId"], openFocus: [], openSpend: ["$date"],
  openBankImport: [], switchToView: ["today"], exportAndroidBackup: [{ format: "json", scope: "all" }],
  pickAndPreviewAndroidImport: ["$backupFile"], applyAndroidImport: ["$preview"],
  enterIsolatedDemo: [], exitIsolatedDemo: [], clearAllLocalData: [],
};

const source = await readFile(new URL("../public/android-face.js", import.meta.url), "utf8");
const methods = [...new Set([...source.matchAll(/\b(?:core\(\)|c|cc)\?\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))].sort();
test("Android bridge fixture table covers exactly every face method", () => {
  assert.deepEqual(Object.keys(calls).sort(), methods);
});

test("Android slim bridge, reminders, backups and lazy bank import work without desktop markup", { skip: !hasPlaywright, timeout: 120000 }, async () => {
  const dist = await mkdtemp(join(tmpdir(), "ll-android-bridge-"));
  await prepare(dist);
  const port = 5298;
  const url = `http://127.0.0.1:${port}/index.html`;
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: dist, stdio: "ignore" });
  let browser;
  try {
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: "zh-CN", reducedMotion: "reduce" });
    await context.addInitScript(() => {
      localStorage.setItem("life-ledger-android-onboarded-v1", "1");
      window.__rejections = [];
      window.addEventListener("unhandledrejection", e => window.__rejections.push(String(e.reason?.stack || e.reason)));
      window.__backupBlobs = [];
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = blob => { window.__backupBlobs.push(blob); return create(blob); };
      // Export still serializes real bytes; suppress only the OS download gesture.
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (!this.download) click.call(this); };
    });
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => requests.push(r.url()));
    for (let i = 0; i < 80; i++) {
      try { if ((await fetch(url)).ok) break; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    await page.goto(url);
    await page.waitForFunction(() => window.LifeLedgerAndroidCore && window.LifeLedgerAndroidFace);
    await page.evaluate(() => { window.LifeLedgerAndroidFace.dismissSplash(); window.LifeLedgerAndroidFace.enterDemo(); });
    await page.locator("#androidTodayRoot:not([hidden])").waitFor();
    assert.equal(requests.some(u => /android-bank\/|\/(?:money-ui|bank-import|ledger-ui)\.js|\/money\.css/.test(u)), false, "no import code/CSS on boot");

    await page.evaluate(() => window.LifeLedgerAndroidCore.switchToView("habits"));
    await page.locator("#androidHabitsReminderBtn").click();
    await page.locator("#androidRemToggle").waitFor();
    await page.evaluate(() => {
      window.LifeLedgerAndroidCore.setReminderSettings({ enabled: true, time: "19:47" });
      window.LifeLedgerAndroidFace.closeSheet();
    });
    await page.waitForFunction(() => document.querySelector("#androidHabitsReminderBtn")?.textContent.includes("19:47"));
    await page.evaluate(() => window.LifeLedgerAndroidCore.openAddHabit());
    assert.equal(await page.locator("#saveHabit").isDisabled(), true);
    await page.locator('#habitForm [name="name"]').fill("  ");
    assert.equal(await page.locator("#saveHabit").isDisabled(), true);
    await page.locator('#habitForm [name="name"]').fill("Fixture habit");
    assert.equal(await page.locator("#saveHabit").isEnabled(), true);
    await page.evaluate(() => document.querySelector("#habitDialog").close());

    await page.evaluate(() => window.LifeLedgerAndroidCore.switchToView("ledger"));
    await page.locator("#androidMoneyMoreBtn").click();
    await page.locator("#androidBankImportBtn").click();
    await page.locator("#moneyImportSheetRoot.money-open [data-import-file]").waitFor({ state: "attached" });
    assert.equal(await page.locator("#ledgerView .money-page, #ledgerView .ledger-page").count(), 0);
    const rect = await page.locator("#moneyImportSheetRoot .money-sheet").boundingBox();
    assert.equal(Math.round(rect.width), 412);
    assert.equal(Math.round(rect.height), 915);
    assert.equal(await page.evaluate(() => window.LifeLedgerAndroidFace.handleBack()), true);
    await page.waitForFunction(() => !window.LifeLedgerMoneyUI._ui.import);
    await page.evaluate(() => window.LifeLedgerAndroidCore.openBankImport());
    const today = await page.evaluate(() => window.LifeLedgerAndroidCore.getTodayIso());
    // Unified template = the format bank-import.js documents (header line ~421); bank-specific dialects are unit-tested.
    await page.locator("[data-import-file]").setInputFiles({ name: "bridge.csv", mimeType: "text/csv", buffer: Buffer.from(`date,amount,currency,payee,description,category,type,account\n${today},-12.34,EUR,Android CSV Fixture,,,,\n`) });
    await page.waitForFunction(() => window.LifeLedgerMoneyUI._ui.import.files.length === 1);
    await page.locator("[data-import-next]").click();
    if (await page.locator("[data-import-commit]").count() === 0) await page.locator("[data-import-next]").click();
    await page.locator("[data-import-commit]").click();
    await page.waitForFunction(() => window.LifeLedgerAndroidCore.getLedger().transactions.some(t => t.note?.includes("Android CSV Fixture")));
    await page.waitForFunction(() => document.querySelector("#androidMoneyRoot")?.textContent.includes("Android CSV Fixture"));

    // Each export is parsed and restored using the real Android bridge, not a fabricated candidate.
    await page.evaluate(async () => {
      const c = window.LifeLedgerAndroidCore;
      // Backups deliberately exclude the isolated demo; make the fixture the test profile first.
      const sample = structuredClone(c.getState());
      c.exitIsolatedDemo();
      Object.assign(c.getState(), sample);
      const expected = c.getLedger().transactions.length;
      // A small PCM WAV verifies that a media bundle actually restores media bytes.
      const wav = new Uint8Array(46);
      const view = new DataView(wav.buffer);
      for (const [offset, text] of [[0, "RIFF"], [8, "WAVEfmt "], [36, "data"]]) {
        [...text].forEach((ch, i) => { wav[offset + i] = ch.charCodeAt(0); });
      }
      view.setUint32(4, 38, true); view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); view.setUint16(22, 1, true);
      view.setUint32(24, 8000, true); view.setUint32(28, 16000, true);
      view.setUint16(32, 2, true); view.setUint16(34, 16, true); view.setUint32(40, 2, true);
      await window.LifeLedgerSplashMedia.saveAudio(new File([wav], "fixture.wav", { type: "audio/wav" }));
      for (const scope of ["all", "day", "month"]) {
        await c.exportAndroidBackup({ format: "json", scope });
        const b = JSON.parse(await window.__backupBlobs.at(-1).text());
        const selected = c.getSelectedDate();
        if (b.scope !== scope) throw new Error(`Wrong ${scope} backup scope`);
        if (scope === "day" && (b.range.start !== selected || b.range.end !== selected)) throw new Error("Wrong selected backup day");
        if (scope === "month" && b.range.start !== `${selected.slice(0, 7)}-01`) throw new Error("Wrong selected backup month");
      }
      for (const format of ["json", "llmedia"]) {
        await c.exportAndroidBackup({ format, scope: "all" });
        const blob = window.__backupBlobs.at(-1);
        if (!blob?.size) throw new Error(`Empty ${format} backup`);
        const file = new File([blob], `fixture.${format}`);
        const preview = await c.pickAndPreviewAndroidImport(file);
        c.getState().ledger.transactions = [];
        if (format === "llmedia") {
          if (preview.mediaCount < 1) throw new Error("No media in bundle");
          await window.LifeLedgerSplashMedia.clearAll();
        }
        const result = await c.applyAndroidImport(preview);
        if (!result.ok || c.getLedger().transactions.length !== expected) throw new Error(`${format} round trip lost transactions`);
        if (format === "llmedia") {
          const restored = await window.LifeLedgerSplashMedia.list();
          if (result.restoredMedia < 1 || !restored.some(item => new Uint8Array(item.bytes).every((b, i) => b === wav[i]) && item.bytes.byteLength === wav.length)) throw new Error("Media bytes did not round trip");
        }
        window.__bridgeBackupFile = file;
        window.__bridgePreview = preview;
      }
      c.enterIsolatedDemo();
    });

    // Invoke every real bridge method with sample entities; no optional-call masking.
    for (const [name, args] of Object.entries(calls)) {
      if (name === "clearAllLocalData") {
        // Wipes storage and reloads by design: assert the reload happens and the app comes back empty.
        await Promise.all([
          page.waitForEvent("load"),
          page.evaluate(() => window.LifeLedgerAndroidCore.clearAllLocalData()).catch(e => { if (!/context was destroyed|navigation/i.test(e.message)) throw e; }),
        ]);
        await page.waitForFunction(() => window.LifeLedgerAndroidCore?.hasUserData);
        await page.waitForTimeout(3200);
        assert.equal(await page.evaluate(() => window.LifeLedgerAndroidCore.hasUserData()), false);
        continue;
      }
      await page.evaluate(async ({ name, args }) => {
        const c = window.LifeLedgerAndroidCore;
        const state = c.getState();
        const date = c.getTodayIso();
        const week = c.getWeekData();
        const habit = state.habits[0];
        const ledger = c.getLedger();
        const goal = state.weeklyGoals?.[week.weekKey]?.[0] || { id: "fixture-goal", text: "Fixture", done: false };
        if (name === "toggleHorizonStep" && !state.longTermGoals?.some(g => g.steps?.length)) {
          state.longTermGoals = [{ id: "fixture-horizon", name: "Fixture horizon", steps: [{ id: "fixture-step", text: "Fixture step", done: false }] }];
        }
        const horizon = state.longTermGoals?.find(g => g.steps?.length);
        const tokens = {
          $date: date, $month: date.slice(0, 7), $week: week.weekKey,
          $habit: habit, $habitId: habit.id, $goalId: goal.id, $removedGoal: window.__removedGoal || goal,
          $horizonId: horizon?.id, $stepId: horizon?.steps?.[0]?.id,
          $accountId: ledger.accounts[0]?.id, $categoryId: ledger.categories[0]?.id,
          $transactionId: ledger.transactions[0]?.id, $removedTransaction: window.__removedTransaction || ledger.transactions[0],
          $backupFile: window.__bridgeBackupFile, $preview: window.__bridgePreview,
        };
        const resolve = value => typeof value === "string" && value in tokens ? tokens[value]
          : Array.isArray(value) ? value.map(resolve)
            : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)])) : value;
        if (typeof c[name] !== "function") throw new Error(`Missing bridge ${name}`);
        try {
          const result = await c[name](...args.map(resolve));
          if (name === "removeWeeklyGoal") window.__removedGoal = result?.removed;
          if (name === "removeLedgerTransaction") window.__removedTransaction = result?.removed;
        }
        catch (e) { throw new Error(`${name}: ${e.stack || e}`); }
        document.querySelectorAll("dialog[open]").forEach(d => d.close());
        window.LifeLedgerAndroidFace.closeFocus();
        window.LifeLedgerAndroidFace.closeSheet();
        if (window.LifeLedgerMoneyUI?._ui.import) window.LifeLedgerMoneyUI.closeImport();
      }, { name, args });
    }
    // A rendered label/link/ARIA target must never point at stripped desktop markup.
    const desktopHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
    const preparedHtml = await readFile(join(dist, "index.html"), "utf8");
    const ids = html => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
    const retained = ids(preparedHtml);
    const stripped = [...ids(desktopHtml)].filter(id => !retained.has(id));
    assert.deepEqual(await page.evaluate(stripped => {
      const absent = new Set(stripped);
      return [...document.querySelectorAll('[id^="android"] [for], [id^="android"] [aria-controls], [id^="android"] [aria-labelledby], [id^="android"] [aria-describedby], [id^="android"] [href^="#"]')]
        .flatMap(el => ["for", "aria-controls", "aria-labelledby", "aria-describedby", "href"].flatMap(attr => (el.getAttribute(attr) || "").replace(/^#/, "").split(/\s+/).filter(id => absent.has(id))));
    }, stripped), []);
    await page.waitForTimeout(300);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.__rejections), []);
  } finally {
    await browser?.close();
    server.kill();
    await rm(dist, { recursive: true, force: true });
  }
});
