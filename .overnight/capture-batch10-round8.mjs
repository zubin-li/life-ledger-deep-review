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
const port = 5296;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

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

async function seedCalendarEmpty(page, lang) {
  await page.evaluate(l => {
    localStorage.setItem("life-ledger-language", l);
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state = JSON.parse(localStorage.getItem(key));
    state.logs = {};
    state.meta = { ...(state.meta || {}), demo: { active: false } };
    localStorage.setItem(key, JSON.stringify(state));
  }, lang);
}

async function runCalendarEmpty(label, launcher, viewport, lang, theme, mac) {
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: mac ? 2 : 1,
  });
  if (mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await seedCalendarEmpty(page, lang);
  await page.reload({ waitUntil: "domcontentloaded" });
  if (theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await page.click('.nav-item[data-view="timeline"]');
  await page.locator('[data-journal-mode="calendar"]').click();
  await page.waitForSelector("#journalCalendarEmptyArt #timelineCalendarEmptyWriteToday", { timeout: 20000 });
  await page.locator("#journalCalendarEmptyArt").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const engine = label.includes("webkit") ? "webkit" : "chromium";
  const macTag = mac ? "-mac" : "";
  await shot(
    page,
    `b10r8-timeline-calendar-empty-${lang}-${theme}-${viewport.width}${macTag}-${engine}.png`,
  );
  await browser.close();
}

async function runLedgerMac(label, launcher, viewport, lang) {
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
  });
  await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  const page = await context.newPage();
  await page.addInitScript(l => {
    localStorage.setItem("life-ledger-language", l);
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
  }, lang);
  await page.goto(`${base}&local-preview=demo-showcase-v1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#ledgerView") || document.querySelector('.nav-item[data-view="ledger"]'),
    null,
    { timeout: 15000 },
  );
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector("#ledgerView.view.active", { timeout: 15000 });
  await page.waitForSelector("#ledgerQuickForm", { timeout: 15000 });
  await page.waitForTimeout(400);
  const engine = label.includes("webkit") ? "webkit" : "chromium";
  await shot(page, `b10r8-ledger-mac-shell-${lang}-light-${viewport.width}-${engine}.png`);
  await browser.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(base);
  await runCalendarEmpty("zh-chromium", chromium, { width: 1440, height: 900 }, "zh", "light", false);
  await runCalendarEmpty("zh-webkit", webkit, { width: 390, height: 844 }, "zh", "light", false);
  await runCalendarEmpty("de-chromium", chromium, { width: 1440, height: 900 }, "de", "dark", false);
  await runCalendarEmpty("zh-mac", chromium, { width: 1440, height: 950 }, "zh", "light", true);
  await runLedgerMac("zh-mac-ledger", chromium, { width: 1440, height: 950 }, "zh");
  console.log("capture batch10 round8 done");
} finally {
  server.kill("SIGTERM");
}
