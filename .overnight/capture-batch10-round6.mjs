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

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), fullPage: false });
}

async function runTodayOnboard(label, launcher, viewport) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript((lang) => {
    localStorage.setItem("life-ledger-language", lang);
    localStorage.removeItem("life-ledger-today-cards-onboarding-dismissed");
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
  }, label.startsWith("de") ? "de" : "zh");
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.click('.nav-item[data-view="today"]');
  await page.waitForSelector("#tcOnboardHint:not([hidden])", { timeout: 20000 });
  await page.locator("#tcOnboardHint").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const theme = label.includes("dark") ? "dark" : "light";
  if (theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await shot(
    page,
    `b10r6-today-onboard-${label}-${theme}-${viewport.width}-${label.includes("webkit") ? "webkit" : "chromium"}.png`,
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
    await runTodayOnboard(label, launcher, { width: 1440, height: 900 });
    await runTodayOnboard(`${label}-mobile`, launcher, { width: 390, height: 844 });
  }
  console.log("capture batch10 round6 done");
} finally {
  server.kill("SIGTERM");
}
