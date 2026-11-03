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
const port = 5297;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

async function prepContext(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(({ lang, theme }) => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    if (lang) localStorage.setItem("life-ledger-language", lang);
    if (theme) document.documentElement.dataset.theme = theme;
  }, { lang: opts.lang, theme: opts.theme });
  return context;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  await waitForServer(`http://127.0.0.1:${port}/`);

  const shots = [
    { name: "b13r4-habit-check-zh-light-1440-webkit", browser: webkit, lang: "zh", theme: "light", habitPulse: true },
    { name: "b13r4-week-goal-de-dark-390-chromium", browser: chromium, lang: "de", theme: "dark", viewport: { width: 390, height: 844 }, mobile: true, weekGoal: true },
  ];

  try {
    for (const spec of shots) {
      const browser = await spec.browser.launch({ headless: true });
      const context = await prepContext(browser, spec);
      const page = await context.newPage();
      await page.goto(base, { waitUntil: "networkidle" });
      if (spec.habitPulse) {
        const card = page.locator("#todayHabits .habit-card:not(.completed)").first();
        await card.click();
        await page.waitForTimeout(180);
      }
      if (spec.weekGoal) {
        await page.locator('.nav-item[data-view="week"]').click();
        await page.waitForSelector("#weekView.active");
        const check = page.locator(".weekly-goal:not(.done) .weekly-goal-check").first();
        if (await check.count() === 0) {
          await page.locator("#weeklyGoalInput").fill("Wochenziel Test");
          await page.keyboard.press("Enter");
        }
        await page.locator(".weekly-goal:not(.done) .weekly-goal-check").first().click();
        await page.waitForTimeout(160);
      }
      await page.waitForTimeout(280);
      await page.screenshot({ path: join(outDir, `${spec.name}.png`), fullPage: true });
      await context.close();
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
