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
const port = 5293;
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
  await context.addInitScript(
    ({ lang, stale }) => {
      localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
      if (stale) {
        const key = "life-ledger-preview-demo-showcase-v1";
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const state = JSON.parse(raw);
            if (state.meta?.demo?.active) {
              delete state.meta.demo.insightAlign;
              Object.keys(state.logs || {}).forEach(date => {
                if (state.logs[date]) state.logs[date].mood = "平静";
              });
              localStorage.setItem(key, JSON.stringify(state));
            }
          } catch {
            /* ignore */
          }
        }
      }
    },
    { lang: opts.lang, stale: opts.stale },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  return context;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(base.split("?")[0]);

    const cr = await chromium.launch({ headless: true });
    const deskCtx = await prepContext(cr, { lang: "zh", stale: true });
    const deskPage = await deskCtx.newPage();
    await deskPage.goto(base, { waitUntil: "domcontentloaded" });
    await deskPage.waitForSelector("#todayMoodSpendHint:not([hidden])", { timeout: 15000 });
    await deskPage.waitForTimeout(400);
    await deskPage.locator("#todayView .today-hero, #todayView").first().screenshot({
      path: join(outDir, "b11r3-today-mood-hint-stale-realigned-zh-light-1440-chromium.png"),
    });
    await deskCtx.close();
    await cr.close();

    const wk = await webkit.launch({ headless: true });
    const mobCtx = await prepContext(wk, {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const mobPage = await mobCtx.newPage();
    await mobPage.goto(base, { waitUntil: "domcontentloaded" });
    await mobPage.waitForSelector("#todayHabitSpendHint:not([hidden])", { timeout: 15000 });
    await mobPage.waitForTimeout(350);
    await mobPage.locator("#todayHabitSpendHint").screenshot({
      path: join(outDir, "b11r3-today-habit-hint-chip-de-dark-390-webkit.png"),
    });
    await mobCtx.close();
    await wk.close();

    console.log("capture batch11 round3 done");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
