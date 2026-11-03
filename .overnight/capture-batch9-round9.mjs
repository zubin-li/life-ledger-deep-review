import { webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
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
const port = 5298;
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

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(demoBase.split("?")[0]);
    const browser = await webkit.launch({ headless: true });
    for (const [lang, langKey] of [
      ["zh", "zh"],
      ["de", "de"],
    ]) {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: 2,
          colorScheme: theme,
        });
        await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
        await context.addInitScript(
          ({ l }) => {
            localStorage.setItem("life-ledger-language", l);
            localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
            localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
          },
          { l: langKey },
        );
        if (theme === "dark") {
          await context.addInitScript(() => {
            document.documentElement.dataset.theme = "dark";
          });
        }
        const page = await context.newPage();
        await page.goto(demoBase, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#todayHabitSpendHint:not([hidden])", { timeout: 15000 });
        await page.waitForSelector("#todayMoodSpendHint:not([hidden])", { timeout: 15000 });
        await page.locator(".mood-card").scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await page.locator(".mood-card").screenshot({
          path: join(outDir, `b9r9-mac-today-mood-hint-${lang}-${theme}-1440-webkit.png`),
        });
        await page.locator("#todayHabitSpendHint").scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await page.locator(".habits-heading").screenshot({
          path: join(outDir, `b9r9-mac-today-habit-hint-${lang}-${theme}-1440-webkit.png`),
        });
        await page.screenshot({
          path: join(outDir, `b9r9-mac-today-insights-${lang}-${theme}-1440-webkit.png`),
          fullPage: false,
        });
        await context.close();
      }
    }
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
