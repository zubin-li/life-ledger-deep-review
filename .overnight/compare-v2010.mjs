/**
 * Pixel-compare HEAD vs v2.0.10 worktree for pages that existed in 2.0.10 (no ledger).
 * Usage: node .overnight/compare-v2010.mjs [--port 5293]
 */
import { chromium } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const basePublic = join(here, "base", "public");
const headPublic = join(repoRoot, "public");
const outDir = join(here, "shots");
const reportPath = join(here, "diff-v2010.json");

const portIdx = process.argv.indexOf("--port");
const port = Number(portIdx >= 0 ? process.argv[portIdx + 1] : 5293);

if (!existsSync(basePublic)) {
  console.error("Missing .overnight/base worktree — run: git worktree add .overnight/base v2.0.10");
  process.exit(1);
}

const VIEWS = [
  { view: "today", lang: "zh", theme: "light", w: 1440, h: 900 },
  { view: "today", lang: "de", theme: "dark", w: 390, h: 844 },
  { view: "week", lang: "zh", theme: "light", w: 1440, h: 900 },
  { view: "longrange", lang: "en", theme: "light", w: 1440, h: 900 },
  { view: "timeline", lang: "zh", theme: "light", w: 1440, h: 900 },
  { view: "review", lang: "zh", theme: "light", w: 390, h: 844 },
  { view: "habits", lang: "de", theme: "light", w: 1440, h: 900 },
];

function startServer(cwd) {
  return spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd,
    stdio: "ignore",
  });
}

async function gotoView(page, view) {
  const sel = `.nav-item[data-view="${view}"]`;
  await page.click(sel);
  await page.waitForSelector(`#${view}View.active`);
  if (view === "today") await page.waitForSelector(".tc-grid");
  else if (view === "longrange") await page.waitForSelector("#longrangeView.active");
  else if (view === "timeline") await page.waitForSelector("#journalFeedPane");
  await page.waitForTimeout(200);
}

async function captureSet(publicDir, prefix) {
  const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
  const names = [];
  const browser = await chromium.launch({ headless: true });
  for (const spec of VIEWS) {
    const context = await browser.newContext({
      viewport: { width: spec.w, height: spec.h },
      colorScheme: spec.theme === "dark" ? "dark" : "light",
    });
    await context.addInitScript(l => localStorage.setItem("life-ledger-language", l), spec.lang);
    await context.addInitScript(() => localStorage.removeItem("life-ledger-nav-order"));
    if (spec.theme === "dark") {
      await context.addInitScript(() => { document.documentElement.dataset.theme = "dark"; });
    }
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await gotoView(page, spec.view);
    const name = `${prefix}-${spec.view}-${spec.lang}-${spec.theme}-${spec.w}.png`;
    await page.screenshot({ path: join(outDir, name), fullPage: false });
    names.push(name);
    await context.close();
  }
  await browser.close();
  return names;
}

async function diffPng(pathA, pathB) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const a = (await readFile(pathA)).toString("base64");
  const b = (await readFile(pathB)).toString("base64");
  const result = await page.evaluate(async ({ a64, b64 }) => {
    const load = data64 => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:image/png;base64,${data64}`;
    });
    const imgA = await load(a64);
    const imgB = await load(b64);
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
      return { ok: false, reason: "size-mismatch", wA: imgA.width, hA: imgA.height, wB: imgB.width, hB: imgB.height };
    }
    const canvas = document.createElement("canvas");
    canvas.width = imgA.width;
    canvas.height = imgA.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgA, 0, 0);
    const da = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgB, 0, 0);
    const db = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let diff = 0;
    const total = canvas.width * canvas.height;
    for (let i = 0; i < da.data.length; i += 4) {
      if (da.data[i] !== db.data[i] || da.data[i + 1] !== db.data[i + 1] || da.data[i + 2] !== db.data[i + 2] || da.data[i + 3] !== db.data[i + 3]) {
        diff += 1;
      }
    }
    return { ok: true, diffPixels: diff, totalPixels: total, ratio: diff / total };
  }, { a64: a, b64: b });
  await browser.close();
  return result;
}

await mkdir(outDir, { recursive: true });

const serverBase = startServer(basePublic);
await new Promise(r => setTimeout(r, 500));
let baseNames = [];
try {
  baseNames = await captureSet(basePublic, "base-r3");
} finally {
  serverBase.kill("SIGTERM");
}

await new Promise(r => setTimeout(r, 400));
const serverHead = startServer(headPublic);
await new Promise(r => setTimeout(r, 500));
let headNames = [];
try {
  headNames = await captureSet(headPublic, "head-r3");
} finally {
  serverHead.kill("SIGTERM");
}

const rows = [];
for (const spec of VIEWS) {
  const stem = `${spec.view}-${spec.lang}-${spec.theme}-${spec.w}`;
  const baseFile = join(outDir, `base-r3-${stem}.png`);
  const headFile = join(outDir, `head-r3-${stem}.png`);
  const diff = await diffPng(baseFile, headFile);
  rows.push({
    view: spec.view,
    lang: spec.lang,
    theme: spec.theme,
    width: spec.w,
    baseShot: `base-r3-${stem}.png`,
    headShot: `head-r3-${stem}.png`,
    ...diff,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  baseTag: "v2.0.10",
  head: "overnight-2.1",
  note: "Expected diffs: new Today spending card, nav order (ledger), 2.1 polish — not necessarily regressions.",
  rows,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("Wrote", reportPath);
for (const row of rows) {
  if (!row.ok) console.log("SIZE", row.view, row.reason);
  else console.log(`${row.view} ${row.lang} ${row.theme} ${row.width}: ${(row.ratio * 100).toFixed(2)}% pixels differ`);
}
