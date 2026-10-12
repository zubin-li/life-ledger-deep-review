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
const outputDir = path.join(rootDir, evidenceBase, "screens");
const summaryPath = path.join(rootDir, evidenceBase, "screens-summary.json");

fs.mkdirSync(outputDir, { recursive: true });

const WIDTHS = [980, 1180, 1440, 1600];
const LANGUAGES = ["en", "de", "zh"];
const THEMES = ["light", "dark"];
const PRIMARY_VIEWS = ["today", "week", "journal", "focus"];
const SECONDARY_VIEWS = ["insights", "habits"];

async function runScreenshots() {
  console.log("Starting static server for screenshot evidence...");
  const server = await startStaticServer(publicDir);
  console.log(`Server running at ${server.url}`);

  const browser = await chromium.launch({ headless: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    totalScreenshots: 0,
    pageErrors: [],
    horizontalScrolls: [],
  };

  for (const lang of LANGUAGES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();

        page.on("pageerror", (err) => {
          console.error(`Page error on ${lang}/${theme}/${width}:`, err);
          summary.pageErrors.push({ lang, theme, width, error: String(err) });
        });

        await applyFixture(page, { date: FIXTURE_DATE, theme, motion: "full", language: lang });
        await page.goto(`${server.url}/index.html?desktop=tauri-local`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(200);

        // Check horizontal scroll
        const hasHScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        if (hasHScroll) {
          summary.horizontalScrolls.push({ lang, theme, width });
        }

        // Today view
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
        });
        await page.waitForTimeout(100);
        const todayFile = path.join(outputDir, `today-${width}-${lang}-${theme}.png`);
        await page.screenshot({ path: todayFile });
        summary.totalScreenshots += 1;

        // Week view
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
        });
        await page.waitForTimeout(100);
        const weekFile = path.join(outputDir, `week-${width}-${lang}-${theme}.png`);
        await page.screenshot({ path: weekFile });
        summary.totalScreenshots += 1;

        // Journal day page
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='timeline']")?.click();
        });
        await page.waitForTimeout(100);
        const journalFile = path.join(outputDir, `journal-${width}-${lang}-${theme}.png`);
        await page.screenshot({ path: journalFile });
        summary.totalScreenshots += 1;

        // Focus panel views
        await page.evaluate(() => {
          const chip = document.querySelector("#toolbarPrimaryAction");
          if (chip && document.querySelector("#focusPanel")?.hidden) chip.click();
        });
        await page.waitForTimeout(100);

        // Focus Idle / Panel
        const focusFile = path.join(outputDir, `focus-${width}-${lang}-${theme}.png`);
        await page.screenshot({ path: focusFile });
        summary.totalScreenshots += 1;

        // For 1440 width, capture Insights and Habits
        if (width === 1440) {
          await page.keyboard.press("Escape"); // Close focus panel

          // Insights
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='review']")?.click();
          });
          await page.waitForTimeout(100);
          const insightsFile = path.join(outputDir, `insights-${width}-${lang}-${theme}.png`);
          await page.screenshot({ path: insightsFile });
          summary.totalScreenshots += 1;

          // Habits
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='habits']")?.click();
          });
          await page.waitForTimeout(100);
          const habitsFile = path.join(outputDir, `habits-${width}-${lang}-${theme}.png`);
          await page.screenshot({ path: habitsFile });
          summary.totalScreenshots += 1;

          // Today Edit Mode
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(120);
          const editFile = path.join(outputDir, `today-edit-${width}-${lang}-${theme}.png`);
          await page.screenshot({ path: editFile });
          try { fs.copyFileSync(editFile, path.join(rootDir, evidenceBase, path.basename(editFile))); } catch {}
          summary.totalScreenshots += 1;
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(80);

          // Week Edit Mode
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(120);
          const weekEditFile = path.join(outputDir, `week-edit-${width}-${lang}-${theme}.png`);
          await page.screenshot({ path: weekEditFile });
          try { fs.copyFileSync(weekEditFile, path.join(rootDir, evidenceBase, path.basename(weekEditFile))); } catch {}
          summary.totalScreenshots += 1;
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(80);
        }

        await context.close();
      }
    }
  }

  // Dedicated pass: Empty state screenshots with createEmptyFictionalState (light + dark, en, 1440)
  for (const emptyTheme of ["light", "dark"]) {
    const emptyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const emptyPage = await emptyContext.newPage();
    await applyFixture(emptyPage, { date: FIXTURE_DATE, theme: emptyTheme, motion: "full", language: "en", empty: true });
    await emptyPage.goto(`${server.url}/index.html?desktop=tauri-local`);
    await emptyPage.waitForLoadState("domcontentloaded");
    await emptyPage.waitForTimeout(200);

    // Today empty
    await emptyPage.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
    });
    await emptyPage.waitForTimeout(120);
    const todayEmptyFile = path.join(outputDir, `today-empty-1440-en-${emptyTheme}.png`);
    await emptyPage.screenshot({ path: todayEmptyFile });
    try { fs.copyFileSync(todayEmptyFile, path.join(rootDir, evidenceBase, path.basename(todayEmptyFile))); } catch {}
    summary.totalScreenshots += 1;

    // Week empty
    await emptyPage.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
    });
    await emptyPage.waitForTimeout(120);
    const weekEmptyFile = path.join(outputDir, `week-empty-1440-en-${emptyTheme}.png`);
    await emptyPage.screenshot({ path: weekEmptyFile });
    try { fs.copyFileSync(weekEmptyFile, path.join(rootDir, evidenceBase, path.basename(weekEmptyFile))); } catch {}
    summary.totalScreenshots += 1;

    await emptyContext.close();
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Screenshots complete (${summary.totalScreenshots} captured). Summary saved to ${summaryPath}`);

  await browser.close();
  await server.close();
}

runScreenshots().catch((err) => {
  console.error("Fatal error in screenshot runner:", err);
  process.exit(1);
});
