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
const port = 5295;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
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
    deviceScaleFactor: opts.mac ? 2 : opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  if (opts.mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
    },
    { lang: opts.lang },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  const page = await context.newPage();
  await page.goto(demoBase, { waitUntil: "networkidle" });
  await page.waitForSelector(".hero-card, .tc-grid", { timeout: 20000 });

  if (opts.scene === "focus") {
    await page.locator(".daily-tool-card").scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      document.querySelector('[data-daily-tool="focus"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(450);
    await page.evaluate(() => document.getElementById("focusQuickPrimary")?.click());
    await page.waitForTimeout(350);
  }

  if (opts.scene === "journal") {
    await page.click('.nav-item[data-view="timeline"]');
    await page.waitForSelector("#timelineView.active", { timeout: 15000 });
    await page.waitForTimeout(500);
  }

  if (opts.mac) {
    await page.screenshot({ path: join(outDir, name), fullPage: false });
  } else {
    const target =
      opts.scene === "journal" ? page.locator("#timelineView") : page.locator("#todayView");
    await target.screenshot({
      path: join(outDir, name),
      fullPage: Boolean(opts.fullPage),
    });
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
  const cases = [
    { lang: "zh", theme: "light", viewport: { width: 1440, height: 900 }, scene: "today", mac: true },
    { lang: "de", theme: "dark", viewport: { width: 390, height: 844 }, scene: "focus" },
    { lang: "en", theme: "light", viewport: { width: 1440, height: 900 }, scene: "journal" },
  ];
  for (const [browserType, tag] of [
    [chromium, "chromium"],
    [webkit, "webkit"],
  ]) {
    const browser = await browserType.launch({ headless: true });
    for (const c of cases) {
      const scene = c.scene || "today";
      const slug = `b5r2-${scene}-${c.lang}-${c.theme}-${c.viewport.width}${c.mac ? "-mac" : ""}`;
      await shot(browser, `${slug}-${tag}.png`, { ...c, fullPage: !c.mac });
    }
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
