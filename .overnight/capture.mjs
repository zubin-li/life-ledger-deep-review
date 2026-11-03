/**
 * Parametrised headless screenshots for owner feedback / release checks.
 * Usage: node .overnight/capture.mjs [--port 5294] [--prefix fb-r1] [--only ledger,today]
 */
import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");

const args = process.argv.slice(2);
const portIdx = args.indexOf("--port");
const prefixIdx = args.indexOf("--prefix");
const onlyIdx = args.indexOf("--only");
const port = Number(portIdx >= 0 ? args[portIdx + 1] : 5294);
const prefix = prefixIdx >= 0 ? args[prefixIdx + 1] : "fb";
const onlyRaw = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const only = onlyRaw ? new Set(onlyRaw.split(",")) : null;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

const SHOTS = [
  { id: "today", view: "today", lang: "zh", theme: "light", w: 1440, h: 900, browser: "chromium" },
  { id: "today", view: "today", lang: "de", theme: "dark", w: 390, h: 844, browser: "webkit" },
  { id: "week", view: "week", lang: "zh", theme: "light", w: 1440, h: 900, browser: "webkit" },
  { id: "longrange", view: "longrange", lang: "en", theme: "light", w: 1440, h: 900, browser: "chromium" },
  { id: "timeline", view: "timeline", lang: "zh", theme: "light", w: 1440, h: 900, browser: "chromium" },
  { id: "ledger", view: "ledger", lang: "zh", theme: "light", w: 1440, h: 900, browser: "chromium" },
  { id: "ledger", view: "ledger", lang: "de", theme: "dark", w: 390, h: 844, browser: "webkit" },
  { id: "review", view: "review", lang: "zh", theme: "light", w: 390, h: 844, browser: "chromium" },
  { id: "habits", view: "habits", lang: "de", theme: "light", w: 1440, h: 900, browser: "chromium" },
];

async function gotoView(page, view) {
  const sel = `.nav-item[data-view="${view}"]`;
  await page.click(sel);
  await page.waitForSelector(`#${view}View.active`);
  if (view === "ledger") await page.waitForSelector(".ledger-day-nav");
  else if (view === "today") await page.waitForSelector(".tc-grid");
  else if (view === "longrange") await page.waitForSelector("#longrangeView.active");
  else if (view === "timeline") await page.waitForSelector("#journalFeedPane");
  await page.waitForTimeout(200);
}

async function shot(browserType, spec) {
  const context = await browserType.newContext({
    viewport: { width: spec.w, height: spec.h },
    colorScheme: spec.theme === "dark" ? "dark" : "light",
  });
  await context.addInitScript(l => localStorage.setItem("life-ledger-language", l), spec.lang);
  await context.addInitScript(() => {
    localStorage.removeItem("life-ledger-nav-order");
  });
  if (spec.theme === "dark") {
    await context.addInitScript(() => { document.documentElement.dataset.theme = "dark"; });
  }
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await gotoView(page, spec.view);
  const name = `${prefix}-${spec.view}-${spec.lang}-${spec.theme}-${spec.w}-${spec.browser}.png`;
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await context.close();
  return name;
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});
await new Promise(r => setTimeout(r, 500));

const browsers = { chromium, webkit };
const names = [];
try {
  for (const spec of SHOTS) {
    if (only && !only.has(spec.id)) continue;
    const bt = browsers[spec.browser];
    const browser = await bt.launch({ headless: true });
    names.push(await shot(browser, spec));
    await browser.close();
  }
  console.log("Wrote:", names.join("\n"));
} finally {
  server.kill("SIGTERM");
}
