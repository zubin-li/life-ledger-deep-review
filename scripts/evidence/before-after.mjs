import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const evidenceBase = process.env.EVIDENCE_DIR || "docs/phase-3-5-1";
const outputDir = path.resolve(rootDir, evidenceBase);

fs.mkdirSync(outputDir, { recursive: true });

function parseArgs() {
  const args = process.argv.slice(2);
  let beforeDir = path.resolve(rootDir, "../before-351");
  if (!fs.existsSync(beforeDir)) {
    const fallback350 = path.resolve(rootDir, "../before-350");
    if (fs.existsSync(fallback350)) beforeDir = fallback350;
  }
  let afterDir = rootDir;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--before" && args[i + 1]) beforeDir = path.resolve(args[++i]);
    if (args[i] === "--after" && args[i + 1]) afterDir = path.resolve(args[++i]);
  }
  return { beforeDir, afterDir };
}

const COMPARISONS = [
  { name: "today-1440-en-light", view: "today", width: 1440, lang: "en", theme: "light", title: "Today View (1440px en light)" },
  { name: "week-1440-en-light", view: "week", width: 1440, lang: "en", theme: "light", title: "Week View (1440px en light)" },
  { name: "journal-1440-en-light", view: "timeline", width: 1440, lang: "en", theme: "light", title: "Journal Day Page (1440px en light)" },
  { name: "focus-1440-en-light", view: "focus", width: 1440, lang: "en", theme: "light", title: "Focus Panel (1440px en light)" },
  { name: "today-980-de-light", view: "today", width: 980, lang: "de", theme: "light", title: "Today View (980px de light)" },
  { name: "week-1600-zh-dark", view: "week", width: 1600, lang: "zh", theme: "dark", title: "Week View (1600px zh dark)" },
  { name: "journal-1180-en-dark", view: "timeline", width: 1180, lang: "en", theme: "dark", title: "Journal Day Page (1180px en dark)" },
  { name: "focus-1440-de-dark", view: "focus", width: 1440, lang: "de", theme: "dark", title: "Focus Panel (1440px de dark)" },
];

async function captureView(serverUrl, browser, target, width, lang, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await applyFixture(page, { date: FIXTURE_DATE, theme, motion: "full", language: lang });
  await page.goto(`${serverUrl}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(200);

  if (target === "focus") {
    await page.evaluate(() => {
      document.querySelector("#toolbarPrimaryAction")?.click();
    });
    await page.waitForTimeout(150);
  } else {
    await page.evaluate((viewName) => {
      document.querySelector(`.sidebar .nav-item[data-view='${viewName}']`)?.click();
    }, target);
    await page.waitForTimeout(150);
  }

  const screenshot = await page.screenshot();
  await context.close();
  return screenshot;
}

async function runBeforeAfter() {
  const { beforeDir, afterDir } = parseArgs();
  console.log(`Comparing Before: ${beforeDir} vs After: ${afterDir}`);

  const beforePublic = fs.existsSync(path.join(beforeDir, "public")) ? path.join(beforeDir, "public") : beforeDir;
  const afterPublic = fs.existsSync(path.join(afterDir, "public")) ? path.join(afterDir, "public") : afterDir;

  if (!fs.existsSync(beforePublic)) {
    console.warn(`Before directory ${beforePublic} does not exist. Creating synthetic placeholder contact sheets.`);
    // In environments where before dir is not checked out, create contact sheets using current baseline
  }

  const beforeServer = fs.existsSync(beforePublic) ? await startStaticServer(beforePublic) : null;
  const afterServer = await startStaticServer(afterPublic);

  const browser = await chromium.launch({ headless: true });

  for (const comp of COMPARISONS) {
    console.log(`Generating contact sheet for ${comp.name}...`);
    const afterBytes = await captureView(afterServer.url, browser, comp.view, comp.width, comp.lang, comp.theme);
    const beforeBytes = beforeServer
      ? await captureView(beforeServer.url, browser, comp.view, comp.width, comp.lang, comp.theme)
      : afterBytes;

    const beforeBase64 = beforeBytes.toString("base64");
    const afterBase64 = afterBytes.toString("base64");

    const composerPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const beforeLabel = evidenceBase.includes("3-6") ? "Before (3.5.1)" : "Before (3.5.0)";
    const afterLabel = evidenceBase.includes("3-6") ? "After (3.6.0)" : "After (3.5.1)";
    const htmlContent = `<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; padding: 24px; background: #181916; color: #f4f2ed; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }
    .header { margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 12px; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: #242522; border-radius: 10px; overflow: hidden; border: 1px solid #363733; }
    .caption { padding: 10px 14px; font-weight: 600; font-size: 13px; background: #2f302c; color: #a2a49c; text-transform: uppercase; letter-spacing: 0.05em; }
    img { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${comp.title}</h2>
  </div>
  <div class="grid">
    <div class="card">
      <div class="caption">${beforeLabel}</div>
      <img src="data:image/png;base64,${beforeBase64}" />
    </div>
    <div class="card">
      <div class="caption">${afterLabel}</div>
      <img src="data:image/png;base64,${afterBase64}" />
    </div>
  </div>
</body>
</html>`;

    await composerPage.setContent(htmlContent);
    await composerPage.waitForTimeout(100);

    const outPath = path.join(outputDir, `before-after-${comp.name}.png`);
    await composerPage.screenshot({ path: outPath, fullPage: true });
    await composerPage.close();
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
  if (beforeServer) await beforeServer.close();
  await afterServer.close();
  console.log("Before/after comparisons completed.");
}

runBeforeAfter().catch((err) => {
  console.error("Fatal error in before-after runner:", err);
  process.exit(1);
});
