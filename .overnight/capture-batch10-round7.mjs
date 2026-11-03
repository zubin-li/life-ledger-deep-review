import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5296;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error(`HTTP server did not respond at ${url}`);
}

async function seedScatterEmpty(page, lang) {
  await page.evaluate(l => {
    localStorage.setItem("life-ledger-language", l);
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state = JSON.parse(localStorage.getItem(key));
    const L = window.LifeLedgerLedger;
    const today = new Date().toISOString().slice(0, 10);
    state.meta = { ...(state.meta || {}), demo: { active: false } };
    state.habits = [];
    state.focusSessions = [];
    state.logs = {};
    let ledger = L.normalize({}, { lang: l });
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
    const account = ledger.accounts.find(a => !a.archived);
    ledger.transactions.push({
      id: "capture-scatter-empty",
      accountId: account.id,
      categoryId: expenseCat.id,
      amountMinor: -1899,
      currency: "EUR",
      date: today,
      note: "Capture",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  }, lang);
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), fullPage: false });
}

async function runScatterEmpty(label, launcher, viewport, lang, theme) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await seedScatterEmpty(page, lang);
  await page.reload({ waitUntil: "domcontentloaded" });
  if (theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector("#reviewScatterEmptyHint", { timeout: 20000 });
  await page.locator("#reviewScatterEmptyHint").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const engine = label.includes("webkit") ? "webkit" : "chromium";
  await shot(
    page,
    `b10r7-review-scatter-empty-${lang}-${theme}-${viewport.width}-${engine}.png`,
  );
  await browser.close();
}

async function runTodayEditSaved(label, launcher, viewport) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    localStorage.setItem("life-ledger-language", "zh");
    localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.click('.nav-item[data-view="today"]');
  await page.waitForSelector("#tcEditToggle");
  await page.locator("#tcEditToggle").click();
  await page.waitForSelector("#todayView.tc-editing");
  await page.locator(".tc-bar .tc-done").click();
  await page.waitForFunction(() => document.getElementById("tcEditToggle")?.classList.contains("tc-edit-saved-flash"));
  await page.waitForTimeout(120);
  const engine = label.includes("webkit") ? "webkit" : "chromium";
  await shot(page, `b10r7-today-edit-saved-zh-light-${viewport.width}-${engine}.png`);
  await browser.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(base);
  for (const [lang, theme] of [
    ["zh", "light"],
    ["de", "light"],
    ["zh", "dark"],
  ]) {
    await runScatterEmpty(`zh-chromium-${lang}`, chromium, { width: 1440, height: 900 }, lang, theme);
    if (lang === "zh" && theme === "light") {
      await runScatterEmpty("zh-webkit", webkit, { width: 390, height: 844 }, lang, theme);
    }
  }
  await runTodayEditSaved("zh-chromium", chromium, { width: 1440, height: 900 });
  console.log("capture batch10 round7 done");
} finally {
  server.kill("SIGTERM");
}
