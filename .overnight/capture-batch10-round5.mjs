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

async function clearWeekAndReview(page) {
  await page.evaluate(() => {
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
    state.weeklyGoals = {};
    state.weeklyOutputs = {};
    state.reviews = {};
    state.habits = [];
    if (state.meta?.demo) state.meta.demo.active = false;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), fullPage: false });
}

async function runWeekEmpty(label, launcher, viewport) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript((lang) => {
    localStorage.setItem("life-ledger-language", lang);
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  }, label.startsWith("de") ? "de" : "zh");
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await clearWeekAndReview(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click('.nav-item[data-view="week"]');
  await page.waitForSelector("#weekEmptyAddFirstGoal", { timeout: 20000 });
  await page.locator("#weekEmptyAddFirstGoal").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const theme = label.includes("dark") ? "dark" : "light";
  if (theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await shot(
    page,
    `b10r5-week-empty-${label}-${theme}-${viewport.width}-${label.includes("webkit") ? "webkit" : "chromium"}.png`,
  );
  await browser.close();
}

async function runReviewEmpty(label, launcher, viewport) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript((lang) => {
    localStorage.setItem("life-ledger-language", lang);
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  }, label.startsWith("de") ? "de" : "zh");
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await clearWeekAndReview(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click('.nav-item[data-view="review"]');
  await page.waitForSelector("#reviewReflectionEmptyWrite", { timeout: 20000 });
  await page.locator("#reviewReflectionEmptyWrite").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const theme = label.includes("dark") ? "dark" : "light";
  if (theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await shot(
    page,
    `b10r5-review-empty-${label}-${theme}-${viewport.width}-${label.includes("webkit") ? "webkit" : "chromium"}.png`,
  );
  await browser.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(base);
  for (const [label, launcher] of [
    ["zh-chromium", chromium],
    ["zh-webkit", webkit],
    ["de-chromium", chromium],
  ]) {
    await runWeekEmpty(label, launcher, { width: 1440, height: 900 });
    await runWeekEmpty(`${label}-mobile`, launcher, { width: 390, height: 844 });
  }
  for (const [label, launcher] of [
    ["zh-light-chromium", chromium],
    ["zh-dark-chromium", chromium],
  ]) {
    await runReviewEmpty(label, launcher, { width: 1440, height: 900 });
  }
  console.log("capture batch10 round5 done");
} finally {
  server.kill("SIGTERM");
}
