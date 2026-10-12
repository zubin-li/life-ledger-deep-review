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

  // Step 1: Complete habit with keyboard Space -> focus ring visible -> Toast with Undo -> Restored after Undo
  await setCaption(page, "Step 1: Keyboard Space → Focus ring → Toast with Undo → Restored");
  const firstHabitCheck = page.locator(".today-habit-check").first();
  await firstHabitCheck.focus();
  await page.waitForTimeout(600);
  capturedFrames.push({ title: "Keyboard focus ring on habit check", bytes: await page.screenshot() });

  await page.keyboard.press("Space");
  const toast = page.locator("#toast");
  await toast.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(1200); // hold 1.2 s with toast on screen
  capturedFrames.push({ title: "Toast with Undo", bytes: await page.screenshot() });

  const toastAction = page.locator("#toastAction");
  if (await toastAction.isVisible()) {
    await toastAction.click();
    await page.waitForTimeout(1500); // hold 1.5 s on habit back in Open
    capturedFrames.push({ title: "Restored after Undo", bytes: await page.screenshot() });
  }

  // Open real settings window in the same context for motion testing
  const settingsPage = await context.newPage();
  await settingsPage.goto(`${server.url}/index.html?settings=1&desktop=tauri-local`);
  await settingsPage.waitForLoadState("domcontentloaded");
  await settingsPage.waitForTimeout(500);
  const motionSelect = settingsPage.locator("#motionSelect");
  await motionSelect.scrollIntoViewIfNeeded();

  // Step 2: Motion = Full
  await setCaption(page, "Step 2: Motion = Full: Settings change → mid-transition proof → Toast Undo");
  await motionSelect.selectOption("full");
  await motionSelect.dispatchEvent("change");
  await settingsPage.waitForTimeout(300);
  capturedFrames.push({ title: "Settings → Motion: Full", bytes: await settingsPage.screenshot() });

  await page.waitForFunction(() => !document.documentElement.classList.contains("motion-off") && !document.documentElement.classList.contains("motion-reduced"));
  const habitCheckFull = page.locator(".today-habit-check").first();
  await habitCheckFull.click();
  await page.waitForTimeout(120); // capture ~120 ms mid-transition
  capturedFrames.push({ title: "Motion: Full (mid-transition)", bytes: await page.screenshot() });

  await toast.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(1200);
  if (await toastAction.isVisible()) {
    await toastAction.click();
    await page.waitForTimeout(1500);
  }

  // Step 3: Motion = Reduced
  await setCaption(page, "Step 3: Motion = Reduced: Settings change → opacity transition → Toast Undo");
  await motionSelect.selectOption("reduced");
  await motionSelect.dispatchEvent("change");
  await settingsPage.waitForTimeout(300);
  capturedFrames.push({ title: "Settings → Motion: Reduced", bytes: await settingsPage.screenshot() });

  await page.waitForFunction(() => document.documentElement.classList.contains("motion-reduced"));
  const habitCheckReduced = page.locator(".today-habit-check").first();
  await habitCheckReduced.click();
  await page.waitForTimeout(120); // capture ~120 ms transition
  capturedFrames.push({ title: "Motion: Reduced (mid-transition)", bytes: await page.screenshot() });

  await toast.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(1200);
  if (await toastAction.isVisible()) {
    await toastAction.click();
    await page.waitForTimeout(1500);
  }

  // Step 4: Motion = Off
  await setCaption(page, "Step 4: Motion = Off: Settings change → settled instant → Toast Undo");
  await motionSelect.selectOption("off");
  await motionSelect.dispatchEvent("change");
  await settingsPage.waitForTimeout(300);
  capturedFrames.push({ title: "Settings → Motion: Off", bytes: await settingsPage.screenshot() });

  await page.waitForFunction(() => document.documentElement.classList.contains("motion-off"));
  const habitCheckOff = page.locator(".today-habit-check").first();
  await habitCheckOff.click();
  await page.waitForTimeout(120); // capture ~120 ms settled
  capturedFrames.push({ title: "Motion: Off (settled instant)", bytes: await page.screenshot() });

  await toast.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(1200);
  if (await toastAction.isVisible()) {
    await toastAction.click();
    await page.waitForTimeout(1500);
  }

  // Reset motion to full for remaining steps
  await motionSelect.selectOption("full");
  await motionSelect.dispatchEvent("change");
  await page.waitForFunction(() => !document.documentElement.classList.contains("motion-off") && !document.documentElement.classList.contains("motion-reduced"));
  await settingsPage.waitForTimeout(300);

  // Capture settings video path before closing settings page
  const settingsVideoPath = await settingsPage.video()?.path();
  await settingsPage.close();

  // Step 5: Motion = Full; ⌘F search -> type query -> no-results illustration -> Escape
  await setCaption(page, "Step 5: ⌘F search → type query → no-results illustration → Escape");
  await page.keyboard.press("Meta+f");
  await page.waitForTimeout(600);
  const searchInput = page.locator("#quickFind");
  await searchInput.fill("zenith nonexistent");
  await page.waitForTimeout(1200);
  capturedFrames.push({ title: "Search: No Results Hairline", bytes: await page.screenshot() });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Step 6: "+" popover with keyboard navigation -> Escape
  await setCaption(page, "Step 6: '+' create popover with keyboard navigation → Escape");
  const createBtn = page.locator("#toolbarCreateButton");
  await createBtn.click();
  await page.waitForTimeout(600);
  capturedFrames.push({ title: "'+' Popover Open", bytes: await page.screenshot() });
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Step 7: Focus: start -> pause -> resume -> finish -> completion illustration (≥2.5s with panel open) -> Undo -> idle
  await setCaption(page, "Step 7: Focus: start → pause → resume → finish → completion illustration (≥2.5s) → Undo");
  const focusChip = page.locator("#toolbarPrimaryAction");
  await focusChip.click();
  await page.waitForTimeout(800);
  const focusPrimary = page.locator("#focusQuickPrimary");
  await focusPrimary.click(); // Start
  await page.waitForTimeout(1000);
  await focusPrimary.click(); // Pause
  await page.waitForTimeout(600);
  await focusPrimary.click(); // Resume
  await page.waitForTimeout(600);
  const focusFinish = page.locator("#focusQuickFinish");
  await focusFinish.click(); // Finish

  // Wait for #focusIdleHairline to have data-hairline-src ending in focus-complete.svg
  // and #focusTodaySummary to contain the minutes text
  await page.waitForFunction(() => {
    const hairline = document.querySelector("#focusIdleHairline");
    const summary = document.querySelector("#focusTodaySummary");
    const src = hairline?.getAttribute("data-hairline-src") || "";
    const summaryText = summary?.textContent || "";
    return src.endsWith("focus-complete.svg") && /minute|minuten|分钟/i.test(summaryText);
  }, { timeout: 5000 });

  // Keep the panel open; hold 2.5 s; key frame "Focus complete illustration"
  await page.waitForTimeout(2500);
  capturedFrames.push({ title: "Focus complete illustration", bytes: await page.screenshot() });

  // Then click toast Undo and hold 1 s on idle
  const focusToastUndo = page.locator("#toastAction");
  if (await focusToastUndo.isVisible()) {
    await focusToastUndo.click();
    await page.waitForTimeout(1000);
    capturedFrames.push({ title: "Focus restored to idle", bytes: await page.screenshot() });
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Step 8: Journal Timeline <-> Photos mode switch
  await setCaption(page, "Step 8: Journal Timeline ↔ Photos mode switch");
  const journalNav = page.locator(".sidebar .nav-item[data-view='timeline']");
  await journalNav.click();
  await page.waitForTimeout(1000);
  const photosTab = page.locator("[data-journal-mode='photos']");
  await photosTab.click();
  await page.waitForTimeout(1200);
  capturedFrames.push({ title: "Journal Photos Mode", bytes: await page.screenshot() });
  const timelineTab = page.locator("[data-journal-mode='timeline']");
  await timelineTab.click();
  await page.waitForTimeout(1000);

  // Step 9: Tab through toolbar controls showing visible focus rings
  await setCaption(page, "Step 9: Tab through toolbar controls showing visible focus rings");
  await page.locator(".sidebar .nav-item[data-view='today']").click();
  await page.waitForTimeout(600);
  const toolbarBtn = page.locator("#dateNavPrev");
  await toolbarBtn.focus();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
  }
  capturedFrames.push({ title: "Toolbar Tab Sequence Focus", bytes: await page.screenshot() });
  await page.waitForTimeout(1000);

  await setCaption(page, "Interaction sequence completed.");
  await page.waitForTimeout(1000);

  // Capture main video path before closing page
  const mainVideoPath = await page.video()?.path();

  // Close context to finish video encoding
  await page.close();
  await context.close();
  await browser.close();
  await server.close();

  // Copy videos directly to target outputs
  const targetMainVideo = path.join(outputDir, "interaction.webm");
  const targetSettingsVideo = path.join(outputDir, "interaction-settings.webm");
  if (mainVideoPath && fs.existsSync(mainVideoPath)) {
    fs.copyFileSync(mainVideoPath, targetMainVideo);
    const stat = fs.statSync(targetMainVideo);
    console.log(`Saved main video to ${targetMainVideo} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  if (settingsVideoPath && fs.existsSync(settingsVideoPath)) {
    fs.copyFileSync(settingsVideoPath, targetSettingsVideo);
    const stat = fs.statSync(targetSettingsVideo);
    console.log(`Saved settings video to ${targetSettingsVideo} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
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
