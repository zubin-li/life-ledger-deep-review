import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "docs/phase-3-5-1");
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
      bar.style.bottom = "20px";
      bar.style.left = "50%";
      bar.style.transform = "translateX(-50%)";
      bar.style.zIndex = "9999999";
      bar.style.background = "rgba(36, 37, 34, 0.94)";
      bar.style.color = "#faf9f6";
      bar.style.padding = "9px 22px";
      bar.style.borderRadius = "99px";
      bar.style.font = "600 13px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
      bar.style.letterSpacing = "0.01em";
      bar.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.28)";
      bar.style.border = "1px solid rgba(255, 255, 255, 0.16)";
      bar.style.pointerEvents = "none";
      bar.style.transition = "opacity 160ms ease";
      document.body.appendChild(bar);
    }
    bar.textContent = captionText;
  }, text);
}

async function setMotionViaSettings(context, serverUrl, mainPage, motionLevel) {
  const settingsPage = await context.newPage();
  await settingsPage.goto(`${serverUrl}/index.html?settings=1&desktop=tauri-local`);
  await settingsPage.waitForLoadState("domcontentloaded");
  const motionSelect = settingsPage.locator("#motionSelect");
  await motionSelect.selectOption(motionLevel);
  await motionSelect.dispatchEvent("change");
  await mainPage.waitForTimeout(100);
  await settingsPage.close();
}

async function runVideo() {
  console.log("Starting static server for interaction video recording...");
  const server = await startStaticServer(publicDir);
  console.log(`Server running at ${server.url}`);

  const browser = await chromium.launch({ headless: true, slowMo: 60 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
  await page.goto(`${server.url}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const capturedFrames = [];

  // Step 1: Complete a habit with Space via keyboard -> Completed group -> Undo toast -> back to Open
  await setCaption(page, "Step 1: Complete habit via keyboard Space → Completed group → Toast Undo");
  const firstHabitCheck = page.locator(".today-habit-check").first();
  await firstHabitCheck.focus();
  await page.waitForTimeout(600);
  await page.keyboard.press("Space");
  await page.waitForTimeout(1000);
  capturedFrames.push({ title: "Step 1: Habit Completed", bytes: await page.screenshot() });

  const toastAction = page.locator("#toastAction");
  if (await toastAction.isVisible()) {
    await page.waitForTimeout(800); // keep toast Undo visible
    await toastAction.click();
    await page.waitForTimeout(1500); // hold 1.5s on restored row
  }

  // Step 2: Motion = Full: complete a habit (motion visible)
  await setCaption(page, "Step 2: Motion = Full: complete habit → toast Undo → hold 1.5s on restored row");
  await setMotionViaSettings(context, server.url, page, "full");
  await firstHabitCheck.click();
  await page.waitForTimeout(1200);
  capturedFrames.push({ title: "Step 2: Motion Full", bytes: await page.screenshot() });
  const toastAction2 = page.locator("#toastAction");
  if (await toastAction2.isVisible()) {
    await page.waitForTimeout(800); // keep toast Undo visible
    await toastAction2.click();
    await page.waitForTimeout(1500); // hold 1.5s on restored row
  }
  await page.waitForTimeout(300);

  // Step 3: Motion = Reduced: same action (opacity only)
  await setCaption(page, "Step 3: Motion = Reduced: same action → toast Undo → hold 1.5s on restored row");
  await setMotionViaSettings(context, server.url, page, "reduced");
  await firstHabitCheck.click();
  await page.waitForTimeout(1200);
  capturedFrames.push({ title: "Step 3: Motion Reduced", bytes: await page.screenshot() });
  const toastAction3 = page.locator("#toastAction");
  if (await toastAction3.isVisible()) {
    await page.waitForTimeout(800); // keep toast Undo visible
    await toastAction3.click();
    await page.waitForTimeout(1500); // hold 1.5s on restored row
  }
  await page.waitForTimeout(300);

  // Step 4: Motion = Off: same action (instant)
  await setCaption(page, "Step 4: Motion = Off: same action (instant) → toast Undo → hold 1.5s on restored row");
  await setMotionViaSettings(context, server.url, page, "off");
  await firstHabitCheck.click();
  await page.waitForTimeout(1000);
  capturedFrames.push({ title: "Step 4: Motion Off", bytes: await page.screenshot() });
  const toastAction4 = page.locator("#toastAction");
  if (await toastAction4.isVisible()) {
    await page.waitForTimeout(800); // keep toast Undo visible
    await toastAction4.click();
    await page.waitForTimeout(1500); // hold 1.5s on restored row
  }
  await page.waitForTimeout(300);

  // Step 5: back to Full; ⌘F search -> type -> no-results illustration -> Escape
  await setCaption(page, "Step 5: Motion = Full; ⌘F search → type filter → no-results illustration → Escape");
  await setMotionViaSettings(context, server.url, page, "full");
  await page.keyboard.press("Meta+f");
  await page.waitForTimeout(600);
  const searchInput = page.locator("#quickFind");
  await searchInput.fill("zenith nonexistent");
  await page.waitForTimeout(1400);
  capturedFrames.push({ title: "Step 5: Search No Results", bytes: await page.screenshot() });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  // Step 6: "+" popover with keyboard
  await setCaption(page, "Step 6: '+' create popover with keyboard navigation");
  const createBtn = page.locator("#toolbarCreateButton");
  await createBtn.click();
  await page.waitForTimeout(800);
  capturedFrames.push({ title: "Step 6: '+' Popover", bytes: await page.screenshot() });
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Step 7: Focus: start -> pause -> resume -> finish -> completion illustration visible >= 2s -> Undo
  await setCaption(page, "Step 7: Focus: start → pause → resume → finish → completion illustration (≥2s with panel open) → Undo");
  const focusChip = page.locator("#toolbarPrimaryAction");
  await focusChip.click();
  await page.waitForTimeout(800);
  const focusPrimary = page.locator("#focusQuickPrimary");
  await focusPrimary.click(); // Start
  await page.waitForTimeout(1200);
  await focusPrimary.click(); // Pause
  await page.waitForTimeout(800);
  await focusPrimary.click(); // Resume
  await page.waitForTimeout(800);
  const focusFinish = page.locator("#focusQuickFinish");
  await focusFinish.click(); // Finish
  await page.waitForTimeout(2500); // Completion illustration visible >= 2s with panel open
  capturedFrames.push({ title: "Step 7: Focus Complete Illustration", bytes: await page.screenshot() });

  const focusToastUndo = page.locator("#toastAction");
  if (await focusToastUndo.isVisible()) {
    await focusToastUndo.click(); // Undo
    await page.waitForTimeout(1200);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Step 8: Journal Timeline <-> Photos
  await setCaption(page, "Step 8: Journal Timeline ↔ Photos mode switch");
  const journalNav = page.locator(".sidebar .nav-item[data-view='timeline']");
  await journalNav.click();
  await page.waitForTimeout(1000);
  const photosTab = page.locator("[data-journal-mode='photos']");
  await photosTab.click();
  await page.waitForTimeout(1200);
  capturedFrames.push({ title: "Step 8: Journal Photos", bytes: await page.screenshot() });
  const timelineTab = page.locator("[data-journal-mode='timeline']");
  await timelineTab.click();
  await page.waitForTimeout(1000);

  // Step 9: Tab through the toolbar showing focus rings
  await setCaption(page, "Step 9: Tab through toolbar controls showing visible focus rings");
  await page.locator(".sidebar .nav-item[data-view='today']").click();
  await page.waitForTimeout(600);
  const toolbarBtn = page.locator("#dateNavPrev");
  await toolbarBtn.focus();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
  }
  capturedFrames.push({ title: "Step 9: Toolbar Focus Rings", bytes: await page.screenshot() });
  await page.waitForTimeout(1000);

  await setCaption(page, "Interaction sequence completed.");
  await page.waitForTimeout(1000);

  // Close context to finish video encoding
  await page.close();
  await context.close();
  await browser.close();
  await server.close();

  // Find recorded video and move to output
  const files = fs.readdirSync(videoDir);
  const videoFile = files.find(f => f.endsWith(".webm"));
  const targetVideo = path.join(outputDir, "interaction.webm");
  if (videoFile) {
    fs.copyFileSync(path.join(videoDir, videoFile), targetVideo);
    const stat = fs.statSync(targetVideo);
    console.log(`Saved video to ${targetVideo} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Compose frame contact sheet
  console.log("Composing video-frames.png contact sheet...");
  const composerBrowser = await chromium.launch({ headless: true });
  const composerPage = await composerBrowser.newPage({ viewport: { width: 1800, height: 1200 } });

  const framesHtml = `<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; padding: 24px; background: #181916; color: #f4f2ed; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }
    h1 { margin: 0 0 16px; font-size: 22px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { background: #242522; border-radius: 10px; overflow: hidden; border: 1px solid #363733; }
    .caption { padding: 8px 12px; font-weight: 600; font-size: 12px; background: #2f302c; color: #a2a49c; }
    img { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Life Ledger 3.5.1 Interaction Sequence (Key Frames)</h1>
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
