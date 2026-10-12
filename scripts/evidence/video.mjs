import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicDir = path.join(rootDir, "public");
const evidenceBase = process.env.EVIDENCE_DIR || "docs/phase-3-5-1";
const outputDir = path.resolve(rootDir, evidenceBase);
const videoDir = path.join(outputDir, "raw-video");

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

async function setCaption(page, text) {
  await page.evaluate((captionText) => {
    let bar = document.getElementById("evidenceCaptionBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "evidenceCaptionBar";
      bar.style.position = "fixed";
      bar.style.top = "12px";
      bar.style.left = "12px";
      bar.style.bottom = "auto";
      bar.style.transform = "none";
      bar.style.maxWidth = "46vw";
      bar.style.zIndex = "9999999";
      bar.style.background = "rgba(36, 37, 34, 0.94)";
      bar.style.color = "#faf9f6";
      bar.style.padding = "8px 16px";
      bar.style.borderRadius = "10px";
      bar.style.font = "600 12px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      bar.style.letterSpacing = "0.01em";
      bar.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.28)";
      bar.style.border = "1px solid rgba(255, 255, 255, 0.16)";
      bar.style.pointerEvents = "none";
      bar.style.lineHeight = "1.35";
      bar.style.transition = "opacity 160ms ease";
      document.body.appendChild(bar);
    }
    bar.textContent = captionText;
  }, text);
}

async function runInteractionSequence(view, motion, browser, server, capturedFrames) {
  console.log(`Recording interaction video for ${view} (${motion})...`);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  page.on("dialog", dialog => dialog.accept());

  // Set initial fixture
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion, language: "en" });

  // Set motion on real Settings page
  const settingsPage = await context.newPage();
  await settingsPage.goto(`${server.url}/index.html?settings=1&desktop=tauri-local`);
  await settingsPage.waitForLoadState("domcontentloaded");
  await settingsPage.waitForTimeout(300);
  const motionSelect = settingsPage.locator("#motionSelect");
  await motionSelect.selectOption(motion);
  await motionSelect.dispatchEvent("change");
  await settingsPage.waitForTimeout(300);
  capturedFrames.push({
    title: `${view.toUpperCase()} · Settings: Motion ${motion}`,
    bytes: await settingsPage.screenshot(),
  });
  await settingsPage.close();

  // Load app on main page
  await page.bringToFront();
  await page.goto(`${server.url}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400);

  if (view === "week") {
    await page.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
    });
    await page.waitForTimeout(300);
  }

  // 1. Complete habit -> Undo toast -> click Undo -> restored
  await setCaption(page, `${view.toUpperCase()} (${motion}): Complete habit → Visible Undo toast → Restored`);
  const habitCheck = view === "today"
    ? page.locator(".today-habit-check").first()
    : page.locator(".week-habit-check").first();
  await habitCheck.focus();
  await page.waitForTimeout(300);
  await habitCheck.click();

  const toast = page.locator("#toast");
  await toast.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(800);
  capturedFrames.push({
    title: `${view.toUpperCase()} (${motion}) · Habit completed (Undo toast)`,
    bytes: await page.screenshot(),
  });

  const toastAction = page.locator("#toastAction");
  if (await toastAction.isVisible()) {
    await toastAction.click();
    await page.waitForTimeout(600);
    capturedFrames.push({
      title: `${view.toUpperCase()} (${motion}) · Restored via Undo`,
      bytes: await page.screenshot(),
    });
  }

  // 2. Collapse + expand a module
  await setCaption(page, `${view.toUpperCase()} (${motion}): Collapse + expand module`);
  const boardSelector = `[data-module-board='${view}']`;
  const board = page.locator(boardSelector);
  const collapseToggle = board.locator(".module-collapse-toggle").first();
  if (await collapseToggle.isVisible()) {
    await collapseToggle.click();
    await page.waitForTimeout(400);
    capturedFrames.push({
      title: `${view.toUpperCase()} (${motion}) · Module collapsed`,
      bytes: await page.screenshot(),
    });
    await collapseToggle.click();
    await page.waitForTimeout(400);
    capturedFrames.push({
      title: `${view.toUpperCase()} (${motion}) · Module expanded`,
      bytes: await page.screenshot(),
    });
  }

  // 3. Edit layout -> move a module (keyboard Alt+ArrowDown on its handle) -> Done
  await setCaption(page, `${view.toUpperCase()} (${motion}): Edit layout → Alt+ArrowDown move → Done`);
  const editToggle = page.locator("#editLayoutToggle");
  await editToggle.click();
  await page.waitForTimeout(400);
  capturedFrames.push({
    title: `${view.toUpperCase()} (${motion}) · Edit layout active`,
    bytes: await page.screenshot(),
  });

  const dragHandle = board.locator(".module-drag-handle").first();
  if (await dragHandle.isVisible()) {
    await dragHandle.focus();
    await page.waitForTimeout(200);
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);
    capturedFrames.push({
      title: `${view.toUpperCase()} (${motion}) · Reordered via keyboard Alt+ArrowDown`,
      bytes: await page.screenshot(),
    });
  }

  await editToggle.click();
  await page.waitForTimeout(400);
  capturedFrames.push({
    title: `${view.toUpperCase()} (${motion}) · Layout editing Done`,
    bytes: await page.screenshot(),
  });

  // 4. Reload -> order persisted
  await setCaption(page, `${view.toUpperCase()} (${motion}): Reload → Order persisted`);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
  if (view === "week") {
    await page.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
    });
    await page.waitForTimeout(300);
  }
  capturedFrames.push({
    title: `${view.toUpperCase()} (${motion}) · Order persisted after reload`,
    bytes: await page.screenshot(),
  });

  // 5. Edit layout -> Reset layout
  await setCaption(page, `${view.toUpperCase()} (${motion}): Edit layout → Reset layout`);
  await editToggle.click();
  await page.waitForTimeout(400);
  const resetBtn = page.locator("#resetLayoutButton");
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(500);
    capturedFrames.push({
      title: `${view.toUpperCase()} (${motion}) · Reset layout executed`,
      bytes: await page.screenshot(),
    });
  }
  await editToggle.click();
  await page.waitForTimeout(400);

  await setCaption(page, `${view.toUpperCase()} (${motion}): Sequence complete`);
  await page.waitForTimeout(600);

  const videoPath = await page.video()?.path();
  await page.close();
  await context.close();

  const motionFile = path.join(outputDir, `${view}-${motion}.webm`);
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, motionFile);
    console.log(`Saved ${motionFile} (${(fs.statSync(motionFile).size / 1024 / 1024).toFixed(2)} MB)`);
    if (motion === "full") {
      const interactionFile = path.join(outputDir, `${view}-interaction.webm`);
      fs.copyFileSync(motionFile, interactionFile);
      console.log(`Copied ${interactionFile}`);
      if (view === "today") {
        fs.copyFileSync(motionFile, path.join(outputDir, "interaction.webm"));
      }
    }
  }
}

async function runVideo() {
  console.log("Starting static server for interaction video recording...");
  const server = await startStaticServer(publicDir);
  console.log(`Server running at ${server.url}`);

  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const capturedFrames = [];

  const views = ["today", "week"];
  const motions = ["full", "reduced", "off"];

  for (const view of views) {
    for (const motion of motions) {
      await runInteractionSequence(view, motion, browser, server, capturedFrames);
    }
  }

  await browser.close();
  await server.close();

  // Compose frame contact sheet
  console.log("Composing video-frames.png contact sheet...");
  const composerBrowser = await chromium.launch({ headless: true });
  const composerPage = await composerBrowser.newPage({ viewport: { width: 1800, height: 1200 } });

  const titleVersion = evidenceBase.includes("3-6") ? "3.6.0" : "3.5.1";
  const framesHtml = `<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; padding: 24px; background: #0a0a0b; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }
    h1 { margin: 0 0 16px; font-size: 22px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { background: #141416; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); }
    .caption { padding: 8px 12px; font-weight: 600; font-size: 12px; background: #1c1c1f; color: #a1a1a8; }
    img { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Life Ledger ${titleVersion} Modular Native Interaction Sequence (Key Frames)</h1>
  <div class="grid">
    ${capturedFrames.map(f => `
      <div class="card">
        <div class="caption">${f.title}</div>
        <img src="data:image/png;base64,${f.bytes.toString("base64")}" />
      </div>
    `).join("")}
  </div>
</body>
</html>`;

  await composerPage.setContent(framesHtml);
  await composerPage.waitForTimeout(100);
  const framesOut = path.join(outputDir, "video-frames.png");
  await composerPage.screenshot({ path: framesOut, fullPage: true });
  await composerBrowser.close();
  console.log(`Saved frame contact sheet to ${framesOut}`);
}

runVideo().catch((err) => {
  console.error("Fatal error in video runner:", err);
  process.exit(1);
});
