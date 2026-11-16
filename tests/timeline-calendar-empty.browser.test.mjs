import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5284;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

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

function clearJournalState(page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find(
      k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1") || k.startsWith("life-ledger-preview-"),
    );
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    state.logs = {};
    state.weeklyOutputs = {};
    state.reviews = {};
    if (state.meta?.demo) state.meta.demo.active = false;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

test(
  "Timeline calendar mode empty month shows write-today CTA",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await clearJournalState(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => Object.keys(localStorage).some(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1")),
        null,
        { timeout: 15000 },
      );
      await page.click('.nav-item[data-view="timeline"]');
      await page.waitForSelector("#timelineView.view.active", { timeout: 8000 });
      await page.locator('[data-journal-mode="calendar"]').click();
      await page.waitForSelector("#journalCalendarEmptyArt #timelineCalendarEmptyWriteToday", { timeout: 25000 });
      await page.locator("#journalCalendarEmptyArt #timelineCalendarEmptyWriteToday").click();
      await page.waitForSelector("#todayView.active", { timeout: 8000 });
      await page.waitForSelector("#dayNote", { timeout: 8000 });
      assert.equal(await page.locator("#journalToolPanel:not([hidden])").count(), 1);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Timeline sidebar filter miss shows quiet search art",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await clearJournalState(page);
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key) return;
        const state = JSON.parse(localStorage.getItem(key));
        const today = new Date().toISOString().slice(0, 10);
        state.logs[today] = { note: "Note only", completed: [], mood: null };
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => Object.keys(localStorage).some(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1")),
        null,
        { timeout: 15000 },
      );
      await page.click('.nav-item[data-view="timeline"]');
      await page.waitForSelector("#timelineView.view.active", { timeout: 8000 });
      await page.locator('[data-journal-mode="calendar"]').click();
      await page.waitForSelector("#timelineView[data-journal-layout=\"calendar\"]", { timeout: 15000 });
      await page.evaluate(() => {
        const list = document.getElementById("timelineEntryList");
        const filter = document.getElementById("timelineFilter");
        if (list) list.style.display = "grid";
        if (filter) filter.style.display = "flex";
      });
      await page.locator('[data-timeline-filter="photos"]').click({ force: true });
      await page.waitForSelector("#timelineEntryList .timeline-filter-quiet.ll-polished", { timeout: 20000 });
      assert.match(await page.locator(".timeline-filter-quiet strong").innerText(), /Nothing matches/i);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
