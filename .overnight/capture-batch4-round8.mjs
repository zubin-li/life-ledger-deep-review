import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
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
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");
const PREVIEW_KEY = "life-ledger-preview-demo-showcase-v1";

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

function macInitScript() {
  return ({ js, css }) => {
    window.__TAURI__ = {
      core: { invoke: async () => null },
      event: { listen: async () => () => {} },
      window: {
        getCurrentWindow: () => ({
          show: async () => {},
          isFullscreen: async () => false,
        }),
      },
      app: { getVersion: async () => "3.1.0" },
    };
    new Function(js)();
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.append(s);
    });
  };
}

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || opts.mac ? 2 : 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  if (opts.mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
  await context.addInitScript(
    ({ lang, previewKey, clearLongTerm }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      localStorage.removeItem("life-ledger-review-metrics-opened");
      if (lang) localStorage.setItem("life-ledger-language", lang);
      if (clearLongTerm) {
        try {
          const raw = localStorage.getItem(previewKey);
          if (raw) {
            const data = JSON.parse(raw);
            data.longTermGoals = [];
            localStorage.setItem(previewKey, JSON.stringify(data));
          }
        } catch {
          /* demo may hydrate after first paint */
        }
      }
    },
    { lang: opts.lang, previewKey: PREVIEW_KEY, clearLongTerm: opts.view === "long-empty" },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  const page = await context.newPage();
  await page.goto(demoBase, { waitUntil: "networkidle" });
  await page.waitForSelector(".tc-grid", { timeout: 20000 });

  if (opts.view === "week-done") {
    await page.click('.nav-item[data-view="week"]');
    await page.waitForSelector("#weeklyGoalList .weekly-goal", { timeout: 15000 });
    for (let i = 0; i < 12; i += 1) {
      const remaining = await page.locator("#weeklyGoalList .weekly-goal:not(.done)").count();
      if (remaining === 0) break;
      await page.locator("#weeklyGoalList .weekly-goal:not(.done) .weekly-goal-check").first().click();
    }
    await page.waitForSelector("#weeklyGoalList .ll-week-all-done", { timeout: 12000 });
    await page.waitForTimeout(450);
    const clip = opts.mac ? page.locator("#weekView") : page.locator("#weeklyGoalsPane");
    await clip.screenshot({ path: join(outDir, name) });
  } else if (opts.view === "long-empty") {
    await page.evaluate(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.longTermGoals = [];
      localStorage.setItem(key, JSON.stringify(data));
    }, PREVIEW_KEY);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".tc-grid", { timeout: 20000 });
    await page.click('.nav-item[data-view="week"]');
    await page.evaluate(() => {
      document.getElementById("weeklyGoalsPane").hidden = true;
      document.getElementById("longTermGoalsPane").hidden = false;
    });
    await page.waitForTimeout(800);
    await page.locator("#longTermGoalsPane").screenshot({ path: join(outDir, name) });
  }

  await context.close();
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await waitForServer(`http://127.0.0.1:${port}/index.html`);

try {
  for (const [browserType, tag] of [[chromium, "chromium"], [webkit, "webkit"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b4r8-week-all-done-de-dark-390-${tag}.png`, {
      lang: "de",
      theme: "dark",
      viewport: { width: 390, height: 844 },
      view: "week-done",
    });
    await shot(browser, `b4r8-week-all-done-mac-de-light-1440-${tag}.png`, {
      lang: "de",
      viewport: { width: 1440, height: 950 },
      view: "week-done",
      mac: true,
    });
    await shot(browser, `b4r8-long-term-empty-de-dark-390-${tag}.png`, {
      lang: "de",
      theme: "dark",
      viewport: { width: 390, height: 844 },
      view: "long-empty",
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch4 round8 captures done");
